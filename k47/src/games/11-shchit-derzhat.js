/* ==========================================================================
   Глава 11 · «Щит» — ДЕРЖАТЬ
   Двадцать учёных прижались к гермоворотам. К-21 — единственный между ними
   и рейдерами. Рейдеры высовываются на трёх уровнях; подавляй того, кто
   вот-вот выстрелит, пока челнок не закроет ворота. Боль — топливо.
   ========================================================================== */
defineFrag(10, {
  id: 'shield', name: 'Держать',
  text: '«Я нужен», — пронеслось в голове. Не пафосно, не громко. Тихо, как выдох. «Я не просто расходник. Я — тот, кто держит. Пока я стою — они живы».',
  how: 'Рейдеры высовываются из-за укрытий на трёх уровнях и берут на прицел ворота. Бей по уровню, где целятся, — подавленный рейдер прячется. Пропустишь выстрел — упадёт кто-то за стеклом. Держи, пока не закроются ворота: нужно, чтобы выжило не меньше пятнадцати.',
  keys: 'ТАП ПО УРОВНЮ · КЛАВИШИ 1 / 2 / 3 ИЛИ ↑ / → / ↓',
  note: 'Щит не чувствует боли. Щит не имеет лица. Она прошептала «прости» сквозь стекло — и запомнила меня, даже когда лица уже не было.',
  mem: '«ПРОСТИ» СКВОЗЬ СТЕКЛО', start: gameShield,
});

function gameShield(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const DUR = 38;
  let alive = 20, t = 0, over = false, body21 = 1, flashLane = -1, flashT = 0, muzzle = 0, heat = 0, jam = 0;
  const heatM = ctx.meter('СТВОЛ', { cls: 'amb', left: 14, top: 14 });
  const lanes = [0, 1, 2].map(i => ({ i, r: null, next: rand(1, 3) + i * 0.7 }));
  const drone = scope.own(A.loopOsc({ type: 'sawtooth', freq: 44, vol: 0, lp: 200 }));
  drone.vol(0.03, 1);
  const btnBox = ctx.el('div', 'ctl sh-lanes');
  const btns = ['▲ ВЕРХ', '▶ СЕРЕДИНА', '▼ НИЗ'].map((l, i) => ctx.el('button', 'btn big-btn', btnBox, l));
  ctx.hint('БЕЙ ПО УРОВНЮ, ГДЕ РЕЙДЕР ЦЕЛИТСЯ · КРАСНАЯ РАМКА — СЕЙЧАС ВЫСТРЕЛИТ');
  ctx.say('Узкий коридор превратился в адскую пробку из криков и крови.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2600);
  const upd = () => ctx.stat(`ЗА СТЕКЛОМ ${alive} · ВОРОТА ${Math.max(0, Math.ceil(DUR - t))} С`);

  return new Promise(resolve => {
    btns.forEach((b, i) => scope.on(b, 'pointerdown', e => { e.preventDefault(); fire(i); }));
    function fire(i) {
      if (over) return;
      if (jam > 0) { A.sfx.click(); return; }
      heat += 0.24;
      if (heat >= 1) { jam = 1.3; heat = 1; A.sfx.buzz(); ctx.say('Ствол перегрет — не бей в пустоту.', { pos: 'mid', cls: 'amb' }); scope.timeout(() => ctx.unsay('mid'), 1200); }
      muzzle = 0.12; flashLane = i; flashT = 0.2;
      A.sfx.gunfire(3, 0.18);
      const L = lanes[i];
      if (L.r && L.r.state !== 'down') { L.r.state = 'down'; L.r.t = 0; A.sfx.thud(0.15); L.next = rand(1.2, 2.6); }
    }
    ctx.keys(e => {
      const m = { Digit1: 0, Digit2: 1, Digit3: 2, ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, KeyW: 0, KeyD: 1, KeyS: 2 }[e.code];
      if (m !== undefined) { e.preventDefault(); fire(m); }
    });
    async function end() {
      over = true; drone.vol(0, 1);
      if (alive >= 15) {
        A.sfx.thud(0.8); A.sfx.hiss(1, 0.1);
        await ctx.line('Гермоворота сомкнулись. Челнок ушёл.', { pos: 'top', ms: 2400 });
        body21 = 0;
        await ctx.line('Он падал. Одна из женщин обернулась.', { pos: 'top', ms: 2400 });
        await ctx.line('«Прости…»', { pos: 'mid', cls: 'ice big', ms: 2400 });
        resolve({ ok: 'ok', detail: `СПАСЕНО ${alive} ИЗ 20` });
      } else {
        A.sfx.gunfire(8, 0.3); FX.flash('#ff2200', 500, 0.6);
        await ctx.line(`Ворота закрылись над ${alive} живыми. Остальные остались в коридоре.`, { pos: 'top', cls: 'red', ms: 3000 });
        resolve({ ok: 'fail', detail: `СПАСЕНО ${alive} · НУЖНО 15` });
      }
    }

    scope.loop(dt => {
      t += dt;
      if (!over) {
        const hard = 1 + t / DUR * 0.8;
        lanes.forEach(L => {
          if (!L.r) { L.next -= dt * hard; if (L.next <= 0) { L.r = { state: 'rise', t: 0, aim: rand(1.1, 1.8) / hard }; A.sfx.step(0.12, 0.6); } return; }
          const r = L.r; r.t += dt;
          if (r.state === 'rise' && r.t > 0.35) { r.state = 'aim'; r.t = 0; A.sfx.beep(1500 - L.i * 200, 0.05, 0.02); }
          else if (r.state === 'aim' && r.t > r.aim) {
            r.state = 'shoot'; r.t = 0;
            A.sfx.gunfire(4, 0.25); FX.shake('sm');
            const lost = Math.random() < 0.5 ? 1 : 2; alive = Math.max(0, alive - lost);
            body21 = Math.max(0.15, body21 - 0.04);
            ctx.say(pick(['За спиной — сдавленные рыдания.', 'Кто-то за стеклом упал.', 'Пуля прошла мимо щита.']), { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1100);
          } else if (r.state === 'shoot' && r.t > 0.5) { r.state = 'down'; r.t = 0; }
          else if (r.state === 'down' && r.t > 0.4) { L.r = null; L.next = rand(0.8, 2.2); }
        });
        // К-21 принимает пули телом — просто держит
        if (Math.random() < dt * 0.8) { body21 = Math.max(0.15, body21 - 0.01); }
        upd();
        if (t >= DUR) end();
      }
      muzzle = Math.max(0, muzzle - dt); flashT = Math.max(0, flashT - dt);
      jam = Math.max(0, jam - dt); heat = Math.max(0, heat - dt * 0.38); heatM.set(heat); heatM.label(jam > 0 ? 'СТВОЛ ПЕРЕГРЕТ' : 'СТВОЛ');
      btns.forEach((b, i) => b.classList.toggle('pulse', !!(lanes[i].r && lanes[i].r.state === 'aim')));
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#07080a'; g.fillRect(0, 0, W, H);
      // коридор
      g.fillStyle = '#101216'; g.fillRect(0, H * 0.08, W, H * 0.8);
      for (let x = 0; x < W; x += 70) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x, H * 0.08, 4, H * 0.8); }
      // гермоворота со стеклом и учёными
      const gw = W * 0.2;
      g.fillStyle = '#1c2228'; g.fillRect(0, H * 0.08, gw, H * 0.8);
      g.fillStyle = 'rgba(136,221,255,.12)'; g.fillRect(gw * 0.12, H * 0.2, gw * 0.76, H * 0.5);
      g.strokeStyle = 'rgba(136,221,255,.4)'; g.strokeRect(gw * 0.12, H * 0.2, gw * 0.76, H * 0.5);
      for (let i = 0; i < 20; i++) {
        const x = gw * (0.18 + (i % 5) * 0.16), row = Math.floor(i / 5), y = H * (0.4 + row * 0.08);
        if (i < alive) Art.human(g, x, y + H * 0.1, H * 0.16, i % 3 === 0 ? 'woman' : 'doctor', { color: 'rgba(210,230,240,.65)' });
        else { g.fillStyle = 'rgba(120,0,10,.7)'; g.fillRect(x - 6, y + H * 0.08, 12, 4); }
      }
      // три уровня укрытий рейдеров справа
      const ys = [0.26, 0.5, 0.74];
      ys.forEach((yy, i) => {
        const y = H * yy, L = lanes[i], x = W * 0.84;
        g.fillStyle = '#16181c'; g.fillRect(x - W * 0.06, y - H * 0.02, W * 0.12, H * 0.09);
        if (L.r) {
          const up = L.r.state === 'rise' ? L.r.t / 0.35 : L.r.state === 'down' ? Math.max(0, 1 - L.r.t / 0.4) : 1;
          g.save(); g.beginPath(); g.rect(x - W * 0.1, y - H * 0.2, W * 0.2, H * 0.19); g.clip();
          Art.raider(g, x, y + H * 0.02 + (1 - up) * H * 0.16, H * 0.2, { dir: -1, t, claws: i === 1 });
          g.restore();
          if (L.r.state === 'aim') { const k = L.r.t / L.r.aim; g.strokeStyle = `rgba(255,0,51,${0.4 + k * 0.6})`; g.lineWidth = 2 + k * 2; g.strokeRect(x - W * 0.08, y - H * 0.19, W * 0.16, H * 0.2); g.setLineDash([6, 6]); g.beginPath(); g.moveTo(x - W * 0.06, y - H * 0.1); g.lineTo(gw, H * 0.45); g.stroke(); g.setLineDash([]); }
          if (L.r.state === 'shoot') { g.fillStyle = 'rgba(255,220,150,.9)'; g.beginPath(); g.arc(x - W * 0.07, y - H * 0.1, 10, 0, Math.PI * 2); g.fill(); }
        }
        if (flashLane === i && flashT > 0) { g.strokeStyle = `rgba(255,240,200,${flashT * 4})`; g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.38, H * 0.5); g.lineTo(x - W * 0.05, y - H * 0.08); g.stroke(); }
      });
      // К-21 — боевая броня, белые глаза, пластины висят лоскутами
      const kx = W * 0.36, kb = H * 0.86;
      g.save(); if (over && body21 === 0) { g.translate(kx, kb); g.rotate(-1.2); g.translate(-kx, -kb); }
      Art.human(g, kx, kb, H * 0.62, 'soldier', { color: '#0b0c0e', visor: '#ff1a2e' });
      g.fillStyle = '#fff'; g.fillRect(kx - 5, kb - H * 0.62 * 0.93, 3, 2); g.fillRect(kx + 2, kb - H * 0.62 * 0.93, 3, 2);
      const dmg = 1 - body21;
      for (let i = 0; i < dmg * 10; i++) Art.blood(g, kx + (i % 3 - 1) * H * 0.04, kb - H * (0.2 + (i * 0.037) % 0.35), H * 0.02, i + 5, 0.9);
      g.restore();
      if (muzzle > 0) { g.fillStyle = 'rgba(255,230,160,.95)'; g.beginPath(); g.arc(kx + H * 0.08, kb - H * 0.4, 12, 0, Math.PI * 2); g.fill(); }
      Art.vignette(g, W, H, 0.7);
      Art.grain(g, W, H, 0.05);
    }
  });
}
