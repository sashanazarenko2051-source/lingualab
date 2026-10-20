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
    const tab = App.session.friendsTab || 'friends';
    const tabs = `<div class="lb-periods fr-tabs">${[['friends', '👥'], ['others', '🌍'], ['search', '🔍']].map(([t, i]) =>
      `<button class="lb-period ${t === tab ? 'active' : ''}" data-frtab="${t}">${i} ${App.t('fr_tab_' + t)}</button>`).join('')}</div>`;
    const filters = `
      <div class="fr-filters">
        <label>🌍 ${App.t('fr_filter_country')} <select class="shop-term" id="fr-f-country"><option value="">${App.t('fr_any')}</option>${App.regions.optionsHtml(App.session.frCountry || '').replace(/value="OTHER"[^>]*>[^<]*/, 'value="OTHER">' + App.t('country_other'))}</select></label>
        <label>🧑 ${App.t('fr_filter_gender')} <select class="shop-term" id="fr-f-gender">
          <option value="">${App.t('fr_any')}</option>
          <option value="m" ${App.session.frGender === 'm' ? 'selected' : ''}>${App.t('gender_m')}</option>
          <option value="f" ${App.session.frGender === 'f' ? 'selected' : ''}>${App.t('gender_f')}</option>
        </select></label>
      </div>`;
    const bindTabs = () => {
      root.querySelectorAll('[data-frtab]').forEach(b => b.addEventListener('click', () => { App.session.friendsTab = b.dataset.frtab; App.views.friends.render(root); }));
      const fc = root.querySelector('#fr-f-country'), fg = root.querySelector('#fr-f-gender');
      if (fc) { if (!App.session.frCountry) fc.value = ''; fc.addEventListener('change', () => { App.session.frCountry = fc.value; App.views.friends.render(root); }); }
      if (fg) fg.addEventListener('change', () => { App.session.frGender = fg.value; App.views.friends.render(root); });
    };
    if (!App.cloud || !App.cloud.isConfigured()) {
      root.innerHTML = `
        <div class="words-head"><h2>👥 ${App.t('nav_friends')}</h2></div>
        ${tabs}
        ${tab !== 'friends' ? filters : ''}
        <div class="panel"><p class="empty-hint">🔌 ${App.t('fr_not_configured')}</p></div>`;
      bindTabs();
      return;
    }
    if (tab === 'others') {
      root.innerHTML = `<div class="words-head"><h2>👥 ${App.t('nav_friends')}</h2></div>${tabs}${filters}
        <section class="panel"><div id="fr-others"><p class="empty-hint">${App.t('lb_loading')}</p></div></section>`;
      bindTabs();
      App.cloud.onReady(() => App.cloud.fetchRecent().then(rows => {
        rows = applyFilters(rows.filter(r => r.uid !== App.cloud.getUid()));
        const out = root.querySelector('#fr-others');
        out.innerHTML = rows.map(r => rowHtml(r, App.storage.isFriend(r.uid) ? 'added' : 'add')).join('') || `<p class="empty-hint">${App.t('fr_not_found')}</p>`;
        wire(root, out);
      }).catch(() => { root.querySelector('#fr-others').innerHTML = `<p class="empty-hint">${App.t('lb_error')}</p>`; }));
      return;
    }
    root.innerHTML = `
      <div class="words-head"><h2>👥 ${App.t('nav_friends')}</h2></div>
      ${tabs}
      ${tab === 'search' ? filters : ''}
      <section class="panel fr-me" ${tab === 'search' ? 'hidden' : ''}>
        <h3>${App.t('fr_my_code')}</h3>
        <div class="fr-code-row">
          <span class="fr-code" id="fr-code">…</span>
          <button class="quiz-next" id="fr-copy">📋 ${App.t('ach_copy')}</button>
        </div>
        <p class="words-note">${App.t('fr_code_note')}</p>
      </section>
      <section class="panel" ${tab === 'search' ? '' : 'hidden'}>
        <h3>🔍 ${App.t('fr_find')}</h3>
        <div class="fr-search-row">
          <input type="text" id="fr-query" placeholder="${App.t('fr_find_placeholder')}">
          <button class="quiz-next" id="fr-search">${App.t('fr_search_btn')}</button>
        </div>
        <div id="fr-results"></div>
      </section>
      <section class="panel" ${tab === 'search' ? 'hidden' : ''}>
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
        rows = applyFilters(rows.filter(r => r.uid !== App.cloud.getUid()));
        out.innerHTML = rows.length ? rows.map(r => rowHtml(r, App.storage.isFriend(r.uid) ? 'added' : 'add')).join('')
          : `<p class="empty-hint">${App.t('fr_not_found')}</p>`;
        wire(root, out);
      }).catch(() => { out.innerHTML = `<p class="empty-hint">${App.t('lb_error')}</p>`; });
    };
    bindTabs();
    root.querySelector('#fr-search').addEventListener('click', search);
    root.querySelector('#fr-query').addEventListener('keydown', (e) => { if (e.key === 'Enter') search(); });
  }
};

// Country and "guy / girl" filters for other players and the search.
function applyFilters(rows) {
  const c = App.session.frCountry, g = App.session.frGender;
  return rows.filter(r => (!c || r.country === c) && (!g || r.gender === g));
}

function rowHtml(r, action) {
  const btn = action === 'add' ? `<button class="quiz-next fr-btn" data-add="${esc(r.uid)}">➕ ${App.t('fr_add')}</button>`
    : action === 'added' ? `<span class="word-tag">✓ ${App.t('fr_added')}</span>`
    : `<button class="word-row-btn word-del" data-remove="${esc(r.uid)}" title="${App.t('fr_remove')}">🗑</button>`;
  return `
    <div class="lb-row fr-row">
      ${App.profile.avatarBadgeHtml(r, 36)}
      <span class="fr-info">
        <span class="lb-name">${r.owner ? '👑 ' : ''}${esc(r.name || '?')}</span>
        <span class="fr-meta">${r.country ? App.ui.flagChip(String(r.country).toLowerCase()) === '' ? '' : '🌍 ' + esc(App.regions.countryName(r.country)) + ' · ' : ''}${r.gender ? (r.gender === 'f' ? '👩 ' : '👨 ') : ''}⭐ ${App.t('dash_level')} ${esc(r.xpLevel || '—')} · 🔥 ${esc(r.streak || 0)} · ${esc(r.weeklyXP || 0)} XP ${App.t('fr_this_week')}</span>
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
