window.App = window.App || {};

// Small celebratory UI candy: beeps (Web Audio, no audio files needed), toasts,
// and a confetti burst. Kept dependency-free so it works the same in the
// pywebview desktop shell and in a plain browser tab.
App.effects = (function () {
  let ctx = null;
  function audioCtx() {
    if (!ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    }
    return ctx;
  }

  function tone(freqs, duration, type) {
    const ac = audioCtx();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume();
    const now = ac.currentTime;
    freqs.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      const start = now + i * duration;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    });
  }

  function correct() { tone([880], 0.12, 'sine'); }
  function wrong() { tone([220, 180], 0.14, 'triangle'); }
  function levelUp() { tone([523, 659, 784, 1047], 0.11, 'sine'); }
  function achievement() { tone([784, 988, 1175], 0.12, 'sine'); }
  function heartLoss() { tone([300, 220], 0.1, 'sawtooth'); }
  function combo() { tone([659, 988], 0.09, 'sine'); }
  function perfect() { tone([659, 831, 988, 1245, 1568], 0.1, 'sine'); }

  function ensureLayer() {
    let el = document.getElementById('fx-layer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fx-layer';
      document.body.appendChild(el);
    }
    return el;
  }

  function toast(html, cls) {
    const layer = ensureLayer();
    const t = document.createElement('div');
    t.className = 'fx-toast' + (cls ? ' ' + cls : '');
    t.innerHTML = html;
    layer.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, 2600);
  }

  function confetti() {
    const layer = ensureLayer();
    const colors = ['#ff5d8f', '#ffd23f', '#4dd0e1', '#7c5cff', '#6fe08c'];
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('div');
      p.className = 'fx-confetti';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.25) + 's';
      p.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
      p.style.setProperty('--spin', (Math.random() * 540 - 270) + 'deg');
      layer.appendChild(p);
      setTimeout(() => p.remove(), 1800);
    }
  }

  // Given the result of App.gamification.grade(), play the right feedback.
  function celebrate(gain) {
    if (gain.leveledUp) {
      levelUp();
      confetti();
      toast(`🎉 <b>${App.t('toast_level_up')}</b><br><span>${App.t('toast_level_up_sub', { level: gain.level })}</span>`, 'fx-toast-level');
    }
    gain.newAchievements.forEach((a, i) => {
      setTimeout(() => {
        achievement();
        confetti();
        toast(`${a.icon} <b>${App.t('toast_achievement')}</b><br><span>${App.t(a.titleKey)}</span>`, 'fx-toast-ach');
      }, gain.leveledUp ? 500 + i * 900 : i * 900);
    });
  }

  function comboToast(comboCount) {
    combo();
    toast(`🔥 <b>${App.t('toast_combo', { combo: comboCount })}</b>`, 'fx-toast-combo');
  }

  function perfectToast() {
    perfect();
    confetti();
    toast(`💯 <b>${App.t('toast_perfect')}</b>`, 'fx-toast-perfect');
  }

  return {
    correct, wrong, levelUp, achievement, heartLoss, combo, perfect,
    toast, confetti, celebrate, comboToast, perfectToast
  };
})();
