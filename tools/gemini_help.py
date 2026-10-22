"""Translates the "How it works" guide (js/views/help.js) into the other
interface languages with Gemini, from the English text.

    python tools/gemini_help.py translate LANG [LANG ...] | all
    python tools/gemini_help.py apply

Translations are cached in tools/gemini_cache_help/LANG.json and checked
before use: the same sections in the same order, the same HTML tags.
"apply" writes every cached language into help.js.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gemini_check as g

HELP_JS = os.path.join(g.ROOT, 'js', 'views', 'help.js')
CACHE = os.path.join(g.HERE, 'gemini_cache_help')
NAMES = dict(g.LANGS)
HAVE = ('ru', 'uk', 'en')


def english():
    s = open(HELP_JS, encoding='utf8').read()
    block = s[s.index('  en: {', s.index('const HELP')):s.index('\n};', s.index('const HELP'))]
    title = re.search(r"title: '((?:[^'\\]|\\.)*)'", block).group(1)
    intro = re.search(r"intro: '((?:[^'\\]|\\.)*)'", block).group(1)
    sections = [list(m) for m in re.findall(r"\['(\w+)', '([^']*)', '((?:[^'\\]|\\.)*)', `([^`]*)`\]", block)]
    lh = s[s.index('const LANG_HISTORY = ') + len('const LANG_HISTORY = '):s.index('\n};', s.index('const LANG_HISTORY')) + 2]
    history = json.loads(lh.rstrip(';'))['en']
    return {'title': title.replace("\\'", "'"), 'intro': intro.replace("\\'", "'"),
            'sections': sections}, history


PROMPT = """Translate this user guide of a language-learning app ("WO Lingua Lab") from English into {lang}.
Natural, friendly {lang} for app users. Keep every HTML tag, emoji, number and the level names (A0, A1, A2, B1, B2)
exactly; translate only the text. Keep the section ids and icons unchanged.

Return JSON: {{"guide": {{"title": "...", "intro": "...", "sections": [[id, icon, title, html], ...]}},
"history": {{"title": "...", "intro": "...", "<lang code>": "...", ...}}}}

guide = {guide}

history = {history}"""


def tags(v):
    return sorted(re.findall(r'</?[a-z]+', v))


def valid(src, out):
    gd, hs = out.get('guide'), out.get('history')
    if not isinstance(gd, dict) or not isinstance(hs, dict):
        return 'shape'
    if len(gd.get('sections', [])) != len(src[0]['sections']):
        return 'sections'
    for a, b in zip(src[0]['sections'], gd['sections']):
        if len(b) != 4 or b[0] != a[0] or b[1] != a[1] or tags(b[3]) != tags(a[3]):
            return 'section ' + a[0]
    if set(hs) != set(src[1]):
        return 'history keys'
    return None


def translate(lang):
    os.makedirs(CACHE, exist_ok=True)
    cp = os.path.join(CACHE, lang + '.json')
    if os.path.exists(cp):
        return
    src = english()
    text = PROMPT.format(lang=NAMES[lang], guide=json.dumps(src[0], ensure_ascii=False),
                         history=json.dumps(src[1], ensure_ascii=False))
    for attempt in range(3):
        out = g.gen(g.api_key(), text, dict)
        err = valid(src, out)
        if not err:
            json.dump(out, open(cp, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
            print(lang, 'ok', flush=True)
            return
        print(lang, 'rejected:', err, flush=True)
    print(lang, 'gave up', flush=True)


def apply():
    s = open(HELP_JS, encoding='utf8').read()
    done = sorted(f[:-5] for f in os.listdir(CACHE) if f.endswith('.json'))
    help_end = s.index('\n};', s.index('const HELP'))
    lh_start = s.index('const LANG_HISTORY = ') + len('const LANG_HISTORY = ')
    lh_end = s.index('\n};', lh_start) + 2
    history = json.loads(s[lh_start:lh_end].rstrip(';'))
    add = ''
    for lg in done:
        if re.search(r'\n  %s: \{' % lg, s[:help_end]):
            continue
        out = json.load(open(os.path.join(CACHE, lg + '.json'), encoding='utf8'))
        add += ',\n  %s: %s' % (lg, json.dumps(out['guide'], ensure_ascii=False, indent=2).replace('\n', '\n  '))
        history[lg] = out['history']
    new_lh = json.dumps(history, ensure_ascii=False, indent=1) + ';'
    s = s[:help_end] + add + s[help_end:lh_start] + new_lh + s[lh_end:]
    s = s.replace("// words to learn a day, hearts, streaks and the badges. Written for ru, uk\n// and en; other interface languages get the English text.",
                  "// words to learn a day, hearts, streaks and the badges. Written for ru, uk\n// and en; the other interface languages were translated from English\n// (tools/gemini_help.py).")
    open(HELP_JS, 'w', encoding='utf8', newline='').write(s)
    print('help.js: added', len(done), 'languages')


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in ('translate', 'apply'):
        sys.exit(__doc__)
    if sys.argv[1] == 'apply':
        apply()
    else:
        langs = [x for x in g.LANGS if x not in HAVE] if sys.argv[2] == 'all' else sys.argv[2:]
        for lg in langs:
            translate(lg)
