/* ==========================================================================
   НОВЫЕ ФРАГМЕНТЫ · часть 5
   Веснушки · Не вставай · Бабочка · Ничего · Акт передачи · 35 пунктов ·
   Передать актив · Кулаки
   ========================================================================== */

/** лицо ребёнка с веснушками (для «Веснушек») */
function drawChildFace(g, x, y, r, t) {
  g.save(); g.translate(x, y);
  const sk = g.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.1, 0, 0, r);
  sk.addColorStop(0, '#d8c2b4'); sk.addColorStop(1, '#6a5048');
  g.fillStyle = sk; g.beginPath(); g.ellipse(0, 0, r * 0.78, r, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2a1a14'; g.beginPath(); g.ellipse(0, -r * 0.62, r * 0.84, r * 0.5, 0, Math.PI, 0); g.fill();
  [-1, 1].forEach(d => {
    g.fillStyle = '#f4f6f8'; g.beginPath(); g.ellipse(d * r * 0.3, -r * 0.08, r * 0.14, r * 0.08, 0, 0, Math.PI * 2); g.fill();
    Art.glowDot(g, d * r * 0.3, -r * 0.08, r * 0.3, 'rgba(255,255,255,.8)', 0.5 + Math.sin(t * 2) * 0.2);
  });
  const R = mulberry(47);
  g.fillStyle = 'rgba(120,60,30,.75)';
  for (let i = 0; i < 26; i++) { const a = R() * Math.PI, rr = R() * r * 0.32; g.beginPath(); g.arc(Math.cos(a) * rr * 1.6, r * 0.12 - Math.sin(a) * rr * 0.4, r * (0.015 + R() * 0.02), 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = 'rgba(60,30,30,.8)'; g.lineWidth = r * 0.03; g.beginPath(); g.moveTo(-r * 0.15, r * 0.5); g.quadraticCurveTo(0, r * 0.45, r * 0.15, r * 0.5); g.stroke();
  g.restore();
}

// ============================================================ 40 · ВЕСНУШКИ
function gameRealize(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  let ax = C.W * 0.5, ay = C.H * 0.5, phase = 'clear', t = 0, over = false, kills = 0, shots = 0, tg = null, tgT = 0.8, spawned = 0;
  let pull = 0, onChild = 0, holdOut = 0, turnHold = 0, turning = false, pointer = null, flash = 0;
  const willM = meterEl(ctx, 'ВОЛЯ', 'ice'); willM.el.hidden = true;
  const racks = Array.from({ length: 6 }, (_, k) => ({ x: 0.1 + k * 0.16, leds: Array.from({ length: 14 }, () => Math.random()) }));
  const child = { x: 0.86, y: 0.72 };
  ctx.hint('ТАП / КЛИК — ВЫСТРЕЛ ТУДА, КУДА ПОКАЗАЛ · СТРЕЛКИ + ПРОБЕЛ ТОЖЕ · ЗАЧИСТИ КОМНАТУ');
  ctx.say('Шаг. Проверка угла. Выстрел. Тело помнит маршрут.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2400);
  const rel = e => { const r = C.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  return new Promise(resolve => {
    const fire = () => {
      if (over || phase !== 'clear') return;
      shots++; A.sfx.shot(0.35); FX.shake('sm'); flash = 0.08;
      if (tg && Math.hypot(ax - tg.x * C.W, ay - tg.y * C.H) < Math.min(C.W, C.H) * 0.07) { kills++; A.sfx.thud(0.3); tg = null; tgT = rand(0.4, 0.9); }
      if (kills >= 6) toChild();
    };
    scope.on(C.cv, 'pointerdown', e => {
      const [x, y] = rel(e); pointer = { x, y };
      try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ }
      if (phase === 'clear') { ax = x; ay = y; fire(); }
    });
    scope.on(C.cv, 'pointermove', e => { const [x, y] = rel(e); if (e.pointerType === 'mouse' || pointer) pointer = { x, y }; if (phase === 'clear' && e.pointerType === 'mouse') { ax = x; ay = y; } });
    scope.on(C.cv, 'pointerup', e => { if (e.pointerType !== 'mouse') pointer = null; });
    scope.on(document, 'keydown', e => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); fire(); } });
    function toChild() {
      phase = 'child'; tg = null; willM.el.hidden = false;
      A.setAmbient('dark', 2); A.sfx.heartbeat(0.5);
      ctx.hint('НЕ СТРЕЛЯЙ · ТЯНИ ПРИЦЕЛ ПРОЧЬ ОТ РЕБЁНКА (МЫШЬ / ПАЛЕЦ / ← →) · ПРОДЕРЖИСЬ');
      ctx.say('В углу — ребёнок. Твои глаза. Твои веснушки на переносице.', { pos: 'top', cls: 'ice' });
      scope.timeout(() => ctx.say('Рука ведёт ствол к нему сама.', { pos: 'top', cls: 'red' }), 2600);
    }
    function toTurn() {
      phase = 'turn'; ctx.unsay('top');
      ctx.hint('ЗАЖМИ «РАЗВЕРНУТЬ» / ПРОБЕЛ — ПОВЕРНИ ОРУЖИЕ ОТ НЕГО');
      const b = ctx.el('button', 'g-key ice', ctx.el('div', 'ctl'), 'РАЗВЕРНУТЬ ОРУЖИЕ');
      ctx.hold(b, () => { turning = true; b.classList.add('on'); }, () => { turning = false; b.classList.remove('on'); });
    }
    scope.loop(dt => {
      t += dt; flash = Math.max(0, flash - dt);
      const { g, W, H } = C;
      const kv = 320 * dt;
      if (K.ArrowLeft) ax -= kv; if (K.ArrowRight) ax += kv; if (K.ArrowUp) ay -= kv; if (K.ArrowDown) ay += kv;
      if (phase === 'clear' && !over) {
        tgT -= dt;
        if (!tg && tgT <= 0) { spawned++; const r = pick(racks); tg = { x: r.x + 0.08, y: rand(0.45, 0.6), life: Math.max(1.1, 2 - kills * 0.12), up: 0 }; A.sfx.step(0.1, (tg.x - 0.5) * 2); }
        if (tg) { tg.life -= dt; tg.up = Math.min(1, tg.up + dt * 5); if (tg.life <= 0) { tg = null; tgT = rand(0.3, 0.8); } }
        ctx.stat(`ЗАЧИЩЕНО ${kills}/6 · ВЫСТРЕЛОВ ${shots}`);
      }
      if ((phase === 'child' || phase === 'turn') && !over) {
        const cx = child.x * W, cy = child.y * H;
        pull += dt * (phase === 'turn' ? 0.5 : 0.35); if (Math.random() < dt * 0.8) pull += 0.3;
        pull = Math.min(pull, 2.4);
        const F = (0.8 + pull) * (0.7 + Math.sin(t * 1.7) * 0.3) * (phase === 'turn' ? 1 - turnHold / 2.6 : 1);
        if (phase === 'turn' && turning) { ay += 260 * dt; ax += (W * 0.5 - ax) * Math.min(1, dt * 2); }
        else if (pointer) { ax += (pointer.x - ax) * Math.min(1, dt * 3.2); ay += (pointer.y - ay) * Math.min(1, dt * 3.2); }
        const dx = cx - ax, dy = cy - ay, d = Math.hypot(dx, dy) || 1;
        ax += dx / d * F * 60 * dt; ay += dy / d * F * 60 * dt;
        ax += rand(-1, 1) * pull * 2; ay += rand(-1, 1) * pull * 2;
        const near = d < Math.min(W, H) * 0.09;
        onChild = near ? onChild + dt : Math.max(0, onChild - dt * 0.5);
        if (near && Math.random() < dt * 3) A.sfx.heartbeat(0.4);
        willM.set(1 - onChild / 1.6);
        if (phase === 'child') { holdOut += dt; if (holdOut >= 14) toTurn(); }
        if (phase === 'turn') { turnHold = turning ? turnHold + dt : Math.max(0, turnHold - dt * 0.4); if (turnHold >= 2.6) { over = true; $$('.ctl', body).forEach(x => x.remove()); FX.flash('#ffffff', 2200, 1); A.sfx.shot(0.5); A.hold(true); scope.timeout(() => A.hold(false), 1600); ctx.say('Он увидел в его глазах себя. Не актива. Того, кем был.', { pos: 'mid', cls: 'ice' }); scope.timeout(() => resolve({ ok: 'ok', detail: `ЗАЧИЩЕНО ${kills}/6` }), 3800); } }
        if (onChild >= 1.6) { over = true; $$('.ctl', body).forEach(x => x.remove()); A.sfx.glitch(1); FX.redBlack(); ctx.say('Тело оказалось сильнее. Экран погас раньше, чем палец дожал спуск.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: 'ВОЛЯ СЛОМАНА' }), 3200); }
        ctx.stat(phase === 'turn' ? `РАЗВОРОТ ${Math.round(turnHold / 2.6 * 100)}%` : `ДЕРЖИСЬ · ${Math.max(0, Math.ceil(14 - holdOut))} С`);
      }
      ax = clamp(ax, 0, W); ay = clamp(ay, 0, H);
      // серверная
      g.fillStyle = '#04070a'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#0a1016'; g.fillRect(0, H * 0.75, W, H * 0.25);
      racks.forEach((r, k) => {
        const x = r.x * W, w = W * 0.1;
        g.fillStyle = '#0d1419'; g.fillRect(x, H * 0.2, w, H * 0.58); g.strokeStyle = '#1d2a33'; g.strokeRect(x, H * 0.2, w, H * 0.58);
        r.leds.forEach((l, i) => { const on = Math.sin(t * (2 + l * 6) + i) > 0.3; g.fillStyle = on ? (l > 0.8 ? '#ff0033' : l > 0.4 ? '#00ff88' : '#4aa8d8') : '#0b1a12'; g.fillRect(x + w * 0.15 + (i % 2) * w * 0.4, H * 0.24 + Math.floor(i / 2) * H * 0.07, 4, 3); });
      });
      if (tg) { const x = tg.x * W, base = tg.y * H + H * 0.3; g.save(); g.beginPath(); g.rect(0, 0, W, base - (1 - tg.up) * H * 0.2); g.clip(); Art.raider(g, x, base - H * 0.34, H * 0.34, { t, glow: 1, seed: spawned }); g.restore(); }
      if (phase !== 'clear') {
        Art.figure(g, child.x * W, H * 0.85, H * 0.26, { body: '#140e10', head: 1.45, eyes: '#ffffff' });
        const d = Math.hypot(ax - child.x * W, ay - child.y * H) / Math.min(W, H);
        if (d < 0.35) { const r = Math.min(W, H) * 0.12; g.save(); g.globalAlpha = clamp(1 - d / 0.35, 0, 1); g.fillStyle = '#000'; g.beginPath(); g.arc(W * 0.2, H * 0.25, r * 1.15, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(W * 0.2, H * 0.25, r * 1.1, 0, Math.PI * 2); g.clip(); drawChildFace(g, W * 0.2, H * 0.27, r, t); g.restore(); }
      }
      if (flash) { g.fillStyle = `rgba(255,220,160,${flash * 4})`; g.fillRect(0, 0, W, H); }
      const col = phase === 'clear' ? 'rgba(255,40,70,.95)' : onChild > 0.2 ? 'rgba(255,255,255,.95)' : 'rgba(136,221,255,.95)';
      drawReticle(g, ax, ay, col, 18 + (phase !== 'clear' ? Math.sin(t * 14) * pull * 2 : 0));
      if (phase === 'turn') { g.fillStyle = `rgba(255,255,255,${turnHold / 2.6 * 0.5})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.65);
    });
  });
}

// ============================================================ 41 · НЕ ВСТАВАЙ
function gameBreakdown(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const DUR = 40;
  let t = 0, over = false, phase = 'lie', moved = 0, last = null, ev = 0, fake = null, take = 0, taking = false, cry = 0;
  const PROV = [
    () => { A.sfx.system(true); ctx.say('«К-43. Подъём».', { pos: 'mid', cls: 'red' }); },
    () => { A.sfx.scare(); FX.flash('#ff0033', 400, 0.6); ctx.say('— Встать! Встать, я сказал!', { pos: 'mid', cls: 'red' }); },
    () => { A.sfx.thud(0.7); FX.shake('lg'); ctx.say('Удар ботинком в рёбра.', { pos: 'mid' }); },
    () => { fake = ctx.el('button', 'btn btn-primary big-btn', ctx.el('div', 'ctl'), 'ВСТАТЬ'); ctx.say('Ствол вложили в ладонь. Пальцы сами сжимаются.', { pos: 'mid' }); },
    () => { A.sfx.mumble(2, 0.8, 0.12); ctx.say('— Брак. Опять брак. Запиши.', { pos: 'mid', cls: 'amb' }); },
    () => { A.sfx.alarm(0.06); ctx.say('«К-43. Подъём. Подъём. Подъём».', { pos: 'mid', cls: 'red' }); FX.chroma(1200); },
    () => { A.sfx.whisper(2, 0.15); ctx.say('Мама?', { pos: 'mid', cls: 'ice' }); },
  ];
  ctx.hint('НИЧЕГО НЕ ТРОГАЙ · НЕ ЖМИ · НЕ ДВИГАЙ МЫШЬЮ · 40 СЕКУНД (ESC — ПАУЗА РАЗРЕШЕНА)');
  ctx.say('Капсула открылась. К-43 лёг на пол. И не встал.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2600);
  return new Promise(resolve => {
    const stood = why => {
      if (over || phase !== 'lie') return;
      over = true; $$('.ctl', body).forEach(x => x.remove()); A.sfx.step(0.3); A.sfx.step(0.3, 0, 0.4);
      ctx.say(`${why} Ты встал. Как все. Шаг. Шаг. Шаг.`, { pos: 'mid', cls: 'red' });
      scope.timeout(() => resolve({ ok: 'fail', detail: `ПРОЛЕЖАЛ ${Math.floor(t)} С` }), 3000);
    };
    const graceUntil = 1.2;
    scope.on(document, 'keydown', e => { if (e.key === 'Escape' || e.code === 'KeyP' || e.code === 'KeyM' || t < graceUntil) return; if (phase === 'lie') stood('Клавиша.'); }, { capture: true });
    scope.on(body, 'pointerdown', e => { if (t < graceUntil) return; if (phase === 'lie' && !e.target.closest('.st-top')) stood('Касание.'); });
    scope.on(body, 'pointermove', e => {
      if (phase !== 'lie' || e.pointerType !== 'mouse' || t < graceUntil) return;
      if (last) moved += Math.hypot(e.clientX - last.x, e.clientY - last.y);
      last = { x: e.clientX, y: e.clientY };
      if (moved > 90) stood('Рука дёрнулась.');
    });
    function toTake() {
      phase = 'take'; $$('.ctl', body).forEach(x => x.remove()); ctx.unsay('mid');
      ctx.say('Сорок третьего унесли. Капсула открылась снова. Сорок четвёртый плакал.', { pos: 'top', cls: 'ice' });
      ctx.hint('ЗАЖМИ «ВЗЯТЬ ОРУЖИЕ» / ПРОБЕЛ — И НЕ ОТПУСКАЙ, ПОКА ПЛАЧЕШЬ');
      const b = ctx.el('button', 'g-key', ctx.el('div', 'ctl'), 'ВЗЯТЬ ОРУЖИЕ');
      ctx.hold(b, () => { taking = true; b.classList.add('on'); }, () => { taking = false; b.classList.remove('on'); });
    }
    scope.loop(dt => {
      t += dt;
      if (phase === 'lie' && !over) {
        ev -= dt;
        if (ev <= 0 && t > 3) { ev = rand(3.5, 6); ctx.unsay('mid'); if (fake) { fake.parentElement.remove(); fake = null; } pick(PROV)(); }
        moved = Math.max(0, moved - dt * 20);
        if (t >= DUR) toTake();
        ctx.stat(`НЕ ВСТАВАЙ · ${Math.max(0, Math.ceil(DUR - t))} С`);
      }
      if (phase === 'take' && !over) {
        take = taking ? take + dt : Math.max(0, take - dt * 0.8); cry += dt;
        if (taking && Math.random() < dt * 1.5) A.sfx.mumble(0.6, 1.4, 0.06);
        ctx.stat(`ОРУЖИЕ ${Math.round(take / 5 * 100)}%`);
        if (take >= 5) { over = true; $$('.ctl', body).forEach(x => x.remove()); A.sfx.click(); ctx.say('Сорок четвёртый плакал, но взял оружие. Шаг. Шаг. Шаг.', { pos: 'mid' }); A.sfx.steps(3, 2, 0.15); scope.timeout(() => resolve({ ok: 'ok', detail: 'ЛЕЖАЛ 40 С · ВЗЯЛ ОРУЖИЕ' }), 3400); }
      }
      const { g, W, H } = C;
      g.fillStyle = '#060809'; g.fillRect(0, 0, W, H);
      Art.grate(g, 0, H * 0.45, W, H * 0.55, 26, 'rgba(120,140,150,.14)');
      // вид снизу: потолок, лампы, склонившиеся фигуры
      for (let i = 0; i < 3; i++) { const x = W * (0.25 + i * 0.25), a = 0.5 + Math.sin(t * 3 + i) * 0.1; Art.glowDot(g, x, H * 0.08, W * 0.18, `rgba(220,240,255,${a})`, 0.6); g.fillStyle = '#dfe9ee'; g.fillRect(x - 30, H * 0.07, 60, 5); }
      const lean = phase === 'lie' ? 0.5 + Math.sin(t * 0.7) * 0.2 : 0.2;
      Art.armor(g, W * 0.2, H * (0.1 + lean * 0.1), H * 0.7, { t, glow: 0.7, seed: 41 });
      Art.figure(g, W * 0.82, H * 0.95, H * 0.75, { body: '#0d0f11', glasses: true, t });
      if (phase === 'lie') { g.fillStyle = `rgba(0,0,0,${0.3 + Math.sin(t * 0.5) * 0.1})`; g.fillRect(0, 0, W, H); }
      if (phase === 'take') { g.fillStyle = 'rgba(180,220,240,.08)'; for (let i = 0; i < 20; i++) g.fillRect(W * (0.3 + (i * 0.037) % 0.4), H * ((t * 0.3 + i * 0.13) % 1), 2, 14); }
      Art.vignette(g, W, H, 0.8);
    });
  });
}

// ============================================================ 42 · БАБОЧКА
function gameHorror(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const DUR = 45, MAG = 8;
  let mag = MAG, reserve = 40, reloading = 0, hp = 4, t = 0, over = false, mobs = [], spawnT = 3, ax = C.W / 2, ay = C.H / 2, bf = { x: 0.5, y: 0.4, a: 0 }, flash = 0, hitCol = 0, sw = null;
  const row = ctx.el('div', 'ctl');
  const rb = ctx.el('button', 'btn big-btn', row, 'ПЕРЕЗАРЯДКА');
  ctx.hint('ТАП / КЛИК — ВЫСТРЕЛ · R / СВАЙП ВНИЗ / КНОПКА — ПЕРЕЗАРЯДКА · НЕ ПОПАДИ В БАБОЧКУ');
  ctx.say('Поле. Трава по пояс. Небо. На шлеме — белая бабочка.', { pos: 'top', cls: 'ice' });
  scope.timeout(() => ctx.unsay('top'), 2800);
  const grass = Array.from({ length: 160 }, () => ({ x: Math.random(), h: rand(0.1, 0.3), ph: Math.random() * 6 }));
  return new Promise(resolve => {
    const reload = () => { if (over || reloading || !reserve || mag === MAG) return; reloading = 1.3; A.sfx.click(); A.sfx.scrape(0.1); };
    const fire = (x, y) => {
      if (over) return;
      if (reloading) return;
      if (mag <= 0) { A.sfx.click(); if (reserve) reload(); return; }
      mag--; A.sfx.shot(0.3); flash = 0.06; FX.shake('sm');
      const bx = bf.x * C.W, by = bf.y * C.H;
      if (Math.hypot(x - bx, y - by) < Math.min(C.W, C.H) * 0.04) { over = true; row.remove(); A.sfx.glitch(1.2); FX.flash('#ffffff', 900, 0.9); ctx.say('Белые крылья разлетелись. Поле исчезло. Осталась только смола.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: 'БАБОЧКА' }), 3000); return; }
      const hit = mobs.slice().sort((a, b) => b.z - a.z).find(m => Math.abs(x - m.x * C.W) < m.z * C.H * 0.12 && y > m.y * C.H - m.z * C.H * 0.55 && y < m.y * C.H + m.z * C.H * 0.1);
      if (hit) { hit.hp--; A.sfx.pop(0.25); if (hit.hp <= 0) { hit.dead = 0.6; A.sfx.thud(0.3); } }
      if (!mag && reserve) reload();
    };
    scope.on(rb, 'click', reload);
    scope.on(C.cv, 'pointerdown', e => { const r = C.cv.getBoundingClientRect(); sw = { x: e.clientX, y: e.clientY }; ax = e.clientX - r.left; ay = e.clientY - r.top; fire(ax, ay); });
    scope.on(C.cv, 'pointermove', e => { if (e.pointerType === 'mouse') { const r = C.cv.getBoundingClientRect(); ax = e.clientX - r.left; ay = e.clientY - r.top; } });
    scope.on(C.cv, 'pointerup', e => { if (sw && e.clientY - sw.y > 60) reload(); sw = null; });
    scope.on(document, 'keydown', e => { if (e.code === 'KeyR') reload(); if (e.code === 'Space' && !e.repeat) { e.preventDefault(); fire(ax, ay); } });
    scope.loop(dt => {
      t += dt; flash = Math.max(0, flash - dt); hitCol = Math.max(0, hitCol - dt);
      const kv = 300 * dt; if (K.ArrowLeft) ax -= kv; if (K.ArrowRight) ax += kv; if (K.ArrowUp) ay -= kv; if (K.ArrowDown) ay += kv;
      bf.a += dt; bf.x = 0.5 + Math.sin(bf.a * 0.9) * 0.18 + Math.sin(bf.a * 2.3) * 0.05; bf.y = 0.38 + Math.sin(bf.a * 1.3) * 0.1;
      if (!over) {
        if (reloading) { reloading -= dt; if (reloading <= 0) { reloading = 0; const n = Math.min(MAG - mag, reserve); mag += n; reserve -= n; A.sfx.click(); } }
        if (t > 4) {
          spawnT -= dt;
          if (spawnT <= 0) { spawnT = Math.max(0.55, 1.6 - t / DUR * 1.1); mobs.push({ x: rand(0.08, 0.92), y: 0.62, z: 0.25, hp: t > 25 ? 2 : 1, rise: 0, dead: 0 }); A.sfx.creak(0.2, rand(-0.8, 0.8)); }
        }
        mobs.forEach(m => { m.rise = Math.min(1, m.rise + dt * 1.5); if (!m.dead) { m.z += dt * (0.1 + t / DUR * 0.08); m.y = 0.62 + (m.z - 0.25) * 0.4; m.x += (0.5 - m.x) * dt * 0.1; } else m.dead -= dt; });
        for (let k = mobs.length - 1; k >= 0; k--) { const m = mobs[k]; if (m.dead < 0) mobs.splice(k, 1); else if (!m.dead && m.z >= 1.05) { mobs.splice(k, 1); hp--; hitCol = 0.5; A.sfx.thud(0.6); FX.hit('#1a1a1a', true); if (hp <= 0) { over = true; row.remove(); ctx.say('Серые руки. Смола вместо крови. «К-43. Подъём».', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `${Math.floor(t)} С ИЗ ${DUR}` }), 3000); } } }
        if (t >= DUR && !over) { over = true; row.remove(); A.sfx.system(true); FX.flash('#ffffff', 1600, 1); ctx.say('«К-43. Подъём». Белый потолок. Бабочка — всё ещё в груди.', { pos: 'mid', cls: 'ice' }); scope.timeout(() => resolve({ ok: 'ok', detail: `ПАТРОНОВ ОСТАЛОСЬ ${mag + reserve}` }), 3400); }
        ctx.stat(`${reloading ? 'ПЕРЕЗАРЯДКА…' : `МАГАЗИН ${mag}/${MAG}`} · ЗАПАС ${reserve} · ${Math.max(0, Math.ceil(DUR - t))} С · ${'■'.repeat(Math.max(0, hp))}`);
      }
      ax = clamp(ax, 0, C.W); ay = clamp(ay, 0, C.H);
      const { g, W, H } = C;
      const sky = g.createLinearGradient(0, 0, 0, H * 0.6); const dark = Math.min(1, t / DUR);
      sky.addColorStop(0, `rgb(${lerp(140, 40, dark) | 0},${lerp(170, 30, dark) | 0},${lerp(190, 40, dark) | 0})`); sky.addColorStop(1, `rgb(${lerp(210, 70, dark) | 0},${lerp(200, 60, dark) | 0},${lerp(170, 60, dark) | 0})`);
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = `rgb(${lerp(70, 22, dark) | 0},${lerp(90, 28, dark) | 0},${lerp(50, 20, dark) | 0})`; g.fillRect(0, H * 0.6, W, H * 0.4);
      mobs.slice().sort((a, b) => a.z - b.z).forEach(m => {
        const x = m.x * W, base = m.y * H + m.z * H * 0.1, h = m.z * H * 0.6 * m.rise;
        g.globalAlpha = m.dead ? Math.max(0, m.dead / 0.6) : 1;
        Art.figure(g, x, base, h, { body: m.hp > 1 ? '#4a4c4e' : '#6a6c6e', eyes: '#ffffff' });
        if (m.dead) { g.fillStyle = '#0a0806'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x + rand(-h * 0.1, h * 0.1), base - h * rand(0.3, 0.8), h * 0.04, 0, Math.PI * 2); g.fill(); } }
        g.globalAlpha = 1;
      });
      grass.forEach(q => { g.strokeStyle = `rgba(${lerp(110, 30, dark) | 0},${lerp(140, 40, dark) | 0},${lerp(70, 25, dark) | 0},.9)`; g.lineWidth = 2; const x = q.x * W, sway = Math.sin(t * 1.5 + q.ph) * 8; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + sway * 0.5, H - q.h * H * 0.5, x + sway, H - q.h * H - H * 0.1); g.stroke(); });
      // бабочка
      const bx = bf.x * W, by = bf.y * H, fl = Math.abs(Math.sin(t * 14));
      g.fillStyle = '#fbfbf8'; [-1, 1].forEach(d => { g.beginPath(); g.ellipse(bx + d * 9 * fl, by, 9 * fl + 1, 11, d * 0.4, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#222'; g.fillRect(bx - 1, by - 6, 2, 12);
      Art.glowDot(g, bx, by, 26, 'rgba(255,255,255,.6)', 0.5);
      // шлем: края визора
      g.fillStyle = 'rgba(40,0,6,.85)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H * 0.08); g.quadraticCurveTo(W / 2, H * 0.01, 0, H * 0.08); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,0,51,.06)'; g.fillRect(0, 0, W, H);
      if (flash) { g.fillStyle = `rgba(255,230,180,${flash * 5})`; g.fillRect(0, 0, W, H); }
      if (hitCol) { g.fillStyle = `rgba(20,20,20,${hitCol})`; g.fillRect(0, 0, W, H); }
      drawReticle(g, ax, ay);
      Art.vignette(g, W, H, 0.55);
    });
  });
}

// ============================================================ 43 · НИЧЕГО
function gameAbyss(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const NEED = 30, LIMIT = 9;
  const WORDS = ['МАМА', 'БАБОЧКА', 'КАМУШЕК', 'ВЕСНУШКИ', 'ШОКОЛАДКА', 'ТЫ СПРАВИШЬСЯ', 'ТРАВА', 'ЗА ЧТО?', 'СОЛЬ', 'РАЗ, ДВА, ТРИ…'];
  let v = 0, vv = 0, input = 0, inT = 0, outT = 0, t = 0, over = false, spikeT = 2.5, words = [], drag = null, hist = [];
  ctx.hint('ЗАЖМИ И ТЯНИ ВВЕРХ / ВНИЗ — ГАСИ ВСПЛЕСК · ↑ ↓ ТОЖЕ · ЛИНИЯ В КОРИДОРЕ 30 СЕКУНД');
  ctx.say('К-46 лежит с открытыми глазами. Никто не зовёт.', { pos: 'top', cls: 'ice' });
  scope.timeout(() => ctx.unsay('top'), 2600);
  scope.on(C.cv, 'pointerdown', e => { drag = { y: e.clientY, v: input }; try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ } });
  scope.on(C.cv, 'pointermove', e => { if (drag) input = clamp(drag.v - (e.clientY - drag.y) / (C.H * 0.35), -1.5, 1.5); });
  scope.on(C.cv, 'pointerup', () => { drag = null; });
  return new Promise(resolve => {
    scope.loop(dt => {
      t += dt;
      if (K.ArrowUp) input = Math.min(1.5, input + dt * 2.2); else if (K.ArrowDown) input = Math.max(-1.5, input - dt * 2.2); else if (!drag) input *= Math.pow(0.2, dt);
      if (!over) {
        spikeT -= dt;
        if (spikeT <= 0) { spikeT = rand(2.2, 4.2); const dir = Math.random() < 0.5 ? -1 : 1; vv += dir * rand(1.2, 2.2); const w = pick(WORDS); words.push({ w, x: rand(0.1, 0.8), y: dir > 0 ? 0.25 : 0.75, a: 1 }); A.sfx.whisper(1, 0.1, rand(-0.6, 0.6)); A.sfx.heartbeat(0.3); }
        vv += (-v * 0.6 + input * 1.6) * dt; vv *= Math.pow(0.45, dt);
        v += vv * dt * 1.6 + rand(-0.02, 0.02);
        v = clamp(v, -1.6, 1.6);
        const inside = Math.abs(v) < 0.3;
        if (inside) inT += dt; else outT += dt;
        if (inT >= NEED) { over = true; ctx.say('Мокрые следы геля высохли за минуту. Будто никто и не проходил.', { pos: 'mid', cls: 'ice' }); scope.timeout(() => resolve({ ok: 'ok', detail: `ВНЕ КОРИДОРА ${outT.toFixed(1)} С` }), 3200); }
        else if (outT >= LIMIT) { over = true; A.sfx.scare(); ctx.say('Не получилось ничего не чувствовать. Кардиограмма сорвалась в крик.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `РОВНО ${Math.floor(inT)}/${NEED} С` }), 3000); }
        ctx.stat(`РОВНО ${Math.floor(inT)}/${NEED} С · ВСПЛЕСКИ ${outT.toFixed(1)}/${LIMIT} С`);
      }
      hist.push(v); if (hist.length > 240) hist.shift();
      const { g, W, H } = C;
      g.fillStyle = '#02070a'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(136,221,255,.06)'; g.fillRect(0, H / 2 - H * 0.3 * 0.3, W, H * 0.18);
      g.strokeStyle = 'rgba(136,221,255,.3)'; g.setLineDash([6, 6]); [-0.3, 0.3].forEach(k => { g.beginPath(); g.moveTo(0, H / 2 - k * H * 0.3); g.lineTo(W, H / 2 - k * H * 0.3); g.stroke(); }); g.setLineDash([]);
      g.strokeStyle = Math.abs(v) < 0.3 ? '#88ddff' : '#ff0033'; g.lineWidth = 2.5; g.beginPath();
      hist.forEach((q, i) => { const x = W * (i / 240), y = H / 2 - q * H * 0.3 + Math.sin(i * 0.9 + t * 8) * 2; i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
      Art.glowDot(g, W * (hist.length / 240), H / 2 - v * H * 0.3, 30, Math.abs(v) < 0.3 ? 'rgba(136,221,255,.8)' : 'rgba(255,0,51,.8)');
      words.forEach(w => { w.a -= dt * 0.35; g.fillStyle = `rgba(255,220,200,${Math.max(0, w.a) * 0.8})`; g.font = `700 ${Math.round(Math.min(W, H) * 0.05)}px ${SERIF}`; g.fillText(w.w, w.x * W, w.y * H); });
      words = words.filter(w => w.a > 0);
      // рука игрока — стрелка усилия
      g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(W - 18, H / 2, 6, -input * H * 0.2);
      Art.vignette(g, W, H, 0.7);
    });
  });
}

// ============================================================ 45 · АКТ ПЕРЕДАЧИ
const ACT_LINES = [
  { a: 'Капсулы «Регенератор-7М» — 3 ед. (0047-К, 0048-К, 0049-К)', s: '3 ед. · 0047-К вскрыта изнутри, царапины на стекле', bad: true },
  { a: 'Пластиковые мешки для утилизации — 100 шт.', s: '97 шт. · три израсходованы: К-45, К-46, К-47', bad: true },
  { a: 'Маркировочные бирки — 500 шт.', s: '452 шт. · 48 бирок: К-0 … К-47', bad: true },
  { a: 'Портативные биомониторы — 4 ед.', s: '3 ед. · один остался в ангаре, под телами', bad: true },
  { a: 'Питательная среда «Плацента-Ультра» — 500 л', s: '470 л · расход на регенерацию К-47', bad: true },
  { a: 'Паяльные лампы — 5 ед.', s: '5 ед.', bad: false },
  { a: 'Скальпели, зажимы, ножницы — 3 набора', s: '3 набора', bad: false },
  { a: 'Накопители геля — 2 ёмкости по 250 л', s: '2 ёмкости', bad: false },
  { a: 'Светодиодные панели — 4, аварийные лампы — 2', s: '4 + 2', bad: false },
  { a: 'Нейропрофили серии К-0 … К-47 — 48 ед.', s: '48 ед. · журнал аномалий прилагается', bad: false },
  { a: 'Центрифуга «Циклон-3» — 1 ед.', s: '1 ед.', bad: false },
];
function gameProperty(ctx) {
  const { scope } = ctx;
  const wrap = ctx.el('div', 'g-center'); wrap.style.justifyContent = 'flex-start';
  const doc = ctx.el('div', 'g-panel paper', wrap);
  const lines = shuffle(ACT_LINES.filter(x => x.bad)).slice(0, 4).concat(shuffle(ACT_LINES.filter(x => !x.bad)).slice(0, 4));
  const list = shuffle(lines);
  doc.innerHTML = '<div class="g-h">АКТ ПРИЁМА-ПЕРЕДАЧИ ИМУЩЕСТВА № К-48/НТ</div><div class="g-sub" style="color:#5a4a40;letter-spacing:.06em">Vitezstvi → NanoTrasen · «Купол-7» · 26.11.3026</div>';
  const ul = ctx.el('ul', 'g-list', doc); ul.style.marginTop = '.6rem';
  const need = lines.filter(x => x.bad).length;
  let marked = 0, errors = 0, left = 80, over = false, phase = 'check', t = 0;
  const K = keyState(scope);
  const lis = list.map((it, n) => {
    const li = ctx.el('li', '', ul);
    li.style.cssText = 'cursor:pointer;flex-direction:column;gap:.2rem;background:rgba(255,255,255,.35);border-color:rgba(0,0,0,.12);color:#1d2230';
    li.innerHTML = `<span><b>${n + 1}.</b> ${esc(it.a)}</span><small style="color:#0a5a3a;font-family:var(--f-mono)">склад: ${esc(it.s)}</small>`;
    li.tabIndex = 0; li.setAttribute('role', 'button');
    const act = () => {
      if (over || phase !== 'check' || li.dataset.done) return;
      li.dataset.done = 1;
      if (it.bad) { marked++; li.style.background = 'rgba(176,16,30,.18)'; li.style.textDecoration = 'line-through'; A.sfx.stamp(); }
      else { errors++; li.style.background = 'rgba(255,179,71,.3)'; A.sfx.error(); FX.shake('sm'); ctx.say('Совпадает. Лишняя пометка — лишний вопрос.', { pos: 'bot', cls: 'amb' }); scope.timeout(() => ctx.unsay('bot'), 1300); if (errors >= 3) end(false, 'Инвентаризация сорвана. Акт вернули на доработку.'); }
      if (marked >= need) toSign();
    };
    scope.on(li, 'click', act); scope.on(li, 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    return li;
  });
  ctx.hint('ТАП ПО СТРОКЕ АКТА, ГДЕ СКЛАД НЕ СОВПАДАЕТ (ИЛИ 1–8) · ПОТОМ ПОДПИСЬ И ПЕЧАТЬ · 3 ОШИБКИ — СРЫВ');
  return new Promise(resolve => {
    function end(ok, text) { if (over) return; over = true; ctx.say(text, { pos: 'mid', cls: ok ? '' : 'red' }); scope.timeout(() => resolve({ ok: ok ? 'ok' : 'fail', detail: `РАСХОЖДЕНИЙ ${marked}/${need} · ОШИБОК ${errors}` }), 3000); }
    function toSign() {
      phase = 'sign'; A.sfx.page();
      ctx.hint('ПРОВЕДИ ПОДПИСЬ ПО ЛИНИИ (ИЛИ ЗАЖМИ ПРОБЕЛ) · ПОТОМ ПЕЧАТЬ');
      const box = ctx.el('div', 'g-panel paper', wrap); box.style.position = 'relative';
      box.innerHTML = '<div class="g-h">ПОДПИСИ СТОРОН</div><small>От передающей стороны: И. Захаев · От принимающей стороны: ____________</small>';
      const cvWrap = ctx.el('div', '', box); cvWrap.style.cssText = 'position:relative;height:120px;margin-top:.4rem;border-bottom:1px solid #1d2230;touch-action:none';
      const S = ctx.canvas(cvWrap);
      let ink = 0, lastP = null, drawing = false;
      const sig = [];
      scope.on(S.cv, 'pointerdown', e => { drawing = true; try { S.cv.setPointerCapture(e.pointerId); } catch { /* */ } lastP = null; });
      scope.on(S.cv, 'pointermove', e => { if (!drawing) return; const r = S.cv.getBoundingClientRect(), p = [e.clientX - r.left, e.clientY - r.top]; if (lastP) { ink += Math.hypot(p[0] - lastP[0], p[1] - lastP[1]); sig.push([lastP, p]); } lastP = p; });
      scope.on(S.cv, 'pointerup', () => { drawing = false; lastP = null; });
      let autoX = 0;
      const stampB = ctx.el('button', 'btn btn-primary', box, 'ПЕЧАТЬ'); stampB.disabled = true; stampB.style.marginTop = '.6rem';
      scope.on(stampB, 'click', () => { if (over) return; A.sfx.stamp(); FX.shake('sm'); const st = ctx.el('div', '', box); st.style.cssText = 'position:absolute;right:14px;bottom:10px;padding:.3rem .6rem;border:3px solid #1a3a8a;color:#1a3a8a;font:700 .8rem var(--f-disp);letter-spacing:.1em;transform:rotate(-8deg);opacity:.85'; st.textContent = 'NANOTRASEN · ПРИНЯТО'; stampB.disabled = true; end(true, 'Акт подписан. Дело закрыто.'); });
      scope.loop(dt => {
        if (phase !== 'sign') return false;
        if (K.Space && ink < 260) { const x = 20 + autoX, y = 60 + Math.sin(autoX * 0.08) * 22; if (autoX) sig.push([[x - 3, 60 + Math.sin((autoX - 3) * 0.08) * 22], [x, y]]); autoX += 3; ink += 3.5; }
        const { g, W, H } = S; g.clearRect(0, 0, W, H);
        g.strokeStyle = '#1d2850'; g.lineWidth = 2; g.lineCap = 'round';
        sig.forEach(([a, b]) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
        if (ink >= 240 && stampB.disabled && !over) { stampB.disabled = false; stampB.focus({ preventScroll: true }); }
      });
      scope.timeout(() => box.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' }), 50);
    }
    scope.on(document, 'keydown', e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= lis.length && phase === 'check') lis[n - 1].click(); });
    scope.loop(dt => {
      t += dt;
      if (!over && phase === 'check') { left -= dt; if (left <= 0) end(false, 'Время составления истекло. Представители сторон ушли.'); }
      ctx.stat(phase === 'check' ? `РАСХОЖДЕНИЙ ${marked}/${need} · ОШИБОК ${errors}/3 · ${Math.max(0, Math.ceil(left))} С` : 'ПОДПИСЬ И ПЕЧАТЬ');
    });
  });
}

// ============================================================ 46 · 35 ПУНКТОВ
const REG_FAKE = {
  '3.2': '3.2. Актив имеет право на вечный покой по собственному запросу.',
  '3.4': '3.4. Актив имеет право на имя. Персонал обязан обращаться к активу по имени.',
  '3.8': '3.8. Активы могут разговаривать друг с другом и делиться воспоминаниями.',
  '3.11': '3.11. Жалобы на боль и усталость признаются обоснованными. Актив получает сон и питание.',
  '3.12': '3.12. Актив обязан оказать помощь раненому, даже если это не предусмотрено заданием.',
  '3.17': '3.17. Актив имеет право вести дневник. Записи хранятся до конца цикла и передаются следующему.',
  '3.24': '3.24. Воспоминания о прошлых циклах сохраняются и не подлежат удалению.',
  '3.26': '3.26. Просьба о пощаде рассматривается персоналом в течение суток.',
  '3.27': '3.27. Актив может улыбаться.',
  '3.34': '3.34. Актив имеет право не выходить из капсулы.',
  '3.16': '3.16. Вопросы «за что?», «почему я?», «кто я?» признаются нормой и заслуживают ответа.',
};
function reglamentItems() {
  const src = (BOOK[45] && BOOK[45].p) || [];
  const items = [];
  src.forEach(p => { const m = /^3\.(\d+)\.\s/.exec(p); if (m) items.push({ id: `3.${m[1]}`, text: p.length > 190 ? `${p.slice(0, 186).replace(/\s+\S*$/, '')}…` : p }); });
  if (items.length < 20) for (let i = items.length + 1; i <= 35; i++) items.push({ id: `3.${i}`, text: `3.${i}. Актив обязан выполнять требования персонала.` });
  return items;
}
function gameReglament(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const all = reglamentItems();
  const fakes = new Set(shuffle(Object.keys(REG_FAKE).filter(id => all.some(x => x.id === id))).slice(0, 9));
  const items = all.map(x => (fakes.has(x.id) ? { id: x.id, text: REG_FAKE[x.id], fake: true } : x));
  const wrap = ctx.el('div', 'g-center');
  const doc = ctx.el('div', 'g-panel paper', wrap); doc.style.minHeight = '9.5rem';
  const tbar = meterEl(ctx, 'ВРЕМЯ НА ПУНКТ', 'amb');
  const row = ctx.el('div', 'ctl');
  const bA = ctx.el('button', 'btn btn-ok big-btn', row, '1 · ОЗНАКОМЛЕН'), bF = ctx.el('button', 'btn btn-primary big-btn', row, '2 · ПОДДЕЛКА');
  let k = 0, errors = 0, caught = 0, left = 0, T = 5.5, over = false, locked = true, t = 0;
  ctx.hint('← / 1 — ОЗНАКОМЛЕН · → / 2 — ПОДДЕЛКА · НЕ ОТВЕТИЛ — ЗНАЧИТ, ОЗНАКОМЛЕН · НЕ БОЛЕЕ 4 ОШИБОК');
  return new Promise(resolve => {
    function show() {
      if (k >= items.length) return finish();
      const it = items[k];
      T = Math.max(3.2, 5.5 - k * 0.07); left = T; locked = false;
      const seed = hash(it.id) + G.cycle;
      doc.innerHTML = `<div class="g-h">РЕГЛАМЕНТ № К-00/Р · ПУНКТ ${k + 1}/${items.length}</div><div class="g-text" style="font-size:1rem">${glitchHTML(it.text, 0.05 + Math.random() * 0.05, seed)}</div>`;
      A.sfx.page();
    }
    function answer(fake) {
      if (locked || over) return; locked = true;
      const it = items[k], right = fake === !!it.fake;
      if (!right) { errors++; A.sfx.error(); FX.flash(it.fake ? '#ff0033' : '#ffb347', 250, 0.3); ctx.say(it.fake ? 'Подделка прошла как «ознакомлен». Носитель запомнил неправду.' : 'Это настоящий пункт. Отклонить его нельзя.', { pos: 'bot', cls: 'red' }); scope.timeout(() => ctx.unsay('bot'), 1500); }
      else { if (it.fake) { caught++; A.sfx.stamp(); } else A.sfx.key(); }
      if (errors >= 5) { over = true; row.remove(); doc.innerHTML = '<div class="g-h">НОСИТЕЛЬ ПОВРЕЖДЁН</div><div class="g-text">Регламент смешался с подделками. Теперь уже никто не знает, что там было написано.</div>'; scope.timeout(() => resolve({ ok: 'fail', detail: `ОШИБОК ${errors}` }), 2600); return; }
      scope.timeout(() => { k++; show(); }, right ? 350 : 900);
    }
    function finish() {
      over = true; row.remove();
      doc.innerHTML = '<div class="g-h">4. ПРИМЕЧАНИЕ</div><div class="g-text">4.3. В случае возникновения у персонала моральных сомнений относительно применения настоящего регламента рекомендуется перечитать документ.</div>';
      scope.timeout(() => resolve({ ok: 'ok', detail: `ПОДДЕЛОК ПОЙМАНО ${caught}/${fakes.size} · ОШИБОК ${errors}` }), 3000);
    }
    scope.on(bA, 'click', () => answer(false)); scope.on(bF, 'click', () => answer(true));
    scope.on(document, 'keydown', e => { if (e.key === '1' || e.key === 'ArrowLeft') answer(false); if (e.key === '2' || e.key === 'ArrowRight') answer(true); });
    ctx.say('Тридцать пять пунктов. Носитель повреждён: часть подменена.', { pos: 'bot' });
    scope.timeout(() => { ctx.unsay('bot'); show(); }, 2000);
    scope.loop(dt => {
      t += dt;
      if (!locked && !over) { left -= dt; if (left <= 0) answer(false); }
      tbar.set(left / T);
      ctx.stat(`ПУНКТ ${Math.min(k + 1, items.length)}/${items.length} · ОШИБОК ${errors}/4`);
      const { g, W, H } = C;
      g.fillStyle = '#0b0708'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,0,51,.05)'; for (let i = 0; i < 12; i++) g.fillRect(0, (t * 60 + i * H / 12) % H, W, 1);
      g.globalAlpha = 0.07; g.fillStyle = '#ff0033'; g.font = `700 ${Math.round(W * 0.12)}px ${DISP}`; g.textAlign = 'center'; g.fillText('К-00/Р', W / 2, H * 0.95); g.textAlign = 'left'; g.globalAlpha = 1;
      Art.vignette(g, W, H, 0.6);
    });
  });
}

// ============================================================ 47 · ПЕРЕДАТЬ АКТИВ
const TRANSFER_MEMS = ['МАМИНЫ РУКИ', 'БЕЛАЯ БАБОЧКА', 'СЕРЫЙ КАМУШЕК', 'ВЕСНУШКИ', '«ТЫ СПРАВИШЬСЯ»', 'ШОКОЛАДКА', 'СОЛЬ НА ГУБАХ', 'ТРАВА ПО ПОЯС', 'ЗВЕЗДА НА ЗАПАДЕ', 'ФОТО НА СТЕНЕ'];
function gameTransfer(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const row = ctx.el('div', 'ctl');
  const bL = ctx.el('button', 'btn btn-ice big-btn', row, '← NANOTRASEN'), bR = ctx.el('button', 'btn btn-amber big-btn', row, 'СКРЫТАЯ ЯЧЕЙКА →');
  const TOTAL = 60;
  let sw = 0, packets = [], spawnT = 0.5, sent = 0, lost = 0, emitted = 0, hidden = [], over = false, t = 0, flow = 0.95;
  const mems = shuffle(TRANSFER_MEMS);
  ctx.hint('← → / КНОПКИ / ТАП ПО СТРЕЛКЕ — КУДА ИДЁТ ПОТОК · ДАННЫЕ → ПОРТ ≥ 90% · ВОСПОМИНАНИЯ → ЯЧЕЙКА, НЕ БОЛЬШЕ ТРЁХ');
  ctx.say('Нейропрофиль К-47 уходит в NanoTrasen пакет за пакетом.', { pos: 'top', cls: 'ice' });
  scope.timeout(() => ctx.unsay('top'), 2600);
  return new Promise(resolve => {
    const set = d => { if (over) return; if (sw !== d) { sw = d; A.sfx.click(); } };
    scope.on(bL, 'click', () => set(0)); scope.on(bR, 'click', () => set(1));
    scope.on(C.cv, 'pointerdown', e => { const r = C.cv.getBoundingClientRect(); set((e.clientX - r.left) / r.width < 0.5 ? 0 : 1); });
    scope.on(document, 'keydown', e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') set(0); if (e.code === 'ArrowRight' || e.code === 'KeyD') set(1); });
    function finish() {
      over = true; row.remove();
      const dataPct = Math.round(sent / Math.max(1, sent + lost) * 100);
      G.diverted = hidden.slice(0, 3); Save.put(true);
      if (hidden.length > 3) { A.sfx.alarm(0.08); ctx.say('— Расхождение в пакетах. Кто-то уводит данные. Ячейка вскрыта.', { pos: 'mid', cls: 'red' }); G.diverted = []; Save.put(true); return scope.timeout(() => resolve({ ok: 'fail', detail: 'ЯЧЕЙКА ОБНАРУЖЕНА' }), 3000); }
      if (dataPct < 90) { A.sfx.buzz(); ctx.say(`Передано ${dataPct}%. Акт не сходится. Передачу повторят — без тебя.`, { pos: 'mid', cls: 'red' }); return scope.timeout(() => resolve({ ok: 'fail', detail: `ПЕРЕДАНО ${dataPct}%` }), 3000); }
      A.sfx.system(false);
      ctx.say(hidden.length ? `— И дальше без счёта..? — Теперь их забота. В ячейке: ${hidden.join(', ').toLowerCase()}.` : '— И дальше без счёта..? — Теперь их забота. Считать будут другие.', { pos: 'mid' });
      scope.timeout(() => resolve({ ok: 'ok', detail: `ПЕРЕДАНО ${dataPct}% · СКРЫТО ${hidden.length}/3` }), 3600);
    }
    scope.loop(dt => {
      t += dt;
      if (!over) {
        spawnT -= dt;
        if (spawnT <= 0 && emitted < TOTAL) {
          emitted++; spawnT = Math.max(0.42, 0.9 - emitted * 0.008);
          const mem = emitted > 4 && Math.random() < 0.2 && mems.length ? mems.shift() : null;
          packets.push({ y: -0.05, x: 0.5, mem, code: mem ? null : `0x${(hash(emitted + 'k47') & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`, dir: null });
        }
        packets.forEach(p => {
          if (p.dir === null) { p.y += dt * 0.28 * flow; if (p.y >= 0.55) { p.dir = sw; if (p.mem) { if (sw === 1) { hidden.push(p.mem); A.sfx.chime(420 + hidden.length * 60, 0.05); if (hidden.length > 3) { FX.flash('#ff0033', 300, 0.4); } } else { A.sfx.beep(900, 0.04, 0.03); } } else { if (sw === 0) { sent++; } else { lost++; A.sfx.error(); } } } }
          else { p.x += (p.dir ? 1 : -1) * dt * 0.5; p.y += dt * 0.12; }
        });
        packets = packets.filter(p => p.x > -0.1 && p.x < 1.1);
        if (hidden.length > 3) finish();
        else if (emitted >= TOTAL && !packets.length) finish();
        ctx.stat(`ПАКЕТЫ ${emitted}/${TOTAL} · ПОТЕРИ ${lost} · В ЯЧЕЙКЕ ${hidden.length}/3`);
      }
      const { g, W, H } = C;
      g.fillStyle = '#03060a'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(136,221,255,.25)'; g.lineWidth = 16; g.lineCap = 'round';
      g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H * 0.55); g.stroke();
      g.strokeStyle = sw === 0 ? 'rgba(136,221,255,.55)' : 'rgba(136,221,255,.15)'; g.beginPath(); g.moveTo(W / 2, H * 0.55); g.lineTo(W * 0.02, H * 0.75); g.stroke();
      g.strokeStyle = sw === 1 ? 'rgba(255,179,71,.55)' : 'rgba(255,179,71,.12)'; g.beginPath(); g.moveTo(W / 2, H * 0.55); g.lineTo(W * 0.98, H * 0.75); g.stroke();
      g.fillStyle = '#88ddff'; g.font = `700 ${Math.round(Math.min(W, H) * 0.035)}px ${DISP}`; g.fillText('NANOTRASEN', W * 0.03, H * 0.7);
      g.fillStyle = '#ffb347'; g.textAlign = 'right'; g.fillText(`ЯЧЕЙКА ${hidden.length}/3`, W * 0.97, H * 0.7); g.textAlign = 'left';
      // стрелка переключателя
      g.save(); g.translate(W / 2, H * 0.55); g.rotate(sw ? -0.5 : 0.5 + Math.PI); g.fillStyle = sw ? '#ffb347' : '#88ddff'; g.beginPath(); g.moveTo(40, 0); g.lineTo(0, -14); g.lineTo(0, 14); g.closePath(); g.fill(); g.restore();
      packets.forEach(p => {
        const x = p.x * W, y = p.y * H;
        if (p.mem) { g.fillStyle = 'rgba(255,179,71,.18)'; g.fillRect(x - 80, y - 14, 160, 28); g.strokeStyle = '#ffb347'; g.lineWidth = 1; g.strokeRect(x - 80, y - 14, 160, 28); g.fillStyle = '#ffd9a0'; g.font = `12px ${SERIF}`; g.textAlign = 'center'; g.fillText(p.mem, x, y + 4); g.textAlign = 'left'; }
        else { g.fillStyle = 'rgba(136,221,255,.14)'; g.fillRect(x - 30, y - 10, 60, 20); g.fillStyle = '#88ddff'; g.font = `10px ${MONO}`; g.textAlign = 'center'; g.fillText(p.code, x, y + 4); g.textAlign = 'left'; }
      });
      Art.scan(g, W, H, 0.15);
      Art.vignette(g, W, H, 0.6);
    });
  });
}

// ============================================================ 49 · КУЛАКИ
const FISTS_Q = [
  { q: '— Как вы спите?', o: ['— Никак.', '— Как положено.', '(промолчать)'] },
  { q: '— Вы помните, что было до капсулы?', o: ['— Нет.', '— Поле. Трава.', '— А вы?'] },
  { q: '— Что вы чувствуете, когда слышите «подъём»?', o: ['— Ничего.', '— Счёт.', '— Страх.'] },
  { q: '— Фикус на подоконнике. Вы его поливали?', o: ['— Он мой?', '— Никто не знает, сколько ему воды.', '— Нет.'] },
  { q: '— Вы хотели бы, чтобы вас звали по имени?', o: ['— У меня номер.', '— Не знаю.', '— Какому?'] },
];
function gameAfterFists(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const tM = meterEl(ctx, 'НАПРЯЖЕНИЕ');
  const row = ctx.el('div', 'ctl'); row.style.bottom = 'calc(min(140px, 34vw) + 26px)'; row.style.flexWrap = 'wrap';
  const keyRow = ctx.el('div', 'ctl');
  const key = ctx.el('button', 'g-key', keyRow, 'РАЗЖАТЬ'); key.style.width = key.style.height = 'min(140px, 34vw)';
  let tension = 0.25, t = 0, beat = 0, last = 0, over = false, qi = 0, qT = 3, asking = false, pulses = [], good = 0;
  const qs = FISTS_Q;
  ctx.hint('ЖМИ «РАЗЖАТЬ» / ПРОБЕЛ В ТАКТ ЧАСАМ · ОТВЕЧАЙ КНОПКАМИ / 1–3 · НЕ ДАЙ НАПРЯЖЕНИЮ ДОЙТИ ДО КРАЯ');
  ctx.say('Слишком светлая комната. Часы за стеной: секунда, секунда, секунда.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2800);
  return new Promise(resolve => {
    const press = () => {
      if (over) return;
      const since = t - last, to = 1 - since;
      const off = Math.min(since, Math.max(0, to));
      if (off < 0.16) { tension = Math.max(0, tension - 0.07); good++; A.sfx.tick(); pulses.push({ a: 1, ok: true }); }
      else { tension += 0.05; A.sfx.buzz(); pulses.push({ a: 1, ok: false }); }
    };
    scope.on(key, 'pointerdown', e => { e.preventDefault(); key.classList.add('on'); press(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => scope.on(key, ev, () => key.classList.remove('on')));
    scope.on(document, 'keydown', e => {
      if (e.code === 'Space' && !e.repeat) { e.preventDefault(); key.classList.add('on'); press(); }
      const n = parseInt(e.key, 10); if (asking && n >= 1 && n <= 3) answer(n - 1);
    });
    scope.on(document, 'keyup', e => { if (e.code === 'Space') key.classList.remove('on'); });
    function ask() {
      asking = true; const q = qs[qi];
      ctx.say(q.q, { pos: 'mid' });
      row.innerHTML = '';
      q.o.forEach((o, n) => { const b = ctx.el('button', 'btn', row, `${n + 1} · ${o}`); b.style.flex = '1 1 160px'; scope.on(b, 'click', () => answer(n)); });
    }
    function answer(n) {
      if (!asking || over) return; asking = false; row.innerHTML = ''; ctx.unsay('mid');
      A.sfx.mumble(0.8, 0.9, 0.1);
      if (n === 2 && qi % 2 === 0) tension += 0.08;
      qi++; qT = 5.5;
      if (qi >= qs.length) { over = true; scope.timeout(() => { ctx.say('— На сегодня всё. — Кулаки лежат на коленях. Разжатые.', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `В ТАКТ ${good}` }), 3000); }, 600); }
    }
    scope.loop(dt => {
      t += dt;
      if (t - last >= 1) { last = Math.floor(t); beat++; A.sfx.tick(); }
      if (!over) {
        tension += dt * (0.028 + qi * 0.006 + (asking ? 0.02 : 0));
        if (!asking) { qT -= dt; if (qT <= 0) ask(); }
        if (tension >= 1) {
          over = true; row.remove(); keyRow.remove(); ctx.unsay('mid');
          A.sfx.thud(0.9); FX.shake('lg'); FX.flash('#ffffff', 300, 0.6);
          ctx.say('Кулак — в стол. Она не вздрогнула. «Вы остановились сами», — сказала она.', { pos: 'mid', cls: 'amb' });
          scope.timeout(() => resolve({ ok: 'dist', detail: `ВОПРОСОВ ${qi}/${qs.length}` }), 3400);
        }
        ctx.stat(`ВОПРОС ${Math.min(qi + 1, qs.length)}/${qs.length} · ТИК ${beat}`);
      }
      tM.set(tension);
      const { g, W, H } = C;
      g.fillStyle = '#e9e6df'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#d6d2c8'; g.fillRect(0, H * 0.7, W, H * 0.3);
      // окно и фикус
      g.fillStyle = '#f8f8f4'; g.fillRect(W * 0.62, H * 0.1, W * 0.3, H * 0.4); g.strokeStyle = '#b8b4aa'; g.lineWidth = 4; g.strokeRect(W * 0.62, H * 0.1, W * 0.3, H * 0.4);
      g.fillStyle = '#8a5a3a'; g.fillRect(W * 0.7, H * 0.44, W * 0.06, H * 0.06);
      for (let i = 0; i < 7; i++) { g.fillStyle = i % 3 ? '#3a6a3a' : '#a8a040'; g.beginPath(); g.ellipse(W * 0.73 + Math.cos(i) * W * 0.03, H * 0.38 - i * H * 0.012, W * 0.012, H * 0.03, i, 0, Math.PI * 2); g.fill(); }
      // часы
      const cx = W * 0.2, cy = H * 0.22, r = Math.min(W, H) * 0.08;
      g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 3; g.stroke();
      const sa = (Math.floor(t) % 60) / 60 * Math.PI * 2 - Math.PI / 2;
      g.strokeStyle = '#c00'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(sa) * r * 0.9, cy + Math.sin(sa) * r * 0.9); g.stroke();
      const ph = t - last; if (ph < 0.15) { g.strokeStyle = `rgba(0,0,0,${0.3 - ph * 2})`; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r + ph * 80, 0, Math.PI * 2); g.stroke(); }
      // психолог и камера с красной точкой
      Art.figure(g, W * 0.45, H * 0.72, H * 0.45, { body: '#3a3a44', glasses: true, t });
      g.fillStyle = '#222'; g.fillRect(W * 0.9, H * 0.05, 30, 16); g.fillStyle = Math.sin(t * 3) > 0 ? '#ff0033' : '#600'; g.beginPath(); g.arc(W * 0.9 + 24, H * 0.05 + 8, 3, 0, Math.PI * 2); g.fill();
      // кулаки внизу
      const clench = clamp(tension, 0, 1);
      [-1, 1].forEach(d => { const x = W / 2 + d * W * 0.18, y = H * 0.92; g.fillStyle = '#b89a88'; g.beginPath(); g.ellipse(x, y, W * 0.07 * (1 - clench * 0.3), H * 0.06, 0, 0, Math.PI * 2); g.fill(); if (clench > 0.5) { g.strokeStyle = '#6a4a3a'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x - W * 0.04 + i * W * 0.025, y - H * 0.03); g.lineTo(x - W * 0.04 + i * W * 0.025, y + H * 0.01); g.stroke(); } } });
      pulses.forEach(p => { p.a -= dt * 2; g.strokeStyle = p.ok ? `rgba(0,160,90,${p.a})` : `rgba(200,0,40,${p.a})`; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r + (1 - p.a) * 30, 0, Math.PI * 2); g.stroke(); });
      pulses = pulses.filter(p => p.a > 0);
      if (clench > 0.7) { g.fillStyle = `rgba(200,0,30,${(clench - 0.7) * 0.4})`; g.fillRect(0, 0, W, H); }
    });
  });
}
