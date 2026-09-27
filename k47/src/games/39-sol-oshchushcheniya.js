/* ==========================================================================
   Глава 39 · «Соль» — ПОЧУВСТВОВАТЬ СОЛЬ
   Сухая камера, горечь таблеток. В темноте — собственное тело.
   Веди «чувство» по телу: чем ближе ощущение, тем громче сердце.
   Задержись — губы, пальцы, лоб, царапина на запястье. Потом сжать кулак
   и не отворачиваться, пока соль жжёт. Пока он чувствует соль — он есть.
   ========================================================================== */
defineFrag(38, {
  id: 'salt', name: 'Соль',
  text: 'Он улыбнулся. Не оскалом. Не гримасой. Просто улыбнулся. Потому что понял: пока он чувствует соль — он есть.',
  how: 'Темно. Веди пальцем (или мышью, или стрелками) по силуэту тела. Сердце стучит чаще, когда рядом ощущение. Нашёл — задержись, пока оно не проявится. Горечь таблеток обманывает: там, где горько, задерживаться бесполезно. В конце — сожми кулак и держи.',
  keys: 'ВЕСТИ ПАЛЬЦЕМ / МЫШЬЮ · СТРЕЛКИ — ДВИГАТЬ · ПРОБЕЛ — СЖАТЬ КУЛАК',
  note: 'Соль на губах. Пот, не гель. Кровь из царапины — тёплая, металлическая, живая. Единственное, что не принадлежит системе.',
  mem: 'СОЛЬ', start: gameSalt,
});

function gameSalt(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const SPOTS = [
    { k: 'lips', x: 0, y: 0.29, t: 'Соль на губах. Тонкая, влажная, острая.' },
    { k: 'finger', x: 0.25, y: 0.86, t: 'Пальцы мокрые. Пот. Не гель. Не вода.' },
    { k: 'brow', x: 0, y: 0.1, t: 'Пот на лбу. Влажный след.' },
    { k: 'wrist', x: -0.24, y: 0.8, t: 'Царапина от бетона. Кровь — тёплая, солёная, живая.' },
    { k: 'nose', x: 0, y: 0.235, t: 'Запах тела. Запах жизни, которая ещё теплилась.' },
  ];
  const BITTER = [{ x: -0.07, y: 0.33 }, { x: 0.12, y: 0.55 }, { x: -0.14, y: 0.95 }];
  let t = 0, over = false, px = 0.5, py = 0.85, found = 0, dwell = 0, cur = -1, beatT = 0, fist = 0, phase = 'seek', bitterT = 0, keysDown = new Set(), shown = null;
  const LIMIT = 110;
  ctx.hint('ВЕДИ ПО ТЕЛУ · СЕРДЦЕ ЧАЩЕ — БЛИЖЕ · ЗАДЕРЖИСЬ');
  ctx.say('Он сидел на койке. Во рту — горечь таблеток.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2600);
  const air = scope.own(A.loopNoise({ type: 'lowpass', freq: 300, q: 0.3, vol: 0 }));
  air.vol(0.015, 2);
  const upd = () => ctx.stat(`ОЩУЩЕНИЙ ${found}/${SPOTS.length}`);
  upd();

  return new Promise(resolve => {
    const body = () => { const h = Math.min(C.H * 0.9, C.W * 1.2); return { cx: C.W / 2, top: C.H * 0.06, h }; };
    const toScr = (x, y) => { const B = body(); return [B.cx + x * B.h, B.top + y * B.h]; };
    const move = e => { const r = C.cv.getBoundingClientRect(); px = (e.clientX - r.left) / C.W; py = (e.clientY - r.top) / C.H; };
    scope.on(C.cv, 'pointermove', move); scope.on(C.cv, 'pointerdown', move);
    scope.on(document, 'keydown', e => { if (e.code.startsWith('Arrow')) { keysDown.add(e.code); e.preventDefault(); } });
    scope.on(document, 'keyup', e => keysDown.delete(e.code));
    let fistHold = null;
    function fistPhase() {
      phase = 'fist'; ctx.hint('СОЖМИ КУЛАК И ДЕРЖИ · НЕ ОТВОРАЧИВАЙСЯ');
      ctx.say('Он сжал кулак. Соль впивается в ладонь.', { pos: 'top', cls: 'amb' });
      fistHold = mgHold(ctx, 'СЖАТЬ КУЛАК');
    }
    async function end(ok) {
      over = true; air.vol(0, 1);
      if (ok) {
        await ctx.line('Он разжал кулак. На ладони блестела влага. Соль.', { pos: 'top', ms: 2400 });
        await ctx.line('Он закрыл глаза. И улыбнулся.', { pos: 'top', cls: 'amb', ms: 2400 });
        resolve({ ok: 'ok', detail: `ОЩУЩЕНИЙ ${found}/${SPOTS.length}` });
      } else {
        await ctx.line('Только горечь. Только бетон. Только файл.', { pos: 'top', cls: 'red', ms: 2400 });
        resolve({ ok: 'fail', detail: `ОЩУЩЕНИЙ ${found}/${SPOTS.length}` });
      }
    }
    scope.loop(dt => {
      t += dt;
      if (over) { draw(); return; }
      if (keysDown.size) { const sp = dt * 0.35; if (keysDown.has('ArrowLeft')) px -= sp; if (keysDown.has('ArrowRight')) px += sp; if (keysDown.has('ArrowUp')) py -= sp; if (keysDown.has('ArrowDown')) py += sp; px = clamp(px, 0, 1); py = clamp(py, 0, 1); }
      if (phase === 'seek') {
        const cx = px * C.W, cy = py * C.H;
        let best = 1e9, bi = -1;
        SPOTS.forEach((s, i) => { if (s.done) return; const [sx, sy] = toScr(s.x, s.y); const d = Math.hypot(sx - cx, sy - cy); if (d < best) { best = d; bi = i; } });
        const B = body(), near = clamp(1 - best / (B.h * 0.4), 0, 1);
        const bitter = BITTER.some(b => { const [bx, by] = toScr(b.x, b.y); return Math.hypot(bx - cx, by - cy) < B.h * 0.035; });
        if (bitter) { bitterT += dt; if (bitterT > 0.5) { ctx.say('Горечь. Прилипла к нёбу.', { pos: 'mid' }); bitterT = -2; scope.timeout(() => ctx.unsay('mid'), 1100); } }
        beatT -= dt;
        if (beatT <= 0) { beatT = lerp(1.3, 0.32, near); A.sfx.heartbeat(0.12 + near * 0.35); }
        if (best < B.h * 0.045 && !bitter) {
          if (cur !== bi) { cur = bi; dwell = 0; }
          dwell += dt;
          if (dwell >= 1.6) {
            const s = SPOTS[bi]; s.done = true; found++; cur = -1; dwell = 0; upd();
            A.sfx.chime(520 + found * 60, 0.035);
            shown = { t: s.t, x: s.x, y: s.y, a: 0 };
            ctx.say(s.t, { pos: 'top', cls: 'amb' }); scope.timeout(() => ctx.unsay('top'), 2200);
            if (found >= SPOTS.length) scope.timeout(fistPhase, 1600);
          }
        } else { cur = -1; dwell = Math.max(0, dwell - dt * 2); }
        if (t > LIMIT) end(false);
      } else if (phase === 'fist' && fistHold) {
        if (fistHold.down) { fist += dt / 4.5; if (Math.random() < dt * 3) A.sfx.heartbeat(0.3); }
        else fist = Math.max(0, fist - dt * 0.25);
        ctx.stat(`КУЛАК ${Math.round(Math.min(1, fist) * 100)}%`);
        if (fist >= 1) end(true);
      }
      if (shown) shown.a += dt;
      draw();
    });
    function draw() {
      const { g, W, H } = C, B = body();
      g.fillStyle = '#030303'; g.fillRect(0, 0, W, H);
      // силуэт — чёрный профиль на чуть более светлом
      const glow = phase === 'fist' ? 0.25 : 0.08 + found * 0.03;
      g.fillStyle = `rgba(143,176,196,${glow * 0.35})`; g.fillRect(0, 0, W, H);
      Art.clone(g, B.cx, B.top, B.h, { seed: 39, lines: false, scars: 0, skin: '#0c0b0b', t: 0 });
      // найденные ощущения — мягкое свечение
      SPOTS.forEach(s => { if (!s.done) return; const [x, y] = toScr(s.x, s.y); const gr = g.createRadialGradient(x, y, 0, x, y, B.h * 0.06); gr.addColorStop(0, 'rgba(239,230,207,.55)'); gr.addColorStop(1, 'rgba(239,230,207,0)'); g.fillStyle = gr; g.fillRect(x - B.h * 0.06, y - B.h * 0.06, B.h * 0.12, B.h * 0.12); });
      // «чувство» — маленький тёплый свет под пальцем
      if (phase === 'seek') {
        const x = px * W, y = py * H;
        const gr = g.createRadialGradient(x, y, 0, x, y, 44); gr.addColorStop(0, 'rgba(255,236,200,.28)'); gr.addColorStop(1, 'rgba(255,236,200,0)');
        g.fillStyle = gr; g.fillRect(x - 44, y - 44, 88, 88);
        if (cur >= 0) { g.strokeStyle = 'rgba(255,179,71,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, dwell / 1.6)); g.stroke(); }
      }
      if (phase === 'fist') {
        const k = Math.min(1, fist), x = W * 0.5, y = H * 0.66, r = Math.min(W, H) * (0.12 - k * 0.03);
        g.fillStyle = '#1b1614'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x - r * 0.6 + i * r * 0.4, y - r * 0.6); g.lineTo(x - r * 0.6 + i * r * 0.4, y + r * (0.2 - k * 0.4)); g.stroke(); }
        for (let i = 0; i < 12 * k; i++) { g.fillStyle = 'rgba(239,230,207,.6)'; g.fillRect(x + rand(-r, r), y + rand(-r, r), 1.5, 1.5); }
      }
      Art.grain(g, W, H, 0.06);
      Art.vignette(g, W, H, 0.85);
    }
  });
}
