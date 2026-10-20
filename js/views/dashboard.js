window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope, and a same-named helper in another
// view file would otherwise silently collide with (or override) this one.
(function () {

App.views.dashboard = {
  render(root) {
    const currentLang = App.storage.getCurrentLang();

    const lastLesson = App.storage.getLastLesson();

    const nextCat = App.lesson.nextCategory(currentLang);
    const mistakes = App.storage.getMistakeIds(currentLang).length;

    root.innerHTML = `
      ${App.notify.bannerHtml()}
      ${startLessonHtml(currentLang, nextCat, mistakes)}
      <button class="repeat-lesson repeat-lesson-mistakes ${mistakes ? '' : 'is-empty'}" id="mistakes-session">
        <span class="repeat-lesson-icon">🔁</span>
        <span class="repeat-lesson-text">
          <span class="repeat-lesson-title">${App.t('dash_mistakes')}</span>
          <span class="repeat-lesson-sub">${App.ui.flagChip(currentLang)} ${App.ui.langName(currentLang)} · ${mistakes ? App.t('dash_mistakes_sub', { n: mistakes }) : App.t('words_mistakes_empty')}</span>
        </span>
      </button>
      ${lastLesson ? repeatLessonHtml(lastLesson) : ''}

      <div class="lang-picker-head">
        <h2>${App.t('dash_pick_lang')}</h2>
        <input type="text" id="lang-search" placeholder="${App.t('dash_search_placeholder')}">
      </div>
      <div id="lang-groups"></div>

      <section class="stat-row" id="stat-row"></section>

      <section class="panel">
        <div class="level-row" id="level-row"></div>
      </section>

      <section class="panel">
        <h3>${App.t('dash_daily_goal')}</h3>
        <div class="daily-goal-row" id="daily-goal-row"></div>
      </section>

      <section class="actions-row">
        <button class="action-card" data-go="course">
          <span class="action-icon">🎓</span>
          <span class="action-title">${App.t('dash_continue_path')}</span>
          <span class="action-sub">${App.t('dash_continue_path_sub')}</span>
        </button>
        <button class="action-card" data-go="stats">
          <span class="action-icon">📊</span>
          <span class="action-title">${App.t('dash_stats')}</span>
          <span class="action-sub">${App.t('dash_stats_sub')}</span>
        </button>
        <button class="action-card" data-go="help">
          <span class="action-icon">📖</span>
          <span class="action-title">${App.t('help_open')}</span>
          <span class="action-sub">${App.t('help_open_sub')}</span>
        </button>
      </section>

      <section class="panel">
        <div class="chart-head">
          <h3 id="chart-title">${App.t('dash_activity_7d')}</h3>
          <div class="chart-tabs">
            <button class="chart-tab active" data-chart="week">${App.t('chart_week')}</button>
            <button class="chart-tab" data-chart="month">${App.t('chart_month')}</button>
          </div>
        </div>
        <div class="minichart" id="minichart"></div>
        <div class="minichart-total" id="week-total"></div>
        <div class="month-view" id="month-view" hidden></div>
      </section>

      <section class="panel">
        <h3>${App.t('dash_achievements')}</h3>
        <div class="achievements-row" id="achievements-row"></div>
      </section>
    `;

    App.notify.bindBanner(root, () => { const b = root.querySelector('#start-lesson'); if (b) b.click(); });
    renderLangGroups(root, currentLang, '');
    renderStatRow(root, currentLang);
    renderLevelRow(root);
    renderDailyGoal(root);
    renderMiniChart(root);
    root.querySelectorAll('[data-chart]').forEach(b => b.addEventListener('click', () => {
      const month = b.dataset.chart === 'month';
      root.querySelectorAll('[data-chart]').forEach(x => x.classList.toggle('active', x === b));
      root.querySelector('#minichart').hidden = month;
      root.querySelector('#week-total').hidden = month;
      root.querySelector('#month-view').hidden = !month;
      root.querySelector('#chart-title').textContent = month ? App.t('chart_month_title') : App.t('dash_activity_7d');
      if (month) { monthOffset = 0; renderMonth(root); }
    }));
    renderAchievements(root);
    App.mascot.renderWidget(root);

    root.querySelector('#lang-search').addEventListener('input', (e) => {
      renderLangGroups(root, App.storage.getCurrentLang(), e.target.value.trim().toLowerCase());
    });

    root.querySelectorAll('[data-go]').forEach(btn => {
      btn.addEventListener('click', () => App.router.go(btn.dataset.go));
    });

    root.querySelector('#start-lesson').addEventListener('click', () => {
      App.session.flashcardsCategory = nextCat.id;
      App.router.go('flashcards');
    });

    root.querySelector('#mistakes-session').addEventListener('click', () => {
      // nothing to fix yet: show the (empty) mistakes bank instead
      if (!mistakes) { App.session.wordsSection = 'mistakes'; App.router.go('words'); return; }
      App.session.mistakesMode = true;
      App.router.go('flashcards');
    });

    root.querySelector('#repeat-lesson')?.addEventListener('click', () => {
      App.storage.setCurrentLang(lastLesson.lang);
      // Review only words of that topic you've already met — weakest first
      // (mistakes, then due, then fewest correct repetitions). No new words.
      const weight = (w) => (App.storage.isMistake(w.id) ? 0 : App.srs.isDue(w.id) ? 1 : 2) * 100 + App.storage.getSRS(w.id).reps;
      const seen = App.words.byCategory(lastLesson.lang, lastLesson.categoryId)
        .filter(w => !App.srs.isNew(w.id))
        .sort((a, b) => weight(a) - weight(b));
      if (seen.length) { App.session.customWordIds = seen.slice(0, 10).map(w => w.id); App.session.customFrom = 'dashboard'; }
      else App.session.flashcardsCategory = lastLesson.categoryId;
      App.router.go('flashcards');
    });
  }
};

function startLessonHtml(code, cat, mistakes) {
  const lang = App.data[code];
  return `
    <button class="repeat-lesson start-lesson" id="start-lesson" style="--accent: var(--slot-${lang.slot})">
      <span class="repeat-lesson-icon">▶️</span>
      <span class="repeat-lesson-text">
        <span class="repeat-lesson-title">${App.t('dash_start_lesson')}</span>
        <span class="repeat-lesson-sub">${App.ui.flagChip(code)} ${App.ui.langName(code)} · ${App.ui.categoryName(cat.id, cat.name)}${mistakes ? ` · ${App.t('dash_start_review', { n: Math.min(mistakes, 4) })}` : ''}</span>
      </span>
    </button>
  `;
}

function repeatLessonHtml(lastLesson) {
  const lang = App.data[lastLesson.lang];
  return `
    <button class="repeat-lesson" id="repeat-lesson" style="--accent: var(--slot-${lang.slot})">
      <span class="repeat-lesson-icon">🔁</span>
      <span class="repeat-lesson-text">
        <span class="repeat-lesson-title">${App.t('dash_repeat_lesson')}</span>
        <span class="repeat-lesson-sub">${App.ui.flagChip(lastLesson.lang)} ${App.ui.langName(lastLesson.lang)} · ${App.ui.categoryName(lastLesson.categoryId, lastLesson.categoryName)}</span>
      </span>
    </button>
  `;
}

function renderLangGroups(root, currentLang, filter) {
  const wrap = root.querySelector('#lang-groups');
  const match = code => {
    if (!filter) return true;
    const l = App.data[code];
    return l.name.toLowerCase().includes(filter) || App.ui.langName(code).toLowerCase().includes(filter) || code.includes(filter);
  };
  const groups = App.LANG_FAMILIES.map(fam => {
    const subs = fam.subs.map(sub => ({ key: sub.key, codes: sub.codes.filter(match) })).filter(sub => sub.codes.length);
    if (!subs.length) return '';
    return `
      <div class="family-group">
        <p class="family-title">${App.t(fam.key)}</p>
        ${fam.note ? `<p class="family-note">${App.t(fam.note)}</p>` : ''}
        ${subs.map(sub => `
          ${sub.key ? `<p class="family-sub">${App.t(sub.key)}</p>` : ''}
          <div class="lang-grid">${sub.codes.map(code => langCardHtml(code, currentLang)).join('')}</div>`).join('')}
      </div>
    `;
  }).join('');

  wrap.innerHTML = groups || `<p class="empty-hint">${App.t('dash_no_results')}</p>`;

  wrap.querySelectorAll('.lang-card').forEach(card => {
    card.addEventListener('click', () => {
      App.storage.setCurrentLang(card.dataset.lang);
      App.router.go('course');
    });
  });
}

// Rough, commonly-cited linguistic benchmark for CEFR C2 (fluent/near-native)
// vocabulary size — not computed from app data, just a reference point shown
// in the third badge's tooltip so learners can gauge how far 2000ish words go.
const C2_VOCAB_ESTIMATE = '8–10k';

function langCardHtml(code, currentLang) {
  const lang = App.data[code];
  const words = App.words.allWords(code);
  const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
  const total = words.length;
  const pct = total ? Math.round((mastered / total) * 100) : 0;
  const active = code === currentLang ? 'active' : '';
  return `
    <button class="lang-card ${active}" data-lang="${code}" style="--accent: var(--slot-${lang.slot})">
      <span class="lang-flag">${App.ui.flagChip(code, 'xl')}</span>
      <span class="lang-name">${App.ui.langName(code)}</span>
      <span class="lang-progress"><span class="lang-progress-fill" style="width:${pct}%"></span></span>
      <span class="lang-meta-row">
        <span title="${App.t('dash_stat_mastered')}">✅ ${mastered}</span>
        <span title="${App.t('dash_lang_total')}">📚 ${total}</span>
        <span title="${App.t('dash_lang_c2_hint')}">🎓 ${C2_VOCAB_ESTIMATE}</span>
      </span>
    </button>
  `;
}

function renderStatRow(root, currentLang) {
  const row = root.querySelector('#stat-row');
  const words = App.words.allWords(currentLang);
  const due = words.filter(w => !App.srs.isNew(w.id) && App.srs.isDue(w.id)).length;
  const fresh = words.filter(w => App.srs.isNew(w.id)).length;
  const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
  const streak = App.storage.state.stats.streak || 0;

  // Each tile opens what it counts: today's reviews / learned words in
  // "My words", a new lesson, or the stats page.
  const tiles = [
    [App.t('dash_stat_due'), due, '📌', 'due'],
    [App.t('dash_stat_new'), fresh, '🌱', 'learn'],
    [App.t('dash_stat_mastered'), mastered, '🏆', 'all'],
    [App.t('dash_stat_streak'), streak, '🔥', 'stats']
  ];

  row.innerHTML = tiles.map(([label, value, icon, go]) => `
    <button class="stat-tile stat-tile-link" data-tile="${go}">
      <div class="stat-icon">${icon}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
      <div class="stat-go">${App.t(go === 'learn' ? 'dash_tile_read' : go === 'stats' ? 'dash_tile_stats' : 'dash_tile_open')} →</div>
    </button>
  `).join('');
  row.querySelectorAll('[data-tile]').forEach(b => b.addEventListener('click', () => {
    const go = b.dataset.tile;
    if (go === 'learn') App.router.go('browse');
    else if (go === 'stats') App.router.go('stats');
    else { App.session.wordsSection = go; App.router.go('words'); }
  }));
}

// This week from Monday to Sunday; today is highlighted, days still ahead
// are dimmed. Each bar shows its number of answers.
function renderMiniChart(root) {
  const el = root.querySelector('#minichart');
  const dayKeys = ['day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'];
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const history = App.storage.state.stats.history || {};
  const days = dayKeys.map((k, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const e = history[key] || { reviews: 0, correct: 0 };
    return { label: App.t(k), reviews: e.reviews || 0, correct: e.correct || 0, today: i === (now.getDay() + 6) % 7, future: d > now };
  });
  const max = Math.max(1, ...days.map(d => d.reviews));
  const total = days.reduce((a, d) => a + d.reviews, 0);
  const correct = days.reduce((a, d) => a + d.correct, 0);
  const totalEl = root.querySelector('#week-total');
  if (totalEl) totalEl.textContent = App.t('chart_week_total', { n: total, c: correct });

  // Days without answers get a grey baseline and "0" (none for days ahead),
  // so an empty day doesn't look like a small bar.
  el.innerHTML = days.map(d => {
    const h = Math.round((d.reviews / max) * 100);
    const tip = App.t('tooltip_reviews_correct', { reviews: d.reviews, correct: d.correct });
    return `
      <div class="minichart-col ${d.today ? 'is-today' : ''} ${d.future ? 'is-future' : ''}">
        <div class="minichart-n">${d.reviews || (d.future ? '' : '0')}</div>
        <div class="minichart-bar${d.reviews ? '' : ' is-empty'}" style="height:${d.reviews ? Math.max(h, 6) : 2}%" title="${tip}"></div>
        <div class="minichart-label">${d.label}</div>
      </div>
    `;
  }).join('');
}

// Month calendar (Mon–Sun rows): answers per day, darker = more. The arrows
// page through earlier months.
let monthOffset = 0;
function renderMonth(root) {
  const el = root.querySelector('#month-view');
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const history = App.storage.state.stats.history || {};
  const key = (d) => first.getFullYear() + '-' + String(first.getMonth() + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  const counts = [];
  for (let d = 1; d <= daysIn; d++) counts.push((history[key(d)] || {}).reviews || 0);
  const max = Math.max(1, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);
  const active = counts.filter(Boolean).length;
  let title;
  try { title = first.toLocaleString(App.storage.getUILang(), { month: 'long', year: 'numeric' }); }
  catch (e) { title = first.getFullYear() + '-' + String(first.getMonth() + 1).padStart(2, '0'); }
  const dayKeys = ['day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'];
  const isThisMonth = monthOffset === 0;

  let cells = '';
  for (let i = 0; i < lead; i++) cells += '<div class="mv-cell mv-blank"></div>';
  counts.forEach((n, i) => {
    const d = i + 1;
    const future = isThisMonth && d > now.getDate();
    const lvl = n ? Math.min(4, 1 + Math.floor((n / max) * 3.999)) : 0;
    cells += `<div class="mv-cell mv-l${lvl} ${isThisMonth && d === now.getDate() ? 'mv-today' : ''} ${future ? 'mv-future' : ''}" title="${App.t('tooltip_reviews_correct', { reviews: n, correct: (history[key(d)] || {}).correct || 0 })}">
      <span class="mv-d">${d}</span><span class="mv-n">${n || ''}</span></div>`;
  });

  el.innerHTML = `
    <div class="mv-nav">
      <button class="browse-arrow" id="mv-prev">‹</button>
      <span class="mv-title">${title}</span>
      <button class="browse-arrow" id="mv-next" ${isThisMonth ? 'disabled' : ''}>›</button>
    </div>
    <div class="mv-grid">
      ${dayKeys.map(k => `<div class="mv-dow">${App.t(k)}</div>`).join('')}
      ${cells}
    </div>
    <div class="mv-total">${App.t('chart_month_total', { n: total, d: active })}</div>
  `;
  el.querySelector('#mv-prev').addEventListener('click', () => { monthOffset -= 1; renderMonth(root); });
  el.querySelector('#mv-next').addEventListener('click', () => { if (monthOffset < 0) { monthOffset += 1; renderMonth(root); } });
}

function renderLevelRow(root) {
  const row = root.querySelector('#level-row');
  const xp = App.storage.state.stats.xp || 0;
  const progress = App.gamification.xpProgress(xp);
  const pct = progress.needed ? Math.round((progress.current / progress.needed) * 100) : 100;

  row.innerHTML = `
    <div class="level-badge">${progress.level}</div>
    <div class="level-info">
      <div class="level-title">${App.t('dash_level')} ${progress.level}</div>
      <div class="xp-track"><div class="xp-fill" style="width:${pct}%"></div></div>
      <div class="xp-label">${App.t('dash_xp_to_next', { current: progress.current, needed: progress.needed })}</div>
    </div>
  `;
}

function renderDailyGoal(root) {
  const row = root.querySelector('#daily-goal-row');
  const goal = App.gamification.DAILY_GOAL;
  const done = App.gamification.todayCount(App.storage.state);
  const pct = Math.min(100, Math.round((done / goal) * 100));

  row.innerHTML = `
    <div class="daily-goal-ring" style="--pct:${pct}" data-label="${Math.min(done, goal)}/${goal}"></div>
    <div class="daily-goal-text">${App.t('dash_daily_goal_progress', { done, goal })}</div>
  `;
}

function renderAchievements(root) {
  const el = root.querySelector('#achievements-row');
  const unlocked = App.storage.state.stats.achievements || [];
  el.innerHTML = App.gamification.ACHIEVEMENTS.map(a => {
    const isUnlocked = unlocked.includes(a.id);
    return `<button class="ach-badge ${isUnlocked ? 'unlocked' : 'locked'}" data-ach="${a.id}" title="${App.t(a.titleKey, { n: a.goal })}">${a.icon}</button>`;
  }).join('') + `<div class="ach-hint">👆 ${App.t('ach_hint_tap')}</div>`;
  el.querySelectorAll('[data-ach]').forEach(b => b.addEventListener('click', () => App.achievements.openInfo(b.dataset.ach)));
}

})();
