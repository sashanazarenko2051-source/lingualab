window.App = window.App || {};

// Hints in exercises: DAILY free ones every day (reset at local midnight),
// plus extra hints from rewarded ads or the shop, which don't expire.
// Bought unlimited hints (until a date, or forever) are never spent.
// State: App.storage.state.hints = { day, used, extra, unlimitedUntil, forever }.
App.hints = (function () {
  const DAILY = 5;
  const listeners = [];

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function st() {
    const s = App.storage.state;
    if (!s.hints || typeof s.hints !== 'object') s.hints = { day: today(), used: 0, extra: 0 };
    if (s.hints.day !== today()) { s.hints.day = today(); s.hints.used = 0; }
    return s.hints;
  }
  function dailyLeft() { return Math.max(0, DAILY - st().used); }
  function unlimited() { const h = st(); return !!h.forever || Date.now() < (h.unlimitedUntil || 0); }
  function left() { return unlimited() ? Infinity : dailyLeft() + (st().extra || 0); }
  function leftLabel() { return unlimited() ? '∞' : String(left()); }
  function emit() { listeners.forEach(fn => fn(left())); }
  function onChange(fn) { listeners.push(fn); }

  // Spends one hint (today's free ones first); false when there are none.
  function use() {
    const h = st();
    if (unlimited()) return true;
    if (dailyLeft() > 0) h.used += 1;
    else if (h.extra > 0) h.extra -= 1;
    else return false;
    App.storage.save();
    emit();
    return true;
  }
  function add(n) { st().extra = (st().extra || 0) + n; App.storage.save(); emit(); }
  function extendUnlimited(days) {
    const h = st();
    h.unlimitedUntil = Math.max(Date.now(), h.unlimitedUntil || 0) + days * 24 * 60 * 60 * 1000;
    App.storage.save(); emit();
  }
  function makeForever() { st().forever = true; App.storage.save(); emit(); }

  // Rewarded ad: +1 hint, no daily limit. TODO: real ad SDK.
  let busy = false;
  function watchAd() {
    if (busy) return Promise.resolve(false);
    busy = true;
    return new Promise(r => setTimeout(() => r(true), 600))
      .then(ok => { if (ok) { App.adLimit.use('hints'); add(1); } return ok; })
      .finally(() => { busy = false; });
  }

  // The button shown in exercises.
  function buttonHtml(id) {
    return `<button class="ex-hint-btn ex-hint-daily" id="${id || 'ex-daily-hint'}" title="${App.t('hints_rule', { n: DAILY })}">💡 ${App.t('hint_btn')} <span class="ex-hint-left">×${leftLabel()}</span></button>`;
  }
  function paint(btn) { if (btn) btn.querySelector('.ex-hint-left').textContent = '×' + leftLabel(); }

  // Tries to spend a hint; when none are left, offers an ad or the shop.
  function ask(onOk) {
    if (use()) { onOk(); return; }
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML = `
      <div class="modal-card restart-card">
        <div class="restart-icon">💡</div>
        <h3>${App.t('hints_out_title')}</h3>
        <p>${App.t('hints_out_sub', { n: DAILY })}</p>
        <div class="profile-modal-actions" style="flex-wrap:wrap; justify-content:center">
          <button class="heart-ad-btn" id="hint-ad">${App.t('hints_ad_btn')}</button>
          <button class="action-card" id="hint-shop" style="display:inline-flex">🛒 ${App.t('nav_shop')}</button>
          <button class="action-card" id="hint-close" style="display:inline-flex">${App.t('profile_cancel')}</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#hint-close').addEventListener('click', () => ov.remove());
    ov.querySelector('#hint-shop').addEventListener('click', () => { ov.remove(); App.session.shopSection = 'hints'; App.router.go('shop'); });
    ov.querySelector('#hint-ad').addEventListener('click', e => {
      e.target.disabled = true;
      watchAd().then(ok => { ov.remove(); if (ok) { App.effects.toast('💡 +1'); ask(onOk); } });
    });
  }

  return { DAILY, left, leftLabel, dailyLeft, unlimited, use, add, extendUnlimited, makeForever, watchAd, buttonHtml, paint, ask, onChange };
})();
