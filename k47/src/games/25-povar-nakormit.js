/* ==========================================================================
   Глава 25 · «Повар» — ПОКОРМИТЬ, НЕ ВЫДАТЬ СЕБЯ
   Раздача в столовой. Клоны одинаковые. К-47 — тот, у кого тонкий шрам
   на левой скуле. Эш прячет картошку в фольге. Начальник смотрит из окна.
   Подложи картошку на поднос К-47, пока он отвернулся.
   ========================================================================== */
defineFrag(24, {
  id: 'cook', name: 'Картошка в фольге',
  text: 'Парень ничего не ответил, но в его лице что-то дрогнуло, едва заметная, почти человеческая эмоция, улыбка. И на следующий день Эш снова взял картошку. Очистил. Нарезал. Посолил. Поставил в духовку.',
  how: 'Подносы едут по раздаче. Все клоны одинаковы — ищи тонкий шрам на левой скуле. Когда поднос К-47 в зоне раздачи и начальник не смотрит — положи картошку. Отдашь не тому — картошка пропала. Заметят — второй раз не простят. Нужно три картошки К-47.',
  keys: 'ТАП ПО ПОДНОСУ ИЛИ ПРОБЕЛ — ПОЛОЖИТЬ КАРТОШКУ · ГЛАЗ НАЧАЛЬНИКА — ВВЕРХУ',
  note: 'Картошка в фольге с одним-единственным надкусом. Он отложил её на потом. А «потом» здесь не бывает. Передавать её стало некому.',
  mem: 'КАРТОШКА В ФОЛЬГЕ', start: gameCook,
});

function gameCook(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  let t = 0, over = false, potatoes = 5, given = 0, strikes = 0, look = 0, lookState = 'away', lookT = rand(2, 4), spawnT = 0.5, flash = 0, flashCol = '';
  const trays = [];
  let k47Next = irand(2, 4), k47Count = 0;
  const fry = scope.own(A.loopNoise({ type: 'bandpass', freq: 3500, q: 0.8, vol: 0 }));
  fry.vol(0.02, 1);
  ctx.hint('ШРАМ НА ЛЕВОЙ СКУЛЕ — К-47 · ПОДНОС В ЗОНЕ + НАЧАЛЬНИК НЕ СМОТРИТ — КЛАДИ');
  const upd = () => ctx.stat(`К-47 НАКОРМЛЕН ${given}/3 · КАРТОШКИ ${potatoes} · ЗАМЕЧЕН ${strikes}/2`);
  upd();
  ctx.say('Столовая. Запах горячего масла и свежего хлеба.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2400);

  return new Promise(resolve => {
    const zone = () => [C.W * 0.45, C.W * 0.62];
    function give(tr) {
      if (over || !tr || tr.got) return;
      const [z0, z1] = zone(), x = tr.x * C.W;
      if (x < z0 || x > z1) { A.sfx.click(); return; }
      if (potatoes <= 0) return;
      potatoes--; tr.got = true;
      A.noise({ type: 'bandpass', freq: 2200, q: 1, dur: 0.15, vol: 0.05 });
      if (look > 0.6) {
        strikes++; flash = 1; flashCol = '255,0,51'; A.sfx.buzz(); FX.shake('sm');
        ctx.say(strikes < 2 ? 'Начальник смотрит. «Это что?»' : 'Начальник вышел из-за стекла.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1500);
        if (strikes >= 2) { lose('Эш кивнул. Он понимал. Его перевели на мойку. Потом — уволили.'); return; }
      } else if (tr.k47) {
        given++; flash = 1; flashCol = '255,179,71'; A.sfx.chime(620, 0.05);
        ctx.say(pick(['В его лице что-то дрогнуло.', 'Он не посмотрел. Но взял.', 'Почти улыбка.']), { pos: 'mid', cls: 'amb' }); scope.timeout(() => ctx.unsay('mid'), 1400);
        if (given >= 3) win();
      } else {
        ctx.say('Не тот. Клон даже не заметил.', { pos: 'mid' }); scope.timeout(() => ctx.unsay('mid'), 1200);
      }
      upd();
      if (!over && potatoes <= 0 && given < 3) lose('Картошка кончилась. До завтра.');
    }
    scope.on(C.cv, 'pointerdown', e => {
      const r = C.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const tr = trays.find(tt => Math.abs(tt.x * C.W - x) < C.W * 0.07 && y > C.H * 0.35);
      give(tr);
    });
    ctx.keys(e => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); const [z0, z1] = zone(); give(trays.find(tt => tt.x * C.W >= z0 && tt.x * C.W <= z1 && !tt.got)); } });

    async function lose(text) {
      over = true;
      await ctx.line(text, { pos: 'top', cls: 'red', ms: 2800 });
      resolve({ ok: 'fail', detail: `К-47 НАКОРМЛЕН ${given}/3` });
    }
    async function win() {
      over = true;
      await ctx.line('— Ты уходишь? — спросил К-47.', { pos: 'top', ms: 2200 });
      await ctx.line('Картошка в фольге. Один надкус. Отложена «на потом».', { pos: 'top', cls: 'amb', ms: 2800 });
      resolve({ ok: 'ok', detail: `ЗАМЕЧЕН ${strikes} РАЗ · ОСТАЛОСЬ ${potatoes}` });
    }

    scope.loop(dt => {
      t += dt;
      if (!over) {
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = rand(1.3, 1.9);
          k47Next--;
          const isK = k47Next <= 0;
          if (isK) { k47Next = irand(2, 4); k47Count++; }
          trays.push({ x: -0.08, k47: isK, got: false, seed: irand(1, 999) });
        }
        trays.forEach(tr => { tr.x += dt * 0.085; });
        while (trays.length && trays[0].x > 1.1) { const tr = trays.shift(); if (tr.k47 && !tr.got) { ctx.say('Ушёл без картошки.', { pos: 'mid' }); scope.timeout(() => ctx.unsay('mid'), 1100); } }
        lookT -= dt;
        if (lookT <= 0) {
          if (lookState === 'away') { lookState = 'turning'; lookT = 0.9; A.sfx.step(0.12, -0.5); }
          else if (lookState === 'turning') { lookState = 'look'; lookT = rand(1.6, 3); }
          else { lookState = 'away'; lookT = rand(2.2, 4.5); }
        }
        const target = lookState === 'look' ? 1 : lookState === 'turning' ? 0.55 : 0;
        look += (target - look) * Math.min(1, dt * 5);
        if (k47Count > 7 && given < 3) lose('Смена закончилась.');
      }
      flash = Math.max(0, flash - dt * 1.5);
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a1512'); bg.addColorStop(1, '#0c0a08');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      // окно начальника и его глаз
      const wx = W * 0.72, wy = H * 0.06, ww = W * 0.22, wh = H * 0.2;
      g.fillStyle = 'rgba(160,190,200,.12)'; g.fillRect(wx, wy, ww, wh); g.strokeStyle = '#2a2622'; g.lineWidth = 4; g.strokeRect(wx, wy, ww, wh);
      g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
      g.translate(wx + ww / 2, wy + wh); g.scale(lerp(0.5, 1, look) * (lookState === 'away' ? -1 : 1), 1);
      Art.human(g, 0, wh * 0.4, wh * 1.2, 'fat', { color: '#050505' });
      g.restore();
      const eyeCol = look > 0.6 ? '#ff0033' : look > 0.3 ? '#ffb347' : '#3a3a3a';
      g.fillStyle = eyeCol; g.beginPath(); g.ellipse(wx - W * 0.04, wy + wh * 0.5, W * 0.02, H * 0.018, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#000'; g.beginPath(); g.arc(wx - W * 0.04, wy + wh * 0.5, H * 0.008, 0, Math.PI * 2); g.fill();
      // раздача
      const ly = H * 0.62, [z0, z1] = zone();
      g.fillStyle = '#6d7479'; g.fillRect(0, ly, W, H * 0.06);
      g.fillStyle = 'rgba(255,179,71,.12)'; g.fillRect(z0, ly - H * 0.3, z1 - z0, H * 0.36);
      g.strokeStyle = 'rgba(255,179,71,.5)'; g.setLineDash([6, 6]); g.strokeRect(z0, ly - H * 0.3, z1 - z0, H * 0.36); g.setLineDash([]);
      // клоны с подносами
      trays.forEach(tr => {
        const x = tr.x * W;
        Art.human(g, x, ly + H * 0.02, H * 0.36, 'man', { color: '#0a0a0b' });
        // голова крупно: одинаковые лица; у К-47 — шрам на левой скуле (справа от зрителя)
        const hx = x, hy = ly + H * 0.02 - H * 0.36 * 0.925, hr = H * 0.028;
        g.fillStyle = '#b8a89a'; g.beginPath(); g.ellipse(hx, hy, hr * 0.85, hr, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#2a2020'; g.fillRect(hx - hr * 0.5, hy - hr * 0.15, hr * 0.25, hr * 0.12); g.fillRect(hx + hr * 0.25, hy - hr * 0.15, hr * 0.25, hr * 0.12);
        if (tr.k47) { g.strokeStyle = 'rgba(110,20,24,.95)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(hx + hr * 0.3, hy + hr * 0.1); g.lineTo(hx + hr * 0.62, hy + hr * 0.38); g.stroke(); }
        else if (tr.seed % 5 === 0) { g.fillStyle = 'rgba(80,40,40,.5)'; g.fillRect(hx - hr * 0.6, hy + hr * 0.2, 2, 2); }
        g.fillStyle = '#3a3d40'; g.fillRect(x - W * 0.045, ly - H * 0.01, W * 0.09, H * 0.02);
        if (tr.got) { g.fillStyle = '#c9c9cc'; g.beginPath(); g.ellipse(x, ly - H * 0.018, W * 0.018, H * 0.012, 0, 0, Math.PI * 2); g.fill(); }
      });
      // Эш за раздачей
      Art.human(g, W * 0.54, H * 1.02, H * 0.34, 'man', { color: '#1d1a17' });
      g.fillStyle = 'rgba(239,230,207,.8)'; g.font = `12px ${MONO}`; g.textAlign = 'left';
      g.fillText(`КАРТОШКИ В ФОЛЬГЕ: ${potatoes}`, 14, H - 16);
      if (flash > 0) { g.fillStyle = `rgba(${flashCol},${flash * 0.2})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.6);
    }
  });
}
