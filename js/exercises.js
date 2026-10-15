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
  // Words of the language the learner has met: answered before (has an SRS
  // record) or introduced earlier in this session. Keyed by normalized form.
  function knownTokens(state) {
    const known = new Map();
    const add = (text) => tokens(text).forEach(t => { if (!known.has(norm(t))) known.set(norm(t), t); });
    const prefix = state.code + ':';
    Object.keys(App.storage.state.srs).forEach(id => {
      if (id.startsWith(prefix)) add(id.split(':').slice(2).join(':'));
    });
    state.seen.forEach(w => add(w));
    return known;
  }

  // A sentence is only built when every word in it is already known — the
  // examples often contain words the course hasn't taught yet.
  function canBuild(word, state) {
    const m = App.words.localizedMeaning(word);
    const toks = tokens(word.ex || '');
    if (!(word.ex && m.ex && toks.length >= 3 && toks.length <= 9)) return false;
    const known = knownTokens(state);
    tokens(word.w).forEach(t => known.set(norm(t), t));
    return toks.every(t => known.has(norm(t)));
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
  function resolveKind(step, state) {
    const w = step.word;
    switch (step.kind) {
      case 'listen': return App.hasVoice(w.lang) ? 'listen' : 'reverse';
      case 'build':
        // Full example sentence only if every word in it is known; otherwise
        // assemble the learned phrase itself when it has several words.
        step.phrase = !canBuild(w, state);
        if (!step.phrase) return 'build';
        return tokens(w.w).length >= 2 && tokens(w.w).length <= 8 ? 'build' : 'reverse';
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
      correct: 0, tested: 0, learned: 0, seen: new Set(), repeats: {}, tally: { added: 0, fixed: 0 },
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
    const kind = step.kind === 'match' ? 'match' : resolveKind(step, state);
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
        ${options.map((o, i) => `<button class="ex-option" data-key="${esc(o.key)}" ${o.say ? `data-option-say="${esc(o.say)}"` : ''}><span class="ex-num">${i + 1}</span>${o.say ? '<span class="ex-option-voice">🔊</span>' : ''}${o.html}</button>`).join('')}
      </div>
    `;
    wireSpeak(ctx.body);
    let picked = null;
    const check = () => {
      const ok = picked === correctKey;
      ctx.body.querySelector('.ex-options').classList.add('ex-answered');
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
      if (b.dataset.optionSay) App.speak(b.dataset.optionSay, word.lang);
      if (onPick) onPick(b);
    };
    btns.forEach(b => b.addEventListener('click', () => pick(b)));
    onKey(e => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= btns.length) pick(btns[n - 1]);
      else if (e.key === 'Enter') { e.preventDefault(); footer.trigger(); }
    });
  }

  function highlight(sentence, phrase) {
    const i = phrase ? sentence.toLowerCase().indexOf(phrase.toLowerCase()) : -1;
    if (i === -1) return esc(sentence);
    return esc(sentence.slice(0, i)) + `<mark class="ex-mark">${esc(sentence.slice(i, i + phrase.length))}</mark>` + esc(sentence.slice(i + phrase.length));
  }

  // The task said by the learner's own avatar in a speech bubble.
  function speechHead(textHtml) {
    const avatar = App.profile ? App.profile.avatarBadgeHtml(App.storage.getProfile(), 64) : '🐺';
    return `<div class="ex-head"><div class="ex-speech"><div class="ex-speech-avatar">${avatar}</div><div class="ex-speech-bubble">${textHtml}</div></div></div>`;
  }

  // The correct answer with the letters the learner missed or got wrong
  // highlighted (character LCS between what was typed and the target).
  function diffHtml(given, target) {
    const a = Array.from(given.toLowerCase()), b = Array.from(target);
    const bl = b.map(c => c.toLowerCase());
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--)
      for (let j = b.length - 1; j >= 0; j--)
        dp[i][j] = a[i] === bl[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const keep = new Array(b.length).fill(false);
    for (let i = 0, j = 0; i < a.length && j < b.length;) {
      if (a[i] === bl[j]) { keep[j] = true; i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return b.map((c, j) => keep[j] || c === ' ' ? esc(c) : `<mark class="ex-diff">${esc(c)}</mark>`).join('');
  }

  function headHtml(title, extra) {
    return `<div class="ex-head"><div class="ex-title">${title}</div>${extra || ''}</div>`;
  }
  function answerDetail(word) {
    return `${App.t('fb_answer')} <b>${esc(word.w)}</b> — ${esc(meaningOf(word))}`;
  }

  // ---- renderers ----------------------------------------------------------
  const RENDER = {
    // New word as a two-sided card: first only the picture and the word (try
    // to guess the meaning), then a tap flips in the translation and the
    // example with the word highlighted. Three dots fill as you listen —
    // a nudge to say it aloud three times.
    intro(ctx, word) {
      const m = App.words.localizedMeaning(word);
      const letters = Array.from(word.w.normalize('NFC'))
        .map((ch, i) => ch === ' ' ? ' ' : `<span class="ex-letter-pop" style="animation-delay:${0.15 + i * 0.045}s">${esc(ch)}</span>`).join('');
      ctx.body.innerHTML = `
        <div class="ex-head"><span class="lesson-badge lesson-badge-new">✨ ${App.t('lesson_new_word')}</span></div>
        <div class="ex-card ex-intro" id="ex-intro" tabindex="0">
          <div class="ex-intro-halo"><div class="ex-intro-icon">${App.ui.wordIcon(word.icon)}</div></div>
          <div class="ex-intro-word"><span>${letters}</span> ${speakBtn(word.w, word.lang)}</div>
          <div class="ex-say">
            <span>🗣 ${App.t('ex_say_aloud')}</span>
            <span class="ex-say-dots"><i></i><i></i><i></i></span>
          </div>
          <div class="ex-intro-hint" id="ex-hint">👆 ${App.t('ex_tap_reveal')}</div>
          <div class="ex-intro-back" id="ex-back" hidden>
            <div class="ex-intro-meaning">${esc(m.w)}</div>
            ${word.ex ? `<div class="ex-intro-ex">${highlight(word.ex, word.w)} ${speakBtn(word.ex, word.lang)}</div>` : ''}
            ${m.ex ? `<div class="ex-intro-ex ex-intro-ex-tr">${highlight(m.ex, m.w)}</div>` : ''}
          </div>
        </div>
      `;
      const card = ctx.body.querySelector('#ex-intro');
      const dots = [...ctx.body.querySelectorAll('.ex-say-dots i')];
      let listens = 0;
      const heard = () => { if (listens < dots.length) dots[listens++].classList.add('on'); };
      wireSpeak(ctx.body);
      ctx.body.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', heard));
      App.speak(word.w, word.lang);
      heard();

      let revealed = false;
      ctx.footer.className = 'ex-footer';
      ctx.footer.innerHTML = `<div class="ex-footer-inner"><span></span><button class="ex-btn" id="ex-got">${App.t('ex_show')}</button></div>`;
      const btn = ctx.footer.querySelector('#ex-got');
      const reveal = () => {
        if (revealed) return;
        revealed = true;
        ctx.body.querySelector('#ex-hint').remove();
        ctx.body.querySelector('#ex-back').hidden = false;
        card.classList.add('ex-intro-revealed');
        btn.textContent = App.t('lesson_got_it');
      };
      const go = () => {
        if (!revealed) { reveal(); return; }
        ctx.state.learned += 1;
        ctx.state.seen.add(word.w);
        ctx.next();
      };
      card.addEventListener('click', (e) => { if (!e.target.closest('[data-say]')) reveal(); });
      btn.focus();
      btn.addEventListener('click', go);
      onKey(e => {
        if (e.key === 'Enter') { e.preventDefault(); go(); }
        else if (e.key === ' ') { e.preventDefault(); reveal(); }
      });
    },

    picture(ctx, word) {
      const others = distractors(word, 3, w => w.icon + '|' + w.w);
      const opts = shuffle([word, ...others]).map(w => ({
        key: w.id,
        html: `<span class="ex-pic-halo"><span class="ex-pic">${App.ui.wordIcon(w.icon)}</span></span><span class="ex-pic-word">${esc(w.w)}</span>`,
        say: w.w
      }));
      choice(ctx, {
        word, correctKey: word.id, options: opts, gridClass: 'ex-options-pictures',
        headHtml: speechHead(App.t('ex_picture', { w: `<b>${esc(meaningOf(word))}</b>` })),
        detail: answerDetail(word)
      });
    },

    translate(ctx, word) {
      const opts = shuffle([word, ...distractors(word, 3)]).map(w => ({ key: w.id, html: esc(w.w), say: w.w }));
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
      const opts = shuffle([word, ...distractors(word, 3)]).map(w => ({ key: w.id, html: esc(w.w), say: w.w }));
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
      const opts = shuffle([word, ...distractors(word, 3)]).map(w => ({ key: w.id, html: esc(w.w), say: w.w }));
      const m = App.words.localizedMeaning(word);
      choice(ctx, {
        word, correctKey: word.id, options: opts,
        headHtml: headHtml(App.t('ex_blank'), `
          <div class="ex-sentence">${sentence}</div>
          ${m.ex ? `<div class="ex-sentence-tr">${esc(m.ex)}</div>` : ''}`),
        detail: `${App.t('fb_answer')} <b>${esc(word.ex)}</b>`
      });
    },

    // Spelling must be exact, diacritics included (case and punctuation
    // don't matter). A diacritics-only slip is still a mistake, but gets its
    // own note; the feedback marks the letters that were missing or wrong.
    // "Hint" fills in the next correct letter.
    type(ctx, word) {
      const letters = accentLetters(word.lang);
      const target = variants(word.w)[0].normalize('NFC');
      ctx.body.innerHTML = `
        ${headHtml(App.t('ex_type', { lang: App.ui.langName(word.lang) }), `
          <div class="ex-prompt"><span class="ex-prompt-icon">${App.ui.wordIcon(word.icon)}</span><span class="ex-prompt-text">${esc(meaningOf(word))}</span></div>`)}
        <div class="ex-input-row">
          <input class="ex-input" id="ex-input" type="text" autocomplete="off" spellcheck="false" placeholder="${App.t('ex_type_placeholder')}">
          <button class="ex-hint-btn" id="ex-hint-btn" title="${App.t('ex_hint')}">💡 ${App.t('ex_hint')}</button>
        </div>
        <div class="ex-length">${Array.from(target).map(ch => ch === ' ' ? '<i class="sp"></i>' : '<i></i>').join('')}</div>
        ${letters.length ? `<div class="ex-letters">${letters.map(ch => `<button class="ex-letter" data-ch="${ch}">${ch}</button>`).join('')}</div>` : ''}
      `;
      const input = ctx.body.querySelector('#ex-input');
      const cells = [...ctx.body.querySelectorAll('.ex-length i')];
      input.focus();
      // Letter slots under the field fill as you type, showing the length.
      const paintSlots = () => {
        const n = Array.from(input.value.normalize('NFC')).length;
        cells.forEach((c, i) => c.classList.toggle('on', i < n));
      };
      let done = false;
      const check = () => {
        done = true;
        const given = input.value.normalize('NFC');
        const ok = variants(word.w).some(v => norm(v) === norm(given));
        const accentOnly = !ok && variants(word.w).some(v => fold(v) === fold(given));
        input.disabled = true;
        ctx.body.querySelector('#ex-hint-btn').disabled = true;
        input.classList.add(ok ? 'correct' : 'wrong');
        ctx.answer(word, ok);
        App.speak(word.w, word.lang);
        footerFeedback(ctx, ok, ok ? '' : (accentOnly
          ? `${App.t('fb_typo')} <b>${diffHtml(given, target)}</b>`
          : `${App.t('fb_answer')} <b>${diffHtml(given, target)}</b> — ${esc(meaningOf(word))}`));
      };
      const footer = footerCheck(ctx, false, check);
      const changed = () => { paintSlots(); footer.enable(input.value.trim().length > 0); };
      input.addEventListener('input', changed);
      ctx.body.querySelectorAll('.ex-letter').forEach(b => b.addEventListener('click', () => {
        if (done) return;
        const { selectionStart: a, selectionEnd: z, value } = input;
        input.value = value.slice(0, a) + b.dataset.ch + value.slice(z);
        input.focus();
        input.setSelectionRange(a + 1, a + 1);
        changed();
      }));
      ctx.body.querySelector('#ex-hint-btn').addEventListener('click', () => {
        if (done) return;
        // keep the correct beginning, then add the next correct letter
        const typed = Array.from(input.value.normalize('NFC').toLowerCase());
        const goal = Array.from(target);
        let k = 0;
        while (k < typed.length && k < goal.length && typed[k] === goal[k].toLowerCase()) k += 1;
        input.value = goal.slice(0, Math.min(goal.length, k + 1)).join('');
        input.focus();
        changed();
      });
      onKey(e => { if (e.key === 'Enter') { e.preventDefault(); footer.trigger(); } });
    },

    build(ctx, word, step) {
      const m = App.words.localizedMeaning(word);
      const text = step.phrase ? word.w : word.ex;
      const promptText = step.phrase ? m.w : m.ex;
      const target = tokens(text);
      const targetNorm = new Set(target.map(norm));
      // Decoy tiles are known words too, so nothing unfamiliar shows up.
      const extra = shuffle([...knownTokens(ctx.state).entries()])
        .filter(([n]) => !targetNorm.has(n))
        .map(([, t]) => t)
        .slice(0, 2);
      const bank = shuffle([...target, ...extra]).map((t, i) => ({ id: i, t }));
      const chosen = [];
      ctx.body.innerHTML = `
        ${headHtml(App.t(step.phrase ? 'ex_build_phrase' : 'ex_build'), `<div class="ex-prompt">${step.phrase ? `<span class="ex-prompt-icon">${App.ui.wordIcon(word.icon)}</span>` : ''}<span class="ex-prompt-text ex-prompt-sentence">${esc(promptText)}</span></div>`)}
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
        const ok = norm(chosen.map(c => c.t).join(' ')) === norm(text);
        line.classList.add(ok ? 'correct' : 'wrong');
        ctx.answer(word, ok);
        App.speak(text, word.lang);
        footerFeedback(ctx, ok, ok ? '' : `${App.t('fb_answer')} <b>${esc(text)}</b>`);
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
