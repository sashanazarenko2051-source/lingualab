window.App = window.App || {};
App.views = App.views || {};

App.views.flashcards = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const categoryId = App.session.flashcardsCategory;
    App.session.flashcardsCategory = null;

    if (categoryId) {
      const lang = App.data[code];
      const cat = lang.categories.find(c => c.id === categoryId);
      if (cat) App.storage.setLastLesson(code, categoryId, cat.name);
    }

    const words = buildQueue(code, categoryId);
    if (!words.length) {
      root.innerHTML = emptyHtml();
      root.querySelector('[data-go]')?.addEventListener('click', (e) => App.router.go(e.target.dataset.go));
      return;
    }

    const pool = categoryId ? App.words.byCategory(code, categoryId) : App.words.allWords(code);
    const state = { words, pool, index: 0, code, categoryId, correct: 0, repeats: {} };
    renderCard(root, state);
  }
};

function buildQueue(code, categoryId) {
  let due = App.words.dueWords(code, categoryId);
  let fresh = App.words.newWords(code, categoryId, categoryId ? 100 : 24);
  let combined = due.concat(fresh);
  if (!combined.length && categoryId) {
    combined = App.words.byCategory(code, categoryId);
  }
  if (!combined.length && !categoryId) {
    combined = App.words.allWords(code);
  }
  return shuffle(combined);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function emptyHtml() {
  return `
    <div class="session-empty">
      <div class="session-empty-icon">🎉</div>
      <div>${App.t('fc_all_done')}</div>
      <div style="margin-top:14px"><button class="action-card" data-go="dashboard" style="display:inline-flex">${App.t('fc_home')}</button></div>
    </div>
  `;
}

function buildOptions(word, pool) {
  const others = pool.filter(w => w.id !== word.id && w.w !== word.w);
  const distractors = shuffle(others).slice(0, 3);
  return shuffle([word, ...distractors]);
}

function peekCardHtml(id, word, code) {
  if (!word) return `<div class="flashcard-peek flashcard-peek-empty"></div>`;
  const meaning = App.words.localizedMeaning(word);
  return `
    <button class="flashcard-peek" id="${id}">
      <div class="peek-icon">${word.icon}</div>
      <div class="peek-word">${meaning.w}</div>
    </button>
  `;
}

function renderCard(root, state) {
  const word = state.words[state.index];
  const lang = App.data[state.code];
  const accent = `var(--slot-${lang.slot})`;
  const pct = Math.round((state.index / state.words.length) * 100);
  const options = buildOptions(word, state.pool.length >= 4 ? state.pool : state.words);
  const meaning = App.words.localizedMeaning(word);
  let answered = false;

  const prevWord = state.index > 0 ? state.words[state.index - 1] : null;
  const nextWord = state.index < state.words.length - 1 ? state.words[state.index + 1] : null;

  root.innerHTML = `
    <div class="flashcard-wrap">
      <div class="flashcard-topbar">
        <button class="back-btn" id="back-to-course" title="${App.t('back_btn_title')}">${App.t('back_btn')}</button>
        <div class="flashcard-progress-track"><div class="flashcard-progress-fill" style="width:${pct}%; background:${accent}"></div></div>
        <div class="flashcard-progress-num">${state.index + 1} / ${state.words.length} · ${App.t('quiz_correct_label')}: ${state.correct}</div>
      </div>

      <div class="flashcard-stage">
        ${peekCardHtml('prev-card', prevWord, state.code)}
        <div class="flashcard" style="border-color:${accent}; cursor:default">
          <div class="flashcard-category">${App.ui.flagChip(state.code)} ${App.ui.categoryName(word.categoryId, word.categoryName)} · ${App.t('fc_how_to_say')} ${App.ui.langName(state.code).toLowerCase()}?</div>
          <div class="flashcard-icon-row">
            <div class="flashcard-icon">${word.icon}</div>
            <button class="speak-btn" id="speak" title="${App.t('listen_title')}" style="color:${accent}">🔊</button>
          </div>
          <div class="flashcard-translation" id="tr" style="color:${accent}">${meaning.w}</div>
          <div class="flashcard-hint" id="hint">${App.t('fc_choose_correct')}</div>
          ${word.ex ? `<div class="flashcard-example" id="ex" style="display:none">${word.ex}</div>` : ''}
          ${meaning.ex ? `<div class="flashcard-example" id="tex" style="display:none">${meaning.ex}</div>` : ''}
        </div>
        ${peekCardHtml('next-card', nextWord, state.code)}
      </div>

      <div class="quiz-options word-options" id="options">
        ${options.map(o => `<button class="quiz-option" data-id="${o.id}">${o.w}</button>`).join('')}
      </div>
    </div>
  `;

  root.querySelector('#speak').addEventListener('click', (e) => {
    e.stopPropagation();
    App.speak(word.w, state.code);
  });

  root.querySelector('#back-to-course').addEventListener('click', () => App.router.go('course'));

  root.querySelector('#prev-card')?.addEventListener('click', () => {
    if (state.index === 0) return;
    state.index -= 1;
    renderCard(root, state);
  });

  root.querySelector('#next-card')?.addEventListener('click', () => {
    if (state.index >= state.words.length - 1) return;
    state.index += 1;
    renderCard(root, state);
  });

  root.querySelectorAll('.word-options .quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;

      const isCorrect = btn.dataset.id === word.id;
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
      App.srs.grade(word.id, isCorrect ? 4 : 1);
      isCorrect ? App.effects.correct() : App.effects.wrong();
      App.effects.celebrate(App.gamification.grade(isCorrect));

      if (!isCorrect) {
        const seen = state.repeats[word.id] || 0;
        if (seen < 2) {
          state.repeats[word.id] = seen + 1;
          const reinsertAt = Math.min(state.words.length, state.index + 1 + 3);
          state.words.splice(reinsertAt, 0, word);
        }
      }

      setTimeout(() => {
        state.index += 1;
        if (state.index >= state.words.length) {
          renderResult(root, state);
        } else {
          renderCard(root, state);
        }
      }, 1100);
    });
  });
}

function renderResult(root, state) {
  const pct = Math.round((state.correct / state.words.length) * 100);
  root.innerHTML = `
    <div class="quiz-result">
      <div class="quiz-result-score">${pct}%</div>
      <div>${App.t('fc_correct_of', { correct: state.correct, total: state.words.length })}</div>
      <div style="margin-top:8px; color:var(--ink-muted); font-size:13px">${App.t('fc_now_tests')}</div>
      <div style="margin-top:16px; display:flex; flex-direction:column; gap:10px; align-items:center">
        <button class="quiz-next" id="to-quiz" style="padding:14px 32px; font-size:15px">${App.t('fc_next_tests')}</button>
        <div style="display:flex; gap:10px">
          <button class="action-card" data-go="flashcards" style="display:inline-flex">${App.t('fc_again')}</button>
          <button class="action-card" data-go="dashboard" style="display:inline-flex">${App.t('fc_home')}</button>
        </div>
      </div>
    </div>
  `;
  root.querySelector('#to-quiz').addEventListener('click', () => {
    App.session.quizCategory = state.categoryId;
    App.router.go('quiz');
  });
  root.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => App.router.go(btn.dataset.go));
  });
}
