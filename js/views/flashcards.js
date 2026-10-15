window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope, and a same-named top-level
// const/function in another view file (e.g. quiz.js) would otherwise collide.
(function () {

// A lesson: steps from App.lesson (warm-up reviews, then new words in
// Duolingo-style exercises), played by App.exercises. Hearts are per-lesson
// stakes: running out ends the lesson (progress and mistakes are kept).
App.views.flashcards = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const mistakesMode = !!App.session.mistakesMode;
    const customIds = App.session.customWordIds;
    App.session.customWordIds = null;
    let categoryId = App.session.flashcardsCategory;
    App.session.flashcardsCategory = null;
    App.session.mistakesMode = false;
    const freshStart = !!App.session.freshStart;
    App.session.freshStart = false;

    if (customIds) {
      const byId = {};
      App.words.allWords(code).forEach(w => { byId[w.id] = w; });
      const words = customIds.map(id => byId[id]).filter(Boolean);
      const meta = { categoryId: null, mistakesMode: true, customIds };
      App.exercises.run({
        root, steps: App.lesson.buildCustomSession(words), code, lessonId: App.lesson.newLessonId(),
        onFinish: (state) => renderResult(root, state, meta),
        onOutOfHearts: (state) => renderOutOfHearts(root, state, meta),
        onExit: () => App.router.go('words')
      });
      return;
    }

    if (!mistakesMode && !categoryId) categoryId = App.lesson.nextCategory(code).id;
    if (categoryId) {
      const cat = App.data[code].categories.find(c => c.id === categoryId);
      if (cat) App.storage.setLastLesson(code, categoryId, cat.name);
    }

    const steps = mistakesMode ? App.lesson.buildMistakesSession(code) : App.lesson.buildLesson(code, categoryId, { warmup: !freshStart });
    if (!steps.length) {
      root.innerHTML = emptyHtml();
      root.querySelector('[data-go]')?.addEventListener('click', (e) => App.router.go(e.target.dataset.go));
      return;
    }

    const meta = { categoryId, mistakesMode };
    App.exercises.run({
      root, steps, code, lessonId: App.lesson.newLessonId(),
      onFinish: (state) => renderResult(root, state, meta),
      onOutOfHearts: (state) => renderOutOfHearts(root, state, meta),
      onExit: () => App.router.go(mistakesMode ? 'dashboard' : 'course')
    });
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

function duration(state) {
  const sec = Math.round((Date.now() - state.startedAt) / 1000);
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}

function summaryHtml(state) {
  const t = state.tally;
  const items = [`⏱ ${App.t('res_time', { t: duration(state) })}`];
  if (state.learned) items.push(`✨ ${App.t('fc_result_new', { n: state.learned })}`);
  if (t.fixed) items.push(`✅ ${App.t('fc_result_fixed', { n: t.fixed })}`);
  if (t.added) items.push(`🔁 ${App.t('fc_result_mistakes', { n: t.added })}`);
  return `<div class="lesson-summary">${items.map(i => `<span>${i}</span>`).join('')}</div>`;
}

function renderResult(root, state, meta) {
  const pct = state.tested ? Math.round((state.correct / state.tested) * 100) : 100;
  if (state.tested && pct === 100) {
    setTimeout(() => {
      App.effects.perfectToast();
      App.effects.celebrate(App.gamification.perfectLessonBonus());
    }, 300);
  }
  const canQuiz = !meta.mistakesMode && meta.categoryId;
  root.innerHTML = `
    <div class="quiz-result">
      <div class="res-title">🎉 ${App.t('res_title')}</div>
      <div class="quiz-result-score">${pct}%</div>
      <div>${App.t('fc_correct_of', { correct: state.correct, total: state.tested })}</div>
      ${summaryHtml(state)}
      ${canQuiz ? `<div style="margin-top:8px; color:var(--ink-2); font-size:13px">${App.t('fc_now_tests')}</div>` : ''}
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
    App.session.quizCategory = meta.categoryId;
    App.router.go('quiz');
  });
  root.querySelector('#fc-again').addEventListener('click', () => restart(meta));
  root.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => App.router.go(btn.dataset.go));
  });
}

// Re-runs the same topic (a plain go('flashcards') would drop the category).
function restart(meta) {
  App.session.flashcardsCategory = meta.categoryId;
  App.session.mistakesMode = meta.mistakesMode && !meta.customIds;
  App.session.customWordIds = meta.customIds || null;
  App.router.go('flashcards');
}

function renderOutOfHearts(root, state, meta) {
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
  root.querySelector('#fc-retry').addEventListener('click', () => restart(meta));
  root.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => App.router.go(btn.dataset.go));
  });
}

})();
