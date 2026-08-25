window.App = window.App || {};

App.session = { flashcardsCategory: null, quizCategory: null, dialogueId: null };

App.LANG_ORDER = [
  'en', 'de', 'nl', 'sv', 'no', 'da',
  'fr', 'es', 'it', 'pt', 'ro',
  'pl', 'cs', 'sk', 'uk', 'ru', 'bg', 'hr', 'sr',
  'el', 'fi', 'hu'
];

App.LANG_FAMILIES = [
  { key: 'family_germanic', codes: ['en', 'de', 'nl', 'sv', 'no', 'da'] },
  { key: 'family_romance', codes: ['fr', 'es', 'it', 'pt', 'ro'] },
  { key: 'family_slavic', codes: ['pl', 'cs', 'sk', 'uk', 'ru', 'bg', 'hr', 'sr'] },
  { key: 'family_other', codes: ['el', 'fi', 'hu'] }
];

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
    const root = document.getElementById('view-root');
    root.innerHTML = '';
    const mod = App.views[current];
    if (mod && mod.render) mod.render(root);
  }

  return { go, render, get current() { return current; } };
})();

App.ui = App.ui || {};
App.ui.langLabel = function (code) {
  return App.ui.flagChip(code) + ' ' + App.ui.langName(code);
};

// Languages available as an INTERFACE language (i.e. we have a UI string table for them).
App.UI_LANG_ORDER = App.LANG_ORDER.slice().sort((a, b) => (a === 'ru' ? -1 : b === 'ru' ? 1 : 0));

function initTopbar() {
  document.title = App.t('app_title');

  const nav = document.getElementById('nav');
  nav.innerHTML = `
    <button data-view="dashboard">${App.t('nav_home')}</button>
    <button data-view="leaderboard">${App.t('nav_leaderboard')}</button>
  `;
  nav.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => App.router.go(btn.dataset.view));
  });

  const brand = document.querySelector('.brand');
  brand.style.cursor = 'pointer';
  brand.addEventListener('click', () => App.router.go('dashboard'));

  const avatarBtn = document.getElementById('topbar-avatar-btn');
  avatarBtn.title = App.t('profile_edit_title');
  avatarBtn.addEventListener('click', () => App.profile.openEditor());
  App.profile.renderTopbarBadge();

  initLangDropdown({
    ddId: 'lang-dd', btnId: 'lang-dd-btn', listId: 'lang-dd-list',
    ariaLabel: App.t('aria_learning_lang'),
    codes: App.LANG_ORDER,
    nameFor: code => App.ui.langName(code),
    current: App.storage.getCurrentLang(),
    onSelect: code => {
      App.storage.setCurrentLang(code);
      App.router.render();
    }
  });

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
  const btn = document.getElementById(btnId);
  const list = document.getElementById(listId);

  btn.setAttribute('aria-label', ariaLabel);
  btn.innerHTML = `${App.ui.flagChip(current)} <span class="lang-dd-btn-name">${nameFor(current)}</span> <span class="lang-dd-caret">▾</span>`;

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

  document.addEventListener('click', (e) => {
    if (!dd.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTopbar();
  const startView = App.views[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard';
  App.router.go(startView);
  if (!App.storage.hasProfile()) App.profile.openEditor();
});
