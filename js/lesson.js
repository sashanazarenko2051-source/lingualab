window.App = window.App || {};

// Builds lessons as one logical chain:
//   1. warm-up: words from the mistakes bank (any topic) + words due for
//      spaced-repetition review;
//   2. new words of the topic, in course order, in groups of 4 — each word
//      is introduced, then met again in Duolingo-style exercises (picture,
//      pairs, listening, translation, sentence building) — see App.exercises;
//   3. every wrong answer goes to the mistakes bank and resurfaces in the
//      warm-up of later lessons and quizzes until fixed.
App.lesson = (function () {
  const NEW_PER_LESSON = 8;
  const GROUP_SIZE = 4;
  const WARMUP_MISTAKES = 4;
  const WARMUP_DUE = 4;
  const PRACTICE_SIZE = 10;
  const MISTAKES_SESSION = 15;
  const QUIZ_TOPIC = 7;
  const QUIZ_MISTAKES = 3;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function wordsById(code) {
    const map = {};
    App.words.allWords(code).forEach(w => { map[w.id] = w; });
    return map;
  }

  function mistakeWords(code, exclude, limit) {
    const byId = wordsById(code);
    return App.storage.getMistakeIds(code)
      .map(id => byId[id])
      .filter(w => w && !(exclude && exclude.has(w.id)))
      .slice(0, limit);
  }

  function ex(kind, word, review) { return { kind, word, review: review || null }; }

  // Exercise kinds rotate so the same word is met in different ways
  // (recognition -> listening -> recall -> production). Kinds that don't fit
  // a word (no example, no voice, non-Latin typing) are swapped for a plain
  // translation by App.exercises at render time.
  const REVIEW_KINDS = { mistake: ['type', 'listen', 'translate', 'blank'], due: ['reverse', 'listen', 'translate', 'blank'] };
  const PRACTICE_KINDS = ['translate', 'listen', 'reverse', 'blank', 'type', 'build'];
  const QUIZ_KINDS = ['translate', 'reverse', 'listen', 'blank', 'type', 'build'];
  const EXAM_KINDS = ['translate', 'reverse', 'blank', 'type'];
  const rotate = (kinds, i) => kinds[i % kinds.length];

  // New words in a group of 4: meet each with its picture right after the
  // intro, match all four, hear/recognize them again, then build one
  // sentence — every new word is used at least three times.
  function newWordSteps(group) {
    const steps = [];
    group.forEach(w => { steps.push(ex('intro', w)); steps.push(ex('picture', w)); });
    if (group.length >= 3) steps.push({ kind: 'match', words: group });
    shuffle(group).forEach((w, i) => steps.push(ex(rotate(['listen', 'reverse', 'translate'], i), w)));
    // Prefer a multi-word phrase: it can always be assembled from its own
    // words, while most example sentences contain words not taught yet.
    const toBuild = group.find(w => w.w.trim().includes(' ')) || group.find(w => w.ex);
    if (toBuild) steps.push(ex('build', toBuild));
    return steps;
  }

  // Steps for a lesson. Returns [] when there's nothing to do.
  function buildLesson(code, categoryId) {
    const topic = App.words.byCategory(code, categoryId);
    const taken = new Set();
    const steps = [];

    // Warm-up: mistakes bank first (any topic), then due reviews.
    mistakeWords(code, null, WARMUP_MISTAKES).forEach((w, i) => { taken.add(w.id); steps.push(ex(rotate(REVIEW_KINDS.mistake, i), w, 'mistake')); });
    App.words.allWords(code)
      .filter(w => !taken.has(w.id) && !App.srs.isNew(w.id) && App.srs.isDue(w.id))
      .slice(0, WARMUP_DUE)
      .forEach((w, i) => { taken.add(w.id); steps.push(ex(rotate(REVIEW_KINDS.due, i), w, 'due')); });

    const fresh = topic.filter(w => App.srs.isNew(w.id) && !taken.has(w.id)).slice(0, NEW_PER_LESSON);
    if (fresh.length) {
      for (let i = 0; i < fresh.length; i += GROUP_SIZE) steps.push(...newWordSteps(fresh.slice(i, i + GROUP_SIZE)));
    } else {
      // Topic fully introduced: practice its weakest words (topic mistakes,
      // then due, then lowest repetition count).
      const weakness = w => {
        const rec = App.storage.getSRS(w.id) || { reps: 0, due: 0 };
        return (App.storage.isMistake(w.id) ? -1000 : 0) + (App.srs.isDue(w.id) ? -100 : 0) + rec.reps;
      };
      const weak = topic.filter(w => !taken.has(w.id)).sort((a, b) => weakness(a) - weakness(b)).slice(0, PRACTICE_SIZE);
      if (weak.length >= 4) steps.push({ kind: 'match', words: weak.slice(0, 4) });
      weak.forEach((w, i) => steps.push(ex(rotate(PRACTICE_KINDS, i), w, App.storage.isMistake(w.id) ? 'mistake' : null)));
    }
    return steps;
  }

  function buildMistakesSession(code) {
    const words = mistakeWords(code, null, MISTAKES_SESSION);
    const steps = words.map((w, i) => ex(rotate(REVIEW_KINDS.mistake, i), w, 'mistake'));
    if (words.length >= 4) steps.unshift({ kind: 'match', words: words.slice(0, 4) });
    return steps;
  }

  // Topic quiz: introduced words of the topic + a few from the mistakes bank,
  // each in a different exercise type, opened by a pairs match.
  function buildQuiz(code, categoryId) {
    const topic = App.words.byCategory(code, categoryId);
    const seen = topic.filter(w => !App.srs.isNew(w.id));
    const base = seen.length >= 4 ? seen : topic;
    const picked = shuffle(base).slice(0, QUIZ_TOPIC);
    const mistakes = mistakeWords(code, new Set(picked.map(w => w.id)), QUIZ_MISTAKES);
    const steps = picked.map((w, i) => ex(rotate(QUIZ_KINDS, i), w))
      .concat(mistakes.map((w, i) => ex(rotate(REVIEW_KINDS.mistake, i), w, 'mistake')));
    if (picked.length >= 4) steps.unshift({ kind: 'match', words: picked.slice(0, 4) });
    return steps;
  }

  // Exams: one graded exercise per word, no pairs (each word counts once).
  function buildExam(words) {
    return shuffle(words).map((w, i) => ex(rotate(EXAM_KINDS, i), w));
  }

  // Grades an answer everywhere it matters (SRS schedule + mistakes bank) and
  // tallies it on the session object for the result screen.
  function answer(session, word, isCorrect) {
    App.srs.grade(word.id, isCorrect ? 4 : 1);
    const res = App.storage.recordMistakeAnswer(word.id, isCorrect, session.lessonId);
    session.tally = session.tally || { added: 0, fixed: 0 };
    if (res === 'added') session.tally.added += 1;
    if (res === 'fixed') session.tally.fixed += 1;
    return res;
  }

  // The topic "Start lesson" opens: first topic on the course path that still
  // has unseen words, else the first with unlearned ones, else the first.
  function nextCategory(code) {
    const cats = App.data[code].categories;
    const has = (cat, pred) => App.words.byCategory(code, cat.id).some(pred);
    return cats.find(c => has(c, w => App.srs.isNew(w.id)))
      || cats.find(c => has(c, w => !App.srs.isMastered(w.id)))
      || cats[0];
  }

  function newLessonId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  return { nextCategory, buildLesson, buildMistakesSession, buildQuiz, buildExam, answer, newLessonId, shuffle };
})();
