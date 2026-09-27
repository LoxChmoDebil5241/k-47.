/* ==========================================================================
   Глава 19 · «Кожа» — УДЕРЖАТЬ СОН
   Трава настоящая. Она рядом. Он знает, что это сон, — и остаётся.
   Реальность лезет с краёв осколками: «подъём», шипение капсулы, гель.
   Стирай осколки касанием и держи её руку в такт её сердцу, чтобы сон не остыл.
   ========================================================================== */
defineFrag(18, {
  id: 'skin', name: 'Удержать сон',
  text: 'Но он знал, что это сон. Знал, что это ложь. Но даже ложь была лучше, чем реальность. Поэтому он остался. Он закрыл глаза и остался в её объятиях, чувствуя её тепло, её кожу, её дыхание. Он остался там, где был живым.',
  how: 'Из краёв сна ползут осколки реальности. Коснись осколка — он рассыплется. В центре — её ладонь: касайся её в такт сердцу (кольцо сжимается к удару), и сон станет теплее. Продержись, пока сон не станет глубже реальности.',
  keys: 'ТАП ПО ОСКОЛКУ — СТЕРЕТЬ · ТАП ПО ЛАДОНИ / ПРОБЕЛ В ТАКТ — ТЕПЛО',
  note: 'Трава касалась босых ступней. Шрамов не было — только кожа, которая не знала пуль. Я знал, что это ложь. И остался.',
  mem: 'ТЁПЛАЯ ЛАДОНЬ', start: gameSkin,
});

function gameSkin(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const dreamM = ctx.meter('СОН', { cls: 'amb', left: 14, top: 14 });
  const DUR = 36;
  let dream = 0.75, t = 0, over = false, nextShard = 1.2, beatT = 0.8, beatAt = 0, ring = 0, glow = 0;
  const shards = [];
  const WORDS = ['К-26. ПОДЪЁМ', 'ГЕЛЬ ОТКАЧАН', 'ПУЛЬС 58', 'ШШШШ…', 'ОТКРЫВАЮ КРЫШКУ', 'РЕАКЦИЯ ЗРАЧКОВ', 'ЦИКЛ 26', 'ВСТАТЬ'];
  const pad = [196, 247, 294, 392].map(f => scope.own(A.loopOsc({ type: 'sine', freq: f, vol: 0 })));
  const grassN = scope.own(A.loopNoise({ type: 'bandpass', freq: 2600, q: 0.4, vol: 0 }));
  grassN.vol(0.015, 2);
  const blades = Array.from({ length: 420 }, () => ({ x: Math.random(), y: 0.55 + Math.pow(Math.random(), 0.8) * 0.45, h: 10 + Math.random() * 30, p: Math.random() * 6.28 }));
  ctx.hint('СТИРАЙ ОСКОЛКИ · КАСАЙСЯ ЕЁ ЛАДОНИ В ТАКТ СЕРДЦУ');

  return new Promise(resolve => {
    const center = () => [C.W / 2, C.H * 0.58];
    function tap(x, y) {
      if (over) return;
      const hit = shards.findIndex(s => Math.hypot(s.x * C.W - x, s.y * C.H - y) < 46);
      if (hit >= 0) { shards.splice(hit, 1); A.sfx.glitch(); dream = Math.min(1, dream + 0.02); return; }
      const [cx, cy] = center();
      if (Math.hypot(cx - x, cy - y) < Math.min(C.W, C.H) * 0.14) touchHand();
    }
    function touchHand() {
      const d = Math.abs(Clock.now() - beatAt) / 1000;
      if (d < 0.22) { dream = Math.min(1, dream + 0.07); glow = 1; A.tone({ f: 392, dur: 0.5, vol: 0.03, attack: 0.02 }); }
      else { dream = Math.max(0, dream - 0.03); A.sfx.click(); }
    }
    scope.on(C.cv, 'pointerdown', e => { const r = C.cv.getBoundingClientRect(); tap(e.clientX - r.left, e.clientY - r.top); });
    ctx.keys(e => { if (e.code === 'Space') { e.preventDefault(); touchHand(); } if (e.key === 'Enter' && shards.length) { e.preventDefault(); shards.shift(); A.sfx.glitch(); } });

    async function end(ok) {
      over = true;
      if (ok) {
        pad.forEach(p => p.vol(0.02, 2));
        await ctx.line('Она положила его ладонь себе на грудь. Сердце билось ровно.', { pos: 'top', cls: 'amb', ms: 2800 });
        await ctx.line('И он не хотел просыпаться.', { pos: 'mid', cls: 'amb big', ms: 2600 });
        resolve({ ok: 'ok', detail: `СОН ${Math.round(dream * 100)}%` });
      } else {
        pad.forEach(p => p.vol(0, 0.05)); A.sfx.hiss(0.8, 0.12); FX.flash('#ffffff', 600, 0.8);
        await ctx.line('Шипение капсулы. Гель. Холод. Белый потолок.', { pos: 'mid', cls: 'ice', ms: 2600 });
        resolve({ ok: 'fail', detail: `ПРОСНУЛСЯ НА ${Math.floor(t)} С` });
      }
    }

    scope.loop(dt => {
      t += dt;
      if (!over) {
        nextShard -= dt;
        if (nextShard <= 0) {
          nextShard = rand(0.7, 1.3) * (1 - t / DUR * 0.4);
          const side = irand(0, 3), p = side === 0 ? [0, rand(0.1, 0.9)] : side === 1 ? [1, rand(0.1, 0.9)] : side === 2 ? [rand(0.1, 0.9), 0.02] : [rand(0.1, 0.9), 1];
          shards.push({ x: p[0], y: p[1], w: pick(WORDS), a: rand(0, 6.28), sp: rand(0.045, 0.075) * (1 + t / DUR * 0.6) });
          A.sfx.whisper(0.4, 0.04, p[0] < 0.5 ? -0.6 : 0.6);
        }
        const [cx, cy] = center();
        for (let i = shards.length - 1; i >= 0; i--) {
          const s = shards[i], dx = cx / C.W - s.x, dy = cy / C.H - s.y, d = Math.hypot(dx, dy);
          s.x += dx / d * s.sp * dt; s.y += dy / d * s.sp * dt; s.a += dt;
          if (d < 0.06) { shards.splice(i, 1); dream = Math.max(0, dream - 0.14); A.sfx.hiss(0.3, 0.07); FX.shake('sm'); }
        }
        dream = Math.max(0, dream - dt * 0.012);
        beatT -= dt;
        if (beatT <= 0) { beatT = 1.05; beatAt = Clock.now(); A.sfx.heartbeat(0.22); }
        ring = beatT / 1.05;
        dreamM.set(dream);
        pad.forEach((p, i) => p.vol(dream * (0.03 - i * 0.005)));
        ctx.stat(`СОН ${Math.round(dream * 100)}% · ${Math.max(0, Math.ceil(DUR - t))} С`);
        if (dream <= 0) end(false);
        else if (t >= DUR) end(true);
      }
      glow = Math.max(0, glow - dt * 1.5);
      draw();
    });

    function draw() {
      const { g, W, H } = C, k = dream;
      const sky = g.createLinearGradient(0, 0, 0, H * 0.6);
      sky.addColorStop(0, `rgb(${40 + 150 * k | 0},${40 + 170 * k | 0},${50 + 180 * k | 0})`); sky.addColorStop(1, `rgb(${60 + 190 * k | 0},${50 + 180 * k | 0},${40 + 150 * k | 0})`);
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = `rgb(${30 + 60 * k | 0},${40 + 100 * k | 0},${25 + 45 * k | 0})`; g.fillRect(0, H * 0.55, W, H * 0.45);
      g.lineWidth = 1.4;
      for (const b of blades) {
        const sw = Math.sin(t * 1.2 + b.p + b.x * 6) * b.h * 0.25, x = b.x * W, y = b.y * H;
        g.strokeStyle = `hsla(${88 + b.p * 5}, ${20 + 35 * k}%, ${16 + 26 * k}%, .9)`;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sw * 0.4, y - b.h * 0.6, x + sw, y - b.h); g.stroke();
      }
      // она — тёплый размытый силуэт; её ладонь в центре
      const [cx, cy] = center(), R = Math.min(W, H);
      g.save(); if ('filter' in g) g.filter = 'blur(3px)';
      Art.human(g, cx + R * 0.12, cy + R * 0.3, R * 0.62, 'woman', { color: `rgba(${120 + 80 * k | 0},${80 + 60 * k | 0},${60 + 40 * k | 0},.55)` });
      g.restore();
      const hr = R * 0.07;
      const hg = g.createRadialGradient(cx, cy, 0, cx, cy, hr * (2.2 + glow));
      hg.addColorStop(0, `rgba(255,220,190,${0.55 + glow * 0.4})`); hg.addColorStop(1, 'rgba(255,220,190,0)');
      g.fillStyle = hg; g.beginPath(); g.arc(cx, cy, hr * (2.2 + glow), 0, Math.PI * 2); g.fill();
      g.strokeStyle = `rgba(255,236,210,${0.4 + 0.5 * (1 - ring)})`; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, hr * (1 + ring * 1.8), 0, Math.PI * 2); g.stroke();
      // осколки реальности
      g.font = `12px ${MONO}`; g.textAlign = 'center';
      shards.forEach(s => {
        const x = s.x * W, y = s.y * H;
        g.save(); g.translate(x, y); g.rotate(Math.sin(s.a) * 0.3);
        g.fillStyle = 'rgba(8,10,14,.85)'; g.beginPath(); g.moveTo(-40, -16); g.lineTo(34, -22); g.lineTo(44, 14); g.lineTo(-30, 20); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(136,221,255,.8)'; g.lineWidth = 1; g.stroke();
        g.fillStyle = '#cfeeff'; g.fillText(s.w, 2, 4);
        g.restore();
      });
      if (k < 0.35) { g.fillStyle = `rgba(200,225,240,${(0.35 - k) * 1.2})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.55 + (1 - k) * 0.3);
    }
  });
}
