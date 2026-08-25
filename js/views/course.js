window.App = window.App || {};
App.views = App.views || {};

// The 34 shared categories are grouped into CEFR levels by cumulative word
// count, using commonly-cited vocabulary-size benchmarks per level (A0: ~500
// words, A1: ~1000, A2: ~2000, B1: ~2000-3500). At 60 words/category that's:
// A0 = categories 0-7, A1 = 8-15, A2 = 16-32, B1 = 33 (just barely enters B1
// territory — 2040 words total isn't enough to reach B2+, so those aren't shown).
const LEVEL_GROUPS = [
  { code: 'A0', from: 0, to: 8 },
  { code: 'A1', from: 8, to: 16 },
  { code: 'A2', from: 16, to: 33 },
  { code: 'B1', from: 33, to: 34 }
];
const LEVEL_WORD_THRESHOLDS = [
  { code: 'A0', min: 0 },
  { code: 'A1', min: 500 },
  { code: 'A2', min: 1000 },
  { code: 'B1', min: 2000 }
];

function levelForWordCount(masteredWords) {
  let level = LEVEL_WORD_THRESHOLDS[0].code;
  LEVEL_WORD_THRESHOLDS.forEach(t => { if (masteredWords >= t.min) level = t.code; });
  return level;
}

App.views.course = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const lang = App.data[code];
    const words = App.words.allWords(code);
    const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
    const pct = words.length ? Math.round((mastered / words.length) * 100) : 0;
    const accent = `var(--slot-${lang.slot})`;
    const level = levelForWordCount(mastered);

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
  }
};

function noteCard(n) {
  return `<div class="note-card"><h4>${n.title}</h4><p>${n.text}</p></div>`;
}

function categoryStats(code, cat) {
  const words = App.words.byCategory(code, cat.id);
  const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
  return { cat, mastered, total: words.length, pct: words.length ? Math.round((mastered / words.length) * 100) : 0 };
}

function categoryNodeHtml(s, side, accent, code) {
  const done = s.pct >= 100;
  const icon = App.CATEGORY_ICONS[s.cat.id] || '📘';
  const examPassed = App.storage.isExamPassed(code, s.cat.id);
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
      </div>
    </div>
  `;
}

// The node placed at a level boundary: its icon is the level you're ENTERING
// (e.g. "A1"), and clicking it exams every word from the level you just
// FINISHED (e.g. all A0 categories) — a cumulative checkpoint, not a lock.
function levelExamNodeHtml(enteringLevel, testedCatIds, side, accent, code) {
  const passed = App.storage.isExamPassed(code, enteringLevel);
  return `
    <div class="skill-node-row side-${side}">
      <button class="skill-node skill-node-level-exam ${passed ? 'done' : ''}"
        data-level-exam="${enteringLevel}" data-exam-cats="${testedCatIds.join(',')}" style="--node-accent:${accent}">
        <span class="skill-node-level-text">${enteringLevel}</span>
        ${passed ? `<span class="skill-node-exam-badge" title="${App.t('course_exam_passed')}">🎓</span>` : ''}
      </button>
      <div class="skill-node-label">
        ${App.t('course_level_exam_label', { level: enteringLevel })}<br>
        <span class="skill-node-meta">${passed ? App.t('course_exam_passed') : App.t('course_exam_need', { pct: 80 })}</span>
      </div>
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

  const dialoguesNode = `
    <div class="skill-node-row side-${side % 2 === 0 ? 'left' : 'right'}">
      <button class="skill-node skill-node-bonus" data-dlg="1" style="--node-accent:${accent}">
        <span class="skill-node-icon">💬</span>
      </button>
      <div class="skill-node-label">${App.t('course_dialogues')}</div>
    </div>
  `;

  el.innerHTML = html + dialoguesNode;

  el.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      App.session.flashcardsCategory = btn.dataset.cat;
      App.router.go('flashcards');
    });
  });
  el.querySelectorAll('[data-exam]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      App.session.quizCategory = btn.dataset.exam;
      App.session.examMode = true;
      App.router.go('quiz');
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
