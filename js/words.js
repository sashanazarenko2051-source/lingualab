window.App = window.App || {};

App.words = (function () {
  function allWords(langCode) {
    const lang = App.data[langCode];
    if (!lang) return [];
    const out = [];
    lang.categories.forEach(cat => {
      cat.words.forEach((word, idx) => {
        out.push({
          id: langCode + ':' + cat.id + ':' + word.w,
          lang: langCode,
          categoryId: cat.id,
          categoryName: cat.name,
          idx: idx,
          icon: (App.WORD_ICONS[cat.id] && App.WORD_ICONS[cat.id][idx]) || '💬',
          w: word.w,
          t: word.t,
          ex: word.ex || '',
          tex: word.tex || ''
        });
      });
    });
    return out;
  }

  function byCategory(langCode, categoryId) {
    return allWords(langCode).filter(w => w.categoryId === categoryId);
  }

  function dueWords(langCode, categoryId) {
    let words = categoryId ? byCategory(langCode, categoryId) : allWords(langCode);
    return words.filter(w => !App.srs.isNew(w.id) && App.srs.isDue(w.id));
  }

  function newWords(langCode, categoryId, limit) {
    let words = categoryId ? byCategory(langCode, categoryId) : allWords(langCode);
    words = words.filter(w => App.srs.isNew(w.id));
    return typeof limit === 'number' ? words.slice(0, limit) : words;
  }

  // Every language file was translated from the same aligned concept list, so the
  // word at [categoryId][idx] means the same thing in every language. That lets us
  // show the "meaning" of a word being studied in whatever language the interface
  // is currently set to, instead of always falling back to Russian.
  function localizedMeaning(word) {
    const uiLang = (App.storage.getUILang && App.storage.getUILang()) || 'ru';
    const fallback = { w: word.t, ex: word.tex };
    if (uiLang === 'ru' || uiLang === word.lang) return fallback;
    const uiData = App.data[uiLang];
    if (!uiData) return fallback;
    const cat = uiData.categories.find(c => c.id === word.categoryId);
    const w2 = cat && cat.words[word.idx];
    if (!w2) return fallback;
    return { w: w2.w, ex: w2.ex || word.tex };
  }

  return { allWords, byCategory, dueWords, newWords, localizedMeaning };
})();
