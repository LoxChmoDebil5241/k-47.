/* ==========================================================================
   Глава 44 · перенесено из прототипа «Мини-игры» (механика сохранена)
   ========================================================================== */
defineFrag(43, {
  id: "papers", name: "Годен / Брак",
  text: "Над столом парила трёхмерная модель нейропрофиля К-47 — спираль нейронных связей, местами рваная, местами сгущённая в узлы, похожие на рубцовую ткань. — Затраты на цикл — четыре тысячи двести кредитов.",
  how: "Смена на «Куполе-7». Ты — аналитик. Проверь досье клонов по нормативу цикла и поставь штамп: ГОДЕН или УТИЛИЗАЦИЯ. Семь досье, одна ошибка допустима. Восьмое — особое.",
  keys: "КНОПКИ ШТАМПОВ · ← ИЛИ 1 — ГОДЕН · → ИЛИ 2 — УТИЛИЗАЦИЯ · НОРМАТИВ СЛЕВА (НА ТЕЛЕФОНЕ — СВЕРХУ)",
  note: "Они решают, годен ли я, по таблице. Таблица говорит «брак». Градов говорит «продолжить». Данных всегда недостаточно.",
  mem: "«ДАННЫХ НЕДОСТАТОЧНО»", start: ctx => gamePapers(ctx),
});

/* ==========================================================================
   Ф-08 · ГОДЕН / БРАК — «Рациональность». Ты — аналитик «Купола-7».
   ========================================================================== */
function gamePapers(ctx) {
  const { scope } = ctx;
  const N = 7, TIME = 120;
  const fmt = n => n.toLocaleString('ru-RU');
  const pct = x => `${x.toFixed(2).replace('.', ',')}%`;
  const EMO_OK = ['нет', 'контролируемые'], EMO_BAD = ['выраженные', 'критические'];
  const OBS = ['Смотрит в стекло капсулы дольше нормы.', 'Считает вслух при пробуждении.', 'Просит вернуть фотографию.', 'Спрашивает, какой сегодня год.',
    'Задерживает дыхание перед командой.', 'Жалоб нет.', 'Жалоб нет.', 'Повторяет чужое имя во сне.', 'Вежлив. Слишком.', 'Не смотрит в глаза персоналу.'];
  const pp = ctx.el('div', 'pp');
  ctx.el('aside', 'pp-rules', pp, `<h3>НОРМАТИВ ЦИКЛА 48</h3><ol>
    <li>Стабильность нейропрофиля — <b>не ниже 60%</b>.</li>
    <li>Стоимость регенерации — <b>не выше 4&nbsp;800 кр.</b></li>
    <li>Остаточная память — <b>не выше 0,50%</b>.</li>
    <li>Эмоциональные отклонения — только <b>«нет»</b> или <b>«контролируемые»</b>.</li>
    <li>Биометрическая метка <b>совпадает</b> с серией.</li></ol>
    <p style="margin:.6rem 0 0;color:#6f9ab8">Нарушен хотя бы один пункт — УТИЛИЗАЦИЯ.</p>`);
  const desk = ctx.el('div', 'pp-desk', pp);
  const timer = ctx.el('div', 'pp-timer', desk, '<i></i>');
  const slot = ctx.el('div', '', desk); slot.style.cssText = 'position:relative;width:min(440px,100%);display:flex;justify-content:center';
  const sayEl = ctx.el('p', 'pp-say', desk);
  const btns = ctx.el('div', 'pp-btns', desk);
  const bG = ctx.el('button', 'btn btn-ok', btns, '← ГОДЕН');
  const bB = ctx.el('button', 'btn btn-primary', btns, 'УТИЛИЗАЦИЯ →');
  const log = ctx.el('aside', 'pp-log', pp, '<h3>ЖУРНАЛ · М. ВАЙС</h3>');
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 60, vol: 0 }));
  const air = scope.own(A.loopNoise({ type: 'lowpass', freq: 500, q: .4, vol: 0 }));
  hum.vol(.018, 1); air.vol(.03, 1);
  ctx.hint('СВЕРЬ ДОСЬЕ С НОРМАТИВОМ · ← / 1 — ГОДЕН · → / 2 — УТИЛИЗАЦИЯ');

  const nums = shuffle([...Array(46).keys()].map(i => i + 1)).slice(0, N);
  const badPlan = shuffle([true, true, true, false, false, false, Math.random() < .5]);
  function make(num, bad) {
    const d = { ser: num, bm: num, cycles: irand(3, 44), stab: irand(61, 96), cost: irand(31, 47) * 100, mem: +rand(.05, .49).toFixed(2), emo: pick(EMO_OK), obs: pick(OBS), bad: [] };
    if (bad) {
      shuffle(['stab', 'cost', 'mem', 'emo', 'bm']).slice(0, Math.random() < .2 ? 2 : 1).forEach(k => {
        if (k === 'stab') { d.stab = irand(38, 59); d.bad.push(`стабильность ${d.stab}%`); }
        if (k === 'cost') { d.cost = irand(49, 66) * 100; d.bad.push(`стоимость ${fmt(d.cost)} кр.`); }
        if (k === 'mem') { d.mem = +rand(.52, 1.4).toFixed(2); d.bad.push(`память ${pct(d.mem)}`); }
        if (k === 'emo') { d.emo = pick(EMO_BAD); d.bad.push(`отклонения «${d.emo}»`); }
        if (k === 'bm') { let x; do { x = irand(1, 46); } while (x === num); d.bm = x; d.bad.push(`метка K-${x} ≠ К-${num}`); }
      });
    } else if (Math.random() < .45) {
      const k = pick(['stab', 'cost', 'mem']);
      if (k === 'stab') d.stab = 60; if (k === 'cost') d.cost = 4800; if (k === 'mem') d.mem = .5;
    }
    return d;
  }
  const queue = nums.map((n, i) => make(n, badPlan[i]));
  let idx = 0, right = 0, busy = false, left = TIME, over = false, card = null;
  const upd = () => ctx.stat(`ДОСЬЕ ${Math.min(idx + 1, N + 1)}/${N + 1} · ВЕРНО ${right}`);

  function cardHTML(d, i, special) {
    return `<div class="hd"><span>ДОСЬЕ АКТИВА · КУПОЛ-7</span><span>${i + 1}/${N + 1}</span></div>
      <div class="ser"><div class="face"></div><div><div class="big">К-${d.ser}</div>
      <div style="margin-top:.35rem;color:#4a4f5a">МЕТКА: BM-K-${d.bm}</div><div style="color:#4a4f5a">ЦИКЛОВ: ${d.cycles}</div></div></div>
      <dl><dt>Стабильность</dt><dd>${special ? 'КРИТИЧЕСКАЯ' : d.stab + '%'}</dd>
      <dt>Регенерация</dt><dd>${fmt(d.cost)} кр.</dd>
      <dt>Остаточная память</dt><dd>${pct(d.mem)}</dd>
      <dt>Отклонения</dt><dd>${esc(d.emo)}</dd></dl>
      <p class="obs">Наблюдатель: «${esc(d.obs)}»</p>`;
  }
  function show() {
    const special = idx === N;
    const d = special ? { ser: 47, bm: 47, cycles: 47, cost: 4200, mem: .47, emo: 'выраженные', obs: 'Задаёт вопросы. Последний: «За что?» Активность нейросети 94%.' } : queue[idx];
    slot.innerHTML = '';
    card = ctx.el('div', `pp-card${special ? ' k47' : ''}`, slot, cardHTML(d, idx, special));
    const fc = document.createElement('canvas'); fc.width = 116; fc.height = 140;
    const fg = fc.getContext('2d'); fg.fillStyle = special ? '#e9d3d3' : '#d6d0cb'; fg.fillRect(0, 0, 116, 140);
    Art.profile(fg, 50, 78, 118, { tag: `K-${d.ser}` });
    $('.face', card).appendChild(fc);
    A.noise({ type: 'bandpass', freq: 1500, f2: 700, q: .8, dur: .25, vol: .07 });
    if (special) { A.sfx.glitch(); sayEl.textContent = 'Градов отрывается от стены и смотрит на твою руку.'; }
    busy = false; upd();
  }
  return new Promise(resolve => {
    async function stamp(good) {
      if (busy || over || !card) return;
      busy = true;
      A.sfx.stamp();
      const s = ctx.el('div', `pp-stamp ${good ? 'g' : 'b'}`, card, good ? 'ГОДЕН' : 'УТИЛИЗАЦИЯ');
      s.style.setProperty('--rot', '-14deg');
      if (idx === N) { finale(good); return; }
      const d = queue[idx], correct = good === (d.bad.length === 0);
      if (correct) { right++; ctx.el('p', 'y', log, `К-${d.ser} · ${good ? 'ГОДЕН' : 'УТИЛ.'} · ✓`); sayEl.textContent = pick(['Вайс кивает.', 'Айрин что-то записывает.', 'Экономия зафиксирована.']); }
      else {
        ctx.el('p', 'n', log, `К-${d.ser} · ${good ? 'ГОДЕН' : 'УТИЛ.'} · ✗ ${good ? d.bad.join(', ') : 'нарушений нет'}`);
        sayEl.textContent = good ? `Фогель хмурится: ${d.bad.join(', ')}.` : 'Вайс: — Минус четыре тысячи. Он был годен.';
        A.sfx.buzz();
      }
      log.scrollTop = log.scrollHeight;
      await scope.wait(750);
      card.classList.add('out');
      await scope.wait(420);
      idx++;
      show();
    }
    async function finale(good) {
      over = true;
      ctx.el('p', 'w', log, `К-47 · ${good ? 'ГОДЕН' : 'УТИЛ.'} · ?`);
      await scope.wait(1300);
      A.sfx.stamp();
      const s = ctx.el('div', 'pp-stamp x', card, 'ПРОДОЛЖИТЬ ЦИКЛ');
      s.style.setProperty('--rot', '9deg');
      sayEl.textContent = 'Градов: — Продолжить. Данных недостаточно.';
      ctx.el('p', 'w', log, 'К-47 · решение оператора отменено');
      log.scrollTop = log.scrollHeight;
      await scope.wait(2800);
      sayEl.textContent = '«Когда вы решите, что данных достаточно?»';
      await scope.wait(2600);
      const ok = right >= N - 1;
      resolve(ok ? { ok: 'ok', detail: `ВЕРНО ${right}/${N}` } : { ok: 'fail', detail: `ВЕРНО ${right}/${N} · НУЖНО ${N - 1}` });
    }
    scope.on(bG, 'click', () => stamp(true));
    scope.on(bB, 'click', () => stamp(false));
    scope.on(document, 'keydown', e => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key === '1') { e.preventDefault(); stamp(true); }
      else if (e.key === 'ArrowRight' || e.key === '2') { e.preventDefault(); stamp(false); }
    });
    show();
    bG.focus({ preventScroll: true });
    const tb = $('i', timer);
    scope.loop(dt => {
      if (over) return false;
      left -= dt;
      tb.style.width = `${Math.max(0, left / TIME) * 100}%`;
      if (left <= 0) {
        over = true;
        sayEl.textContent = 'Смена окончена. Фогель смотрит на дверь.';
        A.sfx.buzz();
        scope.timeout(() => resolve({ ok: 'fail', detail: `НЕ УСПЕЛ · ВЕРНО ${right}/${N}` }), 2200);
        return false;
      }
    });
  });
}
