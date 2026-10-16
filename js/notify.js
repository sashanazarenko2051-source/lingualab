window.App = window.App || {};

// Study reminders ("you haven't studied for 3 days", "your streak ends at
// midnight"). Shown as a banner inside the app and, when the learner allows
// it, as a system notification: a Windows toast through the desktop wrapper
// (window.pywebview.api.notify) or the browser Notification API on a phone.
// Checked at startup and every 30 minutes while the app is open; at most one
// system notification per kind per day.
//
// In the phone app (Capacitor build) reminders are scheduled ahead with the
// LocalNotifications plugin, so they arrive even while the app is closed:
// today at REMIND_HOUR if not studied yet, then 1, 2, 3 and 7 days later.
// They're rescheduled at every start and after each studied day.
App.notify = (function () {
  const CHECK_EVERY_MS = 30 * 60 * 1000;
  const STREAK_WARN_HOUR = 18;
  const REMIND_HOUR = 19;
  const NATIVE_IDS = [101, 102, 103, 104, 105];

  function settings() {
    const st = App.storage.state.settings || (App.storage.state.settings = {});
    if (typeof st.notify !== 'boolean') st.notify = true;
    if (!st.notified || typeof st.notified !== 'object') st.notified = {};
    return st;
  }
  function enabled() { return settings().notify; }

  function daysBetween(fromKey, to) {
    if (!fromKey) return Infinity;
    const [y, m, d] = fromKey.split('-').map(Number);
    const a = new Date(y, m - 1, d);
    const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((b - a) / 86400000);
  }

  // The reminder that fits right now, or null.
  function current(now) {
    now = now || new Date();
    const stats = App.storage.state.stats;
    const name = (App.storage.state.profile && App.storage.state.profile.name) || '';
    const gap = daysBetween(stats.lastActiveDate, now);
    if (gap === 0) return null;
    if (gap === Infinity) {
      // Never studied: only nudge once a profile exists.
      return name ? { kind: 'start', title: App.t('notify_start_title'), body: App.t('notify_start_body') } : null;
    }
    if (gap >= 2) {
      return { kind: 'away', title: App.t('notify_away_title', { name }), body: App.t('notify_away_body', { n: gap }) };
    }
    // gap === 1: studied yesterday, not yet today.
    if ((stats.streak || 0) >= 1 && now.getHours() >= STREAK_WARN_HOUR) {
      return { kind: 'streak', title: App.t('notify_streak_title'), body: App.t('notify_streak_body', { n: stats.streak }) };
    }
    return { kind: 'today', title: App.t('notify_today_title'), body: App.t('notify_today_body') };
  }

  // ---- delivery -------------------------------------------------------------
  function nativePlugin() {
    const c = window.Capacitor;
    return c && c.isNativePlatform && c.isNativePlatform() && c.Plugins && c.Plugins.LocalNotifications;
  }
  function hasDesktop() { return !!(window.pywebview && window.pywebview.api && window.pywebview.api.notify); }
  function hasBrowser() { return 'Notification' in window; }

  function permission() {
    if (nativePlugin() || hasDesktop()) return 'granted';
    if (!hasBrowser()) return 'unsupported';
    return Notification.permission;
  }
  // Asks the browser for permission (desktop needs none). Resolves the result.
  function requestPermission() {
    const ln = nativePlugin();
    if (ln) return ln.requestPermissions().then(r => r.display === 'granted' ? 'granted' : 'denied').catch(() => 'denied');
    if (hasDesktop()) return Promise.resolve('granted');
    if (!hasBrowser()) return Promise.resolve('unsupported');
    if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
    return Notification.requestPermission();
  }

  function system(title, body) {
    try {
      const ln = nativePlugin();
      if (ln) { ln.schedule({ notifications: [{ id: 100, title, body, schedule: { at: new Date(Date.now() + 1000) } }] }); return true; }
      if (hasDesktop()) { window.pywebview.api.notify(title, body); return true; }
      if (hasBrowser() && Notification.permission === 'granted') {
        new Notification(title, { body, icon: 'icon-192.png', tag: 'lingualab-reminder' });
        return true;
      }
    } catch (e) { /* notifications are best-effort */ }
    return false;
  }

  function test() {
    return requestPermission().then(p => {
      const ok = p === 'granted' && system(App.t('notify_test_title'), App.t('notify_test_body'));
      if (!ok) App.effects.toast(App.t(p === 'denied' ? 'notify_blocked' : 'notify_unsupported'));
      return ok;
    });
  }

  // ---- banner ---------------------------------------------------------------
  let dismissed = null;
  function bannerHtml() {
    if (!enabled()) return '';
    const r = current();
    if (!r || dismissed === r.kind + todayKey()) return '';
    return `<div class="notify-banner notify-${r.kind}" id="notify-banner">
      <span class="notify-banner-ico">${r.kind === 'streak' ? '🔥' : r.kind === 'away' ? '🐺' : '📚'}</span>
      <div class="notify-banner-text"><b>${r.title}</b><span>${r.body}</span></div>
      <button class="notify-banner-go" id="notify-banner-go">${App.t('notify_go')}</button>
      <button class="notify-banner-x" id="notify-banner-x" title="${App.t('notify_dismiss')}">✕</button>
    </div>`;
  }
  function bindBanner(root, onGo) {
    const b = root.querySelector('#notify-banner');
    if (!b) return;
    const r = current();
    b.querySelector('#notify-banner-x').addEventListener('click', () => { dismissed = r.kind + todayKey(); b.remove(); });
    b.querySelector('#notify-banner-go').addEventListener('click', () => { b.remove(); onGo(); });
  }
  function todayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  // ---- scheduler ------------------------------------------------------------
  function check() {
    if (!enabled()) return;
    const r = current();
    if (!r) return;
    const st = settings();
    const key = r.kind + ':' + todayKey();
    if (st.notified[key]) return;
    if (system(r.title, r.body)) {
      // Keep only today's marks.
      Object.keys(st.notified).forEach(k => { if (!k.endsWith(todayKey())) delete st.notified[k]; });
      st.notified[key] = true;
      App.storage.save();
    }
  }

  // Phone app: replaces the scheduled reminders with fresh ones.
  function reschedule() {
    const ln = nativePlugin();
    if (!ln) return;
    ln.cancel({ notifications: NATIVE_IDS.map(id => ({ id })) }).catch(() => {}).then(() => {
      if (!enabled()) return;
      const stats = App.storage.state.stats;
      const studiedToday = daysBetween(stats.lastActiveDate, new Date()) === 0;
      const at = (days) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(REMIND_HOUR, 0, 0, 0); return d; };
      const list = [];
      if (!studiedToday && at(0) > new Date()) {
        list.push({ id: NATIVE_IDS[0], at: at(0), title: App.t('notify_streak_title'), body: App.t('notify_streak_body', { n: stats.streak || 1 }) });
      }
      [1, 2, 3, 7].forEach((days, i) => {
        const gap = studiedToday ? days : days + 1;
        list.push({ id: NATIVE_IDS[i + 1], at: at(days),
          title: App.t('notify_away_title', { name: (App.storage.state.profile || {}).name || '' }),
          body: App.t('notify_away_body', { n: gap }) });
      });
      ln.schedule({ notifications: list.map(n => ({ id: n.id, title: n.title, body: n.body, schedule: { at: n.at, allowWhileIdle: true } })) }).catch(() => {});
    });
  }

  function start() {
    reschedule();
    // pywebview injects its API shortly after load.
    setTimeout(check, 4000);
    setInterval(check, CHECK_EVERY_MS);
  }

  function setEnabled(on) {
    settings().notify = !!on;
    App.storage.save();
    reschedule();
    if (on) return requestPermission();
    return Promise.resolve(permission());
  }

  return { current, reschedule, enabled, setEnabled, permission, requestPermission, test, bannerHtml, bindBanner, start, check };
})();
