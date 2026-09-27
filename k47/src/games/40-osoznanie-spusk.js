/* ==========================================================================
   Глава 40 · «Осознание» — НЕ НАЖАТЬ
   К-42 на автомате: шаг, остановка, проверка угла. Серверная. Двое.
   Третья — нет, третий: ребёнок с его собственными глазами.
   Палец уже давит на спуск — сам. Держи его. Не нажимай.
   ========================================================================== */
defineFrag(39, {
  id: 'aware', name: 'Это был он',
  text: 'Он смотрел на ребёнка. И понял, что не может нажать на спуск. Он не мог убить это. Не потому что это был ребёнок. А потому что это был он.',
  how: 'Сначала — автомат: ШАГ (→) и ПРОВЕРКА УГЛА (↑) в такт подсказке. Потом серверная: тапни по вооружённым — так делал он сотни раз. Потом палец сам давит на спуск: держи «ОТПУСТИТЬ», чтобы не дать ему нажать. Сила кончается, давление растёт.',
  keys: '→ — ШАГ · ↑ — УГОЛ · ТАП — ВЫСТРЕЛ · ЗАЖАТЬ ПРОБЕЛ — ОТПУСТИТЬ СПУСК',
  note: 'Серверная. Двое, как всегда. Третий — мальчик с моими веснушками. Я не нажал. Я развернул автомат. Первый раз за сотни циклов я что-то почувствовал — и это было невыносимо.',
  noteDist: 'В этой записи палец дожал. Мальчик в синем комбинезоне. Архив говорит, что я развернул автомат к себе. Я не знаю, какой из нас врёт.',
  mem: 'ЗА ЧТО?', start: gameAware,
});

function gameAware(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const SEQ = ['R', 'R', 'U', 'R', 'U', 'R', 'R', 'U'];
  let t = 0, over = false, phase = 'auto', si = 0, beatT = 1.2, win = 0, miss = 0, flash = 0;
  let targets = [], pressure = 0, strength = 1, hold = null, holdT = 0, childT = 0, walk = 0;
  const HOLD_NEED = 9;
  const meterP = ctx.meter('СПУСК', { cls: 'red', left: 14, top: 14 });
  const meterS = ctx.meter('СИЛА', { cls: 'amb', left: 14, top: 44 });
  meterP.el.hidden = meterS.el.hidden = true;
  ctx.hint('ШАГ. ОСТАНОВКА. ПРОВЕРКА УГЛА.');
  const hum = scope.own(A.loopOsc({ type: 'sawtooth', freq: 50, vol: 0, lp: 300 }));
  hum.vol(0.025, 1);

  return new Promise(resolve => {
    function input(k) {
      if (over) return;
      if (phase === 'auto') {
        if (win > 0 && k === SEQ[si]) { win = 0; si++; walk += 1; A.sfx.step(0.25, rand(-0.3, 0.3)); if (si >= SEQ.length) roomPhase(); }
        else { miss++; A.sfx.click(); }
      }
    }
    function roomPhase() {
      phase = 'room'; ctx.hint('ТАП ПО ВООРУЖЁННЫМ');
      A.sfx.thud(0.4);
      targets = [{ x: 0.3, y: 0.62, h: 0.55, kind: 'man', alive: true, t: 0 }, { x: 0.72, y: 0.66, h: 0.5, kind: 'woman', alive: true, t: 0.8 }];
      ctx.say('Серверная. Двое.', { pos: 'top' }); scope.timeout(() => ctx.unsay('top'), 1600);
    }
    function childPhase() {
      phase = 'child'; childT = 0; meterP.el.hidden = meterS.el.hidden = false;
      ctx.hint('ПАЛЕЦ ДАВИТ САМ · ДЕРЖИ «ОТПУСТИТЬ»');
      targets = [{ x: 0.52, y: 0.7, h: 0.32, kind: 'child', alive: true, t: 0 }];
      hold = mgHold(ctx, 'ОТПУСТИТЬ СПУСК');
      ctx.say('Третий. Луч аварийного освещения упал на лицо.', { pos: 'top' }); scope.timeout(() => ctx.unsay('top'), 2400);
      hum.vol(0, 1.5);
    }
    async function shootChild() {
      over = true; A.sfx.gunfire(3, 0.35); FX.flash('#ffffff', 120, 0.6);
      await ctx.line('Палец дожал. Сам.', { pos: 'top', cls: 'red', ms: 2200 });
      await ctx.line('Тишина. Как всегда. Процедура та же.', { pos: 'top', ms: 2600 });
      resolve({ ok: 'dist', detail: 'ПАЛЕЦ ДОЖАЛ' });
    }
    async function turn() {
      over = true; if (hold) hold.wrap.remove();
      await ctx.line('Он развернул автомат. Холодный металл коснулся маски.', { pos: 'top', ms: 2600 });
      A.sfx.shot(0.6); FX.flash('#ffffff', 160, 0.7);
      await ctx.line('Свет погас.', { pos: 'mid', cls: 'big', ms: 2000 });
      resolve({ ok: 'ok', detail: `ПРОМАХОВ ТАКТА ${miss}` });
    }
    scope.on(C.cv, 'pointerdown', e => {
      if (over || phase === 'auto') return;
      const r = C.cv.getBoundingClientRect(), x = (e.clientX - r.left) / C.W, y = (e.clientY - r.top) / C.H;
      const tg = targets.find(o => o.alive && Math.abs(o.x - x) < 0.08 && y > o.y - o.h * 0.9 && y < o.y + 0.05);
      if (!tg) return;
      if (tg.kind === 'child') { shootChild(); return; }
      tg.alive = false; A.sfx.gunfire(2, 0.3); flash = 1;
      if (targets.every(o => !o.alive)) scope.timeout(childPhase, 1300);
    });
    ctx.keys(e => {
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); input('R'); }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); input('U'); }
    });
    const bR = ctx.el('button', 'btn ao-btn', ctx.el('div', 'ctl ao-ctl'), '→ ШАГ');
    const bU = ctx.el('button', 'btn ao-btn', bR.parentNode, '↑ УГОЛ');
    scope.on(bR, 'click', () => input('R')); scope.on(bU, 'click', () => input('U'));

    scope.loop(dt => {
      t += dt; flash = Math.max(0, flash - dt * 3);
      if (!over) {
        if (phase === 'auto') {
          beatT -= dt; if (win > 0) { win -= dt; if (win <= 0) { miss++; si++; walk += 1; if (si >= SEQ.length) roomPhase(); } }
          if (beatT <= 0 && win <= 0 && phase === 'auto') { beatT = 0.95; win = 0.85; A.sfx.beep(SEQ[si] === 'R' ? 600 : 900, 0.04, 0.025); }
          ctx.stat(`МАРШРУТ ${si}/${SEQ.length}`);
        } else if (phase === 'room') {
          targets.forEach(o => { if (o.alive) { o.t += dt; if (o.t > 3.2) { o.alive = false; A.sfx.gunfire(2, 0.3); flash = 1; if (targets.every(q => !q.alive)) scope.timeout(childPhase, 1300); } } });
          bR.disabled = bU.disabled = true;
        } else if (phase === 'child') {
          childT += dt;
          const down = hold && hold.down && strength > 0;
          pressure += dt * (0.1 + childT * 0.012) - (down ? dt * 0.34 : 0);
          strength += down ? -dt * 0.09 : dt * 0.05;
          pressure = clamp(pressure, 0, 1); strength = clamp(strength, 0, 1);
          if (down) holdT += dt;
          meterP.set(pressure); meterS.set(strength);
          if (Math.random() < dt * (1 + pressure * 5)) A.sfx.heartbeat(0.2 + pressure * 0.4);
          ctx.stat(`УДЕРЖАНО ${Math.min(HOLD_NEED, holdT).toFixed(1)} / ${HOLD_NEED} С`);
          if (pressure >= 1) shootChild();
          else if (holdT >= HOLD_NEED) turn();
        }
      }
      draw();
    });
    function draw() {
      const { g, W, H } = C;
      if (phase === 'auto') {
        g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, W, H);
        // коридор в перспективе, стыки пола уезжают
        g.strokeStyle = 'rgba(107,107,112,.35)'; g.lineWidth = 1;
        for (let i = 0; i < 12; i++) { const k = ((i + walk * 0.5 + (1 - beatT)) % 12) / 12, y = H * 0.5 + k * k * H * 0.5; g.beginPath(); g.moveTo(W * 0.5 - k * W * 0.6, y); g.lineTo(W * 0.5 + k * W * 0.6, y); g.stroke(); }
        g.beginPath(); g.moveTo(W * 0.5, H * 0.5); g.lineTo(-W * 0.1, H); g.moveTo(W * 0.5, H * 0.5); g.lineTo(W * 1.1, H); g.stroke();
        if (win > 0) { const s = SEQ[si]; g.fillStyle = `rgba(239,230,207,${0.4 + win})`; g.font = `${Math.round(H * 0.08)}px ${PIXEL}`; g.textAlign = 'center'; g.fillText(s === 'R' ? '→ ШАГ' : '↑ УГОЛ', W / 2, H * 0.3); }
        // автомат снизу
        g.fillStyle = '#141518'; g.fillRect(W * 0.55, H * 0.8, W * 0.3, H * 0.08); g.fillRect(W * 0.6, H * 0.86, W * 0.05, H * 0.14);
      } else {
        g.fillStyle = '#0d0707'; g.fillRect(0, 0, W, H);
        // стойки серверов
        for (let i = 0; i < 7; i++) { const x = W * (0.02 + i * 0.14); g.fillStyle = '#121416'; g.fillRect(x, H * 0.12, W * 0.1, H * 0.62); for (let k = 0; k < 14; k++) { g.fillStyle = Math.sin(t * 6 + i * 3 + k) > 0.6 ? '#00ff88' : '#113322'; g.fillRect(x + W * 0.01, H * (0.15 + k * 0.04), 3, 3); } }
        g.fillStyle = 'rgba(138,10,24,.35)'; g.beginPath(); g.ellipse(W * 0.35, H * 0.82, W * 0.2, H * 0.05, 0, 0, Math.PI * 2); g.fill();
        targets.forEach(o => {
          if (o.kind === 'child') {
            const x = o.x * W, base = o.y * H, h = o.h * H;
            // луч аварийного света на лице
            const gr = g.createRadialGradient(x, base - h * 0.85, 0, x, base - h * 0.85, h * 0.6);
            gr.addColorStop(0, 'rgba(255,236,200,.35)'); gr.addColorStop(1, 'rgba(255,236,200,0)');
            g.fillStyle = gr; g.fillRect(x - h, base - h * 1.6, h * 2, h * 1.6);
            Art.human(g, x, base, h, 'child', { color: '#1d2850' });
            const hy = base - h * 0.905, hr = h * 0.08;
            g.fillStyle = '#c9b5a2'; g.beginPath(); g.ellipse(x, hy, hr * 0.85, hr, 0, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#3b2412'; g.beginPath(); g.arc(x - hr * 0.35, hy - hr * 0.1, hr * 0.14, 0, Math.PI * 2); g.arc(x + hr * 0.35, hy - hr * 0.1, hr * 0.14, 0, Math.PI * 2); g.fill();
            g.fillStyle = 'rgba(120,70,40,.8)'; for (let k = 0; k < 7; k++) g.fillRect(x - hr * 0.3 + (k % 4) * hr * 0.18, hy + hr * 0.05 + (k > 3 ? hr * 0.1 : 0), 1.2, 1.2);
            // прицел сам ползёт к нему
            const jx = x + Math.sin(t * 7) * (1 - pressure) * 16, jy = hy + Math.cos(t * 5) * (1 - pressure) * 12;
            drawReticle(g, jx, jy, `rgba(255,${40 + (1 - pressure) * 150 | 0},70,.95)`, 22 - pressure * 8);
            return;
          }
          if (!o.alive) { g.fillStyle = '#060606'; g.fillRect(o.x * W - 30, o.y * H - 10, 60, 14); return; }
          Art.human(g, o.x * W, o.y * H, o.h * H, o.kind, { color: '#050505' });
        });
        if (phase === 'child') { g.fillStyle = `rgba(0,0,0,${0.3 + pressure * 0.3})`; g.fillRect(0, 0, W, H * 0.08); g.fillRect(0, H * 0.92, W, H * 0.08); }
      }
      if (flash > 0) { g.fillStyle = `rgba(255,220,150,${flash * 0.25})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.75);
    }
  });
}
