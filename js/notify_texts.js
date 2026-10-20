window.App = window.App || {};

// Reminder texts with several variants per situation, so the messages don't
// repeat. [title, body]; {{n}} = days, {{lang}} = the language being learned.
// Interface languages without an entry here use the single notify_* strings
// from i18n.js.
App.NOTIFY_TEXTS = {
  ru: {
    away: [
      ['Волк воет на луну 🌕', '{{n}} дн. без уроков — даже луна спрашивает, где вы. Вернитесь хоть на 5 минут!'],
      ['Слова разбегаются 🏃', 'Вас нет уже {{n}} дн. Слова из курса «{{lang}}» пакуют чемоданы — ловите их!'],
      ['Тук-тук! 🚪', '— Кто там? — Ваш курс «{{lang}}». Скучает уже {{n}} дн. Откроете?'],
      ['Мозг просит зарядку 🧠', '{{n}} дн. без тренировки. Одна короткая разминка — и снова в форме.'],
      ['Волк сидит у окна 🐺', 'Ждёт вас {{n}} дн. и делает вид, что не ждёт. Порадуйте его уроком!'],
      ['Разыскивается! 🔎', 'Ученик, пропавший {{n}} дн. назад. Награда — опыт и очень довольный волк.'],
      ['Сердечки скучают ❤️', 'Полный запас сердечек, а потратить негде уже {{n}} дн. Исправим?']
    ],
    streak: [
      ['Огонь гаснет! 🔥', 'Серия {{n}} дн. сгорит в полночь. Подкиньте дровишек — пройдите один урок.'],
      ['Держитесь, уже {{n}}-й день! 💪', 'Столько дней подряд — жалко терять. Пять минут, и серия спасена.'],
      ['Тик-так ⏰', 'До полуночи совсем немного, а серия {{n}} дн. ещё не продлена.'],
      ['Волк нервно грызёт карандаш ✏️', 'Ваша серия {{n}} дн. под угрозой. Он верит, что вы успеете!'],
      ['Спасательная операция 🚑', 'Серии {{n}} дн. нужна помощь. Всего один урок — и она в безопасности.']
    ],
    today: [
      ['Минутка для языка? ☕', 'Пока заваривается чай, можно выучить пару слов. {{lang}} ждёт!'],
      ['Ежедневная доза слов 💊', 'Сегодня ещё ни одного урока. Пять минут — и цель дня выполнена.'],
      ['Волк приготовил новые слова 🎁', 'Они уже лежат в уроке. Распакуете?'],
      ['Маленький шаг — большой прогресс 🚀', 'Урок в день — и через месяц вы удивитесь себе.'],
      ['Слова сами себя не выучат 📚', 'А вместе с вами — за пять минут. Начнём?'],
      ['Эй, полиглот! 🌍', 'Сегодня ещё не было практики. Самое время!']
    ],
    start: [
      ['Пора начинать! 🐺', 'Первый урок займёт всего пару минут.'],
      ['Привет, я волк-учитель 🐺', 'Давайте выучим первые слова вместе — это быстро и весело.'],
      ['22 языка ждут вас 🌍', 'Выберите любой и пройдите первый урок.']
    ]
  },
  uk: {
    away: [
      ['Вовк виє на місяць 🌕', '{{n}} дн. без уроків — навіть місяць питає, де ви. Поверніться хоч на 5 хвилин!'],
      ['Слова розбігаються 🏃', 'Вас немає вже {{n}} дн. Слова з курсу «{{lang}}» пакують валізи — ловіть їх!'],
      ['Тук-тук! 🚪', '— Хто там? — Ваш курс «{{lang}}». Сумує вже {{n}} дн. Відчините?'],
      ['Мозок просить зарядку 🧠', '{{n}} дн. без тренування. Одна коротка розминка — і знову у формі.'],
      ['Вовк сидить біля вікна 🐺', 'Чекає на вас {{n}} дн. і вдає, що не чекає. Порадуйте його уроком!'],
      ['Розшукується! 🔎', 'Учень, що зник {{n}} дн. тому. Нагорода — досвід і дуже задоволений вовк.'],
      ['Сердечка сумують ❤️', 'Повний запас сердечок, а витратити ніде вже {{n}} дн. Виправимо?']
    ],
    streak: [
      ['Вогонь згасає! 🔥', 'Серія {{n}} дн. згорить опівночі. Підкиньте дровець — пройдіть один урок.'],
      ['Тримайтеся, вже {{n}}-й день! 💪', 'Стільки днів поспіль — шкода втрачати. П\'ять хвилин, і серію врятовано.'],
      ['Тік-так ⏰', 'До півночі зовсім небагато, а серію {{n}} дн. ще не продовжено.'],
      ['Вовк нервово гризе олівець ✏️', 'Ваша серія {{n}} дн. під загрозою. Він вірить, що ви встигнете!'],
      ['Рятувальна операція 🚑', 'Серії {{n}} дн. потрібна допомога. Лише один урок — і вона в безпеці.']
    ],
    today: [
      ['Хвилинка для мови? ☕', 'Поки заварюється чай, можна вивчити кілька слів. {{lang}} чекає!'],
      ['Щоденна доза слів 💊', 'Сьогодні ще жодного уроку. П\'ять хвилин — і мету дня виконано.'],
      ['Вовк приготував нові слова 🎁', 'Вони вже лежать в уроці. Розпакуєте?'],
      ['Маленький крок — великий прогрес 🚀', 'Урок на день — і за місяць ви здивуєте себе.'],
      ['Слова самі себе не вивчать 📚', 'А разом із вами — за п\'ять хвилин. Почнемо?'],
      ['Гей, поліглоте! 🌍', 'Сьогодні ще не було практики. Саме час!']
    ],
    start: [
      ['Час починати! 🐺', 'Перший урок займе лише кілька хвилин.'],
      ['Привіт, я вовк-учитель 🐺', 'Давайте вивчимо перші слова разом — це швидко й весело.'],
      ['22 мови чекають на вас 🌍', 'Оберіть будь-яку і пройдіть перший урок.']
    ]
  },
  en: {
    away: [
      ['The wolf is howling at the moon 🌕', '{{n}} days without a lesson — even the moon is asking where you are. Come back for 5 minutes!'],
      ['Your words are escaping 🏃', 'You\'ve been gone {{n}} days. Your {{lang}} words are packing their bags — catch them!'],
      ['Knock knock! 🚪', '— Who\'s there? — {{lang}}. It\'s missed you for {{n}} days. Will you open the door?'],
      ['Your brain wants a workout 🧠', '{{n}} days without training. One quick warm-up and you\'re back in shape.'],
      ['The wolf is sitting by the window 🐺', 'Waiting for you for {{n}} days and pretending not to. Make its day with a lesson!'],
      ['Wanted! 🔎', 'A learner, missing for {{n}} days. Reward: XP and one very happy wolf.'],
      ['Your hearts are bored ❤️', 'A full stock of hearts and nowhere to spend them for {{n}} days. Shall we fix that?']
    ],
    streak: [
      ['The fire is going out! 🔥', 'Your {{n}}-day streak burns out at midnight. Add some wood — do one lesson.'],
      ['Hang in there, day {{n}}! 💪', 'That many days in a row — too good to lose. Five minutes and the streak is safe.'],
      ['Tick-tock ⏰', 'Midnight is close and your {{n}}-day streak isn\'t extended yet.'],
      ['The wolf is nervously chewing a pencil ✏️', 'Your {{n}}-day streak is at risk. It believes you\'ll make it!'],
      ['Rescue mission 🚑', 'Your {{n}}-day streak needs help. Just one lesson and it\'s safe.']
    ],
    today: [
      ['A minute for {{lang}}? ☕', 'While the kettle boils you can learn a couple of words.'],
      ['Your daily dose of words 💊', 'No lesson yet today. Five minutes and the daily goal is done.'],
      ['The wolf has new words for you 🎁', 'They\'re waiting in the lesson. Want to unwrap them?'],
      ['Small step, big progress 🚀', 'One lesson a day and in a month you\'ll surprise yourself.'],
      ['Words won\'t learn themselves 📚', 'But with you it takes five minutes. Ready?'],
      ['Hey, polyglot! 🌍', 'No practice yet today. Perfect time to start!']
    ],
    start: [
      ['Time to start! 🐺', 'Your first lesson takes just a couple of minutes.'],
      ['Hi, I\'m the wolf teacher 🐺', 'Let\'s learn your first words together — it\'s quick and fun.'],
      ['22 languages are waiting 🌍', 'Pick any of them and do your first lesson.']
    ]
  }
};
