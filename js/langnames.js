window.App = window.App || {};

// Localized display names of each of the 22 LEARNABLE languages, keyed by
// [interface language][target language code]. This is separate from vocabulary —
// it's just "what do we call German when the UI itself is in French" etc.
// Order of the 22 target codes matches App.LANG_ORDER:
// en, de, nl, sv, no, da, fr, es, it, pt, ro, pl, cs, sk, uk, ru, bg, hr, sr, el, fi, hu
App.LANG_NAMES = {
  ru: { en: 'Английский', de: 'Немецкий', nl: 'Нидерландский', sv: 'Шведский', no: 'Норвежский', da: 'Датский', fr: 'Французский', es: 'Испанский', it: 'Итальянский', pt: 'Португальский', ro: 'Румынский', pl: 'Польский', cs: 'Чешский', sk: 'Словацкий', uk: 'Украинский', ru: 'Русский', bg: 'Болгарский', hr: 'Хорватский', sr: 'Сербский', el: 'Греческий', fi: 'Финский', hu: 'Венгерский' },
  en: { en: 'English', de: 'German', nl: 'Dutch', sv: 'Swedish', no: 'Norwegian', da: 'Danish', fr: 'French', es: 'Spanish', it: 'Italian', pt: 'Portuguese', ro: 'Romanian', pl: 'Polish', cs: 'Czech', sk: 'Slovak', uk: 'Ukrainian', ru: 'Russian', bg: 'Bulgarian', hr: 'Croatian', sr: 'Serbian', el: 'Greek', fi: 'Finnish', hu: 'Hungarian' },
  de: { en: 'Englisch', de: 'Deutsch', nl: 'Niederländisch', sv: 'Schwedisch', no: 'Norwegisch', da: 'Dänisch', fr: 'Französisch', es: 'Spanisch', it: 'Italienisch', pt: 'Portugiesisch', ro: 'Rumänisch', pl: 'Polnisch', cs: 'Tschechisch', sk: 'Slowakisch', uk: 'Ukrainisch', ru: 'Russisch', bg: 'Bulgarisch', hr: 'Kroatisch', sr: 'Serbisch', el: 'Griechisch', fi: 'Finnisch', hu: 'Ungarisch' },
  nl: { en: 'Engels', de: 'Duits', nl: 'Nederlands', sv: 'Zweeds', no: 'Noors', da: 'Deens', fr: 'Frans', es: 'Spaans', it: 'Italiaans', pt: 'Portugees', ro: 'Roemeens', pl: 'Pools', cs: 'Tsjechisch', sk: 'Slowaaks', uk: 'Oekraïens', ru: 'Russisch', bg: 'Bulgaars', hr: 'Kroatisch', sr: 'Servisch', el: 'Grieks', fi: 'Fins', hu: 'Hongaars' },
  sv: { en: 'Engelska', de: 'Tyska', nl: 'Nederländska', sv: 'Svenska', no: 'Norska', da: 'Danska', fr: 'Franska', es: 'Spanska', it: 'Italienska', pt: 'Portugisiska', ro: 'Rumänska', pl: 'Polska', cs: 'Tjeckiska', sk: 'Slovakiska', uk: 'Ukrainska', ru: 'Ryska', bg: 'Bulgariska', hr: 'Kroatiska', sr: 'Serbiska', el: 'Grekiska', fi: 'Finska', hu: 'Ungerska' },
  no: { en: 'Engelsk', de: 'Tysk', nl: 'Nederlandsk', sv: 'Svensk', no: 'Norsk', da: 'Dansk', fr: 'Fransk', es: 'Spansk', it: 'Italiensk', pt: 'Portugisisk', ro: 'Rumensk', pl: 'Polsk', cs: 'Tsjekkisk', sk: 'Slovakisk', uk: 'Ukrainsk', ru: 'Russisk', bg: 'Bulgarsk', hr: 'Kroatisk', sr: 'Serbisk', el: 'Gresk', fi: 'Finsk', hu: 'Ungarsk' },
  da: { en: 'Engelsk', de: 'Tysk', nl: 'Nederlandsk', sv: 'Svensk', no: 'Norsk', da: 'Dansk', fr: 'Fransk', es: 'Spansk', it: 'Italiensk', pt: 'Portugisisk', ro: 'Rumænsk', pl: 'Polsk', cs: 'Tjekkisk', sk: 'Slovakisk', uk: 'Ukrainsk', ru: 'Russisk', bg: 'Bulgarsk', hr: 'Kroatisk', sr: 'Serbisk', el: 'Græsk', fi: 'Finsk', hu: 'Ungarsk' },
  fr: { en: 'Anglais', de: 'Allemand', nl: 'Néerlandais', sv: 'Suédois', no: 'Norvégien', da: 'Danois', fr: 'Français', es: 'Espagnol', it: 'Italien', pt: 'Portugais', ro: 'Roumain', pl: 'Polonais', cs: 'Tchèque', sk: 'Slovaque', uk: 'Ukrainien', ru: 'Russe', bg: 'Bulgare', hr: 'Croate', sr: 'Serbe', el: 'Grec', fi: 'Finnois', hu: 'Hongrois' },
  es: { en: 'Inglés', de: 'Alemán', nl: 'Neerlandés', sv: 'Sueco', no: 'Noruego', da: 'Danés', fr: 'Francés', es: 'Español', it: 'Italiano', pt: 'Portugués', ro: 'Rumano', pl: 'Polaco', cs: 'Checo', sk: 'Eslovaco', uk: 'Ucraniano', ru: 'Ruso', bg: 'Búlgaro', hr: 'Croata', sr: 'Serbio', el: 'Griego', fi: 'Finlandés', hu: 'Húngaro' },
  it: { en: 'Inglese', de: 'Tedesco', nl: 'Olandese', sv: 'Svedese', no: 'Norvegese', da: 'Danese', fr: 'Francese', es: 'Spagnolo', it: 'Italiano', pt: 'Portoghese', ro: 'Rumeno', pl: 'Polacco', cs: 'Ceco', sk: 'Slovacco', uk: 'Ucraino', ru: 'Russo', bg: 'Bulgaro', hr: 'Croato', sr: 'Serbo', el: 'Greco', fi: 'Finlandese', hu: 'Ungherese' },
  pt: { en: 'Inglês', de: 'Alemão', nl: 'Holandês', sv: 'Sueco', no: 'Norueguês', da: 'Dinamarquês', fr: 'Francês', es: 'Espanhol', it: 'Italiano', pt: 'Português', ro: 'Romeno', pl: 'Polaco', cs: 'Checo', sk: 'Eslovaco', uk: 'Ucraniano', ru: 'Russo', bg: 'Búlgaro', hr: 'Croata', sr: 'Sérvio', el: 'Grego', fi: 'Finlandês', hu: 'Húngaro' },
  ro: { en: 'Engleză', de: 'Germană', nl: 'Neerlandeză', sv: 'Suedeză', no: 'Norvegiană', da: 'Daneză', fr: 'Franceză', es: 'Spaniolă', it: 'Italiană', pt: 'Portugheză', ro: 'Română', pl: 'Poloneză', cs: 'Cehă', sk: 'Slovacă', uk: 'Ucraineană', ru: 'Rusă', bg: 'Bulgară', hr: 'Croată', sr: 'Sârbă', el: 'Greacă', fi: 'Finlandeză', hu: 'Maghiară' },
  pl: { en: 'Angielski', de: 'Niemiecki', nl: 'Niderlandzki', sv: 'Szwedzki', no: 'Norweski', da: 'Duński', fr: 'Francuski', es: 'Hiszpański', it: 'Włoski', pt: 'Portugalski', ro: 'Rumuński', pl: 'Polski', cs: 'Czeski', sk: 'Słowacki', uk: 'Ukraiński', ru: 'Rosyjski', bg: 'Bułgarski', hr: 'Chorwacki', sr: 'Serbski', el: 'Grecki', fi: 'Fiński', hu: 'Węgierski' },
  cs: { en: 'Angličtina', de: 'Němčina', nl: 'Nizozemština', sv: 'Švédština', no: 'Norština', da: 'Dánština', fr: 'Francouzština', es: 'Španělština', it: 'Italština', pt: 'Portugalština', ro: 'Rumunština', pl: 'Polština', cs: 'Čeština', sk: 'Slovenština', uk: 'Ukrajinština', ru: 'Ruština', bg: 'Bulharština', hr: 'Chorvatština', sr: 'Srbština', el: 'Řečtina', fi: 'Finština', hu: 'Maďarština' },
  sk: { en: 'Angličtina', de: 'Nemčina', nl: 'Holandčina', sv: 'Švédčina', no: 'Nórčina', da: 'Dánčina', fr: 'Francúzština', es: 'Španielčina', it: 'Taliančina', pt: 'Portugalčina', ro: 'Rumunčina', pl: 'Poľština', cs: 'Čeština', sk: 'Slovenčina', uk: 'Ukrajinčina', ru: 'Ruština', bg: 'Bulharčina', hr: 'Chorvátčina', sr: 'Srbčina', el: 'Gréčtina', fi: 'Fínčina', hu: 'Maďarčina' },
  uk: { en: 'Англійська', de: 'Німецька', nl: 'Нідерландська', sv: 'Шведська', no: 'Норвезька', da: 'Данська', fr: 'Французька', es: 'Іспанська', it: 'Італійська', pt: 'Португальська', ro: 'Румунська', pl: 'Польська', cs: 'Чеська', sk: 'Словацька', uk: 'Українська', ru: 'Російська', bg: 'Болгарська', hr: 'Хорватська', sr: 'Сербська', el: 'Грецька', fi: 'Фінська', hu: 'Угорська' },
  bg: { en: 'Английски', de: 'Немски', nl: 'Нидерландски', sv: 'Шведски', no: 'Норвежки', da: 'Датски', fr: 'Френски', es: 'Испански', it: 'Италиански', pt: 'Португалски', ro: 'Румънски', pl: 'Полски', cs: 'Чешки', sk: 'Словашки', uk: 'Украински', ru: 'Руски', bg: 'Български', hr: 'Хърватски', sr: 'Сръбски', el: 'Гръцки', fi: 'Финландски', hu: 'Унгарски' },
  hr: { en: 'Engleski', de: 'Njemački', nl: 'Nizozemski', sv: 'Švedski', no: 'Norveški', da: 'Danski', fr: 'Francuski', es: 'Španjolski', it: 'Talijanski', pt: 'Portugalski', ro: 'Rumunjski', pl: 'Poljski', cs: 'Češki', sk: 'Slovački', uk: 'Ukrajinski', ru: 'Ruski', bg: 'Bugarski', hr: 'Hrvatski', sr: 'Srpski', el: 'Grčki', fi: 'Finski', hu: 'Mađarski' },
  sr: { en: 'Енглески', de: 'Немачки', nl: 'Холандски', sv: 'Шведски', no: 'Норвешки', da: 'Дански', fr: 'Француски', es: 'Шпански', it: 'Италијански', pt: 'Португалски', ro: 'Румунски', pl: 'Пољски', cs: 'Чешки', sk: 'Словачки', uk: 'Украјински', ru: 'Руски', bg: 'Бугарски', hr: 'Хрватски', sr: 'Српски', el: 'Грчки', fi: 'Фински', hu: 'Мађарски' },
  el: { en: 'Αγγλικά', de: 'Γερμανικά', nl: 'Ολλανδικά', sv: 'Σουηδικά', no: 'Νορβηγικά', da: 'Δανικά', fr: 'Γαλλικά', es: 'Ισπανικά', it: 'Ιταλικά', pt: 'Πορτογαλικά', ro: 'Ρουμανικά', pl: 'Πολωνικά', cs: 'Τσεχικά', sk: 'Σλοβακικά', uk: 'Ουκρανικά', ru: 'Ρωσικά', bg: 'Βουλγαρικά', hr: 'Κροατικά', sr: 'Σερβικά', el: 'Ελληνικά', fi: 'Φινλανδικά', hu: 'Ουγγρικά' },
  fi: { en: 'Englanti', de: 'Saksa', nl: 'Hollanti', sv: 'Ruotsi', no: 'Norja', da: 'Tanska', fr: 'Ranska', es: 'Espanja', it: 'Italia', pt: 'Portugali', ro: 'Romania', pl: 'Puola', cs: 'Tšekki', sk: 'Slovakia', uk: 'Ukraina', ru: 'Venäjä', bg: 'Bulgaria', hr: 'Kroatia', sr: 'Serbia', el: 'Kreikka', fi: 'Suomi', hu: 'Unkari' },
  hu: { en: 'Angol', de: 'Német', nl: 'Holland', sv: 'Svéd', no: 'Norvég', da: 'Dán', fr: 'Francia', es: 'Spanyol', it: 'Olasz', pt: 'Portugál', ro: 'Román', pl: 'Lengyel', cs: 'Cseh', sk: 'Szlovák', uk: 'Ukrán', ru: 'Orosz', bg: 'Bolgár', hr: 'Horvát', sr: 'Szerb', el: 'Görög', fi: 'Finn', hu: 'Magyar' }
};

App.ui = App.ui || {};
App.ui.langName = function (code) {
  const uiLang = (App.storage.getUILang && App.storage.getUILang()) || 'ru';
  const table = App.LANG_NAMES[uiLang] || App.LANG_NAMES.ru;
  return (table && table[code]) || (App.data[code] && App.data[code].name) || code;
};
// Windows/WebView2 often fails to render flag emoji, so we draw a CSS flag chip instead.
// size: falsy = default small chip, true|'lg' = medium chip, 'xl' = big circular badge (dashboard picker).
App.ui.flagChip = function (code, size) {
  const label = App.ui.langName(code);
  const sizeClass = size === 'xl' ? ' flag-xl' : size ? ' flag-lg' : '';
  return `<span class="flag-chip flag-${code}${sizeClass}" title="${label}"></span>`;
};
