window.App = window.App || {};

// Regional prices. The learner says which country they're in (asked on the
// first start, changeable in Settings); shop prices (set in euros in
// shop.js) are converted to the local currency and scaled to local price
// levels, then rounded to a familiar-looking price. Rates and price levels
// are rough placeholders to review before payments go live.
App.regions = (function () {
  // code: [currency, units per euro, price level vs. Western Europe]
  const COUNTRIES = {
    UA: ['UAH', 45, 0.35], CZ: ['CZK', 25, 0.75], SK: ['EUR', 1, 0.7], PL: ['PLN', 4.3, 0.65],
    DE: ['EUR', 1, 1], AT: ['EUR', 1, 1], CH: ['CHF', 0.94, 1.2], FR: ['EUR', 1, 1], BE: ['EUR', 1, 1],
    NL: ['EUR', 1, 1], LU: ['EUR', 1, 1.1], IE: ['EUR', 1, 1], GB: ['GBP', 0.85, 1], IT: ['EUR', 1, 0.9],
    ES: ['EUR', 1, 0.85], PT: ['EUR', 1, 0.75], GR: ['EUR', 1, 0.7], SE: ['SEK', 11.3, 1], NO: ['NOK', 11.7, 1.05],
    DK: ['DKK', 7.46, 1], FI: ['EUR', 1, 1], EE: ['EUR', 1, 0.75], LV: ['EUR', 1, 0.65], LT: ['EUR', 1, 0.7],
    HU: ['HUF', 400, 0.6], RO: ['RON', 5, 0.55], BG: ['EUR', 1, 0.55], HR: ['EUR', 1, 0.7], SI: ['EUR', 1, 0.8],
    RS: ['RSD', 117, 0.5], BA: ['BAM', 1.96, 0.5], ME: ['EUR', 1, 0.55], MK: ['MKD', 61.5, 0.45], AL: ['ALL', 100, 0.45],
    MD: ['MDL', 19, 0.4], GE: ['GEL', 2.9, 0.4], AM: ['AMD', 420, 0.4], KZ: ['KZT', 520, 0.4], TR: ['TRY', 37, 0.4],
    IL: ['ILS', 4, 0.9], US: ['USD', 1.08, 1], CA: ['CAD', 1.5, 0.9], AU: ['AUD', 1.65, 0.95]
  };
  const OTHER = ['EUR', 1, 1];
  // Currencies usually priced in whole units.
  const WHOLE = ['CZK', 'HUF', 'UAH', 'RSD', 'MKD', 'ALL', 'KZT', 'AMD', 'TRY'];
  // A first guess from the time zone, so the picker opens on the likely country.
  const TZ = {
    'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA', 'Europe/Prague': 'CZ', 'Europe/Bratislava': 'SK', 'Europe/Warsaw': 'PL',
    'Europe/Berlin': 'DE', 'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH', 'Europe/Paris': 'FR', 'Europe/Brussels': 'BE',
    'Europe/Amsterdam': 'NL', 'Europe/Luxembourg': 'LU', 'Europe/Dublin': 'IE', 'Europe/London': 'GB', 'Europe/Rome': 'IT',
    'Europe/Madrid': 'ES', 'Europe/Lisbon': 'PT', 'Europe/Athens': 'GR', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI', 'Europe/Tallinn': 'EE', 'Europe/Riga': 'LV', 'Europe/Vilnius': 'LT',
    'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG', 'Europe/Zagreb': 'HR', 'Europe/Ljubljana': 'SI',
    'Europe/Belgrade': 'RS', 'Europe/Sarajevo': 'BA', 'Europe/Podgorica': 'ME', 'Europe/Skopje': 'MK', 'Europe/Tirane': 'AL',
    'Europe/Chisinau': 'MD', 'Asia/Tbilisi': 'GE', 'Asia/Yerevan': 'AM', 'Asia/Almaty': 'KZ', 'Europe/Istanbul': 'TR',
    'Asia/Jerusalem': 'IL'
  };

  function country() { return (App.storage.getProfile() || {}).country || ''; }
  function setCountry(code) {
    App.storage.setProfile(Object.assign({}, App.storage.getProfile(), { country: code }));
  }
  function guess() {
    try { return TZ[Intl.DateTimeFormat().resolvedOptions().timeZone] || ''; } catch (e) { return ''; }
  }
  function countryName(code) {
    if (code === 'OTHER') return App.t('country_other');
    try { return new Intl.DisplayNames([App.storage.getUILang(), 'en'], { type: 'region' }).of(code); } catch (e) { return code; }
  }

  // A euro price as a local, nicely rounded price string.
  function price(eur) {
    const [cur, rate, level] = COUNTRIES[country()] || OTHER;
    let v = eur * rate * level;
    const whole = WHOLE.includes(cur);
    if (whole) v = v >= 1000 ? Math.round(v / 100) * 100 - 10 : v >= 10 ? Math.round(v / 5) * 5 - 1 : Math.max(1, Math.round(v));
    else v = v >= 100 ? Math.round(v / 10) * 10 - 1 : Math.max(0.49, Math.ceil(v * 2) / 2 - 0.01);
    try {
      return new Intl.NumberFormat(App.storage.getUILang(), { style: 'currency', currency: cur, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(v);
    } catch (e) { return v.toFixed(whole ? 0 : 2) + ' ' + cur; }
  }

  function optionsHtml(selected) {
    const codes = Object.keys(COUNTRIES).sort((a, b) => countryName(a).localeCompare(countryName(b)));
    return codes.concat('OTHER').map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${countryName(c)}</option>`).join('');
  }

  // A search field that narrows a country <select> as you type; the first
  // match gets selected (and onPick runs, if given).
  function searchHtml(id) {
    return `<input class="country-search" id="${id}" type="search" autocomplete="off" placeholder="${App.t('country_search')}">`;
  }
  function bindSearch(input, select, onPick) {
    const all = [...select.options].map(o => ({ value: o.value, text: o.textContent }));
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const keep = all.filter(o => !q || o.text.toLowerCase().includes(q) || o.value.toLowerCase() === q);
      const current = select.value;
      select.innerHTML = keep.map(o => `<option value="${o.value}">${o.text}</option>`).join('');
      if (keep.some(o => o.value === current) && !q) select.value = current;
      else if (keep.length && onPick) onPick(select.value);
    });
  }

  // "Where are you from?" — asked once, after any first-start dialog closes.
  function askIfNeeded() {
    if (country()) return;
    if (document.querySelector('.modal-overlay')) { setTimeout(askIfNeeded, 800); return; }
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card country-card">
        <div class="restart-icon">🌍</div>
        <h3>${App.t('country_title')}</h3>
        <p>${App.t('country_hint')}</p>
        ${searchHtml('country-search')}
        <select class="shop-term" id="country-pick">${optionsHtml(guess() || 'OTHER')}</select>
        <div class="profile-modal-actions">
          <button class="quiz-next" id="country-ok">${App.t('shop_confirm')}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    bindSearch(overlay.querySelector('#country-search'), overlay.querySelector('#country-pick'));
    overlay.querySelector('#country-search').focus();
    overlay.querySelector('#country-ok').addEventListener('click', () => {
      const v = overlay.querySelector('#country-pick').value;
      if (!v) return;
      setCountry(v);
      overlay.remove();
      if (location.hash === '#shop') App.router.go('shop');
    });
  }

  return { COUNTRIES, country, setCountry, countryName, price, optionsHtml, searchHtml, bindSearch, askIfNeeded };
})();
