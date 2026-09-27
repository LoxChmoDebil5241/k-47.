/* ==========================================================================
   Глава 6 · «Метина» — СТЕРЕТЬ ИЛИ ОСТАВИТЬ
   Зеркало. Сначала стереть кровь со скулы. Потом выбор: оттирать шрам,
   пока не пойдёт кровь (он не сотрётся), или медленно обвести его пальцем
   и присвоить: «моё».
   ========================================================================== */
defineFrag(5, {
  id: 'scar', name: 'Метина',
  text: 'Кровь он вытер о подол рубашки. На ткань легло тёмное пятно — новое пятно, новая метина. Он смотрел на себя в зеркало долго, очень долго, запоминая каждую морщинку на своём детском лице. Чтобы потом никогда не забыть, кто он и откуда.',
  how: 'Сотри кровь со своего отражения. Когда проступит шрам на левой скуле — реши: стереть его или оставить. Чтобы оставить — медленно проведи пальцем точно вдоль шрама, от начала до конца.',
  keys: 'ВОДИ ПАЛЬЦЕМ / МЫШЬЮ ПО ЗЕРКАЛУ · ВЫБОР — КНОПКИ ИЛИ 1 / 2 · ПРОБЕЛ — ПРОТЕРЕТЬ НАУГАД',
  note: 'Железное кольцо с тусклым красным камнем. Левая скула. Первая метина, которую я присвоил себе. Моё.',
  noteDist: 'В этой записи я тёр щёку, пока не пошла кровь. Шрам не сошёл. Архив говорит — я его оставил.',
  mem: 'МЕТИНА', start: gameScar,
});

function gameScar(ctx) {
  const { scope, body } = ctx;
  const wrap = ctx.el('div', 'sc-wrap');
  const box = ctx.el('div', 'sc-mirror', wrap);
  const cap = ctx.el('p', 'ph-cap', wrap);
  const S = Math.max(220, Math.min(body.clientWidth - 40, body.clientHeight - 150, 440));
  box.style.width = `${S}px`; box.style.height = `${S * 1.15}px`;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const mk = () => { const c = document.createElement('canvas'); c.width = Math.round(S * dpr); c.height = Math.round(S * 1.15 * dpr); c.style.width = `${S}px`; c.style.height = `${S * 1.15}px`; box.appendChild(c); const g = c.getContext('2d'); g.scale(dpr, dpr); return { c, g }; };
  const face = mk(), dirt = mk(), trace = mk();
  [dirt.c, trace.c].forEach(c => { c.style.position = 'absolute'; c.style.left = '0'; c.style.top = '0'; });
  const W = S, H = S * 1.15;
  // шрам: кривая по левой скуле (в зеркале — справа)
  const scar = [[0.62, 0.5], [0.66, 0.53], [0.7, 0.555], [0.735, 0.58]].map(([x, y]) => [x * W, y * H]);
  let phase = 'wipe', over = false, down = false, last = null, t = 0, traceIdx = 0, traceOff = 0, tries = 0, rubbed = 0, scarVis = 0;
  const rub = scope.own(A.loopNoise({ type: 'bandpass', freq: 2200, q: 0.6, vol: 0 }));

  function paintFace() {
    const g = face.g;
    g.clearRect(0, 0, W, H);
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a2622'); bg.addColorStop(1, '#141210');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // детское лицо — тёмное, свет из-за спины
    g.fillStyle = '#3a2d26'; g.beginPath(); g.ellipse(W * 0.5, H * 0.5, W * 0.27, H * 0.3, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1b1210'; g.beginPath(); g.ellipse(W * 0.5, H * 0.28, W * 0.3, H * 0.14, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#261b17'; g.fillRect(W * 0.38, H * 0.78, W * 0.24, H * 0.22);
    g.fillStyle = '#e9e2d6'; [0.4, 0.6].forEach(x => { g.beginPath(); g.ellipse(W * x, H * 0.46, W * 0.035, H * 0.018, 0, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#120b09'; [0.4, 0.6].forEach(x => { g.beginPath(); g.arc(W * x, H * 0.46, W * 0.012, 0, Math.PI * 2); g.fill(); });
    g.strokeStyle = 'rgba(20,10,8,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.44, H * 0.64); g.quadraticCurveTo(W * 0.5, H * 0.66, W * 0.56, H * 0.64); g.stroke();
    // шрам
    if (scarVis > 0) {
      g.strokeStyle = `rgba(230,200,190,${0.6 * scarVis})`; g.lineWidth = 2.2; g.lineCap = 'round';
      g.beginPath(); scar.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      if (rubbed > 0) { g.strokeStyle = `rgba(160,0,12,${Math.min(0.9, rubbed)})`; g.lineWidth = 3 + rubbed * 5; g.stroke(); }
    }
    // трещины зеркала и пятна
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1;
    const R = mulberry(66); for (let i = 0; i < 5; i++) { let x = R() * W, y = R() * H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R() - 0.5) * 60; y += (R() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
    const vg = g.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function paintDirt() {
    const g = dirt.g, R = mulberry(606);
    g.fillStyle = 'rgba(90,0,8,.92)'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${40 + R() * 70 | 0},0,${R() * 10 | 0},${0.4 + R() * 0.5})`; g.beginPath(); g.ellipse(R() * W, R() * H, W * (0.02 + R() * 0.08), H * (0.01 + R() * 0.05), R() * 3, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(40,0,4,.8)'; for (let i = 0; i < 14; i++) { const x = R() * W; g.lineWidth = 2 + R() * 4; g.beginPath(); g.moveTo(x, R() * H * 0.3); g.lineTo(x + (R() - 0.5) * 6, H * (0.5 + R() * 0.5)); g.stroke(); }
  }
  paintFace(); paintDirt();
  ctx.hint('СОТРИ КРОВЬ С ОТРАЖЕНИЯ');
  cap.textContent = 'ЗЕРКАЛО В КРОВИ';
  ctx.say('— Будешь знать, как не отвечать.', { pos: 'top', cls: 'red' });
  scope.timeout(() => ctx.unsay('top'), 2400);

  return new Promise(resolve => {
    const probe = document.createElement('canvas'); probe.width = 30; probe.height = 34;
    const pg = probe.getContext('2d', { willReadFrequently: true });
    const pos = e => { const b = dirt.c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    function wipe(x, y) {
      const g = dirt.g; g.save(); g.globalCompositeOperation = 'destination-out';
      const r = W * 0.09, rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(0,0,0,.9)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore();
    }
    function cleared() { pg.clearRect(0, 0, 30, 34); pg.drawImage(dirt.c, 0, 0, 30, 34); const d = pg.getImageData(0, 0, 30, 34).data; let op = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 60) op++; return 1 - op / (30 * 34); }
    let lastCheck = 0;
    scope.on(trace.c, 'pointerdown', e => { e.preventDefault(); down = true; try { trace.c.setPointerCapture(e.pointerId); } catch { /* */ } last = pos(e); onMove(last); });
    scope.on(trace.c, 'pointermove', e => { if (!down) return; const p = pos(e); onMove(p); });
    const up = () => { if (!down) return; down = false; rub.vol(0); if (phase === 'trace' && traceIdx < 1) failTrace('Палец соскользнул.'); };
    scope.on(trace.c, 'pointerup', up); scope.on(trace.c, 'pointercancel', up);
    ctx.keys(e => { if ((e.code === 'Space' || e.key === 'Enter') && phase === 'wipe') { e.preventDefault(); for (let i = 0; i < 4; i++) wipe(rand(0, W), rand(0, H)); A.noise({ type: 'bandpass', freq: 2400, q: 0.6, dur: 0.2, vol: 0.05 }); check(); } });
    function check() { const c = cleared(); cap.textContent = `СТЕРЕТЬ КРОВЬ · ${Math.round(Math.min(1, c / 0.75) * 100)}%`; if (c >= 0.75 && phase === 'wipe') toChoice(); }

    function onMove(p) {
      if (over) return;
      const [x, y] = p, dx = x - last[0], dy = y - last[1], dist = Math.hypot(dx, dy);
      if (phase === 'wipe') {
        const n = Math.max(1, Math.ceil(dist / (W * 0.03)));
        for (let i = 1; i <= n; i++) wipe(last[0] + dx * i / n, last[1] + dy * i / n);
        rub.vol(0.03 + Math.min(0.05, dist * 0.004));
        const now = Clock.now(); if (now - lastCheck > 220) { lastCheck = now; check(); }
      } else if (phase === 'erase') {
        const near = Math.hypot(x - scar[1][0], y - scar[1][1]) < W * 0.12;
        if (near) { rubbed = Math.min(1.2, rubbed + dist * 0.004); rub.vol(0.06); paintFace(); if (Math.random() < 0.08) A.sfx.squelch(0.08); }
        if (rubbed >= 1.2) endErase();
      } else if (phase === 'trace') {
        // расстояние до отрезка шрама
        let best = 1e9, bi = 0;
        for (let i = 0; i < scar.length - 1; i++) {
          const [ax, ay] = scar[i], [bx, by] = scar[i + 1], vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy;
          const u = clamp(((x - ax) * vx + (y - ay) * vy) / L, 0, 1), d = Math.hypot(ax + vx * u - x, ay + vy * u - y);
          if (d < best) { best = d; bi = i + u; }
        }
        const g = trace.g;
        g.strokeStyle = best < W * 0.04 ? 'rgba(255,200,190,.9)' : 'rgba(255,0,51,.8)'; g.lineWidth = 2.5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(x, y); g.stroke();
        if (best > W * 0.05) { traceOff += dist; if (traceOff > W * 0.18) failTrace('Слишком далеко от шрама.'); }
        else { traceIdx = Math.max(traceIdx, bi / (scar.length - 1)); A.tone({ f: 300 + traceIdx * 300, dur: 0.05, vol: 0.02 }); }
        if (traceIdx >= 0.97) endTrace();
      }
      last = p;
    }
    let choiceBox = null;
    async function toChoice() {
      phase = 'choice'; rub.vol(0);
      dirt.c.style.transition = 'opacity 1.2s'; dirt.c.style.opacity = '0';
      const T0 = t; scope.loop(() => { scarVis = Math.min(1, (t - T0) / 1.5); paintFace(); if (scarVis >= 1) return false; });
      cap.textContent = 'ЛЕВАЯ СКУЛА. ТОНКАЯ БЛЕДНАЯ ПОЛОСКА.';
      await ctx.line('Отец называл это «царапиной». Мальчик придумал своё слово.', { pos: 'top', ms: 2800 });
      ctx.hint('СТЕРЕТЬ — ТЕРЕТЬ ЩЕКУ · ОСТАВИТЬ — ОБВЕСТИ ШРАМ ПАЛЬЦЕМ ОТ НАЧАЛА ДО КОНЦА');
      const k = await ctx.choose(['Стереть шрам', 'Оставить. Обвести пальцем'], { cls: '' });
      if (k === 0) { phase = 'erase'; cap.textContent = 'ТРИ ЩЁКУ'; }
      else { phase = 'trace'; cap.textContent = 'ОБВЕДИ ШРАМ · СВЕРХУ ВНИЗ'; }
    }
    function failTrace(msg) {
      if (phase !== 'trace' || over) return;
      tries++; traceIdx = 0; traceOff = 0; trace.g.clearRect(0, 0, W, H); A.sfx.buzz();
      cap.textContent = `${msg.toUpperCase()} · ПОПЫТКА ${tries}/3`;
      if (tries >= 3) { over = true; (async () => { await ctx.line('Отражение расплылось. Он так и не запомнил, где она.', { pos: 'top', cls: 'red', ms: 2600 }); resolve({ ok: 'fail', detail: 'ШРАМ НЕ ОБВЕДЁН' }); })(); }
    }
    async function endTrace() {
      if (over) return; over = true; rub.vol(0);
      A.sfx.chime(560, 0.06);
      cap.textContent = 'МОЁ.';
      await ctx.line('— Моё, — сказал он отражению.', { pos: 'top', ms: 2400 });
      await ctx.line('Шрам зажил через неделю. Осталась тонкая, бледная полоска.', { pos: 'top', ms: 2800 });
      resolve({ ok: 'ok', detail: `ПОПЫТОК ${tries + 1}` });
    }
    async function endErase() {
      if (over) return; over = true; rub.vol(0);
      A.sfx.glitch(); FX.flash('#300008', 500, 0.6);
      await ctx.line('Пошла кровь. Шрам остался.', { pos: 'top', cls: 'red', ms: 2400 });
      ctx.say('НЕЙРОСЛЕПОК: РАСХОЖДЕНИЕ С ЗАПИСЬЮ', { pos: 'mid', cls: 'big red' });
      await scope.wait(2400);
      resolve({ ok: 'dist', detail: 'ШРАМ СТИРАЛИ' });
    }
    scope.loop(dt => { t += dt; });
  });
}
