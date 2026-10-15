window.App = window.App || {};

// Builds lessons as one logical chain:
//   1. warm-up: words from the mistakes bank (other topics) + words due for
//      spaced-repetition review;
//   2. new words of the topic, in course order, in small groups — each word
//      is first introduced (picture, word, audio, translation, example) and
//      only then tested, so nothing is asked before it was shown;
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

  function test(word, review) { return { kind: 'test', word, review: review || null }; }
  function intro(word) { return { kind: 'intro', word }; }

  // Steps for a flashcard lesson. Returns [] when there's nothing to do.
  function buildLesson(code, categoryId) {
    const topic = App.words.byCategory(code, categoryId);
    const taken = new Set();
    const steps = [];

    // Warm-up: mistakes bank first (any topic), then due reviews.
    mistakeWords(code, null, WARMUP_MISTAKES).forEach(w => { taken.add(w.id); steps.push(test(w, 'mistake')); });
    App.words.allWords(code)
      .filter(w => !taken.has(w.id) && !App.srs.isNew(w.id) && App.srs.isDue(w.id))
      .slice(0, WARMUP_DUE)
      .forEach(w => { taken.add(w.id); steps.push(test(w, 'due')); });

    const fresh = topic.filter(w => App.srs.isNew(w.id) && !taken.has(w.id)).slice(0, NEW_PER_LESSON);
    if (fresh.length) {
      for (let i = 0; i < fresh.length; i += GROUP_SIZE) {
        const group = fresh.slice(i, i + GROUP_SIZE);
        group.forEach(w => steps.push(intro(w)));
        shuffle(group).forEach(w => steps.push(test(w)));
      }
    } else {
      // Topic fully introduced: practice its weakest words (topic mistakes,
      // then due, then lowest repetition count).
      const weakness = w => {
        const rec = App.storage.getSRS(w.id) || { reps: 0, due: 0 };
        return (App.storage.isMistake(w.id) ? -1000 : 0) + (App.srs.isDue(w.id) ? -100 : 0) + rec.reps;
      };
      topic.filter(w => !taken.has(w.id))
        .sort((a, b) => weakness(a) - weakness(b))
        .slice(0, PRACTICE_SIZE)
        .forEach(w => steps.push(test(w, App.storage.isMistake(w.id) ? 'mistake' : null)));
    }
    return steps;
  }

  function buildMistakesSession(code) {
    return mistakeWords(code, null, MISTAKES_SESSION).map(w => test(w, 'mistake'));
  }

  // Quiz words: introduced words of the topic + a few from the mistakes bank.
  function quizWords(code, categoryId) {
    const topic = App.words.byCategory(code, categoryId);
    const seen = topic.filter(w => !App.srs.isNew(w.id));
    const base = seen.length >= 4 ? seen : topic;
    const picked = shuffle(base).slice(0, QUIZ_TOPIC);
    const mistakes = mistakeWords(code, new Set(picked.map(w => w.id)), QUIZ_MISTAKES);
    return picked.concat(mistakes);
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

  return { nextCategory, buildLesson, buildMistakesSession, quizWords, answer, newLessonId, shuffle };
})();
