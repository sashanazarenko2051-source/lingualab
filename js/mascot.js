window.App = window.App || {};

// A small floating mascot (wolf) that reacts to your progress and offers
// rotating tips — click it to hear something new, Duolingo-style.
App.mascot = (function () {
  // Cartoon wolf drawn as inline SVG (head, ears, snout, arms, legs, tail) so
  // it can have a full body with independently animated limbs — a single
  // emoji glyph can't do that.
  const WOLF_SVG = `
    <svg class="wolf-figure" viewBox="0 0 100 130" width="72" height="94" aria-hidden="true">
      <defs>
        <linearGradient id="wolfBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8b95a6"/><stop offset="1" stop-color="#565f70"/>
        </linearGradient>
        <linearGradient id="wolfHeadGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#959fb0"/><stop offset="1" stop-color="#6b7688"/>
        </linearGradient>
      </defs>
      <g class="wolf-tail-grp"><path d="M74 66 Q94 58 90 40 Q88 56 72 62 Z" fill="#4b5364"/></g>
      <g class="wolf-leg-l"><rect x="32" y="90" width="14" height="26" rx="7" fill="#4b5364"/><ellipse cx="39" cy="118" rx="9" ry="5" fill="#363d4a"/></g>
      <g class="wolf-leg-r"><rect x="54" y="90" width="14" height="26" rx="7" fill="#4b5364"/><ellipse cx="61" cy="118" rx="9" ry="5" fill="#363d4a"/></g>
      <ellipse cx="50" cy="68" rx="27" ry="26" fill="url(#wolfBodyGrad)"/>
      <ellipse cx="50" cy="76" rx="15" ry="14" fill="#d7dde3"/>
      <g class="wolf-arm-l"><rect x="16" y="58" width="11" height="24" rx="5.5" fill="#4b5364"/><ellipse cx="21.5" cy="84" rx="6" ry="5" fill="#363d4a"/></g>
      <g class="wolf-arm-r"><rect x="73" y="58" width="11" height="24" rx="5.5" fill="#4b5364"/><ellipse cx="78.5" cy="84" rx="6" ry="5" fill="#363d4a"/></g>
      <polygon points="28,20 34,2 43,23" fill="#565f70"/>
      <polygon points="72,20 66,2 57,23" fill="#565f70"/>
      <polygon points="30,18 34,7 40,20" fill="#cfd6de"/>
      <polygon points="70,18 66,7 60,20" fill="#cfd6de"/>
      <circle cx="50" cy="32" r="23" fill="url(#wolfHeadGrad)"/>
      <ellipse cx="34" cy="38" rx="4" ry="2.5" fill="#ff8fab" opacity=".5"/>
      <ellipse cx="66" cy="38" rx="4" ry="2.5" fill="#ff8fab" opacity=".5"/>
      <ellipse cx="50" cy="40" rx="13" ry="10" fill="#d7dde3"/>
      <g class="wolf-eye"><circle cx="41" cy="28" r="3" fill="#23272f"/></g>
      <g class="wolf-eye"><circle cx="59" cy="28" r="3" fill="#23272f"/></g>
      <ellipse cx="50" cy="37" rx="3.4" ry="2.4" fill="#23272f"/>
      <path d="M50 39 Q46 45 41 42" stroke="#23272f" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M50 39 Q54 45 59 42" stroke="#23272f" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </svg>
  `;

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
      <button class="mascot-avatar" id="mascot-avatar" title="${App.t('mascot_tip_1')}">${WOLF_SVG}</button>
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
