/* ==========================================================================
   Глава 34 · «Скелет» — СОБРАТЬ ВЫКЛАДКУ И НЕ ПЕРЕПУТАТЬ ШЛАНГИ
   «Слой» 8 кг, «Шакал» 18 кг, «Панцирь» 35 кг. Аварийный баллон — 5 минут,
   базовый — 2 часа, спаянный двойной — 40 минут. Красная маркировка —
   горючее, синяя — кислород. Перепутаете — смерть через три секунды.
   ========================================================================== */
defineFrag(33, {
  id: 'skeleton', name: 'Красная — горючее',
  text: 'Если перепутаете шланги — смерть через три секунды. Всегда проверяйте маркировку. Красная — горючее, синяя — кислород. Запомните.',
  how: 'Три вылазки. Под каждую собери выкладку из ящиков: броня, баллоны, инструмент, сканер — в пределах веса. Потом, в темноте штрека, подключай шланги: к маске — только синюю маркировку, к резаку — красную. Свет мигает. Ошибка со шлангом — смерть.',
  keys: 'ТАП ПО ПРЕДМЕТУ — ВЗЯТЬ / ВЕРНУТЬ · ГОТОВО — ПРОВЕРИТЬ · ШЛАНГИ: 1 / 2 ИЛИ ТАП',
  note: 'Шакал, базовый баллон, аварийный на поясе. Лектор говорил: задача — выжить, а не выглядеть круто. Я выбирал правильно. Меня всё равно ели.',
  mem: 'КРАСНАЯ — ГОРЮЧЕЕ', start: gameSkeleton,
});

async function gameSkeleton(ctx) {
  const { scope } = ctx;
  const ITEMS = [
    { k: 'sloy', n: '«Слой»', w: 8, g: 'armor', d: 'броня 8 кг · осколки, пистолет' },
    { k: 'shakal', n: '«Шакал»', w: 18, g: 'armor', d: 'броня 18 кг · держит очередь' },
    { k: 'pancir', n: '«Панцирь»', w: 35, g: 'armor', d: 'броня 35 кг · штурм, когти' },
    { k: 'emerg', n: 'Аварийный', w: 2, g: 'air', d: 'баллон · 5 минут · на пояс' },
    { k: 'base', n: 'Базовый', w: 9, g: 'air', d: 'баллон · 2 часа · на спину' },
    { k: 'double', n: 'Двойной', w: 5, g: 'air', d: 'спаянный · 40 минут' },
    { k: 'cutS', n: 'Резак носимый', w: 1.5, g: 'tool', d: '10 минут · замки, кабели' },
    { k: 'cutL', n: 'Резак переносной', w: 8, g: 'tool', d: 'горючая смесь · металл, броня' },
    { k: 'torch', n: 'Горелка', w: 2, g: 'tool', d: 'огонь · отгонять фауну' },
    { k: 'vibro', n: 'Выбро', w: 1, g: 'scan', d: 'лёд, пустоты · 50 м · 70%' },
    { k: 'life', n: 'Сканер живности', w: 1, g: 'scan', d: 'тепло, движение · 100 м' },
    { k: 'void', n: 'Сканер полостей', w: 1, g: 'scan', d: 'карсты, каверны · 20 м' },
    { k: 'ammo', n: 'Магазины ×5', w: 4, g: 'ammo', d: 'три для ПП, два для дробовика' },
  ];
  const MISSIONS = [
    { t: 'РАЗВЕДКА ПО ОСНОВНОМУ ШТРЕКУ', txt: 'Быстро и тихо. Два часа работы. Фауна рядом — увидеть её раньше, чем она вас.', max: 34,
      need: s => s.has('sloy') && s.has('base') && s.has('emerg') && s.has('life') && !s.has('pancir'),
      why: '«Слой», базовый баллон, аварийный на поясе и сканер живности. «Панцирь» в разведке — лишняя смерть.' },
    { t: 'ТЕХНИЧЕСКИЙ ШТРЕК К КАРСТОВОЙ ПОЛОСТИ', txt: 'Помощь не дойдёт. Стена может оказаться тонкой, а за ней — пустота на сотню метров. Решётку вентиляции придётся резать.', max: 40,
      need: s => s.has('double') && s.has('void') && (s.has('cutS') || s.has('cutL')) && !s.has('pancir'),
      why: 'Двойной аварийный — туда, куда не дойдёт помощь; сканер полостей; резак.' },
    { t: 'ШТУРМ ЛОГОВА', txt: 'Скорость не важна. Важна живучесть. Когти крупной фауны. Работать долго.', max: 60,
      need: s => s.has('pancir') && s.has('base') && s.has('ammo') && s.has('emerg'),
      why: '«Панцирь» для штурма, базовый баллон, аварийный на поясе, патроны вместо еды.' },
  ];
  let right = 0;
  for (let m = 0; m < MISSIONS.length; m++) {
    if (!scope.alive) return { ok: 'fail' };
    const M = MISSIONS[m];
    const box = ctx.el('div', 'sk-box');
    ctx.el('p', 'sk-mis', box, `<b>ВЫЛАЗКА ${m + 1}/3 · ${esc(M.t)}</b><br>${esc(M.txt)}`);
    const wEl = ctx.el('p', 'sk-w', box);
    const grid = ctx.el('div', 'sk-grid', box);
    const sel = new Set();
    const weight = () => [...sel].reduce((s, k) => s + ITEMS.find(x => x.k === k).w, 0);
    const refresh = () => { const w = weight(); wEl.innerHTML = `ВЕС <b class="${w > M.max ? 'hot' : ''}">${+w.toFixed(1)}</b> / ${M.max} КГ`; };
    ITEMS.forEach(it => {
      const b = ctx.el('button', `sk-it g-${it.g}`, grid, `<b>${esc(it.n)}</b><small>${esc(it.d)}</small><i>${it.w} кг</i>`);
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        if (sel.has(it.k)) sel.delete(it.k);
        else {
          if (it.g === 'armor') ITEMS.filter(x => x.g === 'armor').forEach(x => { sel.delete(x.k); });
          sel.add(it.k);
        }
        $$('.sk-it', grid).forEach((el, i) => { const on = sel.has(ITEMS[i].k); el.classList.toggle('on', on); el.setAttribute('aria-pressed', String(on)); });
        A.sfx.type(0.05); refresh();
      });
    });
    refresh();
    ctx.stat(`ВЫЛАЗКА ${m + 1}/3 · ВЕРНО ${right}`);
    await new Promise(res => { const go = ctx.el('button', 'btn btn-primary sk-go', box, 'ГОТОВО'); go.addEventListener('click', () => { A.sfx.click(); res(); }); });
    if (!scope.alive) return { ok: 'fail' };
    const ok = weight() <= M.max && M.need(sel);
    box.remove();
    if (ok) { right++; A.sfx.chime(700, 0.05); await ctx.line('— Годится. Задача — выжить, а не выглядеть круто.', { pos: 'mid', cls: 'amb', ms: 2200 }); }
    else { A.sfx.buzz(); await ctx.line(`${weight() > M.max ? 'Перегруз. Лишний вес — лишняя смерть. ' : ''}${M.why}`, { pos: 'mid', cls: 'red', ms: 3600 }); }
  }
  if (!scope.alive) return { ok: 'fail' };

  // ---- шланги в темноте ----
  const C = ctx.canvas();
  let t = 0, round = 0, dead = false, cur = null, choice = -1, flick = 1;
  const ROUNDS = 8;
  ctx.hint('СИНЯЯ — КИСЛОРОД (МАСКА) · КРАСНАЯ — ГОРЮЧЕЕ (РЕЗАК)');
  const ctl = ctx.el('div', 'ctl');
  const bA = ctx.el('button', 'btn big-btn', ctl, '<b>1</b> ЛЕВЫЙ ШЛАНГ');
  const bB = ctx.el('button', 'btn big-btn', ctl, '<b>2</b> ПРАВЫЙ ШЛАНГ');
  const newRound = () => { cur = { target: Math.random() < 0.5 ? 'mask' : 'cutter', left: Math.random() < 0.5 ? 'blue' : 'red', t: 0, lim: 3.2 - round * 0.18 }; choice = -1; ctx.stat(`ШЛАНГИ ${round + 1}/${ROUNDS} · ВЫКЛАДОК ${right}/3`); A.sfx.beep(500, 0.05, 0.02); };
  const res = await new Promise(resolve => {
    const pickH = i => {
      if (!cur || choice >= 0 || dead) return;
      choice = i;
      const col = (i === 0) === (cur.left === 'blue') ? 'blue' : 'red';
      const good = (cur.target === 'mask') === (col === 'blue');
      if (!good) { dead = true; A.sfx.hiss(1.2, 0.12); FX.flash('#ff0000', 400, 0.6); scope.timeout(() => resolve(false), 1400); return; }
      A.sfx.click(); A.sfx.hiss(0.2, 0.04);
      scope.timeout(() => { round++; if (round >= ROUNDS) resolve(true); else newRound(); }, 450);
    };
    scope.on(bA, 'click', () => pickH(0)); scope.on(bB, 'click', () => pickH(1));
    ctx.keys(e => { if (e.key === '1') pickH(0); if (e.key === '2') pickH(1); });
    newRound();
    scope.loop(dt => {
      t += dt;
      if (cur && choice < 0 && !dead) { cur.t += dt; if (cur.t >= cur.lim) { dead = true; A.sfx.alarm(0.05); ctx.say('Не успел. Давление ушло в ноль.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve(false), 1600); } }
      flick = Math.random() < 0.08 ? rand(0.05, 0.3) : Math.min(1, flick + dt * 3);
      const { g, W, H } = C;
      g.fillStyle = '#04070a'; g.fillRect(0, 0, W, H);
      if (!cur) return;
      const lit = flick * (0.35 + 0.65 * (1 - round / ROUNDS * 0.6));
      g.fillStyle = `rgba(143,176,196,${0.08 * lit})`; g.fillRect(0, 0, W, H);
      // цель
      g.fillStyle = `rgba(239,230,207,${0.9 * lit + 0.1})`; g.font = `${Math.round(Math.min(W, H) * 0.05)}px ${PIXEL}`; g.textAlign = 'center';
      g.fillText(cur.target === 'mask' ? 'МАСКА · ДЫШАТЬ' : 'ПЛАЗМЕННЫЙ РЕЗАК', W / 2, H * 0.16);
      // два шланга
      [0, 1].forEach(i => {
        const x = W * (0.3 + i * 0.4), col = (i === 0) === (cur.left === 'blue') ? '74,168,216' : '255,0,51';
        g.strokeStyle = `rgba(40,42,46,${0.6 + 0.4 * lit})`; g.lineWidth = 14; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, H * 0.95); g.bezierCurveTo(x + (i ? 60 : -60), H * 0.7, x - (i ? 40 : -40), H * 0.45, x, H * 0.32); g.stroke();
        g.fillStyle = `rgba(${col},${lit})`; g.fillRect(x - 12, H * 0.34, 24, 10);
        g.fillStyle = `rgba(90,90,96,${0.5 + 0.5 * lit})`; g.fillRect(x - 9, H * 0.28, 18, 10);
        if (choice === i) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.strokeRect(x - 22, H * 0.26, 44, 30); }
      });
      // время
      g.fillStyle = 'rgba(255,0,51,.7)'; g.fillRect(W * 0.2, H * 0.22, W * 0.6 * (1 - cur.t / cur.lim), 4);
      Art.vignette(g, W, H, 0.8);
    });
  });
  if (!scope.alive) return { ok: 'fail' };
  if (!res) {
    await ctx.line(choice >= 0 ? 'Горючая смесь в маске. Смерть через три секунды.' : 'Три секунды — это очень долго, если считать.', { pos: 'top', cls: 'red', ms: 2800 });
    return { ok: 'fail', detail: `ШЛАНГИ ${round}/${ROUNDS}` };
  }
  if (right < 2) {
    await ctx.line('Шланги — верно. Выкладка — нет. В штреке лишний вес — лишняя смерть.', { pos: 'top', cls: 'red', ms: 2800 });
    return { ok: 'fail', detail: `ВЫКЛАДОК ${right}/3` };
  }
  await ctx.line('— Геосканер говорит «чисто». Это не значит, что там чисто.', { pos: 'top', cls: 'amb', ms: 2800 });
  return { ok: 'ok', detail: `ВЫКЛАДОК ${right}/3 · ШЛАНГИ ${ROUNDS}/${ROUNDS}` };
}
