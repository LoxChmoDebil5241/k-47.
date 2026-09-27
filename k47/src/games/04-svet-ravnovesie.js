/* ==========================================================================
   Глава 4 · «Свет» — НЕ УПАСТЬ
   Крышка капсулы отъехала. Ноги чужие и непослушные. Держи равновесие
   (тело заваливается само) и делай шаги, пока ровно. Дойди до капсул —
   и увидь, кто в них.
   ========================================================================== */
defineFrag(3, {
  id: 'light', name: 'Не упасть',
  text: 'Первое движение было инстинктивным, попыткой встать. Человек сделал шаг вперёд, но его ноги, чужие и непослушные, подкосились. Он грузно вывалился из капсулы, и с глухим стуком его лоб встретился с холодной керамо-стальной плиткой пола.',
  how: 'Тело заваливается само. Удерживай наклон ближе к вертикали — жми против падения. Шагай, только когда стоишь ровно: каждый шаг раскачивает. Три падения — и тебя усыпят. Дойди до ряда капсул.',
  keys: '← → ИЛИ A / D, ИЛИ КАСАНИЕ ЛЕВОЙ / ПРАВОЙ ПОЛОВИНЫ ЭКРАНА — БАЛАНС · ПРОБЕЛ / ↑ / КНОПКА — ШАГ',
  note: 'В каждой капсуле был я. Потом укол — и трава, которой я никогда не касался. Сон. Глубокий сон со всем пережитым.',
  mem: 'ЛИЦА В КАПСУЛАХ', start: gameLight,
});

function gameLight(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const ctl = ctx.el('div', 'ctl');
  const bL = ctx.el('button', 'btn big-btn', ctl, '◀ ВЛЕВО');
  const bS = ctx.el('button', 'btn btn-primary big-btn', ctl, 'ШАГ');
  const bR = ctx.el('button', 'btn big-btn', ctl, 'ВПРАВО ▶');
  let th = 0.05, w = 0, push = 0, prog = 0, falls = 0, down = 0, t = 0, over = false, stepCd = 0, blood = [], flash = 0;
  const STEPS = 22;
  let steps = 0;
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 70, vol: 0 }));
  const hiss = scope.own(A.loopNoise({ type: 'highpass', freq: 5000, q: 0.3, vol: 0 }));
  hum.vol(0.025, 1); hiss.vol(0.02, 0.5);
  scope.timeout(() => hiss.vol(0, 2), 1500);
  const held = { L: false, R: false };
  ctx.hint('ДЕРЖИ ТЕЛО РОВНО · ШАГАЙ, КОГДА НАКЛОН В ЗЕЛЁНОЙ ЗОНЕ');
  ctx.say('Яркая, безжалостная вспышка врезалась в сетчатку.', { pos: 'top', cls: 'ice' });
  scope.timeout(() => ctx.unsay('top'), 2600);
  const upd = () => ctx.stat(`ШАГОВ ${steps}/${STEPS} · ПАДЕНИЙ ${falls}/3`);
  upd();

  return new Promise(resolve => {
    const hold = (b, k) => {
      scope.on(b, 'pointerdown', e => { e.preventDefault(); held[k] = true; });
      const off = () => { held[k] = false; };
      scope.on(b, 'pointerup', off); scope.on(b, 'pointerleave', off); scope.on(b, 'pointercancel', off);
    };
    hold(bL, 'L'); hold(bR, 'R');
    scope.on(bS, 'pointerdown', e => { e.preventDefault(); step(); });
    scope.on(C.cv, 'pointerdown', e => { const r = C.cv.getBoundingClientRect(); held[e.clientX - r.left < r.width / 2 ? 'L' : 'R'] = true; });
    scope.on(C.cv, 'pointerup', () => { held.L = held.R = false; });
    scope.on(C.cv, 'pointercancel', () => { held.L = held.R = false; });
    ctx.keys(e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); held.L = true; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); held.R = true; }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); step(); }
    });
    scope.on(document, 'keyup', e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') held.L = false; if (e.code === 'ArrowRight' || e.code === 'KeyD') held.R = false; });

    function step() {
      if (over || down > 0 || stepCd > 0) return;
      stepCd = 0.45;
      if (Math.abs(th) > 0.22) { w += th > 0 ? 0.9 : -0.9; A.sfx.creak(0.1); return; }     // шаг из наклона — валит сильнее
      steps++; prog = steps / STEPS; upd();
      w += rand(-0.55, 0.55); A.sfx.step(0.18, rand(-0.3, 0.3));
      if (steps >= STEPS) win();
    }
    function fallDown() {
      falls++; down = 2.2; th = 0; w = 0; upd();
      A.sfx.thud(0.7); A.sfx.crunch(0.25); FX.shake('lg'); FX.flash('#ffffff', 300, 0.6); flash = 1;
      blood.push({ x: rand(0.3, 0.7), y: rand(0.3, 0.6), r: rand(0.05, 0.09), s: irand(1, 99) });
      ctx.say(['Лоб встретился с холодной плиткой.', 'Тёплая струя крови заливает молочные глаза.', 'Он зашевелился, беспомощный и голый, как червь.'][Math.min(2, falls - 1)], { pos: 'top', cls: 'red' });
      scope.timeout(() => ctx.unsay('top'), 2000);
      if (falls >= 3) lose();
    }
    async function lose() {
      over = true; hum.vol(0, 1);
      await scope.wait(1000);
      A.sfx.hiss(0.6, 0.1);
      await ctx.line('Укол в шею. Санитары подняли его с пола.', { pos: 'mid', ms: 2400 });
      await ctx.line('До капсул он так и не дошёл.', { pos: 'mid', cls: 'red', ms: 2200 });
      resolve({ ok: 'fail', detail: `ШАГОВ ${steps}/${STEPS}` });
    }
    async function win() {
      over = true;
      await scope.wait(700);
      A.sfx.glitch(); FX.flash('#88ddff', 500, 0.5);
      await ctx.line('В каждой капсуле был он.', { pos: 'mid', cls: 'ice big', ms: 2600 });
      await ctx.line('Его собственное лицо смотрело десятками пустых глаз.', { pos: 'mid', ms: 2600 });
      A.sfx.hiss(0.5, 0.08);
      await ctx.line('Укол. Трава. Улыбка женщины. Сон.', { pos: 'mid', ms: 2600 });
      resolve({ ok: 'ok', detail: `ПАДЕНИЙ ${falls}` });
    }

    scope.loop(dt => {
      t += dt; stepCd = Math.max(0, stepCd - dt); flash = Math.max(0, flash - dt);
      if (down > 0) { down -= dt; if (down <= 0 && !over) ctx.say('Встать. Ещё раз.', { pos: 'top' }), scope.timeout(() => ctx.unsay('top'), 1200); }
      else if (!over) {
        // перевёрнутый маятник: наклон растёт сам, игрок толкает против
        push = (held.R ? 1 : 0) - (held.L ? 1 : 0);
        const acc = 2.4 * Math.sin(th) + push * 2.9 + (Math.random() - 0.5) * 1.3 + Math.sin(t * 0.7) * 0.25;
        w += acc * dt; w *= Math.pow(0.55, dt);
        th += w * dt;
        if (Math.abs(th) > 0.95) fallDown();
      }
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      // стерильная операционная: слишком белая
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#dfe7ec'); bg.addColorStop(0.7, '#c9d4da'); bg.addColorStop(1, '#aebbc2');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      const fy = H * 0.8;
      g.fillStyle = '#b8c4ca'; g.fillRect(0, fy, W, H - fy);
      g.strokeStyle = 'rgba(80,100,110,.25)'; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, fy); g.lineTo(x - (x - W / 2) * 0.6, H); g.stroke(); }
      // ряд капсул приближается
      const k = prog;
      for (let i = 0; i < 7; i++) {
        const x = W * (0.12 + i * 0.13), sc = 0.4 + k * 0.6, ch = H * 0.5 * sc, cw = ch * 0.34;
        g.fillStyle = 'rgba(120,170,200,.35)'; Art.rr(g, x - cw / 2, fy - ch - 10, cw, ch, cw / 2); g.fill();
        g.strokeStyle = 'rgba(70,110,140,.6)'; g.stroke();
        if (k > 0.5) { g.globalAlpha = (k - 0.5) * 2 * 0.8; Art.clone(g, x, fy - ch * 0.95, ch * 0.7, { seed: i + 3, lines: false, scars: 0, t }); g.globalAlpha = 1; }
      }
      g.fillStyle = 'rgba(220,235,245,.55)'; g.fillRect(0, 0, W, H * 0.02);
      // тело: клон с молочными глазами
      const bx = W * 0.5, base = fy + 4, hh = H * 0.52;
      const tilt = down > 0 ? (th >= 0 ? 1.35 : -1.35) : th;
      g.save(); g.translate(bx, base); g.rotate(tilt); g.translate(-bx, -base);
      Art.clone(g, bx, base - hh, hh * 0.92, { seed: 4, lines: false, scars: 3, skin: '#d7ccc6', t, blood: falls ? 0.8 : 0 });
      g.fillStyle = '#c7bcb6'; g.fillRect(bx - hh * 0.09, base - hh * 0.08, hh * 0.07, hh * 0.1); g.fillRect(bx + hh * 0.02, base - hh * 0.08, hh * 0.07, hh * 0.1);
      g.restore();
      // кровь на полу и на «стекле» взгляда
      blood.forEach(b => Art.blood(g, b.x * W, b.y * H, b.r * Math.min(W, H), b.s, 0.8));
      // индикатор наклона
      const gw = Math.min(W * 0.5, 320), gx = (W - gw) / 2, gy = H * 0.1;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(gx, gy, gw, 8);
      g.fillStyle = 'rgba(0,200,120,.5)'; g.fillRect(gx + gw / 2 - gw * 0.11, gy, gw * 0.22, 8);
      g.fillStyle = Math.abs(th) > 0.6 ? '#ff0033' : '#1d2850'; g.fillRect(gx + gw / 2 + clamp(th / 0.95, -1, 1) * gw / 2 - 3, gy - 4, 6, 16);
      if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.35, W / 2, H / 2, '60,70,80');
    }
  });
}
