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
  nav.innerHTML = `<button data-view="dashboard">${App.t('nav_home')}</button>`;
  nav.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => App.router.go(btn.dataset.view));
  });

  const brand = document.querySelector('.brand');
  brand.style.cursor = 'pointer';
  brand.addEventListener('click', () => App.router.go('dashboard'));

  const sel = document.getElementById('lang-switch');
  sel.setAttribute('aria-label', App.t('aria_learning_lang'));
  sel.innerHTML = App.LANG_ORDER.map(code => {
    return `<option value="${code}">${App.data[code].flag} ${App.ui.langName(code)}</option>`;
  }).join('');
  sel.value = App.storage.getCurrentLang();
  sel.addEventListener('change', () => {
    App.storage.setCurrentLang(sel.value);
    App.router.render();
  });

  const uiSel = document.getElementById('ui-lang-switch');
  uiSel.setAttribute('aria-label', App.t('aria_ui_lang'));
  uiSel.innerHTML = App.UI_LANG_ORDER.map(code => {
    // Interface-language picker always shows each language's OWN name for itself,
    // so it stays findable no matter which UI language is currently active.
    const selfName = (App.LANG_NAMES[code] && App.LANG_NAMES[code][code]) || App.data[code].name;
    return `<option value="${code}">${App.data[code].flag} ${selfName}</option>`;
  }).join('');
  uiSel.value = App.storage.getUILang();
  uiSel.addEventListener('change', () => {
    App.storage.setUILang(uiSel.value);
    initTopbar();
    App.router.render();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTopbar();
  const startView = App.views[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard';
  App.router.go(startView);
});
