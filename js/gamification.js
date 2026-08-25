window.App = window.App || {};

// XP, levels, and achievements — layered on top of the existing SRS/streak system.
// Awarded every time a flashcard or quiz question is graded (see App.srs.grade).
App.gamification = (function () {
  const XP_CORRECT = 10;
  const XP_WRONG = 2;
  const DAILY_GOAL = 15;

  function levelForXP(xp) {
    return 1 + Math.floor(Math.sqrt((xp || 0) / 25));
  }
  function xpForLevel(level) {
    return 25 * (level - 1) * (level - 1);
  }
  function xpProgress(xp) {
    const level = levelForXP(xp);
    const from = xpForLevel(level);
    const to = xpForLevel(level + 1);
    return { level, current: (xp || 0) - from, needed: to - from };
  }

  function masteredCount(state) {
    let n = 0;
    for (const id in state.srs) {
      if (state.srs[id] && state.srs[id].reps >= 1) n += 1;
    }
    return n;
  }

  function languagesTouched(state) {
    const codes = new Set();
    for (const id in state.srs) {
      const code = id.split(':')[0];
      if (code) codes.add(code);
    }
    return codes.size;
  }

  const ACHIEVEMENTS = [
    { id: 'first_word', icon: '🌱', titleKey: 'ach_first_word', check: s => Object.keys(s.srs).length >= 1 },
    { id: 'streak_3', icon: '🔥', titleKey: 'ach_streak_3', check: s => (s.stats.streak || 0) >= 3 },
    { id: 'streak_7', icon: '🔥', titleKey: 'ach_streak_7', check: s => (s.stats.streak || 0) >= 7 },
    { id: 'streak_30', icon: '🔥', titleKey: 'ach_streak_30', check: s => (s.stats.streak || 0) >= 30 },
    { id: 'words_50', icon: '📚', titleKey: 'ach_words_50', check: s => masteredCount(s) >= 50 },
    { id: 'words_200', icon: '📖', titleKey: 'ach_words_200', check: s => masteredCount(s) >= 200 },
    { id: 'words_1000', icon: '🏛️', titleKey: 'ach_words_1000', check: s => masteredCount(s) >= 1000 },
    { id: 'level_5', icon: '⭐', titleKey: 'ach_level_5', check: s => levelForXP(s.stats.xp) >= 5 },
    { id: 'level_10', icon: '🌟', titleKey: 'ach_level_10', check: s => levelForXP(s.stats.xp) >= 10 },
    { id: 'polyglot_3', icon: '🌍', titleKey: 'ach_polyglot_3', check: s => languagesTouched(s) >= 3 }
  ];

  function todayCount(state) {
    const d = new Date();
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const entry = state.stats.history[key];
    return entry ? entry.reviews : 0;
  }

  function addXP(amount) {
    const state = App.storage.state;
    state.stats.xp = state.stats.xp || 0;
    state.stats.achievements = state.stats.achievements || [];

    const prevLevel = levelForXP(state.stats.xp);
    state.stats.xp += amount;
    const level = levelForXP(state.stats.xp);
    const leveledUp = level > prevLevel;

    const newAchievements = [];
    ACHIEVEMENTS.forEach(a => {
      if (!state.stats.achievements.includes(a.id) && a.check(state)) {
        state.stats.achievements.push(a.id);
        newAchievements.push(a);
      }
    });

    App.storage.save();
    return { leveledUp, level, xp: state.stats.xp, newAchievements };
  }

  // Call once per graded answer. Returns what changed so the UI can celebrate it.
  function grade(correct) {
    return addXP(correct ? XP_CORRECT : XP_WRONG);
  }

  // Combo bonus: every 3 correct answers in a row within a lesson earns extra
  // XP (Duolingo-style streak-within-a-lesson reward). Returns null if `combo`
  // isn't a milestone, otherwise the bonus XP awarded plus the usual grade() result.
  const COMBO_STEP = 3;
  const COMBO_BONUS_XP = 5;
  function comboBonus(combo) {
    if (combo < COMBO_STEP || combo % COMBO_STEP !== 0) return null;
    return Object.assign({ bonusXP: COMBO_BONUS_XP, combo }, addXP(COMBO_BONUS_XP));
  }

  const PERFECT_BONUS_XP = 25;
  function perfectLessonBonus() {
    return Object.assign({ bonusXP: PERFECT_BONUS_XP }, addXP(PERFECT_BONUS_XP));
  }

  return {
    DAILY_GOAL,
    ACHIEVEMENTS,
    grade,
    addXP,
    comboBonus,
    perfectLessonBonus,
    levelForXP,
    xpForLevel,
    xpProgress,
    masteredCount,
    todayCount
  };
})();
