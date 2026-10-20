window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope, and a same-named helper in another
// view file would otherwise silently collide with (or override) this one.
(function () {

// The page is split in two: everything for ONE language (picked with the
// flag tabs, so "Greetings" in English and in Czech are never mixed up),
// then the totals for all languages together.
let tab = null;

const pctOf = (a, b) => b ? Math.round((a / b) * 100) + '%' : '—';
const tile = (icon, value, label, sub) =>
  `<div class="stat-tile"><div class="stat-icon">${icon}</div><div class="stat-value">${value}</div><div class="stat-label">${label}</div>${sub ? `<div class="stat-sub">${sub}</div>` : ''}</div>`;

App.views.stats = {
  render(root) {
    const started = (c) => App.words.allWords(c).some(w => !App.srs.isNew(w.id));
    const order = App.LANG_ORDER.slice().sort((a, b) => started(b) - started(a));
    if (!tab || !App.data[tab]) tab = App.storage.getCurrentLang();
    const code = tab;
    const lang = App.data[code];
    const words = App.words.allWords(code);
    const c = counts(words);
    const fresh = c.total - c.mastered - c.learning;
    const due = words.filter(w => !App.srs.isNew(w.id) && App.srs.isDue(w.id)).length;
    const mistakes = App.storage.getMistakeIds(code).length;

    const history = Object.values(App.storage.state.stats.history || {});
    const reviews = history.reduce((n, d) => n + (d.reviews || 0), 0);
    const correct = history.reduce((n, d) => n + (d.correct || 0), 0);
    const langAns = history.reduce((n, d) => n + ((d.langs && d.langs[code] && d.langs[code].reviews) || 0), 0);
    const langOk = history.reduce((n, d) => n + ((d.langs && d.langs[code] && d.langs[code].correct) || 0), 0);
    const streak = App.storage.state.stats.streak || 0;
    const today = App.gamification.todayCount(App.storage.state);
    const goal = App.gamification.DAILY_GOAL;
    const level = App.gamification.levelForXP(App.storage.state.stats.xp);

    root.innerHTML = `
      <div class="words-tabs stats-tabs">
        ${order.map(l => `<button class="words-tab ${l === code ? 'active' : ''}" data-tab="${l}" style="--accent: var(--slot-${App.data[l].slot})">${App.ui.flagChip(l)} ${App.ui.langName(l)}</button>`).join('')}
      </div>

      <div class="panel stats-lang-panel" style="--accent: var(--slot-${lang.slot})">
        <h2 class="stats-lang-title">${App.ui.flagChip(code)} ${App.ui.langName(code)}</h2>
        <section class="stat-row">
          ${tile('🏆', `${c.mastered}<span class="stat-of">/${c.total}</span>`, App.t('stats_mastered'), pctOf(c.mastered, c.total))}
          ${tile('📖', c.learning, App.t('stats_learning'))}
          ${tile('🆕', fresh, App.t('stats_new'))}
          ${tile('⏰', due, App.t('stats_due'))}
          ${tile('🔁', mistakes, App.t('stats_mistakes'))}
          ${tile('🎯', pctOf(langOk, langAns), App.t('stats_lang_accuracy'), App.t('stats_of_answers', { n: langAns }))}
        </section>
        <p class="stats-legend">${App.t('stats_legend')}</p>
        <h3>${App.ui.flagChip(code)} ${App.ui.langName(code)}: ${App.t('stats_progress_by_topic')}</h3>
        <div id="cat-bars"></div>
      </div>

      <div class="panel">
        <h3>🌍 ${App.t('stats_overall')}</h3>
        <section class="stat-row">
          ${tile('✍️', reviews, App.t('stats_reviews'))}
          ${tile('🎯', pctOf(correct, reviews), App.t('stats_accuracy'))}
          ${tile('📅', `${today}<span class="stat-of">/${goal}</span>`, App.t('stats_today'))}
          ${tile('⭐', level, App.t('dash_level'))}
          ${tile('🔥', streak, App.t('stats_streak'))}
        </section>
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

    root.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; App.views.stats.render(root); }));
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
      <div class="cat-bar-pct"><span class="cb-m">✅ <b>${c.mastered}</b></span><span class="cb-l">${c.learning ? `📖 ${c.learning}` : ''}</span><span class="cb-t">/ ${c.total}</span><span class="cb-p">${whole}%</span></div>
    </div>
  `;
}

function renderCatBars(root, code, lang) {
  const color = `var(--slot-${lang.slot})`;
  root.querySelector('#cat-bars').innerHTML = lang.categories
    .map(cat => barRow(`${App.CATEGORY_ICONS[cat.id] || '📘'} ${App.ui.categoryName(cat.id, cat.name)}${App.storage.isExamPassed(code, cat.id) ? ' 🎓' : ''}`, counts(App.words.byCategory(code, cat.id)), color))
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
