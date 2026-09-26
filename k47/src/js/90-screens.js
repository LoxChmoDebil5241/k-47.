/* ==========================================================================
   ЭКРАНЫ ПО РЕФЕРЕНСАМ
   Splash — главная заставка (референс 3): гигантский красный визор боевого
   шлема анфас, в визоре — семь чёрных силуэтов в ряд; сверху — название,
   снизу — «-и дальше без счёта»; по краям — пиксельные артефакты.
   Death — «КЛОН УНИЧТОЖЕН» (референс 5): красный череп в разбитом шлеме.
   ========================================================================== */
const Splash = (() => {
  const BASE = 1080;
  let staticKey = '', staticCv = null;
  /** шлем-силуэт и пиксельная «грязь» — статичный слой, перерисовывается только при ресайзе */
  function buildStatic(W, H, s, ox, oy) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), R = mulberry(4848);
    g.fillStyle = '#030102'; g.fillRect(0, 0, W, H);
    // пиксельные артефакты: блоки тёмно-красного по краям и у подбородка
    const block = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(ox + x * s), Math.round(oy + y * s), Math.ceil(w * s), Math.ceil(h * s)); };
    const zones = [[0, 520, 300, 560, 1], [760, 380, 320, 700, 1], [120, 820, 220, 260, 0.8], [700, 840, 260, 240, 0.8], [0, 0, 180, 420, 0.25], [900, 0, 180, 300, 0.25]];
    zones.forEach(([zx, zy, zw, zh, dens]) => {
      for (let i = 0; i < 220 * dens; i++) {
        const q = [12, 16, 24, 32, 40][(R() * 5) | 0], x = zx + Math.floor(R() * zw / q) * q, y = zy + Math.floor(R() * zh / q) * q;
        const v = R();
        block(x, y, q, q, v < 0.55 ? `rgba(${40 + (R() * 50) | 0},0,${(R() * 8) | 0},${0.5 + R() * 0.5})` : v < 0.9 ? `rgba(${90 + (R() * 70) | 0},${(R() * 10) | 0},${(R() * 16) | 0},${0.45 + R() * 0.4})` : `rgba(${170 + (R() * 60) | 0},${(R() * 30) | 0},${(R() * 30) | 0},.55)`);
      }
    });
    // шлем и плечи — чёрный силуэт с тусклым красным ободком
    g.save(); g.translate(ox, oy); g.scale(s, s);
    const head = new Path2D();
    head.moveTo(150, 1080); head.bezierCurveTo(150, 960, 210, 900, 250, 880);
    head.bezierCurveTo(180, 820, 150, 700, 160, 560); head.bezierCurveTo(165, 300, 330, 90, 560, 70);
    head.bezierCurveTo(800, 70, 930, 280, 935, 520); head.bezierCurveTo(940, 700, 900, 820, 830, 880);
    head.bezierCurveTo(880, 900, 930, 960, 940, 1080); head.closePath();
    g.shadowColor = 'rgba(120,0,16,.9)'; g.shadowBlur = 28;
    g.fillStyle = '#060203'; g.fill(head);
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(110,0,14,.55)'; g.lineWidth = 5; g.stroke(head);
    // фактура купола: тёмные мазки и отблески
    g.save(); g.clip(head);
    for (let i = 0; i < 70; i++) { g.strokeStyle = R() < 0.7 ? 'rgba(40,0,6,.5)' : 'rgba(120,10,20,.25)'; g.lineWidth = 2 + R() * 8; const x = 200 + R() * 700, y = 90 + R() * 300; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 80, y + R() * 30); g.stroke(); }
    // боковые «уши» шлема и шланги
    g.fillStyle = '#0c0204';
    [[190, 620, 60, 160], [830, 600, 70, 170]].forEach(([x, y, w, h]) => { Art.rr(g, x, y, w, h, 20); g.fill(); });
    g.strokeStyle = 'rgba(90,0,12,.7)'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(230, 700); g.bezierCurveTo(260, 820, 330, 860, 410, 870); g.stroke();
    g.beginPath(); g.moveTo(850, 690); g.bezierCurveTo(820, 810, 760, 860, 680, 875); g.stroke();
    g.restore();
    g.restore();
    return c;
  }
  /** форма визора (две линзы с перемычкой над переносицей) */
  function visorPath() {
    const p = new Path2D();
    p.moveTo(232, 440); p.bezierCurveTo(240, 405, 300, 396, 400, 398); p.lineTo(690, 398); p.bezierCurveTo(800, 398, 860, 405, 872, 442);
    p.lineTo(876, 600); p.bezierCurveTo(876, 690, 820, 708, 720, 704); p.bezierCurveTo(640, 700, 610, 660, 580, 600);
    p.bezierCurveTo(566, 574, 526, 574, 508, 600); p.bezierCurveTo(478, 660, 440, 704, 360, 706);
    p.bezierCurveTo(262, 708, 222, 680, 222, 600); p.closePath();
    return p;
  }
  const FIG = [[266, 0.9], [330, 0.97], [428, 1.02], [540, 1.07], [652, 1.02], [752, 0.98], [818, 0.9]];
  let glitchT = 0, glitchY = 0, glitchH = 0, gone = -1, goneT = 0;
  /**
   * Нарисовать заставку. t — секунды; opts.text — рисовать ли надписи; opts.fade 0…1.
   */
  function draw(g, W, H, t, { text = true, count = 7, fade = 1 } = {}) {
    const s = Math.min(W / BASE, H / BASE) * (W < H ? 1.25 : 1.02);
    const ox = (W - BASE * s) / 2, oy = (H - BASE * s) / 2 + (W < H ? H * 0.02 : 0);
    const key = `${W}x${H}`;
    if (key !== staticKey) { staticCv = buildStatic(W, H, s, ox, oy); staticKey = key; }
    g.drawImage(staticCv, 0, 0);
    g.save(); g.translate(ox, oy); g.scale(s, s);
    // налобный фонарь — красный овал
    const lamp = 0.8 + 0.2 * Math.sin(t * 1.7) + (Math.random() < 0.02 ? -0.3 : 0);
    g.save(); g.translate(700, 158); g.rotate(-0.12);
    const lg = g.createRadialGradient(0, 0, 10, 0, 0, 120);
    lg.addColorStop(0, `rgba(255,40,50,${0.95 * lamp})`); lg.addColorStop(0.55, `rgba(190,0,20,${0.8 * lamp})`); lg.addColorStop(0.8, 'rgba(90,0,10,.9)'); lg.addColorStop(1, 'rgba(20,0,2,0)');
    g.fillStyle = lg; g.beginPath(); g.ellipse(0, 0, 118, 96, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(40,0,4,.9)'; g.lineWidth = 16; g.beginPath(); g.ellipse(0, 0, 112, 90, 0, 0.3, 2.4); g.stroke();
    g.restore();
    // визор
    const vp = visorPath(), pulse = 0.88 + 0.12 * Math.sin(t * 2.2);
    g.save(); g.shadowColor = 'rgba(255,0,30,.8)'; g.shadowBlur = 60 * pulse;
    const vg = g.createLinearGradient(0, 398, 0, 706);
    vg.addColorStop(0, `rgba(255,${40 + 30 * pulse | 0},55,1)`); vg.addColorStop(0.35, '#e0001e'); vg.addColorStop(1, '#9a0014');
    g.fillStyle = vg; g.fill(vp); g.restore();
    g.save(); g.clip(vp);
    // семь силуэтов; изредка один исчезает
    goneT -= 1 / 30;
    if (goneT <= 0) { gone = Math.random() < 0.35 ? (Math.random() * 7) | 0 : -1; goneT = gone >= 0 ? 0.35 + Math.random() * 0.6 : 2 + Math.random() * 4; }
    FIG.slice(0, count).forEach(([x, k], i) => {
      if (i === gone) return;
      const hgt = 330 * k, sway = Math.sin(t * 0.7 + i) * 1.5;
      Art.human(g, x + sway, 470 + hgt * 0.92, hgt, 'suit', { color: '#050102' });
    });
    // блики и скан-линии в стекле
    g.fillStyle = 'rgba(255,190,200,.12)'; g.fillRect(232, 410, 640, 10);
    g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 400; y < 710; y += 6) g.fillRect(220, y, 660, 2);
    g.restore();
    g.strokeStyle = 'rgba(60,0,8,.95)'; g.lineWidth = 10; g.stroke(vp);
    // надписи
    if (text) {
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 8;
      g.fillStyle = '#efe6cf';
      g.font = `400 34px ${PIXEL}`; g.fillText('К-47', 540, 318);
      g.font = `400 40px ${PIXEL}`; g.fillText('НОРМЫ РАСХОДА ПЛОТИ', 540, 362);
      g.font = `400 30px ${PIXEL}`; g.fillText('ЦИКЛ-48.', 540, 398 - 2);
      g.shadowBlur = 0;
      g.font = `400 26px ${MONO}`; g.fillStyle = 'rgba(239,230,207,.9)';
      const cut = '-и   дальше   без   счёта';
      g.fillText(cut, 540, 764);
    }
    g.restore();
    // глитч: сдвиг горизонтальной полосы
    glitchT -= 1 / 30;
    if (glitchT <= 0) { glitchT = Math.random() < 0.3 ? 0.08 + Math.random() * 0.15 : 1.2 + Math.random() * 3; glitchY = Math.random() * H; glitchH = 6 + Math.random() * 40; }
    if (glitchT < 0.25 && !REDUCED) {
      const off = (Math.random() - 0.5) * 40;
      try { g.drawImage(g.canvas, 0, glitchY * (g.canvas.height / H), g.canvas.width, glitchH * (g.canvas.height / H), off * (g.canvas.width / W), glitchY, W, glitchH); } catch { /* */ }
      g.fillStyle = 'rgba(255,0,51,.08)'; g.fillRect(0, glitchY, W, glitchH);
    }
    Art.scan(g, W, H, 0.18);
    Art.grain(g, W, H, 0.06);
    Art.vignette(g, W, H, 0.75);
    if (fade < 1) { g.fillStyle = `rgba(0,0,0,${1 - fade})`; g.fillRect(0, 0, W, H); }
  }
  /** запустить на холсте cv; вернёт stop() */
  function run(cv, opts = {}) {
    const g = cv.getContext('2d');
    let t = 0, alive = true, raf = 0, last = performance.now(), acc = 1;
    const fit = () => { const k = Math.min(1.5, window.devicePixelRatio || 1); cv.width = Math.round(cv.clientWidth * k); cv.height = Math.round(cv.clientHeight * k); g.setTransform(k, 0, 0, k, 0, 0); };
    fit();
    const onR = () => fit();
    window.addEventListener('resize', onR);
    const frame = now => {
      if (!alive) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now; acc += dt;
      if (acc >= 1 / 30 && !document.body.classList.contains('paused')) { t += acc; acc = 0; draw(g, cv.clientWidth, cv.clientHeight, t, opts); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', onR); };
  }
  return { draw, run };
})();

/** экран «КЛОН УНИЧТОЖЕН»: красный череп в разбитом шлеме, счётчик клонов растёт */
const DeathScreen = (() => {
  let stop = null;
  function show({ title, sub, next }) {
    const el = $('#deathScreen'), cv = $('#dsCanvas');
    $('#dsTitle').textContent = title; $('#dsSub').textContent = sub; $('#dsNext').textContent = next;
    el.hidden = false; void el.offsetWidth; el.classList.add('on');
    const g = cv.getContext('2d');
    let t = 0, alive = true, last = performance.now();
    const fit = () => { const k = Math.min(1.5, window.devicePixelRatio || 1); cv.width = Math.round(cv.clientWidth * k); cv.height = Math.round(cv.clientHeight * k); g.setTransform(k, 0, 0, k, 0, 0); };
    fit();
    const frame = now => {
      if (!alive) return;
      t += Math.min(0.1, (now - last) / 1000); last = now;
      const W = cv.clientWidth, H = cv.clientHeight;
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const s = Math.min(W, H) * 0.62;
      Art.skull(g, W / 2 + (Math.random() < 0.05 ? (Math.random() - 0.5) * 14 : 0), H * 0.4, s, { t });
      Art.scan(g, W, H, 0.3); Art.grain(g, W, H, 0.1);
      Art.vignette(g, W, H, 0.85, W / 2, H * 0.42, '40,0,0');
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    stop = () => { alive = false; el.classList.remove('on'); el.hidden = true; stop = null; };
  }
  return { show, hide() { if (stop) stop(); } };
})();

/**
 * Клон уничтожен: череп, номер следующего клона — и новый цикл с самого начала.
 * Вызывается из смертей в комнате, от «Закончить цикл» и при разрушении носителя.
 */
let cloneDying = false;
async function cloneDestroyed({ title = 'КЛОН УНИЧТОЖЕН', sub = '' } = {}) {
  if (cloneDying) return;
  cloneDying = true;
  Frag.kill();
  Modal.closeAll();
  Menu.setAvailable(false);
  const n = GameState.cycle;
  GameState.cycle = n + 1; Save.cycle();
  Audio47.setAmbient(null, 0.3);
  Audio47.sfx.glitch(1.2);
  A.sfx.thud(0.7);
  DeathScreen.show({ title: title === 'КЛОН УНИЧТОЖЕН' ? `К-${n} · КЛОН УНИЧТОЖЕН` : title, sub: sub || 'НОРМА РАСХОДА ПЛОТИ: +1', next: `К-${n + 1}. ПОДЪЁМ.` });
  await wait(REDUCED ? 2600 : 4700);
  cloneDying = false;
  resetToBoot();
}
