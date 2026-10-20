window.App = window.App || {};

// Energy is the "stamina" for lessons (App.storage.state.energy). Every
// COST_EVERY finished exercises cost COST energy; mistakes cost hearts, not
// energy. It refills by REGEN per hour up to CAP. Rewarded ads (+AD_GIFT) and
// support packs can raise it above CAP, up to MAX; the unlimited pack turns
// the cost off. At zero energy a lesson can't go on.
App.energy = (function () {
  const CAP = 50;
  const MAX = 200;
  const REGEN = 3;
  const HOUR = 60 * 60 * 1000;
  const COST = 5;
  const COST_EVERY = 15;
  const AD_GIFT = 10;
  const PACKS = [100, 200, 'unlimited'];
  const listeners = [];

  function st() {
    const s = App.storage.state;
    if (!s.energy || typeof s.energy.count !== 'number') s.energy = { count: CAP, steps: 0, tickAt: Date.now(), unlimited: false };
    return s.energy;
  }
  function count() { return st().count; }
  function unlimited() { return !!st().unlimited; }
  function emit() { listeners.forEach(fn => fn(count())); }
  function onChange(fn) { listeners.push(fn); }

  function set(n) {
    const e = st();
    // Regen time starts counting from the moment energy drops below CAP.
    if (e.count >= CAP && n < CAP) e.tickAt = Date.now();
    e.count = Math.max(0, Math.min(MAX, n));
    App.storage.save();
    emit();
  }
  function add(n) { set(count() + n); }

  // +REGEN for every full hour since the last tick, while below CAP.
  function regen() {
    const e = st();
    if (e.count >= CAP) { e.tickAt = Date.now(); return; }
    const hours = Math.floor((Date.now() - (e.tickAt || Date.now())) / HOUR);
    if (hours <= 0) return;
    e.tickAt += hours * HOUR;
    set(Math.min(CAP, e.count + hours * REGEN));
  }

  // Minutes until the next +REGEN, or 0 when at CAP or above.
  function nextTickMin() {
    const e = st();
    if (e.count >= CAP) return 0;
    return Math.max(1, Math.ceil(((e.tickAt || Date.now()) + HOUR - Date.now()) / 60000));
  }

  // Called once per finished exercise; returns true when energy was spent.
  function stepDone() {
    if (unlimited()) return false;
    const e = st();
    e.steps = (e.steps || 0) + 1;
    if (e.steps < COST_EVERY) { App.storage.save(); return false; }
    e.steps = 0;
    set(count() - COST);
    return true;
  }
  function empty() { return !unlimited() && count() <= 0; }

  // Rewarded ad hook, shared with hearts' stub.
  // TODO: replace the stub with the real ad SDK call.
  let adBusy = false;
  function watchAd() {
    if (adBusy) return Promise.resolve(false);
    adBusy = true;
    return new Promise(resolve => setTimeout(() => resolve(true), 600))
      .then(ok => { if (ok) add(AD_GIFT); return !!ok; })
      .catch(() => false)
      .finally(() => { adBusy = false; });
  }

  // Support pack hook: resolve true once the payment went through.
  // TODO: connect a real payment / donation service here.
  function purchase(pack) {
    return Promise.resolve(false);
  }
  function buy(pack) {
    return purchase(pack).then(ok => {
      if (!ok) { App.effects.toast('💎 ' + App.t('lock_unlock_soon')); return false; }
      if (pack === 'unlimited') { st().unlimited = true; App.storage.save(); emit(); }
      else add(pack);
      return true;
    });
  }

  // ---- visuals ------------------------------------------------------------
  function pillHtml(id, extraCls) {
    const n = count();
    const cls = unlimited() ? '' : n === 0 ? ' empty' : n < COST * 2 ? ' low' : '';
    return `<div class="energy-pill${cls}${extraCls ? ' ' + extraCls : ''}" id="${id}" title="${App.t('energy_title')}">
      <span class="energy-ico">⚡</span><b>${unlimited() ? '∞' : n}</b></div>`;
  }
  function updatePill(el) {
    if (!el) return;
    el.outerHTML = pillHtml(el.id, el.classList.contains('clickable') ? 'clickable' : el.classList.contains('ex-energy') ? 'ex-energy' : '');
  }

  function mountTopbar() {
    const host = document.getElementById('topbar-energy');
    if (!host) return;
    const draw = () => { host.innerHTML = pillHtml('topbar-energy-pill', 'clickable'); };
    regen();
    draw();
    onChange(draw);
    setInterval(regen, 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) regen(); });
    host.addEventListener('click', openPopup);
  }

  function rulesHtml() {
    const tick = nextTickMin();
    return `
      <div class="heart-popup-rules">
        <div>📘 ${App.t('energy_rule_cost', { cost: COST, n: COST_EVERY })}</div>
        <div>🕐 ${App.t('energy_rule_regen', { n: REGEN, cap: CAP })}</div>
        <div>📺 ${App.t('energy_rule_ad', { n: AD_GIFT, max: MAX })}</div>
        ${tick ? `<div class="heart-popup-timer">⏳ ${App.t('energy_next', { n: REGEN, m: tick })}</div>` : ''}
      </div>`;
  }

  function adButton() {
    return `<button class="heart-ad-btn energy-ad-btn" id="energy-ad">📺 ${App.t('energy_ad_btn', { n: AD_GIFT })}</button>`;
  }
  function packsHtml() {
    return `<div class="energy-packs">${PACKS.map(p => `<button class="action-card energy-pack" data-pack="${p}">💎 ${p === 'unlimited' ? App.t('energy_pack_unlimited') : '+' + p + ' ⚡'}</button>`).join('')}</div>`;
  }
  function bindButtons(scope, after) {
    const ad = scope.querySelector('#energy-ad');
    if (ad) {
      ad.disabled = unlimited() || count() >= MAX;
      ad.addEventListener('click', () => {
        ad.disabled = true;
        ad.classList.add('loading');
        watchAd().then(ok => {
          ad.classList.remove('loading');
          if (ok) App.effects.toast(`⚡ +${AD_GIFT}`);
          after();
        });
      });
    }
    scope.querySelectorAll('[data-pack]').forEach(b => b.addEventListener('click', () => {
      const p = b.dataset.pack === 'unlimited' ? 'unlimited' : Number(b.dataset.pack);
      buy(p).then(ok => { if (ok) after(); });
    }));
  }

  function openPopup() {
    closePopup();
    const wrap = document.createElement('div');
    wrap.className = 'heart-popup-backdrop';
    wrap.id = 'energy-popup';
    const draw = () => {
      wrap.innerHTML = `
        <div class="heart-popup" role="dialog">
          <button class="heart-popup-close" id="energy-popup-close">✕</button>
          <div class="heart-popup-big energy-big"><span class="energy-ico">⚡</span><b>${unlimited() ? '∞' : count()}</b><span>/ ${CAP}</span></div>
          ${rulesHtml()}
          ${adButton()}
          ${packsHtml()}
        </div>`;
      wrap.querySelector('#energy-popup-close').addEventListener('click', closePopup);
      bindButtons(wrap, draw);
    };
    draw();
    wrap.addEventListener('click', e => { if (e.target === wrap) closePopup(); });
    document.body.appendChild(wrap);
  }
  function closePopup() { const p = document.getElementById('energy-popup'); if (p) p.remove(); }

  // Lesson screen shown when energy ran out. opts: { summary, onRetry }
  function renderOut(root, opts) {
    const draw = () => {
      const ok = !empty();
      root.innerHTML = `
        <div class="quiz-result hearts-out">
          <div class="hearts-out-icon energy-out-icon">⚡</div>
          <div class="hearts-out-title">${ok ? App.t('energy_back_title', { n: unlimited() ? '∞' : count() }) : App.t('energy_out_title')}</div>
          <div class="hearts-out-sub">${ok ? App.t('hearts_refilled_sub') : App.t('energy_out_sub', { n: REGEN })}</div>
          ${opts.summary || ''}
          ${empty() ? rulesHtml() : ''}
          <div style="margin-top:16px; display:flex; flex-direction:column; gap:10px; align-items:center">
            ${adButton()}
            ${packsHtml()}
            <button class="quiz-next" id="energy-retry" style="padding:14px 32px; font-size:15px" ${ok ? '' : 'disabled'}>${App.t('hearts_retry')}</button>
            <div style="display:flex; gap:10px">
              <button class="action-card" data-go="course" style="display:inline-flex">${App.t('quiz_course')}</button>
              <button class="action-card" data-go="dashboard" style="display:inline-flex">${App.t('fc_home')}</button>
            </div>
          </div>
        </div>`;
      bindButtons(root, draw);
      root.querySelector('#energy-retry').addEventListener('click', () => { if (!empty()) opts.onRetry(); });
      root.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => App.router.go(btn.dataset.go)));
    };
    draw();
  }

  return { CAP, MAX, COST, COST_EVERY, AD_GIFT, count, unlimited, empty, add, stepDone, watchAd, buy, onChange, pillHtml, updatePill, mountTopbar, openPopup, renderOut };
})();
