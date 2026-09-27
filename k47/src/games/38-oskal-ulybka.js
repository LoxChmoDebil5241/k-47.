/* ==========================================================================
   Глава 38 · «Оскал» — УДЕРЖАТЬ ЛИЦО
   К-40 выжил. Внутри — хор предшественников: «Выжил! Не умер!»
   Голоса тянут нитки, пришитые к мышцам лица, — улыбка ползёт в оскал.
   Вокруг охранники с пистолетами, труповозка урчит. Дождись транспорта.
   ========================================================================== */
defineFrag(37, {
  id: 'grin', name: 'Оскал',
  text: 'Он не хотел улыбаться. Но улыбка расползалась, искажая лицо, обнажая сжатые зубы. Белые глаза — мутные, безумные — расширились. В них не было торжества. Только шок.',
  how: 'Голоса предшественников всплывают вокруг лица и тянут улыбку вверх. Тапай голоса — гаси их. Зажми «СЖАТЬ ЗУБЫ», чтобы тянуть лицо обратно, — но сила кончается. Если оскал держится долго, охранники нервничают. Дождись отдельного транспорта.',
  keys: 'ТАП / КЛИК ПО ГОЛОСУ — ЗАГЛУШИТЬ · ЗАЖАТЬ ПРОБЕЛ — СЖАТЬ ЗУБЫ',
  note: '«Выжил! Не умер! Мы победили!» — пели они во мне. А я стоял, и лицо улыбалось без меня. Санитар сказал: он и был мёртвый, но кто-то забыл ему об этом сказать.',
  mem: 'МЫ — ОН', start: gameGrin,
});

function gameGrin(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const LINES = ['Выжил!', 'Не умер!', 'Смотрите, он стоит!', 'Мы — он. Он — мы.', 'Мы победили!', 'Он улыбается!', 'Он понимает!', 'Улыбайся!', 'Живой! Живой!', 'Ещё! Ещё!'];
  let t = 0, over = false, smile = 0.1, force = 1, tension = 0, voices = [], nextV = 0.6, clench = false, WAIT = 42;
  const smM = ctx.meter('ОСКАЛ', { cls: 'red', left: 14, top: 14 });
  const fM = ctx.meter('СИЛА', { cls: 'amb', left: 14, top: 44 });
  const tM = ctx.meter('ОХРАНА', { right: 14, top: 14 });
  const hold = mgHold(ctx, 'СЖАТЬ ЗУБЫ');
  hold.onDown = () => { clench = true; }; hold.onUp = () => { clench = false; };
  const choir = scope.own(A.loopOsc({ type: 'triangle', freq: 220, vol: 0, lp: 900 }));
  const choir2 = scope.own(A.loopOsc({ type: 'triangle', freq: 277, vol: 0, lp: 900 }));
  const engine = scope.own(A.loopNoise({ type: 'lowpass', freq: 120, q: 0.6, vol: 0 }));
  engine.vol(0.05, 1);
  ctx.hint('ГАСИ ГОЛОСА · ДЕРЖИ ЛИЦО · ЖДИ ТРАНСПОРТ');
  ctx.say('Он пришёл в себя на полу ангара. Он был жив.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2600);

  return new Promise(resolve => {
    const face = () => { const s = Math.min(C.W, C.H) * 0.62; return { cx: C.W / 2, cy: C.H * 0.48, s }; };
    scope.on(C.cv, 'pointerdown', e => {
      const r = C.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const v = voices.find(v => !v.dead && Math.abs(v.x - x) < v.w / 2 + 10 && Math.abs(v.y - y) < 18);
      if (v) { v.dead = true; A.sfx.pop(0.15); }
    });
    ctx.keys(e => { if (e.code === 'KeyF' || e.key === 'Enter') { const v = voices.find(v => !v.dead); if (v) { v.dead = true; A.sfx.pop(0.15); } } });
    async function end(ok) {
      over = true; choir.vol(0, 0.6); choir2.vol(0, 0.6);
      if (ok) {
        await ctx.line('— Этого — в изолятор. Вызови отдельный транспорт.', { pos: 'top', ms: 2400 });
        await ctx.line('— Он и был мёртвый. Но кто-то забыл ему об этом сказать.', { pos: 'top', cls: 'amb', ms: 3000 });
        resolve({ ok: 'ok', detail: `ОСКАЛ НА ПОГРУЗКЕ ${Math.round(smile * 100)}%` });
      } else {
        A.sfx.shot(0.6); FX.flash('#ffffff', 120, 0.5);
        await ctx.line('— Меня это больше бесит, чем если бы он орал. Выстрел.', { pos: 'top', cls: 'red', ms: 2800 });
        resolve({ ok: 'fail', detail: `ДО ТРАНСПОРТА ${Math.ceil(WAIT - t)} С` });
      }
    }
    scope.loop(dt => {
      t += dt;
      if (!over) {
        nextV -= dt;
        if (nextV <= 0) {
          nextV = rand(0.5, 1.1) * (1 - t / WAIT * 0.4);
          const F = face(), a = rand(0, Math.PI * 2), r = F.s * rand(0.55, 0.85);
          const txt = pick(LINES);
          voices.push({ txt, x: clamp(F.cx + Math.cos(a) * r, 60, C.W - 60), y: clamp(F.cy + Math.sin(a) * r * 0.7, 40, C.H - 90), life: 0, w: txt.length * 8 + 10, dead: false });
          A.sfx.whisper(0.6, 0.05, rand(-0.8, 0.8));
        }
        const live = voices.filter(v => !v.dead);
        live.forEach(v => { v.life += dt; });
        smile += dt * (live.length * 0.028 + 0.012);
        if (clench && force > 0) { smile -= dt * 0.36; force -= dt * 0.22; }
        else force = Math.min(1, force + dt * 0.07);
        smile = clamp(smile, 0, 1); force = clamp(force, 0, 1);
        tension = clamp(tension + dt * (smile > 0.62 ? (smile - 0.5) * 0.35 : -0.05), 0, 1);
        voices = voices.filter(v => !v.dead || (v.fade = (v.fade || 0) + dt) < 0.3);
        choir.vol(Math.min(0.05, live.length * 0.008)); choir2.vol(Math.min(0.04, live.length * 0.006));
        smM.set(smile); fM.set(force); tM.set(tension);
        ctx.stat(`ТРАНСПОРТ ЧЕРЕЗ ${Math.max(0, Math.ceil(WAIT - t))} С`);
        if (tension >= 1) end(false);
        else if (t >= WAIT) end(true);
      }
      draw();
    });
    function draw() {
      const { g, W, H } = C, F = face();
      g.fillStyle = '#0a0607'; g.fillRect(0, 0, W, H);
      // аварийная лампа
      const lamp = 0.5 + 0.5 * Math.sin(t * 5);
      g.fillStyle = `rgba(255,0,51,${0.06 + lamp * 0.08})`; g.fillRect(0, 0, W, H);
      // охранники по краям, стволы в сторону клона
      [0.06, 0.94].forEach((x, i) => { Art.human(g, W * x, H * 1.02, H * 0.9, 'soldier', { color: '#050505' }); g.strokeStyle = tension > 0.6 ? '#ff0033' : '#444'; g.lineWidth = 3; g.beginPath(); g.moveTo(W * x, H * 0.45); g.lineTo(W * x + (i ? -1 : 1) * W * 0.07, H * 0.45 - tension * 20); g.stroke(); });
      // лицо: чёрный профиль-силуэт анфас, белые глаза
      const { cx, cy, s } = F;
      g.fillStyle = '#b7aba2'; g.beginPath(); g.ellipse(cx, cy, s * 0.3, s * 0.4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(138,10,24,.8)'; g.fillRect(cx - s * 0.2, cy - s * 0.26, s * 0.1, s * 0.015);
      g.strokeStyle = 'rgba(138,10,24,.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - s * 0.16, cy - s * 0.24); g.lineTo(cx - s * 0.13, cy - s * 0.06); g.stroke();
      const eyeW = s * (0.05 + smile * 0.02);
      g.save(); g.shadowColor = '#fff'; g.shadowBlur = 10; g.fillStyle = '#f4f4f8';
      g.beginPath(); g.ellipse(cx - s * 0.11, cy - s * 0.1, eyeW, eyeW * (0.5 + smile * 0.4), 0, 0, Math.PI * 2); g.ellipse(cx + s * 0.11, cy - s * 0.1, eyeW, eyeW * (0.5 + smile * 0.4), 0, 0, Math.PI * 2); g.fill(); g.restore();
      // рот: дуга тянется вверх; при оскале — зубы
      const my = cy + s * 0.2, mw = s * (0.12 + smile * 0.12), curve = s * smile * 0.16;
      g.strokeStyle = '#2a0c0c'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(cx - mw, my - curve); g.quadraticCurveTo(cx, my + curve * 0.9, cx + mw, my - curve); g.stroke();
      if (smile > 0.45) {
        g.fillStyle = '#e8e2d6'; g.beginPath(); g.moveTo(cx - mw * 0.9, my - curve * 0.85); g.quadraticCurveTo(cx, my + curve * 0.75, cx + mw * 0.9, my - curve * 0.85); g.quadraticCurveTo(cx, my + curve * 0.2, cx - mw * 0.9, my - curve * 0.85); g.fill();
        g.strokeStyle = '#2a0c0c'; g.lineWidth = 1; for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(cx + k * mw * 0.2, my - curve * 0.3); g.lineTo(cx + k * mw * 0.2, my + curve * 0.35); g.stroke(); }
      }
      // нитки от уголков рта к голосам
      voices.forEach(v => {
        if (v.dead) return;
        const side = v.x < cx ? -1 : 1;
        g.strokeStyle = `rgba(239,230,207,${0.25 + 0.2 * Math.sin(t * 9 + v.x)})`; g.lineWidth = 1;
        g.beginPath(); g.moveTo(cx + side * mw, my - curve); g.lineTo(v.x, v.y); g.stroke();
      });
      voices.forEach(v => {
        const a = v.dead ? 1 - v.fade / 0.3 : Math.min(1, v.life * 4);
        g.globalAlpha = Math.max(0, a);
        g.fillStyle = 'rgba(10,6,7,.85)'; g.fillRect(v.x - v.w / 2, v.y - 14, v.w, 24);
        g.strokeStyle = 'rgba(255,179,71,.6)'; g.strokeRect(v.x - v.w / 2 + 0.5, v.y - 13.5, v.w - 1, 23);
        g.fillStyle = '#ffb347'; g.font = `13px ${MONO}`; g.textAlign = 'center'; g.fillText(`«${v.txt}»`, v.x + rand(-1, 1) * smile, v.y + 3);
        g.globalAlpha = 1;
      });
      Art.vignette(g, W, H, 0.7);
    }
  });
}
