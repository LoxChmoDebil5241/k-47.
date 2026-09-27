/* ==========================================================================
   Глава 14 · «Контракт» — ПОДПИСАТЬ
   Кабинет директора. Ройзман спрашивает, уверен ли он. Ответы — потом
   подпись на мокром от пота стекле планшета: рука дрожит, счёт «раз, два,
   три» (удержание) успокаивает её. Можно и отказаться.
   ========================================================================== */
defineFrag(13, {
  id: 'contract', name: 'Подпись',
  text: '— Ты уверен, что хочешь это подписать? — спросил он тихо. — Контракт — это не шутка. Он изменит твою жизнь. Навсегда. — Вечно? — переспросил он. — Я не хочу вечно. Я хочу, чтобы это кончилось.',
  how: 'Ответь доктору. Потом проведи подпись по бледной линии на планшете — от начала до конца, не отрывая пальца. Рука дрожит; удерживай «СЧИТАТЬ» (или пробел), чтобы унять дрожь, но счёт не длится вечно. Можно отказаться.',
  keys: 'ОТВЕТЫ — КНОПКИ / 1–3 · ПОДПИСЬ — ВЕДИ ПАЛЬЦЕМ / МЫШЬЮ · СЧИТАТЬ — ДЕРЖАТЬ ПРОБЕЛ / КНОПКУ',
  note: 'Он спросил дважды, уверен ли я. Я сказал «да». Я хотел, чтобы всё кончилось, а мне пообещали вечность. Потом я закрыл глаза и начал считать.',
  noteDist: 'В этой записи я не подписал. Встал и вышел. Архив говорит, что подпись на стекле была — влажная, моя.',
  mem: '«ТЫ УВЕРЕН?»', start: gameContract,
});

function gameContract(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  let phase = 'talk', t = 0, over = false, count = 0, calm = 1, counting = false, tries = 0;
  let drawing = false, progress = 0, off = 0;
  const pts = [];
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 60, vol: 0 }));
  hum.vol(0.02, 1);
  // путь подписи (в долях планшета)
  const GUIDE = []; for (let i = 0; i <= 80; i++) { const u = i / 80; GUIDE.push([0.12 + u * 0.76, 0.55 + Math.sin(u * 9) * 0.12 * (1 - u * 0.4) + Math.sin(u * 23) * 0.04]); }
  const pad = () => { const w = Math.min(C.W * 0.7, 520), h = w * 0.42; return { x: (C.W - w) / 2, y: C.H * 0.52 - h / 2, w, h }; };

  return new Promise(resolve => {
    async function talk() {
      await ctx.line('Кабинет директора. Запах дешёвого табака. Кто-то из штаба.', { pos: 'top', ms: 2600 });
      ctx.say('— Ты уверен, что хочешь это подписать?', { pos: 'top', cls: 'ice' });
      const a1 = await ctx.choose(['«Да».', '«У меня нет другого выхода».', 'Промолчать']);
      ctx.unsay('top'); await scope.wait(300);
      await ctx.line(a1 === 2 ? '— Молчание — тоже ответ. Я приму его за согласие.' : '— Контракт — это не шутка. Он изменит твою жизнь. Навсегда.', { pos: 'top', cls: 'ice', ms: 2800 });
      ctx.say('— Ты будешь жить вечно.', { pos: 'top', cls: 'ice' });
      const a2 = await ctx.choose(['«Вечно? Я не хочу вечно».', '«Хорошо».']);
      ctx.unsay('top'); await scope.wait(300);
      if (a2 === 0) await ctx.line('— Я хочу, чтобы это кончилось.', { pos: 'top', ms: 2400 });
      await ctx.line('Ройзман улыбнулся. Что-то холодное, деловое.', { pos: 'top', ms: 2400 });
      toSign();
    }
    let refuseBtn = null, holdB = null;
    function toSign() {
      phase = 'sign';
      ctx.hint('ВЕДИ ПО БЛЕДНОЙ ЛИНИИ, НЕ ОТРЫВАЯ ПАЛЬЦА · СЧИТАТЬ — УНЯТЬ ДРОЖЬ');
      const box = ctx.el('div', 'ctl');
      holdB = mgHold(ctx, 'СЧИТАТЬ: РАЗ, ДВА, ТРИ…', { key: 'Space', parent: box });
      holdB.onDown = () => { counting = true; };
      holdB.onUp = () => { counting = false; };
      refuseBtn = ctx.el('button', 'btn big-btn', box, 'ОТКАЗАТЬСЯ');
      scope.on(refuseBtn, 'click', refuse);
      ctx.say('Стилус. Стекло влажное от чужих пальцев.', { pos: 'top' });
      scope.timeout(() => ctx.unsay('top'), 2400);
    }
    const toPad = e => { const r = C.cv.getBoundingClientRect(), p = pad(); return [(e.clientX - r.left - p.x) / p.w, (e.clientY - r.top - p.y) / p.h]; };
    scope.on(C.cv, 'pointerdown', e => {
      if (phase !== 'sign' || over) return;
      const [u, v] = toPad(e);
      if (u < -0.05 || u > 1.05 || v < -0.1 || v > 1.1) return;
      if (Math.hypot(u - GUIDE[0][0], v - GUIDE[0][1]) > 0.12) { ctx.say('Начни с начала линии.', { pos: 'mid', cls: 'amb' }); scope.timeout(() => ctx.unsay('mid'), 1000); return; }
      drawing = true; pts.length = 0; progress = 0; off = 0;
      try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ }
    });
    scope.on(C.cv, 'pointermove', e => {
      if (!drawing) return;
      const [u0, v0] = toPad(e);
      const tr = shake(), u = u0 + tr[0], v = v0 + tr[1];
      pts.push([u, v]);
      let best = 1e9, bi = 0;
      for (let i = 0; i < GUIDE.length; i++) { const d = Math.hypot(GUIDE[i][0] - u, GUIDE[i][1] - v); if (d < best) { best = d; bi = i; } }
      if (best > 0.07) off += 1; else progress = Math.max(progress, bi / (GUIDE.length - 1));
      if (Math.random() < 0.3) A.sfx.type(0.015);
      if (off > 28) blot();
      else if (progress > 0.97) signed();
    });
    const up = () => { if (!drawing) return; drawing = false; if (progress < 0.97 && !over) blot('Стилус соскользнул.'); };
    scope.on(C.cv, 'pointerup', up); scope.on(C.cv, 'pointercancel', up);
    function shake() { const k = (counting && calm > 0 ? 0.004 : 0.022) * (1 + tries * 0.3); return [Math.sin(t * 17) * k + (Math.random() - 0.5) * k, Math.cos(t * 13) * k + (Math.random() - 0.5) * k]; }
    function blot(msg = 'Клякса.') {
      if (over || phase !== 'sign') return;
      drawing = false; tries++; A.sfx.buzz(); FX.shake('sm');
      ctx.say(`${msg} Подпись не принята · ${tries}/3`, { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1300);
      if (tries >= 3) { over = true; (async () => { await ctx.line('— Ладно. Приходи, когда рука перестанет дрожать.', { pos: 'top', cls: 'ice', ms: 2800 }); resolve({ ok: 'fail', detail: 'ПОДПИСЬ НЕ ПРИНЯТА' }); })(); }
    }
    async function signed() {
      if (over) return; over = true; drawing = false; phase = 'done';
      A.sfx.stamp(); A.sfx.chime(440, 0.05);
      await ctx.line('Подпись легла на стекло. Влажная. Его.', { pos: 'top', ms: 2400 });
      await ctx.line('Он закрыл глаза и начал считать. Один, два, три…', { pos: 'top', ms: 2800 });
      resolve({ ok: 'ok', detail: `ПОПЫТКА ${tries + 1}` });
    }
    async function refuse() {
      if (over) return; over = true; phase = 'done';
      A.sfx.glitch();
      await ctx.line('Он положил стилус. Встал.', { pos: 'top', ms: 2000 });
      ctx.say('НЕЙРОСЛЕПОК: РАСХОЖДЕНИЕ С ЗАПИСЬЮ', { pos: 'mid', cls: 'big red' });
      await scope.wait(2400);
      resolve({ ok: 'dist', detail: 'КОНТРАКТ НЕ ПОДПИСАН' });
    }
    talk();

    scope.loop(dt => {
      t += dt;
      if (phase === 'sign' && !over) {
        if (counting) { calm = Math.max(0, calm - dt / 3.2); count += dt; } else calm = Math.min(1, calm + dt / 4);
        if (holdB) holdB.el.textContent = counting && calm > 0 ? ['РАЗ…', 'ДВА…', 'ТРИ…', 'ЧЕТЫРЕ…'][Math.floor(count * 1.2) % 4] : calm <= 0.05 ? 'СЧЁТ СБИЛСЯ' : 'СЧИТАТЬ: РАЗ, ДВА, ТРИ…';
        ctx.stat(`ПОДПИСЬ ${Math.round(progress * 100)}% · ПОПЫТКА ${tries + 1}/3`);
      }
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a1614'); bg.addColorStop(1, '#0c0a09');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      // кабинет: книжные шкафы, лампа, двое напротив
      g.fillStyle = '#211b17'; g.fillRect(W * 0.03, H * 0.1, W * 0.18, H * 0.55); g.fillRect(W * 0.79, H * 0.06, W * 0.18, H * 0.6);
      const R = mulberry(14); for (let i = 0; i < 26; i++) { g.fillStyle = ['#3a3f47', '#4a3b30', '#2f3436', '#51402e'][i % 4]; const sh = i < 13; g.fillRect((sh ? W * 0.04 : W * 0.8) + (i % 13) * W * 0.012, H * (0.15 + (i % 3) * 0.16), W * 0.01, H * 0.12 * (0.7 + R() * 0.3)); }
      const lg = g.createRadialGradient(W / 2, 0, 10, W / 2, 0, H); lg.addColorStop(0, 'rgba(238,243,246,.2)'); lg.addColorStop(1, 'rgba(238,243,246,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
      Art.human(g, W * 0.36, H * 0.52, H * 0.42, 'man', { color: '#111214' });
      g.strokeStyle = 'rgba(200,215,225,.55)'; g.lineWidth = 2; g.strokeRect(W * 0.36 - 11, H * 0.52 - H * 0.42 * 0.93 - 3, 9, 6); g.strokeRect(W * 0.36 + 2, H * 0.52 - H * 0.42 * 0.93 - 3, 9, 6);
      Art.human(g, W * 0.64, H * 0.55, H * 0.46, 'fat', { color: '#0d0e10' });
      // стол и планшет
      g.fillStyle = '#6d7479'; g.beginPath(); g.moveTo(W * 0.06, H * 0.62); g.lineTo(W * 0.94, H * 0.62); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
      if (phase !== 'talk') {
        const p = pad();
        g.fillStyle = '#0e1418'; Art.rr(g, p.x - 12, p.y - 12, p.w + 24, p.h + 24, 10); g.fill();
        g.fillStyle = '#c9d6e0'; g.fillRect(p.x, p.y, p.w, p.h);
        g.fillStyle = 'rgba(29,40,80,.55)'; g.font = `${Math.max(9, p.w * 0.022)}px ${MONO}`; g.textAlign = 'left';
        ['ТРУДОВОЙ ДОГОВОР · VITEZSTVI', 'Актив подлежит восстановлению…', 'Отказ регламентом не предусмотрен.'].forEach((s, i) => g.fillText(s, p.x + p.w * 0.04, p.y + p.h * (0.12 + i * 0.1)));
        // бледная линия подписи
        g.strokeStyle = 'rgba(29,40,80,.2)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); GUIDE.forEach(([u, v], i) => { const x = p.x + u * p.w, y = p.y + v * p.h; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
        g.fillStyle = 'rgba(29,40,80,.5)'; g.beginPath(); g.arc(p.x + GUIDE[0][0] * p.w, p.y + GUIDE[0][1] * p.h, 6, 0, Math.PI * 2); g.fill();
        // подпись игрока
        g.strokeStyle = '#1c3c66'; g.lineWidth = 2.4; g.beginPath(); pts.forEach(([u, v], i) => { const x = p.x + u * p.w, y = p.y + v * p.h; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
        // пальцы на стекле — влажные следы
        g.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(p.x + p.w * (0.2 + i * 0.12), p.y + p.h * 0.85, 8, 11, 0.3, 0, Math.PI * 2); g.fill(); }
        // индикатор спокойствия
        g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(p.x, p.y + p.h + 22, p.w, 4);
        g.fillStyle = counting && calm > 0 ? '#88ddff' : '#4a5a66'; g.fillRect(p.x, p.y + p.h + 22, p.w * calm, 4);
      }
      Art.vignette(g, W, H, 0.7);
      Art.grain(g, W, H, 0.05);
    }
  });
}
