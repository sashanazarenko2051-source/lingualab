window.App = window.App || {};

App.storage = (function () {
  const KEY = 'langlearn:v2';

  function defaults() {
    return {
      currentLang: 'en',
      uiLang: 'ru',
      srs: {},
      session: { flashcardsCategory: null, quizCategory: null },
      stats: {
        streak: 0, lastActiveDate: null, history: {}, xp: 0, achievements: [], exams: {},
        weeklyXP: 0, weekKey: null
      },
      lastLesson: null,
      profile: { name: '', animal: 'wolf', color: '#00e5ff' }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      const d = defaults();
      return {
        currentLang: parsed.currentLang || d.currentLang,
        uiLang: parsed.uiLang || d.uiLang,
        srs: parsed.srs || {},
        session: Object.assign({}, d.session, parsed.session),
        stats: Object.assign({}, d.stats, parsed.stats, {
          history: (parsed.stats && parsed.stats.history) || {},
          exams: (parsed.stats && parsed.stats.exams) || {}
        }),
        lastLesson: parsed.lastLesson || null,
        profile: Object.assign({}, d.profile, parsed.profile)
      };
    } catch (e) {
      return defaults();
    }
  }

  const state = load();

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function todayKey(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function touchStreak() {
    const today = todayKey();
    if (state.stats.lastActiveDate === today) return;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = todayKey(y);
    if (state.stats.lastActiveDate === yesterday) {
      state.stats.streak = (state.stats.streak || 0) + 1;
    } else {
      state.stats.streak = 1;
    }
    state.stats.lastActiveDate = today;
    save();
  }

  function recordReview(correct) {
    const key = todayKey();
    if (!state.stats.history[key]) state.stats.history[key] = { reviews: 0, correct: 0 };
    state.stats.history[key].reviews += 1;
    if (correct) state.stats.history[key].correct += 1;
    touchStreak();
    save();
  }

  // ISO 8601 week key (e.g. "2026-W34"), used to bucket XP into weekly
  // leaderboard periods that reset every Monday regardless of locale.
  function isoWeekKey(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const weekNum = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
    return d.getUTCFullYear() + '-W' + String(weekNum).padStart(2, '0');
  }

  function addWeeklyXP(amount) {
    const week = isoWeekKey(new Date());
    if (state.stats.weekKey !== week) {
      state.stats.weekKey = week;
      state.stats.weeklyXP = 0;
    }
    state.stats.weeklyXP = (state.stats.weeklyXP || 0) + amount;
  }

  function getHistory(days) {
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      const entry = state.stats.history[key] || { reviews: 0, correct: 0 };
      out.push({ date: key, reviews: entry.reviews, correct: entry.correct });
    }
    return out;
  }

  return {
    state,
    save,
    getCurrentLang() { return state.currentLang; },
    setCurrentLang(code) { state.currentLang = code; save(); },
    getUILang() { return state.uiLang; },
    setUILang(code) { state.uiLang = code; save(); },
    getSRS(id) { return state.srs[id] || null; },
    setSRS(id, data) { state.srs[id] = data; save(); },
    recordReview,
    getHistory,
    getLastLesson() { return state.lastLesson; },
    setLastLesson(lang, categoryId, categoryName) {
      state.lastLesson = { lang, categoryId, categoryName };
      save();
    },
    isExamPassed(code, categoryId) {
      return !!(state.stats.exams[code] && state.stats.exams[code][categoryId]);
    },
    setExamPassed(code, categoryId) {
      state.stats.exams[code] = state.stats.exams[code] || {};
      state.stats.exams[code][categoryId] = true;
      save();
    },
    isoWeekKey,
    addWeeklyXP,
    getWeeklyXP() {
      return { xp: state.stats.weeklyXP || 0, week: state.stats.weekKey };
    },
    getProfile() { return state.profile; },
    setProfile(p) {
      state.profile = Object.assign({}, state.profile, p);
      save();
    },
    hasProfile() { return !!(state.profile && state.profile.name); }
  };
})();
