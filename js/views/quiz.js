window.App = window.App || {};
App.views = App.views || {};

// Exam pass threshold: correct-answer percentage needed to mark a category "passed".
const EXAM_PASS_PCT = 80;
// A single-category exam already covers every word in that category (60 max).
// Level exams pool together several categories (A2 alone is 17 × 60 = 1020
// words) — sitting through a thousand questions isn't realistic, so level
// exams sample a random 60-question cross-section instead of literally everything.
const EXAM_MAX_QUESTIONS = 60;
const MAX_HEARTS = 5;

function heartsHtml(hearts) {
  return Array.from({ length: MAX_HEARTS }, (_, i) => i < hearts ? '❤️' : '🖤').join('');
}

App.views.quiz = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const categoryId = App.session.quizCategory;
    const examCategoryIds = App.session.examCategoryIds;
    const examLevel = App.session.examLevel;
    const isExam = !!App.session.examMode;
    App.session.quizCategory = null;
    App.session.examMode = false;
    App.session.examCategoryIds = null;
    App.session.examLevel = null;

    const pool = examCategoryIds && examCategoryIds.length
      ? examCategoryIds.flatMap(id => App.words.byCategory(code, id))
      : buildPool(code, categoryId);

    if (pool.length < 4) {
      root.innerHTML = `<p class="empty-hint">${App.t('fc_not_enough_words')}</p>`;
      return;
    }

    const questions = buildQuestions(pool, isExam ? Math.min(pool.length, EXAM_MAX_QUESTIONS) : 10);
    const state = { questions, index: 0, correct: 0, answered: false, categoryId, isExam, code, examLevel, examCategoryIds, hearts: MAX_HEARTS, combo: 0 };
    renderQuestion(root, state);
  }
};

function buildPool(code, categoryId) {
  return categoryId ? App.words.byCategory(code, categoryId) : App.words.allWords(code);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(pool, count) {
  const shuffled = shuffle(pool).slice(0, Math.min(count, pool.length));
  return shuffled.map(word => {
    const others = pool.filter(w => w.id !== word.id);
    const distractors = shuffle(others).slice(0, 3);

    if (word.ex) {
      const blanked = blankOut(word.ex, word.w);
      const options = shuffle([word, ...distractors]).map(w => w.w);
      return { type: 'blank', word, prompt: blanked, options, answer: word.w };
    }
    const options = shuffle([word, ...distractors]).map(w => App.words.localizedMeaning(w).w);
    return { type: 'choice', word, prompt: word.w, options, answer: App.words.localizedMeaning(word).w };
  });
}

function blankOut(sentence, target) {
  const idx = sentence.toLowerCase().indexOf(target.toLowerCase());
  if (idx === -1) return sentence;
  return sentence.slice(0, idx) + '____' + sentence.slice(idx + target.length);
}

function renderQuestion(root, state) {
  const q = state.questions[state.index];
  const flag = App.ui.flagChip(App.storage.getCurrentLang());
  state.answered = false;

  root.innerHTML = `
    <div class="flashcard-topbar" style="max-width:560px">
      <button class="back-btn" id="back-to-course" title="${App.t('back_btn_title')}">${App.t('back_btn')}</button>
      <div class="quiz-progress" style="margin:0">${state.isExam ? '🎓' + (state.examLevel ? ' ' + state.examLevel : '') + ' · ' : ''}${state.index + 1} / ${state.questions.length} · ${App.t('quiz_correct_label')}: ${state.correct}</div>
    </div>
    <div class="hearts-row" style="max-width:560px" title="${App.t('hearts_title')}">${heartsHtml(state.hearts)}${state.combo >= 2 ? `<span class="combo-badge">🔥${state.combo}</span>` : ''}</div>
    ${q.type === 'choice'
      ? `<div class="quiz-question">${q.prompt}</div><div class="quiz-question-sub">${flag} ${App.ui.categoryName(q.word.categoryId, q.word.categoryName)} · ${App.t('quiz_choose_translation')}</div>`
      : `<div class="quiz-question">${q.prompt}</div><div class="quiz-question-sub">${flag} ${App.ui.categoryName(q.word.categoryId, q.word.categoryName)} · ${App.t('quiz_choose_missing')}</div>`}
    <div class="quiz-options" id="options">
      ${q.options.map(opt => `<button class="quiz-option" data-opt="${encodeURIComponent(opt)}">${opt}</button>`).join('')}
    </div>
  `;

  root.querySelector('#back-to-course').addEventListener('click', () => App.router.go('course'));

  root.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.answered) return;
      state.answered = true;
      const chosen = decodeURIComponent(btn.dataset.opt);
      const isCorrect = chosen === q.answer;
      if (isCorrect) state.correct += 1;

      root.querySelectorAll('.quiz-option').forEach(b => {
        b.disabled = true;
        const val = decodeURIComponent(b.dataset.opt);
        if (val === q.answer) b.classList.add('correct');
        else if (b === btn) b.classList.add('wrong');
      });

      App.srs.grade(q.word.id, isCorrect ? 4 : 1);
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
        root.querySelector('.hearts-row')?.classList.add('shake');
      }

      setTimeout(() => {
        state.index += 1;
        if (state.index >= state.questions.length) {
          renderResult(root, state);
        } else {
          renderQuestion(root, state);
        }
      }, 700);
    });
  });
}

function findNextCategory(categoryId) {
  if (!categoryId) return null;
  const code = App.storage.getCurrentLang();
  const cats = App.data[code].categories;
  const idx = cats.findIndex(c => c.id === categoryId);
  if (idx === -1 || idx + 1 >= cats.length) return null;
  return cats[idx + 1];
}

function renderResult(root, state) {
  const pct = Math.round((state.correct / state.questions.length) * 100);
  const next = findNextCategory(state.categoryId);
  let examBanner = '';

  if (pct === 100) {
    setTimeout(() => {
      App.effects.perfectToast();
      App.effects.celebrate(App.gamification.perfectLessonBonus());
    }, 300);
  }

  if (state.isExam) {
    const examKey = state.examLevel || state.categoryId;
    const passed = pct >= EXAM_PASS_PCT;
    if (passed) App.storage.setExamPassed(state.code, examKey);
    examBanner = `
      <div class="exam-banner ${passed ? 'exam-pass' : 'exam-fail'}">
        ${passed ? '🎓 ' + App.t('exam_result_pass') : App.t('exam_result_fail', { pct: EXAM_PASS_PCT })}
      </div>
    `;
    if (passed) { App.effects.confetti(); App.effects.levelUp(); }
  }

  root.innerHTML = `
    <div class="quiz-result">
      ${examBanner}
      <div class="quiz-result-score">${pct}%</div>
      <div>${App.t('fc_correct_of', { correct: state.correct, total: state.questions.length })}</div>
      <div style="margin-top:16px; display:flex; flex-direction:column; gap:10px; align-items:center">
        ${next ? `<button class="quiz-next" id="to-next" style="padding:14px 32px; font-size:15px">${App.t('quiz_next_topic', { name: App.ui.categoryName(next.id, next.name) })}</button>` : ''}
        <div style="display:flex; gap:10px">
          ${state.isExam
            ? `<button class="action-card" id="exam-again" style="display:inline-flex">${App.t('fc_again')}</button>`
            : `<button class="action-card" data-go="quiz" style="display:inline-flex">${App.t('fc_again')}</button>`}
          <button class="action-card" data-go="course" style="display:inline-flex">${App.t('quiz_course')}</button>
          <button class="action-card" data-go="dashboard" style="display:inline-flex">${App.t('fc_home')}</button>
        </div>
      </div>
    </div>
  `;
  root.querySelector('#to-next')?.addEventListener('click', () => {
    App.session.flashcardsCategory = next.id;
    App.router.go('flashcards');
  });
  root.querySelector('#exam-again')?.addEventListener('click', () => {
    App.session.examMode = true;
    if (state.examLevel) {
      App.session.examCategoryIds = state.examCategoryIds;
      App.session.examLevel = state.examLevel;
    } else {
      App.session.quizCategory = state.categoryId;
    }
    App.router.go('quiz');
  });
  root.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => App.router.go(btn.dataset.go));
  });
}
