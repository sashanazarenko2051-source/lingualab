window.App = window.App || {};

// Which course topics are open. Topics open one after another: the next one
// opens once every word of the previous topic has been studied or its exam
// (80%) is passed. A passed level exam (A1, A2, B1) opens the whole level it
// tests plus the first topic of the new level. A level exam itself opens
// once the last topic of its level is open; dialogues open after the first
// topic is passed. Topics bought in the shop (App.shop) are open.
App.access = (function () {
  // The 34 shared topics grouped into CEFR levels (see course.js).
  const LEVEL_GROUPS = [
    { code: 'A0', from: 0, to: 8 },
    { code: 'A1', from: 8, to: 16 },
    { code: 'A2', from: 16, to: 33 },
    { code: 'B1', from: 33, to: 34 }
  ];

  function isPremium(code) { return App.shop.ownsTopics(code); }

  function topicPassed(code, cat) {
    if (App.storage.isExamPassed(code, cat.id)) return true;
    return App.words.byCategory(code, cat.id).every(w => !App.srs.isNew(w.id));
  }

  // Topics with an index below this are opened by a passed level exam.
  function levelSkipTo(code) {
    let to = 0;
    LEVEL_GROUPS.forEach((g, gi) => {
      const next = LEVEL_GROUPS[gi + 1];
      if (next && App.storage.isExamPassed(code, next.code)) to = Math.max(to, next.from + 1);
    });
    return to;
  }

  function isUnlocked(code, catId) {
    if (isPremium(code)) return true;
    const cats = App.data[code].categories;
    const i = cats.findIndex(c => c.id === catId);
    if (i <= 0) return true;
    if (i < levelSkipTo(code)) return true;
    if (App.shop.ownsHalf(code) && i < Math.ceil(cats.length / 2)) return true;
    return App.storage.isExamPassed(code, catId) || topicPassed(code, cats[i - 1]);
  }

  // The exam at the end of a level group (its code is the level it enters).
  function levelExamUnlocked(code, levelCode) {
    if (isPremium(code) || App.storage.isExamPassed(code, levelCode)) return true;
    const gi = LEVEL_GROUPS.findIndex(g => g.code === levelCode);
    const group = LEVEL_GROUPS[gi - 1];
    if (!group) return true;
    const last = App.data[code].categories[group.to - 1];
    return isUnlocked(code, last.id);
  }

  function dialoguesUnlocked(code) {
    return isPremium(code) || topicPassed(code, App.data[code].categories[0]);
  }

  // A short lock notice with a way to the shop (level exams, dialogues).
  function showLockedNote(text) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card restart-card lock-card">
        <div class="restart-icon">🔒</div>
        <h3>${App.t('lock_title')}</h3>
        <p>${text}</p>
        <div class="lock-actions">
          <button class="action-card lock-premium" id="lock-premium" style="display:inline-flex">💎 ${App.t('lock_unlock_all')}</button>
          <button class="action-card" id="lock-close" style="display:inline-flex">${App.t('profile_cancel')}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#lock-close').addEventListener('click', close);
    overlay.querySelector('#lock-premium').addEventListener('click', () => {
      close();
      App.session.shopSection = 'topics';
      App.router.go('shop');
    });
  }

  // The topic that has to be finished to open catId.
  function prevTopic(code, catId) {
    const cats = App.data[code].categories;
    const i = cats.findIndex(c => c.id === catId);
    return i > 0 ? cats[i - 1] : null;
  }

  // Shown when a closed topic is opened from anywhere.
  function showLocked(code, catId) {
    const cats = App.data[code].categories;
    const cat = cats.find(c => c.id === catId);
    const prev = prevTopic(code, catId);
    const name = App.ui.categoryName(cat.id, cat.name);
    const prevName = prev ? App.ui.categoryName(prev.id, prev.name) : '';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card restart-card lock-card">
        <div class="restart-icon">🔒</div>
        <h3>${App.t('lock_title')}</h3>
        <p>${App.t('lock_text', { name, prev: prevName })}</p>
        <div class="lock-actions">
          ${prev ? `<button class="action-card" id="lock-learn" style="display:inline-flex">📘 ${App.t('lock_learn_prev', { prev: prevName })}</button>
          <button class="action-card" id="lock-exam" style="display:inline-flex">🎓 ${App.t('lock_exam_prev')}</button>` : ''}
          <button class="action-card lock-premium" id="lock-premium" style="display:inline-flex">💎 ${App.t('lock_unlock_all')}</button>
          <button class="action-card" id="lock-close" style="display:inline-flex">${App.t('profile_cancel')}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#lock-close').addEventListener('click', close);
    if (prev) {
      overlay.querySelector('#lock-learn').addEventListener('click', () => {
        close();
        App.session.flashcardsCategory = prev.id;
        App.router.go('flashcards');
      });
      overlay.querySelector('#lock-exam').addEventListener('click', () => {
        close();
        App.session.quizCategory = prev.id;
        App.session.examMode = true;
        App.router.go('quiz');
      });
    }
    overlay.querySelector('#lock-premium').addEventListener('click', () => {
      close();
      App.session.shopSection = 'topics';
      App.router.go('shop');
    });
  }

  return { LEVEL_GROUPS, isUnlocked, levelExamUnlocked, dialoguesUnlocked, isPremium, prevTopic, showLocked, showLockedNote };
})();
