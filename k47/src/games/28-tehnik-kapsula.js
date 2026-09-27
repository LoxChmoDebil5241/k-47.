/* ==========================================================================
   Глава 28 · «Техник» — ПОДКРУТИТЬ КАПСУЛУ
   Елена за пультом. Минус десять процентов давления, полсекунды задержки —
   так выглядит нежность, спрятанная в протоколах. Пока начальник далеко,
   смягчай параметры; когда он у стекла — только «на миллиметр».
   ========================================================================== */
defineFrag(27, {
  id: 'tech', name: 'Подкрутить капсулу',
  text: 'Однажды её начальник заметил аномалию. Он ушёл. Елена выдохнула. Но она знала, что это было предупреждение. Она стала осторожнее. Теперь она меняла параметры на миллиметр, на долю процента, так, чтобы никто не заметил.',
  how: 'Три активации капсулы. Сдвигай ползунки от нормы к мягкой зоне — клону будет легче (растёт «мягкость»). Когда начальник подходит к стеклу (шаги, отражение), верни всё почти к норме: он видит отклонение больше «миллиметра». Нужна средняя мягкость не ниже 45% и не больше одного замечания.',
  keys: 'ТЯНИ ПОЛЗУНКИ · 1 / 2 / 3 — ВЫБРАТЬ, ← → — СДВИНУТЬ · N — «НОРМА» ОДНИМ НАЖАТИЕМ',
  note: 'Минус десять процентов давления и полсекунды задержки. Нежность, которую приходится прятать в протоколах. Кто-нибудь сейчас так же подкручивает мою капсулу?',
  mem: 'МИНУС ДЕСЯТЬ ПРОЦЕНТОВ', start: gameTech,
});

function gameTech(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const P = [
    { k: 'ДАВЛЕНИЕ', unit: '%', norm: 100, soft: 90, min: 80, max: 110, v: 100, step: 1 },
    { k: 'ЗАДЕРЖКА АНЕСТЕЗИИ', unit: ' с', norm: 0, soft: 0.5, min: 0, max: 1, v: 0, step: 0.05 },
    { k: 'ТЕМПЕРАТУРА ГЕЛЯ', unit: ' °C', norm: 4, soft: 7, min: 2, max: 9, v: 4, step: 0.25 },
  ];
  const TOL = [1.5, 0.08, 0.4];            // «на миллиметр» — не заметит
  let t = 0, over = false, act = 0, actT = 0, comfort = 0, comfortSum = 0, strikes = 0, sel = 0, flash = 0;
  let boss = 0, bossState = 'away', bossT = rand(3, 5);
  const ACT_DUR = 13;
  const panel = ctx.el('div', 'tc-panel');
  const rows = P.map((p, i) => {
    const r = ctx.el('div', 'tc-row', panel, `<span class="tc-k">${i + 1} · ${p.k}</span><input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.v}" aria-label="${p.k}"><b class="tc-v"></b>`);
    const inp = $('input', r), val = $('.tc-v', r);
    scope.on(inp, 'input', () => { p.v = +inp.value; sel = i; A.sfx.type(0.02); refresh(); });
    scope.on(inp, 'focus', () => { sel = i; refresh(); });
    return { r, inp, val };
  });
  const normB = ctx.el('button', 'btn tc-norm', panel, 'N · НОРМА');
  scope.on(normB, 'click', toNorm);
  function toNorm() { P.forEach((p, i) => { p.v = p.norm; rows[i].inp.value = p.norm; }); A.sfx.click(); refresh(); }
  function refresh() { P.forEach((p, i) => { rows[i].val.textContent = `${+p.v.toFixed(2)}${p.unit}`; rows[i].r.classList.toggle('sel', i === sel); rows[i].r.classList.toggle('hot', Math.abs(p.v - p.norm) > TOL[i]); }); }
  refresh();
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 62, vol: 0 }));
  hum.vol(0.02, 1);
  ctx.hint('СМЯГЧАЙ, ПОКА НАЧАЛЬНИК ДАЛЕКО · У СТЕКЛА — ТОЛЬКО «НА МИЛЛИМЕТР»');
  const deviation = () => P.map((p, i) => Math.abs(p.v - p.norm) > TOL[i]).some(Boolean);
  const softness = () => P.reduce((s, p) => s + clamp((p.v - p.norm) / (p.soft - p.norm), 0, 1.2), 0) / P.length;

  return new Promise(resolve => {
    ctx.keys(e => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 3) { sel = n - 1; refresh(); return; }
      if (e.code === 'KeyN') { e.preventDefault(); toNorm(); return; }
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault(); const p = P[sel]; p.v = clamp(+(p.v + (e.code === 'ArrowRight' ? 1 : -1) * p.step * (e.shiftKey ? 4 : 1)).toFixed(3), p.min, p.max);
        rows[sel].inp.value = p.v; A.sfx.type(0.02); refresh();
      }
    });
    async function end() {
      over = true;
      const avg = comfortSum / (ACT_DUR * 3);
      if (avg >= 0.45 && strikes <= 1) {
        await ctx.line('Три активации. Клоны вышли из капсул чуть тише, чем обычно.', { pos: 'top', ms: 2600 });
        await ctx.line('Она сжала пальцы в кулак. Дрожа вдохнула. И продолжила работать.', { pos: 'top', ms: 2800 });
        resolve({ ok: 'ok', detail: `МЯГКОСТЬ ${Math.round(avg * 100)}% · ЗАМЕЧАНИЙ ${strikes}` });
      } else {
        await ctx.line(strikes > 1 ? '— Ещё одна аномалия — и ты уволена.' : 'По протоколу. Холодно. Больно. Как всегда.', { pos: 'top', cls: 'red', ms: 2800 });
        resolve({ ok: 'fail', detail: `МЯГКОСТЬ ${Math.round(avg * 100)}% · ЗАМЕЧАНИЙ ${strikes}` });
      }
    }
    let caughtCd = 0;
    scope.loop(dt => {
      t += dt; flash = Math.max(0, flash - dt * 2); caughtCd = Math.max(0, caughtCd - dt);
      if (!over) {
        actT += dt;
        comfort = softness(); comfortSum += Math.min(1, comfort) * dt;
        bossT -= dt;
        if (bossT <= 0) {
          if (bossState === 'away') { bossState = 'coming'; bossT = 1.6; A.sfx.step(0.2, 0.7); A.sfx.step(0.25, 0.6, 0.5); A.sfx.step(0.3, 0.5, 1); }
          else if (bossState === 'coming') { bossState = 'watch'; bossT = rand(2.2, 3.6); }
          else { bossState = 'away'; bossT = rand(3, 5.5); }
        }
        boss += ((bossState === 'watch' ? 1 : bossState === 'coming' ? 0.5 : 0) - boss) * Math.min(1, dt * 4);
        if (bossState === 'watch' && deviation() && caughtCd <= 0) {
          strikes++; caughtCd = 3; flash = 1; A.sfx.buzz(); FX.shake('sm');
          ctx.say(strikes === 1 ? '— Аномалия в седьмой. Это что?' : '— Второй раз. Я запишу.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1600);
        }
        ctx.stat(`АКТИВАЦИЯ ${act + 1}/3 · МЯГКОСТЬ ${Math.round(Math.min(1, comfort) * 100)}% · ЗАМЕЧАНИЙ ${strikes}`);
        if (actT >= ACT_DUR) {
          actT = 0; act++; A.sfx.hiss(0.6, 0.08); A.sfx.chime(500, 0.03);
          if (act >= 3) end();
        }
      }
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#060a0c'; g.fillRect(0, 0, W, H);
      // капсула за стеклом
      const cx = W * 0.5, cy = H * 0.34, cw = Math.min(W * 0.18, 150), ch = H * 0.5;
      g.fillStyle = '#0d1c26'; Art.rr(g, cx - cw / 2, cy - ch / 2, cw, ch, cw / 2); g.fill();
      const gel = 0.4 + 0.2 * Math.sin(t * 0.8);
      g.fillStyle = `rgba(80,180,230,${0.25 + comfort * 0.1})`; Art.rr(g, cx - cw / 2 + 6, cy - ch / 2 + 6 + ch * (1 - gel) * 0.3, cw - 12, ch - 12 - ch * (1 - gel) * 0.3, cw / 2 - 6); g.fill();
      g.globalAlpha = 0.8; Art.clone(g, cx, cy - ch * 0.36, ch * 0.62, { seed: 28 + act, lines: false, scars: 2, skin: '#b9c9d2', t }); g.globalAlpha = 1;
      g.strokeStyle = 'rgba(136,221,255,.45)'; Art.rr(g, cx - cw / 2, cy - ch / 2, cw, ch, cw / 2); g.stroke();
      // мониторы с зелёными линиями
      for (let i = 0; i < 3; i++) {
        const mx = W * (0.06 + i * 0.1), my = H * 0.1, mw = W * 0.08, mh = H * 0.1;
        g.fillStyle = '#031109'; g.fillRect(mx, my, mw, mh);
        g.strokeStyle = 'rgba(0,255,136,.8)'; g.beginPath(); for (let k = 0; k <= 30; k++) { const x = mx + k / 30 * mw, ph = (k / 30 + t * 0.7 + i * 0.3) % 1; const y = my + mh * 0.6 - (ph > 0.45 && ph < 0.5 ? mh * 0.35 : 0); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      }
      // отражение начальника в стекле
      if (boss > 0.02) { g.globalAlpha = boss * 0.7; Art.human(g, W * 0.8, H * 0.7, H * 0.55, 'man', { color: '#1a2228' }); g.globalAlpha = 1; }
      g.fillStyle = 'rgba(136,221,255,.04)'; g.fillRect(0, 0, W, H * 0.66);
      if (flash > 0) { g.fillStyle = `rgba(255,0,51,${flash * 0.2})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.6);
    }
  });
}
