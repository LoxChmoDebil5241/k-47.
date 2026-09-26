/* ==========================================================================
   FX — «старение» экрана на canvas поверх всего (pointer-events: none).
   Шум, линии-помехи, царапины, пиксельные артефакты, кровь, затемнение.
   Рисуется в едином цикле с ограничением 30 FPS; статические слои
   (царапины, кровь) пререндерятся в offscreen-canvas только при изменении.
   ========================================================================== */
const FX = (() => {
  const cv = $('#fx-canvas');
  const g = cv.getContext('2d');
  const staticLayer = document.createElement('canvas');
  const bloodLayer = document.createElement('canvas');
  let W = 0, H = 0, dpr = 1, running = false;
  const st = { target: 0, shown: 0, burst: 0, scratches: [], artefacts: [], blood: [], staticDirty: true, bloodDirty: true };
  let noisePatterns = [];

  function makeNoise() {
    noisePatterns = [];
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d'), img = x.createImageData(128, 128), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.random() < 0.5 ? Math.random() * 160 : 0;
      }
      x.putImageData(img, 0, 0);
      noisePatterns.push(g.createPattern(c, 'repeat'));
    }
  }

  function resize() {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = cv.width = Math.round(window.innerWidth * dpr);
    H = cv.height = Math.round(window.innerHeight * dpr);
    staticLayer.width = bloodLayer.width = W;
    staticLayer.height = bloodLayer.height = H;
    st.staticDirty = st.bloodDirty = true;
    if (!noisePatterns.length) makeNoise();
    ensure();
  }

  function syncLists() {
    const L = st.target;
    const nS = Math.floor(L * 150), nA = Math.floor(L * 80);
    while (st.scratches.length < nS) st.scratches.push({ x: Math.random(), y: Math.random(), a: Math.random() * Math.PI * 2, len: rand(0.015, 0.11), w: rand(0.5, 1.5), o: rand(0.06, 0.26), curve: rand(-0.3, 0.3) });
    st.scratches.length = nS;
    while (st.artefacts.length < nA) st.artefacts.push({ x: Math.random(), y: Math.random(), spread: rand(8, 34), size: rand(1, 3), count: 3 + (Math.random() * 7 | 0), o: rand(0.12, 0.32) });
    st.artefacts.length = nA;
    st.staticDirty = true;
  }

  function renderStatic() {
    const x = staticLayer.getContext('2d');
    x.clearRect(0, 0, W, H);
    x.lineCap = 'round';
    for (const s of st.scratches) {
      const x1 = s.x * W, y1 = s.y * H, len = s.len * Math.max(W, H);
      const x2 = x1 + Math.cos(s.a) * len, y2 = y1 + Math.sin(s.a) * len;
      const cx = (x1 + x2) / 2 + Math.cos(s.a + Math.PI / 2) * len * s.curve, cy = (y1 + y2) / 2 + Math.sin(s.a + Math.PI / 2) * len * s.curve;
      x.strokeStyle = `rgba(190,190,190,${s.o})`; x.lineWidth = s.w * dpr;
      x.beginPath(); x.moveTo(x1, y1); x.quadraticCurveTo(cx, cy, x2, y2); x.stroke();
    }
    for (const a of st.artefacts) {
      x.fillStyle = `rgba(110,110,110,${a.o})`;
      for (let i = 0; i < a.count; i++) {
        const px = a.x * W + (Math.sin(i * 12.9898 + a.x * 78.233) * 0.5) * a.spread * dpr;
        const py = a.y * H + (Math.cos(i * 4.1414 + a.y * 12.345) * 0.5) * a.spread * dpr;
        x.fillRect(px, py, a.size * dpr * 2, a.size * dpr * 2);
      }
    }
    st.staticDirty = false;
  }

  function renderBlood() {
    const x = bloodLayer.getContext('2d');
    x.clearRect(0, 0, W, H);
    for (const b of st.blood) {
      const bx = b.x * W, by = b.y * H, r = b.r * dpr;
      const gr = x.createRadialGradient(bx, by, 0, bx, by, r);
      gr.addColorStop(0, `rgba(170,0,8,${b.o * 0.9})`);
      gr.addColorStop(0.55, `rgba(110,0,6,${b.o * 0.55})`);
      gr.addColorStop(1, 'rgba(60,0,0,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(bx, by, r, 0, Math.PI * 2); x.fill();
      x.fillStyle = `rgba(120,0,6,${b.o * 0.8})`;
      for (const d of b.drops) {
        x.beginPath(); x.arc(bx + d.dx * r, by + d.dy * r, d.s * dpr, 0, Math.PI * 2); x.fill();
      }
      for (const dr of b.drips) {
        const sx = bx + dr.dx * r, sy = by + r * 0.3;
        const lg = x.createLinearGradient(sx, sy, sx, sy + dr.len * dpr);
        lg.addColorStop(0, `rgba(120,0,6,${b.o * 0.8})`); lg.addColorStop(1, 'rgba(90,0,4,0)');
        x.strokeStyle = lg; x.lineWidth = dr.w * dpr; x.lineCap = 'round';
        x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + dr.wob, sy + dr.len * dpr); x.stroke();
      }
    }
    st.bloodDirty = false;
  }

  function draw(dt) {
    st.shown += (st.target - st.shown) * Math.min(1, dt * 2.2);
    st.burst = Math.max(0, st.burst - dt * 0.55);
    const L = st.shown + st.burst * 0.9;
    g.clearRect(0, 0, W, H);
    if (L < 0.003 && !st.blood.length) {
      if (Math.abs(st.target - st.shown) < 0.002 && st.burst === 0) { running = false; Loop.remove('fx'); }
      return;
    }
    // визуальная интенсивность: к 0.46 (конец чтения) экран уже тяжело повреждён
    const I = Math.min(1.35, L / 0.52);
    // 1. общее затемнение
    g.fillStyle = `rgba(0,0,0,${Math.min(0.6, I * 0.42)})`;
    g.fillRect(0, 0, W, H);
    // 2. зерно
    if (noisePatterns.length) {
      g.save();
      g.globalAlpha = Math.min(0.55, 0.05 + I * 0.32);
      g.fillStyle = noisePatterns[(Math.random() * noisePatterns.length) | 0];
      g.translate((Math.random() * 128) | 0, (Math.random() * 128) | 0);
      g.fillRect(-128, -128, W + 128, H + 128);
      g.restore();
    }
    // 3. горизонтальные помехи
    const lines = Math.floor(1 + I * 26);
    for (let i = 0; i < lines; i++) {
      const y = Math.random() * H, h = (1 + Math.random() * 3) * dpr;
      g.fillStyle = `rgba(210,210,210,${(0.012 + I * 0.07) * (0.4 + Math.random() * 0.6)})`;
      g.fillRect(0, y, W, h);
    }
    // рваная строка-сдвиг (глитч)
    if (Math.random() < I * 0.18) {
      const y = Math.random() * H, h = rand(4, 22) * dpr;
      g.fillStyle = `rgba(255,0,51,${0.05 + I * 0.08})`;
      g.fillRect(rand(-40, 40) * dpr, y, W, h);
    }
    // 4. вертикальные полосы
    const v = Math.floor(I * 10);
    for (let i = 0; i < v; i++) {
      g.fillStyle = `rgba(0,0,0,${(0.02 + I * 0.07) * (0.5 + Math.random() * 0.5)})`;
      g.fillRect(Math.random() * W, 0, (1 + Math.random() * 4) * dpr, H);
    }
    // 5. вспышки-мерцания
    if (Math.random() < I * 0.12) {
      const x = Math.random() * W, y = Math.random() * H, r = rand(20, 90) * dpr;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(255,255,255,${I * 0.05})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // 6. царапины и артефакты (статический слой)
    if (st.scratches.length || st.artefacts.length) {
      if (st.staticDirty) renderStatic();
      g.globalAlpha = Math.min(1, st.shown * 3);
      g.drawImage(staticLayer, 0, 0);
      g.globalAlpha = 1;
    }
    // 7. кровь
    if (st.blood.length) {
      if (st.bloodDirty) renderBlood();
      g.drawImage(bloodLayer, 0, 0);
    }
    // 8. красная виньетка на сильном износе
    if (I > 0.35) {
      const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      gr.addColorStop(0, 'rgba(60,0,0,0)'); gr.addColorStop(1, `rgba(70,0,6,${Math.min(0.6, (I - 0.35) * 0.7)})`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
  }

  function ensure() { if (!running) { running = true; Loop.addThrottled('fx', 30, draw); } }

  // ---------- вспышки и тряска (CSS, без дополнительных rAF) ----------
  const flashEl = $('#flash');
  let flashTimer = 0;
  function flash(color = '#ff0033', ms = 600, peak = 1) {
    clearTimeout(flashTimer);
    flashEl.style.transition = 'none';
    flashEl.style.background = color;
    flashEl.style.opacity = String(peak);
    void flashEl.offsetWidth;
    flashEl.style.transition = `opacity ${ms}ms cubic-bezier(.22,.61,.36,1)`;
    flashEl.style.opacity = '0';
  }
  /** красная вспышка → тёмный провал (как выстрел в темноте) */
  function redBlack() {
    flash('#cc0000', 80, 0.9);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => flash('#000000', 420, 0.85), 80);
  }
  let shakeTimer = 0;
  function shake(size = 'sm') {
    if (REDUCED_MOTION) return;
    const b = document.body;
    b.classList.remove('shake-sm', 'shake-lg'); void b.offsetWidth;
    b.classList.add(size === 'lg' ? 'shake-lg' : 'shake-sm');
    clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => b.classList.remove('shake-sm', 'shake-lg'), size === 'lg' ? 620 : 360);
  }
  const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch { /* */ } };

  resize();
  cv.style.transition = 'opacity .6s';
  return {
    resize,
    /** старение носителя видно только на экране терминала; в комнате слой скрыт */
    setVisible(on) { cv.style.opacity = on ? '1' : '0'; },
    setLevel(v, { instant = false } = {}) {
      st.target = clamp(v, 0, 1);
      if (instant) st.shown = st.target;
      syncLists(); ensure();
    },
    bump(a = 0.4) { st.burst = Math.min(1.2, st.burst + a); ensure(); },
    addBlood(n = 1) {
      for (let i = 0; i < n; i++) {
        st.blood.push({
          x: Math.random(), y: Math.random(), r: rand(38, 86), o: rand(0.2, 0.42),
          drops: Array.from({ length: 3 + (Math.random() * 6 | 0) }, () => ({ dx: rand(-1.6, 1.6), dy: rand(-1.6, 1.6), s: rand(1.5, 5) })),
          drips: Array.from({ length: Math.random() < 0.6 ? 1 + (Math.random() * 3 | 0) : 0 }, () => ({ dx: rand(-0.5, 0.5), len: rand(30, 140), w: rand(2, 5), wob: rand(-6, 6) })),
        });
      }
      if (st.blood.length > 70) st.blood.splice(0, st.blood.length - 70);
      st.bloodDirty = true; ensure();
    },
    clearBlood() { st.blood = []; st.bloodDirty = true; },
    flash, redBlack, shake, vibrate,
  };
})();
