window.App = window.App || {};

// A small floating mascot (owl) that reacts to your progress and offers
// rotating tips — click it to hear something new, Duolingo-style.
App.mascot = (function () {
  const CHAR = '🦉';

  const TIP_KEYS = [
    'mascot_tip_1', 'mascot_tip_2', 'mascot_tip_3', 'mascot_tip_4',
    'mascot_tip_5', 'mascot_tip_6', 'mascot_tip_7', 'mascot_tip_8'
  ];

  function contextualMessage() {
    const state = App.storage.state;
    const streak = (state.stats && state.stats.streak) || 0;
    const goal = App.gamification.DAILY_GOAL;
    const done = App.gamification.todayCount(state);

    if (streak >= 3) return App.t('mascot_streak', { streak });
    if (done < goal) return App.t('mascot_daily_goal', { remaining: goal - done });
    return null;
  }

  function randomTip(excludeKey) {
    let key = TIP_KEYS[Math.floor(Math.random() * TIP_KEYS.length)];
    if (TIP_KEYS.length > 1) {
      while (key === excludeKey) key = TIP_KEYS[Math.floor(Math.random() * TIP_KEYS.length)];
    }
    return key;
  }

  function pickInitialMessage() {
    return contextualMessage() || App.t(randomTip());
  }

  function renderWidget(root) {
    root.querySelectorAll('.mascot-widget').forEach(el => el.remove());

    const el = document.createElement('div');
    el.className = 'mascot-widget';
    let lastTipKey = null;
    el.innerHTML = `
      <div class="mascot-bubble" id="mascot-bubble">${pickInitialMessage()}</div>
      <button class="mascot-avatar" id="mascot-avatar" title="${App.t('mascot_tip_1')}">${CHAR}</button>
    `;
    root.appendChild(el);

    el.querySelector('#mascot-avatar').addEventListener('click', () => {
      lastTipKey = randomTip(lastTipKey);
      el.querySelector('#mascot-bubble').textContent = App.t(lastTipKey);
      el.classList.remove('bounce');
      void el.offsetWidth;
      el.classList.add('bounce');
    });

    return el;
  }

  return { renderWidget };
})();
