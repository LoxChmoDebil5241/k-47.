/* ==========================================================================
   НОРМА РАСХОДА ПЛОТИ — 47 нажатий прямо в треснутом терминале.
   Каждое нажатие — крик и смерть клона; его фразы — не чаще раза в 2,6 с.
   ========================================================================== */
const PAIRS = [
  ['БЛЯДЬ!', 'Каждое нажатие — ещё одна смерть.'], ['ЗАЧЕМ ТЫ ЭТО ДЕЛАЕШЬ?!', '47 циклов. Ты знаешь, что это значит.'], ['грудь... болит...', 'Он чувствует каждую пулю.'],
  ['ОСТАНОВИСЬ!!!', '47 — число надежды. Забавно.'], ['ПОЧЕМУ ТЫ НЕ ОСТАНАВЛИВАЕШЬСЯ?!', 'Ты не чувствуешь его агонии?'], ['Я ВИЖУ ТЕБЯ! ТЫ ЗДЕСЬ!', 'Его тело — просто расходник.'],
  ['...', 'К-47. Подъём. :)'], ['Я ТЕБЯ ПРИКОНЧУ!!!', 'Каждая смерть — прибыль корпорации.'], ['СКОЛЬКО ЕМУ ЕЩЁ УМИРАТЬ?!', 'Ты чувствуешь его крик?'],
  ['ТЫ СГНИЁШЬ!!!', '47 сокращений сердца. Статистика.'], ['ПОЧЕМУ ТЫ НЕ СЛЫШИШЬ?!', 'Он считает каждый твой удар.'], ['МНЕ БОЛЬНО!!!', 'Ему уже не больно. Почти.'],
  ['ЗАБУДЬ МЕНЯ!!!', 'Ты читаешь это — ты убиваешь.'], ['Я БЫЛ ЧЕЛОВЕКОМ... ТЫ НЕТ.', 'Он умирал 47 раз. Ты помнишь?'], ['ОСТАВЬ МЕНЯ В ПОКОЕ!!!', 'Ты — просто зритель. Часть системы.'],
  ['СКОЛЬКО РАЗ МНЕ ЕЩЁ УМЕРЕТЬ???', 'Его жизнь не стоила ничего.'], ['Я ТЕБЯ ПРИКОНЧУ!!!', 'Сколько смертей тебе нужно?'], ['ТЫ СХОДИШЬ С УМА!!!', 'Он знает, что это ты.'],
  ['УМРИ!!! УМРИ!!! УМРИ!!!', 'Он отомстит. Не сейчас. Но отомстит.'], ['Я ПОМНЮ.', 'Ты делаешь так, чтобы он страдал. Мне напомнить, что ты его убиваешь?'], ['ЗА ЧТО?', 'Ты не остановишься. :)'],
  ['ХВАТИТ!!! ХВАТИТ!!! ХВАТИТ!!!', 'Он уже не человек. Ты сделал его таким.'], ['Я УМИРАЮ... И ТЫ ЗНАЕШЬ ЭТО.', 'Ты — механизм. Продолжай.'], ['ОСТАНОВИСЬ!!!', 'Сорок семь... Почти.'],
  ['ПОЧЕМУ ТЫ НЕ ОСТАНОВИШЬСЯ?!', 'Его смерть — твоё развлечение.'], ['ТЫ УБИВАЕШЬ МЕНЯ СНОВА И СНОВА!', 'Ты даже не знаешь его имени.'], ['Я ПОМНЮ КАЖДЫЙ ВЫСТРЕЛ!', 'Он — просто строка в отчёте.'],
  ['ТЫ НЕ ИМЕЕШЬ ПРАВА!', 'Ты нажимаешь — он умирает. Простая механика.'], ['СКОЛЬКО ЕЩЁ?!', 'Его агония — твой прогресс.'], ['Я ВЫГРЫЗУ ТВОЮ ГОРТАНЬ!!!', 'Ты приближаешься к развязке. Он — к смерти.'],
  ['ЗА ЧТО Я ПЛАЧУ!!!', 'Смерть — это бизнес. Ты — клиент.'], ['ЗАЧЕМ ТЕБЕ ЭТО НУЖНО?!', 'Ты никогда не встречал его при жизни. Забудь.'], ['ОСТАНОВИСЬ!!!', 'Его боль — твоя статистика.'],
  ['МНЕ НЕ ВЫДЕРЖАТЬ БОЛЬШЕ!', 'Он умрёт столько раз, сколько ты нажмёшь.'], ['ТЫ СОЗДАЁШЬ ЭТОТ АД!', 'Ты не спасаешь его. Ты убиваешь. Молодец.'], ['ПРЕКРАТИ МЕНЯ УБИВАТЬ!', 'Твоя цель — 47. Его цель — выжить. Противоречие.'],
  ['Я ВИЖУ ТВОИ ГЛАЗА ЗА ЭКРАНОМ!', 'Он уже не помнит, каково это — быть живым.'], ['ТЫ ДУМАЕШЬ, ЭТО ВЕСЕЛО?!', 'Ты — его судьба. Беспощадная.'], ['ЭТО НЕ ИГРА, ЭТО СМЕРТЬ!', 'Его крики — просто шум для тебя.'],
  ['ТЫ УБИВАЕШЬ НАСТОЯЩЕГО ЧЕЛОВЕКА!', 'Ты даже не вздрогнешь, когда он умрёт в последний раз.'], ['Я СЧИТАЮ КАЖДУЮ ТВОЮ СЕКУНДУ!', 'Его жизнь — твой билет в финал.'], ['ПОЧЕМУ ТЫ НЕ ЧУВСТВУЕШЬ ВИНЫ?!', 'Ты нажимаешь. Он умирает. Всё логично.'],
  ['ТЫ БУДЕШЬ ОТВЕЧАТЬ ЗА КАЖДУЮ СМЕРТЬ!', 'Он — пешка. Ты — игрок. Игроки не чувствуют.'], ['Я ЗНАЮ ТВОЁ ЛИЦО!', 'Ты уже убил его. Сотни раз. Какая разница?'], ['ТЫ НЕ СМОЖЕШЬ СПРЯТАТЬСЯ ОТ ЭТОГО!', 'Он умрёт. Ты прочитаешь. И нажмёшь снова.'],
  ['КОГДА ЭТО ЗАКОНЧИТСЯ?!', 'Ты не остановишься. Потому что можешь.'], ['...', 'О... Ты достиг сорока семи.'],
];
const DEATH_WORDS = ['застрелен', 'убит', 'предан', 'растерзан', 'раздавлен', 'сломлен', 'забыт', 'стёрт', 'пустота', 'холод', 'кровь', 'лёд', 'крик', 'тишина', 'пульс', 'боль', 'выстрел', 'осколок',
  'рана', 'агония', 'одиночество', 'отчаяние', 'ненависть', 'пуля', 'падение', 'темнота', 'свет', 'конец', 'номер', 'плоть', 'кость', 'мясо', 'цикл', 'повтор', 'снова', 'опять', 'молчит', 'страдает', 'считает', 'смерть'];
const NORM_HOLD = 2600;

function setupNorm(ctx) {
  const { scope } = ctx;
  const S = G.story;
  const status = $('#normStatus'), victim = $('#normVictim'), villain = $('#normVillain'), fill = $('#normFill'), progress = $('#normProgress'), count = $('#normCount'), btn = $('#normBtn'), word = $('#normWord'), cool = $('#normCool');
  let done = false, shownAt = -1e9, pending = null, pendingT = 0;
  function render() {
    fill.style.width = `${(G.clicks / CLICKS_NEEDED) * 100}%`; count.textContent = G.clicks;
    btn.setAttribute('aria-label', `Нажать. Осталось ${CLICKS_NEEDED - G.clicks}`);
    const ok = G.clicks >= CLICKS_NEEDED;
    progress.classList.toggle('done', ok); status.classList.toggle('done', ok);
    status.textContent = ok ? 'НОРМА РАСХОДА ПЛОТИ ДОСТИГНУТА.' : 'НОРМА РАСХОДА ПЛОТИ НЕ ДОСТИГНУТА';
  }
  async function say(text) { villain.classList.remove('show'); await scope.wait(400); villain.textContent = text; villain.className = 'norm-villain show'; }
  function voice(text) {
    const w = shownAt + NORM_HOLD - Clock.now();
    if (w <= 0) { showVoice(text); return; }
    pending = text;
    if (!pendingT) pendingT = scope.timeout(() => { pendingT = 0; if (pending) { showVoice(pending); pending = null; } }, w);
  }
  function showVoice(text) {
    shownAt = Clock.now();
    villain.classList.remove('show'); void villain.offsetWidth; villain.textContent = text; villain.className = 'norm-villain show';
    cool.style.transition = 'none'; cool.style.transform = 'scaleX(1)'; void cool.offsetWidth;
    cool.style.transition = `transform ${NORM_HOLD}ms linear`; cool.style.transform = 'scaleX(0)';
  }
  function start() {
    A.setAmbient('clicks'); A.setIntensity(G.clicks / CLICKS_NEEDED);
    done = false; pending = null;
    victim.className = 'norm-victim'; victim.textContent = ''; word.textContent = '';
    btn.hidden = false; btn.disabled = false;
    cool.style.transition = 'none'; cool.style.transform = 'scaleX(0)';
    showVoice(G.clicks ? PAIRS[G.clicks - 1][1] : 'Сорок семь нажатий. Каждое — смерть. Нажимай.');
    render();
    ctx.log(`Норма расхода плоти: ${G.clicks} / ${CLICKS_NEEDED}`, 'warn');
    if (G.clicks >= CLICKS_NEEDED) complete();
  }
  function press() {
    if (done || G.clicks >= CLICKS_NEEDED || ctx.phase !== 'terminal') return;
    G.clicks++; Save.put(true);
    const [v, w] = PAIRS[G.clicks - 1];
    word.textContent = pick(DEATH_WORDS);
    victim.textContent = v; victim.className = 'norm-victim'; void victim.offsetWidth; victim.className = 'norm-victim show';
    render();
    FX.redBlack(); FX.chroma(140);
    A.sfx.heartbeat(0.4 + (G.clicks / CLICKS_NEEDED) * 0.6); A.sfx.shot(0.25 + G.clicks / CLICKS_NEEDED * 0.3);
    A.setIntensity(G.clicks / CLICKS_NEEDED);
    if (Math.random() < 0.4) FX.addBlood(1);
    FX.vibrate(25);
    if (G.clicks >= CLICKS_NEEDED) { scope.clear(pendingT); pendingT = 0; pending = null; showVoice(w); complete(); return; }
    voice(w);
  }
  async function complete() {
    done = true; btn.disabled = true;
    FX.setLevel(agingLevel()); FX.bump(0.9); FX.addBlood(3); FX.shake('lg'); FX.vibrate([100, 50, 200]); FX.chroma(800);
    A.sfx.glitch(2.4); render(); word.textContent = '';
    await scope.wait(1300);
    btn.hidden = true; victim.className = 'norm-victim';
    await say('Кажется, ты выполнил норму расхода плоти.'); await scope.wait(3200);
    await say('Свою задачу ты выполнил.'); await scope.wait(3000);
    await say('А теперь — обернись.'); await scope.wait(2800);
    S.stage = 'feel'; Save.put();
    ctx.exitTerminal({ auto: true });
  }
  scope.on(btn, 'click', press);
  scope.on(document, 'keydown', e => { if (!panelsNormVisible() || Modal.isOpen() || stageOpen()) return; if ((e.code === 'Space' || e.code === 'Enter') && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); press(); } });
  const panelsNormVisible = () => !$('#termNorm').hidden && ctx.phase === 'terminal';
  ctx.norm = { start };
}

/* ==========================================================================
   ПРОЁМ ЗА СПИНОЙ — кто там стоит, зависит от того, что ты уже прочитал.
   guard()    — охранник в броне с красным визором (реф. 6): стреляет;
   thin(lines) — худой (Ройзман) говорит пару фраз;
   dialogue() — «Что ты чувствуешь?» → вопросы → последние главы открыты.
   ========================================================================== */
const EMOTIONS = [['apathy', 'Безразличие'], ['sadness', 'Печаль'], ['anger', 'Гнев'], ['joy', 'Радость']];
const ROIZMAN = {
  intro: ['Сорок семь.', 'Я считал вместе с тобой. Старая привычка — у нас здесь все считают.',
    'Ты меня помнишь? Кабинет. Запах дешёвого табака. Влажные следы его пальцев на стекле планшета.',
    'Я спросил тогда: «Ты уверен, что хочешь это подписать?»', 'Он сказал — да. Все говорят «да». Я задаю этот вопрос только для протокола.'],
  feel: {
    apathy: ['Безразличие.', 'Знаешь, что самое страшное в моей работе? Не смерть. Привычка к ней.', 'Сначала считаешь каждую. Потом — только в отчёте. Потом — только премии.', 'Ты уже почти там, где я. Не спеши.'],
    sadness: ['Печаль.', 'Значит, под номером ещё кто-то остался. Это хорошо. И это плохо.', 'Одна лаборантка кладёт ему в карман камушки. Думает, я не знаю.', 'Я знаю. Я просто не записываю.', 'Это всё милосердие, на которое я способен. Не записывать.'],
    anger: ['Гнев. Честно.', 'Злись. Злость — тоже данные. Мы её измеряем в миллиметрах ртутного столба.', 'На меня злиться удобно: я здесь, в очках, с чистыми руками.', 'Но я только подписываю протоколы. Машину строили до меня. И будут чинить после.'],
    joy: ['Радость.', 'Ты нажимал — он умирал. И тебе стало легче. Не отводи глаза, это нормально.', 'Мы тоже когда-то радовались. Первым чистым показателям. Шампанское в пластиковых стаканах.', 'Потом перестали радоваться. Показатели остались.'],
    silence: ['Молчишь.', 'Он тоже молчал, когда я спросил второй раз. Я принял это за согласие.', 'Молчание всегда принимают за согласие. Запомни это. Это главный пункт любого контракта.'],
  },
  questions: [
    { id: 'why', text: 'Зачем всё это?', answer: ['Он стоил нам трёх эсминцев.', 'Пока не окупится — будет воскресать.', 'Это не жестокость. Это бухгалтерия. Жестокость хотя бы что-то чувствует.'],
      tail: { apathy: 'Видишь, ты уже не удивляешься.', sadness: 'Прости. Цифры всегда звучат хуже, чем они есть. И лучше, чем то, что за ними.', anger: 'Злись на цену. Её назначали люди.', joy: 'Смешно, правда? Человек — дешевле корабля. Но дороже совести.', silence: 'Помолчи ещё. Цифры любят тишину.' } },
    { id: 'who', text: 'Кто он для вас?', answer: ['В отчёте — актив. Образец. К-сорок-восемь со следующего цикла.', 'Для меня — парень с уставшими карими глазами, который сказал: «У меня нет другого выхода».', 'Я тогда не сказал ему правду. Я сказал: «Будет трудно. Ты справишься».'] },
    { id: 'stop', text: 'Почему вы это не остановите?', answer: ['Потому что я — деталь. Если деталь остановится, её заменят. Машина даже не заметит.', 'Я могу только одно — выбирать уровень анестезии при регенерации.', 'Сегодня я поставил минимальный. Нам нужны чистые данные.', 'Слышишь, как это звучит? Даже моя жалость работает на отчёт.'] },
    { id: 'me', text: 'А кто тогда я?', answer: ['Ты — тот, кто читал.', 'Свидетелей в протоколе нет. Значит, и тебя нет.', 'Но ты нажимал. Сорок семь раз. Это в протоколе есть.'],
      tail: { apathy: 'Не бойся. Отсутствовать — самое безопасное, что тут можно делать.', sadness: 'Тебе будет его не хватать. Мне — нет. Я так себя научил.', anger: 'Хочешь выйти из протокола? Попробуй. У него не получилось.', joy: 'Добро пожаловать в штат.', silence: 'Молчаливый свидетель. Идеальный.' } },
  ],
  last: { id: 'end', text: 'Чем это закончится?', answer: ['Ничем. Здесь ничего не заканчивается — только нумерация.', 'Я сказал ему однажды: «Ты будешь жить вечно».', 'Он ответил: «Я не хочу вечно. Я хочу, чтобы это кончилось».', 'Мы оба оказались правы. Это самое страшное.'] },
  outro: ['Иди. Последние главы открыты.', 'Там — то, что бывает после. Если это вообще можно назвать «после».', 'И ещё…', 'Будет трудно. Ты справишься. Если захочешь.'],
};

function setupDoor(ctx) {
  const { scope } = ctx;
  const S = G.story, CH = G.choices, R = G.reader;
  const talk = $('#doorTalk'), lineEl = $('#doorLine'), choices = $('#doorChoices');
  async function appear(kind, { close = false } = {}) {
    const r = ctx.R3;
    r.setFigure(kind); r.setSilhouette(0); r.setEyes(0);
    await scope.wait(800);
    r.setSilhouette(1); r.setEyes(1); A.sfx.whisper(1.6, 0.12);
    await scope.wait(1300);
    if (close) { A.sfx.steps(4, 2.2); await r.moveTo('doorClose', { dur: 2.4 }); ctx.view = 'doorClose'; }
  }
  async function vanish() {
    lineEl.classList.remove('show'); choices.innerHTML = '';
    await scope.wait(500); talk.hidden = true;
    ctx.R3.setSilhouette(0); ctx.R3.setEyes(0);
    await scope.wait(900);
  }
  async function line(text, { q = false, hold = true } = {}) {
    talk.hidden = false; lineEl.classList.remove('show');
    await scope.wait(350);
    lineEl.textContent = text; lineEl.className = `door-line show${q ? ' q' : ''}`;
    if (text !== '...') A.sfx.mumble(Math.min(2.6, 0.5 + text.length * 0.05), 1.08, 0.09);
    if (hold) await scope.wait(2400 + text.length * 45);
  }
  function ask(items, { timeout = 0, fallback } = {}) {
    return new Promise(resolve => {
      let done = false, timer = 0;
      const finish = v => { if (done) return; done = true; scope.clear(timer); choices.innerHTML = ''; resolve(v); };
      choices.innerHTML = '';
      items.forEach(([label, value, cls], i) => {
        const b = document.createElement('button');
        b.className = `btn${cls ? ' ' + cls : ''}`; b.textContent = label; b.style.animationDelay = `${i * 80}ms`;
        b.addEventListener('click', () => { A.sfx.click(); finish(value); });
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
      ctx.die({ muzzle: true, reason: 'ТЫ ОБЕРНУЛСЯ. В ПРОЁМЕ СТОЯЛА ОХРАНА' });
    },
    async thin(lines) {
      await appear('thin', { close: true });
      for (const t of lines) await line(t);
      await vanish();
    },
    async dialogue() {
      A.setAmbient('ending', 2);
      await appear('thin', { close: true });
      for (const t of ROIZMAN.intro) await line(t);
      await line('Что ты чувствуешь?', { q: true, hold: false });
      const emo = await ask(EMOTIONS.map(([key, label]) => [label, key]), { timeout: 47000, fallback: 'silence' });
      if (!scope.alive) return;
      CH.emotion = emo; CH.asked = []; Save.put();
      if (emo === 'silence') A.sfx.whisper(2, 0.12);
      for (const t of ROIZMAN.feel[emo]) await line(t);
      for (;;) {
        await line(CH.asked.length ? 'Ещё?' : 'Спрашивай. Сегодня я отвечаю.', { q: true, hold: false });
        const left = ROIZMAN.questions.filter(q => !CH.asked.includes(q.id));
        const list = left.length ? left : [ROIZMAN.last];
        const items = list.map(x => [x.text, x]);
        if (CH.asked.length) items.push(['Хватит.', null, 'btn-ghost']);
        const q = await ask(items);
        if (!scope.alive) return;
        if (!q) break;
        CH.asked.push(q.id); Save.put();
        for (const t of q.answer) await line(t);
        const tail = q.tail && q.tail[CH.emotion];
        if (tail) await line(tail);
        if (q === ROIZMAN.last) break;
      }
      for (const t of ROIZMAN.outro) await line(t);
      R.unlocked = true; S.stage = 'final'; CH.finished = true; Save.put();
      await vanish();
      A.setAmbient('room', 2);
    },
  };
}
