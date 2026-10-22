"""Checks the interface strings (js/i18n.js) with Gemini.

    python tools/gemini_ui.py check LANG [LANG ...] | all
    python tools/gemini_ui.py report LANG
    python tools/gemini_ui.py apply LANG

Every string of a language goes to Gemini next to the Russian original and
the English version; it answers with the strings that are wrong, unnatural
or not translated. Suggestions that break a {{placeholder}} or an HTML tag
are dropped automatically. Answers are cached in tools/gemini_cache_ui/.
Uses the key and the models of gemini_check.py.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gemini_check as g

ROOT = g.ROOT
I18N = os.path.join(ROOT, 'js', 'i18n.js')
CACHE = os.path.join(g.HERE, os.environ.get('UI_CACHE', 'gemini_cache_ui'))
CHUNK = 190
NAMES = dict(g.LANGS, ru='Russian')
STR = r"""('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")"""
LINE = re.compile(r'^(\s+)([A-Za-z0-9_]+)(\s*:\s*)' + STR + r'(\s*,?\s*)$')


def load():
    lines = open(I18N, encoding='utf8').read().split('\n')
    blocks, where, cur = {}, {}, None
    for n, ln in enumerate(lines):
        m = re.match(r'^  ([a-z]{2}): \{', ln)
        if m:
            cur = m.group(1); blocks[cur] = {}; continue
        m = LINE.match(ln) if cur else None
        if m:
            blocks[cur][m.group(2)] = g.unquote(m.group(4))
            where[(cur, m.group(2))] = n
    return lines, blocks, where


ph = lambda v: sorted(re.findall(r'\{\{\w+\}\}', v))
tags = lambda v: sorted(re.findall(r'</?[a-z]+', v))

PROMPT = """You are a native {lang} UI translator reviewing the interface strings of a language-learning app
("WO Lingua Lab": courses of words, hearts, energy, coins, streaks, a wolf mascot, a shop).
For each key you get the Russian original (ru), the English version (en) and the current {lang} text (v).

Report only strings where v is wrong, not translated, grammatically broken, unnatural for {lang} UI,
or does not mean the same as ru. Keep {{placeholders}} and HTML tags exactly, keep emoji, keep it about
as short as ru. Do not rephrase strings that are already fine. Brand names stay as they are.

Return a JSON array (possibly empty): [{{"k": "<key>", "v": "<corrected {lang} text>", "why": "<short reason in Russian>"}}]

Strings:
{items}"""


def cache_path(lang):
    os.makedirs(CACHE, exist_ok=True)
    return os.path.join(CACHE, lang + '.json')


def check(lang):
    key = g.api_key()
    _, b, _ = load()
    ru, en, cur = b['ru'], b['en'], b[lang]
    keys = [k for k in ru if k in cur]
    cp = cache_path(lang)
    cache = json.load(open(cp, encoding='utf8')) if os.path.exists(cp) else {'done': [], 'fixes': {}}
    for n in range(0, len(keys), CHUNK):
        tag = str(n)
        if tag in cache['done']:
            continue
        part = keys[n:n + CHUNK]
        items = json.dumps({k: {'ru': ru[k], 'en': en[k], 'v': cur[k]} for k in part}, ensure_ascii=False)
        out = g.gen(key, PROMPT.format(lang=NAMES[lang], items=items), list)
        for fx in out:
            k, v = fx.get('k'), str(fx.get('v', '')).strip()
            if k not in part or not v or v == cur[k]:
                continue
            if ph(v) != ph(cur[k]) or tags(v) != tags(cur[k]):
                continue  # broke a placeholder or a tag
            cache['fixes'][k] = {'v': v, 'was': cur[k], 'why': str(fx.get('why', ''))}
        cache['done'].append(tag)
        json.dump(cache, open(cp, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
        print('%s %d/%d  fixes %d' % (lang, n // CHUNK + 1, (len(keys) + CHUNK - 1) // CHUNK, len(cache['fixes'])), flush=True)


def report(lang):
    c = json.load(open(cache_path(lang), encoding='utf8'))
    for k, f in c['fixes'].items():
        print('%s%s: %s -> %s | %s' % ('[skip] ' if f.get('skip') else '', k, f['was'], f['v'], f['why']))


def apply(lang):
    lines, b, where = load()
    c = json.load(open(cache_path(lang), encoding='utf8'))
    n = 0
    for k, f in c['fixes'].items():
        if f.get('skip') or b[lang].get(k) != f['was']:
            continue
        i = where[(lang, k)]
        m = LINE.match(lines[i])
        lines[i] = m.group(1) + k + m.group(3) + g.quote(f['v']) + m.group(5)
        n += 1
    open(I18N, 'w', encoding='utf8', newline='').write('\n'.join(lines))
    print('%s: %d strings updated' % (lang, n))


if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] not in ('check', 'report', 'apply'):
        sys.exit(__doc__)
    _, b, _ = load()
    langs = [x for x in b if x != 'ru'] if sys.argv[2] == 'all' else sys.argv[2:]
    for lg in langs:
        {'check': check, 'report': report, 'apply': apply}[sys.argv[1]](lg)
