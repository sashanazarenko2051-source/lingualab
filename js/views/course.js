window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope, and a same-named helper in another
// view file would otherwise silently collide with (or override) this one.
(function () {

// The 34 shared categories are grouped into CEFR levels by cumulative word
// count, using commonly-cited vocabulary-size benchmarks per level (A0: ~500
// words, A1: ~1000, A2: ~2000, B1: ~2000-3500). At 220 words/category that's:
// A0 = categories 0-7 (1760 words), A1 = 8-15 (1760), A2 = 16-32 (3740),
// B1 = 33 (just enters B1 territory; 7480 words in total isn't enough to
// reach B2+, so those aren't shown). App.levels uses matching thresholds.
const LEVEL_GROUPS = App.access.LEVEL_GROUPS;
App.views.course = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const lang = App.data[code];
    const words = App.words.allWords(code);
    const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
    const pct = words.length ? Math.round((mastered / words.length) * 100) : 0;
    const accent = `var(--slot-${lang.slot})`;
    const level = App.levels.forWordCount(mastered);

    root.innerHTML = `
      <div class="panel">
        <div class="course-hero">
          ${App.ui.flagChip(code, true)}
          <div style="flex:1; min-width:0">
            <div style="font-weight:700; font-size:16px; margin-bottom:6px">${App.ui.langName(code)}: ${App.t('course_path_label')} · <span style="color:${accent}">${level}</span></div>
            <div class="course-hero-bar"><div class="course-hero-fill" style="width:${pct}%; background:${accent}"></div></div>
          </div>
          <div class="course-hero-pct" style="color:${accent}">${pct}%</div>
        </div>
        <button class="tips-toggle" id="tips-toggle">${App.t('course_toggle_notes')}</button>
        <div id="tips-panel" style="display:none; margin-top:12px">
          ${lang.alphabet.map(n => noteCard(n)).join('')}
          ${lang.grammar.map(n => noteCard(n)).join('')}
        </div>
      </div>

      <div class="skill-path" id="skill-path"></div>
    `;

    root.querySelector('#tips-toggle').addEventListener('click', () => {
      const panel = root.querySelector('#tips-panel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    renderPath(root, code, lang, accent);
    App.mascot.renderWidget(root);
  }
};

function noteCard(n) {
  return `<div class="note-card"><h4>${n.title}</h4><p>${n.text}</p></div>`;
}

// Asks before wiping a topic's progress, then opens its first lesson.
function confirmRestart(code, cat) {
  const name = App.ui.categoryName(cat.id, cat.name);
  const seen = App.words.byCategory(code, cat.id).filter(w => !App.srs.isNew(w.id)).length;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card restart-card">
      <div class="restart-icon">↺</div>
      <h3>${App.t('course_restart_title', { name })}</h3>
      <p>${App.t('course_restart_text', { n: seen })}</p>
      <div class="profile-modal-actions">
        <button class="action-card" id="restart-cancel" style="display:inline-flex">${App.t('profile_cancel')}</button>
        <button class="action-card restart-yes" id="restart-yes" style="display:inline-flex">↺ ${App.t('course_restart')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#restart-cancel').addEventListener('click', close);
  overlay.querySelector('#restart-yes').addEventListener('click', () => {
    App.storage.resetTopic(code, cat.id);
    close();
    App.session.flashcardsCategory = cat.id;
    App.session.freshStart = true;
    App.router.go('flashcards');
  });
  overlay.querySelector('#restart-cancel').focus();
}

function categoryStats(code, cat) {
  const words = App.words.byCategory(code, cat.id);
  const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
  const started = words.some(w => !App.srs.isNew(w.id));
  return { cat, mastered, started, total: words.length, pct: words.length ? Math.round((mastered / words.length) * 100) : 0,
    locked: !App.access.isUnlocked(code, cat.id) };
}

function categoryNodeHtml(s, side, accent, code) {
  const done = s.pct >= 100;
  const icon = App.CATEGORY_ICONS[s.cat.id] || '📘';
  const examPassed = App.storage.isExamPassed(code, s.cat.id);
  if (s.locked) return `
    <div class="skill-node-row side-${side} locked">
      <button class="skill-node skill-node-locked" data-locked="${s.cat.id}" style="--node-accent:${accent}">
        <span class="skill-node-icon">${icon}</span><span class="skill-node-lock">🔒</span>
      </button>
      <div class="skill-node-label">
        ${App.ui.categoryName(s.cat.id, s.cat.name)}<br>
        <span class="skill-node-meta">🔒 ${App.t('lock_short')}</span>
      </div>
    </div>
  `;
  return `
    <div class="skill-node-row side-${side}">
      <button class="skill-node ${done ? 'done' : ''}" data-cat="${s.cat.id}"
        style="--node-accent:${accent}">
        <span class="skill-node-icon">${icon}</span>
        <svg class="skill-ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="skill-ring-track"/><circle cx="22" cy="22" r="19" class="skill-ring-fill" style="stroke:${accent}; stroke-dasharray:${Math.round(119.4 * s.pct / 100)} 119.4"/></svg>
        ${examPassed ? `<span class="skill-node-exam-badge" title="${App.t('course_exam_passed')}">🎓</span>` : ''}
      </button>
      <div class="skill-node-label">
        ${App.ui.categoryName(s.cat.id, s.cat.name)}<br>
        <span class="skill-node-meta">${s.mastered}/${s.total}</span>
        <button class="skill-node-exam-link ${examPassed ? 'passed' : ''}" data-exam="${s.cat.id}"
          title="${examPassed ? App.t('course_exam_passed') : App.t('course_exam_need', { pct: 80 })}">
          ${examPassed ? '✅ ' + App.t('course_exam_passed') : '🎓 ' + App.t('course_exam_btn')}
        </button>
        ${s.started ? `<button class="skill-node-exam-link skill-node-restart" data-restart="${s.cat.id}" title="${App.t('course_restart_hint')}">↺ ${App.t('course_restart')}</button>` : ''}
      </div>
    </div>
  `;
}

// The node placed at a level boundary: its icon is the level you're ENTERING
// (e.g. "A1"), and clicking it exams every word from the level you just
// FINISHED (e.g. all A0 categories). It opens once the level's last topic does.
function levelExamNodeHtml(enteringLevel, testedCatIds, side, accent, code) {
  const passed = App.storage.isExamPassed(code, enteringLevel);
  const catsAttr = testedCatIds.join(',');
  if (!App.access.levelExamUnlocked(code, enteringLevel)) return `
    <div class="skill-node-row side-${side} locked">
      <button class="skill-node skill-node-level-exam skill-node-locked" data-locked-note="exam" style="--node-accent:${accent}">
        <span class="skill-node-level-text">${enteringLevel}</span><span class="skill-node-lock">🔒</span>
      </button>
      <div class="skill-node-label">
        ${App.t('course_level_exam_label', { level: enteringLevel })}<br>
        <span class="skill-node-meta">🔒 ${App.t('lock_short')}</span>
      </div>
    </div>
  `;
  return `
    <div class="skill-node-row side-${side}">
      <button class="skill-node skill-node-level-exam ${passed ? 'done' : ''}"
        data-level-exam="${enteringLevel}" data-exam-cats="${catsAttr}" style="--node-accent:${accent}">
        <span class="skill-node-level-text">${enteringLevel}</span>
        ${passed ? `<span class="skill-node-exam-badge" title="${App.t('course_exam_passed')}">🎓</span>` : ''}
      </button>
      <button class="skill-node-label skill-node-label-btn"
        data-level-exam="${enteringLevel}" data-exam-cats="${catsAttr}">
        ${App.t('course_level_exam_label', { level: enteringLevel })}<br>
        <span class="skill-node-meta">${passed ? App.t('course_exam_passed') : App.t('course_exam_need', { pct: 80 })}</span>
      </button>
    </div>
  `;
}

function renderPath(root, code, lang, accent) {
  const el = root.querySelector('#skill-path');
  const cats = lang.categories;
  const coreCats = cats.slice(0, 34);
  const extraCats = cats.slice(34); // Czech-only bonus categories, not part of the level scheme

  const coreStats = coreCats.map(cat => categoryStats(code, cat));

  let side = 0;
  let html = '';
  LEVEL_GROUPS.forEach((group, gi) => {
    const groupStats = coreStats.slice(group.from, group.to);
    groupStats.forEach(s => { html += categoryNodeHtml(s, side % 2 === 0 ? 'left' : 'right', accent, code); side++; });

    const nextGroup = LEVEL_GROUPS[gi + 1];
    if (nextGroup) {
      const testedCatIds = groupStats.map(s => s.cat.id);
      html += levelExamNodeHtml(nextGroup.code, testedCatIds, side % 2 === 0 ? 'left' : 'right', accent, code);
      side++;
    }
  });

  extraCats.forEach(cat => {
    const s = categoryStats(code, cat);
    html += categoryNodeHtml(s, side % 2 === 0 ? 'left' : 'right', accent, code);
    side++;
  });

  const dlgOpen = App.access.dialoguesUnlocked(code);
  const dialoguesNode = `
    <div class="skill-node-row side-${side % 2 === 0 ? 'left' : 'right'}${dlgOpen ? '' : ' locked'}">
      <button class="skill-node skill-node-bonus${dlgOpen ? '' : ' skill-node-locked'}" ${dlgOpen ? 'data-dlg="1"' : 'data-locked-note="dlg"'} style="--node-accent:${accent}">
        <span class="skill-node-icon">💬</span>${dlgOpen ? '' : '<span class="skill-node-lock">🔒</span>'}
      </button>
      <div class="skill-node-label">${App.t('course_dialogues')}${dlgOpen ? '' : `<br><span class="skill-node-meta">🔒 ${App.t('lock_short')}</span>`}</div>
    </div>
  `;

  el.innerHTML = html + dialoguesNode;

  el.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      App.session.flashcardsCategory = btn.dataset.cat;
      App.router.go('flashcards');
    });
  });
  el.querySelectorAll('[data-locked]').forEach(btn => {
    btn.addEventListener('click', () => App.access.showLocked(code, btn.dataset.locked));
  });
  el.querySelectorAll('[data-locked-note]').forEach(btn => {
    btn.addEventListener('click', () => App.access.showLockedNote(App.t(btn.dataset.lockedNote === 'dlg' ? 'lock_dlg_text' : 'lock_exam_text')));
  });
  el.querySelectorAll('[data-exam]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      App.session.quizCategory = btn.dataset.exam;
      App.session.examMode = true;
      App.router.go('quiz');
    });
  });
  el.querySelectorAll('[data-restart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cat = cats.find(c => c.id === btn.dataset.restart);
      confirmRestart(code, cat);
    });
  });
  el.querySelectorAll('[data-level-exam]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      App.session.examMode = true;
      App.session.examCategoryIds = btn.dataset.examCats.split(',');
      App.session.examLevel = btn.dataset.levelExam;
      App.router.go('quiz');
    });
  });
  el.querySelector('[data-dlg]')?.addEventListener('click', () => App.router.go('dialogues'));
}

})();
