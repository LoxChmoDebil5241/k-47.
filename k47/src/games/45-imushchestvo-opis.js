/* ==========================================================================
   Глава 45 · «Имущество» — СВЕРИТЬ ОПИСЬ
   Акт приёма-передачи № К-48/НТ. Vitezstvi → NanoTrasen.
   По ленте едут позиции: капсулы 0047-К…, «Циклон-3», паяльные лампы,
   бирки, мешки, нейропрофили — и биомасса К-47, «белые глаза».
   Сверяй с актом: ПРИНЯТО или РАСХОЖДЕНИЕ. Потом — печать.
   ========================================================================== */
defineFrag(44, {
  id: 'property', name: 'Акт приёма-передачи',
  text: '1.3. Биомасса клона — регенерированный экземпляр тела К-47 на момент передачи. Состояние: стабильное, без физических повреждений, белые глаза.',
  how: 'Слева — выписка из акта. По ленте едут позиции. Совпадает с актом — «ПРИНЯТО». Номер, количество или модель не те — «РАСХОЖДЕНИЕ». На каждую позицию — несколько секунд. Нужно не больше трёх ошибок. В конце — печать.',
  keys: '1 / ENTER — ПРИНЯТО · 2 — РАСХОЖДЕНИЕ · 3 — ОСОБАЯ ОТМЕТКА · ПЕЧАТЬ — ЗАЖАТЬ ПРОБЕЛ',
  note: 'Меня передали вместе с центрифугой, паяльными лампами и сотней мешков для утилизации. Пункт 1.3: биомасса, белые глаза. Счёт циклов продолжается с 48.',
  noteDist: 'В этой описи кто-то поставил на пункте 1.3 отметку «не имущество». Архив говорит, что акт подписан без замечаний.',
  mem: 'ПУНКТ 1.3', start: gameProperty,
});

function gameProperty(ctx) {
  const { scope } = ctx;
  const ACT = [
    '1.1 Нейропрофиль К-47 — полная копия',
    '1.2 Нейропрофили К-0…К-47 — 48 ед.',
    '1.3 Биомасса клона К-47 — 1 экз.',
    '2.1 Капсулы «Регенератор-7М» — 0047-К, 0048-К, 0049-К',
    '2.2 Гель «Плацента-Ультра» — 500 л',
    '2.2 Светодиодные панели — 4 · аварийные лампы — 2',
    '2.4 Центрифуга «Циклон-3»',
    '2.4 Накопители геля — 2 × 250 л',
    '2.5 Скальпели, зажимы, ножницы — 3 набора',
    '2.5 Паяльные лампы — 5',
    '2.5 Мешки для утилизации — 100',
    '2.5 Маркировочные бирки — 500',
    '2.5 Биомониторы портативные — 4',
    'Прил. 3 Записи наблюдений Арины',
  ];
  const ITEMS = shuffle([
    { t: 'Капсула «Регенератор-7М» · № 0047-К', ok: true },
    { t: 'Капсула «Регенератор-7М» · № 0048-К', ok: true },
    { t: 'Капсула «Регенератор-7М» · № 0050-К', ok: false },
    { t: 'Центрифуга «Циклон-3»', ok: true },
    { t: 'Центрифуга «Циклон-4»', ok: false },
    { t: 'Накопители геля · 3 × 250 л', ok: false },
    { t: 'Паяльные лампы · 5 ед.', ok: true },
    { t: 'Мешки для утилизации · 100 шт.', ok: true },
    { t: 'Маркировочные бирки · 50 шт.', ok: false },
    { t: 'Биомониторы портативные · 4 ед.', ok: true },
    { t: 'Скальпели, зажимы, ножницы · 3 набора', ok: true },
    { t: 'Нейропрофили К-0…К-47 · 47 ед.', ok: false },
    { t: 'Гель «Плацента-Ультра» · 500 л', ok: true },
    { t: 'Записи наблюдений Арины · 1 папка', ok: true },
  ]);
  ITEMS.splice(irand(7, 11), 0, { t: 'Биомасса клона К-47 · 1 экз. · белые глаза', ok: true, body: true });
  const wrap = ctx.el('div', 'pr-wrap');
  const act = ctx.el('div', 'pr-act', wrap, `<p class="pr-h">АКТ № К-48/НТ · ВЫПИСКА</p>${ACT.map(a => `<p>${esc(a)}</p>`).join('')}`);
  const belt = ctx.el('div', 'pr-belt', wrap);
  const C = ctx.canvas(belt);
  const card = ctx.el('div', 'pr-card', belt);
  const ctl = ctx.el('div', 'ctl pr-ctl');
  const bOk = ctx.el('button', 'btn btn-primary', ctl, '<b>1</b> ПРИНЯТО');
  const bBad = ctx.el('button', 'btn', ctl, '<b>2</b> РАСХОЖДЕНИЕ');
  const bNot = ctx.el('button', 'btn pr-not', ctl, '<b>3</b> НЕ ИМУЩЕСТВО'); bNot.hidden = true;
  let i = -1, cur = null, left = 0, errors = 0, right = 0, over = false, t = 0, marked = false, slide = 0, stampK = 0, phase = 'check';
  const upd = () => ctx.stat(`ПОЗИЦИЯ ${Math.min(ITEMS.length, i + 1)}/${ITEMS.length} · ОШИБОК ${errors}/3`);
  ctx.hint('СВЕРЯЙ С АКТОМ СЛЕВА');
  const motor = scope.own(A.loopNoise({ type: 'lowpass', freq: 160, q: 1, vol: 0 }));
  motor.vol(0.04, 1);

  return new Promise(resolve => {
    function next() {
      i++; upd();
      if (i >= ITEMS.length) return stampPhase();
      cur = ITEMS[i]; left = cur.body ? 9 : 6.2; slide = 0;
      card.className = `pr-card${cur.body ? ' body' : ''}`; card.innerHTML = `<small>ПОЗИЦИЯ ${i + 1}</small><b>${esc(cur.t)}</b>`;
      bNot.hidden = !cur.body;
      if (cur.body) { A.sfx.heartbeat(0.3); ctx.say('В капсуле на ленте кто-то дышит.', { pos: 'top' }); scope.timeout(() => ctx.unsay('top'), 2200); }
    }
    function answer(k) {
      if (!cur || over || phase !== 'check') return;
      const c = cur; cur = null;
      if (c.body && k === 2) { marked = true; A.sfx.stamp(); card.classList.add('mark'); scope.timeout(next, 900); return; }
      const good = (k === 0) === c.ok && k !== 2;
      if (good) { right++; A.sfx.stamp(); card.classList.add('ok'); }
      else { errors++; A.sfx.buzz(); card.classList.add('bad'); }
      upd();
      if (errors > 3) { over = true; return fin(false); }
      scope.timeout(next, 650);
    }
    let hold = null;
    function stampPhase() {
      phase = 'stamp'; ctl.remove(); card.className = 'pr-card seal'; card.innerHTML = '<small>ПОДПИСЬ ПРИНИМАЮЩЕЙ СТОРОНЫ</small><b>Уполномоченный представитель Лотам-Тулш</b>';
      ctx.hint('ПЕЧАТЬ — ЗАЖМИ И ДЕРЖИ');
      hold = mgHold(ctx, 'ПОСТАВИТЬ ПЕЧАТЬ');
    }
    async function fin(ok) {
      over = true; motor.vol(0, 0.5);
      if (!ok) { await ctx.line('Опись не сошлась. Инвентаризация — в течение семи рабочих дней.', { pos: 'top', cls: 'red', ms: 2600 }); resolve({ ok: 'fail', detail: `ОШИБОК ${errors}` }); return; }
      await ctx.line('Акт подписан. Печати поставлены. Копии отправлены. Дело закрыто.', { pos: 'top', ms: 2800 });
      await ctx.line('7.4. Счёт циклов для актива К-47 продолжается с цикла 48.', { pos: 'top', cls: 'red', ms: 2600 });
      resolve(marked ? { ok: 'dist', detail: 'ОСОБАЯ ОТМЕТКА НА П. 1.3' } : { ok: 'ok', detail: `ВЕРНО ${right} · ОШИБОК ${errors}` });
    }
    scope.on(bOk, 'click', () => answer(0)); scope.on(bBad, 'click', () => answer(1)); scope.on(bNot, 'click', () => answer(2));
    ctx.keys(e => { if (e.key === '1' || e.key === 'Enter') { e.preventDefault(); answer(0); } else if (e.key === '2') answer(1); else if (e.key === '3' && cur && cur.body) answer(2); });
    next();
    scope.loop(dt => {
      t += dt; slide = Math.min(1, slide + dt * 2.5);
      if (!over && phase === 'check' && cur) { left -= dt; if (left <= 0) { errors++; A.sfx.buzz(); cur = null; card.classList.add('bad'); upd(); if (errors > 3) { fin(false); } else scope.timeout(next, 500); } }
      if (!over && phase === 'stamp' && hold) {
        if (hold.down) stampK += dt / 1.6; else stampK = Math.max(0, stampK - dt);
        if (stampK >= 1) { A.sfx.stamp(); FX.shake('sm'); card.classList.add('stamped'); fin(true); }
      }
      draw();
    });
    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#0d0e10'; g.fillRect(0, 0, W, H);
      // лента
      g.fillStyle = '#1a1b1e'; g.fillRect(0, H * 0.62, W, H * 0.2);
      g.fillStyle = 'rgba(255,255,255,.05)'; for (let x = -(t * 60 % 40); x < W; x += 40) g.fillRect(x, H * 0.62, 2, H * 0.2);
      if (phase === 'check' && i < ITEMS.length && ITEMS[i]) {
        const it = ITEMS[i], x = lerp(-W * 0.2, W * 0.5, easeOut(slide)), y = H * 0.62;
        if (it.body) {
          g.fillStyle = '#0f1a22'; Art.rr(g, x - W * 0.2, y - H * 0.24, W * 0.4, H * 0.22, 30); g.fill();
          g.fillStyle = 'rgba(80,180,230,.25)'; Art.rr(g, x - W * 0.19, y - H * 0.23, W * 0.38, H * 0.2, 26); g.fill();
          g.save(); g.translate(x, y - H * 0.13); g.rotate(-Math.PI / 2); Art.clone(g, 0, -H * 0.18, H * 0.34, { seed: 47, lines: false, scars: 0, skin: '#b6c0c7', t }); g.restore();
        } else {
          g.fillStyle = '#2a2c30'; g.fillRect(x - W * 0.12, y - H * 0.16, W * 0.24, H * 0.16);
          g.strokeStyle = 'rgba(255,255,255,.08)'; g.strokeRect(x - W * 0.12, y - H * 0.16, W * 0.24, H * 0.16);
          g.fillStyle = '#efe6cf'; g.fillRect(x - W * 0.05, y - H * 0.12, W * 0.1, H * 0.04);
        }
        g.fillStyle = 'rgba(255,0,51,.8)'; g.fillRect(0, H * 0.84, W * Math.max(0, left / (it.body ? 9 : 6.2)), 3);
      }
      if (phase === 'stamp') {
        const r = Math.min(W, H) * 0.16, x = W / 2, y = H * 0.45;
        g.strokeStyle = `rgba(74,168,216,${0.3 + stampK * 0.7})`; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
        g.fillStyle = `rgba(74,168,216,${stampK})`; g.font = `${Math.round(r)}px ${PIXEL}`; g.textAlign = 'center'; g.fillText('N', x, y + r * 0.35);
      }
      Art.vignette(g, W, H, 0.6);
    }
  });
}
