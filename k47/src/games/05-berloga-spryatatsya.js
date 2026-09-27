/* ==========================================================================
   Глава 5 · «Берлога» — НЕ ИЗДАТЬ ЗВУКА
   Комната в двенадцать метров, вид сверху. Фары машин лучом-сканером
   проходят через окно. Отец стоит в проёме. Попадёшь в луч, когда он смотрит, —
   найдёт. Скрипучие половицы выдают тоже. Переживи эту ночь.
   ========================================================================== */
defineFrag(4, {
  id: 'den', name: 'Не издать звука',
  text: 'Тонкий, как лезвие, луч на мгновение врывался в грязное окно и, словно сканер, пронзал мрак, выхватывая ужасающие детали. Пол был деревянным, скрипучим, с прогнившими половицами. В углу, у батареи, доски вытерлись до мягкой, трухлявой кашицы.',
  how: 'Двигайся по клеткам комнаты. Перед каждым лучом фар стекло вспыхивает — уйди из освещённой полосы в тень мебели. Тёмные половицы скрипят: наступишь — шум. Отец в проёме. Продержись, пока он не уйдёт на кухню.',
  keys: 'СТРЕЛКИ / WASD ИЛИ ТАП ПО СОСЕДНЕЙ КЛЕТКЕ',
  note: 'Он прошёл мимо. Я сидел у батареи и шептал своё единственное заклинание. — Мама…',
  mem: 'У БАТАРЕИ', start: gameDen,
});

function gameDen(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const noiseM = ctx.meter('ШУМ', { left: 14, top: 14 });
  const COLS = 7, ROWS = 5, DUR = 44;
  // # — мебель (тень за ней безопасна), c — скрипучая половица, B — батарея
  const MAP = [
    '##.c..#',
    '#..c...',
    '..c..c.',
    'B...c..',
    '#..#..#',
  ];
  const grid = MAP.map(r => r.split(''));
  let px = 1, py = 3, noise = 0, t = 0, over = false, father = 0, beam = null, nextBeam = 3.5, caughtFlash = 0, beams = 0;
  const WIN = { x: 3.5, y: -0.6 };                      // окно — сверху
  const DOOR = { x: 7, y: 2 };                           // проём — справа
  const tv = scope.own(A.loopNoise({ type: 'lowpass', freq: 300, q: 0.6, vol: 0 }));
  tv.vol(0.02, 1);
  let fatherSteps = 0;
  ctx.hint('ВСПЫШКА НА ОКНЕ — СЕЙЧАС ПРОЙДЁТ ЛУЧ · ТЁМНЫЕ ДОСКИ СКРИПЯТ');
  ctx.stat('');

  return new Promise(resolve => {
    const cell = () => { const s = Math.min(C.W / (COLS + 1.2), C.H / (ROWS + 1.6)); return { s, ox: (C.W - s * COLS) / 2, oy: (C.H - s * ROWS) / 2 + s * 0.2 }; };
    function move(dx, dy) {
      if (over) return;
      const nx = px + dx, ny = py + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || grid[ny][nx] === '#') { A.sfx.thud(0.08); return; }
      px = nx; py = ny;
      if (grid[ny][nx] === 'c') { noise = Math.min(1, noise + 0.34); A.sfx.creak(0.22); ctx.say('Скрипнула половица.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 900); }
      else { noise = Math.min(1, noise + 0.05); A.noise({ type: 'lowpass', freq: 500, dur: 0.1, vol: 0.03 }); }
      if (noise >= 1) caught('Он услышал.');
    }
    ctx.keys(e => {
      const m = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[e.code];
      if (m) { e.preventDefault(); move(...m); }
    });
    scope.on(C.cv, 'pointerdown', e => {
      const r = C.cv.getBoundingClientRect(), { s, ox, oy } = cell();
      const cx = Math.floor((e.clientX - r.left - ox) / s), cy = Math.floor((e.clientY - r.top - oy) / s);
      const dx = cx - px, dy = cy - py;
      if (Math.abs(dx) + Math.abs(dy) === 1) move(dx, dy);
    });

    /** клетка освещена лучом? луч — клин из окна под углом beam.a */
    function lit(x, y) {
      if (!beam || beam.warn > 0) return false;
      const ang = Math.atan2(y + 0.5 - WIN.y, x + 0.5 - WIN.x);
      if (Math.abs(ang - beam.a) > beam.w) return false;
      // тень от мебели: если на отрезке от окна до клетки есть '#', клетка в тени
      const steps = 12;
      for (let k = 1; k < steps; k++) {
        const fx = WIN.x + (x + 0.5 - WIN.x) * k / steps, fy = WIN.y + (y + 0.5 - WIN.y) * k / steps;
        const gx = Math.floor(fx), gy = Math.floor(fy);
        if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS && grid[gy][gx] === '#' && !(gx === x && gy === y)) return false;
      }
      return true;
    }
    async function caught(text) {
      if (over) return;
      over = true; caughtFlash = 1;
      A.sfx.step(0.6, 0.6); A.sfx.step(0.7, 0.4, 0.4); A.sfx.thud(0.7);
      FX.shake('lg');
      await ctx.line(text, { pos: 'top', cls: 'red', ms: 1800 });
      A.sfx.crunch(0.5); FX.flash('#300008', 600, 0.9);
      await ctx.line('Комнату пронзил короткий, костяной щелчок.', { pos: 'top', cls: 'red', ms: 2600 });
      await ctx.line('— Мама…', { pos: 'mid', ms: 2200 });
      resolve({ ok: 'fail', detail: `ПРОДЕРЖАЛСЯ ${Math.floor(t)} С ИЗ ${DUR}` });
    }
    async function win() {
      over = true;
      A.sfx.step(0.3, 0.8); A.sfx.step(0.25, 0.9, 0.5); A.sfx.step(0.18, 1, 1);
      await ctx.line('Шаги ушли на кухню. Звякнули пустые бутылки.', { pos: 'top', ms: 2600 });
      await ctx.line('— Мама…', { pos: 'mid', ms: 2200 });
      resolve({ ok: 'ok', detail: `ШУМ ${Math.round(noise * 100)}%` });
    }

    scope.loop(dt => {
      t += dt;
      if (!over) {
        noise = Math.max(0, noise - dt * 0.05);
        noiseM.set(noise);
        father = t < 6 ? 0 : t < 9 ? (t - 6) / 3 : t < DUR - 4 ? 1 : Math.max(0, (DUR - t) / 4);
        fatherSteps -= dt;
        if (t > 4 && t < 9 && fatherSteps <= 0) { fatherSteps = 0.7; A.sfx.step(0.2 + father * 0.3, 0.7); }
        nextBeam -= dt;
        if (!beam && nextBeam <= 0) {
          beams++;
          const a = Math.PI / 2 + rand(-0.9, 0.9);
          beam = { a, w: rand(0.2, 0.3), warn: 1.4, t: 1.3, sweep: rand(-0.12, 0.12) };
          A.noise({ type: 'bandpass', freq: 300, f2: 900, q: 1, dur: 1.4, vol: 0.06, attack: 0.8 });
        }
        if (beam) {
          if (beam.warn > 0) beam.warn -= dt;
          else {
            beam.t -= dt; beam.a += beam.sweep * dt;
            if (father > 0.9 && lit(px, py)) caught('Луч выхватил его из темноты. Отец смотрел прямо на него.');
            if (beam.t <= 0) { beam = null; nextBeam = rand(1.6, 3); }
          }
        }
        ctx.stat(`${father > 0.9 ? 'ОТЕЦ В ПРОЁМЕ' : t < 9 ? 'ШАГИ…' : 'УХОДИТ…'} · ${Math.max(0, Math.ceil(DUR - t))} С`);
        if (t >= DUR) win();
      }
      caughtFlash = Math.max(0, caughtFlash - dt);
      draw();
    });

    function draw() {
      const { g, W, H } = C, { s, ox, oy } = cell();
      g.fillStyle = '#020102'; g.fillRect(0, 0, W, H);
      // пол
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const c = grid[y][x], X = ox + x * s, Y = oy + y * s;
        g.fillStyle = c === 'c' ? '#1a0e0a' : '#120c0a'; g.fillRect(X, Y, s - 1, s - 1);
        g.strokeStyle = 'rgba(80,50,30,.2)'; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(X, Y + k * s / 4); g.lineTo(X + s, Y + k * s / 4); g.stroke(); }
        if (c === 'c') { g.fillStyle = 'rgba(50,20,10,.7)'; g.fillRect(X + s * 0.1, Y + s * 0.35, s * 0.8, s * 0.16); }
        if (c === '#') { g.fillStyle = '#060404'; g.fillRect(X + 2, Y + 2, s - 5, s - 5); g.strokeStyle = 'rgba(120,80,60,.25)'; g.strokeRect(X + 3, Y + 3, s - 7, s - 7); }
        if (c === 'B') { g.fillStyle = '#2a0f0a'; for (let k = 0; k < 5; k++) g.fillRect(X + s * 0.1 + k * s * 0.17, Y + s * 0.1, s * 0.1, s * 0.8); }
      }
      // окно, проём
      g.fillStyle = beam && beam.warn > 0 ? `rgba(255,240,200,${0.4 + 0.4 * Math.sin(t * 30)})` : 'rgba(120,130,140,.4)';
      g.fillRect(ox + (WIN.x - 0.8) * s, oy - s * 0.25, s * 1.6, s * 0.12);
      const dxp = ox + COLS * s, dyp = oy + DOOR.y * s;
      g.fillStyle = 'rgba(255,200,150,.12)'; g.fillRect(dxp, dyp, s * 0.4, s);
      if (father > 0.05) { g.globalAlpha = father; Art.human(g, dxp + s * 0.25, dyp + s * 1.3, s * 1.9, 'fat', { color: '#000' }); g.globalAlpha = 1; }
      // луч фар: сначала — бледный контур, куда он пройдёт
      if (beam && beam.warn > 0) {
        const wx = ox + WIN.x * s, wy = oy + WIN.y * s, L = s * 9;
        g.fillStyle = `rgba(255,245,215,${0.05 + 0.05 * Math.sin(t * 20)})`; g.strokeStyle = 'rgba(255,245,215,.35)'; g.setLineDash([5, 6]);
        g.beginPath(); g.moveTo(wx, wy); g.arc(wx, wy, L, beam.a - beam.w, beam.a + beam.w); g.closePath(); g.fill(); g.stroke(); g.setLineDash([]);
      }
      if (beam && beam.warn <= 0) {
        const wx = ox + WIN.x * s, wy = oy + WIN.y * s, L = s * 9;
        const gr = g.createRadialGradient(wx, wy, 0, wx, wy, L);
        gr.addColorStop(0, 'rgba(255,245,215,.55)'); gr.addColorStop(1, 'rgba(255,245,215,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(wx, wy); g.arc(wx, wy, L, beam.a - beam.w, beam.a + beam.w); g.closePath(); g.fill();
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] !== '#' && !lit(x, y)) { const ang = Math.atan2(y + 0.5 - WIN.y, x + 0.5 - WIN.x); if (Math.abs(ang - beam.a) <= beam.w) { g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(ox + x * s, oy + y * s, s, s); } }
      }
      // мальчик
      const bx = ox + (px + 0.5) * s, by = oy + (py + 0.5) * s;
      g.fillStyle = '#000'; g.beginPath(); g.arc(bx, by, s * 0.24, 0, Math.PI * 2); g.fill();
      g.strokeStyle = lit(px, py) ? '#ff0033' : 'rgba(239,230,207,.55)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#fff'; g.fillRect(bx - s * 0.08, by - s * 0.04, s * 0.04, s * 0.04); g.fillRect(bx + s * 0.04, by - s * 0.04, s * 0.04, s * 0.04);
      // цифры на стене, которые не складываются в слово
      g.fillStyle = 'rgba(200,190,170,.18)'; g.font = `${Math.round(s * 0.2)}px ${MONO}`; g.textAlign = 'left'; g.fillText('2981 · 47 · 2999', ox + s * 0.1, oy - s * 0.45);
      if (caughtFlash > 0) { g.fillStyle = `rgba(120,0,10,${caughtFlash * 0.6})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.8);
      Art.grain(g, W, H, 0.06);
    }
  });
}
