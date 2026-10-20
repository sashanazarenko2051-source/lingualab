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
        <p>В каждом языке <b>34 темы по 220 слов</b> — всего 7480 слов. Темы идут по уровням <b>A0 → A1 → A2 → B1</b>: от приветствий и чисел к работе, здоровью и технологиям.</p>
        <p>Начните с кнопки <b>«Начать урок»</b> на главной — приложение само выберет следующую тему. Весь путь виден на странице курса. Следующая тема открывается, когда в предыдущей изучены все слова или сдан её экзамен.</p>`],
      ['lesson', '📝', 'Урок', `
        <p>Урок начинается с <b>разминки</b>: слова, в которых вы ошибались, и слова, которые пора повторить.</p>
        <p>Потом <b>8 новых слов</b> группами по 4: сначала знакомство (картинка, слово, произношение), затем задания — выбрать картинку, найти пары, узнать на слух, перевести, собрать фразу, написать слово.</p>
        <p>Не получается? В задании «Напишите это слово» есть <b>💡 Подсказка</b> (открывает следующую букву) и <b>👁 Показать слово</b>.</p>`],
      ['review', '🔁', 'Повторение', `
        <p>Приложение использует <b>интервальное повторение</b>: слово возвращается как раз тогда, когда вы начинаете его забывать — через 1 день, потом через 6 дней, потом всё реже. Ошиблись — слово снова придёт завтра.</p>
        <p>Все ошибки попадают в <b>«Работу над ошибками»</b>. Слово уходит оттуда, когда вы ответите правильно в двух уроках подряд.</p>
        <p>Звёздочка <b>☆</b> добавляет слово в «Мои слова», чтобы повторять его отдельно.</p>`],
      ['daily', '📅', 'Сколько учить в день', `
        <div class="help-tip">Рекомендуем: <b>10–15 новых слов в день</b> (1–2 урока) <b>+ повторение каждый день</b>.</div>
        <ul>
          <li><b>Лучше 10 минут каждый день, чем час раз в неделю.</b> Память закрепляет слова во сне, а частые короткие занятия работают сильнее редких длинных.</li>
          <li><b>Не гонитесь за количеством.</b> 15 слов в день — это ~450 слов в месяц. Если взять 50, большая часть забудется.</li>
          <li><b>Повторение важнее новых слов.</b> Если накопилось много ошибок — сделайте день «Работы над ошибками» без новых слов.</li>
          <li><b>Цель дня — 30 ответов.</b> Это примерно один урок с разминкой.</li>
          <li><b>Произносите слова вслух</b> и придумывайте с ними свои предложения — так запоминается быстрее.</li>
        </ul>`],
      ['hearts', '❤️', 'Сердечки, энергия и подсказки', `
        <ul>
          <li>У вас <b>25 сердечек</b>, они сохраняются между уроками. Ошибка или «👁 Показать слово» — <b>−1 сердечко</b>.</li>
          <li><b>1 реклама = +1 сердечко</b>, смотреть можно сколько угодно — сердечек может стать больше 25 (например, 40 реклам при 25 сердечках = 65).</li>
          <li>Через <b>16 часов</b> после первого потерянного сердечка возвращается <b>половина (+13)</b>, а через <b>24 часа</b> — снова <b>25</b>, даже если ту половину вы уже потратили.</li>
          <li><b>⚡ Энергия:</b> каждые <b>10 слов</b> — <b>−5 энергии</b>. Каждый час <b>+5</b>, до <b>200</b>; через 24 часа снова <b>200</b>.</li>
          <li><b>1 реклама = +15 энергии</b>, без ограничений. Нажмите на ⚡ или ❤️ вверху экрана.</li>
          <li><b>💡 Подсказки:</b> <b>5 в день</b>, обновляются каждый день. В заданиях с выбором подсказка убирает два неверных ответа, в «Соберите фразу» ставит следующее слово, в «Напишите слово» открывает букву. Ещё подсказки — за рекламу или в магазине.</li>
          <li>Экзамены уровней идут без сердечек и энергии.</li>
        </ul>`],
      ['streak', '🔥', 'Серия, опыт и уровни', `
        <p><b>Серия</b> растёт за каждый день, когда вы прошли хотя бы один урок. Огонёк меняет цвет: <b>обычный</b> — первые дни, <b>синий</b> — неделя и больше, <b>фиолетовый</b> — 3 недели и больше, <b>серый</b> — день пропущен.</p>
        <p>Пропустили 1–2 дня? На главной можно <b>вернуть серию за рекламу</b>.</p>
        <p><b>Опыт (XP)</b> дают только правильные ответы и повторения: <b>+10 XP</b> за правильный ответ, <b>+5 XP</b> за каждые 3 верных ответа подряд, <b>+25 XP</b> за урок без ошибок. Урок новой темы (8 слов, около 30 ответов) — примерно <b>250–350 XP</b>. Ошибки опыта не дают.</p>
        <p>По опыту считается рейтинг за <b>день, неделю и месяц</b>. Уровень языка (A0 → B2) растёт по мере того, сколько слов вы выучили; сдайте <b>экзамен уровня</b>, чтобы проверить себя.</p>`],
      ['coins', '🪙', 'Монеты и задания', `
        <ul>
          <li><b>Монеты 🪙</b> — внутренняя валюта. За них в магазине можно взять сердечки, энергию и подсказки.</li>
          <li><b>Дневная цель</b> (30 ответов): <b>+10 🪙</b>. <b>Рекомендованная цель</b> (60 ответов): <b>+25 🪙 и +30 XP</b>.</li>
          <li><b>Каждый новый уровень</b>: <b>+50 🪙</b>.</li>
          <li><b>🎯 Задания</b> обновляются каждый понедельник — от лёгких к сложным: лёгкие <b>+15 🪙</b>, средние <b>+40 🪙</b>, сложные <b>+100 🪙</b> и опыт.</li>
          <li><b>📝 Еженедельный экзамен повторения</b>: 20 уже изученных слов раз в неделю. Сдали на 80% и больше — <b>+60 🪙 и +100 XP</b>, опыт идёт в рейтинг.</li>
        </ul>`],
      ['badges', '🏷️', 'Значки под флагом', `
        <ul>
          <li><b>✅</b> — слова этого языка, на которые вы уже ответили правильно.</li>
          <li><b>📚</b> — сколько всего слов в курсе (7480).</li>
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
        <p>У кожній мові <b>34 теми по 220 слів</b> — усього 7480 слів. Теми йдуть за рівнями <b>A0 → A1 → A2 → B1</b>: від привітань і чисел до роботи, здоров'я й технологій.</p>
        <p>Почніть із кнопки <b>«Почати урок»</b> на головній — застосунок сам обере наступну тему. Увесь шлях видно на сторінці курсу. Наступна тема відкривається, коли в попередній вивчено всі слова або складено її іспит.</p>`],
      ['lesson', '📝', 'Урок', `
        <p>Урок починається з <b>розминки</b>: слова, у яких ви помилялися, і слова, які час повторити.</p>
        <p>Потім <b>8 нових слів</b> групами по 4: спершу знайомство (картинка, слово, вимова), далі завдання — обрати картинку, знайти пари, впізнати на слух, перекласти, скласти фразу, написати слово.</p>
        <p>Не виходить? У завданні «Напишіть це слово» є <b>💡 Підказка</b> (відкриває наступну літеру) і <b>👁 Показати слово</b>.</p>`],
      ['review', '🔁', 'Повторення', `
        <p>Застосунок використовує <b>інтервальне повторення</b>: слово повертається саме тоді, коли ви починаєте його забувати — через 1 день, потім через 6 днів, потім дедалі рідше. Помилилися — слово знову прийде завтра.</p>
        <p>Усі помилки потрапляють до <b>«Роботи над помилками»</b>. Слово зникає звідти, коли ви відповісте правильно у двох уроках поспіль.</p>
        <p>Зірочка <b>☆</b> додає слово до «Моїх слів», щоб повторювати його окремо.</p>`],
      ['daily', '📅', 'Скільки вчити на день', `
        <div class="help-tip">Радимо: <b>10–15 нових слів на день</b> (1–2 уроки) <b>+ повторення щодня</b>.</div>
        <ul>
          <li><b>Краще 10 хвилин щодня, ніж година раз на тиждень.</b> Пам'ять закріплює слова уві сні, а часті короткі заняття діють сильніше за рідкісні довгі.</li>
          <li><b>Не женіться за кількістю.</b> 15 слів на день — це ~450 слів на місяць. Якщо взяти 50, більшість забудеться.</li>
          <li><b>Повторення важливіше за нові слова.</b> Якщо накопичилося багато помилок — зробіть день «Роботи над помилками» без нових слів.</li>
          <li><b>Мета дня — 30 відповідей.</b> Це приблизно один урок із розминкою.</li>
          <li><b>Вимовляйте слова вголос</b> і вигадуйте з ними свої речення — так запам'ятовується швидше.</li>
        </ul>`],
      ['hearts', '❤️', 'Сердечка, енергія і підказки', `
        <ul>
          <li>У вас <b>25 сердечок</b>, вони зберігаються між уроками. Помилка або «👁 Показати слово» — <b>−1 сердечко</b>.</li>
          <li><b>1 реклама = +1 сердечко</b>, дивитися можна скільки завгодно — сердечок може стати більше 25.</li>
          <li>Через <b>16 годин</b> після першого втраченого сердечка повертається <b>половина (+13)</b>, а через <b>24 години</b> — знову <b>25</b>.</li>
          <li><b>⚡ Енергія:</b> кожні <b>10 слів</b> — <b>−5 енергії</b>. Щогодини <b>+5</b>, до <b>200</b>; через 24 години знову <b>200</b>.</li>
          <li><b>1 реклама = +15 енергії</b>, без обмежень.</li>
          <li><b>💡 Підказки:</b> <b>5 на день</b>, оновлюються щодня. Ще — за рекламу або в магазині.</li>
          <li>Іспити рівнів ідуть без сердечок і енергії.</li>
        </ul>`],
      ['streak', '🔥', 'Серія, досвід і рівні', `
        <p><b>Серія</b> росте за кожен день, коли ви пройшли хоча б один урок. Вогник: <b>звичайний</b> — перші дні, <b>синій</b> — тиждень і більше, <b>фіолетовий</b> — 3 тижні і більше, <b>сірий</b> — день пропущено. Пропустили 1–2 дні — серію можна повернути за рекламу.</p>
        <p><b>Досвід (XP)</b> дають лише правильні відповіді та повторення: <b>+10 XP</b> за правильну відповідь, <b>+5 XP</b> за кожні 3 поспіль, <b>+25 XP</b> за урок без помилок. Урок нової теми — приблизно <b>250–350 XP</b>.</p>
        <p>Рейтинг — за <b>день, тиждень і місяць</b>. Рівень мови (A0 → B2) росте разом із вивченими словами.</p>`],
      ['coins', '🪙', 'Монети і завдання', `
        <ul>
          <li><b>Монети 🪙</b> — внутрішня валюта для сердечок, енергії та підказок у магазині.</li>
          <li><b>Денна мета</b> (30 відповідей): <b>+10 🪙</b>. <b>Рекомендована</b> (60): <b>+25 🪙 і +30 XP</b>. <b>Новий рівень</b>: <b>+50 🪙</b>.</li>
          <li><b>🎯 Завдання</b> щопонеділка: легкі <b>+15 🪙</b>, середні <b>+40 🪙</b>, складні <b>+100 🪙</b>.</li>
          <li><b>📝 Щотижневий іспит повторення</b>: 20 вивчених слів; від 80% — <b>+60 🪙 і +100 XP</b>.</li>
        </ul>`],
      ['badges', '🏷️', 'Значки під прапором', `
        <ul>
          <li><b>✅</b> — слова цієї мови, на які ви вже відповіли правильно.</li>
          <li><b>📚</b> — скільки всього слів у курсі (7480).</li>
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
        <p>Every language has <b>34 topics of 220 words</b> — 7480 words in total. Topics follow the levels <b>A0 → A1 → A2 → B1</b>: from greetings and numbers to work, health and technology.</p>
        <p>Start with <b>“Start lesson”</b> on the home page — the app picks the next topic for you. The whole path is on the course page. The next topic opens once every word of the previous one is studied or its exam is passed.</p>`],
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
      ['hearts', '❤️', 'Hearts, energy and hints', `
        <ul>
          <li>You have <b>25 hearts</b>, kept between lessons. A mistake or “👁 Show word” costs <b>1 heart</b>.</li>
          <li><b>1 ad = +1 heart</b>, as many as you like — hearts can go above 25.</li>
          <li><b>16 hours</b> after the first lost heart <b>half (+13)</b> comes back; after <b>24 hours</b> you have <b>25</b> again.</li>
          <li><b>⚡ Energy:</b> every <b>10 words</b> cost <b>5 energy</b>. <b>+5</b> every hour up to <b>200</b>; after 24 hours it's <b>200</b> again.</li>
          <li><b>1 ad = +15 energy</b>, no limit.</li>
          <li><b>💡 Hints:</b> <b>5 a day</b>, renewed daily. More for an ad or in the shop.</li>
          <li>Level exams use no hearts or energy.</li>
        </ul>`],
      ['streak', '🔥', 'Streak, XP and levels', `
        <p>Your <b>streak</b> grows every day you finish at least one lesson. The flame is <b>normal</b> at first, <b>blue</b> after a week, <b>purple</b> after 3 weeks and <b>grey</b> when a day was missed. Missed 1–2 days? Restore the streak with an ad.</p>
        <p><b>XP</b> comes only from correct answers and reviews: <b>+10 XP</b> per correct answer, <b>+5 XP</b> for every 3 in a row, <b>+25 XP</b> for a lesson without mistakes. A new-topic lesson gives about <b>250–350 XP</b>.</p>
        <p>Leaderboards for the <b>day, week and month</b>. Your level (A0 → B2) grows with the words you learn.</p>`],
      ['coins', '🪙', 'Coins and quests', `
        <ul>
          <li><b>Coins 🪙</b> are the in-app currency for hearts, energy and hints in the shop.</li>
          <li><b>Daily goal</b> (30 answers): <b>+10 🪙</b>. <b>Recommended goal</b> (60): <b>+25 🪙 and +30 XP</b>. <b>Each new level</b>: <b>+50 🪙</b>.</li>
          <li><b>🎯 Quests</b> renew every Monday: easy <b>+15 🪙</b>, medium <b>+40 🪙</b>, hard <b>+100 🪙</b>.</li>
          <li><b>📝 Weekly review exam</b>: 20 learned words; 80% or more gives <b>+60 🪙 and +100 XP</b>.</li>
        </ul>`],
      ['badges', '🏷️', 'Badges under the flag', `
        <ul>
          <li><b>✅</b> — words of this language you've already answered correctly.</li>
          <li><b>📚</b> — total words in the course (7480).</li>
          <li><b>🎓 8–10k</b> — roughly the vocabulary needed for C2 (fluency). A reference point to see how much of the way the course covers.</li>
        </ul>`],
      ['settings', '⚙️', 'Settings', `
        <p>In <b>⚙️ Settings</b> you can pick a theme or your own colors, change the interface size and turn reminders like “you haven't studied in a while” on or off.</p>`]
    ]
  }
};

// Where each course language comes from, shown as the last section.
const LANG_HISTORY = {
 "ru": {
  "title": "Информация про страну",
  "intro": "Откуда пришёл каждый язык курса и когда он появился.",
  "en": "Западногерманский. Принесён в Британию англами, саксами и ютами в V веке; первые тексты — VII век. После 1066 года впитал тысячи французских слов.",
  "de": "Западногерманский. Первые тексты — VIII век (древневерхненемецкий). Единый литературный язык сложился после перевода Библии Лютером в XVI веке.",
  "nl": "Западногерманский, вырос из франкских диалектов. Самая известная ранняя фраза записана около 1100 года.",
  "sv": "Северогерманский, из древнескандинавского языка эпохи викингов (VIII–XI века). Как отдельный язык — с XIII века.",
  "no": "Северогерманский, из древнескандинавского. Сегодня у него две письменные нормы — букмол и нюношк (XIX–XX века).",
  "da": "Северогерманский, из древнескандинавского; отделился около XII века. Ближайшие родственники — шведский и норвежский.",
  "fr": "Романский, из народной латыни Галлии. Первый памятник — Страсбургские клятвы 842 года.",
  "es": "Романский, из народной латыни Кастилии. Ранние записи — X–XI века; норму закрепил король Альфонсо X в XIII веке.",
  "it": "Романский, основан на флорентийском (тосканском) диалекте. Литературный язык — со времён Данте, XIV век.",
  "pt": "Романский, из галисийско-португальского. Первые документы — XII–XIII века.",
  "ro": "Романский, из латыни римской провинции Дакия (II–III века). Первый известный текст — письмо Някшу, 1521 год; до XIX века писали кириллицей.",
  "pl": "Западнославянский. Первое записанное предложение — 1270 год. Пишется латиницей.",
  "cs": "Западнославянский. Письменность — с XIII века; Ян Гус в XV веке ввёл значки над буквами (háček).",
  "sk": "Западнославянский, очень близок к чешскому. Литературную норму создал Людовит Штур в 1843 году.",
  "uk": "Восточнославянский, из древнерусского языка Киевской Руси. Современный литературный язык — с «Энеиды» Котляревского (1798).",
  "ru": "Восточнославянский, из древнерусского языка. Кириллица — с X века; современная норма сложилась в XVIII–XIX веках.",
  "bg": "Южнославянский. Здесь в IX веке ученики Кирилла и Мефодия создали славянскую письменность, а затем и кириллицу.",
  "hr": "Южнославянский. Древние тексты писали глаголицей (Башчанская плита, около 1100 года); сегодня — латиница.",
  "sr": "Южнославянский. Письменность — с XII века; Вук Караджич в XIX веке ввёл правило «пиши, как говоришь». Кириллица и латиница.",
  "el": "Отдельная индоевропейская ветвь. Записи — с XIV–XIII веков до н. э.; алфавит — с VIII века до н. э. Один из древнейших письменных языков.",
  "fi": "Финно-угорский (уральская семья). Письменность — с XVI века, первая книга Микаэля Агриколы вышла в 1543 году. Ближайший родственник — эстонский.",
  "hu": "Финно-угорский. Венгры пришли на Дунай около 896 года; первый связный текст — «Надгробная речь», около 1195 года."
 },
 "uk": {
  "title": "Інформація про країну",
  "intro": "Звідки походить кожна мова курсу і коли вона з’явилася.",
  "en": "Західногерманська. Принесена до Британії англами, саксами та ютами в V столітті; перші тексти — VII століття. Після 1066 року ввібрала тисячі французьких слів.",
  "de": "Західногерманська. Перші тексти — VIII століття (давньоверхньонімецька). Єдина літературна мова склалася після перекладу Біблії Лютером у XVI столітті.",
  "nl": "Західногерманська, виросла з франкських діалектів. Найвідомішу ранню фразу записано близько 1100 року.",
  "sv": "Північногерманська, з давньоскандинавської мови доби вікінгів (VIII–XI століття). Як окрема мова — з XIII століття.",
  "no": "Північногерманська, з давньоскандинавської. Сьогодні має дві письмові норми — букмол і нюношк (XIX–XX століття).",
  "da": "Північногерманська, з давньоскандинавської; відокремилася близько XII століття. Найближчі родичі — шведська й норвезька.",
  "fr": "Романська, з народної латини Галлії. Перша пам’ятка — Страсбурзькі клятви 842 року.",
  "es": "Романська, з народної латини Кастилії. Ранні записи — X–XI століття; норму закріпив король Альфонсо X у XIII столітті.",
  "it": "Романська, заснована на флорентійському (тосканському) діалекті. Літературна мова — з часів Данте, XIV століття.",
  "pt": "Романська, з галісійсько-португальської. Перші документи — XII–XIII століття.",
  "ro": "Романська, з латини римської провінції Дакія (II–III століття). Перший відомий текст — лист Някшу, 1521 рік; до XIX століття писали кирилицею.",
  "pl": "Західнослов’янська. Перше записане речення — 1270 рік. Пишеться латиницею.",
  "cs": "Західнослов’янська. Писемність — з XIII століття; Ян Гус у XV столітті запровадив значки над літерами (háček).",
  "sk": "Західнослов’янська, дуже близька до чеської. Літературну норму створив Людовит Штур у 1843 році.",
  "uk": "Східнослов’янська, з давньоруської мови Київської Русі. Сучасна літературна мова — з «Енеїди» Котляревського (1798).",
  "ru": "Східнослов’янська, з давньоруської мови. Кирилиця — з X століття; сучасна норма склалася у XVIII–XIX століттях.",
  "bg": "Південнослов’янська. Тут у IX столітті учні Кирила й Мефодія створили слов’янську писемність, а згодом і кирилицю.",
  "hr": "Південнослов’янська. Давні тексти писали глаголицею (Башчанська плита, близько 1100 року); сьогодні — латиниця.",
  "sr": "Південнослов’янська. Писемність — з XII століття; Вук Караджич у XIX столітті запровадив правило «пиши, як говориш». Кирилиця й латиниця.",
  "el": "Окрема індоєвропейська гілка. Записи — з XIV–XIII століть до н. е.; алфавіт — з VIII століття до н. е. Одна з найдавніших письмових мов.",
  "fi": "Фіно-угорська (уральська сім’я). Писемність — з XVI століття, перша книжка Мікаеля Агріколи вийшла 1543 року. Найближча родичка — естонська.",
  "hu": "Фіно-угорська. Угорці прийшли на Дунай близько 896 року; перший зв’язний текст — «Надгробна промова», близько 1195 року."
 },
 "en": {
  "title": "About the country",
  "intro": "Where each course language comes from and when it appeared.",
  "en": "West Germanic. Brought to Britain by the Angles, Saxons and Jutes in the 5th century; first texts from the 7th century. After 1066 it took in thousands of French words.",
  "de": "West Germanic. First texts from the 8th century (Old High German). A common written standard formed after Luther’s Bible translation in the 16th century.",
  "nl": "West Germanic, grown out of Frankish dialects. Its best-known early sentence was written around 1100.",
  "sv": "North Germanic, from the Old Norse of the Viking Age (8th–11th centuries). A separate language since the 13th century.",
  "no": "North Germanic, from Old Norse. Today it has two written standards, Bokmål and Nynorsk (19th–20th centuries).",
  "da": "North Germanic, from Old Norse; it split off around the 12th century. Its closest relatives are Swedish and Norwegian.",
  "fr": "Romance, from the Vulgar Latin of Gaul. The first written record is the Oaths of Strasbourg, 842.",
  "es": "Romance, from the Vulgar Latin of Castile. Early records from the 10th–11th centuries; King Alfonso X set the standard in the 13th century.",
  "it": "Romance, based on the Florentine (Tuscan) dialect. A literary language since Dante, 14th century.",
  "pt": "Romance, from Galician-Portuguese. First documents from the 12th–13th centuries.",
  "ro": "Romance, from the Latin of the Roman province of Dacia (2nd–3rd centuries). The oldest known text is Neacșu’s letter, 1521; it was written in Cyrillic until the 19th century.",
  "pl": "West Slavic. The first written sentence dates from 1270. Written in the Latin alphabet.",
  "cs": "West Slavic. Written since the 13th century; Jan Hus introduced the marks over letters (háček) in the 15th century.",
  "sk": "West Slavic, very close to Czech. Ľudovít Štúr created the literary standard in 1843.",
  "uk": "East Slavic, from the Old East Slavic of Kyivan Rus. The modern literary language dates from Kotliarevsky’s Eneida (1798).",
  "ru": "East Slavic, from Old East Slavic. Cyrillic since the 10th century; the modern standard formed in the 18th–19th centuries.",
  "bg": "South Slavic. Here, in the 9th century, the disciples of Cyril and Methodius created Slavic writing and then the Cyrillic alphabet.",
  "hr": "South Slavic. Early texts were written in Glagolitic (the Baška tablet, around 1100); today it uses the Latin alphabet.",
  "sr": "South Slavic. Written since the 12th century; in the 19th century Vuk Karadžić set the rule “write as you speak”. Uses Cyrillic and Latin.",
  "el": "Its own Indo-European branch. Records from the 14th–13th centuries BC; the alphabet since the 8th century BC. One of the oldest written languages.",
  "fi": "Finno-Ugric (Uralic family). Written since the 16th century; Mikael Agricola’s first book appeared in 1543. Its closest relative is Estonian.",
  "hu": "Finno-Ugric. Hungarians reached the Danube around 896; the first connected text, the Funeral Sermon, dates from about 1195."
 }
};

function content() {
  const ui = (App.storage.getUILang && App.storage.getUILang()) || 'ru';
  const h = HELP[ui] || HELP.en;
  const lh = LANG_HISTORY[ui] || LANG_HISTORY.en;
  const langs = `<p>${lh.intro}</p><div class="help-langs">${App.LANG_ORDER.map(c => `
    <div class="help-lang"><b>${App.ui.flagChip(c)} ${App.ui.langName(c)}</b><span>${lh[c] || ''}</span></div>`).join('')}</div>`;
  return Object.assign({}, h, { sections: h.sections.concat([['langs', '🌍', lh.title, langs]]) });
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
