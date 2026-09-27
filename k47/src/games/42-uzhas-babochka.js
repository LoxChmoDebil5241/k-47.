/* ==========================================================================
   Глава 42 · «Ужас» — ЗА БАБОЧКОЙ
   Бабочка села на шлем. Небо, трава до горизонта, тепло. Иди за ней.
   Она опускается на плечо женщине с фотографии. «Ты пришёл».
   Потом земля вздрагивает, и из неё лезут они. «Ты жи-и-ив… Мы ме-е-ертвы…»
   ========================================================================== */
defineFrag(41, {
  id: 'horror', name: 'Бабочка',
  text: 'Он увидел бабочку. Она летела впереди, белая, дрожащая. Пошёл за ней. Трава была мягкой под ногами. Она скользила, шелестела, обнимала его ступни.',
  how: 'Веди пальцем или мышью (или стрелками) за бабочкой — держись рядом, пока она ведёт через луг. Потом женщина протянет руку. Потом из земли полезут руки — тапай их, вырывайся. Продержись.',
  keys: 'ВЕСТИ ЗА БАБОЧКОЙ — ПАЛЕЦ / МЫШЬ / СТРЕЛКИ · РУКИ — ТАП / ПРОБЕЛ',
  note: 'Луг, небо, трава до горизонта. Бабочка села на плечо женщине с фотографии. «Ты пришёл». Потом у неё стёрлось лицо, и из земли полезли мы. Бабочка всё ещё у меня в груди.',
  noteDist: 'В этой записи я не взял её руку. Отступил на шаг — и всё равно земля вздрогнула. Архив говорит, я сделал шаг вперёд.',
  mem: 'ТЫ ПРИШЁЛ', start: gameHorror,
});

function gameHorror(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  let t = 0, over = false, phase = 'follow', px = 0.5, py = 0.7, bx = 0.5, by = 0.5, near = 0, follow = 0, fT = 0, erase = 0, grip = 0, hands = [], nextHand = 0.5, freed = 0, hT = 0, stepped = true, keys = new Set();
  const FOLLOW_T = 22, HANDS_T = 16;
  const warmM = ctx.meter('ТЕПЛО', { cls: 'amb', left: 14, top: 14 });
  ctx.hint('ИДИ ЗА БАБОЧКОЙ');
  const wind = scope.own(A.loopNoise({ type: 'bandpass', freq: 900, q: 0.4, vol: 0 }));
  wind.vol(0.025, 2);
  const pad = scope.own(A.loopOsc({ type: 'sine', freq: 330, vol: 0 }));
  pad.vol(0.02, 3);
  const grass = Array.from({ length: 220 }, () => ({ x: Math.random(), y: 0.55 + Math.random() * 0.45, h: rand(0.01, 0.04), ph: Math.random() * 6 }));

  return new Promise(resolve => {
    const mv = e => { const r = C.cv.getBoundingClientRect(); px = (e.clientX - r.left) / C.W; py = (e.clientY - r.top) / C.H; };
    scope.on(C.cv, 'pointermove', mv);
    scope.on(C.cv, 'pointerdown', e => {
      mv(e);
      if (phase === 'hands') { const x = px * C.W, y = py * C.H; const h = hands.find(h => !h.gone && Math.hypot(h.x * C.W - x, h.y * C.H - y) < 40); if (h) tear(h); }
    });
    scope.on(document, 'keydown', e => { if (e.code.startsWith('Arrow')) { keys.add(e.code); e.preventDefault(); } });
    scope.on(document, 'keyup', e => keys.delete(e.code));
    ctx.keys(e => { if (phase === 'hands' && e.code === 'Space') { e.preventDefault(); const h = hands.find(h => !h.gone); if (h) tear(h); } });
    function tear(h) { h.gone = true; freed++; grip = Math.max(0, grip - 0.1); A.sfx.squelch(0.15); }
    async function womanPhase() {
      phase = 'woman'; pad.vol(0.035, 1);
      await ctx.line('Бабочка опустилась на плечо женщине.', { pos: 'top', ms: 2000 });
      await ctx.line('— Ты пришёл, — сказала она.', { pos: 'top', cls: 'amb', ms: 2200 });
      if (!scope.alive) return;
      const k = await ctx.choose(['Коснуться руки', 'Отступить']);
      stepped = k === 0;
      A.sfx.thud(0.6); FX.shake('lg'); pad.vol(0, 0.3);
      phase = 'erase';
      ctx.say('Земля вздрогнула.', { pos: 'top', cls: 'red' }); scope.timeout(() => ctx.unsay('top'), 1800);
    }
    function handsPhase() {
      phase = 'hands'; hT = 0; ctx.hint('ТАПАЙ РУКИ · ВЫРЫВАЙСЯ');
      warmM.label('ЗАХВАТ'); warmM.el.classList.remove('amb'); warmM.el.classList.add('red');
    }
    async function end() {
      over = true; wind.vol(0, 0.5);
      await ctx.line('«Ты жи-и-ив…» «Мы ме-е-ертвы…»', { pos: 'mid', cls: 'red', ms: 2400 });
      await ctx.line('Сотни рук сомкнулись. А потом — ничего.', { pos: 'mid', ms: 2200 });
      await ctx.line('«К-43. Подъём».', { pos: 'mid', cls: 'big', ms: 2000 });
      const followK = follow / FOLLOW_T;
      if (!stepped) resolve({ ok: 'dist', detail: `ЗА БАБОЧКОЙ ${Math.round(followK * 100)}%` });
      else if (followK >= 0.6 && hT >= HANDS_T) resolve({ ok: 'ok', detail: `ЗА БАБОЧКОЙ ${Math.round(followK * 100)}% · ВЫРВАЛСЯ ${freed} РАЗ` });
      else resolve({ ok: 'fail', detail: `ЗА БАБОЧКОЙ ${Math.round(followK * 100)}% · ВЫРВАЛСЯ ${freed} РАЗ` });
    }
    scope.loop(dt => {
      t += dt;
      if (keys.size) { const sp = dt * 0.45; if (keys.has('ArrowLeft')) px -= sp; if (keys.has('ArrowRight')) px += sp; if (keys.has('ArrowUp')) py -= sp; if (keys.has('ArrowDown')) py += sp; px = clamp(px, 0, 1); py = clamp(py, 0, 1); }
      if (!over && phase === 'follow') {
        fT += dt;
        bx = 0.5 + Math.sin(t * 0.37) * 0.32 + Math.sin(t * 1.3) * 0.05; by = 0.45 + Math.sin(t * 0.53 + 1) * 0.18 + Math.cos(t * 2.1) * 0.03;
        const d = Math.hypot((bx - px) * C.W, (by - py) * C.H);
        near = clamp(1 - d / (Math.min(C.W, C.H) * 0.22), 0, 1);
        if (near > 0.35) follow += dt;
        warmM.set(follow / FOLLOW_T);
        ctx.stat(`ЛУГ ${Math.round(fT / FOLLOW_T * 100)}%`);
        if (fT >= FOLLOW_T) womanPhase();
      } else if (!over && phase === 'erase') {
        erase += dt / 3.2;
        if (erase >= 1) handsPhase();
      } else if (!over && phase === 'hands') {
        hT += dt;
        nextHand -= dt;
        if (nextHand <= 0) { nextHand = rand(0.35, 0.7) * (1 - hT / HANDS_T * 0.4); hands.push({ x: rand(0.1, 0.9), y: rand(0.6, 0.95), t: 0, gone: false }); A.sfx.crunch(0.12); }
        hands.forEach(h => { if (!h.gone) { h.t += dt; if (h.t > 1.6) grip += dt * 0.12; } });
        hands = hands.filter(h => !h.gone || h.t < 0);
        warmM.set(grip);
        if (Math.random() < dt * 1.5) A.sfx.whisper(0.8, 0.05, rand(-1, 1));
        ctx.stat(`ДЕРЖИСЬ ${Math.max(0, Math.ceil(HANDS_T - hT))} С`);
        if (grip >= 1 || hT >= HANDS_T) end();
      }
      draw();
    });
    function draw() {
      const { g, W, H } = C;
      const rot = phase === 'hands' ? 1 : phase === 'erase' ? erase : 0;
      // небо: голубое → серое
      const sky = g.createLinearGradient(0, 0, 0, H * 0.55);
      sky.addColorStop(0, `rgb(${lerp(70, 30, rot) | 0},${lerp(150, 26, rot) | 0},${lerp(235, 30, rot) | 0})`); sky.addColorStop(1, `rgb(${lerp(180, 40, rot) | 0},${lerp(220, 30, rot) | 0},${lerp(250, 34, rot) | 0})`);
      g.fillStyle = sky; g.fillRect(0, 0, W, H * 0.56);
      // солнце
      g.fillStyle = `rgba(255,248,220,${0.8 * (1 - rot)})`; g.beginPath(); g.arc(W * 0.78, H * 0.14, Math.min(W, H) * 0.05, 0, Math.PI * 2); g.fill();
      // луг → месиво
      const gr = g.createLinearGradient(0, H * 0.55, 0, H);
      gr.addColorStop(0, `rgb(${lerp(90, 50, rot) | 0},${lerp(150, 20, rot) | 0},${lerp(80, 22, rot) | 0})`); gr.addColorStop(1, `rgb(${lerp(40, 30, rot) | 0},${lerp(90, 8, rot) | 0},${lerp(40, 10, rot) | 0})`);
      g.fillStyle = gr; g.fillRect(0, H * 0.55, W, H * 0.45);
      g.strokeStyle = `rgba(${lerp(150, 90, rot) | 0},${lerp(210, 20, rot) | 0},${lerp(120, 24, rot) | 0},.6)`; g.lineWidth = 1;
      grass.forEach(s => { const x = s.x * W, y = s.y * H, sw = Math.sin(t * 1.6 + s.ph) * 4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sw, y - s.h * H * 0.5, x + sw * 1.5, y - s.h * H); g.stroke(); });
      if (phase !== 'follow') {
        // женщина: черты стираются, глаза исчезают, волосы держатся дольше
        const wx = W * 0.62, base = H * 0.86, h = H * 0.6;
        const a = phase === 'hands' ? 0.25 : 1 - erase * 0.5;
        g.globalAlpha = a;
        Art.human(g, wx, base, h, 'woman', { color: '#2a1f1a' });
        const hy = base - h * 0.926, hr = h * 0.074;
        g.fillStyle = `rgb(${lerp(200, 120, erase) | 0},${lerp(170, 110, erase) | 0},${lerp(150, 105, erase) | 0})`; g.beginPath(); g.ellipse(wx, hy, hr * 0.85, hr, 0, 0, Math.PI * 2); g.fill();
        if (erase < 0.5) { g.fillStyle = '#3b2412'; g.beginPath(); g.arc(wx - hr * 0.33, hy - hr * 0.1, hr * 0.12, 0, Math.PI * 2); g.arc(wx + hr * 0.33, hy - hr * 0.1, hr * 0.12, 0, Math.PI * 2); g.fill(); }
        else { g.fillStyle = '#0a0706'; g.beginPath(); g.ellipse(wx - hr * 0.33, hy - hr * 0.1, hr * 0.18, hr * 0.14, 0, 0, Math.PI * 2); g.ellipse(wx + hr * 0.33, hy - hr * 0.1, hr * 0.18, hr * 0.14, 0, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#1a120e'; g.fillRect(wx - hr * 1.05, hy - hr * 0.6, hr * 0.35, h * 0.22); g.fillRect(wx + hr * 0.7, hy - hr * 0.6, hr * 0.35, h * 0.22);
        g.globalAlpha = 1;
      }
      if (phase === 'hands') {
        // клоны из земли
        for (let i = 0; i < 9; i++) Art.human(g, W * (0.05 + i * 0.11), H * (1.05 + 0.06 * Math.sin(i)), H * (0.4 + 0.2 * Math.min(1, hT / HANDS_T)), 'man', { color: '#0b0909', eyes: '#fff' });
        hands.forEach(h => {
          if (h.gone) return;
          const x = h.x * W, y = h.y * H, k = Math.min(1, h.t * 2);
          g.fillStyle = '#8e8b86'; g.fillRect(x - 6, y - 40 * k, 12, 40 * k);
          for (let f = 0; f < 4; f++) g.fillRect(x - 8 + f * 5, y - 40 * k - 12, 3, 12);
          if (h.t > 1.6) { g.strokeStyle = 'rgba(255,0,51,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 30, 22, 0, Math.PI * 2); g.stroke(); }
        });
      }
      // бабочка
      if (phase === 'follow' || phase === 'woman') {
        const x = (phase === 'woman' ? 0.66 : bx) * W, y = (phase === 'woman' ? 0.36 : by) * H, f = Math.abs(Math.sin(t * 14));
        g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(x - 6 * f, y, 7 * f + 1, 5, -0.4, 0, Math.PI * 2); g.ellipse(x + 6 * f, y, 7 * f + 1, 5, 0.4, 0, Math.PI * 2); g.fill();
      }
      if (phase === 'follow') { const x = px * W, y = py * H; g.strokeStyle = `rgba(255,248,220,${0.3 + near * 0.6})`; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 14, 0, Math.PI * 2); g.stroke(); }
      if (rot > 0) Art.vignette(g, W, H, 0.3 + rot * 0.6, W / 2, H / 2, '40,0,6');
      else Art.vignette(g, W, H, 0.25);
    }
  });
}
