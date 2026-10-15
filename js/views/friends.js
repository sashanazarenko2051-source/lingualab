window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope.
(function () {

// Friends: your own friend code to share, a search by code or exact name,
// and your friends' level, weekly XP, streak and achievements. Friends are
// kept locally (a list of uids); their data is read from the same Firestore
// "users" collection as the leaderboard, so it needs Firebase configured.
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

App.views.friends = {
  render(root) {
    App.profile.ensureProfile();
    if (!App.cloud || !App.cloud.isConfigured()) {
      root.innerHTML = `
        <div class="words-head"><h2>👥 ${App.t('nav_friends')}</h2></div>
        <div class="panel"><p class="empty-hint">🔌 ${App.t('fr_not_configured')}</p></div>`;
      return;
    }
    root.innerHTML = `
      <div class="words-head"><h2>👥 ${App.t('nav_friends')}</h2></div>
      <section class="panel fr-me">
        <h3>${App.t('fr_my_code')}</h3>
        <div class="fr-code-row">
          <span class="fr-code" id="fr-code">…</span>
          <button class="quiz-next" id="fr-copy">📋 ${App.t('ach_copy')}</button>
        </div>
        <p class="words-note">${App.t('fr_code_note')}</p>
      </section>
      <section class="panel">
        <h3>🔍 ${App.t('fr_find')}</h3>
        <div class="fr-search-row">
          <input type="text" id="fr-query" placeholder="${App.t('fr_find_placeholder')}">
          <button class="quiz-next" id="fr-search">${App.t('fr_search_btn')}</button>
        </div>
        <div id="fr-results"></div>
      </section>
      <section class="panel">
        <h3>👥 ${App.t('fr_list')} <span class="words-count" id="fr-count">${App.storage.getFriends().length}</span></h3>
        <div id="fr-list"><p class="empty-hint">${App.t('lb_loading')}</p></div>
      </section>
    `;

    App.cloud.onReady(() => {
      const code = App.cloud.getFriendCode();
      root.querySelector('#fr-code').textContent = code;
      root.querySelector('#fr-copy').addEventListener('click', () => {
        const text = App.t('fr_share_text', { code });
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
          () => App.effects.toast(`📋 ${App.t('ach_copied')}`),
          () => App.effects.toast(text));
      });
      App.cloud.scheduleSync();
      loadFriends(root);
    });

    const search = () => {
      const q = root.querySelector('#fr-query').value.trim();
      const out = root.querySelector('#fr-results');
      if (!q) { out.innerHTML = ''; return; }
      out.innerHTML = `<p class="empty-hint">${App.t('lb_loading')}</p>`;
      App.cloud.findUsers(q).then(rows => {
        rows = rows.filter(r => r.uid !== App.cloud.getUid());
        out.innerHTML = rows.length ? rows.map(r => rowHtml(r, App.storage.isFriend(r.uid) ? 'added' : 'add')).join('')
          : `<p class="empty-hint">${App.t('fr_not_found')}</p>`;
        wire(root, out);
      }).catch(() => { out.innerHTML = `<p class="empty-hint">${App.t('lb_error')}</p>`; });
    };
    root.querySelector('#fr-search').addEventListener('click', search);
    root.querySelector('#fr-query').addEventListener('keydown', (e) => { if (e.key === 'Enter') search(); });
  }
};

function rowHtml(r, action) {
  const btn = action === 'add' ? `<button class="quiz-next fr-btn" data-add="${esc(r.uid)}">➕ ${App.t('fr_add')}</button>`
    : action === 'added' ? `<span class="word-tag">✓ ${App.t('fr_added')}</span>`
    : `<button class="word-row-btn word-del" data-remove="${esc(r.uid)}" title="${App.t('fr_remove')}">🗑</button>`;
  return `
    <div class="lb-row fr-row">
      ${App.profile.avatarBadgeHtml(r, 36)}
      <span class="fr-info">
        <span class="lb-name">${esc(r.name || '?')}</span>
        <span class="fr-meta">⭐ ${App.t('dash_level')} ${esc(r.xpLevel || '—')} · 🔥 ${esc(r.streak || 0)} · ${esc(r.weeklyXP || 0)} XP ${App.t('fr_this_week')}</span>
      </span>
      ${App.achievements.badgesHtml(r.achievements, r.showcase)}
      ${btn}
    </div>`;
}

function loadFriends(root) {
  const list = root.querySelector('#fr-list');
  const ids = App.storage.getFriends();
  root.querySelector('#fr-count').textContent = ids.length;
  if (!ids.length) { list.innerHTML = `<p class="empty-hint">${App.t('fr_empty')}</p>`; return; }
  App.cloud.fetchUsers(ids).then(rows => {
    const week = App.storage.isoWeekKey(new Date());
    rows.forEach(r => { if (r.week !== week) r.weeklyXP = 0; });
    rows.sort((a, b) => (b.weeklyXP || 0) - (a.weeklyXP || 0));
    list.innerHTML = rows.map(r => rowHtml(r, 'remove')).join('') || `<p class="empty-hint">${App.t('fr_empty')}</p>`;
    wire(root, list);
  }).catch(() => { list.innerHTML = `<p class="empty-hint">${App.t('lb_error')}</p>`; });
}

function wire(root, scope) {
  scope.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => {
    App.storage.addFriend(b.dataset.add);
    b.outerHTML = `<span class="word-tag">✓ ${App.t('fr_added')}</span>`;
    App.effects.toast(`👥 ${App.t('fr_added')}`);
    loadFriends(root);
  }));
  scope.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
    App.storage.removeFriend(b.dataset.remove);
    loadFriends(root);
  }));
}

})();
