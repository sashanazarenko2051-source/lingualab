window.App = window.App || {};

// SM-2 spaced repetition. Quality is 0..5 (Again=1, Hard=3, Good=4, Easy=5).
App.srs = (function () {
  const DAY = 24 * 60 * 60 * 1000;

  function isNew(id) {
    return !App.storage.getSRS(id);
  }

  function isDue(id) {
    const rec = App.storage.getSRS(id);
    if (!rec) return false;
    return rec.due <= Date.now();
  }

  function isMastered(id) {
    const rec = App.storage.getSRS(id);
    return !!rec && rec.reps >= 1;
  }

  function grade(id, quality) {
    const prev = App.storage.getSRS(id) || { ef: 2.5, interval: 0, reps: 0, due: Date.now() };
    let { ef, interval, reps } = prev;

    if (quality < 3) {
      reps = 0;
      interval = 1;
    } else {
      ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
      reps += 1;
      if (reps === 1) interval = 1;
      else if (reps === 2) interval = 6;
      else interval = Math.round(interval * ef);
    }

    const rec = { ef, interval, reps, due: Date.now() + interval * DAY };
    App.storage.setSRS(id, rec);
    App.storage.recordReview(quality >= 3);
    return rec;
  }

  return { isNew, isDue, isMastered, grade };
})();
