window.App = window.App || {};

// CEFR tier lookup shared by the course path, the mascot's contextual tips,
// and the weekly leaderboard (which groups competitors by tier).
App.levels = (function () {
  // Mastered words at which a level starts (the end of the previous level's
  // topics, see App.access.LEVEL_GROUPS): A0 → A1 → A2 → B1 → B2.
  const THRESHOLDS = [
    { code: 'A0', min: 0 },
    { code: 'A1', min: 220 },
    { code: 'A2', min: 1540 },
    { code: 'B1', min: 2420 },
    { code: 'B2', min: 4400 }
  ];

  function forWordCount(masteredWords) {
    let level = THRESHOLDS[0].code;
    THRESHOLDS.forEach(t => { if (masteredWords >= t.min) level = t.code; });
    return level;
  }

  function forCurrentLang() {
    const code = App.storage.getCurrentLang();
    const words = App.words.allWords(code);
    const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
    return forWordCount(mastered);
  }

  return { ALL: THRESHOLDS.map(t => t.code), forWordCount, forCurrentLang };
})();
