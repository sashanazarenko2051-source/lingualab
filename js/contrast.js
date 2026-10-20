window.App = window.App || {};

// Keeps every text readable whatever theme or own colors are picked: after
// each render it compares each text's color with the background behind it
// and, when they are too close, shifts the text toward white or black until
// it stands out. Fixes are undone and recomputed whenever the theme changes.
App.contrast = (function () {
  const MIN = 4.5;      // normal text
  const MIN_BIG = 3;    // large / bold text

  function parse(c) {
    if (!c) return null;
    let m = c.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    }
    m = c.match(/color\(srgb ([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s\/]+/).filter(Boolean).map(parseFloat);
      return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1];
    }
    return null;
  }
  function lum([r, g, b]) {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function ratio(a, b) {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function mix(a, b, t) { return [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t); }
  function css(c) { return `rgb(${c.map(v => Math.round(v)).slice(0, 3).join(',')})`; }
  function gradientColors(img) {
    const out = [];
    (img.match(/rgba?\([^)]+\)|color\(srgb [^)]+\)/g) || []).forEach(s => { const c = parse(s); if (c && c[3] > 0.3) out.push(c); });
    return out;
  }

  function topLayer(img) {
    let depth = 0;
    for (let i = 0; i < img.length; i++) {
      if (img[i] === '(') depth++;
      else if (img[i] === ')') depth--;
      else if (img[i] === ',' && depth === 0) return img.slice(0, i);
    }
    return img;
  }

  // The color behind an element: the nearest solid background (or the
  // average of the nearest gradient), blended over what lies further back.
  function backgroundOf(el) {
    const layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && n !== document.body && n !== document.documentElement) {
        // Only the top layer sits behind the text: a lower layer may just
        // paint a gradient frame (border-box), as on the mascot's bubble.
        const g = gradientColors(topLayer(cs.backgroundImage));
        if (g.length) { const avg = [0, 1, 2].map(i => g.reduce((s, c) => s + c[i], 0) / g.length); layers.push(avg.concat(1)); break; }
      }
      const bg = parse(cs.backgroundColor);
      if (bg && bg[3] > 0.05) { layers.push(bg); if (bg[3] >= 0.95) break; }
    }
    let base = parse(getComputedStyle(document.documentElement).getPropertyValue('--page')) || hexish(getComputedStyle(document.documentElement).getPropertyValue('--page')) || [10, 12, 24, 1];
    for (let i = layers.length - 1; i >= 0; i--) base = mix(base, layers[i], layers[i][3]).concat(1);
    return base;
  }
  function hexish(v) {
    v = (v || '').trim();
    const m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return null;
    let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }

  // Moves a color toward white or black (whichever works better) until it
  // reaches the needed contrast.
  function fixColor(fg, bg, need) {
    const white = [255, 255, 255], black = [12, 12, 16];
    const target = ratio(white, bg) >= ratio(black, bg) ? white : black;
    // Light text that must turn dark (or the other way round) goes straight
    // to black / white — the in-between greys look muddy.
    if ((lum(fg) > lum(bg)) !== (target === white)) return target;
    for (let t = 0.1; t <= 1.001; t += 0.1) {
      const c = mix(fg, target, t);
      if (ratio(c, bg) >= need) return c;
    }
    return target;
  }

  function hasOwnText(el) {
    for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    return false;
  }

  function check(el) {
    if (el.closest('svg, .wolf-figure, .flag-chip, .bg-glyph, [aria-hidden="true"]')) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    const size = parseFloat(cs.fontSize) || 14;
    const need = size >= 18 || (size >= 14 && parseInt(cs.fontWeight, 10) >= 700) ? MIN_BIG : MIN;
    const bg = backgroundOf(el);
    const clipped = (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text');
    if (clipped) {
      // Gradient-filled text (the logo): fine only if every stop stands out.
      const stops = gradientColors(cs.backgroundImage);
      const parentBg = el.parentElement ? backgroundOf(el.parentElement) : bg;
      if (stops.length && stops.every(c => ratio(c, parentBg) >= MIN)) return;
      const c = fixColor(stops[0] || [128, 128, 128], parentBg, MIN);
      el.style.setProperty('background', 'none', 'important');
      el.style.setProperty('-webkit-text-fill-color', css(c), 'important');
      el.style.setProperty('color', css(c), 'important');
      el.dataset.cfix = '1';
      return;
    }
    const fg = parse(cs.color);
    if (!fg) return;
    if (fg[3] === 0) {
      // Transparent text painted by a gradient on an ancestor (the logo).
      for (let a = el.parentElement; a; a = a.parentElement) {
        const acs = getComputedStyle(a);
        if (acs.webkitBackgroundClip === 'text' || acs.backgroundClip === 'text') { if (!a.dataset.cfix) check(a); break; }
      }
      return;
    }
    const eff = fg[3] < 1 ? mix(bg, fg, fg[3]) : fg;
    if (ratio(eff, bg) >= need) return;
    el.style.setProperty('color', css(fixColor(eff, bg, need)), 'important');
    el.dataset.cfix = '1';
    el.dataset.cbg = css(bg);
  }

  function unfix(el) {
    el.style.removeProperty('color');
    el.style.removeProperty('background');
    el.style.removeProperty('-webkit-text-fill-color');
    delete el.dataset.cfix;
    delete el.dataset.cbg;
  }

  function run() {
    timer = null;
    const root = document.body;
    if (!root) return;
    const all = root.querySelectorAll('*:not(script):not(style):not(svg *)');
    for (const el of all) {
      // A fix made for another background (a tab that was active, a
      // bubble that changed) is dropped and the text checked again.
      if (el.dataset.cfix) {
        if (!el.dataset.cbg || css(backgroundOf(el)) === el.dataset.cbg) continue;
        unfix(el);
      }
      if (hasOwnText(el) || el.matches('input, select, textarea, .brand > span')) check(el);
    }
  }

  let timer = null;
  function schedule() { if (!timer) timer = setTimeout(run, 120); }

  // After a theme change: drop old fixes and check everything again.
  function refresh() {
    document.querySelectorAll('[data-cfix]').forEach(unfix);
    schedule();
  }

  function start() {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  return { refresh, ratio, parse };
})();
