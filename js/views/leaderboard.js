window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope, and a same-named helper in another
// view file would otherwise silently collide with (or override) this one.
(function () {

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

App.views.leaderboard = {
  render(root) {
    App.profile.ensureProfile();
    const activeLevel = App.session.leaderboardLevel || App.levels.forCurrentLang();
    App.session.leaderboardLevel = activeLevel;
    const period = App.session.leaderboardPeriod || 'week';
    const mine = App.storage.periodXP();

    root.innerHTML = `
      <div class="panel">
        <h3>🏆 ${App.t('nav_leaderboard').replace(/^[^\p{L}]+/u, '')}</h3>
        <div class="lb-periods">${['day', 'week', 'month'].map(p => `<button class="lb-period ${p === period ? 'active' : ''}" data-period="${p}">${App.t('lb_' + p)}</button>`).join('')}</div>
        <div class="lb-mine">
          ${App.profile.avatarBadgeHtml(App.storage.getProfile(), 40)}
          <div><b>${App.t('lb_local_title')}</b><div class="lb-mine-row">
            <span>☀️ ${App.t('lb_day')}: <b>${mine.day}</b> XP</span><span>📅 ${App.t('lb_week')}: <b>${mine.week}</b> XP</span><span>🗓 ${App.t('lb_month')}: <b>${mine.month}</b> XP</span>
          </div></div>
        </div>
        <p class="lb-sub">${App.t('lb_subtitle')}</p>
        <div class="lb-tabs" id="lb-tabs">
          ${App.levels.ALL.map(l => `<button class="lb-tab ${l === activeLevel ? 'active' : ''}" data-level="${l}">${l}</button>`).join('')}
        </div>
        <div id="lb-body"></div>
      </div>
    `;

    root.querySelectorAll('.lb-period').forEach(btn => btn.addEventListener('click', () => {
      App.session.leaderboardPeriod = btn.dataset.period;
      App.views.leaderboard.render(root);
    }));
    root.querySelectorAll('.lb-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        App.session.leaderboardLevel = btn.dataset.level;
        root.querySelectorAll('.lb-tab').forEach(b => b.classList.toggle('active', b === btn));
        loadBoard(root, btn.dataset.level);
      });
    });

    loadBoard(root, activeLevel);
  }
};

function loadBoard(root, level) {
  const body = root.querySelector('#lb-body');

  if (!App.cloud || !App.cloud.isConfigured()) {
    body.innerHTML = `<p class="empty-hint">${App.t('lb_not_configured')}</p>`;
    return;
  }

  body.innerHTML = `<p class="empty-hint">${App.t('lb_loading')}</p>`;
  App.cloud.fetchLeaderboard(level, App.session.leaderboardPeriod || 'week').then(rows => {
    if (!rows.length) {
      body.innerHTML = `<p class="empty-hint">${App.t('lb_empty')}</p>`;
      return;
    }
    body.innerHTML = rows.map((r, i) => `
      <div class="lb-row ${r.uid === App.cloud.getUid() ? 'me' : ''}">
        <span class="lb-rank">${i + 1}</span>
        ${App.profile.avatarBadgeHtml(r, 32)}
        <span class="lb-name">${r.owner ? '👑 ' : ''}${escapeHtml(r.name || '?')}</span>
        ${App.achievements.badgesHtml(r.achievements, r.showcase)}
        <span class="lb-xp">${r.xp || 0} XP</span>
      </div>
    `).join('');
  }).catch(() => {
    body.innerHTML = `<p class="empty-hint">${App.t('lb_error')}</p>`;
  });
}

})();
