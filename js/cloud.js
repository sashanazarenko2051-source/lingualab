window.App = window.App || {};

// Thin wrapper around Firebase (Auth + Firestore) for the weekly leaderboard.
// Every visitor gets a persistent anonymous account (no email/password) so
// the leaderboard can show real other learners without a login flow. If
// js/firebase-config.js hasn't been filled in yet, every method here is a
// harmless no-op and the rest of the app behaves exactly as before.
App.cloud = (function () {
  const cfg = window.APP_FIREBASE_CONFIG;
  const configured = !!(cfg && cfg.apiKey && cfg.apiKey.indexOf('YOUR_') !== 0 && window.firebase);

  let uid = null;
  let db = null;
  let isReady = false;
  const readyCbs = [];
  let syncTimer = null;

  if (configured) {
    firebase.initializeApp(cfg);
    db = firebase.firestore();
    firebase.auth().signInAnonymously().catch(err => console.error('Firebase sign-in failed', err));
    firebase.auth().onAuthStateChanged(user => {
      if (!user) return;
      uid = user.uid;
      isReady = true;
      readyCbs.forEach(cb => cb());
      readyCbs.length = 0;
    });
  }

  function onReady(cb) {
    if (isReady) cb(); else readyCbs.push(cb);
  }

  function syncProfile(profile, level, weeklyXP) {
    if (!configured || !uid || !db) return Promise.resolve();
    const week = App.storage.isoWeekKey(new Date());
    return db.collection('users').doc(uid).set({
      uid, name: profile.name, animal: profile.animal, color: profile.color,
      level, weeklyXP, week,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  // Debounced so rapid-fire quiz answers don't hammer Firestore with a write per question.
  function scheduleSync() {
    if (!configured) return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      onReady(() => {
        const profile = App.storage.getProfile();
        if (!profile || !profile.name) return;
        const level = App.levels.forCurrentLang();
        const wk = App.storage.getWeeklyXP();
        syncProfile(profile, level, wk.xp);
      });
    }, 4000);
  }

  function fetchLeaderboard(level) {
    if (!configured || !db) return Promise.resolve([]);
    const week = App.storage.isoWeekKey(new Date());
    return db.collection('users')
      .where('week', '==', week)
      .where('level', '==', level)
      .orderBy('weeklyXP', 'desc')
      .limit(50)
      .get()
      .then(snap => snap.docs.map(d => d.data()));
  }

  return {
    isConfigured: () => configured,
    onReady,
    scheduleSync,
    fetchLeaderboard,
    getUid: () => uid
  };
})();
