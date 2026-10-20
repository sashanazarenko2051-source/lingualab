window.App = window.App || {};

App.session = { flashcardsCategory: null, quizCategory: null, dialogueId: null };

App.LANG_ORDER = [
  'en', 'de', 'nl', 'sv', 'no', 'da',
  'fr', 'es', 'it', 'pt', 'ro',
  'pl', 'cs', 'sk', 'uk', 'ru', 'bg', 'hr', 'sr',
  'el', 'fi', 'hu'
];

// Language families for the home page, split into their branches.
App.LANG_FAMILIES = [
  { key: 'family_germanic', subs: [
    { key: 'family_germanic_west', codes: ['en', 'de', 'nl'] },
    { key: 'family_germanic_north', codes: ['sv', 'no', 'da'] }
  ] },
  { key: 'family_romance', note: 'family_romance_note', subs: [{ codes: ['fr', 'es', 'it', 'pt', 'ro'] }] },
  { key: 'family_slavic', subs: [
    { key: 'family_slavic_west', codes: ['pl', 'cs', 'sk'] },
    { key: 'family_slavic_east', codes: ['uk', 'ru'] },
    { key: 'family_slavic_south', codes: ['bg', 'hr', 'sr'] }
  ] },
  { key: 'family_greek', note: 'family_greek_note', subs: [{ codes: ['el'] }] },
  { key: 'family_uralic', note: 'family_uralic_note', subs: [{ codes: ['fi', 'hu'] }] }
];

// If a language's data file failed to load, drop it instead of letting one
// missing App.data entry crash every view that loops over all languages.
App.LANG_ORDER = App.LANG_ORDER.filter(code => App.data[code]);
App.LANG_FAMILIES.forEach(fam => fam.subs.forEach(sub => { sub.codes = sub.codes.filter(code => App.data[code]); }));

App.router = (function () {
  let current = 'dashboard';

  function go(view) {
    current = view;
    location.hash = view;
    render();
  }

  function render() {
    document.querySelectorAll('#nav button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === current);
    });
    if (App.exercises) App.exercises.stop();
    const root = document.getElementById('view-root');
    root.innerHTML = '';
    window.scrollTo(0, 0);
    const mod = App.views[current];
    if (!mod || !mod.render) return;
    try {
      mod.render(root);
    } catch (e) {
      // Show a way out instead of a silently empty page.
      console.error(e);
      root.innerHTML = `
        <div class="session-empty">
          <div class="session-empty-icon">⚠️</div>
          <div>${App.t('load_error')}</div>
          <div style="margin-top:14px"><button class="action-card" id="reload-page" style="display:inline-flex">${App.t('load_error_reload')}</button></div>
        </div>
      `;
      root.querySelector('#reload-page').addEventListener('click', () => location.reload());
    }
  }

  return { go, render, get current() { return current; } };
})();

App.ui = App.ui || {};
App.ui.langLabel = function (code) {
  return App.ui.flagChip(code) + ' ' + App.ui.langName(code);
};

// Languages available as an INTERFACE language (i.e. we have a UI string table for them).
App.UI_LANG_ORDER = App.LANG_ORDER.slice().sort((a, b) => (a === 'ru' ? -1 : b === 'ru' ? 1 : 0));

// initTopbar runs again on every interface-language change, so its buttons
// are swapped for fresh copies first — otherwise click handlers pile up and
// one click would toggle a dropdown open and shut again.
function freshEl(selector) {
  const old = document.querySelector(selector);
  const el = old.cloneNode(true);
  old.replaceWith(el);
  return el;
}

function initTopbar() {
  document.title = App.t('app_title');

  const nav = document.getElementById('nav');
  // Some labels carry their own emoji in the translations; strip it, the icon is separate.
  const label = key => App.t(key).replace(/^[^\p{L}\p{N}]+/u, '');
  const items = [['dashboard', '🏠', 'nav_home'], ['words', '📒', 'nav_words'], ['friends', '👥', 'nav_friends'],
    ['quests', '🎯', 'nav_quests'], ['leaderboard', '🏆', 'nav_leaderboard'], ['shop', '🛒', 'nav_shop'], ['help', 'ℹ️', 'nav_info']];
  nav.innerHTML = items.map(([view, icon, key]) =>
    `<button data-view="${view}" title="${label(key)}"><span class="nav-ico">${icon}</span><span class="nav-label">${label(key)}</span></button>`).join('');
  nav.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => App.router.go(btn.dataset.view));
  });

  const brand = freshEl('.brand');
  brand.style.cursor = 'pointer';
  brand.addEventListener('click', () => App.router.go('dashboard'));

  const avatarBtn = freshEl('#topbar-avatar-btn');
  avatarBtn.title = App.t('profile_edit_title');
  avatarBtn.addEventListener('click', () => App.profile.openEditor());
  App.profile.renderTopbarBadge();
  App.hearts.mountTopbar();
  App.energy.mountTopbar();
  App.coins.mountTopbar();
  App.shop.claimGifts();
  const gear = freshEl('#topbar-gear');
  gear.title = App.t('set_title');
  gear.addEventListener('click', () => App.router.go('settings'));

  // Only the interface language is picked in the top bar; the language you
  // learn is chosen with the flag cards on the home page.
  initLangDropdown({
    ddId: 'ui-lang-dd', btnId: 'ui-lang-dd-btn', listId: 'ui-lang-dd-list',
    ariaLabel: App.t('aria_ui_lang'),
    codes: App.UI_LANG_ORDER,
    // Interface-language picker always shows each language's OWN name for itself,
    // so it stays findable no matter which UI language is currently active.
    nameFor: code => (App.LANG_NAMES[code] && App.LANG_NAMES[code][code]) || App.data[code].name,
    current: App.storage.getUILang(),
    onSelect: code => {
      App.storage.setUILang(code);
      initTopbar();
      App.router.render();
    }
  });
}

// CSS-drawn flag chips render everywhere (unlike flag emoji, which Windows/WebView2
// often falls back to showing as raw two-letter codes like "GB"), so the language
// pickers use a custom dropdown here instead of a native <select> — native <option>
// elements can only show plain text and can't host the flag-chip spans.
function initLangDropdown({ ddId, btnId, listId, ariaLabel, codes, nameFor, current, onSelect }) {
  const dd = document.getElementById(ddId);
  const btn = freshEl('#' + btnId);
  const list = document.getElementById(listId);

  btn.setAttribute('aria-label', ariaLabel);
  btn.innerHTML = `<span class="lang-dd-globe">🌐</span> ${App.ui.flagChip(current)} <span class="lang-dd-btn-name">${nameFor(current)}</span> <span class="lang-dd-caret">▾</span>`;
  btn.title = ariaLabel;

  list.innerHTML = codes.map(code => `
    <li class="lang-dd-item ${code === current ? 'active' : ''}" role="option" data-code="${code}" aria-selected="${code === current}">
      ${App.ui.flagChip(code)} <span>${nameFor(code)}</span>
    </li>
  `).join('');

  function close() {
    list.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }
  function open() {
    document.querySelectorAll('.lang-dd-list').forEach(l => { l.hidden = true; });
    document.querySelectorAll('.lang-dd-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
    list.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (list.hidden) open(); else close();
  });

  list.querySelectorAll('.lang-dd-item').forEach(item => {
    item.addEventListener('click', () => {
      close();
      onSelect(item.dataset.code);
    });
  });

  if (dd.dataset.bound) return;
  dd.dataset.bound = '1';
  document.addEventListener('click', (e) => {
    if (!dd.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

// The saved theme goes on before anything renders, so there's no flash of
// the standard colors.
App.theme.apply();

document.addEventListener('DOMContentLoaded', () => {
  if (!App.data[App.storage.getCurrentLang()]) App.storage.setCurrentLang(App.LANG_ORDER[0]);
  initTopbar();
  const startView = App.views[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard';
  App.router.go(startView);
  if (!App.storage.hasProfile()) App.profile.openEditor();
  App.regions.askIfNeeded();
  App.notify.start();
  // Offline cache for the installed phone app (needs https or localhost).
  if ('serviceWorker' in navigator && window.isSecureContext && !window.pywebview) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
