window.App = window.App || {};

// Rewarded ads per day and per reward (hearts / energy / hints). Ads have
// no daily limit now; the counts are only kept (App.storage.state.ads,
// reset at local midnight).
App.adLimit = (function () {
  const PER_DAY = { hearts: Infinity, energy: Infinity, hints: Infinity };

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function st() {
    const s = App.storage.state;
    if (!s.ads || s.ads.day !== today()) s.ads = { day: today(), hearts: 0, energy: 0, hints: 0 };
    return s.ads;
  }
  function left(kind) { return Math.max(0, PER_DAY[kind] - (st()[kind] || 0)); }
  function use(kind) { st()[kind] = (st()[kind] || 0) + 1; App.storage.save(); }
  // Text under an ad button: ads left today, or that they're used up.
  function label(kind) {
    const n = left(kind);
    if (n === Infinity) return '';
    return n ? App.t('ads_left', { n }) : App.t('ads_none');
  }

  return { PER_DAY, left, use, label };
})();
