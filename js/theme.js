window.App = window.App || {};

// Color themes. A theme is a set of CSS custom properties applied to <html>;
// the stylesheet's :root values are the standard ("neon") theme. The learner
// picks a preset and can override single colors, the interface size and the
// animations on top of it (App.storage.state.settings).
App.theme = (function () {
  const PRESETS = {
    neon: { light: false, vars: {} },
    ocean: { light: false, vars: {
      page: '#04131c', surface: '#0a2230', 'surface-2': '#0f2f42', border: '#1b4a63',
      ink: '#e6faff', 'ink-2': '#8fc3d6', 'ink-muted': '#4f7d90',
      'brand-1': '#2ee6d6', 'brand-2': '#2f8cff', 'brand-3': '#7dffb2'
    } },
    sunset: { light: false, vars: {
      page: '#160812', surface: '#24101d', 'surface-2': '#331627', border: '#552541',
      ink: '#fff0f5', 'ink-2': '#e0a3bd', 'ink-muted': '#8a5a70',
      'brand-1': '#ff8a3d', 'brand-2': '#ff3d8b', 'brand-3': '#ffd23f'
    } },
    forest: { light: false, vars: {
      page: '#07120a', surface: '#0f1f13', 'surface-2': '#16301c', border: '#24492d',
      ink: '#ecffe9', 'ink-2': '#9fcfa4', 'ink-muted': '#5a8461',
      'brand-1': '#7dff6a', 'brand-2': '#22b35e', 'brand-3': '#e3ff5a'
    } },
    graphite: { light: false, vars: {
      page: '#0d0d10', surface: '#17171c', 'surface-2': '#212128', border: '#33333d',
      ink: '#f2f2f5', 'ink-2': '#a8a8b3', 'ink-muted': '#6b6b76',
      'brand-1': '#d8d8e0', 'brand-2': '#8c7bff', 'brand-3': '#5ce1e6'
    } },
    light: { light: true, vars: {
      page: '#eef3fb', surface: '#ffffff', 'surface-2': '#e6edf7', border: '#c9d6e8',
      ink: '#0f1b2d', 'ink-2': '#3d5675', 'ink-muted': '#7890ad',
      'brand-1': '#0091d6', 'brand-2': '#8a2be2', 'brand-3': '#10b981',
      good: '#12b76a', 'good-dark': '#0b8a50', warn: '#e0a100', 'warn-dark': '#b07d00',
      bad: '#e11d48', 'bad-dark': '#b3123a'
    } }
  };
  const ORDER = ['neon', 'ocean', 'sunset', 'forest', 'graphite', 'light'];
  // Colors the learner can override, with the stylesheet defaults they start from.
  const CUSTOM_KEYS = ['brand-1', 'brand-2', 'brand-3', 'page', 'surface', 'ink'];
  const NEON = {
    page: '#060b16', surface: '#0d1526', 'surface-2': '#142238', border: '#223757',
    ink: '#e7f6ff', 'ink-2': '#93b8d6', 'ink-muted': '#52708f',
    'brand-1': '#00e5ff', 'brand-2': '#b829ff', 'brand-3': '#39ff9d'
  };
  const ALL_KEYS = ['page', 'surface', 'surface-2', 'border', 'ink', 'ink-2', 'ink-muted',
    'brand-1', 'brand-2', 'brand-3', 'good', 'good-dark', 'warn', 'warn-dark', 'bad', 'bad-dark'];

  function settings() {
    const s = App.storage.state;
    if (!s.settings) s.settings = {};
    const st = s.settings;
    if (!PRESETS[st.theme]) st.theme = 'neon';
    if (!st.custom || typeof st.custom !== 'object') st.custom = {};
    if (typeof st.scale !== 'number') st.scale = 1;
    if (typeof st.bgAnim !== 'boolean') st.bgAnim = true;
    if (typeof st.motion !== 'boolean') st.motion = true;
    return st;
  }

  // The value a key has right now (preset value, else the neon default).
  function value(key) {
    const st = settings();
    return st.custom[key] || PRESETS[st.theme].vars[key] || NEON[key];
  }

  function apply() {
    const st = settings();
    const el = document.documentElement;
    const preset = PRESETS[st.theme];
    ALL_KEYS.forEach(k => {
      const v = st.custom[k] || preset.vars[k];
      if (v) el.style.setProperty('--' + k, v); else el.style.removeProperty('--' + k);
    });
    // A custom surface needs a matching second surface and border.
    if (st.custom.surface) {
      el.style.setProperty('--surface-2', `color-mix(in srgb, ${st.custom.surface} 82%, ${value('ink')})`);
      el.style.setProperty('--border', `color-mix(in srgb, ${st.custom.surface} 70%, ${value('ink')})`);
    }
    if (st.custom.ink) {
      el.style.setProperty('--ink-2', `color-mix(in srgb, ${st.custom.ink} 70%, ${value('page')})`);
      el.style.setProperty('--ink-muted', `color-mix(in srgb, ${st.custom.ink} 45%, ${value('page')})`);
    }
    el.dataset.theme = preset.light ? 'light' : 'dark';
    el.classList.toggle('no-bg-anim', !st.bgAnim);
    el.classList.toggle('reduce-motion', !st.motion);
    el.style.zoom = st.scale === 1 ? '' : String(st.scale);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', value('surface'));
  }

  function setTheme(name) {
    const st = settings();
    st.theme = PRESETS[name] ? name : 'neon';
    st.custom = {};
    App.storage.save(); apply();
  }
  function setCustom(key, v) {
    const st = settings();
    if (v) st.custom[key] = v; else delete st.custom[key];
    App.storage.save(); apply();
  }
  function setOption(key, v) {
    settings()[key] = v;
    App.storage.save(); apply();
  }
  function reset() {
    const st = settings();
    st.theme = 'neon'; st.custom = {}; st.scale = 1; st.bgAnim = true; st.motion = true;
    App.storage.save(); apply();
  }

  // Swatch colors for a preset card.
  function swatch(name) {
    const v = Object.assign({}, NEON, PRESETS[name].vars);
    return [v.page, v.surface, v['brand-1'], v['brand-2'], v['brand-3']];
  }

  return { ORDER, CUSTOM_KEYS, settings, value, apply, setTheme, setCustom, setOption, reset, swatch };
})();
