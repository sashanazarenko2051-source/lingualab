window.App = window.App || {};
App.views = App.views || {};

(function () {

// Weekly quests (easy → hard), the daily rewards and the weekly review exam.
App.views.quests = {
  render(root) {
    const Q = App.quests;
    const code = App.storage.getCurrentLang();
    const r = (Q.state(), App.storage.state.dailyRewards);
    const goal = App.gamification.DAILY_GOAL;
    const today = App.gamification.todayCount(App.storage.state);
    const tiers = ['easy', 'medium', 'hard'];
    const quests = Q.list();
    const examPassed = Q.state().weeklyExam;
    const examWords = Q.weeklyExamWords(code);

    const questHtml = q => {
      const p = Q.progress(q), pct = Math.round((p / q.goal) * 100);
      const ready = Q.done(q) && !Q.claimed(q.id);
      return `
        <div class="quest-card tier-${q.tier}${Q.claimed(q.id) ? ' claimed' : ''}">
          <div class="quest-main">
            <div class="quest-title">${App.t('q_' + q.kind, { n: q.goal })}</div>
            <div class="quest-bar"><i style="width:${pct}%"></i></div>
            <div class="quest-meta">${p} / ${q.goal} · 🪙 ${q.reward.coins} · ⭐ ${q.reward.xp} XP</div>
          </div>
          ${Q.claimed(q.id) ? `<span class="quest-done">✅ ${App.t('quest_claimed')}</span>`
            : `<button class="quiz-next quest-claim" data-claim="${q.id}" ${ready ? '' : 'disabled'}>${App.t('quest_claim')}</button>`}
        </div>`;
    };

    root.innerHTML = `
      <div class="quests-page">
        <h1 class="settings-title">🎯 ${App.t('nav_quests')}</h1>
        <p class="page-sub">${App.t('quests_sub', { d: Q.daysLeft() })}</p>
        <div class="quests-balance">🪙 <b>${App.coins.balance()}</b> <span>${App.t('coins_name')}</span></div>

        <section class="settings-card">
          <h2>☀️ ${App.t('daily_rewards_title')}</h2>
          <div class="quest-card${r.goal ? ' claimed' : ''}">
            <div class="quest-main">
              <div class="quest-title">${App.t('daily_goal_reward', { goal, c: Q.GOAL_REWARD.coins })}</div>
              <div class="quest-bar"><i style="width:${Math.min(100, Math.round(today / goal * 100))}%"></i></div>
              <div class="quest-meta">${Math.min(today, goal)} / ${goal}</div>
            </div>
            ${r.goal ? `<span class="quest-done">✅</span>` : ''}
          </div>
          <div class="quest-card${r.reco ? ' claimed' : ''}">
            <div class="quest-main">
              <div class="quest-title">${App.t('reco_goal_reward', { goal: goal * Q.RECO_REWARD.factor, c: Q.RECO_REWARD.coins, x: Q.RECO_REWARD.xp })}</div>
              <div class="quest-bar"><i style="width:${Math.min(100, Math.round(today / (goal * Q.RECO_REWARD.factor) * 100))}%"></i></div>
              <div class="quest-meta">${Math.min(today, goal * Q.RECO_REWARD.factor)} / ${goal * Q.RECO_REWARD.factor}</div>
            </div>
            ${r.reco ? `<span class="quest-done">✅</span>` : ''}
          </div>
          <div class="quest-note">🆙 ${App.t('coins_level_note', { n: Q.LEVEL_REWARD })}</div>
        </section>

        <section class="settings-card">
          <h2>📝 ${App.t('q_weekly')}</h2>
          <p class="settings-hint">${App.t('weekly_exam_sub', { n: Q.WEEKLY_EXAM.size, c: Q.WEEKLY_EXAM.coins, x: Q.WEEKLY_EXAM.xp })}</p>
          <div class="quest-card tier-hard${Q.claimed('weekly_exam') ? ' claimed' : ''}">
            <div class="quest-main"><div class="quest-title">${examPassed ? '🎓 ' + App.t('exam_result_pass') : App.ui.langLabel(code)}</div>
              ${examWords || examPassed ? '' : `<div class="quest-meta">${App.t('weekly_exam_need', { n: Q.WEEKLY_EXAM.need })}</div>`}</div>
            ${Q.claimed('weekly_exam') ? `<span class="quest-done">✅ ${App.t('quest_claimed')}</span>`
              : examPassed ? `<button class="quiz-next quest-claim" data-claim="weekly_exam">${App.t('quest_claim')}</button>`
              : `<button class="quiz-next quest-claim" id="weekly-exam" ${examWords ? '' : 'disabled'}>${App.t('weekly_exam_btn')}</button>`}
          </div>
        </section>

        ${tiers.map(t => `
          <section class="settings-card">
            <h2>${t === 'easy' ? '🟢' : t === 'medium' ? '🟡' : '🔴'} ${App.t('quests_tier_' + t)}</h2>
            ${quests.filter(q => q.tier === t).map(questHtml).join('')}
          </section>`).join('')}
      </div>`;

    root.querySelectorAll('[data-claim]').forEach(b => b.addEventListener('click', () => {
      if (App.quests.claim(b.dataset.claim)) { App.effects.confetti && App.effects.confetti(); App.views.quests.render(root); }
    }));
    const ex = root.querySelector('#weekly-exam');
    if (ex) ex.addEventListener('click', () => { App.session.weeklyExam = true; App.router.go('quiz'); });
  }
};

})();
