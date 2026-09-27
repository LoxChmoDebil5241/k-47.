/* ==========================================================================
   Глава 10 · перенесено из прототипа «Мини-игры» (механика сохранена)
   ========================================================================== */
defineFrag(9, {
  id: "paradise", name: "Не поддавайся",
  text: "Десятки рук, полупрозрачных и тёплых, опоясали его тело, ласково тянули в густую прохладу луга. «Отдохни, Кристиан… Ты молодец… Приляг… Всё уже позади…» Это был соблазн. Но что-то в самой его глубине, окаменевший осколок воли, сопротивлялось.",
  how: "Тебя зовут отдохнуть. Трава, тёплые руки, шёпот. Покой тянет сам — сопротивляйся касаниями, отталкивай руки, пока свет не станет невыносимым. Сдашься — останешься там.",
  keys: "ТАП / ПРОБЕЛ — СОПРОТИВЛЯТЬСЯ · ТАП ПО РУКЕ — ОТТОЛКНУТЬ · ПРОДЕРЖИСЬ 24 СЕКУНДЫ",
  note: "Трава обернулась иглами. Я упал — и проснулся. Очередной жизни. Тринадцатой.",
  mem: "ЖИЗНЬ ТРИНАДЦАТАЯ", start: ctx => gameParadise(ctx),
});

/* ==========================================================================
   Ф-07 · НЕ ПОДДАВАЙСЯ — «Тринадцать». Ложный рай тянет. Держись.
   ========================================================================== */
function gameParadise(ctx) {
  const { scope, body } = ctx;
  if (document.activeElement) document.activeElement.blur();
  const C = ctx.canvas();
  const meter = ctx.el('div', 'meter ok', body, 'ПОКОЙ<div class="mb"><i></i></div>');
  meter.style.left = '14px'; meter.style.top = '14px';
  const mFill = $('i', meter);
  const DUR = 24;
  let m = .22, e = 0, t = 0, reality = 0, over = false, whiteOut = 0, nextHand = 1.2, nextWhisper = .8, beatT = 0;
  const hands = [], whispers = [], taps = [];
  let blades = [];
  const WHISPERS = ['Отдохни, Кристиан…', 'Ты молодец…', 'Приляг…', 'Всё уже позади…', 'Всё хорошо…', 'Здесь тепло…', 'Закрой глаза…', 'Не надо больше…'];
  const build = () => {
    const n = clamp(Math.round(C.W * 1.1), 280, 900);
    blades = Array.from({ length: n }, () => {
      const y = C.H * (.56 + Math.pow(Math.random(), .8) * .46);
      return { x: Math.random() * C.W, y, h: (14 + Math.random() * 36) * (.5 + (y / C.H - .5) * 1.4), p: Math.random() * 6.28, hue: 80 + Math.random() * 40 };
    }).sort((a, b) => a.y - b.y);
  };
  build(); C.onResize = build;
  const pad = [220, 277.2, 329.6, 440].map(f => scope.own(A.loopOsc({ type: 'sine', freq: f, vol: 0 })));
  const wind = scope.own(A.loopNoise({ type: 'lowpass', freq: 700, q: .5, vol: 0 }));
  const alarm = scope.own(A.loopOsc({ type: 'square', freq: 440, vol: 0, lp: 1200 }));
  ctx.hint('ТАП / ПРОБЕЛ — СОПРОТИВЛЯТЬСЯ · ТАП ПО РУКЕ — ОТТОЛКНУТЬ · ПРОДЕРЖИСЬ 24 С');

  return new Promise(resolve => {
    function resist(x, y) {
      if (over) return;
      const now = Clock.now();
      while (taps.length && now - taps[0] > 1000) taps.shift();
      if (taps.length >= 8) return;
      taps.push(now);
      reality = 1;
      const hit = x != null ? hands.findIndex(h => Math.hypot(h.x - x, h.y - y) < h.r * 1.35) : -1;
      if (hit >= 0) { hands.splice(hit, 1); m -= .07; A.tone({ f: 240, f2: 80, type: 'square', dur: .14, vol: .05 }); }
      else { m -= .026; A.tone({ f: 180, f2: 120, type: 'square', dur: .05, vol: .03 }); }
      m = Math.max(0, m);
    }
    scope.on(body, 'pointerdown', ev => { ev.preventDefault(); const r = body.getBoundingClientRect(); resist(ev.clientX - r.left, ev.clientY - r.top); });
    scope.on(document, 'keydown', ev => { if (ev.code === 'Space' && !ev.repeat) { ev.preventDefault(); resist(null, null); } });

    async function win() {
      over = true;
      A.sfx.whisper(2, .12);
      whiteOut = 1; FX.flash('#ffffff', 1400, 1);
      await scope.wait(900);
      FX.flash('#88ddff', 500, .8); A.sfx.thud(.6); FX.shake('lg');
      pad.forEach(p => p.vol(0, .05)); wind.vol(0, .05); alarm.vol(0, .05);
      whiteOut = 2;
      await scope.wait(900);
      await ctx.line('Трава обернулась сотнями ледяных игл.', { pos: 'mid', cls: 'ice', ms: 2400 });
      await ctx.line('Очередной жизни.', { pos: 'mid', cls: 'big', ms: 1900 });
      await ctx.line('Тринадцатой.', { pos: 'mid', cls: 'big red', ms: 2200 });
      resolve({ ok: 'ok', detail: `ВОЛЯ НА ФИНИШЕ ${Math.round((1 - m) * 100)}%` });
    }
    async function lose() {
      over = true;
      A.sfx.whisper(2.4, .14);
      await ctx.line('Всё хорошо…', { pos: 'mid', ms: 2000 });
      await ctx.line('Он прилёг. Трава была тёплой. Больше ничего не было.', { pos: 'mid', ms: 2800 });
      resolve({ ok: 'fail', detail: `СДАЛСЯ НА ${Math.round(e)} С ИЗ ${DUR}` });
    }

    scope.loop(dt => {
      t += dt;
      if (!over) {
        e += dt;
        m += (.05 + .09 * (e / DUR)) * dt;
        nextHand -= dt;
        if (nextHand <= 0) {
          nextHand = rand(.9, 1.6) * (1 - e / DUR * .35);
          const side = irand(0, 3), r = Math.min(C.W, C.H) * rand(.06, .085);
          const p = side === 0 ? [-r, rand(0, C.H)] : side === 1 ? [C.W + r, rand(0, C.H)] : side === 2 ? [rand(0, C.W), C.H + r] : [rand(0, C.W), -r];
          hands.push({ x: p[0], y: p[1], r, sp: rand(38, 62) * (1 + e / DUR * .6), ph: Math.random() * 6 });
        }
        const cx = C.W / 2, cy = C.H * .58, rc = Math.min(C.W, C.H) * .12;
        for (let i = hands.length - 1; i >= 0; i--) {
          const h = hands[i], dx = cx - h.x, dy = cy - h.y, d = Math.hypot(dx, dy);
          h.x += dx / d * h.sp * dt; h.y += dy / d * h.sp * dt;
          if (d < rc) { hands.splice(i, 1); m += .09; A.sfx.whisper(.9, .08, rand(-.5, .5)); }
        }
        nextWhisper -= dt;
        if (nextWhisper <= 0) { nextWhisper = rand(1.6, 2.8); whispers.push({ s: pick(WHISPERS), x: rand(.15, .85), y: rand(.2, .75), t: 0 }); A.sfx.whisper(1.2, .06, rand(-.6, .6)); }
        if (m >= 1) { m = 1; lose(); }
        else if (e >= DUR) win();
        ctx.stat(`ВОЛЯ ${Math.round((1 - m) * 100)}% · ${Math.max(0, Math.ceil(DUR - e))} С`);
      }
      reality = Math.max(0, reality - dt * 3);
      whispers.forEach(w => { w.t += dt; });
      while (whispers.length && whispers[0].t > 3.2) whispers.shift();
      mFill.style.width = `${m * 100}%`;
      pad.forEach((p, i) => p.vol(over && whiteOut === 2 ? 0 : m * (.045 - i * .006)));
      wind.vol(.02 + m * .05); alarm.vol(reality * .035);
      beatT -= dt;
      if (beatT <= 0 && !over) { A.sfx.heartbeat(.28); beatT = 60 / lerp(118, 48, m); }
      draw();
    });

    const mix = (a, b, k) => `rgb(${Math.round(lerp(a[0], b[0], k))}, ${Math.round(lerp(a[1], b[1], k))}, ${Math.round(lerp(a[2], b[2], k))})`;
    function draw() {
      const { g, W, H } = C;
      const k = clamp(m, 0, 1), end = clamp((e - DUR + 5) / 5, 0, 1);
      if (whiteOut === 2) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return; }
      const sky = g.createLinearGradient(0, 0, 0, H * .6);
      sky.addColorStop(0, mix([20, 4, 7], [150, 200, 230], k)); sky.addColorStop(1, mix([45, 10, 14], [255, 240, 205], k));
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      const sr = Math.max(W, H) * (.25 + k * .3 + end * .6);
      const sun = g.createRadialGradient(W / 2, H * .18, 0, W / 2, H * .18, sr);
      sun.addColorStop(0, `rgba(255, 250, 225, ${.25 + k * .55 + end * .3})`); sun.addColorStop(1, 'rgba(255, 250, 225, 0)');
      g.fillStyle = sun; g.fillRect(0, 0, W, H);
      g.fillStyle = mix([30, 8, 10], [90, 150, 70], k); g.fillRect(0, H * .56, W, H * .44);
      g.lineWidth = 1.5;
      for (const b of blades) {
        const sw = Math.sin(t * 1.3 + b.p + b.x * .01) * b.h * .25;
        g.strokeStyle = k > .15 ? `hsla(${b.hue}, ${30 + k * 30}%, ${18 + k * 30}%, .9)` : 'rgba(70, 18, 22, .8)';
        g.beginPath(); g.moveTo(b.x, b.y); g.quadraticCurveTo(b.x + sw * .4, b.y - b.h * .6, b.x + sw, b.y - b.h); g.stroke();
      }
      hands.forEach(h => {
        const a = Math.atan2(C.H * .58 - h.y, W / 2 - h.x);
        const hg = g.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r * 1.6);
        hg.addColorStop(0, 'rgba(255, 244, 225, .55)'); hg.addColorStop(1, 'rgba(255, 244, 225, 0)');
        g.fillStyle = hg; g.beginPath(); g.arc(h.x, h.y, h.r * 1.6, 0, Math.PI * 2); g.fill();
        g.save(); g.translate(h.x, h.y); g.rotate(a);
        g.fillStyle = 'rgba(255, 246, 232, .5)';
        g.beginPath(); g.ellipse(0, 0, h.r * .7, h.r * .55, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255, 246, 232, .55)'; g.lineWidth = h.r * .16; g.lineCap = 'round';
        for (let i = -1.5; i <= 1.5; i++) { g.beginPath(); g.moveTo(h.r * .5, i * h.r * .2); g.lineTo(h.r * (1.15 + Math.sin(t * 3 + i + h.ph) * .08), i * h.r * .26); g.stroke(); }
        g.beginPath(); g.moveTo(0, -h.r * .45); g.lineTo(h.r * .45, -h.r * .85); g.stroke();
        g.restore();
      });
      g.textAlign = 'center'; g.font = `${Math.max(14, Math.min(W, H) * .032)}px ${MONO}`;
      whispers.forEach(w => {
        const al = w.t < .6 ? w.t / .6 : Math.max(0, 1 - (w.t - .6) / 2.6);
        g.fillStyle = `rgba(255, 252, 240, ${al * (.5 + k * .5)})`;
        g.fillText(w.s, W * w.x, H * w.y - w.t * 10);
      });
      if (reality > 0) {
        g.fillStyle = `rgba(160, 0, 20, ${reality * .4})`; g.fillRect(0, 0, W, H);
        g.fillStyle = `rgba(0, 0, 0, ${reality * .35})`;
        for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
      }
      if (end > 0) { g.fillStyle = `rgba(255, 255, 250, ${end * .8})`; g.fillRect(0, 0, W, H); }
    }
  });
}
