window.App = window.App || {};
App.views = App.views || {};

(function () {

// Settings: color theme (presets + own colors), interface size, animations
// and reminders. Every change applies right away.
const CUSTOM_LABELS = {
  'brand-1': 'set_color_accent1', 'brand-2': 'set_color_accent2', 'brand-3': 'set_color_accent3',
  page: 'set_color_page', surface: 'set_color_surface', ink: 'set_color_ink'
};

// <input type="color"> only takes #rrggbb.
function toHex(v) {
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v.slice(1).split('').map(c => c + c).join('');
  return '#000000';
}

function render(root) {
  const st = App.theme.settings();
  const perm = App.notify.permission();
  root.innerHTML = `
    <div class="settings-page">
      <h1 class="settings-title">⚙️ ${App.t('set_title')}</h1>
      <button class="action-card settings-help" id="set-help">📖 ${App.t('help_open')} <span>${App.t('help_open_sub')}</span></button>

      <section class="settings-card">
        <h2>🎨 ${App.t('set_theme')}</h2>
        <div class="theme-grid">
          ${App.theme.ORDER.map(name => `
            <button class="theme-card${st.theme === name && !Object.keys(st.custom).length ? ' active' : ''}" data-theme="${name}">
              <span class="theme-swatch">${App.theme.swatch(name).map(c => `<i style="background:${c}"></i>`).join('')}</span>
              <span class="theme-name">${App.t('theme_' + name)}${name === 'neon' ? ` <em>${App.t('set_standard')}</em>` : ''}</span>
            </button>`).join('')}
        </div>
      </section>

      <section class="settings-card">
        <h2>🖌️ ${App.t('set_custom')}</h2>
        <p class="settings-hint">${App.t('set_custom_hint')}</p>
        <div class="color-grid">
          ${App.theme.CUSTOM_KEYS.map(k => `
            <label class="color-item">
              <input type="color" data-key="${k}" value="${toHex(App.theme.value(k))}">
              <span>${App.t(CUSTOM_LABELS[k])}</span>
            </label>`).join('')}
        </div>
        <div class="settings-row">
          <span>🔎 ${App.t('set_scale')}</span>
          <input type="range" id="set-scale" min="0.85" max="1.3" step="0.05" value="${st.scale}">
          <b id="set-scale-val">${Math.round(st.scale * 100)}%</b>
        </div>
        ${toggleHtml('set-bganim', '🌌 ' + App.t('set_bg_anim'), st.bgAnim)}
        ${toggleHtml('set-motion', '✨ ' + App.t('set_motion'), st.motion)}
        <button class="action-card settings-reset" id="set-reset">↩️ ${App.t('set_reset')}</button>
      </section>

      <section class="settings-card">
        <h2>🔔 ${App.t('set_notify')}</h2>
        <p class="settings-hint">${App.t('set_notify_hint')}</p>
        ${toggleHtml('set-notify', App.t('set_notify_toggle'), App.notify.enabled())}
        <div class="settings-status">${App.t('notify_perm_' + perm)}</div>
        <button class="action-card" id="set-notify-test">📨 ${App.t('set_notify_test')}</button>
      </section>

    </div>
  `;

  root.querySelector('#set-help').addEventListener('click', () => App.openHelp());
  root.querySelectorAll('.theme-card').forEach(btn => btn.addEventListener('click', () => {
    App.theme.setTheme(btn.dataset.theme);
    render(root);
  }));
  root.querySelectorAll('input[type=color]').forEach(inp => {
    inp.addEventListener('input', () => App.theme.setCustom(inp.dataset.key, inp.value));
    inp.addEventListener('change', () => render(root));
  });
  const scale = root.querySelector('#set-scale');
  scale.addEventListener('input', () => { root.querySelector('#set-scale-val').textContent = Math.round(scale.value * 100) + '%'; });
  scale.addEventListener('change', () => App.theme.setOption('scale', Number(scale.value)));
  root.querySelector('#set-bganim').addEventListener('change', e => App.theme.setOption('bgAnim', e.target.checked));
  root.querySelector('#set-motion').addEventListener('change', e => App.theme.setOption('motion', e.target.checked));
  root.querySelector('#set-reset').addEventListener('click', () => { App.theme.reset(); render(root); });

  root.querySelector('#set-notify').addEventListener('change', e => {
    App.notify.setEnabled(e.target.checked).then(() => render(root));
  });
  root.querySelector('#set-notify-test').addEventListener('click', () => App.notify.test().then(() => render(root)));

}

function toggleHtml(id, label, on) {
  return `<label class="settings-toggle"><span>${label}</span>
    <input type="checkbox" id="${id}" ${on ? 'checked' : ''}><i class="switch"></i></label>`;
}

App.views.settings = { render };

})();
