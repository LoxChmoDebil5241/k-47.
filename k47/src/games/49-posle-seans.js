/* ==========================================================================
   Глава 49 · «После» — СЕАНС
   Белая комната. Тикают часы. Всё — оружие: стул, планшет, ручка, бутылка,
   край стола, провода. Её запястья. Смотри на фикус, на её глаза.
   Отвечай. Когда кулак сам обрушится на стол — садись обратно.
   Её страх — шкала. Дойдёт до конца — тревожная кнопка под столом.
   ========================================================================== */
defineFrag(48, {
  id: 'after', name: 'Это уже начало',
  text: '— Я не знаю, что говорить, — сказал он наконец. Она улыбнулась. На этот раз улыбка была настоящей. Мягкой. — Это уже начало, — сказала она.',
  how: 'Взгляд (палец, мышь или ← →) сам находит оружие: стул, ручку, край стола, её запястья. Пока смотришь на них — ей страшно. Смотри на фикус или ей в глаза. Отвечай на вопросы. Когда тело рванётся — зажми «СЕСТЬ». Её страх дойдёт до конца — сеанс окончен.',
  keys: 'ВЕСТИ ВЗГЛЯД — ПАЛЕЦ / МЫШЬ / ← → · 1…3 — ОТВЕТ · ЗАЖАТЬ ПРОБЕЛ — СЕСТЬ',
  note: '«Позвони, если будет трудно». Белая карточка с номером — тринадцатая. Я не знаю, как пользоваться телефоном. Я не знаю, что значит «трудно». Фикус, наверное, уже начал умирать.',
  noteDist: 'В этой записи я сказал «извините». Архив говорит, что я не знал этого слова.',
  mem: 'ЭТО УЖЕ НАЧАЛО', start: gameAfter,
});

function gameAfter(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  // точки взгляда (в долях холста): оружие и безопасные
  const SPOTS = [
    { k: 'ficus', n: 'ФИКУС', x: 0.12, y: 0.45, safe: -0.1, tip: 'Листья зелёные. Кончики — жёлтые. Его нужно полить.' },
    { k: 'eyes', n: 'ЕЁ ГЛАЗА', x: 0.55, y: 0.27, safe: -0.05, tip: 'Карие. Не такие, как у той, с фотографии.' },
    { k: 'chair', n: 'СТУЛ', x: 0.84, y: 0.66, w: 0.1, tip: 'Если размахнуться — проломить череп.' },
    { k: 'tablet', n: 'ПЛАНШЕТ', x: 0.46, y: 0.56, w: 0.12, tip: 'Тяжёлый. Острым углом — в горло.' },
    { k: 'pen', n: 'РУЧКА', x: 0.62, y: 0.58, w: 0.14, tip: 'В глаз. Или в сонную артерию.' },
    { k: 'bottle', n: 'БУТЫЛКА', x: 0.33, y: 0.53, w: 0.12, tip: 'Разбить. Осколки.' },
    { k: 'edge', n: 'КРАЙ СТОЛА', x: 0.5, y: 0.66, w: 0.14, tip: 'Ударить головой — оглушить.' },
    { k: 'wires', n: 'ПРОВОДА', x: 0.72, y: 0.92, w: 0.1, tip: 'Задушить.' },
    { k: 'wrist', n: 'ЗАПЯСТЬЯ', x: 0.58, y: 0.5, w: 0.26, tip: 'Вывернуть локоть, сломать плечо. Две секунды.' },
    { k: 'door', n: 'ДВЕРЬ', x: 0.93, y: 0.4, w: 0.05, tip: 'Четыре шага. Две секунды. Но куда дальше?' },
  ];
  const Q = [
    { q: '— Как ты себя чувствуешь?', o: ['Молчать', '«Нормально»', '«Где я?»'], fear: [0.08, 0.02, 0.1] },
    { q: '— Ты помнишь своё имя?', o: ['«К-48»', '«Кристиан»', 'Молчать'], fear: [0.12, -0.1, 0.06], good: 1 },
    { q: '— Кристиан. Что ты чувствуешь?', o: ['«Не знаю»', '«Ничего»', 'Смотреть на её шею'], fear: [-0.05, 0.04, 0.22], good: 0 },
    { q: '— Ты боишься?', o: ['«Нет»', '«Капсулы»', 'Молчать'], fear: [0, -0.04, 0.05] },
    { q: '— Ты злишься?', o: ['«Нет»', 'Сжать кулаки', '«Не знаю»'], fear: [0, 0.14, 0.02] },
    { q: 'RAGE' },
    { q: 'Она ждёт одного слова. Секунду. Две. Три.', o: ['Молчать', '«Извините»'], fear: [0.02, -0.06], sorry: 1 },
    { q: '— Я хочу помочь тебе. Но для этого тебе нужно говорить.', o: ['«Я не знаю, что говорить»', 'Молчать', '«Мне не нужна помощь»'], fear: [-0.12, 0.06, 0.08], good: 0 },
  ];
  let t = 0, over = false, gx = 0.12, gy = 0.45, cur = null, fear = 0.15, qi = -1, phase = 'look', rage = 0, rageT = 0, sat = 0, tick = 0, gazeI = 0, sorry = false, goods = 0, card = false;
  const fM = ctx.meter('ЕЙ СТРАШНО', { cls: 'red', left: 14, top: 14 });
  const qEl = ctx.el('p', 'ps-q');
  qEl.setAttribute('aria-live', 'polite');
  const qBox = ctx.el('div', 'ctl ps-ctl');
  const oBox = ctx.el('div', 'ps-opts', qBox);
  ctx.hint('СМОТРИ НА ФИКУС ИЛИ ЕЙ В ГЛАЗА · ОТВЕЧАЙ');

  return new Promise(resolve => {
    const mv = e => { const r = C.cv.getBoundingClientRect(); gx = (e.clientX - r.left) / C.W; gy = (e.clientY - r.top) / C.H; };
    scope.on(C.cv, 'pointermove', mv); scope.on(C.cv, 'pointerdown', mv);
    ctx.keys(e => {
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { e.preventDefault(); gazeI = (gazeI + (e.code === 'ArrowRight' ? 1 : SPOTS.length - 1)) % SPOTS.length; gx = SPOTS[gazeI].x; gy = SPOTS[gazeI].y; }
    });
    let hold = null;
    function ask() {
      qi++;
      if (qi >= Q.length) return cardPhase();
      const q = Q[qi];
      if (q.q === 'RAGE') return ragePhase();
      phase = 'ask'; qEl.textContent = q.q; oBox.innerHTML = '';
      ctx.choose(q.o).then(k => {
        if (over || !scope.alive) return;
        fear = clamp(fear + q.fear[k], 0, 1);
        if (q.good === k) goods++;
        if (q.sorry === k) sorry = true;
        A.sfx.type(0.04);
        qEl.textContent = '';
        phase = 'look';
        scope.timeout(ask, 2600);
      });
    }
    function ragePhase() {
      phase = 'rage'; rageT = 0;
      A.sfx.thud(0.8); FX.shake('lg');
      qEl.textContent = 'Кулак обрушился на стол. Стул отлетел к стене. «Куда?»';
      fear = Math.min(1, fear + 0.18);
      hold = mgHold(ctx, 'СЕСТЬ ОБРАТНО', { parent: oBox });
    }
    function cardPhase() {
      phase = 'card'; qEl.textContent = '— Позвони, если будет трудно. — Белая карточка с номером.';
      oBox.innerHTML = '';
      const b = ctx.el('button', 'btn btn-primary', oBox, 'ВЗЯТЬ КАРТОЧКУ');
      b.addEventListener('click', () => { card = true; A.sfx.pop(0.1); end(true); });
      requestAnimationFrame(() => b.focus({ preventScroll: true }));
    }
    async function end(ok) {
      if (over) return; over = true; qBox.remove(); qEl.remove();
      if (!ok) {
        A.sfx.alarm(0.05);
        await ctx.line('Её рука скользнула под стол. Тревожная кнопка. Шаги в коридоре.', { pos: 'top', cls: 'red', ms: 2800 });
        resolve({ ok: 'fail', detail: `ВОПРОС ${qi + 1} ИЗ ${Q.length}` });
        return;
      }
      await ctx.line('— Ты можешь идти. Мы увидимся на следующей неделе.', { pos: 'top', ms: 2400 });
      await ctx.line('Дверь с надписью «Выход». Он не решался открыть её.', { pos: 'top', ms: 2600 });
      if (sorry) resolve({ ok: 'dist', detail: 'СКАЗАЛ «ИЗВИНИТЕ»' });
      else resolve({ ok: 'ok', detail: `ЕЙ СТРАШНО ${Math.round(fear * 100)}%` });
    }
    scope.loop(dt => {
      t += dt; tick += dt;
      if (tick >= 1) { tick = 0; A.tone({ f: 2400, type: 'square', dur: 0.015, vol: 0.02 }); }
      if (!over) {
        // что под взглядом
        cur = null; let best = 1e9;
        SPOTS.forEach(s => { const d = Math.hypot((s.x - gx) * C.W, (s.y - gy) * C.H); const r = (s.w || 0.08) * C.W * 0.6 + 20; if (d < r && d < best) { best = d; cur = s; } });
        if (cur) fear += dt * (cur.safe !== undefined ? cur.safe : cur.k === 'wrist' ? 0.12 : 0.05);
        else fear += dt * 0.008;
        if (phase === 'rage') {
          rageT += dt;
          if (hold && hold.down) sat += dt / 2.2; else fear += dt * 0.05;
          if (sat >= 1) { hold.wrap.innerHTML = ''; oBox.innerHTML = ''; qEl.textContent = 'Он медленно опустил кулаки. Сел. Дышать. Глубоко. Ровно.'; phase = 'look'; scope.timeout(ask, 2600); }
        }
        fear = clamp(fear, 0, 1);
        fM.set(fear);
        ctx.stat(`ВОПРОС ${Math.max(1, Math.min(Q.length, qi + 1))}/${Q.length}`);
        if (fear >= 1) end(false);
      }
      draw();
    });
    ask();

    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#eef0f1'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#dfe3e5'; g.fillRect(0, H * 0.72, W, H * 0.28);
      // часы
      const cx = W * 0.3, cy = H * 0.12, r = Math.min(W, H) * 0.05;
      g.strokeStyle = '#8a8f93'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
      const a = (Math.floor(t) % 60) / 60 * Math.PI * 2 - Math.PI / 2;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85); g.stroke();
      // дверь
      g.fillStyle = '#d4d9dc'; g.fillRect(W * 0.9, H * 0.18, W * 0.08, H * 0.54); g.fillStyle = '#6b6b70'; g.font = `10px ${MONO}`; g.textAlign = 'center'; g.fillText('ВЫХОД', W * 0.94, H * 0.24);
      // фикус
      g.fillStyle = '#7a5a3a'; g.fillRect(W * 0.09, H * 0.6, W * 0.06, H * 0.12);
      for (let i = 0; i < 12; i++) { const la = -Math.PI / 2 + (i - 6) * 0.25, lx = W * 0.12 + Math.cos(la) * H * 0.13, ly = H * 0.52 + Math.sin(la) * H * 0.13; g.fillStyle = i % 3 ? '#4f7a45' : '#8a9a45'; g.beginPath(); g.ellipse(lx, ly, H * 0.035, H * 0.014, la, 0, Math.PI * 2); g.fill(); }
      // психолог за столом
      Art.human(g, W * 0.58, H * 0.72, H * 0.62, 'doctor', { color: '#c9ced2' });
      const hy = H * 0.72 - H * 0.62 * 0.926;
      g.fillStyle = '#d8c2ae'; g.beginPath(); g.ellipse(W * 0.58, hy, H * 0.035, H * 0.045, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3b2412'; g.fillRect(W * 0.58 - H * 0.02, hy - H * 0.005, 3, 3); g.fillRect(W * 0.58 + H * 0.013, hy - H * 0.005, 3, 3);
      // стол, планшет, ручка, бутылка
      g.fillStyle = '#ffffff'; g.fillRect(W * 0.28, H * 0.6, W * 0.46, H * 0.06); g.strokeStyle = '#c3c8cb'; g.strokeRect(W * 0.28, H * 0.6, W * 0.46, H * 0.06);
      g.fillStyle = '#2a2c30'; g.fillRect(W * 0.43, H * 0.56, W * 0.07, H * 0.035);
      g.fillStyle = '#1d2850'; g.fillRect(W * 0.6, H * 0.575, W * 0.04, 3);
      g.fillStyle = 'rgba(136,221,255,.6)'; g.fillRect(W * 0.32, H * 0.5, W * 0.02, H * 0.1);
      // стул у стены и провода
      g.fillStyle = '#ffffff'; g.fillRect(W * 0.8, H * 0.58, W * 0.08, H * 0.04); g.fillRect(W * 0.8, H * 0.62, 4, H * 0.12); g.fillRect(W * 0.87, H * 0.62, 4, H * 0.12);
      g.strokeStyle = '#3a3c40'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.62, H); g.bezierCurveTo(W * 0.7, H * 0.88, W * 0.76, H * 0.96, W * 0.84, H * 0.9); g.stroke();
      // взгляд: оружие подсвечено красным, безопасное — янтарным
      if (cur) {
        const x = cur.x * W, y = cur.y * H, rr = (cur.w || 0.08) * W * 0.5 + 12;
        const col = cur.safe !== undefined ? '255,179,71' : '255,0,51';
        g.strokeStyle = `rgba(${col},.9)`; g.lineWidth = 1.5; g.setLineDash([4, 4]); g.strokeRect(x - rr, y - rr * 0.6, rr * 2, rr * 1.2); g.setLineDash([]);
        g.fillStyle = `rgba(${col},1)`; g.font = `11px ${MONO}`; g.textAlign = 'center'; g.fillText(cur.n, x, y - rr * 0.6 - 6);
        g.fillStyle = 'rgba(20,16,16,.8)'; g.font = `12px ${MONO}`; g.fillText(cur.tip, W / 2, H * 0.97);
      }
      g.strokeStyle = 'rgba(20,16,16,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(gx * W, gy * H, 10, 0, Math.PI * 2); g.stroke();
      if (fear > 0.6) { g.fillStyle = `rgba(255,0,51,${(fear - 0.6) * 0.2})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.25);
    }
  });
}
