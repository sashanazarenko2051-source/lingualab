window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope.
(function () {

// Dictionary: every word of a language with its translation. Pick the
// language (flag row) and the topic (dropdown); searching looks through the
// whole language. Click a word to hear it. Nothing is graded, so reading
// here never changes your progress.
let lang = null;
let topic = null;
let query = '';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (id) => App.CATEGORY_ICONS[id] || '📘';

App.views.browse = {
  render(root) {
    if (!lang || !App.data[lang]) lang = App.storage.getCurrentLang();
    const cats = App.data[lang].categories;
    if (!cats.some(c => c.id === topic)) topic = cats[0].id;
    // languages you've started first, then the rest in the usual order
    const started = (c) => App.words.allWords(c).some(w => !App.srs.isNew(w.id));
    const order = App.LANG_ORDER.slice().sort((a, b) => started(b) - started(a));

    root.innerHTML = `
      <div class="words-head">
        <h2>📖 ${App.t('browse_title')}</h2>
      </div>
      <div class="browse-langs">
        ${order.map(c => `<button class="words-tab ${c === lang ? 'active' : ''}" data-lang="${c}" style="--accent: var(--slot-${App.data[c].slot})">${App.ui.flagChip(c)} ${App.ui.langName(c)}</button>`).join('')}
      </div>
      <div class="browse-toolbar">
        <button class="browse-arrow" id="br-prev" title="${App.t('browse_prev')}">←</button>
        <select id="br-topic" class="browse-select">
          ${cats.map((c, i) => `<option value="${c.id}" ${c.id === topic ? 'selected' : ''}>${i + 1}. ${icon(c.id)} ${esc(App.ui.categoryName(c.id, c.name))} (${App.words.byCategory(lang, c.id).length})</option>`).join('')}
        </select>
        <button class="browse-arrow" id="br-next" title="${App.t('browse_next')}">→</button>
        <input type="text" id="browse-search" placeholder="${App.t('words_search')}" value="${esc(query)}">
      </div>
      <p class="words-note browse-note">${App.t('browse_note')}</p>
      <div id="browse-list"></div>
    `;

    root.querySelector('.browse-langs .active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    root.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { lang = b.dataset.lang; topic = null; App.views.browse.render(root); }));
    const select = root.querySelector('#br-topic');
    const go = (step) => {
      const i = cats.findIndex(c => c.id === topic) + step;
      if (i < 0 || i >= cats.length) return;
      topic = cats[i].id;
      select.value = topic;
      renderList(root);
    };
    select.addEventListener('change', () => { topic = select.value; renderList(root); });
    root.querySelector('#br-prev').addEventListener('click', () => go(-1));
    root.querySelector('#br-next').addEventListener('click', () => go(1));
    root.querySelector('#browse-search').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); renderList(root); });
    renderList(root);
  }
};

function lineHtml(w, n) {
  return `
    <button class="browse-line" data-say="${esc(w.w)}" title="${App.t('listen_title')}">
      <span class="browse-n">${n}</span>
      <span class="browse-w">${esc(w.w)}</span>
      <span class="browse-tr">${esc(App.words.localizedMeaning(w).w)}</span>
      <span class="browse-known">${App.srs.isNew(w.id) ? '' : '✅'}</span>
    </button>`;
}

function renderList(root) {
  const list = root.querySelector('#browse-list');
  let html;
  if (query) {
    // search the whole language, grouped by topic
    const hit = (w) => w.w.toLowerCase().includes(query) || App.words.localizedMeaning(w).w.toLowerCase().includes(query);
    const groups = App.data[lang].categories
      .map(cat => ({ cat, words: App.words.byCategory(lang, cat.id).filter(hit) }))
      .filter(g => g.words.length);
    html = groups.map(g => `
      <section class="panel browse-group">
        <h3>${icon(g.cat.id)} ${App.ui.categoryName(g.cat.id, g.cat.name)} <span class="words-count">${g.words.length}</span></h3>
        <div class="browse-table">${g.words.map((w, i) => lineHtml(w, i + 1)).join('')}</div>
      </section>`).join('') || `<p class="empty-hint">—</p>`;
  } else {
    const cat = App.data[lang].categories.find(c => c.id === topic);
    const words = App.words.byCategory(lang, topic);
    const known = words.filter(w => !App.srs.isNew(w.id)).length;
    html = `
      <section class="panel browse-group">
        <div class="words-section-head">
          <h3>${icon(cat.id)} ${App.ui.categoryName(cat.id, cat.name)} <span class="words-count">✅ ${known} / ${words.length}</span></h3>
          <button class="action-card browse-learn" data-learn="${cat.id}">🎓 ${App.t('browse_learn')}</button>
        </div>
        <div class="browse-table">${words.map((w, i) => lineHtml(w, i + 1)).join('')}</div>
      </section>`;
  }
  list.innerHTML = html;
  list.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => App.speak(b.dataset.say, lang)));
  list.querySelectorAll('[data-learn]').forEach(b => b.addEventListener('click', () => {
    App.storage.setCurrentLang(lang);
    App.session.flashcardsCategory = b.dataset.learn;
    App.router.go('flashcards');
  }));
}

})();
