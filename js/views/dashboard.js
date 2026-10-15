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
      ${startLessonHtml(currentLang, nextCat, mistakes)}
      ${lastLesson ? repeatLessonHtml(lastLesson) : ''}
      ${mistakes ? `
      <button class="repeat-lesson repeat-lesson-mistakes" id="mistakes-session">
        <span class="repeat-lesson-icon">🔁</span>
        <span class="repeat-lesson-text">
          <span class="repeat-lesson-title">${App.t('dash_mistakes')}</span>
          <span class="repeat-lesson-sub">${App.ui.flagChip(currentLang)} ${App.ui.langName(currentLang)} · ${App.t('dash_mistakes_sub', { n: mistakes })}</span>
        </span>
      </button>` : ''}

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
      </section>

      <section class="panel">
        <h3>${App.t('dash_activity_7d')}</h3>
        <div class="minichart" id="minichart"></div>
      </section>

      <section class="panel">
        <h3>${App.t('dash_achievements')}</h3>
        <div class="achievements-row" id="achievements-row"></div>
      </section>
    `;

    renderLangGroups(root, currentLang, '');
    renderStatRow(root, currentLang);
    renderLevelRow(root);
    renderDailyGoal(root);
    renderMiniChart(root);
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

    root.querySelector('#mistakes-session')?.addEventListener('click', () => {
      App.session.mistakesMode = true;
      App.router.go('flashcards');
    });

    root.querySelector('#repeat-lesson')?.addEventListener('click', () => {
      App.storage.setCurrentLang(lastLesson.lang);
      App.session.flashcardsCategory = lastLesson.categoryId;
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
  const groups = App.LANG_FAMILIES.map(fam => {
    const codes = fam.codes.filter(code => {
      if (!filter) return true;
      const l = App.data[code];
      return l.name.toLowerCase().includes(filter) || App.ui.langName(code).toLowerCase().includes(filter) || code.includes(filter);
    });
    if (!codes.length) return '';
    return `
      <div class="family-group">
        <p class="family-title">${App.t(fam.key)}</p>
        <div class="lang-grid">${codes.map(code => langCardHtml(code, currentLang)).join('')}</div>
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

function renderMiniChart(root) {
  const el = root.querySelector('#minichart');
  const days = App.storage.getHistory(7);
  const max = Math.max(1, ...days.map(d => d.reviews));
  const dayKeys = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];

  el.innerHTML = days.map(d => {
    const h = Math.round((d.reviews / max) * 100);
    const dow = App.t(dayKeys[new Date(d.date).getDay()]);
    const tip = App.t('tooltip_reviews_correct', { reviews: d.reviews, correct: d.correct });
    return `
      <div class="minichart-col">
        <div class="minichart-bar" style="height:${Math.max(h, d.reviews ? 6 : 2)}%" title="${tip}"></div>
        <div class="minichart-label">${dow}</div>
      </div>
    `;
  }).join('');
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
