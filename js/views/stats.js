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
    const streak = App.storage.state.stats.streak || 0;
    const history = Object.values(App.storage.state.stats.history || {});
    const reviews = history.reduce((n, d) => n + (d.reviews || 0), 0);
    const correct = history.reduce((n, d) => n + (d.correct || 0), 0);
    const accuracy = reviews ? Math.round((correct / reviews) * 100) + '%' : '—';

    root.innerHTML = `
      <section class="stat-row">
        <div class="stat-tile"><div class="stat-icon">🏆</div><div class="stat-value">${mastered.length}<span class="stat-of">/${words.length}</span></div><div class="stat-label">${App.t('stats_mastered')}</div></div>
        <div class="stat-tile"><div class="stat-icon">📖</div><div class="stat-value">${learning.length}</div><div class="stat-label">${App.t('stats_learning')}</div></div>
        <div class="stat-tile"><div class="stat-icon">✍️</div><div class="stat-value">${reviews}</div><div class="stat-label">${App.t('stats_reviews')}</div></div>
        <div class="stat-tile"><div class="stat-icon">🎯</div><div class="stat-value">${accuracy}</div><div class="stat-label">${App.t('stats_accuracy')}</div></div>
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

// Word counts for a set of words: learned (mastered) and still in progress.
function counts(words) {
  let mastered = 0, learning = 0;
  words.forEach(w => {
    if (App.srs.isMastered(w.id)) mastered += 1;
    else if (!App.srs.isNew(w.id)) learning += 1;
  });
  return { mastered, learning, total: words.length };
}

// Two-layer bar (learned solid, in progress lighter) with "learned / total".
// Anything started gets a visible minimum width — 46 of 2415 words is under
// 2%, which used to look like an empty bar.
function barRow(labelHtml, c, color) {
  const pct = (n) => c.total ? (n / c.total) * 100 : 0;
  const shown = (n) => n ? Math.max(pct(n), 1.5) : 0;
  const whole = c.total ? Math.round(pct(c.mastered)) : 0;
  return `
    <div class="cat-bar-row ${c.mastered || c.learning ? 'started' : ''}">
      <div class="cat-bar-label">${labelHtml}</div>
      <div class="cat-bar-track">
        <div class="cat-bar-fill" style="width:${shown(c.mastered)}%; background:${color}"></div>
        <div class="cat-bar-fill cat-bar-learning" style="width:${shown(c.learning)}%; background:${color}"></div>
      </div>
      <div class="cat-bar-pct"><b>${c.mastered}</b>/${c.total} · ${whole}%</div>
    </div>
  `;
}

function renderCatBars(root, code, lang) {
  const color = `var(--slot-${lang.slot})`;
  root.querySelector('#cat-bars').innerHTML = lang.categories
    .map(cat => barRow(App.ui.categoryName(cat.id, cat.name), counts(App.words.byCategory(code, cat.id)), color))
    .join('');
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
  // Languages you've started come first, most learned on top.
  const rows = App.LANG_ORDER.map(code => ({ code, c: counts(App.words.allWords(code)) }))
    .sort((a, b) => (b.c.mastered + b.c.learning > 0) - (a.c.mastered + a.c.learning > 0) || b.c.mastered - a.c.mastered);
  root.querySelector('#all-langs').innerHTML = rows
    .map(({ code, c }) => barRow(`${App.ui.flagChip(code)} ${App.ui.langName(code)}`, c, `var(--slot-${App.data[code].slot})`))
    .join('');
}

})();
