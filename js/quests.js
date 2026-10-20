window.App = window.App || {};

// Coins, the in-app currency (App.storage.state.coins), earned by playing:
// the daily goal, the recommended goal, a new level, weekly quests and the
// weekly review exam. They buy hearts, energy and hints in the shop.
App.coins = (function () {
  const listeners = [];
  function balance() { return App.storage.state.coins || 0; }
  function emit() { listeners.forEach(fn => fn(balance())); }
  function onChange(fn) { listeners.push(fn); }
  function add(n, quiet) {
    App.storage.state.coins = balance() + n;
    App.storage.save();
    emit();
    if (!quiet && App.effects) App.effects.toast(`🪙 +${n}`);
  }
  function spend(n) {
    if (balance() < n) { App.effects.toast('🪙 ' + App.t('coins_not_enough')); return false; }
    App.storage.state.coins = balance() - n;
    App.storage.save();
    emit();
    return true;
  }
  function pillHtml() {
    return `<div class="coin-pill clickable" id="topbar-coin-pill" title="${App.t('coins_name')}"><span>🪙</span><b>${balance()}</b></div>`;
  }
  function mountTopbar() {
    const host = document.getElementById('topbar-coins');
    if (!host) return;
    const draw = () => { host.innerHTML = pillHtml(); };
    draw();
    if (host.dataset.bound) return;
    host.dataset.bound = '1';
    onChange(draw);
    host.addEventListener('click', () => App.router.go('quests'));
  }
  return { balance, add, spend, onChange, mountTopbar };
})();

// Weekly quests: a new set every Monday, from easy to hard, picked from a
// pool by the week number. Progress comes from the answer history and a
// few weekly counters (lessons, new words, exams, the weekly review exam).
App.quests = (function () {
  const TIERS = {
    easy:   { coins: 15, xp: 20 },
    medium: { coins: 40, xp: 50 },
    hard:   { coins: 100, xp: 120 }
  };
  const POOL = {
    easy:   [['correct', 50], ['lessons', 2], ['days', 2], ['words', 15]],
    medium: [['correct', 200], ['lessons', 5], ['days', 4], ['words', 40], ['exams', 1]],
    hard:   [['correct', 600], ['lessons', 10], ['days', 6], ['words', 100], ['exams', 3]]
  };
  const WEEKLY_EXAM = { coins: 60, xp: 100, size: 20, need: 8 };
  const GOAL_REWARD = { coins: 10 };
  const RECO_REWARD = { coins: 25, xp: 30, factor: 2 };
  const LEVEL_REWARD = 50;

  function weekKey() { return App.storage.isoWeekKey(new Date()); }
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function st() {
    const s = App.storage.state;
    if (!s.quests || s.quests.week !== weekKey()) s.quests = { week: weekKey(), lessons: 0, words: 0, exams: 0, weeklyExam: false, claimed: {} };
    if (!s.dailyRewards || s.dailyRewards.day !== dayKey()) s.dailyRewards = { day: dayKey(), goal: false, reco: false };
    return s.quests;
  }
  function weekDays() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return dayKey(d); });
  }
  function daysLeft() { return 7 - ((new Date().getDay() + 6) % 7); }

  function metric(kind) {
    const q = st();
    const hist = App.storage.state.stats.history || {};
    if (kind === 'correct') return weekDays().reduce((s, k) => s + ((hist[k] && hist[k].correct) || 0), 0);
    if (kind === 'days') return weekDays().filter(k => hist[k] && hist[k].reviews > 0).length;
    return q[kind] || 0;
  }

  // This week's quests: two from each tier, chosen by the week number.
  function list() {
    const n = parseInt(String(weekKey()).replace(/\D/g, ''), 10) || 0;
    const out = [];
    Object.keys(POOL).forEach((tier, ti) => {
      const pool = POOL[tier];
      const a = (n + ti) % pool.length, b = (n + ti + 2) % pool.length;
      [a, b === a ? (a + 1) % pool.length : b].forEach(i => {
        const [kind, goal] = pool[i];
        out.push({ id: `${tier}_${kind}_${goal}`, tier, kind, goal, reward: TIERS[tier] });
      });
    });
    return out;
  }
  function progress(q) { return Math.min(q.goal, metric(q.kind)); }
  function done(q) { return progress(q) >= q.goal; }
  function claimed(id) { return !!st().claimed[id]; }

  function claim(id) {
    const q = list().find(x => x.id === id) || (id === 'weekly_exam' ? { id, reward: WEEKLY_EXAM } : null);
    if (!q || claimed(id)) return false;
    if (id === 'weekly_exam' ? !st().weeklyExam : !done(q)) return false;
    st().claimed[id] = true;
    App.coins.add(q.reward.coins);
    if (q.reward.xp) App.gamification.addXP(q.reward.xp);
    App.storage.save();
    return true;
  }
  function readyCount() {
    return list().filter(q => done(q) && !claimed(q.id)).length + (st().weeklyExam && !claimed('weekly_exam') ? 1 : 0);
  }

  // Hooks from the lessons.
  function bump(kind, n) { st()[kind] = (st()[kind] || 0) + (n == null ? 1 : n); App.storage.save(); }
  function weeklyExamPassed() { st().weeklyExam = true; App.storage.save(); }

  // After every graded answer: the daily goal and the recommended goal pay out once a day.
  function afterReview() {
    st();
    const r = App.storage.state.dailyRewards;
    const goal = App.gamification.DAILY_GOAL;
    const today = App.gamification.todayCount(App.storage.state);
    if (!r.goal && today >= goal) {
      r.goal = true;
      App.storage.save();
      setTimeout(() => { App.coins.add(GOAL_REWARD.coins, true); App.effects.toast(App.t('coins_daily_goal', { n: GOAL_REWARD.coins })); }, 400);
    }
    if (!r.reco && today >= goal * RECO_REWARD.factor) {
      r.reco = true;
      App.storage.save();
      setTimeout(() => {
        App.coins.add(RECO_REWARD.coins, true);
        App.gamification.addXP(RECO_REWARD.xp);
        App.effects.toast(App.t('coins_reco_goal', { goal: goal * RECO_REWARD.factor, n: RECO_REWARD.coins }));
      }, 900);
    }
  }

  // 20 learned words of the current language for the weekly review exam.
  function weeklyExamWords(code) {
    const learned = App.words.allWords(code).filter(w => !App.srs.isNew(w.id));
    if (learned.length < WEEKLY_EXAM.need) return null;
    return App.lesson.shuffle(learned).slice(0, WEEKLY_EXAM.size);
  }

  return { TIERS, WEEKLY_EXAM, GOAL_REWARD, RECO_REWARD, LEVEL_REWARD, list, progress, done, claimed, claim, readyCount, bump, weeklyExamPassed, afterReview, weeklyExamWords, daysLeft, state: st };
})();
