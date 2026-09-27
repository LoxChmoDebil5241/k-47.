/* ==========================================================================
   Глава 3 · «Агония» — ПОЛЗТИ К КОНСОЛИ
   Одна рука зажимает рану на шее, другая тянет тело по липкому полу.
   Отпустишь рану — ползёшь быстрее, но кровь уходит втрое быстрее.
   Потом рука с пистолетом поднимается сама: пункт контракта.
   ========================================================================== */
defineFrag(2, {
  id: 'agony', name: 'Ползти к консоли',
  text: 'Второй ладонью он инстинктивно, с отчаянной, почти звериной силой, вдавил в шею, пытаясь заткнуть рваную рану. Он обтёр лицо о шершавый металл пола и начал ползти. Медленно, отчаянно, как раздавленное, но всё ещё живое насекомое.',
  how: 'Удерживай «ЗАЖАТЬ РАНУ», чтобы кровь уходила медленнее, и жми «ПОЛЗТИ», чтобы тянуть тело к консоли. С отпущенной раной ползёшь вдвое быстрее, но кровь хлещет. Доберись. Потом рука поднимет пистолет сама — наведи на спину командира и стреляй.',
  keys: 'ЗАЖАТЬ РАНУ — УДЕРЖИВАТЬ ПРОБЕЛ / ЛЕВУЮ КНОПКУ · ПОЛЗТИ — → / D / ПРАВАЯ КНОПКА · ВЫСТРЕЛ — ENTER / ТАП',
  note: '«Ликвидация вышедшего из-под контроля актива». Рука выстрелила раньше меня. Потом был только иней, который бежал по стенам, как живой.',
  noteDist: 'В этой записи я опустил пистолет. Маркус так и не обернулся. Ворота остались закрыты — архив говорит, что их открыл его мёртвый палец.',
  mem: 'ИНЕЙ НА СТЕНАХ', start: gameAgony,
});

function gameAgony(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const lifeM = ctx.meter('КРОВЬ', { left: 14, top: 14 });
  const ctl = ctx.el('div', 'ctl');
  const hold = mgHold(ctx, '✋ ЗАЖАТЬ РАНУ', { key: 'Space', parent: ctl });
  const crawlB = ctx.el('button', 'btn big-btn', ctl, 'ПОЛЗТИ ▶');
  let life = 1, prog = 0, t = 0, phase = 'crawl', over = false, lastTap = 0, bob = 0, frost = 0, shotFx = 0, fall = 0, lowered = false;
  const drips = [];
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 50, vol: 0 }));
  hum.vol(0.04, 1);
  let beatT = 0;
  ctx.hint('ДЕРЖИ РАНУ И ПОЛЗИ · С ОТКРЫТОЙ РАНОЙ БЫСТРЕЕ, НО КРОВЬ УХОДИТ ВТРОЕ БЫСТРЕЕ');
  ctx.say('Красный свет аварийной лампы пульсировал в такт умирающему сердцу.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3200);

  // прицел во второй фазе
  const aim = { x: 0.62, y: 0.42, vx: 0, vy: 0, ptr: null };
  let aimT = 0, misses = 0, shootBtn = null, lowerBtn = null;

  return new Promise(resolve => {
    function crawl() {
      if (phase !== 'crawl' || over) return;
      const now = Clock.now();
      if (now - lastTap < 170) return;
      lastTap = now;
      prog = Math.min(1, prog + (hold.down ? 0.017 : 0.034));
      if (hold.down) life -= 0.003;
      bob = 1;
      A.noise({ type: 'lowpass', freq: 420, dur: 0.18, vol: 0.06 });
      if (Math.random() < 0.3) drips.push({ x: prog, s: rand(2, 5) });
      if (prog >= 1) toAim();
    }
    scope.on(crawlB, 'pointerdown', e => { e.preventDefault(); crawl(); });
    ctx.keys(e => {
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); crawl(); }
      if (phase === 'aim' && (e.key === 'Enter')) { e.preventDefault(); fire(); }
      if (phase === 'aim' && e.key.startsWith('Arrow')) { e.preventDefault(); const d = 0.035; if (e.key === 'ArrowLeft') aim.vx -= d * 4; if (e.key === 'ArrowRight') aim.vx += d * 4; if (e.key === 'ArrowUp') aim.vy -= d * 4; if (e.key === 'ArrowDown') aim.vy += d * 4; }
    });

    function toAim() {
      phase = 'aim'; ctl.remove();
      ctx.say('Рука с пистолетом поднялась сама собой — по памяти мышц.', { pos: 'top' });
      scope.timeout(() => ctx.say('«Ликвидация вышедшего из-под контроля актива является приоритетной задачей».', { pos: 'top', cls: 'red' }), 2600);
      scope.timeout(() => ctx.unsay('top'), 6400);
      ctx.hint('ВЕДИ ПАЛЬЦЕМ / МЫШЬЮ · ТАП ПО СПИНЕ ИЛИ ENTER — ВЫСТРЕЛ');
      const c2 = ctx.el('div', 'ctl');
      shootBtn = ctx.el('button', 'btn btn-primary big-btn', c2, 'ВЫСТРЕЛ');
      lowerBtn = ctx.el('button', 'btn big-btn', c2, 'ОПУСТИТЬ ПИСТОЛЕТ');
      lowerBtn.hidden = true;
      scope.on(shootBtn, 'click', fire);
      scope.on(lowerBtn, 'click', lower);
      scope.timeout(() => { if (phase === 'aim') lowerBtn.hidden = false; }, 7000);
      scope.on(C.cv, 'pointerdown', e => { aim.ptr = { x: e.clientX, y: e.clientY, t: Clock.now() }; });
      scope.on(C.cv, 'pointermove', e => { if (!aim.ptr) return; aim.vx += (e.clientX - aim.ptr.x) / C.W * 3; aim.vy += (e.clientY - aim.ptr.y) / C.H * 3; aim.ptr.x = e.clientX; aim.ptr.y = e.clientY; });
      scope.on(C.cv, 'pointerup', () => { if (aim.ptr && Clock.now() - aim.ptr.t < 220) fire(); aim.ptr = null; });
    }
    function target() { return { x: 0.8, y: 0.5, w: 0.07, h: 0.2 }; }
    async function fire() {
      if (phase !== 'aim' || over) return;
      const sway = swayNow(), ax = aim.x + sway[0], ay = aim.y + sway[1], T = target();
      A.sfx.shot(0.8); FX.flash('#fff2cc', 120, 0.9); FX.shake('lg'); shotFx = 1;
      if (Math.abs(ax - T.x) < T.w && Math.abs(ay - T.y) < T.h) {
        over = true; phase = 'end'; fall = 0.001;
        await scope.wait(900);
        A.sfx.crunch(0.4); A.sfx.alarm(0.05);
        await ctx.line('Пальцы Маркуса вцепились в край панели, нажимая десятки кнопок.', { pos: 'top', ms: 2600 });
        A.sfx.thud(0.8); FX.shake('lg');
        ctx.say('Главные гермоворота ангара с грохотом поползли вверх.', { pos: 'top', cls: 'red' });
        const wind = scope.own(A.loopNoise({ type: 'highpass', freq: 900, q: 0.4, vol: 0 }));
        wind.vol(0.14, 0.4);
        const T0 = t; scope.loop(() => { frost = Math.min(1, (t - T0) / 4); });
        await scope.wait(3200);
        wind.vol(0, 1.5);
        await ctx.line('Иней побежал по стенам, как живой.', { pos: 'mid', cls: 'ice', ms: 2400 });
        resolve({ ok: 'ok', detail: `КРОВИ ОСТАЛОСЬ ${Math.round(life * 100)}%` });
      } else {
        misses++;
        ctx.say(misses < 2 ? 'Мимо. Маркус вздрогнул.' : 'Маркус обернулся.', { pos: 'mid', cls: 'red' });
        scope.timeout(() => ctx.unsay('mid'), 1300);
        if (misses >= 2) { over = true; await scope.wait(900); A.sfx.shot(0.9); FX.flash('#ff2200', 400, 0.8); await ctx.line('Второго выстрела не было. Был только его.', { pos: 'mid', cls: 'red', ms: 2600 }); resolve({ ok: 'fail', detail: 'ДВА ПРОМАХА' }); }
      }
    }
    async function lower() {
      if (phase !== 'aim' || over) return;
      over = true; phase = 'end'; lowered = true;
      A.sfx.glitch();
      await ctx.line('Он опустил пистолет. Маркус так и не обернулся.', { pos: 'mid', ms: 2600 });
      ctx.say('НЕЙРОСЛЕПОК: РАСХОЖДЕНИЕ С ЗАПИСЬЮ', { pos: 'mid', cls: 'big red' });
      await scope.wait(2400);
      resolve({ ok: 'dist', detail: 'ВЫСТРЕЛА НЕ БЫЛО' });
    }
    function swayNow() { const k = 0.028 + (1 - life) * 0.03; return [Math.sin(t * 1.9) * k + Math.sin(t * 4.3) * k * 0.4, Math.cos(t * 1.6) * k + Math.sin(t * 3.7) * k * 0.4]; }

    scope.loop(dt => {
      t += dt;
      if (!over) {
        life -= dt * (phase === 'crawl' ? (hold.down ? 0.022 : 0.066) : 0.015);
        lifeM.set(life);
        beatT -= dt;
        if (beatT <= 0) { A.sfx.heartbeat(0.3 + (1 - life) * 0.4); beatT = lerp(0.9, 0.42, 1 - life); }
        if (phase === 'crawl') ctx.stat(`ДО КОНСОЛИ ${Math.round((1 - prog) * 100)}% · КРОВЬ ${Math.round(life * 100)}%`);
        else ctx.stat(`КРОВЬ ${Math.round(life * 100)}%`);
        if (life <= 0) {
          over = true;
          (async () => { FX.flash('#000', 1200, 1); await ctx.line('Тёплая, алая жизнь ушла сквозь пальцы. До консоли он не дополз.', { pos: 'mid', cls: 'red', ms: 2800 }); resolve({ ok: 'fail', detail: `ПРОПОЛЗ ${Math.round(prog * 100)}%` }); })();
        }
      }
      if (phase === 'aim') {
        aim.vx *= Math.pow(0.2, dt); aim.vy *= Math.pow(0.2, dt);
        aim.x = clamp(aim.x + aim.vx * dt, 0.3, 0.98); aim.y = clamp(aim.y + aim.vy * dt, 0.15, 0.85);
        // рука тянется к спине сама — «память мышц»
        aim.vx += (0.8 - aim.x) * dt * 0.25; aim.vy += (0.5 - aim.y) * dt * 0.25;
      }
      bob = Math.max(0, bob - dt * 4); shotFx = Math.max(0, shotFx - dt * 3);
      if (fall > 0) fall = Math.min(1, fall + dt * 1.2);
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      const pulse = 0.55 + 0.45 * Math.pow(Math.max(0, Math.sin(t * 3.2)), 3);
      g.fillStyle = '#070102'; g.fillRect(0, 0, W, H);
      // отсек шаттла в красном свете
      const fy = H * 0.68;
      g.fillStyle = `rgba(${90 + 80 * pulse | 0},0,${8 + 10 * pulse | 0},1)`; g.fillRect(0, 0, W, fy);
      g.fillStyle = 'rgba(0,0,0,.55)'; for (let x = 0; x < W; x += 56) g.fillRect(x, 0, 6, fy);
      g.fillStyle = '#140204'; g.fillRect(0, fy, W, H - fy);
      g.strokeStyle = 'rgba(255,40,60,.12)'; for (let x = -H; x < W; x += 26) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H * 0.4, fy); g.stroke(); }
      // лампа
      const lg = g.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, H * 0.9);
      lg.addColorStop(0, `rgba(255,20,40,${0.5 * pulse})`); lg.addColorStop(1, 'rgba(255,0,20,0)');
      g.fillStyle = lg; g.fillRect(0, 0, W, H);
      // консоль и Маркус
      const cx = W * 0.8, base = fy + H * 0.05;
      g.fillStyle = '#0d0203'; g.fillRect(cx - W * 0.1, fy - H * 0.12, W * 0.2, H * 0.12 + 6);
      for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(${i % 2 ? '0,255,136' : '255,179,71'},${0.3 + 0.3 * Math.sin(t * 3 + i)})`; g.fillRect(cx - W * 0.08 + i * W * 0.02, fy - H * 0.1, 5, 3); }
      g.save();
      if (fall > 0) { g.translate(cx, base); g.rotate(fall * 0.9); g.translate(-cx, -base); }
      Art.human(g, cx, base, H * 0.42, 'soldier', { color: '#050001', visor: '#330008' });
      g.fillStyle = 'rgba(200,200,205,.55)'; g.beginPath(); g.ellipse(cx, base - H * 0.42 * 0.93, H * 0.022, H * 0.012, 0, Math.PI, 0); g.fill();
      if (fall > 0) Art.blood(g, cx - 4, base - H * 0.28, H * 0.03, 3, fall);
      g.restore();
      // кровавый след и сам Кристиан
      const x0 = W * 0.08, x1 = W * 0.64, px = lerp(x0, x1, prog), py = fy + (H - fy) * 0.45;
      g.strokeStyle = 'rgba(70,0,6,.9)'; g.lineWidth = Math.max(4, H * 0.018); g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, py + 4); for (let x = x0; x <= px; x += 10) g.lineTo(x, py + 4 + Math.sin(x * 0.07) * 3); g.stroke();
      drips.forEach(d => { g.fillStyle = 'rgba(90,0,8,.95)'; g.beginPath(); g.arc(lerp(x0, x1, d.x), py + 12, d.s, 0, Math.PI * 2); g.fill(); });
      const by = py - bob * 4;
      g.fillStyle = '#030000';
      g.beginPath(); g.ellipse(px, by, W * 0.05, H * 0.024, -0.05, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(px + W * 0.05, by - 3, H * 0.02, 0, Math.PI * 2); g.fill();
      if (hold.down || phase !== 'crawl') { g.fillStyle = '#2a0004'; g.fillRect(px + W * 0.04, by - 2, 8, 6); }
      // прицел
      if (phase === 'aim' && !lowered) {
        const [sx, sy] = swayNow();
        drawReticle(g, (aim.x + sx) * W, (aim.y + sy) * H, 'rgba(255,220,225,.95)', 16);
      }
      if (shotFx > 0) { g.fillStyle = `rgba(255,230,180,${shotFx * 0.4})`; g.fillRect(0, 0, W, H); }
      // иней после разгерметизации
      if (frost > 0) {
        g.fillStyle = `rgba(190,225,245,${frost * 0.45})`; g.fillRect(0, 0, W, H);
        g.strokeStyle = `rgba(235,250,255,${frost * 0.8})`; g.lineWidth = 1;
        const R = mulberry(31);
        for (let i = 0; i < 40 * frost; i++) { let x = R() < 0.5 ? 0 : W, y = R() * H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (x < W / 2 ? 1 : -1) * R() * 40; y += (R() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
      }
      const low = 1 - life;
      Art.vignette(g, W, H, 0.6 + low * 0.35, W / 2, H / 2, `${40 + low * 60 | 0},0,0`);
      Art.grain(g, W, H, 0.05);
    }
  });
}
