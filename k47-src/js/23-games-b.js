/* ==========================================================================
   НОВЫЕ ФРАГМЕНТЫ · часть 2
   Контракт · Койка · Линия · Кожа · Буклет · Снег · Быт · Пыль
   ========================================================================== */

/** трассировка по пути: мышь/палец держат перо; клавиши ↑↓ удерживают его на линии */
function traceRun(ctx, C, K, { path, dur = 8, tol = 0.03, jitter = 0.9, color = 'rgba(29,40,80,.9)', penOk = 'rgba(0,160,110,.9)' }) {
  const { scope } = ctx;
  let tr = 0, off = 0, offV = 0, inside = 0, total = 0, ptr = null;
  scope.on(C.cv, 'pointerdown', e => { ptr = e; try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ } });
  scope.on(C.cv, 'pointermove', e => { if (ptr) ptr = e; });
  scope.on(C.cv, 'pointerup', () => { ptr = null; });
  return {
    get t() { return tr; }, get acc() { return total ? inside / total : 0; },
    step(dt, g, W, H, P) {
      tr = Math.min(1, tr + dt / dur);
      offV += rand(-1, 1) * dt * jitter; offV *= Math.pow(0.4, dt); off += offV * dt;
      if (K.ArrowUp || K.KeyW) off -= dt * 0.12;
      if (K.ArrowDown || K.KeyS) off += dt * 0.12;
      const s = Math.min(W, H), [px, py] = P(tr);
      let x = px, y = py + off * s;
      if (ptr) { const r = C.cv.getBoundingClientRect(); x = ptr.clientX - r.left; y = ptr.clientY - r.top; off = (y - py) / s; }
      const d = Math.hypot(x - px, y - py) / s;
      total += dt; if (d < tol) inside += dt;
      g.strokeStyle = color; g.lineWidth = 2; g.setLineDash([5, 6]); g.beginPath();
      for (let k = 0; k <= 60; k++) { const [a, b] = P(k / 60); k ? g.lineTo(a, b) : g.moveTo(a, b); } g.stroke(); g.setLineDash([]);
      g.strokeStyle = d < tol ? penOk : 'rgba(220,30,50,.9)'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.arc(px, py, 3, 0, Math.PI * 2); g.fill();
      return { x, y, d };
    },
  };
}

// ============================================================ 14 · КОНТРАКТ
function gameContractSign(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const pulse = meterEl(ctx, 'ПУЛЬС · ЛАДОНЬ', '', { left: '14px', top: '14px' });
  const QS = [
    { q: 'Директор: — Ты понимаешь, что подписываешь, Комаров?', a: [['Да.', 0], ['Не совсем.', 0.25], ['Мне всё равно.', 0.35]] },
    { q: 'Ройзман: — Ты уверен, что хочешь это подписать?', a: [['Я уверен.', 0], ['…Да.', 0.1], ['Можно подумать?', 0.3]] },
    { q: 'Ройзман: — Контракт — это не шутка. Он изменит твою жизнь. Навсегда.', a: [['У меня нет другого выхода.', 0], ['Я хочу, чтобы это кончилось.', 0.05], ['А если я откажусь?', 0.35]] },
  ];
  let pul = 0.3, breathing = false, t = 0, phase = 'talk', who = 'thin';
  const bB = ctx.el('button', 'btn btn-ice big-btn', ctx.el('div', 'ctl'), 'ДЫШАТЬ РОВНО');
  bB.parentElement.style.bottom = 'auto'; bB.parentElement.style.top = '14px'; bB.parentElement.style.justifyContent = 'flex-end';
  ctx.hold(bB, () => { breathing = true; }, () => { breathing = false; }, { key: 'ShiftLeft' });
  ctx.hint('ЗАЖМИ «ДЫШАТЬ РОВНО» (ИЛИ SHIFT) — ПУЛЬС ПАДАЕТ · ОТВЕТ — КНОПКИ ИЛИ 1–3 · ПОТОМ ПОДПИСЬ ПО ПУНКТИРУ');
  let tracer = null;
  const panel = ctx.el('div', 'g-center'); panel.style.justifyContent = 'flex-end'; panel.style.paddingBottom = '10%';
  const qEl = ctx.el('p', 'say show', panel); qEl.style.position = 'static'; qEl.style.transform = 'none';
  const opts = ctx.el('div', 'row center', panel);
  return new Promise(resolve => {
    async function ask(k) {
      if (k >= QS.length) { choose(); return; }
      const Q = QS[k]; who = Q.q.startsWith('Директор') ? 'fat' : 'thin';
      qEl.textContent = Q.q; A.sfx.mumble(1.4, who === 'fat' ? 0.7 : 1.1, 0.1);
      opts.innerHTML = '';
      let done = false;
      const pickA = i => { if (done) return; done = true; const [, cost] = Q.a[i]; pul = clamp(pul + cost + 0.08, 0, 1); A.sfx.click(); opts.innerHTML = ''; scope.timeout(() => ask(k + 1), 700); };
      Q.a.forEach(([l], i) => { const b = ctx.el('button', 'btn', opts, `${i + 1} · ${l}`); scope.on(b, 'click', () => pickA(i)); if (!i) b.focus({ preventScroll: true }); });
      const kh = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 3) pickA(n - 1); };
      scope.on(document, 'keydown', kh);
      scope.timeout(() => { if (!done) { pickA(2); ctx.say('Молчание приняли за ответ.', { pos: 'top', cls: 'red' }); scope.timeout(() => ctx.unsay('top'), 1500); } }, 9000);
    }
    function choose() {
      qEl.textContent = 'Ройзман положил руку на планшет. Задержал на секунду. — Будет трудно. Ты справишься.';
      opts.innerHTML = '';
      const b1 = ctx.el('button', 'btn btn-primary', opts, '1 · ПОДПИСАТЬ');
      const b2 = ctx.el('button', 'btn', opts, '2 · ВСТАТЬ И УЙТИ');
      b1.focus({ preventScroll: true });
      let done = false;
      const go = k => {
        if (done) return; done = true; panel.remove();
        if (k === 1) { phase = 'sign'; ctx.hint('ВЕДИ ПО ПУНКТИРУ (ЗАЖМИ И ТЯНИ) · ↑ ↓ — ДЕРЖАТЬ ПЕРО НА ЛИНИИ · МОКРАЯ ЛАДОНЬ СКОЛЬЗИТ'); tracer = traceRun(ctx, C, K, { path: null, dur: 7, tol: 0.035, jitter: 0.6 + pul * 1.4 }); }
        else { phase = 'leave'; A.sfx.glitch(0.8); FX.chroma(400); ctx.say('Коридор, мигающие лампы. Архив помнит подпись. Эта версия — искажена.', { pos: 'mid', cls: 'amb' }); scope.timeout(() => resolve({ ok: 'dist', detail: 'НЕ ПОДПИСАЛ' }), 3200); }
      };
      scope.on(b1, 'click', () => go(1)); scope.on(b2, 'click', () => go(2));
      scope.on(document, 'keydown', e => { if (e.key === '1') go(1); if (e.key === '2') go(2); });
    }
    ask(0);
    const sig = t0 => { const t = t0 * 4 * Math.PI; return [0.5 + 0.34 * (Math.sin(2.3 * t) * 0.62 + 0.25 * Math.cos(5.1 * t)) * (0.4 + t0 * 0.6), 0.55 + 0.1 * (Math.cos(1.7 * t) + 0.4 * Math.sin(4.9 * t)) * 0.62]; };
    scope.loop(dt => {
      t += dt;
      pul = clamp(pul + (breathing ? -0.12 : 0.025) * dt, 0.05, 1);
      pulse.set(pul);
      const { g, W, H } = C;
      if (phase === 'talk' || phase === 'leave') { drawOffice(g, W, H, t, who); if (pul > 0.7) { g.fillStyle = `rgba(120,0,16,${(pul - 0.7) * 0.4})`; g.fillRect(0, 0, W, H); } return; }
      // планшет, мокрое стекло
      g.fillStyle = '#1a1c1f'; g.fillRect(0, 0, W, H);
      const pw = Math.min(W * 0.9, H * 1.2), ph = pw * 0.62, px = (W - pw) / 2, py = (H - ph) / 2;
      g.fillStyle = '#0c0d0f'; g.fillRect(px - 12, py - 12, pw + 24, ph + 24);
      g.fillStyle = '#cfd6dc'; g.fillRect(px, py, pw, ph);
      g.fillStyle = '#1d2850'; g.font = `12px ${MONO}`; g.fillText('ТРУДОВОЙ ДОГОВОР · ПОДПИСЬ КАНДИДАТА', px + 14, py + 22);
      for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(40,60,80,.12)'; g.beginPath(); g.ellipse(px + ((k * 97) % pw), py + ((k * 53) % ph), 18, 12, k, 0, Math.PI * 2); g.fill(); }
      const P = u => { const [x, y] = sig(u); return [px + x * pw, py + y * ph]; };
      if (tracer) {
        tracer.step(dt, g, W, H, P);
        ctx.stat(`ПОДПИСЬ ${Math.round(tracer.t * 100)}% · ТОЧНОСТЬ ${Math.round(tracer.acc * 100)}%`);
        if (tracer.t >= 1 && phase === 'sign') {
          phase = 'done';
          const acc = tracer.acc;
          if (acc >= 0.55) { A.sfx.sign(); ctx.say('Он закрыл глаза и начал считать. Один, два, три…', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `ПОДПИСЬ · ТОЧНОСТЬ ${Math.round(acc * 100)}%` }), 3000); }
          else { A.sfx.error(); ctx.say('Палец соскользнул по мокрому стеклу. Подпись не принята.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `ТОЧНОСТЬ ${Math.round(acc * 100)}%` }), 2600); }
        }
      }
    });
  });
}

// ============================================================ 16 · КОЙКА
function gameCot(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  let step = 0, strikes = 0, t = 0, over = false, st = null, gaze = { x: 0.5, y: 0.5 }, ptr = null, anyInput = false, holding = false;
  const vent = scope.own(A.loopNoise({ type: 'lowpass', freq: 400, q: 0.5, vol: 0 })); vent.vol(0.05, 1);
  const holdBtn = ctx.el('button', 'g-key', ctx.el('div', 'ctl'), 'ТЕРПЕТЬ');
  holdBtn.style.width = holdBtn.style.height = 'min(130px, 32vw)';
  holdBtn.parentElement.hidden = true;
  ctx.hold(holdBtn, () => { holding = true; anyInput = true; }, () => { holding = false; });
  scope.on(C.cv, 'pointerdown', e => { ptr = e; anyInput = true; });
  scope.on(C.cv, 'pointermove', e => { const r = C.cv.getBoundingClientRect(); if (e.pointerType === 'mouse' || ptr) { gaze.x = (e.clientX - r.left) / r.width; gaze.y = (e.clientY - r.top) / r.height; } if (st && st.kind === 'joint' && (e.pointerType !== 'mouse' || Math.hypot(e.movementX || 0, e.movementY || 0) > 3)) anyInput = true; });
  scope.on(C.cv, 'pointerup', () => { ptr = null; });
  scope.on(document, 'keydown', e => { anyInput = true; if (st && st.kind === 'breath' && (e.code === 'Space' || e.code === 'Enter') && !e.repeat) st.tap(); });
  scope.on(C.cv, 'pointerdown', () => { if (st && st.kind === 'breath') st.tap(); });
  const STEPS = [
    { kind: 'light', title: 'ФОНАРИК', hint: 'ДЕРЖИ ВЗГЛЯД НА СВЕТЕ: ВЕДИ МЫШЬЮ / ПАЛЬЦЕМ ИЛИ СТРЕЛКАМИ. НЕ ОТВОДИ ГЛАЗА', line: 'Тёмное стекло шлема. Луч фонарика прямо в зрачок.' },
    { kind: 'joint', title: 'СУСТАВЫ', hint: 'НИЧЕГО НЕ ЖМИ И НЕ ДВИГАЙ. ПУСТЬ ГНУТ', line: 'Руку подняли, согнули в локте. Как лошадь на ярмарке.' },
    { kind: 'needle', title: 'ИГЛА', hint: 'ЗАЖМИ «ТЕРПЕТЬ» / ПРОБЕЛ И ДЕРЖИ, ПОКА ИГЛА В ШЕЕ', line: 'Нечто среднее между шприцем и ингалятором. Игла смотрит вбок.' },
    { kind: 'breath', title: 'ДЫХАНИЕ', hint: 'ШЛЕМ СЛИШКОМ БЛИЗКО. ДЫШИ МЕДЛЕННО: ЖМИ В ТАКТ КОЛЬЦУ', line: 'Тёмное стекло приблизилось к лицу. Сканирует каждую пору.' },
  ];
  return new Promise(resolve => {
    function strike(why) {
      strikes++; A.sfx.creak(0.4); FX.hit('#ff0033'); ctx.say(`${why} Ремни затянули туже.`, { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1500);
      if (strikes >= 2) { over = true; scope.timeout(() => resolve({ ok: 'fail', detail: `ПРОЦЕДУР ${step}/4` }), 1800); }
    }
    function next() {
      if (over) return;
      if (step >= STEPS.length) { over = true; ctx.say('Медик выпрямился и показал на дверь. Тьма поглотила их.', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `НАРУШЕНИЙ ${strikes}` }), 3000); return; }
      const S = STEPS[step];
      ctx.hint(S.hint); ctx.say(S.line, { pos: 'top' }); scope.timeout(() => ctx.unsay('top'), 2600);
      holdBtn.parentElement.hidden = S.kind !== 'needle';
      anyInput = false;
      st = { kind: S.kind, t: 0, in: 0, beats: 0, hits: 0, beatT: 1.7, tap: null, done: false };
      if (S.kind === 'breath') st.tap = () => { const ph = st.beatT; if (Math.abs(ph) < 0.3 || Math.abs(ph - 1.7) < 0.3) { st.hits++; A.sfx.heartbeat(0.25); } else { st.miss = (st.miss || 0) + 1; A.sfx.error(); } };
      ctx.stat(`${S.title} · ${step + 1}/4 · НАРУШЕНИЙ ${strikes}/2`);
    }
    scope.timeout(next, 800);
    scope.loop(dt => {
      t += dt;
      const { g, W, H } = C;
      // потолок, лампа, шлем медика
      g.fillStyle = '#d7dcdf'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#eef3f5'; g.fillRect(W * 0.3, H * 0.05, W * 0.4, H * 0.06);
      Art.glowDot(g, W / 2, H * 0.08, W * 0.3, 'rgba(255,255,255,.8)');
      const lean = st && (st.kind === 'breath' || st.kind === 'light') ? 1 : 0.6;
      Art.helmet(g, W * 0.52, H * (0.36 + (1 - lean) * 0.1), Math.min(W, H) * (0.45 + lean * 0.25), { visor: '#20262c', visorDark: '#050607', rimCol: 'rgba(255,255,255,.2)', hoses: false, glow: 0, seed: 16, reflect: (gg, s) => { gg.fillStyle = 'rgba(255,255,255,.25)'; gg.fillRect(-s * 0.3, -s * 0.18, s * 0.2, s * 0.04); } });
      g.fillStyle = '#3a2a22'; g.fillRect(W * 0.05, H * 0.75, W * 0.2, 16); g.fillRect(W * 0.75, H * 0.75, W * 0.2, 16);
      if (!st || over || st.done) { Art.vignette(g, W, H, 0.6); return; }
      st.t += dt;
      if (st.kind === 'light') {
        if (K.ArrowLeft) gaze.x -= dt * 0.5; if (K.ArrowRight) gaze.x += dt * 0.5; if (K.ArrowUp) gaze.y -= dt * 0.5; if (K.ArrowDown) gaze.y += dt * 0.5;
        const lx = 0.5 + Math.sin(st.t * 0.9) * 0.3, ly = 0.45 + Math.sin(st.t * 1.3 + 1) * 0.22, r = 0.08;
        const inside = Math.hypot(gaze.x - lx, gaze.y - ly) < r;
        if (inside) st.in += dt;
        const glare = inside ? 0.55 : 0.2;
        const gr = g.createRadialGradient(lx * W, ly * H, 0, lx * W, ly * H, W * 0.6); gr.addColorStop(0, `rgba(255,255,240,${0.95})`); gr.addColorStop(0.15, `rgba(255,255,240,${glare})`); gr.addColorStop(1, 'rgba(255,255,240,0)');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        drawReticle(g, gaze.x * W, gaze.y * H, inside ? 'rgba(0,120,80,.9)' : 'rgba(200,20,40,.9)', 14);
        ctx.stat(`ФОНАРИК · ВЗГЛЯД ${st.in.toFixed(1)}/6 С · НАРУШЕНИЙ ${strikes}/2`);
        if (st.in >= 6) { st.done = true; step++; A.sfx.click(); scope.timeout(next, 600); }
        else if (st.t > 13) { st.done = true; strike('Он отвёл фонарик от глаз.'); step++; scope.timeout(next, 1600); }
      } else if (st.kind === 'joint') {
        const k = Math.sin(st.t * 2) * 0.5 + 0.5;
        g.strokeStyle = '#8a7a70'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(W * 0.15, H); g.lineTo(W * 0.25, H * 0.7); g.lineTo(W * (0.25 + k * 0.2), H * (0.7 - k * 0.2)); g.stroke();
        g.fillStyle = '#23262a'; g.beginPath(); g.arc(W * (0.25 + k * 0.2), H * (0.7 - k * 0.2), 22, 0, Math.PI * 2); g.fill();
        ctx.stat(`СУСТАВЫ · ${Math.max(0, Math.ceil(6 - st.t))} С · НАРУШЕНИЙ ${strikes}/2`);
        if (st.t > 0.6 && anyInput) { st.done = true; strike('Он сопротивлялся.'); step++; scope.timeout(next, 1600); }
        else if (st.t >= 6) { st.done = true; step++; scope.timeout(next, 400); }
      } else if (st.kind === 'needle') {
        const inj = st.t > 1 ? clamp((st.t - 1) / 5, 0, 1) : 0;
        g.strokeStyle = '#dfe6ea'; g.lineWidth = 3; g.beginPath(); g.moveTo(W * 0.9, H * 0.3); g.lineTo(W * (0.75 - inj * 0.05), H * (0.55 + inj * 0.02)); g.stroke();
        g.fillStyle = '#2a3a44'; g.fillRect(W * 0.86, H * 0.22, W * 0.1, H * 0.1);
        if (inj > 0) { g.fillStyle = `rgba(140,0,20,${inj * 0.25})`; g.fillRect(0, 0, W, H); }
        ctx.stat(`ИГЛА · ${Math.round(inj * 100)}% · НАРУШЕНИЙ ${strikes}/2`);
        if (st.t > 1 && !holding) { st.done = true; strike('Он дёрнулся под иглой.'); step++; holdBtn.parentElement.hidden = true; scope.timeout(next, 1600); }
        else if (inj >= 1) { st.done = true; step++; holdBtn.parentElement.hidden = true; A.sfx.hiss(0.4, 0.06); scope.timeout(next, 500); }
        if (st.t <= 1 && !holding) { ctx.say('Зажми — сейчас будет игла.', { pos: 'bot' }); }
        if (holding) ctx.unsay('bot');
      } else if (st.kind === 'breath') {
        st.beatT -= dt; if (st.beatT <= 0) { st.beatT += 1.7; st.beats++; }
        const k = st.beatT / 1.7, R = Math.min(W, H) * 0.08;
        g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, H * 0.85, R, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = 'rgba(0,120,160,.9)'; g.beginPath(); g.arc(W / 2, H * 0.85, R * (1 + k * 2), 0, Math.PI * 2); g.stroke();
        ctx.stat(`ДЫХАНИЕ · ${st.hits}/6 · НАРУШЕНИЙ ${strikes}/2`);
        if (st.hits >= 6) { st.done = true; step++; scope.timeout(next, 400); }
        else if ((st.miss || 0) >= 3 || st.beats > 12) { st.done = true; strike('Он задышал чаще.'); step++; scope.timeout(next, 1600); }
      }
      Art.vignette(g, W, H, 0.55);
    });
  });
}

// ============================================================ 18 · ЛИНИЯ
function gameLine(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const ROUNDS = [10, 20, 47], TOL = [1.5, 2.5, 5];
  let r = 0, phase = 'intro', t0 = 0, t = 0, lid = 0, score = 0, results = [], flick = 0, stepT = 2, over = false;
  const vent = scope.own(A.loopNoise({ type: 'lowpass', freq: 260, q: 0.6, vol: 0 })); vent.vol(0.07, 1);
  const btn = ctx.el('button', 'btn btn-primary big-btn', ctx.el('div', 'ctl'), 'СТАРТ');
  ctx.hint('СТАРТ — НАЧАТЬ СЧЁТ · «СЕЙЧАС» — КОГДА ПРОШЛО ВРЕМЯ · ВЕКИ ТЯЖЕЛЕЮТ: ДВИГАЙ МЫШЬЮ / ПАЛЬЦЕМ ИЛИ ↑');
  ctx.say('— Жди здесь, — бросил смотритель. Замок щёлкнул. Шаги затихли.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3000);
  const wake = () => { lid = Math.max(0, lid - 0.25); };
  scope.on(C.cv, 'pointermove', e => { if (Math.hypot(e.movementX || 0, e.movementY || 0) > 6) wake(); });
  scope.on(C.cv, 'pointerdown', wake);
  scope.on(document, 'keydown', e => { if (e.code === 'ArrowUp' || e.code === 'KeyW') wake(); });
  return new Promise(resolve => {
    const press = () => {
      if (over) return;
      if (phase === 'intro' || phase === 'between') { phase = 'count'; t0 = ctx.now(); btn.textContent = 'СЕЙЧАС'; A.sfx.beep(600, 0.08); ctx.say(`Отмерь ${ROUNDS[r]} ${plural(ROUNDS[r], 'секунду', 'секунды', 'секунд')}.`, { pos: 'top' }); scope.timeout(() => ctx.unsay('top'), 1500); return; }
      if (phase === 'count') {
        const el = (ctx.now() - t0) / 1000, diff = el - ROUNDS[r], ok = Math.abs(diff) <= TOL[r];
        results.push(`${ROUNDS[r]}→${el.toFixed(1)}`); if (ok) score++;
        A.sfx[ok ? 'chime' : 'error'](ok ? 660 : undefined, 0.05);
        ctx.say(`${el.toFixed(1)} с. ${ok ? 'Почти как часы.' : diff > 0 ? 'Слишком долго.' : 'Слишком рано.'}`, { pos: 'mid', cls: ok ? '' : 'red' }); scope.timeout(() => ctx.unsay('mid'), 1600);
        r++; phase = 'between'; btn.textContent = 'СТАРТ';
        if (r >= ROUNDS.length) finish();
      }
    };
    function finish() {
      over = true; btn.parentElement.remove();
      const ok = score >= 2;
      scope.timeout(() => { ctx.say(ok ? 'Пока не позовут. Пока не убьют. Пока не воскреснут снова.' : 'Время в бетонной коробке не течёт. Он потерял счёт.', { pos: 'mid', cls: ok ? '' : 'red' }); scope.timeout(() => resolve({ ok: ok ? 'ok' : 'fail', detail: results.join(' · ') }), 2800); }, 1800);
    }
    scope.on(btn, 'click', press);
    scope.on(document, 'keydown', e => { if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); press(); } });
    const bg = cachedBg(C, (g, W, H) => {
      g.drawImage(Art.concrete(Math.round(W), Math.round(H), { base: '#1d1b1c', seed: 18, cracks: 5 }), 0, 0, W, H);
      g.fillStyle = '#121113'; g.fillRect(0, H * 0.72, W, H * 0.28);
      g.fillStyle = '#2a2a2e'; g.fillRect(W * 0.55, H * 0.66, W * 0.35, H * 0.08);
      g.strokeStyle = '#ffb347'; g.setLineDash([12, 10]); g.lineWidth = 3; g.strokeRect(W * 0.56, H * 0.67, W * 0.33, H * 0.06); g.setLineDash([]);
      Art.figure(g, W * 0.24, H * 0.9, H * 0.4, { body: '#060506', wide: 1.3, eyes: '#ffffff' });
      g.fillStyle = '#1b1a1d'; g.beginPath(); g.ellipse(W * 0.34, H * 0.86, H * 0.05, H * 0.04, 0, 0, Math.PI * 2); g.fill();
    });
    scope.loop(dt => {
      t += dt;
      if (phase === 'count' && !over) {
        lid = Math.min(1, lid + dt * (0.035 + r * 0.01));
        if (lid >= 1) { phase = 'between'; results.push(`${ROUNDS[r]}→СОН`); r++; btn.textContent = 'СТАРТ'; ctx.say('Веки сомкнулись. Он уснул впервые за много циклов.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1800); lid = 0; if (r >= ROUNDS.length) finish(); }
        stepT -= dt; if (stepT <= 0) { stepT = rand(0.5, 2.6); A.sfx.step(0.08, rand(-1, 1)); }
        if (Math.random() < dt * 0.4) flick = rand(0.08, 0.4);
      }
      flick = Math.max(0, flick - dt);
      ctx.stat(`ОТРЕЗОК ${Math.min(r + 1, 3)}/3 · ВЕРНО ${score}`);
      const { g, W, H } = C;
      g.drawImage(bg(), 0, 0, W, H);
      Art.glowDot(g, W / 2, 0, W * 0.5, 'rgba(255,240,200,.25)', flick > 0 ? 0.2 : 1);
      if (flick > 0) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H); }
      // монитор наблюдения: ровная зелёная линия
      const mx = W * 0.62, my = H * 0.08, mw = W * 0.32, mh = H * 0.18;
      g.fillStyle = '#021208'; g.fillRect(mx, my, mw, mh); g.strokeStyle = '#1b3a26'; g.strokeRect(mx, my, mw, mh);
      g.strokeStyle = '#00ff88'; g.lineWidth = 1.5; g.beginPath();
      for (let x = 0; x <= mw; x += 3) { const y = my + mh / 2 + (Math.sin((x + t * 60) * 0.3) * (phase === 'count' ? 0.6 : 1.5)); x ? g.lineTo(mx + x, y) : g.moveTo(mx, y); } g.stroke();
      g.fillStyle = '#00ff88'; g.font = `10px ${MONO}`; g.fillText('К-26 · СТАБИЛЕН', mx + 6, my + 14);
      // веки
      const lh = H * 0.5 * lid;
      g.fillStyle = '#000'; g.fillRect(0, 0, W, lh); g.fillRect(0, H - lh, W, lh);
      Art.vignette(g, W, H, 0.7);
    });
  });
}

// ============================================================ 19 · КОЖА
function gameSkin(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const wakeM = meterEl(ctx, 'ПРОБУЖДЕНИЕ');
  const DUR = 30;
  let x = 0.5, y = 0.6, px = 0.5, py = 0.6, wake = 0.1, t = 0, over = false, warm = [], ice = [], nextWarm = 0.5, nextIce = 2, ptr = false;
  const pad = [196, 246.9, 293.7].map(f => scope.own(A.loopOsc({ type: 'sine', freq: f, vol: 0 })));
  const cap = scope.own(A.loopOsc({ type: 'sawtooth', freq: 50, vol: 0, lp: 200 }));
  ctx.hint('ВОДИ МЕДЛЕННО К ТЁПЛЫМ ТОЧКАМ · РЕЗКОЕ ДВИЖЕНИЕ БУДИТ · НЕ КАСАЙСЯ ЛЬДА · 30 С');
  ctx.say('Он стоял на траве. Она стояла в нескольких шагах.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3000);
  scope.on(C.cv, 'pointermove', e => { const r = C.cv.getBoundingClientRect(); if (e.pointerType === 'mouse' || ptr) { x = (e.clientX - r.left) / r.width; y = (e.clientY - r.top) / r.height; } });
  scope.on(C.cv, 'pointerdown', e => { ptr = true; const r = C.cv.getBoundingClientRect(); x = (e.clientX - r.left) / r.width; y = (e.clientY - r.top) / r.height; px = x; py = y; });
  scope.on(C.cv, 'pointerup', () => { ptr = false; });
  const blades = Array.from({ length: 400 }, () => ({ x: Math.random(), y: 0.55 + Math.random() * 0.45, h: rand(10, 40), p: Math.random() * 6 }));
  return new Promise(resolve => {
    scope.loop(dt => {
      t += dt;
      if (!over) {
        if (K.ArrowLeft) x -= dt * 0.25; if (K.ArrowRight) x += dt * 0.25; if (K.ArrowUp) y -= dt * 0.25; if (K.ArrowDown) y += dt * 0.25;
        x = clamp(x, 0, 1); y = clamp(y, 0, 1);
        const sp = Math.hypot(x - px, y - py) / Math.max(dt, 0.001); px = x; py = y;
        if (sp > 0.9) wake += (sp - 0.9) * dt * 0.5;
        nextWarm -= dt; if (nextWarm <= 0 && warm.length < 3) { nextWarm = rand(1.2, 2.2); warm.push({ x: rand(0.15, 0.85), y: rand(0.3, 0.85), life: 5 }); }
        nextIce -= dt; if (nextIce <= 0) { nextIce = rand(0.7, 1.4) * (1 - t / DUR * 0.4); const side = Math.random() < 0.5; ice.push({ x: side ? -0.05 : 1.05, y: rand(0.2, 0.9), vx: (side ? 1 : -1) * rand(0.08, 0.16), vy: rand(-0.04, 0.04), r: rand(0.03, 0.06) }); }
        for (let k = warm.length - 1; k >= 0; k--) { const w = warm[k]; w.life -= dt; if (Math.hypot(w.x - x, w.y - y) < 0.06) { warm.splice(k, 1); wake = Math.max(0, wake - 0.14); A.sfx.chime(520 + rand(0, 200), 0.03); continue; } if (w.life <= 0) warm.splice(k, 1); }
        for (let k = ice.length - 1; k >= 0; k--) { const c = ice[k]; c.x += c.vx * dt; c.y += c.vy * dt; if (Math.hypot(c.x - x, c.y - y) < c.r + 0.02) { ice.splice(k, 1); wake += 0.18; A.sfx.ice(0.12); FX.flash('#88ddff', 300, 0.3); continue; } if (c.x < -0.2 || c.x > 1.2) ice.splice(k, 1); }
        wake = clamp(wake + dt * 0.012, 0, 1);
        if (wake >= 1) { over = true; A.sfx.system(false); FX.flash('#ffffff', 800, 0.8); ctx.say('Гудение капсулы. Холодный гель. Он проснулся.', { pos: 'mid', cls: 'ice' }); scope.timeout(() => resolve({ ok: 'fail', detail: `СОН ${Math.round(t)} С ИЗ ${DUR}` }), 2600); }
        else if (t >= DUR) { over = true; ctx.say('Он закрыл глаза и остался в её объятиях. Там, где был живым.', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `ПРОБУЖДЕНИЕ ${Math.round(wake * 100)}%` }), 3200); }
        ctx.stat(`СОН ${Math.max(0, Math.ceil(DUR - t))} С · ПРОБУЖДЕНИЕ ${Math.round(wake * 100)}%`);
      }
      pad.forEach((p, i) => p.vol((1 - wake) * (0.03 - i * 0.006))); cap.vol(wake * 0.05);
      wakeM.set(wake);
      const { g, W, H } = C;
      const sky = g.createLinearGradient(0, 0, 0, H * 0.6); sky.addColorStop(0, `rgb(${lerp(150, 40, wake) | 0},${lerp(200, 60, wake) | 0},${lerp(230, 90, wake) | 0})`); sky.addColorStop(1, `rgb(${lerp(255, 60, wake) | 0},${lerp(236, 70, wake) | 0},${lerp(200, 90, wake) | 0})`);
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      Art.glowDot(g, W * 0.7, H * 0.15, W * 0.5, 'rgba(255,245,210,.8)', 1 - wake);
      g.fillStyle = `rgb(${lerp(90, 30, wake) | 0},${lerp(150, 50, wake) | 0},${lerp(70, 60, wake) | 0})`; g.fillRect(0, H * 0.55, W, H * 0.45);
      g.lineWidth = 1.5;
      blades.forEach(b => { const sw = Math.sin(t * 1.3 + b.p) * b.h * 0.25; g.strokeStyle = `hsla(${95 + b.p * 5},${45 - wake * 30}%,${35 - wake * 15}%,.9)`; g.beginPath(); g.moveTo(b.x * W, b.y * H); g.quadraticCurveTo(b.x * W + sw * 0.4, b.y * H - b.h * 0.6, b.x * W + sw, b.y * H - b.h); g.stroke(); });
      // она: силуэт вдалеке, карие волосы
      g.globalAlpha = 1 - wake * 0.7;
      Art.figure(g, W * 0.62, H * 0.62, H * 0.38, { body: '#3b2a20' }); g.fillStyle = '#4b2f1b'; g.beginPath(); g.ellipse(W * 0.62, H * 0.62 - H * 0.38 * 0.93, H * 0.035, H * 0.04, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      warm.forEach(w => Art.glowDot(g, w.x * W, w.y * H, 40, 'rgba(255,200,140,.9)', Math.min(1, w.life)));
      ice.forEach(c => { g.save(); g.translate(c.x * W, c.y * H); g.rotate(t); g.strokeStyle = '#dff6ff'; g.fillStyle = 'rgba(136,221,255,.5)'; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, rr = c.r * Math.min(W, H) * (k % 2 ? 0.5 : 1); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); g.restore(); });
      Art.glowDot(g, x * W, y * H, 30, 'rgba(255,230,200,.9)');
      // реальность прорывается: синие трещины по краям
      if (wake > 0.2) { g.strokeStyle = `rgba(136,221,255,${wake * 0.7})`; g.lineWidth = 2; const R = mulberry(19); for (let k = 0; k < wake * 16; k++) { let cx = R() < 0.5 ? 0 : W, cy = R() * H; g.beginPath(); g.moveTo(cx, cy); for (let s = 0; s < 6; s++) { cx += (cx < W / 2 ? 1 : -1) * R() * 40; cy += (R() - 0.5) * 40; g.lineTo(cx, cy); } g.stroke(); } }
      Art.vignette(g, W, H, 0.3 + wake * 0.6, wake > 0.5 ? '0,20,40' : '0,0,0');
    });
  });
}

// ============================================================ 20 · БУКЛЕТ
function gameBooklet(ctx) {
  const { scope } = ctx;
  const PAGES = [
    { rules: ['1. Избегать прямого зрительного контакта с клоном дольше трёх секунд.', '2. Не задавать клону вопросов, не связанных с заданием.', '3. Не прикасаться к клону без служебной необходимости.'],
      log: [['Смотритель выдал К-26 форму и сразу отвернулся.', 0], ['Техник смотрел К-26 в глаза, пока тот не отвёл взгляд.', 1], ['Лаборантка спросила К-26, не холодно ли ему.', 1], ['Медик проверил суставы клона по протоколу осмотра.', 0], ['Смотритель поправил К-26 воротник.', 1], ['Оператор спросил о готовности к заданию.', 0]] },
    { rules: ['4. Не запоминать номера клонов, если это не требуется для отчётности.', '5. При эмоциональной реакции на гибель клона — к корпоративному психологу.', '6. Не допускать клона к документации о его статусе.'],
      log: [['В журнале смены отмечен расход: три единицы.', 0], ['Техник выписал номер К-26 на полях буклета.', 1], ['После утилизации К-31 сменщик молчал до утра и никому не сказал.', 1], ['Буклет остался на столе в камере клона.', 1], ['Отчёт о списании отправлен в аналитический отдел.', 0], ['Смена прошла без происшествий.', 0]] },
    { rules: ['7. Вопросы «за что?», «почему я?», «кто я?» — немедленная аварийная деактивация.', 'Бр. №2, п.5. Не вступать в переговоры с противником.', 'Бр. №2, п.6. Свои трупы не бросать: оставленный труп — источник ДНК.'],
      log: [['К-26 спросил: «Почему я?» Техник промолчал и не доложил.', 1], ['Отряд сжёг трупы фильтраторов в течение часа.', 0], ['Рейдер заговорил с раненым из неопознанной группы.', 1], ['Тело клона оставлено в штреке без эвакуации.', 1], ['Сектор отмечен как безопасный после зачистки.', 0], ['К-26 впервые уснул в бетонной коробке.', 0]] },
  ];
  const wrap = ctx.el('div', 'g-center'); wrap.style.justifyContent = 'flex-start';
  const head = ctx.el('p', 'g-sub', wrap);
  const rulesEl = ctx.el('div', 'g-panel paper', wrap);
  const logEl = ctx.el('div', 'g-panel', wrap);
  const nextB = ctx.el('button', 'btn btn-primary', wrap, 'ДАЛЬШЕ');
  let pg = 0, right = 0, wrong = 0, total = 0, timeLeft = 40;
  ctx.hint('ТАП ПО ФРАЗЕ ЖУРНАЛА — НАРУШЕНИЕ · ПОВТОРНЫЙ ТАП — СНЯТЬ · TAB/ENTER ТОЖЕ · «ДАЛЬШЕ» — СЛЕДУЮЩАЯ СТРАНИЦА');
  return new Promise(resolve => {
    function render() {
      const P = PAGES[pg];
      head.textContent = `БРОШЮРА №${pg < 2 ? 1 : '1–2'} · СТРАНИЦА ${pg + 1}/3 · ВРЕМЯ СМЕНЫ ТИКАЕТ`;
      rulesEl.innerHTML = `<p class="g-h">КРАТКИЙ РЕГЛАМЕНТ ОБРАЩЕНИЯ С КЛОНАМИ</p><div class="g-text">${P.rules.map(r => `<p style="margin:.3rem 0">${esc(r)}</p>`).join('')}</div>`;
      logEl.innerHTML = `<p class="g-h">ЖУРНАЛ СМЕНЫ</p><div class="g-text">${P.log.map(([s], k) => `<p style="margin:.35rem 0"><span class="ph" tabindex="0" role="button" aria-pressed="false" data-k="${k}">${esc(s)}</span></p>`).join('')}</div>`;
      $$('.ph', logEl).forEach(el => {
        const tog = () => { const on = !el.classList.contains('hit'); el.classList.toggle('hit', on); el.setAttribute('aria-pressed', String(on)); A.sfx.key(); };
        scope.on(el, 'click', tog); scope.on(el, 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } });
      });
      timeLeft = 40;
      const f = $('.ph', logEl); if (f) f.focus({ preventScroll: true });
    }
    function submit() {
      const P = PAGES[pg];
      $$('.ph', logEl).forEach(el => {
        const k = +el.dataset.k, bad = P.log[k][1], hit = el.classList.contains('hit');
        if (bad) total++;
        if (bad && hit) { right++; el.classList.add('found'); } else if (!bad && hit) { wrong++; el.classList.add('miss'); } else if (bad) el.style.textDecoration = 'underline wavy #ff3355';
      });
      A.sfx.page();
      pg++;
      ctx.stat(`НАЙДЕНО ${right} · ЛОЖНЫХ ${wrong}`);
      if (pg >= PAGES.length) {
        nextB.remove();
        const score = right - wrong, ok = score >= 6;
        scope.timeout(() => { ctx.say(ok ? '«Семь правил. Как не начать видеть». Тонкая разница.' : 'Техник закрыл брошюру. — Издержки производства.', { pos: 'bot', cls: ok ? '' : 'red' }); scope.timeout(() => resolve({ ok: ok ? 'ok' : 'fail', detail: `НАРУШЕНИЙ НАЙДЕНО ${right}/9 · ЛОЖНЫХ ${wrong}` }), 2800); }, 1600);
      } else scope.timeout(render, 1500);
    }
    scope.on(nextB, 'click', () => { if (pg < PAGES.length) submit(); });
    render();
    ctx.stat('НАЙДЕНО 0 · ЛОЖНЫХ 0');
    scope.loop(dt => { if (pg >= PAGES.length) return false; timeLeft -= dt; head.textContent = head.textContent.replace(/ · \d+ С$|$/, ` · ${Math.max(0, Math.ceil(timeLeft))} С`); if (timeLeft <= 0) { timeLeft = 99; submit(); } });
  });
}

// ============================================================ 21 · СНЕГ
function gameSnow(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const DUR = 45, COLS = 60;
  const drift = new Array(COLS).fill(0);
  let flakes = [], t = 0, over = false, down = false, dx = 0.5, dy = 0.3, off = 0, offT = 3, sfxT = 0;
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 50, vol: 0 })); hum.vol(0.03, 1);
  ctx.hint('ВЕДИ ПАЛЬЦЕМ / МЫШЬЮ С ЗАЖАТОЙ КНОПКОЙ — ИДЁТ СНЕГ · ПРОБЕЛ — ТОЖЕ · СУГРОБ ДО ЧЕРТЫ');
  ctx.say('Пальцы коснулись поверхности. Холодной. Гладкой. Экран засветился.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3000);
  const pos = e => { const r = C.cv.getBoundingClientRect(); dx = (e.clientX - r.left) / r.width; dy = (e.clientY - r.top) / r.height; };
  scope.on(C.cv, 'pointerdown', e => { down = true; pos(e); try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ } });
  scope.on(C.cv, 'pointermove', e => { if (down) pos(e); });
  scope.on(C.cv, 'pointerup', () => { down = false; });
  const TARGET = 0.3;
  return new Promise(resolve => {
    scope.loop(dt => {
      t += dt;
      offT -= dt; if (offT <= 0 && off <= 0) { off = rand(0.6, 1.2); offT = rand(4, 7); A.sfx.beep(90, 0.2, 0.05); }
      off = Math.max(0, off - dt);
      const spawning = !over && off <= 0 && (down || K.Space);
      if (spawning) {
        const n = Math.round(60 * dt * 3);
        for (let k = 0; k < n; k++) flakes.push({ x: (K.Space && !down ? Math.random() : dx + rand(-0.04, 0.04)), y: (K.Space && !down ? 0 : dy + rand(-0.02, 0.02)), vy: rand(0.05, 0.14), sw: rand(0, 6), s: rand(1, 3) });
        sfxT -= dt; if (sfxT <= 0) { sfxT = 0.25; A.sfx.snow(); }
      }
      flakes.forEach(f => { f.y += f.vy * dt; f.x += Math.sin(t * 1.5 + f.sw) * 0.02 * dt; });
      for (let k = flakes.length - 1; k >= 0; k--) { const f = flakes[k], c = clamp(Math.floor(f.x * COLS), 0, COLS - 1), top = 1 - drift[c]; if (f.y >= top) { drift[c] = Math.min(0.6, drift[c] + 0.0035 * f.s); flakes.splice(k, 1); } }
      if (flakes.length > 1500) flakes.splice(0, flakes.length - 1500);
      for (let c = 0; c < COLS; c++) { drift[c] = Math.max(0, drift[c] - dt * 0.004); if (c > 0 && drift[c] - drift[c - 1] > 0.02) { drift[c] -= 0.004; drift[c - 1] += 0.004; } if (c < COLS - 1 && drift[c] - drift[c + 1] > 0.02) { drift[c] -= 0.004; drift[c + 1] += 0.004; } }
      const avg = drift.reduce((a, b) => a + b, 0) / COLS;
      if (!over) {
        ctx.stat(`СУГРОБ ${Math.round(Math.min(1, avg / TARGET) * 100)}% · ${Math.max(0, Math.ceil(DUR - t))} С`);
        if (avg >= TARGET) { over = true; A.sfx.chime(880, 0.05); ctx.say('Снег падал, кружился, таял на пальцах. Холод был приятным.', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `СУГРОБ ЗА ${Math.round(t)} С` }), 3000); }
        else if (t >= DUR) { over = true; A.sfx.system(false); ctx.say('Экран стал чёрным. И снега больше не было.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `СУГРОБ ${Math.round(avg / TARGET * 100)}%` }), 2600); }
      }
      const { g, W, H } = C;
      g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, W, H);
      const sx = W * 0.06, sy = H * 0.05, sw = W * 0.88, sh = H * 0.9;
      const on = off <= 0;
      g.fillStyle = on ? '#12181d' : '#030304'; g.fillRect(sx, sy, sw, sh);
      if (on) { const gl = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, sw * 0.7); gl.addColorStop(0, 'rgba(180,210,230,.18)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(sx, sy, sw, sh); }
      g.save(); g.beginPath(); g.rect(sx, sy, sw, sh); g.clip();
      g.fillStyle = '#eef6fb';
      flakes.forEach(f => { g.globalAlpha = on ? 0.9 : 0.15; g.beginPath(); g.arc(sx + f.x * sw, sy + f.y * sh, f.s, 0, Math.PI * 2); g.fill(); });
      g.globalAlpha = 1;
      g.fillStyle = on ? '#e3eef4' : '#2a2e31'; g.beginPath(); g.moveTo(sx, sy + sh);
      for (let c = 0; c < COLS; c++) g.lineTo(sx + (c + 0.5) / COLS * sw, sy + sh * (1 - drift[c]));
      g.lineTo(sx + sw, sy + sh); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,179,71,.7)'; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(sx, sy + sh * (1 - TARGET)); g.lineTo(sx + sw, sy + sh * (1 - TARGET)); g.stroke(); g.setLineDash([]);
      g.restore();
      g.strokeStyle = '#26262a'; g.lineWidth = 10; g.strokeRect(sx, sy, sw, sh);
      Art.scan(g, W, H, 0.12);
      Art.vignette(g, W, H, 0.6);
    });
  });
}

// ============================================================ 22 · БЫТ
function gameRoutine(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const DUR = 70;
  const m = { dry: 0.2, bit: 0.2, emp: 0.25 };
  const bars = { dry: meterEl(ctx, 'СУХОСТЬ', 'amb', { left: '14px', top: '10px' }), bit: meterEl(ctx, 'ГОРЕЧЬ', '', { left: '14px', top: '44px' }), emp: meterEl(ctx, 'ПУСТОТА', 'ice', { left: '14px', top: '78px' }) };
  const ACTS = [
    ['ЛЕЧЬ', 'bed', 'Он лежал и смотрел в потолок. Он знал каждую трещину.', { dry: -0.02, emp: 0.06 }],
    ['ЭКРАН', 'screen', 'Он положил руки на стол. Экран оставался чёрным.', { emp: -0.14, dry: 0.02 }],
    ['ТРЕЩИНЫ', 'bed', 'Раз. Два. Три. Трещины расходятся от лампы, как паутина.', { emp: -0.07, dry: 0.03 }],
    ['ТАБЛЕТКА', 'table', 'Горечь прилипла к нёбу. Внутри стало тише.', { emp: -0.22, bit: 0.26, dry: 0.12 }],
    ['КОНДЕНСАТ', 'wall', 'Он лизнул влажный бетон. Стыдно не было. Не было ничего.', { dry: -0.2, emp: 0.1, bit: -0.05 }],
  ];
  const row = ctx.el('div', 'ctl'); row.style.flexWrap = 'wrap';
  const btns = ACTS.map(([l], k) => { const b = ctx.el('button', 'btn', row, `${k + 1} · ${l}`); b.style.flex = '1 1 110px'; b.style.padding = '.8rem .3rem'; return b; });
  const cd = ACTS.map(() => 0);
  let t = 0, over = false, spot = 'bed', warden = rand(20, 50), wardenDone = false, lamp = 0;
  ctx.hint('КНОПКИ ИЛИ 1–5 · У КАЖДОГО ДЕЙСТВИЯ СВОЯ ЦЕНА · НИ ОДНА ШКАЛА НЕ ДОЛЖНА ДОЙТИ ДО КРАЯ');
  return new Promise(resolve => {
    function act(k) {
      if (over || cd[k] > 0) return;
      const [, where, line, d] = ACTS[k];
      spot = where; cd[k] = k === 3 ? 12 : k === 1 ? 6 : 4;
      for (const key in d) m[key] = clamp(m[key] + d[key] * (key === 'emp' && k === 1 ? rand(0.6, 1.2) : 1), 0, 1);
      if (k === 1 && Math.random() < 0.15) { m.emp = Math.max(0, m.emp - 0.2); ctx.say('Экран на миг мигнул. Или показалось.', { pos: 'top', cls: 'ice' }); A.sfx.snow(); }
      else ctx.say(line, { pos: 'top' });
      scope.timeout(() => ctx.unsay('top'), 2200);
      A.sfx.click();
    }
    btns.forEach((b, k) => scope.on(b, 'click', () => act(k)));
    scope.on(document, 'keydown', e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 5) act(n - 1); });
    const bg = cachedBg(C, (g, W, H) => {
      g.drawImage(Art.concrete(Math.round(W), Math.round(H), { base: '#2a292b', seed: 22, cracks: 14 }), 0, 0, W, H);
      g.fillStyle = '#1a191b'; g.fillRect(0, H * 0.7, W, H * 0.3);
      g.fillStyle = '#3a3a3e'; g.fillRect(W * 0.05, H * 0.58, W * 0.28, H * 0.08);
      g.fillStyle = '#4a4a50'; g.fillRect(W * 0.05, H * 0.56, W * 0.28, H * 0.03);
      g.fillStyle = '#333236'; g.fillRect(W * 0.46, H * 0.5, W * 0.22, H * 0.04); g.fillRect(W * 0.48, H * 0.54, W * 0.02, H * 0.16); g.fillRect(W * 0.64, H * 0.54, W * 0.02, H * 0.16);
      g.fillStyle = '#050506'; g.fillRect(W * 0.5, H * 0.32, W * 0.14, H * 0.17);
      g.fillStyle = '#2d2c30'; g.fillRect(W * 0.82, H * 0.2, W * 0.14, H * 0.5);
      g.fillStyle = 'rgba(143,176,196,.25)'; g.fillRect(W * 0.72, H * 0.4, W * 0.06, H * 0.2);
    });
    scope.loop(dt => {
      t += dt;
      cd.forEach((v, k) => { cd[k] = Math.max(0, v - dt); btns[k].disabled = cd[k] > 0 || over; });
      if (!over) {
        m.dry = clamp(m.dry + dt * (spot === 'bed' ? 0.006 : 0.012), 0, 1);
        m.bit = clamp(m.bit - dt * 0.008, 0, 1);
        m.emp = clamp(m.emp + dt * (spot === 'bed' ? 0.016 : 0.01), 0, 1);
        if (!wardenDone && t >= warden) { wardenDone = true; A.sfx.drawer(); ctx.say('Дверь открылась. Смотритель поставил новую банку. Забрал старую. Ушёл.', { pos: 'mid' }); scope.timeout(() => ctx.unsay('mid'), 3000); m.emp = Math.max(0, m.emp - 0.1); }
        const bad = Object.entries(m).find(([, v]) => v >= 1);
        const hour = 6 + Math.floor(t / DUR * 16);
        ctx.stat(`${String(hour).padStart(2, '0')}:00 · ДЕНЬ ИДЁТ`);
        if (bad) { over = true; A.sfx.scare(); ctx.say({ dry: 'Язык шершавый, как наждак. Горло склеилось.', bit: 'Горечь залила всё. Он перестал различать вкус.', emp: 'Пустота. Он перестал вставать.' }[bad[0]], { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `ДО ${hour}:00` }), 2800); }
        else if (t >= DUR) { over = true; ctx.say('Наконец уснул. Опять. Это было его бытом.', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: 'ДЕНЬ ПРОЖИТ' }), 3000); }
      }
      Object.entries(bars).forEach(([k, b]) => b.set(m[k]));
      const { g, W, H } = C;
      g.drawImage(bg(), 0, 0, W, H);
      lamp = Math.random() < 0.02 ? 0.3 : Math.min(1, lamp + dt * 3);
      Art.glowDot(g, W / 2, H * 0.05, W * 0.6, 'rgba(255,250,235,.35)', lamp);
      g.fillStyle = 'rgba(200,190,170,.8)'; g.fillRect(W * 0.54, H * 0.45, W * 0.02, H * 0.05);
      const X = { bed: 0.18, screen: 0.57, table: 0.58, wall: 0.75 }[spot];
      if (spot === 'bed') { Art.lying(g, W * 0.19, H * 0.555, W * 0.2, { body: '#060506' }); }
      else Art.figure(g, W * X, H * 0.74, H * 0.42, { body: '#060506', eyes: '#ffffff', wide: 1.1 });
      Art.vignette(g, W, H, 0.7);
    });
  });
}

// ============================================================ 23 · ПЫЛЬ
const DRUGS = [
  { n: 'Эфедрин', form: 'powder', col: '#f0f0ec', look: 'белый мелкокристаллический порошок', route: 'внутрь, под язык', note: 'через 15 минут, держит 2–3 часа · доза полграмма' },
  { n: 'Дизоксиэфедрин', form: 'ampoule', col: '#cfe8f2', look: 'ампула с изогнутой иглой', route: 'внутримышечно, в бедро или плечо', note: 'через 3 минуты · одна ампула · две — сердце через 7 минут' },
  { n: 'Гиперзин', form: 'epipen', col: '#d4001e', look: 'красный эпипен с жёлтой этикеткой', route: 'в вену, под давлением', note: 'стим-пак на 5–10 минут · потом вырубит' },
  { n: 'Аранепс', form: 'canister', col: '#2a1c14', look: 'канистра тёмной жидкости', route: 'пьётся как сок', note: 'два глотка в сутки · привыкание с первого' },
  { n: 'Импедризин', form: 'drip', col: '#ff3355', look: 'капельница, голограмма в тревожно-красном', route: 'внутривенно', note: 'отключает сознание · 40 минут до реанимации' },
  { n: 'Фентанил', form: 'bag', col: '#ffffff', look: 'пакет с белым порошком', route: 'запрещён', note: 'трибунал · расстрел без права на клонирование' },
  { n: 'Ноктюрин', form: 'inhaler', col: '#2a5a9a', look: 'матово-синий ингалятор с зелёной «N»', route: 'ингаляция, только медики', note: 'сон через 3–5 с · на себя — запрещено' },
];
function drawDrug(g, d, x, y, s) {
  g.save(); g.translate(x, y);
  switch (d.form) {
    case 'powder': g.fillStyle = d.col; g.beginPath(); g.moveTo(-s * 0.4, s * 0.25); g.quadraticCurveTo(0, -s * 0.35, s * 0.4, s * 0.25); g.closePath(); g.fill(); break;
    case 'bag': g.fillStyle = 'rgba(220,230,240,.35)'; g.fillRect(-s * 0.3, -s * 0.35, s * 0.6, s * 0.7); g.fillStyle = d.col; g.fillRect(-s * 0.22, -s * 0.05, s * 0.44, s * 0.32); g.fillStyle = '#c33'; g.fillRect(-s * 0.3, -s * 0.35, s * 0.6, s * 0.06); break;
    case 'ampoule': g.fillStyle = 'rgba(200,230,240,.5)'; g.fillRect(-s * 0.08, -s * 0.35, s * 0.16, s * 0.55); g.strokeStyle = '#ddd'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, s * 0.2); g.quadraticCurveTo(s * 0.05, s * 0.35, s * 0.2, s * 0.4); g.stroke(); break;
    case 'epipen': g.fillStyle = d.col; g.fillRect(-s * 0.1, -s * 0.4, s * 0.2, s * 0.8); g.fillStyle = '#ffd11a'; g.fillRect(-s * 0.1, -s * 0.1, s * 0.2, s * 0.18); g.fillStyle = '#300'; g.fillRect(-s * 0.06, s * 0.4, s * 0.12, s * 0.06); break;
    case 'canister': g.fillStyle = '#3a3a3e'; g.fillRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.65); g.fillStyle = d.col; g.fillRect(-s * 0.27, -s * 0.1, s * 0.54, s * 0.42); g.fillStyle = '#555'; g.fillRect(-s * 0.08, -s * 0.4, s * 0.16, s * 0.12); break;
    case 'drip': g.fillStyle = 'rgba(255,60,90,.4)'; g.fillRect(-s * 0.2, -s * 0.4, s * 0.4, s * 0.45); g.strokeStyle = d.col; g.lineWidth = 2; g.beginPath(); g.moveTo(0, s * 0.05); g.lineTo(0, s * 0.4); g.stroke(); break;
    case 'inhaler': g.fillStyle = d.col; g.fillRect(-s * 0.14, -s * 0.35, s * 0.28, s * 0.55); g.fillRect(-s * 0.14, s * 0.15, s * 0.36, s * 0.15); g.fillStyle = '#00ff88'; g.font = `700 ${Math.round(s * 0.25)}px ${DISP}`; g.textAlign = 'center'; g.fillText('N', 0, 0); break;
  }
  g.restore();
}
function gameDrugs(ctx) {
  const { scope, body } = ctx;
  const wrap = ctx.el('div', 'g-center');
  const cv = ctx.el('canvas', '', wrap); cv.width = 520; cv.height = 300; cv.style.cssText = 'width:min(520px,92vw);height:auto;background:#0b0305;border:1px solid rgba(255,0,51,.3)';
  const info = ctx.el('div', 'g-panel', wrap);
  const nav = ctx.el('div', 'row center', wrap);
  const bP = ctx.el('button', 'btn', nav, '◀'); const bN = ctx.el('button', 'btn', nav, '▶'); const bGo = ctx.el('button', 'btn btn-primary', nav, 'ГОТОВ');
  const g = cv.getContext('2d');
  let i = 0, t = 0, left = 45, phase = 'learn';
  ctx.hint('← → — ЛИСТАТЬ ГОЛОГРАММЫ · «ГОТОВ» ИЛИ ВРЕМЯ ВЫШЛО — ВОПРОСЫ · ОТВЕТ: ТАП ИЛИ 1–4');
  const show = () => { const d = DRUGS[i]; info.innerHTML = `<p class="g-h">ГОЛОГРАММА ${i + 1}/${DRUGS.length}</p><div class="g-big" style="font-size:clamp(1.4rem,5vw,2.2rem)">${esc(d.n)}</div><p class="g-text" style="margin:.4rem 0 0">${esc(d.look)} · <b>${esc(d.route)}</b><br>${esc(d.note)}</p>`; A.sfx.beep(900 + i * 60, 0.05, 0.03); };
  show();
  scope.on(bP, 'click', () => { i = (i + DRUGS.length - 1) % DRUGS.length; show(); });
  scope.on(bN, 'click', () => { i = (i + 1) % DRUGS.length; show(); });
  return new Promise(resolve => {
    scope.on(bGo, 'click', () => quiz());
    scope.on(document, 'keydown', e => { if (phase !== 'learn') return; if (e.key === 'ArrowLeft') { i = (i + DRUGS.length - 1) % DRUGS.length; show(); } if (e.key === 'ArrowRight') { i = (i + 1) % DRUGS.length; show(); } });
    scope.loop(dt => {
      if (phase !== 'learn') return false;
      t += dt; left -= dt;
      ctx.stat(`ЗАПОМИНАЙ · ${Math.max(0, Math.ceil(left))} С`);
      g.fillStyle = '#0b0305'; g.fillRect(0, 0, 520, 300);
      g.strokeStyle = 'rgba(255,40,70,.25)'; for (let y = 0; y < 300; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(520, y); g.stroke(); }
      Art.profile(g, 110, 20, 270, { body: 'rgba(255,40,70,.18)', eyes: null });
      g.save(); g.globalAlpha = 0.8 + 0.2 * Math.sin(t * 7); drawDrug(g, DRUGS[i], 340, 150, 180); g.restore();
      Art.glowDot(g, 340, 150, 160, 'rgba(255,0,51,.35)');
      if (left <= 0) quiz();
    });
    async function quiz() {
      if (phase !== 'learn') return;
      phase = 'quiz'; wrap.innerHTML = '';
      const Q = shuffle([
        ['Красный эпипен с жёлтой этикеткой, стим-пак на 5–10 минут.', 'Гиперзин'],
        ['Матово-синий ингалятор с зелёной «N».', 'Ноктюрин'],
        ['Белый порошок под язык, действует через 15 секунд.', 'Эфедрин'],
        ['Два глотка в сутки. Больше — зависимость до конца жизни.', 'Аранепс'],
        ['Одна ампула в бедро. Две — сердце встанет через семь минут.', 'Дизоксиэфедрин'],
        ['Отключает сознание. Через 40 минут без реанимации — смерть.', 'Импедризин'],
        ['За хранение — трибунал и пуля в затылок без регенерации.', 'Фентанил'],
        ['Что колоть, чтобы добежать до эвакуатора, когда силы на нуле?', 'Гиперзин'],
      ]);
      let right = 0;
      const box = ctx.el('div', 'g-center');
      for (let k = 0; k < Q.length; k++) {
        const [q, a] = Q[k];
        ctx.stat(`ВОПРОС ${k + 1}/8 · ВЕРНО ${right}`);
        const opts = shuffle([a, ...shuffle(DRUGS.map(d => d.n).filter(n => n !== a)).slice(0, 3)]);
        box.innerHTML = `<p class="g-sub">ЛЕКТОР: БЕЗ ГОЛОГРАММ</p><p class="g-text" style="max-width:640px">${esc(q)}</p>`;
        const cards = ctx.el('div', 'g-cards', box);
        const pickO = await new Promise(res => {
          const bs = opts.map((o, j) => { const b = ctx.el('button', 'g-card', cards, `<b>${j + 1} · ${esc(o)}</b>`); b.addEventListener('click', () => res(j)); return b; });
          bs[0].focus({ preventScroll: true });
          const kh = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 4) { document.removeEventListener('keydown', kh); res(n - 1); } };
          document.addEventListener('keydown', kh); scope.own(() => document.removeEventListener('keydown', kh));
        });
        const bs = $$('.g-card', cards); bs.forEach(b => { b.disabled = true; });
        const ok = opts[pickO] === a; bs[opts.indexOf(a)].classList.add('right');
        if (ok) { right++; A.sfx.chime(700, 0.04); } else { bs[pickO].classList.add('wrong'); A.sfx.buzz(); }
        await scope.wait(ok ? 800 : 1500);
      }
      box.innerHTML = '';
      const okAll = right >= 6;
      await ctx.line(okAll ? 'К-14 запомнил каждый цвет эпипена. Каждый запрет.' : 'Цвета смешались. В штреке это — смерть.', { pos: 'mid', cls: okAll ? '' : 'red', ms: 2600 });
      resolve({ ok: okAll ? 'ok' : 'fail', detail: `ВЕРНО ${right}/8` });
    }
  });
}
