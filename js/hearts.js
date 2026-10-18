window.App = window.App || {};

// Hearts are one shared wallet kept between lessons (App.storage.state.hearts).
// A wrong answer costs a heart, and every DRAIN_EVERY finished exercises cost
// one more. Watching a rewarded ad gives one back (watchAd is the hook for the
// ad SDK). At zero hearts lessons with hearts can't be played.
App.hearts = (function () {
  const MAX = 20;
  const DRAIN_EVERY = 10;
  const listeners = [];

  function st() {
    const s = App.storage.state;
    if (!s.hearts || typeof s.hearts.count !== 'number') s.hearts = { count: MAX, steps: 0 };
    return s.hearts;
  }
  function count() { return st().count; }
  function emit() { listeners.forEach(fn => fn(count())); }
  function onChange(fn) { listeners.push(fn); }

  function set(n) {
    st().count = Math.max(0, Math.min(MAX, n));
    App.storage.save();
    emit();
  }
  function lose(n) { set(count() - (n || 1)); }
  function add(n) { set(count() + (n || 1)); }

  // Free refill: at REFILL_HOURS (local time) the wallet is topped up to
  // REFILL_TO. Hearts above that (from ads) are kept. Missed refill moments
  // (app closed) are applied on the next check.
  const REFILL_TO = 12;
  const REFILL_HOURS = [1, 13];

  // The latest refill moment that is not in the future.
  function lastRefillMoment(now) {
    const d = new Date(now);
    for (let back = 0; back < 2; back++) {
      const hours = REFILL_HOURS.slice().sort((a, b) => b - a);
      for (const h of hours) {
        const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back, h).getTime();
        if (t <= now) return t;
      }
    }
    return 0;
  }

  function checkRefill() {
    const h = st();
    const now = Date.now();
    const moment = lastRefillMoment(now);
    if ((h.refilledAt || 0) >= moment) return false;
    h.refilledAt = now;
    if (h.count < REFILL_TO) { set(REFILL_TO); return true; }
    App.storage.save();
    return false;
  }

  function startRefillTimer() {
    checkRefill();
    setInterval(checkRefill, 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkRefill(); });
  }

  // Called once per finished exercise; returns true when the drain took a heart.
  function stepDone() {
    const h = st();
    h.steps = (h.steps || 0) + 1;
    if (h.steps < DRAIN_EVERY) { App.storage.save(); return false; }
    h.steps = 0;
    lose(1);
    return true;
  }

  // Rewarded ad hook: resolve true when the viewer earned the reward.
  // TODO: replace the stub with the real ad SDK call.
  let adBusy = false;
  function showRewardedAd() {
    return new Promise(resolve => setTimeout(() => resolve(true), 600));
  }
  function watchAd() {
    if (adBusy) return Promise.resolve(false);
    adBusy = true;
    return showRewardedAd()
      .then(ok => { if (ok) add(1); return !!ok; })
      .catch(() => false)
      .finally(() => { adBusy = false; });
  }

  // ---- visuals ------------------------------------------------------------
  const PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
  const SHINE = '<ellipse cx="7.6" cy="7.4" rx="2.6" ry="1.7" transform="rotate(-35 7.6 7.4)" fill="#fff" opacity=".55"/>';

  // Shared gradient and crack clip paths, defined once for every heart.
  function ensureDefs() {
    if (document.getElementById('heart-defs')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'heart-defs';
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML = `
      <defs>
        <linearGradient id="heart-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--heart-1, #ff7a9c)"/>
          <stop offset="1" stop-color="var(--heart-2, #e0144c)"/>
        </linearGradient>
        <linearGradient id="heart-grad-empty" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#5a6478"/><stop offset="1" stop-color="#363e4f"/>
        </linearGradient>
        <clipPath id="heart-clip-l"><polygon points="0,0 12.5,0 10.5,7 13.2,10.5 10.8,14.5 12.6,18.5 12,24 0,24"/></clipPath>
        <clipPath id="heart-clip-r"><polygon points="12.5,0 24,0 24,24 12,24 12.6,18.5 10.8,14.5 13.2,10.5 10.5,7"/></clipPath>
      </defs>`;
    document.body.appendChild(svg);
  }

  function iconSvg(empty) {
    ensureDefs();
    return `<svg class="heart-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="${PATH}" fill="url(#${empty ? 'heart-grad-empty' : 'heart-grad'})" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>
      ${empty ? '' : SHINE}</svg>`;
  }

  // Counter pill: heart icon + number. Low hearts beat faster.
  function pillHtml(id, extraCls) {
    const n = count();
    const cls = n === 0 ? ' empty' : n <= 3 ? ' low' : '';
    return `<div class="heart-pill${cls}${extraCls ? ' ' + extraCls : ''}" id="${id}" title="${App.t('hearts_title')}">
      <span class="heart-ico">${iconSvg(n === 0)}</span><b>${n}</b></div>`;
  }

  // Refreshes a pill in place and plays the heart-break burst over it.
  function updatePill(el, broke) {
    if (!el) return;
    const n = count();
    el.querySelector('b').textContent = n;
    el.classList.toggle('low', n > 0 && n <= 3);
    el.classList.toggle('empty', n === 0);
    el.querySelector('.heart-ico').innerHTML = iconSvg(n === 0);
    if (broke) breakAt(el.querySelector('.heart-ico'));
  }

  // A heart cracks down the middle and both halves fall apart, with "-1".
  function breakAt(anchor) {
    if (!anchor) return;
    ensureDefs();
    const r = anchor.getBoundingClientRect();
    const size = Math.max(r.width, 20) * 3;
    const fx = document.createElement('div');
    fx.className = 'heart-break';
    fx.style.cssText = `left:${r.left + r.width / 2 - size / 2}px; top:${r.top + r.height / 2 - size / 2}px; width:${size}px; height:${size}px`;
    const half = side => `<svg class="hb-half hb-${side}" viewBox="0 0 24 24">
      <g clip-path="url(#heart-clip-${side})"><path d="${PATH}" fill="url(#heart-grad)"/>${SHINE}</g></svg>`;
    fx.innerHTML = `${half('l')}${half('r')}<span class="hb-minus">-1</span>`;
    document.body.appendChild(fx);
    anchor.classList.remove('hit'); void anchor.offsetWidth; anchor.classList.add('hit');
    setTimeout(() => fx.remove(), 1100);
  }

  // ---- out-of-hearts / refill panel ---------------------------------------
  // opts: { summary (html), onRetry () }
  function renderOut(root, opts) {
    const draw = () => {
      const n = count();
      root.innerHTML = `
        <div class="quiz-result hearts-out">
          <div class="hearts-out-icon">${n > 0 ? iconSvg(false) : '<span class="hearts-out-broken">' + iconSvg(true) + '</span>'}</div>
          <div class="hearts-out-title">${n > 0 ? App.t('hearts_refilled_title', { n }) : App.t('hearts_out_title')}</div>
          <div class="hearts-out-sub">${n > 0 ? App.t('hearts_refilled_sub') : App.t('hearts_out_sub')}</div>
          ${opts.summary || ''}
          <div style="margin-top:16px; display:flex; flex-direction:column; gap:10px; align-items:center">
            <button class="heart-ad-btn" id="hearts-ad">${App.t('hearts_ad_btn')}</button>
            <button class="quiz-next" id="hearts-retry" style="padding:14px 32px; font-size:15px" ${n > 0 ? '' : 'disabled'}>${App.t('hearts_retry')}</button>
            <div style="display:flex; gap:10px">
              <button class="action-card" data-go="course" style="display:inline-flex">${App.t('quiz_course')}</button>
              <button class="action-card" data-go="dashboard" style="display:inline-flex">${App.t('fc_home')}</button>
            </div>
          </div>
        </div>`;
      bindAd(root.querySelector('#hearts-ad'), draw);
      root.querySelector('#hearts-retry').addEventListener('click', () => { if (count() > 0) opts.onRetry(); });
      root.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => App.router.go(btn.dataset.go)));
    };
    draw();
  }

  function bindAd(btn, after) {
    if (!btn) return;
    const full = count() >= MAX;
    btn.disabled = full;
    if (full) btn.textContent = App.t('hearts_full');
    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.classList.add('loading');
      watchAd().then(ok => {
        btn.classList.remove('loading');
        if (ok) App.effects.toast(`${iconSvgInline()} +1`, 'heart-toast');
        if (after) after(); else btn.disabled = count() >= MAX;
      });
    });
  }
  function iconSvgInline() { return `<span class="heart-ico heart-ico-inline">${iconSvg(false)}</span>`; }

  // Top-bar pill: shows the wallet everywhere; click opens the refill popup.
  function mountTopbar() {
    const host = document.getElementById('topbar-hearts');
    if (!host) return;
    const draw = () => { host.innerHTML = pillHtml('topbar-heart-pill', 'clickable'); };
    draw();
    onChange(draw);
    startRefillTimer();
    host.addEventListener('click', openPopup);
  }

  function openPopup() {
    closePopup();
    const wrap = document.createElement('div');
    wrap.className = 'heart-popup-backdrop';
    wrap.id = 'heart-popup';
    const draw = () => {
      wrap.innerHTML = `
        <div class="heart-popup" role="dialog">
          <button class="heart-popup-close" id="heart-popup-close">✕</button>
          <div class="heart-popup-big">${iconSvg(count() === 0)}<b>${count()}</b><span>/ ${MAX}</span></div>
          <div class="heart-popup-rules">
            <div>❌ ${App.t('hearts_rule_mistake')}</div>
            <div>🔟 ${App.t('hearts_rule_drain', { n: DRAIN_EVERY })}</div>
            <div>📺 ${App.t('hearts_rule_ad')}</div>
            <div>🕐 ${App.t('hearts_rule_refill', { n: REFILL_TO })}</div>
          </div>
          <button class="heart-ad-btn" id="heart-popup-ad">${App.t('hearts_ad_btn')}</button>
          <button class="heart-popup-more" id="heart-popup-more">ℹ️ ${App.t('help_more')}</button>
        </div>`;
      wrap.querySelector('#heart-popup-close').addEventListener('click', closePopup);
      wrap.querySelector('#heart-popup-more').addEventListener('click', () => { closePopup(); App.openHelp('hearts'); });
      bindAd(wrap.querySelector('#heart-popup-ad'), draw);
    };
    draw();
    wrap.addEventListener('click', e => { if (e.target === wrap) closePopup(); });
    document.body.appendChild(wrap);
  }
  function closePopup() { const p = document.getElementById('heart-popup'); if (p) p.remove(); }

  return { MAX, DRAIN_EVERY, count, lose, add, stepDone, watchAd, onChange, pillHtml, updatePill, breakAt, renderOut, mountTopbar, iconSvg };
})();
