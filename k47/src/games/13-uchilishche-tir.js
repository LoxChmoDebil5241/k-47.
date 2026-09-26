/* ==========================================================================
   Глава 13 · перенесено из прототипа «Мини-игры» (механика сохранена)
   ========================================================================== */
defineFrag(12, {
  id: "tir", name: "Тир",
  text: "Как-то после стрельб Каримов подошёл к нему. Держал в руке его мишень — всю в аккуратных пробоинах, в «яблочке» ни одного промаха. — Ты стреляешь как бог. Но богам здесь не место.",
  how: "Семь выстрелов из пневматики. Прицел плывёт вместе с дыханием. Зажми — задержи дыхание, прицел успокоится. Отпусти — плавный спуск. Дыхания хватает ненадолго. Нужно 60 очков из 70.",
  keys: "МЫШЬ — ЦЕЛИТЬСЯ, ЗАЖАТЬ — ДЫШАТЬ, ОТПУСТИТЬ — ВЫСТРЕЛ · ПАЛЕЦ: ПРИЖМИ, ВЕДИ, ОТПУСТИ · СТРЕЛКИ + ПРОБЕЛ",
  note: "Он разорвал мишень пополам, потом ещё раз, и бросил в лужу. Я смотрел, как бумага темнеет. Ничего не сказал.",
  mem: "ПРОБОИНЫ В ЯБЛОЧКЕ", start: ctx => gameTir(ctx),
});

function gameTir(ctx) {
  const { scope, body } = ctx;
  if (document.activeElement) document.activeElement.blur();
  const C = ctx.canvas();
  const SHOTS = 7, NEED = 60;
  const meter = ctx.el('div', 'meter ice', body, 'ДЫХАНИЕ<div class="mb"><i></i></div>');
  meter.style.left = '14px'; meter.style.bottom = '14px';
  const mFill = $('i', meter);
  let L = { cx: 0, cy: 0, R: 1 };
  const layout = () => { L = { cx: C.W / 2, cy: C.H * .44, R: Math.min(C.W * .42, C.H * .26) }; };
  layout(); C.onResize = layout;
  let shots = 0, score = 0, holding = false, breath = 1, exhausted = false, fatigue = 0, t = 0, kick = 0, cool = 0, over = false, tear = -1, jolt = 0, beat = .9;
  const holes = [], floats = [];
  let rx = 0, ry = 0;
  const upd = () => ctx.stat(`ВЫСТРЕЛ ${shots}/${SHOTS} · ОЧКИ ${score}/${NEED}`);
  upd();
  ctx.hint('ЗАЖМИ — ЗАДЕРЖИ ДЫХАНИЕ · ОТПУСТИ — ВЫСТРЕЛ · ДЫХАНИЯ ~3 С, ПОТОМ ДРОЖЬ');
  ctx.say('Дыхание. Прицел. Плавный спуск.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2600);

  return new Promise(resolve => {
    const aim = makeAim(ctx, {
      start: [clamp(L.cx - L.R * 1.4, 30, C.W - 30), clamp(L.cy + L.R * 1.1, 30, C.H - 30)],
      onHold() { if (over || cool > 0) return; holding = true; if (!exhausted) A.noise({ type: 'lowpass', freq: 500, dur: .35, vol: .05 }); },
      onRelease() { if (!holding) return; holding = false; fire(); },
    });
    function fire() {
      if (over || cool > 0) return;
      const d = Math.hypot(rx - L.cx, ry - L.cy) / L.R;
      const pts = d < 1 ? 10 - Math.floor(d * 10) : 0;
      holes.push({ dx: (rx - L.cx) / L.R, dy: (ry - L.cy) / L.R });
      floats.push({ x: rx, y: ry, t: 0, s: pts ? `+${pts}` : 'МИМО' });
      score += pts; shots++; upd();
      A.sfx.pop(); kick = 1; cool = .6; fatigue += .1;
      if (shots >= SHOTS) end();
    }
    async function end() {
      over = true; holding = false;
      await scope.wait(1000);
      if (score >= NEED) {
        await ctx.line('Каримов подошёл. Держал мишень — всю в аккуратных пробоинах.', { pos: 'top', ms: 3000 });
        await ctx.line('— Комаров. Ты стреляешь как бог.', { pos: 'top', ms: 2300 });
        ctx.say('— Но богам здесь не место. Заруби себе на носу.', { pos: 'top', cls: 'red' });
        await scope.wait(1600);
        tear = 0; A.sfx.tear();
        await scope.wait(2600);
        ctx.unsay('top'); await scope.wait(400);
        await ctx.line('Бумага темнеет и расползается в луже. Он ничего не сказал.', { pos: 'top', ms: 2800 });
        resolve({ ok: 'ok', detail: `ОЧКИ ${score}/70` });
      } else {
        await ctx.line(`${score} из 70. Каримов даже не подошёл.`, { pos: 'top', cls: 'red', ms: 2600 });
        resolve({ ok: 'fail', detail: `ОЧКИ ${score}/70 · НУЖНО ${NEED}` });
      }
    }

    scope.loop(dt => {
      t += dt; aim.tick(dt);
      cool = Math.max(0, cool - dt); kick = Math.max(0, kick - dt * 4);
      if (holding && !exhausted) {
        breath -= dt / 3.1;
        if (breath <= 0) { breath = 0; exhausted = true; A.noise({ type: 'bandpass', freq: 900, q: 1, dur: .6, vol: .1, attack: .05 }); }
      } else {
        breath = Math.min(1, breath + dt * .28);
        if (exhausted && breath >= .45) exhausted = false;
      }
      const calm = holding && !exhausted;
      beat -= dt; if (beat <= 0) { beat = 60 / (72 + fatigue * 60); jolt = 1; }
      jolt = Math.max(0, jolt - dt * 7);
      const amp = L.R * .34 * (calm ? .3 : exhausted ? 1.5 : 1) * (1 + fatigue);
      let sx = amp * (.6 * Math.sin(t * .83) + .35 * Math.sin(t * 1.9 + 1.3) + .15 * Math.sin(t * 4.7));
      let sy = amp * (.55 * Math.cos(t * .71 + .5) + .35 * Math.sin(t * 1.57 + 2) + .15 * Math.cos(t * 5.3));
      if (exhausted) { sx += rand(-1, 1) * amp * .12; sy += rand(-1, 1) * amp * .12; }
      rx = aim.x + sx; ry = aim.y + sy - kick * L.R * .22 + jolt * L.R * .07;
      mFill.style.width = `${breath * 100}%`;
      meter.firstChild.textContent = exhausted ? 'ДЫХАНИЕ СБИЛОСЬ' : 'ДЫХАНИЕ';
      if (tear >= 0) tear = Math.min(1, tear + dt / 2.2);
      floats.forEach(f => { f.t += dt; });
      draw(calm);
    });

    function draw(calm) {
      const { g, W, H } = C, { cx, cy, R } = L;
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0e0a0b'); bg.addColorStop(.55, '#17110f'); bg.addColorStop(1, '#0a0707');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(160, 120, 100, .09)'; g.lineWidth = 1;
      const vy = cy - R * .2;
      for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(cx + i * R * .12, vy); g.lineTo(cx + i * W * .22, H); g.stroke(); }
      for (let i = 0; i < 3; i++) { const lx = W * (.2 + i * .3); const lg = g.createRadialGradient(lx, 0, 0, lx, 0, H * .5); lg.addColorStop(0, 'rgba(255, 230, 190, .13)'); lg.addColorStop(1, 'rgba(255, 230, 190, 0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H * .5); }
      // лужа
      g.fillStyle = 'rgba(20, 30, 40, .7)';
      g.beginPath(); g.ellipse(cx, H * .9, R * 1.1, R * .16, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(120, 150, 170, .12)'; g.stroke();
      // мишень (или две её половины)
      const drawTarget = () => {
        g.fillStyle = '#e6dfcb'; g.fillRect(cx - R * 1.15, cy - R * 1.15, R * 2.3, R * 2.3);
        for (let k = 1; k <= 10; k++) {
          const rr = R * (11 - k) / 10;
          if (k === 7) { g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.fill(); }
          g.strokeStyle = k >= 7 ? 'rgba(230, 225, 210, .7)' : 'rgba(20, 20, 20, .8)'; g.lineWidth = 1;
          g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.stroke();
        }
        g.fillStyle = 'rgba(20,20,20,.55)'; g.font = `${Math.max(8, R * .07)}px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (let k = 1; k <= 6; k++) g.fillText(String(k), cx, cy - R * (10.5 - k) / 10);
        holes.forEach(h => {
          const hx = cx + h.dx * R, hy = cy + h.dy * R, inBlack = Math.hypot(h.dx, h.dy) < .4;
          g.fillStyle = '#050505'; g.beginPath(); g.arc(hx, hy, Math.max(2.5, R * .028), 0, Math.PI * 2); g.fill();
          g.strokeStyle = inBlack ? 'rgba(240, 235, 220, .8)' : 'rgba(80, 60, 40, .6)'; g.lineWidth = 1;
          g.beginPath(); g.arc(hx, hy, Math.max(3.5, R * .036), 0, Math.PI * 2); g.stroke();
        });
      };
      if (tear < 0) drawTarget();
      else {
        const k = easeOut(tear);
        [-1, 1].forEach(s => {
          g.save();
          g.translate(s * k * R * .7, k * (H * .9 - cy) * .9);
          g.translate(cx, cy); g.rotate(s * k * .9); g.translate(-cx, -cy);
          g.beginPath();
          if (s < 0) { g.moveTo(cx - R * 1.2, cy - R * 1.2); g.lineTo(cx + 4, cy - R * 1.2); for (let i = 0; i <= 12; i++) g.lineTo(cx + (i % 2 ? 6 : -5), cy - R * 1.2 + i * R * .2); g.lineTo(cx - R * 1.2, cy + R * 1.2); }
          else { g.moveTo(cx + R * 1.2, cy - R * 1.2); g.lineTo(cx + 4, cy - R * 1.2); for (let i = 0; i <= 12; i++) g.lineTo(cx + (i % 2 ? 6 : -5), cy - R * 1.2 + i * R * .2); g.lineTo(cx + R * 1.2, cy + R * 1.2); }
          g.closePath(); g.clip();
          g.globalAlpha = 1 - k * .5;
          drawTarget();
          g.fillStyle = `rgba(20, 30, 40, ${k * .6})`; g.fillRect(cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6);
          g.restore();
        });
      }
      floats.forEach(f => {
        if (f.t > 1.2) return;
        g.globalAlpha = 1 - f.t / 1.2; g.fillStyle = f.s === 'МИМО' ? '#ff3355' : '#ffe0e6';
        g.font = `14px ${PIXEL}`; g.textAlign = 'center';
        g.fillText(f.s, f.x, f.y - 26 - f.t * 40); g.globalAlpha = 1;
      });
      if (!over) drawReticle(g, rx, ry, calm ? 'rgba(160, 230, 255, .95)' : exhausted ? 'rgba(255, 30, 60, 1)' : 'rgba(255, 70, 100, .9)', 16);
    }
  });
}
