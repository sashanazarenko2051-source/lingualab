window.App = window.App || {};

// A small floating mascot (wolf) that reacts to your progress, shows word
// cards and offers rotating tips — click it for the next little scene.
// Each scene combines a message, a facial expression ("mood"), an
// accessory and a one-shot animation.
App.mascot = (function () {
  // Cartoon wolf drawn as inline SVG (head, ears, snout, arms, legs, tail) so
  // limbs, face and accessories can be animated and swapped independently —
  // a single emoji glyph can't do that. Alternate eyes/mouths and
  // accessories are hidden groups switched on by mood-*/acc-* classes.
  const WOLF_SVG = `
    <svg class="wolf-figure" viewBox="0 -24 100 154" width="72" height="111" aria-hidden="true">
      <defs>
        <linearGradient id="wolfBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color:var(--wf-b1)"/><stop offset="1" style="stop-color:var(--wf-b2)"/>
        </linearGradient>
        <linearGradient id="wolfHeadGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color:var(--wf-h1)"/><stop offset="1" style="stop-color:var(--wf-h2)"/>
        </linearGradient>
      </defs>
      <g class="wolf-tail-grp">
        <path d="M70,64 C82,60 92,50 94,32 C99,48 92,62 78,68 C75,67 72,65 70,64 Z" fill="url(#wolfBodyGrad)" stroke="#2b303f" stroke-width="2.2" stroke-linejoin="round"/>
        <ellipse cx="91" cy="34" rx="5.5" ry="4.5" fill="#f2f1ee"/>
      </g>
      <g class="wolf-leg-l"><rect x="32" y="90" width="14" height="26" rx="7" style="fill:var(--wf-limb)" stroke="#2b303f" stroke-width="2.2"/><ellipse cx="39" cy="118" rx="9" ry="5" style="fill:var(--wf-paw)" stroke="#2b303f" stroke-width="1.8"/></g>
      <g class="wolf-leg-r"><rect x="54" y="90" width="14" height="26" rx="7" style="fill:var(--wf-limb)" stroke="#2b303f" stroke-width="2.2"/><ellipse cx="61" cy="118" rx="9" ry="5" style="fill:var(--wf-paw)" stroke="#2b303f" stroke-width="1.8"/></g>
      <ellipse cx="50" cy="68" rx="27" ry="26" fill="url(#wolfBodyGrad)" stroke="#2b303f" stroke-width="2.2"/>
      <ellipse cx="50" cy="77" rx="15" ry="13" style="fill:var(--wf-belly)"/>
      <g class="wolf-arm-l"><rect x="16" y="58" width="11" height="24" rx="5.5" style="fill:var(--wf-limb)" stroke="#2b303f" stroke-width="2.2"/><ellipse cx="21.5" cy="84" rx="6" ry="5" style="fill:var(--wf-paw)" stroke="#2b303f" stroke-width="1.8"/></g>
      <g class="wolf-arm-r"><rect x="73" y="58" width="11" height="24" rx="5.5" style="fill:var(--wf-limb)" stroke="#2b303f" stroke-width="2.2"/><ellipse cx="78.5" cy="84" rx="6" ry="5" style="fill:var(--wf-paw)" stroke="#2b303f" stroke-width="1.8"/></g>
      <path d="M27,49 Q50,59 73,49 L73,56 Q50,66 27,56 Z" fill="#00c8dc" stroke="#2b303f" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M63,57 L70,57 L67,69 Z" fill="#00a5b9" stroke="#2b303f" stroke-width="1.5" stroke-linejoin="round"/>
      <g class="wolf-head">
        <path d="M27,26 L29,-3 L46,14 Z" style="fill:var(--wf-ear)" stroke="#2b303f" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M73,26 L71,-3 L54,14 Z" style="fill:var(--wf-ear)" stroke="#2b303f" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M31,19 L31.5,5 L41,14 Z" fill="#f2b8c6"/>
        <path d="M69,19 L68.5,5 L59,14 Z" fill="#f2b8c6"/>
        <path d="M50,9 C64,9 73,17 74,27 L81,35 L73,37 L77,44 L66,45 C61,52 39,52 34,45 L23,44 L27,37 L19,35 L26,27 C27,17 36,9 50,9 Z" fill="url(#wolfHeadGrad)" stroke="#2b303f" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M50,17 C46,22 44,27 45,31 L36,34 C35,42 41,50 50,50 C59,50 65,42 64,34 L55,31 C56,27 54,22 50,17 Z" style="fill:var(--wf-mask)" opacity=".9"/>
        <ellipse cx="39" cy="21" rx="3.5" ry="2" fill="#ffffff" opacity=".22"/>
        <ellipse class="wolf-cheek" cx="34" cy="39" rx="4" ry="2.5" fill="#ff8fab" opacity=".55"/>
        <ellipse class="wolf-cheek" cx="66" cy="39" rx="4" ry="2.5" fill="#ff8fab" opacity=".55"/>
        <path d="M50,32 C57,32 62,36 62,41.5 C62,47.5 56,50.5 50,50.5 C44,50.5 38,47.5 38,41.5 C38,36 43,32 50,32 Z" fill="#f4f6f8" stroke="#2b303f" stroke-width="1.8"/>
        <path d="M36,22 L45,24 M64,22 L55,24" stroke="#2b303f" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
        <!-- eyes: default / wink (right closed) / closed / hearts / big -->
        <g class="eyes-open">
          <g class="wolf-eye"><circle cx="41" cy="28" r="3" fill="#23272f"/><circle cx="42.2" cy="26.8" r="1" fill="#fff" opacity=".85"/></g>
          <g class="wolf-eye wolf-eye-r"><circle cx="59" cy="28" r="3" fill="#23272f"/><circle cx="60.2" cy="26.8" r="1" fill="#fff" opacity=".85"/></g>
        </g>
        <path class="eye-wink" d="M55 29 Q59 25 63 29" stroke="#23272f" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <g class="eyes-closed"><path d="M37 28 Q41 31 45 28" stroke="#23272f" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M55 28 Q59 31 63 28" stroke="#23272f" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>
        <g class="eyes-heart" fill="#ff3d6e"><path d="M41 32 l-4.5-4.5 a2.6 2.6 0 0 1 4.5-3 a2.6 2.6 0 0 1 4.5 3 Z"/><path d="M59 32 l-4.5-4.5 a2.6 2.6 0 0 1 4.5-3 a2.6 2.6 0 0 1 4.5 3 Z"/></g>
        <g class="eyes-big"><circle cx="41" cy="28" r="4.6" fill="#fff" stroke="#23272f" stroke-width="1.6"/><circle cx="41" cy="28.5" r="2.4" fill="#23272f"/><circle cx="59" cy="28" r="4.6" fill="#fff" stroke="#23272f" stroke-width="1.6"/><circle cx="59" cy="28.5" r="2.4" fill="#23272f"/></g>
        <ellipse cx="50" cy="38" rx="3.6" ry="2.5" fill="#23272f"/>
        <g class="mouth-smile">
          <path d="M50 40 Q46 46 41 43" stroke="#23272f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path d="M50 40 Q54 46 59 43" stroke="#23272f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        </g>
        <ellipse class="mouth-o" cx="50" cy="45.5" rx="3" ry="3.6" fill="#23272f"/>
        <g class="mouth-grin"><path d="M42 42 Q50 52 58 42 Z" fill="#23272f"/><path d="M45 45 Q50 49 55 45" fill="#ff8fab"/></g>
        <!-- accessories -->
        <g class="acc acc-party"><path d="M38 12 L50 -20 L62 12 Z" fill="#ff3d6e" stroke="#2b303f" stroke-width="1.8" stroke-linejoin="round"/><path d="M41 4 L59 4 M44 -4 L56 -4" stroke="#ffcf3f" stroke-width="3"/><circle cx="50" cy="-21" r="4" fill="#ffcf3f" stroke="#2b303f" stroke-width="1.4"/></g>
        <g class="acc acc-grad"><path d="M24 6 L50 -6 L76 6 L50 18 Z" fill="#23272f" stroke="#111" stroke-width="1.4"/><rect x="38" y="8" width="24" height="9" rx="2" fill="#23272f"/><path d="M50 6 L70 12 L70 24" stroke="#ffcf3f" stroke-width="2" fill="none"/><circle cx="70" cy="25" r="2.6" fill="#ffcf3f"/></g>
        <g class="acc acc-phones"><path d="M25 34 C25 2 75 2 75 34" stroke="#b829ff" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="19" y="27" width="10" height="16" rx="5" fill="#b829ff" stroke="#2b303f" stroke-width="1.6"/><rect x="71" y="27" width="10" height="16" rx="5" fill="#b829ff" stroke="#2b303f" stroke-width="1.6"/></g>
        <g class="acc acc-glasses" fill="none" stroke="#23272f" stroke-width="1.8"><circle cx="41" cy="28" r="6.5" fill="rgba(255,255,255,.18)"/><circle cx="59" cy="28" r="6.5" fill="rgba(255,255,255,.18)"/><path d="M47.5 28 L52.5 28 M34.5 27 L28 24 M65.5 27 L72 24"/></g>
        <g class="acc acc-shades"><path d="M33 23 H47 Q47 33 40 33 Q33 33 33 23 Z M53 23 H67 Q67 33 60 33 Q53 33 53 23 Z" fill="#111827" stroke="#000" stroke-width="1.2"/><path d="M47 25 H53" stroke="#000" stroke-width="2"/><path d="M36 25 L40 25" stroke="#fff" stroke-width="1.2" opacity=".6"/></g>
        <g class="acc acc-nightcap"><path d="M28 14 Q50 -6 72 14 Q74 6 84 -8 Q86 10 78 16 Z" fill="#5090f8" stroke="#2b303f" stroke-width="1.8" stroke-linejoin="round"/><path d="M27 15 Q50 6 73 15" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="85" cy="-9" r="4.5" fill="#fff" stroke="#2b303f" stroke-width="1.4"/></g>
      </g>
    </svg>
  `;

  const TIP_KEYS = [
    'mascot_tip_1', 'mascot_tip_2', 'mascot_tip_3', 'mascot_tip_4', 'mascot_tip_5', 'mascot_tip_6', 'mascot_tip_7',
    'mascot_tip_8', 'mascot_tip_9', 'mascot_tip_10', 'mascot_tip_11', 'mascot_tip_12', 'mascot_tip_13', 'mascot_tip_14'
  ];
  // Looks for plain tips: expression, accessory, animation, floating effect.
  const TIP_LOOKS = [
    { mood: 'wink', acc: 'shades', anim: 'spin', fx: '✨' },
    { mood: 'happy', acc: '', anim: 'jump', fx: '⭐' },
    { mood: 'love', acc: '', anim: 'love', fx: '❤️' },
    { mood: 'surprised', acc: '', anim: 'jump', fx: '❗' },
    { mood: 'grin', acc: 'phones', anim: 'dance', fx: '🎵' },
    { mood: 'happy', acc: 'grad', anim: 'nod', fx: '📚' },
    { mood: 'wink', acc: '', anim: 'wave', fx: '👋' }
  ];

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // A word the learner already met (to recall), or the next new one (teaser).
  function wordScene() {
    const code = App.storage.getCurrentLang();
    const all = App.words.allWords(code);
    const known = all.filter(w => !App.srs.isNew(w.id));
    if (known.length) {
      const w = pick(known);
      return { kind: 'word', word: w, title: App.t('mascot_word_q'), revealed: false, look: { mood: 'happy', acc: 'glasses', anim: 'think', fx: '❓' } };
    }
    const cat = App.lesson.nextCategory(code);
    const fresh = App.words.byCategory(code, cat.id).filter(w => App.srs.isNew(w.id));
    if (!fresh.length) return null;
    return { kind: 'word', word: fresh[0], title: App.t('mascot_word_soon'), revealed: true, look: { mood: 'grin', acc: 'grad', anim: 'wave', fx: '✨' } };
  }

  function contextScenes() {
    const state = App.storage.state;
    const streak = (state.stats && state.stats.streak) || 0;
    const goal = App.gamification.DAILY_GOAL;
    const done = App.gamification.todayCount(state);
    const mistakes = App.storage.getMistakeIds(App.storage.getCurrentLang()).length;
    const hour = new Date().getHours();
    const out = [];
    if (hour >= 22 || hour < 5) out.push({ text: App.t('mascot_night'), look: { mood: 'sleepy', acc: 'nightcap', anim: 'sleep', fx: '💤' } });
    else if (hour < 11) out.push({ text: App.t('mascot_morning'), look: { mood: 'grin', acc: '', anim: 'wave', fx: '☀️' } });
    else if (hour >= 18) out.push({ text: App.t('mascot_evening'), look: { mood: 'happy', acc: 'phones', anim: 'dance', fx: '🌙' } });
    if (streak >= 3) out.push({ text: App.t('mascot_streak', { streak }), look: { mood: 'love', acc: 'party', anim: 'dance', fx: '🎉' } });
    if (mistakes) out.push({ text: App.t('mascot_mistakes', { n: mistakes }), look: { mood: 'happy', acc: 'glasses', anim: 'nod', fx: '🔁' } });
    if (done < goal) out.push({ text: App.t('mascot_daily_goal', { remaining: goal - done }), look: { mood: 'surprised', acc: '', anim: 'jump', fx: '🎯' } });
    return out;
  }

  function tipScene(excludeKey) {
    let key = pick(TIP_KEYS);
    while (key === excludeKey) key = pick(TIP_KEYS);
    return { text: App.t(key), key, look: pick(TIP_LOOKS) };
  }

  function bubbleHtml(scene) {
    if (scene.kind !== 'word') return esc(scene.text);
    const w = scene.word;
    const m = App.words.localizedMeaning(w);
    return `
      <div class="mascot-word">
        <span class="mw-icon">${App.ui.wordIcon(w.icon)}</span>
        <span class="mw-text">
          <span class="mw-q">${esc(scene.title)}</span>
          <span class="mw-word">${esc(w.w)}</span>
          <span class="mw-tr" ${scene.revealed ? '' : 'hidden'}>${esc(m.w)}</span>
          ${scene.revealed ? '' : `<span class="mw-hint">👆 ${App.t('ex_show')}</span>`}
        </span>
      </div>
    `;
  }

  function renderWidget(root) {
    root.querySelectorAll('.mascot-widget').forEach(el => el.remove());

    const el = document.createElement('div');
    el.className = 'mascot-widget';
    el.innerHTML = `
      <div class="mascot-bubble" id="mascot-bubble"></div>
      <button class="mascot-avatar" id="mascot-avatar">${WOLF_SVG}<span class="mascot-fx" id="mascot-fx"></span></button>
    `;
    root.appendChild(el);
    const bubble = el.querySelector('#mascot-bubble');
    const svg = el.querySelector('.wolf-figure');
    const fx = el.querySelector('#mascot-fx');
    let lastTip = null, lastKind = null, scene = null;
    const SKINS = ['gray', 'brown', 'arctic', 'black', 'red'];
    let skin = 'gray';

    function show(next) {
      scene = next;
      const look = next.look;
      svg.setAttribute('class', `wolf-figure skin-${skin} mood-${look.mood} ${look.acc ? 'acc-on-' + look.acc : ''}`);
      bubble.innerHTML = bubbleHtml(next);
      bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
      el.className = 'mascot-widget';
      void el.offsetWidth;
      el.classList.add('anim-' + look.anim);
      fx.textContent = look.fx || '';
      fx.classList.remove('go'); void fx.offsetWidth; fx.classList.add('go');
    }

    // Rotates through scene types so consecutive clicks feel different.
    function nextScene() {
      const options = [];
      if (lastKind !== 'word') { const ws = wordScene(); if (ws) options.push(ws, ws); }
      if (lastKind !== 'context') contextScenes().forEach(s => options.push(Object.assign({ kind: 'context' }, s)));
      const t = tipScene(lastTip);
      options.push(Object.assign({ kind: 'tip' }, t));
      const s = pick(options);
      lastKind = s.kind;
      if (s.kind === 'tip') lastTip = s.key;
      return s;
    }

    bubble.addEventListener('click', (e) => {
      if (!scene || scene.kind !== 'word') return;
      if (!scene.revealed) {
        scene.revealed = true;
        bubble.innerHTML = bubbleHtml(scene);
        el.className = 'mascot-widget'; void el.offsetWidth; el.classList.add('anim-jump');
        svg.setAttribute('class', `wolf-figure skin-${skin} mood-grin acc-on-glasses`);
      }
    });
    // Each click on the wolf also swaps its coat.
    el.querySelector('#mascot-avatar').addEventListener('click', () => {
      skin = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length];
      show(nextScene());
    });

    const first = contextScenes()[0];
    show(first ? Object.assign({ kind: 'context' }, first) : nextScene());
    return el;
  }

  return { renderWidget };
})();
