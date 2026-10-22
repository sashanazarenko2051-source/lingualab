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
GEMINI_MODEL (a comma-separated list), and GEMINI_LIMIT=N stops after N batches (a trial run).
"""
import json, os, re, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.join(ROOT, 'tools')
# GEMINI_PASS=2 is a second, closer look with its own cache and smaller batches.
PASS = os.environ.get('GEMINI_PASS', '1')
CACHE = os.path.join(HERE, 'gemini_cache' if PASS == '1' else 'gemini_cache' + PASS)
BATCH = int(os.environ.get('GEMINI_BATCH', '220'))  # the free tier counts requests, not words
# Tried in this order; an overloaded one passes the batch to the next.
MODELS = os.environ.get('GEMINI_MODEL', 'gemini-3.5-flash,gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,'
                        'gemini-3-flash-preview,gemini-flash-latest,gemini-3.5-flash-lite,gemini-flash-lite-latest,'
                        'gemini-3.1-flash-lite,gemma-4-31b-it').split(',')
RESET = 3 * 3600  # how long a model with a used-up daily quota is skipped
exhausted = {}
# Stop after this many new batches (0 = no limit), for a trial run.
LIMIT = int(os.environ.get('GEMINI_LIMIT', '0'))

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
Keep: explanations in brackets in w and t (they tell similar words apart); whether w has an article or not
(do not add or remove articles); the regional standard already used (e.g. European Portuguese, Croatian
vs Serbian, Bokmål); verb aspect and the gender of people in examples. t must stay in Russian.
Read every entry carefully: spelling, accents, grammar of the example, and whether t really matches w.

Return a JSON array (possibly empty) of corrected entries only:
[{{"i": <index>, "w": "...", "t": "...", "ex": "...", "tex": "...", "why": "<short reason in Russian>"}}]
Include only the fields that change (plus "i" and "why").

Entries:
{items}"""


class Split(Exception):
    pass


def ask(key, lang, cat, chunk):
    items = json.dumps([{'i': i, 'w': w['w'], 't': w['t'], 'ex': w['ex'], 'tex': w['tex']} for i, w in chunk],
                       ensure_ascii=False)
    # the Russian course is translated into Ukrainian, every other one into Russian
    text = (PROMPT.replace('Russian', 'Ukrainian') if lang == 'ru' else PROMPT).format(lang=LANGS[lang], cat=cat, items=items)
    return gen(key, text, list, len(chunk) > 20)


def file_key(name):
    p = os.path.join(HERE, name)
    return open(p, encoding='utf8').read().strip() if os.path.exists(p) else None


# Other free services with an OpenAI-style API: prefix -> (url, key file).
OPENAI_STYLE = {
    'groq:': ('https://api.groq.com/openai/v1/chat/completions', '.groq_key'),
    'or:': ('https://openrouter.ai/api/v1/chat/completions', '.openrouter_key'),
    'mi:': ('https://api.mistral.ai/v1/chat/completions', '.mistral_key'),
}


def provider_request(model, key, text, data):
    """A request to Gemini, or to Groq / OpenRouter for models named 'groq:…' / 'or:…'."""
    for prefix, (url, keyfile) in OPENAI_STYLE.items():
        if model.startswith(prefix):
            body = {'model': model[len(prefix):], 'temperature': 0, 'response_format': {'type': 'json_object'},
                    'messages': [{'role': 'user', 'content': text + '\n\nAnswer with a JSON object {"items": [...]} holding that array.'}]}
            return urllib.request.Request(url, json.dumps(body).encode('utf8'),
                                          {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + file_key(keyfile),
                                           'User-Agent': 'lingualab-check', 'X-Title': 'WO Lingua Lab word check'})
    url = 'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent' % model
    return urllib.request.Request(url, data, {'Content-Type': 'application/json', 'x-goog-api-key': key})


def gen(key, text, kind=list, can_split=False):
    """Sends one prompt and returns the parsed JSON answer (a list or a dict)."""
    bad = [0]
    body = {
        'contents': [{'role': 'user', 'parts': [{'text': text}]}],
        'generationConfig': {'temperature': 0, 'responseMimeType': 'application/json'},
    }
    data = json.dumps(body).encode('utf8')
    # An overloaded model hands the batch to the next one. A model whose
    # daily quota is used up (429) is left out until RESET seconds pass;
    # when every model is out, the run waits for the quota to come back.
    while True:
        now = time.time()
        live = [m for m in MODELS if exhausted.get(m, 0) <= now]
        if not live:
            wake = min(exhausted.values())
            print('  daily quota used up on every model, waiting %d min' % ((wake - now) // 60 + 1), flush=True)
            time.sleep(max(60, wake - now))
            continue
        busy = 0
        if bad[0] >= 2 and can_split:
            raise Split()
        for model in live:
            req = provider_request(model, key, text, data)
            try:
                with urllib.request.urlopen(req, timeout=300) as r:
                    resp = json.loads(r.read().decode('utf8'))
                if model.startswith(tuple(OPENAI_STYLE)):
                    out = json.loads(resp['choices'][0]['message']['content'])
                    if isinstance(out, dict) and kind is list:
                        out = next((v for v in out.values() if isinstance(v, list)), [])
                else:
                    parts = [x.get('text', '') for x in resp['candidates'][0]['content']['parts'] if not x.get('thought')]
                    out = json.loads(parts[-1])
                if not isinstance(out, kind):
                    raise ValueError('not a %s' % kind.__name__)
                print('  answered by %s' % model, flush=True)
                return out
            except urllib.error.HTTPError as e:
                msg = e.read().decode('utf8', 'replace')
                if e.code in (400, 401, 403):
                    sys.exit('Gemini error %s: %s' % (e.code, msg[:300]))
                if e.code == 404 or (e.code == 429 and ('PerDay' in msg or 'limit: 0' in msg or 'per day' in msg)):
                    exhausted[model] = time.time() + (365 * 86400 if e.code == 404 or 'limit: 0' in msg else RESET)
                    print('  %s: out for today' % model, flush=True)
                else:
                    busy += 1
                    print('  %s: HTTP %s' % (model, e.code), flush=True)
            except (ValueError, KeyError, IndexError) as e:
                bad[0] += 1  # a broken answer: after two the batch is halved
                busy += 1
                print('  %s: bad answer (%s)' % (model, str(e)[:60]), flush=True)
            except Exception as e:
                busy += 1
                print('  %s: %s' % (model, e), flush=True)
        if busy:
            print('  models busy, retry in 60s', flush=True)
            time.sleep(60)
        if bad[0] >= 6:
            raise ValueError('the answers keep breaking')


def ask_split(key, lang, chunk):
    try:
        return ask(key, lang, chunk[0][1]['cat'], chunk)
    except Split:
        half = len(chunk) // 2
        print('  answers keep breaking, checking %d + %d words' % (half, len(chunk) - half), flush=True)
        return ask_split(key, lang, chunk[:half]) + ask_split(key, lang, chunk[half:])


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
    # word indexes already checked (also by runs with another batch size)
    covered = set()
    for t in cache['done']:
        a, b = map(int, t.split('-'))
        covered.update(range(a, b + 1))
    sent = 0
    for n, chunk in enumerate(batches):
        tag = '%d-%d' % (chunk[0][0], chunk[-1][0])
        if all(i in covered for i, _ in chunk):
            continue
        chunk = [(i, w) for i, w in chunk if i not in covered]
        tag = '%d-%d' % (chunk[0][0], chunk[-1][0])
        if LIMIT and sent >= LIMIT:
            break
        sent += 1
        out = ask_split(key, lang, chunk)
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


def similar(a, b):
    """True when b is a spelling fix of a (accents, a letter or two), not another word."""
    import difflib, unicodedata
    fold = lambda s: ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if not unicodedata.combining(c))
    if fold(a) == fold(b):
        return True
    return difflib.SequenceMatcher(None, fold(a), fold(b)).ratio() >= 0.75


def apply(lang):
    path, lines, words = load(lang)
    cp = cache_path(lang)
    if not os.path.exists(cp):
        sys.exit('nothing cached for ' + lang)
    cache = json.load(open(cp, encoding='utf8'))
    n, held = 0, []
    for i, ch in cache['fixes'].items():
        w = words[int(i)]
        if any(w[f] != ch['was'][f] for f in ch['was']):
            continue  # the line changed since the check; leave it
        if ch.get('skip'):
            continue
        # A different word (not a spelling fix) would break the alignment
        # with the other languages and the icon: held back for review.
        if 'w' in ch and not ch.get('ok') and not similar(w['w'], ch['w']):
            held.append('%s %s: %s -> %s (%s)' % (lang, i, w['w'], ch['w'], ch.get('why', '')))
            continue
        m = LINE.match(lines[w['line']])
        vals = {f: ch.get(f, w[f]) for f in FIELDS}
        lines[w['line']] = '%s{ w: %s, t: %s, ex: %s, tex: %s }%s%s' % (
            m.group(1), quote(vals['w']), quote(vals['t']), quote(vals['ex']), quote(vals['tex']), m.group(6), m.group(7))
        n += 1
    open(path, 'w', encoding='utf8', newline='').write('\n'.join(lines))
    print('%s: %d entries updated, %d held for review' % (lang, n, len(held)))
    if held:
        with open(os.path.join(CACHE, 'held.txt'), 'a', encoding='utf8') as f:
            f.write('\n'.join(held) + '\n')


def report(lang):
    cache = json.load(open(cache_path(lang), encoding='utf8'))
    for i, ch in sorted(cache['fixes'].items(), key=lambda x: int(x[0])):
        print(i, ' | '.join('%s: %s -> %s' % (f, ch['was'][f], ch[f]) for f in FIELDS if f in ch), '|', ch.get('why', ''))


def batch_count(words):
    n, prev, size = 0, None, 0
    for w in words:
        if size == 0 or size == BATCH or w['cat'] != prev:
            n, size = n + 1, 0
        size, prev = size + 1, w['cat']
    return n


def status():
    total_done = total_all = total_fix = 0
    rows = []
    for lg in LANGS:
        _, _, words = load(lg)
        allb = batch_count(words)
        cp = os.path.join(CACHE, lg + '.json')
        c = json.load(open(cp, encoding='utf8')) if os.path.exists(cp) else {'done': [], 'fixes': {}}
        covered = set()
        for t in c['done']:
            x, y = map(int, t.split('-'))
            covered.update(range(x, y + 1))
        done, allw, fixes = len(covered), len(words), len(c['fixes'])
        total_done += done; total_all += allw; total_fix += fixes
        rows.append('%s %5d/%d words %3d%%  fixes %d' % (lg, done, allw, 100 * done // allw, fixes))
    print('\n'.join(rows))
    print('TOTAL %d/%d words (%.1f%%), fixes %d' % (total_done, total_all, 100.0 * total_done / total_all, total_fix))


if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == 'status':
        status()
        sys.exit()
    if len(sys.argv) < 3 or sys.argv[1] not in ('check', 'apply', 'report'):
        sys.exit(__doc__)
    langs = list(LANGS) if sys.argv[2] == 'all' else sys.argv[2:]
    for lg in langs:
        {'check': check, 'apply': apply, 'report': report}[sys.argv[1]](lg)
