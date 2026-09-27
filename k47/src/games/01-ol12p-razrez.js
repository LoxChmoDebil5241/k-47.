/* ==========================================================================
   Глава 1 · «Ол-12-П» — РАЗРЕЗ КОРЫ
   1) Собрать разрез планеты сверху вниз: атмосфера → лёд → кора → основание → жилы.
   2) Хрупкое перемирие: распределить мощность бурения между NanoTrasen (ОПЗ),
      промыслом СНК и Vitezstvi так, чтобы добыть норму и не сорвать перемирие.
   ========================================================================== */
defineFrag(0, {
  id: 'ol12p', name: 'Разрез коры',
  text: 'Под ледяной мантией, на глубине от 191 до 210 километров, начинается скальное основание — базальтовые породы с чудовищным содержанием редких и ценных металлов: иридия, осмия, висмута, теллура.',
  how: 'Сначала собери разрез планеты — слои сверху вниз, от атмосферы до металлических жил. Потом распредели мощность бурения между тремя операторами. Добывай норму, но следи за напряжением: перекос в пользу одной стороны — и перемирие рухнет вместе с шахтами.',
  keys: 'СЛОИ — ТАП ПО КАРТОЧКЕ ИЛИ 1–5 · БУРЕНИЕ — ▲▼ У ШАХТ ИЛИ Q/A · W/S · E/D',
  note: 'Минус двести один. Под этим холодом лежит всё, за что они убивают друг друга. Я тоже лежу там — под слоем чужих подписей.',
  mem: 'МИНУС ДВЕСТИ ОДИН', start: gameOl12,
});

function gameOl12(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const LAYERS = [
    { k: 'atm', t: 'АТМОСФЕРА', s: 'H₂ 72% · He 25% · этилен · 0,75 кг/м³', c: '#2b3a4a' },
    { k: 'surf', t: 'ПОВЕРХНОСТЬ', s: '−201 °C · ни ветра, ни звука', c: '#b9d4e2' },
    { k: 'ice', t: 'ЛЕДЯНАЯ КОРА', s: 'сверхглубокие шахты · штреки', c: '#6f95ad' },
    { k: 'rock', t: 'СКАЛЬНОЕ ОСНОВАНИЕ', s: '191–210 км · базальт', c: '#3a3336' },
    { k: 'ore', t: 'РУДНЫЕ ЖИЛЫ', s: 'иридий · осмий · висмут · теллур', c: '#c9a24a' },
  ];
  let placed = 0, errors = 0, phase = 'layers', t = 0, over = false;
  const cards = ctx.el('div', 'ol-cards');
  const order = shuffle(LAYERS.map((L, i) => i));
  const cardEls = order.map((idx, n) => {
    const L = LAYERS[idx];
    const b = ctx.el('button', 'btn ol-card', cards, `<b>${n + 1}</b><span>${esc(L.t)}</span><small>${esc(L.s)}</small>`);
    b.dataset.i = idx; return b;
  });
  ctx.hint('ТАП ПО СЛОЮ, КОТОРЫЙ ИДЁТ СЛЕДУЮЩИМ СВЕРХУ ВНИЗ · 1–5');
  ctx.say('Разрез коры. Сверху вниз.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2200);
  const upd = () => ctx.stat(phase === 'layers' ? `СЛОЁВ ${placed}/5 · ОШИБОК ${errors}/3` : '');
  upd();
  const hum = scope.own(A.loopOsc({ type: 'sawtooth', freq: 41, vol: 0, lp: 160 }));
  hum.vol(0.03, 1);

  // ---------- фаза 2: перемирие ----------
  const OPS = [
    { n: 'NANOTRASEN', s: 'ОПЗ', c: '#4aa8d8', p: 3, x: 0.28 },
    { n: 'VITEZSTVI', s: 'НА ОБЕ СТОРОНЫ', c: '#ff1a2e', p: 2, x: 0.5 },
    { n: 'ПРОМЫСЕЛ СНК', s: 'СНК', c: '#ffb347', p: 3, x: 0.72 },
  ];
  let quota = 0, tension = 0, spike = 0, nextEvt = 6, evtText = '', evtT = 0;

  return new Promise(resolve => {
    function pickLayer(idx, el) {
      if (phase !== 'layers' || over) return;
      if (idx === placed) {
        placed++; el.disabled = true; el.classList.add('right');
        A.sfx.thud(0.25); A.tone({ f: 180 + placed * 60, dur: 0.3, vol: 0.05 });
        upd();
        if (placed === 5) scope.timeout(startTruce, 900);
      } else {
        errors++; el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong');
        A.sfx.buzz(); FX.shake('sm'); upd();
        if (errors >= 3) { over = true; lose('Разрез не сошёлся. Данные о коре утеряны.'); }
      }
    }
    cardEls.forEach(b => scope.on(b, 'click', () => pickLayer(+b.dataset.i, b)));
    ctx.keys(e => {
      const v = parseInt(e.key, 10);
      if (phase === 'layers' && v >= 1 && v <= 5) { e.preventDefault(); pickLayer(+cardEls[v - 1].dataset.i, cardEls[v - 1]); }
      if (phase === 'truce') {
        const map = { KeyQ: [0, 1], KeyA: [0, -1], KeyW: [1, 1], KeyS: [1, -1], KeyE: [2, 1], KeyD: [2, -1] };
        const m = map[e.code]; if (m) { e.preventDefault(); adj(m[0], m[1]); }
      }
    });

    let ctl = null;
    function startTruce() {
      if (over) return;
      phase = 'truce'; cards.remove();
      ctl = ctx.el('div', 'ol-ops');
      OPS.forEach((o, i) => {
        const w = ctx.el('div', 'ol-op', ctl, `<b style="color:${o.c}">${o.n}</b><small>${o.s}</small>`);
        const row = ctx.el('div', 'ol-op-row', w);
        const dn = ctx.el('button', 'btn', row, '▼'); const val = ctx.el('span', 'ol-val', row); const up = ctx.el('button', 'btn', row, '▲');
        o.val = val;
        scope.on(dn, 'click', () => adj(i, -1)); scope.on(up, 'click', () => adj(i, 1));
      });
      OPS.forEach(o => { o.val.textContent = o.p; });
      ctx.hint('▲▼ — МОЩНОСТЬ ШАХТЫ · ДОБЫВАЙ НОРМУ · ПЕРЕКОС ОПЗ И СНК ПОДНИМАЕТ НАПРЯЖЕНИЕ');
      ctx.say('Хрупкое перемирие. Каждая сторона готова пустить в ход любое оружие.', { pos: 'top', cls: 'amb' });
      scope.timeout(() => ctx.unsay('top'), 3200);
    }
    function adj(i, d) {
      if (phase !== 'truce' || over) return;
      const o = OPS[i]; o.p = clamp(o.p + d, 0, 6); o.val.textContent = o.p;
      A.sfx.click(); A.tone({ f: 120 + o.p * 25, type: 'square', dur: 0.05, vol: 0.02 });
    }
    async function lose(text) {
      over = true; hum.vol(0, 0.2);
      A.sfx.shot(0.5); A.sfx.thud(0.6); FX.shake('lg'); FX.flash('#ff2200', 500, 0.6);
      await ctx.line(text, { pos: 'top', cls: 'red', ms: 2800 });
      resolve({ ok: 'fail', detail: phase === 'layers' ? `СЛОЁВ ${placed}/5` : `НОРМА ${Math.round(quota)}% · НАПРЯЖЕНИЕ 100%` });
    }
    async function win() {
      over = true;
      A.sfx.chime(520, 0.06);
      await ctx.line('Планета-сокровищница стала планетой-призраком.', { pos: 'top', ms: 2600 });
      await ctx.line('Ледяное безмолвие нарушает только человеческая жадность.', { pos: 'top', ms: 2800 });
      resolve({ ok: 'ok', detail: `НОРМА 100% · НАПРЯЖЕНИЕ ${Math.round(tension)}%` });
    }

    scope.loop(dt => {
      t += dt;
      if (phase === 'truce' && !over) {
        const [nt, vz, snk] = OPS.map(o => o.p);
        const rate = (nt + snk) * 0.55 + vz * 0.7;                     // Vitezstvi работает на обе стороны — добывает, не злит
        quota = Math.min(100, quota + rate * dt * 0.95);
        const skew = Math.abs(nt - snk);
        const target = clamp(skew * 16 + Math.max(0, nt + snk - 8) * 9 + Math.max(0, vz - 3) * 12 + spike, 0, 120);
        tension += (target - tension) * Math.min(1, dt * 0.55);
        spike = Math.max(0, spike - dt * 7);
        nextEvt -= dt;
        if (nextEvt <= 0) {
          nextEvt = rand(5, 8);
          const ev = pick([['Конкуренты встретились в узком тоннеле. Очереди.', 38], ['NanoTrasen требует увеличить добычу.', 0], ['СНК стягивает охрану к шахтам.', 26], ['Отдалённый взрыв на глубине 190 км.', 30]]);
          evtText = ev[0]; evtT = 3; spike += ev[1];
          if (ev[1] === 0) { OPS[0].p = Math.min(6, OPS[0].p + 2); OPS[0].val.textContent = OPS[0].p; }
          if (ev[1] > 25) A.sfx.gunfire(4, 0.12); else A.sfx.alarm(0.03);
        }
        evtT -= dt;
        ctx.stat(`НОРМА ${Math.floor(quota)}% · НАПРЯЖЕНИЕ ${Math.floor(tension)}%`);
        if (tension >= 100) lose('Шахты взорваны. Перемирие кончилось на глубине.');
        else if (quota >= 100) win();
      }
      hum.freq(41 + (phase === 'truce' ? tension * 0.2 : 0));
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#030406'; g.fillRect(0, 0, W, H);
      const R = mulberry(12);
      for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${R() * 0.5})`; g.fillRect(R() * W, R() * H * 0.6, 1, 1); }
      // планета «лежит на боку»: разрез — полукруг снизу
      const cx = W / 2, cy = H * (phase === 'truce' ? 1.02 : 0.95), rad = Math.min(W * 0.62, H * 0.86);
      const bands = [[1, 0.985], [0.985, 0.955], [0.955, 0.72], [0.72, 0.5], [0.5, 0.38]];
      for (let i = 4; i >= 0; i--) {
        if (i >= placed && phase === 'layers') {
          g.strokeStyle = 'rgba(255,0,51,.25)'; g.setLineDash([6, 6]); g.lineWidth = 1;
          g.beginPath(); g.arc(cx, cy, rad * bands[i][0], Math.PI, 0); g.stroke(); g.setLineDash([]);
          continue;
        }
        const L = LAYERS[i];
        g.fillStyle = L.c; g.beginPath(); g.arc(cx, cy, rad * bands[i][0], Math.PI, 0); g.arc(cx, cy, rad * bands[i][1], 0, Math.PI, true); g.closePath(); g.fill();
        if (L.k === 'ice' || L.k === 'surf') { g.strokeStyle = 'rgba(255,255,255,.12)'; for (let k = 0; k < 18; k++) { const a = Math.PI + R() * Math.PI, r0 = rad * (bands[i][1] + R() * (bands[i][0] - bands[i][1])); g.beginPath(); g.arc(cx, cy, r0, a, a + 0.08); g.stroke(); } }
        if (L.k === 'ore') { for (let k = 0; k < 40; k++) { const a = Math.PI + R() * Math.PI, r0 = rad * (0.39 + R() * 0.1); g.fillStyle = `rgba(255,${200 + R() * 55 | 0},120,${0.4 + 0.3 * Math.sin(t * 2 + k)})`; g.fillRect(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, 3, 3); } }
      }
      if (placed > 0) { g.fillStyle = '#120a08'; g.beginPath(); g.arc(cx, cy, rad * 0.38, Math.PI, 0); g.fill(); }
      // шахты операторов
      if (phase === 'truce') {
        OPS.forEach(o => {
          const x = cx + (o.x - 0.5) * rad * 1.6, top = cy - Math.sqrt(Math.max(0, rad * rad - (x - cx) ** 2)), bot = cy - Math.sqrt(Math.max(0, (rad * 0.42) ** 2 - (x - cx) ** 2 * 0.5));
          g.strokeStyle = o.c; g.lineWidth = 2 + o.p * 0.6; g.globalAlpha = 0.85;
          g.beginPath(); g.moveTo(x, top); g.lineTo(x, Math.min(cy, bot)); g.stroke();
          const hy = top + ((t * (20 + o.p * 12)) % Math.max(1, Math.min(cy, bot) - top));
          g.fillStyle = '#fff'; g.fillRect(x - 3, hy - 3, 6, 6);
          g.globalAlpha = 1;
          g.fillStyle = o.c; g.font = `11px ${MONO}`; g.textAlign = 'center'; g.fillText(o.n, x, top - 10);
        });
        // трещины напряжения между ОПЗ и СНК
        const k = tension / 100;
        if (k > 0.2) {
          g.strokeStyle = `rgba(255,0,51,${k})`; g.lineWidth = 1 + k * 2;
          const R2 = mulberry(Math.floor(t * 3));
          for (let c = 0; c < 3 + k * 8; c++) { let x = cx - rad * 0.35, y = cy - rad * (0.6 + R2() * 0.3); g.beginPath(); g.moveTo(x, y); while (x < cx + rad * 0.35) { x += 10 + R2() * 20; y += (R2() - 0.5) * 18; g.lineTo(x, y); } g.stroke(); }
        }
        if (evtT > 0) { g.fillStyle = `rgba(255,179,71,${Math.min(1, evtT)})`; g.font = `13px ${MONO}`; g.textAlign = 'center'; g.fillText(evtText, W / 2, H * 0.16); }
        // полосы нормы и напряжения
        const bw = Math.min(W * 0.6, 420), bx = (W - bw) / 2;
        g.fillStyle = 'rgba(0,255,136,.15)'; g.fillRect(bx, H * 0.08, bw, 4); g.fillStyle = '#00ff88'; g.fillRect(bx, H * 0.08, bw * quota / 100, 4);
        g.fillStyle = 'rgba(255,0,51,.15)'; g.fillRect(bx, H * 0.08 + 10, bw, 4); g.fillStyle = tension > 70 ? '#ff0033' : '#ff6680'; g.fillRect(bx, H * 0.08 + 10, bw * Math.min(1, tension / 100), 4);
      } else {
        g.fillStyle = 'rgba(239,230,207,.7)'; g.font = `12px ${MONO}`; g.textAlign = 'center';
        g.fillText('ОЛ-12-П · ДИАМЕТР 38 226 КМ · НАКЛОН ОСИ ≈ 82°', W / 2, H * 0.1);
      }
      Art.scan(g, W, H, 0.08);
    }
  });
}
