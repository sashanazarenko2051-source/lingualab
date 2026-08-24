window.App = window.App || {};
App.views = App.views || {};

App.views.course = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const lang = App.data[code];
    const words = App.words.allWords(code);
    const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
    const pct = words.length ? Math.round((mastered / words.length) * 100) : 0;
    const accent = `var(--slot-${lang.slot})`;
    const level = pct === 0 ? 'A0' : pct <= 60 ? 'A1' : 'A2';

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

function renderPath(root, code, lang, accent) {
  const el = root.querySelector('#skill-path');
  const cats = lang.categories;

  const catStats = cats.map(cat => {
    const words = App.words.byCategory(code, cat.id);
    const mastered = words.filter(w => App.srs.isMastered(w.id)).length;
    return { cat, mastered, total: words.length, pct: words.length ? Math.round((mastered / words.length) * 100) : 0 };
  });

  const nodes = catStats.map((s, i) => {
    const done = s.pct >= 100;
    const side = i % 2 === 0 ? 'left' : 'right';
    const icon = App.CATEGORY_ICONS[s.cat.id] || '📘';
    return `
      <div class="skill-node-row side-${side}">
        <button class="skill-node ${done ? 'done' : ''}" data-cat="${s.cat.id}"
          style="--node-accent:${accent}">
          <span class="skill-node-icon">${icon}</span>
          <svg class="skill-ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="skill-ring-track"/><circle cx="22" cy="22" r="19" class="skill-ring-fill" style="stroke:${accent}; stroke-dasharray:${Math.round(119.4 * s.pct / 100)} 119.4"/></svg>
        </button>
        <div class="skill-node-label">${App.ui.categoryName(s.cat.id, s.cat.name)}<br><span class="skill-node-meta">${s.mastered}/${s.total}</span></div>
      </div>
    `;
  }).join('');

  const dlgSide = cats.length % 2 === 0 ? 'left' : 'right';
  const dialoguesNode = `
    <div class="skill-node-row side-${dlgSide}">
      <button class="skill-node skill-node-bonus" data-dlg="1" style="--node-accent:${accent}">
        <span class="skill-node-icon">💬</span>
      </button>
      <div class="skill-node-label">${App.t('course_dialogues')}</div>
    </div>
  `;

  el.innerHTML = nodes + dialoguesNode;

  el.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      App.session.flashcardsCategory = btn.dataset.cat;
      App.router.go('flashcards');
    });
  });
  el.querySelector('[data-dlg]')?.addEventListener('click', () => App.router.go('dialogues'));
}
