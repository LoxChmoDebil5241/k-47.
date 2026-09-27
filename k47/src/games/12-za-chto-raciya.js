/* ==========================================================================
   Глава 12 · перенесено из прототипа «Мини-игры» (механика сохранена)
   ========================================================================== */
defineFrag(11, {
  id: "radio", name: "Рация",
  text: "«За что?» — этот вопрос не был криком. Он был беззвучным выдохом, обращённым к стерильным стенам. Воспоминания накатывали обрывками, лишёнными хронологии. Холод, пробивающий скафандр. Вкус крови и озона на языке.",
  how: "Память о «Вторжении» приходит обрывками — как эфир сквозь глушилку «Невидимого». Найди станции на шкале — там, где шум гуще, — и удерживай частоту, пока запись не расшифруется. Сигнал плывёт. Нужно три канала из пяти, пока глушилка не накрыла всё.",
  keys: "ТЯНИ ШКАЛУ ИЛИ КОЛЕСО ТОНКОЙ НАСТРОЙКИ · ← → (SHIFT — БЫСТРЕЕ) · КНОПКИ ◀◀ ◀ ▶ ▶▶",
  note: "Они открыли ворота на сигнал бедствия. Я слышал весь эфир — и ничего не сделал.",
  mem: "ЧАСТОТА 447.1", start: ctx => gameRadio(ctx),
});

/* ==========================================================================
   Ф-09 · РАЦИЯ — «Вторжение». Поймать эфир сквозь глушилку.
   ========================================================================== */
function gameRadio(ctx) {
  const { scope } = ctx;
  const TOTAL = 100, FMIN = 100, FMAX = 999.9;
  const ST = [
    { f: 147.0, who: 'ДИСПЕТЧЕР «ГОРН-12»', txt: '«Невидимый», вы вызывали? Вас не видно на радаре. Подтвердите аварию… Сигнал бедствия… открываю ворота.' },
    { f: 312.4, who: 'СЕРЖАНТ GORLEX', txt: 'Нам сказали — объект секретный, только наблюдатели. По сигналу SOS приказано открывать ворота, не задавая вопросов…' },
    { f: 447.1, who: 'ОТРЯД «НЕВИДИМЫЙ»', txt: 'Внимание. Три минуты до касания. Всем приготовиться к аварийной посадке.' },
    { f: 628.8, who: 'ГРУЗОВОЙ ШАТТЛ', txt: 'Обнаружено несанкционированное движение в грузовом отсеке! Код угрозы: …' },
    { f: 904.7, who: 'КУПОЛ-7 → К-47', txt: 'Ликвидация вышедшего из-под контроля актива является приоритетной задачей.' },
  ].map(s => ({ ...s, amp: rand(.35, .55), per: rand(7, 11), ph: rand(0, 6.28), p: 0, done: false, shown: -1 }));
  const rad = ctx.el('div', 'rad');
  const box = ctx.el('div', 'rad-box', rad);
  const screen = ctx.el('div', 'rad-screen', box);
  const lock = ctx.el('span', 'rad-lock', screen, 'ШУМ');
  const freqEl = ctx.el('span', 'rad-freq', screen);
  const scaleEl = ctx.el('div', 'rad-scale', box);
  const fine = ctx.el('div', 'rad-fine', box, '<span>ТОНКАЯ НАСТРОЙКА ⇆</span>');
  const bw = ctx.el('div', 'rad-btns', box);
  const steps = [['◀◀', -5], ['◀', -.1], ['▶', .1], ['▶▶', 5]].map(([l, v]) => { const b = ctx.el('button', 'btn', bw, l); b.setAttribute('aria-label', `Частота ${v > 0 ? '+' : ''}${v}`); return [b, v]; });
  const logEl = ctx.el('div', 'rad-log', rad);
  const chEls = ST.map((s, i) => ctx.el('div', 'rad-ch', logEl, `<b>КАНАЛ ${i + 1}</b><span>░░░░░░░░░░░░░░░░░░░░</span>`));
  const offBtn = ctx.el('button', 'btn btn-ok', logEl, 'ВЫКЛЮЧИТЬ РАЦИЮ · ХВАТИТ');
  offBtn.hidden = true;
  const osc = makeCanvas(scope, screen);
  const sc = makeCanvas(scope, scaleEl);
  const stat = scope.own(A.loopNoise({ type: 'bandpass', freq: 2200, q: .4, vol: 0 }));
  const carrier = scope.own(A.loopOsc({ type: 'sine', freq: 780, vol: 0 }));
  const jamO = scope.own(A.loopOsc({ type: 'square', freq: 55, vol: 0, lp: 420 }));
  let fq = 520, t = 0, over = false, eff = 0, cur = -1, jam = 0, sylT = 0, fineX = 0;
  ctx.hint('ТЯНИ ШКАЛУ · КРУТИ ТОНКУЮ НАСТРОЙКУ · ← → (SHIFT — БЫСТРЕЕ) · ДЕРЖИ ЗАХВАТ, ПОКА КАНАЛ НЕ РАСШИФРУЕТСЯ');
  const setF = f => { fq = clamp(Math.round(f * 100) / 100, FMIN, FMAX); };

  return new Promise(resolve => {
    // шкала: грубая настройка
    let sDown = false;
    const xToF = x => { const pad = 14, w = sc.W - pad * 2; return FMIN + clamp((x - pad) / w, 0, 1) * (FMAX - FMIN); };
    scope.on(scaleEl, 'pointerdown', e => { e.preventDefault(); sDown = true; try { scaleEl.setPointerCapture(e.pointerId); } catch { /* ignore */ } const r = scaleEl.getBoundingClientRect(); setF(xToF(e.clientX - r.left)); A.sfx.click(); });
    scope.on(scaleEl, 'pointermove', e => { if (!sDown) return; const r = scaleEl.getBoundingClientRect(); setF(xToF(e.clientX - r.left)); });
    const sUp = () => { sDown = false; };
    scope.on(scaleEl, 'pointerup', sUp); scope.on(scaleEl, 'pointercancel', sUp);
    // колесо тонкой настройки
    let fDown = null;
    scope.on(fine, 'pointerdown', e => { e.preventDefault(); fDown = e.clientX; try { fine.setPointerCapture(e.pointerId); } catch { /* ignore */ } });
    scope.on(fine, 'pointermove', e => {
      if (fDown === null) return;
      const dx = e.clientX - fDown; fDown = e.clientX;
      setF(fq + dx * .02); fineX += dx; fine.style.backgroundPosition = `${fineX}px 0`;
      if (Math.abs(dx) > 2 && Math.random() < .3) A.tone({ f: 2400, type: 'square', dur: .012, vol: .015 });
    });
    const fUp = () => { fDown = null; };
    scope.on(fine, 'pointerup', fUp); scope.on(fine, 'pointercancel', fUp);
    scope.on(fine, 'wheel', e => { e.preventDefault(); setF(fq + (e.deltaY > 0 ? -.1 : .1)); }, { passive: false });
    // кнопки с автоповтором
    steps.forEach(([b, v]) => {
      let rep = 0, first = 0;
      const stop = () => { clearTimeout(first); clearInterval(rep); first = rep = 0; };
      scope.on(b, 'pointerdown', e => { e.preventDefault(); setF(fq + v); A.sfx.click(); stop(); first = setTimeout(() => { rep = setInterval(() => setF(fq + v), 70); }, 350); });
      scope.on(b, 'pointerup', stop); scope.on(b, 'pointerleave', stop); scope.on(b, 'pointercancel', stop);
      scope.on(b, 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setF(fq + v); } });
      scope.own(stop);
    });
    scope.on(offBtn, 'click', () => { if (!over) end(); });
    scope.on(document, 'keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setF(fq + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 2 : .1)); }
      else if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); setF(fq + (e.key === 'PageDown' ? -10 : 10)); }
    });

    async function end() {
      over = true; offBtn.hidden = true;
      const n = ST.filter(s => s.done).length;
      stat.vol(.2, .3); jamO.vol(.07, .3); carrier.vol(0);
      lock.textContent = 'ГЛУШИЛКА'; lock.className = 'rad-lock on';
      await ctx.line('Глушилка взвыла на полную.', { pos: 'top', cls: 'red', ms: 2000 });
      stat.vol(0, .4); jamO.vol(0, .4);
      await ctx.line('Последнее, что они услышат, — это наши выстрелы.', { pos: 'top', cls: 'red', ms: 2800 });
      await ctx.line('«Когда вы решите, что данных достаточно?»', { pos: 'top', ms: 2600 });
      resolve(n >= 3 ? { ok: 'ok', detail: `КАНАЛОВ ${n}/5` } : { ok: 'fail', detail: `КАНАЛОВ ${n}/5 · НУЖНО 3` });
    }

    scope.loop(dt => {
      if (!over) t += dt;
      jam = Math.min(1, .12 + .32 * Math.pow(Math.max(0, Math.sin(t * .9)), 6) + t / TOTAL * .45);
      eff = 0; cur = -1;
      ST.forEach((s, i) => {
        const sf = s.f + s.amp * Math.sin(t * 6.283 / s.per + s.ph);
        const str = Math.pow(clamp(1 - Math.abs(fq - sf) / .9, 0, 1), 1.5) * (1 - jam * .55);
        s.str = str;
        if (str > eff) { eff = str; cur = i; }
      });
      if (!over && cur >= 0 && eff > .5 && !ST[cur].done) {
        const s = ST[cur];
        s.p = Math.min(1, s.p + dt / 5);
        if (s.p >= 1) {
          s.done = true; A.sfx.chime(880, .06);
          chEls[cur].classList.add('done');
          if (ST.every(x => x.done)) end();
        }
      }
      ST.forEach((s, i) => {
        const shown = Math.ceil(s.p * s.txt.length), key = shown * 2 + (s.done ? 1 : 0);
        chEls[i].classList.toggle('cur', i === cur && eff > .5);
        if (key !== s.shown) {
          s.shown = key;
          const clear = s.txt.slice(0, shown), rest = s.txt.slice(shown).replace(/\S/g, () => pick(['░', '▒', '·']));
          chEls[i].innerHTML = `<b>${s.done ? esc(s.who) : `КАНАЛ ${i + 1}`}</b>${esc(clear)}<span style="color:#2c5a40">${esc(rest.slice(0, 60))}</span>`;
        }
      });
      if (!over) {
        stat.vol(.11 * (1 - eff * .85) + jam * .08); carrier.vol(eff * .012); jamO.vol(Math.pow(jam, 3) * .05);
        sylT -= dt;
        if (eff > .3 && sylT <= 0) { sylT = rand(.11, .2); A.tone({ f: rand(110, 170), type: 'sawtooth', dur: rand(.07, .12), vol: eff * .07, attack: .01, filter: { type: 'bandpass', freq: rand(500, 1400), q: 5 } }); }
        const n = ST.filter(s => s.done).length;
        if (n >= 3 && offBtn.hidden) offBtn.hidden = false;
        ctx.stat(`КАНАЛОВ ${n}/5 · ГЛУШИЛКА ${Math.round(jam * 100)}% · ${Math.max(0, Math.ceil(TOTAL - t))} С`);
        if (t >= TOTAL) end();
      }
      freqEl.innerHTML = `${fq.toFixed(1)}<small>кГц</small>`;
      if (!over) { lock.textContent = eff > .5 ? `ЗАХВАТ · ${ST[cur].done ? ST[cur].who : `КАНАЛ ${cur + 1}`}` : eff > .2 ? 'СЛАБЫЙ СИГНАЛ' : 'ШУМ'; lock.className = `rad-lock${eff > .5 ? ' on' : ''}`; }
      drawOsc(); drawScale();
    });

    function drawOsc() {
      const { g, W, H } = osc;
      g.fillStyle = 'rgba(3, 17, 9, .55)'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(0, 255, 136, .08)'; g.lineWidth = 1;
      for (let x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      g.strokeStyle = `rgba(125, 255, 192, ${.5 + eff * .5})`; g.lineWidth = 1.6; g.beginPath();
      const A0 = H * .32;
      for (let i = 0; i <= 160; i++) {
        const x = i / 160 * W;
        const y = H * .55 + Math.sin(i * .35 + t * 22) * eff * A0 * (.7 + .3 * Math.sin(i * .05 + t * 3)) + (Math.random() - .5) * (1 - eff) * A0 * 1.4 + (Math.random() - .5) * jam * A0 * .6;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
    }
    function drawScale() {
      const { g, W, H } = sc, pad = 14, w = W - pad * 2;
      g.clearRect(0, 0, W, H);
      const fx = f => pad + (f - FMIN) / (FMAX - FMIN) * w;
      ST.forEach(s => {
        const x = fx(s.f), rg = g.createRadialGradient(x, H * .55, 0, x, H * .55, 26);
        rg.addColorStop(0, `rgba(160, 90, 20, ${s.done ? .15 : .3})`); rg.addColorStop(1, 'rgba(160, 90, 20, 0)');
        g.fillStyle = rg; g.fillRect(x - 30, 0, 60, H);
      });
      g.strokeStyle = '#3a2e1c'; g.fillStyle = '#3a2e1c'; g.font = `10px ${MONO}`; g.textAlign = 'center';
      for (let f = 100; f <= 1000; f += 10) {
        const x = fx(Math.min(f, FMAX)), big = f % 100 === 0, mid = f % 50 === 0;
        g.lineWidth = big ? 1.5 : 1;
        g.beginPath(); g.moveTo(x, H); g.lineTo(x, H - (big ? 18 : mid ? 12 : 6)); g.stroke();
        if (big && W > 360) g.fillText(String(f), x, 13);
      }
      const nx = fx(fq);
      g.strokeStyle = '#d4001e'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(nx, 2); g.lineTo(nx, H - 2); g.stroke();
      g.fillStyle = 'rgba(212, 0, 30, .15)'; g.fillRect(nx - 5, 0, 10, H);
    }
  });
}
