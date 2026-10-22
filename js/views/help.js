window.App = window.App || {};
App.views = App.views || {};

(function () {

// "How it works": a short guide to the course, lessons, review, how many
// words to learn a day, hearts, streaks and the badges. Written for ru, uk
// and en; the other interface languages were translated from English
// (tools/gemini_help.py).
const HELP = {
  ru: {
    title: 'Как это работает',
    intro: 'Короткая инструкция: как устроен курс, сколько учить в день и зачем нужны сердечки.',
    sections: [
      ['course', '🎓', 'Курс', `
        <p>В каждом языке <b>36 тем</b> — всего <b>8000 слов</b>. Темы идут по уровням <b>A0 → A1 → A2 → B1 → B2</b>: от приветствий и чисел к работе, здоровью, обществу и науке.</p>
        <ul>
          <li><b>A0</b> — первые шаги: около 150 слов.</li>
          <li><b>A1</b> — до 1500 слов: простые фразы о себе и быте.</li>
          <li><b>A2</b> — 1500–2500 слов: повседневные ситуации.</li>
          <li><b>B1</b> — 2700–4500 слов: работа, учёба, путешествия.</li>
          <li><b>B2</b> — 5000–8000 слов: <b>свободный разговор</b> на любые темы.</li>
        </ul>
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
          <li><b>📚</b> — сколько всего слов в курсе (8000).</li>
          <li><b>🎓 B2 · 8k</b> — 8000 слов дают уровень B2: свободный разговор. Это цель всего курса.</li>
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
        <p>У кожній мові <b>36 тем</b> — усього <b>8000 слів</b>. Теми йдуть за рівнями <b>A0 → A1 → A2 → B1 → B2</b>: від привітань і чисел до роботи, здоров'я, суспільства й науки.</p>
        <ul>
          <li><b>A0</b> — перші кроки: близько 150 слів.</li>
          <li><b>A1</b> — до 1500 слів: прості фрази про себе й побут.</li>
          <li><b>A2</b> — 1500–2500 слів: повсякденні ситуації.</li>
          <li><b>B1</b> — 2700–4500 слів: робота, навчання, подорожі.</li>
          <li><b>B2</b> — 5000–8000 слів: <b>вільна розмова</b> на будь-які теми.</li>
        </ul>
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
          <li><b>📚</b> — скільки всього слів у курсі (8000).</li>
          <li><b>🎓 B2 · 8k</b> — 8000 слів дають рівень B2: вільна розмова. Це мета всього курсу.</li>
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
        <p>Every language has <b>36 topics</b> — <b>8000 words</b> in total. Topics follow the levels <b>A0 → A1 → A2 → B1 → B2</b>: from greetings and numbers to work, health, society and science.</p>
        <ul>
          <li><b>A0</b> — first steps: about 150 words.</li>
          <li><b>A1</b> — up to 1500 words: simple phrases about yourself and daily life.</li>
          <li><b>A2</b> — 1500–2500 words: everyday situations.</li>
          <li><b>B1</b> — 2700–4500 words: work, study, travel.</li>
          <li><b>B2</b> — 5000–8000 words: <b>free conversation</b> on any topic.</li>
        </ul>
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
          <li><b>📚</b> — total words in the course (8000).</li>
          <li><b>🎓 B2 · 8k</b> — 8000 words give you B2: free conversation. That is the goal of the whole course.</li>
        </ul>`],
      ['settings', '⚙️', 'Settings', `
        <p>In <b>⚙️ Settings</b> you can pick a theme or your own colors, change the interface size and turn reminders like “you haven't studied in a while” on or off.</p>`]
    ]
  },
  cs: {
    "title": "Jak to funguje",
    "intro": "Stručný průvodce: jak je kurz postavený, kolik se učit denně a k čemu slouží srdíčka.",
    "sections": [
      [
        "course",
        "🎓",
        "Kurz",
        "\n        <p>Každý jazyk obsahuje <b>36 témat</b> — celkem <b>8000 slov</b>. Témata navazují na úrovně <b>A0 → A1 → A2 → B1 → B2</b>: od pozdravů a čísel až po práci, zdraví, společnost a vědu.</p>\n        <ul>\n          <li><b>A0</b> — první krůčky: přibližně 150 slov.</li>\n          <li><b>A1</b> — až 1500 slov: jednoduché fráze o sobě a každodenním životě.</li>\n          <li><b>A2</b> — 1500–2500 slov: běžné každodenní situace.</li>\n          <li><b>B1</b> — 2700–4500 slov: práce, studium, cestování.</li>\n          <li><b>B2</b> — 5000–8000 slov: <b>plynulá konverzace</b> na jakékoli téma.</li>\n        </ul>\n        <p>Začněte tlačítkem <b>„Spustit lekci“</b> na hlavní stránce — aplikace pro vás vybere další téma. Celou trasu najdete na stránce kurzu. Další téma se odemkne, jakmile se naučíte všechna slova z předchozího nebo úspěšně složíte zkoušku.</p>"
      ],
      [
        "lesson",
        "📝",
        "Lekce",
        "\n        <p>Každá lekce začíná <b>rozcvičkou</b>: slova, ve kterých jste chybovali, a slova určená k opakování.</p>\n        <p>Následuje <b>8 nových slov</b> ve skupinkách po 4: nejprve představení (obrázek, slovo, výslovnost), potom cvičení — vyberte obrázek, spojte dvojice, poznejte podle sluchu, přeložte, sestavte frázi, napište slovo.</p>\n        <p>Nevíte si rady? U cvičení „Napište slovo“ máte k dispozici <b>💡 Nápovědu</b> (odkryje další písmeno) a <b>👁 Ukázat slovo</b>.</p>"
      ],
      [
        "review",
        "🔁",
        "Opakování",
        "\n        <p>Aplikace využívá <b>rozložené opakování</b>: slovo se vrátí přesně ve chvíli, kdy ho začínáte zapomínat — po 1 dni, pak po 6 dnech a následně stále méně často. Pokud uděláte chybu, vrátí se hned zítra.</p>\n        <p>Všechny chyby se ukládají do sekce <b>„Opravit chyby“</b>. Slovo z ní zmizí, jakmile na něj správně odpovíte ve dvou lekcích po sobě.</p>\n        <p>Hvězdičkou <b>☆</b> přidáte slovo do „Moje slova“, abyste si ho mohli zopakovat zvlášť.</p>"
      ],
      [
        "daily",
        "📅",
        "Kolik se učit denně",
        "\n        <div class=\"help-tip\">Doporučujeme <b>10–15 nových slov denně</b> (1–2 lekce) <b>+ každodenní opakování</b>.</div>\n        <ul>\n          <li><b>10 minut každý den je lepší než hodina jednou týdně.</b> Paměť si slova upevňuje během spánku a krátká pravidelná sezení fungují lépe než občasná dlouhá.</li>\n          <li><b>Nehoňte se za čísly.</b> 15 slov denně je ~450 slov za měsíc. Když si jich dáte 50, většinu zapomenete.</li>\n          <li><b>Opakování je důležitější než nová slova.</b> Pokud se vám hromadí chyby, věnujte den sekci „Opravit chyby“ bez nových slov.</li>\n          <li><b>Denní cíl je 30 odpovědí</b> — přibližně jedna lekce i s rozcvičkou.</li>\n          <li><b>Říkejte si slova nahlas</b> a tvořte si s nimi vlastní věty — snáze se vám vryjí do paměti.</li>\n        </ul>"
      ],
      [
        "hearts",
        "❤️",
        "Srdíčka, energie a nápovědy",
        "\n        <ul>\n          <li>Máte <b>25 srdíček</b>, která se přenášejí mezi lekcemi. Chyba nebo „👁 Ukázat slovo“ stojí <b>1 srdce</b>.</li>\n          <li><b>1 reklama = +1 srdce</b>, klidně kolikrát chcete — srdíčka mohou přesáhnout 25.</li>\n          <li><b>16 hodin</b> po ztrátě prvního srdce se vám vrátí <b>polovina (+13)</b>; po <b>24 hodinách</b> jich máte znovu <b>25</b>.</li>\n          <li><b>⚡ Energie:</b> každých <b>10 slov</b> stojí <b>5 energie</b>. <b>+5</b> každou hodinu až do <b>200</b>; po 24 hodinách je to opět <b>200</b>.</li>\n          <li><b>1 reklama = +15 energie</b>, bez omezení.</li>\n          <li><b>💡 Nápovědy:</b> <b>5 denně</b>, obnovují se každý den. Další získáte za reklamu nebo v obchodě.</li>\n          <li>Zkoušky úrovní nespotřebovávají žádná srdíčka ani energii.</li>\n        </ul>"
      ],
      [
        "streak",
        "🔥",
        "Série, XP a úrovně",
        "\n        <p>Vaše <b>série</b> roste s každým dnem, kdy dokončíte alespoň jednu lekci. Plamínek je zpočátku <b>běžný</b>, po týdnu <b>modrý</b>, po 3 týdnech <b>fialový</b> a <b>šedý</b>, když vynecháte den. Vynechali jste 1–2 dny? Obnovte si sérii zhlédnutím reklamy.</p>\n        <p><b>XP</b> získáváte pouze za správné odpovědi a opakování: <b>+10 XP</b> za správnou odpověď, <b>+5 XP</b> za každé 3 v řadě, <b>+25 XP</b> za lekci bez chyb. Lekce s novým tématem vám přinese přibližně <b>250–350 XP</b>.</p>\n        <p>Žebříčky za <b>den, týden a měsíc</b>. Vaše úroveň (A0 → B2) roste spolu se slovy, která se naučíte.</p>"
      ],
      [
        "coins",
        "🪙",
        "Mince a úkoly",
        "\n        <ul>\n          <li><b>Mince 🪙</b> jsou herní měna na nákup srdíček, energie a nápověd v obchodě.</li>\n          <li><b>Denní cíl</b> (30 odpovědí): <b>+10 🪙</b>. <b>Doporučený cíl</b> (60): <b>+25 🪙 a +30 XP</b>. <b>Každá nová úroveň</b>: <b>+50 🪙</b>.</li>\n          <li><b>🎯 Úkoly</b> se obnovují každé pondělí: lehký <b>+15 🪙</b>, střední <b>+40 🪙</b>, těžký <b>+100 🪙</b>.</li>\n          <li><b>📝 Týdenní opakovací zkouška</b>: 20 naučených slov; 80 % nebo více vám přinese <b>+60 🪙 a +100 XP</b>.</li>\n        </ul>"
      ],
      [
        "badges",
        "🏷️",
        "Odznaky pod vlajkou",
        "\n        <ul>\n          <li><b>✅</b> — slova tohoto jazyka, na která jste už odpověděli správně.</li>\n          <li><b>📚</b> — celkový počet slov v kurzu (8000).</li>\n          <li><b>🎓 B2 · 8k</b> — 8000 slov vám zajistí úroveň B2: plynulou konverzaci. To je cíl celého kurzu.</li>\n        </ul>"
      ],
      [
        "settings",
        "⚙️",
        "Nastavení",
        "\n        <p>V <b>⚙️ Nastavení</b> si můžete vybrat motiv nebo vlastní barvy, změnit velikost rozhraní a zapnout či vypnout připomenutí jako „už jste se dlouho neučili“.</p>"
      ]
    ]
  },
  da: {
    "title": "Sådan fungerer det",
    "intro": "En hurtig guide: hvordan kurset er opbygget, hvor meget du bør lære om dagen, og hvad hjerterne bruges til.",
    "sections": [
      [
        "course",
        "🎓",
        "Kurset",
        "\n        <p>Hvert sprog har <b>36 emner</b> — <b>8000 ord</b> i alt. Emnerne følger niveauerne <b>A0 → A1 → A2 → B1 → B2</b>: fra hilsner og tal til arbejde, sundhed, samfund og videnskab.</p>\n        <ul>\n          <li><b>A0</b> — de første skridt: ca. 150 ord.</li>\n          <li><b>A1</b> — op til 1500 ord: enkle vendinger om dig selv og hverdagen.</li>\n          <li><b>A2</b> — 1500–2500 ord: hverdagssituationer.</li>\n          <li><b>B1</b> — 2700–4500 ord: arbejde, studie, rejser.</li>\n          <li><b>B2</b> — 5000–8000 ord: <b>flydende samtale</b> om ethvert emne.</li>\n        </ul>\n        <p>Begynd med <b>“Start lektion”</b> på forsiden — appen vælger det næste emne for dig. Hele forløbet findes på kursets side. Det næste emne låses op, når alle ord i det forrige er gennemgået, eller eksamenen er bestået.</p>"
      ],
      [
        "lesson",
        "📝",
        "En lektion",
        "\n        <p>Hver lektion starter med en <b>opvarmning</b>: ord, du svarede forkert på, og ord, der skal repeteres.</p>\n        <p>Derefter følger <b>8 nye ord</b> i grupper af 4: først en introduktion (billede, ord, udtale), derefter øvelser — vælg billedet, find par, genkend efter gehør, oversæt, dan en sætning, skriv ordet.</p>\n        <p>Gået i stå? I “Skriv ordet” har du <b>💡 Hint</b> (viser det næste bogstav) og <b>👁 Vis ord</b>.</p>"
      ],
      [
        "review",
        "🔁",
        "Repetition",
        "\n        <p>Appen bruger <b>fordelt gentagelse</b>: et ord dukker op igen, netop som du er ved at glemme det — efter 1 dag, derefter 6 dage og derefter sjældnere og sjældnere. Svarer du forkert, vender det tilbage i morgen.</p>\n        <p>Alle fejl havner i <b>“Ret fejl”</b>. Et ord forsvinder derfra, når du har svaret rigtigt i to lektioner i træk.</p>\n        <p>Stjernen <b>☆</b> tilføjer et ord til “Mine ord”, så du kan øve det for sig selv.</p>"
      ],
      [
        "daily",
        "📅",
        "Hvor meget du bør lære om dagen",
        "\n        <div class=\"help-tip\">Vi anbefaler <b>10–15 nye ord om dagen</b> (1–2 lektioner) <b>+ daglig repetition</b>.</div>\n        <ul>\n          <li><b>10 minutter hver dag slår en time én gang om ugen.</b> Hukommelsen lagrer ord, mens du sover, og korte, hyppige sessioner virker bedre end sjældne og lange.</li>\n          <li><b>Jagt ikke tal.</b> 15 ord om dagen er ~450 ord om måneden. Vælger du 50, bliver de fleste glemt.</li>\n          <li><b>Repetition er vigtigere end nye ord.</b> Hvis fejlene hober sig op, så brug en dag på “Ret fejl” uden nye ord.</li>\n          <li><b>Det daglige mål er 30 svar</b> — omtrent én lektion med dens opvarmning.</li>\n          <li><b>Sig ordene højt</b> og dan dine egne sætninger med dem — så hænger de bedre fast.</li>\n        </ul> Ancients"
      ],
      [
        "hearts",
        "❤️",
        "Hjerter, energi og hints",
        "\n        <ul>\n          <li>Du har <b>25 hjerter</b>, som overføres mellem lektioner. En fejl eller “👁 Vis ord” koster <b>1 hjerte</b>.</li>\n          <li><b>1 reklame = +1 hjerte</b>, så mange du vil — hjerter kan overstige 25.</li>\n          <li><b>16 timer</b> efter det første mistede hjerte vender <b>halvdelen (+13)</b> tilbage; efter <b>24 timer</b> har du <b>25</b> igen.</li>\n          <li><b>⚡ Energi:</b> hver <b>10 ord</b> koster <b>5 energi</b>. <b>+5</b> hver time op til <b>200</b>; efter 24 timer er den på <b>200</b> igen.</li>\n          <li><b>1 reklame = +15 energi</b>, ingen grænse.</li>\n          <li><b>💡 Hints:</b> <b>5 om dagen</b>, fornys dagligt. Få flere for en reklame eller i butikken.</li>\n          <li>Niveau-eksamener koster hverken hjerter eller energi.</li>\n        </ul>"
      ],
      [
        "streak",
        "🔥",
        "Streak, XP og niveauer",
        "\n        <p>Din <b>streak</b> vokser for hver dag, du gennemfører mindst én lektion. Flammen er <b>normal</b> i starten, <b>blå</b> efter en uge, <b>lilla</b> efter 3 uger og <b>grå</b>, hvis du har sprunget en dag over. Missede du 1–2 dage? Gendan din streak med en reklame.</p>\n        <p><b>XP</b> optjenes udelukkende ved rigtige svar og repetitioner: <b>+10 XP</b> pr. rigtigt svar, <b>+5 XP</b> for hver 3 i træk, <b>+25 XP</b> for en lektion uden fejl. En lektion med et nyt emne giver ca. <b>250–350 XP</b>.</p>\n        <p>Førertavler for <b>dagen, ugen og måneden</b>. Dit niveau (A0 → B2) stiger i takt med de ord, du lærer.</p>"
      ],
      [
        "coins",
        "🪙",
        "Mønter og missioner",
        "\n        <ul>\n          <li><b>Mønter 🪙</b> er valutaen i appen til hjerter, energi og hints i butikken.</li>\n          <li><b>Dagligt mål</b> (30 svar): <b>+10 🪙</b>. <b>Anbefalet mål</b> (60): <b>+25 🪙 og +30 XP</b>. <b>Hvert nyt niveau</b>: <b>+50 🪙</b>.</li>\n          <li><b>🎯 Missioner</b> fornys hver mandag: let <b>+15 🪙</b>, mellem <b>+40 🪙</b>, svær <b>+100 🪙</b>.</li>\n          <li><b>📝 Ugentlig repetitions-eksamen</b>: 20 lærte ord; 80 % eller mere giver <b>+60 🪙 og +100 XP</b>.</li>\n        </ul>"
      ],
      [
        "badges",
        "🏷️",
        "Badges under flaget",
        "\n        <ul>\n          <li><b>✅</b> — ord på dette sprog, du allerede har svaret rigtigt på.</li>\n          <li><b>📚</b> — det samlede antal ord i kurset (8000).</li>\n          <li><b>🎓 B2 · 8k</b> — 8000 ord giver dig B2: flydende samtale. Det er målet for hele kurset.</li>\n        </ul>"
      ],
      [
        "settings",
        "⚙️",
        "Indstillinger",
        "\n        <p>Under <b>⚙️ Indstillinger</b> kan du vælge et tema eller dine egne farver, ændre interfacets størrelse og slå påmindelser som “du har ikke øvet i et stykke tid” til eller fra.</p>"
      ]
    ]
  },
  de: {
    "title": "So funktioniert's",
    "intro": "Eine kurze Anleitung: wie der Kurs aufgebaut ist, wie viel du am Tag lernen solltest und wofür Herzen da sind.",
    "sections": [
      [
        "course",
        "🎓",
        "Der Kurs",
        "\n        <p>Jede Sprache umfasst <b>36 Themen</b> — insgesamt <b>8000 Wörter</b>. Die Themen folgen den Stufen <b>A0 → A1 → A2 → B1 → B2</b>: von Begrüßungen und Zahlen bis hin zu Arbeit, Gesundheit, Gesellschaft und Wissenschaft.</p>\n        <ul>\n          <li><b>A0</b> — erste Schritte: ca. 150 Wörter.</li>\n          <li><b>A1</b> — bis zu 1500 Wörter: einfache Sätze über dich und deinen Alltag.</li>\n          <li><b>A2</b> — 1500–2500 Wörter: alltägliche Situationen.</li>\n          <li><b>B1</b> — 2700–4500 Wörter: Arbeit, Studium, Reisen.</li>\n          <li><b>B2</b> — 5000–8000 Wörter: <b>fließende Unterhaltung</b> zu jedem Thema.</li>\n        </ul>\n        <p>Tippe auf der Startseite auf <b>„Lektion starten“</b> — die App wählt das nächste Thema für dich aus. Deinen gesamten Lernpfad findest du auf der Kursseite. Das nächste Thema wird freigeschaltet, sobald jedes Wort des vorherigen gelernt oder die Abschlussprüfung bestanden ist.</p>"
      ],
      [
        "lesson",
        "📝",
        "Eine Lektion",
        "\n        <p>Jede Lektion beginnt mit einem <b>Aufwärmen</b>: Wörter, bei denen du Fehler gemacht hast, und Wörter, die zur Wiederholung anstehen.</p>\n        <p>Danach folgen <b>8 neue Wörter</b> in 4er-Gruppen: zuerst die Einführung (Bild, Wort, Aussprache), dann Übungen — passendes Bild wählen, Paare finden, nach Gehör erkennen, übersetzen, Sätze bilden, Wort tippen.</p>\n        <p>Kommst du nicht weiter? Bei „Wort tippen“ gibt es <b>💡 Hinweis</b> (deckt den nächsten Buchstaben auf) und <b>👁 Wort anzeigen</b>.</p>"
      ],
      [
        "review",
        "🔁",
        "Wiederholung",
        "\n        <p>Die App nutzt <b>Spaced Repetition</b>: Ein Wort wird genau dann wiederholt, wenn du es gerade zu vergessen beginnst — nach 1 Tag, dann nach 6 Tagen und danach immer seltener. Machst du einen Fehler, kommt es schon morgen wieder.</p>\n        <p>Alle Fehler landen in <b>„Fehler beheben“</b>. Ein Wort verschwindet erst wieder daraus, wenn du es in zwei Lektionen hintereinander richtig beantwortest.</p>\n        <p>Mit dem <b>☆</b>-Sternchen fügst du ein Wort zu „Meine Wörter“ hinzu, um es separat zu wiederholen.</p>"
      ],
      [
        "daily",
        "📅",
        "Wie viel pro Tag lernen",
        "\n        <div class=\"help-tip\">Wir empfehlen <b>10–15 neue Wörter pro Tag</b> (1–2 Lektionen) <b>+ tägliche Wiederholung</b>.</div>\n        <ul>\n          <li><b>10 Minuten täglich sind besser als eine Stunde einmal pro Woche.</b> Das Gehirn festigt Wörter im Schlaf, und kurze, regelmäßige Einheiten wirken viel besser als seltene, lange Lerneinheiten.</li>\n          <li><b>Jage nicht bloßen Zahlen hinterher.</b> 15 Wörter am Tag sind ~450 Wörter im Monat. Lernst du 50, wird das meiste schnell wieder vergessen.</li>\n          <li><b>Wiederholen ist wichtiger als neue Wörter.</b> Wenn sich Fehler häufen, nimm dir einen Tag Zeit für „Fehler beheben“, ganz ohne neue Wörter.</li>\n          <li><b>Das Tagesziel sind 30 Antworten</b> — etwa eine Lektion inklusive Aufwärmen.</li>\n          <li><b>Sprich Wörter laut aus</b> und bilde eigene Sätze damit — so prägen sie sich schneller ein.</li>\n        </ul>"
      ],
      [
        "hearts",
        "❤️",
        "Herzen, Energie und Hinweise",
        "\n        <ul>\n          <li>Du hast <b>25 Herzen</b>, die zwischen den Lektionen erhalten bleiben. Ein Fehler oder „👁 Wort anzeigen“ kostet <b>1 Herz</b>.</li>\n          <li><b>1 Werbung = +1 Herz</b>, beliebig oft — die Herzen können auch über 25 steigen.</li>\n          <li><b>16 Stunden</b> nach dem ersten verlorenen Herz kommt die <b>Hälfte (+13)</b> zurück; nach <b>24 Stunden</b> hast du wieder <b>25</b>.</li>\n          <li><b>⚡ Energie:</b> Alle <b>10 Wörter</b> kosten <b>5 Energie</b>. <b>+5</b> jede Stunde bis maximal <b>200</b>; nach 24 Stunden sind es wieder <b>200</b>.</li>\n          <li><b>1 Werbung = +15 Energie</b>, ohne Limit.</li>\n          <li><b>💡 Hinweise:</b> <b>5 pro Tag</b>, werden täglich erneuert. Mehr gibt es für Werbung oder im Shop.</li>\n          <li>Stufenprüfungen verbrauchen weder Herzen noch Energie.</li>\n        </ul>"
      ],
      [
        "streak",
        "🔥",
        "Streak, XP und Stufen",
        "\n        <p>Deine <b>Streak</b> wächst mit jedem Tag, an dem du mindestens eine Lektion abschließt. Die Flamme ist zuerst <b>normal</b>, nach 1 Woche <b>blau</b>, nach 3 Wochen <b>lila</b> und <b>grau</b>, wenn ein Tag verpasst wurde. 1–2 Tage verpasst? Stelle die Streak mit einer Werbung wieder her.</p>\n        <p><b>XP</b> gibt es nur für richtige Antworten und Wiederholungen: <b>+10 XP</b> pro richtige Antwort, <b>+5 XP</b> für jeweils 3 in Folge, <b>+25 XP</b> für eine fehlerfreie Lektion. Eine Lektion zu einem neuen Thema bringt etwa <b>250–350 XP</b>.</p>\n        <p>Bestenlisten gibt es für den <b>Tag, die Woche und den Monat</b>. Deine Stufe (A0 → B2) steigt mit den Wörtern, die du lernst.</p>"
      ],
      [
        "coins",
        "🪙",
        "Münzen und Quests",
        "\n        <ul>\n          <li><b>Münzen 🪙</b> sind die In-App-Währung für Herzen, Energie und Hinweise im Shop.</li>\n          <li><b>Tagesziel</b> (30 Antworten): <b>+10 🪙</b>. <b>Empfohlenes Ziel</b> (60): <b>+25 🪙 und +30 XP</b>. <b>Jede neue Stufe</b>: <b>+50 🪙</b>.</li>\n          <li><b>🎯 Quests</b> erneuern sich jeden Montag: leicht <b>+15 🪙</b>, mittel <b>+40 🪙</b>, schwer <b>+100 🪙</b>.</li>\n          <li><b>📝 Wöchentliche Wiederholungsprüfung</b>: 20 gelernte Wörter; bei 80% oder mehr gibt es <b>+60 🪙 und +100 XP</b>.</li>\n        </ul>"
      ],
      [
        "badges",
        "🏷️",
        "Abzeichen unter der Flagge",
        "\n        <ul>\n          <li><b>✅</b> — Wörter dieser Sprache, die du bereits richtig beantwortet hast.</li>\n          <li><b>📚</b> — Gesamtzahl der Wörter im Kurs (8000).</li>\n          <li><b>🎓 B2 · 8k</b> — Mit 8000 Wörtern erreichst du B2: freie Konversation. Das ist das Ziel des gesamten Kurses.</li>\n        </ul>"
      ],
      [
        "settings",
        "⚙️",
        "Einstellungen",
        "\n        <p>In den <b>⚙️ Einstellungen</b> kannst du ein Farbschema oder eigene Farben wählen, die Größe der Benutzeroberfläche anpassen und Erinnerungen wie „du hast schon länger nicht gelernt“ ein- oder ausschalten.</p>"
      ]
    ]
  },
  es: {
    "title": "Cómo funciona",
    "intro": "Una guía rápida: cómo está organizado el curso, cuánto estudiar al día y para qué sirven las vidas.",
    "sections": [
      [
        "course",
        "🎓",
        "El curso",
        "\n        <p>Cada idioma tiene <b>36 temas</b> — <b>8000 palabras</b> en total. Los temas siguen los niveles <b>A0 → A1 → A2 → B1 → B2</b>: desde saludos y números hasta trabajo, salud, sociedad y ciencia.</p>\n        <ul>\n          <li><b>A0</b> — primeros pasos: unas 150 palabras.</li>\n          <li><b>A1</b> — hasta 1500 palabras: frases sencillas sobre ti y la vida cotidiana.</li>\n          <li><b>A2</b> — 1500–2500 palabras: situaciones cotidianas.</li>\n          <li><b>B1</b> — 2700–4500 palabras: trabajo, estudio, viajes.</li>\n          <li><b>B2</b> — 5000–8000 palabras: <b>conversación fluida</b> sobre cualquier tema.</li>\n        </ul>\n        <p>Empieza con <b>“Empezar lección”</b> en la página principal: la aplicación elegirá el siguiente tema por ti. Todo el recorrido está en la página del curso. El siguiente tema se desbloquea una vez que se aprende cada palabra del anterior o se aprueba su examen.</p>"
      ],
      [
        "lesson",
        "📝",
        "Una lección",
        "\n        <p>Cada lección empieza con un <b>calentamiento</b>: palabras en las que te equivocaste y palabras que toca repasar.</p>\n        <p>Luego <b>8 palabras nuevas</b> en grupos de 4: primero una presentación (imagen, palabra, pronunciación), después ejercicios: elegir la imagen, emparejar, reconocer de oído, traducir, construir una frase, escribir la palabra.</p>\n        <p>¿Te has atascado? “Escribir la palabra” tiene <b>💡 Pista</b> (revela la siguiente letra) y <b>👁 Mostrar palabra</b>.</p>"
      ],
      [
        "review",
        "🔁",
        "Repaso",
        "\n        <p>La aplicación utiliza el <b>repaso espaciado</b>: una palabra vuelve justo cuando empiezas a olvidarla — después de 1 día, luego 6 días, y cada vez con menos frecuencia. Si te equivocas, vuelve mañana.</p>\n        <p>Todos los errores van a <b>“Corregir errores”</b>. Una palabra sale de allí después de responder correctamente en dos lecciones seguidas.</p>\n        <p>La estrella <b>☆</b> añade una palabra a “Mis palabras” para que puedas repasarla por separado.</p>"
      ],
      [
        "daily",
        "📅",
        "Cuánto estudiar al día",
        "\n        <div class=\"help-tip\">Recomendamos <b>10–15 palabras nuevas al día</b> (1–2 lecciones) <b>+ repaso diario</b>.</div>\n        <ul>\n          <li><b>10 minutos todos los días supera a una hora una vez a la semana.</b> La memoria consolida las palabras durante el sueño, y las sesiones cortas y frecuentes funcionan mejor que las largas y poco frecuentes.</li>\n          <li><b>No persigas números.</b> 15 palabras al día son ~450 palabras al mes. Si intentas 50, olvidarás la mayoría.</li>\n          <li><b>El repaso importa más que las palabras nuevas.</b> Si se te acumulan los errores, dedica un día a “Corregir errores” sin añadir palabras nuevas.</li>\n          <li><b>El objetivo diario es de 30 respuestas</b> — aproximadamente una lección con su calentamiento.</li>\n          <li><b>Di las palabras en voz alta</b> y crea tus propias frases con ellas: se te quedarán más rápido.</li>\n        </ul>"
      ],
      [
        "hearts",
        "❤️",
        "Vidas, energía y pistas",
        "\n        <ul>\n          <li>Tienes <b>25 vidas</b>, que se conservan entre lecciones. Un error o “👁 Mostrar palabra” cuesta <b>1 vida</b>.</li>\n          <li><b>1 anuncio = +1 vida</b>, tantas como quieras — las vidas pueden superar las 25.</li>\n          <li><b>16 horas</b> después de perder la primera vida, recuperas la <b>mitad (+13)</b>; tras <b>24 horas</b> vuelves a tener <b>25</b>.</li>\n          <li><b>⚡ Energía:</b> cada <b>10 palabras</b> cuestan <b>5 de energía</b>. <b>+5</b> cada hora hasta llegar a <b>200</b>; tras 24 horas vuelves a tener <b>200</b>.</li>\n          <li><b>1 anuncio = +15 de energía</b>, sin límite.</li>\n          <li><b>💡 Pistas:</b> <b>5 al día</b>, se renuevan diariamente. Más a cambio de un anuncio o en la tienda.</li>\n          <li>Los exámenes de nivel no consumen vidas ni energía.</li>\n        </ul>"
      ],
      [
        "streak",
        "🔥",
        "Racha, XP y niveles",
        "\n        <p>Tu <b>racha</b> aumenta cada día que completas al menos una lección. La llama es <b>normal</b> al principio, <b>azul</b> tras una semana, <b>morada</b> tras 3 semanas y <b>gris</b> cuando pasas un día sin estudiar. ¿Has perdido 1–2 días? Recupera la racha viendo un anuncio.</p>\n        <p>Los <b>XP</b> se obtienen únicamente con respuestas correctas y repasos: <b>+10 XP</b> por respuesta correcta, <b>+5 XP</b> por cada 3 seguidas, <b>+25 XP</b> por una lección sin errores. Una lección de un tema nuevo da unos <b>250–350 XP</b>.</p>\n        <p>Clasificaciones para el <b>día, la semana y el mes</b>. Tu nivel (A0 → B2) crece con las palabras que aprendes.</p>"
      ],
      [
        "coins",
        "🪙",
        "Monedas y misiones",
        "\n        <ul>\n          <li>Las <b>monedas 🪙</b> son la divisa de la aplicación para conseguir vidas, energía y pistas en la tienda.</li>\n          <li><b>Objetivo diario</b> (30 respuestas): <b>+10 🪙</b>. <b>Objetivo recomendado</b> (60): <b>+25 🪙 y +30 XP</b>. <b>Cada nuevo nivel</b>: <b>+50 🪙</b>.</li>\n          <li>Las <b>🎯 misiones</b> se renuevan cada lunes: fácil <b>+15 🪙</b>, media <b>+40 🪙</b>, difícil <b>+100 🪙</b>.</li>\n          <li><b>📝 Examen de repaso semanal</b>: 20 palabras aprendidas; un 80% o más te da <b>+60 🪙 y +100 XP</b>.</li>\n        </ul>"
      ],
      [
        "badges",
        "🏷️",
        "Insignias bajo la bandera",
        "\n        <ul>\n          <li><b>✅</b> — palabras de este idioma a las que ya has respondido correctamente.</li>\n          <li><b>📚</b> — total de palabras del curso (8000).</li>\n          <li><b>🎓 B2 · 8k</b> — 8000 palabras te dan un nivel B2: conversación fluida. Ese es el objetivo de todo el curso.</li>\n        </ul>"
      ],
      [
        "settings",
        "⚙️",
        "Ajustes",
        "\n        <p>En <b>⚙️ Ajustes</b> puedes elegir un tema o tus propios colores, cambiar el tamaño de la interfaz y activar o desactivar recordatorios como “hace tiempo que no estudias”.</p>"
      ]
    ]
  },
  fr: {
    "title": "Comment ça marche",
    "intro": "Un guide rapide : comment le cours est construit, combien apprendre par jour et à quoi servent les cœurs.",
    "sections": [
      [
        "course",
        "🎓",
        "Le cours",
        "\n        <p>Chaque langue compte <b>36 thèmes</b> — <b>8000 mots</b> au total. Les thèmes suivent les niveaux <b>A0 → A1 → A2 → B1 → B2</b> : des salutations et des chiffres au travail, à la santé, la société et la science.</p>\n        <ul>\n          <li><b>A0</b> — premiers pas : environ 150 mots.</li>\n          <li><b>A1</b> — jusqu'à 1500 mots : des phrases simples sur vous-même et la vie quotidienne.</li>\n          <li><b>A2</b> — 1500–2500 mots : des situations du quotidien.</li>\n          <li><b>B1</b> — 2700–4500 mots : travail, études, voyages.</li>\n          <li><b>B2</b> — 5000–8000 mots : <b>conversation fluide</b> sur n'importe quel sujet.</li>\n        </ul>\n        <p>Commencez avec <b>« Commencer la leçon »</b> sur la page d'accueil — l'application choisit le thème suivant pour vous. Tout le parcours se trouve sur la page du cours. Le thème suivant s'ouvre dès que chaque mot du précédent est étudié ou que son examen est réussi.</p>"
      ],
      [
        "lesson",
        "📝",
        "Une leçon",
        "\n        <p>Chaque leçon commence par un <b>échauffement</b> : les mots où vous vous êtes trompé et ceux qui doivent être révisés.</p>\n        <p>Puis <b>8 nouveaux mots</b> par groupes de 4 : d'abord une présentation (image, mot, prononciation), puis des exercices — choisir l'image, associer les paires, reconnaître à l'oreille, traduire, construire une phrase, taper le mot.</p>\n        <p>Bloqué ? « Taper le mot » propose <b>💡 Indice</b> (révèle la lettre suivante) et <b>👁 Montrer le mot</b>.</p>"
      ],
      [
        "review",
        "🔁",
        "La révision",
        "\n        <p>L'application utilise la <b>répétition espacée</b> : un mot revient juste au moment où vous commencez à l'oublier — après 1 jour, puis 6 jours, puis de moins en moins souvent. Trompez-vous et il reviendra demain.</p>\n        <p>Toutes les erreurs vont dans <b>« Corriger les erreurs »</b>. Un mot en sort lorsque vous y répondez correctement dans deux leçons d'affilée.</p>\n        <p>L'étoile <b>☆</b> ajoute un mot à « Mes mots » pour pouvoir le réviser séparément.</p>"
      ],
      [
        "daily",
        "📅",
        "Combien apprendre par jour",
        "\n        <div class=\"help-tip\">Nous recommandons <b>10–15 nouveaux mots par jour</b> (1–2 leçons) <b>+ des révisions chaque jour</b>.</div>\n        <ul>\n          <li><b>10 minutes chaque jour valent mieux qu'une heure une fois par semaine.</b> La mémoire consolide les mots pendant le sommeil, et les sessions courtes et fréquentes fonctionnent mieux que les rares sessions longues.</li>\n          <li><b>Ne courez pas après les chiffres.</b> 15 mots par jour, c'est environ 450 mots par mois. Prenez-en 50 et la plupart seront oubliés.</li>\n          <li><b>La révision compte plus que les nouveaux mots.</b> Si les erreurs s'accumulent, passez une journée sur « Corriger les erreurs » sans nouveaux mots.</li>\n          <li><b>L'objectif quotidien est de 30 réponses</b> — environ une leçon avec son échauffement.</li>\n          <li><b>Dites les mots à voix haute</b> et créez vos propres phrases avec — ils s'imprégneront plus vite.</li>\n        </ul>"
      ],
      [
        "hearts",
        "❤️",
        "Cœurs, énergie et indices",
        "\n        <ul>\n          <li>Vous avez <b>25 cœurs</b>, conservés entre les leçons. Une erreur ou « 👁 Montrer le mot » coûte <b>1 cœur</b>.</li>\n          <li><b>1 pub = +1 cœur</b>, autant que vous voulez — les cœurs peuvent dépasser 25.</li>\n          <li><b>16 heures</b> après le premier cœur perdu, <b>la moitié (+13)</b> revient ; après <b>24 heures</b>, vous en avez à nouveau <b>25</b>.</li>\n          <li><b>⚡ Énergie :</b> tous les <b>10 mots</b> coûtent <b>5 d'énergie</b>. <b>+5</b> chaque heure jusqu'à <b>200</b> ; après 24 heures, vous êtes de nouveau à <b>200</b>.</li>\n          <li><b>1 pub = +15 d'énergie</b>, sans limite.</li>\n          <li><b>💡 Indices :</b> <b>5 par jour</b>, renouvelés quotidiennement. Plus d'indices avec une pub ou dans la boutique.</li>\n          <li>Les examens de niveau n'utilisent ni cœurs ni énergie.</li>\n        </ul>"
      ],
      [
        "streak",
        "🔥",
        "Série, XP et niveaux",
        "\n        <p>Votre <b>série</b> augmente chaque jour où vous terminez au moins une leçon. La flamme est <b>normale</b> au début, <b>bleue</b> après une semaine, <b>violette</b> après 3 semaines et <b>grise</b> lorsqu'un jour a été manqué. Vous avez manqué 1–2 jours ? Restaurez la série avec une pub.</p>\n        <p>Les <b>XP</b> proviennent uniquement des bonnes réponses et des révisions : <b>+10 XP</b> par bonne réponse, <b>+5 XP</b> toutes les 3 d'affilée, <b>+25 XP</b> pour une leçon sans erreur. Une leçon sur un nouveau thème donne environ <b>250–350 XP</b>.</p>\n        <p>Classements pour le <b>jour, la semaine et le mois</b>. Votre niveau (A0 → B2) progresse avec les mots que vous apprenez.</p>"
      ],
      [
        "coins",
        "🪙",
        "Pièces et quêtes",
        "\n        <ul>\n          <li>Les <b>pièces 🪙</b> sont la monnaie de l'application pour les cœurs, l'énergie et les indices dans la boutique.</li>\n          <li><b>Objectif quotidien</b> (30 réponses) : <b>+10 🪙</b>. <b>Objectif recommandé</b> (60) : <b>+25 🪙 et +30 XP</b>. <b>Chaque nouveau niveau</b> : <b>+50 🪙</b>.</li>\n          <li><b>🎯 Quêtes</b> renouvelées chaque lundi : facile <b>+15 🪙</b>, moyenne <b>+40 🪙</b>, difficile <b>+100 🪙</b>.</li>\n          <li><b>📝 Examen de révision hebdomadaire</b> : 20 mots appris ; 80 % ou plus donne <b>+60 🪙 et +100 XP</b>.</li>\n        </ul>"
      ],
      [
        "badges",
        "🏷️",
        "Badges sous le drapeau",
        "\n        <ul>\n          <li><b>✅</b> — mots de cette langue auxquels vous avez déjà répondu correctement.</li>\n          <li><b>📚</b> — nombre total de mots dans le cours (8000).</li>\n          <li><b>🎓 B2 · 8k</b> — 8000 mots vous donnent le niveau B2 : conversation fluide. C'est l'objectif de l'ensemble du cours.</li>\n        </ul>"
      ],
      [
        "settings",
        "⚙️",
        "Paramètres",
        "\n        <p>Dans <b>⚙️ Paramètres</b>, vous pouvez choisir un thème ou vos propres couleurs, modifier la taille de l'interface et activer ou désactiver les rappels comme « vous n'avez pas étudié depuis un moment ».</p>"
      ]
    ]
  },
  nl: {
    "title": "Hoe het werkt",
    "intro": "Een korte gids: hoe de cursus is opgebouwd, hoeveel je per dag kunt leren en waar hartjes voor dienen.",
    "sections": [
      [
        "course",
        "🎓",
        "De cursus",
        "\n        <p>Elke taal heeft <b>36 onderwerpen</b> — <b>8000 woorden</b> in totaal. Onderwerpen volgen de niveaus <b>A0 → A1 → A2 → B1 → B2</b>: van begroetingen en getallen tot werk, gezondheid, maatschappij en wetenschap.</p>\n        <ul>\n          <li><b>A0</b> — eerste stappen: ongeveer 150 woorden.</li>\n          <li><b>A1</b> — tot 1500 woorden: eenvoudige zinnen over jezelf en het dagelijks leven.</li>\n          <li><b>A2</b> — 1500–2500 woorden: alledaagse situaties.</li>\n          <li><b>B1</b> — 2700–4500 woorden: werk, studie, reizen.</li>\n          <li><b>B2</b> — 5000–8000 woorden: <b>vrijuit praten</b> over elk onderwerp.</li>\n        </ul>\n        <p>Begin met <b>“Start les”</b> op de startpagina — de app kiest het volgende onderwerp voor je. Het hele traject vind je op de cursuspagina. Het volgende onderwerp wordt ontgrendeld zodra elk woord van het vorige is geleerd of het bijbehorende examen is behaald.</p>"
      ],
      [
        "lesson",
        "📝",
        "Een les",
        "\n        <p>Elke les begint met een <b>warming-up</b>: woorden die je fout had en woorden die herhaald moeten worden.</p>\n        <p>Daarna volgen <b>8 nieuwe woorden</b> in groepjes van 4: eerst een introductie (afbeelding, woord, uitspraak), daarna oefeningen — kies de afbeelding, combineer paren, herken op gehoor, vertaal, maak een zin, typ het woord.</p>\n        <p>Zit je vast? Bij “Typ het woord” heb je <b>💡 Hint</b> (onthult de volgende letter) en <b>👁 Toon woord</b>.</p>"
      ],
      [
        "review",
        "🔁",
        "Herhalen",
        "\n        <p>De app gebruikt <b>gespreide herhaling</b>: een woord komt terug net wanneer je het dreigt te vergeten — na 1 dag, dan na 6 dagen, en daarna steeds minder vaak. Heb je het fout, dan komt het morgen al terug.</p>\n        <p>Alle fouten komen in <b>“Fouten herstellen”</b>. Een woord verdwijnt hieruit zodra je het in twee lessen op rij goed hebt beantwoord.</p>\n        <p>Met de <b>☆</b> ster voeg je een woord toe aan “Mijn woorden”, zodat je het apart kunt oefenen.</p>"
      ],
      [
        "daily",
        "📅",
        "Hoeveel te leren per dag",
        "\n        <div class=\"help-tip\">We raden <b>10–15 nieuwe woorden per dag</b> aan (1–2 lessen) <b>+ elke dag herhalen</b>.</div>\n        <ul>\n          <li><b>10 minuten per dag werkt beter dan een uur één keer per week.</b> Je geheugen verwerkt woorden tijdens de slaap, en korte, frequente sessies werken beter dan af en toe een lange.</li>\n          <li><b>Staar je niet blind op getallen.</b> 15 woorden per dag is ~450 woorden per maand. Leer je er 50, dan vergeet je de meeste.</li>\n          <li><b>Herhalen is belangrijker dan nieuwe woorden.</b> Stapelen de fouten zich op? Besteed dan een dag aan “Fouten herstellen” zonder nieuwe woorden.</li>\n          <li><b>Het dagelijkse doel is 30 antwoorden</b> — ongeveer één les inclusief warming-up.</li>\n          <li><b>Spreek woorden hardop uit</b> en bedenk er je eigen zinnen mee — zo blijven ze sneller hangen.</li>\n        </ul> Anci"
      ],
      [
        "hearts",
        "❤️",
        "Hartjes, energie en hints",
        "\n        <ul>\n          <li>Je hebt <b>25 hartjes</b>, die behouden blijven tussen lessen. Een fout of “👁 Toon woord” kost <b>1 hartje</b>.</li>\n          <li><b>1 advertentie = +1 hartje</b>, zoveel als je wilt — hartjes kunnen boven de 25 uitkomen.</li>\n          <li><b>16 uur</b> na het eerste verloren hartje krijg je de <b>helft (+13)</b> terug; na <b>24 uur</b> heb je er weer <b>25</b>.</li>\n          <li><b>⚡ Energie:</b> elke <b>10 woorden</b> kosten <b>5 energie</b>. <b>+5</b> per uur tot <b>200</b>; na 24 uur is het weer <b>200</b>.</li>\n          <li><b>1 advertentie = +15 energie</b>, geen limiet.</li>\n          <li><b>💡 Hints:</b> <b>5 per dag</b>, worden dagelijks vernieuwd. Meer via een advertentie of in de winkel.</li>\n          <li>Niveau-examens kosten geen hartjes of energie.</li>\n        </ul>"
      ],
      [
        "streak",
        "🔥",
        "Reeks, XP en niveaus",
        "\n        <p>Je <b>reeks</b> groeit elke dag dat je minstens één les afrondt. De vlam is eerst <b>normaal</b>, na een week <b>blauw</b>, na 3 weken <b>paars</b> en <b>grijs</b> als je een dag hebt gemist. 1–2 dagen gemist? Herstel je reeks met een advertentie.</p>\n        <p><b>XP</b> verdien je alleen met goede antwoorden en herhalingen: <b>+10 XP</b> per goed antwoord, <b>+5 XP</b> voor elke 3 op een rij, <b>+25 XP</b> voor een les zonder fouten. Een les met een nieuw onderwerp levert ongeveer <b>250–350 XP</b> op.</p>\n        <p>Klassementen voor de <b>dag, week en maand</b>. Je niveau (A0 → B2) groeit mee met de woorden die je leert.</p>"
      ],
      [
        "coins",
        "🪙",
        "Munten en missies",
        "\n        <ul>\n          <li><b>Munten 🪙</b> zijn de valuta in de app voor hartjes, energie en hints in de winkel.</li>\n          <li><b>Dagelijks doel</b> (30 antwoorden): <b>+10 🪙</b>. <b>Aanbevolen doel</b> (60): <b>+25 🪙 en +30 XP</b>. <b>Elk nieuw niveau</b>: <b>+50 🪙</b>.</li>\n          <li><b>🎯 Missies</b> worden elke maandag vernieuwd: makkelijk <b>+15 🪙</b>, gemiddeld <b>+40 🪙</b>, moeilijk <b>+100 🪙</b>.</li>\n          <li><b>📝 Wekelijks herhalingsexamen</b>: 20 geleerde woorden; 80% of meer levert <b>+60 🪙 en +100 XP</b> op.</li>\n        </ul>"
      ],
      [
        "badges",
        "🏷️",
        "Badges onder de vlag",
        "\n        <ul>\n          <li><b>✅</b> — woorden van deze taal die je al goed hebt beantwoord.</li>\n          <li><b>📚</b> — totaal aantal woorden in de cursus (8000).</li>\n          <li><b>🎓 B2 · 8k</b> — 8000 woorden geven je B2: vrijuit praten. Dat is het doel van de hele cursus.</li>\n        </ul>"
      ],
      [
        "settings",
        "⚙️",
        "Instellingen",
        "\n        <p>In <b>⚙️ Instellingen</b> kun je een thema of je eigen kleuren kiezen, de grootte van de interface aanpassen en herinneringen zoals “je hebt al een tijdje niet geoefend” in- of uitschakelen.</p>"
      ]
    ]
  },
  no: {
    "title": "Slik fungerer det",
    "intro": "En kjapp guide: hvordan kurset er bygd opp, hvor mye du bør lære hver dag, og hva hjertene brukes til.",
    "sections": [
      [
        "course",
        "🎓",
        "Kurset",
        "\n        <p>Hvert språk har <b>36 temaer</b> — <b>8000 ord</b> totalt. Temaene følger nivåene <b>A0 → A1 → A2 → B1 → B2</b>: fra hilsener og tall til jobb, helse, samfunn og vitenskap.</p>\n        <ul>\n          <li><b>A0</b> — de første stegene: rundt 150 ord.</li>\n          <li><b>A1</b> — opptil 1500 ord: enkle fraser om deg selv og hverdagen.</li>\n          <li><b>A2</b> — 1500–2500 ord: dagligdagse situasjoner.</li>\n          <li><b>B1</b> — 2700–4500 ord: jobb, studier, reise.</li>\n          <li><b>B2</b> — 5000–8000 ord: <b>flytende samtale</b> om hva som helst.</li>\n        </ul>\n        <p>Start med <b>«Start leksjon»</b> på startsiden — appen velger neste tema for deg. Hele læringsløpet finner du på kurssiden. Neste tema låses opp så snart hvert ord i det forrige er gjennomgått, eller du har bestått eksamenen for det.</p>"
      ],
      [
        "lesson",
        "📝",
        "En leksjon",
        "\n        <p>Hver leksjon starter med en <b>oppvarming</b>: ord du svarte feil på, og ord som er klare for repetisjon.</p>\n        <p>Deretter kommer <b>8 nye ord</b> i grupper på 4: først en introduksjon (bilde, ord, uttale), og så øvelser — velg riktig bilde, finn par, gjenkjenn på lyden, oversett, bygg en setning, skriv ordet.</p>\n        <p>Står du fast? «Skriv ordet» har <b>💡 Hint</b> (viser neste bokstav) og <b>👁 Vis ord</b>.</p>"
      ],
      [
        "review",
        "🔁",
        "Repetisjon",
        "\n        <p>Appen bruker <b>intervallrepetisjon</b>: et ord dukker opp igjen akkurat idet du er i ferd med å glemme det — etter 1 dag, så 6 dager, og deretter sjeldnere og sjeldnere. Svarer du feil, kommer det tilbake i morgen.</p>\n        <p>Alle feil samles i <b>«Rett feil»</b>. Et ord forsvinner derfra når du har svart riktig i to leksjoner på rad.</p>\n        <p>Med <b>☆</b>-stjernen legger du et ord til i «Mine ord», slik at du kan øve på det for seg selv.</p>"
      ],
      [
        "daily",
        "📅",
        "Hvor mye bør du lære om dagen?",
        "\n        <div class=\"help-tip\">Vi anbefaler <b>10–15 nye ord om dagen</b> (1–2 leksjoner) <b>+ repetisjon hver dag</b>.</div>\n        <ul>\n          <li><b>10 minutter hver dag slår en time én gang i uka.</b> Hukommelsen bearbeider ord mens du sover, og korte, hyppige økter fungerer mye bedre enn sjeldne skippertak.</li>\n          <li><b>Ikke jag etter tallene.</b> 15 ord om dagen blir ca. 450 ord i måneden. Tar du 50, vil det meste bli glemt.</li>\n          <li><b>Repetisjon er viktigere enn nye ord.</b> Hoper det seg opp med feil, kan du bruke en dag på «Rett feil» uten å lære nye ord.</li>\n          <li><b>Dagsmålet er 30 svar</b> — omtrent én leksjon inkludert oppvarming.</li>\n          <li><b>Si ordene høyt</b> og lag dine egne setninger med dem — da fester de seg raskere.</li>\n        </ul>"
      ],
      [
        "hearts",
        "❤️",
        "Hjerter, energi og hint",
        "\n        <ul>\n          <li>Du har <b>25 hjerter</b>, som tas med videre mellom leksjonene. En feil eller «👁 Vis ord» koster <b>1 hjerte</b>.</li>\n          <li><b>1 reklame = +1 hjerte</b>, så mange du vil — du kan ha flere enn 25 hjerter.</li>\n          <li><b>16 timer</b> etter det første tapte hjertet får du <b>halvparten (+13)</b> tilbake; etter <b>24 timer</b> har du <b>25</b> igjen.</li>\n          <li><b>⚡ Energi:</b> Hvert <b>10. ord</b> koster <b>5 energi</b>. <b>+5</b> hver time opptil <b>200</b>; etter 24 timer er den på <b>200</b> igjen.</li>\n          <li><b>1 reklame = +15 energi</b>, ingen begrensning.</li>\n          <li><b>💡 Hint:</b> <b>5 per dag</b>, fornyes daglig. Flere kan fås mot reklame eller i butikken.</li>\n          <li>Nivåeksamener koster verken hjerter eller energi.</li>\n        </ul>"
      ],
      [
        "streak",
        "🔥",
        "Streak, XP og nivåer",
        "\n        <p><b>Streaken</b> din øker for hver dag du fullfører minst én leksjon. Flammen er <b>vanlig</b> i starten, <b>blå</b> etter en uke, <b>lilla</b> etter 3 uker og <b>grå</b> hvis du har gått glipp av en dag. Mistet du 1–2 dager? Gjenopprett streaken med en reklame.</p>\n        <p><b>XP</b> får du bare fra riktige svar og repetisjoner: <b>+10 XP</b> per riktig svar, <b>+5 XP</b> for hver 3. på rad, <b>+25 XP</b> for en leksjon uten feil. En leksjon med et nytt tema gir omtrent <b>250–350 XP</b>.</p>\n        <p>Topplister for <b>dag, uke og måned</b>. Nivået ditt (A0 → B2) stiger i takt med ordene du lærer.</p>"
      ],
      [
        "coins",
        "🪙",
        "Mynter og oppdrag",
        "\n        <ul>\n          <li><b>Mynter 🪙</b> er valutaen i appen for å kjøpe hjerter, energi og hint i butikken.</li>\n          <li><b>Dagsmål</b> (30 svar): <b>+10 🪙</b>. <b>Anbefalt mål</b> (60): <b>+25 🪙 og +30 XP</b>. <b>Hvert nye nivå</b>: <b>+50 🪙</b>.</li>\n          <li><b>🎯 Oppdrag</b> fornyes hver mandag: lett <b>+15 🪙</b>, middels <b>+40 🪙</b>, vanskelig <b>+100 🪙</b>.</li>\n          <li><b>📝 Ukentlig repetisjonseksamen</b>: 20 lærte ord; 80 % eller mer gir <b>+60 🪙 og +100 XP</b>.</li>\n        </ul>"
      ],
      [
        "badges",
        "🏷️",
        "Merker under flagget",
        "\n        <ul>\n          <li><b>✅</b> — ord på dette språket du allerede har svart riktig på.</li>\n          <li><b>📚</b> — totalt antall ord i kurset (8000).</li>\n          <li><b>🎓 B2 · 8k</b> — 8000 ord gir deg B2: flytende samtale. Det er målet for hele kurset.</li>\n        </ul>"
      ],
      [
        "settings",
        "⚙️",
        "Innstillinger",
        "\n        <p>I <b>⚙️ Innstillinger</b> kan du velge et tema eller egne farger, endre størrelsen på grensesnittet og slå av eller på påminnelser som «det er en stund siden du har øvd».</p>"
      ]
    ]
  },
  sk: {
    "title": "Ako to funguje",
    "intro": "Stručný sprievodca: ako je kurz zostavený, koľko sa učiť denne a na čo slúžia srdiečka.",
    "sections": [
      [
        "course",
        "🎓",
        "Kurz",
        "\n        <p>Každý jazyk má <b>36 tém</b> — celkovo <b>8000 slov</b>. Témy nasledujú úrovne <b>A0 → A1 → A2 → B1 → B2</b>: od pozdravov a čísel až po prácu, zdravie, spoločnosť a vedu.</p>\n        <ul>\n          <li><b>A0</b> — prvé kroky: približne 150 slov.</li>\n          <li><b>A1</b> — do 1500 slov: jednoduché frázy o sebe a bežnom živote.</li>\n          <li><b>A2</b> — 1500–2500 slov: každodenné situácie.</li>\n          <li><b>B1</b> — 2700–4500 slov: práca, štúdium, cestovanie.</li>\n          <li><b>B2</b> — 5000–8000 slov: <b>plynulá konverzácia</b> na akúkoľvek tému.</li>\n        </ul>\n        <p>Začnite tlačidlom <b>„Spustiť lekciu“</b> na domovskej obrazovke — aplikácia vyberie ďalšiu tému za vás. Celú trasu nájdete na stránke kurzu. Ďalšia téma sa odomkne, keď sa naučíte každé slovo z predchádzajúcej alebo úspešne zložíte skúšku.</p>"
      ],
      [
        "lesson",
        "📝",
        "Lekcia",
        "\n        <p>Každá lekcia začína <b>rozcvičkou</b>: slovami, v ktorých ste spravili chybu, a slovami, ktoré je potrebné zopakovať.</p>\n        <p>Potom nasleduje <b>8 nových slov</b> v skupinách po 4: najprv predstavenie (obrázok, slovo, výslovnosť), potom cvičenia — výber obrázka, spájanie dvojíc, rozpoznanie podľa sluchu, preklad, skladanie fráz, písanie slova.</p>\n        <p>Neviete si rady? V cvičení „Napíš slovo“ máte k dispozícii <b>💡 Nápovedu</b> (odkryje ďalšie písmeno) a <b>👁 Ukázať slovo</b>.</p>"
      ],
      [
        "review",
        "🔁",
        "Opakovanie",
        "\n        <p>Aplikácia využíva <b>rozložené opakovanie</b>: slovo sa vráti práve vtedy, keď ho začínate zabúdať — po 1 dni, potom po 6 dňoch a neskôr čoraz menej často. Ak urobíte chybu, vráti sa už zajtra.</p>\n        <p>Všetky chyby sa ukladajú do sekcie <b>„Opraviť chyby“</b>. Slovo z nej zmizne, keď naň odpoviete správne v dvoch lekciách za sebou.</p>\n        <p>Hviezdička <b>☆</b> pridá slovo do „Moje slová“, aby ste si ho mohli precvičiť samostatne.</p>"
      ],
      [
        "daily",
        "📅",
        "Koľko sa učiť denne",
        "\n        <div class=\"help-tip\">Odporúčame <b>10–15 nových slov denne</b> (1–2 lekcie) <b>+ každodenné opakovanie</b>.</div>\n        <ul>\n          <li><b>10 minút každý deň je lepších ako hodina raz za týždeň.</b> Pamäť si slová upevňuje počas spánku a krátke časté precvičovanie funguje lepšie ako zriedkavé dlhé učenie.</li>\n          <li><b>Nežeňte sa za číslami.</b> 15 slov denne je približne 450 slov mesačne. Ak si dáte 50, väčšinu z nich zabudnete.</li>\n          <li><b>Opakovanie je dôležitejšie ako nové slová.</b> Ak sa vám nakopia chyby, venujte deň sekcii „Opraviť chyby“ bez pridávania nových slov.</li>\n          <li><b>Denný cieľ je 30 odpovedí</b> — približne jedna lekcia aj s rozcvičkou.</li>\n          <li><b>Hovorte slová nahlas</b> a tvorte si z nich vlastné vety — zapamätáte si ich oveľa rýchlejšie.</li>\n        </ul>"
      ],
      [
        "hearts",
        "❤️",
        "Srdiečka, energia a nápovedy",
        "\n        <ul>\n          <li>Máte <b>25 srdiečok</b>, ktoré sa prenášajú medzi lekciami. Chyba alebo „👁 Ukázať slovo“ stojí <b>1 srdiečko</b>.</li>\n          <li><b>1 reklama = +1 srdiečko</b>, koľkokoľvek chcete — srdiečka môžu presiahnuť 25.</li>\n          <li>Po <b>16 hodinách</b> od prvého strateného srdiečka sa vráti <b>polovica (+13)</b>; po <b>24 hodinách</b> ich máte opäť <b>25</b>.</li>\n          <li><b>⚡ Energia:</b> každých <b>10 slov</b> stojí <b>5 energie</b>. <b>+5</b> každú hodinu až do <b>200</b>; po 24 hodinách je opäť na <b>200</b>.</li>\n          <li><b>1 reklama = +15 energie</b>, bez limitu.</li>\n          <li><b>💡 Nápovedy:</b> <b>5 denne</b>, obnovujú sa každý deň. Viac získate za reklamu alebo v obchode.</li>\n          <li>Skúšky úrovní nespotrebúvajú žiadne srdiečka ani energiu.</li>\n        </ul>"
      ],
      [
        "streak",
        "🔥",
        "Séria, XP a úrovne",
        "\n        <p>Vaša <b>séria</b> rastie každý deň, keď dokončíte aspoň jednu lekciu. Plamienok je spočiatku <b>bežný</b>, po týždni <b>modrý</b>, po 3 týždňoch <b>fialový</b> a <b>sivý</b>, keď vynecháte deň. Vynechali ste 1–2 dni? Obnovte sériu pomocou reklamy.</p>\n        <p><b>XP</b> získate len za správne odpovede a opakovanie: <b>+10 XP</b> za správnu odpoveď, <b>+5 XP</b> za každé 3 v rade, <b>+25 XP</b> za lekciu bez chýb. Lekcia novej témy prináša približne <b>250–350 XP</b>.</p>\n        <p>Rebríčky za <b>deň, týždeň a mesiac</b>. Vaša úroveň (A0 → B2) stúpa spolu s naučenými slovami.</p>"
      ],
      [
        "coins",
        "🪙",
        "Mince a úlohy",
        "\n        <ul>\n          <li><b>Mince 🪙</b> sú mena v aplikácii, ktorú využijete v obchode na srdiečka, energiu a nápovedy.</li>\n          <li><b>Denný cieľ</b> (30 odpovedí): <b>+10 🪙</b>. <b>Odporúčaný cieľ</b> (60): <b>+25 🪙 a +30 XP</b>. <b>Každá nová úroveň</b>: <b>+50 🪙</b>.</li>\n          <li><b>🎯 Úlohy</b> sa obnovujú každý pondelok: ľahká <b>+15 🪙</b>, stredná <b>+40 🪙</b>, ťažká <b>+100 🪙</b>.</li>\n          <li><b>📝 Týždenná opakovacia skúška</b>: 20 naučených slov; 80 % a viac prináša <b>+60 🪙 a +100 XP</b>.</li>\n        </ul>"
      ],
      [
        "badges",
        "🏷️",
        "Odznaky pod vlajkou",
        "\n        <ul>\n          <li><b>✅</b> — slová tohto jazyka, na ktoré ste už odpovedali správne.</li>\n          <li><b>📚</b> — celkový počet slov v kurze (8000).</li>\n          <li><b>🎓 B2 · 8k</b> — 8000 slov vám zabezpečí úroveň B2: plynulú konverzáciu. To je cieľ celého kurzu.</li>\n        </ul>"
      ],
      [
        "settings",
        "⚙️",
        "Nastavenia",
        "\n        <p>V <b>⚙️ Nastaveniach</b> si môžete zvoliť motív alebo vlastné farby, zmeniť veľkosť rozhrania a zapnúť či vypnúť pripomienky, ako napríklad „už dlho ste sa neučili“.</p>"
      ]
    ]
  },
  sv: {
    "title": "Hur det fungerar",
    "intro": "En snabbguide: hur kursen är uppbyggd, hur mycket du bör lära dig varje dag och vad hjärtan är till för.",
    "sections": [
      [
        "course",
        "🎓",
        "Kursen",
        "\n        <p>Varje språk har <b>36 ämnen</b> — <b>8000 ord</b> totalt. Ämnena följer nivåerna <b>A0 → A1 → A2 → B1 → B2</b>: från hälsningsfraser och siffror till arbete, hälsa, samhälle och vetenskap.</p>\n        <ul>\n          <li><b>A0</b> — första stegen: cirka 150 ord.</li>\n          <li><b>A1</b> — upp till 1500 ord: enkla fraser om dig själv och vardagslivet.</li>\n          <li><b>A2</b> — 1500–2500 ord: vardagliga situationer.</li>\n          <li><b>B1</b> — 2700–4500 ord: arbete, studier, resor.</li>\n          <li><b>B2</b> — 5000–8000 ord: <b>obehindrat samtal</b> om vilket ämne som helst.</li>\n        </ul>\n        <p>Börja med <b>”Starta lektion”</b> på startsidan — appen väljer nästa ämne åt dig. Hela studieplanen finns på kurssidan. Nästa ämne låses upp när varje ord i det föregående har lärts in eller dess prov har klarats.</p>"
      ],
      [
        "lesson",
        "📝",
        "En lektion",
        "\n        <p>Varje lektion börjar med en <b>uppvärmning</b>: ord du hade fel på och ord som är dags att repetera.</p>\n        <p>Därefter följer <b>8 nya ord</b> i grupper om 4: först en introduktion (bild, ord, uttal), sedan övningar — välj rätt bild, matcha par, känn igen på hörseln, översätt, bygg en fras, skriv ordet.</p>\n        <p>Har du kört fast? ”Skriv ordet” har <b>💡 Ledtråd</b> (avslöjar nästa bokstav) och <b>👁 Visa ord</b>.</p>"
      ],
      [
        "review",
        "🔁",
        "Repetition",
        "\n        <p>Appen använder <b>intervallbaserad repetition</b>: ett ord återkommer precis när du håller på att glömma det — efter 1 dag, sedan 6 dagar, därefter allt mer sällan. Svarar du fel kommer det tillbaka imorgon.</p>\n        <p>Alla fel hamnar under <b>”Rätta misstag”</b>. Ett ord tas bort därifrån när du svarat rätt under två lektioner i rad.</p>\n        <p>Stjärnan <b>☆</b> lägger till ett ord i ”Mina ord” så att du kan repetera det separat.</p>"
      ],
      [
        "daily",
        "📅",
        "Hur mycket du bör lära dig varje dag",
        "\n        <div class=\"help-tip\">Vi rekommenderar <b>10–15 nya ord om dagen</b> (1–2 lektioner) <b>+ repetition varje dag</b>.</div>\n        <ul>\n          <li><b>10 minuter varje dag slår en timme en gång i veckan.</b> Minnet befäster ord under sömnen, och korta regelbundna pass fungerar bättre än sällsynta långa.</li>\n          <li><b>Jaga inte siffror.</b> 15 ord om dagen blir ~450 ord i månaden. Tar du 50 glöms det mesta bort.</li>\n          <li><b>Repetition är viktigare än nya ord.</b> Om misstagen samlas på hög, ägna en dag åt ”Rätta misstag” utan några nya ord.</li>\n          <li><b>Det dagliga målet är 30 svar</b> — ungefär en lektion med tillhörande uppvärmning.</li>\n          <li><b>Säg orden högt</b> och bilda egna meningar med dem — då fastnar de snabbare.</li>\n        </ul> Anci"
      ],
      [
        "hearts",
        "❤️",
        "Hjärtan, energi och ledtrådar",
        "\n        <ul>\n          <li>Du har <b>25 hjärtan</b>, som sparas mellan lektionerna. Ett misstag eller ”👁 Visa ord” kostar <b>1 hjärta</b>.</li>\n          <li><b>1 annons = +1 hjärta</b>, så många du vill — hjärtan kan överstiga 25.</li>\n          <li><b>16 timmar</b> efter det första förlorade hjärtat återställs <b>hälften (+13)</b>; efter <b>24 timmar</b> har du <b>25</b> igen.</li>\n          <li><b>⚡ Energi:</b> varje <b>10 ord</b> kostar <b>5 energi</b>. <b>+5</b> varje timme upp till <b>200</b>; efter 24 timmar är den på <b>200</b> igen.</li>\n          <li><b>1 annons = +15 energi</b>, utan gräns.</li>\n          <li><b>💡 Ledtrådar:</b> <b>5 per dag</b>, förnyas dagligen. Fler via en annons eller i butiken.</li>\n          <li>Nivåprov kräver varken hjärtan eller energi.</li>\n        </ul>"
      ],
      [
        "streak",
        "🔥",
        "Svit, XP och nivåer",
        "\n        <p>Din <b>svit</b> växer för varje dag du slutför minst en lektion. Lågan är <b>normal</b> i början, <b>blå</b> efter en vecka, <b>lila</b> efter 3 veckor och <b>grå</b> när en dag har missats. Missade du 1–2 dagar? Återställ sviten med en annons.</p>\n        <p><b>XP</b> fås endast från rätta svar och repetitioner: <b>+10 XP</b> per rätt svar, <b>+5 XP</b> för var 3:e i rad, <b>+25 XP</b> för en lektion utan misstag. En lektion med ett nytt ämne ger cirka <b>250–350 XP</b>.</p>\n        <p>Topplistor för <b>dag, vecka och månad</b>. Din nivå (A0 → B2) ökar i takt med orden du lär dig.</p>"
      ],
      [
        "coins",
        "🪙",
        "Mynt och uppdrag",
        "\n        <ul>\n          <li><b>Mynt 🪙</b> är valutan i appen för att köpa hjärtan, energi och ledtrådar i butiken.</li>\n          <li><b>Dagligt mål</b> (30 svar): <b>+10 🪙</b>. <b>Rekommenderat mål</b> (60): <b>+25 🪙 och +30 XP</b>. <b>Varje ny nivå</b>: <b>+50 🪙</b>.</li>\n          <li><b>🎯 Uppdrag</b> förnyas varje måndag: enkelt <b>+15 🪙</b>, medelsvårt <b>+40 🪙</b>, svårt <b>+100 🪙</b>.</li>\n          <li><b>📝 Veckovis repetitionskontroll</b>: 20 inlärda ord; 80 % eller mer ger <b>+60 🪙 och +100 XP</b>.</li>\n        </ul>"
      ],
      [
        "badges",
        "🏷️",
        "Märken under flaggan",
        "\n        <ul>\n          <li><b>✅</b> — ord på detta språk som du redan har svarat rätt på.</li>\n          <li><b>📚</b> — totalt antal ord i kursen (8000).</li>\n          <li><b>🎓 B2 · 8k</b> — 8000 ord ger dig B2: obehindrat samtal. Det är målet för hela kursen.</li>\n        </ul>"
      ],
      [
        "settings",
        "⚙️",
        "Inställningar",
        "\n        <p>I <b>⚙️ Inställningar</b> kan du välja ett tema eller egna färger, ändra gränssnittets storlek och slå på eller av påminnelser som ”du har inte övat på ett tag”.</p>"
      ]
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
 },
 "cs": {
  "title": "O zemi",
  "intro": "Odkud jednotlivé jazyky kurzu pocházejí a kdy se poprvé objevily.",
  "en": "Západogermánský jazyk. Do Británie jej přinesli Anglové, Sasové a Jutové v 5. století; první texty pocházejí ze 7. století. Po roce 1066 přejal tisíce francouzských slov.",
  "de": "Západogermánský jazyk. První texty pocházejí z 8. století (stará horní němčina). Společný spisovný standard se zformoval po Lutherově překladu Bible v 16. století.",
  "nl": "Západogermánský jazyk, který se vyvinul z franských dialektů. Jeho nejznámější raná věta byla napsána kolem roku 1100.",
  "sv": "Severogermánský jazyk, vycházející ze staré severštiny z doby vikingů (8.–11. století). Samostatným jazykem je od 13. století.",
  "no": "Severogermánský jazyk, vycházející ze staré severštiny. Dnes má dva spisovné standardy: bokmål a nynorsk (19.–20. století).",
  "da": "Severogermánský jazyk, vycházející ze staré severštiny; oddělil se kolem 12. století. Jeho nejbližšími příbuznými jsou švédština a norština.",
  "fr": "Románský jazyk, vycházející z vulgární latiny v Galii. První písemnou památkou jsou Štrasburské přísahy z roku 842.",
  "es": "Románský jazyk, vycházející z vulgární latiny v Kastilii. Rané památky pocházejí z 10.–11. století; král Alfons X. kodifikoval standard ve 13. století.",
  "it": "Románský jazyk, založený na florentském (toskánském) dialektu. Spisovným jazykem je od dob Danta ve 14. století.",
  "pt": "Románský jazyk, vycházející z galicijsko-portugalského jazyka. První dokumenty pocházejí z 12.–13. století.",
  "ro": "Románský jazyk, vycházející z latiny římské provincie Dácie (2.–3. století). Nejstarším známým textem je Neacșův dopis z roku 1521; až do 19. století se psal cyrilicí.",
  "pl": "Západoslovanský jazyk. První psaná věta pochází z roku 1270. Píše se latinkou.",
  "cs": "Západoslovanský jazyk. Zapisuje se od 13. století; Jan Hus v 15. století zavedl diakritická znaménka nad písmeny (háčky).",
  "sk": "Západoslovanský jazyk, velmi blízký češtině. Spisovný standard vytvořil Ľudovít Štúr v roce 1843.",
  "uk": "Východoslovanský jazyk, vycházející ze staré východní slovanštiny Kyjevské Rusi. Moderní spisovný jazyk se datuje od Kotljarevského Eneidy (1798).",
  "ru": "Východoslovanský jazyk, vycházející ze staré východní slovanštiny. Cyrilici používá od 10. století; moderní standard se zformoval v 18.–19. století.",
  "bg": "Jihoslovanský jazyk. Zde v 9. století žáci Cyrila a Metoděje vytvořili slovanské písemnictví a následně cyrilici.",
  "hr": "Jihoslovanský jazyk. Rané texty byly psány hlaholicí (Bašská deska, kolem roku 1100); dnes používá latinku.",
  "sr": "Jihoslovanský jazyk. Písemně doložen od 12. století; v 19. století stanovil Vuk Karadžić pravidlo „piš, jak mluvíš“. Používá cyrilici i latinku.",
  "el": "Samostatná větev indoevropské rodiny. Písemné památky pocházejí ze 14.–13. století př. n. l.; abeceda se používá od 8. století př. n. l. Jeden z nejstarších psaných jazyků.",
  "fi": "Ugrofinský jazyk (uraská rodina). Písemně doložen od 16. století; první kniha Mikaela Agricoly vyšla v roce 1543. Nejbližším příbuzným je estonština.",
  "hu": "Ugrofinský jazyk. Maďaři dorazili k Dunaji kolem roku 896; první souvislý text, Pohřební řeč, pochází z doby kolem roku 1195."
 },
 "da": {
  "title": "Om landet",
  "intro": "Hvor hvert af kursets sprog stammer fra, og hvornår det opstod.",
  "en": "Vestgermansk. Bragt til Storbritannien af anglerne, sakserne og jyderne i det 5. århundrede; de første tekster er fra det 7. århundrede. Efter 1066 optog det tusindvis af franske ord.",
  "de": "Vestgermansk. De første tekster er fra det 8. århundrede (oldhøjtysk). En fælles skriftlig standard opstod efter Luthers bibeloversættelse i det 16. århundrede.",
  "nl": "Vestgermansk, udviklet af frankiske dialekter. Dets mest kendte tidlige sætning blev skrevet omkring 1100.",
  "sv": "Nordgermansk, fra vikingetidens oldnordisk (8.–11. århundrede). Et selvstændigt sprog siden det 13. århundrede.",
  "no": "Nordgermansk, fra oldnordisk. I dag har det to officielle skriftsprog, bokmål og nynorsk (19.–20. århundrede).",
  "da": "Nordgermansk, fra oldnordisk; det udskilte sig omkring det 12. århundrede. Dets nærmeste slægtninge er svensk og norsk.",
  "fr": "Romansk, fra vulgærlatin i Gallien. Det første skriftlige vidnesbyrd er Strasbourg-edene fra 842.",
  "es": "Romansk, fra Kastiliens vulgærlatin. Tidlige vidnesbyrd fra det 10.–11. århundrede; kong Alfons 10. fastlagde standarden i det 13. århundrede.",
  "it": "Romansk, baseret på den florentinske (toscanske) dialekt. Et litterært sprog siden Dante i det 14. århundrede.",
  "pt": "Romansk, af galicisk-portugisisk oprindelse. Første dokumenter fra det 12.–13. århundrede.",
  "ro": "Romansk, fra latin i den romerske provins Dacien (2.–3. århundrede). Den ældst kendte tekst er Neacșus brev fra 1521; det blev skrevet med kyrillisk frem til det 19. århundrede.",
  "pl": "Vestslavisk. Den første nedskrevne sætning stammer fra 1270. Skrevet med det latinske alfabet.",
  "cs": "Vestslavisk. Brugt som skriftsprog siden det 13. århundrede; Jan Hus indførte tegnene over bogstaverne (háček) i det 15. århundrede.",
  "sk": "Vestslavisk, meget tæt på tjekkisk. Ľudovít Štúr skabte den litterære standard i 1843.",
  "uk": "Østslavisk, fra det oldøstslaviske i Kyjiv-Rus. Det moderne litterære sprog dateres fra Kotljarevskijs Eneida (1798).",
  "ru": "Østslavisk, fra oldøstslavisk. Kyrillisk siden det 10. århundrede; den moderne standard opstod i det 18.–19. århundrede.",
  "bg": "Sydslavisk. Her skabte disciplene af Kyrillos og Methodios i det 9. århundrede den slaviske skrift og derefter det kyrilliske alfabet.",
  "hr": "Sydslavisk. Tidlige tekster blev skrevet med glagolitiske bogstaver (Baška-tavlen, omkring 1100); i dag bruger det det latinske alfabet.",
  "sr": "Sydslavisk. Skriftsprog siden det 12. århundrede; i det 19. århundrede formulerede Vuk Karadžić reglen “skriv, som du taler”. Bruger både kyrillisk og latin.",
  "el": "En selvstændig indoeuropæisk gren. Vidnesbyrd fra det 14.–13. århundrede f.Kr.; alfabetet siden det 8. århundrede f.Kr. Et af de ældste skriftsprog.",
  "fi": "Finsk-ugrisk (uralsk familie). Skriftsprog siden det 16. århundrede; Mikael Agricolas første bog udkom i 1543. Dets nærmeste slægtning er estisk.",
  "hu": "Finsk-ugrisk. Ungarerne nåede Donau omkring 896; den første sammenhængende tekst, Ligprædikenen, stammer fra omkring 1195."
 },
 "de": {
  "title": "Über das Land",
  "intro": "Woher die Kurssprachen stammen und wann sie entstanden sind.",
  "en": "Westgermanisch. Im 5. Jahrhundert von Angeln, Sachsen und Jüten nach Britannien gebracht; erste Texte aus dem 7. Jahrhundert. Nach 1066 nahm es Tausende französischer Wörter auf.",
  "de": "Westgermanisch. Erste Texte aus dem 8. Jahrhundert (Althochdeutsch). Eine gemeinsame Schriftsprache bildete sich nach Luthers Bibelübersetzung im 16. Jahrhundert heraus.",
  "nl": "Westgermanisch, hervorgegangen aus fränkischen Dialekten. Der bekannteste frühe Satz wurde um 1100 niedergeschrieben.",
  "sv": "Nordgermanisch, entstanden aus dem Altnordischen der Wikingerzeit (8.–11. Jahrhundert). Eine eigenständige Sprache seit dem 13. Jahrhundert.",
  "no": "Nordgermanisch, aus dem Altnordischen. Heute hat es zwei Schriftstandards: Bokmål und Nynorsk (19.–20. Jahrhundert).",
  "da": "Nordgermanisch, aus dem Altnordischen; spaltete sich um das 12. Jahrhundert ab. Die engsten Verwandten sind Schwedisch und Norwegisch.",
  "fr": "Romanisch, aus dem Vulgärlatein Galliens. Das erste Schriftdenkmal sind die Straßburger Eide aus dem Jahr 842.",
  "es": "Romanisch, aus dem Vulgärlatein Kastiliens. Frühe Zeugnisse aus dem 10.–11. Jahrhundert; König Alfons X. legte im 13. Jahrhundert den Standard fest.",
  "it": "Romanisch, basierend auf dem florentinischen (toskanischen) Dialekt. Literatursprache seit Dante im 14. Jahrhundert.",
  "pt": "Romanisch, aus dem Galicisch-Portugiesischen. Erste Dokumente aus dem 12.–13. Jahrhundert.",
  "ro": "Romanisch, aus dem Latein der römischen Provinz Dakien (2.–3. Jahrhundert). Der älteste bekannte Text ist der Brief von Neacșu aus dem Jahr 1521; bis ins 19. Jahrhundert wurde es in kyrillischer Schrift geschrieben.",
  "pl": "Westslawisch. Der erste überlieferte Satz stammt aus dem Jahr 1270. Geschrieben im lateinischen Alphabet.",
  "cs": "Westslawisch. Schriftlich überliefert seit dem 13. Jahrhundert; Jan Hus führte im 15. Jahrhundert die diakritischen Zeichen (Háček) ein.",
  "sk": "Westslawisch, sehr eng mit dem Tschechischen verwandt. Ľudovít Štúr schuf 1843 den schriftsprachlichen Standard.",
  "uk": "Ostslawisch, aus dem Altostslawischen der Kiewer Rus. Die moderne Schriftsprache datiert auf Kotljarewskys „Enejida“ (1798) zurück.",
  "ru": "Ostslawisch, aus dem Altostslawischen. Kyrillisch seit dem 10. Jahrhundert; die moderne Schriftsprache formierte sich im 18.–19. Jahrhundert.",
  "bg": "Südslawisch. Hier schufen im 9. Jahrhundert die Schüler von Kyrill und Method die slawische Schrift und anschließend das kyrillische Alphabet.",
  "hr": "Südslawisch. Frühe Texte wurden in glagolitischer Schrift verfasst (die Tafel von Baška, um 1100); heute nutzt es das lateinische Alphabet.",
  "sr": "Südslawisch. Schriftlich belegt seit dem 12. Jahrhundert; im 19. Jahrhundert prägte Vuk Karadžić die Regel „schreibe, wie du sprichst“. Verwendet Kyrillisch und Lateinisch.",
  "el": "Eigener indogermanischer Zweig. Zeugnisse aus dem 14.–13. Jahrhundert v. Chr.; das Alphabet seit dem 8. Jahrhundert v. Chr. Eine der ältesten Schriftsprachen.",
  "fi": "Finno-ugrisch (uralische Sprachfamilie). Schriftsprache seit dem 16. Jahrhundert; Mikael Agricolas erstes Buch erschien 1543. Am engsten mit dem Estnischen verwandt.",
  "hu": "Finno-ugrisch. Die Ungarn erreichten die Donau um 896; der erste zusammenhängende Text, die Grabrede, stammt aus der Zeit um 1195."
 },
 "es": {
  "title": "Sobre el país",
  "intro": "De dónde procede el idioma de cada curso y cuándo apareció.",
  "en": "Germánico occidental. Llevado a Gran Bretaña por los ángulos, sajones y jutos en el siglo V; primeros textos del siglo VII. Tras 1066 incorporó miles de palabras en francés.",
  "de": "Germánico occidental. Primeros textos del siglo VIII (alto alemán antiguo). Se formó un estándar escrito común tras la traducción de la Biblia de Lutero en el siglo XVI.",
  "nl": "Germánico occidental, derivado de los dialectos francos. Su frase más famosa se escribió hacia el año 1100.",
  "sv": "Germánico septentrional, del nórdico antiguo de la Era Vikinga (siglos VIII-XI). Un idioma independiente desde el siglo XIII.",
  "no": "Germánico septentrional, del nórdico antiguo. Hoy en día tiene dos estándares escritos: bokmål y nynorsk (siglos XIX-XX).",
  "da": "Germánico septentrional, del nórdico antiguo; se separó hacia el siglo XII. Sus parientes más cercanos son el sueco y el noruego.",
  "fr": "Romance, del latín vulgar de la Galia. El primer testimonio escrito son los Juramentos de Estrasburgo, de 842.",
  "es": "Romance, del latín vulgar de Castilla. Primeros registros de los siglos X-XI; el rey Alfonso X fijó el estándar en el siglo XIII.",
  "it": "Romance, basado en el dialecto florentino (toscano). Lengua literaria desde Dante, siglo XIV.",
  "pt": "Romance, del galaicoportugués. Primeros documentos de los siglos XII-XIII.",
  "ro": "Romance, del latín de la provincia romana de Dacia (siglos II-III). El texto más antiguo que se conoce es la carta de Neacșu, de 1521; se escribió en alfabeto cirílico hasta el siglo XIX.",
  "pl": "Eslavo occidental. La primera frase escrita data de 1270. Se escribe con el alfabeto latino.",
  "cs": "Eslavo occidental. Se escribe desde el siglo XIII; Jan Hus introdujo los signos diacríticos sobre las letras (háček) en el siglo XV.",
  "sk": "Eslavo occidental, muy cercano al checo. Ľudovít Štúr creó el estándar literario en 1843.",
  "uk": "Eslavo oriental, del antiguo eslavo oriental de la Rus de Kiev. El idioma literario moderno data de la Eneida de Kotliarevsky (1798).",
  "ru": "Eslavo oriental, del antiguo eslavo oriental. Cirílico desde el siglo X; el estándar moderno se formó en los siglos XVIII-XIX.",
  "bg": "Eslavo meridional. Aquí, en el siglo IX, los discípulos de Cirilo y Metodio crearon la escritura eslava y, posteriormente, el alfabeto cirílico.",
  "hr": "Eslavo meridional. Los primeros textos se escribieron en glagolítico (la tabla de Baška, hacia 1100); hoy utiliza el alfabeto latino.",
  "sr": "Eslavo meridional. Se escribe desde el siglo XII; en el siglo XIX Vuk Karadžić estableció la regla “escribe como hablas”. Utiliza el alfabeto cirílico y el latino.",
  "el": "Rama propia dentro del indoeuropeo. Registros de los siglos XIV-XIII a. C.; alfabeto desde el siglo VIII a. C. Una de las lenguas escritas más antiguas.",
  "fi": "Finougrio (familia urálica). Se escribe desde el siglo XVI; el primer libro de Mikael Agricola apareció en 1543. Su pariente más cercano es el estonio.",
  "hu": "Finougrio. Los húngaros llegaron al Danubio hacia el año 896; el primer texto continuado, el Discurso fúnebre, data de alrededor de 1195."
 },
 "fr": {
  "title": "À propos du pays",
  "intro": "D'où vient chaque langue du cours et quand elle est apparue.",
  "en": "Germanique occidental. Apporté en Grande-Bretagne par les Angles, les Saxons et les Jutes au Ve siècle ; premiers textes du VIIe siècle. Après 1066, il a intégré des milliers de mots français.",
  "de": "Germanique occidental. Premiers textes du VIIIe siècle (vieux haut-allemand). Une norme écrite commune s'est formée après la traduction de la Bible par Luther au XVIe siècle.",
  "nl": "Germanique occidental, issu des dialectes franciques. Sa phrase ancienne la plus connue a été écrite vers 1100.",
  "sv": "Germanique septentrional, issu du vieux norrois de l'âge viking (VIIIe–XIe siècles). Une langue distincte depuis le XIIIe siècle.",
  "no": "Germanique septentrional, issu du vieux norrois. Aujourd'hui, il possède deux normes écrites, le bokmål et le nynorsk (XIXe–XXe siècles).",
  "da": "Germanique septentrional, issu du vieux norrois ; il s'en est séparé vers le XIIe siècle. Ses parents les plus proches sont le suédois et le norvégien.",
  "fr": "Roman, issu du latin vulgaire de la Gaule. Le premier document écrit est les Serments de Strasbourg, en 842.",
  "es": "Roman, issu du latin vulgaire de Castille. Premiers écrits aux X-XIe siècles ; le roi Alphonse X a fixé la norme au XIIIe siècle.",
  "it": "Roman, basé sur le dialecte florentin (toscan). Langue littéraire depuis Dante, au XIVe siècle.",
  "pt": "Roman, issu du galaïco-portugais. Premiers documents des XIIe–XIIIe siècles.",
  "ro": "Roman, issu du latin de la province romaine de Dacie (IIe–IIIe siècles). Le plus ancien texte connu est la lettre de Neacșu (1521) ; il s'écrivait en cyrillique jusqu'au XIXe siècle.",
  "pl": "Slave occidental. La première phrase écrite date de 1270. Écrit avec l'alphabet latin.",
  "cs": "Slave occidental. Écrit depuis le XIIIe siècle ; Jan Hus a introduit les signes diacritiques sur les lettres (háček) au XVe siècle.",
  "sk": "Slave occidental, très proche du tchèque. Ľudovít Štúr a créé la norme littéraire en 1843.",
  "uk": "Slave oriental, issu du vieux slave oriental de la Rus' de Kiev. La langue littéraire moderne date de l'Enéide de Kotliarevsky (1798).",
  "ru": "Slave oriental, issu du vieux slave oriental. Écrit en cyrillique depuis le Xe siècle ; la norme moderne s'est formée aux XVIIIe–XIXe siècles.",
  "bg": "Slave méridional. C'est ici qu'au IXe siècle, les disciples de Cyrille et Méthode ont créé l'écriture slave puis l'alphabet cyrillique.",
  "hr": "Slave méridional. Les premiers textes ont été écrits en glagolitique (la stèle de Baška, vers 1100) ; aujourd'hui, il utilise l'alphabet latin.",
  "sr": "Slave méridional. Écrit depuis le XIIe siècle ; au XIXe siècle, Vuk Karadžić a instauré la règle « écris comme tu parles ». Utilise le cyrillique et le latin.",
  "el": "Sa propre branche indo-européenne. Écrits des XIVe–XIIIe siècles av. J.-C. ; l'alphabet depuis le VIIIe siècle av. J.-C. L'une des plus anciennes langues écrites.",
  "fi": "Finno-ougrien (famille ouralienne). Écrit depuis le XVIe siècle ; le premier livre de Mikael Agricola est paru en 1543. Son parent le plus proche est l'estonien.",
  "hu": "Finno-ougrien. Les Hongrois ont atteint le Danube vers 896 ; le premier texte suivi, le Sermons d'adieu, date d'environ 1195."
 },
 "nl": {
  "title": "Over het land",
  "intro": "Waar elke cursustaal vandaan komt en wanneer deze ontstond.",
  "en": "West-Germaans. In de 5e eeuw naar Groot-Brittannië gebracht door de Angelen, Saksen en Juten; eerste teksten uit de 7e eeuw. Na 1066 nam het duizenden Franse woorden op.",
  "de": "West-Germaans. Eerste teksten uit de 8e eeuw (Oudhoogduits). Een gemeenschappelijke geschreven standaard ontstond na Luthers bijbelvertaling in de 16e eeuw.",
  "nl": "West-Germaans, ontstaan uit Frankische dialecten. De bekendste vroege zin werd rond 1100 geschreven.",
  "sv": "Noord-Germaans, ontstaan uit het Oudnoors van de Vikingtijd (8e–11e eeuw). Een zelfstandige taal sinds de 13e eeuw.",
  "no": "Noord-Germaans, ontstaan uit het Oudnoors. Heeft vandaag de dag twee geschreven standaarden, Bokmål en Nynorsk (19e–20e eeuw).",
  "da": "Noord-Germaans, ontstaan uit het Oudnoors; splitste zich af rond de 12e eeuw. De nauwste verwanten zijn het Zweeds en het Noors.",
  "fr": "Romaans, ontstaan uit het Vulgair Latijn van Gallië. De oudste schriftelijke vermelding zijn de Eden van Straatsburg, 842.",
  "es": "Romaans, ontstaan uit het Vulgair Latijn van Castilië. Vroege teksten uit de 10e–11e eeuw; koning Alfons X legde de standaard vast in de 13e eeuw.",
  "it": "Romaans, gebaseerd op het Florentijnse (Toscaanse) dialect. Een literaire taal sinds Dante, 14e eeuw.",
  "pt": "Romaans, ontstaan uit het Galicisch-Portugees. Eerste documenten uit de 12e–13e eeuw.",
  "ro": "Romaans, ontstaan uit het Latijn van de Romeinse provincie Dacië (2e–3e eeuw). De oudst bekende tekst is de brief van Neacșu, 1521; tot in de 19e eeuw geschreven in het cyrillisch.",
  "pl": "West-Slavisch. De eerste geschreven zin dateert uit 1270. Geschreven in het Latijnse alfabet.",
  "cs": "West-Slavisch. Geschreven sinds de 13e eeuw; Jan Hus introduceerde de tekens boven letters (háček) in de 15e eeuw.",
  "sk": "West-Slavisch, zeer nauw verwant aan het Tsjechisch. Ľudovít Štúr creëerde de literaire standaard in 1843.",
  "uk": "Oost-Slavisch, ontstaan uit het Oud-Oost-Slavisch van het Kievse Rijk. De moderne literaire taal dateert van Kotliarevsky’s Eneida (1798).",
  "ru": "Oost-Slavisch, ontstaan uit het Oud-Oost-Slavisch. Cyrillisch sinds de 10e eeuw; de moderne standaard werd gevormd in de 18e–19e eeuw.",
  "bg": "Zuid-Slavisch. Hier creëerden de volgelingen van Cyrillus en Methodius in de 9e eeuw het Slavische schrift en vervolgens het cyrillische alfabet.",
  "hr": "Zuid-Slavisch. Vroege teksten werden geschreven in het glagolitisch (de Baška-tablet, rond 1100); tegenwoordig gebruikt het het Latijnse alfabet.",
  "sr": "Zuid-Slavisch. Geschreven sinds de 12e eeuw; in de 19e eeuw stelde Vuk Karadžić de regel vast: “schrijf zoals je spreekt”. Gebruikt cyrillisch en Latijns schrift.",
  "el": "Een eigen Indo-Europese tak. Documenten uit de 14e–13e eeuw v.Chr.; het alfabet sinds de 8e eeuw v.Chr. Een van de oudste geschreven talen.",
  "fi": "Finno-Oegrisch (Oeraalse taalfamilie). Geschreven sinds de 16e eeuw; Mikael Agricola’s eerste boek verscheen in 1543. De nauwste verwant is het Ests.",
  "hu": "Finno-Oegrisch. De Hongaren bereikten de Donau rond 896; de eerste samenhangende tekst, de Lijkrede, dateert van ongeveer 1195."
 },
 "no": {
  "title": "Om landet",
  "intro": "Hvor hvert kursspråk kommer fra, og når det oppsto.",
  "en": "Vestgermansk. Brakt til Storbritannia av anglere, saksere og jyder på 400-tallet; de første tekstene er fra 600-tallet. Etter 1066 tok det opp i seg tusenvis av franske ord.",
  "de": "Vestgermansk. De første tekstene stammer fra 700-tallet (gammelhøytysk). En felles skriftstandard ble formet etter Luthers bibeloversettelse på 1500-tallet.",
  "nl": "Vestgermansk, utviklet fra frankiske dialekter. Den mest kjente tidlige setningen ble skrevet rundt år 1100.",
  "sv": "Nordgermansk, fra vikingtidens norrøne språk (700–1000-tallet). Et eget språk siden 1200-tallet.",
  "no": "Nordgermansk, fra norrønt. Har i dag to offisielle skriftmål, bokmål og nynorsk (1800–1900-tallet).",
  "da": "Nordgermansk, fra norrønt; det skilte lag rundt 1100-tallet. De nærmeste slektningene er svensk og norsk.",
  "fr": "Romansk, fra folkemålslatinen i Gallia. Det første skriftlige vitnesbyrdet er Strasbourg-edene fra 842.",
  "es": "Romansk, fra folkemålslatinen i Castilla. Tidlige kilder fra 900–1000-tallet; kong Alfonso X fastsatte standarden på 1200-tallet.",
  "it": "Romansk, basert på den florentinske (toskanske) dialekten. Et litteraturspråk siden Dante på 1300-tallet.",
  "pt": "Romansk, fra galisisk-portugisisk. De første dokumentene er fra 1100–1200-tallet.",
  "ro": "Romansk, fra latinen i den romerske provinsen Dacia (100–200-tallet). Den eldste kjente teksten er Neacșus brev fra 1521; det ble skrevet med det kyrilliske alfabetet frem til 1800-tallet.",
  "pl": "Vestslavisk. Den første skrevne setningen stammer fra 1270. Skrives med det latinske alfabetet.",
  "cs": "Vestslavisk. Skriftspråk siden 1200-tallet; Jan Hus innførte diakritiske tegn over bokstavene (háček) på 1400-tallet.",
  "sk": "Vestslavisk, svært nært tsjekkisk. Ľudovít Štúr skapte den litterære standarden i 1843.",
  "uk": "Østslavisk, fra det gammeløstslaviske språket i Kievriket. Det moderne litteraturspråket regnes fra Kotljarevskyjs Eneida (1798).",
  "ru": "Østslavisk, fra gammeløstslavisk. Kyrillisk skrift siden 900-tallet; den moderne standarden tok form på 1700–1800-tallet.",
  "bg": "Sørslavisk. Her skapte disiplene til Kyrill og Metodios den slaviske skriften og deretter det kyrilliske alfabetet på 800-tallet.",
  "hr": "Sørslavisk. Tidlige tekster ble skrevet med glagolittisk skrift (Baška-tavlen, rundt 1100); i dag bruker det det latinske alfabetet.",
  "sr": "Sørslavisk. Skriftspråk siden 1100-tallet; på 1800-tallet innførte Vuk Karadžić regelen «skriv slik du snakker». Bruker både det kyrilliske og det latinske alfabetet.",
  "el": "En egen indoeuropeisk gren. Skriftlige kilder fra 1300–1200-tallet f.Kr.; alfabetet har vært i bruk siden 700-tallet f.Kr. Et av verdens eldste skriftspråk.",
  "fi": "Finsk-ugrisk (uralsk språkfamilie). Skriftspråk siden 1500-tallet; Mikael Agricolas første bok kom ut i 1543. Nærmeste slektning er estisk.",
  "hu": "Finsk-ugrisk. Magyarene nådde Donau rundt 896; den første sammenhengende teksten, Likprekenen, er fra ca. 1195."
 },
 "sk": {
  "title": "O krajine",
  "intro": "Odkiaľ pochádza každý jazyk v kurze a kedy vznikol.",
  "en": "Západogermánsky jazyk. Do Británie ho priniesli Anglovia, Sasi a Jutovia v 5. storočí; prvé texty pochádzajú zo 7. storočia. Po roku 1066 prebral tisíce francúzskych slov.",
  "de": "Západogermánsky jazyk. Prvé texty pochádzajú z 8. storočia (stará horná nemčina). Spoločný spisovný štandard sa sformoval po Lutherovom preklade Biblie v 16. storočí.",
  "nl": "Západogermánsky jazyk, ktorý sa vyvinul z franských dialektov. Jeho najznámejšia raná veta bola napísaná okolo roku 1100.",
  "sv": "Severogermánsky jazyk, pochádza zo starej severčiny z obdobia vikingov (8.–11. storočie). Samostatným jazykom je od 13. storočia.",
  "no": "Severogermánsky jazyk, pochádza zo starej severčiny. Dnes má dva spisovné štandardy: bokmål a nynorsk (19.–20. storočie).",
  "da": "Severogermánsky jazyk, pochádza zo starej severčiny; oddelil sa približne v 12. storočí. Jeho najbližšími príbuznými sú švédčina a nórčina.",
  "fr": "Románsky jazyk, pochádza z vulgárnej latinčiny v Galii. Prvou písomnou pamiatkou sú Štrasburské prísahy z roku 842.",
  "es": "Románsky jazyk, pochádza z vulgárnej latinčiny v Kastílii. Prvé záznamy pochádzajú z 10.–11. storočia; kráľ Alfonz X. zaviedol štandard v 13. storočí.",
  "it": "Románsky jazyk založený na florentskom (toskánskom) dialekte. Spisovným jazykom je od čias Danteho v 14. storočí.",
  "pt": "Románsky jazyk, vyvinul sa z galícijsko-portugalčiny. Prvé písomné pamiatky pochádzajú z 12.–13. storočia.",
  "ro": "Románsky jazyk, pochádza z latinčiny rímskej provincie Dácia (2.–3. storočie). Najstarším známym textom je Neacșuov list z roku 1521; až do 19. storočia sa písal cyrilikou.",
  "pl": "Západoslovanský jazyk. Prvá zaznamenaná veta pochádza z roku 1270. Píše sa latinkou.",
  "cs": "Západoslovanský jazyk. Píše sa ním od 13. storočia; diakritické znamienka (háčiky) zaviedol Ján Hus v 15. storočí.",
  "sk": "Západoslovanský jazyk, veľmi blízky češtine. Spisovný jazyk kodifikoval Ľudovít Štúr v roku 1843.",
  "uk": "Východoslovanský jazyk, pochádza zo starej východnej slovančiny Kyjevskej Rusi. Moderný spisovný jazyk sa datuje od Kotľarevského Eneidy (1798).",
  "ru": "Východoslovanský jazyk, pochádza zo starej východnej slovančiny. Cyrilikou sa píše od 10. storočia; moderný štandard sa sformoval v 18.–19. storočí.",
  "bg": "Juhoslovanský jazyk. Práve tu v 9. storočí učeníci Cyrila a Metoda vytvorili slovanské písomníctvo a následne cyriliku.",
  "hr": "Juhoslovanský jazyk. Rané texty boli písané hlaholikou (Bašská tabuľa, okolo roku 1100); dnes používa latinku.",
  "sr": "Juhoslovanský jazyk. Písomné pamiatky pochádzajú z 12. storočia; v 19. storočí zaviedol Vuk Karadžić pravidlo „píš, ako počuješ“. Používa cyriliku aj latinku.",
  "el": "Tvorí samostatnú vetvu indoeurópskych jazykov. Pamiatky pochádzajú zo 14.–13. storočia pred Kr.; abeceda sa používa od 8. storočia pred Kr. Jeden z najstarších písomných jazykov.",
  "fi": "Ugrofínsky jazyk (urálska rodina). Píše sa ním od 16. storočia; prvá kniha Mikaela Agricolu vyšla v roku 1543. Jeho najbližšou príbuznou je estónčina.",
  "hu": "Ugrofínsky jazyk. Maďari dorazili k Dunaju okolo roku 896; prvý súvislý text, Pohrebná reč, pochádza z obdobia okolo roku 1195."
 },
 "sv": {
  "title": "Om landet",
  "intro": "Varje kursspråks ursprung och när det uppstod.",
  "en": "Västgermanskt. Fördes till Storbritannien av angler, saxare och jutar på 400-talet; första texterna från 600-talet. Efter 1066 tog det upp tusentals franska ord.",
  "de": "Västgermanskt. Första texterna från 700-talet (fornhögtyska). En gemensam skriftlig standard formades efter Luthers bibelöversättning på 1500-talet.",
  "nl": "Västgermanskt, sprunget ur frankiska dialekter. Dess mest kända tidiga mening skrevs runt 1100.",
  "sv": "Nordgermanskt, från vikingatidens fornnordiska (700–1000-talet). Ett eget språk sedan 1200-talet.",
  "no": "Nordgermanskt, från fornnordiska. Idag har det två skriftspråk, bokmål och nynorska (1800–1900-talet).",
  "da": "Nordgermanskt, från fornnordiska; det bröt sig loss runt 1100-talet. Dess närmaste släktingar är svenska och norska.",
  "fr": "Romanskt, från Galliens vulgärlatin. Det första skriftliga vittnesbördet är Strasbourgederna från 842.",
  "es": "Romanskt, från Kastiliens vulgärlatin. Tidiga källor från 900–1000-talet; kung Alfons X satte standarden på 1200-talet.",
  "it": "Romanskt, baserat på den florentinska (toskanska) dialekten. Ett litterärt språk sedan Dante på 1300-talet.",
  "pt": "Romanskt, från galicisk-portugisiska. Första dokumenten från 1100–1200-talet.",
  "ro": "Romanskt, från latinet i den romerska provinsen Dakien (100–200-talet). Den äldsta kända texten är Neacșus brev från 1521; det skrevs med kyrilliska fram till 1800-talet.",
  "pl": "Västslaviskt. Den första skrivna meningen härstammar från 1270. Skrivs med det latinska alfabetet.",
  "cs": "Västslaviskt. Skrivet sedan 1200-talet; Jan Hus introducerade tecknen ovanför bokstäverna (háček) på 1400-talet.",
  "sk": "Västslaviskt, mycket nära tjeckiskan. Ľudovít Štúr skapade den litterära standarden 1843.",
  "uk": "Östslaviskt, från Kievrikets fornöstslaviska. Det moderna litterära språket härstammar från Kotljarevskyjs Eneida (1798).",
  "ru": "Östslaviskt, från fornöstslaviska. Kyrilliska sedan 900-talet; den moderna standarden formades under 1700–1800-talet.",
  "bg": "Sydslaviskt. Här skapade Kyrillos och Methodios lärjungar på 800-talet den slaviska skriften och därefter det kyrilliska alfabetet.",
  "hr": "Sydslaviskt. Tidiga texter skrevs med glagolitisk skrift (Baškatavlan, runt 1100); idag används det latinska alfabetet.",
  "sr": "Sydslaviskt. Skrivet sedan 1100-talet; på 1800-talet etablerade Vuk Karadžić regeln ”skriv som du talar”. Använder kyrilliska och latinska alfabetet.",
  "el": "En egen indoeuropeisk gren. Källor från 1300–1200-talet f.Kr.; alfabetet sedan 700-talet f.Kr. Ett av de äldsta skriftspråken.",
  "fi": "Finsk-ugriskt (uralisk språkfamilj). Skrivet sedan 1500-talet; Mikael Agricolas första bok utkom 1543. Dess närmaste släkting är estniska.",
  "hu": "Finsk-ugriskt. Ungrarna nådde Donau omkring 896; den första sammanhängande texten, Begravningstalet, härstammar från cirka 1195."
 }
};;

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
