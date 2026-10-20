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
      mistakes: {},
      reviewList: {},
      missCount: {},
      friends: [],
      profile: { name: '', animal: 'wolf', color: '#00e5ff' },
      hearts: { count: 20, steps: 0 },
      premium: false,
      settings: { theme: 'neon', custom: {}, scale: 1, bgAnim: true, motion: true, notify: true, notified: {} }
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
        mistakes: parsed.mistakes || {},
        reviewList: parsed.reviewList || {},
        missCount: parsed.missCount || {},
        friends: parsed.friends || [],
        profile: Object.assign({}, d.profile, parsed.profile),
        hearts: Object.assign({}, d.hearts, parsed.hearts),
        premium: !!parsed.premium,
        energy: parsed.energy || null,
        shop: parsed.shop || {},
        settings: Object.assign({}, d.settings, parsed.settings)
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
    // A studied day moves the phone reminders forward.
    if (App.notify) App.notify.reschedule();
  }

  // wordId (optional) also tallies the answer under its language, so the
  // stats page can show accuracy per language.
  function recordReview(correct, wordId) {
    const key = todayKey();
    if (!state.stats.history[key]) state.stats.history[key] = { reviews: 0, correct: 0 };
    const day = state.stats.history[key];
    day.reviews += 1;
    if (correct) day.correct += 1;
    if (wordId) {
      const code = wordId.split(':')[0];
      day.langs = day.langs || {};
      const l = day.langs[code] = day.langs[code] || { reviews: 0, correct: 0 };
      l.reviews += 1;
      if (correct) l.correct += 1;
    }
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
    // Mistakes bank: every wrong answer lands here and keeps coming back in
    // later lessons until it's answered right in two different lessons in a
    // row. Keyed by word id: { misses, streak, lesson, at }.
    recordMistakeAnswer(wordId, correct, lessonId) {
      const rec = state.mistakes[wordId];
      let result = null;
      if (!correct) {
        state.mistakes[wordId] = { misses: (rec ? rec.misses : 0) + 1, streak: 0, lesson: lessonId, at: Date.now() };
        result = rec ? 'again' : 'added';
      } else if (rec && rec.lesson !== lessonId) {
        // Only one correct answer per lesson counts, so a word re-asked a
        // minute later in the same lesson can't clear itself.
        rec.streak += 1;
        rec.lesson = lessonId;
        if (rec.streak >= 2) { delete state.mistakes[wordId]; result = 'fixed'; }
      }
      save();
      return result;
    },
    getMistakeIds(code) {
      return Object.keys(state.mistakes)
        .filter(id => id.startsWith(code + ':'))
        .sort((a, b) => state.mistakes[b].misses - state.mistakes[a].misses || state.mistakes[a].at - state.mistakes[b].at);
    },
    isMistake(wordId) { return !!state.mistakes[wordId]; },
    removeMistake(wordId) { delete state.mistakes[wordId]; save(); },

    // Personal review list ("My words"). Learners add words themselves;
    // words reaching AUTO_REVIEW_MISSES total mistakes are added
    // automatically and leave again after AUTO_REVIEW_CORRECT correct answers.
    AUTO_REVIEW_MISSES: 5,
    AUTO_REVIEW_CORRECT: 5,
    trackReviewList(wordId, correct) {
      const rec = state.reviewList[wordId];
      if (!correct) {
        state.missCount[wordId] = (state.missCount[wordId] || 0) + 1;
        if (rec) rec.ok = 0;
        else if (state.missCount[wordId] >= this.AUTO_REVIEW_MISSES) state.reviewList[wordId] = { auto: true, ok: 0, at: Date.now() };
      } else if (rec) {
        rec.ok = (rec.ok || 0) + 1;
        if (rec.auto && rec.ok >= this.AUTO_REVIEW_CORRECT) {
          delete state.reviewList[wordId];
          state.missCount[wordId] = 0;
        }
      }
      save();
    },
    addToReview(wordId) {
      if (!state.reviewList[wordId]) state.reviewList[wordId] = { auto: false, ok: 0, at: Date.now() };
      else state.reviewList[wordId].auto = false;
      save();
    },
    // Removing a word by hand also resets its miss count, so it isn't
    // re-added automatically on the very next mistake.
    removeFromReview(wordId) { delete state.reviewList[wordId]; state.missCount[wordId] = 0; save(); },
    inReview(wordId) { return state.reviewList[wordId] || null; },

    // Friends are a local list of cloud uids (see views/friends.js).
    getFriends() { return state.friends.slice(); },
    isFriend(uid) { return state.friends.includes(uid); },
    addFriend(uid) { if (!state.friends.includes(uid)) { state.friends.push(uid); save(); } },
    removeFriend(uid) { state.friends = state.friends.filter(id => id !== uid); save(); },
    getReviewIds(code) {
      return Object.keys(state.reviewList).filter(id => id.startsWith(code + ':'))
        .sort((a, b) => state.reviewList[b].at - state.reviewList[a].at);
    },
    getMissCount(wordId) { return state.missCount[wordId] || 0; },
    // Starts a topic over: forgets its words' schedule, its mistakes and its
    // exam. XP, streak, history and achievements are kept.
    resetTopic(code, categoryId) {
      const prefix = code + ':' + categoryId + ':';
      Object.keys(state.srs).forEach(id => { if (id.startsWith(prefix)) delete state.srs[id]; });
      Object.keys(state.mistakes).forEach(id => { if (id.startsWith(prefix)) delete state.mistakes[id]; });
      Object.keys(state.missCount).forEach(id => { if (id.startsWith(prefix)) delete state.missCount[id]; });
      Object.keys(state.reviewList).forEach(id => { if (id.startsWith(prefix) && state.reviewList[id].auto) delete state.reviewList[id]; });
      if (state.stats.exams[code]) delete state.stats.exams[code][categoryId];
      save();
    },
    getProfile() { return state.profile; },
    setProfile(p) {
      state.profile = Object.assign({}, state.profile, p);
      save();
    },
    hasProfile() { return !!(state.profile && state.profile.name); }
  };
})();
