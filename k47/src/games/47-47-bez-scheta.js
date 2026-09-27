/* ==========================================================================
   Глава 47 · «47.» — ПЕРЕДАТЬ И НЕ СЧИТАТЬ
   Нейропрофиль К-47 переходит от Vitezstvi к NanoTrasen. Контракт
   продлевается автоматически. Счётчик циклов бежит сам: 48, 49, 50…
   Кнопка «СЧИТАТЬ» пульсирует. «Теперь их забота. Считать будут другие».
   ========================================================================== */
defineFrag(46, {
  id: 'fortyseven', name: 'И дальше без счёта',
  text: '— И дальше без счёта..? — Теперь их забота. Считать будут другие.',
  how: 'Перетащи нейропрофиль К-47 из левой колонки (Vitezstvi) в правую (NanoTrasen) — или нажми ENTER. Потом счётчик циклов побежит сам. Рядом будет кнопка «СЧИТАТЬ». Не считай. Просто смотри.',
  keys: 'ПЕРЕТАЩИТЬ ИЛИ ENTER — ПЕРЕДАТЬ · ПОТОМ — НИЧЕГО',
  note: 'Цикл-48. Актив передан новому владельцу. Контракт продлевается автоматически. Я больше не считаю. Считают другие.',
  noteDist: 'В этой записи я продолжал считать: сорок восемь, сорок девять, пятьдесят… Архив говорит, что счёт вели другие.',
  mem: 'БЕЗ СЧЁТА', start: gameFortySeven,
});

function gameFortySeven(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  let t = 0, over = false, phase = 'drag', fx = 0.2, fy = 0.5, drag = false, counted = 0, cycle = 47, cT = 0, watchT = 0, lines = [], lineT = 0, pulse = 0;
  const WATCH = 20;
  const TXT = ['К-47. Клон класса «Актив» признан пригодным к передаче.', 'Права на нейропрофиль переуступлены корпорации «NanoTrasen».', 'Нормы расхода плоти. Контракт расторгнут.', 'Заключено новое соглашение. Условия: бессрочное клонирование.', 'Цикл-48. Актив передан новому владельцу. Персонал уведомлён.', 'Контракт продлевается автоматически.'];
  ctx.hint('ПЕРЕТАЩИ НЕЙРОПРОФИЛЬ ВПРАВО · ИЛИ ENTER');
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 47, vol: 0 }));
  hum.vol(0.03, 1);
  let countB = null;

  return new Promise(resolve => {
    const rel = e => { const r = C.cv.getBoundingClientRect(); return [(e.clientX - r.left) / C.W, (e.clientY - r.top) / C.H]; };
    scope.on(C.cv, 'pointerdown', e => { if (phase !== 'drag') return; const [x, y] = rel(e); if (Math.abs(x - fx) < 0.1 && Math.abs(y - fy) < 0.12) { drag = true; try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ } } });
    scope.on(C.cv, 'pointermove', e => { if (!drag) return; const [x, y] = rel(e); fx = clamp(x, 0.05, 0.95); fy = clamp(y, 0.2, 0.85); });
    scope.on(C.cv, 'pointerup', () => { if (!drag) return; drag = false; if (fx > 0.62) transfer(); else { fx = 0.2; fy = 0.5; } });
    ctx.keys(e => { if (phase === 'drag' && e.key === 'Enter') { e.preventDefault(); transfer(); } else if (phase === 'watch' && (e.code === 'Space' || e.key === 'Enter' || /^\d$/.test(e.key))) count(); });
    function transfer() {
      if (phase !== 'drag') return;
      phase = 'text'; fx = 0.8; fy = 0.5; A.sfx.stamp(); A.sfx.chime(330, 0.04);
      lineT = 0.2;
    }
    function watchPhase() {
      phase = 'watch'; ctx.hint('НЕ СЧИТАЙ · ПРОСТО СМОТРИ');
      const box = ctx.el('div', 'ctl');
      countB = ctx.el('button', 'btn fs-count', box, 'СЧИТАТЬ');
      countB.addEventListener('click', count);
      ctx.say('— И дальше без счёта..?', { pos: 'top' });
    }
    function count() {
      if (phase !== 'watch' || over) return;
      counted++; A.sfx.click();
      ctx.say(`${['Сорок восемь', 'Сорок девять', 'Пятьдесят', 'Пятьдесят один', 'Пятьдесят два'][Math.min(4, counted - 1)]}…`, { pos: 'mid', cls: 'amb' }); scope.timeout(() => ctx.unsay('mid'), 700);
    }
    async function end() {
      over = true; hum.vol(0, 1); if (countB) countB.parentNode.remove();
      await ctx.line('— Теперь их забота. Считать будут другие.', { pos: 'top', ms: 2600 });
      if (counted <= 2) resolve({ ok: 'ok', detail: `ЦИКЛ ${cycle} · НЕ СЧИТАЛ` });
      else resolve({ ok: 'dist', detail: `СЧИТАЛ ${counted} РАЗ` });
    }
    scope.loop(dt => {
      t += dt; pulse = 0.5 + 0.5 * Math.sin(t * 4);
      if (phase === 'text') {
        lineT -= dt;
        if (lineT <= 0) { if (lines.length < TXT.length) { lines.push({ t: TXT[lines.length], a: 0 }); A.sfx.type(0.04); lineT = 1.2; } else watchPhase(); }
      }
      lines.forEach(l => { l.a = Math.min(1, l.a + dt * 2); });
      if (phase === 'watch' && !over) {
        watchT += dt; cT += dt;
        const every = Math.max(0.12, 1.1 - watchT * 0.06);
        if (cT >= every) { cT = 0; cycle++; A.sfx.beep(300 + (cycle % 7) * 40, 0.03, 0.015); }
        if (countB) countB.style.setProperty('--p', pulse.toFixed(2));
        ctx.stat(`ЦИКЛ-${cycle}`);
        if (watchT >= WATCH) end();
      }
      draw();
    });
    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#060506'; g.fillRect(0, 0, W, H);
      // две колонки: Vitezstvi — мечи над планетой; NanoTrasen — синяя N
      g.fillStyle = 'rgba(255,0,51,.06)'; g.fillRect(0, 0, W * 0.4, H);
      g.fillStyle = 'rgba(74,168,216,.06)'; g.fillRect(W * 0.6, 0, W * 0.4, H);
      g.font = `12px ${MONO}`; g.textAlign = 'center';
      g.fillStyle = '#ff0033'; g.fillText('VITEZSTVI', W * 0.2, H * 0.12);
      g.fillStyle = '#4aa8d8'; g.fillText('NANOTRASEN', W * 0.8, H * 0.12);
      const s = Math.min(W, H) * 0.06;
      g.strokeStyle = 'rgba(255,0,51,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(W * 0.2, H * 0.22, s, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(W * 0.2 - s, H * 0.22 - s); g.lineTo(W * 0.2 + s, H * 0.22 + s); g.moveTo(W * 0.2 + s, H * 0.22 - s); g.lineTo(W * 0.2 - s, H * 0.22 + s); g.stroke();
      g.strokeStyle = 'rgba(74,168,216,.8)'; g.beginPath(); g.arc(W * 0.8, H * 0.22, s, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#4aa8d8'; g.font = `${Math.round(s)}px ${PIXEL}`; g.fillText('N', W * 0.8, H * 0.22 + s * 0.35);
      // файл нейропрофиля
      if (phase === 'drag' || phase === 'text') {
        const x = fx * W, y = fy * H, w = Math.min(W * 0.16, 140), h = w * 0.7;
        g.fillStyle = '#111014'; g.fillRect(x - w / 2, y - h / 2, w, h);
        g.strokeStyle = phase === 'drag' ? `rgba(239,230,207,${0.4 + pulse * 0.5})` : '#4aa8d8'; g.lineWidth = 1.5; g.strokeRect(x - w / 2, y - h / 2, w, h);
        g.fillStyle = '#efe6cf'; g.font = `${Math.round(w * 0.14)}px ${PIXEL}`; g.fillText('К-47', x, y);
        g.font = `10px ${MONO}`; g.fillStyle = 'rgba(239,230,207,.6)'; g.fillText('НЕЙРОПРОФИЛЬ', x, y + h * 0.3);
      }
      // текст передачи
      g.textAlign = 'left'; g.font = `${Math.max(12, Math.round(W * 0.016))}px ${MONO}`;
      lines.forEach((l, i) => { g.fillStyle = `rgba(239,230,207,${l.a * 0.85})`; g.fillText(l.t, W * 0.06, H * 0.52 + i * Math.max(18, H * 0.05), W * 0.88); });
      // счётчик бежит сам
      if (phase === 'watch') {
        g.textAlign = 'center'; g.fillStyle = 'rgba(255,0,51,.9)'; g.font = `${Math.round(Math.min(W, H) * 0.14)}px ${PIXEL}`;
        g.fillText(String(cycle), W / 2, H * 0.44);
        g.font = `12px ${MONO}`; g.fillStyle = 'rgba(239,230,207,.5)'; g.fillText('ЦИКЛ', W / 2, H * 0.44 + 22);
      }
      Art.scan(g, W, H, 0.1);
      Art.vignette(g, W, H, 0.7);
    }
  });
}
