window.App = window.App || {};
App.views = App.views || {};

(function () {

// The shop page: cards grouped by section. Each card buys for yourself, and
// most can be gifted to a friend (picked from the friends list).
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Languages picked on the "5 languages" card, kept while the page is redrawn.
let chosen5 = [];
const SECTIONS = [
  ['topics', '🔓', 'shop_sec_topics'],
  ['hearts', '❤️', 'shop_sec_hearts'],
  ['energy', '⚡', 'shop_sec_energy'],
  ['hints', '💡', 'shop_sec_hints'],
  ['ach', '🏆', 'shop_sec_ach'],
  ['themes', '🎨', 'shop_sec_themes'],
  ['hats', '🎩', 'shop_sec_hats'],
  ['owned', '🛍️', 'shop_sec_owned']
];

function render(root) {
  const focus = App.session.shopSection;
  App.session.shopSection = null;
  // Sections where everything is already bought are left out.
  const shown = SECTIONS.map(sec => [...sec, sectionHtml(sec[0])]).filter(sec => sec[3]);
  root.innerHTML = `
    <div class="shop-page">
      <h1 class="settings-title">🛒 ${App.t('nav_shop')}</h1>
      <p class="settings-hint">${App.t('shop_sub')}</p>
      <div class="shop-tabs">${shown.map(([id, icon, key]) => `<button class="shop-tab" data-jump="${id}">${icon} ${App.t(key)}</button>`).join('')}</div>
      ${shown.map(([id, icon, key, html]) => `
        <section class="settings-card shop-section" id="shop-${id}">
          <h2>${icon} ${App.t(key)}</h2>
          <div class="shop-grid">${html}</div>
        </section>`).join('')}
    </div>`;
  bind(root);
  root.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => {
    root.querySelector('#shop-' + b.dataset.jump).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  if (focus) setTimeout(() => { const el = root.querySelector('#shop-' + focus); if (el) el.scrollIntoView({ block: 'start' }); }, 50);
}

function termSelect(itemId) {
  return `<select class="shop-term" data-term-for="${itemId}">${App.shop.TERMS.map(t =>
    `<option value="${t.id}">${App.t('term_' + t.id)} — ${App.shop.priceLabel(t.price)}</option>`).join('')}</select>`;
}

// One card. opts are fixed options (lang, id, theme); owned shows a badge.
function card(itemId, { title, icon, opts, owned, note, extra, ownedLabel }) {
  const it = App.shop.ITEMS[itemId];
  const o = esc(JSON.stringify(opts || {}));
  return `
    <div class="shop-card${owned ? ' owned' : ''}">
      <div class="shop-card-icon">${icon || it.icon}</div>
      <div class="shop-card-title">${title}</div>
      ${note ? `<div class="shop-card-note">${note}</div>` : ''}
      ${it.term ? termSelect(itemId) : `<div class="shop-card-price">${App.shop.priceLabel(App.shop.price(itemId, opts))}</div>`}
      ${extra || ''}
      <div class="shop-card-actions">
        ${owned ? `<span class="shop-owned">✅ ${ownedLabel || App.t('shop_owned')}</span>`
          : `<button class="quiz-next shop-buy" data-buy="${itemId}" data-opts="${o}">${App.t('shop_buy')}</button>`}
        ${it.gift ? `<button class="action-card shop-gift" data-gift="${itemId}" data-opts="${o}" title="${App.t('shop_gift')}">🎁</button>` : ''}
        ${App.shop.COIN_PRICES[itemId] ? `<button class="action-card shop-coins" data-coinbuy="${itemId}" title="${App.t('shop_buy_coins')}">🪙 ${App.shop.COIN_PRICES[itemId]}</button>` : ''}
      </div>
    </div>`;
}

function untilNote(ts) {
  return ts > Date.now() ? '∞ ' + App.t('shop_active_until', { date: new Date(ts).toLocaleDateString() }) : '';
}

function sectionHtml(id) {
  const code = App.storage.getCurrentLang();
  if (id === 'topics') {
    // One language of your choice; only languages not open yet are listed.
    const open = App.LANG_ORDER.filter(c => !App.shop.ownsTopics(c));
    const pick = `<select class="shop-term" data-lang-pick>${open.map(c =>
      `<option value="${c}" ${c === code ? 'selected' : ''}>${App.ui.langName(c)}</option>`).join('')}</select>`;
    const openHalf = App.LANG_ORDER.filter(c => !App.shop.ownsHalf(c));
    const pickHalf = `<select class="shop-term" data-lang-pick-half>${openHalf.map(c =>
      `<option value="${c}" ${c === code ? 'selected' : ''}>${App.ui.langName(c)}</option>`).join('')}</select>`;
    return [
    card('unlock_half', { title: App.t('shop_unlock_half_pick'), owned: !openHalf.length, extra: openHalf.length ? pickHalf : '' }),
    card('unlock_1', { title: App.t('shop_unlock_1_pick'), owned: !open.length, extra: open.length ? pick : '' }),
    card('unlock_5', { title: App.t('shop_unlock_5'), owned: App.shop.ownsAllTopics(), extra: App.shop.ownsAllTopics() ? '' : `
      <button class="action-card shop-pick5" data-pick5>🌍 ${App.t('shop_pick_langs', { n: chosen5.length })}</button>
      ${chosen5.length ? `<div class="shop-chosen">${chosen5.map(c => App.ui.flagChip(c)).join('')}</div>` : ''}` }),
    card('unlock_all', { title: App.t('shop_unlock_all'), owned: App.shop.ownsAllTopics() })
  ].join('');
  }
  if (id === 'hearts') return [
    ...[10, 25, 100, 200].map(n => card('hearts_' + n, { title: App.t('shop_hearts_n', { n }) })),
    card('hearts_unl', { title: App.t('shop_hearts_unl'), note: untilNote(App.shop.state().heartsUntil || 0) })
  ].join('');
  if (id === 'energy') return [
    ...[50, 100, 150, 200].map(n => card('energy_' + n, { title: App.t('shop_energy_n', { n }) })),
    card('energy_unl', { title: App.t('shop_energy_unl'), note: untilNote((App.storage.state.energy || {}).unlimitedUntil || 0) })
  ].join('');
  if (id === 'ach') {
    const all = App.gamification.ACHIEVEMENTS;
    const have = App.storage.state.stats.achievements || [];
    return card('ach_all', { title: App.t('shop_ach_all'), owned: all.every(a => have.includes(a.id)) }) +
      all.map(a => card('ach', { title: esc(App.t(a.titleKey, { n: a.goal })), icon: a.icon, opts: { id: a.id }, owned: have.includes(a.id), ownedLabel: App.t('ach_unlocked') })).join('');
  }
  if (id === 'themes') return App.theme.PREMIUM.filter(name => !App.shop.ownsTheme(name)).map(name => card('theme', {
    title: App.t('theme_' + name), icon: themeSwatch(name), opts: { theme: name },
    extra: `<button class="action-card shop-apply" data-preview-theme="${name}">👁 ${App.t('theme_preview')}</button>`
  })).join('');
  if (id === 'hints') return [10, 30, 100].map(n => card('hints_' + n, { title: App.t('shop_hints_n', { n }) })).join('');
  if (id === 'hats') return App.profile.SHOP_HATS.filter(h => !App.profile.ownsHat(h)).map(h => card('hat', {
    title: App.t('shop_hat'), icon: `<span class="shop-hat-icon">${App.profile.HATS[h]}</span>`, opts: { hat: h }
  })).join('');
  if (id === 'owned') return ownedHtml();
  return '';
}

function themeSwatch(name) {
  return `<span class="theme-swatch shop-swatch">${App.theme.swatch(name).map(c => `<i style="background:${c}"></i>`).join('')}</span>`;
}

// Everything bought: open topics, running unlimited packs, themes and hats.
function ownedHtml() {
  const tile = (icon, title, extra) => `
    <div class="shop-card owned">
      <div class="shop-card-icon">${icon}</div>
      <div class="shop-card-title">${title}</div>
      ${extra || `<span class="shop-owned">✅ ${App.t('shop_owned')}</span>`}
    </div>`;
  const out = [];
  const langs = App.shop.ownsAllTopics() ? App.LANG_ORDER : App.LANG_ORDER.filter(c => App.shop.ownsTopics(c));
  if (langs.length) out.push(tile('🔓', App.shop.ownsAllTopics() ? App.t('shop_unlock_all') : App.t('shop_owned_topics'),
    `<div class="shop-chosen">${langs.map(c => App.ui.flagChip(c)).join('')}</div>`));
  const half = App.LANG_ORDER.filter(c => App.shop.ownsHalf(c) && !App.shop.ownsTopics(c));
  if (half.length) out.push(tile('🔓', App.t('shop_unlock_half_pick'), `<div class="shop-chosen">${half.map(c => App.ui.flagChip(c)).join('')}</div>`));
  const hearts = untilNote(App.shop.state().heartsUntil || 0);
  if (hearts) out.push(tile('💖', App.t('shop_hearts_unl'), `<div class="shop-card-note">${hearts}</div>`));
  const energy = untilNote((App.storage.state.energy || {}).unlimitedUntil || 0);
  if (energy) out.push(tile('🔋', App.t('shop_energy_unl'), `<div class="shop-card-note">${energy}</div>`));
  const current = App.theme.settings().theme;
  App.theme.PREMIUM.filter(name => App.shop.ownsTheme(name)).forEach(name => out.push(tile(themeSwatch(name), App.t('theme_' + name),
    name === current ? `<span class="shop-owned">✅ ${App.t('shop_owned')}</span>`
      : `<button class="action-card shop-apply" data-apply-theme="${name}">${App.t('shop_apply')}</button>`)));
  const hat = (App.storage.getProfile() || {}).hat;
  App.profile.SHOP_HATS.filter(h => App.profile.ownsHat(h)).forEach(h => out.push(tile(`<span class="shop-hat-icon">${App.profile.HATS[h]}</span>`, App.t('shop_hat'),
    h === hat ? `<span class="shop-owned">✅ ${App.t('shop_worn')}</span>`
      : `<button class="action-card shop-apply" data-wear-hat="${h}">🎩 ${App.t('shop_wear')}</button>`)));
  return out.join('') || `<p class="shop-owned-empty">${App.t('shop_owned_empty')}</p>`;
}

function readOpts(btn, root) {
  const opts = JSON.parse(btn.dataset.opts || '{}');
  const itemId = btn.dataset.buy || btn.dataset.gift;
  if (App.shop.ITEMS[itemId].term) opts.term = root.querySelector(`[data-term-for="${itemId}"]`).value;
  if (itemId === 'unlock_1') opts.lang = root.querySelector('[data-lang-pick]').value;
  if (itemId === 'unlock_half') opts.lang = root.querySelector('[data-lang-pick-half]').value;
  return { itemId, opts };
}

function bind(root) {
  const rerender = () => render(root);
  root.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
    const { itemId, opts } = readOpts(b, root);
    if (itemId === 'unlock_5') {
      const go = () => App.shop.buy('unlock_5', { langs: chosen5 }).then(ok => { if (ok) { chosen5 = []; rerender(); } });
      if (chosen5.length === 5) go(); else pickLanguages(langs => { chosen5 = langs; rerender(); go(); });
      return;
    }
    App.shop.buy(itemId, opts).then(ok => ok && rerender());
  }));
  root.querySelectorAll('[data-coinbuy]').forEach(b => b.addEventListener('click', () => {
    if (App.shop.buyWithCoins(b.dataset.coinbuy, {})) rerender();
  }));
  root.querySelectorAll('[data-pick5]').forEach(b => b.addEventListener('click', () => {
    pickLanguages(langs => { chosen5 = langs; rerender(); });
  }));
  root.querySelectorAll('[data-gift]').forEach(b => b.addEventListener('click', () => {
    const { itemId, opts } = readOpts(b, root);
    if (itemId === 'unlock_5') {
      const gift = langs => pickFriend(uid => App.shop.buy('unlock_5', { langs }, uid));
      if (chosen5.length === 5) gift(chosen5); else pickLanguages(langs => { chosen5 = langs; rerender(); gift(langs); });
      return;
    }
    pickFriend(uid => App.shop.buy(itemId, opts, uid));
  }));
  root.querySelectorAll('[data-preview-theme]').forEach(b => b.addEventListener('click', () => App.theme.preview(b.dataset.previewTheme)));
  root.querySelectorAll('[data-apply-theme]').forEach(b => b.addEventListener('click', () => {
    if (App.theme.setTheme(b.dataset.applyTheme)) rerender();
  }));
  root.querySelectorAll('[data-wear-hat]').forEach(b => b.addEventListener('click', () => {
    App.storage.setProfile({ hat: b.dataset.wearHat });
    App.profile.renderTopbarBadge();
    if (App.cloud && App.cloud.scheduleSync) App.cloud.scheduleSync();
    rerender();
  }));
}

function modal(inner) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-card shop-modal">${inner}</div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  return overlay;
}

// Five languages whose topics aren't open yet.
function pickLanguages(done) {
  const langs = App.LANG_ORDER.filter(c => !App.shop.ownsTopics(c));
  const ov = modal(`
    <h3 id="pick-title">${App.t('shop_pick_langs', { n: 0 })}</h3>
    <div class="shop-pick">${langs.map(c => `<label class="shop-pick-item"><input type="checkbox" value="${c}" ${chosen5.includes(c) ? 'checked' : ''}> ${App.ui.langLabel(c)}</label>`).join('')}</div>
    <div class="profile-modal-actions">
      <button class="action-card" id="pick-cancel" style="display:inline-flex">${App.t('profile_cancel')}</button>
      <button class="quiz-next" id="pick-ok" disabled>${App.t('shop_confirm')}</button>
    </div>`);
  const boxes = [...ov.querySelectorAll('input[type=checkbox]')];
  const sync = () => {
    const n = boxes.filter(x => x.checked).length;
    boxes.forEach(x => { x.disabled = !x.checked && n >= 5; });
    ov.querySelector('#pick-title').textContent = App.t('shop_pick_langs', { n });
    ov.querySelector('#pick-ok').disabled = n !== Math.min(5, boxes.length);
  };
  boxes.forEach(x => x.addEventListener('change', sync));
  sync();
  ov.querySelector('#pick-cancel').addEventListener('click', () => ov.remove());
  ov.querySelector('#pick-ok').addEventListener('click', () => { const sel = boxes.filter(x => x.checked).map(x => x.value); ov.remove(); done(sel); });
}

// A friend from the friends list (needs the online account).
function pickFriend(done) {
  if (!App.cloud.isConfigured()) { App.effects.toast('🎁 ' + App.t('shop_gift_offline')); return; }
  const ids = App.storage.getFriends();
  if (!ids.length) { App.effects.toast('🎁 ' + App.t('shop_no_friends')); return; }
  const ov = modal(`<h3>🎁 ${App.t('shop_pick_friend')}</h3><div class="shop-pick" id="pick-friends">${App.t('lb_loading')}</div>
    <div class="profile-modal-actions"><button class="action-card" id="pick-cancel" style="display:inline-flex">${App.t('profile_cancel')}</button></div>`);
  ov.querySelector('#pick-cancel').addEventListener('click', () => ov.remove());
  App.cloud.fetchUsers(ids).then(rows => {
    const box = ov.querySelector('#pick-friends');
    box.innerHTML = rows.map(r => `<button class="action-card shop-friend" data-uid="${esc(r.uid)}">${esc(r.name || App.t('profile_default_name'))}</button>`).join('');
    box.querySelectorAll('[data-uid]').forEach(b => b.addEventListener('click', () => { ov.remove(); done(b.dataset.uid); }));
  });
}

App.views.shop = { render };

})();
