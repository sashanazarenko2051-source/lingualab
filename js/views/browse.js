window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope.
(function () {

// Dictionary / reading mode: pick a topic and page through its words one by
// one (picture, word with audio, translation, example). Nothing is graded,
// so reading here never changes your progress.
let topicId = null;
let index = 0;
let keyHandler = null;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function setKeys(fn) {
  if (keyHandler) document.removeEventListener('keydown', keyHandler);
  keyHandler = fn;
  if (fn) document.addEventListener('keydown', fn);
}

App.views.browse = {
  render(root) {
    setKeys(null);
    const code = App.storage.getCurrentLang();
    if (topicId && !App.data[code].categories.some(c => c.id === topicId)) topicId = null;
    if (topicId) renderReader(root, code); else renderTopics(root, code);
  }
};

function renderTopics(root, code) {
  const cats = App.data[code].categories;
  root.innerHTML = `
    <div class="words-head">
      <h2>📖 ${App.t('browse_title')}: ${App.ui.flagChip(code)} ${App.ui.langName(code)}</h2>
    </div>
    <p class="words-note browse-note">${App.t('browse_note')}</p>
    <div class="browse-topics">
      ${cats.map(c => {
        const words = App.words.byCategory(code, c.id);
        const fresh = words.filter(w => App.srs.isNew(w.id)).length;
        return `<button class="browse-topic" data-topic="${c.id}" style="--accent: var(--slot-${App.data[code].slot})">
          <span class="browse-topic-icon">${App.CATEGORY_ICONS[c.id] || '📘'}</span>
          <span class="browse-topic-name">${App.ui.categoryName(c.id, c.name)}</span>
          <span class="browse-topic-meta">${App.t('browse_topic_meta', { n: words.length, fresh })}</span>
        </button>`;
      }).join('')}
    </div>
  `;
  root.querySelectorAll('[data-topic]').forEach(b => b.addEventListener('click', () => {
    topicId = b.dataset.topic;
    index = 0;
    renderReader(root, code);
  }));
}

function renderReader(root, code) {
  const cat = App.data[code].categories.find(c => c.id === topicId);
  const words = App.words.byCategory(code, topicId);
  index = Math.max(0, Math.min(index, words.length - 1));
  const w = words[index];
  const m = App.words.localizedMeaning(w);
  const accent = `var(--slot-${App.data[code].slot})`;

  root.innerHTML = `
    <div class="browse-reader" style="--accent:${accent}">
      <div class="ex-topbar">
        <button class="ex-close" id="br-back" title="${App.t('back_btn_title')}">←</button>
        <div class="ex-progress"><div class="ex-progress-fill" style="width:${Math.round(((index + 1) / words.length) * 100)}%; background:${accent}"></div></div>
        <span class="browse-pos">${index + 1} / ${words.length}</span>
      </div>
      <div class="browse-topic-title">${App.CATEGORY_ICONS[cat.id] || '📘'} ${App.ui.categoryName(cat.id, cat.name)}</div>
      <div class="ex-card ex-intro browse-card">
        <div class="ex-intro-halo"><div class="ex-intro-icon">${App.ui.wordIcon(w.icon)}</div></div>
        <div class="ex-intro-word">${esc(w.w)} <button class="ex-speak" data-say="${esc(w.w)}">🔊</button></div>
        <div class="ex-intro-meaning">${esc(m.w)}</div>
        ${w.ex ? `<div class="ex-intro-ex">${esc(w.ex)} <button class="ex-speak" data-say="${esc(w.ex)}">🔊</button></div>` : ''}
        ${m.ex ? `<div class="ex-intro-ex ex-intro-ex-tr">${esc(m.ex)}</div>` : ''}
        ${App.srs.isNew(w.id) ? '' : `<div class="browse-known">✅ ${App.t('browse_known')}</div>`}
      </div>
      <div class="browse-nav">
        <button class="action-card" id="br-prev" ${index === 0 ? 'disabled' : ''} style="display:inline-flex">← ${App.t('browse_prev')}</button>
        <button class="action-card" id="br-learn" style="display:inline-flex">🎓 ${App.t('browse_learn')}</button>
        <button class="quiz-next" id="br-next">${index === words.length - 1 ? App.t('browse_topics') : App.t('browse_next')} →</button>
      </div>
    </div>
  `;
  App.speak(w.w, code);
  root.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => App.speak(b.dataset.say, code)));
  const prev = () => { if (index > 0) { index -= 1; renderReader(root, code); } };
  const next = () => {
    if (index < words.length - 1) { index += 1; renderReader(root, code); }
    else { topicId = null; renderTopics(root, code); setKeys(null); }
  };
  root.querySelector('#br-prev').addEventListener('click', prev);
  root.querySelector('#br-next').addEventListener('click', next);
  root.querySelector('#br-back').addEventListener('click', () => { topicId = null; setKeys(null); renderTopics(root, code); });
  root.querySelector('#br-learn').addEventListener('click', () => {
    setKeys(null);
    App.session.flashcardsCategory = topicId;
    App.router.go('flashcards');
  });
  setKeys(e => {
    if (App.router.current !== 'browse') { setKeys(null); return; }
    if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });
}

})();
