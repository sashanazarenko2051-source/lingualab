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
    <svg class="wolf-figure" viewBox="0 -24 100 154" width="72" height="111" aria-hidden="true" style="overflow:visible">
      <defs>
        <linearGradient id="wolfBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color:var(--wf-b1)"/><stop offset="1" style="stop-color:var(--wf-b2)"/>
        </linearGradient>
        <linearGradient id="wolfHeadGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color:var(--wf-h1)"/><stop offset="1" style="stop-color:var(--wf-h2)"/>
        </linearGradient>
      </defs>
      <g class="wolf-tail-grp">
        <path d="M64,98 C86,98 99,82 95,58 C93,48 88,43 84,38 C89,52 85,63 76,68 C69,72 63,78 61,88 Z" fill="url(#wolfBodyGrad)" stroke="#2b303f" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M84,38 C89,44 93,50 94,57 C89,56 86,51 85,46 Z" fill="#f2f1ee"/><path d="M90,70 l6,-2 l-3,5 M88,80 l6,0 l-4,4" stroke="#2b303f" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <g class="wolf-leg-l"><rect x="35" y="102" width="13" height="17" rx="6.5" style="fill:var(--wf-limb)" stroke="#2b303f" stroke-width="2.8"/><ellipse cx="41.5" cy="120" rx="9" ry="5" style="fill:var(--wf-paw)" stroke="#2b303f" stroke-width="2.3"/><circle cx="38.0" cy="119" r="1.3" fill="#f2b8c6"/><circle cx="41.5" cy="118" r="1.3" fill="#f2b8c6"/><circle cx="45.0" cy="119" r="1.3" fill="#f2b8c6"/></g>
      <g class="wolf-leg-r"><rect x="52" y="102" width="13" height="17" rx="6.5" style="fill:var(--wf-limb)" stroke="#2b303f" stroke-width="2.8"/><ellipse cx="58.5" cy="120" rx="9" ry="5" style="fill:var(--wf-paw)" stroke="#2b303f" stroke-width="2.3"/><circle cx="55.0" cy="119" r="1.3" fill="#f2b8c6"/><circle cx="58.5" cy="118" r="1.3" fill="#f2b8c6"/><circle cx="62.0" cy="119" r="1.3" fill="#f2b8c6"/></g>
      <ellipse cx="50" cy="87" rx="25" ry="24" fill="url(#wolfBodyGrad)" stroke="#2b303f" stroke-width="2.8"/><path d="M66,72 C76,82 75,98 62,107 C70,96 71,84 66,72 Z" fill="#000" opacity=".12"/><ellipse cx="38" cy="77" rx="4" ry="6" fill="#fff" opacity=".18" transform="rotate(25 38 77)"/>
      <ellipse cx="50" cy="92" rx="13.5" ry="13" style="fill:var(--wf-belly)"/>
      <path d="M50,104 l-3.4-3.4 a2 2 0 0 1 3.4-2.4 a2 2 0 0 1 3.4 2.4 Z" fill="#ff7a93" opacity=".8"/>
      <g class="wolf-arm-l"><rect x="22" y="74" width="10" height="20" rx="5" style="fill:var(--wf-limb)" stroke="#2b303f" stroke-width="2.8"/><ellipse cx="27" cy="95" rx="6" ry="5" style="fill:var(--wf-paw)" stroke="#2b303f" stroke-width="2.3"/></g>
      <g class="wolf-arm-r"><rect x="68" y="74" width="10" height="20" rx="5" style="fill:var(--wf-limb)" stroke="#2b303f" stroke-width="2.8"/><ellipse cx="73" cy="95" rx="6" ry="5" style="fill:var(--wf-paw)" stroke="#2b303f" stroke-width="2.3"/></g>
      <path d="M29,61 Q50,72 71,61 L50,86 Z" fill="#ff4f6d" stroke="#2b303f" stroke-width="2.3" stroke-linejoin="round"/>
      <circle cx="42" cy="68" r="1.6" fill="#fff"/><circle cx="56" cy="69" r="1.6" fill="#fff"/><circle cx="49" cy="76" r="1.6" fill="#fff"/>
      <g transform="translate(50 58) scale(1.16) translate(-50 -58)"><g class="wolf-head">
        <path d="M22,30 L23,-9 L46,11 Z" style="fill:var(--wf-ear)" stroke="#2b303f" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M78,30 L77,-9 L54,11 Z" style="fill:var(--wf-ear)" stroke="#2b303f" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M27,21 L27.5,0 L40,12 Z" fill="#f2b8c6"/>
        <path d="M73,21 L72.5,0 L60,12 Z" fill="#f2b8c6"/>
        <path d="M50,6 C68,6 80,18 81,31 L89,39 L80,42 L85,50 L72,51 C66,61 34,61 28,51 L15,50 L20,42 L11,39 L19,31 C20,18 32,6 50,6 Z" fill="url(#wolfHeadGrad)" stroke="#2b303f" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M43,8 L46,-1 L50,6 L54,-2 L57,8 Z" fill="url(#wolfHeadGrad)" stroke="#2b303f" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M50,13 L44,31 L56,31 Z" style="fill:var(--wf-mask)" opacity=".9"/>
        <ellipse cx="50" cy="46" rx="17" ry="12.5" style="fill:var(--wf-mask)"/>
        <ellipse class="wolf-cheek" cx="30" cy="43" rx="4.6" ry="2.8" fill="#ff8fab" opacity=".6"/>
        <ellipse class="wolf-cheek" cx="70" cy="43" rx="4.6" ry="2.8" fill="#ff8fab" opacity=".6"/>
        <path d="M34,20 Q39,17 44,20 M56,20 Q61,17 66,20" stroke="#2b303f" stroke-width="1.7" fill="none" stroke-linecap="round" opacity=".8"/>
        <!-- eyes: default / wink (right closed) / closed / hearts / big -->
        <g class="eyes-open">
          <g class="wolf-eye"><ellipse cx="40" cy="30" rx="6" ry="6.8" fill="#fff" stroke="#23272f" stroke-width="1.2"/><ellipse cx="40.6" cy="31" rx="4.1" ry="4.7" fill="#23272f"/><circle cx="38.8" cy="29" r="1.7" fill="#fff"/><circle cx="42.2" cy="33.2" r=".8" fill="#fff"/></g>
          <g class="wolf-eye wolf-eye-r"><ellipse cx="60" cy="30" rx="6" ry="6.8" fill="#fff" stroke="#23272f" stroke-width="1.2"/><ellipse cx="60.6" cy="31" rx="4.1" ry="4.7" fill="#23272f"/><circle cx="58.8" cy="29" r="1.7" fill="#fff"/><circle cx="62.2" cy="33.2" r=".8" fill="#fff"/></g>
        </g>
        <path class="eye-wink" d="M54 31 Q60 26 66 31" stroke="#23272f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <g class="eyes-closed"><path d="M34 30 Q40 35 46 30" stroke="#23272f" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M54 30 Q60 35 66 30" stroke="#23272f" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>
        <g class="eyes-heart" fill="#ff3d6e" stroke="#23272f" stroke-width=".8"><path d="M40 36 l-5.5-5.5 a3.1 3.1 0 0 1 5.5-3.6 a3.1 3.1 0 0 1 5.5 3.6 Z"/><path d="M60 36 l-5.5-5.5 a3.1 3.1 0 0 1 5.5-3.6 a3.1 3.1 0 0 1 5.5 3.6 Z"/></g>
        <g class="eyes-big"><circle cx="40" cy="30" r="7.2" fill="#fff" stroke="#23272f" stroke-width="1.4"/><circle cx="40" cy="30.5" r="2.6" fill="#23272f"/><circle cx="60" cy="30" r="7.2" fill="#fff" stroke="#23272f" stroke-width="1.4"/><circle cx="60" cy="30.5" r="2.6" fill="#23272f"/></g>
        <path d="M45.2,40.5 Q50,37.8 54.8,40.5 Q54.3,44.8 50,45.8 Q45.7,44.8 45.2,40.5 Z" fill="#23272f"/>
        <ellipse cx="48.3" cy="40.6" rx="1.4" ry=".7" fill="#fff" opacity=".6"/>
        <g class="mouth-smile">
          <path d="M50 45.8 L50 48" stroke="#23272f" stroke-width="1.4"/>
          <path d="M43.5,48 Q50,56.5 56.5,48 Z" fill="#8f1d3c" stroke="#23272f" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M46.6,51.6 Q50,55.6 53.4,51.6 Q50,50.2 46.6,51.6 Z" fill="#ff7a93"/>
        </g>
        <ellipse class="mouth-o" cx="50" cy="51" rx="3.2" ry="3.8" fill="#23272f"/>
        <g class="mouth-grin">
          <path d="M40.5,47 Q50,61 59.5,47 Z" fill="#8f1d3c" stroke="#23272f" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M45,52.5 Q50,58 55,52.5 Q50,50.5 45,52.5 Z" fill="#ff7a93"/>
          <path d="M43.2,47.6 L44.6,51 L46,47.9 Z M56.8,47.6 L55.4,51 L54,47.9 Z" fill="#fff"/>
        </g>
        <ellipse cx="38" cy="14" rx="6" ry="3" fill="#fff" opacity=".28" transform="rotate(-20 38 14)"/>
        <path d="M13,40 l-5,-3 M14,46 l-6,1 M87,40 l5,-3 M86,46 l6,1" stroke="#2b303f" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
        <!-- accessories -->
        <g class="acc acc-party"><path d="M38 12 L50 -20 L62 12 Z" fill="#ff3d6e" stroke="#2b303f" stroke-width="2.3" stroke-linejoin="round"/><path d="M41 4 L59 4 M44 -4 L56 -4" stroke="#ffcf3f" stroke-width="3"/><circle cx="50" cy="-21" r="4" fill="#ffcf3f" stroke="#2b303f" stroke-width="1.4"/></g>
        <g class="acc acc-grad"><path d="M24 6 L50 -6 L76 6 L50 18 Z" fill="#23272f" stroke="#111" stroke-width="1.4"/><rect x="38" y="8" width="24" height="9" rx="2" fill="#23272f"/><path d="M50 6 L70 12 L70 24" stroke="#ffcf3f" stroke-width="2" fill="none"/><circle cx="70" cy="25" r="2.6" fill="#ffcf3f"/></g>
        <g class="acc acc-phones"><path d="M25 34 C25 2 75 2 75 34" stroke="#b829ff" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="19" y="27" width="10" height="16" rx="5" fill="#b829ff" stroke="#2b303f" stroke-width="1.6"/><rect x="71" y="27" width="10" height="16" rx="5" fill="#b829ff" stroke="#2b303f" stroke-width="1.6"/></g>
        <g class="acc acc-glasses" fill="none" stroke="#23272f" stroke-width="1.8"><circle cx="41" cy="28" r="6.5" fill="rgba(255,255,255,.18)"/><circle cx="59" cy="28" r="6.5" fill="rgba(255,255,255,.18)"/><path d="M47.5 28 L52.5 28 M34.5 27 L28 24 M65.5 27 L72 24"/></g>
        <g class="acc acc-shades"><path d="M33 23 H47 Q47 33 40 33 Q33 33 33 23 Z M53 23 H67 Q67 33 60 33 Q53 33 53 23 Z" fill="#111827" stroke="#000" stroke-width="1.2"/><path d="M47 25 H53" stroke="#000" stroke-width="2"/><path d="M36 25 L40 25" stroke="#fff" stroke-width="1.2" opacity=".6"/></g>
        <g class="acc acc-nightcap"><path d="M28 14 Q50 -6 72 14 Q74 6 84 -8 Q86 10 78 16 Z" fill="#5090f8" stroke="#2b303f" stroke-width="2.3" stroke-linejoin="round"/><path d="M27 15 Q50 6 73 15" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="85" cy="-9" r="4.5" fill="#fff" stroke="#2b303f" stroke-width="1.4"/></g>
      </g></g>
    </svg>
  `;

  const TIP_KEYS = Array.from({ length: 30 }, (_, i) => 'mascot_tip_' + (i + 1));
  // Looks for plain tips: expression, accessory, animation, floating effect.
  const TIP_LOOKS = [
    { mood: 'wink', acc: 'shades', anim: 'spin', fx: '✨' },
    { mood: 'happy', acc: '', anim: 'jump', fx: '⭐' },
    { mood: 'love', acc: '', anim: 'love', fx: '❤️' },
    { mood: 'surprised', acc: '', anim: 'jump', fx: '❗' },
    { mood: 'grin', acc: 'phones', anim: 'dance', fx: '🎵' },
    { mood: 'happy', acc: 'grad', anim: 'nod', fx: '📚' },
    { mood: 'wink', acc: '', anim: 'wave', fx: '👋' },
    { mood: 'grin', acc: 'party', anim: 'flip', fx: '🤸' },
    { mood: 'happy', acc: '', anim: 'wiggle', fx: '🎈' },
    { mood: 'surprised', acc: '', anim: 'shiver', fx: '❄️' },
    { mood: 'grin', acc: 'shades', anim: 'hop', fx: '🐾' },
    { mood: 'love', acc: '', anim: 'stretch', fx: '🌟' },
    { mood: 'happy', acc: 'phones', anim: 'run', fx: '💨' },
    { mood: 'wink', acc: 'grad', anim: 'flip', fx: '🎓' },
    { mood: 'grin', acc: '', anim: 'howl', fx: '🌕' }
  ];
  // Little moves the wolf makes on its own now and then.
  const IDLE_ANIMS = ['wave', 'wiggle', 'hop', 'nod', 'stretch', 'jump', 'howl', 'flip', 'peek'];

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

  // Cheer lines: one of 20 exclamations + one of 25 sentences = 500 lines.
  const CHEER_FX = ['🎉', '⭐', '💪', '🚀', '🔥', '✨', '🏆', '❤️', '🌟', '👏'];
  function cheerScene() {
    const o = App.t('mascot_cheer_o').split('|'), b = App.t('mascot_cheer_b').split('|');
    const look = Object.assign({}, pick(TIP_LOOKS), { fx: pick(CHEER_FX) });
    return { text: pick(o) + ' ' + pick(b), look };
  }
  // Any word of the language being learned, with its translation.
  function wordOfDayScene() {
    const all = App.words.allWords(App.storage.getCurrentLang());
    if (!all.length) return null;
    return { kind: 'word', word: pick(all), title: App.t('mascot_word_day'), revealed: true, look: { mood: 'grin', acc: pick(['glasses', 'grad', '']), anim: pick(['wave', 'hop', 'nod']), fx: '📖' } };
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
      if (lastKind !== 'cheer') options.push(Object.assign({ kind: 'cheer' }, cheerScene()), Object.assign({ kind: 'cheer' }, cheerScene()));
      if (lastKind !== 'word') { const wd = wordOfDayScene(); if (wd) options.push(wd); }
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

    // Every so often the wolf moves by itself, without changing the bubble.
    const idle = setInterval(() => {
      if (!document.body.contains(el)) { clearInterval(idle); return; }
      if (document.hidden || document.documentElement.classList.contains('reduce-motion')) return;
      el.className = 'mascot-widget'; void el.offsetWidth;
      el.classList.add('anim-' + pick(IDLE_ANIMS));
    }, 14000);

    const first = contextScenes()[0];
    show(first ? Object.assign({ kind: 'context' }, first) : nextScene());
    return el;
  }

  return { renderWidget };
})();
