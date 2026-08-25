window.App = window.App || {};
App.views = App.views || {};

// Wrapped in an IIFE so this file's top-level helpers stay private — classic
// <script> tags share one global scope, and a same-named helper in another
// view file would otherwise silently collide with (or override) this one.
(function () {

App.views.dialogues = {
  render(root) {
    const code = App.storage.getCurrentLang();
    const lang = App.data[code];
    let selectedId = App.session.dialogueId || (lang.dialogues[0] && lang.dialogues[0].id);
    App.session.dialogueId = null;

    draw(root, lang, selectedId);
  }
};

function draw(root, lang, selectedId) {
  const dlg = lang.dialogues.find(d => d.id === selectedId) || lang.dialogues[0];

  root.innerHTML = `
    <div class="panel">
      <h3>${App.t('dlg_title_prefix')} — ${App.ui.langName(App.storage.getCurrentLang())}</h3>
      <div class="dialogue-list" id="dlist">
        ${lang.dialogues.map(d => `
          <div class="dialogue-item ${d.id === dlg.id ? 'active' : ''}" data-id="${d.id}">
            <span>${d.title}</span><span class="topic-card-meta">${d.level}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="panel">
      <h3>${dlg.title}</h3>
      <div id="lines">
        ${dlg.lines.map(line => `
          <div class="dialogue-line speaker-${line.s}">
            <span class="speaker-badge">${line.s}</span>
            <div class="dialogue-line-text">
              <div class="dialogue-line-orig">${line.text}</div>
              <div class="dialogue-line-trans">${line.t}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  root.querySelectorAll('#dlist .dialogue-item').forEach(el => {
    el.addEventListener('click', () => draw(root, lang, el.dataset.id));
  });
}

})();
