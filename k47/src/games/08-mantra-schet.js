/* ==========================================================================
   Глава 8 · перенесено из прототипа «Мини-игры» (механика сохранена)
   ========================================================================== */
defineFrag(7, {
  id: "count", name: "Счёт",
  text: "Он лежал в темноте и считал. Не овец — цифры. Раз, два, три… Шёпотом, одними губами, чтобы не услышал отец. Счёт был единственным, что удерживало его на плаву, когда в комнате затихали шаги и начинался новый круг страха.",
  how: "Темнота. За стеной ходит отец. Считай в такт собственному сердцу — одно касание на удар. Сбился — начинай сначала, а шаги станут ближе. Досчитай до десяти.",
  keys: "ТАП / ПРОБЕЛ — СЧИТАТЬ · КОЛЬЦО СЖИМАЕТСЯ К УДАРУ · 3 СБОЯ — ДВЕРЬ ОТКРОЕТСЯ",
  note: "Цифры не спасают. Но пока я считаю — я не жертва. Я тот, у кого есть порядок.",
  mem: "СЧЁТ ДО ДЕСЯТИ", start: ctx => gameCount(ctx),
});

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
  let nextBeatAt = Clock.now() + 1500;
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
      const now = Clock.now();
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
      const now = Clock.now();
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
