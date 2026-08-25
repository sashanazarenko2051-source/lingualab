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
      <g class="wolf-tail-grp">
        <path d="M70,64 C82,60 92,50 94,32 C99,48 92,62 78,68 C75,67 72,65 70,64 Z" fill="url(#wolfBodyGrad)" stroke="#2b303f" stroke-width="2.2" stroke-linejoin="round"/>
        <ellipse cx="91" cy="34" rx="5.5" ry="4.5" fill="#f2f1ee"/>
      </g>
      <g class="wolf-leg-l"><rect x="32" y="90" width="14" height="26" rx="7" fill="#4b5364" stroke="#2b303f" stroke-width="2.2"/><ellipse cx="39" cy="118" rx="9" ry="5" fill="#363d4a" stroke="#2b303f" stroke-width="1.8"/></g>
      <g class="wolf-leg-r"><rect x="54" y="90" width="14" height="26" rx="7" fill="#4b5364" stroke="#2b303f" stroke-width="2.2"/><ellipse cx="61" cy="118" rx="9" ry="5" fill="#363d4a" stroke="#2b303f" stroke-width="1.8"/></g>
      <ellipse cx="50" cy="68" rx="27" ry="26" fill="url(#wolfBodyGrad)" stroke="#2b303f" stroke-width="2.2"/>
      <ellipse cx="50" cy="77" rx="15" ry="13" fill="#d7dde3"/>
      <g class="wolf-arm-l"><rect x="16" y="58" width="11" height="24" rx="5.5" fill="#4b5364" stroke="#2b303f" stroke-width="2.2"/><ellipse cx="21.5" cy="84" rx="6" ry="5" fill="#363d4a" stroke="#2b303f" stroke-width="1.8"/></g>
      <g class="wolf-arm-r"><rect x="73" y="58" width="11" height="24" rx="5.5" fill="#4b5364" stroke="#2b303f" stroke-width="2.2"/><ellipse cx="78.5" cy="84" rx="6" ry="5" fill="#363d4a" stroke="#2b303f" stroke-width="1.8"/></g>
      <path d="M27,49 Q50,59 73,49 L73,56 Q50,66 27,56 Z" fill="#00c8dc" stroke="#2b303f" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M63,57 L70,57 L67,69 Z" fill="#00a5b9" stroke="#2b303f" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M27,22 C25,10 29,2 35,2 C41,3 43,12 42,23 C37,17 31,17 27,22 Z" fill="#565f70" stroke="#2b303f" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M73,22 C75,10 71,2 65,2 C59,3 57,12 58,23 C63,17 69,17 73,22 Z" fill="#565f70" stroke="#2b303f" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M29,19 C29,12 31,7 35,7 C38,8 39,13 38,18 C35,15 32,15 29,19 Z" fill="#cfd6de"/>
      <path d="M71,19 C71,12 69,7 65,7 C62,8 61,13 62,18 C65,15 68,15 71,19 Z" fill="#cfd6de"/>
      <circle cx="50" cy="32" r="23" fill="url(#wolfHeadGrad)" stroke="#2b303f" stroke-width="2.2"/>
      <ellipse cx="39" cy="21" rx="3.5" ry="2" fill="#ffffff" opacity=".22"/>
      <ellipse cx="34" cy="39" rx="4" ry="2.5" fill="#ff8fab" opacity=".55"/>
      <ellipse cx="66" cy="39" rx="4" ry="2.5" fill="#ff8fab" opacity=".55"/>
      <ellipse cx="50" cy="41" rx="13" ry="10" fill="#d7dde3" stroke="#2b303f" stroke-width="1.8"/>
      <g class="wolf-eye"><circle cx="41" cy="28" r="3" fill="#23272f"/><circle cx="42.2" cy="26.8" r="1" fill="#fff" opacity=".85"/></g>
      <g class="wolf-eye"><circle cx="59" cy="28" r="3" fill="#23272f"/><circle cx="60.2" cy="26.8" r="1" fill="#fff" opacity=".85"/></g>
      <ellipse cx="50" cy="38" rx="3.6" ry="2.5" fill="#23272f"/>
      <path d="M50 40 Q46 46 41 43" stroke="#23272f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M50 40 Q54 46 59 43" stroke="#23272f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
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
