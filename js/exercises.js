window.App = window.App || {};

// Duolingo-style exercise engine shared by lessons and quizzes.
//
// A session is a list of steps ({ kind, word } or { kind: 'match', words }).
// Each exercise follows the same rhythm: answer -> "Check" -> a green or red
// feedback bar at the bottom -> "Continue". Wrong answers cost a heart and the
// word comes back a few steps later (and goes to the mistakes bank via
// App.lesson.answer).
App.exercises = (function () {
  const MAX_HEARTS = 5;
  const NON_LATIN = ['el', 'ru', 'uk', 'bg', 'sr'];
  const shuffle = (a) => App.lesson.shuffle(a);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let keyHandler = null;
  let currentStep = null;
  function onKey(fn) {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = fn;
    if (fn) document.addEventListener('keydown', fn);
  }

  // ---- text helpers -------------------------------------------------------
  function norm(s) {
    return String(s).toLowerCase().replace(/[.,!?;:"«»„“”¿¡…()]/g, '').replace(/\s+/g, ' ').trim();
  }
  function fold(s) { return norm(s).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function variants(w) { return String(w).split('/').map(v => v.trim()).filter(Boolean); }

  function sameTopic(word) { return App.words.byCategory(word.lang, word.categoryId); }
  function distractors(word, n, key) {
    const k = key || (w => w.w);
    const seen = new Set([k(word)]);
    return shuffle(sameTopic(word)).filter(w => {
      if (w.id === word.id || seen.has(k(w))) return false;
      seen.add(k(w));
      return true;
    }).slice(0, n);
  }
  function meaningOf(w) { return App.words.localizedMeaning(w).w; }

  // Sentence words for tile exercises, without punctuation (which would
  // give away the word order, e.g. a trailing "?" or ",").
  function tokens(sentence) {
    return String(sentence).split(/\s+/).map(t => t.replace(/^[.,!?;:"«»„“”¿¡…()]+|[.,!?;:"«»„“”¿¡…()]+$/g, '')).filter(Boolean);
  }
  function canBuild(word) {
    const m = App.words.localizedMeaning(word);
    const n = tokens(word.ex || '').length;
    return !!(word.ex && m.ex && n >= 3 && n <= 9);
  }
  function canBlank(word) {
    return !!(word.ex && word.ex.toLowerCase().includes(word.w.toLowerCase()) && word.ex.toLowerCase() !== word.w.toLowerCase());
  }
  function canType(word) { return !NON_LATIN.includes(word.lang) && word.w.length <= 24; }

  // Non-ASCII letters used by a language, for the accent buttons under the
  // typing field (cached per language).
  const accentCache = {};
  function accentLetters(code) {
    if (!accentCache[code]) {
      const set = new Set();
      App.words.allWords(code).forEach(w => {
        for (const ch of w.w.toLowerCase()) if (ch > '\u007f' && /\p{L}/u.test(ch)) set.add(ch);
      });
      accentCache[code] = [...set].sort().slice(0, 14);
    }
    return accentCache[code];
  }

  // A step kind may not fit a word (no example, no voice, non-Latin
  // typing...): fall back to a plain translation choice.
  function resolveKind(step) {
    const w = step.word;
    switch (step.kind) {
      case 'listen': return App.hasVoice(w.lang) ? 'listen' : 'reverse';
      case 'build': return canBuild(w) ? 'build' : 'translate';
      case 'blank': return canBlank(w) ? 'blank' : 'reverse';
      case 'type': return canType(w) ? 'type' : 'translate';
      default: return step.kind;
    }
  }

  // ---- runner -------------------------------------------------------------
  // opts: { root, steps, code, lessonId, hearts (bool), onFinish(state), onOutOfHearts(state), onExit() }
  function run(opts) {
    const state = {
      steps: opts.steps, index: 0, code: opts.code, lessonId: opts.lessonId,
      hearts: MAX_HEARTS, useHearts: opts.hearts !== false, combo: 0,
      correct: 0, tested: 0, learned: 0, repeats: {}, tally: { added: 0, fixed: 0 },
      startedAt: Date.now()
    };
    renderStep(opts, state);
    return state;
  }

  function topbarHtml(state, accent) {
    const pct = Math.round((state.index / state.steps.length) * 100);
    return `
      <div class="ex-topbar">
        <button class="ex-close" id="ex-close" title="${App.t('back_btn_title')}">✕</button>
        <div class="ex-progress"><div class="ex-progress-fill" style="width:${pct}%; background:${accent}"></div></div>
        ${state.useHearts ? `<div class="ex-hearts" id="ex-hearts" title="${App.t('hearts_title')}">❤️ <b>${state.hearts}</b></div>` : ''}
        ${state.combo >= 2 ? `<span class="combo-badge">🔥${state.combo}</span>` : ''}
      </div>
    `;
  }

  function badgeHtml(step) {
    if (step.review === 'mistake') return `<span class="lesson-badge lesson-badge-mistake">🔁 ${App.t('lesson_review_mistake')}</span>`;
    if (step.review === 'due') return `<span class="lesson-badge lesson-badge-due">🕐 ${App.t('lesson_review_due')}</span>`;
    return '';
  }

  function renderStep(opts, state) {
    const step = state.steps[state.index];
    currentStep = step;
    const accent = `var(--slot-${App.data[state.code].slot})`;
    const kind = step.kind === 'match' ? 'match' : resolveKind(step);
    const root = opts.root;

    root.innerHTML = `
      <div class="ex-wrap" style="--accent:${accent}">
        ${topbarHtml(state, accent)}
        <div class="ex-body" id="ex-body"></div>
      </div>
      <div class="ex-footer" id="ex-footer"></div>
    `;
    root.querySelector('#ex-close').addEventListener('click', () => { onKey(null); opts.onExit(); });

    const body = root.querySelector('#ex-body');
    const footer = root.querySelector('#ex-footer');
    const ctx = {
      state, accent, body, footer, step,
      // Grades one word; returns nothing. Called once per graded answer.
      answer(word, isCorrect) {
        state.tested += 1;
        if (isCorrect) state.correct += 1;
        App.lesson.answer(state, word, isCorrect);
        isCorrect ? App.effects.correct() : App.effects.wrong();
        App.effects.celebrate(App.gamification.grade(isCorrect));
        if (isCorrect) {
          state.combo += 1;
          const bonus = App.gamification.comboBonus(state.combo);
          if (bonus) { App.effects.comboToast(state.combo); App.effects.celebrate(bonus); }
        } else {
          state.combo = 0;
          if (state.useHearts) {
            state.hearts = Math.max(0, state.hearts - 1);
            App.effects.heartLoss();
            const h = root.querySelector('#ex-hearts');
            if (h) { h.querySelector('b').textContent = state.hearts; h.classList.remove('shake'); void h.offsetWidth; h.classList.add('shake'); }
          }
          requeue(state, word);
        }
      },
      next() {
        onKey(null);
        state.index += 1;
        if (state.useHearts && state.hearts === 0) opts.onOutOfHearts(state);
        else if (state.index >= state.steps.length) opts.onFinish(state);
        else renderStep(opts, state);
      }
    };

    const renderer = RENDER[kind];
    renderer(ctx, step.word || null, step);
    const head = body.querySelector('.ex-head');
    if (head && kind !== 'match') head.insertAdjacentHTML('afterbegin', badgeHtml(step));
  }

  // A missed word comes back as a simple translation 3+ exercises later.
  function requeue(state, word) {
    const seen = state.repeats[word.id] || 0;
    if (seen >= 2) return;
    state.repeats[word.id] = seen + 1;
    let at = Math.min(state.steps.length, state.index + 1 + 3);
    while (at < state.steps.length && state.steps[at].kind === 'intro') at += 1;
    state.steps.splice(at, 0, { kind: seen ? 'reverse' : 'translate', word, review: 'mistake' });
  }

  // ---- footer (check / feedback / continue) -------------------------------
  function footerCheck(ctx, enabled, onCheck) {
    ctx.footer.className = 'ex-footer';
    ctx.footer.innerHTML = `<div class="ex-footer-inner"><span></span><button class="ex-btn" id="ex-check" ${enabled ? '' : 'disabled'}>${App.t('ex_check')}</button></div>`;
    const btn = ctx.footer.querySelector('#ex-check');
    btn.addEventListener('click', () => { if (!btn.disabled) onCheck(); });
    return {
      enable(on) { btn.disabled = !on; },
      trigger() { if (!btn.disabled) onCheck(); }
    };
  }

  function footerFeedback(ctx, ok, detailHtml) {
    ctx.footer.className = 'ex-footer ' + (ok ? 'ex-footer-good' : 'ex-footer-bad');
    ctx.footer.innerHTML = `
      <div class="ex-footer-inner">
        <div class="ex-feedback">
          <div class="ex-feedback-title">${ok ? '✅ ' + App.t('fb_correct') : '❌ ' + App.t('fb_wrong')}</div>
          ${detailHtml ? `<div class="ex-feedback-detail">${detailHtml}</div>` : ''}
        </div>
        <button class="ex-btn" id="ex-continue">${App.t('ex_continue')}</button>
      </div>
    `;
    const btn = ctx.footer.querySelector('#ex-continue');
    btn.focus();
    btn.addEventListener('click', () => ctx.next());
    onKey(e => { if (e.key === 'Enter') { e.preventDefault(); ctx.next(); } });
  }

  function speakBtn(text, code, big) {
    return `<button class="ex-speak ${big ? 'ex-speak-big' : ''}" data-say="${esc(text)}" data-code="${code}" title="${App.t('listen_title')}">🔊</button>`;
  }
  function wireSpeak(scope) {
    scope.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      App.speak(b.dataset.say, b.dataset.code, b.dataset.slow ? 0.55 : undefined);
    }));
  }

  // Generic "pick one of N" exercise. options: [{ key, html, say? }]
  function choice(ctx, { headHtml, options, correctKey, gridClass, detail, word, onPick }) {
    ctx.body.innerHTML = `
      ${headHtml}
      <div class="ex-options ${gridClass || ''}">
        ${options.map((o, i) => `<button class="ex-option" data-key="${esc(o.key)}"><span class="ex-num">${i + 1}</span>${o.html}</button>`).join('')}
      </div>
    `;
    wireSpeak(ctx.body);
    let picked = null;
    const check = () => {
      const ok = picked === correctKey;
      ctx.body.querySelectorAll('.ex-option').forEach(b => {
        b.disabled = true;
        if (b.dataset.key === correctKey) b.classList.add('correct');
        else if (b.dataset.key === picked) b.classList.add('wrong');
      });
      ctx.answer(word, ok);
      App.speak(word.w, word.lang);
      footerFeedback(ctx, ok, ok ? '' : detail);
    };
    const footer = footerCheck(ctx, false, check);
    const btns = [...ctx.body.querySelectorAll('.ex-option')];
    const pick = (b) => {
      if (b.disabled) return;
      btns.forEach(x => x.classList.toggle('selected', x === b));
      picked = b.dataset.key;
      footer.enable(true);
      if (onPick) onPick(b);
    };
    btns.forEach(b => b.addEventListener('click', () => pick(b)));
    onKey(e => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= btns.length) pick(btns[n - 1]);
      else if (e.key === 'Enter') { e.preventDefault(); footer.trigger(); }
    });
  }

  function headHtml(title, extra) {
    return `<div class="ex-head"><div class="ex-title">${title}</div>${extra || ''}</div>`;
  }
  function answerDetail(word) {
    return `${App.t('fb_answer')} <b>${esc(word.w)}</b> — ${esc(meaningOf(word))}`;
  }

  // ---- renderers ----------------------------------------------------------
  const RENDER = {
    intro(ctx, word) {
      const m = App.words.localizedMeaning(word);
      ctx.body.innerHTML = `
        <div class="ex-head"><span class="lesson-badge lesson-badge-new">✨ ${App.t('lesson_new_word')}</span></div>
        <div class="ex-card ex-intro">
          <div class="ex-intro-icon">${App.ui.wordIcon(word.icon)}</div>
          <div class="ex-intro-word">${esc(word.w)} ${speakBtn(word.w, word.lang)}</div>
          <div class="ex-intro-meaning">${esc(m.w)}</div>
          ${word.ex ? `<div class="ex-intro-ex">${esc(word.ex)} ${speakBtn(word.ex, word.lang)}</div>` : ''}
          ${m.ex ? `<div class="ex-intro-ex ex-intro-ex-tr">${esc(m.ex)}</div>` : ''}
        </div>
      `;
      wireSpeak(ctx.body);
      App.speak(word.w, word.lang);
      ctx.footer.className = 'ex-footer';
      ctx.footer.innerHTML = `<div class="ex-footer-inner"><span></span><button class="ex-btn" id="ex-got">${App.t('lesson_got_it')}</button></div>`;
      const go = () => { ctx.state.learned += 1; ctx.next(); };
      const btn = ctx.footer.querySelector('#ex-got');
      btn.focus();
      btn.addEventListener('click', go);
      onKey(e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    },

    picture(ctx, word) {
      const others = distractors(word, 3, w => w.icon + '|' + w.w);
      const opts = shuffle([word, ...others]).map(w => ({
        key: w.id,
        html: `<span class="ex-pic">${App.ui.wordIcon(w.icon)}</span><span class="ex-pic-word">${esc(w.w)}</span>`
      }));
      choice(ctx, {
        word, correctKey: word.id, options: opts, gridClass: 'ex-options-pictures',
        headHtml: headHtml(App.t('ex_picture', { w: esc(meaningOf(word)) })),
        detail: answerDetail(word),
        onPick: (b) => { const w = [word, ...others].find(x => x.id === b.dataset.key); if (w) App.speak(w.w, w.lang); }
      });
    },

    translate(ctx, word) {
      const opts = shuffle([word, ...distractors(word, 3)]).map(w => ({ key: w.id, html: esc(w.w) }));
      choice(ctx, {
        word, correctKey: word.id, options: opts,
        headHtml: headHtml(App.t('ex_translate'), `
          <div class="ex-prompt"><span class="ex-prompt-icon">${App.ui.wordIcon(word.icon)}</span><span class="ex-prompt-text">${esc(meaningOf(word))}</span></div>`),
        detail: answerDetail(word)
      });
    },

    reverse(ctx, word) {
      const others = distractors(word, 3, meaningOf);
      const opts = shuffle([word, ...others]).map(w => ({ key: w.id, html: esc(meaningOf(w)) }));
      choice(ctx, {
        word, correctKey: word.id, options: opts,
        headHtml: headHtml(App.t('ex_reverse'), `
          <div class="ex-prompt"><span class="ex-prompt-text">${esc(word.w)}</span>${speakBtn(word.w, word.lang)}</div>`),
        detail: answerDetail(word)
      });
      App.speak(word.w, word.lang);
    },

    listen(ctx, word) {
      const opts = shuffle([word, ...distractors(word, 3)]).map(w => ({ key: w.id, html: esc(w.w) }));
      choice(ctx, {
        word, correctKey: word.id, options: opts,
        headHtml: headHtml(App.t('ex_listen'), `
          <div class="ex-listen">
            ${speakBtn(word.w, word.lang, true)}
            <button class="ex-speak ex-speak-slow" data-say="${esc(word.w)}" data-code="${word.lang}" data-slow="1" title="${App.t('ex_slow')}">🐢</button>
          </div>`),
        detail: answerDetail(word)
      });
      setTimeout(() => App.speak(word.w, word.lang), 250);
    },

    blank(ctx, word) {
      const idx = word.ex.toLowerCase().indexOf(word.w.toLowerCase());
      const sentence = esc(word.ex.slice(0, idx)) + '<span class="ex-gap">____</span>' + esc(word.ex.slice(idx + word.w.length));
      const opts = shuffle([word, ...distractors(word, 3)]).map(w => ({ key: w.id, html: esc(w.w) }));
      const m = App.words.localizedMeaning(word);
      choice(ctx, {
        word, correctKey: word.id, options: opts,
        headHtml: headHtml(App.t('ex_blank'), `
          <div class="ex-sentence">${sentence}</div>
          ${m.ex ? `<div class="ex-sentence-tr">${esc(m.ex)}</div>` : ''}`),
        detail: `${App.t('fb_answer')} <b>${esc(word.ex)}</b>`
      });
    },

    type(ctx, word) {
      const letters = accentLetters(word.lang);
      ctx.body.innerHTML = `
        ${headHtml(App.t('ex_type', { lang: App.ui.langName(word.lang) }), `
          <div class="ex-prompt"><span class="ex-prompt-icon">${App.ui.wordIcon(word.icon)}</span><span class="ex-prompt-text">${esc(meaningOf(word))}</span></div>`)}
        <input class="ex-input" id="ex-input" type="text" autocomplete="off" spellcheck="false" placeholder="${App.t('ex_type_placeholder')}">
        ${letters.length ? `<div class="ex-letters">${letters.map(ch => `<button class="ex-letter" data-ch="${ch}">${ch}</button>`).join('')}</div>` : ''}
      `;
      const input = ctx.body.querySelector('#ex-input');
      input.focus();
      const check = () => {
        const given = input.value;
        const exact = variants(word.w).some(v => norm(v) === norm(given));
        const close = !exact && variants(word.w).some(v => fold(v) === fold(given));
        const ok = exact || close;
        input.disabled = true;
        input.classList.add(ok ? 'correct' : 'wrong');
        ctx.answer(word, ok);
        App.speak(word.w, word.lang);
        footerFeedback(ctx, ok, ok
          ? (close ? `${App.t('fb_typo')} <b>${esc(word.w)}</b>` : '')
          : answerDetail(word));
      };
      const footer = footerCheck(ctx, false, check);
      input.addEventListener('input', () => footer.enable(input.value.trim().length > 0));
      ctx.body.querySelectorAll('.ex-letter').forEach(b => b.addEventListener('click', () => {
        const { selectionStart: a, selectionEnd: z, value } = input;
        input.value = value.slice(0, a) + b.dataset.ch + value.slice(z);
        input.focus();
        input.setSelectionRange(a + 1, a + 1);
        footer.enable(true);
      }));
      onKey(e => { if (e.key === 'Enter') { e.preventDefault(); footer.trigger(); } });
    },

    build(ctx, word) {
      const m = App.words.localizedMeaning(word);
      const target = tokens(word.ex);
      const targetNorm = new Set(target.map(norm));
      const extra = shuffle(sameTopic(word).filter(w => w.ex && w.id !== word.id).flatMap(w => tokens(w.ex)))
        .filter(t => !targetNorm.has(norm(t)))
        .filter((t, i, arr) => arr.findIndex(x => norm(x) === norm(t)) === i)
        .slice(0, 2);
      const bank = shuffle([...target, ...extra]).map((t, i) => ({ id: i, t }));
      const chosen = [];
      ctx.body.innerHTML = `
        ${headHtml(App.t('ex_build'), `<div class="ex-prompt"><span class="ex-prompt-text ex-prompt-sentence">${esc(m.ex)}</span></div>`)}
        <div class="ex-answer-line" id="ex-line"></div>
        <div class="ex-bank" id="ex-bank"></div>
      `;
      const line = ctx.body.querySelector('#ex-line');
      const bankEl = ctx.body.querySelector('#ex-bank');
      let locked = false;
      const draw = () => {
        line.innerHTML = chosen.map(c => `<button class="ex-tile" data-id="${c.id}">${esc(c.t)}</button>`).join('');
        bankEl.innerHTML = bank.map(c => `<button class="ex-tile ${chosen.includes(c) ? 'ex-tile-used' : ''}" data-id="${c.id}" ${chosen.includes(c) ? 'disabled' : ''}>${esc(c.t)}</button>`).join('');
        line.querySelectorAll('.ex-tile').forEach(b => b.addEventListener('click', () => {
          if (locked) return;
          chosen.splice(chosen.findIndex(c => c.id === +b.dataset.id), 1); draw();
        }));
        bankEl.querySelectorAll('.ex-tile:not([disabled])').forEach(b => b.addEventListener('click', () => {
          if (locked) return;
          const c = bank.find(x => x.id === +b.dataset.id);
          chosen.push(c); App.speak(c.t, word.lang); draw();
        }));
        footer.enable(chosen.length > 0);
      };
      const check = () => {
        locked = true;
        const ok = norm(chosen.map(c => c.t).join(' ')) === norm(word.ex);
        line.classList.add(ok ? 'correct' : 'wrong');
        ctx.answer(word, ok);
        App.speak(word.ex, word.lang);
        footerFeedback(ctx, ok, ok ? '' : `${App.t('fb_answer')} <b>${esc(word.ex)}</b>`);
      };
      const footer = footerCheck(ctx, false, check);
      draw();
      onKey(e => { if (e.key === 'Enter') { e.preventDefault(); footer.trigger(); } });
    },

    match(ctx, _w, step) {
      const words = step.words;
      const left = shuffle(words), right = shuffle(words);
      ctx.body.innerHTML = `
        ${headHtml(App.t('ex_match'))}
        <div class="ex-match">
          <div class="ex-match-col">${left.map(w => `<button class="ex-option ex-match-item" data-side="l" data-id="${w.id}">${esc(w.w)}</button>`).join('')}</div>
          <div class="ex-match-col">${right.map(w => `<button class="ex-option ex-match-item" data-side="r" data-id="${w.id}">${esc(meaningOf(w))}</button>`).join('')}</div>
        </div>
      `;
      ctx.footer.className = 'ex-footer';
      ctx.footer.innerHTML = `<div class="ex-footer-inner"><span class="ex-hint">${App.t('ex_match_hint')}</span><span></span></div>`;
      let sel = { l: null, r: null };
      let done = 0;
      const missed = new Set();
      const items = [...ctx.body.querySelectorAll('.ex-match-item')];
      const tryPair = () => {
        if (!sel.l || !sel.r) return;
        const a = sel.l, b = sel.r;
        sel = { l: null, r: null };
        const word = words.find(w => w.id === a.dataset.id);
        if (a.dataset.id === b.dataset.id) {
          [a, b].forEach(x => { x.classList.remove('selected'); x.classList.add('correct'); x.disabled = true; });
          // A pair counts as one answer; a word already missed in this
          // exercise stays graded as missed.
          if (!missed.has(word.id)) ctx.answer(word, true);
          done += 1;
          if (done === words.length) footerFeedback(ctx, true, '');
        } else {
          [a, b].forEach(x => { x.classList.remove('selected'); x.classList.add('wrong'); });
          setTimeout(() => [a, b].forEach(x => x.classList.remove('wrong')), 600);
          if (!missed.has(word.id)) { missed.add(word.id); ctx.answer(word, false); }
          if (ctx.state.useHearts && ctx.state.hearts === 0) footerFeedback(ctx, false, '');
        }
      };
      items.forEach(it => it.addEventListener('click', () => {
        if (it.disabled) return;
        const side = it.dataset.side;
        if (sel[side]) sel[side].classList.remove('selected');
        sel[side] = it;
        it.classList.add('selected');
        if (side === 'l') App.speak(words.find(w => w.id === it.dataset.id).w, ctx.state.code);
        tryPair();
      }));
      onKey(null);
    }
  };

  // Drops the exercise keyboard handler (called on every route change).
  function stop() { onKey(null); }

  // The step on screen (for debugging and automated checks).
  function current() { return currentStep; }

  return { run, stop, current, MAX_HEARTS };
})();
