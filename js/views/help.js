window.App = window.App || {};
App.views = App.views || {};

(function () {

// "How it works": a short guide to the course, lessons, review, how many
// words to learn a day, hearts, streaks and the badges. Written for ru, uk
// and en; other interface languages get the English text.
const HELP = {
  ru: {
    title: 'Как это работает',
    intro: 'Короткая инструкция: как устроен курс, сколько учить в день и зачем нужны сердечки.',
    sections: [
      ['course', '🎓', 'Курс', `
        <p>В каждом языке <b>34 темы по 120 слов</b> — всего 4080 слов. Темы идут по уровням <b>A0 → A1 → A2 → B1</b>: от приветствий и чисел к работе, здоровью и технологиям.</p>
        <p>Начни с кнопки <b>«Начать урок»</b> на главной — приложение само выберет следующую тему. Весь путь виден на странице курса.</p>`],
      ['lesson', '📝', 'Урок', `
        <p>Урок начинается с <b>разминки</b>: слова, в которых ты ошибался(ась), и слова, которые пора повторить.</p>
        <p>Потом <b>8 новых слов</b> группами по 4: сначала знакомство (картинка, слово, произношение), затем задания — выбери картинку, найди пары, узнай на слух, переведи, собери фразу, напиши слово.</p>
        <p>Застрял(а)? В задании «Напиши слово» есть <b>💡 Подсказка</b> (открывает следующую букву) и <b>👁 Показать слово</b>.</p>`],
      ['review', '🔁', 'Повторение', `
        <p>Приложение использует <b>интервальное повторение</b>: слово возвращается как раз тогда, когда ты начинаешь его забывать — через 1 день, потом через 6 дней, потом всё реже. Ошибся(ась) — слово снова придёт завтра.</p>
        <p>Все ошибки попадают в <b>«Работу над ошибками»</b>. Слово уходит оттуда, когда ты ответишь правильно в двух уроках подряд.</p>
        <p>Звёздочка <b>☆</b> добавляет слово в «Мои слова», чтобы повторять его отдельно.</p>`],
      ['daily', '📅', 'Сколько учить в день', `
        <div class="help-tip">Рекомендуем: <b>10–15 новых слов в день</b> (1–2 урока) <b>+ повторение каждый день</b>.</div>
        <ul>
          <li><b>Лучше 10 минут каждый день, чем час раз в неделю.</b> Память закрепляет слова во сне, а частые короткие занятия работают сильнее редких длинных.</li>
          <li><b>Не гонись за количеством.</b> 15 слов в день — это ~450 слов в месяц. Если взять 50, большая часть забудется.</li>
          <li><b>Повторение важнее новых слов.</b> Если накопилось много ошибок — сделай день «Работы над ошибками» без новых слов.</li>
          <li><b>Цель дня — 30 ответов.</b> Это примерно один урок с разминкой.</li>
          <li><b>Произноси слова вслух</b> и придумывай с ними свои предложения — так запоминается быстрее.</li>
        </ul>`],
      ['hearts', '❤️', 'Сердечки', `
        <ul>
          <li>У тебя до <b>20 сердечек</b>, они сохраняются между уроками.</li>
          <li>Ошибка — <b>−1 сердечко</b>. Каждые <b>10 заданий</b> — тоже −1.</li>
          <li>Когда сердечки закончились, урок не начать. <b>1 реклама = +1 сердечко</b> — нажми на сердечко вверху экрана.</li>
          <li>Через <b>24 часа</b> после первого потерянного сердечка они сами пополняются до <b>20</b>.</li>
          <li>«👁 Показать слово» сердечко не отнимает. Экзамены уровней идут без сердечек.</li>
        </ul>`],
      ['streak', '🔥', 'Серия, опыт и уровни', `
        <p><b>Серия</b> растёт за каждый день, когда ты прошёл(а) хотя бы один урок. Пропустишь день — серия начнётся заново.</p>
        <p>За ответы начисляется <b>опыт (XP)</b> — по нему считается недельный рейтинг с друзьями. За успехи открываются <b>достижения</b>.</p>
        <p>Уровень языка (A0, A1, A2, B1) растёт по мере того, сколько слов ты выучил(а). Сдай <b>экзамен уровня</b>, чтобы проверить себя.</p>`],
      ['badges', '🏷️', 'Значки под флагом', `
        <ul>
          <li><b>✅</b> — слова этого языка, на которые ты уже правильно ответил(а).</li>
          <li><b>📚</b> — сколько всего слов в курсе (4080).</li>
          <li><b>🎓 8–10k</b> — примерно столько слов нужно для уровня C2 (свободное владение). Это ориентир, чтобы видеть, сколько пути покрывает курс.</li>
        </ul>`],
      ['settings', '⚙️', 'Настройки', `
        <p>В <b>⚙️ Настройках</b> можно выбрать тему оформления или свои цвета, размер интерфейса и включить или выключить напоминания вроде «вы давно не учились».</p>`]
    ]
  },
  uk: {
    title: 'Як це працює',
    intro: 'Коротка інструкція: як влаштований курс, скільки вчити на день і навіщо потрібні сердечка.',
    sections: [
      ['course', '🎓', 'Курс', `
        <p>У кожній мові <b>34 теми по 120 слів</b> — усього 4080 слів. Теми йдуть за рівнями <b>A0 → A1 → A2 → B1</b>: від привітань і чисел до роботи, здоров'я й технологій.</p>
        <p>Почни з кнопки <b>«Почати урок»</b> на головній — застосунок сам обере наступну тему. Увесь шлях видно на сторінці курсу.</p>`],
      ['lesson', '📝', 'Урок', `
        <p>Урок починається з <b>розминки</b>: слова, у яких ти помилявся(-лася), і слова, які час повторити.</p>
        <p>Потім <b>8 нових слів</b> групами по 4: спершу знайомство (картинка, слово, вимова), далі завдання — обери картинку, знайди пари, впізнай на слух, переклади, склади фразу, напиши слово.</p>
        <p>Застряг(-ла)? У завданні «Напиши слово» є <b>💡 Підказка</b> (відкриває наступну літеру) і <b>👁 Показати слово</b>.</p>`],
      ['review', '🔁', 'Повторення', `
        <p>Застосунок використовує <b>інтервальне повторення</b>: слово повертається саме тоді, коли ти починаєш його забувати — через 1 день, потім через 6 днів, потім дедалі рідше. Помилився(-лася) — слово знову прийде завтра.</p>
        <p>Усі помилки потрапляють до <b>«Роботи над помилками»</b>. Слово зникає звідти, коли ти відповіси правильно у двох уроках поспіль.</p>
        <p>Зірочка <b>☆</b> додає слово до «Моїх слів», щоб повторювати його окремо.</p>`],
      ['daily', '📅', 'Скільки вчити на день', `
        <div class="help-tip">Радимо: <b>10–15 нових слів на день</b> (1–2 уроки) <b>+ повторення щодня</b>.</div>
        <ul>
          <li><b>Краще 10 хвилин щодня, ніж година раз на тиждень.</b> Пам'ять закріплює слова уві сні, а часті короткі заняття діють сильніше за рідкісні довгі.</li>
          <li><b>Не женися за кількістю.</b> 15 слів на день — це ~450 слів на місяць. Якщо взяти 50, більшість забудеться.</li>
          <li><b>Повторення важливіше за нові слова.</b> Якщо накопичилося багато помилок — зроби день «Роботи над помилками» без нових слів.</li>
          <li><b>Мета дня — 30 відповідей.</b> Це приблизно один урок із розминкою.</li>
          <li><b>Вимовляй слова вголос</b> і вигадуй із ними свої речення — так запам'ятовується швидше.</li>
        </ul>`],
      ['hearts', '❤️', 'Сердечка', `
        <ul>
          <li>У тебе до <b>20 сердечок</b>, вони зберігаються між уроками.</li>
          <li>Помилка — <b>−1 сердечко</b>. Кожні <b>10 завдань</b> — теж −1.</li>
          <li>Коли сердечка закінчилися, урок не почати. <b>1 реклама = +1 сердечко</b> — натисни на сердечко вгорі екрана.</li>
          <li>Через <b>24 години</b> після першого втраченого сердечка вони самі поповнюються до <b>20</b>.</li>
          <li>«👁 Показати слово» сердечко не забирає. Іспити рівнів ідуть без сердечок.</li>
        </ul>`],
      ['streak', '🔥', 'Серія, досвід і рівні', `
        <p><b>Серія</b> росте за кожен день, коли ти пройшов(-ла) хоча б один урок. Пропустиш день — серія почнеться спочатку.</p>
        <p>За відповіді нараховується <b>досвід (XP)</b> — за ним рахується тижневий рейтинг із друзями. За успіхи відкриваються <b>досягнення</b>.</p>
        <p>Рівень мови (A0, A1, A2, B1) зростає з кількістю вивчених слів. Склади <b>іспит рівня</b>, щоб перевірити себе.</p>`],
      ['badges', '🏷️', 'Значки під прапором', `
        <ul>
          <li><b>✅</b> — слова цієї мови, на які ти вже правильно відповів(-ла).</li>
          <li><b>📚</b> — скільки всього слів у курсі (4080).</li>
          <li><b>🎓 8–10k</b> — приблизно стільки слів потрібно для рівня C2 (вільне володіння). Це орієнтир, щоб бачити, яку частину шляху покриває курс.</li>
        </ul>`],
      ['settings', '⚙️', 'Налаштування', `
        <p>У <b>⚙️ Налаштуваннях</b> можна обрати тему оформлення чи свої кольори, розмір інтерфейсу та ввімкнути або вимкнути нагадування на кшталт «ви давно не вчилися».</p>`]
    ]
  },
  en: {
    title: 'How it works',
    intro: 'A quick guide: how the course is built, how much to learn a day and what hearts are for.',
    sections: [
      ['course', '🎓', 'The course', `
        <p>Every language has <b>34 topics of 120 words</b> — 4080 words in total. Topics follow the levels <b>A0 → A1 → A2 → B1</b>: from greetings and numbers to work, health and technology.</p>
        <p>Start with <b>“Start lesson”</b> on the home page — the app picks the next topic for you. The whole path is on the course page.</p>`],
      ['lesson', '📝', 'A lesson', `
        <p>Each lesson starts with a <b>warm-up</b>: words you got wrong and words that are due for review.</p>
        <p>Then <b>8 new words</b> in groups of 4: first an introduction (picture, word, pronunciation), then exercises — pick the picture, match pairs, recognise by ear, translate, build a phrase, type the word.</p>
        <p>Stuck? “Type the word” has <b>💡 Hint</b> (reveals the next letter) and <b>👁 Show word</b>.</p>`],
      ['review', '🔁', 'Review', `
        <p>The app uses <b>spaced repetition</b>: a word comes back just as you start to forget it — after 1 day, then 6 days, then less and less often. Get it wrong and it comes back tomorrow.</p>
        <p>All mistakes go to <b>“Fix mistakes”</b>. A word leaves it after you answer correctly in two lessons in a row.</p>
        <p>The <b>☆</b> star adds a word to “My words” so you can review it separately.</p>`],
      ['daily', '📅', 'How much to learn a day', `
        <div class="help-tip">We recommend <b>10–15 new words a day</b> (1–2 lessons) <b>+ review every day</b>.</div>
        <ul>
          <li><b>10 minutes every day beats an hour once a week.</b> Memory consolidates words during sleep, and short frequent sessions work better than rare long ones.</li>
          <li><b>Don't chase numbers.</b> 15 words a day is ~450 words a month. Take 50 and most will be forgotten.</li>
          <li><b>Review matters more than new words.</b> If mistakes pile up, spend a day on “Fix mistakes” with no new words.</li>
          <li><b>The daily goal is 30 answers</b> — about one lesson with its warm-up.</li>
          <li><b>Say words out loud</b> and make up your own sentences with them — they stick faster.</li>
        </ul>`],
      ['hearts', '❤️', 'Hearts', `
        <ul>
          <li>You have up to <b>20 hearts</b>, kept between lessons.</li>
          <li>A mistake costs <b>−1 heart</b>. Every <b>10 exercises</b> cost −1 as well.</li>
          <li>With no hearts left you can't start a lesson. <b>1 ad = +1 heart</b> — tap the heart at the top of the screen.</li>
          <li><b>24 hours</b> after you lose the first heart, hearts refill to <b>20</b> on their own.</li>
          <li>“👁 Show word” costs no heart. Level exams have no hearts.</li>
        </ul>`],
      ['streak', '🔥', 'Streak, XP and levels', `
        <p>Your <b>streak</b> grows for every day with at least one lesson. Miss a day and it starts over.</p>
        <p>Answers earn <b>XP</b>, which counts for the weekly leaderboard with friends. Progress unlocks <b>achievements</b>.</p>
        <p>Your level (A0, A1, A2, B1) grows with the words you've learned. Take the <b>level exam</b> to test yourself.</p>`],
      ['badges', '🏷️', 'Badges under the flag', `
        <ul>
          <li><b>✅</b> — words of this language you've already answered correctly.</li>
          <li><b>📚</b> — total words in the course (4080).</li>
          <li><b>🎓 8–10k</b> — roughly the vocabulary needed for C2 (fluency). A reference point to see how much of the way the course covers.</li>
        </ul>`],
      ['settings', '⚙️', 'Settings', `
        <p>In <b>⚙️ Settings</b> you can pick a theme or your own colors, change the interface size and turn reminders like “you haven't studied in a while” on or off.</p>`]
    ]
  }
};

function content() {
  const ui = (App.storage.getUILang && App.storage.getUILang()) || 'ru';
  return HELP[ui] || HELP.en;
}

function render(root) {
  const h = content();
  root.innerHTML = `
    <div class="help-page">
      <h1 class="settings-title">📖 ${h.title}</h1>
      <p class="settings-hint help-intro">${h.intro}</p>
      <nav class="help-toc">${h.sections.map(([id, icon, title]) => `<button data-to="${id}">${icon} ${title}</button>`).join('')}</nav>
      ${h.sections.map(([id, icon, title, html]) => `
        <section class="settings-card help-card" id="help-${id}">
          <h2>${icon} ${title}</h2>
          <div class="help-body">${html}</div>
        </section>`).join('')}
    </div>
  `;
  root.querySelectorAll('.help-toc button').forEach(b => b.addEventListener('click', () => {
    const el = root.querySelector('#help-' + b.dataset.to);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  // App.session.helpSection opens the guide at one section (e.g. "hearts").
  const target = App.session.helpSection;
  App.session.helpSection = null;
  if (target) setTimeout(() => { const el = root.querySelector('#help-' + target); if (el) el.scrollIntoView({ block: 'start' }); }, 0);
}

// Opens the guide, optionally at a section.
App.openHelp = function (section) {
  App.session.helpSection = section || null;
  App.router.go('help');
};

App.views.help = { render };

})();
