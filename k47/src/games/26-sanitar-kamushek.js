/* ==========================================================================
   Глава 26 · «Санитар» — СОБРАТЬ ТЕЛА, НАЙТИ КАМУШЕК
   Двадцать три года в утилизации. Бирка. Мешок. Носилки. Машина.
   У одного тела сжата ладонь. В ней — серый тёплый камушек. Разожми,
   пока тело не ушло в мешок, и переложи камушек в форму нового клона.
   ========================================================================== */
defineFrag(25, {
  id: 'orderly', name: 'Камушек',
  text: 'Бирка. Мешок. Носилки. Машина. Иван разжал их. На ладони лежал камушек. Серый, гладкий, тёплый. Маленький, как медаль. Он записывал очередную запись — К-31, камушек передан К-32.',
  how: 'Для каждого тела — по порядку: БИРКА, МЕШОК, НОСИЛКИ, МАШИНА. Кнопки каждый раз на новых местах. Ошибка в порядке стоит времени. Смотри на руки: если ладонь сжата — разожми её до мешка. Потом переложи камушек в карман формы, пока охранник не смотрит.',
  keys: 'ДЕЙСТВИЯ — КНОПКИ ИЛИ 1–5 · ВРЕМЯ СМЕНЫ — 75 СЕКУНД',
  note: 'После этой главы проверяю карманы — камушка нет. Пока нет. Иван прятал блокнот под матрасом: «К-31, камушек передан К-32».',
  noteDist: 'В этой записи камушек ушёл в мешок вместе с телом. В печь. Архив говорит, что Иван его нашёл.',
  mem: 'СЕРЫЙ КАМУШЕК', start: gameOrderly,
});

function gameOrderly(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const N = 6, FIST = irand(2, 4), TIME = 75;
  let idx = 0, stepI = 0, opened = false, lost = false, found = false, t = 0, over = false, left = TIME, flash = 0, flashCol = '', bagAnim = 0;
  const ORDER = ['БИРКА', 'МЕШОК', 'НОСИЛКИ', 'МАШИНА'];
  const truck = scope.own(A.loopOsc({ type: 'sawtooth', freq: 38, vol: 0, lp: 140 }));
  truck.vol(0.03, 1);
  const box = ctx.el('div', 'ctl sn-btns');
  let btns = [];
  ctx.hint('БИРКА → МЕШОК → НОСИЛКИ → МАШИНА · СЖАТАЯ ЛАДОНЬ — РАЗЖАТЬ ДО МЕШКА');
  const upd = () => ctx.stat(`ТЕЛО ${Math.min(idx + 1, N)}/${N} · СМЕНА ${Math.max(0, Math.ceil(left))} С${found ? ' · КАМУШЕК У ТЕБЯ' : ''}`);

  return new Promise(resolve => {
    function layout() {
      box.innerHTML = '';
      const labels = shuffle([...ORDER, 'РАЗЖАТЬ ЛАДОНЬ']);
      btns = labels.map((l, k) => { const b = ctx.el('button', 'btn', box, `<b>${k + 1}</b> ${l}`); b.dataset.a = l; b.addEventListener('click', () => act(l)); return b; });
      upd();
    }
    ctx.keys(e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= btns.length && phase === 'bodies') { e.preventDefault(); act(btns[k - 1].dataset.a); } });
    let phase = 'bodies';
    function act(a) {
      if (over || phase !== 'bodies') return;
      const isFist = idx === FIST;
      if (a === 'РАЗЖАТЬ ЛАДОНЬ') {
        if (isFist && !opened && stepI <= 1) { opened = true; found = true; A.sfx.chime(520, 0.05); flash = 1; flashCol = '200,200,210'; ctx.say('На ладони лежал камушек. Серый, гладкий, тёплый.', { pos: 'top', cls: 'ice' }); scope.timeout(() => ctx.unsay('top'), 2200); }
        else { A.sfx.click(); ctx.say('Ладонь пустая.', { pos: 'mid' }); scope.timeout(() => ctx.unsay('mid'), 800); }
        return;
      }
      if (a !== ORDER[stepI]) { left -= 3; A.sfx.buzz(); flash = 1; flashCol = '255,0,51'; ctx.say('Не по процедуре. −3 с', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 900); return; }
      if (a === 'МЕШОК' && isFist && !opened) { lost = true; A.sfx.squelch(0.15); }
      stepI++;
      ({ 'БИРКА': () => A.sfx.click(), 'МЕШОК': () => A.sfx.squelch(0.12), 'НОСИЛКИ': () => A.sfx.thud(0.2), 'МАШИНА': () => A.sfx.thud(0.35) })[a]();
      if (stepI >= ORDER.length) {
        bagAnim = 1; idx++; stepI = 0; opened = false;
        if (idx >= N) toPocket(); else layout();
      }
      upd();
    }
    // охранник у ворот базы
    let look = 0, lookState = 'away', lookT = 2;
    async function toPocket() {
      phase = 'pocket'; box.innerHTML = '';
      if (!found) {
        over = true;
        A.sfx.glitch();
        await ctx.line('Шесть мешков. Машина ушла к печи.', { pos: 'top', ms: 2200 });
        ctx.say('НЕЙРОСЛЕПОК: РАСХОЖДЕНИЕ С ЗАПИСЬЮ', { pos: 'mid', cls: 'big red' });
        await scope.wait(2200);
        resolve({ ok: 'dist', detail: lost ? 'КАМУШЕК УШЁЛ В МЕШОК' : 'КАМУШЕК НЕ НАЙДЕН' });
        return;
      }
      ctx.hint('КНОПКА «В КАРМАН» — КОГДА ОХРАННИК НЕ СМОТРИТ');
      await ctx.line('Новая форма. Нашивка: К-32. Левый нагрудный карман.', { pos: 'top', ms: 2400 });
      const b = ctx.el('button', 'btn btn-primary big-btn', box, 'ПОЛОЖИТЬ В КАРМАН');
      scope.on(b, 'click', pocket);
      ctx.keys(e => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); pocket(); } });
    }
    let warned = 0;
    async function pocket() {
      if (over || phase !== 'pocket') return;
      if (look > 0.5) {
        warned++; left -= 4; A.sfx.buzz(); FX.shake('sm'); flash = 1; flashCol = '255,0,51';
        ctx.say(warned < 2 ? 'Охранник смотрит прямо на тебя.' : 'Охранник подошёл. Постоял. Ничего не сказал.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1500);
        return;
      }
      over = true; A.sfx.chime(700, 0.05); box.innerHTML = '';
      await ctx.line('Камушек лёг в карман. Он был тёплым — нагрелся от его руки.', { pos: 'top', ms: 2600 });
      await ctx.line('Вечером в блокноте: «К-31, камушек передан К-32».', { pos: 'top', cls: 'ice', ms: 2600 });
      resolve({ ok: 'ok', detail: `СМЕНА ${Math.ceil(left)} С В ЗАПАСЕ` });
    }

    layout();
    scope.loop(dt => {
      t += dt; flash = Math.max(0, flash - dt * 2); bagAnim = Math.max(0, bagAnim - dt * 2);
      if (!over) {
        left -= dt; upd();
        if (left <= 0) { over = true; (async () => { await ctx.line('Смена кончилась. Тела остались лежать до утра.', { pos: 'top', cls: 'red', ms: 2600 }); resolve({ ok: 'fail', detail: `ТЕЛ ${idx}/${N}` }); })(); }
        if (phase === 'pocket') {
          lookT -= dt;
          if (lookT <= 0) { lookState = lookState === 'away' ? 'look' : 'away'; lookT = lookState === 'look' ? rand(1.4, 2.6) : rand(1.6, 3.2); if (lookState === 'look') A.sfx.step(0.15, 0.4); }
          look += ((lookState === 'look' ? 1 : 0) - look) * Math.min(1, dt * 6);
        }
      }
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      drawCell(g, W, H, { t, tint: '210,220,215', floor: 0.55, seed: 26 });
      // труповозка на заднем плане
      g.fillStyle = '#16181a'; g.fillRect(W * 0.62, H * 0.3, W * 0.34, H * 0.24); g.fillStyle = `rgba(255,179,71,${0.5 + 0.5 * Math.sin(t * 6)})`; g.fillRect(W * 0.94, H * 0.32, W * 0.015, H * 0.02);
      if (phase === 'bodies') {
        // текущее тело на полу, вид сверху-сбоку
        const cx = W * 0.4, cy = H * 0.66, s = Math.min(W, H) * 0.34;
        g.save(); g.translate(cx, cy);
        if (stepI >= 2) { g.fillStyle = '#1f2a22'; Art.rr(g, -s * 0.62, -s * 0.16, s * 1.24, s * 0.32, s * 0.08); g.fill(); }
        if (stepI < 2) {
          g.fillStyle = '#0c0b0b';
          g.beginPath(); g.ellipse(0, 0, s * 0.5, s * 0.1, 0, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.arc(-s * 0.56, -s * 0.02, s * 0.08, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#f4f4f8'; g.fillRect(-s * 0.6, -s * 0.03, s * 0.022, s * 0.012); g.fillRect(-s * 0.56, -s * 0.03, s * 0.022, s * 0.012);
          Art.blood(g, s * 0.1, 0, s * 0.08, idx * 7 + 3, 0.7);
          // рука: у одного тела ладонь сжата
          const fist = idx === FIST && !opened;
          g.fillStyle = '#b8a89a'; g.beginPath(); g.arc(s * 0.2, s * 0.14, s * (fist ? 0.035 : 0.045), 0, Math.PI * 2); g.fill();
          if (fist) { g.strokeStyle = '#6a5a50'; g.lineWidth = 1.5; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(s * (0.18 + k * 0.015), s * 0.12); g.lineTo(s * (0.185 + k * 0.015), s * 0.16); g.stroke(); } }
          if (idx === FIST && opened) { g.fillStyle = '#8f9296'; g.beginPath(); g.ellipse(s * 0.2, s * 0.14, s * 0.018, s * 0.013, 0, 0, Math.PI * 2); g.fill(); }
          if (stepI >= 1) { g.fillStyle = '#e9e2d0'; g.fillRect(-s * 0.1, s * 0.07, s * 0.08, s * 0.05); g.fillStyle = '#1d2850'; g.font = `${Math.max(8, s * 0.03)}px ${MONO}`; g.fillText(`К-${30 + idx}`, -s * 0.095, s * 0.11); }
        }
        if (stepI >= 3) { g.fillStyle = '#4a4d50'; g.fillRect(-s * 0.7, s * 0.16, s * 1.4, s * 0.04); }
        g.restore();
        // остальные тела рядами
        for (let k = idx + 1; k < N; k++) { const x = W * (0.08 + (k - idx) * 0.1), y = H * 0.9; g.fillStyle = '#080707'; g.beginPath(); g.ellipse(x, y, W * 0.045, H * 0.018, 0, 0, Math.PI * 2); g.fill(); }
      } else {
        // форма К-32 на вешалке + охранник у ворот
        const fx = W * 0.4, fy = H * 0.2;
        g.fillStyle = '#23272b'; g.fillRect(fx - W * 0.1, fy, W * 0.2, H * 0.42);
        g.fillStyle = '#1a1d20'; g.fillRect(fx - W * 0.07, fy + H * 0.06, W * 0.05, H * 0.05);
        g.strokeStyle = 'rgba(255,179,71,.6)'; g.strokeRect(fx - W * 0.07, fy + H * 0.06, W * 0.05, H * 0.05);
        g.fillStyle = '#efe6cf'; g.font = `12px ${MONO}`; g.textAlign = 'center'; g.fillText('К-32', fx + W * 0.04, fy + H * 0.1);
        const gx = W * 0.8;
        g.save(); g.translate(gx, H * 0.75); g.scale(look > 0.5 ? -1 : 1, 1);
        Art.human(g, 0, 0, H * 0.46, 'soldier', { color: '#050505', visor: look > 0.5 ? '#ff1a2e' : '#330008' });
        g.restore();
      }
      // Иван в химзащите с зеркальным визором — ближний план
      Art.human(g, W * 0.08, H * 1.04, H * 0.6, 'doctor', { color: '#2e3a34' });
      g.fillStyle = 'rgba(200,220,230,.7)'; g.fillRect(W * 0.08 - H * 0.03, H * 1.04 - H * 0.6 * 0.93, H * 0.06, H * 0.02);
      if (bagAnim > 0) { g.fillStyle = `rgba(0,0,0,${bagAnim * 0.4})`; g.fillRect(0, 0, W, H); }
      if (flash > 0) { g.fillStyle = `rgba(${flashCol},${flash * 0.18})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.65);
    }
  });
}
