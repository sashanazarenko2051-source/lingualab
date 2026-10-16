window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so these top-level consts/functions stay private to this
// file — classic <script> tags share one global scope, and a same-named
// top-level const/function in another view file (e.g. flashcards.js) would
// otherwise collide with (or silently override) this one.
(function () {

// Exam pass threshold: correct-answer percentage needed to mark a category "passed".
const EXAM_PASS_PCT = 80;

// Topic quizzes and exams, played by App.exercises. Quizzes mix exercise
// types and pull in words from the mistakes bank; exams test every word of
// a topic (or of a whole level) once and are graded by EXAM_PASS_PCT, so they
// have no hearts.
App.views.quiz = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const meta = {
      code,
      categoryId: App.session.quizCategory,
      examCategoryIds: App.session.examCategoryIds,
      examLevel: App.session.examLevel,
      isExam: !!App.session.examMode
    };
    App.session.quizCategory = null;
    App.session.examMode = false;
    App.session.examCategoryIds = null;
    App.session.examLevel = null;

    let steps;
    if (meta.examCategoryIds && meta.examCategoryIds.length) {
      steps = App.lesson.buildExam(meta.examCategoryIds.flatMap(id => App.words.byCategory(code, id)));
    } else if (meta.isExam) {
      steps = App.lesson.buildExam(App.words.byCategory(code, meta.categoryId));
    } else {
      steps = App.lesson.buildQuiz(code, meta.categoryId || App.lesson.nextCategory(code).id);
    }

    if (steps.length < 4) {
      root.innerHTML = `<p class="empty-hint">${App.t('fc_not_enough_words')}</p>`;
      return;
    }

    App.exercises.run({
      root, steps, code, lessonId: App.lesson.newLessonId(), hearts: !meta.isExam,
      onFinish: (state) => renderResult(root, state, meta),
      onOutOfHearts: (state) => renderOutOfHearts(root, meta),
      onExit: () => App.router.go('course')
    });
  }
};

function findNextCategory(code, categoryId) {
  if (!categoryId) return null;
  const cats = App.data[code].categories;
  const idx = cats.findIndex(c => c.id === categoryId);
  if (idx === -1 || idx + 1 >= cats.length) return null;
  return cats[idx + 1];
}

function renderResult(root, state, meta) {
  const pct = state.tested ? Math.round((state.correct / state.tested) * 100) : 0;
  const next = meta.isExam ? null : findNextCategory(meta.code, meta.categoryId);
  let examBanner = '';

  if (pct === 100) {
    setTimeout(() => {
      App.effects.perfectToast();
      App.effects.celebrate(App.gamification.perfectLessonBonus());
    }, 300);
  }

  if (meta.isExam) {
    const examKey = meta.examLevel || meta.categoryId;
    const passed = pct >= EXAM_PASS_PCT;
    if (passed) App.storage.setExamPassed(meta.code, examKey);
    examBanner = `
      <div class="exam-banner ${passed ? 'exam-pass' : 'exam-fail'}">
        ${passed ? '🎓 ' + App.t('exam_result_pass') : App.t('exam_result_fail', { pct: EXAM_PASS_PCT })}
      </div>
    `;
    if (passed) { App.effects.confetti(); App.effects.levelUp(); }
  }

  const t = state.tally;
  root.innerHTML = `
    <div class="quiz-result">
      ${examBanner}
      <div class="quiz-result-score">${pct}%</div>
      <div>${App.t('fc_correct_of', { correct: state.correct, total: state.tested })}</div>
      ${t.fixed || t.added ? `<div class="lesson-summary">
        ${t.fixed ? `<span>✅ ${App.t('fc_result_fixed', { n: t.fixed })}</span>` : ''}
        ${t.added ? `<span>🔁 ${App.t('fc_result_mistakes', { n: t.added })}</span>` : ''}
      </div>` : ''}
      <div style="margin-top:16px; display:flex; flex-direction:column; gap:10px; align-items:center">
        ${next ? `<button class="quiz-next" id="to-next" style="padding:14px 32px; font-size:15px">${App.t('quiz_next_topic', { name: App.ui.categoryName(next.id, next.name) })}</button>` : ''}
        <div style="display:flex; gap:10px">
          <button class="action-card" id="quiz-again" style="display:inline-flex">${App.t('fc_again')}</button>
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
  root.querySelector('#quiz-again').addEventListener('click', () => restart(meta));
  root.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => App.router.go(btn.dataset.go));
  });
}

// Re-runs the same quiz or exam (a plain go('quiz') would drop the topic).
function restart(meta) {
  App.session.examMode = meta.isExam;
  if (meta.examLevel) {
    App.session.examCategoryIds = meta.examCategoryIds;
    App.session.examLevel = meta.examLevel;
  } else {
    App.session.quizCategory = meta.categoryId;
  }
  App.router.go('quiz');
}

function renderOutOfHearts(root, meta) {
  App.hearts.renderOut(root, { onRetry: () => restart(meta) });
}

})();
