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

    root.innerHTML = `
      <div class="panel">
        <h3>${App.t('lb_title')}</h3>
        <p class="empty-hint">${App.t('lb_subtitle')}</p>
        <div class="lb-tabs" id="lb-tabs">
          ${App.levels.ALL.map(l => `<button class="lb-tab ${l === activeLevel ? 'active' : ''}" data-level="${l}">${l}</button>`).join('')}
        </div>
        <div id="lb-body"></div>
      </div>
    `;

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
  App.cloud.fetchLeaderboard(level).then(rows => {
    if (!rows.length) {
      body.innerHTML = `<p class="empty-hint">${App.t('lb_empty')}</p>`;
      return;
    }
    body.innerHTML = rows.map((r, i) => `
      <div class="lb-row ${r.uid === App.cloud.getUid() ? 'me' : ''}">
        <span class="lb-rank">${i + 1}</span>
        ${App.profile.avatarBadgeHtml(r, 32)}
        <span class="lb-name">${escapeHtml(r.name || '?')}</span>
        <span class="lb-xp">${r.weeklyXP || 0} XP</span>
      </div>
    `).join('');
  }).catch(() => {
    body.innerHTML = `<p class="empty-hint">${App.t('lb_error')}</p>`;
  });
}

})();
