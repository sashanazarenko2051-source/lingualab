"""Checks the word lists with Gemini and fixes what it finds.

    python tools/gemini_check.py check LANG [LANG ...]   # ask Gemini, cache answers
    python tools/gemini_check.py apply LANG [LANG ...]   # write fixes into js/data
    python tools/gemini_check.py report LANG             # list the cached fixes

Every word line in js/data/LANG.js looks like
    { w: 'word', t: 'перевод', ex: 'Example.', tex: 'Пример.' },
"check" sends them in batches of BATCH words; Gemini answers only with the
entries that need a change. Answers are cached in tools/gemini_cache/LANG.json,
so an interrupted run continues where it stopped. "apply" rewrites only the
changed fields. Words with several common meanings get them comma-separated
in t ("мир, покой").

The API key is read from the GEMINI_API_KEY environment variable or from
tools/.gemini_key (both kept out of git). The model can be set with
GEMINI_MODEL.
"""
import json, os, re, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.join(ROOT, 'tools')
CACHE = os.path.join(HERE, 'gemini_cache')
BATCH = 80
MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash')

LANGS = {
    'en': 'English', 'cs': 'Czech', 'sk': 'Slovak', 'de': 'German', 'nl': 'Dutch', 'sv': 'Swedish',
    'no': 'Norwegian (Bokmål)', 'da': 'Danish', 'fr': 'French', 'es': 'Spanish', 'it': 'Italian',
    'pt': 'Portuguese', 'ro': 'Romanian', 'pl': 'Polish', 'hr': 'Croatian', 'sr': 'Serbian (Cyrillic)',
    'el': 'Greek', 'fi': 'Finnish', 'hu': 'Hungarian', 'uk': 'Ukrainian', 'bg': 'Bulgarian', 'ru': 'Russian',
}

STR = r"""('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")"""
LINE = re.compile(r'^(\s*)\{ w: ' + STR + r', t: ' + STR + r', ex: ' + STR + r', tex: ' + STR + r' \}(,?)(\s*)$')
CAT = re.compile(r"^\s*id: '([^']+)', name: ")
FIELDS = ('w', 't', 'ex', 'tex')


def unquote(s):
    body = s[1:-1]
    return re.sub(r'\\(.)', lambda m: {'n': '\n'}.get(m.group(1), m.group(1)), body)


def quote(s):
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"


def load(lang):
    path = os.path.join(ROOT, 'js', 'data', lang + '.js')
    lines = open(path, encoding='utf8').read().split('\n')
    words, cat = [], None
    for i, ln in enumerate(lines):
        m = CAT.match(ln)
        if m:
            cat = m.group(1)
            continue
        m = LINE.match(ln)
        if m:
            vals = [unquote(m.group(k)) for k in range(2, 6)]
            words.append({'line': i, 'cat': cat, **dict(zip(FIELDS, vals))})
    return path, lines, words


def api_key():
    k = os.environ.get('GEMINI_API_KEY')
    if not k and os.path.exists(os.path.join(HERE, '.gemini_key')):
        k = open(os.path.join(HERE, '.gemini_key'), encoding='utf8').read().strip()
    if not k:
        sys.exit('No API key: set GEMINI_API_KEY or put it into tools/.gemini_key')
    return k


PROMPT = """You are a careful lexicographer checking a {lang} vocabulary list for Russian-speaking learners.
Each entry: w = {lang} word or phrase (dictionary form; "a/b" lists variants), t = Russian translation,
ex = short {lang} example sentence using w, tex = Russian translation of ex. Topic: {cat}.

Check every entry and fix real problems only:
- w misspelled, wrong diacritics, wrong gender/article form, or not natural {lang};
- t wrong or inaccurate; if w has several COMMON meanings, give up to 3 of them in t,
  comma-separated, most common first (e.g. "мир, покой"); keep t short, lowercase unless a proper name
  or a greeting/phrase that starts a sentence in the original;
- ex ungrammatical, unnatural, or not using w (an inflected form is fine);
- tex not matching ex.
Never replace w with a different concept: the list is aligned with other languages by meaning.
Do not touch entries that are already correct. Do not change punctuation or capitalization style only.

Return a JSON array (possibly empty) of corrected entries only:
[{{"i": <index>, "w": "...", "t": "...", "ex": "...", "tex": "...", "why": "<short reason in Russian>"}}]
Include only the fields that change (plus "i" and "why").

Entries:
{items}"""


def ask(key, lang, cat, chunk):
    items = json.dumps([{'i': i, 'w': w['w'], 't': w['t'], 'ex': w['ex'], 'tex': w['tex']} for i, w in chunk],
                       ensure_ascii=False)
    body = {
        'contents': [{'role': 'user', 'parts': [{'text': PROMPT.format(lang=LANGS[lang], cat=cat, items=items)}]}],
        'generationConfig': {'temperature': 0, 'responseMimeType': 'application/json'},
    }
    url = 'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent' % MODEL
    req = urllib.request.Request(url, json.dumps(body).encode('utf8'),
                                 {'Content-Type': 'application/json', 'x-goog-api-key': key})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                data = json.loads(r.read().decode('utf8'))
            text = data['candidates'][0]['content']['parts'][0]['text']
            out = json.loads(text)
            if not isinstance(out, list):
                raise ValueError('not a list')
            return out
        except urllib.error.HTTPError as e:
            msg = e.read().decode('utf8', 'replace')[:300]
            if e.code in (400, 401, 403, 404):
                sys.exit('Gemini error %s: %s' % (e.code, msg))
            wait = 20 * (attempt + 1)
            print('  HTTP %s, retry in %ss' % (e.code, wait), flush=True)
            time.sleep(wait)
        except Exception as e:
            wait = 10 * (attempt + 1)
            print('  %s, retry in %ss' % (e, wait), flush=True)
            time.sleep(wait)
    sys.exit('Gemini kept failing; run again to continue')


def cache_path(lang):
    os.makedirs(CACHE, exist_ok=True)
    return os.path.join(CACHE, lang + '.json')


def check(lang):
    key = api_key()
    _, _, words = load(lang)
    cp = cache_path(lang)
    cache = json.load(open(cp, encoding='utf8')) if os.path.exists(cp) else {'done': [], 'fixes': {}}
    # batches never cross a topic, so the topic name can go into the prompt
    batches, cur = [], []
    for i, w in enumerate(words):
        if cur and (len(cur) == BATCH or words[cur[-1][0]]['cat'] != w['cat']):
            batches.append(cur)
            cur = []
        cur.append((i, w))
    if cur:
        batches.append(cur)
    for n, chunk in enumerate(batches):
        tag = '%d-%d' % (chunk[0][0], chunk[-1][0])
        if tag in cache['done']:
            continue
        out = ask(key, lang, chunk[0][1]['cat'], chunk)
        valid = {i for i, _ in chunk}
        for fix in out:
            i = fix.get('i')
            if i not in valid:
                continue
            ch = {f: str(fix[f]).strip() for f in FIELDS if f in fix and str(fix[f]).strip() and str(fix[f]).strip() != words[i][f]}
            if ch:
                ch['why'] = str(fix.get('why', ''))
                ch['was'] = {f: words[i][f] for f in FIELDS if f in ch}
                cache['fixes'][str(i)] = ch
        cache['done'].append(tag)
        json.dump(cache, open(cp, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
        print('%s %d/%d  fixes so far: %d' % (lang, n + 1, len(batches), len(cache['fixes'])), flush=True)


def apply(lang):
    path, lines, words = load(lang)
    cp = cache_path(lang)
    if not os.path.exists(cp):
        sys.exit('nothing cached for ' + lang)
    cache = json.load(open(cp, encoding='utf8'))
    n = 0
    for i, ch in cache['fixes'].items():
        w = words[int(i)]
        if any(w[f] != ch['was'][f] for f in ch['was']):
            continue  # the line changed since the check; leave it
        m = LINE.match(lines[w['line']])
        vals = {f: ch.get(f, w[f]) for f in FIELDS}
        lines[w['line']] = '%s{ w: %s, t: %s, ex: %s, tex: %s }%s%s' % (
            m.group(1), quote(vals['w']), quote(vals['t']), quote(vals['ex']), quote(vals['tex']), m.group(6), m.group(7))
        n += 1
    open(path, 'w', encoding='utf8', newline='').write('\n'.join(lines))
    print('%s: %d entries updated' % (lang, n))


def report(lang):
    cache = json.load(open(cache_path(lang), encoding='utf8'))
    for i, ch in sorted(cache['fixes'].items(), key=lambda x: int(x[0])):
        print(i, ' | '.join('%s: %s -> %s' % (f, ch['was'][f], ch[f]) for f in FIELDS if f in ch), '|', ch.get('why', ''))


if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] not in ('check', 'apply', 'report'):
        sys.exit(__doc__)
    langs = list(LANGS) if sys.argv[2] == 'all' else sys.argv[2:]
    for lg in langs:
        {'check': check, 'apply': apply, 'report': report}[sys.argv[1]](lg)
