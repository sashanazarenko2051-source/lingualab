window.App = window.App || {};

// Achievement details: how to earn each one, progress toward it, and sharing
// with other players (a showcased badge appears next to your name on the
// leaderboard, synced through App.cloud).
App.achievements = (function () {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const byId = (id) => App.gamification.ACHIEVEMENTS.find(a => a.id === id);

  function isUnlocked(id) {
    return (App.storage.state.stats.achievements || []).includes(id);
  }

  function openInfo(id) {
    const a = byId(id);
    if (!a) return;
    const state = App.storage.state;
    const unlocked = isUnlocked(id);
    const value = Math.min(a.value(state), a.goal);
    const pct = Math.round((value / a.goal) * 100);
    const name = App.t(a.titleKey, { n: a.goal });
    const shared = App.storage.getProfile().showcase === id;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card ach-card ${unlocked ? 'ach-card-unlocked' : ''}">
        <div class="ach-card-icon">${a.icon}</div>
        <h3>${esc(name)}</h3>
        <div class="ach-card-status">${unlocked ? '✅ ' + App.t('ach_unlocked') : '🔒 ' + App.t('ach_locked')}</div>
        <div class="ach-card-how"><b>${App.t('ach_how')}</b> ${App.t(a.howKey, { n: a.goal })}</div>
        <div class="ach-card-progress"><div class="ach-card-fill" style="width:${pct}%"></div></div>
        <div class="ach-card-count">${value} / ${a.goal}${unlocked ? '' : ' · ' + App.t('ach_left', { n: a.goal - value })}</div>
        <div class="profile-modal-actions">
          ${unlocked ? `
            <button class="action-card" id="ach-copy" style="display:inline-flex">📋 ${App.t('ach_copy')}</button>
            <button class="action-card ach-share ${shared ? 'on' : ''}" id="ach-share" style="display:inline-flex">${shared ? '✅ ' + App.t('ach_pinned') : '📌 ' + App.t('ach_pin')}</button>` : ''}
          <button class="action-card" id="ach-close" style="display:inline-flex">${App.t('ach_close')}</button>
        </div>
        ${unlocked ? `<div class="ach-card-note">${App.t('ach_share_note')}</div>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#ach-close').addEventListener('click', close);

    overlay.querySelector('#ach-share')?.addEventListener('click', (e) => {
      const profile = App.storage.getProfile();
      const on = profile.showcase !== id;
      App.storage.setProfile(Object.assign({}, profile, { showcase: on ? id : null }));
      if (App.cloud && App.cloud.scheduleSync) App.cloud.scheduleSync();
      e.currentTarget.classList.toggle('on', on);
      e.currentTarget.textContent = on ? '✅ ' + App.t('ach_pinned') : '📌 ' + App.t('ach_pin');
      if (App.profile) App.profile.renderTopbarBadge();
      if (on) App.effects.confetti();
    });
    overlay.querySelector('#ach-copy')?.addEventListener('click', (e) => {
      const text = App.t('ach_share_text', { name, icon: a.icon });
      const btn = e.currentTarget;
      const done = () => { btn.textContent = '✅ ' + App.t('ach_copied'); };
      try {
        navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
      } catch (err) { fallbackCopy(text, done); }
    });
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
    ta.remove();
  }

  // Badge strip for a leaderboard row: the showcased badge first and
  // highlighted, then the rest of the player's achievements.
  function badgesHtml(ids, showcase) {
    const list = (ids || []).map(byId).filter(Boolean);
    if (!list.length) return '';
    list.sort((x, y) => (y.id === showcase) - (x.id === showcase));
    return `<span class="lb-ach">${list.slice(0, 6).map(a =>
      `<span class="lb-ach-icon ${a.id === showcase ? 'showcase' : ''}" title="${esc(App.t(a.titleKey, { n: a.goal }))}">${a.icon}</span>`).join('')}</span>`;
  }

  return { openInfo, badgesHtml, isUnlocked };
})();
