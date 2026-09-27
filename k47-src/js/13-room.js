/* ==========================================================================
   КОМНАТА — навигация: повернуться к стене / столу, обернуться к проёму,
   подойти ближе, осмотреться (зажми и веди). Сюжет (G.story.stage):
     explore — в проёме охранник: обернёшься — выстрел;
     damaged — экран треснул, ползут мысли «кто-то сзади»; в проёме — худой;
     norm    — в терминале 47 нажатий;
     feel    — худой спрашивает, что ты чувствуешь; открывает последние главы;
     final   — дочитать 47–49 → выстрел в спину.
   Любая смерть — регенерация «читателя» (или обрыв цикла в жёстком режиме).
   ========================================================================== */
const DARK_THOUGHTS = ['То, что я делаю, — незаконно...', 'Из того проёма на меня смотрят...', 'Пусть охрана пройдёт мимо...', 'Не сейчас... Не сейчас...', 'Сколько их было?', 'Кто это?',
  'Они знают, что я здесь.', 'Это не моя комната.', 'Я не должен был заходить.', 'Дверь... она была закрыта.', 'Кто оставил эти фотографии?', 'Тот, кто это делал, — ещё здесь.',
  'Фото... все смотрят на меня.', 'Я слышу дыхание.', 'Что, если это не сон?', 'Мне нужно выбраться.', 'Свет... он не настоящий.', 'Здесь что-то не так.', 'Кто-то ходит по ту сторону стены.', 'Не оборачивайся.', 'Это последний раз.'];
const CRAWL_THOUGHTS = ['КТО-ТО СЗАДИ', 'ОН СТОИТ ЗА СПИНОЙ', 'ОБЕРНИСЬ', 'НЕ ОБОРАЧИВАЙСЯ', 'ТЫ СЛЫШИШЬ ДЫХАНИЕ?', 'ШАГИ...', 'ОН ЖДЁТ', 'СЗАДИ', 'КТО-ТО В ПРОЁМЕ', 'ОН ЗНАЕТ, ЧТО ТЫ ЧИТАЛ', 'ОБЕРНИСЬ. ОБЕРНИСЬ.', 'ЭКРАН ТРЕСНУЛ НЕ САМ'];
const DRAWER_ITEMS = {
  paper: ['СМЯТАЯ БУМАГА', 'Исписана с двух сторон. Часть строк зачёркнута, часть — просто нет. Разборчиво одно: «Когда вы решите, что данных достаточно?»'],
  list: ['СПИСОК', 'Фамилии в столбик. Все зачёркнуты. Последнюю кто-то стёр пальцем до дыры.'],
  pda: ['КПК', 'Пустой. Экран тускло-серый. Нет ID-карты. Без неё — просто кирпич.'],
  stone: ['СЕРЫЙ КАМУШЕК', 'Гладкий, отполированный тысячами прикосновений. Тёплый. Будто его только что вынули из чьего-то кармана.'],
};

// ==========================================================================
//   БЛОКНОТ — страница N = глава N.
//   Строка нейрослепка (из мини-игры) + запись «предыдущего читателя»
//   (чистая, если фрагмент восстановлен) + свои записи игрока.
// ==========================================================================
const DIARY = [
  'Минус двести один и сто девяносто один километр льда. «Киндер-сюрприз», надо же. Интересно, кто в итоге окажется игрушкой внутри.',
  'Восемь штук за голову, двадцать тысяч на брата, полмиллиарда в ящике. Здесь всё переводят в деньги. А кто стучал изнутри, так никто и не спросил.',
  '«Вышедший из-под контроля актив» — так в контракте называют человека. Рука подняла пистолет раньше, чем он успел подумать. И что за чёрная рябь текла по стенам?',
  'В каждой капсуле одно и то же лицо с молочными глазами. Потом укол в шею, и вот уже трава, которой он никогда не касался. Если покой можно впрыснуть, то чей тогда мой?',
  'Почему у обычной квартиры шлюзовая дверь? Двенадцать метров, батарея, цифры на стене, которые не складываются в слово. Страшнее всего ладонь, что сначала погладила по щеке.',
  'Железное кольцо с тусклым красным камнем, левая скула и тихое «моё». Первая метина, которую он себе присвоил. Ловлю себя на том, что трогаю свою щёку.',
  'Его шёпот «Ладно?» в темноту невозможно перечитывать. И трава за её спиной: в этих записях уже была трава и улыбка незнакомой женщины. Совпадение?',
  'Считать до тысячи, чтобы отец прошёл мимо. Я ведь тоже считаю: дни, страницы, щелчки ламп. Выходит, у нас с ним одна молитва на двоих.',
  'Он ушёл от отца, чтобы стать солдатом, как отец, и заслужить его любовь. Фотографию в кармане так и не доставал, боялся, что рассыплется. Эту тетрадь я берегу так же.',
  'Тринадцатая, значит, до неё было ещё двенадцать. Его зовут прилечь в траву, а он не ложится. В названии архива стоит сорок семь, и мне всё меньше верится, что это просто номер.',
  'Двадцать человек за гермоворотами и одно «прости» сквозь стекло. Она так и не узнала его имени. Да и было ли оно: К-21 не имя, а номер на крышке капсулы.',
  'Гладкая кожа без единого шрама, а тело всё помнит. Вопрос про «достаточно данных» подчеркнуть не решаюсь: вдруг за зеркальным стеклом считают и мои строчки.',
  'Гвоздь в ботинке он вытерпел молча, а после одного «нормально, Комаров» спал в куртке, чтобы не стереть тепло чужой ладони. От этого больнее, чем от гвоздя.',
  'Ройзман дважды спросил, уверен ли он, будто оставлял дверь приоткрытой. Он хотел, чтобы всё кончилось, а ему пообещали вечность. И снова счёт: один, два, три.',
  'Отец помахал ему рукой — один раз, из той лужи, будто прощался на вокзале. Не могу выбросить этот жест из головы. А он так и не выбросил медаль. Какой уж тут триумф.',
  'Осматривали его, как лошадь на ярмарке, а испугались одного — что он отвёл фонарик от глаз. Живой здесь, похоже, опаснее мёртвого: ремни сразу затянули туже.',
  'Считаю вместе с ним: один, два, три — выстрел. Из пятнадцати четверо, и клички узнаёшь только у выживших: Сорока, Коротыш, Молчун. Остальных он хотя бы запомнил.',
  '«Клоны не читают буклетов», — думает техник. А я читаю. Спор на рацион, свинина против курятины, пугает меньше, чем то, что К-26 впервые уснул.',
  'Снова трава, тот самый ложный рай, и карие глаза, как у женщины с фотографии. Он пообещал помнить и знал, что врёт. Пусть поспит ещё немного.',
  'Правило четвёртое — не запоминать номера клонов. А я выписываю их на полях каждой страницы. По их брошюре это уже выгорание, подлежащее коррекции.',
  'К-29 трогает экран, и идёт снег. Я провожу пальцем по этой странице — ничего. Но холод от неё почему-то живой, а не бетонный.',
  'Самое страшное тут напечатано мелким шрифтом на крышке РПК-3: «норма не ограничена». И ни глотка воды. Отвечу за экран: привет, К-29.',
  'Красный эпипен, синий баллончик с зелёной «N» — ловлю себя на том, что заучиваю цвета, как К-14. Зачем? Мне ведь не в штреки. Правда же?',
  'Санитар задержал палец над планшетом на секунду дольше, чем нужно. Вся жалость этого места умещается в одну секунду. «Эффективный брак» — это ведь про всех нас?',
  'Картошка в фольге с одним-единственным надкусом. Он отложил её на потом, а «потом» здесь не бывает. Теперь боюсь откладывать даже эту запись.',
  'Иван прятал блокнот под матрасом, а мой лежит на столе, на виду. Может, зря. После этой главы проверяю карманы — камушка нет. Пока нет.',
  'До сих пор слышу это ш-ш-ш. Он знал, что женщина с фотографии ему только мерещится, и всё равно пошёл к ней. Опять фотография. Опять мама.',
  'Минус десять процентов давления и полсекунды задержки — вот как выглядит нежность, которую приходится прятать в протоколах. Кто-нибудь сейчас так же подкручивает мою капсулу?',
  'Всё по той лекции: эфедрин, красный эпипен, аранепс, — а лектор ведь предупреждал. Шесть минут, пересчитанных поминутно. Дочитываю, закрыв половину страницы ладонью.',
  'Шоколадка в шуршащей обёртке и шёпот «ты справишься». За это здесь убивают, а в отчёте пишут про несчастный случай. Теперь и я спрашиваю: где другой?',
  'Арина тоже вела тайный дневник: даты, время, имена. Значит, записывать — не безумие. Её письмо в ОПЗ осталось без ответа; хочется верить, что эти страницы кто-нибудь прочтёт.',
  'Лектор перечисляет «Буран» и «Вектор» с усмешкой, как марки машин. При минус двухстах выживает только сталь. Люди, судя по всему, в этот список не входят.',
  'К-14 стоит у стены босиком, пока люди сидят на полу, и запоминает цвет эпипена. Даже умереть по своей воле здесь нельзя: «не входит в контракт».',
  'Аварийный баллон на пять минут — не спасение, а время, чтобы умереть в другом месте. Запоминаю: синий — кислород, красный — горючее. Вдруг пригодится.',
  'Лёд, который дышит и закрывает проходы. В затопленном карсте советуют не плыть, а свернуться, как эмбрион, и ждать семь минут. Руки мёрзнут, пока это читаю.',
  'Своих велят сжигать горелкой, чтобы враг не сделал копию, — и говорят это копиям. А финал слово в слово как в «Лекции». Даже уроки здесь ходят по кругу.',
  'Столько смертей копилось в К-39, и всё вышло одним рёвом. Он остался без рук и не упал. Не знаю, что страшнее: эта ярость или то, как буднично её оборвала очередь.',
  'Санитар насчитал «сорок единиц» — опять эти цифры. К-40 выжил, но улыбается будто не он, а все, кто умер до него. От этой улыбки мне не по себе.',
  'Горечь таблеток, сухой бетон — и вдруг соль на губах. Провожу языком по своим: солёно. Пока есть соль, мы, кажется, тоже есть.',
  'Веснушки на переносице — его собственные, на лице чужого ребёнка. Ловлю себя на том, что трогаю свою переносицу. Не хочу знать, кого увижу в зеркале.',
  'Его застрелили за то, что он лёг на пол и не встал. Сорок четвёртый плакал, но взял оружие. Не могу решить, что из этого страшнее.',
  'Бабочка — надежда или издевательство? Он так и не решил. А её лицо стёрлось, как снимок, который слишком долго тёрли пальцем; свой я теперь прячу подальше.',
  'Мокрые следы геля высыхают за минуту, будто никто и не проходил. Тёплая пустота пугает меня сильнее холода. Слишком понимаю, почему в ней уютно.',
  'Четыре тысячи двести кредитов за цикл, три эсминца за оригинал — у них всё сходится. Только стажёрка вслух назвала его по имени. Запомню её: Дейзи.',
  'Пятьсот маркировочных бирок и сто мешков — кто-то заранее прикинул, на сколько смертей хватит. Белые глаза вписаны в графу «состояние», как цвет обивки.',
  'Пункт 3.17 запрещает дневники, так что пишу мельче. При моральных сомнениях велено перечитать документ. Перечитываю. Не помогает.',
  '«Считать будут другие». Всё это время я считаю вместе с ним — циклы, страницы, сорок семь. Неужели другие — это я?',
  'Руки дрожат. Проверяю левый нагрудный карман — пусто. Если после меня найдёшь серый камушек, не выбрасывай. Передай следующему.',
  'Сорок семь, сорок восемь, сорок девять. Дальше не умею. Кто-нибудь, полейте фикус — у него уже желтеют кончики.',
];

const NotebookUI = (() => {
  const m = $('#nbModal'), txt = $('#nbText');
  let saveT = 0;
  function render() {
    const n = Notebook.current, st = chStatus(n), note = G.notes[n];
    txt.value = Notebook.pages[n] || '';
    const parts = [`<span class="nb-ch">гл. ${n + 1} · ${esc(chTitle(n))}${GAMES[n] ? ` · ${esc(GAMES[n].name)}` : ''}</span>`];
    if (note) parts.push(`<p class="nb-sec ${note.k === 'dist' ? 'dist' : 'mem'}"><small>${note.k === 'dist' ? 'ИСКАЖЁННАЯ ЗАПИСЬ НЕЙРОСЛЕПКА' : 'ЗАПИСЬ НЕЙРОСЛЕПКА К-47'}</small>${esc(note.t)}</p>`);
    if (st === 'ok') parts.push(`<p class="nb-sec hand"><small>ПОЧЕРК ПРЕДЫДУЩЕГО ЧИТАТЕЛЯ</small>${esc(DIARY[n] || '')}</p>`);
    else if (st === 'dist') parts.push(`<p class="nb-sec hand"><small>ПОЧЕРК ПРЕДЫДУЩЕГО ЧИТАТЕЛЯ · СТРОКИ ПЛЫВУТ</small>${glitchHTML(DIARY[n] || '', 0.08, n * 13)}</p>`);
    else if (st === 'dmg') parts.push(`<p class="nb-sec empty"><small>СТРАНИЦА ВЫМОКЛА</small>${glitchHTML(DIARY[n] || '', 0.42, n * 17)}</p>`);
    else parts.push('<p class="nb-sec empty">Страница пуста. Запись проступит, когда фрагмент главы будет восстановлен.</p>');
    $('#nbNote').innerHTML = parts.join('');
    $('#nbPage').textContent = `${n + 1} / ${N_CH}`;
    $('#nbPrev').disabled = n === 0; $('#nbNext').disabled = n === N_CH - 1;
    $('#nbCount').textContent = `${txt.value.length} симв.`; $('#nbSaved').textContent = '';
  }
  function flip(d) {
    const to = clamp(Notebook.current + d, 0, N_CH - 1); if (to === Notebook.current) return;
    Notebook.pages[Notebook.current] = txt.value;
    const f = $('#nbFlip'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    A.sfx.page(); Notebook.current = to;
    setTimeout(() => { render(); Notebook.save(); }, 170);
  }
  $('#nbPrev').addEventListener('click', () => flip(-1));
  $('#nbNext').addEventListener('click', () => flip(1));
  txt.addEventListener('input', () => {
    if (txt.value.length > 4000) txt.value = txt.value.slice(0, 4000);
    Notebook.pages[Notebook.current] = txt.value;
    $('#nbCount').textContent = `${txt.value.length} симв.`; $('#nbSaved').textContent = '…';
    clearTimeout(saveT); saveT = setTimeout(() => { Notebook.save(); $('#nbSaved').textContent = 'сохранено'; }, 400);
  });
  m.addEventListener('keydown', e => { if (e.target === txt) return; if (e.key === 'ArrowLeft') flip(-1); else if (e.key === 'ArrowRight') flip(1); });
  return {
    open(page = null) {
      if (Number.isInteger(page)) Notebook.current = clamp(page, 0, N_CH - 1);
      render(); A.sfx.book();
      Modal.open(m, { focus: '#nbNext', onClose: () => { Notebook.pages[Notebook.current] = txt.value; Notebook.save(); } });
    },
  };
})();

function openZoom(title, caption, canvas) {
  const img = $('#zoomImg');
  img.textContent = canvas ? '' : title;
  img.style.backgroundImage = canvas ? `url(${canvas.toDataURL()})` : 'none';
  img.classList.toggle('noimg', !canvas);
  $('#zoomTitle').textContent = title; $('#zoomCaption').textContent = caption;
  A.sfx.click();
  Modal.open($('#zoomModal'));
}

Acts.room = {
  async enter(scope, opts) {
    const root = $('#act-room'), mount = $('#roomView'), S = G.story, R = G.reader;
    FX.setLevel(agingLevel(), { instant: true }); FX.setVisible(false); FX.clearBlood();
    A.setIntensity(agingLevel());
    mount.innerHTML = ''; mount.classList.remove('tilted'); $('#roomFreeze').classList.remove('on');
    $('#roomVignette').className = 'room-vignette';
    $('#doorTalk').hidden = true; $('#termUI').hidden = true; $('#reader').hidden = true;
    $$('.room-bar .pulse', root).forEach(b => b.classList.remove('pulse'));
    $('#roomTop').innerHTML = '';

    const ctx = {
      scope, phase: 'init', view: null, R3: null, dead: false,
      bars: $$('.room-bar', root),
      setBar(name) { this.bars.forEach(b => { b.hidden = b.dataset.bar !== name; }); $('#lookHint').classList.toggle('show', !!LOOK_LIMITS[name] && name !== 'outside' && name !== 'facing'); },
      say(text, ms = 2600) { const el = $('#roomSpeech'); el.textContent = text; el.classList.add('show'); scope.clear(ctx._sayT); ctx._sayT = scope.timeout(() => el.classList.remove('show'), ms); },
      async ensureRenderer() {
        if (ctx.R3) return ctx.R3;
        let r;
        try { r = await createRoom3D(mount); }
        catch (e) { console.warn('3D-комната недоступна, включён плоский режим:', e.message); r = createRoomFlat(mount); }
        if (!scope.alive) { r.dispose(); return null; }
        ctx.R3 = r;
        r.setPhotoCount(Math.min(47, readCount()));
        r.setScreenState({ codeOk: S.codeOk, cracked: S.cracked });
        r.setFigure(S.stage === 'explore' ? 'guard' : 'thin');
        scope.onDispose(() => r.dispose());
        scope.tick('render', dt => { r.tick(dt); updateLook(dt); updateDark(dt); });
        return r;
      },
    };
    Acts.room.ctx = ctx;
    scope.onDispose(() => { if (Acts.room.ctx === ctx) Acts.room.ctx = null; });
    const hud = () => { $('#roomTop').innerHTML = `OBJ-4471 · ПРОЧИТАНО <b>${readCount()}/${N_CH}</b> · ВОССТАНОВЛЕНО <b>${countSt('ok')}</b> · ИЗНОС <b>${G.wear}%</b>${G.deaths ? ` · СМЕРТЕЙ <b>${G.deaths}</b>` : ''}`; };
    ctx.hud = hud; hud();

    async function go(view, { dur = 1.6, ease = 'tension', steps = true } = {}) {
      if (ctx.phase === 'moving' || ctx.dead) return false;
      const from = ctx.view;
      ctx.phase = 'moving'; ctx.setBar(null); stopDark();
      document.body.style.cursor = '';
      if (steps && dur > 1.1) A.sfx.steps(Math.floor(dur / 0.45), dur);
      A.sfx.whoosh(0.1, view === 'outside' && from !== 'facing');
      look.ty = look.tp = look.y = look.p = 0;
      await ctx.R3.moveTo(view, { dur, ease });
      if (!scope.alive || ctx.dead) return false;
      ctx.view = view; ctx.phase = view; ctx.setBar(view);
      if (view === 'wallClose') ctx.R3.setLinks(links);
      return true;
    }
    ctx.go = go;

    // ---------- осмотр: зажми и веди ----------
    const look = { y: 0, p: 0, ty: 0, tp: 0, drag: false, lx: 0, ly: 0, moved: 0, t0: 0, id: null };
    const canLook = () => !!LOOK_LIMITS[ctx.phase] && !Modal.isOpen();
    function updateLook(dt) {
      if (!canLook()) { look.ty *= 0.85; look.tp *= 0.85; }
      const k = 1 - Math.pow(0.88, dt * 60);
      look.y += (look.ty - look.y) * k; look.p += (look.tp - look.p) * k;
      if (ctx.phase !== 'moving') ctx.R3.setLook(look.y, look.p);
    }
    function nudgeLook(dx) { const lim = LOOK_LIMITS[ctx.phase]; if (lim) look.ty = clamp(look.ty + dx, -lim.yaw, lim.yaw); }
    const ndcOf = e => { const r = mount.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1]; };
    let pressTimer = 0, pressHit = null;
    const pickAt = e => { if (!ctx.R3) return null; const [nx, ny] = ndcOf(e); if (ctx.phase === 'wallClose') return ctx.R3.pick(nx, ny, 'wall'); if (ctx.phase === 'deskClose') return ctx.R3.pick(nx, ny, 'desk'); return null; };
    scope.on(mount, 'pointerdown', e => {
      if (!ctx.R3 || ctx.phase === 'moving') return;
      look.drag = true; look.moved = 0; look.lx = e.clientX; look.ly = e.clientY; look.t0 = performance.now(); look.id = e.pointerId;
      try { mount.setPointerCapture(e.pointerId); } catch { /* */ }
      pressHit = pickAt(e);
      if (pressHit && pressHit.type === 'photo') { scope.clear(pressTimer); pressTimer = scope.timeout(() => { if (look.drag && look.moved < 8) { const i = pressHit.index; pressHit = null; look.drag = false; zoomPhoto(i); } }, 520); }
    });
    scope.on(mount, 'pointermove', e => {
      if (!ctx.R3) return;
      if (!look.drag) { document.body.style.cursor = pickAt(e) ? 'pointer' : ''; return; }
      const dx = e.clientX - look.lx, dy = e.clientY - look.ly;
      look.lx = e.clientX; look.ly = e.clientY; look.moved += Math.abs(dx) + Math.abs(dy);
      if (look.moved > 8 && canLook()) { const lim = LOOK_LIMITS[ctx.phase]; look.ty = clamp(look.ty - dx * 0.0042, -lim.yaw, lim.yaw); look.tp = clamp(look.tp - dy * 0.0042, -lim.pitch, lim.pitch * LOOK_UP); }
    });
    const endPress = e => {
      if (!look.drag || (e && e.pointerId !== look.id)) return;
      look.drag = false; scope.clear(pressTimer);
      if (look.moved < 8 && performance.now() - look.t0 < 520 && pressHit) { if (pressHit.type === 'photo') photoClick(pressHit.index); else deskItem(pressHit.id); }
      pressHit = null;
    };
    scope.on(mount, 'pointerup', endPress);
    scope.on(mount, 'pointercancel', () => { look.drag = false; scope.clear(pressTimer); });
    scope.onDispose(() => { document.body.style.cursor = ''; });

    // ---------- стена: связи красной нитью ----------
    const links = new Set();
    let selected = null;
    function photoClick(i) {
      if (selected === i) { ctx.R3.markPhoto(i, 0x140a08); selected = null; A.sfx.nail(true); return; }
      if (selected === null) { selected = i; ctx.R3.markPhoto(i, 0x660011); A.sfx.click(); return; }
      const a = Math.min(selected, i), b = Math.max(selected, i), key = `${a}-${b}`;
      if (links.has(key)) { links.delete(key); A.sfx.nail(true); } else { links.add(key); A.sfx.nail(false); }
      ctx.R3.markPhoto(selected, 0x140a08); ctx.R3.markPhoto(i, 0x140a08); selected = null;
      ctx.R3.setLinks(links);
    }
    function clearLinks() { links.clear(); if (selected !== null) ctx.R3.markPhoto(selected, 0x140a08); selected = null; ctx.R3.setLinks(links); A.sfx.click(); }
    function zoomPhoto(i) {
      const st = chStatus(i);
      openZoom(`К-${i + 1}`, `Фото со стены: глава ${i + 1} «${chTitle(i)}». ${st === 'ok' ? 'Лицо — только силуэт. Глаза — две белые точки.' : 'Со временем все лица стираются.'}`, RoomArt.get().photos[i]);
    }

    // ---------- стол ----------
    function deskItem(id) {
      switch (id) {
        case 'notebook': NotebookUI.open(); break;
        case 'drawer': A.sfx.drawer(); Modal.open($('#drawerModal')); break;
        case 'photo': openZoom('ФОТО В РАМКЕ', 'Женщина с карими глазами. За её спиной — трава. Чьего лица никто уже не помнит.', RoomArt.get().mother); break;
        case 'note': openZoom('ЗАПИСКА', 'Жёлтый листок, прилип к столу. Почерк торопливый. Первая часть кода.', RoomArt.stickyNote(1, RoomArt.codeParts(S.code)[0])); break;
        case 'radio':
          A.sfx.radio(3.4); ctx.R3.radioLed(true); scope.timeout(() => ctx.R3 && ctx.R3.radioLed(false), 3500);
          openZoom('РАЦИЯ', 'Портативная. Частота 447.1. Ловит только помехи — и иногда шёпот, похожий на счёт.');
          break;
      }
    }
    scope.on($('#drawerModal'), 'click', e => { const it = e.target.closest('[data-item]'); if (!it) return; const [t, c] = DRAWER_ITEMS[it.dataset.item]; Modal.close($('#drawerModal'), true); openZoom(t, c); });

    // ---------- смерть ----------
    ctx.die = async ({ muzzle = false, reason = 'ВЫСТРЕЛ В СПИНУ' } = {}) => {
      if (ctx.dead) return;
      ctx.dead = true; ctx.phase = 'dead'; ctx.setBar(null);
      stopCrawl(); stopDark(true); $('#doorTalk').hidden = true; Modal.closeAll();
      if (muzzle && ctx.R3) ctx.R3.muzzle();
      A.sfx.shot(); FX.flash('#fff2cc', 90, 0.95); scope.timeout(() => FX.flash('#ff2200', 260, 0.6), 110);
      if (ctx.R3) ctx.R3.shake(0.07, 900);
      FX.vibrate([60, 40, 90, 30, 120]); FX.chroma(700); FX.addBlood(3); FX.setVisible(true);
      await scope.wait(380);
      mount.classList.add('tilted'); $('#roomFreeze').classList.add('on');
      A.sfx.glitch(1.4);
      await scope.wait(2300);
      if (ctx.R3) ctx.R3.setActive(false);
      readerDeath(reason);
    };

    // ---------- взгляд в темноту: у стены, влево — к проёму ----------
    const dark = { on: false, t0: 0, level: 0, done: false, dread: null, nextThought: 0, nextBeat: 0 };
    const darkDrifter = createDrifter(scope, $('#roomThoughts'), 'darkThoughts');
    const lookingIntoDark = () => (ctx.phase === 'wall' || ctx.phase === 'wallClose') && look.y >= LOOK_LIMITS[ctx.phase].yaw * 0.85;
    function startDark() { dark.on = true; dark.t0 = Clock.now(); dark.done = false; dark.nextThought = 0; dark.nextBeat = 0; dark.dread = A.dread(14.7); $('#roomVignette').classList.add('red'); }
    function stopDark(hard = false) {
      if (!dark.on) return;
      dark.on = false; $('#roomVignette').classList.remove('red');
      if (dark.dread) { dark.dread.stop(hard ? 0.1 : 0.6); dark.dread = null; }
      darkDrifter.clear();
    }
    scope.onDispose(() => stopDark(true));
    function updateDark(dt) {
      if (ctx.dead) return;
      const l = lookingIntoDark();
      if (l && !dark.on) startDark(); else if (!l && dark.on && !dark.done) stopDark();
      const now = Clock.now();
      if (dark.on) {
        const el = (now - dark.t0) / 1000;
        dark.level = Math.min(1, dark.level + dt / 5);
        ctx.R3.setDread(dark.level * (0.82 + 0.18 * Math.sin(el * (3 + el * 0.5))));
        if (now > dark.nextBeat) { A.sfx.heartbeat(0.35 + dark.level * 0.5); dark.nextBeat = now + (1300 - dark.level * 650); }
        if (el >= 4.7 && now > dark.nextThought) {
          dark.nextThought = now + rand(700, 1300) * (1 - dark.level * 0.35);
          darkDrifter.spawn(pick(DARK_THOUGHTS), { cls: 'dark-thought', from: 'edge', life: rand(6, 9), shake: rand(0.6, 1.8) });
          if (Math.random() < 0.3) A.sfx.whisper(1.4, 0.12);
        }
        if (el >= 14.7 && !dark.done) { dark.done = true; ctx.die({ reason: 'ТЫ СМОТРЕЛ В ТЕМНОТУ 14,7 СЕКУНДЫ' }); }
      } else if (dark.level > 0) { dark.level = Math.max(0, dark.level - dt / 1.2); ctx.R3.setDread(dark.level); }
    }

    // ---------- после треснувшего экрана: ползущие мысли и дрожь ----------
    const crawl = { on: false, spawn: null, shake: null };
    const crawlDrifter = createDrifter(scope, $('#roomCrawl'), 'crawl');
    function startCrawl() {
      if (crawl.on || S.stage !== 'damaged') return;
      crawl.on = true;
      $('[data-go="turn"]', root).classList.add('pulse');
      const one = () => crawlDrifter.spawn(pick(CRAWL_THOUGHTS), { cls: 'crawl-thought', from: 'edge', life: rand(9, 14), shake: rand(1, 2.4), alpha: rand(0.55, 0.9), scale: [0.9, 1.15] });
      one();
      crawl.spawn = scope.every(1300, () => { if (crawl.on && crawlDrifter.count() < 8) one(); });
      crawl.shake = scope.every(2300, () => { if (!crawl.on || ctx.phase === 'moving') return; FX.shake('sm'); if (ctx.R3) ctx.R3.shake(0.025, 700); A.sfx.heartbeat(0.5); });
    }
    function stopCrawl() { if (!crawl.on) return; crawl.on = false; crawl.spawn(); crawl.shake(); crawlDrifter.clear(); }
    ctx.stopCrawl = stopCrawl;
    scope.onDispose(stopCrawl);

    ctx.onOutside = () => {
      hud();
      if (S.stage === 'damaged') startCrawl();
      else if (S.stage === 'feel') $('[data-go="turn"]', root).classList.add('pulse');
      else if (S.stage === 'norm' || S.stage === 'final') $('[data-go="enter"]', root).classList.add('pulse');
      if (ctx.R3) { ctx.R3.setFigure(S.stage === 'explore' ? 'guard' : 'thin'); ctx.R3.setPhotoCount(Math.min(47, readCount())); }
    };

    // ---------- проём за спиной ----------
    setupNorm(ctx);
    const door = setupDoor(ctx);
    let doorSeq = 0;
    async function turnAround() {
      const my = ++doorSeq;
      $('[data-go="turn"]', root).classList.remove('pulse');
      stopCrawl();
      if (!(await go('facing'))) return;
      if (my !== doorSeq) return;
      ctx.phase = 'door'; ctx.setBar(null);
      switch (S.stage) {
        case 'explore': await door.guard(); return;
        case 'damaged': S.stage = 'norm'; Save.put(); await door.thin(['Загляни в терминал.', 'Там для тебя есть работа.']); break;
        case 'norm': await door.thin(['Загляни в терминал.', 'Норма ещё не выполнена.']); break;
        case 'feel': await door.dialogue(); break;
        case 'final': await door.thin(['Дочитай.']); break;
        case 'after': ctx.say('НИКОГО. ТОЛЬКО ТЁПЛЫЙ СЛЕД ГЕЛЯ НА ПОЛУ.', 3000); await scope.wait(3000); break;
      }
      if (!scope.alive || ctx.dead) return;
      ctx.phase = ctx.view;
      await go('outside');
      ctx.onOutside();
    }

    const ACTIONS = {
      wall: () => go('wall'), desk: () => go('desk'), turn: turnAround, outside: () => go('outside'),
      wallClose: () => go('wallClose', { dur: 1.35 }), deskClose: () => go('deskClose', { dur: 1.35 }),
      wallBack: () => go('wall', { dur: 1.35 }), deskBack: () => go('desk', { dur: 1.35 }),
      clearLinks, notebook: () => deskItem('notebook'), drawer: () => deskItem('drawer'), photo: () => deskItem('photo'), radio: () => deskItem('radio'), note: () => deskItem('note'),
      enter: () => {
        if (S.stage === 'damaged') { ctx.say('ЭКРАН НЕ ОТВЕЧАЕТ. СЗАДИ...', 2400); FX.shake('sm'); A.sfx.error(); return; }
        $('[data-go="enter"]', root).classList.remove('pulse'); ctx.enterTerminal();
      },
    };
    scope.on(root, 'click', e => {
      const b = e.target.closest('.room-bar [data-go]'); if (!b || b.disabled || ctx.dead) return;
      e.stopPropagation(); A.sfx.click();
      const fn = ACTIONS[b.dataset.go]; if (fn) fn();
    });
    scope.on(document, 'keydown', e => {
      if (Modal.isOpen() || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey || ctx.phase === 'moving' || ctx.dead || !$('#stage').hidden) return;
      const k = e.code, P = ctx.phase, onBtn = e.target instanceof HTMLButtonElement;
      const map = {
        outside: { ArrowLeft: 'wall', KeyA: 'wall', ArrowRight: 'desk', KeyD: 'desk', ArrowDown: 'turn', KeyS: 'turn', ArrowUp: 'enter', KeyW: 'enter', Enter: 'enter' },
        wall: { ArrowUp: 'wallClose', KeyW: 'wallClose', ArrowDown: 'outside', KeyS: 'outside', Escape: 'outside' },
        wallClose: { ArrowDown: 'wallBack', KeyS: 'wallBack', Escape: 'wallBack' },
        desk: { ArrowUp: 'deskClose', KeyW: 'deskClose', ArrowDown: 'outside', KeyS: 'outside', Escape: 'outside' },
        deskClose: { ArrowDown: 'deskBack', KeyS: 'deskBack', Escape: 'deskBack', KeyN: 'notebook' },
      }[P];
      if (!map) return;
      if ((k === 'Enter' || k === 'Space') && onBtn) return;
      if ((P === 'wall' || P === 'wallClose' || P === 'desk' || P === 'deskClose') && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'KeyA' || k === 'KeyD')) { e.preventDefault(); nudgeLook(k === 'ArrowLeft' || k === 'KeyA' ? 0.12 : -0.12); return; }
      const a = map[k]; if (!a) return;
      e.preventDefault(); A.sfx.click(); ACTIONS[a]();
    });
    scope.on(window, 'k47:resize', () => ctx.R3 && ctx.R3.resize());

    setupTerminal(ctx);

    // ---------- старт ----------
    A.setAmbient('room');
    const mode = opts.mode === 'terminal' || opts.mode === 'reader' ? opts.mode : 'explore';
    if (opts.respawn) toast(`ПОДЪЁМ · СМЕРТЕЙ В ЦИКЛЕ: ${G.deaths}`, 3000);
    if (!opts.respawn && (mode === 'terminal' || mode === 'reader') && S.codeOk) {
      ctx.showTerminal(true);
      if (mode === 'reader' && S.stage !== 'norm') ctx.openReader(R.chapter, { direct: true });
    } else {
      await ctx.ensureRenderer();
      if (!scope.alive) return;
      ctx.R3.setPose('outside'); ctx.view = 'outside'; ctx.phase = 'outside';
      ctx.setBar('outside'); setSub('explore'); ctx.onOutside();
      if (!G.deaths && !readCount() && !S.codeOk) scope.timeout(() => ctx.say('КОД — В ТРЁХ МЕСТАХ. СТОЛ. СТЕНА. ЭКРАН.', 4200), 1600);
      scope.timeout(() => { const b = $('[data-go="enter"]', root); if (b && !b.closest('[hidden]')) b.focus({ preventScroll: true }); }, 700);
    }
  },
};
