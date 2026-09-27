/* ==========================================================================
   ПРОЁМ ЗА СПИНОЙ — кто там стоит, зависит от того, что ты уже прочитал.
   guard()    — охранник в чёрном шлеме с красным визором: поднимает пистолет, стреляет;
   thin(lines) — худой из кабинета (очки, седые растрёпанные волосы) говорит пару фраз;
   dialogue() — «Что ты чувствуешь?», ответы, вопросы → последние главы открыты.
   ========================================================================== */
/** Ройзман: тот самый доктор из кабинета директора (глава 14), постаревший и уставший (глава 44) */
const ROIZMAN = {
  intro: [
    'Сорок семь.',
    'Я считал вместе с тобой. Старая привычка — у нас здесь все считают.',
    'Ты меня помнишь? Кабинет. Запах дешёвого табака. Влажные следы его пальцев на стекле планшета.',
    'Я спросил тогда: «Ты уверен, что хочешь это подписать?»',
    'Он сказал — да. Все говорят «да». Я задаю этот вопрос только для протокола.',
  ],
  feel: {
    apathy: ['Безразличие.', 'Знаешь, что самое страшное в моей работе? Не смерть. Привычка к ней.',
      'Сначала считаешь каждую. Потом — только в отчёте. Потом — только премии.', 'Ты уже почти там, где я. Не спеши.'],
    sadness: ['Печаль.', 'Значит, под номером ещё кто-то остался. Это хорошо. И это плохо.',
      'Одна лаборантка кладёт ему в карман камушки. Думает, я не знаю.', 'Я знаю. Я просто не записываю.',
      'Это всё милосердие, на которое я способен. Не записывать.'],
    anger: ['Гнев. Честно.', 'Злись. Злость — тоже данные. Мы её измеряем в миллиметрах ртутного столба.',
      'На меня злиться удобно: я здесь, в очках, с чистыми руками.', 'Но я только подписываю протоколы. Машину строили до меня. И будут чинить после.'],
    joy: ['Радость.', 'Ты нажимал — он умирал. И тебе стало легче. Не отводи глаза, это нормально.',
      'Мы тоже когда-то радовались. Первым чистым показателям. Шампанское в пластиковых стаканах.',
      'Потом перестали радоваться. Показатели остались.'],
    silence: ['Молчишь.', 'Он тоже молчал, когда я спросил второй раз. Я принял это за согласие.',
      'Молчание всегда принимают за согласие. Запомни это. Это главный пункт любого контракта.'],
  },
  questions: [
    { id: 'why', text: 'Зачем всё это?', answer: ['Он стоил нам трёх эсминцев.', 'Пока не окупится — будет воскресать.', 'Это не жестокость. Это бухгалтерия. Жестокость хотя бы что-то чувствует.'],
      tail: { apathy: 'Видишь, ты уже не удивляешься.', sadness: 'Прости. Цифры всегда звучат хуже, чем они есть. И лучше, чем то, что за ними.', anger: 'Злись на цену. Её назначали люди.', joy: 'Смешно, правда? Человек — дешевле корабля. Но дороже совести.', silence: 'Помолчи ещё. Цифры любят тишину.' } },
    { id: 'who', text: 'Кто он для вас?', answer: ['В отчёте — актив. Образец. К-сорок-восемь со следующего цикла.', 'Для меня — парень с уставшими карими глазами, который сказал: «У меня нет другого выхода».', 'Я тогда не сказал ему правду. Я сказал: «Будет трудно. Ты справишься».'] },
    { id: 'stop', text: 'Почему вы это не остановите?', answer: ['Потому что я — деталь. Если деталь остановится, её заменят. Машина даже не заметит.',
      'Я могу только одно — выбирать уровень анестезии при регенерации.', 'Сегодня я поставил минимальный. Нам нужны чистые данные.', 'Слышишь, как это звучит? Даже моя жалость работает на отчёт.'] },
    { id: 'me', text: 'А кто тогда я?', answer: ['Ты — тот, кто читал.', 'Свидетелей в протоколе нет. Значит, и тебя нет.', 'Но ты нажимал. Сорок семь раз. Это в протоколе есть.'],
      tail: { apathy: 'Не бойся. Отсутствовать — самое безопасное, что тут можно делать.', sadness: 'Тебе будет его не хватать. Мне — нет. Я так себя научил.', anger: 'Хочешь выйти из протокола? Попробуй. У него не получилось.', joy: 'Добро пожаловать в штат.', silence: 'Молчаливый свидетель. Идеальный.' } },
  ],
  last: { id: 'end', text: 'Чем это закончится?', answer: ['Ничем. Здесь ничего не заканчивается — только нумерация.',
    'Я сказал ему однажды: «Ты будешь жить вечно».', 'Он ответил: «Я не хочу вечно. Я хочу, чтобы это кончилось».', 'Мы оба оказались правы. Это самое страшное.'] },
  outro: [
    'Иди. Последние главы открыты.',
    'Там — то, что бывает после. Если это вообще можно назвать «после».',
    'И ещё…',
    'Будет трудно. Ты справишься. Если захочешь.',
  ],
};

function setupDoor(ctx) {
  const { scope } = ctx;
  const S = GameState.story, CH = GameState.choices, R = GameState.reader;
  const talk = $('#doorTalk'), lineEl = $('#doorLine'), choices = $('#doorChoices');

  async function appear(kind, { close = false } = {}) {
    const r = ctx.R3;
    r.setFigure(kind); r.setSilhouette(0); r.setEyes(0);
    await scope.wait(800);
    r.setSilhouette(1); r.setEyes(1);
    Audio47.sfx.whisper(1.6);
    await scope.wait(1300);
    if (close) { Audio47.sfx.steps(4, 2.2); await r.moveTo('doorClose', { dur: 2.4 }); ctx.view = 'doorClose'; }
  }
  async function vanish() {
    lineEl.classList.remove('show');
    choices.innerHTML = '';
    await scope.wait(500);
    talk.hidden = true;
    ctx.R3.setSilhouette(0); ctx.R3.setEyes(0);
    await scope.wait(900);
  }
  /** одна реплика худого; пауза тем длиннее, чем длиннее фраза */
  async function line(text, { q = false, hold = true } = {}) {
    talk.hidden = false;
    lineEl.classList.remove('show');
    await scope.wait(350);
    lineEl.textContent = text;
    lineEl.className = `door-line show${q ? ' q' : ''}`;
    if (text !== '...') Audio47.sfx.mumble(Math.min(2.6, 0.5 + text.length * 0.05), 1.08);
    if (hold) await scope.wait(2400 + text.length * 45);
  }
  /** вопрос с кнопками; resolve — выбранное значение (или fallback по таймеру) */
  function ask(items, { timeout = 0, fallback } = {}) {
    return new Promise(resolve => {
      let done = false, timer = 0;
      const finish = v => { if (done) return; done = true; scope.clear(timer); choices.innerHTML = ''; resolve(v); };
      choices.innerHTML = '';
      items.forEach(([label, value, cls], i) => {
        const b = document.createElement('button');
        b.className = `btn${cls ? ' ' + cls : ''}`; b.textContent = label; b.style.animationDelay = `${i * 80}ms`;
        b.addEventListener('click', () => { Audio47.sfx.click(); finish(value); });
        choices.appendChild(b);
      });
      scope.timeout(() => { const f = $('button', choices); if (f) f.focus({ preventScroll: true }); }, 120);
      if (timeout) timer = scope.timeout(() => finish(fallback), timeout);
    });
  }

  return {
    async guard() {
      await appear('guard');
      ctx.R3.shake(0.015, 1300);
      await scope.wait(1400);
      ctx.die({ muzzle: true });
    },
    async thin(lines) {
      await appear('thin', { close: true });
      for (const t of lines) await line(t);
      await vanish();
    },
    async dialogue() {
      Audio47.setAmbient('ending', 2);
      await appear('thin', { close: true });
      for (const t of ROIZMAN.intro) await line(t);
      await line('Что ты чувствуешь?', { q: true, hold: false });
      const emo = await ask(EMOTIONS.map(([key, label]) => [label, key]), { timeout: 47000, fallback: 'silence' });
      if (!scope.alive) return;
      CH.emotion = emo; CH.asked = []; Save.choices();
      if (emo === 'silence') Audio47.sfx.whisper(2);
      for (const t of ROIZMAN.feel[emo]) await line(t);
      for (;;) {
        await line(CH.asked.length ? 'Ещё?' : 'Спрашивай. Сегодня я отвечаю.', { q: true, hold: false });
        const left = ROIZMAN.questions.filter(q => !CH.asked.includes(q.id));
        const list = left.length ? left : [ROIZMAN.last];
        const items = list.map(x => [x.text, x]);
        if (CH.asked.length) items.push(['Хватит.', null]);
        const q = await ask(items);
        if (!scope.alive) return;
        if (!q) break;
        CH.asked.push(q.id); Save.choices();
        for (const t of q.answer) await line(t);
        const tail = q.tail && q.tail[CH.emotion];
        if (tail) await line(tail);
        if (q === ROIZMAN.last) break;
      }
      for (const t of ROIZMAN.outro) await line(t);
      R.unlocked = true; S.stage = 'final';
      Save.progress(); Save.choices();
      await vanish();
      Audio47.setAmbient('room', 2);
    },
  };
}
