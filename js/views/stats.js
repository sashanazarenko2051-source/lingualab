window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope, and a same-named helper in another
// view file would otherwise silently collide with (or override) this one.
(function () {

App.views.stats = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const lang = App.data[code];
    const words = App.words.allWords(code);
    const mastered = words.filter(w => App.srs.isMastered(w.id));
    const learning = words.filter(w => !App.srs.isNew(w.id) && !App.srs.isMastered(w.id));
    const fresh = words.filter(w => App.srs.isNew(w.id));
    const streak = App.storage.state.stats.streak || 0;

    root.innerHTML = `
      <section class="stat-row">
        <div class="stat-tile"><div class="stat-icon">📚</div><div class="stat-value">${words.length}</div><div class="stat-label">${App.t('stats_total_words')}</div></div>
        <div class="stat-tile"><div class="stat-icon">🏆</div><div class="stat-value">${mastered.length}</div><div class="stat-label">${App.t('stats_mastered')}</div></div>
        <div class="stat-tile"><div class="stat-icon">📖</div><div class="stat-value">${learning.length}</div><div class="stat-label">${App.t('stats_learning')}</div></div>
        <div class="stat-tile"><div class="stat-icon">🔥</div><div class="stat-value">${streak}</div><div class="stat-label">${App.t('stats_streak')}</div></div>
      </section>

      <div class="panel">
        <h3>${App.ui.langName(code)}: ${App.t('stats_progress_by_topic')}</h3>
        <div id="cat-bars"></div>
      </div>

      <div class="panel">
        <h3>${App.t('stats_activity_30d')}</h3>
        <div class="minichart" id="minichart30"></div>
      </div>

      <div class="panel">
        <h3>${App.t('stats_all_langs')}</h3>
        <div id="all-langs"></div>
      </div>
    `;

    renderCatBars(root, code, lang);
    renderMiniChart30(root);
    renderAllLangs(root, code);
  }
};

function renderCatBars(root, code, lang) {
  const el = root.querySelector('#cat-bars');
  el.innerHTML = lang.categories.map(cat => {
    const words = App.words.byCategory(code, cat.id);
    const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
    const pct = words.length ? Math.round((mastered / words.length) * 100) : 0;
    return `
      <div class="cat-bar-row">
        <div class="cat-bar-label">${App.ui.categoryName(cat.id, cat.name)}</div>
        <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${pct}%; background: var(--slot-${lang.slot})"></div></div>
        <div class="cat-bar-pct">${pct}%</div>
      </div>
    `;
  }).join('');
}

function renderMiniChart30(root) {
  const el = root.querySelector('#minichart30');
  const days = App.storage.getHistory(30);
  const max = Math.max(1, ...days.map(d => d.reviews));
  el.innerHTML = days.map(d => {
    const h = Math.round((d.reviews / max) * 100);
    const tip = App.t('tooltip_date_reviews', { date: d.date, reviews: d.reviews });
    return `<div class="minichart-col"><div class="minichart-bar" style="height:${Math.max(h, d.reviews ? 6 : 2)}%; max-width:10px" title="${tip}"></div></div>`;
  }).join('');
}

function renderAllLangs(root, currentLang) {
  const el = root.querySelector('#all-langs');
  el.innerHTML = App.LANG_ORDER.map(code => {
    const lang = App.data[code];
    const words = App.words.allWords(code);
    const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
    const pct = words.length ? Math.round((mastered / words.length) * 100) : 0;
    return `
      <div class="cat-bar-row">
        <div class="cat-bar-label">${App.ui.flagChip(code)} ${App.ui.langName(code)}</div>
        <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${pct}%; background: var(--slot-${lang.slot})"></div></div>
        <div class="cat-bar-pct">${pct}%</div>
      </div>
    `;
  }).join('');
}

})();
