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
  // Unique themes sold in the shop (App.shop); the rest are free.
  Object.assign(PRESETS, {
    gold: { light: false, vars: {
      page: '#0f0b03', surface: '#1c1508', 'surface-2': '#2a1f0b', border: '#4a3812',
      ink: '#fff8e6', 'ink-2': '#e3c98a', 'ink-muted': '#8f7a4a',
      'brand-1': '#ffd23f', 'brand-2': '#ff9f1c', 'brand-3': '#fff3b0'
    } },
    aurora: { light: false, vars: {
      page: '#030b14', surface: '#081a26', 'surface-2': '#0c2636', border: '#16405a',
      ink: '#eafff8', 'ink-2': '#9be7d0', 'ink-muted': '#4f8a7c',
      'brand-1': '#4dffb4', 'brand-2': '#8a6bff', 'brand-3': '#36d6ff'
    } },
    sakura: { light: true, vars: {
      page: '#fff3f7', surface: '#ffffff', 'surface-2': '#ffe6ef', border: '#f6c3d5',
      ink: '#3b1426', 'ink-2': '#8a4a66', 'ink-muted': '#c08aa2',
      'brand-1': '#ff5d9e', 'brand-2': '#b05cff', 'brand-3': '#3dbf8a',
      good: '#2fa86e', 'good-dark': '#1f7d50', warn: '#e09a00', 'warn-dark': '#b07800',
      bad: '#e0245e', 'bad-dark': '#b0174a'
    } },
    lava: { light: false, vars: {
      page: '#120403', surface: '#200a07', 'surface-2': '#2e0f0a', border: '#5a1d12',
      ink: '#fff1ec', 'ink-2': '#f0a48f', 'ink-muted': '#9a5a4a',
      'brand-1': '#ff4d1c', 'brand-2': '#ffb000', 'brand-3': '#ff7ab0'
    } },
    royal: { light: false, vars: {
      page: '#07051a', surface: '#110c2e', 'surface-2': '#1a1342', border: '#2e2470',
      ink: '#f2eeff', 'ink-2': '#b6a8ff', 'ink-muted': '#6c62a8',
      'brand-1': '#c9a2ff', 'brand-2': '#ffd23f', 'brand-3': '#5ce1ff'
    } }
  });
  // More unique themes, each with its own animated background effect (fx).
  Object.assign(PRESETS, {
    cyber: { light: false, fx: 'grid', vars: {
      page: '#0a0014', surface: '#140726', 'surface-2': '#1e0b38', border: '#3d1670',
      ink: '#fdf0ff', 'brand-1': '#ff2bd6', 'brand-2': '#00f0ff', 'brand-3': '#f9ff3d'
    } },
    galaxy: { light: false, fx: 'stars', vars: {
      page: '#05031a', surface: '#0e0a2c', 'surface-2': '#17113f', border: '#2c2266',
      ink: '#eef0ff', 'brand-1': '#9d7bff', 'brand-2': '#ff7bd5', 'brand-3': '#7bdcff'
    } },
    candy: { light: true, fx: 'bubbles', vars: {
      page: '#fff4fb', surface: '#ffffff', 'surface-2': '#ffe8f6', border: '#f5c6e3',
      ink: '#3a1035', 'brand-1': '#ff4fb8', 'brand-2': '#7a5cff', 'brand-3': '#00c2a8',
      good: '#16b67a', 'good-dark': '#0d8a5b', warn: '#e39a00', 'warn-dark': '#b07800', bad: '#e5245e', 'bad-dark': '#b0174a'
    } },
    emerald: { light: false, fx: 'sparkle', vars: {
      page: '#02110b', surface: '#062116', 'surface-2': '#0a2e1f', border: '#145238',
      ink: '#eafff4', 'brand-1': '#2ee59d', 'brand-2': '#ffd23f', 'brand-3': '#9dffcf'
    } },
    coffee: { light: false, fx: 'steam', vars: {
      page: '#120a05', surface: '#20140b', 'surface-2': '#2d1d10', border: '#4d331d',
      ink: '#fff4e8', 'brand-1': '#e0a96d', 'brand-2': '#c2703d', 'brand-3': '#f5deb3'
    } },
    arctic: { light: true, fx: 'snow', vars: {
      page: '#eef7ff', surface: '#ffffff', 'surface-2': '#e2f0fb', border: '#bcd8ef',
      ink: '#0b2338', 'brand-1': '#2a9df4', 'brand-2': '#6c63ff', 'brand-3': '#16c0b0',
      good: '#12b76a', 'good-dark': '#0b8a50', warn: '#e0a100', 'warn-dark': '#b07d00', bad: '#e11d48', 'bad-dark': '#b3123a'
    } },
    abyss: { light: false, fx: 'waves', vars: {
      page: '#000a12', surface: '#021725', 'surface-2': '#052236', border: '#0b3a57',
      ink: '#e6f7ff', 'brand-1': '#00d4ff', 'brand-2': '#0077ff', 'brand-3': '#55ffcf'
    } }
  });
  PRESETS.gold.fx = 'sparkle'; PRESETS.aurora.fx = 'aurora'; PRESETS.sakura.fx = 'petals'; PRESETS.lava.fx = 'embers'; PRESETS.royal.fx = 'stars';
  const PREMIUM = ['gold', 'aurora', 'sakura', 'lava', 'royal', 'cyber', 'galaxy', 'candy', 'emerald', 'coffee', 'arctic', 'abyss'];
  // Name of the theme being previewed; it is only shown, never stored.
  let previewName = null;
  const ORDER = ['neon', 'ocean', 'sunset', 'forest', 'graphite', 'light', ...PREMIUM];
  function isLocked(name) { return PREMIUM.includes(name) && !(App.shop && App.shop.ownsTheme(name)); }
  // Colors the learner can override, with the stylesheet defaults they start from.
  // Interface fonts (all come with Windows, so they work offline).
  const FONTS = {
    standard: '',
    rounded: "'Trebuchet MS', 'Segoe UI', sans-serif",
    verdana: "Verdana, Tahoma, sans-serif",
    calibri: "Calibri, Carlito, 'Segoe UI', sans-serif",
    bahnschrift: "Bahnschrift, 'Segoe UI', sans-serif",
    georgia: "Georgia, 'Times New Roman', serif",
    comic: "'Comic Sans MS', 'Comic Neue', cursive",
    mono: "'Cascadia Code', Consolas, monospace"
  };
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
    if (!PRESETS[st.theme] || isLocked(st.theme)) st.theme = 'neon';
    if (!st.custom || typeof st.custom !== 'object') st.custom = {};
    if (typeof st.scale !== 'number') st.scale = 1;
    if (typeof st.bgAnim !== 'boolean') st.bgAnim = true;
    if (typeof st.motion !== 'boolean') st.motion = true;
    if (!(st.font in FONTS)) st.font = 'standard';
    if (![1, 2, 3].includes(st.accents)) st.accents = 3;
    return st;
  }

  // The value a key has right now (preset value, else the neon default).
  // While previewing, the previewed theme without the learner's own colors.
  function shown() {
    const st = settings();
    return previewName ? { theme: previewName, custom: {} } : { theme: st.theme, custom: st.custom };
  }

  function value(key) {
    const sh = shown();
    return sh.custom[key] || PRESETS[sh.theme].vars[key] || NEON[key];
  }

  function apply() {
    const st = settings();
    const el = document.documentElement;
    const sh = shown();
    const preset = PRESETS[sh.theme];
    ALL_KEYS.forEach(k => {
      const v = sh.custom[k] || preset.vars[k];
      if (v) el.style.setProperty('--' + k, v); else el.style.removeProperty('--' + k);
    });
    // A custom surface needs a matching second surface and border.
    if (sh.custom.surface) {
      el.style.setProperty('--surface-2', `color-mix(in srgb, ${sh.custom.surface} 82%, ${value('ink')})`);
      el.style.setProperty('--border', `color-mix(in srgb, ${sh.custom.surface} 70%, ${value('ink')})`);
    }
    // Secondary text stays close to the main text colour so it's readable
    // on any theme (it used to fade into the cards).
    el.style.setProperty('--ink-2', `color-mix(in srgb, ${value('ink')} 86%, ${value('surface')})`);
    el.style.setProperty('--ink-muted', `color-mix(in srgb, ${value('ink')} 68%, ${value('surface')})`);
    el.dataset.theme = preset.light ? 'light' : 'dark';
    // The theme's background effect.
    [...el.classList].filter(c => c.startsWith('fx-')).forEach(c => el.classList.remove(c));
    if (preset.fx) el.classList.add('fx-' + preset.fx);
    el.classList.toggle('no-bg-anim', !st.bgAnim);
    el.classList.toggle('reduce-motion', !st.motion);
    el.style.zoom = st.scale === 1 ? '' : String(st.scale);
    if (FONTS[st.font]) el.style.setProperty('--font-body', FONTS[st.font]); else el.style.removeProperty('--font-body');
    // Fewer accents: the unused ones repeat the last chosen accent.
    if (st.accents < 3) el.style.setProperty('--brand-3', value(st.accents === 1 ? 'brand-1' : 'brand-2'));
    if (st.accents < 2) el.style.setProperty('--brand-2', value('brand-1'));
    if (App.contrast) App.contrast.refresh();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', value('surface'));
  }

  // Shows a theme for a few seconds without choosing it (also locked ones).
  let previewTimer = null;
  function preview(name, ms) {
    if (!PRESETS[name]) return;
    previewName = name;
    apply();
    clearTimeout(previewTimer);
    document.getElementById('theme-preview-bar')?.remove();
    const bar = document.createElement('div');
    bar.id = 'theme-preview-bar';
    bar.className = 'theme-preview-bar';
    bar.innerHTML = `👁 ${App.t('theme_preview_bar', { name: App.t('theme_' + name) })} <button class="action-card" id="tp-stop">✕</button>`;
    document.body.appendChild(bar);
    bar.querySelector('#tp-stop').addEventListener('click', endPreview);
    previewTimer = setTimeout(endPreview, ms || 8000);
  }
  function endPreview() {
    clearTimeout(previewTimer);
    document.getElementById('theme-preview-bar')?.remove();
    if (!previewName) return;
    previewName = null;
    apply();
  }

  function setTheme(name) {
    if (previewName) endPreview();
    if (isLocked(name)) return false;
    const st = settings();
    st.theme = PRESETS[name] ? name : 'neon';
    st.custom = {};
    App.storage.save(); apply();
    return true;
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
    st.theme = 'neon'; st.custom = {}; st.scale = 1; st.bgAnim = true; st.motion = true; st.font = 'standard'; st.accents = 3;
    App.storage.save(); apply();
  }

  // Swatch colors for a preset card.
  function swatch(name) {
    const v = Object.assign({}, NEON, PRESETS[name].vars);
    return [v.page, v.surface, v['brand-1'], v['brand-2'], v['brand-3']];
  }

  return { ORDER, PREMIUM, preview, endPreview, isLocked, FONTS, CUSTOM_KEYS, settings, value, apply, setTheme, setCustom, setOption, reset, swatch };
})();
