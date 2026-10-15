window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so MAX_HEARTS/heartsHtml/shuffle/renderResult etc. stay
// private to this file — classic <script> tags share one global scope, and a
// same-named top-level const/function in another view file (e.g. quiz.js)
// would otherwise collide with (or silently override) this one.
(function () {

// Hearts are per-lesson stakes: running out ends the lesson (progress and
// mistakes already recorded are kept).
const MAX_HEARTS = 5;
const shuffle = (arr) => App.lesson.shuffle(arr);

function heartsHtml(hearts) {
  return Array.from({ length: MAX_HEARTS }, (_, i) => i < hearts ? '❤️' : '🖤').join('');
}

App.views.flashcards = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const mistakesMode = !!App.session.mistakesMode;
    let categoryId = App.session.flashcardsCategory;
    App.session.flashcardsCategory = null;
    App.session.mistakesMode = false;

    if (!mistakesMode && !categoryId) categoryId = App.lesson.nextCategory(code).id;
    if (categoryId) {
      const cat = App.data[code].categories.find(c => c.id === categoryId);
      if (cat) App.storage.setLastLesson(code, categoryId, cat.name);
    }

    const steps = mistakesMode ? App.lesson.buildMistakesSession(code) : App.lesson.buildLesson(code, categoryId);
    if (!steps.length) {
      root.innerHTML = emptyHtml();
      root.querySelector('[data-go]')?.addEventListener('click', (e) => App.router.go(e.target.dataset.go));
      return;
    }

    const state = {
      steps, index: 0, code, categoryId, mistakesMode, correct: 0, tested: 0, learned: 0,
      repeats: {}, hearts: MAX_HEARTS, combo: 0, lessonId: App.lesson.newLessonId()
    };
    renderStep(root, state);
  }
};

function emptyHtml() {
  return `
    <div class="session-empty">
      <div class="session-empty-icon">🎉</div>
      <div>${App.t('fc_all_done')}</div>
      <div style="margin-top:14px"><button class="action-card" data-go="dashboard" style="display:inline-flex">${App.t('fc_home')}</button></div>
    </div>
  `;
}

// Distractors come from the word's own topic, so a reviewed word from an
// earlier topic still gets plausible wrong options.
function buildOptions(word, code) {
  const pool = App.words.byCategory(code, word.categoryId);
  const others = pool.filter(w => w.id !== word.id && w.w !== word.w);
  return shuffle([word, ...shuffle(others).slice(0, 3)]);
}

// Previous/next words shown at the sides for context only: navigating with
// them let you skip words or answer the same word twice for extra points.
function peekCardHtml(step) {
  if (!step) return `<div class="flashcard-peek flashcard-peek-empty"></div>`;
  const meaning = App.words.localizedMeaning(step.word);
  return `
    <div class="flashcard-peek">
      <div class="peek-icon">${App.ui.wordIcon(step.word.icon)}</div>
      <div class="peek-word">${meaning.w}</div>
    </div>
  `;
}

function topbarHtml(state, accent) {
  const pct = Math.round((state.index / state.steps.length) * 100);
  return `
    <div class="flashcard-topbar">
      <button class="back-btn" id="back-to-course" title="${App.t('back_btn_title')}">${App.t('back_btn')}</button>
      <div class="flashcard-progress-track"><div class="flashcard-progress-fill" style="width:${pct}%; background:${accent}"></div></div>
      <div class="flashcard-progress-num">${state.index + 1} / ${state.steps.length} · ${App.t('quiz_correct_label')}: ${state.correct}</div>
    </div>
    <div class="hearts-row" id="hearts-row" title="${App.t('hearts_title')}">${heartsHtml(state.hearts)}${state.combo >= 2 ? `<span class="combo-badge">🔥${state.combo}</span>` : ''}</div>
  `;
}

function badgeHtml(step) {
  if (step.kind === 'intro') return `<span class="lesson-badge lesson-badge-new">✨ ${App.t('lesson_new_word')}</span>`;
  if (step.review === 'mistake') return `<span class="lesson-badge lesson-badge-mistake">🔁 ${App.t('lesson_review_mistake')}</span>`;
  if (step.review === 'due') return `<span class="lesson-badge lesson-badge-due">🕐 ${App.t('lesson_review_due')}</span>`;
  return '';
}

function advance(root, state) {
  state.index += 1;
  if (state.hearts === 0) renderOutOfHearts(root, state);
  else if (state.index >= state.steps.length) renderResult(root, state);
  else renderStep(root, state);
}

function renderStep(root, state) {
  const step = state.steps[state.index];
  const word = step.word;
  const accent = `var(--slot-${App.data[state.code].slot})`;
  const meaning = App.words.localizedMeaning(word);
  const isIntro = step.kind === 'intro';
  const options = isIntro ? [] : buildOptions(word, state.code);

  root.innerHTML = `
    <div class="flashcard-wrap">
      ${topbarHtml(state, accent)}
      <div class="flashcard-stage">
        ${peekCardHtml(state.steps[state.index - 1])}
        <div class="flashcard ${isIntro ? 'flashcard-intro' : ''}" style="border-color:${accent}; cursor:default">
          ${badgeHtml(step)}
          <div class="flashcard-category">${App.ui.flagChip(state.code)} ${App.ui.categoryName(word.categoryId, word.categoryName)}${isIntro ? '' : ` · ${App.t('fc_how_to_say')} ${App.ui.langName(state.code).toLowerCase()}?`}</div>
          <div class="flashcard-icon-row">
            <div class="flashcard-icon">${App.ui.wordIcon(word.icon)}</div>
            <button class="speak-btn" id="speak" title="${App.t('listen_title')}" style="color:${accent}">🔊</button>
          </div>
          ${isIntro
            ? `<div class="flashcard-word" style="color:${accent}">${word.w}</div>
               <div class="flashcard-meaning">${meaning.w}</div>
               ${word.ex ? `<div class="flashcard-example">${word.ex}</div>` : ''}
               ${meaning.ex ? `<div class="flashcard-example flashcard-example-tr">${meaning.ex}</div>` : ''}`
            : `<div class="flashcard-translation" style="color:${accent}">${meaning.w}</div>
               <div class="flashcard-hint" id="hint">${App.t('fc_choose_correct')}</div>
               ${word.ex ? `<div class="flashcard-example" id="ex" style="display:none">${word.ex}</div>` : ''}
               ${meaning.ex ? `<div class="flashcard-example flashcard-example-tr" id="tex" style="display:none">${meaning.ex}</div>` : ''}`}
        </div>
        ${peekCardHtml(state.steps[state.index + 1])}
      </div>
      ${isIntro
        ? `<div class="intro-actions"><button class="quiz-next" id="got-it">${App.t('lesson_got_it')}</button></div>`
        : `<div class="quiz-options word-options" id="options">
            ${options.map(o => `<button class="quiz-option" data-id="${o.id}">${o.w}</button>`).join('')}
          </div>`}
    </div>
  `;

  root.querySelector('#speak').addEventListener('click', (e) => {
    e.stopPropagation();
    App.speak(word.w, state.code);
  });
  root.querySelector('#back-to-course').addEventListener('click', () => App.router.go('course'));

  if (isIntro) {
    App.speak(word.w, state.code);
    const gotIt = root.querySelector('#got-it');
    gotIt.focus();
    gotIt.addEventListener('click', () => { state.learned += 1; advance(root, state); });
    return;
  }

  let answered = false;
  root.querySelectorAll('.word-options .quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;

      const isCorrect = btn.dataset.id === word.id;
      state.tested += 1;
      if (isCorrect) state.correct += 1;

      root.querySelectorAll('.word-options .quiz-option').forEach(b => {
        b.disabled = true;
        if (b.dataset.id === word.id) b.classList.add('correct');
        else if (b === btn) b.classList.add('wrong');
      });

      root.querySelector('#hint').style.display = 'none';
      if (root.querySelector('#ex')) root.querySelector('#ex').style.display = 'block';
      if (root.querySelector('#tex')) root.querySelector('#tex').style.display = 'block';

      App.speak(word.w, state.code);
      App.lesson.answer(state, word, isCorrect);
      isCorrect ? App.effects.correct() : App.effects.wrong();
      App.effects.celebrate(App.gamification.grade(isCorrect));

      if (isCorrect) {
        state.combo += 1;
        const bonus = App.gamification.comboBonus(state.combo);
        if (bonus) {
          App.effects.comboToast(state.combo);
          App.effects.celebrate(bonus);
        }
      } else {
        state.combo = 0;
        state.hearts = Math.max(0, state.hearts - 1);
        App.effects.heartLoss();
        root.querySelector('#hearts-row').classList.add('shake');

        // Ask the missed word again a few cards later in this lesson.
        const seen = state.repeats[word.id] || 0;
        if (seen < 2) {
          state.repeats[word.id] = seen + 1;
          // Never in the middle of a run of new-word introductions.
          let reinsertAt = Math.min(state.steps.length, state.index + 1 + 3);
          while (reinsertAt < state.steps.length && state.steps[reinsertAt].kind === 'intro') reinsertAt += 1;
          state.steps.splice(reinsertAt, 0, { kind: 'test', word, review: 'mistake' });
        }
      }

      // Wrong answers stay on screen longer so the right word can sink in.
      setTimeout(() => advance(root, state), isCorrect ? 1100 : 2200);
    });
  });
}

function summaryHtml(state) {
  const t = state.tally || { added: 0, fixed: 0 };
  const items = [];
  if (state.learned) items.push(`✨ ${App.t('fc_result_new', { n: state.learned })}`);
  if (t.fixed) items.push(`✅ ${App.t('fc_result_fixed', { n: t.fixed })}`);
  if (t.added) items.push(`🔁 ${App.t('fc_result_mistakes', { n: t.added })}`);
  return items.length ? `<div class="lesson-summary">${items.map(i => `<span>${i}</span>`).join('')}</div>` : '';
}

function renderResult(root, state) {
  const pct = state.tested ? Math.round((state.correct / state.tested) * 100) : 100;
  if (state.tested && pct === 100) {
    setTimeout(() => {
      App.effects.perfectToast();
      App.effects.celebrate(App.gamification.perfectLessonBonus());
    }, 300);
  }
  const canQuiz = !state.mistakesMode && state.categoryId;
  root.innerHTML = `
    <div class="quiz-result">
      <div class="quiz-result-score">${pct}%</div>
      <div>${App.t('fc_correct_of', { correct: state.correct, total: state.tested })}</div>
      ${summaryHtml(state)}
      ${canQuiz ? `<div style="margin-top:8px; color:var(--ink-muted); font-size:13px">${App.t('fc_now_tests')}</div>` : ''}
      <div style="margin-top:16px; display:flex; flex-direction:column; gap:10px; align-items:center">
        ${canQuiz ? `<button class="quiz-next" id="to-quiz" style="padding:14px 32px; font-size:15px">${App.t('fc_next_tests')}</button>` : ''}
        <div style="display:flex; gap:10px">
          <button class="action-card" id="fc-again" style="display:inline-flex">${App.t('fc_again')}</button>
          <button class="action-card" data-go="dashboard" style="display:inline-flex">${App.t('fc_home')}</button>
        </div>
      </div>
    </div>
  `;
  root.querySelector('#to-quiz')?.addEventListener('click', () => {
    App.session.quizCategory = state.categoryId;
    App.router.go('quiz');
  });
  root.querySelector('#fc-again').addEventListener('click', () => restart(state));
  root.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => App.router.go(btn.dataset.go));
  });
}

// Re-runs the same topic (a plain go('flashcards') would drop the category).
function restart(state) {
  App.session.flashcardsCategory = state.categoryId;
  App.session.mistakesMode = state.mistakesMode;
  App.router.go('flashcards');
}

function renderOutOfHearts(root, state) {
  root.innerHTML = `
    <div class="quiz-result">
      <div class="hearts-out-icon">💔</div>
      <div class="hearts-out-title">${App.t('hearts_out_title')}</div>
      <div class="hearts-out-sub">${App.t('hearts_out_sub')}</div>
      ${summaryHtml(state)}
      <div style="margin-top:16px; display:flex; flex-direction:column; gap:10px; align-items:center">
        <button class="quiz-next" id="fc-retry" style="padding:14px 32px; font-size:15px">${App.t('hearts_retry')}</button>
        <div style="display:flex; gap:10px">
          <button class="action-card" data-go="course" style="display:inline-flex">${App.t('quiz_course')}</button>
          <button class="action-card" data-go="dashboard" style="display:inline-flex">${App.t('fc_home')}</button>
        </div>
      </div>
    </div>
  `;
  root.querySelector('#fc-retry').addEventListener('click', () => restart(state));
  root.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => App.router.go(btn.dataset.go));
  });
}

})();
