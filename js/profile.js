window.App = window.App || {};

App.profile = (function () {
  const ANIMALS = ['wolf', 'fox', 'cat', 'dog', 'owl', 'panda', 'koala', 'lion',
    'tiger', 'rabbit', 'hamster', 'raccoon', 'frog', 'monkey', 'unicorn', 'penguin',
    'bear', 'elephant', 'pig', 'cow', 'sheep', 'deer', 'squirrel', 'turtle',
    'chick', 'dragon', 'bee', 'butterfly', 'octopus', 'dolphin',
    'bird', 'eagle', 'parrot', 'fish', 'shark', 'whale', 'crab', 'ladybug', 'spider',
    'chicken', 'duck', 'swan', 'peacock', 'horse', 'zebra', 'hippo', 'gorilla',
    'sloth', 'otter', 'hedgehog', 'goat', 'llama'];

  const ANIMAL_EMOJI = {
    wolf: '🐺', fox: '🦊', cat: '🐱', dog: '🐶', owl: '🦉', panda: '🐼', koala: '🐨', lion: '🦁',
    tiger: '🐯', rabbit: '🐰', hamster: '🐹', raccoon: '🦝', frog: '🐸', monkey: '🐵', unicorn: '🦄', penguin: '🐧',
    bear: '🐻', elephant: '🐘', pig: '🐷', cow: '🐮', sheep: '🐑', deer: '🦌', squirrel: '🐿️', turtle: '🐢',
    chick: '🐤', dragon: '🐉', bee: '🐝', butterfly: '🦋', octopus: '🐙', dolphin: '🐬',
    bird: '🐦', eagle: '🦅', parrot: '🦜', fish: '🐟', shark: '🦈', whale: '🐳', crab: '🦀', ladybug: '🐞', spider: '🕷️',
    chicken: '🐔', duck: '🦆', swan: '🦢', peacock: '🦚', horse: '🐴', zebra: '🦓', hippo: '🦛', gorilla: '🦍',
    sloth: '🦥', otter: '🦦', hedgehog: '🦔', goat: '🐐', llama: '🦙'
  };

  const COLORS = [
    '#00e5ff', '#0088ff', '#0ea5e9', '#4dd0ff', '#39ff9d', '#00c46a', '#22c55e', '#a3ff4d',
    '#ffcf3f', '#eab308', '#ff8a3d', '#f97316', '#ff3d6e', '#ff0044', '#ec4899', '#ff2ec4',
    '#b829ff', '#8b5cf6', '#7c3aed', '#0d9488', '#ffffff', '#8a95a6', '#6b4226', '#000000'
  ];

  const BG_PATTERNS = ['solid', 'forest', 'sky', 'sunset', 'ocean', 'space', 'meadow',
    'mountain', 'desert', 'snow', 'volcano', 'city', 'rainbow',
    'jungle', 'waterfall', 'cave', 'candy', 'galaxy', 'coral', 'autumn', 'spring',
    'neon', 'beach', 'rain', 'storm', 'blossom', 'bamboo', 'icecave', 'campfire',
    'underwater', 'tropical', 'checker', 'stripes'];

  // Flag badge reuses the app's existing CSS-drawn language flags — no new
  // art needed. Read lazily (App.LANG_ORDER isn't defined yet when this file
  // loads, since app.js loads later) rather than cached at module init time.
  function flagList() { return App.LANG_ORDER || []; }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Emoji glyphs can't be recolored directly, so picking an accent color
  // also re-tints the animal itself: sepia() flattens it to one warm hue,
  // then hue-rotate() spins that hue to match the chosen swatch.
  function hexToHue(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return h;
  }

  function tintFilter(hex) {
    const rotate = Math.round(hexToHue(hex) - 35);
    return `sepia(1) saturate(6) hue-rotate(${rotate}deg) brightness(1.05)`;
  }

  // Old profiles only had a single `color` field; fold that into all three
  // new slots so avatars saved before this update still render correctly.
  function normalize(p) {
    p = p || {};
    const legacy = p.color || COLORS[0];
    return {
      name: p.name || '',
      animal: p.animal || 'wolf',
      animalColor: p.animalColor || legacy,
      bgColor: p.bgColor || legacy,
      outlineColor: p.outlineColor || legacy,
      bgPattern: BG_PATTERNS.includes(p.bgPattern) ? p.bgPattern : 'solid',
      flag: p.flag || null
    };
  }

  function avatarBadgeHtml(profile, size) {
    size = size || 40;
    const p = normalize(profile);
    const emoji = ANIMAL_EMOJI[p.animal] || ANIMAL_EMOJI.wolf;
    const patternClass = p.bgPattern !== 'solid' ? ` avatar-bg-${p.bgPattern}` : '';
    const bgStyle = p.bgPattern === 'solid'
      ? `background: radial-gradient(circle at 35% 30%, color-mix(in srgb, ${p.bgColor} 45%, var(--surface-2)), color-mix(in srgb, ${p.bgColor} 14%, var(--surface-2)) 75%);`
      : '';
    const flagBadge = p.flag ? `<span class="avatar-flag-badge">${App.ui.flagChip(p.flag)}</span>` : '';
    return `<span class="avatar-badge${patternClass}" style="--avatar-size:${size}px; --avatar-color:${p.outlineColor}; ${bgStyle}"><span class="avatar-badge-emoji" style="filter:${tintFilter(p.animalColor)}">${emoji}</span>${flagBadge}</span>`;
  }

  function ensureProfile() {
    const p = App.storage.getProfile();
    if (!p || !p.animal || !p.animalColor) App.storage.setProfile(normalize(p));
  }

  function renderTopbarBadge() {
    const btn = document.getElementById('topbar-avatar-btn');
    if (!btn) return;
    ensureProfile();
    btn.innerHTML = avatarBadgeHtml(App.storage.getProfile(), 32);
  }

  function colorRowHtml(idPrefix, current) {
    return COLORS.map(c => `<button type="button" class="profile-color-opt ${c === current ? 'active' : ''}" data-role="${idPrefix}" data-color="${c}" style="--c:${c}"></button>`).join('');
  }

  function openEditor(onSave) {
    ensureProfile();
    const p = App.storage.getProfile();
    let draft = normalize(p);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card">
        <h3>${App.t('profile_edit_title')}</h3>
        <label class="profile-name-label">${App.t('profile_name_label')}
          <input type="text" id="profile-name-input" maxlength="18" value="${escapeHtml(draft.name)}" placeholder="${escapeHtml(App.t('profile_name_placeholder'))}">
        </label>
        <div class="profile-preview" id="profile-preview">${avatarBadgeHtml(draft, 72)}</div>

        <div class="profile-section-label">${App.t('profile_animal_label')}</div>
        <div class="profile-animal-grid" id="profile-animal-grid">
          ${ANIMALS.map(a => `<button type="button" class="profile-animal-opt ${a === draft.animal ? 'active' : ''}" data-animal="${a}">${ANIMAL_EMOJI[a]}</button>`).join('')}
        </div>

        <div class="profile-section-label">${App.t('profile_bg_pattern_label')}</div>
        <div class="profile-pattern-row" id="profile-pattern-row">
          ${BG_PATTERNS.map(pat => `<button type="button" class="profile-pattern-opt avatar-bg-${pat === 'solid' ? 'solid' : pat} ${pat === draft.bgPattern ? 'active' : ''}" data-pattern="${pat}" title="${App.t('bgp_' + pat)}"></button>`).join('')}
        </div>

        <div class="profile-section-label">${App.t('profile_animal_color_label')}</div>
        <div class="profile-color-row" id="profile-color-row-animal">${colorRowHtml('animal', draft.animalColor)}</div>

        <div class="profile-section-label" id="profile-bg-color-label">${App.t('profile_bg_color_label')}</div>
        <div class="profile-color-row" id="profile-color-row-bg">${colorRowHtml('bg', draft.bgColor)}</div>

        <div class="profile-section-label">${App.t('profile_outline_color_label')}</div>
        <div class="profile-color-row" id="profile-color-row-outline">${colorRowHtml('outline', draft.outlineColor)}</div>

        <div class="profile-section-label">${App.t('profile_flag_label')}</div>
        <div class="profile-flag-row" id="profile-flag-row">
          <button type="button" class="profile-flag-opt profile-flag-none ${!draft.flag ? 'active' : ''}" data-flag="">✕</button>
          ${flagList().map(code => `<button type="button" class="profile-flag-opt ${code === draft.flag ? 'active' : ''}" data-flag="${code}">${App.ui.flagChip(code)}</button>`).join('')}
        </div>

        <div class="profile-modal-actions">
          <button class="action-card" id="profile-cancel" style="display:inline-flex">${App.t('profile_cancel')}</button>
          <button class="action-card" id="profile-save" style="display:inline-flex">${App.t('profile_save')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    function updateBgColorRowVisibility() {
      const isSolid = draft.bgPattern === 'solid';
      overlay.querySelector('#profile-bg-color-label').style.display = isSolid ? '' : 'none';
      overlay.querySelector('#profile-color-row-bg').style.display = isSolid ? '' : 'none';
    }

    function refreshPreview() {
      overlay.querySelector('#profile-preview').innerHTML = avatarBadgeHtml(draft, 72);
      overlay.querySelectorAll('.profile-animal-opt').forEach(b => b.classList.toggle('active', b.dataset.animal === draft.animal));
      overlay.querySelectorAll('.profile-pattern-opt').forEach(b => b.classList.toggle('active', b.dataset.pattern === draft.bgPattern));
      overlay.querySelectorAll('#profile-color-row-animal .profile-color-opt').forEach(b => b.classList.toggle('active', b.dataset.color === draft.animalColor));
      overlay.querySelectorAll('#profile-color-row-bg .profile-color-opt').forEach(b => b.classList.toggle('active', b.dataset.color === draft.bgColor));
      overlay.querySelectorAll('#profile-color-row-outline .profile-color-opt').forEach(b => b.classList.toggle('active', b.dataset.color === draft.outlineColor));
      overlay.querySelectorAll('.profile-flag-opt').forEach(b => b.classList.toggle('active', b.dataset.flag === (draft.flag || '')));
      updateBgColorRowVisibility();
    }

    overlay.querySelectorAll('.profile-animal-opt').forEach(btn => {
      btn.addEventListener('click', () => { draft.animal = btn.dataset.animal; refreshPreview(); });
    });
    overlay.querySelectorAll('.profile-pattern-opt').forEach(btn => {
      btn.addEventListener('click', () => { draft.bgPattern = btn.dataset.pattern; refreshPreview(); });
    });
    overlay.querySelectorAll('.profile-color-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.dataset.role;
        if (role === 'animal') draft.animalColor = btn.dataset.color;
        else if (role === 'bg') draft.bgColor = btn.dataset.color;
        else if (role === 'outline') draft.outlineColor = btn.dataset.color;
        refreshPreview();
      });
    });
    overlay.querySelectorAll('.profile-flag-opt').forEach(btn => {
      btn.addEventListener('click', () => { draft.flag = btn.dataset.flag || null; refreshPreview(); });
    });

    updateBgColorRowVisibility();

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

  return { ANIMALS, ANIMAL_EMOJI, COLORS, BG_PATTERNS, avatarBadgeHtml, ensureProfile, renderTopbarBadge, openEditor };
})();
