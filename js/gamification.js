window.App = window.App || {};

// XP, levels, and achievements — layered on top of the existing SRS/streak system.
// Awarded every time a flashcard or quiz question is graded (see App.srs.grade).
App.gamification = (function () {
  const XP_CORRECT = 10;
  const XP_WRONG = 0;
  const DAILY_GOAL = 30;
  // Level L starts at LEVEL_STEP * (L-1)^2 XP: level 2 at 100, 5 at 1600,
  // 8 at 4900, 10 at 8100 (was 4x easier: level 8 came after ~120 answers).
  const LEVEL_STEP = 100;

  function levelForXP(xp) {
    return 1 + Math.floor(Math.sqrt((xp || 0) / LEVEL_STEP));
  }
  function xpForLevel(level) {
    return LEVEL_STEP * (level - 1) * (level - 1);
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

  function answersTotal(state) {
    return Object.values(state.stats.history || {}).reduce((n, d) => n + (d.reviews || 0), 0);
  }
  function bestDay(state) {
    return Object.values(state.stats.history || {}).reduce((m, d) => Math.max(m, d.reviews || 0), 0);
  }
  function examsPassed(state) {
    const ex = state.stats.exams || {};
    return Object.keys(ex).reduce((n, code) => n + Object.values(ex[code] || {}).filter(Boolean).length, 0);
  }
  // A topic is complete when every word in it is mastered (any language).
  function topicsDone(state) {
    const per = {};
    for (const id in state.srs) {
      if (!state.srs[id] || state.srs[id].reps < 1) continue;
      const parts = id.split(':');
      const k = parts[0] + ':' + parts[1];
      per[k] = (per[k] || 0) + 1;
    }
    let n = 0;
    for (const k in per) {
      const [code, cat] = k.split(':');
      const total = App.data[code] && App.words.byCategory(code, cat).length;
      if (total && per[k] >= total) n += 1;
    }
    return n;
  }
  function reviewListSize(state) {
    return Object.values(state.reviewList || {}).filter(r => !r.auto).length;
  }

  // value(state) measures progress toward `goal`; howKey explains how to earn
  // it. Titles get { n: goal }, so one template covers a whole series.
  const streakOf = s => s.stats.streak || 0;
  const levelOf = s => levelForXP(s.stats.xp);
  const ACHIEVEMENTS = [
    { id: 'first_word', icon: '🌱', titleKey: 'ach_first_word', howKey: 'ach_how_first', goal: 1, value: s => Object.keys(s.srs).length },
    { id: 'words_10', icon: '🌿', titleKey: 'ach_t_words', howKey: 'ach_how_words', goal: 10, value: masteredCount },
    { id: 'words_50', icon: '📚', titleKey: 'ach_words_50', howKey: 'ach_how_words', goal: 50, value: masteredCount },
    { id: 'words_100', icon: '🎒', titleKey: 'ach_t_words', howKey: 'ach_how_words', goal: 100, value: masteredCount },
    { id: 'words_200', icon: '📖', titleKey: 'ach_words_200', howKey: 'ach_how_words', goal: 200, value: masteredCount },
    { id: 'words_500', icon: '🏰', titleKey: 'ach_t_words', howKey: 'ach_how_words', goal: 500, value: masteredCount },
    { id: 'words_1000', icon: '🏛️', titleKey: 'ach_words_1000', howKey: 'ach_how_words', goal: 1000, value: masteredCount },
    { id: 'streak_3', icon: '🔥', titleKey: 'ach_streak_3', howKey: 'ach_how_streak', goal: 3, value: streakOf },
    { id: 'streak_7', icon: '🔥', titleKey: 'ach_streak_7', howKey: 'ach_how_streak', goal: 7, value: streakOf },
    { id: 'streak_14', icon: '⚡', titleKey: 'ach_t_streak', howKey: 'ach_how_streak', goal: 14, value: streakOf },
    { id: 'streak_30', icon: '🔥', titleKey: 'ach_streak_30', howKey: 'ach_how_streak', goal: 30, value: streakOf },
    { id: 'streak_100', icon: '💯', titleKey: 'ach_t_streak', howKey: 'ach_how_streak', goal: 100, value: streakOf },
    { id: 'answers_100', icon: '✍️', titleKey: 'ach_t_answers', howKey: 'ach_how_answers', goal: 100, value: answersTotal },
    { id: 'answers_1000', icon: '📝', titleKey: 'ach_t_answers', howKey: 'ach_how_answers', goal: 1000, value: answersTotal },
    { id: 'answers_5000', icon: '🖋️', titleKey: 'ach_t_answers', howKey: 'ach_how_answers', goal: 5000, value: answersTotal },
    { id: 'day_30', icon: '🎯', titleKey: 'ach_t_day', howKey: 'ach_how_day', goal: 30, value: bestDay },
    { id: 'day_100', icon: '🏃', titleKey: 'ach_t_day', howKey: 'ach_how_day', goal: 100, value: bestDay },
    { id: 'topic_1', icon: '🏁', titleKey: 'ach_t_topic', howKey: 'ach_how_topic', goal: 1, value: topicsDone },
    { id: 'topic_5', icon: '🗺️', titleKey: 'ach_t_topic', howKey: 'ach_how_topic', goal: 5, value: topicsDone },
    { id: 'exam_1', icon: '🎓', titleKey: 'ach_t_exam', howKey: 'ach_how_exam', goal: 1, value: examsPassed },
    { id: 'exam_5', icon: '🏅', titleKey: 'ach_t_exam', howKey: 'ach_how_exam', goal: 5, value: examsPassed },
    { id: 'list_5', icon: '📌', titleKey: 'ach_t_list', howKey: 'ach_how_list', goal: 5, value: reviewListSize },
    { id: 'level_3', icon: '✨', titleKey: 'ach_t_level', howKey: 'ach_how_level', goal: 3, value: levelOf },
    { id: 'level_5', icon: '⭐', titleKey: 'ach_level_5', howKey: 'ach_how_level', goal: 5, value: levelOf },
    { id: 'level_10', icon: '🌟', titleKey: 'ach_level_10', howKey: 'ach_how_level', goal: 10, value: levelOf },
    { id: 'level_15', icon: '🚀', titleKey: 'ach_t_level', howKey: 'ach_how_level', goal: 15, value: levelOf },
    { id: 'level_20', icon: '👑', titleKey: 'ach_t_level', howKey: 'ach_how_level', goal: 20, value: levelOf },
    { id: 'polyglot_2', icon: '🗣️', titleKey: 'ach_t_poly', howKey: 'ach_how_polyglot', goal: 2, value: languagesTouched },
    { id: 'polyglot_3', icon: '🌍', titleKey: 'ach_polyglot_3', howKey: 'ach_how_polyglot', goal: 3, value: languagesTouched },
    { id: 'polyglot_5', icon: '🌐', titleKey: 'ach_t_poly', howKey: 'ach_how_polyglot', goal: 5, value: languagesTouched }
  ];
  ACHIEVEMENTS.forEach(a => { a.check = s => a.value(s) >= a.goal; });

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

    App.storage.addWeeklyXP(amount);

    const newAchievements = [];
    ACHIEVEMENTS.forEach(a => {
      if (!state.stats.achievements.includes(a.id) && a.check(state)) {
        state.stats.achievements.push(a.id);
        newAchievements.push(a);
      }
    });

    App.storage.save();
    if (App.cloud && App.cloud.scheduleSync) App.cloud.scheduleSync();
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
