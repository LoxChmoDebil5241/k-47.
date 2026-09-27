/* ==========================================================================
   Глава 2 · «Вторжение» — ПОСАДКА В БУРЮ
   Шаттл «Невидимый» изображает аварию. Буря сносит нос — держи метку курса
   в окне глиссады до самых ворот «Горн-12». Вне окна — корпус трещит.
   ========================================================================== */
defineFrag(1, {
  id: 'landing', name: 'Посадка в бурю',
  text: '— Не беспокойтесь о шуме. Снаружи бушует буря — она заглушит всё. В визоре вспыхнула зелёная надпись: «Невидимый», вы вызывали? Вас не видно на радаре. Подтвердите аварию.',
  how: 'Буря сносит шаттл. Держи метку курса внутри зелёного окна глиссады, пока высота не упадёт до нуля. Порывы ветра предупреждают о себе вспышкой — компенсируй заранее. Вне окна корпус получает повреждения.',
  keys: 'ВЕДИ ПАЛЬЦЕМ / МЫШЬЮ ПО ЭКРАНУ · СТРЕЛКИ ИЛИ WASD',
  note: 'Они открыли ворота на сигнал бедствия. Я держал курс ровно. Мы все держали — навстречу чужим людям, которые нас ждали.',
  mem: 'ВОРОТА ГОРН-12', start: gameLanding,
});

function gameLanding(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const hullM = ctx.meter('КОРПУС', { cls: 'ok', left: 14, top: 14 });
  const DUR = 42;
  let t = 0, alt = 3000, hull = 1, over = false;
  const ship = { x: 0, y: 0, vx: 0, vy: 0 };
  const win = { x: 0, y: 0, w: 0.26 };
  let gust = null, nextGust = 3, warnT = 0;
  const keys = {};
  let ptr = null;
  const flakes = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() }));
  const wind = scope.own(A.loopNoise({ type: 'bandpass', freq: 500, q: 0.6, vol: 0 }));
  const eng = scope.own(A.loopOsc({ type: 'sawtooth', freq: 58, vol: 0, lp: 240 }));
  wind.vol(0.08, 1); eng.vol(0.04, 1);
  const LINES = [
    [2, '«Невидимый», вы вызывали? Вас не видно на радаре.', 'ice'],
    [8, 'Подтвердите аварию.', 'ice'],
    [15, '— Три минуты до касания. Всем приготовиться к аварийной посадке.', ''],
    [24, 'Сигнал бедствия принят… открываю ворота.', 'ice'],
    [33, '— Последнее, что они услышат, — это наши выстрелы.', 'red'],
  ];
  let li = 0;
  ctx.hint('ДЕРЖИ МЕТКУ В ЗЕЛЁНОМ ОКНЕ · ВСПЫШКА — ПОРЫВ ВЕТРА');

  return new Promise(resolve => {
    scope.on(body, 'pointerdown', e => { e.preventDefault(); ptr = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { body.setPointerCapture(e.pointerId); } catch { /* */ } });
    scope.on(body, 'pointermove', e => {
      if (!ptr || ptr.id !== e.pointerId) return;
      const k = 0.9 / Math.min(C.W, C.H);
      ship.vx += (e.clientX - ptr.x) * k * 2.2; ship.vy += (e.clientY - ptr.y) * k * 2.2;
      ptr.x = e.clientX; ptr.y = e.clientY;
    });
    const up = () => { ptr = null; };
    scope.on(body, 'pointerup', up); scope.on(body, 'pointercancel', up);
    ctx.keys(e => { if (/^(Arrow|Key[WASD])/.test(e.code)) { e.preventDefault(); keys[e.code] = true; } });
    scope.on(document, 'keyup', e => { keys[e.code] = false; });

    async function end(ok) {
      over = true; wind.vol(0.02, 0.5); eng.vol(0, 0.5);
      if (ok) {
        A.sfx.thud(0.6); FX.shake('sm');
        await ctx.line('Касание. Ворота «Горн-12» открыты.', { pos: 'mid', ms: 2200 });
        await ctx.line('«Вскрыть».', { pos: 'mid', cls: 'red big', ms: 1800 });
        resolve({ ok: 'ok', detail: `КОРПУС ${Math.round(hull * 100)}%` });
      } else {
        A.sfx.shot(0.6); A.sfx.thud(0.8); FX.shake('lg'); FX.flash('#ffffff', 500, 0.8);
        await ctx.line('Шаттл разорвало о лёд за километр до ворот.', { pos: 'mid', cls: 'red', ms: 2600 });
        resolve({ ok: 'fail', detail: `ВЫСОТА ${Math.round(alt)} М` });
      }
    }

    scope.loop(dt => {
      t += dt;
      if (!over) {
        // окно глиссады медленно плывёт
        win.x = Math.sin(t * 0.37) * 0.22 + Math.sin(t * 0.91) * 0.08;
        win.y = Math.cos(t * 0.29) * 0.12 + Math.sin(t * 1.3) * 0.04;
        win.w = lerp(0.3, 0.2, t / DUR);
        // порывы ветра
        nextGust -= dt;
        if (!gust && nextGust <= 0) { gust = { ax: rand(-1, 1), ay: rand(-0.6, 0.6), t: 1.2, warn: 0.9 }; warnT = 0.9; A.sfx.whoosh(0.18); }
        if (gust) {
          if (gust.warn > 0) gust.warn -= dt;
          else { ship.vx += gust.ax * dt * 0.5; ship.vy += gust.ay * dt * 0.5; gust.t -= dt; if (gust.t <= 0) { gust = null; nextGust = rand(1.8, 3.6); } }
        }
        warnT = Math.max(0, warnT - dt);
        // турбулентность + управление
        ship.vx += (Math.sin(t * 7.3) * 0.12 + (Math.random() - 0.5) * 0.3) * dt;
        ship.vy += (Math.cos(t * 6.1) * 0.1 + (Math.random() - 0.5) * 0.25) * dt;
        const kx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
        const ky = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
        ship.vx += kx * dt * 1.4; ship.vy += ky * dt * 1.4;
        ship.vx *= Math.pow(0.35, dt); ship.vy *= Math.pow(0.35, dt);
        ship.x = clamp(ship.x + ship.vx * dt, -0.6, 0.6); ship.y = clamp(ship.y + ship.vy * dt, -0.45, 0.45);
        const dx = Math.abs(ship.x - win.x), dy = Math.abs(ship.y - win.y);
        const inside = dx < win.w / 2 && dy < win.w / 2.6;
        if (!inside) { hull -= dt * 0.06 * (1 + Math.max(dx, dy) * 3); if (Math.random() < dt * 3) { A.sfx.creak(0.12); } }
        hullM.set(hull);
        alt = Math.max(0, 3000 * (1 - t / DUR));
        eng.freq(58 + (inside ? 0 : 20));
        while (li < LINES.length && t >= LINES[li][0]) { const [, s, c] = LINES[li++]; ctx.say(s, { pos: 'top', cls: c }); scope.timeout(() => ctx.unsay('top'), 3600); }
        ctx.stat(`ВЫСОТА ${Math.round(alt)} М · КОРПУС ${Math.max(0, Math.round(hull * 100))}%`);
        if (hull <= 0) end(false);
        else if (t >= DUR) end(true);
      }
      draw();
    });

    function draw() {
      const { g, W, H } = C, cx = W / 2, cy = H * 0.5, S = Math.min(W, H);
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#05080d'); sky.addColorStop(1, '#0e1822');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      // лёд внизу и огни ворот ближе к концу
      const k = t / DUR;
      g.fillStyle = `rgba(143,176,196,${0.08 + k * 0.25})`; g.fillRect(0, H * (0.9 - k * 0.25), W, H);
      if (k > 0.55) {
        const gx = cx + (win.x) * S, gy = cy + win.y * S + (1 - k) * S * 0.4, a = (k - 0.55) * 2;
        for (let i = -3; i <= 3; i++) { g.fillStyle = `rgba(255,${i % 2 ? 60 : 200},60,${a * (0.5 + 0.5 * Math.sin(t * 6 + i))})`; g.fillRect(gx + i * S * 0.05 * (0.5 + k), gy, 4, 4); }
      }
      // метель
      g.fillStyle = 'rgba(200,225,240,.7)';
      for (const f of flakes) {
        f.y += (0.4 + f.z) * 0.012 * (1 + (gust && gust.warn <= 0 ? 2 : 0)); f.x += (gust && gust.warn <= 0 ? gust.ax * 0.02 : 0.004) * (0.5 + f.z);
        if (f.y > 1) { f.y = 0; f.x = Math.random(); } if (f.x > 1) f.x = 0; if (f.x < 0) f.x = 1;
        const sz = 1 + f.z * 2.2; g.fillRect(f.x * W, f.y * H, sz, sz * (1 + f.z));
      }
      // окно глиссады
      const wx = cx + win.x * S, wy = cy + win.y * S, ww = win.w * S, wh = win.w * S / 1.3;
      const inside = Math.abs(ship.x - win.x) < win.w / 2 && Math.abs(ship.y - win.y) < win.w / 2.6;
      g.strokeStyle = inside ? 'rgba(0,255,136,.9)' : 'rgba(0,255,136,.45)'; g.lineWidth = 2;
      const c = 14;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { const x = wx + sx * ww / 2, y = wy + sy * wh / 2; g.beginPath(); g.moveTo(x - sx * c, y); g.lineTo(x, y); g.lineTo(x, y - sy * c); g.stroke(); });
      for (let i = 1; i <= 3; i++) { g.strokeStyle = `rgba(0,255,136,${0.12 / i})`; g.strokeRect(wx - ww / 2 * (1 + i * 0.6), wy - wh / 2 * (1 + i * 0.6), ww * (1 + i * 0.6), wh * (1 + i * 0.6)); }
      // метка шаттла
      const sx = cx + ship.x * S, sy = cy + ship.y * S;
      drawReticle(g, sx, sy, inside ? 'rgba(160,255,200,.95)' : 'rgba(255,60,90,.95)', 14);
      // визор: рамка, зелёный HUD, красная аварийка
      g.fillStyle = `rgba(255,0,30,${0.05 + 0.05 * Math.sin(t * 5)})`; g.fillRect(0, 0, W, H);
      if (warnT > 0) { g.fillStyle = `rgba(255,179,71,${warnT * 0.35})`; g.fillRect(0, 0, W, H); g.fillStyle = '#ffb347'; g.font = `12px ${MONO}`; g.textAlign = 'center'; g.fillText('ПОРЫВ ВЕТРА', W / 2, H * 0.86); }
      g.fillStyle = 'rgba(0,255,136,.8)'; g.font = `11px ${MONO}`; g.textAlign = 'left';
      g.fillText(`ВЫС ${Math.round(alt)}`, 16, H - 40); g.fillText(`КРС ${(ship.x * 100).toFixed(0)}`, 16, H - 24);
      g.textAlign = 'right'; g.fillText('«НЕВИДИМЫЙ» · SOS', W - 16, H - 24);
      if (hull < 0.35) { g.strokeStyle = `rgba(255,255,255,${0.5 - hull})`; g.lineWidth = 1; const R = mulberry(9); for (let i = 0; i < 6; i++) { let x = R() * W, y = R() * H; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (R() - 0.5) * 80; y += (R() - 0.5) * 80; g.lineTo(x, y); } g.stroke(); } }
      Art.vignette(g, W, H, 0.8);
      Art.scan(g, W, H, 0.1);
    }
  });
}
