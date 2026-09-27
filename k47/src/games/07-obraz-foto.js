/* ==========================================================================
   Глава 7 · перенесено из прототипа «Мини-игры» (механика сохранена)
   ========================================================================== */
defineFrag(6, {
  id: "photo", name: "Фото",
  text: "С фотографии смотрела женщина. У неё были карие волосы — такие же, как у него, — и тёмно-карие глаза. А за её спиной было нечто, чего мальчик никогда не видел вживую. Трава.",
  how: "Фото погнулось и треснуло. Собери куски: касание — выбрать, второе касание — поменять местами. Картонка ветшает от каждого прикосновения. Потом сотри с неё грязь.",
  keys: "ТАП / ENTER — ВЫБРАТЬ И ПОМЕНЯТЬ · ЛИМИТ ПРИКОСНОВЕНИЙ · ПОТОМ ВОДИ ПАЛЬЦЕМ ИЛИ МЫШЬЮ ПО ФОТО",
  note: "Спокойной ночи, мама. Картонка погнулась, но я сберёг. Ладно?",
  mem: "ФОТО МАМЫ", start: ctx => gamePhoto(ctx),
});

/* ==========================================================================
   Ф-03 · ФОТО — «Образ». Собрать треснувшую карточку и стереть грязь.
   ========================================================================== */
function paintMotherPhoto(W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); const r = mulberry(4747);
  g.fillStyle = '#efe6cf'; g.fillRect(0, 0, W, H);
  const m = Math.round(W * .05), iw = W - 2 * m, ih = H - 2 * m;
  g.save(); g.beginPath(); g.rect(m, m, iw, ih); g.clip(); g.translate(m, m);
  // небо
  let gr = g.createLinearGradient(0, 0, 0, ih * .56);
  gr.addColorStop(0, '#5a90c2'); gr.addColorStop(1, '#c2d9e6');
  g.fillStyle = gr; g.fillRect(0, 0, iw, ih * .56);
  for (let i = 0; i < 8; i++) {
    const x = r() * iw, y = ih * (.04 + r() * .26), s = iw * (.07 + r() * .11);
    const cg = g.createRadialGradient(x, y, 0, x, y, s * 1.6);
    cg.addColorStop(0, 'rgba(255,255,255,.7)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = cg; g.beginPath(); g.ellipse(x, y, s * 1.6, s * .65, 0, 0, Math.PI * 2); g.fill();
  }
  // деревья
  const hz = ih * .5;
  for (let i = 0; i < 5; i++) { const x = r() * iw; g.fillStyle = '#3a2a1c'; g.fillRect(x, hz - ih * .1, iw * .012, ih * .1); }
  for (let i = 0; i < 70; i++) {
    const x = r() * iw, y = hz - ih * .02 - r() * ih * .13, s = iw * (.03 + r() * .055);
    g.fillStyle = `hsl(${92 + r() * 34}, ${28 + r() * 18}%, ${15 + r() * 16}%)`;
    g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
  }
  // трава
  gr = g.createLinearGradient(0, hz, 0, ih);
  gr.addColorStop(0, '#76a14a'); gr.addColorStop(1, '#3b6628');
  g.fillStyle = gr; g.fillRect(0, hz - 2, iw, ih - hz + 2);
  for (let i = 0; i < 1700; i++) {
    const x = r() * iw, y = hz + Math.pow(r(), .75) * (ih - hz);
    const len = (4 + r() * 16) * (.35 + (y - hz) / (ih - hz));
    g.strokeStyle = `hsla(${78 + r() * 42}, ${34 + r() * 28}%, ${24 + r() * 32}%, .85)`;
    g.lineWidth = r() < .2 ? 1.6 : 1;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - .5) * 5, y - len * .6, x + (r() - .5) * 8, y - len); g.stroke();
  }
  // женщина
  const cx = iw * .5, hy = ih * .38, hr = iw * .1;
  g.fillStyle = '#6b5647';
  g.beginPath(); g.moveTo(cx - iw * .32, ih);
  g.bezierCurveTo(cx - iw * .32, ih * .63, cx - iw * .19, ih * .56, cx - hr * .6, ih * .52);
  g.lineTo(cx + hr * .6, ih * .52);
  g.bezierCurveTo(cx + iw * .19, ih * .56, cx + iw * .32, ih * .63, cx + iw * .32, ih);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(40, 30, 25, .35)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx - iw * .12, ih * .6); g.quadraticCurveTo(cx - iw * .1, ih * .8, cx - iw * .14, ih); g.stroke();
  g.fillStyle = '#d4a286';
  g.beginPath(); g.moveTo(cx - hr * .42, ih * .45); g.lineTo(cx + hr * .42, ih * .45); g.lineTo(cx + hr * .55, ih * .53);
  g.quadraticCurveTo(cx, ih * .6, cx - hr * .55, ih * .53); g.closePath(); g.fill();
  g.fillStyle = '#4b2f1b';
  g.beginPath(); g.arc(cx + hr * .12, hy - hr * 1.12, hr * .5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(cx, hy - hr * .08, hr * 1.06, hr * 1.2, 0, 0, Math.PI * 2); g.fill();
  const fg = g.createRadialGradient(cx - hr * .25, hy - hr * .2, hr * .1, cx, hy, hr * 1.1);
  fg.addColorStop(0, '#f0c4a6'); fg.addColorStop(1, '#c48c6c');
  g.fillStyle = fg; g.beginPath(); g.ellipse(cx, hy + hr * .1, hr * .8, hr * 1, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4b2f1b';
  g.beginPath(); g.moveTo(cx - hr * .88, hy + hr * .05);
  g.bezierCurveTo(cx - hr * .98, hy - hr * 1.2, cx + hr * .92, hy - hr * 1.3, cx + hr * .88, hy);
  g.bezierCurveTo(cx + hr * .55, hy - hr * .72, cx - hr * .3, hy - hr * .82, cx - hr * .88, hy + hr * .05);
  g.fill();
  g.strokeStyle = 'rgba(75, 47, 27, .9)'; g.lineWidth = Math.max(1, iw * .004);
  [[-.7, -.45, -.95, .55], [.62, -.55, .86, .45], [-.2, -.78, -.42, .12]].forEach(([x0, y0, x1, y1]) => {
    g.beginPath(); g.moveTo(cx + hr * x0, hy + hr * y0);
    g.bezierCurveTo(cx + hr * (x0 - .2), hy, cx + hr * (x1 + .15), hy + hr * (y1 - .3), cx + hr * x1, hy + hr * y1); g.stroke();
  });
  const ey = hy + hr * .04;
  g.fillStyle = '#2a170c';
  [-1, 1].forEach(s => { g.beginPath(); g.ellipse(cx + s * hr * .31, ey, hr * .1, hr * .055, 0, 0, Math.PI * 2); g.fill(); });
  g.strokeStyle = 'rgba(70, 40, 25, .7)'; g.lineWidth = Math.max(1, iw * .005);
  [-1, 1].forEach(s => { g.beginPath(); g.moveTo(cx + s * hr * .17, ey - hr * .17); g.quadraticCurveTo(cx + s * hr * .33, ey - hr * .25, cx + s * hr * .47, ey - hr * .16); g.stroke(); });
  g.strokeStyle = 'rgba(150, 90, 60, .55)'; g.lineWidth = Math.max(1, iw * .004);
  g.beginPath(); g.moveTo(cx + hr * .02, ey + hr * .1); g.quadraticCurveTo(cx + hr * .1, ey + hr * .34, cx - hr * .06, ey + hr * .39); g.stroke();
  g.strokeStyle = 'rgba(140, 60, 55, .85)'; g.lineWidth = Math.max(1.2, iw * .006);
  g.beginPath(); g.moveTo(cx - hr * .25, ey + hr * .6); g.quadraticCurveTo(cx + hr * .03, ey + hr * .7, cx + hr * .28, ey + hr * .55); g.stroke();
  g.fillStyle = 'rgba(255, 210, 150, .13)'; g.fillRect(0, 0, iw, ih);
  const vg = g.createRadialGradient(iw / 2, ih / 2, iw * .3, iw / 2, ih / 2, iw * .9);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,20,5,.5)');
  g.fillStyle = vg; g.fillRect(0, 0, iw, ih);
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < .5 ? 'rgba(255,245,225,.08)' : 'rgba(30,20,10,.1)'; g.fillRect(r() * iw, r() * ih, 1.2, 1.2); }
  g.restore();
  // сгиб и трещина
  g.strokeStyle = 'rgba(255, 250, 235, .6)'; g.lineWidth = W * .004;
  g.beginPath(); g.moveTo(W * .06, H * .36); g.lineTo(W * .34, H * .43); g.lineTo(W * .58, H * .39); g.lineTo(W * .95, H * .48); g.stroke();
  g.strokeStyle = 'rgba(120, 100, 80, .25)'; g.lineWidth = W * .01;
  g.beginPath(); g.moveTo(W * .7, 0); g.lineTo(W * .62, H); g.stroke();
  return c;
}

function gamePhoto(ctx) {
  const { scope, body } = ctx;
  const LIMIT = 20;
  const PW = 480, PH = 600;
  const photo = paintMotherPhoto(PW, PH);
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
        const now = Clock.now(); if (now - lastCheck > 220) { lastCheck = now; check(); }
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
