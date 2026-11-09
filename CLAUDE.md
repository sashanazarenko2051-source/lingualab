# LinguaLab

Desktop language-learning app. `main.py` (pywebview + a local HTTP server on 0.0.0.0:8765) shows `index.html`. All app logic is plain JS in `js/`; there is no build step and no Node.

## Two copies
- This folder (OneDrive\Документи\lingualab) is for development: edit, commit, push here.
- `C:\Users\sasha\Documents\LinguaLab` is the copy the user runs (Desktop «Lingua Lab.lnk» → `pythonw main.py`). After each push, run `git pull` there.

## Huge files: never Read them whole
Use Grep, or Read with offset/limit.
- `js/data/<lang>.js`: 1.3–1.7 MB each, 22 languages, about 7480 words per language.
- `js/i18n.js` (670 KB): interface texts for all languages.
- `js/views/help.js` (245 KB): the how-it-works guide in all languages.
- `js/icons.js`, `js/categorynames.js`, `css/style.css` (140 KB).

## Layout
- `js/app.js`: router and startup.
- `js/views/*.js`: one file per screen.
- The other `js/*.js` files are features (storage, srs, hearts, energy, shop, quests, notify, theme…).
- `tools/`: Python helper scripts that check the words with Gemini and other models.
  - The `tools/.*_key` files hold API keys and are gitignored. Never print or commit them.

## Commands
- Run: `python main.py`.
- Build the exe: `build-exe.ps1` → `dist\WO-Lingua-Lab.exe`. Only when asked; dist is gitignored.
- Check JS syntax without Node: test in Edge headless, and close Edge afterwards.

## Notes
- Firebase is not configured (`js/firebase-config.js` is a stub).
- Word data edits: keep each language file's format; check duplicate examples and translations.
