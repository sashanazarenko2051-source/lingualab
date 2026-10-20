window.App = window.App || {};

// Rewarded ads are limited per day and per reward (hearts / energy), so they
// can't be watched endlessly. Counts live in App.storage.state.ads and reset
// at local midnight.
App.adLimit = (function () {
  const PER_DAY = { hearts: 5, energy: 5 };

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function st() {
    const s = App.storage.state;
    if (!s.ads || s.ads.day !== today()) s.ads = { day: today(), hearts: 0, energy: 0 };
    return s.ads;
  }
  function left(kind) { return Math.max(0, PER_DAY[kind] - (st()[kind] || 0)); }
  function use(kind) { st()[kind] = (st()[kind] || 0) + 1; App.storage.save(); }
  // Text under an ad button: ads left today, or that they're used up.
  function label(kind) {
    const n = left(kind);
    return n ? App.t('ads_left', { n }) : App.t('ads_none');
  }

  return { PER_DAY, left, use, label };
})();
