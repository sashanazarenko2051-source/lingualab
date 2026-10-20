window.App = window.App || {};

// The shop: unlocking course topics, hearts, energy, achievements and unique
// themes, for yourself or as a gift to a friend. What was bought lives in
// App.storage.state.shop. Payment goes through purchase(), which is a stub
// until a payment service is connected. Gifts travel through App.cloud
// (Firestore "gifts"), and the friend's app claims them on start.
App.shop = (function () {
  const DAY = 24 * 60 * 60 * 1000;
  // Terms for the unlimited hearts / energy cards, with their prices.
  const TERMS = [
    { id: '7d', days: 7, price: 3.99 },
    { id: '1m', days: 30, price: 7.99 },
    { id: '3d', days: 3, price: 1.99 },
    { id: '3m', days: 90, price: 17.99 },
    { id: '1y', days: 365, price: 49.99 }
  ];
  // Base prices in euros (placeholders to set before payments go live);
  // App.regions turns them into local prices.
  const ITEMS = {
    unlock_half: { section: 'topics', icon: '🔓', price: 2.99, gift: true },
    unlock_1:    { section: 'topics', icon: '🔓', price: 4.99, gift: true },
    unlock_5:    { section: 'topics', icon: '🔒', price: 14.99, gift: true },
    unlock_all:  { section: 'topics', icon: '👑', price: 29.99, gift: true },
    hearts_10:   { section: 'hearts', icon: '❤️', price: 0.99, gift: true },
    hearts_25:   { section: 'hearts', icon: '❤️', price: 1.99, gift: true },
    hearts_100:  { section: 'hearts', icon: '💕', price: 4.99, gift: true },
    hearts_200:  { section: 'hearts', icon: '💗', price: 7.99, gift: true },
    hearts_unl:  { section: 'hearts', icon: '💖', term: true, gift: true },
    energy_50:   { section: 'energy', icon: '⚡', price: 0.99, gift: true },
    energy_100:  { section: 'energy', icon: '⚡', price: 1.79, gift: true },
    energy_150:  { section: 'energy', icon: '⚡', price: 2.49, gift: true },
    energy_200:  { section: 'energy', icon: '⚡', price: 2.99, gift: true },
    energy_unl:  { section: 'energy', icon: '🔋', term: true, gift: true },
    ach:         { section: 'ach', icon: '🏆', price: 1.49, gift: true },
    ach_all:     { section: 'ach', icon: '🏆', price: 14.99, gift: true },
    theme:       { section: 'themes', icon: '🎨', price: 2.49, gift: true },
    hat:         { section: 'hats', icon: '🎩', price: 1.49, gift: true },
    hints_10:    { section: 'hints', icon: '💡', price: 0.99, gift: true },
    hints_30:    { section: 'hints', icon: '💡', price: 2.49, gift: true },
    hints_100:   { section: 'hints', icon: '🔦', price: 5.99, gift: true }
  };

  // Small packs can also be bought with coins earned in the app.
  const COIN_PRICES = { hearts_10: 150, hearts_25: 350, energy_50: 150, energy_100: 280, hints_10: 200, hints_30: 550 };

  function st() {
    const s = App.storage.state;
    if (!s.shop || typeof s.shop !== 'object') s.shop = {};
    const sh = s.shop;
    sh.langs = sh.langs || {};
    sh.halfLangs = sh.halfLangs || {};
    sh.themes = sh.themes || {};
    sh.hats = sh.hats || {};
    return sh;
  }

  function price(itemId, opts) {
    const it = ITEMS[itemId];
    if (it.term) return (TERMS.find(t => t.id === (opts && opts.term)) || TERMS[0]).price;
    return it.price;
  }
  // Prices are set in euros and shown in the learner's local currency.
  function priceLabel(p) { return App.regions.price(p); }

  function ownsAllTopics() { return !!(App.storage.state.premium || st().allLangs); }
  function ownsTopics(code) { return ownsAllTopics() || !!st().langs[code]; }
  // The first half of a language's topics bought on its own.
  function ownsHalf(code) { return ownsTopics(code) || !!st().halfLangs[code]; }
  function ownsTheme(name) { return !!st().themes[name]; }
  function heartsUnlimited() { return Date.now() < (st().heartsUntil || 0); }

  // Human name of an item, for toasts and gift notes.
  function itemName(itemId, opts) {
    opts = opts || {};
    const term = opts.term ? ' · ' + App.t('term_' + opts.term) : '';
    switch (itemId) {
      case 'unlock_half': return App.t('shop_unlock_half', { lang: App.ui.langName(opts.lang) });
      case 'unlock_1': return App.t('shop_unlock_1', { lang: App.ui.langName(opts.lang) });
      case 'unlock_5': return App.t('shop_unlock_5');
      case 'unlock_all': return App.t('shop_unlock_all');
      case 'hearts_10': case 'hearts_25': case 'hearts_100': case 'hearts_200':
        return App.t('shop_hearts_n', { n: itemId.split('_')[1] });
      case 'hearts_unl': return App.t('shop_hearts_unl') + term;
      case 'energy_50': case 'energy_100': case 'energy_150': case 'energy_200':
        return App.t('shop_energy_n', { n: itemId.split('_')[1] });
      case 'energy_unl': return App.t('shop_energy_unl') + term;
      case 'ach': {
        const a = App.gamification.ACHIEVEMENTS.find(x => x.id === opts.id);
        return a ? a.icon + ' ' + App.t(a.titleKey, { n: a.goal }) : App.t('shop_ach_one');
      }
      case 'ach_all': return App.t('shop_ach_all');
      case 'theme': return App.t('theme_' + opts.theme);
      case 'hat': return (App.profile.HATS[opts.hat] || '🎩') + ' ' + App.t('shop_hat');
      case 'hints_10': case 'hints_30': case 'hints_100': return App.t('shop_hints_n', { n: itemId.split('_')[1] });
    }
    return itemId;
  }

  // Gives what was bought (or received as a gift).
  function grant(itemId, opts) {
    opts = opts || {};
    const sh = st();
    const days = (TERMS.find(t => t.id === opts.term) || {}).days || 0;
    switch (itemId) {
      case 'unlock_half': sh.halfLangs[opts.lang] = true; break;
      case 'unlock_1': sh.langs[opts.lang] = true; break;
      case 'unlock_5': (opts.langs || []).forEach(c => { sh.langs[c] = true; }); break;
      case 'unlock_all': sh.allLangs = true; break;
      case 'hearts_10': case 'hearts_25': case 'hearts_100': case 'hearts_200':
        App.hearts.add(Number(itemId.split('_')[1])); break;
      case 'hearts_unl': sh.heartsUntil = Math.max(Date.now(), sh.heartsUntil || 0) + days * DAY; App.hearts.add(0); break;
      case 'energy_50': case 'energy_100': case 'energy_150': case 'energy_200':
        App.energy.add(Number(itemId.split('_')[1])); break;
      case 'energy_unl': App.energy.extendUnlimited(days); break;
      case 'ach': giveAchievements([opts.id]); break;
      case 'ach_all': giveAchievements(App.gamification.ACHIEVEMENTS.map(a => a.id)); break;
      case 'theme': sh.themes[opts.theme] = true; break;
      case 'hat': sh.hats[opts.hat] = true; break;
      case 'hints_10': case 'hints_30': case 'hints_100': App.hints.add(Number(itemId.split('_')[1])); break;
    }
    App.storage.save();
  }

  function giveAchievements(ids) {
    const s = App.storage.state.stats;
    s.achievements = s.achievements || [];
    ids.forEach(id => { if (id && !s.achievements.includes(id)) s.achievements.push(id); });
    if (App.cloud.scheduleSync) App.cloud.scheduleSync();
  }

  // Payment hook: resolve true once the payment went through.
  // TODO: connect a real payment service (store billing / Stripe / etc.).
  function purchase(itemId, opts) {
    return Promise.resolve(false);
  }

  function buyWithCoins(itemId, opts) {
    const n = COIN_PRICES[itemId];
    if (!n || !App.coins.spend(n)) return false;
    grant(itemId, opts);
    App.effects.toast('✅ ' + App.t('shop_bought', { item: itemName(itemId, opts) }));
    return true;
  }

  // Buys for yourself, or for a friend when toUid is given.
  function buy(itemId, opts, toUid) {
    return purchase(itemId, opts).then(ok => {
      if (!ok) { App.effects.toast('💎 ' + App.t('lock_unlock_soon')); return false; }
      if (toUid) {
        return App.cloud.sendGift(toUid, { itemId, opts: opts || {} }).then(() => {
          App.effects.toast(App.t('shop_gift_sent', { name: itemName(itemId, opts) }));
          return true;
        });
      }
      grant(itemId, opts);
      App.effects.toast('✅ ' + App.t('shop_bought', { item: itemName(itemId, opts) }));
      return true;
    });
  }

  // Claims gifts friends sent to this account.
  function claimGifts() {
    if (!App.cloud.isConfigured()) return;
    App.cloud.onReady(() => {
      App.cloud.takeGifts().then(gifts => gifts.forEach(g => {
        if (!g.itemId || !ITEMS[g.itemId]) return;
        grant(g.itemId, g.opts);
        App.effects.toast(App.t('shop_gift_got', { name: g.fromName || '🐺', item: itemName(g.itemId, g.opts) }));
      })).catch(() => {});
    });
  }

  return { TERMS, ITEMS, COIN_PRICES, buyWithCoins, price, priceLabel, itemName, ownsTopics, ownsHalf, ownsAllTopics, ownsTheme, heartsUnlimited, grant, buy, claimGifts, state: st };
})();
