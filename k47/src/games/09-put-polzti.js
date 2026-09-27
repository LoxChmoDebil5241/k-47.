/* ==========================================================================
   Глава 9 · перенесено из прототипа «Мини-игры» (механика сохранена)
   ========================================================================== */
defineFrag(8, {
  id: "crawl", name: "Притворись обломком",
  text: "Он лежал неподвижно, притворяясь обломком. Его единственной задачей было выжить следующие несколько минут. Он замер, слившись с грязью пола, и слушал. Слушал тяжёлое, прерывистое дыхание отца, пока оно не сменилось низким, булькающим храпом. Монстр уснул.",
  how: "Сначала — не шевелиться: ни мышью, ни пальцем, ни клавишей, пока хриплое дыхание не сменится храпом. Потом ползти к шлюзу, попеременно левым и правым локтем. Спешка скрипит половицами. Храп замолк — замри.",
  keys: "← → ИЛИ A / D, ИЛИ ДВЕ КНОПКИ ВНИЗУ · ЛОКТИ ПО ОЧЕРЕДИ · ШУМ 100% — ОН ПРОСНЁТСЯ",
  note: "Шлюз так и не закрыли. Я выполз. Потом встал. Потом пошёл — не зная куда. Просто прочь.",
  mem: "ДОРОГА ПРОЧЬ", start: ctx => gameCrawl(ctx),
});

/* ==========================================================================
   Ф-02 · ПРИТВОРИСЬ ОБЛОМКОМ — «Путь». Неподвижность, потом ползти под храп.
   ========================================================================== */
function gameCrawl(ctx) {
  const { scope, body } = ctx;
  if (document.activeElement) document.activeElement.blur();
  const C = ctx.canvas();
  const meter = ctx.el('div', 'meter', body, 'ШУМ<div class="mb"><i></i></div>');
  meter.style.left = '14px'; meter.style.top = '14px';
  const meterFill = $('i', meter);
  const ctl = ctx.el('div', 'ctl', body);
  ctl.hidden = true;
  const bL = ctx.el('button', 'btn big-btn', ctl, '◀ ЛЕВЫЙ ЛОКОТЬ');
  const bR = ctx.el('button', 'btn big-btn', ctl, 'ПРАВЫЙ ЛОКОТЬ ▶');
  bL.setAttribute('aria-label', 'Левый локоть'); bR.setAttribute('aria-label', 'Правый локоть');

  const breathN = scope.own(A.loopNoise({ type: 'bandpass', freq: 850, q: 1.3, vol: 0 }));
  const snoreO = scope.own(A.loopOsc({ type: 'sawtooth', freq: 72, vol: 0, lp: 420 }));
  const snoreN = scope.own(A.loopNoise({ type: 'lowpass', freq: 380, q: .7, vol: 0 }));

  let phase = 'freeze', father = 'breath';
  let noise = 0, progress = 0, t = 0, amp = 0, bob = 0, wake = 0;
  const freezeDur = rand(10, 13.5);
  let crawlT = 0, nextPause = rand(4.5, 7), pauseEnd = 0, pauseStart = 0;
  let lastSide = '', lastStepT = 0, nextBeat = 0, cyc = 0, cycLen = 3.4;
  const wave = new Array(160).fill(0);
  let waveAcc = 0, px = 0, pyLast = 0, warnT = 0;

  ctx.hint('НЕ ДВИГАЙ МЫШЬЮ, НЕ КАСАЙСЯ, НЕ ЖМИ КЛАВИШИ · ЖДИ ХРАПА');
  ctx.stat('НЕ ШЕВЕЛИСЬ');
  ctx.say('Не шевелись. Слушай, как он дышит.', { pos: 'top' });

  return new Promise(resolve => {
    let over = false;
    function addNoise(v) {
      if (over) return;
      noise = Math.min(1, noise + v);
      if (v > .12 && Clock.now() - warnT > 900) { warnT = Clock.now(); ctx.say(phase === 'freeze' ? 'Тише…' : 'Скрипнула половица…', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 900); }
      if (noise >= 1) lose();
    }
    function step(side) {
      if (over) return;
      if (phase === 'freeze') { addNoise(.3); return; }
      if (phase !== 'crawl') return;
      const now = Clock.now();
      let n = .05;
      if (lastSide === side) { n += .22; A.sfx.thud(.2); }
      else { progress = Math.min(1, progress + 1 / 34); bob = 1; }
      if (now - lastStepT < 260) { n += .2; A.sfx.creak(.18, side === 'L' ? -.3 : .3); }
      if (father === 'pause' && now - pauseStart > 280) { n += .55; A.sfx.creak(.34); }
      lastSide = side; lastStepT = now;
      A.noise({ type: 'lowpass', freq: 700, dur: .2, vol: .05, pan: side === 'L' ? -.3 : .3 });
      addNoise(n);
      ctx.stat(`ДО ШЛЮЗА ${Math.round((1 - progress) * 100)}%`);
      if (progress >= 1) win();
    }
    async function toCrawl() {
      phase = 'crawl'; father = 'snore';
      ctl.hidden = false;
      ctx.say('Храп. Монстр уснул. Ползи.', { pos: 'top' });
      scope.timeout(() => ctx.unsay('top'), 2600);
      ctx.hint('ЛОКТИ ПО ОЧЕРЕДИ: ← → / A D / КНОПКИ · НЕ СПЕШИ · ХРАП ЗАМОЛК — ЗАМРИ');
      ctx.stat('ДО ШЛЮЗА 100%');
    }
    async function lose() {
      if (over) return;
      over = true; phase = 'end'; father = 'wake';
      ctl.hidden = true;
      A.sfx.creak(.4); A.sfx.thud(.4);
      FX.shake('lg');
      await ctx.line('Храп оборвался.', { pos: 'top', cls: 'red', ms: 1800 });
      await ctx.line('Скрипнул диван. Он поднимает голову.', { pos: 'top', cls: 'red', ms: 2400 });
      resolve({ ok: 'fail', detail: `ПРОПОЛЗ ${Math.round(progress * 100)}%` });
    }
    async function win() {
      over = true; phase = 'end'; ctl.hidden = true;
      A.sfx.whoosh(.12);
      await ctx.line('Холодный бетон подъезда.', { pos: 'top', ms: 2000 });
      await ctx.line('Он поднялся на ноги. И пошёл.', { pos: 'top', ms: 2400 });
      resolve({ ok: 'ok', detail: `ШУМ НА ВЫХОДЕ: ${Math.round(noise * 100)}%` });
    }

    // любое движение во время «замри» — шум
    scope.on(window, 'pointermove', e => {
      if (phase !== 'freeze' || e.pointerType !== 'mouse') return;
      const d = Math.hypot(e.movementX || 0, e.movementY || 0);
      if (d > 0) addNoise(d * .004);
    });
    scope.on(body, 'pointerdown', e => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      if (phase === 'freeze') addNoise(.3);
      else if (phase === 'crawl' && father === 'pause') addNoise(.2);
    });
    scope.on(bL, 'pointerdown', e => { e.preventDefault(); step('L'); });
    scope.on(bR, 'pointerdown', e => { e.preventDefault(); step('R'); });
    scope.on(bL, 'keydown', e => { if (e.key === 'Enter') step('L'); });
    scope.on(bR, 'keydown', e => { if (e.key === 'Enter') step('R'); });
    scope.on(document, 'keydown', e => {
      if (e.key === 'Escape' || e.repeat) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); step('L'); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); step('R'); }
      else if (phase === 'freeze') addNoise(.25);
    });

    scope.loop(dt => {
      t += dt;
      // --- дыхание / храп отца ---
      let target = 0;
      if (father === 'breath') {
        cyc += dt;
        if (cyc > cycLen) { cyc = 0; cycLen = lerp(3.2, 4.6, clamp(t / freezeDur, 0, 1)) * rand(.9, 1.15); }
        const k = cyc / cycLen;
        target = k < .38 ? Math.sin(k / .38 * Math.PI / 2) : k < .8 ? Math.cos((k - .38) / .42 * Math.PI / 2) : 0;
        target *= .9 + Math.sin(t * 23) * .1;
        breathN.vol(.16 * target); breathN.freq(650 + target * 500);
        snoreO.vol(0); snoreN.vol(0);
      } else if (father === 'snore') {
        cyc += dt;
        if (cyc > 3.9) cyc = 0;
        const k = cyc / 3.9;
        target = k < .45 ? Math.sin(k / .45 * Math.PI) : (k < .85 ? .25 * Math.sin((k - .45) / .4 * Math.PI) : 0);
        snoreO.vol(k < .45 ? .07 * target : 0); snoreO.freq(66 + target * 14 + Math.sin(t * 40) * 5);
        snoreN.vol(.12 * target); breathN.vol(k >= .45 ? .05 * target : 0);
      } else {
        target = 0; breathN.vol(0); snoreO.vol(0); snoreN.vol(0);
      }
      amp += (target - amp) * Math.min(1, dt * 12);
      waveAcc += dt;
      if (waveAcc > .04) { waveAcc = 0; wave.shift(); wave.push(father === 'pause' ? 0 : amp * (father === 'snore' ? .7 : 1) * (1 + (Math.random() - .5) * .3)); }

      // --- фазы ---
      if (phase === 'freeze') {
        noise = Math.max(0, noise - dt * .1);
        if (t > 2.5 && t < 3) ctx.unsay('top');
        if (t >= freezeDur) toCrawl();
      } else if (phase === 'crawl') {
        crawlT += dt;
        if (father === 'snore' && crawlT >= nextPause) {
          father = 'pause'; pauseStart = Clock.now(); pauseEnd = crawlT + rand(1.6, 2.6);
          ctx.say('ТИШИНА. Замри.', { pos: 'top', cls: 'red' });
        } else if (father === 'pause' && crawlT >= pauseEnd) {
          father = 'snore'; cyc = 0; nextPause = crawlT + rand(4.2, 7);
          ctx.unsay('top');
        }
        if (father !== 'pause') noise = Math.max(0, noise - dt * .2);
      }
      // сердце героя
      nextBeat -= dt;
      if (nextBeat <= 0 && !over) { A.sfx.heartbeat(.18 + noise * .3); nextBeat = 60 / (68 + noise * 70); }
      meterFill.style.width = `${noise * 100}%`;
      bob = Math.max(0, bob - dt * 4);
      if (father === 'wake') wake = Math.min(1, wake + dt * .9);
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#060304'; g.fillRect(0, 0, W, H);
      const fy = H * .66;
      g.fillStyle = '#0d0708'; g.fillRect(0, 0, W, fy);
      const fl = g.createLinearGradient(0, fy, 0, H); fl.addColorStop(0, '#150b09'); fl.addColorStop(1, '#0a0505');
      g.fillStyle = fl; g.fillRect(0, fy, W, H - fy);
      g.strokeStyle = 'rgba(80, 40, 30, .25)'; g.lineWidth = 1;
      for (let i = 1; i < 7; i++) { const y = fy + (H - fy) * Math.pow(i / 7, 1.4); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      // диван и отец (размеры от меньшей стороны — чтобы на телефоне не раздувало)
      const u = Math.min(W, H * 1.4);
      const sx = W * .04, sw = Math.max(W * .3, u * .34), sy = fy - u * .1;
      g.fillStyle = '#1a1011'; g.fillRect(sx, sy, sw, fy - sy);
      g.fillStyle = '#140c0d'; g.fillRect(sx, sy - u * .07, sw * .12, fy - sy + u * .07);
      const chest = 1 + amp * .07;
      g.fillStyle = '#050304';
      if (wake > 0) {
        const hx = sx + sw * .2, hy = sy - u * .05 - wake * u * .12;
        g.beginPath(); g.ellipse(sx + sw * .55, sy - u * .025, sw * .38, u * .04, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(sx + sw * .1, sy); g.lineTo(hx - sw * .06, hy + u * .025); g.lineTo(hx + sw * .1, hy + u * .025); g.lineTo(sx + sw * .35, sy); g.fill();
        g.beginPath(); g.arc(hx + sw * .02, hy, u * .028, 0, Math.PI * 2); g.fill();
      } else {
        g.beginPath(); g.ellipse(sx + sw * .55, sy - u * .03 * chest, sw * .4, u * .036 * chest, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(sx + sw * .1, sy - u * .032, u * .027, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#050304'; g.lineWidth = Math.max(3, u * .008);
        g.beginPath(); g.moveTo(sx + sw * .45, sy - u * .02); g.quadraticCurveTo(sx + sw * .5, sy + u * .05, sx + sw * .44, fy + u * .01); g.stroke();
      }
      // шлюз, приоткрытый наполовину
      const dx = W * .86, dw = Math.min(W * .1, 110), dt2 = fy - H * .5;
      g.fillStyle = '#1b1416'; g.fillRect(dx, dt2, dw, fy - dt2);
      g.fillStyle = 'rgba(200, 180, 150, .22)'; g.fillRect(dx, dt2, dw * .5, fy - dt2);
      g.fillStyle = 'rgba(200, 180, 150, .08)';
      g.beginPath(); g.moveTo(dx, fy); g.lineTo(dx + dw * .5, fy); g.lineTo(dx - W * .02, H); g.lineTo(dx - W * .18, H); g.closePath(); g.fill();
      // след и сам мальчик
      const x0 = Math.max(W * .38, sx + sw + u * .06), x1 = dx - W * .02, py = fy + (H - fy) * .38;
      px = lerp(x0, x1, progress);
      g.strokeStyle = 'rgba(110, 10, 20, .45)'; g.lineWidth = Math.max(2, H * .008); g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, py + 6);
      for (let x = x0; x <= px; x += 8) g.lineTo(x, py + 6 + Math.sin(x * .09) * 2);
      g.stroke();
      const by = py - bob * 3;
      g.fillStyle = '#020102';
      g.beginPath(); g.ellipse(px, by, u * .05 + 4, u * .028 + 3, -.1, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(px + u * .05 + 3, by - 2, u * .02 + 2, 0, Math.PI * 2); g.fill();
      // волна дыхания
      const ww = Math.min(W * .56, 520), wx = (W - ww) / 2, wy = H * .27;
      g.strokeStyle = father === 'pause' ? 'rgba(255, 0, 51, .8)' : father === 'snore' ? 'rgba(255, 110, 130, .5)' : 'rgba(255, 60, 90, .75)';
      g.lineWidth = 2; g.beginPath();
      wave.forEach((v, i) => { const x = wx + i / (wave.length - 1) * ww, y = wy - v * H * .06 * (i % 2 ? 1 : -1); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
      g.stroke();
      g.font = `12px ${MONO}`;
      g.fillStyle = 'rgba(200, 110, 128, .7)'; g.textAlign = 'center';
      g.fillText(father === 'breath' ? 'ДЫХАНИЕ' : father === 'snore' ? 'ХРАП' : father === 'pause' ? 'ТИШИНА' : '', W / 2, wy + H * .08 + 8);
      const vg = g.createRadialGradient(W / 2, H * .6, Math.min(W, H) * .25, W / 2, H * .6, Math.max(W, H) * .8);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${.6 + noise * .3})`);
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      if (noise > .6) { g.fillStyle = `rgba(120, 0, 20, ${(noise - .6) * .35})`; g.fillRect(0, 0, W, H); }
    }
  });
}
