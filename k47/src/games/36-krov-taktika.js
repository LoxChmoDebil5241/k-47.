/* ==========================================================================
   Глава 36 · «Кровь» — ТАКТИКА ГРУППЫ
   Разведчик, огневой номер, замыкающий. Тихий путь вместо шумного.
   Закреплённого — подавить и бежать на него. Окружили — в круг, спиной
   к спине. Раненого не бросать. Мёртвого не тащить — сжечь: ДНК не врагу.
   Решения — за долю секунды.
   ========================================================================== */
defineFrag(35, {
  id: 'blood', name: 'Мёртвых не оставляем',
  text: 'Запомните: своих не бросаем, но мёртвых не оставляем. Сожгите — и идите дальше. Ваша жизнь важнее его трупа, но его ДНК не должна стать причиной вашей смерти.',
  how: 'Группа из трёх идёт по штреку (вид сверху). На пути — ситуации. На каждую — три команды и несколько секунд: «если вы задумались — вы мёртвы». В конце — тело товарища: зажми горелку и держи, пока не догорит.',
  keys: 'Q / W / E ИЛИ 1 / 2 / 3 — КОМАНДА · ГОРЕЛКА — ЗАЖАТЬ ПРОБЕЛ / КНОПКУ',
  note: 'Разведчик — первый, кто умирает. Я часто шёл первым. Меня сжигали горелкой, чтобы враг не получил ДНК. Потом я просыпался. ДНК у них и так была.',
  mem: 'СВОИХ НЕ БРОСАЕМ', start: gameBlood,
});

function gameBlood(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const EV = [
    { k: 'fork', t: 'Развилка: слева — гул вентиляции и хруст льда, справа — тишина.', o: ['Налево — быстрее', 'Направо — тихо', 'Разделиться'], a: 1, why: 'Шумный и тихий путь — всегда тихий. Звук идёт на сотни метров.' },
    { k: 'noise', t: 'Сканер: впереди стая, вас не заметили. Обойти можно.', o: ['Атаковать первыми', 'Обойти', 'Ждать на месте'], a: 1, why: 'Первое правило — не искать боя. Можно обойти — обойдите.' },
    { k: 'ambush', t: 'Контакт! Рейдер закреплён за ящиками, бьёт по проходу.', o: ['Подавить и бежать на него', 'Залечь и ждать', 'Целиться в голову из-за угла'], a: 0, why: 'Подавить — стрелять над ним. Перестал стрелять — вперёд, сокращать дистанцию.' },
    { k: 'first', t: 'Из-за поворота — голова в шлеме. Он ещё не видит вас.', o: ['Крикнуть «стоять»', 'Один выстрел в голову', 'Три в грудь'], a: 1, why: 'Боя не избежать — бейте первыми. Один в голову лучше трёх в грудь.' },
    { k: 'ring', t: 'Твари со всех сторон. Из трещин, из техштрека.', o: ['Бежать каждый к своему выходу', 'В круг, спиной друг к другу', 'Спрятаться поодиночке'], a: 1, why: 'Одиночка в штреке — мёртв. Всегда.' },
    { k: 'wounded', t: 'Замыкающий ранен. Не может стрелять, но идёт.', o: ['Оставить — лишний вес', 'Вести с собой', 'Вколоть ему две ампулы'], a: 1, why: 'Раненого не бросать — он нужен для прикрытия и для морали.' },
    { k: 'dead', t: 'Разведчик мёртв. Отходить надо сейчас.', o: ['Тащить тело', 'Оставить как есть', 'Сжечь'], a: 2, why: 'Мёртвого не тащить и не оставлять врагу: биоматериал — оружие. Сжечь.' },
  ];
  const KEYS = [['KeyQ', '1'], ['KeyW', '2'], ['KeyE', '3']];
  let t = 0, idx = -1, ev = null, left = 0, over = false, right = 0, walk = 0, dead = [false, false, false], wounded = false, shots = [], formation = 'line', burnP = 0, burning = false, mode = 'walk';
  const ctl = ctx.el('div', 'ctl kr-ctl');
  const q = ctx.el('p', 'kr-q', ctl);
  const btns = ctx.el('div', 'kr-btns', ctl);
  const upd = () => ctx.stat(`СИТУАЦИЯ ${Math.max(1, idx + 1)}/${EV.length} · ВЕРНО ${right}`);
  ctx.hint('РЕШАЙ ЗА ДОЛЮ СЕКУНДЫ');
  const drip = scope.own(A.loopNoise({ type: 'lowpass', freq: 260, q: 0.5, vol: 0 }));
  drip.vol(0.03, 1);

  return new Promise(resolve => {
    function nextEv() {
      idx++; upd();
      if (idx >= EV.length) return burnPhase();
      mode = 'walk'; walk = 0;
      scope.timeout(() => {
        if (over) return;
        ev = EV[idx]; left = 4.2 - idx * 0.15; mode = 'ev';
        q.textContent = ev.t; btns.innerHTML = '';
        ev.o.forEach((o, i) => { const b = ctx.el('button', 'btn', btns, `<b>${'QWE'[i]}</b> ${esc(o)}`); b.addEventListener('click', () => answer(i)); });
        A.sfx.beep(420, 0.08, 0.03);
        if (ev.k === 'ambush') A.sfx.gunfire(4, 0.18);
        if (ev.k === 'ring') A.sfx.squelch(0.2);
      }, 1500);
    }
    async function answer(i) {
      if (!ev || mode !== 'ev') return;
      mode = 'res';
      const good = i === ev.a;
      $$('.btn', btns).forEach((b, k) => { b.disabled = true; if (k === ev.a) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
      if (good) { right++; A.sfx.chime(640, 0.04); }
      else A.sfx.buzz();
      if (ev.k === 'ring') formation = good ? 'ring' : 'scatter';
      if (ev.k === 'ambush' || ev.k === 'first') { for (let k = 0; k < 8; k++) shots.push({ x: 0.5, y: 0.5, a: rand(-0.2, 0.2), t: k * 0.05 }); A.sfx.gunfire(good ? 3 : 8, 0.2); }
      if (!good && ev.k !== 'dead') { const alive = [0, 1, 2].filter(k => !dead[k]); if (alive.length > 1 && Math.random() < 0.6) { dead[alive[alive.length - 1]] = true; A.sfx.thud(0.4); } }
      if (ev.k === 'wounded') wounded = true;
      if (ev.k === 'dead') dead[0] = true;
      q.textContent = (i < 0 ? 'Задумался. ' : '') + ev.why;
      await scope.wait(good ? 1400 : 2600);
      if (over) return;
      btns.innerHTML = ''; q.textContent = ''; ev = null;
      if (formation === 'scatter') formation = 'line';
      nextEv();
    }
    function burnPhase() {
      mode = 'burn'; q.textContent = 'Тело разведчика. Горелка. Держи, пока не останется биоматериала.'; btns.innerHTML = '';
      const hold = mgHold(ctx, 'ГОРЕЛКА', { parent: btns });
      hold.onDown = () => { burning = true; };
      hold.onUp = () => { burning = false; };
    }
    async function finish() {
      over = true; drip.vol(0, 0.4);
      if (right >= 5) {
        await ctx.line('Сожгите — и идите дальше.', { pos: 'top', cls: 'amb', ms: 2200 });
        resolve({ ok: 'ok', detail: `ВЕРНО ${right} ИЗ ${EV.length}` });
      } else {
        await ctx.line('— Если вы задумались — вы мёртвы.', { pos: 'top', cls: 'red', ms: 2400 });
        resolve({ ok: 'fail', detail: `ВЕРНО ${right} ИЗ ${EV.length}` });
      }
    }
    ctx.keys(e => { if (mode !== 'ev') return; const i = KEYS.findIndex(k => k.includes(e.code) || k.includes(e.key)); if (i >= 0) { e.preventDefault(); answer(i); } });
    let fl = null;
    scope.loop(dt => {
      t += dt;
      if (mode === 'walk') walk += dt;
      if (mode === 'ev') { left -= dt; if (left <= 0) answer(-1); }
      if (mode === 'burn' && !over) {
        if (burning) { burnP += dt / 3.2; if (!fl) fl = scope.own(A.loopNoise({ type: 'bandpass', freq: 900, q: 0.5, vol: 0 })); fl.vol(0.08, 0.1); }
        else if (fl) fl.vol(0, 0.2);
        ctx.stat(`ТЕЛО ГОРИТ ${Math.round(Math.min(1, burnP) * 100)}%`);
        if (burnP >= 1) { if (fl) fl.vol(0, 0.3); finish(); }
      }
      shots.forEach(s => { s.t -= dt; }); shots = shots.filter(s => s.t > -0.25);
      draw();
    });
    nextEv();

    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#070b0e'; g.fillRect(0, 0, W, H);
      // штрек сверху
      const scroll = (t * (mode === 'walk' ? 60 : 8)) % 80;
      g.fillStyle = '#10181d'; g.fillRect(W * 0.3, 0, W * 0.4, H);
      g.strokeStyle = 'rgba(143,176,196,.2)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.3, 0); g.lineTo(W * 0.3, H); g.moveTo(W * 0.7, 0); g.lineTo(W * 0.7, H); g.stroke();
      g.fillStyle = 'rgba(143,176,196,.08)'; for (let y = -80 + scroll; y < H; y += 80) g.fillRect(W * 0.3, y, W * 0.4, 2);
      if (ev && ev.k === 'fork') { g.fillStyle = '#10181d'; g.fillRect(0, H * 0.18, W * 0.3, H * 0.12); g.fillRect(W * 0.7, H * 0.18, W * 0.3, H * 0.12); g.fillStyle = 'rgba(255,179,71,.4)'; for (let i = 0; i < 5; i++) g.fillRect(W * 0.05 + i * 20, H * 0.24 + Math.sin(t * 20 + i) * 4, 8, 2); }
      // враги
      if (ev && (ev.k === 'ambush' || ev.k === 'first')) Art.raider(g, W * 0.52, H * 0.26, H * 0.18, { dir: -1, t });
      if (ev && ev.k === 'noise') for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,0,51,.8)'; g.beginPath(); g.arc(W * (0.36 + i * 0.05), H * 0.12 + Math.sin(t * 3 + i) * 6, 5, 0, Math.PI * 2); g.fill(); }
      if (ev && ev.k === 'ring' || formation === 'ring' && idx === 4) for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + t * 0.4, r = Math.min(W, H) * (0.3 + 0.03 * Math.sin(t * 4 + i)); g.fillStyle = '#050304'; g.beginPath(); g.ellipse(W / 2 + Math.cos(a) * r, H * 0.6 + Math.sin(a) * r * 0.8, 12, 8, a, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ff2a3c'; g.fillRect(W / 2 + Math.cos(a) * r - 2, H * 0.6 + Math.sin(a) * r * 0.8 - 1, 3, 2); }
      // группа
      const pos = formation === 'ring'
        ? [0, 1, 2].map(i => [W / 2 + Math.cos(i / 3 * Math.PI * 2) * 22, H * 0.6 + Math.sin(i / 3 * Math.PI * 2) * 22])
        : [[W / 2, H * 0.5], [W / 2, H * 0.62], [W / 2, H * 0.74]];
      ['РАЗВЕДЧИК', 'ОГНЕВОЙ', 'ЗАМЫКАЮЩИЙ'].forEach((n, i) => {
        const [x, y] = pos[i];
        if (dead[i]) {
          g.fillStyle = 'rgba(90,6,16,.8)'; g.beginPath(); g.ellipse(x + 8, y + 4, 22, 10, 0.3, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#1b1c1f'; g.fillRect(x - 12, y - 5, 24, 10);
          if (mode === 'burn' || (burnP > 0)) {
            const k = Math.min(1, burnP);
            g.fillStyle = `rgba(255,${120 + Math.random() * 80 | 0},40,${burning ? 0.8 : 0.3})`;
            for (let f = 0; f < 10; f++) { g.beginPath(); g.arc(x + rand(-14, 14), y + rand(-8, 8) - k * 4, rand(2, 7) * (burning ? 1 : 0.5), 0, Math.PI * 2); g.fill(); }
            g.fillStyle = `rgba(0,0,0,${k * 0.9})`; g.fillRect(x - 12, y - 5, 24, 10);
          }
          return;
        }
        g.fillStyle = '#26282c'; g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill();
        g.save(); g.shadowColor = '#ff1a2e'; g.shadowBlur = 8; g.fillStyle = '#ff1a2e'; g.fillRect(x - 5, y - 8, 10, 2); g.restore();
        if (i === 2 && wounded) { g.fillStyle = 'rgba(138,10,24,.9)'; g.fillRect(x + 4, y + 2, 5, 5); }
        g.fillStyle = 'rgba(239,230,207,.55)'; g.font = `10px ${MONO}`; g.textAlign = 'left'; g.fillText(n, x + 16, y + 4);
      });
      shots.forEach(s => { if (s.t > 0) return; g.strokeStyle = 'rgba(255,220,150,.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(W / 2, H * 0.62); g.lineTo(W * (0.52 + s.a), H * 0.26); g.stroke(); });
      if (mode === 'ev' && ev) { g.fillStyle = 'rgba(255,0,51,.8)'; g.fillRect(W * 0.3, 0, W * 0.4 * Math.max(0, left / (4.2 - idx * 0.15)), 4); }
      Art.vignette(g, W, H, 0.7);
    }
  });
}
