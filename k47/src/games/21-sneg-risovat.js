/* ==========================================================================
   Глава 21 · «Снег» — РИСОВАТЬ СНЕГ
   К-29 касается экрана — и идёт снег. Медленные касания рождают снежинки,
   они падают и ложатся сугробом. Резкие — только помехи. Засыпь экран,
   пока мигающая лампа не погасила его.
   ========================================================================== */
defineFrag(20, {
  id: 'snow', name: 'Рисовать снег',
  text: 'Снег шёл. Он падал на землю — белую, мягкую. Её не было в комнате. Только на экране. Но К-29 чувствовал её под ногами. Слышал, как она хрустит. Чувствовал, как холод проникает сквозь подошвы, но не причиняет боли. Только напоминает о жизни.',
  how: 'Веди пальцем или мышью по тёмному экрану — медленно. Из медленных штрихов падает снег и ложится сугробом. Быстрые штрихи рождают только серые помехи и гасят экран. Засыпь его снегом, пока лампа не погасла.',
  keys: 'ВЕДИ ПАЛЬЦЕМ / МЫШЬЮ, ЗАЖАВ · СТРЕЛКИ + ПРОБЕЛ — ВЕСТИ «ПАЛЕЦ» С КЛАВИАТУРЫ',
  note: 'Снег таял на пальцах, оставляя холод. Холод был приятным. Он напоминал, что я жив. Кто-то ответил за экран: привет, К-29.',
  mem: 'СНЕГ НА ЭКРАНЕ', start: gameSnow,
});

function gameSnow(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const snowM = ctx.meter('СНЕГ', { cls: 'ice', left: 14, top: 14 });
  const DUR = 50;
  let t = 0, over = false, fill = 0, dim = 0, down = false, last = null, speed = 0, statics = [];
  const flakes = [], drift = new Float32Array(64);
  const key = { x: 0.5, y: 0.4, on: false, k: {} };
  const wind = scope.own(A.loopNoise({ type: 'lowpass', freq: 900, q: 0.3, vol: 0 }));
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 50, vol: 0 }));
  hum.vol(0.02, 1);
  ctx.hint('МЕДЛЕННО — СНЕГ · БЫСТРО — ПОМЕХИ · ЛАМПА МИГАЕТ, ЭКРАН ГАСНЕТ');
  ctx.say('Он поднял руку. Пальцы коснулись поверхности.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2400);

  return new Promise(resolve => {
    const scr = () => ({ x: C.W * 0.1, y: C.H * 0.08, w: C.W * 0.8, h: C.H * 0.8 });
    function stroke(x, y) {
      if (over) return;
      if (!last) { last = [x, y, Clock.now()]; return; }
      const dt = Math.max(1, Clock.now() - last[2]), d = Math.hypot(x - last[0], y - last[1]), v = d / dt;   // px/мс
      speed = lerp(speed, v, 0.3);
      const S = scr();
      if (x < S.x || x > S.x + S.w || y < S.y || y > S.y + S.h) { last = [x, y, Clock.now()]; return; }
      if (speed < 0.55) {
        const n = Math.min(4, Math.ceil(d / 8));
        for (let i = 0; i < n; i++) flakes.push({ x: lerp(last[0], x, i / n) + rand(-6, 6), y: lerp(last[1], y, i / n), vy: rand(14, 32), vx: rand(-8, 8), r: rand(1.2, 3.2), p: rand(0, 6) });
        wind.vol(0.02 + Math.min(0.03, d * 0.002));
        if (Math.random() < 0.15) A.tone({ f: rand(1800, 2600), dur: 0.08, vol: 0.006 });
      } else {
        statics.push({ x, y, t: 0.5 }); dim = Math.min(1, dim + 0.012);
        if (Math.random() < 0.3) A.noise({ type: 'highpass', freq: 3000, dur: 0.06, vol: 0.03 });
      }
      last = [x, y, Clock.now()];
    }
    const pos = e => { const r = C.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    scope.on(C.cv, 'pointerdown', e => { e.preventDefault(); down = true; last = null; try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ } stroke(...pos(e)); });
    scope.on(C.cv, 'pointermove', e => { if (down) stroke(...pos(e)); });
    const up = () => { down = false; last = null; wind.vol(0, 0.4); };
    scope.on(C.cv, 'pointerup', up); scope.on(C.cv, 'pointercancel', up);
    ctx.keys(e => { if (e.key.startsWith('Arrow')) { e.preventDefault(); key.k[e.key] = true; } if (e.code === 'Space') { e.preventDefault(); key.on = true; last = null; } });
    scope.on(document, 'keyup', e => { if (e.key.startsWith('Arrow')) key.k[e.key] = false; if (e.code === 'Space') { key.on = false; last = null; } });

    async function end(ok) {
      over = true; wind.vol(0, 0.5);
      if (ok) {
        A.sfx.chime(880, 0.04); A.sfx.chime(1320, 0.03);
        await ctx.line('Снег шёл. Экран был белым, живым.', { pos: 'top', cls: 'ice', ms: 2400 });
        await ctx.line('— Привет, К-29.', { pos: 'mid', cls: 'ice big', ms: 2400 });
        resolve({ ok: 'ok', detail: `СНЕГ 100% · ${Math.floor(t)} С` });
      } else {
        await ctx.line('Экран погас. Он лежал на полу. Смотрел на дверь. Ждал.', { pos: 'mid', ms: 2800 });
        resolve({ ok: 'fail', detail: `СНЕГ ${Math.round(fill * 100)}%` });
      }
    }

    scope.loop(dt => {
      t += dt;
      const S = scr();
      if (key.on || Object.values(key.k).some(Boolean)) {
        key.x = clamp(key.x + ((key.k.ArrowRight ? 1 : 0) - (key.k.ArrowLeft ? 1 : 0)) * dt * 0.18, 0.1, 0.9);
        key.y = clamp(key.y + ((key.k.ArrowDown ? 1 : 0) - (key.k.ArrowUp ? 1 : 0)) * dt * 0.18, 0.1, 0.8);
        if (key.on) stroke(key.x * C.W, key.y * C.H);
      }
      const floor = S.y + S.h;
      for (let i = flakes.length - 1; i >= 0; i--) {
        const f = flakes[i]; f.p += dt; f.y += f.vy * dt; f.x += (f.vx + Math.sin(f.p * 2) * 10) * dt;
        const col = clamp(Math.floor((f.x - S.x) / S.w * drift.length), 0, drift.length - 1);
        if (f.y >= floor - drift[col]) { drift[col] = Math.min(S.h * 0.55, drift[col] + f.r * 0.9); if (col > 0) drift[col - 1] += f.r * 0.25; if (col < drift.length - 1) drift[col + 1] += f.r * 0.25; flakes.splice(i, 1); }
      }
      if (flakes.length > 900) flakes.splice(0, flakes.length - 900);
      statics.forEach(s => { s.t -= dt; }); statics = statics.filter(s => s.t > 0);
      if (!over) {
        let sum = 0; for (let i = 0; i < drift.length; i++) sum += drift[i];
        fill = Math.min(1, sum / (drift.length * S.h * 0.22));
        dim = Math.min(1, dim + dt / (DUR * 1.4)) ;
        snowM.set(fill);
        ctx.stat(`СНЕГ ${Math.round(fill * 100)}% · ЭКРАН ${Math.round((1 - dim) * 100)}%`);
        if (fill >= 1) end(true);
        else if (dim >= 1) end(false);
      }
      draw();
    });

    function draw() {
      const { g, W, H } = C, S = scr();
      drawCell(g, W, H, { t, lamp: 0.6, seed: 21 });
      // экран на стене
      const b = 1 - dim;
      g.fillStyle = '#050607'; g.fillRect(S.x - 8, S.y - 8, S.w + 16, S.h + 16);
      const sg = g.createLinearGradient(0, S.y, 0, S.y + S.h);
      sg.addColorStop(0, `rgba(${20 + 30 * fill * b | 0},${26 + 40 * fill * b | 0},${34 + 50 * fill * b | 0},1)`); sg.addColorStop(1, `rgba(${40 * b | 0},${50 * b | 0},${62 * b | 0},1)`);
      g.fillStyle = sg; g.fillRect(S.x, S.y, S.w, S.h);
      g.save(); g.beginPath(); g.rect(S.x, S.y, S.w, S.h); g.clip();
      g.fillStyle = `rgba(245,250,255,${0.9 * b})`;
      flakes.forEach(f => { g.beginPath(); g.arc(f.x, f.y, f.r, 0, Math.PI * 2); g.fill(); });
      // сугроб
      g.fillStyle = `rgba(235,242,248,${0.95 * b})`; g.beginPath(); g.moveTo(S.x, S.y + S.h);
      for (let i = 0; i < drift.length; i++) g.lineTo(S.x + (i + 0.5) / drift.length * S.w, S.y + S.h - drift[i]);
      g.lineTo(S.x + S.w, S.y + S.h); g.closePath(); g.fill();
      statics.forEach(s => { g.fillStyle = `rgba(160,160,160,${s.t})`; for (let k = 0; k < 6; k++) g.fillRect(s.x + rand(-20, 20), s.y + rand(-10, 10), rand(4, 18), 2); });
      if (key.on || Object.values(key.k).some(Boolean)) { g.strokeStyle = 'rgba(200,230,255,.6)'; g.beginPath(); g.arc(key.x * W, key.y * H, 10, 0, Math.PI * 2); g.stroke(); }
      if (fill >= 1) { g.fillStyle = 'rgba(40,60,90,.8)'; g.font = `${Math.round(S.h * 0.06)}px ${PIXEL}`; g.textAlign = 'center'; g.fillText('ПРИВЕТ, К-29', S.x + S.w / 2, S.y + S.h * 0.35); }
      g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = S.y; y < S.y + S.h; y += 3) g.fillRect(S.x, y, S.w, 1);
      g.restore();
      if (dim > 0) { g.fillStyle = `rgba(0,0,0,${dim * 0.55})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.6);
    }
  });
}
