/* ==========================================================================
   FX — постобработка экрана на canvas поверх всего (pointer-events: none).
   «Старение» носителя: зерно, помехи, царапины, пиксельные артефакты,
   кровь с подтёками, красная виньетка. Плюс вспышки, тряска, хроматическая
   аберрация (SVG-фильтр на короткие мгновения), вибрация.
   Рисуется в общем цикле кадров с ограничением 30 FPS; статичные слои
   (царапины, кровь) пререндерятся только при изменении.
   ========================================================================== */
const FX = (() => {
  const cv = $('#fx'), g = cv.getContext('2d');
  const staticLayer = document.createElement('canvas'), bloodLayer = document.createElement('canvas');
  let W = 0, H = 0, dpr = 1, running = false, visible = true;
  const st = { target: 0, shown: 0, burst: 0, scratches: [], artefacts: [], blood: [], staticDirty: true, bloodDirty: true };
  let noise = [];

  // зерно для CSS-слоя .post-grain (один раз, 180×180)
  (function grainTile() {
    const c = offCanvas(180, 180), x = c.getContext('2d'), img = x.createImageData(180, 180), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    const el = $('#postGrain'); if (el) el.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
  })();

  function makeNoise() {
    noise = [];
    for (let k = 0; k < 4; k++) {
      const c = offCanvas(128, 128), x = c.getContext('2d'), img = x.createImageData(128, 128), d = img.data;
      for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.random() < 0.5 ? Math.random() * 160 : 0; }
      x.putImageData(img, 0, 0);
      noise.push(g.createPattern(c, 'repeat'));
    }
  }
  function resize() {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = cv.width = Math.round(window.innerWidth * dpr);
    H = cv.height = Math.round(window.innerHeight * dpr);
    staticLayer.width = bloodLayer.width = W; staticLayer.height = bloodLayer.height = H;
    st.staticDirty = st.bloodDirty = true;
    if (!noise.length) makeNoise();
    ensure();
  }
  function syncLists() {
    const L = st.target, nS = Math.floor(L * 150), nA = Math.floor(L * 80);
    while (st.scratches.length < nS) st.scratches.push({ x: Math.random(), y: Math.random(), a: Math.random() * Math.PI * 2, len: rand(0.015, 0.11), w: rand(0.5, 1.5), o: rand(0.06, 0.26), curve: rand(-0.3, 0.3) });
    st.scratches.length = nS;
    while (st.artefacts.length < nA) st.artefacts.push({ x: Math.random(), y: Math.random(), spread: rand(8, 34), size: rand(1, 3), count: 3 + (Math.random() * 7 | 0), o: rand(0.12, 0.32), red: Math.random() < 0.3 });
    st.artefacts.length = nA;
    st.staticDirty = true;
  }
  function renderStatic() {
    const x = staticLayer.getContext('2d');
    x.clearRect(0, 0, W, H); x.lineCap = 'round';
    for (const s of st.scratches) {
      const x1 = s.x * W, y1 = s.y * H, len = s.len * Math.max(W, H), x2 = x1 + Math.cos(s.a) * len, y2 = y1 + Math.sin(s.a) * len;
      const cx = (x1 + x2) / 2 + Math.cos(s.a + Math.PI / 2) * len * s.curve, cy = (y1 + y2) / 2 + Math.sin(s.a + Math.PI / 2) * len * s.curve;
      x.strokeStyle = `rgba(190,190,190,${s.o})`; x.lineWidth = s.w * dpr;
      x.beginPath(); x.moveTo(x1, y1); x.quadraticCurveTo(cx, cy, x2, y2); x.stroke();
    }
    for (const a of st.artefacts) {
      x.fillStyle = a.red ? `rgba(200,0,40,${a.o})` : `rgba(110,110,110,${a.o})`;
      for (let i = 0; i < a.count; i++) {
        const px = a.x * W + Math.sin(i * 12.9898 + a.x * 78.233) * 0.5 * a.spread * dpr, py = a.y * H + Math.cos(i * 4.1414 + a.y * 12.345) * 0.5 * a.spread * dpr;
        x.fillRect(px, py, a.size * dpr * 2, a.size * dpr * 2);
      }
    }
    st.staticDirty = false;
  }
  function renderBlood() {
    const x = bloodLayer.getContext('2d');
    x.clearRect(0, 0, W, H);
    for (const b of st.blood) Art.bloodSplat(x, b.x * W, b.y * H, b.r * dpr, b.seed, b.o);
    st.bloodDirty = false;
  }
  function draw(dt) {
    st.shown += (st.target - st.shown) * Math.min(1, dt * 2.2);
    st.burst = Math.max(0, st.burst - dt * 0.55);
    const L = visible ? st.shown + st.burst * 0.9 : st.burst * 0.9;
    g.clearRect(0, 0, W, H);
    const bl = visible && st.blood.length;
    if (L < 0.003 && !bl) {
      if (Math.abs(st.target - st.shown) < 0.002 && st.burst === 0) { running = false; Loop.remove('fx'); }
      return;
    }
    const I = Math.min(1.35, L / 0.52);
    g.fillStyle = `rgba(0,0,0,${Math.min(0.5, I * 0.34)})`; g.fillRect(0, 0, W, H);
    if (noise.length) {
      g.save(); g.globalAlpha = Math.min(0.5, 0.05 + I * 0.3);
      g.fillStyle = noise[(Math.random() * noise.length) | 0];
      g.translate((Math.random() * 128) | 0, (Math.random() * 128) | 0); g.fillRect(-128, -128, W + 128, H + 128); g.restore();
    }
    const lines = Math.floor(1 + I * 24);
    for (let i = 0; i < lines; i++) { g.fillStyle = `rgba(210,210,210,${(0.012 + I * 0.06) * (0.4 + Math.random() * 0.6)})`; g.fillRect(0, Math.random() * H, W, (1 + Math.random() * 3) * dpr); }
    if (Math.random() < I * 0.18) { g.fillStyle = `rgba(255,0,51,${0.05 + I * 0.08})`; g.fillRect(rand(-40, 40) * dpr, Math.random() * H, W, rand(4, 22) * dpr); }
    const v = Math.floor(I * 10);
    for (let i = 0; i < v; i++) { g.fillStyle = `rgba(0,0,0,${(0.02 + I * 0.07) * (0.5 + Math.random() * 0.5)})`; g.fillRect(Math.random() * W, 0, (1 + Math.random() * 4) * dpr, H); }
    if (visible && (st.scratches.length || st.artefacts.length)) {
      if (st.staticDirty) renderStatic();
      g.globalAlpha = Math.min(1, st.shown * 3); g.drawImage(staticLayer, 0, 0); g.globalAlpha = 1;
    }
    if (bl) { if (st.bloodDirty) renderBlood(); g.drawImage(bloodLayer, 0, 0); }
    if (I > 0.35) {
      const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      gr.addColorStop(0, 'rgba(60,0,0,0)'); gr.addColorStop(1, `rgba(70,0,6,${Math.min(0.6, (I - 0.35) * 0.7)})`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
  }
  function ensure() { if (!running) { running = true; Loop.addThrottled('fx', 30, draw); } }

  const flashEl = $('#flash');
  let flashT = 0;
  function flash(color = '#ff0033', ms = 600, peak = 1) {
    if (!Settings.fx) peak *= 0.35;
    if (REDUCED) { peak = Math.min(peak, 0.25); ms = Math.max(ms, 500); }
    clearTimeout(flashT);
    flashEl.style.transition = 'none'; flashEl.style.background = color; flashEl.style.opacity = String(peak);
    void flashEl.offsetWidth;
    flashEl.style.transition = `opacity ${ms}ms cubic-bezier(.22,.61,.36,1)`; flashEl.style.opacity = '0';
  }
  function redBlack() { flash('#cc0000', 80, 0.9); clearTimeout(flashT); flashT = setTimeout(() => flash('#000000', 420, 0.85), 80); }
  let shakeT = 0;
  function shake(size = 'sm') {
    if (REDUCED || !Settings.fx) return;
    const b = document.body;
    b.classList.remove('shake-sm', 'shake-lg'); void b.offsetWidth;
    b.classList.add(size === 'lg' ? 'shake-lg' : 'shake-sm');
    clearTimeout(shakeT); shakeT = setTimeout(() => b.classList.remove('shake-sm', 'shake-lg'), size === 'lg' ? 620 : 360);
  }
  let chromaT = 0;
  /** хроматическая аберрация: RGB-расслоение на мгновение */
  function chroma(ms = 220) {
    if (REDUCED || !Settings.fx) return;
    document.body.classList.add('chroma');
    clearTimeout(chromaT); chromaT = setTimeout(() => document.body.classList.remove('chroma'), ms);
  }
  const vibrate = p => { try { if (navigator.vibrate && !REDUCED) navigator.vibrate(p); } catch { /* */ } };

  window.addEventListener('k47:resize', resize);
  resize();
  return {
    resize,
    /** износ виден на экранах носителя; в 3D-комнате — скрыт */
    setVisible(on) { visible = !!on; ensure(); },
    setLevel(v, { instant = false } = {}) { st.target = clamp(v, 0, 1); if (instant) st.shown = st.target; syncLists(); ensure(); },
    bump(a = 0.4) { st.burst = Math.min(1.2, st.burst + a); ensure(); },
    addBlood(n = 1) {
      for (let i = 0; i < n; i++) st.blood.push({ x: Math.random(), y: Math.random() * 0.8, r: rand(38, 90), o: rand(0.22, 0.45), seed: (Math.random() * 1e9) | 0 });
      if (st.blood.length > 60) st.blood.splice(0, st.blood.length - 60);
      st.bloodDirty = true; ensure();
    },
    clearBlood() { st.blood = []; st.bloodDirty = true; },
    flash, redBlack, shake, chroma, vibrate,
    /** удар по экрану: вспышка + тряска + аберрация + вибрация */
    hit(color = '#ff0033', big = false) { flash(color, big ? 700 : 380, big ? 0.7 : 0.45); shake(big ? 'lg' : 'sm'); chroma(big ? 420 : 200); vibrate(big ? [80, 40, 120] : 40); },
  };
})();
