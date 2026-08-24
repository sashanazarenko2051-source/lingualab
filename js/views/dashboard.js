window.App = window.App || {};
App.views = App.views || {};

App.views.dashboard = {
  render(root) {
    const currentLang = App.storage.getCurrentLang();

    const lastLesson = App.storage.getLastLesson();

    root.innerHTML = `
      ${lastLesson ? repeatLessonHtml(lastLesson) : ''}

      <div class="lang-picker-head">
        <h2>${App.t('dash_pick_lang')}</h2>
        <input type="text" id="lang-search" placeholder="${App.t('dash_search_placeholder')}">
      </div>
      <div id="lang-groups"></div>

      <section class="stat-row" id="stat-row"></section>

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
    `;

    renderLangGroups(root, currentLang, '');
    renderStatRow(root, currentLang);
    renderMiniChart(root);

    root.querySelector('#lang-search').addEventListener('input', (e) => {
      renderLangGroups(root, App.storage.getCurrentLang(), e.target.value.trim().toLowerCase());
    });

    root.querySelectorAll('[data-go]').forEach(btn => {
      btn.addEventListener('click', () => App.router.go(btn.dataset.go));
    });

    root.querySelector('#repeat-lesson')?.addEventListener('click', () => {
      App.storage.setCurrentLang(lastLesson.lang);
      App.session.flashcardsCategory = lastLesson.categoryId;
      App.router.go('flashcards');
    });
  }
};

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

function langCardHtml(code, currentLang) {
  const lang = App.data[code];
  const words = App.words.allWords(code);
  const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
  const pct = words.length ? Math.round((mastered / words.length) * 100) : 0;
  const active = code === currentLang ? 'active' : '';
  return `
    <button class="lang-card ${active}" data-lang="${code}" style="--accent: var(--slot-${lang.slot})">
      <span class="lang-flag">${App.ui.flagChip(code, 'xl')}</span>
      <span class="lang-name">${App.ui.langName(code)}</span>
      <span class="lang-progress"><span class="lang-progress-fill" style="width:${pct}%"></span></span>
      <span class="lang-meta">${mastered} / ${words.length} ${App.t('dash_words_mastered_suffix')}</span>
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

  const tiles = [
    [App.t('dash_stat_due'), due, '📌'],
    [App.t('dash_stat_new'), fresh, '🌱'],
    [App.t('dash_stat_mastered'), mastered, '🏆'],
    [App.t('dash_stat_streak'), streak, '🔥']
  ];

  row.innerHTML = tiles.map(([label, value, icon]) => `
    <div class="stat-tile">
      <div class="stat-icon">${icon}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `).join('');
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
