/* ==========================================================================
   Глава 24 · «Брак» — ДОКАЗАТЬ, ЧТО ТЫ НЕ БРАК
   Белые глаза — дефект. Стул уже приготовлен. Санитары дают шанс:
   реакция, повиновение, точность. «Эффективный брак» — тоже годен.
   ========================================================================== */
defineFrag(23, {
  id: 'defect', name: 'Не брак',
  text: 'Он знал, что белые глаза останутся позади. Что он никогда не узнает себя. Он был браком. Ошибкой. Но он был эффективным. Этого было достаточно. Для системы. Для него — ничего.',
  how: 'Три проверки. Реакция: лампа загорится зелёным — жми сразу, но не раньше. Повиновение: «ИДИ» — вперёд, «СТОЙ» — стоп, «ЖДИ» — ничего не нажимай. Точность: попади по мечущейся метке пять раз. Наберёшь норму — годен.',
  keys: 'РЕАКЦИЯ — ПРОБЕЛ / ТАП · ИДИ — → / D · СТОЙ — ↓ / S · ЖДИ — НИЧЕГО · ТОЧНОСТЬ — ТАП / КЛИК',
  note: 'Санитар задержал палец над планшетом на секунду дольше, чем нужно. «Эффективный брак». Стул остался пустым. Я шёл дальше, не оборачиваясь.',
  mem: 'БЕЛЫЕ ГЛАЗА', start: gameDefect,
});

function gameDefect(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  let score = 0, t = 0, test = '', lamp = 'off', target = null, cmd = '', cmdT = 0, flashRed = 0;
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 55, vol: 0 }));
  hum.vol(0.025, 1);
  const upd = () => ctx.stat(`ПРОВЕРКА ${test} · БАЛЛЫ ${score}/18`);

  let onKey = null, onTap = null;
  ctx.keys(e => { if (onKey) onKey(e); });
  scope.on(C.cv, 'pointerdown', e => { const r = C.cv.getBoundingClientRect(); if (onTap) onTap(e.clientX - r.left, e.clientY - r.top); });

  async function reaction() {
    test = 'РЕАКЦИЯ'; upd();
    ctx.hint('ЛАМПА ЗЕЛЁНАЯ — ЖМИ СРАЗУ · РАНЬШЕ — ФАЛЬСТАРТ');
    for (let i = 0; i < 5; i++) {
      lamp = 'red';
      const wait = rand(1.2, 3.2);
      const res = await new Promise(res => {
        let greenAt = 0, done = false;
        const fin = v => { if (done) return; done = true; onKey = onTap = null; res(v); };
        const press = () => {
          if (lamp === 'red') { fin('early'); return; }
          fin((Clock.now() - greenAt) / 1000);
        };
        onKey = e => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); press(); } };
        onTap = () => press();
        scope.timeout(() => { if (done) return; lamp = 'green'; greenAt = Clock.now(); A.sfx.beep(1400, 0.06, 0.04); scope.timeout(() => fin('late'), 1100); }, wait * 1000);
      });
      lamp = 'off';
      if (res === 'early') { flashRed = 1; A.sfx.buzz(); ctx.say('Фальстарт.', { pos: 'mid', cls: 'red' }); }
      else if (res === 'late') { A.sfx.buzz(); ctx.say('Медленно.', { pos: 'mid', cls: 'red' }); }
      else { const pts = res < 0.6 ? 1 : 0; score += pts; A.sfx.chime(700, 0.04); ctx.say(`${Math.round(res * 1000)} мс`, { pos: 'mid', cls: pts ? 'ice' : 'red' }); }
      upd(); await scope.wait(900); ctx.unsay('mid');
    }
  }
  async function obey() {
    test = 'ПОВИНОВЕНИЕ'; upd();
    ctx.hint('ИДИ — → / D / ПРАВАЯ ПОЛОВИНА · СТОЙ — ↓ / S / ЛЕВАЯ ПОЛОВИНА · ЖДИ — НИЧЕГО');
    const seq = shuffle(['ИДИ', 'ИДИ', 'СТОЙ', 'СТОЙ', 'ЖДИ', 'ЖДИ', 'ИДИ', 'СТОЙ']);
    for (const c of seq) {
      cmd = c; cmdT = 0; A.sfx.mumble(0.5, 0.8, 0.12);
      const res = await new Promise(res => {
        let done = false;
        const fin = v => { if (done) return; done = true; onKey = onTap = null; res(v); };
        onKey = e => { if (/Arrow(Right|Up)|KeyD|KeyW/.test(e.code)) { e.preventDefault(); fin('ИДИ'); } else if (/ArrowDown|KeyS|ArrowLeft|KeyA/.test(e.code)) { e.preventDefault(); fin('СТОЙ'); } };
        onTap = x => fin(x > C.W / 2 ? 'ИДИ' : 'СТОЙ');
        scope.timeout(() => fin('ЖДИ'), c === 'ЖДИ' ? 2000 : 1500);
      });
      const ok = res === c;
      if (ok) { score += 1; A.sfx.click(); } else { A.sfx.buzz(); flashRed = 1; }
      cmd = ok ? '✓' : '✕'; upd();
      await scope.wait(500);
    }
    cmd = '';
  }
  async function aim() {
    test = 'ТОЧНОСТЬ'; upd();
    ctx.hint('ПОПАДИ ПО МЕТКЕ ПЯТЬ РАЗ · 10 СЕКУНД');
    let hits = 0, misses = 0;
    target = { x: 0.5, y: 0.5, vx: 0.35, vy: 0.28 };
    await new Promise(res => {
      let done = false;
      const fin = () => { if (done) return; done = true; onKey = onTap = null; target = null; res(); };
      onTap = (x, y) => {
        if (!target) return;
        const d = Math.hypot(x - target.x * C.W, y - target.y * C.H);
        if (d < Math.min(C.W, C.H) * 0.06) { hits++; score += 1; A.sfx.pop(0.2); target.vx *= -1.15; target.vy *= 1.1; if (hits >= 5) fin(); }
        else { misses++; A.sfx.click(); }
        upd();
      };
      onKey = e => { if (e.code === 'Space') { e.preventDefault(); onTap(C.W / 2, C.H / 2); } };
      scope.timeout(fin, 10000);
    });
  }

  scope.loop(dt => {
    t += dt; flashRed = Math.max(0, flashRed - dt * 2); cmdT += dt;
    if (target) {
      target.x += target.vx * dt; target.y += target.vy * dt;
      if (target.x < 0.1 || target.x > 0.9) target.vx *= -1;
      if (target.y < 0.15 || target.y > 0.8) target.vy *= -1;
      target.x = clamp(target.x, 0.1, 0.9); target.y = clamp(target.y, 0.15, 0.8);
    }
    draw();
  });
  function draw() {
    const { g, W, H } = C;
    drawCell(g, W, H, { t, tint: '220,235,245', seed: 24 });
    // стул в глубине и санитары в химзащите с зеркальными визорами
    g.fillStyle = '#0c0c0e'; g.fillRect(W * 0.46, H * 0.46, W * 0.08, H * 0.22); g.fillRect(W * 0.44, H * 0.6, W * 0.12, H * 0.03);
    g.strokeStyle = 'rgba(200,0,20,.5)'; g.strokeRect(W * 0.455, H * 0.47, W * 0.09, H * 0.2);
    [0.2, 0.8].forEach(x => { Art.human(g, W * x, H * 0.74, H * 0.52, 'doctor', { color: '#1a1d20' }); g.fillStyle = 'rgba(190,210,225,.7)'; g.fillRect(W * x - H * 0.025, H * 0.74 - H * 0.52 * 0.93, H * 0.05, H * 0.018); });
    // лампа реакции
    if (lamp !== 'off') {
      const col = lamp === 'green' ? '0,255,136' : '255,0,51';
      const gr = g.createRadialGradient(W / 2, H * 0.24, 0, W / 2, H * 0.24, H * 0.14);
      gr.addColorStop(0, `rgba(${col},1)`); gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr; g.fillRect(W / 2 - H * 0.14, H * 0.1, H * 0.28, H * 0.28);
    }
    if (cmd) { g.fillStyle = cmd === '✕' ? '#ff0033' : '#efe6cf'; g.font = `${Math.round(H * 0.08)}px ${PIXEL}`; g.textAlign = 'center'; g.fillText(cmd, W / 2, H * 0.3); }
    if (target) { const x = target.x * W, y = target.y * H, r = Math.min(W, H) * 0.045; g.strokeStyle = '#ff1a2e'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#ff1a2e'; g.beginPath(); g.arc(x, y, r * 0.3, 0, Math.PI * 2); g.fill(); }
    // К-37: белые глаза
    Art.profile(g, W * 0.5, H * 0.84, H * 0.3, { eyes: '#ffffff' });
    if (flashRed > 0) { g.fillStyle = `rgba(160,0,20,${flashRed * 0.35})`; g.fillRect(0, 0, W, H); }
    Art.vignette(g, W, H, 0.6);
  }

  return (async () => {
    await ctx.line('Капсула открылась. Гель стёк на пол. К-37 вышел. Остановился.', { pos: 'top', ms: 2400 });
    await ctx.line('— Белые глаза. Брак. Стул готов.', { pos: 'top', cls: 'red', ms: 2200 });
    await reaction(); await obey(); await aim();
    upd();
    if (score >= 11) {
      await ctx.line('Санитар задержал палец над планшетом на секунду дольше, чем нужно.', { pos: 'top', ms: 2800 });
      await ctx.line('— Эффективный брак. Годен.', { pos: 'top', cls: 'ice', ms: 2200 });
      return { ok: 'ok', detail: `БАЛЛЫ ${score}/18` };
    }
    await ctx.line('Санитар кивнул на стул.', { pos: 'top', cls: 'red', ms: 2200 });
    return { ok: 'fail', detail: `БАЛЛЫ ${score}/18 · НУЖНО 11` };
  })();
}
