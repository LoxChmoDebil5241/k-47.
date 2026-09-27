/* ==========================================================================
   ДЕСЯТЬ ГОТОВЫХ ФРАГМЕНТОВ из прототипа «Мини-игры» — сохранены и встроены:
   Счёт (Мантра), Ползти (Путь), Фото (Образ), Тир (Училище), Триумф,
   Отряд (Глубина), Рай (Тринадцать), Досье (Рациональность),
   Рация (Вторжение — теперь с посадкой в бурю), Остаточные данные (Плакальщики).
   Переведены на игровые часы (пауза замораживает всё) и общее ядро.
   ========================================================================== */
/* ==========================================================================
   Ф-01 · СЧЁТ — «Мантра». Ритм под сердцебиение, считать до десяти.
   ========================================================================== */
function gameCount(ctx) {
  const { scope, body } = ctx;
  if (document.activeElement) document.activeElement.blur();
  const C = ctx.canvas();
  const num = ctx.el('div', 'cnt-num', body, '<b></b><span></span>');
  const numB = $('b', num), numS = $('span', num);
  const WORDS = ['раз', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'];
  const WIN = 215;
  let interval = 900, count = 0, misses = 0, best = 0;
  let dread = 0, dreadT = 0, door = 0, doorT = 0, pulse = 0, hitGlow = 0;
  let lastTap = 0, over = false, state = 'intro', introLeft = 4;
  const beats = [];
  let nextBeatAt = ctx.now() + 1500;
  const fridge = scope.own(A.loopOsc({ type: 'sawtooth', freq: 50, vol: 0, lp: 160 }));
  fridge.vol(.01, 1.2);
  ctx.hint('ТАП / ПРОБЕЛ В ТАКТ СЕРДЦУ · КОЛЬЦО СЖИМАЕТСЯ К УДАРУ · СБИЛСЯ — СНАЧАЛА · 3 СБОЯ — ДВЕРЬ');
  const upd = () => ctx.stat(`СЧЁТ ${count}/10 · СБОИ ${misses}/3`);
  upd();
  ctx.say('Слушай сердце…', { pos: 'top' });

  return new Promise(resolve => {
    function schedule(now) {
      while (nextBeatAt - now < 170) {
        const b = { t: nextBeatAt, hit: false, judged: false, pulsed: false, intro: introLeft > 0, last: introLeft === 1 };
        if (introLeft > 0) introLeft--;
        beats.push(b);
        A.sfx.heartbeat(.5 + dread * .35, (nextBeatAt - now) / 1000);
        nextBeatAt += interval;
      }
    }
    function tap() {
      if (over) return;
      const now = ctx.now();
      if (now - lastTap < 110) return;
      lastTap = now;
      if (state !== 'play') return;
      let bestB = null, bd = 1e9;
      for (const b of beats) {
        if (b.intro || b.judged) continue;
        const d = Math.abs(now - b.t);
        if (d < bd) { bd = d; bestB = b; }
      }
      if (bestB && bd <= WIN) { bestB.hit = true; bestB.judged = true; good(); }
      else miss();
    }
    function good() {
      count++; best = Math.max(best, count); upd();
      numB.textContent = String(count); numS.textContent = WORDS[count - 1];
      numB.classList.remove('on'); void numB.offsetWidth; numB.classList.add('on');
      hitGlow = 1;
      A.tone({ f: 440 + count * 22, dur: .18, vol: .035, attack: .01 });
      if (Math.random() < .3) A.sfx.step(.06 + dread * .2, rand(.3, .9), rand(.15, .45));
      if (count >= 10) win();
    }
    function miss() {
      if (over) return;
      misses++; count = 0; upd();
      A.sfx.creak(.16 + misses * .07, .6);
      A.sfx.step(.22 + misses * .16, .55, .2);
      A.sfx.step(.22 + misses * .16, .5, .75);
      dreadT = misses / 3;
      interval = Math.max(560, interval * .87);
      numB.textContent = ''; numS.textContent = 'сбился… сначала';
      FX.shake('sm'); FX.flash('#300008', 350, .5);
      if (misses >= 3) lose();
    }
    async function win() {
      over = true; state = 'end';
      fridge.vol(.05, 1.5);
      await scope.wait(900);
      await ctx.line('Отец не входил.', { pos: 'top', ms: 1900 });
      await ctx.line('Шаги утонули в шуме старого холодильника.', { pos: 'top', ms: 2800 });
      resolve({ ok: 'ok', detail: `ДО ДЕСЯТИ · СБОЕВ: ${misses}` });
    }
    async function lose() {
      over = true; state = 'end'; doorT = 1;
      A.sfx.creak(.45, .7); A.sfx.thud(.5);
      await scope.wait(500);
      A.sfx.step(.6, .4); A.sfx.step(.7, .3, .55);
      FX.shake('lg');
      await ctx.line('С пронзительным скрежетом шлюз отъехал.', { pos: 'top', cls: 'red', ms: 2600 });
      resolve({ ok: 'fail', detail: `ДОСЧИТАНО ДО ${best}` });
    }

    scope.on(body, 'pointerdown', e => { e.preventDefault(); tap(); });
    scope.on(document, 'keydown', e => {
      if (e.repeat || e.key === 'Escape') return;
      if (e.code === 'Space' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); }
    });

    scope.loop(dt => {
      const now = ctx.now();
      if (!over) schedule(now);
      for (const b of beats) {
        if (!b.pulsed && now >= b.t) {
          b.pulsed = true; pulse = 1;
          if (b.last) { state = 'play'; ctx.say('Считай. Раз — на следующий удар.', { pos: 'top' }); scope.timeout(() => { if (state === 'play') ctx.unsay('top'); }, 1700); }
        }
        if (!over && !b.intro && !b.judged && now > b.t + WIN) { b.judged = true; if (!b.hit) miss(); }
      }
      while (beats.length && beats[0].t < now - 2500) beats.shift();
      dread += (dreadT - dread) * Math.min(1, dt * 1.6);
      door += (doorT - door) * Math.min(1, dt * 1.2);
      pulse = Math.max(0, pulse - dt * 3.2);
      hitGlow = Math.max(0, hitGlow - dt * 2.5);
      draw(now);
    });

    function draw(now) {
      const { g, W, H } = C;
      g.fillStyle = '#030102'; g.fillRect(0, 0, W, H);
      const fy = H * .74;
      // пол и стены — едва видны
      g.strokeStyle = 'rgba(120, 30, 40, .08)'; g.lineWidth = 1;
      for (let i = 0; i < 9; i++) { const y = fy + (H - fy) * Math.pow(i / 8, 1.6); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.fillStyle = 'rgba(40, 10, 14, .25)'; g.fillRect(0, fy - 1, W, 1);
      // шлюз справа
      const dx = W * .8, dw = Math.min(W * .14, 140), dtp = fy - Math.min(H * .56, 380);
      g.strokeStyle = `rgba(150, 40, 50, ${.12 + dread * .18})`; g.lineWidth = 2;
      g.strokeRect(dx, dtp, dw, fy - dtp);
      // полоска света под дверью
      const la = .06 + dread * .5 + pulse * .04;
      const lg = g.createLinearGradient(0, fy - 3, 0, fy + 26);
      lg.addColorStop(0, `rgba(255, 190, 150, ${la})`); lg.addColorStop(1, 'rgba(255, 190, 150, 0)');
      g.fillStyle = lg; g.fillRect(dx - 10, fy - 3, dw + 20, 30);
      if (dread > .3 && door < .1) {
        g.fillStyle = 'rgba(0, 0, 0, .85)';
        const off = Math.sin(now / 700) * 6;
        g.beginPath(); g.ellipse(dx + dw * .35 + off, fy - 1, dw * .1, 3, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(dx + dw * .65 + off, fy - 1, dw * .1, 3, 0, 0, Math.PI * 2); g.fill();
      }
      if (door > .01) {
        const ow = dw * .5 * door;
        g.fillStyle = `rgba(255, 170, 120, ${.5 * door})`; g.fillRect(dx, dtp, ow, fy - dtp);
        g.fillStyle = `rgba(255, 170, 120, ${.25 * door})`;
        g.beginPath(); g.moveTo(dx, fy); g.lineTo(dx + ow, fy); g.lineTo(dx - W * .3 * door, H); g.lineTo(dx - W * .5 * door, H); g.closePath(); g.fill();
        if (door > .5) { g.fillStyle = '#000'; g.fillRect(dx + ow * .25, dtp + (fy - dtp) * .12, ow * .5, (fy - dtp) * .88); g.beginPath(); g.arc(dx + ow * .5, dtp + (fy - dtp) * .1, ow * .22, 0, Math.PI * 2); g.fill(); }
      }
      // сердце и кольцо, сжимающееся к удару
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .085;
      const hg = g.createRadialGradient(cx, cy, 0, cx, cy, R * (2.4 + pulse));
      hg.addColorStop(0, `rgba(255, ${hitGlow > 0 ? 120 : 20}, 60, ${.18 + pulse * .45 + hitGlow * .2})`); hg.addColorStop(1, 'rgba(255, 0, 51, 0)');
      g.fillStyle = hg; g.beginPath(); g.arc(cx, cy, R * (2.4 + pulse), 0, Math.PI * 2); g.fill();
      g.strokeStyle = `rgba(255, 60, 90, ${.35 + pulse * .5})`; g.lineWidth = 2;
      g.beginPath(); g.arc(cx, cy, R * (1 + pulse * .12), 0, Math.PI * 2); g.stroke();
      const nb = beats.find(b => !b.pulsed);
      if (nb && !over) {
        const k = (nb.t - now) / interval;
        if (k > 0 && k < 1.15) {
          const rr = R * (1 + k * 2.6);
          g.strokeStyle = nb.intro ? `rgba(255, 180, 190, ${.5 * (1 - k)})` : `rgba(255, 240, 240, ${.85 * (1 - k * .7)})`;
          g.lineWidth = nb.intro ? 1.5 : 2.5;
          g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.stroke();
        }
      }
      // темнота сгущается со страхом
      const vg = g.createRadialGradient(cx, cy, Math.min(W, H) * .2, cx, cy, Math.max(W, H) * .75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${.55 + dread * .35})`);
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
    }
  });
}

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
      if (v > .12 && ctx.now() - warnT > 900) { warnT = ctx.now(); ctx.say(phase === 'freeze' ? 'Тише…' : 'Скрипнула половица…', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 900); }
      if (noise >= 1) lose();
    }
    function step(side) {
      if (over) return;
      if (phase === 'freeze') { addNoise(.3); return; }
      if (phase !== 'crawl') return;
      const now = ctx.now();
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
          father = 'pause'; pauseStart = ctx.now(); pauseEnd = crawlT + rand(1.6, 2.6);
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

/* ==========================================================================
   Ф-03 · ФОТО — «Образ». Собрать треснувшую карточку и стереть грязь.
   ========================================================================== */
function gamePhoto(ctx) {
  const { scope, body } = ctx;
  const LIMIT = 20;
  const PW = 480, PH = 600;
  const photo = Art.motherPhoto(PW, PH);
  const url = photo.toDataURL('image/jpeg', .9);
  const wrap = ctx.el('div', 'ph-wrap');
  const board = ctx.el('div', 'ph-board', wrap);
  const cap = ctx.el('p', 'ph-cap', wrap);
  let touches = 0, sel = -1, over = false;
  let perm;
  do { perm = shuffle([...Array(9).keys()]); } while (perm.filter((v, i) => v !== i).length < 7);
  const rots = perm.map(() => rand(-5, 5));
  const tiles = [];
  ctx.hint('ТАП — ВЫБРАТЬ КУСОК · ВТОРОЙ ТАП — ПОМЕНЯТЬ МЕСТАМИ · КАРТОНКА ВЕТШАЕТ');
  ctx.say('Отец швырнул её в угол. Она погнулась.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2600);

  function size() {
    const r = body.getBoundingClientRect();
    const w = Math.max(180, Math.min(r.width - 28, (r.height - 70) * .8, 460));
    board.style.width = `${w}px`;
    const tw = (w - 6 - 6) / 3;
    tiles.forEach(t => { t.style.width = `${tw}px`; t.style.height = `${tw * 1.25}px`; });
    return w;
  }
  function paint() {
    tiles.forEach((t, pos) => {
      const id = perm[pos], col = id % 3, row = Math.floor(id / 3);
      t.style.backgroundImage = `url(${url})`;
      t.style.backgroundPosition = `${col * 50}% ${row * 50}%`;
      const home = id === pos;
      t.classList.toggle('home', home);
      t.classList.toggle('sel', pos === sel);
      t.style.transform = home ? 'none' : `rotate(${rots[pos]}deg) scale(.96)`;
      t.setAttribute('aria-label', `Кусок ${pos + 1}${home ? ', на месте' : ''}${pos === sel ? ', выбран' : ''}`);
    });
    cap.textContent = `ПРИКОСНОВЕНИЙ ${touches} / ${LIMIT} · КАРТОНКА ВЕТШАЕТ`;
    ctx.stat(`НА МЕСТЕ ${perm.filter((v, i) => v === i).length}/9`);
  }
  for (let i = 0; i < 9; i++) {
    const t = ctx.el('button', 'ph-tile', board);
    t.style.setProperty('--r', `${rand(-60, 60)}deg`);
    tiles.push(t);
  }
  size(); paint();
  scope.on(window, 'resize', size);

  return new Promise(resolve => {
    tiles.forEach((t, pos) => scope.on(t, 'click', () => {
      if (over) return;
      if (sel < 0) { sel = pos; A.noise({ type: 'bandpass', freq: 3200, q: 1, dur: .05, vol: .06 }); paint(); return; }
      if (sel === pos) { sel = -1; paint(); return; }
      [perm[sel], perm[pos]] = [perm[pos], perm[sel]];
      [rots[sel], rots[pos]] = [rots[pos], rots[sel]];
      sel = -1; touches++;
      A.noise({ type: 'bandpass', freq: 1800, f2: 900, q: .8, dur: .18, vol: .08 });
      paint();
      if (perm.every((v, i) => v === i)) { over = true; solved(); }
      else if (touches >= LIMIT) { over = true; crumble(); }
    }));
    tiles[0].focus({ preventScroll: true });

    async function crumble() {
      A.sfx.tear();
      tiles.forEach((t, i) => { t.style.animationDelay = `${i * 70}ms`; t.classList.add('fall'); });
      await ctx.line('Картонка рассыпалась от прикосновений.', { pos: 'top', cls: 'red', ms: 2600 });
      resolve({ ok: 'fail', detail: `ПРИКОСНОВЕНИЙ ${touches}/${LIMIT}` });
    }
    async function solved() {
      A.sfx.chime(740, .06);
      board.style.transition = 'box-shadow .8s'; board.style.boxShadow = '0 0 60px rgba(255, 200, 150, .4), 0 20px 50px #000';
      await scope.wait(1100);
      scratch();
    }
    function scratch() {
      wrap.innerHTML = '';
      const w = parseFloat(board.style.width) || 300, h = w * 1.25;
      const box = ctx.el('div', 'ph-scr', wrap);
      box.style.width = `${w}px`; box.style.height = `${h}px`;
      const pc = document.createElement('canvas'), gc = document.createElement('canvas');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      [pc, gc].forEach(c => { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = `${w}px`; c.style.height = `${h}px`; box.appendChild(c); });
      gc.style.position = 'absolute'; gc.style.left = '0'; gc.style.top = '0'; gc.style.transition = 'opacity 1.4s';
      pc.getContext('2d').drawImage(photo, 0, 0, pc.width, pc.height);
      const g = gc.getContext('2d'); g.scale(dpr, dpr);
      const r = mulberry(99);
      g.fillStyle = 'rgba(58, 44, 30, .95)'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) {
        const x = r() * w, y = r() * h, s = w * (.02 + r() * .09);
        g.fillStyle = r() < .5 ? `rgba(30, 20, 12, ${.3 + r() * .4})` : `rgba(95, 75, 50, ${.2 + r() * .3})`;
        g.beginPath(); g.ellipse(x, y, s, s * (.5 + r()), r() * 3, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = 'rgba(20, 12, 8, .35)'; g.lineWidth = 1;
      for (let k = 0; k < 3; k++) { const fx = r() * w, fy2 = r() * h; for (let i = 1; i < 9; i++) { g.beginPath(); g.ellipse(fx, fy2, i * 3.2, i * 4.1, .4, 0, Math.PI * 2); g.stroke(); } }
      const cap2 = ctx.el('p', 'ph-cap', wrap);
      cap2.textContent = 'СОТРИ ГРЯЗЬ · 0%';
      ctx.hint('ВОДИ ПАЛЬЦЕМ ИЛИ МЫШЬЮ ПО ФОТО · ПРОБЕЛ — ПРОТЕРЕТЬ НАУГАД');
      const rub = scope.own(A.loopNoise({ type: 'bandpass', freq: 2400, q: .6, vol: 0 }));
      const probe = document.createElement('canvas'); probe.width = 40; probe.height = 50;
      const pg = probe.getContext('2d', { willReadFrequently: true });
      let down = false, last = null, cleared = 0, done = false, lastCheck = 0;
      const BR = w * .08;
      function wipe(x, y) {
        g.save(); g.globalCompositeOperation = 'destination-out';
        const rg = g.createRadialGradient(x, y, 0, x, y, BR);
        rg.addColorStop(0, 'rgba(0,0,0,.9)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(x, y, BR, 0, Math.PI * 2); g.fill(); g.restore();
      }
      function check() {
        pg.clearRect(0, 0, 40, 50); pg.drawImage(gc, 0, 0, 40, 50);
        const d = pg.getImageData(0, 0, 40, 50).data;
        let op = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 70) op++;
        cleared = 1 - op / 2000;
        cap2.textContent = `СОТРИ ГРЯЗЬ · ${Math.round(Math.min(1, cleared / .72) * 100)}%`;
        if (cleared >= .72 && !done) { done = true; reveal(); }
      }
      const pos = e => { const b = gc.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
      scope.on(gc, 'pointerdown', e => { e.preventDefault(); down = true; gc.setPointerCapture(e.pointerId); last = pos(e); wipe(...last); rub.vol(.05); });
      scope.on(gc, 'pointermove', e => {
        if (!down || done) return;
        const p = pos(e), dx = p[0] - last[0], dy = p[1] - last[1], dist = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(dist / (BR * .4)));
        for (let i = 1; i <= n; i++) wipe(last[0] + dx * i / n, last[1] + dy * i / n);
        last = p; rub.vol(.03 + Math.min(.06, dist * .004));
        const now = ctx.now(); if (now - lastCheck > 220) { lastCheck = now; check(); }
      });
      const up = () => { if (!down) return; down = false; rub.vol(0); check(); };
      scope.on(gc, 'pointerup', up); scope.on(gc, 'pointercancel', up);
      scope.on(document, 'keydown', e => { if ((e.code === 'Space' || e.key === 'Enter') && !done) { e.preventDefault(); for (let i = 0; i < 4; i++) wipe(rand(0, w), rand(0, h)); A.noise({ type: 'bandpass', freq: 2400, q: .6, dur: .2, vol: .05 }); check(); } });
      async function reveal() {
        rub.vol(0);
        gc.style.opacity = '0'; gc.style.pointerEvents = 'none';
        A.sfx.chime(523, .06); scope.timeout(() => A.sfx.chime(784, .05), 400);
        cap2.textContent = 'ТРАВА. НЕБО. ЖЕНЩИНА С КАРИМИ ГЛАЗАМИ.';
        await scope.wait(1400);
        await ctx.line('— Мама, — прошептал он в первый раз.', { pos: 'bot', ms: 2600 });
        await ctx.line('— Ты меня слышишь?', { pos: 'bot', ms: 1900 });
        await ctx.line('Фото молчало.', { pos: 'bot', ms: 1700 });
        await ctx.line('— Спокойной ночи, мама.', { pos: 'bot', ms: 2400 });
        resolve({ ok: 'ok', detail: `ПРИКОСНОВЕНИЙ ${touches}/${LIMIT}` });
      }
    }
  });
}

/* ==========================================================================
   Ф-04 · ТИР — «Училище». Дыхание, прицел, плавный спуск. Мишень всё равно порвут.
   ========================================================================== */
function gameTir(ctx) {
  const { scope, body } = ctx;
  if (document.activeElement) document.activeElement.blur();
  const C = ctx.canvas();
  const SHOTS = 7, NEED = 60;
  const meter = ctx.el('div', 'meter ice', body, 'ДЫХАНИЕ<div class="mb"><i></i></div>');
  meter.style.left = '14px'; meter.style.bottom = '14px';
  const mFill = $('i', meter);
  let L = { cx: 0, cy: 0, R: 1 };
  const layout = () => { L = { cx: C.W / 2, cy: C.H * .44, R: Math.min(C.W * .42, C.H * .26) }; };
  layout(); C.onResize = layout;
  let shots = 0, score = 0, holding = false, breath = 1, exhausted = false, fatigue = 0, t = 0, kick = 0, cool = 0, over = false, tear = -1, jolt = 0, beat = .9;
  const holes = [], floats = [];
  let rx = 0, ry = 0;
  const upd = () => ctx.stat(`ВЫСТРЕЛ ${shots}/${SHOTS} · ОЧКИ ${score}/${NEED}`);
  upd();
  ctx.hint('ЗАЖМИ — ЗАДЕРЖИ ДЫХАНИЕ · ОТПУСТИ — ВЫСТРЕЛ · ДЫХАНИЯ ~3 С, ПОТОМ ДРОЖЬ');
  ctx.say('Дыхание. Прицел. Плавный спуск.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2600);

  return new Promise(resolve => {
    const aim = makeAim(ctx, {
      start: [clamp(L.cx - L.R * 1.4, 30, C.W - 30), clamp(L.cy + L.R * 1.1, 30, C.H - 30)],
      onHold() { if (over || cool > 0) return; holding = true; if (!exhausted) A.noise({ type: 'lowpass', freq: 500, dur: .35, vol: .05 }); },
      onRelease() { if (!holding) return; holding = false; fire(); },
    });
    function fire() {
      if (over || cool > 0) return;
      const d = Math.hypot(rx - L.cx, ry - L.cy) / L.R;
      const pts = d < 1 ? 10 - Math.floor(d * 10) : 0;
      holes.push({ dx: (rx - L.cx) / L.R, dy: (ry - L.cy) / L.R });
      floats.push({ x: rx, y: ry, t: 0, s: pts ? `+${pts}` : 'МИМО' });
      score += pts; shots++; upd();
      A.sfx.pop(); kick = 1; cool = .6; fatigue += .1;
      if (shots >= SHOTS) end();
    }
    async function end() {
      over = true; holding = false;
      await scope.wait(1000);
      if (score >= NEED) {
        await ctx.line('Каримов подошёл. Держал мишень — всю в аккуратных пробоинах.', { pos: 'top', ms: 3000 });
        await ctx.line('— Комаров. Ты стреляешь как бог.', { pos: 'top', ms: 2300 });
        ctx.say('— Но богам здесь не место. Заруби себе на носу.', { pos: 'top', cls: 'red' });
        await scope.wait(1600);
        tear = 0; A.sfx.tear();
        await scope.wait(2600);
        ctx.unsay('top'); await scope.wait(400);
        await ctx.line('Бумага темнеет и расползается в луже. Он ничего не сказал.', { pos: 'top', ms: 2800 });
        resolve({ ok: 'ok', detail: `ОЧКИ ${score}/70` });
      } else {
        await ctx.line(`${score} из 70. Каримов даже не подошёл.`, { pos: 'top', cls: 'red', ms: 2600 });
        resolve({ ok: 'fail', detail: `ОЧКИ ${score}/70 · НУЖНО ${NEED}` });
      }
    }

    scope.loop(dt => {
      t += dt; aim.tick(dt);
      cool = Math.max(0, cool - dt); kick = Math.max(0, kick - dt * 4);
      if (holding && !exhausted) {
        breath -= dt / 3.1;
        if (breath <= 0) { breath = 0; exhausted = true; A.noise({ type: 'bandpass', freq: 900, q: 1, dur: .6, vol: .1, attack: .05 }); }
      } else {
        breath = Math.min(1, breath + dt * .28);
        if (exhausted && breath >= .45) exhausted = false;
      }
      const calm = holding && !exhausted;
      beat -= dt; if (beat <= 0) { beat = 60 / (72 + fatigue * 60); jolt = 1; }
      jolt = Math.max(0, jolt - dt * 7);
      const amp = L.R * .34 * (calm ? .3 : exhausted ? 1.5 : 1) * (1 + fatigue);
      let sx = amp * (.6 * Math.sin(t * .83) + .35 * Math.sin(t * 1.9 + 1.3) + .15 * Math.sin(t * 4.7));
      let sy = amp * (.55 * Math.cos(t * .71 + .5) + .35 * Math.sin(t * 1.57 + 2) + .15 * Math.cos(t * 5.3));
      if (exhausted) { sx += rand(-1, 1) * amp * .12; sy += rand(-1, 1) * amp * .12; }
      rx = aim.x + sx; ry = aim.y + sy - kick * L.R * .22 + jolt * L.R * .07;
      mFill.style.width = `${breath * 100}%`;
      meter.firstChild.textContent = exhausted ? 'ДЫХАНИЕ СБИЛОСЬ' : 'ДЫХАНИЕ';
      if (tear >= 0) tear = Math.min(1, tear + dt / 2.2);
      floats.forEach(f => { f.t += dt; });
      draw(calm);
    });

    function draw(calm) {
      const { g, W, H } = C, { cx, cy, R } = L;
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0e0a0b'); bg.addColorStop(.55, '#17110f'); bg.addColorStop(1, '#0a0707');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(160, 120, 100, .09)'; g.lineWidth = 1;
      const vy = cy - R * .2;
      for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(cx + i * R * .12, vy); g.lineTo(cx + i * W * .22, H); g.stroke(); }
      for (let i = 0; i < 3; i++) { const lx = W * (.2 + i * .3); const lg = g.createRadialGradient(lx, 0, 0, lx, 0, H * .5); lg.addColorStop(0, 'rgba(255, 230, 190, .13)'); lg.addColorStop(1, 'rgba(255, 230, 190, 0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H * .5); }
      // лужа
      g.fillStyle = 'rgba(20, 30, 40, .7)';
      g.beginPath(); g.ellipse(cx, H * .9, R * 1.1, R * .16, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(120, 150, 170, .12)'; g.stroke();
      // мишень (или две её половины)
      const drawTarget = () => {
        g.fillStyle = '#e6dfcb'; g.fillRect(cx - R * 1.15, cy - R * 1.15, R * 2.3, R * 2.3);
        for (let k = 1; k <= 10; k++) {
          const rr = R * (11 - k) / 10;
          if (k === 7) { g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.fill(); }
          g.strokeStyle = k >= 7 ? 'rgba(230, 225, 210, .7)' : 'rgba(20, 20, 20, .8)'; g.lineWidth = 1;
          g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.stroke();
        }
        g.fillStyle = 'rgba(20,20,20,.55)'; g.font = `${Math.max(8, R * .07)}px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (let k = 1; k <= 6; k++) g.fillText(String(k), cx, cy - R * (10.5 - k) / 10);
        holes.forEach(h => {
          const hx = cx + h.dx * R, hy = cy + h.dy * R, inBlack = Math.hypot(h.dx, h.dy) < .4;
          g.fillStyle = '#050505'; g.beginPath(); g.arc(hx, hy, Math.max(2.5, R * .028), 0, Math.PI * 2); g.fill();
          g.strokeStyle = inBlack ? 'rgba(240, 235, 220, .8)' : 'rgba(80, 60, 40, .6)'; g.lineWidth = 1;
          g.beginPath(); g.arc(hx, hy, Math.max(3.5, R * .036), 0, Math.PI * 2); g.stroke();
        });
      };
      if (tear < 0) drawTarget();
      else {
        const k = easeOut(tear);
        [-1, 1].forEach(s => {
          g.save();
          g.translate(s * k * R * .7, k * (H * .9 - cy) * .9);
          g.translate(cx, cy); g.rotate(s * k * .9); g.translate(-cx, -cy);
          g.beginPath();
          if (s < 0) { g.moveTo(cx - R * 1.2, cy - R * 1.2); g.lineTo(cx + 4, cy - R * 1.2); for (let i = 0; i <= 12; i++) g.lineTo(cx + (i % 2 ? 6 : -5), cy - R * 1.2 + i * R * .2); g.lineTo(cx - R * 1.2, cy + R * 1.2); }
          else { g.moveTo(cx + R * 1.2, cy - R * 1.2); g.lineTo(cx + 4, cy - R * 1.2); for (let i = 0; i <= 12; i++) g.lineTo(cx + (i % 2 ? 6 : -5), cy - R * 1.2 + i * R * .2); g.lineTo(cx + R * 1.2, cy + R * 1.2); }
          g.closePath(); g.clip();
          g.globalAlpha = 1 - k * .5;
          drawTarget();
          g.fillStyle = `rgba(20, 30, 40, ${k * .6})`; g.fillRect(cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6);
          g.restore();
        });
      }
      floats.forEach(f => {
        if (f.t > 1.2) return;
        g.globalAlpha = 1 - f.t / 1.2; g.fillStyle = f.s === 'МИМО' ? '#ff3355' : '#ffe0e6';
        g.font = `14px ${PIXEL}`; g.textAlign = 'center';
        g.fillText(f.s, f.x, f.y - 26 - f.t * 40); g.globalAlpha = 1;
      });
      if (!over) drawReticle(g, rx, ry, calm ? 'rgba(160, 230, 255, .95)' : exhausted ? 'rgba(255, 30, 60, 1)' : 'rgba(255, 70, 100, .9)', 16);
    }
  });
}

/* ==========================================================================
   Ф-05 · РУКИ НЕ СЛУШАЮТСЯ — «Триумф». Прицел не собирается. Решение за тобой.
   ========================================================================== */
function gameTriumph(ctx) {
  const { scope, body } = ctx;
  if (document.activeElement) document.activeElement.blur();
  const C = ctx.canvas();
  const meter = ctx.el('div', 'meter', body, 'ДЫХАНИЕ<div class="mb"><i></i></div>');
  meter.style.left = '14px'; meter.style.bottom = '14px';
  const mFill = $('i', meter);
  const ctl = ctx.el('div', 'ctl', body); ctl.hidden = true;
  const bPress = ctx.el('button', 'btn btn-primary big-btn', ctl, '1 · ЗАЖМУРИТЬСЯ И НАЖАТЬ');
  const bLower = ctx.el('button', 'btn big-btn', ctl, '2 · ОПУСТИТЬ ПИСТОЛЕТ');
  let t = 0, holding = false, breath = 1, headLift = 0, headT = 0, wave = -1, dark = 0, darkT = 0, over = false, choice = false, glitch = 0, lastNo = 0;
  let rx = 0, ry = 0;
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 46, vol: 0 }));
  hum.vol(.035, 2);
  ctx.hint('ПРИЦЕЛ — МЫШЬ / ПАЛЕЦ / СТРЕЛКИ · ЗАЖАТЬ — ЗАДЕРЖАТЬ ДЫХАНИЕ');
  ctx.stat('');

  return new Promise(resolve => {
    const aim = makeAim(ctx, {
      start: [C.W * .5, C.H * .45],
      onHold() { if (over) return; holding = true; },
      onRelease() {
        if (!holding) return; holding = false;
        if (!choice && !over && ctx.now() - lastNo > 1500) { lastNo = ctx.now(); ctx.say('Палец не слушается.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1300); }
      },
    });
    async function story() {
      await scope.wait(700);
      await ctx.line('Дверь не была заперта.', { pos: 'top', ms: 2000 });
      await ctx.line('Отец лежал на полу. Пьяный — так же, как всегда.', { pos: 'top', ms: 2700 });
      await ctx.line('Дыхание. Прицел. Плавный спуск.', { pos: 'top', ms: 3200 });
      await scope.wait(1800);
      headT = 1; A.sfx.creak(.12);
      await ctx.line('— Ты… — выдохнул он. — Ты… это…', { pos: 'top', ms: 2600 });
      await ctx.line('— Я… я не… я хотел…', { pos: 'top', ms: 2400 });
      await scope.wait(600);
      wave = 0;
      await ctx.line('Он поднял руку — грязную, дрожащую — и помахал. Один раз.', { pos: 'top', ms: 3200 });
      await ctx.line('«Я знаю. Ты прав», — сказал он без слов.', { pos: 'top', ms: 3000 });
      choice = true; ctl.hidden = false; bPress.focus({ preventScroll: true });
      ctx.hint('РЕШЕНИЕ — КНОПКИ ВНИЗУ ИЛИ 1 / 2');
    }
    story();
    async function press() {
      if (over || !choice) return;
      over = true; ctl.hidden = true; darkT = 1;
      ctx.say('Он зажмурился. Выдохнул.', { pos: 'mid', cls: 'ice' });
      await scope.wait(1300);
      ctx.unsay('mid');
      A.sfx.shot(.75); FX.flash('#ffffff', 900, 1); FX.shake('lg');
      hum.vol(0, .05);
      await scope.wait(2200);
      await ctx.line('Рука отца осталась поднятой. Потом упала.', { pos: 'mid', ms: 2800 });
      await ctx.line('— Прощай, — сказал он тихо. Не отцу. Себе.', { pos: 'mid', ms: 3000 });
      resolve({ ok: 'ok', detail: 'ВЫБОР: НАЖАТЬ' });
    }
    async function lower() {
      if (over || !choice) return;
      over = true; ctl.hidden = true;
      A.sfx.glitch(); glitch = 1; FX.flash('#ff0033', 600, .6);
      await ctx.line('Он опустил пистолет.', { pos: 'mid', ms: 2000 });
      A.sfx.glitch(); glitch = 1;
      ctx.say('НЕЙРОСЛЕПОК: РАСХОЖДЕНИЕ С ЗАПИСЬЮ', { pos: 'mid', cls: 'big red' });
      await scope.wait(2600);
      await ctx.line('Архив помнит выстрел. Эта версия будет помечена как искажённая.', { pos: 'bot', ms: 3200 });
      resolve({ ok: 'dist', detail: 'ВЫБОР: ОПУСТИТЬ' });
    }
    scope.on(bPress, 'click', press);
    scope.on(bLower, 'click', lower);
    scope.on(document, 'keydown', e => { if (e.key === '1') press(); else if (e.key === '2') lower(); });

    scope.loop(dt => {
      t += dt; aim.tick(dt);
      if (holding) breath = Math.max(0, breath - dt * 2.8); else breath = Math.min(1, breath + dt * .5);
      mFill.style.width = `${breath * 100}%`;
      meter.firstChild.textContent = holding && breath <= 0 ? 'ДЫХАНИЕ СБИЛОСЬ' : 'ДЫХАНИЕ';
      headLift += (headT - headLift) * Math.min(1, dt * .8);
      if (wave >= 0) wave = Math.min(1, wave + dt / 3.4);
      dark += (darkT - dark) * Math.min(1, dt * 3);
      glitch = Math.max(0, glitch - dt * .8);
      const amp = Math.min(C.W, C.H) * .075 * (1 + (holding ? .4 : 0));
      rx = aim.x + amp * (Math.sin(t * 1.3) * .5 + Math.sin(t * 3.1 + 1) * .3) + rand(-1, 1) * amp * .35;
      ry = aim.y + amp * (Math.cos(t * 1.1) * .5 + Math.sin(t * 2.7 + 2) * .3) + rand(-1, 1) * amp * .35;
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#060405'; g.fillRect(0, 0, W, H);
      const fy = H * .6;
      const fl = g.createLinearGradient(0, fy, 0, H); fl.addColorStop(0, '#120c0b'); fl.addColorStop(1, '#070504');
      g.fillStyle = fl; g.fillRect(0, fy, W, H - fy);
      // холодный свет из проёма за спиной
      g.fillStyle = 'rgba(170, 190, 210, .07)';
      g.beginPath(); g.moveTo(W * .35, fy); g.lineTo(W * .65, fy); g.lineTo(W * .95, H); g.lineTo(W * .05, H); g.closePath(); g.fill();
      // бутылки
      g.fillStyle = 'rgba(60, 90, 70, .35)';
      [[.2, .8, -.9], [.26, .86, .3], [.78, .78, 1.3]].forEach(([x, y, a]) => { g.save(); g.translate(W * x, H * y); g.rotate(a); g.fillRect(-4, -14, 8, 28); g.fillRect(-2, -20, 4, 7); g.restore(); });
      // отец
      const bx = W * .54, by = H * .74, s = Math.min(W, H) * .12;
      g.fillStyle = '#020202';
      g.beginPath(); g.ellipse(bx, by, s * 2, s * .42, -.05, 0, Math.PI * 2); g.fill();
      const hx = bx - s * 2.1, hy = by - s * .15 - headLift * s * .5;
      g.beginPath(); g.moveTo(bx - s * 1.5, by - s * .2); g.lineTo(hx + s * .2, hy + s * .2); g.lineTo(hx + s * .4, hy + s * .45); g.lineTo(bx - s * 1.2, by + s * .2); g.fill();
      g.beginPath(); g.arc(hx, hy, s * .36, 0, Math.PI * 2); g.fill();
      // рука: лежит → поднимается → машет → падает
      let ax = bx - s * .4, ay = by - s * .1, ex = ax + s * .8, ey = by + s * .15;
      if (wave >= 0) {
        const up = wave < .25 ? wave / .25 : wave < .75 ? 1 : 1 - (wave - .75) / .25;
        const wav = wave >= .3 && wave < .7 ? Math.sin((wave - .3) / .4 * Math.PI * 2) * .35 : 0;
        ex = ax + s * (.3 + wav); ey = ay - s * 1.6 * easeOut(up);
      }
      g.strokeStyle = '#020202'; g.lineWidth = s * .2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(ex, ey); g.stroke();
      g.beginPath(); g.arc(ex, ey, s * .14, 0, Math.PI * 2); g.fill();
      const vg = g.createRadialGradient(W / 2, H * .6, Math.min(W, H) * .2, W / 2, H * .6, Math.max(W, H) * .75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.8)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      if (!over) drawReticle(g, rx, ry, 'rgba(255, 60, 90, .9)', 20);
      if (glitch > 0) {
        for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,0,51' : '0,220,255'}, ${glitch * .35})`; g.fillRect(0, Math.random() * H, W, rand(2, 16)); }
      }
      if (dark > .01) { g.fillStyle = `rgba(0,0,0,${dark})`; g.fillRect(0, 0, W, H); }
    }
  });
}

/* ==========================================================================
   Ф-06 · ЗАПОМНИ ИХ — «Глубина». Пятнадцать шлемов, пятеро не поднимутся.
   ========================================================================== */
const SQUAD = [
  { n: '01', role: 'Командир', tr: 'седина на висках, дважды ранен' },
  { n: '02', role: 'Заместитель', tr: 'жуёт смолу, почти не моргает' },
  { n: '03', role: 'Стрелок', tr: '«Вектор», нервно смеётся перед боем' },
  { n: '04', role: 'Стрелок', tr: 'пистолет-пулемёт, напевает под нос' },
  { n: '05', role: 'Старик', tr: 'обрез, никогда не снимает шлем' },
  { n: '06', role: 'Пулемётчик', tr: 'пишет письма, которые не отправляет' },
  { n: '07', role: 'Медик', tr: 'раздаёт жгуты заранее' },
  { n: '08', role: 'Связист', tr: 'насвистывает, когда страшно' },
  { n: '09', role: 'Сапёр', tr: 'крестится перед прыжком' },
  { n: '10', role: 'Снайпер', tr: 'никогда не говорит первым' },
  { n: '11', role: 'Новичок', tr: 'первый цикл, трясутся руки' },
  { n: '12', role: 'Гранатомётчик', tr: 'шутит про погоду' },
  { n: '13', role: 'Разведчик', tr: 'наклейка с котом на шлеме' },
  { n: '14', role: 'Штурмовик', tr: 'трижды стучит по прикладу' },
];
const VISORS = ['#3fa9f5', '#ff5a3c', '#46e08a', '#f5d03f', '#b36cff', '#ff6ec7', '#9fb3c0'];
const MARKS = ['stripe', 'cross', 'dots', 'chip', 'band'];
function helmetSVG(h, { cracked = false, me = false } = {}) {
  const vis = me ? '#ff1a44' : h.visor;
  const mk = h.mark, mc = '#d9ccb0';
  let mark = '';
  if (mk === 'stripe') mark = `<rect x="55" y="12" width="10" height="42" fill="${mc}" opacity=".85"/>`;
  else if (mk === 'cross') mark = `<path d="M84 26h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill="#c9302c"/>`;
  else if (mk === 'dots') mark = `<circle cx="80" cy="30" r="4" fill="${mc}"/><circle cx="90" cy="36" r="4" fill="${mc}"/><circle cx="84" cy="44" r="4" fill="${mc}"/>`;
  else if (mk === 'chip') mark = `<path d="M22 44 L34 26 L40 34 L30 48 Z" fill="#11151a"/><path d="M26 42 L34 30" stroke="#6b737b" stroke-width="2"/>`;
  else if (mk === 'band') mark = `<path d="M17 50 C40 44 80 44 103 50 L103 56 C80 50 40 50 17 56 Z" fill="${mc}" opacity=".7"/>`;
  const cat = h.n === '13' ? '<g transform="translate(78 24)"><path d="M0 14 L2 2 L8 8 L14 8 L20 2 L22 14 C22 22 0 22 0 14Z" fill="#f2efe6"/><circle cx="7" cy="13" r="1.6" fill="#222"/><circle cx="15" cy="13" r="1.6" fill="#222"/></g>' : '';
  const crack = cracked ? '<path d="M48 58 L58 66 L53 73 L66 80 M58 66 L72 62" stroke="#f4f8fb" stroke-width="2.2" fill="none" stroke-linecap="round"/>' : '';
  return `<svg viewBox="0 0 120 104" aria-hidden="true">
    <path d="M14 70 C14 30 38 10 60 10 C82 10 106 30 106 70 L106 84 C106 90 100 94 94 94 L26 94 C20 94 14 90 14 84 Z" fill="${cracked ? '#22272c' : '#2d343b'}" stroke="#0b0e11" stroke-width="3"/>
    ${mark}${cat}
    <path d="M24 57 L96 57 L91 79 C79 85 41 85 29 79 Z" fill="${vis}" opacity="${cracked ? .45 : .9}"/>
    <path d="M30 61 L52 61" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>
    <text x="22" y="47" font-family="monospace" font-size="${me ? 12 : 14}" font-weight="700" fill="#e3e9ee">${esc(h.n)}</text>
    ${crack}
  </svg>`;
}

function gameSquad(ctx) {
  const { scope, body } = ctx;
  const combos = shuffle(VISORS.flatMap(v => MARKS.map(m => [v, m]))).slice(0, SQUAD.length);
  const squad = SQUAD.map((s, i) => ({ ...s, visor: combos[i][0], mark: combos[i][1] }));
  const me = { n: 'К-6', role: 'Ты', tr: 'запоминает всех', visor: '#ff1a44', mark: 'band', me: true };
  const order = shuffle([...squad]); order.splice(irand(4, 10), 0, me);
  const drill = scope.own(A.loopOsc({ type: 'sawtooth', freq: 47, vol: 0, lp: 220 }));
  const drillN = scope.own(A.loopNoise({ type: 'lowpass', freq: 300, q: .7, vol: 0 }));
  drill.vol(.05, .8); drillN.vol(.07, .8);
  const MEM = 35;
  let left = MEM;

  const wrap = ctx.el('div', 'sq');
  wrap.innerHTML = `<p class="sq-lead">К-6 запоминал их. Он делал это всегда. Чтобы помнить, кто они были.</p>`;
  const grid = ctx.el('div', 'sq-grid', wrap);
  order.forEach(h => {
    const c = ctx.el('div', `sq-card${h.me ? ' me' : ''}`, grid);
    c.innerHTML = `${helmetSVG(h, { me: h.me })}<span class="nm">${h.me ? 'К-6 · ТЫ' : `№${esc(h.n)} · ${esc(h.role.toUpperCase())}`}</span><span class="tr">${esc(h.tr)}</span>`;
  });
  const go = ctx.el('div', '', wrap); go.style.cssText = 'position:sticky;bottom:-12px;text-align:center;margin:14px -12px -12px;padding:12px;background:linear-gradient(0deg,#050002 60%,rgba(5,0,2,0))';
  const jump = ctx.el('button', 'btn btn-primary', go, 'К ПРЫЖКУ');
  ctx.hint('ЗАПОМНИ: НОМЕР, ВИЗОР, ПРИВЫЧКУ · ПОСЛЕ ПРЫЖКА НАЗОВИ ТЕХ, КТО НЕ ПОДНЯЛСЯ');
  const upd = () => ctx.stat(`ДО ПРЫЖКА ${Math.ceil(left)} С`);
  upd();

  return new Promise(resolve => {
    let phase = 'mem';
    const iv = scope.loop(dt => {
      if (phase !== 'mem') return false;
      left -= dt; upd();
      if (left <= 0) battle();
    });
    scope.on(jump, 'click', () => { A.sfx.click(); battle(); });
    async function battle() {
      if (phase !== 'mem') return;
      phase = 'battle'; iv();
      jump.disabled = true;
      ctx.stat('ПРОЙДЕНО!');
      drill.freq(90, .1); A.sfx.thud(.5);
      await scope.wait(300);
      drill.vol(0, .05); drillN.vol(0, .05);
      grid.classList.add('dark');
      ctx.say('— Пройдено! Первая волна — бегом!', { pos: 'mid', cls: 'red' });
      A.sfx.whoosh(.2);
      await scope.wait(1400);
      ctx.say('Их встретили шквальным огнём. Семнадцать. Восемнадцать. Он не успел сосчитать.', { pos: 'mid', cls: 'red' });
      for (let i = 0; i < 9; i++) {
        A.sfx.gunfire(irand(3, 7), .28); if (i % 3 === 0) FX.shake('sm');
        FX.flash(i % 2 ? '#ffcc88' : '#ff0033', 220, .35);
        await scope.wait(rand(260, 420));
      }
      ctx.unsay('mid');
      await scope.wait(700);
      await ctx.line('Штрек затих. Пятеро не поднялись.', { pos: 'mid', ms: 2400 });
      quiz();
    }
    async function quiz() {
      phase = 'quiz';
      wrap.remove();
      const fallen = shuffle(squad).slice(0, 5);
      let right = 0;
      const q = ctx.el('div', 'sq-q');
      ctx.hint('ВЫБЕРИ ПРИВЫЧКУ ТОГО, КТО ЛЕЖИТ ПЕРЕД ТОБОЙ · 1–4');
      for (let i = 0; i < fallen.length; i++) {
        const h = fallen[i];
        ctx.stat(`${i + 1}/5 · ВЕРНО ${right}`);
        const opts = shuffle([h.tr, ...shuffle(squad.filter(x => x !== h)).slice(0, 3).map(x => x.tr)]);
        q.innerHTML = `<div class="who">${helmetSVG(h, { cracked: true })}</div><p class="qt">№${esc(h.n)} · КТО ЭТО БЫЛ?</p><div class="opts"></div>`;
        const box = $('.opts', q);
        const pickOpt = await new Promise(res => {
          const btns = opts.map((o, k) => {
            const b = ctx.el('button', 'btn', box, `${k + 1} · ${esc(o)}`);
            b.addEventListener('click', () => res(k));
            return b;
          });
          btns[0].focus({ preventScroll: true });
          const kh = e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= 4) { document.removeEventListener('keydown', kh); res(k - 1); } };
          document.addEventListener('keydown', kh);
          scope.own(() => document.removeEventListener('keydown', kh));
        });
        const btns = $$('.btn', box);
        btns.forEach(b => { b.disabled = true; });
        const ok = opts[pickOpt] === h.tr;
        btns[opts.indexOf(h.tr)].classList.add('right');
        if (ok) { right++; A.sfx.chime(700, .05); }
        else { btns[pickOpt].classList.add('wrong'); A.sfx.buzz(); }
        ctx.stat(`${i + 1}/5 · ВЕРНО ${right}`);
        await scope.wait(ok ? 1100 : 1900);
      }
      q.innerHTML = '';
      if (right >= 4) {
        await ctx.line('Он запомнил их. Чтобы не забыть, когда их не станет.', { pos: 'mid', ms: 2800 });
        resolve({ ok: 'ok', detail: `НАЗВАНО ${right}/5` });
      } else {
        await ctx.line('Шлемы одинаковые. Лица стираются — как и его собственное.', { pos: 'mid', cls: 'red', ms: 2800 });
        resolve({ ok: 'fail', detail: `НАЗВАНО ${right}/5 · НУЖНО 4` });
      }
    }
  });
}

/* ==========================================================================
   Ф-07 · НЕ ПОДДАВАЙСЯ — «Тринадцать». Ложный рай тянет. Держись.
   ========================================================================== */
function gameParadise(ctx) {
  const { scope, body } = ctx;
  if (document.activeElement) document.activeElement.blur();
  const C = ctx.canvas();
  const meter = ctx.el('div', 'meter ok', body, 'ПОКОЙ<div class="mb"><i></i></div>');
  meter.style.left = '14px'; meter.style.top = '14px';
  const mFill = $('i', meter);
  const DUR = 24;
  let m = .22, e = 0, t = 0, reality = 0, over = false, whiteOut = 0, nextHand = 1.2, nextWhisper = .8, beatT = 0;
  const hands = [], whispers = [], taps = [];
  let blades = [];
  const WHISPERS = ['Отдохни, Кристиан…', 'Ты молодец…', 'Приляг…', 'Всё уже позади…', 'Всё хорошо…', 'Здесь тепло…', 'Закрой глаза…', 'Не надо больше…'];
  const build = () => {
    const n = clamp(Math.round(C.W * 1.1), 280, 900);
    blades = Array.from({ length: n }, () => {
      const y = C.H * (.56 + Math.pow(Math.random(), .8) * .46);
      return { x: Math.random() * C.W, y, h: (14 + Math.random() * 36) * (.5 + (y / C.H - .5) * 1.4), p: Math.random() * 6.28, hue: 80 + Math.random() * 40 };
    }).sort((a, b) => a.y - b.y);
  };
  build(); C.onResize = build;
  const pad = [220, 277.2, 329.6, 440].map(f => scope.own(A.loopOsc({ type: 'sine', freq: f, vol: 0 })));
  const wind = scope.own(A.loopNoise({ type: 'lowpass', freq: 700, q: .5, vol: 0 }));
  const alarm = scope.own(A.loopOsc({ type: 'square', freq: 440, vol: 0, lp: 1200 }));
  ctx.hint('ТАП / ПРОБЕЛ — СОПРОТИВЛЯТЬСЯ · ТАП ПО РУКЕ — ОТТОЛКНУТЬ · ПРОДЕРЖИСЬ 24 С');

  return new Promise(resolve => {
    function resist(x, y) {
      if (over) return;
      const now = ctx.now();
      while (taps.length && now - taps[0] > 1000) taps.shift();
      if (taps.length >= 8) return;
      taps.push(now);
      reality = 1;
      const hit = x != null ? hands.findIndex(h => Math.hypot(h.x - x, h.y - y) < h.r * 1.35) : -1;
      if (hit >= 0) { hands.splice(hit, 1); m -= .07; A.tone({ f: 240, f2: 80, type: 'square', dur: .14, vol: .05 }); }
      else { m -= .026; A.tone({ f: 180, f2: 120, type: 'square', dur: .05, vol: .03 }); }
      m = Math.max(0, m);
    }
    scope.on(body, 'pointerdown', ev => { ev.preventDefault(); const r = body.getBoundingClientRect(); resist(ev.clientX - r.left, ev.clientY - r.top); });
    scope.on(document, 'keydown', ev => { if (ev.code === 'Space' && !ev.repeat) { ev.preventDefault(); resist(null, null); } });

    async function win() {
      over = true;
      A.sfx.whisper(2, .12);
      whiteOut = 1; FX.flash('#ffffff', 1400, 1);
      await scope.wait(900);
      FX.flash('#88ddff', 500, .8); A.sfx.thud(.6); FX.shake('lg');
      pad.forEach(p => p.vol(0, .05)); wind.vol(0, .05); alarm.vol(0, .05);
      whiteOut = 2;
      await scope.wait(900);
      await ctx.line('Трава обернулась сотнями ледяных игл.', { pos: 'mid', cls: 'ice', ms: 2400 });
      await ctx.line('Очередной жизни.', { pos: 'mid', cls: 'big', ms: 1900 });
      await ctx.line('Тринадцатой.', { pos: 'mid', cls: 'big red', ms: 2200 });
      resolve({ ok: 'ok', detail: `ВОЛЯ НА ФИНИШЕ ${Math.round((1 - m) * 100)}%` });
    }
    async function lose() {
      over = true;
      A.sfx.whisper(2.4, .14);
      await ctx.line('Всё хорошо…', { pos: 'mid', ms: 2000 });
      await ctx.line('Он прилёг. Трава была тёплой. Больше ничего не было.', { pos: 'mid', ms: 2800 });
      resolve({ ok: 'fail', detail: `СДАЛСЯ НА ${Math.round(e)} С ИЗ ${DUR}` });
    }

    scope.loop(dt => {
      t += dt;
      if (!over) {
        e += dt;
        m += (.05 + .09 * (e / DUR)) * dt;
        nextHand -= dt;
        if (nextHand <= 0) {
          nextHand = rand(.9, 1.6) * (1 - e / DUR * .35);
          const side = irand(0, 3), r = Math.min(C.W, C.H) * rand(.06, .085);
          const p = side === 0 ? [-r, rand(0, C.H)] : side === 1 ? [C.W + r, rand(0, C.H)] : side === 2 ? [rand(0, C.W), C.H + r] : [rand(0, C.W), -r];
          hands.push({ x: p[0], y: p[1], r, sp: rand(38, 62) * (1 + e / DUR * .6), ph: Math.random() * 6 });
        }
        const cx = C.W / 2, cy = C.H * .58, rc = Math.min(C.W, C.H) * .12;
        for (let i = hands.length - 1; i >= 0; i--) {
          const h = hands[i], dx = cx - h.x, dy = cy - h.y, d = Math.hypot(dx, dy);
          h.x += dx / d * h.sp * dt; h.y += dy / d * h.sp * dt;
          if (d < rc) { hands.splice(i, 1); m += .09; A.sfx.whisper(.9, .08, rand(-.5, .5)); }
        }
        nextWhisper -= dt;
        if (nextWhisper <= 0) { nextWhisper = rand(1.6, 2.8); whispers.push({ s: pick(WHISPERS), x: rand(.15, .85), y: rand(.2, .75), t: 0 }); A.sfx.whisper(1.2, .06, rand(-.6, .6)); }
        if (m >= 1) { m = 1; lose(); }
        else if (e >= DUR) win();
        ctx.stat(`ВОЛЯ ${Math.round((1 - m) * 100)}% · ${Math.max(0, Math.ceil(DUR - e))} С`);
      }
      reality = Math.max(0, reality - dt * 3);
      whispers.forEach(w => { w.t += dt; });
      while (whispers.length && whispers[0].t > 3.2) whispers.shift();
      mFill.style.width = `${m * 100}%`;
      pad.forEach((p, i) => p.vol(over && whiteOut === 2 ? 0 : m * (.045 - i * .006)));
      wind.vol(.02 + m * .05); alarm.vol(reality * .035);
      beatT -= dt;
      if (beatT <= 0 && !over) { A.sfx.heartbeat(.28); beatT = 60 / lerp(118, 48, m); }
      draw();
    });

    const mix = (a, b, k) => `rgb(${Math.round(lerp(a[0], b[0], k))}, ${Math.round(lerp(a[1], b[1], k))}, ${Math.round(lerp(a[2], b[2], k))})`;
    function draw() {
      const { g, W, H } = C;
      const k = clamp(m, 0, 1), end = clamp((e - DUR + 5) / 5, 0, 1);
      if (whiteOut === 2) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return; }
      const sky = g.createLinearGradient(0, 0, 0, H * .6);
      sky.addColorStop(0, mix([20, 4, 7], [150, 200, 230], k)); sky.addColorStop(1, mix([45, 10, 14], [255, 240, 205], k));
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      const sr = Math.max(W, H) * (.25 + k * .3 + end * .6);
      const sun = g.createRadialGradient(W / 2, H * .18, 0, W / 2, H * .18, sr);
      sun.addColorStop(0, `rgba(255, 250, 225, ${.25 + k * .55 + end * .3})`); sun.addColorStop(1, 'rgba(255, 250, 225, 0)');
      g.fillStyle = sun; g.fillRect(0, 0, W, H);
      g.fillStyle = mix([30, 8, 10], [90, 150, 70], k); g.fillRect(0, H * .56, W, H * .44);
      g.lineWidth = 1.5;
      for (const b of blades) {
        const sw = Math.sin(t * 1.3 + b.p + b.x * .01) * b.h * .25;
        g.strokeStyle = k > .15 ? `hsla(${b.hue}, ${30 + k * 30}%, ${18 + k * 30}%, .9)` : 'rgba(70, 18, 22, .8)';
        g.beginPath(); g.moveTo(b.x, b.y); g.quadraticCurveTo(b.x + sw * .4, b.y - b.h * .6, b.x + sw, b.y - b.h); g.stroke();
      }
      hands.forEach(h => {
        const a = Math.atan2(C.H * .58 - h.y, W / 2 - h.x);
        const hg = g.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r * 1.6);
        hg.addColorStop(0, 'rgba(255, 244, 225, .55)'); hg.addColorStop(1, 'rgba(255, 244, 225, 0)');
        g.fillStyle = hg; g.beginPath(); g.arc(h.x, h.y, h.r * 1.6, 0, Math.PI * 2); g.fill();
        g.save(); g.translate(h.x, h.y); g.rotate(a);
        g.fillStyle = 'rgba(255, 246, 232, .5)';
        g.beginPath(); g.ellipse(0, 0, h.r * .7, h.r * .55, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255, 246, 232, .55)'; g.lineWidth = h.r * .16; g.lineCap = 'round';
        for (let i = -1.5; i <= 1.5; i++) { g.beginPath(); g.moveTo(h.r * .5, i * h.r * .2); g.lineTo(h.r * (1.15 + Math.sin(t * 3 + i + h.ph) * .08), i * h.r * .26); g.stroke(); }
        g.beginPath(); g.moveTo(0, -h.r * .45); g.lineTo(h.r * .45, -h.r * .85); g.stroke();
        g.restore();
      });
      g.textAlign = 'center'; g.font = `${Math.max(14, Math.min(W, H) * .032)}px ${MONO}`;
      whispers.forEach(w => {
        const al = w.t < .6 ? w.t / .6 : Math.max(0, 1 - (w.t - .6) / 2.6);
        g.fillStyle = `rgba(255, 252, 240, ${al * (.5 + k * .5)})`;
        g.fillText(w.s, W * w.x, H * w.y - w.t * 10);
      });
      if (reality > 0) {
        g.fillStyle = `rgba(160, 0, 20, ${reality * .4})`; g.fillRect(0, 0, W, H);
        g.fillStyle = `rgba(0, 0, 0, ${reality * .35})`;
        for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
      }
      if (end > 0) { g.fillStyle = `rgba(255, 255, 250, ${end * .8})`; g.fillRect(0, 0, W, H); }
    }
  });
}

/* ==========================================================================
   Ф-08 · ГОДЕН / БРАК — «Рациональность». Ты — аналитик «Купола-7».
   ========================================================================== */
function gamePapers(ctx) {
  const { scope } = ctx;
  const N = 7, TIME = 120;
  const fmt = n => n.toLocaleString('ru-RU');
  const pct = x => `${x.toFixed(2).replace('.', ',')}%`;
  const EMO_OK = ['нет', 'контролируемые'], EMO_BAD = ['выраженные', 'критические'];
  const OBS = ['Смотрит в стекло капсулы дольше нормы.', 'Считает вслух при пробуждении.', 'Просит вернуть фотографию.', 'Спрашивает, какой сегодня год.',
    'Задерживает дыхание перед командой.', 'Жалоб нет.', 'Жалоб нет.', 'Повторяет чужое имя во сне.', 'Вежлив. Слишком.', 'Не смотрит в глаза персоналу.'];
  const pp = ctx.el('div', 'pp');
  ctx.el('aside', 'pp-rules', pp, `<h3>НОРМАТИВ ЦИКЛА 48</h3><ol>
    <li>Стабильность нейропрофиля — <b>не ниже 60%</b>.</li>
    <li>Стоимость регенерации — <b>не выше 4&nbsp;800 кр.</b></li>
    <li>Остаточная память — <b>не выше 0,50%</b>.</li>
    <li>Эмоциональные отклонения — только <b>«нет»</b> или <b>«контролируемые»</b>.</li>
    <li>Биометрическая метка <b>совпадает</b> с серией.</li></ol>
    <p style="margin:.6rem 0 0;color:#6f9ab8">Нарушен хотя бы один пункт — УТИЛИЗАЦИЯ.</p>`);
  const desk = ctx.el('div', 'pp-desk', pp);
  const timer = ctx.el('div', 'pp-timer', desk, '<i></i>');
  const slot = ctx.el('div', '', desk); slot.style.cssText = 'position:relative;width:min(440px,100%);display:flex;justify-content:center';
  const sayEl = ctx.el('p', 'pp-say', desk);
  const btns = ctx.el('div', 'pp-btns', desk);
  const bG = ctx.el('button', 'btn btn-ok', btns, '← ГОДЕН');
  const bB = ctx.el('button', 'btn btn-primary', btns, 'УТИЛИЗАЦИЯ →');
  const log = ctx.el('aside', 'pp-log', pp, '<h3>ЖУРНАЛ · М. ВАЙС</h3>');
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 60, vol: 0 }));
  const air = scope.own(A.loopNoise({ type: 'lowpass', freq: 500, q: .4, vol: 0 }));
  hum.vol(.018, 1); air.vol(.03, 1);
  ctx.hint('СВЕРЬ ДОСЬЕ С НОРМАТИВОМ · ← / 1 — ГОДЕН · → / 2 — УТИЛИЗАЦИЯ');

  const nums = shuffle([...Array(46).keys()].map(i => i + 1)).slice(0, N);
  const badPlan = shuffle([true, true, true, false, false, false, Math.random() < .5]);
  function make(num, bad) {
    const d = { ser: num, bm: num, cycles: irand(3, 44), stab: irand(61, 96), cost: irand(31, 47) * 100, mem: +rand(.05, .49).toFixed(2), emo: pick(EMO_OK), obs: pick(OBS), bad: [] };
    if (bad) {
      shuffle(['stab', 'cost', 'mem', 'emo', 'bm']).slice(0, Math.random() < .2 ? 2 : 1).forEach(k => {
        if (k === 'stab') { d.stab = irand(38, 59); d.bad.push(`стабильность ${d.stab}%`); }
        if (k === 'cost') { d.cost = irand(49, 66) * 100; d.bad.push(`стоимость ${fmt(d.cost)} кр.`); }
        if (k === 'mem') { d.mem = +rand(.52, 1.4).toFixed(2); d.bad.push(`память ${pct(d.mem)}`); }
        if (k === 'emo') { d.emo = pick(EMO_BAD); d.bad.push(`отклонения «${d.emo}»`); }
        if (k === 'bm') { let x; do { x = irand(1, 46); } while (x === num); d.bm = x; d.bad.push(`метка K-${x} ≠ К-${num}`); }
      });
    } else if (Math.random() < .45) {
      const k = pick(['stab', 'cost', 'mem']);
      if (k === 'stab') d.stab = 60; if (k === 'cost') d.cost = 4800; if (k === 'mem') d.mem = .5;
    }
    return d;
  }
  const queue = nums.map((n, i) => make(n, badPlan[i]));
  let idx = 0, right = 0, busy = false, left = TIME, over = false, card = null;
  const upd = () => ctx.stat(`ДОСЬЕ ${Math.min(idx + 1, N + 1)}/${N + 1} · ВЕРНО ${right}`);

  function cardHTML(d, i, special) {
    return `<div class="hd"><span>ДОСЬЕ АКТИВА · КУПОЛ-7</span><span>${i + 1}/${N + 1}</span></div>
      <div class="ser"><div class="face"><canvas width="116" height="140"></canvas></div><div><div class="big">К-${d.ser}</div>
      <div style="margin-top:.35rem;color:#4a4f5a">МЕТКА: BM-K-${d.bm}</div><div style="color:#4a4f5a">ЦИКЛОВ: ${d.cycles}</div></div></div>
      <dl><dt>Стабильность</dt><dd>${special ? 'КРИТИЧЕСКАЯ' : d.stab + '%'}</dd>
      <dt>Регенерация</dt><dd>${fmt(d.cost)} кр.</dd>
      <dt>Остаточная память</dt><dd>${pct(d.mem)}</dd>
      <dt>Отклонения</dt><dd>${esc(d.emo)}</dd></dl>
      <p class="obs">Наблюдатель: «${esc(d.obs)}»</p>`;
  }
  function show() {
    const special = idx === N;
    const d = special ? { ser: 47, bm: 47, cycles: 47, cost: 4200, mem: .47, emo: 'выраженные', obs: 'Задаёт вопросы. Последний: «За что?» Активность нейросети 94%.' } : queue[idx];
    slot.innerHTML = '';
    card = ctx.el('div', `pp-card${special ? ' k47' : ''}`, slot, cardHTML(d, idx, special));
    { const fc = $('.face canvas', card), fg = fc.getContext('2d'); fg.fillStyle = special ? '#e2c4c6' : '#cdbfc2'; fg.fillRect(0, 0, 116, 140); Art.profile(fg, 54, 14, 128, { seed: d.ser, eyeGlow: 0.5, blood: special ? 0.5 : 0 }); Art.grain(fg, 0, 0, 116, 140, 0.2, true); }
    A.noise({ type: 'bandpass', freq: 1500, f2: 700, q: .8, dur: .25, vol: .07 });
    if (special) { A.sfx.glitch(); sayEl.textContent = 'Градов отрывается от стены и смотрит на твою руку.'; }
    busy = false; upd();
  }
  return new Promise(resolve => {
    async function stamp(good) {
      if (busy || over || !card) return;
      busy = true;
      A.sfx.stamp();
      const s = ctx.el('div', `pp-stamp ${good ? 'g' : 'b'}`, card, good ? 'ГОДЕН' : 'УТИЛИЗАЦИЯ');
      s.style.setProperty('--rot', '-14deg');
      if (idx === N) { finale(good); return; }
      const d = queue[idx], correct = good === (d.bad.length === 0);
      if (correct) { right++; ctx.el('p', 'y', log, `К-${d.ser} · ${good ? 'ГОДЕН' : 'УТИЛ.'} · ✓`); sayEl.textContent = pick(['Вайс кивает.', 'Айрин что-то записывает.', 'Экономия зафиксирована.']); }
      else {
        ctx.el('p', 'n', log, `К-${d.ser} · ${good ? 'ГОДЕН' : 'УТИЛ.'} · ✗ ${good ? d.bad.join(', ') : 'нарушений нет'}`);
        sayEl.textContent = good ? `Фогель хмурится: ${d.bad.join(', ')}.` : 'Вайс: — Минус четыре тысячи. Он был годен.';
        A.sfx.buzz();
      }
      log.scrollTop = log.scrollHeight;
      await scope.wait(750);
      card.classList.add('out');
      await scope.wait(420);
      idx++;
      show();
    }
    async function finale(good) {
      over = true;
      ctx.el('p', 'w', log, `К-47 · ${good ? 'ГОДЕН' : 'УТИЛ.'} · ?`);
      await scope.wait(1300);
      A.sfx.stamp();
      const s = ctx.el('div', 'pp-stamp x', card, 'ПРОДОЛЖИТЬ ЦИКЛ');
      s.style.setProperty('--rot', '9deg');
      sayEl.textContent = 'Градов: — Продолжить. Данных недостаточно.';
      ctx.el('p', 'w', log, 'К-47 · решение оператора отменено');
      log.scrollTop = log.scrollHeight;
      await scope.wait(2800);
      sayEl.textContent = '«Когда вы решите, что данных достаточно?»';
      await scope.wait(2600);
      const ok = right >= N - 1;
      resolve(ok ? { ok: 'ok', detail: `ВЕРНО ${right}/${N}` } : { ok: 'fail', detail: `ВЕРНО ${right}/${N} · НУЖНО ${N - 1}` });
    }
    scope.on(bG, 'click', () => stamp(true));
    scope.on(bB, 'click', () => stamp(false));
    scope.on(document, 'keydown', e => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key === '1') { e.preventDefault(); stamp(true); }
      else if (e.key === 'ArrowRight' || e.key === '2') { e.preventDefault(); stamp(false); }
    });
    show();
    bG.focus({ preventScroll: true });
    const tb = $('i', timer);
    scope.loop(dt => {
      if (over) return false;
      left -= dt;
      tb.style.width = `${Math.max(0, left / TIME) * 100}%`;
      if (left <= 0) {
        over = true;
        sayEl.textContent = 'Смена окончена. Фогель смотрит на дверь.';
        A.sfx.buzz();
        scope.timeout(() => resolve({ ok: 'fail', detail: `НЕ УСПЕЛ · ВЕРНО ${right}/${N}` }), 2200);
        return false;
      }
    });
  });
}

/* ==========================================================================
   Ф-09 · РАЦИЯ — «Вторжение». Поймать эфир сквозь глушилку.
   ========================================================================== */
function gameRadioJam(ctx) {
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

/* ==========================================================================
   Ф-10 · ОСТАТОЧНЫЕ ДАННЫЕ — «Пробуждение». Поймать, что унесёшь в К-48.
   ========================================================================== */
function gameResidual(ctx) {
  const { scope } = ctx;
  const DUR = 22, SLOTS = 3;
  const aw = ctx.el('div', 'aw');
  const hud = ctx.el('div', 'aw-hud', aw);
  const field = ctx.el('div', '', aw); field.style.cssText = 'position:absolute;inset:0;z-index:4';
  const slotsEl = ctx.el('div', 'aw-slots', aw);
  const slots = Array.from({ length: SLOTS }, () => ctx.el('div', 'aw-slot', slotsEl, 'ПУСТО'));
  const voice = ctx.el('p', 'aw-voice', aw);
  const bub = scope.own(A.loopNoise({ type: 'lowpass', freq: 380, q: 1.4, vol: 0 }));
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 58, vol: 0 }));
  bub.vol(.05, 1.5); hum.vol(.03, 1.5);
  const strong = GAMES.map((F, k) => ({ F, k })).filter(({ F, k }) => F.mem && (chStatus(k) === 'ok' || chStatus(k) === 'dist')).map(({ F, k }) => ({ label: F.mem, id: F.id }));
  // спрятанное при передаче актива и камушек из кармана — тоже сильные воспоминания
  G.diverted.forEach(label => { if (!strong.some(s => s.label === label)) strong.push({ label, id: 'diverted' }); });
  if (chStatus(25) === 'ok' && !strong.some(s => /КАМУШ/.test(s.label))) strong.push({ label: 'СЕРЫЙ КАМУШЕК', id: 'stone' });
  const WEAK = ['МАМА', 'ТРАВА', 'РАЗ, ДВА, ТРИ…', 'ЛАДОНЬ НА ПЛЕЧЕ', '«НОРМАЛЬНО, КОМАРОВ»', 'МЕТИНА', 'ЗВЕЗДА НА ЗАПАДЕ'];
  const JUNK = ['▒▒▒▒▒', 'ERR_0x47', '░░ШУМ░░', 'NULL', '▓▓▓ ▓▓', 'К-4█'];
  const caught = [];
  const mems = [];
  let e = 0, spawnT = .6, over = false, beatT = 0, tickT = 1;
  const rows = [['СИСТЕМА КАПСУЛЫ КР-48', ''], ['РЕГЕНЕРАЦИЯ БИОМАССЫ', '100%'], ['НЕЙРОПРОФИЛЬ К-47 → К-48', 'ЗАГРУЗКА'], ['ПАМЯТЬ ЦИКЛА 47', 'УДАЛЕНИЕ 0%'], ['ОСТАТОЧНЫЕ ДАННЫЕ', '0,00%']];
  const hudB = [];
  rows.forEach(([k, v], i) => scope.timeout(() => {
    const p = ctx.el('p', '', hud, '<span></span><b></b>');
    p.firstChild.textContent = k; p.lastChild.textContent = v; hudB[i] = p.lastChild;
    A.sfx.beep(i === 3 ? 520 : 1400, .06, .04);
  }, 300 + i * 450));
  ctx.hint('ЛОВИ ВОСПОМИНАНИЯ КАСАНИЕМ · 3 ЯЧЕЙКИ · ПУНКТИР — ШУМ, НЕ ЛОВИ');
  if (!strong.length) { ctx.say('Восстановленных фрагментов нет — воспоминания будут бледными.', { pos: 'mid', cls: 'ice' }); scope.timeout(() => ctx.unsay('mid'), 3200); }
  const realCount = () => caught.filter(c => !c.junk).length;
  const resid = () => (realCount() * .47 / SLOTS).toFixed(2).replace('.', ',');

  return new Promise(resolve => {
    function spawn() {
      const r = Math.random();
      let kind, label, id = null;
      if (r < .3) { kind = 'junk'; label = pick(JUNK); }
      else if (strong.length && r < .72) { kind = 'strong'; const s = pick(strong); label = s.label; id = s.id; }
      else { kind = 'weak'; label = pick(WEAK); }
      if (mems.some(m => m.label === label && m.alive) || (kind !== 'junk' && caught.some(c => c.label === label))) return;
      const b = document.createElement('button');
      b.className = `mem${kind === 'weak' ? ' dim' : ''}${kind === 'junk' ? ' junk' : ''}`;
      b.textContent = label;
      field.appendChild(b);
      const fw = field.clientWidth, fh = field.clientHeight;
      const m = { b, label, id, kind, alive: true, t: 0, life: kind === 'strong' ? 5.6 : kind === 'weak' ? 3.8 : 4.6, x: rand(.06, .72) * fw, y: rand(.3, .72) * fh, vy: -rand(12, 26), vx: rand(-8, 8) };
      mems.push(m);
      b.addEventListener('click', () => grab(m));
      b.setAttribute('aria-label', `Воспоминание: ${label}`);
    }
    function grab(m) {
      if (!m.alive || over) return;
      if (caught.length >= SLOTS) { A.sfx.buzz(); return; }
      m.alive = false; m.b.classList.add('caught');
      scope.timeout(() => m.b.remove(), 520);
      caught.push({ label: m.kind === 'junk' ? 'ШУМ' : m.label, id: m.id, junk: m.kind === 'junk' });
      const s = slots[caught.length - 1];
      s.textContent = m.kind === 'junk' ? 'ШУМ' : m.label;
      s.className = `aw-slot full${m.kind === 'junk' ? ' junk' : ''}`;
      if (m.kind === 'junk') A.sfx.glitch(); else A.sfx.chime(m.kind === 'strong' ? 880 : 660, .06);
      if (hudB[4]) hudB[4].textContent = `${resid()}%`;
      if (caught.length >= SLOTS) scope.timeout(() => finish(), 900);
    }
    async function finish() {
      if (over) return;
      over = true;
      mems.forEach(m => { if (m.alive) { m.alive = false; m.b.style.transition = 'opacity .8s, filter .8s'; m.b.style.opacity = '0'; m.b.style.filter = 'blur(6px)'; } });
      if (hudB[3]) hudB[3].textContent = 'УДАЛЕНА';
      if (hudB[2]) hudB[2].textContent = 'ЗАГРУЖЕН';
      A.sfx.heartbeat(.5);
      await scope.wait(1500);
      voice.textContent = `К-${G.cycle + 1}. Подъём.`;
      voice.classList.add('show');
      A.sfx.mumble(1.4, .72, .12);
      await scope.wait(3200);
      const real = caught.filter(c => !c.junk);
      if (real.length) {
        Store.set(KEYS.res, { from: G.cycle, to: G.cycle + 1, items: real.map(c => ({ id: c.id, label: c.label })), t: Date.now() });
        resolve({ ok: 'ok', detail: `ОСТАТОЧНЫЕ ДАННЫЕ ${resid()}%`, note: `Я унёс с собой: ${real.map(c => c.label.toLowerCase()).join(', ')}.` });
      } else {
        resolve({ ok: 'fail', detail: caught.length ? 'УНЕСЁН ТОЛЬКО ШУМ' : 'НИЧЕГО НЕ УНЕСЕНО' });
      }
    }
    scope.loop(dt => {
      if (!over) {
        e += dt;
        spawnT -= dt;
        if (spawnT <= 0) { spawnT = rand(.5, .85); spawn(); }
        const p = Math.min(100, Math.round(e / DUR * 100));
        if (hudB[3]) hudB[3].textContent = `УДАЛЕНИЕ ${p}%`;
        tickT -= dt; if (tickT <= 0) { tickT = 1; A.sfx.beep(1500, .03, .02); }
        beatT -= dt; if (beatT <= 0) { beatT = 1.1; A.sfx.heartbeat(.22); }
        ctx.stat(`ЯЧЕЕК ${caught.length}/${SLOTS} · УДАЛЕНИЕ ${p}%`);
        if (e >= DUR) finish();
      }
      mems.forEach(m => {
        if (!m.alive) return;
        m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt;
        const k = m.t / m.life, a = k < .12 ? k / .12 : k > .6 ? Math.max(0, 1 - (k - .6) / .4) : 1;
        m.b.style.transform = `translate(${m.x}px, ${m.y}px)`;
        m.b.style.opacity = String(a);
        m.b.style.filter = k > .6 ? `blur(${(k - .6) * 8}px)` : 'none';
        if (k > .55 && Math.random() < dt * 3 && m.kind !== 'junk') {
          const chars = [...m.b.textContent], i = Math.floor(Math.random() * chars.length);
          if (chars[i] !== ' ') { chars[i] = pick(['░', '▒']); m.b.textContent = chars.join(''); }
        }
        if (k >= 1) { m.alive = false; m.b.remove(); }
      });
      for (let i = mems.length - 1; i >= 0; i--) if (!mems[i].alive && !mems[i].b.isConnected) mems.splice(i, 1);
    });
  });
}
