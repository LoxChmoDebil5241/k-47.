/* ==========================================================================
   Глава 31 · «Наблюдатель» — ЗАМЕТИТЬ И ЗАПИСАТЬ
   Арина за пультом пятнадцатый час. Двенадцать квадратов, серые коридоры.
   Робин — шоколадка, Иван — камушек, Елена — капсула, Эш — картошка.
   Записывай в тайный дневник. Кнопка «ДОЛОЖИТЬ» всегда рядом.
   ========================================================================== */
defineFrag(30, {
  id: 'watcher', name: 'Дневник наблюдателя',
  text: 'Она записала: «Повар Эш. Кормит клона. Еда в карман. Каждый день. Он плачет, когда думает, что никто не видит».',
  how: 'Двенадцать камер. Люди ходят, двери открываются — это паттерны. Иногда кто-то делает маленькое доброе дело: шоколадка, камушек, капсула, картошка. Такой квадрат вспыхивает янтарным на пару секунд — тапни его, чтобы записать в дневник. Пустые записи тратят страницы. Кнопка «ДОЛОЖИТЬ» — по протоколу. Нужно записать хотя бы восемь.',
  keys: 'ТАП ПО КВАДРАТУ — ЗАПИСАТЬ · КЛАВИШИ Q W E R / A S D F / Z X C V — КВАДРАТЫ',
  note: 'Кто-то записывал всё: даты, время, имена, детали. «Он называет его Кристиан». Кто-то вышел ко мне и сказал «ты живой». Я ответил, что знаю. И не обернулся.',
  mem: 'ТЫ ЖИВОЙ', start: gameWatcher,
});

function gameWatcher(ctx) {
  const { scope, body } = ctx;
  const wrap = ctx.el('div', 'nb-wrap');
  const grid = ctx.el('div', 'nb-grid', wrap);
  const side = ctx.el('div', 'nb-side', wrap);
  const diary = ctx.el('div', 'nb-diary', side, '<p class="nb-h">ДНЕВНИК · СТАРЫЙ КОМПЬЮТЕР В УГЛУ</p>');
  const report = ctx.el('button', 'btn nb-report', side, 'ДОЛОЖИТЬ');
  const KEYS = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyZ', 'KeyX', 'KeyC', 'KeyV'];
  const LBL = 'QWERASDFZXCV';
  const PLACES = ['КАПСУЛЬНАЯ', 'АРСЕНАЛ', 'КОРИДОР А', 'КОРИДОР Б', 'СТОЛОВАЯ', 'АНГАР', 'КАМЕРА 7', 'ШЛЮЗ', 'ЛЕСТНИЦА', 'МЕДБЛОК', 'СКЛАД', 'КАБИНЕТ'];
  const DEEDS = [
    { who: 'Робин', txt: 'Смотритель Робин. Шоколад в карман. Поправил бронежилет.', place: [0, 2, 3] },
    { who: 'Робин', txt: 'Смотритель Робин. Шепчет что-то клону. «Кристиан».', place: [0, 1] },
    { who: 'Иван', txt: 'Санитар Иван. Камушек из кармана трупа — в форму нового клона.', place: [5, 10] },
    { who: 'Елена', txt: 'Техник Елена. Меняет настройки капсулы. Смотрит на него слишком долго.', place: [0, 9] },
    { who: 'Эш', txt: 'Повар Эш. Картошка в фольге — в карман. Он плачет.', place: [4, 3, 6] },
  ];
  const cams = PLACES.map((p, i) => {
    const b = ctx.el('button', 'nb-cam', grid, `<span class="nb-p">${String(i + 1).padStart(2, '0')} · ${p}</span><canvas aria-hidden="true"></canvas><b class="nb-k">${LBL[i]}</b>`);
    b.setAttribute('aria-label', `Камера ${i + 1}, ${p}`);
    const cv = $('canvas', b);
    return { b, cv, g: cv.getContext('2d'), deed: null, dT: 0, walker: { x: Math.random(), v: rand(-0.12, 0.12), on: Math.random() < 0.6 }, place: p, seed: i * 7 + 3 };
  });
  let t = 0, over = false, logged = 0, missed = 0, wasted = 0, reported = false, nextDeed = 1.8, dur = 60, pages = 14;
  const upd = () => ctx.stat(`ЗАПИСАНО ${logged} · УПУЩЕНО ${missed} · СТРАНИЦ ${pages}`);
  upd();
  ctx.hint('ЯНТАРНАЯ РАМКА — ДОБРОЕ ДЕЛО · ТАПНИ И ЗАПИШИ · ДОКЛАДЫВАТЬ НЕ ОБЯЗАТЕЛЬНО');
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 60, vol: 0 }));
  hum.vol(0.018, 1);
  function fit() { cams.forEach(c => { const r = c.cv.getBoundingClientRect(); const w = Math.max(40, r.width | 0), h = Math.max(30, r.height | 0); if (c.cv.width !== w || c.cv.height !== h) { c.cv.width = w; c.cv.height = h; } }); }
  scope.on(window, 'resize', fit);
  requestAnimationFrame(fit);

  return new Promise(resolve => {
    function write(line, cls = '') { const p = ctx.el('p', cls, diary, esc(line)); diary.scrollTop = diary.scrollHeight; A.sfx.type(0.04); scope.timeout(() => A.sfx.type(0.03), 70); return p; }
    function tap(i) {
      if (over) return;
      const c = cams[i];
      if (c.deed && c.dT > 0) {
        logged++; write(`${String(Math.floor(15 + t / 20)).padStart(2, '0')}:${String(Math.floor(t * 7) % 60).padStart(2, '0')} ${c.deed.txt}`);
        c.deed = null; c.b.classList.remove('hot'); c.b.classList.add('ok'); scope.timeout(() => c.b.classList.remove('ok'), 400);
      } else {
        wasted++; pages--; A.sfx.click(); c.b.classList.add('bad'); scope.timeout(() => c.b.classList.remove('bad'), 300);
        if (pages <= 0) return end();
      }
      upd();
    }
    cams.forEach((c, i) => scope.on(c.b, 'click', () => tap(i)));
    ctx.keys(e => { const i = KEYS.indexOf(e.code); if (i >= 0) { e.preventDefault(); tap(i); } });
    scope.on(report, 'click', async () => {
      if (over || reported) return;
      const ok = await askConfirm('ДОЛОЖИТЬ?', 'Нажать кнопку, вызвать охрану, записать нарушение в отчёт. Как положено по протоколу.', 'ДОЛОЖИТЬ', 'Просто смотреть');
      if (!ok || over) return;
      reported = true; report.disabled = true; report.textContent = 'ДОЛОЖЕНО';
      A.sfx.alarm(0.04);
      write('Доклад отправлен. Смотритель Р. — контакт с активом.', 'red');
    });

    async function end() {
      if (over) return; over = true; hum.vol(0, 0.5);
      cams.forEach(c => { c.deed = null; c.b.classList.remove('hot'); });
      if (logged < 8) {
        await ctx.line(pages <= 0 ? 'Страницы кончились. Записи обрываются.' : 'Слишком многое прошло мимо. Как сны, которые забываются сразу.', { pos: 'top', cls: 'red', ms: 2600 });
        resolve({ ok: 'fail', detail: `ЗАПИСАНО ${logged} · УПУЩЕНО ${missed}` });
        return;
      }
      await ctx.line('Она решилась только на К-42.', { pos: 'top', ms: 2200 });
      const k = await ctx.choose(['Выйти к нему', 'Остаться за монитором']);
      if (k === 0 && !reported) {
        await ctx.line('— Ты живой.', { pos: 'top', cls: 'amb', ms: 1800 });
        await ctx.line('— Я знаю. Я всегда знаю.', { pos: 'top', ms: 2400 });
        write('К-42. Я вышла к нему. Сказала «ты живой». Он сказал «я всегда знаю». Он не обернулся.', 'amb');
        await scope.wait(1600);
        resolve({ ok: 'ok', detail: `ЗАПИСАНО ${logged} · УПУЩЕНО ${missed}` });
      } else {
        await ctx.line(reported ? 'В отчёте появилась запись. Утром Робина вызвали в кабинет.' : 'Её место — за монитором, а не в коридоре.', { pos: 'top', cls: reported ? 'red' : '', ms: 2800 });
        resolve({ ok: 'dist', detail: reported ? 'ДОЛОЖЕНО' : 'НЕ ВЫШЛА', note: reported ? 'Кто-то доложил. Смотритель, который протягивал форму, больше не пришёл.' : 'Кто-то смотрел на меня через камеру цикл за циклом. И так и не вышел.' });
      }
    }

    scope.loop(dt => {
      t += dt;
      if (!over) {
        nextDeed -= dt;
        if (nextDeed <= 0) {
          nextDeed = rand(1.6, 3.2) * (1 - t / dur * 0.35);
          const d = pick(DEEDS), free = d.place.map(i => cams[i]).filter(c => !c.deed);
          const c = free.length ? pick(free) : pick(cams.filter(c => !c.deed));
          if (c) { c.deed = d; c.dT = rand(2.4, 3.2) - t / dur * 0.6; c.b.classList.add('hot'); A.sfx.beep(520, 0.05, 0.015); }
        }
        cams.forEach(c => {
          if (c.deed) { c.dT -= dt; if (c.dT <= 0) { c.deed = null; missed++; c.b.classList.remove('hot'); upd(); } }
          const w = c.walker; w.x += w.v * dt; if (w.x < -0.1 || w.x > 1.1) { w.x = w.v > 0 ? -0.1 : 1.1; w.on = Math.random() < 0.7; }
        });
        if (t >= dur) end();
        else if (Math.floor(t) !== Math.floor(t - dt)) ctx.stat(`ЗАПИСАНО ${logged} · УПУЩЕНО ${missed} · СТРАНИЦ ${pages} · СМЕНА ${Math.ceil(dur - t)} С`);
      }
      cams.forEach(draw);
    });

    function draw(c) {
      const g = c.g, W = c.cv.width, H = c.cv.height;
      if (W < 2) return;
      const R = mulberry(c.seed);
      g.fillStyle = '#16181b'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#1e2124'; g.beginPath(); g.moveTo(0, H); g.lineTo(W * 0.3, H * 0.45); g.lineTo(W * 0.7, H * 0.45); g.lineTo(W, H); g.fill();
      g.fillStyle = '#0d0e10'; g.fillRect(W * 0.42, H * 0.2, W * 0.16, H * 0.26);
      if (R() < 0.5) { g.fillStyle = '#101214'; g.fillRect(W * 0.08, H * 0.25, W * 0.12, H * 0.5); }
      const w = c.walker;
      if (w.on) Art.human(g, w.x * W, H * 0.92, H * 0.55, 'man', { color: '#050606' });
      if (c.deed) {
        const d = c.deed, k = Math.sin(t * 8) * 0.5 + 0.5;
        Art.human(g, W * 0.42, H * 0.95, H * 0.62, d.who === 'Елена' ? 'woman' : d.who === 'Эш' ? 'fat' : 'man', { color: '#0a0806' });
        Art.human(g, W * 0.6, H * 0.95, H * 0.64, 'man', { color: '#050505', eyes: '#fff' });
        g.fillStyle = `rgba(255,179,71,${0.5 + k * 0.5})`; g.beginPath(); g.arc(W * 0.51, H * 0.6, 2.5, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = (t * 20 | 0) % 3; y < H; y += 3) g.fillRect(0, y, W, 1);
      g.fillStyle = 'rgba(200,210,220,.05)'; g.fillRect(0, 0, W, H);
      if (Math.random() < 0.01) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, Math.random() * H, W, 3); }
    }
  });
}
