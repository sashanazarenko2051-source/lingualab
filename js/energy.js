window.App = window.App || {};

// Energy is the "stamina" for lessons (App.storage.state.energy). Every
// COST_EVERY words practised cost COST energy; mistakes cost hearts, not
// energy. It refills by REGEN per hour up to CAP, and 24 hours after it first
// dropped below CAP it is back at CAP. Rewarded ads (+AD_GIFT, no limit) and
// shop packs add on top, with no upper limit; unlimited (bought for a term
// in the shop) turns the cost off. At zero energy a lesson can't go on.
App.energy = (function () {
  const CAP = 200;
  const MAX = 99999;
  const REGEN = 5;
  const HOUR = 60 * 60 * 1000;
  const FULL_MS = 24 * HOUR;
  const COST = 5;
  const COST_EVERY = 10;
  const AD_GIFT = 15;
  const PACKS = ['unlimited'];
  const listeners = [];

  function st() {
    const s = App.storage.state;
    if (!s.energy || typeof s.energy.count !== 'number') s.energy = { count: CAP, steps: 0, tickAt: Date.now(), unlimitedUntil: 0 };
    return s.energy;
  }
  function count() { return st().count; }
  function unlimited() { return Date.now() < (st().unlimitedUntil || 0); }
  // Unlimited from the shop; a second purchase extends the running period.
  function extendUnlimited(days) {
    const e = st();
    e.unlimitedUntil = Math.max(Date.now(), e.unlimitedUntil || 0) + days * 24 * HOUR;
    App.storage.save();
    emit();
  }
  function emit() { listeners.forEach(fn => fn(count())); }
  function onChange(fn) { listeners.push(fn); }

  function set(n) {
    const e = st();
    // Regen time starts counting from the moment energy drops below CAP.
    if (e.count >= CAP && n < CAP) { e.tickAt = Date.now(); e.fullAt = Date.now() + FULL_MS; }
    e.count = Math.max(0, Math.min(MAX, n));
    App.storage.save();
    emit();
  }
  function add(n) { set(count() + n); }

  // +REGEN for every full hour since the last tick, while below CAP.
  function regen() {
    const e = st();
    if (e.count >= CAP) { e.tickAt = Date.now(); e.fullAt = 0; return; }
    if (!e.fullAt) e.fullAt = (e.tickAt || Date.now()) + FULL_MS;
    if (Date.now() >= e.fullAt) { e.fullAt = 0; set(CAP); return; }
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
    if (adBusy || !App.adLimit.left('energy')) return Promise.resolve(false);
    adBusy = true;
    return new Promise(resolve => setTimeout(() => resolve(true), 600))
      .then(ok => { if (ok) { App.adLimit.use('energy'); add(AD_GIFT); } return !!ok; })
      .catch(() => false)
      .finally(() => { adBusy = false; });
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
    if (host.dataset.bound) return;
    host.dataset.bound = '1';
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
        <div>🌅 ${App.t('energy_rule_full', { cap: CAP })}</div>
        <div>📺 ${App.t('energy_rule_ad2', { n: AD_GIFT })}</div>
        ${tick ? `<div class="heart-popup-timer">⏳ ${App.t('energy_next', { n: REGEN, m: tick })}</div>` : ''}
      </div>`;
  }

  function adButton() {
    return `<button class="heart-ad-btn energy-ad-btn" id="energy-ad">📺 ${App.t('energy_ad_btn', { n: AD_GIFT })}</button>
      <div class="ads-left">${App.adLimit.label('energy')}</div>`;
  }
  function packsHtml() {
    return `<div class="energy-packs">${PACKS.map(p => `<button class="action-card energy-pack" data-pack="${p}">💎 ${p === 'unlimited' ? App.t('energy_pack_unlimited') : '+' + p + ' ⚡'}</button>`).join('')}</div>`;
  }
  function bindButtons(scope, after) {
    const ad = scope.querySelector('#energy-ad');
    if (ad) {
      ad.disabled = unlimited();
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
    // Packs are sold in the shop.
    scope.querySelectorAll('[data-pack]').forEach(b => b.addEventListener('click', () => {
      closePopup();
      App.session.shopSection = 'energy';
      App.router.go('shop');
    }));
  }

  // What the count is out of: ∞ during unlimited, MAX once above CAP.
  function limitLabel() {
    if (unlimited()) return '∞';
    return count() > CAP ? '' : CAP;
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
          <div class="heart-popup-big energy-big"><span class="energy-ico">⚡</span><b>${count()}</b>${limitLabel() === '' ? '' : `<span>/ ${limitLabel()}</span>`}</div>
          ${unlimited() ? `<div class="energy-unlimited-until">∞ ${App.t('energy_unlimited_until', { date: new Date(st().unlimitedUntil).toLocaleDateString() })}</div>` : ''}
          ${rulesHtml()}
          ${adButton()}
          <div class="energy-packs">${PACKS.map(p => `<button class="action-card energy-pack" data-pack="${p}">💎 ${App.t('energy_pack_unlimited')}</button>`).join('')}
          <button class="action-card energy-pack shop-link" id="energy-popup-shop">🛒 ${App.t('nav_shop')}</button></div>
        </div>`;
      wrap.querySelector('#energy-popup-shop').addEventListener('click', () => { closePopup(); App.session.shopSection = 'energy'; App.router.go('shop'); });
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

  return { CAP, MAX, COST, COST_EVERY, AD_GIFT, count, unlimited, extendUnlimited, empty, add, stepDone, watchAd, onChange, pillHtml, updatePill, mountTopbar, openPopup, renderOut };
})();
