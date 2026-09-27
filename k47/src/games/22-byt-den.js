/* ==========================================================================
   Глава 22 · «Быт» — ПЕРЕЖИТЬ ДЕНЬ
   Бетон. Койка. Тусклая лампа. Экран, который не светится. РПК-3 —
   «норма не ограничена», и ни глотка воды. Двенадцать часов: каждый час —
   одно действие. Повтор обесценивает («Опять»). Рассудок не должен кончиться.
   ========================================================================== */
defineFrag(21, {
  id: 'routine', name: 'Пережить день',
  text: 'Он не чувствовал голода. Не чувствовал сытости. Только пустоту. Только горечь. Она не уходила. Она была с ним всегда. Как свет. Как тишина. Как бетон. Опять. Это было его бытом.',
  how: 'Двенадцать часов в камере. Каждый час выбирай одно действие. Голод, холод и горечь растут и давят на рассудок. Одно и то же дважды подряд — «опять» — почти не помогает. Доживи до отбоя, не потеряв рассудок.',
  keys: 'ДЕЙСТВИЕ — КНОПКИ ИЛИ 1–4',
  note: 'Самое страшное напечатано мелким шрифтом на крышке РПК-3: «норма не ограничена». И ни глотка воды. Опять. Это было моим бытом.',
  mem: 'РПК-3', start: gameRoutine,
});

function gameRoutine(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const ACTS = {
    lie: { t: 'Лечь на койку', d: 'Металл впивается в спину.', mind: 1, cold: 1, hunger: 0, bitter: 0 },
    wall: { t: 'Прислониться лбом к стене', d: 'Холод касается кожи. Дышать.', mind: 2, cold: 2, hunger: 0, bitter: 0 },
    screen: { t: 'Коснуться экрана', d: 'Матовый. Холодный. Не светится.', mind: 3, cold: 0, hunger: 0, bitter: 0, screen: true },
    pill: { t: 'Проглотить таблетку РПК-3', d: 'Горечь прилипает к нёбу.', mind: 1, cold: 0, hunger: -3, bitter: 2 },
    cracks: { t: 'Считать трещины', d: 'Двадцать три. Двадцать четыре.', mind: 1, cold: 0, hunger: 0, bitter: 0, count: true },
    door: { t: 'Стоять у двери', d: 'Ждать. Не знать чего.', mind: 0, cold: -1, hunger: 0, bitter: -1 },
    walk: { t: 'Ходить из угла в угол', d: 'Шесть шагов. Шесть обратно.', mind: 1, cold: -2, hunger: 1, bitter: 0 },
  };
  const st = { mind: 7, cold: 1, hunger: 1, bitter: 1, hour: 0, last: null, screenUsed: 0, counted: 0 };
  let over = false, t = 0, flick = 0, pose = 'sit';
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 50, vol: 0 }));
  const vent = scope.own(A.loopNoise({ type: 'lowpass', freq: 320, q: 0.5, vol: 0 }));
  hum.vol(0.02, 1); vent.vol(0.03, 1);
  const panel = ctx.el('div', 'by-stats');
  const EVENTS = [
    ['Лампа мигает. Тени дёргаются.', s => { s.mind -= 1; }],
    ['Вентиляция гонит холод.', s => { s.cold += 2; }],
    ['За стеной — шаги. Мимо.', s => { s.mind -= 1; }],
    ['Тишина. Такая плотная, что звенит.', s => { s.mind -= 1; }],
    ['Люк в двери: ещё РПК-3. Воды нет.', s => { s.bitter += 1; }],
    ['Ничего не происходит.', () => {}],
  ];
  const render = () => {
    const bar = (v, max, cls) => `<i class="${cls}" style="width:${clamp(v / max, 0, 1) * 100}%"></i>`;
    panel.innerHTML = `<div><span>РАССУДОК</span><b>${bar(st.mind, 10, 'ok')}</b></div><div><span>ГОЛОД</span><b>${bar(st.hunger, 8, 'amb')}</b></div><div><span>ХОЛОД</span><b>${bar(st.cold, 8, 'ice')}</b></div><div><span>ГОРЕЧЬ</span><b>${bar(st.bitter, 8, 'red')}</b></div>`;
    ctx.stat(`ЧАС ${st.hour}/12`);
  };
  render();
  ctx.hint('КАЖДЫЙ ЧАС — ОДНО ДЕЙСТВИЕ · ПОВТОР ПОДРЯД — «ОПЯТЬ»');

  return (async () => {
    scope.loop(dt => { t += dt; flick = Math.max(0, flick - dt); draw(); });
    await ctx.line('Стены — бетонные, грубые. Свет — одна лампа под потолком.', { pos: 'top', ms: 2400 });
    for (st.hour = 1; st.hour <= 12; st.hour++) {
      if (!scope.alive) return { ok: 'fail' };
      render();
      const keys = shuffle(Object.keys(ACTS)).slice(0, 4);
      const k = await ctx.choose(keys.map(x => ACTS[x].t + (x === st.last ? ' · опять' : '')), { col: true });
      const key = keys[k], a = ACTS[key];
      let mind = a.mind;
      const again = key === st.last;
      if (again) mind = Math.min(0, mind - 1);
      if (a.screen) { st.screenUsed++; if (st.screenUsed > 2) mind = -1; }
      if (a.count) { st.counted++; if (st.counted > 3) mind = -1; }
      st.mind += mind; st.cold = clamp(st.cold + a.cold, 0, 8); st.hunger = clamp(st.hunger + a.hunger, 0, 8); st.bitter = clamp(st.bitter + a.bitter, 0, 8);
      pose = key === 'lie' ? 'lie' : key === 'wall' ? 'wall' : key === 'screen' ? 'screen' : key === 'door' ? 'door' : 'sit';
      st.last = key;
      A.sfx.step(0.08, rand(-0.3, 0.3));
      ctx.say(`${again ? 'Опять. ' : ''}${a.d}`, { pos: 'top' });
      await scope.wait(1400);
      // час проходит
      st.hunger = clamp(st.hunger + 1, 0, 8);
      const ev = pick(EVENTS); ev[1](st); flick = ev[0].startsWith('Лампа') ? 1 : 0;
      if (st.hunger >= 6) st.mind -= 1;
      if (st.cold >= 6) st.mind -= 1;
      if (st.bitter >= 6) st.mind -= 1;
      st.mind = Math.min(10, st.mind);
      render();
      ctx.say(ev[0], { pos: 'top', cls: 'ice' });
      await scope.wait(1300);
      ctx.unsay('top');
      if (st.mind <= 0) {
        A.sfx.thud(0.4); FX.flash('#000', 800, 0.8);
        await ctx.line('Он лёг на пол у двери и перестал отвечать на лампу.', { pos: 'mid', cls: 'red', ms: 2800 });
        return { ok: 'fail', detail: `ЧАС ${st.hour} ИЗ 12` };
      }
    }
    await ctx.line('Отбой. Лампа не гаснет — она просто становится тусклее.', { pos: 'top', ms: 2600 });
    await ctx.line('Опять.', { pos: 'mid', cls: 'big', ms: 1800 });
    return { ok: 'ok', detail: `РАССУДОК ${st.mind}/10` };
  })();

  function draw() {
    const { g, W, H } = C;
    drawCell(g, W, H, { t, lamp: flick > 0 ? 0.3 + Math.random() * 0.7 : 1, seed: 22 });
    const fy = H * 0.72;
    // койка, экран, дверь
    g.fillStyle = '#18181b'; g.fillRect(W * 0.06, fy - H * 0.06, W * 0.3, H * 0.06); g.fillStyle = '#26262a'; g.fillRect(W * 0.06, fy - H * 0.08, W * 0.3, H * 0.025);
    g.fillStyle = '#0b0d0f'; g.fillRect(W * 0.44, H * 0.22, W * 0.2, H * 0.22); g.strokeStyle = 'rgba(120,140,150,.25)'; g.strokeRect(W * 0.44, H * 0.22, W * 0.2, H * 0.22);
    g.fillStyle = '#141416'; g.fillRect(W * 0.78, H * 0.18, W * 0.14, fy - H * 0.18); g.fillStyle = '#0a0a0b'; g.fillRect(W * 0.81, H * 0.36, W * 0.08, H * 0.03);
    // банка РПК-3
    g.fillStyle = '#3a3d40'; g.fillRect(W * 0.4, fy - H * 0.05, W * 0.03, H * 0.05); g.fillStyle = 'rgba(239,230,207,.5)'; g.font = `${Math.max(8, H * 0.014)}px ${MONO}`; g.textAlign = 'center'; g.fillText('РПК-3', W * 0.415, fy - H * 0.06);
    // клон
    const pos = { sit: [W * 0.25, fy], lie: [W * 0.2, fy - H * 0.07], wall: [W * 0.66, fy], screen: [W * 0.54, fy], door: [W * 0.76, fy] }[pose];
    g.save();
    if (pose === 'lie') { g.translate(pos[0], pos[1]); g.rotate(-Math.PI / 2); g.translate(-pos[0], -pos[1]); }
    Art.human(g, pos[0], pos[1], H * 0.4, 'man', { color: '#070707', eyes: '#ffffff' });
    g.restore();
  }
}
