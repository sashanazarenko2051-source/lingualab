window.App = window.App || {};

App.profile = (function () {
  const ANIMALS = ['wolf', 'fox', 'cat', 'dog', 'owl', 'panda', 'koala', 'lion',
    'tiger', 'rabbit', 'hamster', 'raccoon', 'frog', 'monkey', 'unicorn', 'penguin'];

  const ANIMAL_EMOJI = {
    wolf: '🐺', fox: '🦊', cat: '🐱', dog: '🐶', owl: '🦉', panda: '🐼', koala: '🐨', lion: '🦁',
    tiger: '🐯', rabbit: '🐰', hamster: '🐹', raccoon: '🦝', frog: '🐸', monkey: '🐵', unicorn: '🦄', penguin: '🐧'
  };

  const COLORS = ['#00e5ff', '#b829ff', '#39ff9d', '#ffcf3f', '#ff3d6e', '#ff8a3d', '#4dd0ff', '#a3ff4d'];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function avatarBadgeHtml(profile, size) {
    size = size || 40;
    const emoji = ANIMAL_EMOJI[profile && profile.animal] || ANIMAL_EMOJI.wolf;
    const color = (profile && profile.color) || COLORS[0];
    return `<span class="avatar-badge" style="--avatar-size:${size}px; --avatar-color:${color}">${emoji}</span>`;
  }

  function ensureProfile() {
    const p = App.storage.getProfile();
    if (!p || !p.animal) App.storage.setProfile({ animal: 'wolf', color: COLORS[0] });
  }

  function renderTopbarBadge() {
    const btn = document.getElementById('topbar-avatar-btn');
    if (!btn) return;
    ensureProfile();
    btn.innerHTML = avatarBadgeHtml(App.storage.getProfile(), 32);
  }

  function openEditor(onSave) {
    ensureProfile();
    const p = App.storage.getProfile();
    let draft = Object.assign({}, p);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card">
        <h3>${App.t('profile_edit_title')}</h3>
        <label class="profile-name-label">${App.t('profile_name_label')}
          <input type="text" id="profile-name-input" maxlength="18" value="${escapeHtml(p.name || '')}" placeholder="${escapeHtml(App.t('profile_name_placeholder'))}">
        </label>
        <div class="profile-preview" id="profile-preview">${avatarBadgeHtml(draft, 72)}</div>
        <div class="profile-animal-grid" id="profile-animal-grid">
          ${ANIMALS.map(a => `<button type="button" class="profile-animal-opt ${a === draft.animal ? 'active' : ''}" data-animal="${a}">${ANIMAL_EMOJI[a]}</button>`).join('')}
        </div>
        <div class="profile-color-row" id="profile-color-row">
          ${COLORS.map(c => `<button type="button" class="profile-color-opt ${c === draft.color ? 'active' : ''}" data-color="${c}" style="--c:${c}"></button>`).join('')}
        </div>
        <div class="profile-modal-actions">
          <button class="action-card" id="profile-cancel" style="display:inline-flex">${App.t('profile_cancel')}</button>
          <button class="action-card" id="profile-save" style="display:inline-flex">${App.t('profile_save')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    function refreshPreview() {
      overlay.querySelector('#profile-preview').innerHTML = avatarBadgeHtml(draft, 72);
      overlay.querySelectorAll('.profile-animal-opt').forEach(b => b.classList.toggle('active', b.dataset.animal === draft.animal));
      overlay.querySelectorAll('.profile-color-opt').forEach(b => b.classList.toggle('active', b.dataset.color === draft.color));
    }

    overlay.querySelectorAll('.profile-animal-opt').forEach(btn => {
      btn.addEventListener('click', () => { draft.animal = btn.dataset.animal; refreshPreview(); });
    });
    overlay.querySelectorAll('.profile-color-opt').forEach(btn => {
      btn.addEventListener('click', () => { draft.color = btn.dataset.color; refreshPreview(); });
    });

    function close() { overlay.remove(); }
    overlay.querySelector('#profile-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    overlay.querySelector('#profile-save').addEventListener('click', () => {
      const name = overlay.querySelector('#profile-name-input').value.trim().slice(0, 18);
      draft.name = name || App.t('profile_default_name');
      App.storage.setProfile(draft);
      close();
      renderTopbarBadge();
      if (App.cloud && App.cloud.scheduleSync) App.cloud.scheduleSync();
      if (onSave) onSave(draft);
    });
  }

  return { ANIMALS, ANIMAL_EMOJI, COLORS, avatarBadgeHtml, ensureProfile, renderTopbarBadge, openEditor };
})();
