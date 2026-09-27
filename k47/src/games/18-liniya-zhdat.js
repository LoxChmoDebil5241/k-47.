/* ==========================================================================
   Глава 18 · «Линия» — ЖДАТЬ И СЧИТАТЬ
   Бетонная коробка. «Жди дальнейших указаний». Часов нет — только зелёная
   линия на мониторе за стеклом и сбитый ритм писка. Отсчитай заданное время
   про себя и нажми. Потом — просто жди. Техники поспорили, уснёт ли он.
   ========================================================================== */
defineFrag(17, {
  id: 'line', name: 'Ждать и считать',
  text: 'К-26 сидел в бетонной коробке и считал. Он не знал, сколько ещё продлится это ожидание. Может быть, час. Может быть, год. Может быть, вечность. Но знал, что будет считать всегда.',
  how: 'Часов нет. Тебе скажут, сколько секунд отсчитать, — считай про себя и нажми, когда время выйдет. Писк монитора сбит нарочно — не верь ему. Три отсчёта, нужны два точных. А потом — просто жди и ничего не нажимай.',
  keys: 'ПРОБЕЛ / ENTER / ТАП — «ВРЕМЯ ВЫШЛО»',
  note: 'Спор на рацион: свинина против курятины. Я считал, пока не перестал. Это было похоже на смерть — но без боли. Просто выключили.',
  noteDist: 'В этой записи я не уснул — сидел и считал до конца. Техник проиграл курятину. Архив говорит, что я впервые уснул.',
  mem: 'ЗЕЛЁНАЯ ЛИНИЯ', start: gameLine,
});

function gameLine(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const ROUNDS = [10, 17, 23];
  let round = -1, startT = 0, t = 0, phase = 'intro', hits = 0, over = false, results = [], sleep = 0, pressedFinal = false, finalT = 0;
  const beepT = { next: 0.7 };
  const vent = scope.own(A.loopNoise({ type: 'lowpass', freq: 260, q: 0.5, vol: 0 }));
  vent.vol(0.04, 1);
  const box = ctx.el('div', 'ctl');
  const btn = ctx.el('button', 'btn btn-primary big-btn', box, 'ВРЕМЯ ВЫШЛО');
  btn.hidden = true;
  ctx.hint('СЧИТАЙ ПРО СЕБЯ · НАЖМИ, КОГДА ПРОЙДЁТ НАЗВАННОЕ ВРЕМЯ');

  return new Promise(resolve => {
    async function next() {
      round++;
      if (round >= ROUNDS.length) { finalWait(); return; }
      phase = 'brief'; btn.hidden = true;
      await ctx.line(`— Жди дальнейших указаний. ${ROUNDS[round]} секунд.`, { pos: 'top', cls: 'ice', ms: 2200 });
      if (over) return;
      phase = 'count'; startT = t; btn.hidden = false; btn.focus({ preventScroll: true });
      A.sfx.beep(600, 0.1, 0.04);
      ctx.stat(`ОТСЧЁТ ${round + 1}/3 · ТОЧНЫХ ${hits}`);
    }
    function press() {
      if (phase === 'final') { pressedFinal = true; return; }
      if (phase !== 'count' || over) return;
      const el = t - startT, target = ROUNDS[round], err = Math.abs(el - target) / target;
      const ok = err <= 0.14;
      if (ok) { hits++; A.sfx.chime(700, 0.05); } else A.sfx.buzz();
      results.push(`${el.toFixed(1)} / ${target}`);
      phase = 'judge'; btn.hidden = true;
      ctx.say(`${ok ? 'Точно' : el < target ? 'Рано' : 'Поздно'}: ${el.toFixed(1)} с из ${target}.`, { pos: 'mid', cls: ok ? 'ice' : 'red' });
      scope.timeout(() => { ctx.unsay('mid'); next(); }, 1800);
    }
    scope.on(btn, 'click', press);
    ctx.keys(e => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); press(); } });
    scope.on(C.cv, 'pointerdown', () => { if (phase === 'final') pressedFinal = true; });

    async function finalWait() {
      if (hits < 2) {
        over = true;
        await ctx.line('— Он сбился. Как они все.', { pos: 'top', cls: 'red', ms: 2200 });
        resolve({ ok: 'fail', detail: `ТОЧНЫХ ${hits}/3 · ${results.join(' · ')}` });
        return;
      }
      phase = 'final'; finalT = 0;
      ctx.hint('ПРОСТО ЖДИ. НИЧЕГО НЕ НАЖИМАЙ.');
      await ctx.line('— Спорим на рацион? Уснёт или нет.', { pos: 'top', ms: 2400 });
      await ctx.line('— По рукам.', { pos: 'top', ms: 1400 });
    }

    scope.loop(dt => {
      t += dt;
      // сбитый писк монитора: не в такт секундам
      beepT.next -= dt;
      if (beepT.next <= 0) { beepT.next = rand(0.55, 1.6); A.tone({ f: 1320, dur: 0.05, vol: 0.02 }); }
      if (phase === 'count' && t - startT > ROUNDS[round] * 1.6) press();
      if (phase === 'final' && !over) {
        finalT += dt; sleep = Math.min(1, finalT / 18);
        ctx.stat(`ОЖИДАНИЕ · ${Math.floor(finalT)} С`);
        vent.vol(0.04 * (1 - sleep * 0.7));
        if (pressedFinal) {
          over = true;
          (async () => { A.sfx.glitch(); await ctx.line('Он вздрогнул и снова начал считать.', { pos: 'top', ms: 2400 }); ctx.say('НЕЙРОСЛЕПОК: РАСХОЖДЕНИЕ С ЗАПИСЬЮ', { pos: 'mid', cls: 'big red' }); await scope.wait(2200); resolve({ ok: 'dist', detail: `ТОЧНЫХ ${hits}/3 · НЕ УСНУЛ` }); })();
        } else if (finalT >= 18) {
          over = true;
          (async () => { await ctx.line('К-26 задремал. Сидя, уронив голову на грудь.', { pos: 'top', ms: 2600 }); await ctx.line('— Свинина моя.', { pos: 'top', cls: 'ice', ms: 1800 }); resolve({ ok: 'ok', detail: `ТОЧНЫХ ${hits}/3 · ${results.join(' · ')}` }); })();
        }
      }
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      drawCell(g, W, H, { t, lamp: 1 - sleep * 0.6, seed: 18 });
      // зеркальное стекло наблюдения с монитором
      const mx = W * 0.62, my = H * 0.14, mw = W * 0.3, mh = H * 0.24;
      g.fillStyle = 'rgba(40,50,58,.85)'; g.fillRect(mx, my, mw, mh);
      g.fillStyle = 'rgba(180,200,210,.06)'; g.fillRect(mx, my, mw * 0.4, mh);
      g.strokeStyle = 'rgba(0,255,136,.85)'; g.lineWidth = 1.5; g.beginPath();
      for (let i = 0; i <= 80; i++) { const x = mx + 8 + i / 80 * (mw - 16), ph = (i / 80 * 6 + t * 1.3) % 1; const y = my + mh * 0.55 - (ph > 0.46 && ph < 0.5 ? mh * 0.25 : ph > 0.5 && ph < 0.53 ? -mh * 0.1 : 0); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      Art.human(g, mx + mw * 0.3, my + mh + H * 0.01, mh * 0.9, 'man', { color: 'rgba(10,14,16,.7)' });
      // К-26 у стены: шлем рядом, оружие на коленях
      const sx = W * 0.3, fy = H * 0.72;
      g.save(); g.translate(sx, fy); g.rotate(sleep * 0.25); g.translate(-sx, -fy);
      g.fillStyle = '#060606';
      g.beginPath(); g.ellipse(sx, fy - H * 0.2, H * 0.1, H * 0.14, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(sx + sleep * H * 0.03, fy - H * 0.37 + sleep * H * 0.05, H * 0.045, 0, Math.PI * 2); g.fill();
      g.fillRect(sx - H * 0.14, fy - H * 0.08, H * 0.3, H * 0.06);
      g.fillStyle = '#1a1a1c'; g.fillRect(sx - H * 0.12, fy - H * 0.16, H * 0.26, H * 0.025);
      g.restore();
      g.fillStyle = '#0b0b0c'; g.beginPath(); g.ellipse(sx + H * 0.2, fy - H * 0.02, H * 0.05, H * 0.035, 0, Math.PI, 0); g.fill();
      g.save(); g.shadowColor = '#ff0022'; g.shadowBlur = 8; g.fillStyle = 'rgba(255,26,46,.8)'; g.fillRect(sx + H * 0.17, fy - H * 0.035, H * 0.06, 3); g.restore();
      if (phase === 'count') { g.fillStyle = 'rgba(239,230,207,.15)'; g.font = `${Math.round(H * 0.035)}px ${PIXEL}`; g.textAlign = 'center'; g.fillText('? ? ?', W / 2, H * 0.9); }
      if (sleep > 0) { g.fillStyle = `rgba(0,0,0,${sleep * 0.55})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.7);
      Art.grain(g, W, H, 0.05);
    }
    next();
  });
}
