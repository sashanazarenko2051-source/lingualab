window.App = window.App || {};

// The day streak's flame and getting a lost streak back.
// Colours: grey — a day was missed; normal — the first days; blue — a week
// or more; purple — three weeks or more. Missing one or two days can be
// undone with a rewarded ad: before studying it keeps the old streak going,
// after studying (when the streak already restarted at 1) it adds the old one back.
App.streak = (function () {
  function key(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return key(d); }
  function stats() { return App.storage.state.stats; }

  // Days since the last studied day: 0 today, 1 yesterday, 2+ means missed.
  function gap() {
    const last = stats().lastActiveDate;
    if (!last) return 0;
    for (let i = 0; i <= 40; i++) if (daysAgo(i) === last) return i;
    return 99;
  }
  function value() { return stats().streak || 0; }

  // What can be restored right now: { days, value } or null.
  function restorable() {
    const s = stats();
    const g = gap();
    if (g >= 2 && g <= 3 && value() > 0) return { days: g - 1, value: value(), before: true };
    if (s.lostStreak && s.lostStreak.day === key(new Date()) && s.lostStreak.value > 0) return { days: s.lostStreak.days, value: s.lostStreak.value, before: false };
    return null;
  }

  function color() {
    if (gap() >= 2) return 'gray';
    const n = value();
    if (n >= 21) return 'purple';
    if (n >= 7) return 'blue';
    return 'normal';
  }
  function flameHtml(size) {
    return `<span class="flame flame-${color()}" style="${size ? `font-size:${size}px` : ''}">🔥</span>`;
  }

  // Called by storage.touchStreak before it resets a broken streak.
  function noteLost(oldValue, missedDays) {
    if (missedDays >= 1 && missedDays <= 2 && oldValue > 0) {
      stats().lostStreak = { value: oldValue, days: missedDays, day: key(new Date()) };
    }
  }

  // Rewarded ad, then the streak comes back. TODO: real ad SDK.
  function restoreByAd() {
    const r = restorable();
    if (!r) return Promise.resolve(false);
    return new Promise(res => setTimeout(() => res(true), 600)).then(ok => {
      if (!ok) return false;
      const s = stats();
      if (r.before) s.lastActiveDate = daysAgo(1);
      else { s.streak = r.value + (s.streak || 1); s.lostStreak = null; }
      App.storage.save();
      App.effects.toast('🔥 ' + App.t('streak_restored'));
      return true;
    });
  }

  return { gap, value, color, flameHtml, restorable, restoreByAd, noteLost };
})();
