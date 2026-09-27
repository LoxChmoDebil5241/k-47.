/* ==========================================================================
   НОВЫЕ ФРАГМЕНТЫ · часть 3
   Брак · Повар · Санитар · Шипение · Техник · Коктейль · Смотритель · Наблюдатель
   ========================================================================== */

// ============================================================ 24 · БРАК
function gameDefect(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  let test = 0, state = 'wait', t = 0, lampAt = 0, lampOn = false, trial = 0, times = [], falses = 0, passed = 0, over = false;
  let dots = [], dotT = 0, dotHits = 0, dotShown = 0, flashes = 0, flash = null, flashErr = 0, flashT = 1;
  const cloneImg = offCanvas(260, 340); Art.clone(cloneImg.getContext('2d'), 260, 340, { t: 2, seed: 37 });
  const TESTS = ['РЕАКЦИЯ', 'ТОЧНОСТЬ', 'ВЫДЕРЖКА'];
  const HINTS = ['ЖМИ (ТАП / ПРОБЕЛ), КОГДА ЛАМПА СТАНЕТ БЕЛОЙ. РАНЬШЕ — ОШИБКА', 'ТАП ПО ТОЧКЕ, ПОКА НЕ ПОГАСЛА · ИЛИ 1–9 ПО СЕТКЕ 3×3', 'ЖМИ ТОЛЬКО НА БЕЛЫЙ СВЕТ · НА КРАСНЫЙ — НЕ ЖМИ'];
  ctx.say('— Брак, — сказал санитар. — Проверим, насколько эффективный.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2800);
  return new Promise(resolve => {
    function startTest() {
      ctx.hint(HINTS[test]); state = 'wait'; trial = 0;
      ctx.say(`ТЕСТ ${test + 1}/3 · ${TESTS[test]}`, { pos: 'mid', cls: 'big' }); scope.timeout(() => ctx.unsay('mid'), 1400);
      if (test === 0) { times = []; falses = 0; scope.timeout(armLamp, 1800); }
      if (test === 1) { dots = []; dotHits = 0; dotShown = 0; dotT = 1.8; }
      if (test === 2) { flashes = 0; flashErr = 0; flashT = 1.8; flash = null; }
    }
    function armLamp() { lampOn = false; state = 'arm'; lampAt = ctx.now() + rand(1400, 3800); }
    function endTest(ok) {
      if (ok) { passed++; A.sfx.chime(600 + passed * 100, 0.05); } else A.sfx.buzz();
      ctx.say(ok ? 'Годен к использованию.' : 'Показатель ниже нормы.', { pos: 'mid', cls: ok ? '' : 'red' }); scope.timeout(() => ctx.unsay('mid'), 1300);
      test++; state = 'pause';
      if (test >= 3) { over = true; scope.timeout(finish, 1500); } else scope.timeout(startTest, 1700);
    }
    async function finish() {
      const ok = passed >= 2;
      await ctx.line('— Брак, — повторил он. Голос ровный, хриплый, чужой.', { pos: 'mid', ms: 2600 });
      await ctx.line(ok ? '— Да, — сказал санитар. — Но живой.' : '— Утилизация. Он пошёл сам, не дожидаясь, пока его возьмут под руки.', { pos: 'mid', cls: ok ? '' : 'red', ms: 2800 });
      resolve({ ok: ok ? 'ok' : 'fail', detail: `ТЕСТОВ ${passed}/3` });
    }
    function press(gx, gy) {
      if (over) return;
      if (test === 0) {
        if (state === 'arm') { falses++; A.sfx.error(); ctx.say('Рано.', { pos: 'bot', cls: 'red' }); scope.timeout(() => ctx.unsay('bot'), 700); if (falses > 2) endTest(false); else armLamp(); }
        else if (state === 'lit') { const rt = ctx.now() - lampAt; times.push(rt); A.sfx.beep(1200, 0.05); ctx.float(`${Math.round(rt)} мс`, C.W / 2, C.H * 0.3); trial++; if (trial >= 5) { const avg = times.reduce((a, b) => a + b, 0) / times.length; endTest(avg < 480); } else armLamp(); }
      } else if (test === 1 && gx !== undefined) {
        const hit = dots.findIndex(d => Math.hypot(d.x - gx, d.y - gy) < 0.07);
        if (hit >= 0) { dots.splice(hit, 1); dotHits++; A.sfx.pop(0.2); }
      } else if (test === 2 && flash) {
        if (flash.c === 'w' && !flash.hit) { flash.hit = true; A.sfx.beep(1400, 0.04); } else if (flash.c === 'r') { flashErr++; A.sfx.error(); FX.flash('#ff0033', 200, 0.3); flash.hit = true; }
      }
    }
    scope.on(C.cv, 'pointerdown', e => { const r = C.cv.getBoundingClientRect(); press((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
    scope.on(document, 'keydown', e => {
      if (e.repeat) return;
      if ((e.code === 'Space' || e.code === 'Enter') && test !== 1) { e.preventDefault(); press(); }
      const n = parseInt(e.key, 10);
      if (test === 1 && n >= 1 && n <= 9) { const gx = 0.3 + ((n - 1) % 3) * 0.2, gy = 0.3 + Math.floor((n - 1) / 3) * 0.2; press(gx, gy); }
    });
    startTest();
    scope.loop(dt => {
      t += dt;
      if (!over) {
        if (test === 0 && state === 'arm' && ctx.now() >= lampAt) { state = 'lit'; lampOn = true; lampAt = ctx.now(); }
        if (test === 0 && state === 'lit' && ctx.now() - lampAt > 1500) { times.push(1500); trial++; if (trial >= 5) endTest(times.reduce((a, b) => a + b, 0) / times.length < 480); else armLamp(); }
        if (test === 1 && state !== 'pause') {
          dotT -= dt;
          if (dotT <= 0 && dotShown < 8) { dotShown++; dotT = rand(0.7, 1.1); const k = irand(0, 8); dots.push({ x: 0.3 + (k % 3) * 0.2 + rand(-0.03, 0.03), y: 0.3 + Math.floor(k / 3) * 0.2 + rand(-0.03, 0.03), life: 1.1 }); A.sfx.beep(700, 0.03, 0.03); }
          dots.forEach(d => { d.life -= dt; }); dots = dots.filter(d => d.life > 0);
          if (dotShown >= 8 && !dots.length) endTest(dotHits >= 6);
        }
        if (test === 2 && state !== 'pause') {
          flashT -= dt;
          if (flash) { flash.t -= dt; if (flash.t <= 0) { if (flash.c === 'w' && !flash.hit) flashErr++; flash = null; flashT = rand(0.35, 0.8); } }
          else if (flashT <= 0 && flashes < 12) { flashes++; flash = { c: Math.random() < 0.55 ? 'w' : 'r', t: 0.75, hit: false }; }
          else if (flashes >= 12 && !flash) endTest(flashErr <= 2);
        }
        ctx.stat(`ТЕСТ ${Math.min(test + 1, 3)}/3 · ${TESTS[Math.min(test, 2)]} · ПРОЙДЕНО ${passed}`);
      }
      const { g, W, H } = C;
      g.fillStyle = '#dde3e6'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#c8d0d4'; g.fillRect(0, H * 0.75, W, H * 0.25);
      // матовое стекло с отражением
      const mw = Math.min(W * 0.3, H * 0.45), mx = W * 0.06, my = H * 0.12;
      g.fillStyle = '#9aa3a8'; g.fillRect(mx, my, mw, mw * 1.3);
      g.globalAlpha = 0.75; g.drawImage(cloneImg, mx + 4, my + 4, mw - 8, mw * 1.3 - 8); g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(mx, my, mw, mw * 1.3);
      if (test === 0 || over) {
        const on = lampOn && state === 'lit';
        g.fillStyle = on ? '#ffffff' : '#8a0010'; g.beginPath(); g.arc(W * 0.65, H * 0.4, Math.min(W, H) * 0.1, 0, Math.PI * 2); g.fill();
        Art.glowDot(g, W * 0.65, H * 0.4, Math.min(W, H) * 0.3, on ? 'rgba(255,255,255,.9)' : 'rgba(255,0,40,.5)');
      } else if (test === 1) {
        g.strokeStyle = 'rgba(0,0,0,.12)'; for (let k = 0; k < 9; k++) { g.strokeRect(W * (0.2 + (k % 3) * 0.2), H * (0.2 + Math.floor(k / 3) * 0.2), W * 0.2, H * 0.2); }
        dots.forEach(d => { g.fillStyle = '#1d2850'; g.beginPath(); g.arc(d.x * W, d.y * H, 12 + d.life * 8, 0, Math.PI * 2); g.fill(); });
        g.fillStyle = '#333'; g.font = `12px ${MONO}`; g.fillText(`ПОПАДАНИЙ ${dotHits}/8`, W * 0.2, H * 0.16);
      } else if (test === 2) {
        const col = flash ? (flash.c === 'w' ? '#ffffff' : '#ff0033') : '#555';
        g.fillStyle = col; g.fillRect(W * 0.5, H * 0.25, W * 0.3, H * 0.3);
        if (flash) Art.glowDot(g, W * 0.65, H * 0.4, W * 0.3, flash.c === 'w' ? 'rgba(255,255,255,.8)' : 'rgba(255,0,40,.7)');
        g.fillStyle = '#333'; g.font = `12px ${MONO}`; g.fillText(`ВСПЫШЕК ${flashes}/12 · ОШИБОК ${flashErr}/2`, W * 0.5, H * 0.2);
      }
      Art.vignette(g, W, H, 0.35);
    });
  });
}

// ============================================================ 25 · ПОВАР
function gameCook(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const susM = meterEl(ctx, 'ПОДОЗРЕНИЕ');
  const walkB = ctx.el('button', 'btn btn-primary big-btn', ctx.el('div', 'ctl'), 'ИДТИ');
  const FOOD = ['БУТЕРБРОД', 'КАША В МИСКЕ', 'КАРТОШКА В ФОЛЬГЕ'];
  let trip = 0, x = 0.06, walking = false, sus = 0, t = 0, over = false, camA = 0, camDir = 1, guard = 0.5, gDir = 1, gFace = 1, gPause = 0, stepT = 0;
  ctx.hold(walkB, () => { walking = true; }, () => { walking = false; });
  ctx.hint('ЗАЖМИ «ИДТИ» / ПРОБЕЛ — ИДЁШЬ · ОТПУСТИ — ЗАМЕР · КРАСНЫЙ КОНУС КАМЕРЫ И ВЗГЛЯД ОХРАНЫ — ОПАСНО');
  ctx.say('Парень сидел у стены, поджав колени. Босой. В чужой форме.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3000);
  const bg = cachedBg(C, (g, W, H) => {
    g.drawImage(Art.concrete(Math.round(W), Math.round(H), { base: '#1f1d1c', seed: 25, cracks: 6 }), 0, 0, W, H);
    g.fillStyle = '#151414'; g.fillRect(0, H * 0.72, W, H * 0.28);
    for (let x = 0; x < W; x += 40) { g.fillStyle = 'rgba(255,255,255,.03)'; g.fillRect(x, H * 0.72, 2, H * 0.28); }
    g.fillStyle = '#2a2622'; g.fillRect(0, H * 0.3, W * 0.07, H * 0.42);
    g.fillStyle = 'rgba(255,200,120,.25)'; g.fillRect(W * 0.01, H * 0.34, W * 0.05, H * 0.36);
    g.fillStyle = '#ffb347'; g.font = `10px ${MONO}`; g.fillText('СТОЛОВАЯ', W * 0.005, H * 0.28);
  });
  return new Promise(resolve => {
    scope.loop(dt => {
      t += dt;
      const { g, W, H } = C;
      camA += camDir * dt * 0.45; if (camA > 1) camDir = -1; if (camA < 0) camDir = 1;
      if (gPause > 0) gPause -= dt; else { guard += gDir * dt * 0.07; gFace = gDir; if (guard > 0.72 || guard < 0.32) { gDir *= -1; gPause = rand(0.8, 2); } if (Math.random() < dt * 0.25) { gPause = rand(0.8, 1.8); gFace = Math.random() < 0.5 ? -1 : 1; } }
      const camX = 0.3 + camA * 0.45, camW = 0.1;
      const inCam = Math.abs(x - camX) < camW;
      const guardSees = (gFace > 0 ? x > guard : x < guard) && Math.abs(x - guard) < 0.22;
      if (!over) {
        if (walking) { x = Math.min(0.93, x + dt * 0.09); stepT -= dt; if (stepT <= 0) { stepT = 0.4; A.sfx.step(0.08, (x - 0.5)); } }
        if (walking && inCam) sus += dt * 0.5;
        if (walking && guardSees) sus += dt * 0.7;
        if (!walking && guardSees && Math.abs(x - guard) < 0.08) sus += dt * 0.3;
        sus = Math.max(0, sus - dt * 0.05);
        if (x >= 0.93) {
          A.sfx.chime(560 + trip * 80, 0.05);
          ctx.say(`${FOOD[trip]} — у стены. Парень не притронулся, пока Эш не ушёл.`, { pos: 'top' }); scope.timeout(() => ctx.unsay('top'), 2200);
          trip++; x = 0.06; walking = false; FX.flash('#000', 500, 0.8);
          if (trip >= 3) { over = true; walkB.parentElement.remove(); scope.timeout(() => { ctx.say('Одна картошка — с одним-единственным надкусом. «Потом» здесь не бывает.', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `ПОДОЗРЕНИЕ ${Math.round(sus * 100)}%` }), 3200); }, 1400); }
        }
        if (sus >= 1) { over = true; walkB.parentElement.remove(); A.sfx.alarm(0.08); ctx.say('— Что вы несёте, Эш? — Начальник смотрит на поднос. — А давно ли вы кормили свою совесть?', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `ДОНЕСЕНО ${trip}/3` }), 3400); }
        ctx.stat(`ПОРЦИЙ ${trip}/3 · ${FOOD[Math.min(trip, 2)]}`);
      }
      susM.set(sus);
      g.drawImage(bg(), 0, 0, W, H);
      // камера и конус
      const cx = W * camX;
      g.fillStyle = '#111'; g.fillRect(W * 0.52 - 10, 0, 20, H * 0.06);
      g.fillStyle = `rgba(255,0,40,${inCam && walking ? 0.3 : 0.14})`; g.beginPath(); g.moveTo(W * 0.52, H * 0.06); g.lineTo(cx + camW * W, H * 0.8); g.lineTo(cx - camW * W, H * 0.8); g.closePath(); g.fill();
      g.fillStyle = '#ff0033'; g.beginPath(); g.arc(W * 0.52, H * 0.065, 4, 0, Math.PI * 2); g.fill();
      // охранник в броне с визором
      g.save(); g.translate(W * guard, 0); g.scale(gFace, 1); g.translate(-W * guard, 0);
      Art.figure(g, W * guard, H * 0.8, H * 0.5, { body: '#0c0c0e', wide: 1.3, rimCol: 'rgba(255,40,60,.3)' });
      g.fillStyle = '#ff0033'; g.fillRect(W * guard + H * 0.005, H * 0.8 - H * 0.5 * 0.92, H * 0.03, H * 0.012);
      g.restore();
      if (guardSees) { g.fillStyle = 'rgba(255,0,40,.12)'; g.beginPath(); g.moveTo(W * guard, H * 0.36); g.lineTo(W * (guard + gFace * 0.22), H * 0.3); g.lineTo(W * (guard + gFace * 0.22), H * 0.8); g.closePath(); g.fill(); }
      // парень у стены
      g.fillStyle = '#050404'; g.beginPath(); g.ellipse(W * 0.96, H * 0.76, H * 0.05, H * 0.06, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(W * 0.955, H * 0.67, H * 0.025, 0, Math.PI * 2); g.fill();
      // Эш с подносом
      Art.figure(g, W * x, H * 0.8, H * 0.46, { body: '#1a1512', rimCol: 'rgba(255,200,140,.25)' });
      g.fillStyle = '#9a9a9e'; g.fillRect(W * x - 14, H * 0.8 - H * 0.28, 28, 4);
      if (trip === 2) { g.fillStyle = '#c8c8cc'; g.beginPath(); g.ellipse(W * x, H * 0.8 - H * 0.29, 8, 5, 0, 0, Math.PI * 2); g.fill(); }
      Art.vignette(g, W, H, 0.6);
    });
  });
}

// ============================================================ 26 · САНИТАР
function gameOrderly(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const ORDER = ['БИРКА', 'МЕШОК', 'НОСИЛКИ'];
  const BODIES = 6, stoneAt = irand(2, 4);
  let b = 0, stepI = 0, errors = 0, t = 0, over = false, searching = 0, found = false, phase = 'work', neigh = 0, neighT = 2, timer = 6, passed = false;
  const panel = ctx.el('div', 'ctl'); panel.style.flexWrap = 'wrap';
  let btns = [];
  const searchB = ctx.el('button', 'btn btn-amber big-btn', ctx.el('div', 'ctl'), 'ОБЫСКАТЬ КАРМАНЫ');
  searchB.parentElement.style.bottom = '90px'; searchB.parentElement.hidden = true;
  let searchHold = false;
  ctx.hold(searchB, () => { searchHold = true; }, () => { searchHold = false; }, { key: 'KeyF' });
  ctx.hint('ПОРЯДОК: БИРКА → МЕШОК → НОСИЛКИ (КНОПКИ ИЛИ 1–3) · В ОДНОМ КАРМАНЕ — КАМУШЕК: ЗАЖМИ «ОБЫСКАТЬ» (ИЛИ F)');
  ctx.say('Бирка. Мешок. Носилки. Машина. Руки помнили всё, голова — ничего.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3000);
  return new Promise(resolve => {
    function layout() {
      panel.innerHTML = '';
      const labels = shuffle(ORDER);
      btns = labels.map((l, k) => { const bt = ctx.el('button', 'btn big-btn', panel, `${k + 1} · ${l}`); bt.dataset.l = l; scope.on(bt, 'click', () => act(l)); return bt; });
      searchB.parentElement.hidden = !(b === stoneAt && !found);
      timer = Math.max(3.2, 6 - b * 0.4);
    }
    function act(l) {
      if (over || phase !== 'work') return;
      if (l === ORDER[stepI]) {
        A.sfx[l === 'МЕШОК' ? 'tear' : 'click'](); stepI++;
        if (stepI >= 3) { stepI = 0; b++; A.sfx.thud(0.3); if (b >= BODIES) { toStone(); return; } layout(); }
      } else { errors++; A.sfx.error(); FX.shake('sm'); ctx.say('Не тот порядок. Сосед смотрит.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 900); if (errors >= 4) lose('Слишком много ошибок. Его перевели в другую смену.'); }
    }
    scope.on(document, 'keydown', e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 3 && btns[n - 1]) act(btns[n - 1].dataset.l); if (phase === 'pass' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); passStone(); } });
    function toStone() {
      panel.innerHTML = ''; searchB.parentElement.hidden = true;
      if (!found) { lose('Камушек так и остался в чужом кармане. Его сожгли вместе с мешком.'); return; }
      phase = 'pass'; ctx.hint('ПЕРЕЛОЖИ КАМУШЕК В ФОРМУ НОВОГО, КОГДА СОСЕД ОТВЕРНЁТСЯ · ТАП / ПРОБЕЛ');
      ctx.say('Новая форма на полу у капсулы. Левый нагрудный карман.', { pos: 'top' });
      const pb = ctx.el('button', 'btn btn-primary big-btn', panel, 'ПЕРЕЛОЖИТЬ');
      scope.on(pb, 'click', passStone); pb.focus({ preventScroll: true });
    }
    function passStone() {
      if (phase !== 'pass' || over) return;
      if (neigh > 0.5) { errors++; A.sfx.error(); ctx.say('— Ты чего такой испуганный? — Сосед смотрит прямо на руки.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1500); if (errors >= 4) lose('Сосед всё видел. Блокнот нашли под матрасом.'); return; }
      over = true; panel.innerHTML = ''; A.sfx.chime(330, 0.06);
      ctx.say('— Никому не говори. — Зачем? — Не знаю. Просто делай.', { pos: 'mid' });
      scope.timeout(() => resolve({ ok: 'ok', detail: `ТЕЛ ${BODIES} · ОШИБОК ${errors}` }), 3200);
    }
    function lose(txt) { if (over) return; over = true; panel.innerHTML = ''; searchB.parentElement.hidden = true; ctx.say(txt, { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `ТЕЛ ${b}/${BODIES} · ОШИБОК ${errors}` }), 2800); }
    layout();
    const bg = cachedBg(C, (g, W, H) => { g.drawImage(Art.concrete(Math.round(W), Math.round(H), { base: '#1b1918', tint: 'rgba(80,0,10,.2)', seed: 26, cracks: 8 }), 0, 0, W, H); Art.grate(g, 0, H * 0.62, W, H * 0.38, 30, 'rgba(90,80,80,.25)'); for (let k = 0; k < 4; k++) Art.bloodSplat(g, rand(0, W), rand(H * 0.65, H), rand(30, 70), k + 40, 0.5); });
    scope.loop(dt => {
      t += dt;
      neighT -= dt; if (neighT <= 0) { neighT = rand(1.2, 3); neigh = neigh > 0.5 ? 0 : 1; if (neigh) A.sfx.step(0.12, 0.8); }
      if (!over && phase === 'work') {
        timer -= dt;
        if (timer <= 0) { errors++; timer = 4; A.sfx.buzz(); ctx.say('Медленно. Трупов сорок, а ты возишься.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1000); if (errors >= 4) lose('Смена сорвана. Иван выходил из ворот базы в последний раз.'); }
        if (b === stoneAt && !found) { if (searchHold && neigh > 0.5 && searching > 0.2) { searching = 0; searchHold = false; errors++; A.sfx.error(); ctx.say('Сосед приподнялся на локте. Руки — прочь из кармана.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1200); if (errors >= 4) lose('Сосед всё видел.'); } else if (searchHold) { searching += dt; if (searching >= 1.4) { found = true; searchB.parentElement.hidden = true; A.sfx.chime(300, 0.07); ctx.say('Серый камушек. Гладкий. Тёплый.', { pos: 'top', cls: 'ice' }); scope.timeout(() => ctx.unsay('top'), 2000); } } }
        ctx.stat(`ТЕЛО ${Math.min(b + 1, BODIES)}/${BODIES} · ДАЛЬШЕ: ${ORDER[stepI]} · ОШИБОК ${errors}/4${found ? ' · КАМУШЕК' : ''}`);
      }
      const { g, W, H } = C;
      g.drawImage(bg(), 0, 0, W, H);
      for (let k = b; k < BODIES; k++) Art.lying(g, W * (0.25 + (k - b) * 0.14), H * (0.72 + ((k * 37) % 5) * 0.03), Math.min(W, H) * 0.16, { dir: k % 2 ? 1 : -1, body: '#0a0708', blood: 0.6, seed: k });
      if (b < BODIES && phase === 'work') {
        const s = Math.min(W, H) * 0.24;
        Art.lying(g, W * 0.25, H * 0.72, s, { body: '#0d090a' });
        if (stepI >= 1) { g.fillStyle = '#efe6cf'; g.fillRect(W * 0.25 + s * 0.55, H * 0.72 - s * 0.05, 14, 10); g.fillStyle = '#111'; g.font = `8px ${MONO}`; g.fillText(`К-${6 + b}`, W * 0.25 + s * 0.55 + 1, H * 0.72 - s * 0.05 + 8); }
        if (stepI >= 2) { g.fillStyle = 'rgba(20,20,22,.92)'; g.beginPath(); g.ellipse(W * 0.25, H * 0.72, s * 0.8, s * 0.2, 0, 0, Math.PI * 2); g.fill(); }
        if (b === stoneAt && !found && searchHold) Art.glowDot(g, W * 0.25, H * 0.7, 40, 'rgba(180,180,190,.8)', searching / 1.4);
      }
      // сосед по казарме
      Art.figure(g, W * 0.86, H * 0.78, H * 0.44, { body: '#0c0b0c', eyes: neigh > 0.5 ? '#ffb347' : null });
      g.fillStyle = neigh > 0.5 ? '#ffb347' : '#555'; g.font = `11px ${MONO}`; g.fillText(neigh > 0.5 ? 'СОСЕД СМОТРИТ' : 'СОСЕД ОТВЕРНУЛСЯ', W * 0.76, H * 0.25);
      Art.vignette(g, W, H, 0.6);
    });
  });
}

// ============================================================ 27 · ШИПЕНИЕ
function gameHiss(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const o2M = meterEl(ctx, 'КИСЛОРОД', 'ice');
  const sigM = meterEl(ctx, 'ШИПЕНИЕ', '', { left: '14px', top: '48px' });
  let o2 = 1, t = 0, over = false, leaks = 0, lx = 0, ly = 0, cx = 0.5, cy = 0.5, hold = 0, ptrDown = false, woman = 0, womanT = 5;
  const hissL = scope.own(A.loopNoise({ type: 'highpass', freq: 3500, q: 0.5, vol: 0 }));
  const newLeak = () => { lx = rand(0.3, 0.7); ly = rand(0.3, 0.75); hold = 0; };
  newLeak();
  ctx.hint('ВЕДИ ПО БАЛЛОНУ — ЧЕМ ГРОМЧЕ ШИПЕНИЕ, ТЕМ БЛИЖЕ ТЕЧЬ · ЗАЖМИ НА ТЕЧИ · СТРЕЛКИ + ПРОБЕЛ ТОЖЕ · ТРИ ТЕЧИ');
  ctx.say('Баллон на спине шипит. Пуля рейдера прошла насквозь.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2600);
  const pos = e => { const r = C.cv.getBoundingClientRect(); cx = (e.clientX - r.left) / r.width; cy = (e.clientY - r.top) / r.height; };
  scope.on(C.cv, 'pointerdown', e => { ptrDown = true; pos(e); try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ } });
  scope.on(C.cv, 'pointermove', e => { if (e.pointerType === 'mouse' || ptrDown) pos(e); });
  scope.on(C.cv, 'pointerup', () => { ptrDown = false; });
  return new Promise(resolve => {
    scope.loop(dt => {
      t += dt;
      if (K.ArrowLeft) cx -= dt * 0.3; if (K.ArrowRight) cx += dt * 0.3; if (K.ArrowUp) cy -= dt * 0.3; if (K.ArrowDown) cy += dt * 0.3;
      cx = clamp(cx, 0, 1); cy = clamp(cy, 0, 1);
      const d = Math.hypot(cx - lx, cy - ly), prox = clamp(1 - d / 0.45, 0, 1);
      const pressing = ptrDown || K.Space;
      if (!over) {
        o2 -= dt * 0.022 * (1 + leaks * 0.25);
        hissL.vol(0.02 + prox * prox * 0.18); hissL.freq(2500 + prox * 3000);
        if (pressing && d < 0.05) { hold += dt; if (hold > 1.2) { leaks++; A.sfx.thud(0.3); A.sfx.chime(420 + leaks * 80, 0.05); ctx.say(leaks < 3 ? 'Зажал. Шипение — ещё одно, с другой стороны.' : 'Тишина, что была чуть спокойнее.', { pos: 'top' }); scope.timeout(() => ctx.unsay('top'), 1800); if (leaks >= 3) { over = true; hissL.vol(0); scope.timeout(() => resolve({ ok: 'ok', detail: `КИСЛОРОД ${Math.round(o2 * 100)}%` }), 2600); } else newLeak(); } }
        else hold = Math.max(0, hold - dt);
        womanT -= dt; if (womanT <= 0) { womanT = rand(6, 10); woman = 3; A.sfx.whisper(1.6, 0.1, 0.5); }
        if (o2 <= 0) { over = true; hissL.vol(0); A.sfx.flat(1.5); ctx.say('Шипение баллона — тише, тише… пока не стихло совсем.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `ТЕЧЕЙ ЗАЖАТО ${leaks}/3` }), 2800); }
        ctx.stat(`ТЕЧИ ${leaks}/3 · КИСЛОРОД ${Math.max(0, Math.round(o2 * 100))}%`);
      }
      woman = Math.max(0, woman - dt);
      o2M.set(o2); sigM.set(prox);
      const { g, W, H } = C;
      g.fillStyle = '#05080b'; g.fillRect(0, 0, W, H);
      // штрек и она вдалеке (её там нет)
      const gr = g.createRadialGradient(W * 0.8, H * 0.4, 10, W * 0.8, H * 0.4, W * 0.5); gr.addColorStop(0, 'rgba(143,176,196,.15)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (woman > 0) { g.globalAlpha = Math.min(1, woman) * 0.5; Art.figure(g, W * 0.82, H * 0.62, H * 0.3, { body: '#3b2a20' }); g.globalAlpha = 1; }
      // баллон: синий — кислород
      const bx = W * 0.2, bw = W * 0.5, by = H * 0.15, bh = H * 0.72;
      const tg = g.createLinearGradient(bx, 0, bx + bw, 0); tg.addColorStop(0, '#0e2a4a'); tg.addColorStop(0.4, '#2a5a9a'); tg.addColorStop(1, '#0a1a30');
      g.fillStyle = tg; g.beginPath(); g.roundRect ? g.roundRect(bx, by, bw, bh, bw * 0.3) : g.rect(bx, by, bw, bh); g.fill();
      g.fillStyle = '#3a3a40'; g.fillRect(bx + bw * 0.4, by - H * 0.05, bw * 0.2, H * 0.06);
      g.fillStyle = 'rgba(255,255,255,.5)'; g.font = `700 ${Math.round(bw * 0.08)}px ${DISP}`; g.fillText('O₂', bx + bw * 0.1, by + bh * 0.15);
      // пар из течи — только рядом слабо виден
      const lxp = bx + lx * bw, lyp = by + ly * bh;
      for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(220,240,255,${0.05 + prox * 0.1})`; g.beginPath(); g.arc(lxp + Math.sin(t * 9 + k) * 10 + k * 4, lyp - k * 6, 3 + k, 0, Math.PI * 2); g.fill(); }
      // перчатка-курсор
      const px = bx + cx * bw, py = by + cy * bh;
      g.strokeStyle = prox > 0.85 ? '#88ddff' : 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, 16, 0, Math.PI * 2); g.stroke();
      if (hold > 0) { g.strokeStyle = '#00ff88'; g.lineWidth = 4; g.beginPath(); g.arc(px, py, 22, -Math.PI / 2, -Math.PI / 2 + hold / 1.2 * Math.PI * 2); g.stroke(); }
      Art.vignette(g, W, H, 0.5 + (1 - o2) * 0.4);
    });
  });
}

// ============================================================ 28 · ТЕХНИК
function gameTech(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const susM = meterEl(ctx, 'ПОДОЗРЕНИЕ СТАРШЕГО', '', { right: '14px', top: '14px' });
  const P = [
    { n: 'ДАВЛЕНИЕ', v: 0.5, lo: 0.36, hi: 0.44, fmt: v => `${Math.round((v - 0.5) * 100)}%` },
    { n: 'ТЕМПЕРАТУРА ГЕЛЯ', v: 0.5, lo: 0.6, hi: 0.68, fmt: v => `${(36 + (v - 0.5) * 8).toFixed(1)}°` },
    { n: 'ЗАДЕРЖКА КРЫШКИ', v: 0.2, lo: 0.52, hi: 0.6, fmt: v => `${(v * 1.2).toFixed(2)} С` },
  ];
  const wrap = ctx.el('div', 'g-center'); wrap.style.justifyContent = 'flex-end'; wrap.style.paddingBottom = '12px';
  const sl = P.map((p, k) => {
    const rowE = ctx.el('div', 'g-panel', wrap); rowE.style.padding = '.5rem .8rem';
    rowE.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:.8rem;letter-spacing:.1em"><span>${k + 1} · ${p.n}</span><b class="v"></b></div>`;
    const inp = document.createElement('input'); inp.type = 'range'; inp.min = 0; inp.max = 1000; inp.value = p.v * 1000; inp.className = 'g-slider'; inp.setAttribute('aria-label', p.n); rowE.appendChild(inp);
    return { inp, v: $('.v', rowE), row: rowE };
  });
  let sus = 0, eye = 0, eyeT = 2, t = 0, over = false, good = 0, sel = 0;
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 60, vol: 0 })); hum.vol(0.02, 1);
  ctx.hint('ТЯНИ ПОЛЗУНКИ · 1–3 ВЫБРАТЬ, ← → ПОДКРУТИТЬ · ГЛАЗ ОТКРЫТ — НЕ ТРОГАЙ · ВСЕ ТРИ В ЗЕЛЁНОЙ ЗОНЕ 2 С');
  ctx.say('Капсула К-27 открылась. Он вывалился наружу и схватился за горло.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3000);
  return new Promise(resolve => {
    const touched = () => { if (eye > 0.5 && !over) { sus += 0.08; A.sfx.beep(300, 0.05, 0.04); } };
    sl.forEach((s, k) => scope.on(s.inp, 'input', () => { P[k].v = s.inp.value / 1000; touched(); }));
    scope.on(document, 'keydown', e => {
      const n = parseInt(e.key, 10); if (n >= 1 && n <= 3) { sel = n - 1; sl[sel].inp.focus(); }
      if (e.target.tagName === 'INPUT') { if (e.key.startsWith('Arrow')) touched(); return; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { P[sel].v = clamp(P[sel].v + (e.key === 'ArrowLeft' ? -0.02 : 0.02), 0, 1); sl[sel].inp.value = P[sel].v * 1000; touched(); }
    });
    scope.loop(dt => {
      t += dt;
      eyeT -= dt;
      if (eyeT <= 0) { eye = eye > 0.5 ? 0 : 1; eyeT = eye ? rand(1.6, 3) : rand(2.2, 4); if (eye) A.sfx.step(0.12, 0.7); }
      if (!over) {
        sus = Math.max(0, sus - dt * 0.03);
        const inZone = P.map(p => p.v >= p.lo && p.v <= p.hi);
        good = inZone.every(Boolean) ? good + dt : 0;
        sl.forEach((s, k) => { s.v.textContent = P[k].fmt(P[k].v); s.v.style.color = inZone[k] ? 'var(--ok)' : '#ff8095'; s.row.style.borderColor = inZone[k] ? 'rgba(0,255,136,.5)' : ''; });
        ctx.stat(`ПОДОЗРЕНИЕ ${Math.round(sus * 100)}% · ${eye > 0.5 ? 'СТАРШИЙ СМОТРИТ' : 'СТАРШИЙ ОТВЕРНУЛСЯ'}`);
        if (sus >= 1) { over = true; A.sfx.alarm(0.08); ctx.say('— Что вы делаете с протоколом, Елена? Её перевели в другой сектор.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: 'ПРАВКИ ЗАМЕЧЕНЫ' }), 3000); }
        else if (good >= 2) { over = true; A.sfx.chime(700, 0.05); ctx.say('Его шаги стали ровнее. Руки не дрожали. Он не знал, почему.', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `ПОДОЗРЕНИЕ ${Math.round(sus * 100)}%` }), 3000); }
      }
      susM.set(sus);
      const { g, W, H } = C;
      g.fillStyle = '#060a08'; g.fillRect(0, 0, W, H);
      // окно в капсульную: К-27 за стеклом
      const wx = W * 0.1, wy = H * 0.08, ww = W * 0.8, wh = H * 0.34;
      g.fillStyle = '#0c1820'; g.fillRect(wx, wy, ww, wh);
      g.fillStyle = 'rgba(111,182,230,.25)'; g.fillRect(wx + ww * 0.4, wy + wh * 0.05, ww * 0.2, wh * 0.9);
      Art.figure(g, wx + ww * 0.5, wy + wh * 0.95, wh * 0.8, { body: '#0a1016', eyes: '#ffffff' });
      g.strokeStyle = '#2a3238'; g.lineWidth = 6; g.strokeRect(wx, wy, ww, wh);
      // мониторы: зелёные цифры
      g.fillStyle = '#00ff88'; g.font = `11px ${MONO}`;
      P.forEach((p, k) => g.fillText(`${p.n}: ${p.fmt(p.v)}`, wx, wy + wh + 18 + k * 14));
      // глаз старшего
      const ex = W * 0.86, ey = H * 0.5;
      g.fillStyle = eye > 0.5 ? '#ffb347' : '#222'; g.beginPath(); g.ellipse(ex, ey, 22, eye > 0.5 ? 12 : 2, 0, 0, Math.PI * 2); g.fill();
      if (eye > 0.5) { g.fillStyle = '#000'; g.beginPath(); g.arc(ex, ey, 6, 0, Math.PI * 2); g.fill(); Art.glowDot(g, ex, ey, 60, 'rgba(255,179,71,.5)'); }
      Art.scan(g, W, H, 0.15);
    });
  });
}

// ============================================================ 29 · КОКТЕЙЛЬ
function gameCocktail(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const hpM = meterEl(ctx, 'ЗДОРОВЬЕ');
  const STIM = [{ n: 'ЭФЕДРИН', left: 2, add: 38, col: '#f0f0ec' }, { n: 'ГИПЕРЗИН', left: 1, add: 70, col: '#d4001e' }, { n: 'АРАНЕПС', left: 2, add: 16, slow: 1, col: '#6a4a2a' }];
  const row = ctx.el('div', 'ctl');
  const sb = STIM.map((s, k) => ctx.el('button', 'btn big-btn', row, `${k + 1} · ${s.n} ×${s.left}`));
  const MIN = 10;
  let hr = 88, hrV = 0, hp = 1, t = 0, over = false, crit = 0, slowDecay = 0, mobs = [], spawnT = 1.5, beatT = 0, strikeT = 0;
  const breath = scope.own(A.loopNoise({ type: 'highpass', freq: 3000, q: 0.5, vol: 0 })); breath.vol(0.04, 1);
  ctx.hint('СТИМУЛЯТОРЫ — КНОПКИ / 1–3 · ТАП ПО ТВАРИ — УДАР (СИЛЬНЫЙ ПРИ ПУЛЬСЕ 110–170) · ВЫШЕ 190 — СЕРДЦЕ ВСТАНЕТ');
  ctx.say('Карстовая полость. Фильтраторы лезут из каждой трещины.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2600);
  return new Promise(resolve => {
    function stim(k) { if (over) return; const s = STIM[k]; if (s.left <= 0) return; s.left--; sb[k].textContent = `${k + 1} · ${s.n} ×${s.left}`; sb[k].disabled = !s.left; hrV += s.add; if (s.slow) slowDecay = 20; A.sfx.stim(); FX.flash(s.col === '#d4001e' ? '#ff0033' : '#ffffff', 300, 0.25); }
    sb.forEach((b, k) => scope.on(b, 'click', () => stim(k)));
    scope.on(document, 'keydown', e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 3) stim(n - 1); if (e.code === 'Space' && !e.repeat) { e.preventDefault(); const m = mobs.slice().sort((a, b) => a.d - b.d)[0]; if (m) hit(m); } });
    scope.on(C.cv, 'pointerdown', e => { const r = C.cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; const m = mobs.find(m => Math.hypot(m.x - x, m.y - y) < 0.09); if (m) hit(m); });
    function hit(m) {
      if (over || strikeT > 0) return;
      strikeT = 0.25;
      const strong = hr >= 110 && hr <= 170;
      m.hp -= strong ? 2 : 1; A.sfx.thud(strong ? 0.5 : 0.25); A.sfx.pop(0.2);
      if (m.hp <= 0) { mobs.splice(mobs.indexOf(m), 1); A.sfx.creak(0.2); }
    }
    scope.loop(dt => {
      t += dt; strikeT = Math.max(0, strikeT - dt);
      if (!over) {
        const minute = Math.floor(t / MIN) + 1;
        const push = Math.min(hrV, dt * 30); hrV -= push; hr += push;
        hr -= dt * (slowDecay > 0 ? 1.5 : 4.5); slowDecay = Math.max(0, slowDecay - dt);
        hr = clamp(hr, 40, 230);
        beatT -= dt; if (beatT <= 0) { beatT = 60 / hr; A.sfx.heartbeat(0.2 + (hr > 170 ? 0.3 : 0)); }
        if (hr > 190) { crit += dt; if (crit > 2) { over = true; A.sfx.flat(2); FX.flash('#ffffff', 1200, 0.8); ctx.say('Сердце не выдержало. Не тварь — коктейль.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `МИНУТА ${minute}/6 · ПЕРЕДОЗИРОВКА` }), 2800); return; } } else crit = Math.max(0, crit - dt);
        spawnT -= dt;
        if (spawnT <= 0) { spawnT = rand(0.8, 1.5) * (1 - t / (MIN * 6) * 0.4); const a = rand(0, Math.PI * 2); mobs.push({ x: 0.5 + Math.cos(a) * 0.55, y: 0.5 + Math.sin(a) * 0.55, hp: 2, d: 1 }); }
        mobs.forEach(m => { const dx = 0.5 - m.x, dy = 0.55 - m.y, d = Math.hypot(dx, dy); m.d = d; m.x += dx / d * dt * 0.07; m.y += dy / d * dt * 0.07; });
        for (let k = mobs.length - 1; k >= 0; k--) if (mobs[k].d < 0.06) { mobs.splice(k, 1); hp -= 0.12; A.sfx.scrape(0.3); FX.hit('#ff0033'); }
        if (hp <= 0) { over = true; ctx.say('Клешня вошла под шлем. Эффект стимуляторов кончился.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `МИНУТА ${minute}/6` }), 2800); return; }
        if (t >= MIN * 6) { over = true; row.remove(); ctx.say('Шесть минут. Сердце остановилось. И только шипение баллона — тише, тише…', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `ЗДОРОВЬЕ ${Math.round(hp * 100)}%` }), 3400); }
        ctx.stat(`МИНУТА ${minute}/6 · ПУЛЬС ${Math.round(hr)} · ${hr >= 110 && hr <= 170 ? 'РАБОЧАЯ ЗОНА' : hr > 170 ? 'ОПАСНО' : 'СЛАБО'}`);
      }
      hpM.set(hp);
      const { g, W, H } = C;
      g.fillStyle = '#081018'; g.fillRect(0, 0, W, H);
      const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6); gr.addColorStop(0, '#1a3a4a'); gr.addColorStop(1, '#03070a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(200,230,245,.25)'; const x = (k * 97) % W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 8, H * 0.12 + (k % 3) * 20); g.lineTo(x + 16, 0); g.fill(); }
      mobs.forEach(m => {
        const x = m.x * W, y = m.y * H, s = Math.min(W, H) * 0.06;
        g.fillStyle = '#2a3a3a'; g.beginPath(); g.ellipse(x, y, s, s * 0.7, Math.atan2(0.55 - m.y, 0.5 - m.x), 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#4a5a5a'; g.lineWidth = 3; for (let l = -2; l <= 2; l++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(t * 8 + l) * s * 1.3, y + l * s * 0.4); g.stroke(); }
        g.fillStyle = m.hp < 2 ? '#8a0010' : '#c8d8d8'; g.beginPath(); g.arc(x + s * 0.3, y - s * 0.2, 3, 0, Math.PI * 2); g.fill();
      });
      Art.armor(g, W / 2, H * 0.36, H * 0.4, { t, glow: hr / 170, seed: 41 });
      // кардиограмма
      const ky = H * 0.93;
      g.strokeStyle = hr > 190 ? '#ff0033' : hr >= 110 ? '#00ff88' : '#88ddff'; g.lineWidth = 2; g.beginPath();
      for (let x = 0; x <= W; x += 4) { const ph = (x / W * 6 + t * hr / 60) % 1; const y = ky - (ph < 0.08 ? Math.sin(ph / 0.08 * Math.PI) * 26 : 0); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      if (hr > 170) { g.fillStyle = `rgba(160,0,20,${(hr - 170) / 80})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.6);
    });
  });
}

// ============================================================ 30 · СМОТРИТЕЛЬ
function gameWarden(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const ITEMS = ['БЕЛЬЁ', 'ШТАНЫ', 'РУБАХА', 'КУРТКА', 'БОТИНКИ'];
  const row = ctx.el('div', 'ctl'); row.style.flexWrap = 'wrap';
  const ib = shuffle(ITEMS.map((n, k) => ({ n, k }))).map(it => { const b = ctx.el('button', 'btn', row, it.n); b.style.flex = '1 1 90px'; b.dataset.k = it.k; return b; });
  let worn = 0, sel = null, cam = 0, camT = 2, strikes = 0, t = 0, over = false, wrongs = 0;
  ctx.hint('ТАП ПО ВЕЩИ → ТАП ПО КЛОНУ (ИЛИ ENTER) · ПО ПОРЯДКУ · КРАСНАЯ ЛАМПА КАМЕРЫ ГОРИТ — ЗАМРИ');
  ctx.say('Форму полагается бросить на пол и отвернуться. Этот не смотрит в пол.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3000);
  return new Promise(resolve => {
    ib.forEach(b => scope.on(b, 'click', () => { if (over || b.disabled) return; ib.forEach(x => x.classList.remove('btn-primary')); b.classList.add('btn-primary'); sel = +b.dataset.k; A.sfx.key(); }));
    const dress = () => {
      if (over || sel === null) return;
      if (cam > 0.5) { strikes++; A.sfx.alarm(0.06); FX.hit('#ff0033'); ctx.say('Камера. Всё записано.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1000); if (strikes >= 3) { over = true; row.remove(); ctx.say('— Ты контактировал с активом. Ты делаешь из него человека. А он — не человек.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `НАДЕТО ${worn}/5` }), 3200); } return; }
      if (sel !== worn) { wrongs++; A.sfx.error(); ctx.say('Не так. Сначала — ' + ITEMS[worn].toLowerCase() + '.', { pos: 'mid' }); scope.timeout(() => ctx.unsay('mid'), 1000); return; }
      const b = ib.find(x => +x.dataset.k === sel); b.disabled = true; b.classList.remove('btn-primary');
      worn++; sel = null; A.noise({ type: 'bandpass', freq: 1200, dur: 0.3, vol: 0.06 });
      if (worn >= ITEMS.length) words();
    };
    scope.on(C.cv, 'pointerdown', dress);
    scope.on(document, 'keydown', e => { if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) dress(); });
    function words() {
      row.innerHTML = '';
      ctx.say('Он одет. Шоколадка шуршит в кармане. Что сказать?', { pos: 'top' });
      const b1 = ctx.el('button', 'btn btn-primary big-btn', row, '1 · «Ты справишься»');
      const b2 = ctx.el('button', 'btn big-btn', row, '2 · «Иди. Стой. Жди.»');
      b1.focus({ preventScroll: true });
      let done = false;
      const go = k => { if (done) return; done = true; over = true; row.remove(); ctx.unsay('top');
        if (k === 1) { A.sfx.whisper(1, 0.12); ctx.say('Шёпотом, пока камера не видит: — Ты справишься.', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `КАМЕРА ${strikes}/3` }), 3000); }
        else { A.sfx.glitch(0.6); ctx.say('По протоколу. Он не посмотрел ему вслед. Архив помнит шёпот.', { pos: 'mid', cls: 'amb' }); scope.timeout(() => resolve({ ok: 'dist', detail: 'ПО ПРОТОКОЛУ', note: 'В этой записи я сказал только «иди, стой, жди». Но внутри всё равно звучало: «ты справишься».' }), 3000); } };
      scope.on(b1, 'click', () => go(1)); scope.on(b2, 'click', () => go(2));
      scope.on(document, 'keydown', e => { if (e.key === '1') go(1); if (e.key === '2') go(2); });
    }
    const bg = cachedBg(C, (g, W, H) => { g.drawImage(Art.concrete(Math.round(W), Math.round(H), { base: '#1f2326', seed: 30, cracks: 4 }), 0, 0, W, H); g.fillStyle = '#16191b'; g.fillRect(0, H * 0.78, W, H * 0.22); g.fillStyle = 'rgba(111,182,230,.2)'; g.fillRect(W * 0.08, H * 0.1, W * 0.16, H * 0.68); g.strokeStyle = '#2a3238'; g.lineWidth = 6; g.strokeRect(W * 0.08, H * 0.1, W * 0.16, H * 0.68); });
    scope.loop(dt => {
      t += dt;
      camT -= dt; if (camT <= 0) { cam = cam > 0.5 ? 0 : 1; camT = cam ? rand(1.4, 2.6) : rand(2, 3.6); if (cam) A.sfx.beep(1800, 0.03, 0.03); }
      if (!over) ctx.stat(`НАДЕТО ${worn}/5 · ЗАМЕЧАНИЙ ${strikes}/3 · ${cam > 0.5 ? 'КАМЕРА ПИШЕТ' : 'КАМЕРА МОЛЧИТ'}`);
      const { g, W, H } = C;
      g.drawImage(bg(), 0, 0, W, H);
      const cx = W * 0.55, base = H * 0.8, h = H * 0.66;
      // бледное мокрое тело, по мере одевания темнеет одеждой
      g.fillStyle = '#b3aeb1'; Art.figure(g, cx, base, h, { body: '#b3aeb1', eyes: '#ffffff' });
      const cols = ['#6b6b70', '#2a2d33', '#3a3e46', '#1c1f24', '#0a0a0c'];
      for (let k = 0; k < worn; k++) {
        g.fillStyle = cols[k];
        if (k === 0) g.fillRect(cx - h * 0.1, base - h * 0.48, h * 0.2, h * 0.1);
        if (k === 1) g.fillRect(cx - h * 0.12, base - h * 0.48, h * 0.24, h * 0.44);
        if (k === 2) g.fillRect(cx - h * 0.15, base - h * 0.82, h * 0.3, h * 0.36);
        if (k === 3) { g.fillRect(cx - h * 0.18, base - h * 0.8, h * 0.36, h * 0.3); }
        if (k === 4) { g.fillRect(cx - h * 0.12, base - h * 0.05, h * 0.1, h * 0.05); g.fillRect(cx + h * 0.02, base - h * 0.05, h * 0.1, h * 0.05); }
      }
      if (worn < 1) for (let k = 0; k < 8; k++) { g.fillStyle = 'rgba(180,220,240,.4)'; g.fillRect(cx + rand(-h * 0.1, h * 0.1), base - h * rand(0.1, 0.8), 2, 6); }
      // камера в углу
      g.fillStyle = '#111'; g.fillRect(W - 60, 18, 36, 20);
      g.fillStyle = cam > 0.5 ? '#ff0033' : '#300'; g.beginPath(); g.arc(W - 30, 28, 5, 0, Math.PI * 2); g.fill();
      if (cam > 0.5) { Art.glowDot(g, W - 30, 28, 40, 'rgba(255,0,40,.8)'); g.fillStyle = 'rgba(255,0,40,.06)'; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.55);
    });
  });
}

// ============================================================ 31 · НАБЛЮДАТЕЛЬ
function gameObserver(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const stepM = meterEl(ctx, 'ШАГИ В КОРИДОРЕ', '', { right: '14px', top: '14px' });
  const writeB = ctx.el('button', 'btn btn-primary big-btn', ctx.el('div', 'ctl'), 'ПИСАТЬ В ДНЕВНИК');
  const NEED = 6, DUR = 70;
  const EVENTS = ['К-42 смотрит прямо в камеру', 'К-42 пишет что-то пальцем на стене', 'К-42 упал и не встаёт', 'К-42 разговаривает сам с собой', 'К-42 плачет без звука', 'К-42 бьёт кулаком в дверь', 'К-42 считает шаги вслух', 'К-42 гладит бетон ладонью'];
  let ev = null, evT = 2, logged = [], written = 0, writing = false, prog = 0, steps = 0, stepV = 0, caught = 0, t = 0, over = false, supT = 12, sup = 0;
  ctx.hold(writeB, () => { writing = true; }, () => { writing = false; });
  ctx.hint('ТАП ПО КАМЕРЕ, ГДЕ ЧТО-ТО ПРОИСХОДИТ · ЗАЖМИ «ПИСАТЬ» / ПРОБЕЛ · ШАГИ БЛИЗКО — ОТПУСТИ');
  ctx.say('Пятнадцатый час у пульта. Двенадцать квадратов серых коридоров.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3000);
  const tiles = 12, cols = () => (C.W > C.H ? 4 : 3);
  return new Promise(resolve => {
    scope.on(C.cv, 'pointerdown', e => {
      if (over) return;
      const r = C.cv.getBoundingClientRect(), nc = cols(), nr = Math.ceil(tiles / nc);
      const cx = Math.floor((e.clientX - r.left) / r.width * nc), cy = Math.floor((e.clientY - r.top) / (r.height * 0.86) * nr), k = cy * nc + cx;
      if (ev && ev.tile === k) { logged.push(ev.txt); A.sfx.key(); ctx.float('ЗАПИСАТЬ', e.clientX - r.left, e.clientY - r.top, '#00ff88'); ev = null; evT = rand(2, 4); }
      else { A.sfx.error(); }
    });
    scope.on(document, 'keydown', e => { const n = parseInt(e.key, 10); if (ev && ((n >= 1 && n <= 9 && n - 1 === ev.tile) || (e.key === '0' && ev.tile === 9))) { logged.push(ev.txt); A.sfx.key(); ev = null; evT = rand(2, 4); } });
    scope.loop(dt => {
      t += dt;
      if (!over) {
        evT -= dt;
        if (!ev && evT <= 0) { ev = { tile: irand(0, tiles - 1), txt: pick(EVENTS), life: 3.2 }; A.sfx.beep(1300, 0.03, 0.03); }
        if (ev) { ev.life -= dt; if (ev.life <= 0) { ev = null; evT = rand(1.5, 3); } }
        supT -= dt; if (supT <= 0) { sup = 1; supT = rand(9, 14); }
        if (sup > 0) { steps = Math.min(1, steps + dt * 0.35); stepV -= dt; if (stepV <= 0) { stepV = 0.5; A.sfx.step(0.1 + steps * 0.3, -0.6); } if (steps >= 1) { if (writing) { caught++; A.sfx.scare(); ctx.say('— Что ты пишешь, Арина?', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1500); if (caught >= 2) { over = true; writeB.parentElement.remove(); scope.timeout(() => resolve({ ok: 'fail', detail: `ЗАПИСЕЙ ${written}/${NEED}` }), 2400); } } sup = 0; } }
        else steps = Math.max(0, steps - dt * 0.4);
        if (writing && logged.length > written) { prog += dt; if (prog >= 1.2) { prog = 0; written++; A.sfx.page(); } } else prog = Math.max(0, prog - dt * 0.5);
        ctx.stat(`ЗАМЕЧЕНО ${logged.length} · ЗАПИСАНО ${written}/${NEED} · ${Math.max(0, Math.ceil(DUR - t))} С`);
        if (written >= NEED) { over = true; writeB.parentElement.remove(); ctx.say('Даты, время, имена. Письмо в ОПЗ осталось без ответа. Но она записала всё.', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `ЗАПИСАНО ${written} · ЗАМЕЧАНИЙ ${caught}` }), 3200); }
        else if (t >= DUR) { over = true; writeB.parentElement.remove(); ctx.say('Смена кончилась. Тетрадь почти пустая.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `ЗАПИСАНО ${written}/${NEED}` }), 2600); }
      }
      stepM.set(steps);
      const { g, W, H } = C;
      g.fillStyle = '#020403'; g.fillRect(0, 0, W, H);
      const nc = cols(), nr = Math.ceil(tiles / nc), tw = W / nc, th = H * 0.86 / nr;
      for (let k = 0; k < tiles; k++) {
        const x = (k % nc) * tw, y = Math.floor(k / nc) * th;
        g.fillStyle = '#0c120e'; g.fillRect(x + 3, y + 3, tw - 6, th - 6);
        g.strokeStyle = 'rgba(0,255,136,.12)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x + tw * 0.2, y + th); g.lineTo(x + tw * 0.4, y + th * 0.35); g.lineTo(x + tw * 0.6, y + th * 0.35); g.lineTo(x + tw * 0.8, y + th); g.stroke();
        const on = ev && ev.tile === k;
        if (on) { Art.figure(g, x + tw * 0.5, y + th * 0.9, th * 0.6, { body: '#000', eyes: '#ffffff' }); g.strokeStyle = 'rgba(255,179,71,.6)'; g.strokeRect(x + 3, y + 3, tw - 6, th - 6); }
        g.fillStyle = on ? '#ffb347' : '#3a7a5a'; g.font = `9px ${MONO}`; g.fillText(`CAM ${k + 1}`, x + 7, y + 14);
        for (let s = 0; s < 3; s++) { g.fillStyle = 'rgba(0,255,136,.04)'; g.fillRect(x + 3, y + 3 + Math.random() * th, tw - 6, 1); }
      }
      // тетрадь
      g.fillStyle = '#e4dcc6'; g.fillRect(W * 0.02, H * 0.87, W * 0.96, H * 0.11);
      g.fillStyle = '#1d2850'; g.font = `italic 12px ${SERIF}`;
      g.fillText(logged.slice(-2).join(' · ') || 'дата · время · что видела', W * 0.04, H * 0.92);
      g.fillStyle = 'rgba(29,40,80,.4)'; g.fillRect(W * 0.04, H * 0.95, W * 0.9 * (written / NEED), 3);
      if (writing) { g.fillStyle = '#00a060'; g.fillRect(W * 0.04, H * 0.965, W * 0.9 * (prog / 1.2), 3); }
    });
  });
}
