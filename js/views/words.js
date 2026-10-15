window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope.
(function () {

// "My words": every word you've met, grouped by language (detected from the
// word id, so Czech "Ahoj" and English "Hello" land in their own tabs), with
// the personal review list, the mistakes bank, today's due words and all
// learned words by topic. Stars add/remove words from the review list.
let currentTab = null;
let query = '';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function startedLangs() {
  return App.LANG_ORDER.map(code => {
    const seen = App.words.allWords(code).filter(w => !App.srs.isNew(w.id) || App.storage.inReview(w.id));
    return { code, count: seen.length };
  }).filter(l => l.count > 0);
}

App.views.words = {
  render(root) {
    const langs = startedLangs();
    if (!currentTab || !langs.some(l => l.code === currentTab)) {
      const cur = App.storage.getCurrentLang();
      currentTab = langs.some(l => l.code === cur) ? cur : (langs[0] && langs[0].code);
    }
    if (App.session.wordsSection) {
      const target = App.session.wordsSection;
      App.session.wordsSection = null;
      setTimeout(() => root.querySelector('#sec-' + target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }

    if (!langs.length) {
      root.innerHTML = `<div class="session-empty"><div class="session-empty-icon">📒</div><div>${App.t('words_none')}</div></div>`;
      return;
    }

    root.innerHTML = `
      <div class="words-head">
        <h2>📒 ${App.t('nav_words')}</h2>
        <input type="text" id="words-search" placeholder="${App.t('words_search')}" value="${esc(query)}">
      </div>
      <div class="words-tabs">
        ${langs.map(l => `<button class="words-tab ${l.code === currentTab ? 'active' : ''}" data-tab="${l.code}" style="--accent: var(--slot-${App.data[l.code].slot})">${App.ui.flagChip(l.code)} ${App.ui.langName(l.code)} <span class="words-tab-n">${l.count}</span></button>`).join('')}
      </div>
      <div id="words-body"></div>
    `;
    root.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { currentTab = b.dataset.tab; App.router.render(); }));
    root.querySelector('#words-search').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); renderBody(root); });
    renderBody(root);
  }
};

function matches(w) {
  if (!query) return true;
  return w.w.toLowerCase().includes(query) || App.words.localizedMeaning(w).w.toLowerCase().includes(query);
}

function rowHtml(w, extra) {
  const rec = App.storage.inReview(w.id);
  return `
    <div class="word-row">
      <span class="word-row-icon">${App.ui.wordIcon(w.icon)}</span>
      <span class="word-row-text">
        <span class="word-row-w">${esc(w.w)}</span>
        <span class="word-row-tr">${esc(App.words.localizedMeaning(w).w)}</span>
      </span>
      ${extra || ''}
      <button class="word-row-btn" data-say="${esc(w.w)}" title="${App.t('listen_title')}">🔊</button>
      <button class="word-row-btn word-star ${rec ? 'on' : ''}" data-star="${w.id}" title="${rec ? App.t('words_remove') : App.t('words_add')}">${rec ? '⭐' : '☆'}</button>
    </div>
  `;
}

function section(id, title, words, opts) {
  opts = opts || {};
  const list = words.filter(matches);
  return `
    <section class="panel words-section" id="sec-${id}">
      <div class="words-section-head">
        <h3>${title} <span class="words-count">${words.length}</span></h3>
        ${opts.action && words.length ? opts.action : ''}
      </div>
      ${opts.note ? `<p class="words-note">${opts.note}</p>` : ''}
      ${list.length ? `<div class="word-list">${list.map(w => rowHtml(w, opts.extra ? opts.extra(w) : '')).join('')}</div>`
        : `<p class="empty-hint">${opts.empty || '—'}</p>`}
    </section>
  `;
}

function renderBody(root) {
  const code = currentTab;
  const all = App.words.allWords(code);
  const byId = {};
  all.forEach(w => { byId[w.id] = w; });

  const review = App.storage.getReviewIds(code).map(id => byId[id]).filter(Boolean);
  const mistakes = App.storage.getMistakeIds(code).map(id => byId[id]).filter(Boolean);
  const due = all.filter(w => !App.srs.isNew(w.id) && App.srs.isDue(w.id));
  const seen = all.filter(w => !App.srs.isNew(w.id));
  const need = App.storage.AUTO_REVIEW_CORRECT;

  const reviewExtra = (w) => {
    const rec = App.storage.inReview(w.id);
    return rec.auto
      ? `<span class="word-tag word-tag-auto" title="${App.t('words_auto_hint', { n: App.storage.AUTO_REVIEW_MISSES })}">${App.t('words_auto', { ok: rec.ok || 0, need })}</span>`
      : `<span class="word-tag">${App.t('words_manual')}</span>`;
  };
  const missExtra = (w) => `<span class="word-tag word-tag-miss">❌ ${App.storage.getMissCount(w.id) || 1}</span>`;

  // learned words grouped by topic, in course order
  const groups = App.data[code].categories.map(cat => ({
    cat, words: seen.filter(w => w.categoryId === cat.id)
  })).filter(g => g.words.length);

  root.querySelector('#words-body').innerHTML = `
    ${section('review', '⭐ ' + App.t('words_review_list'), review, {
      note: App.t('words_review_note', { miss: App.storage.AUTO_REVIEW_MISSES, ok: need }),
      empty: App.t('words_review_empty'),
      extra: reviewExtra,
      action: `<button class="quiz-next words-practice" data-practice="review">▶ ${App.t('words_practice')}</button>`
    })}
    ${section('mistakes', '🔁 ' + App.t('words_mistakes'), mistakes, {
      extra: missExtra, empty: App.t('words_mistakes_empty'),
      action: `<button class="quiz-next words-practice" data-practice="mistakes">▶ ${App.t('words_practice')}</button>`
    })}
    ${section('due', '🕐 ' + App.t('words_due'), due, {
      empty: App.t('words_due_empty'),
      action: `<button class="quiz-next words-practice" data-practice="due">▶ ${App.t('words_practice')}</button>`
    })}
    <section class="panel words-section" id="sec-all">
      <div class="words-section-head"><h3>📚 ${App.t('words_all')} <span class="words-count">${seen.length}</span></h3></div>
      ${groups.map(g => {
        const list = g.words.filter(matches);
        if (!list.length) return '';
        return `<details class="words-group" ${query ? 'open' : ''}>
          <summary>${App.CATEGORY_ICONS[g.cat.id] || '📘'} ${App.ui.categoryName(g.cat.id, g.cat.name)} <span class="words-count">${g.words.length}</span></summary>
          <div class="word-list">${list.map(w => rowHtml(w)).join('')}</div>
        </details>`;
      }).join('') || `<p class="empty-hint">—</p>`}
    </section>
  `;

  const body = root.querySelector('#words-body');
  body.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => App.speak(b.dataset.say, code)));
  body.querySelectorAll('[data-star]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.star;
    if (App.storage.inReview(id)) App.storage.removeFromReview(id);
    else { App.storage.addToReview(id); App.effects.toast(`⭐ ${App.t('words_added_toast')}`); }
    const y = window.scrollY;
    renderBody(root);
    window.scrollTo(0, y);
  }));
  body.querySelectorAll('[data-practice]').forEach(b => b.addEventListener('click', () => {
    App.storage.setCurrentLang(code);
    const kind = b.dataset.practice;
    if (kind === 'mistakes') { App.session.mistakesMode = true; App.router.go('flashcards'); return; }
    const words = kind === 'review' ? review : due;
    App.session.customWordIds = words.map(w => w.id);
    App.router.go('flashcards');
  }));
}

})();
