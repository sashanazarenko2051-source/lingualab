window.App = window.App || {};
App.views = App.views || {};

App.views.quiz = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const categoryId = App.session.quizCategory;
    App.session.quizCategory = null;

    const pool = buildPool(code, categoryId);
    if (pool.length < 4) {
      root.innerHTML = `<p class="empty-hint">${App.t('fc_not_enough_words')}</p>`;
      return;
    }

    const questions = buildQuestions(pool);
    const state = { questions, index: 0, correct: 0, answered: false, categoryId };
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

function buildQuestions(pool) {
  const shuffled = shuffle(pool).slice(0, Math.min(10, pool.length));
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
      <div class="quiz-progress" style="margin:0">${state.index + 1} / ${state.questions.length} · ${App.t('quiz_correct_label')}: ${state.correct}</div>
    </div>
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
  root.innerHTML = `
    <div class="quiz-result">
      <div class="quiz-result-score">${pct}%</div>
      <div>${App.t('fc_correct_of', { correct: state.correct, total: state.questions.length })}</div>
      <div style="margin-top:16px; display:flex; flex-direction:column; gap:10px; align-items:center">
        ${next ? `<button class="quiz-next" id="to-next" style="padding:14px 32px; font-size:15px">${App.t('quiz_next_topic', { name: App.ui.categoryName(next.id, next.name) })}</button>` : ''}
        <div style="display:flex; gap:10px">
          <button class="action-card" data-go="quiz" style="display:inline-flex">${App.t('fc_again')}</button>
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
  root.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => App.router.go(btn.dataset.go));
  });
}
