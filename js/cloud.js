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

  // Short code friends type in to find you: the first 6 characters of the uid.
  function getFriendCode() {
    return uid ? uid.slice(0, 6).toUpperCase() : '';
  }

  function syncProfile(profile, level, weeklyXP) {
    if (!configured || !uid || !db) return Promise.resolve();
    const week = App.storage.isoWeekKey(new Date());
    return db.collection('users').doc(uid).set({
      uid, name: profile.name, animal: profile.animal,
      animalColor: profile.animalColor, bgColor: profile.bgColor,
      outlineColor: profile.outlineColor, bgPattern: profile.bgPattern, flag: profile.flag || null,
      achievements: App.storage.state.stats.achievements || [], showcase: profile.showcase || null,
      level, weeklyXP, week,
      friendCode: getFriendCode(), nameLower: String(profile.name || '').trim().toLowerCase(),
      xpLevel: App.gamification.levelForXP(App.storage.state.stats.xp), streak: App.storage.state.stats.streak || 0,
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
        if (App.profile) App.profile.ensureProfile();
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

  // Search by friend code or by exact name (case-insensitive).
  function findUsers(q) {
    if (!configured || !db) return Promise.resolve([]);
    const users = db.collection('users');
    return Promise.all([
      users.where('friendCode', '==', q.toUpperCase()).limit(5).get(),
      users.where('nameLower', '==', q.toLowerCase()).limit(10).get()
    ]).then(snaps => {
      const seen = {};
      snaps.forEach(s => s.docs.forEach(d => { seen[d.id] = d.data(); }));
      return Object.values(seen);
    });
  }

  // Friends' public profiles; Firestore "in" queries take 10 ids at a time.
  function fetchUsers(uids) {
    if (!configured || !db || !uids.length) return Promise.resolve([]);
    const chunks = [];
    for (let i = 0; i < uids.length; i += 10) chunks.push(uids.slice(i, i + 10));
    return Promise.all(chunks.map(c => db.collection('users')
      .where(firebase.firestore.FieldPath.documentId(), 'in', c).get()))
      .then(snaps => [].concat(...snaps.map(s => s.docs.map(d => d.data()))));
  }

  // A shop item bought for a friend: stored until the friend's app takes it.
  function sendGift(toUid, gift) {
    if (!configured || !uid || !db) return Promise.reject(new Error('offline'));
    return db.collection('gifts').add({
      to: toUid, from: uid, fromName: App.storage.getProfile().name || '',
      itemId: gift.itemId, opts: gift.opts || {},
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  // Gifts sent to this account; each is deleted once read so it's given once.
  function takeGifts() {
    if (!configured || !uid || !db) return Promise.resolve([]);
    return db.collection('gifts').where('to', '==', uid).get().then(snap =>
      Promise.all(snap.docs.map(d => d.ref.delete().then(() => d.data(), () => null)))
        .then(list => list.filter(Boolean)));
  }

  return {
    isConfigured: () => configured,
    sendGift,
    takeGifts,
    getFriendCode,
    findUsers,
    fetchUsers,
    onReady,
    scheduleSync,
    fetchLeaderboard,
    getUid: () => uid
  };
})();
