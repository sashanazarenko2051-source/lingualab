window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope.
(function () {

// Dictionary: a plain list of every word in the language you're learning,
// with its translation, grouped by topic. Click a word to hear it. Nothing
// is graded, so reading here never changes your progress.
let query = '';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

App.views.browse = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const total = App.words.allWords(code).length;
    root.innerHTML = `
      <div class="words-head">
        <h2>📖 ${App.t('browse_title')}: ${App.ui.flagChip(code)} ${App.ui.langName(code)} <span class="words-count">${total}</span></h2>
        <input type="text" id="browse-search" placeholder="${App.t('words_search')}" value="${esc(query)}">
      </div>
      <p class="words-note browse-note">${App.t('browse_note')}</p>
      <div class="browse-jump" id="browse-jump"></div>
      <div id="browse-list"></div>
    `;
    root.querySelector('#browse-search').addEventListener('input', (e) => {
      query = e.target.value.trim().toLowerCase();
      renderList(root, code);
    });
    renderList(root, code);
  }
};

function renderList(root, code) {
  const cats = App.data[code].categories;
  const groups = cats.map(cat => ({
    cat,
    words: App.words.byCategory(code, cat.id).filter(w => !query
      || w.w.toLowerCase().includes(query) || App.words.localizedMeaning(w).w.toLowerCase().includes(query))
  })).filter(g => g.words.length);

  root.querySelector('#browse-jump').innerHTML = query ? '' : groups.map(g =>
    `<button class="browse-chip" data-jump="${g.cat.id}">${App.CATEGORY_ICONS[g.cat.id] || '📘'} ${App.ui.categoryName(g.cat.id, g.cat.name)}</button>`).join('');

  root.querySelector('#browse-list').innerHTML = groups.map(g => `
    <section class="panel browse-group" id="bt-${g.cat.id}">
      <div class="words-section-head">
        <h3>${App.CATEGORY_ICONS[g.cat.id] || '📘'} ${App.ui.categoryName(g.cat.id, g.cat.name)} <span class="words-count">${g.words.length}</span></h3>
        <button class="action-card browse-learn" data-learn="${g.cat.id}">🎓 ${App.t('browse_learn')}</button>
      </div>
      <div class="browse-table">
        ${g.words.map(w => `
          <button class="browse-line" data-say="${esc(w.w)}" title="${App.t('listen_title')}">
            <span class="browse-w">${esc(w.w)}</span>
            <span class="browse-tr">${esc(App.words.localizedMeaning(w).w)}</span>
            <span class="browse-known">${App.srs.isNew(w.id) ? '' : '✅'}</span>
          </button>`).join('')}
      </div>
    </section>
  `).join('') || `<p class="empty-hint">—</p>`;

  root.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => App.speak(b.dataset.say, code)));
  root.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () =>
    root.querySelector('#bt-' + b.dataset.jump)?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
  root.querySelectorAll('[data-learn]').forEach(b => b.addEventListener('click', () => {
    App.session.flashcardsCategory = b.dataset.learn;
    App.router.go('flashcards');
  }));
}

})();
