/* ==========================================================================
   НОВЫЕ ФРАГМЕНТЫ · часть 1
   Ол-12-П · Вторжение (посадка) · Агония · Свет · Берлога · Метина · Щит · За что?
   ========================================================================== */

/** кэшированный фон под текущий размер холста */
function cachedBg(C, paint) {
  let c = null, w = 0, h = 0;
  return () => {
    if (!c || w !== C.W || h !== C.H) { w = C.W; h = C.H; c = offCanvas(w * C.dpr, h * C.dpr); const g = c.getContext('2d'); g.scale(C.dpr, C.dpr); paint(g, w, h); }
    return c;
  };
}
/** зажатые клавиши */
function keyState(scope) {
  const k = {};
  scope.on(document, 'keydown', e => { k[e.code] = true; });
  scope.on(document, 'keyup', e => { k[e.code] = false; });
  scope.on(window, 'blur', () => { for (const x in k) k[x] = false; });
  return k;
}
/** ряд больших кнопок внизу */
function ctlRow(ctx, labels, cls = 'btn big-btn') {
  const row = ctx.el('div', 'ctl');
  return labels.map(l => { const b = ctx.el('button', cls, row, l); return b; });
}
function meterEl(ctx, label, cls = '', pos = { left: '14px', top: '14px' }) {
  const m = ctx.el('div', `meter ${cls}`, ctx.body, `${label}<div class="mb"><i></i></div>`);
  Object.assign(m.style, pos);
  const fill = $('i', m);
  return { el: m, set(v) { fill.style.width = `${clamp(v, 0, 1) * 100}%`; }, label(t) { m.firstChild.textContent = t; } };
}

// ============================================================ 2 · ВТОРЖЕНИЕ
/** сначала посадка в бурю, затем рация (готовый фрагмент) */
async function gameRadio(ctx) {
  const r = await landingPhase(ctx);
  if (r) return r;
  ctx.body.innerHTML = ''; ctx.stat(''); ctx.hint('');
  return gameRadioJam(ctx);
}
function landingPhase(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const [bL, bR] = ctlRow(ctx, ['◀ КРЕН ВЛЕВО', 'КРЕН ВПРАВО ▶']);
  const wind = A.loopNoise({ type: 'bandpass', freq: 500, q: 0.6, vol: 0 });
  const engine = A.loopOsc({ type: 'sawtooth', freq: 55, vol: 0, lp: 300 });
  wind.vol(0.12, 1); engine.vol(0.04, 1);
  let x = 0, vx = 0, alt = 3200, hull = 100, windF = 0, windT = 0, gustT = 1.5, t = 0, over = false, alarmT = 0, thrust = 0, ptr = null;
  const DUR = 24;
  const flakes = Array.from({ length: 180 }, () => ({ x: Math.random(), y: Math.random(), s: rand(0.5, 2.2), v: rand(0.6, 1.4) }));
  ctx.hint('← → / A D ИЛИ ЗАЖМИ КНОПКИ · ДЕРЖИ ЧЕЛНОК В КОРИДОРЕ · ПОРЫВЫ СНОСЯТ');
  ctx.say('Маркус: — Три минуты до касания. Всем приготовиться к аварийной посадке.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3600);
  let hold = { L: false, R: false };
  [[bL, 'L'], [bR, 'R']].forEach(([b, s]) => { scope.on(b, 'pointerdown', e => { e.preventDefault(); hold[s] = true; }); ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => scope.on(b, ev, () => { hold[s] = false; })); });
  scope.on(C.cv, 'pointerdown', e => { ptr = e.clientX; try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ } });
  scope.on(C.cv, 'pointermove', e => { if (ptr !== null) { thrust = clamp((e.clientX - ptr) / 60, -1, 1); } });
  scope.on(C.cv, 'pointerup', () => { ptr = null; thrust = 0; });
  return new Promise(resolve => {
    const end = async ok => {
      over = true; wind.vol(0, 0.3); engine.vol(0, 0.3);
      scope.timeout(() => { wind.stop(); engine.stop(); }, 600);
      $$('.ctl', body).forEach(e => e.remove());
      if (ok) {
        A.sfx.thud(0.8); FX.shake('lg');
        await ctx.line('Касание. Лёд под лыжами трещит.', { pos: 'mid', ms: 2200 });
        await ctx.line('— Подаём сигнал SOS. Они любезно откроют нам ворота.', { pos: 'mid', cls: 'red', ms: 3000 });
        resolve(null);
      } else {
        A.sfx.shot(0.9); A.sfx.crack(); FX.hit('#ff4400', true); FX.addBlood(2);
        await ctx.line('Челнок врезался в лёд. Буря заглушила даже это.', { pos: 'mid', cls: 'red', ms: 2800 });
        resolve({ ok: 'fail', detail: `КОРПУС 0% · ВЫСОТА ${Math.round(alt)} М` });
      }
    };
    scope.loop(dt => {
      if (over) return false;
      t += dt;
      gustT -= dt;
      if (gustT <= 0) {
        gustT = rand(1.2, 2.6); windT = rand(-1, 1) * (1.2 + t / DUR * 1.1);
        if (Math.abs(windT) > 1.4) { ctx.say(windT < 0 ? 'Челнок резко накренился на левый борт.' : 'Порыв бьёт в правый борт.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1300); A.sfx.creak(0.3, windT < 0 ? -0.6 : 0.6); FX.shake('sm'); }
      }
      windF += (windT - windF) * Math.min(1, dt * 1.4);
      let u = thrust;
      if (K.ArrowLeft || K.KeyA || hold.L) u = -1;
      if (K.ArrowRight || K.KeyD || hold.R) u = 1;
      vx += (u * 2.6 + windF) * dt; vx *= Math.pow(0.35, dt);
      x = clamp(x + vx * dt * 0.55, -1.6, 1.6);
      alt = Math.max(0, 3200 * (1 - t / DUR));
      const half = lerp(0.62, 0.24, t / DUR);
      if (Math.abs(x) > half) { hull -= 20 * dt * (1 + Math.abs(x) - half); alarmT -= dt; if (alarmT <= 0) { alarmT = 0.5; A.sfx.beep(740, 0.12, 0.06); } }
      wind.vol(0.08 + Math.abs(windF) * 0.08); wind.freq(400 + Math.abs(windF) * 500); engine.freq(55 + Math.abs(u) * 20);
      ctx.stat(`ВЫСОТА ${Math.round(alt)} М · КОРПУС ${Math.max(0, Math.round(hull))}% · ВЕТЕР ${windF > 0 ? '→' : '←'} ${Math.abs(windF * 10).toFixed(0)}`);
      if (hull <= 0) { end(false); return false; }
      if (alt <= 0) { end(true); return false; }
      draw(half);
    });
    function draw(half) {
      const { g, W, H } = C;
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#02040a'); sky.addColorStop(0.6, '#0b1622'); sky.addColorStop(1, '#1a2632');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      const hz = H * 0.46, cx = W / 2 - x * W * 0.22, k = t / DUR;
      // ледяная равнина
      const gg = g.createLinearGradient(0, hz, 0, H); gg.addColorStop(0, '#3a4a58'); gg.addColorStop(1, '#8fb0c4');
      g.fillStyle = gg; g.globalAlpha = 0.35 + k * 0.4; g.fillRect(0, hz, W, H - hz); g.globalAlpha = 1;
      // коридор глиссады
      const padW = W * (0.05 + k * 0.5);
      g.strokeStyle = 'rgba(136,221,255,.55)'; g.lineWidth = 2;
      [-1, 1].forEach(s => { g.beginPath(); g.moveTo(cx + s * padW * 0.3, hz); g.lineTo(W / 2 + s * half * W * 0.5, H); g.stroke(); });
      for (let i = 0; i < 6; i++) { const yy = hz + (H - hz) * Math.pow(((i / 6) + t * 0.6) % 1, 2); g.fillStyle = `rgba(255,0,51,${0.5 + 0.5 * Math.sin(t * 8 + i)})`; g.fillRect(cx - padW * 0.3 - 3 + (yy - hz) * -0.1, yy, 6, 3); g.fillRect(cx + padW * 0.3 - 3 + (yy - hz) * 0.1, yy, 6, 3); }
      Art.glowDot(g, cx, hz + 4, 60 + k * 120, 'rgba(255,0,51,.5)', 0.7 + 0.3 * Math.sin(t * 6));
      // снег по ветру
      g.strokeStyle = 'rgba(210,230,245,.55)';
      flakes.forEach(f => { f.y += f.v * 0.9 * (1 / 60) * 1.5; f.x += (windF * 0.25 - vx * 0.1) * (1 / 60); if (f.y > 1) { f.y = 0; f.x = Math.random(); } if (f.x < 0) f.x += 1; if (f.x > 1) f.x -= 1; g.lineWidth = f.s; g.beginPath(); g.moveTo(f.x * W, f.y * H); g.lineTo(f.x * W - windF * 12, f.y * H - 10 * f.v); g.stroke(); });
      // кабина: рамы и приборы
      g.fillStyle = '#050607'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.14, 0); g.lineTo(W * 0.22, H * 0.78); g.lineTo(0, H); g.fill();
      g.beginPath(); g.moveTo(W, 0); g.lineTo(W * 0.86, 0); g.lineTo(W * 0.78, H * 0.78); g.lineTo(W, H); g.fill();
      g.fillRect(0, H * 0.78, W, H * 0.22);
      g.fillStyle = 'rgba(255,0,51,.8)'; g.font = `12px ${MONO}`; g.textAlign = 'left';
      g.fillText(`АЛТ ${Math.round(alt)}`, W * 0.25, H * 0.84); g.fillText(`КОРПУС ${Math.max(0, Math.round(hull))}%`, W * 0.25, H * 0.88);
      g.textAlign = 'right'; g.fillText('НЕВИДИМЫЙ · SOS ГОТОВ', W * 0.75, H * 0.84); g.textAlign = 'left';
      // перекрестие курса
      const off = Math.abs(x) > half;
      drawReticle(g, W / 2 + x * W * 0.18, H * 0.58, off ? 'rgba(255,40,60,1)' : 'rgba(136,221,255,.95)', 22);
      g.strokeStyle = 'rgba(136,221,255,.35)'; g.strokeRect(W / 2 - half * W * 0.18, H * 0.58 - 30, half * W * 0.36, 60);
      if (off) { g.fillStyle = `rgba(160,0,20,${0.15 + 0.1 * Math.sin(t * 20)})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.7);
    }
  });
}

// ============================================================ 1 · ОЛ-12-П
function gameStrata(ctx) {
  const { scope, body } = ctx;
  const LAYERS = [
    ['АТМОСФЕРА', 'Водород 72%, гелий 25%, этилен. Плотность 0,75 кг/м³. Крик в скафандре слышишь только ты.', '#1d2850'],
    ['МОНОЛИТНАЯ КОРКА', 'Верхние 30–40 км. Хрупкая, в термических трещинах до километра глубиной.', '#8fb0c4'],
    ['ПЛАСТИЧНЫЙ ЛЁД', 'Под давлением сотен атмосфер лёд течёт, как очень вязкий мёд.', '#5d7a8f'],
    ['ПОДЛЁДНЫЕ ОКЕАНЫ', 'Граница лёд–камень, около −30 °C. Карстовые полости размером с моря. Вода с аммиаком.', '#1a3a4a'],
    ['СКАЛЬНОЕ ОСНОВАНИЕ', '191–210 км. Базальт: иридий, осмий, висмут, теллур, редкие земли.', '#4a3a36'],
    ['АКТИВНОЕ ЯДРО', 'Греет границу снизу. Ради того, что над ним, готовы на любое преступление.', '#8a0a18'],
  ];
  const wrap = ctx.el('div', 'g-center');
  wrap.style.flexDirection = 'row'; wrap.style.flexWrap = 'wrap'; wrap.style.alignItems = 'stretch';
  const left = ctx.el('div', '', wrap); left.style.cssText = 'flex:1 1 280px;max-width:420px;display:flex;flex-direction:column;gap:6px';
  const right = ctx.el('div', 'g-cards', wrap); right.style.cssText = 'flex:1 1 280px;max-width:420px;grid-template-columns:1fr;align-content:center';
  ctx.el('p', 'g-sub', left, 'РАЗРЕЗ ЛЕДЯНОЙ КОРЫ · ОТ ПОВЕРХНОСТИ К ЯДРУ');
  const slots = LAYERS.map((_, k) => { const b = ctx.el('button', 'g-card ice', left, `<small>ГЛУБИНА ${k + 1}</small><b>—</b>`); b.style.minHeight = '52px'; b.dataset.k = k; return b; });
  const order = shuffle(LAYERS.map((_, k) => k));
  const cards = order.map(k => { const b = ctx.el('button', 'g-card', right, `<b>${LAYERS[k][0]}</b><small>${LAYERS[k][1]}</small>`); b.dataset.k = k; return b; });
  let sel = null, placed = 0, errors = 0;
  ctx.hint('ТАП ПО КАРТОЧКЕ СПРАВА → ТАП ПО ГЛУБИНЕ СЛЕВА · 3 ОШИБКИ — ПРОВАЛ');
  const upd = () => ctx.stat(`СЛОЁВ ${placed}/6 · ОШИБОК ${errors}/3`);
  upd();
  cards[0].focus({ preventScroll: true });
  return new Promise(resolve => {
    cards.forEach(b => scope.on(b, 'click', () => { if (b.disabled) return; cards.forEach(c => c.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.k; A.sfx.key(); const next = slots.find(s => !s.disabled); if (next) next.focus({ preventScroll: true }); }));
    slots.forEach(s => scope.on(s, 'click', async () => {
      if (sel === null || s.disabled) return;
      const k = +s.dataset.k;
      if (k === sel) {
        s.disabled = true; s.classList.add('right'); s.innerHTML = `<small>ГЛУБИНА ${k + 1}</small><b>${LAYERS[k][0]}</b>`;
        s.style.background = `linear-gradient(90deg, ${LAYERS[k][2]}, rgba(0,0,0,.6))`;
        const c = cards.find(c => +c.dataset.k === sel); c.disabled = true; c.style.opacity = '.25'; c.classList.remove('sel');
        sel = null; placed++; A.sfx.chime(500 + placed * 60, 0.05); upd();
        const nc = cards.find(c => !c.disabled); if (nc) nc.focus({ preventScroll: true });
        if (placed === 6) { await scope.wait(700); wrap.remove(); resolve(await truce()); }
      } else {
        errors++; s.classList.add('wrong'); A.sfx.buzz(); FX.shake('sm'); upd();
        scope.timeout(() => s.classList.remove('wrong'), 500);
        if (errors >= 3) { ctx.say('Сводка рассыпалась окончательно.', { pos: 'mid', cls: 'red' }); await scope.wait(1800); resolve({ ok: 'fail', detail: `СЛОЁВ ${placed}/6` }); }
      }
    }));
  });
  // ---------- перемирие: делим добычу ----------
  function truce() {
    const C = ctx.canvas();
    const K = keyState(scope);
    const DUR = 26;
    let s = 0.5, dA = 0.5, dB = 0.5, tA = 0, tB = 0, t = 0, nextShift = 1.5, over = false, drag = false;
    ctx.hint('ТЯНИ ПО ЭКРАНУ ИЛИ ← → · ЗОНА КАЖДОЙ СТОРОНЫ ОТМЕЧЕНА · НАПРЯЖЕНИЕ 100% — ПОДРЫВ ШАХТ');
    ctx.say('Vitezstvi работает на обе стороны. Раздели добычу.', { pos: 'top' });
    scope.timeout(() => ctx.unsay('top'), 3000);
    const hum = scope.own(A.loopOsc({ type: 'sawtooth', freq: 42, vol: 0, lp: 200 }));
    hum.vol(0.04, 1);
    const setS = cx => { s = clamp((cx - C.W * 0.1) / (C.W * 0.8), 0, 1); };
    scope.on(C.cv, 'pointerdown', e => { drag = true; const r = C.cv.getBoundingClientRect(); setS(e.clientX - r.left); try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ } });
    scope.on(C.cv, 'pointermove', e => { if (!drag) return; const r = C.cv.getBoundingClientRect(); setS(e.clientX - r.left); });
    scope.on(C.cv, 'pointerup', () => { drag = false; });
    const bg = cachedBg(C, (g, W, H) => {
      g.fillStyle = '#05080c'; g.fillRect(0, 0, W, H);
      const gr = g.createRadialGradient(W / 2, H * 1.6, H * 0.3, W / 2, H * 1.6, H * 1.3); gr.addColorStop(0, '#8fb0c4'); gr.addColorStop(0.8, '#1a3a4a'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      Art.grain(g, 0, 0, W, H, 0.15);
    });
    return new Promise(resolve => {
      scope.loop(dt => {
        if (over) return false;
        t += dt;
        if (K.ArrowLeft || K.KeyA) s = clamp(s - dt * 0.6, 0, 1);
        if (K.ArrowRight || K.KeyD) s = clamp(s + dt * 0.6, 0, 1);
        nextShift -= dt;
        if (nextShift <= 0) { nextShift = rand(1.6, 3.2); const greed = rand(0.02, 0.1 + t / DUR * 0.08); dA = clamp(rand(0.25, 0.75), 0.2, 0.8); dB = clamp(1 - dA + greed, 0.2, 0.8); A.sfx.beep(420, 0.08, 0.04); }
        const needA = dA - 0.06, needB = dB - 0.06;
        tA = clamp(tA + (s < needA ? (needA - s) * 1.6 : -0.22) * dt * 1.6, 0, 1);
        tB = clamp(tB + ((1 - s) < needB ? (needB - (1 - s)) * 1.6 : -0.22) * dt * 1.6, 0, 1);
        ctx.stat(`ОПЗ ${Math.round(tA * 100)}% · СНК ${Math.round(tB * 100)}% · ${Math.max(0, Math.ceil(DUR - t))} С`);
        if (tA >= 1 || tB >= 1) {
          over = true; A.sfx.shot(0.8); A.sfx.thud(0.8); FX.hit('#ff6600', true);
          ctx.say(`${tA >= 1 ? 'ОПЗ' : 'СНК'}: подрыв вентиляционных шахт противника.`, { pos: 'mid', cls: 'red' });
          scope.timeout(() => resolve({ ok: 'fail', detail: 'ПЕРЕМИРИЕ СОРВАНО' }), 2400);
          return false;
        }
        if (t >= DUR) {
          over = true; A.sfx.chime(700, 0.06);
          ctx.say('Перемирие держится на угрозе взаимного уничтожения. Пока держится.', { pos: 'mid' });
          scope.timeout(() => resolve({ ok: 'ok', detail: `РАЗРЕЗ ${6}/6 · ПЕРЕМИРИЕ ${DUR} С` }), 2800);
          return false;
        }
        const { g, W, H } = C;
        g.drawImage(bg(), 0, 0, W, H);
        const y0 = H * 0.3, xA = W * 0.18, xB = W * 0.82, xm = W / 2;
        // базы и потоки
        [[xA, '#4aa8d8', 'ОПЗ · NANOTRASEN', s, tA], [xB, '#ff1a3c', 'СНК · ГОРНОПРОМЫСЕЛ', 1 - s, tB]].forEach(([x, col, name, share, ten]) => {
          g.strokeStyle = col; g.globalAlpha = 0.25 + share * 0.75; g.lineWidth = 2 + share * 22;
          g.beginPath(); g.moveTo(xm, H * 0.62); g.quadraticCurveTo((xm + x) / 2, H * 0.45, x, y0 + 30); g.stroke(); g.globalAlpha = 1;
          g.fillStyle = '#0c0f14'; g.fillRect(x - 36, y0 - 20, 72, 50); g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(x - 36, y0 - 20, 72, 50);
          g.fillStyle = col; g.font = `10px ${MONO}`; g.textAlign = 'center'; g.fillText(name, x, y0 - 28);
          g.fillStyle = `rgba(255,${Math.round(200 - ten * 200)},${Math.round(80 - ten * 80)},1)`; g.fillRect(x - 32, y0 + 22, 64 * ten, 5);
          if (ten > 0.6) Art.glowDot(g, x, y0, 60, 'rgba(255,60,0,.6)', ten * (0.6 + 0.4 * Math.sin(t * 12)));
        });
        g.fillStyle = '#1a1518'; g.fillRect(xm - 30, H * 0.6, 60, 40); g.strokeStyle = '#ffb347'; g.strokeRect(xm - 30, H * 0.6, 60, 40);
        g.fillStyle = '#ffb347'; g.fillText('VITEZSTVI', xm, H * 0.6 + 58);
        // шкала распределения и зоны требований
        const tx = W * 0.1, tw = W * 0.8, ty = H * 0.85;
        g.fillStyle = 'rgba(74,168,216,.25)'; g.fillRect(tx + tw * (dA - 0.06), ty - 10, tw * (1 - (dA - 0.06)), 4);
        g.fillStyle = 'rgba(255,26,60,.25)'; g.fillRect(tx, ty + 6, tw * (1 - (dB - 0.06)), 4);
        g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + tw, ty); g.stroke();
        g.fillStyle = '#efe6cf'; g.beginPath(); g.arc(tx + tw * s, ty, 10, 0, Math.PI * 2); g.fill();
        g.font = `11px ${MONO}`; g.fillStyle = '#4aa8d8'; g.textAlign = 'left'; g.fillText(`ОПЗ ${Math.round(s * 100)}%`, tx, ty + 28);
        g.fillStyle = '#ff1a3c'; g.textAlign = 'right'; g.fillText(`СНК ${Math.round((1 - s) * 100)}%`, tx + tw, ty + 28); g.textAlign = 'left';
      });
    });
  }
}

// ============================================================ 3 · АГОНИЯ
function gameAgony(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const blood = meterEl(ctx, 'КРОВЬ');
  const row = ctx.el('div', 'ctl');
  const bL = ctx.el('button', 'btn big-btn', row, '◀ ЛОКОТЬ');
  const bP = ctx.el('button', 'btn btn-primary big-btn', row, 'ЗАЖАТЬ РАНУ');
  const bR = ctx.el('button', 'btn big-btn', row, 'ЛОКОТЬ ▶');
  const STEPS = 28;
  let life = 1, prog = 0, last = '', pressing = false, t = 0, over = false, beatT = 0, trail = [];
  const ripples = Array.from({ length: 3 }, (_, k) => ({ x: 0.3 + k * 0.25, w: rand(0.06, 0.1), v: rand(0.025, 0.05) * (k % 2 ? -1 : 1) }));
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 48, vol: 0 })); hum.vol(0.04, 1);
  ctx.hint('ЗАЖМИ РАНУ, КОГДА ТЕМНЕЕТ · ПОЛЗИ ЛОКТЯМИ ПО ОЧЕРЕДИ · ЧЁРНАЯ РЯБЬ ЖЖЁТ');
  ctx.say('Красный свет аварийной лампы. Кровь между пальцев.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2800);
  const hp = ctx.hold(bP, () => { pressing = true; A.noise({ type: 'lowpass', freq: 400, dur: 0.3, vol: 0.06 }); }, () => { pressing = false; });
  void hp;
  const bg = cachedBg(C, (g, W, H) => {
    g.drawImage(Art.concrete(Math.round(W), Math.round(H), { base: '#1a1012', tint: 'rgba(120,0,20,.25)', seed: 3, cracks: 3 }), 0, 0, W, H);
    Art.grate(g, 0, H * 0.55, W, H * 0.45, 24, 'rgba(80,60,64,.3)');
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, W, H * 0.55);
  });
  return new Promise(resolve => {
    function step(side) {
      if (over) return;
      if (pressing) { ctx.say('Рука на ране. Нечем ползти.', { pos: 'mid' }); scope.timeout(() => ctx.unsay('mid'), 900); return; }
      const px = 0.08 + prog * 0.78;
      const hot = ripples.find(r => Math.abs(r.x - px) < r.w);
      if (hot) { life -= 0.05; A.sfx.hiss(0.3, 0.08); FX.flash('#000000', 300, 0.5); ctx.say('Чёрная рябь течёт по металлу — жжёт.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 900); return; }
      if (side === last) { life -= 0.025; A.sfx.thud(0.2); return; }
      last = side; prog = Math.min(1, prog + 1 / STEPS);
      A.noise({ type: 'lowpass', freq: 600, dur: 0.2, vol: 0.06, pan: side === 'L' ? -0.3 : 0.3 });
      trail.push(prog);
      if (prog >= 1) atConsole();
    }
    async function atConsole() {
      over = true; row.innerHTML = '';
      await ctx.line('Рука с пистолетом поднялась сама собой. В спину Маркусу.', { pos: 'top', ms: 3000 });
      await ctx.line('«Ликвидация вышедшего из-под контроля актива…»', { pos: 'top', cls: 'red', ms: 2600 });
      const b = ctx.el('button', 'btn btn-primary big-btn pulse', ctx.el('div', 'ctl'), 'АВАРИЙНЫЕ ЩИТЫ');
      b.focus({ preventScroll: true });
      let done = false;
      const fire = async () => {
        if (done) return; done = true; b.remove();
        A.sfx.hiss(1.4, 0.2); A.sfx.thud(1); A.sfx.crack(); FX.hit('#88ddff', true);
        await ctx.line('Шипение уходящей атмосферы. Иней бежит по стенам. Щиты захлопнулись.', { pos: 'mid', cls: 'ice', ms: 3400 });
        resolve({ ok: 'ok', detail: `КРОВЬ ${Math.round(life * 100)}%` });
      };
      scope.on(b, 'click', fire);
      scope.on(document, 'keydown', e => { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); fire(); } });
      scope.timeout(async () => { if (done) return; done = true; b.remove(); await ctx.line('Пальцы не дотянулись до кнопки.', { pos: 'mid', cls: 'red' }); resolve({ ok: 'fail', detail: 'НЕ УСПЕЛ' }); }, 4000);
    }
    async function die() {
      over = true; row.innerHTML = '';
      A.sfx.heartbeat(0.3); FX.flash('#000', 1400, 1);
      await ctx.line('Тьма. Последнее — леденящая слабость.', { pos: 'mid', cls: 'red', ms: 2600 });
      resolve({ ok: 'fail', detail: `ДОПОЛЗ ${Math.round(prog * 100)}%` });
    }
    scope.on(bL, 'pointerdown', e => { e.preventDefault(); step('L'); });
    scope.on(bR, 'pointerdown', e => { e.preventDefault(); step('R'); });
    scope.on(document, 'keydown', e => { if (e.repeat) return; if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); step('L'); } else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); step('R'); } });
    scope.loop(dt => {
      t += dt;
      if (!over) {
        life -= (pressing ? 0.004 : 0.055) * dt * (1 + prog * 0.4);
        if (life <= 0) { life = 0; die(); }
        ripples.forEach(r => { r.x += r.v * dt; if (r.x < 0.15 || r.x > 0.85) r.v *= -1; });
        beatT -= dt; if (beatT <= 0) { beatT = 0.45 + life * 0.5; A.sfx.heartbeat(0.25 + (1 - life) * 0.5); }
        ctx.stat(`ДО КОНСОЛИ ${Math.round((1 - prog) * 100)}% · КРОВЬ ${Math.round(life * 100)}%`);
      }
      blood.set(life); blood.label(pressing ? 'КРОВЬ · РАНА ЗАЖАТА' : 'КРОВЬ');
      const { g, W, H } = C;
      g.drawImage(bg(), 0, 0, W, H);
      const pulse = 0.5 + 0.5 * Math.sin(t * (2 + (1 - life) * 3));
      g.fillStyle = `rgba(180,0,20,${0.12 + pulse * 0.18})`; g.fillRect(0, 0, W, H);
      const fy = H * 0.7, x0 = W * 0.08, x1 = W * 0.86;
      // рябь нанотрубок
      ripples.forEach(r => { const x = x0 + (r.x - 0.08) / 0.78 * (x1 - x0); const gr = g.createRadialGradient(x, fy, 0, x, fy, r.w * W); gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, fy, r.w * W, 18, 0, 0, Math.PI * 2); g.fill(); for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(30,30,40,.8)'; g.beginPath(); g.moveTo(x - r.w * W + k * 12, fy - 8 + Math.sin(t * 5 + k) * 4); g.lineTo(x - r.w * W + k * 12 + 30, fy + 6); g.stroke(); } });
      // консоль
      g.fillStyle = '#16161a'; g.fillRect(x1 + 10, fy - H * 0.3, W * 0.1, H * 0.3);
      g.fillStyle = over ? '#ff0033' : '#6a0010'; g.fillRect(x1 + 20, fy - H * 0.22, W * 0.05, H * 0.05);
      Art.glowDot(g, x1 + 20 + W * 0.025, fy - H * 0.195, 50, 'rgba(255,0,40,.6)', 0.6 + pulse * 0.4);
      // кровавый след и он сам
      trail.forEach((p, k) => Art.bloodSplat(g, x0 + p * (x1 - x0) - 20, fy + 14, 10, k + 1, 0.45));
      Art.lying(g, x0 + prog * (x1 - x0), fy, Math.min(W, H) * 0.18, { dir: 1, body: '#050304' });
      // темнеет в глазах
      Art.vignette(g, W, H, 0.5 + (1 - life) * 0.5, '0,0,0', 0.1 + life * 0.3);
      if (life < 0.3) { g.fillStyle = `rgba(0,0,0,${(0.3 - life) * 2})`; g.fillRect(0, 0, W, H); }
    });
  });
}

// ============================================================ 4 · СВЕТ
function gameLight(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const [bL, bS, bR] = ctlRow(ctx, ['◀', 'ШАГ', '▶']);
  bS.classList.add('btn-primary');
  const STEPS = 10;
  let th = 0, w = 0, steps = 0, falls = 0, t = 0, over = false, fallen = 0, hold = { L: false, R: false }, blood = [], haze = 1;
  const hum = scope.own(A.loopNoise({ type: 'highpass', freq: 3000, q: 0.5, vol: 0 })); hum.vol(0.03, 1);
  ctx.hint('← → / A D ИЛИ ЗАЖМИ ◀ ▶ — ДЕРЖАТЬ РАВНОВЕСИЕ · ШАГ — ПРОБЕЛ / КНОПКА, КОГДА ТЕЛО РОВНО');
  ctx.say('Яркая, безжалостная вспышка. Запах озона. Ноги чужие.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3000);
  [[bL, 'L'], [bR, 'R']].forEach(([b, s]) => { scope.on(b, 'pointerdown', e => { e.preventDefault(); hold[s] = true; }); ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => scope.on(b, ev, () => { hold[s] = false; })); });
  return new Promise(resolve => {
    function fall() {
      falls++; fallen = 1.6; th = 0; w = 0;
      A.sfx.thud(0.7); FX.flash('#ffffff', 500, 0.7); FX.shake('lg');
      blood.push({ x: steps / STEPS, seed: falls });
      ctx.say(falls < 3 ? 'Лоб о керамо-стальную плитку. Кровь заливает молочные глаза.' : 'Ноги больше не держат.', { pos: 'mid', cls: 'red' });
      scope.timeout(() => ctx.unsay('mid'), 1500);
      if (falls >= 3) { over = true; scope.timeout(() => resolve({ ok: 'fail', detail: `ШАГОВ ${steps}/${STEPS}` }), 2200); }
    }
    function step() {
      if (over || fallen > 0) return;
      if (Math.abs(th) > 0.22) { fall(); return; }
      steps++; A.sfx.step(0.3, 0, 0); w += rand(-1, 1) * (0.9 + steps * 0.08); haze = Math.max(0.15, 1 - steps / STEPS);
      if (steps >= STEPS) win();
    }
    async function win() {
      over = true; $$('.ctl', ctx.body).forEach(e => e.remove());
      await ctx.line('Он приник к ближайшему иллюминатору.', { pos: 'top', ms: 2400 });
      A.sfx.scare();
      showClones = true;
      await ctx.line('В каждой капсуле был он.', { pos: 'mid', cls: 'big red', ms: 3000 });
      resolve({ ok: 'ok', detail: `ПАДЕНИЙ ${falls}/3` });
    }
    let showClones = false;
    scope.on(bS, 'click', step);
    scope.on(document, 'keydown', e => { if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); step(); } });
    const cloneImg = offCanvas(220, 300); Art.clone(cloneImg.getContext('2d'), 220, 300, { t: 1, seed: 4 });
    scope.loop(dt => {
      t += dt;
      if (fallen > 0) fallen -= dt;
      else if (!over) {
        let u = 0;
        if (K.ArrowLeft || K.KeyA || hold.L) u = -1;
        if (K.ArrowRight || K.KeyD || hold.R) u = 1;
        w += (th * (2.2 + steps * 0.12) + Math.sin(t * 1.7) * 0.25 + rand(-0.3, 0.3) - u * 2.4) * dt;
        w *= Math.pow(0.6, dt);
        th += w * dt;
        if (Math.abs(th) > 0.9) fall();
      }
      ctx.stat(`ШАГОВ ${steps}/${STEPS} · ПАДЕНИЙ ${falls}/3 · КРЕН ${Math.round(th * 100)}`);
      const { g, W, H } = C;
      // слишком белая операционная
      g.fillStyle = '#e9eef0'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(160,170,178,.4)'; g.lineWidth = 1;
      const fy = H * 0.72;
      for (let x = -((steps * 30) % 60); x < W; x += 60) { g.beginPath(); g.moveTo(x, fy); g.lineTo(x - (x - W / 2) * 0.6, H); g.stroke(); }
      for (let k = 0; k < 6; k++) { const y = fy + (H - fy) * Math.pow(k / 6, 1.5); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.fillStyle = '#c9d2d8'; g.fillRect(W * 0.04 - steps * 10, fy - H * 0.5, W * 0.12, H * 0.5);
      g.fillStyle = 'rgba(111,182,230,.35)'; g.fillRect(W * 0.05 - steps * 10, fy - H * 0.46, W * 0.1, H * 0.4);
      // окно с капсулами вдали — растёт
      const ww = W * (0.12 + steps / STEPS * 0.35), wx = W * 0.82 - ww / 2 - steps * 4, wy = fy - H * 0.42;
      g.fillStyle = '#18222a'; g.fillRect(wx, wy, ww, H * 0.3);
      for (let k = 0; k < 4; k++) { const cx = wx + ww * (0.15 + k * 0.23); g.fillStyle = 'rgba(111,182,230,.3)'; g.fillRect(cx - ww * 0.07, wy + H * 0.04, ww * 0.14, H * 0.22); if (showClones || steps > STEPS * 0.7) g.drawImage(cloneImg, cx - ww * 0.07, wy + H * 0.05, ww * 0.14, H * 0.19); }
      blood.forEach(b => Art.bloodSplat(g, W * 0.3 + (b.x - steps / STEPS) * W * 0.8, fy + 20, 30, b.seed, 0.8));
      // он: бледное голое тело, качается
      g.save(); g.translate(W * 0.36, fy); g.rotate(fallen > 0 ? 1.4 : th);
      const hh = Math.min(H * 0.55, W * 0.6);
      g.fillStyle = '#b8b2b4'; g.strokeStyle = '#7a7478'; g.lineWidth = hh * 0.05; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-hh * 0.05, 0); g.lineTo(-hh * 0.03, -hh * 0.45); g.moveTo(hh * 0.05, 0); g.lineTo(hh * 0.03, -hh * 0.45); g.stroke();
      g.beginPath(); g.ellipse(0, -hh * 0.62, hh * 0.1, hh * 0.2, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(-hh * 0.09, -hh * 0.75); g.lineTo(-hh * 0.18 - th * 20, -hh * 0.45); g.moveTo(hh * 0.09, -hh * 0.75); g.lineTo(hh * 0.18 - th * 20, -hh * 0.45); g.stroke();
      g.beginPath(); g.arc(0, -hh * 0.9, hh * 0.075, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(hh * 0.03, -hh * 0.905, hh * 0.012, 0, Math.PI * 2); g.fill();
      if (falls) { g.fillStyle = '#8a0010'; g.fillRect(hh * 0.01, -hh * 0.95, hh * 0.015, hh * 0.1); }
      g.restore();
      // молочная пелена — редеет с каждым шагом
      g.fillStyle = `rgba(255,255,255,${0.25 + haze * 0.45 + (fallen > 0 ? 0.2 : 0)})`; g.fillRect(0, 0, W, H);
      const off = Math.abs(th) > 0.22;
      g.fillStyle = off ? 'rgba(200,0,30,.8)' : 'rgba(40,120,90,.8)'; g.fillRect(W / 2 - 60, H * 0.08, 120, 6);
      g.fillStyle = '#111'; g.fillRect(W / 2 - 60 + 60 + clamp(th, -1, 1) * 60 - 3, H * 0.08 - 4, 6, 14);
      g.strokeStyle = 'rgba(0,0,0,.4)'; g.strokeRect(W / 2 - 60 * 0.22, H * 0.08 - 2, 120 * 0.22, 10);
    });
  });
}

// ============================================================ 5 · БЕРЛОГА
function gameLair(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const air = meterEl(ctx, 'ВОЗДУХ', 'ice');
  const sus = meterEl(ctx, 'ОН СЛЫШИТ', '', { right: '14px', top: '14px' });
  const K = keyState(scope);
  const row = ctx.el('div', 'ctl');
  const bL = ctx.el('button', 'btn big-btn', row, '◀');
  const bH = ctx.el('button', 'btn btn-primary big-btn', row, 'НЕ ДЫШАТЬ');
  const bR = ctx.el('button', 'btn big-btn', row, '▶');
  const SPOTS = [{ x: 0.12, name: 'у батареи' }, { x: 0.42, name: 'за ведром' }, { x: 0.7, name: 'под столом' }];
  const DUR = 36;
  let spot = 0, breath = 1, holding = false, suspicion = 0, t = 0, over = false, fx = 0.9, ftx = 0.9, beam = -1, beamT = 3, gasp = 0, stepT = 1, spark = 0;
  const wind = scope.own(A.loopNoise({ type: 'lowpass', freq: 300, q: 0.6, vol: 0 })); wind.vol(0.03, 1);
  const breathN = scope.own(A.loopNoise({ type: 'bandpass', freq: 900, q: 1.4, vol: 0 }));
  ctx.hint('ЗАЖМИ «НЕ ДЫШАТЬ» / ПРОБЕЛ, КОГДА ЛУЧ ИЛИ ОН РЯДОМ · ← → — ПЕРЕБЕЖАТЬ (СКРИП) · ПРОДЕРЖИСЬ');
  ctx.say('С пронзительным скрежетом шлюз отъехал наполовину.', { pos: 'top', cls: 'red' });
  scope.timeout(() => ctx.unsay('top'), 3000);
  ctx.hold(bH, () => { holding = true; }, () => { holding = false; if (breath < 0.25) { gasp = 1; A.sfx.whisper(0.6, 0.16); } });
  return new Promise(resolve => {
    function move(d) {
      if (over) return;
      const n = clamp(spot + d, 0, 2); if (n === spot) return;
      spot = n; suspicion += 0.18; A.sfx.creak(0.35, (SPOTS[spot].x - 0.5) * 1.5);
      ctx.say(`Он перебрался ${SPOTS[spot].name}. Половица скрипнула.`, { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1200);
    }
    scope.on(bL, 'pointerdown', e => { e.preventDefault(); move(-1); });
    scope.on(bR, 'pointerdown', e => { e.preventDefault(); move(1); });
    scope.on(document, 'keydown', e => { if (e.repeat) return; if (e.code === 'ArrowLeft' || e.code === 'KeyA') move(-1); if (e.code === 'ArrowRight' || e.code === 'KeyD') move(1); });
    const bg = cachedBg(C, (g, W, H) => {
      g.drawImage(Art.concrete(Math.round(W), Math.round(H), { base: '#17120f', tint: 'rgba(40,20,10,.35)', seed: 12, cracks: 12 }), 0, 0, W, H);
      const fy = H * 0.74;
      g.fillStyle = '#120c09'; g.fillRect(0, fy, W, H - fy);
      g.strokeStyle = 'rgba(60,40,30,.5)'; for (let x = 0; x < W; x += 34) { g.beginPath(); g.moveTo(x, fy); g.lineTo(x - (x - W / 2) * 0.3, H); g.stroke(); }
      g.fillStyle = 'rgba(220,210,190,.35)'; g.font = `italic 16px ${SERIF}`; g.fillText('2 9 9 1 … 0 4', W * 0.3, H * 0.3);
      g.fillStyle = '#2a1c16'; g.fillRect(W * 0.06, fy - H * 0.16, W * 0.1, H * 0.16);
      for (let k = 0; k < 6; k++) { g.fillStyle = '#3a2418'; g.fillRect(W * 0.065 + k * W * 0.015, fy - H * 0.15, W * 0.008, H * 0.14); }
      g.fillStyle = '#1e1a18'; g.fillRect(W * 0.38, fy - H * 0.1, W * 0.08, H * 0.1);
      g.fillStyle = '#231a14'; g.fillRect(W * 0.62, fy - H * 0.14, W * 0.18, H * 0.02); g.fillRect(W * 0.63, fy - H * 0.12, W * 0.01, H * 0.12); g.fillRect(W * 0.78, fy - H * 0.12, W * 0.01, H * 0.12);
      g.fillStyle = '#0f0b09'; g.fillRect(W * 0.86, fy - H * 0.5, W * 0.12, H * 0.5);
      g.fillStyle = '#0a0d12'; g.fillRect(W * 0.52, H * 0.12, W * 0.16, H * 0.22);
    });
    scope.loop(dt => {
      t += dt;
      if (!over) {
        if (holding) breath = Math.max(0, breath - dt / 6.5); else breath = Math.min(1, breath + dt / 2.6);
        if (holding && breath <= 0) { holding = false; gasp = 1; A.sfx.whisper(0.8, 0.2); }
        gasp = Math.max(0, gasp - dt * 1.2);
        const loud = !holding ? (0.25 + (1 - breath) * 0.6 + gasp) : 0;
        breathN.vol(loud * 0.08); breathN.freq(700 + loud * 600);
        // отец бродит, останавливается, ищет
        if (Math.abs(fx - ftx) < 0.01 || Math.random() < dt * 0.15) ftx = clamp(rand(0.1, 0.9), 0.08, 0.92);
        fx += Math.sign(ftx - fx) * Math.min(Math.abs(ftx - fx), dt * 0.12);
        stepT -= dt; if (stepT <= 0) { stepT = rand(0.7, 1.1); A.sfx.step(0.22, (fx - 0.5) * 1.6); }
        // фары: луч-сканер через комнату
        beamT -= dt;
        if (beamT <= 0 && beam < 0) { beam = 0; A.noise({ type: 'lowpass', freq: 300, f2: 900, dur: 1.2, vol: 0.05 }); }
        if (beam >= 0) { beam += dt / 2.2; if (beam > 1) { beam = -1; beamT = rand(3, 5.5); } }
        const sx = SPOTS[spot].x, dist = Math.abs(fx - sx);
        const lit = beam >= 0 && Math.abs(beam - sx) < 0.08;
        if (lit && !holding) suspicion += dt * 1.6;
        if (dist < 0.18 && !holding) suspicion += dt * loud * 1.3;
        if (gasp > 0.5 && dist < 0.4) suspicion += dt * 1.2;
        suspicion = Math.max(0, suspicion - dt * 0.12);
        spark -= dt; if (spark <= 0 && Math.random() < 0.02) { spark = 0.15; A.sfx.beep(2400, 0.03, 0.03); }
        ctx.stat(`${SPOTS[spot].name.toUpperCase()} · ${Math.max(0, Math.ceil(DUR - t))} С`);
        if (suspicion >= 1) {
          over = true; A.sfx.scare(); FX.hit('#ff0033', true);
          ctx.say('Он повернул голову. Тень закрыла весь свет.', { pos: 'mid', cls: 'red' });
          scope.timeout(() => resolve({ ok: 'fail', detail: `ПРОДЕРЖАЛСЯ ${Math.round(t)} С` }), 2600);
        } else if (t >= DUR) {
          over = true; breathN.vol(0);
          A.sfx.thud(0.6);
          ctx.say('Он рухнул на просевший диван. Тишина. — Мама…', { pos: 'mid' });
          scope.timeout(() => resolve({ ok: 'ok', detail: `ОН СЛЫШАЛ ${Math.round(suspicion * 100)}%` }), 3200);
        }
      }
      air.set(breath); sus.set(suspicion);
      const { g, W, H } = C;
      g.drawImage(bg(), 0, 0, W, H);
      const fy = H * 0.74;
      if (beam >= 0) {
        const bx = beam * W;
        g.save(); g.globalCompositeOperation = 'lighter';
        const gr = g.createLinearGradient(W * 0.6, H * 0.23, bx, fy); gr.addColorStop(0, 'rgba(255,230,190,.35)'); gr.addColorStop(1, 'rgba(255,230,190,.08)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(W * 0.56, H * 0.16); g.lineTo(W * 0.64, H * 0.3); g.lineTo(bx + W * 0.08, H); g.lineTo(bx - W * 0.08, H); g.closePath(); g.fill();
        g.restore();
      }
      // электроплитка — тусклый красный глаз
      Art.glowDot(g, W * 0.3, fy - 6, 40, 'rgba(255,40,20,.5)', 0.6 + 0.2 * Math.sin(t * 2));
      // Фигура: худая, кривая
      g.save(); g.translate(fx * W, fy); g.rotate(Math.sin(t * 1.3) * 0.06);
      Art.figure(g, 0, 0, H * 0.62, { body: '#050304', wide: 0.8, eyes: t % 3 < 0.2 ? '#ffffff' : null });
      g.restore();
      // мальчик
      const kx = SPOTS[spot].x * W;
      g.fillStyle = '#020101'; g.beginPath(); g.ellipse(kx, fy - H * 0.05, H * 0.05, H * 0.06, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(kx + H * 0.02, fy - H * 0.12, H * 0.028, 0, Math.PI * 2); g.fill();
      if (!holding) { g.fillStyle = `rgba(220,230,240,${0.1 + (1 - breath) * 0.2})`; g.beginPath(); g.ellipse(kx + H * 0.06, fy - H * 0.12 + Math.sin(t * 3) * 3, 10, 6, 0, 0, Math.PI * 2); g.fill(); }
      Art.vignette(g, W, H, 0.85, '0,0,0', 0.2);
      if (suspicion > 0.6) { g.fillStyle = `rgba(120,0,16,${(suspicion - 0.6) * 0.5})`; g.fillRect(0, 0, W, H); }
    });
  });
}

// ============================================================ 6 · МЕТИНА
function gameScar(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  let phase = 'drops', hx = 0.5, caught = 0, missed = 0, spawned = 0, drops = [], t = 0, spawnT = 0.6, over = false, stains = [];
  const TOTAL = 18, MAXMISS = 6;
  ctx.hint('ВОДИ ЛАДОНЬЮ (МЫШЬ / ПАЛЕЦ / ← →) — ЛОВИ КАПЛИ, ПОКА ОНИ НЕ УПАЛИ НА РУБАШКУ');
  ctx.say('— Будешь знать, как не отвечать. Голос спокойный, будничный.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3000);
  scope.on(C.cv, 'pointermove', e => { const r = C.cv.getBoundingClientRect(); if (phase === 'drops') hx = clamp((e.clientX - r.left) / r.width, 0.05, 0.95); });
  scope.on(C.cv, 'pointerdown', e => { const r = C.cv.getBoundingClientRect(); if (phase === 'drops') hx = clamp((e.clientX - r.left) / r.width, 0.05, 0.95); });
  // шрам: путь в нормированных координатах лица
  const PATH = Array.from({ length: 30 }, (_, k) => { const u = k / 29; return [0.38 + u * 0.14, 0.52 + Math.sin(u * 3.1) * 0.025 - u * 0.03]; });
  let tr = 0, off = 0, offV = 0, inside = 0, total = 0, tracing = false, ptrOff = null;
  return new Promise(resolve => {
    async function toMirror() {
      phase = 'mirror';
      ctx.say('Он смотрел на себя в зеркало долго. Запоминая каждую морщинку.', { pos: 'top' });
      scope.timeout(() => ctx.unsay('top'), 3200);
      ctx.hint('ВЕДИ ПО ШРАМУ: ЗАЖМИ И ДЕРЖИ ПАЛЕЦ / КУРСОР НА ЛИНИИ · ИЛИ ↑ ↓ — ДЕРЖАТЬ ПЕРО НА ШРАМЕ');
      tracing = true;
    }
    async function choose() {
      phase = 'choice'; tracing = false;
      const acc = total ? inside / total : 0;
      if (acc < 0.62) { await ctx.line('Отражение расплылось. Он не смог запомнить.', { pos: 'mid', cls: 'red', ms: 2400 }); resolve({ ok: 'fail', detail: `ТОЧНОСТЬ ${Math.round(acc * 100)}%` }); return; }
      ctx.say('Отметина, которая не сотрётся. Что с ней сделать?', { pos: 'top' });
      const row = ctx.el('div', 'ctl');
      const b1 = ctx.el('button', 'btn btn-primary big-btn', row, '1 · «МОЁ» — ОСТАВИТЬ');
      const b2 = ctx.el('button', 'btn big-btn', row, '2 · СТЕРЕТЬ КРОВЬ, ЗАБЫТЬ');
      b1.focus({ preventScroll: true });
      const pickC = async k => {
        row.remove(); ctx.unsay('top');
        if (k === 1) { A.sfx.chime(440, 0.06); await ctx.line('Первая метина, которую он себе присвоил. — Моё.', { pos: 'mid', ms: 2800 }); resolve({ ok: 'ok', detail: `ТОЧНОСТЬ ${Math.round(acc * 100)}% · «МОЁ»` }); }
        else { A.sfx.glitch(0.8); FX.chroma(400); await ctx.line('Он стёр кровь подолом. Шрам будто исчез. Архив помнит иначе.', { pos: 'mid', cls: 'amb', ms: 3000 }); resolve({ ok: 'dist', detail: 'СТЁР' }); }
      };
      scope.on(b1, 'click', () => pickC(1)); scope.on(b2, 'click', () => pickC(2));
      scope.on(document, 'keydown', e => { if (e.key === '1') pickC(1); if (e.key === '2') pickC(2); });
    }
    scope.on(C.cv, 'pointerdown', e => { if (phase === 'mirror') { ptrOff = e; } });
    scope.on(C.cv, 'pointermove', e => { if (phase === 'mirror' && ptrOff) ptrOff = e; });
    scope.on(C.cv, 'pointerup', () => { ptrOff = null; });
    const face = cachedBg(C, (g, W, H) => {
      g.fillStyle = '#0b0807'; g.fillRect(0, 0, W, H);
      const s = Math.min(W, H);
      g.fillStyle = '#2a1f18'; g.fillRect(W / 2 - s * 0.36, H / 2 - s * 0.46, s * 0.72, s * 0.92);
      g.fillStyle = '#8c8f92'; g.fillRect(W / 2 - s * 0.32, H / 2 - s * 0.42, s * 0.64, s * 0.84);
      const mg = g.createLinearGradient(0, 0, W, H); mg.addColorStop(0, 'rgba(255,255,255,.15)'); mg.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = mg; g.fillRect(W / 2 - s * 0.32, H / 2 - s * 0.42, s * 0.64, s * 0.84);
      // лицо ребёнка
      const cx = W / 2, cy = H / 2;
      g.fillStyle = '#3b2a1e'; g.beginPath(); g.ellipse(cx, cy - s * 0.12, s * 0.21, s * 0.22, 0, 0, Math.PI * 2); g.fill();
      const fg = g.createRadialGradient(cx - s * 0.05, cy - s * 0.02, s * 0.02, cx, cy, s * 0.24); fg.addColorStop(0, '#d8b49c'); fg.addColorStop(1, '#9c7862');
      g.fillStyle = fg; g.beginPath(); g.ellipse(cx, cy, s * 0.17, s * 0.22, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3b2a1e'; g.beginPath(); g.ellipse(cx, cy - s * 0.17, s * 0.18, s * 0.08, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#1c120c'; [-1, 1].forEach(d => { g.beginPath(); g.ellipse(cx + d * s * 0.065, cy - s * 0.02, s * 0.022, s * 0.012, 0, 0, Math.PI * 2); g.fill(); });
      g.strokeStyle = 'rgba(90,50,40,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - s * 0.04, cy + s * 0.12); g.lineTo(cx + s * 0.04, cy + s * 0.12); g.stroke();
      Art.grain(g, 0, 0, W, H, 0.2);
      g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; for (let k = 0; k < 20; k++) { const x = W / 2 + rand(-s * 0.3, s * 0.3), y = H / 2 + rand(-s * 0.4, s * 0.4); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-30, 30), y + rand(-10, 10)); g.stroke(); }
    });
    const P = (u, W, H) => { const s = Math.min(W, H), i = clamp(u * 29, 0, 29), a = Math.floor(i), b = Math.min(29, a + 1), f = i - a; const x = lerp(PATH[a][0], PATH[b][0], f), y = lerp(PATH[a][1], PATH[b][1], f); return [W / 2 + (x - 0.5) * s, H / 2 + (y - 0.5) * s]; };
    scope.loop(dt => {
      t += dt;
      const { g, W, H } = C;
      if (phase === 'drops') {
        if (K.ArrowLeft || K.KeyA) hx = clamp(hx - dt * 0.9, 0.05, 0.95);
        if (K.ArrowRight || K.KeyD) hx = clamp(hx + dt * 0.9, 0.05, 0.95);
        spawnT -= dt;
        if (spawnT <= 0 && spawned < TOTAL) { spawned++; spawnT = rand(0.5, 1.1) * (1 - spawned / TOTAL * 0.4); drops.push({ x: 0.42 + rand(-0.04, 0.04), y: 0.28, vx: rand(-0.14, 0.14), vy: 0 }); A.sfx.drip(); }
        drops.forEach(d => { d.vy += dt * 0.55; d.y += d.vy * dt; d.x += d.vx * dt; });
        for (let k = drops.length - 1; k >= 0; k--) {
          const d = drops[k];
          if (d.y > 0.8 && d.y < 0.86 && Math.abs(d.x - hx) < 0.07) { drops.splice(k, 1); caught++; A.tone({ f: 300, f2: 200, dur: 0.06, vol: 0.04 }); continue; }
          if (d.y > 0.95) { drops.splice(k, 1); missed++; stains.push([d.x, rand(0.9, 0.98)]); A.sfx.drip(0.4); if (missed >= MAXMISS) { phase = 'end'; ctx.say('Рубашка пропиталась. Новое пятно, новая метина.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `ПОЙМАНО ${caught}/${TOTAL}` }), 2400); } }
        }
        if (spawned >= TOTAL && !drops.length && phase === 'drops') toMirror();
        ctx.stat(`КАПЛИ ${caught}/${TOTAL} · МИМО ${missed}/${MAXMISS}`);
        g.fillStyle = '#0b0807'; g.fillRect(0, 0, W, H);
        const s = Math.min(W, H);
        Art.profile(g, W * 0.46, H * 0.02, s * 0.9, { body: '#110b0a', eyes: null, dir: -1 });
        Art.bloodSplat(g, W * 0.42, H * 0.27, s * 0.04, 2, 0.9);
        g.fillStyle = '#6d6a60'; g.fillRect(0, H * 0.88, W, H * 0.12);
        stains.forEach(([x, y], k) => Art.bloodSplat(g, x * W, y * H, 16, k + 7, 0.8));
        drops.forEach(d => { g.fillStyle = '#9a0014'; g.beginPath(); g.ellipse(d.x * W, d.y * H, 4, 6, 0, 0, Math.PI * 2); g.fill(); });
        g.fillStyle = '#c29a86'; g.beginPath(); g.ellipse(hx * W, H * 0.83, W * 0.06, H * 0.03, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#7a5a4a'; g.lineWidth = 2; g.stroke();
        Art.vignette(g, W, H, 0.8);
      } else {
        g.drawImage(face(), 0, 0, W, H);
        if (tracing) {
          tr = Math.min(1, tr + dt / 9);
          offV += rand(-1, 1) * dt * 0.9; offV *= Math.pow(0.4, dt); off += offV * dt;
          if (K.ArrowUp || K.KeyW) off -= dt * 0.12;
          if (K.ArrowDown || K.KeyS) off += dt * 0.12;
          const [px, py] = P(tr, W, H), s = Math.min(W, H);
          let penX = px, penY = py + off * s;
          if (ptrOff) { const r = C.cv.getBoundingClientRect(); penX = ptrOff.clientX - r.left; penY = ptrOff.clientY - r.top; off = (penY - py) / s; }
          const d = Math.hypot(penX - px, penY - py) / s;
          total += dt; if (d < 0.03) inside += dt;
          ctx.stat(`ШРАМ ${Math.round(tr * 100)}% · ТОЧНОСТЬ ${total ? Math.round(inside / total * 100) : 0}%`);
          g.strokeStyle = 'rgba(120,10,20,.9)'; g.lineWidth = 3; g.beginPath();
          for (let k = 0; k <= 40; k++) { const [x, y] = P(k / 40, W, H); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
          g.strokeStyle = d < 0.03 ? 'rgba(136,221,255,.9)' : 'rgba(255,60,80,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(penX, penY, 8, 0, Math.PI * 2); g.stroke();
          g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(px, py, 3, 0, Math.PI * 2); g.fill();
          if (tr >= 1) choose();
        }
      }
    });
  });
}

// ============================================================ 11 · ЩИТ
function gameShield(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const [b1, b2, b3] = ctlRow(ctx, ['◀ ЛЕВО', '▼ ЦЕНТР', 'ПРАВО ▶']);
  const armor = meterEl(ctx, 'БРОНЯ К-21');
  const NEED = 20;
  let face = 1, passed = 0, lost = 0, hp = 1, t = 0, over = false, nextShot = 2.2, warn = null, passT = 1.6, flash = 0, hits = [];
  const alarm = scope.own(A.loopOsc({ type: 'square', freq: 440, vol: 0, lp: 900 }));
  ctx.hint('← ↓ → / A S D ИЛИ КНОПКИ — ПОВЕРНУТЬСЯ К ВСПЫШКЕ ДО ОЧЕРЕДИ · ДЕРЖИ, ПОКА ПРОЙДУТ ДВАДЦАТЬ');
  ctx.say('Двадцать человек у гермоворот. К-21 был единственным, кто стоял между ними и смертью.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 3600);
  const turn = k => { if (over) return; face = k; A.noise({ type: 'lowpass', freq: 300, dur: 0.12, vol: 0.06 }); };
  [b1, b2, b3].forEach((b, k) => scope.on(b, 'pointerdown', e => { e.preventDefault(); turn(k); }));
  scope.on(document, 'keydown', e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') turn(0); if (e.code === 'ArrowDown' || e.code === 'KeyS') turn(1); if (e.code === 'ArrowRight' || e.code === 'KeyD') turn(2); });
  const bg = cachedBg(C, (g, W, H) => {
    g.drawImage(Art.concrete(Math.round(W), Math.round(H), { base: '#141216', seed: 8, cracks: 10, frost: 0.4 }), 0, 0, W, H);
    Art.lattice(g, 0, 0, W, H * 0.4, 44, 'rgba(160,160,170,.1)', 3);
    g.fillStyle = '#0b0a0c'; g.fillRect(W * 0.62, H * 0.08, W * 0.22, H * 0.5);
    g.fillStyle = 'rgba(136,221,255,.18)'; g.fillRect(W * 0.64, H * 0.1, W * 0.18, H * 0.46);
    Art.warnSign(g, W * 0.73, H * 0.05, 40);
  });
  return new Promise(resolve => {
    function end(ok) {
      over = true; alarm.vol(0);
      $$('.ctl', ctx.body).forEach(e => e.remove());
      if (ok) { ctx.say('Гермоворота закрылись. Сквозь стекло — «прости». Щит не чувствует боли.', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `СПАСЕНО ${passed}/${NEED} · ПОТЕРИ ${lost}` }), 3200); }
      else { A.sfx.scare(); FX.hit('#ff0033', true); ctx.say(hp <= 0 ? 'Щит лопнул. От К-21 остались клочья плоти.' : 'Слишком многие остались у ворот.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `СПАСЕНО ${passed}/${NEED} · ПОТЕРИ ${lost}` }), 2800); }
    }
    scope.loop(dt => {
      t += dt;
      if (!over) {
        nextShot -= dt;
        if (!warn && nextShot <= 0) { warn = { k: irand(0, 2), t: Math.max(0.45, 0.9 - passed * 0.02) }; A.sfx.beep(1600 + warn.k * 200, 0.05, 0.05); alarm.vol(0.02); }
        if (warn) {
          warn.t -= dt;
          if (warn.t <= 0) {
            A.sfx.gunfire(irand(4, 7), 0.3); flash = 0.25;
            if (face === warn.k) { hp -= 0.035; A.sfx.thud(0.4); hits.push([rand(-0.2, 0.2), rand(-0.1, 0.3)]); }
            else { hp -= 0.1; lost++; FX.hit('#ff0033'); A.sfx.shot(0.5); ctx.say(pick(['Разряд прошёл мимо щита.', 'Кто-то у ворот упал.', 'Крик за спиной.']), { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 900); }
            warn = null; nextShot = rand(0.6, 1.4) * (1 - passed / NEED * 0.3); alarm.vol(0);
          }
        }
        passT -= dt;
        if (passT <= 0 && !warn) { passT = rand(0.9, 1.4); passed++; A.sfx.step(0.1, 0.5); }
        ctx.stat(`ПРОШЛИ ${passed}/${NEED} · ПОТЕРИ ${lost}/5 · БРОНЯ ${Math.max(0, Math.round(hp * 100))}%`);
        if (hp <= 0 || lost >= 5) end(false); else if (passed >= NEED) end(true);
      }
      armor.set(hp);
      flash = Math.max(0, flash - dt);
      const { g, W, H } = C;
      g.drawImage(bg(), 0, 0, W, H);
      // люди уходят в шлюз
      for (let k = 0; k < Math.min(6, NEED - passed); k++) Art.figure(g, W * (0.2 + k * 0.07), H * 0.58, H * 0.22, { body: '#0a0a0c' });
      // К-21 в броне, поворачивается
      const ang = (face - 1) * 0.35;
      g.save(); g.translate(W / 2, H * 0.94); g.rotate(ang * 0.3); g.translate(-W / 2, -H * 0.94);
      Art.armor(g, W / 2, H * 0.3, H * 0.58, { t, glow: 0.8 + hp * 0.2, crack: hp < 0.5 ? 1 : 0, seed: 21 });
      hits.forEach(([dx, dy], k) => Art.bloodSplat(g, W / 2 + dx * H * 0.5, H * 0.62 + dy * H * 0.3, 12, k + 3, 0.7));
      g.restore();
      // точки огня — снизу, со стороны зрителя
      [0.15, 0.5, 0.85].forEach((x, k) => {
        const on = warn && warn.k === k;
        g.fillStyle = on ? '#ff1a3c' : 'rgba(255,40,60,.25)'; g.beginPath(); g.arc(x * W, H * 0.97, on ? 14 : 8, 0, Math.PI * 2); g.fill();
        if (on) Art.glowDot(g, x * W, H * 0.97, 90, 'rgba(255,0,40,.7)', 0.6 + 0.4 * Math.sin(t * 40));
        if (face === k) { g.strokeStyle = 'rgba(136,221,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(x * W, H * 0.97, 22, Math.PI, 0); g.stroke(); }
      });
      if (flash > 0) { g.fillStyle = `rgba(255,220,180,${flash})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.7);
    });
  });
}

// ============================================================ 12 · ЗА ЧТО?
function gameMorse(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const MORSE = { З: '−−··', А: '·−', Ч: '−−−·', Т: '−', О: '−−−' };
  const WORD = ['З', 'А', 'Ч', 'Т', 'О'];
  const wrap = ctx.el('div', 'g-center'); wrap.style.pointerEvents = 'none'; wrap.style.justifyContent = 'flex-start'; wrap.style.paddingTop = '4%';
  const lettersEl = ctx.el('div', 'g-dots', wrap); lettersEl.style.gap = '14px';
  const L = WORD.map((ch, k) => { const d = ctx.el('div', '', lettersEl, `<div class="g-big" style="font-size:clamp(1.6rem,6vw,2.6rem)">${ch}</div><div class="g-sub" style="letter-spacing:.3em">${MORSE[ch]}</div>`); d.style.textAlign = 'center'; if (k === 2) d.style.marginLeft = '18px'; return d; });
  const cur = ctx.el('p', 'g-morse', wrap);
  const key = ctx.el('button', 'g-key', ctx.el('div', 'ctl'), 'СТУЧАТЬ');
  key.style.width = key.style.height = 'min(150px, 36vw)';
  key.parentElement.style.bottom = '18px';
  let idx = 0, seq = '', downAt = 0, lastUp = 0, errors = 0, over = false, t = 0, marks = [], sensors = 0;
  ctx.hint('КОРОТКО — ТОЧКА · ДОЛЬШЕ 0,3 С — ТИРЕ · ПАУЗА 0,9 С — БУКВА ЗАКОНЧЕНА · ПРОБЕЛ ИЛИ КНОПКА · 5 ОШИБОК');
  const upd = () => { ctx.stat(`БУКВА ${Math.min(idx + 1, 5)}/5 · ОШИБОК ${errors}/5`); L.forEach((d, k) => { d.style.opacity = k < idx ? '1' : k === idx ? '1' : '.35'; d.firstChild.style.color = k < idx ? 'var(--ok)' : ''; }); cur.textContent = seq || ' '; };
  upd();
  ctx.say('Датчики моргают зелёным. За зеркальным стеклом, вероятно, делают пометки.', { pos: 'bot' });
  scope.timeout(() => ctx.unsay('bot'), 3400);
  return new Promise(resolve => {
    const down = () => { if (over || downAt) return; downAt = ctx.now(); A.sfx.morse(false); key.classList.add('on'); };
    const up = () => {
      if (!downAt) return;
      const d = ctx.now() - downAt; downAt = 0; key.classList.remove('on');
      seq += d > 300 ? '−' : '·'; lastUp = ctx.now();
      marks.push([rand(0.3, 0.7), rand(0.3, 0.6)]); if (marks.length > 30) marks.shift();
      A.sfx.thud(d > 300 ? 0.25 : 0.15); upd();
    };
    scope.on(key, 'pointerdown', e => { e.preventDefault(); down(); });
    scope.on(key, 'pointerup', up); scope.on(key, 'pointercancel', up); scope.on(key, 'pointerleave', up);
    scope.on(C.cv, 'pointerdown', e => { e.preventDefault(); down(); });
    scope.on(C.cv, 'pointerup', up);
    scope.on(document, 'keydown', e => { if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); down(); } });
    scope.on(document, 'keyup', e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); up(); } });
    async function commit() {
      const want = MORSE[WORD[idx]];
      if (seq === want) { idx++; sensors = 1; A.sfx.chime(500 + idx * 80, 0.05); seq = ''; upd(); if (idx >= WORD.length) win(); }
      else { errors++; sensors = -1; A.sfx.error(); FX.shake('sm'); ctx.say(`«${seq}» — не «${WORD[idx]}». Ещё раз.`, { pos: 'bot', cls: 'red' }); scope.timeout(() => ctx.unsay('bot'), 1400); seq = ''; upd(); if (errors >= 5) lose(); }
    }
    async function win() {
      over = true; key.parentElement.remove();
      await ctx.line('На пульте за стеклом на миг загорелось: «ДАННЫХ НЕДОСТАТОЧНО».', { pos: 'mid', cls: 'red', ms: 3200 });
      await ctx.line('«Когда вы решите, что данных достаточно?»', { pos: 'mid', ms: 2800 });
      resolve({ ok: 'ok', detail: `ОШИБОК ${errors}` });
    }
    async function lose() { over = true; key.parentElement.remove(); await ctx.line('Стук утонул в гуле вентиляции. Датчики зелёные. Никто не отвечает.', { pos: 'mid', cls: 'red', ms: 3000 }); resolve({ ok: 'fail', detail: `БУКВ ${idx}/5` }); }
    const bg = cachedBg(C, (g, W, H) => {
      g.fillStyle = '#07090b'; g.fillRect(0, 0, W, H);
      const gl = g.createLinearGradient(0, 0, W, H); gl.addColorStop(0, '#1a2228'); gl.addColorStop(0.5, '#0c1014'); gl.addColorStop(1, '#141a1f');
      g.fillStyle = gl; g.fillRect(W * 0.08, H * 0.2, W * 0.84, H * 0.62);
      g.strokeStyle = '#2a3036'; g.lineWidth = 8; g.strokeRect(W * 0.08, H * 0.2, W * 0.84, H * 0.62);
      g.globalAlpha = 0.18; Art.figure(g, W * 0.35, H * 0.82, H * 0.5, { body: '#000', glasses: true }); Art.figure(g, W * 0.62, H * 0.82, H * 0.48, { body: '#000' }); g.globalAlpha = 1;
      const sh = g.createLinearGradient(W * 0.1, 0, W * 0.5, H); sh.addColorStop(0, 'rgba(255,255,255,.08)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(W * 0.08, H * 0.2, W * 0.84, H * 0.62);
      Art.grain(g, 0, 0, W, H, 0.15);
    });
    scope.loop(dt => {
      t += dt;
      if (!over && seq && !downAt && ctx.now() - lastUp > 900) commit();
      sensors *= Math.pow(0.2, dt);
      const { g, W, H } = C;
      g.drawImage(bg(), 0, 0, W, H);
      marks.forEach(([x, y]) => { g.fillStyle = 'rgba(200,220,230,.08)'; g.beginPath(); g.ellipse(W * x, H * y, 14, 10, 0, 0, Math.PI * 2); g.fill(); });
      for (let k = 0; k < 8; k++) { const on = Math.sin(t * 3 + k * 1.7) > 0.3; const col = sensors < -0.1 ? 'rgba(255,0,51,1)' : on ? 'rgba(0,255,136,.9)' : 'rgba(0,120,70,.4)'; g.fillStyle = col; g.fillRect(W * (0.12 + k * 0.1), H * 0.86, 10, 4); }
      if (sensors > 0.1) { g.fillStyle = `rgba(0,255,136,${sensors * 0.15})`; g.fillRect(0, 0, W, H); }
    });
  });
}
