/* ==========================================================================
   Глава 41 · «Срыв» — НЕ ВСТАВАТЬ. ПОТОМ — ВСТАТЬ
   К-43 вышел из капсулы и лёг. «Подъём». Тишина. Его поднимают, ведут,
   он ложится снова. Первая часть — ничего не делать: любой отклик — рефлекс.
   Потом — выстрел. К-44 помнит. Встать, взять оружие и идти, плача.
   ========================================================================== */
defineFrag(40, {
  id: 'break', name: 'Он шёл и плакал',
  text: 'К-44 пошёл. Сжимая оружие. Слёзы текли. Он не вытирал их. Шаг. Шаг. Шаг. Вентиляция гудела. Свет лился ровный. Он шёл и плакал. Тихо. Беззвучно. Но он шёл.',
  how: 'Сначала ты — К-43. Лежи. Команды, пинки, свет в глаза — не реагируй: любое нажатие — это рефлекс, пальцы сжимаются сами. Потом — К-44. Встань (держи и не отпускай, пока ноги дрожат), возьми оружие и иди: ← → по очереди.',
  keys: 'ЧАСТЬ 1 — НИЧЕГО НЕ НАЖИМАТЬ · ЧАСТЬ 2 — ЗАЖАТЬ ПРОБЕЛ, ПОТОМ ← → ПО ОЧЕРЕДИ',
  note: 'Один из нас лёг на пол и отказался вставать. Это было единственное, что он сделал. Его застрелили. Следующий встал — и плакал всю дорогу до арсенала.',
  noteDist: 'В этой записи К-43 встал на первый же окрик и пошёл в арсенал. Архив говорит, что он лежал до выстрела.',
  mem: 'ЛЁГ', start: gameBreak,
});

function gameBreak(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const CMDS = ['— К-43. Подъём.', '— Я сказал, подъём.', '— Ты слышишь меня?', '— Поднимайте. В арсенал.', '— К-43. Встань.', '— Я сказал, встань.', '— Биомясо. Бесполезное.'];
  let t = 0, over = false, phase = 'lie', reflex = 0, cmdI = 0, cmdT = 1.2, stim = null, stimT = 0, drip = 0, part1 = 0;
  let rise = 0, fell = 0, shake = 0, tookGun = false, steps = 0, lastFoot = '', tears = [];
  const P1 = 28;
  const rM = ctx.meter('РЕФЛЕКС', { cls: 'red', left: 14, top: 14 });
  ctx.hint('ЛЕЖИ · НИЧЕГО НЕ НАЖИМАЙ');
  const vent = scope.own(A.loopNoise({ type: 'lowpass', freq: 180, q: 0.5, vol: 0 }));
  vent.vol(0.03, 1);
  A.sfx.hiss(1, 0.08);

  return new Promise(resolve => {
    function react() {
      if (over || phase !== 'lie') return;
      reflex++; rM.set(reflex / 4); A.sfx.click(); FX.shake('sm');
      ctx.say('Пальцы чуть сжались — рефлекторно.', { pos: 'mid' }); scope.timeout(() => ctx.unsay('mid'), 900);
      if (reflex >= 4) getUp();
    }
    async function getUp() {
      phase = 'none';
      await ctx.line('Он поднялся на окрик. Пошёл. Шаг. Второй. В арсенал.', { pos: 'top', ms: 2600 });
      over = true;
      resolve({ ok: 'dist', detail: `РЕФЛЕКСОВ ${reflex}` });
    }
    async function shot() {
      phase = 'none';
      await ctx.line('Охранник стоял над ним. Смотрел сверху вниз.', { pos: 'top', ms: 2200 });
      A.sfx.shot(0.7); FX.flash('#ffffff', 120, 0.6);
      await ctx.line('Выстрел. Без причины. Без смысла.', { pos: 'top', cls: 'red', ms: 2200 });
      await ctx.line('Капсула открылась с шипением. К-44.', { pos: 'top', ms: 2000 });
      phase = 'rise'; rM.el.hidden = true;
      ctx.hint('ВСТАНЬ · ДЕРЖИ, ПОКА НОГИ ДРОЖАТ');
      hold = mgHold(ctx, 'ВСТАТЬ');
    }
    let hold = null, gunB = null, walkBox = null;
    function gunPhase() {
      phase = 'gun'; hold.wrap.remove();
      ctx.say('— Возьми.', { pos: 'top' });
      const box = ctx.el('div', 'ctl');
      gunB = ctx.el('button', 'btn big-btn btn-primary', box, 'ВЗЯТЬ ОРУЖИЕ');
      gunB.addEventListener('click', () => { if (phase !== 'gun') return; tookGun = true; A.sfx.stamp(); box.remove(); ctx.unsay('top'); walkPhase(); });
      requestAnimationFrame(() => gunB.focus({ preventScroll: true }));
    }
    function walkPhase() {
      phase = 'walk'; ctx.hint('← → ПО ОЧЕРЕДИ · ШАГ. ШАГ. ШАГ.');
      ctx.say('— Готов? — К-44 кивнул. Слёзы капали на оружие.', { pos: 'top' }); scope.timeout(() => ctx.unsay('top'), 2400);
      walkBox = ctx.el('div', 'ctl');
      const l = ctx.el('button', 'btn big-btn', walkBox, '← ЛЕВОЙ'), r = ctx.el('button', 'btn big-btn', walkBox, 'ПРАВОЙ →');
      scope.on(l, 'pointerdown', e => { e.preventDefault(); step('L'); }); scope.on(r, 'pointerdown', e => { e.preventDefault(); step('R'); });
    }
    function step(f) {
      if (phase !== 'walk' || over) return;
      if (f === lastFoot) { shake = 1; A.sfx.thud(0.12); return; }
      lastFoot = f; steps++; A.sfx.step(0.3, f === 'L' ? -0.3 : 0.3);
      if (steps % 3 === 0) tears.push({ x: rand(-0.02, 0.02), y: 0, v: rand(0.1, 0.2) });
      ctx.stat(`ШАГ ${steps}/24`);
      if (steps >= 24) finish();
    }
    async function finish() {
      over = true; if (walkBox) walkBox.remove(); vent.vol(0, 1);
      await ctx.line('Он шёл и плакал. Тихо. Беззвучно. Но он шёл.', { pos: 'top', cls: 'amb', ms: 3000 });
      resolve({ ok: 'ok', detail: `РЕФЛЕКСОВ ${reflex} · ПАДЕНИЙ ${fell}` });
    }
    ctx.keys(e => {
      if (phase === 'lie' && e.code !== 'Tab') react();
      if (phase === 'walk') { if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); step('L'); } if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); step('R'); } }
    });
    scope.on(C.cv, 'pointerdown', () => react());

    scope.loop(dt => {
      t += dt; shake = Math.max(0, shake - dt * 3);
      drip -= dt; if (drip <= 0) { drip = 1.6; A.sfx.drip(0.03); }
      if (!over && phase === 'lie') {
        part1 += dt;
        cmdT -= dt;
        if (cmdT <= 0 && cmdI < CMDS.length) {
          cmdT = P1 / CMDS.length;
          ctx.say(CMDS[cmdI], { pos: 'top', cls: cmdI === CMDS.length - 1 ? 'red' : '' }); scope.timeout(() => ctx.unsay('top'), 2200);
          cmdI++;
          stim = pick(['ПОДЪЁМ!', 'ВСТАТЬ', '▶ НАЖМИ', 'ПУЛЬС', 'СВЕТ']); stimT = 1.4;
          if (stim === 'СВЕТ') FX.flash('#ffffff', 200, 0.3);
          A.sfx.beep(stim === '▶ НАЖМИ' ? 1200 : 700, 0.08, 0.04);
        }
        if (stimT > 0) stimT -= dt;
        ctx.stat(`ЛЕЖАТЬ ${Math.max(0, Math.ceil(P1 - part1))} С`);
        if (part1 >= P1) shot();
      }
      if (!over && phase === 'rise' && hold) {
        if (hold.down) { rise += dt / 5; shake = Math.max(shake, 0.3 + Math.random() * 0.4); if (Math.random() < dt * 1.5) { rise -= 0.08; A.sfx.thud(0.1); } }
        else if (rise > 0.05) { rise = Math.max(0, rise - dt * 0.6); }
        rise = clamp(rise, 0, 1);
        ctx.stat(`ВСТАТЬ ${Math.round(rise * 100)}%`);
        if (rise >= 1) gunPhase();
      }
      tears.forEach(q => { q.y += q.v * dt; });
      tears = tears.filter(q => q.y < 1);
      draw();
    });
    function draw() {
      const { g, W, H } = C;
      g.save(); if (shake > 0) g.translate(rand(-1, 1) * shake * 4, rand(-1, 1) * shake * 4);
      g.fillStyle = '#0c1014'; g.fillRect(-10, -10, W + 20, H + 20);
      // ровный свет без теней, капсулы
      g.fillStyle = 'rgba(200,220,235,.06)'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 4; i++) { g.fillStyle = '#122029'; Art.rr(g, W * (0.08 + i * 0.24), H * 0.08, W * 0.12, H * 0.45, 30); g.fill(); }
      g.fillStyle = 'rgba(80,180,230,.12)'; g.beginPath(); g.ellipse(W * 0.5, H * 0.82, W * 0.3, H * 0.05, 0, 0, Math.PI * 2); g.fill();
      if (phase === 'lie' || phase === 'none' && !tookGun && rise === 0) {
        // лежит на спине, руки раскинуты, белые глаза в потолок
        const cx = W * 0.5, cy = H * 0.8, L = Math.min(W * 0.5, H * 0.9);
        g.fillStyle = '#b6c0c7';
        g.beginPath(); g.ellipse(cx - L * 0.38, cy, L * 0.07, L * 0.06, 0, 0, Math.PI * 2); g.fill();
        g.fillRect(cx - L * 0.32, cy - L * 0.05, L * 0.4, L * 0.1);
        g.fillRect(cx + L * 0.08, cy - L * 0.04, L * 0.4, L * 0.035); g.fillRect(cx + L * 0.08, cy + L * 0.005, L * 0.4, L * 0.035);
        g.save(); g.translate(cx - L * 0.2, cy); g.rotate(-0.8); g.fillRect(0, -L * 0.015, L * 0.28, L * 0.03); g.restore();
        g.save(); g.translate(cx - L * 0.2, cy); g.rotate(0.8); g.fillRect(0, -L * 0.015, L * 0.28, L * 0.03); g.restore();
        g.save(); g.shadowColor = '#fff'; g.shadowBlur = 6; g.fillStyle = '#fff'; g.fillRect(cx - L * 0.4, cy - L * 0.03, 3, 3); g.fillRect(cx - L * 0.4, cy + L * 0.01, 3, 3); g.restore();
        if (stimT > 0 && stim) { g.fillStyle = `rgba(255,${stim === '▶ НАЖМИ' ? 179 : 0},${stim === '▶ НАЖМИ' ? 71 : 51},${Math.min(1, stimT)})`; g.font = `${Math.round(H * 0.07)}px ${PIXEL}`; g.textAlign = 'center'; g.fillText(stim, W / 2, H * 0.42); }
        if (cmdI > 3) { Art.human(g, W * 0.2, H * 0.95, H * 0.7, 'soldier', { color: '#050505' }); Art.human(g, W * 0.82, H * 0.95, H * 0.7, 'soldier', { color: '#050505' }); }
      } else {
        const k = phase === 'rise' ? rise : 1;
        const h = H * 0.7 * (0.35 + k * 0.65);
        Art.clone(g, W * 0.5, H * 0.92 - h, h, { seed: 44, lines: false, scars: 0, skin: '#b6c0c7', t });
        tears.forEach(q => { g.fillStyle = 'rgba(200,230,255,.8)'; g.fillRect(W * (0.5 + q.x), H * 0.92 - h + h * (0.22 + q.y * 0.6), 2, 5); });
        if (tookGun) { g.fillStyle = '#141518'; g.fillRect(W * 0.44, H * 0.92 - h * 0.35, W * 0.14, h * 0.05); }
        if (phase === 'gun' || phase === 'walk') Art.human(g, W * 0.82, H * 0.95, H * 0.72, 'man', { color: '#0a0b0c' });
      }
      g.restore();
      Art.vignette(g, W, H, 0.6);
    }
  });
}
