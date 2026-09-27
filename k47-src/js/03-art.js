/* ==========================================================================
   ART — процедурная живопись по референсам (никаких картинок с сервера).
   Матовый чёрный металл, мазки кистью, контровой красный/ледяной свет,
   кровь с подтёками, пиксельные артефакты.
     profile  — силуэт К-47 в профиль, две белые точки-глаза (реф. 1)
     clone    — клон с зашитым лицом, белые глаза, поток линий (реф. 2)
     splash   — заставка: огромный визор, семь силуэтов (реф. 3)
     raider   — рейдер с когтями, синие индикаторы на плече (реф. 4)
     skull    — красный череп-трофей в разбитом шлеме (реф. 5)
     armor    — полный боевой комплект, синяя и красная руки (реф. 6)
   ========================================================================== */
const Art = (() => {
  const TAU = Math.PI * 2;
  const tiles = {};
  /** тайл зерна (кэш) */
  function grainTile(alpha = 0.18, size = 96, dark = true) {
    const key = `${alpha}|${size}|${dark}`;
    if (tiles[key]) return tiles[key];
    const c = offCanvas(size, size), x = c.getContext('2d'), img = x.createImageData(size, size), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = dark ? Math.random() * 60 : 180 + Math.random() * 75; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.random() * 255 * alpha; }
    x.putImageData(img, 0, 0);
    return (tiles[key] = c);
  }
  function grain(g, x, y, w, h, alpha = 0.18, dark = true) {
    const t = grainTile(alpha, 96, dark);
    const p = g.createPattern(t, 'repeat');
    g.save(); g.fillStyle = p; g.translate((Math.random() * 96) | 0, (Math.random() * 96) | 0); g.fillRect(x - 96, y - 96, w + 96, h + 96); g.restore();
  }
  /** мазки кистью внутри текущего клипа */
  function strokes(g, r, x0, y0, w, h, n, colors, { wMin = 1, wMax = 4, lMin = 0.05, lMax = 0.2, alpha = 0.25, angle = null, spread = 0.6 } = {}) {
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * w, y = y0 + r() * h, a = angle === null ? r() * TAU : angle + (r() - 0.5) * spread, L = (lMin + r() * (lMax - lMin)) * Math.max(w, h);
      g.globalAlpha = alpha * (0.4 + r() * 0.6);
      g.strokeStyle = colors[Math.floor(r() * colors.length)];
      g.lineWidth = wMin + r() * (wMax - wMin);
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.4) * L * 0.5, y + Math.sin(a + 0.4) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    g.restore();
  }
  /** контровой свет изнутри по краю пути */
  function rim(g, path, color, width) {
    g.save(); g.clip(path); g.strokeStyle = color; g.lineWidth = width; g.stroke(path); g.restore();
  }
  /** Path2D из точек с плавными изгибами (середины отрезков как узлы) */
  function smooth(pts, s = 1, ox = 0, oy = 0, close = true) {
    const p = new Path2D(), P = pts.map(([x, y]) => [ox + x * s, oy + y * s]), n = P.length;
    if (!close) { p.moveTo(...P[0]); for (let i = 1; i < n - 1; i++) { const m = [(P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2]; p.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); } p.lineTo(...P[n - 1]); return p; }
    const mid = i => [(P[i][0] + P[(i + 1) % n][0]) / 2, (P[i][1] + P[(i + 1) % n][1]) / 2];
    p.moveTo(...mid(n - 1));
    for (let i = 0; i < n; i++) { const m = mid(i); p.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); }
    p.closePath(); return p;
  }
  /** сплайн Катмулла—Рома: кривая проходит через все точки (для точных профилей) */
  function spline(pts, s = 1, ox = 0, oy = 0, close = true, k = 0.5) {
    const P = pts.map(([x, y]) => [ox + x * s, oy + y * s]), n = P.length, p = new Path2D();
    const at = i => P[close ? (i + n) % n : clamp(i, 0, n - 1)];
    p.moveTo(...P[0]);
    const last = close ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k / 3, p1[1] + (p2[1] - p0[1]) * k / 3, p2[0] - (p3[0] - p1[0]) * k / 3, p2[1] - (p3[1] - p1[1]) * k / 3, p2[0], p2[1]);
    }
    if (close) p.closePath();
    return p;
  }
  const glowDot = (g, x, y, r, color, a = 1) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore();
  };

  // ------------------------------------------------------------------ кровь
  function bloodSplat(g, x, y, r, seed = 1, o = 0.4) {
    const R = mulberry(seed);
    g.save();
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(120,0,10,${o})`); gr.addColorStop(0.55, `rgba(80,0,8,${o * 0.8})`); gr.addColorStop(1, 'rgba(40,0,4,0)');
    g.fillStyle = gr;
    g.beginPath();
    const n = 14;
    for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, rr = r * (0.45 + R() * 0.5); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.85; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.fill();
    g.fillStyle = `rgba(90,0,8,${o * 1.2})`;
    for (let i = 0; i < 8; i++) { const a = R() * TAU, d = r * (0.7 + R() * 1.1); g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1 + R() * r * 0.06, 0, TAU); g.fill(); }
    for (let i = 0; i < 4; i++) {
      if (R() < 0.35) continue;
      const sx = x + (R() - 0.5) * r, sy = y + r * 0.2, len = r * (0.6 + R() * 2.2), w = 1.5 + R() * r * 0.07;
      const lg = g.createLinearGradient(sx, sy, sx, sy + len);
      lg.addColorStop(0, `rgba(100,0,8,${o})`); lg.addColorStop(1, 'rgba(60,0,4,0)');
      g.strokeStyle = lg; g.lineWidth = w; g.lineCap = 'round';
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (R() - 0.5) * 4, sy + len); g.stroke();
      g.fillStyle = `rgba(90,0,8,${o * 0.9})`; g.beginPath(); g.arc(sx, sy + len * 0.9, w * 0.9, 0, TAU); g.fill();
    }
    g.restore();
  }

  // ------------------------------------------------------------------ фон: бетон
  function concrete(w, h, { base = '#1a1618', tint = 'rgba(60,20,24,.25)', seed = 7, cracks = 6, frost = 0 } = {}) {
    const c = offCanvas(w, h), g = c.getContext('2d'), R = mulberry(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const x = R() * w, y = R() * h, r = (0.05 + R() * 0.25) * Math.max(w, h);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const v = R() < 0.5 ? 0 : 255;
      gr.addColorStop(0, `rgba(${v},${v},${v},${0.03 + R() * 0.04})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.fillStyle = tint; g.fillRect(0, 0, w, h);
    strokes(g, R, 0, 0, w, h, 140, ['#000', '#2a2426', '#3a3033'], { wMin: 1, wMax: 5, lMin: 0.02, lMax: 0.1, alpha: 0.25, angle: Math.PI / 2, spread: 0.3 });
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1;
    for (let k = 0; k < cracks; k++) {
      let x = R() * w, y = R() * h, a = R() * TAU; g.beginPath(); g.moveTo(x, y);
      for (let i = 0; i < 14; i++) { a += (R() - 0.5) * 0.9; x += Math.cos(a) * 9; y += Math.sin(a) * 9; g.lineTo(x, y); }
      g.stroke();
    }
    if (frost) {
      const fg = g.createLinearGradient(0, 0, 0, h * 0.35);
      fg.addColorStop(0, `rgba(143,176,196,${0.25 * frost})`); fg.addColorStop(1, 'rgba(143,176,196,0)');
      g.fillStyle = fg; g.fillRect(0, 0, w, h);
      strokes(g, R, 0, 0, w, h * 0.3, 80, ['#8fb0c4', '#c9e4f0'], { wMin: 0.5, wMax: 1.5, lMin: 0.01, lMax: 0.04, alpha: 0.3 * frost });
    }
    g.globalAlpha = 1; g.drawImage(grainTile(0.25), 0, 0, w, h);
    return c;
  }
  /** решётчатый пол/стена */
  function grate(g, x, y, w, h, cell = 18, color = 'rgba(120,120,130,.18)', lw = 2) {
    g.save(); g.strokeStyle = color; g.lineWidth = lw; g.beginPath();
    for (let i = x; i <= x + w; i += cell) { g.moveTo(i, y); g.lineTo(i, y + h); }
    for (let j = y; j <= y + h; j += cell) { g.moveTo(x, j); g.lineTo(x + w, j); }
    g.stroke(); g.restore();
  }
  /** диагональная решётка (как на реф. 4) */
  function lattice(g, x, y, w, h, cell = 40, color = 'rgba(180,180,190,.14)', lw = 3) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.strokeStyle = color; g.lineWidth = lw; g.beginPath();
    for (let i = -h; i < w + h; i += cell) { g.moveTo(x + i, y); g.lineTo(x + i + h, y + h); g.moveTo(x + i + h, y); g.lineTo(x + i, y + h); }
    g.stroke(); g.restore();
  }
  /** жёлтый треугольник «высокое напряжение» */
  function warnSign(g, x, y, s, a = 1) {
    g.save(); g.globalAlpha = a; g.translate(x, y);
    g.fillStyle = '#b98d1a'; g.strokeStyle = '#2a2008'; g.lineWidth = s * 0.05; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(0, -s * 0.5); g.lineTo(s * 0.55, s * 0.45); g.lineTo(-s * 0.55, s * 0.45); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#1a1405';
    g.beginPath(); g.moveTo(s * 0.06, -s * 0.22); g.lineTo(-s * 0.13, s * 0.08); g.lineTo(0, s * 0.08); g.lineTo(-s * 0.08, s * 0.33); g.lineTo(s * 0.15, 0); g.lineTo(s * 0.02, 0); g.lineTo(s * 0.1, -s * 0.22); g.closePath(); g.fill();
    g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(40,30,20,.35)'; g.fillRect(-s * 0.6, -s * 0.5, s * 1.2, s); g.restore();
  }
  function vignette(g, W, H, a = 0.7, col = '0,0,0', inner = 0.35) {
    const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * inner, W / 2, H / 2, Math.max(W, H) * 0.75);
    gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},${a})`);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  function scan(g, W, H, a = 0.18, step = 3) { g.fillStyle = `rgba(0,0,0,${a})`; for (let y = 0; y < H; y += step) g.fillRect(0, y, W, 1); }

  // ------------------------------------------------------------------ реф. 1: профиль К-47
  const PROFILE = [[-0.17, 0.76], [-0.15, 0.64], [-0.2, 0.55], [-0.28, 0.44], [-0.31, 0.31], [-0.29, 0.17], [-0.21, 0.06], [-0.08, 0.0], [0.07, 0.01], [0.17, 0.07],
    [0.215, 0.15], [0.232, 0.225], [0.222, 0.262], [0.24, 0.3], [0.292, 0.37], [0.286, 0.388], [0.248, 0.398], [0.258, 0.428], [0.244, 0.452], [0.255, 0.476],
    [0.236, 0.5], [0.24, 0.545], [0.21, 0.575], [0.13, 0.59], [0.08, 0.62], [0.085, 0.7], [0.11, 0.77], [0.33, 0.84], [0.48, 0.93], [0.52, 1.02], [-0.56, 1.02], [-0.5, 0.9], [-0.36, 0.82]];
  function profile(g, cx, top, h, { dir = 1, body = '#060405', eyes = '#ffffff', eyeGlow = 0.8, rimCol = null, blood = 0, seed = 47 } = {}) {
    g.save(); g.translate(cx, top); g.scale(dir, 1);
    const p = spline(PROFILE, h);
    g.fillStyle = body; g.fill(p);
    const R = mulberry(seed);
    g.save(); g.clip(p);
    strokes(g, R, -0.6 * h, 0, 1.2 * h, h, 40, ['#141013', '#0b0809', '#1c1618'], { wMin: h * 0.01, wMax: h * 0.04, alpha: 0.5 });
    if (blood) { g.globalCompositeOperation = 'source-atop'; bloodSplat(g, h * 0.1, h * 0.5, h * 0.25 * blood, seed, 0.7); }
    g.restore();
    if (rimCol) rim(g, p, rimCol, h * 0.018);
    if (eyes) {
      const ex = h * 0.158, ey = h * 0.272;
      g.fillStyle = eyes; g.beginPath(); g.arc(ex, ey, h * 0.017, 0, TAU); g.fill();
      g.beginPath(); g.arc(ex + h * 0.045, ey + h * 0.002, h * 0.011, 0, TAU); g.fill();
      if (eyeGlow) { glowDot(g, ex, ey, h * 0.07, 'rgba(255,255,255,.9)', eyeGlow * 0.6); }
    }
    g.restore();
  }
  /** фото на стену: профиль на бледно-розово-сером фоне, номер, износ */
  function photoK(i, w = 160, h = 200) {
    const c = offCanvas(w, h), g = c.getContext('2d'), R = mulberry(1000 + i * 97);
    g.fillStyle = '#e6ded4'; g.fillRect(0, 0, w, h);
    const m = w * 0.06, iw = w - m * 2, ih = h - m * 2.8;
    const bg = g.createLinearGradient(0, m, 0, m + ih);
    const hue = 350 + R() * 20, lt = 72 + R() * 10;
    bg.addColorStop(0, `hsl(${hue},${10 + R() * 12}%,${lt}%)`); bg.addColorStop(1, `hsl(${hue},${8 + R() * 10}%,${lt - 12}%)`);
    g.fillStyle = bg; g.fillRect(m, m, iw, ih);
    g.save(); g.beginPath(); g.rect(m, m, iw, ih); g.clip();
    profile(g, m + iw * (0.46 + (R() - 0.5) * 0.08), m + ih * 0.12, ih * 0.95, { dir: R() < 0.85 ? 1 : -1, seed: i, eyeGlow: 0.4, blood: R() < 0.25 ? 0.6 : 0 });
    grain(g, m, m, iw, ih, 0.22, R() < 0.5);
    if (R() < 0.5) { g.fillStyle = `rgba(120,90,60,${0.1 + R() * 0.2})`; g.fillRect(m, m, iw, ih); }
    g.restore();
    g.fillStyle = '#2a2326'; g.font = `${Math.round(w * 0.1)}px ${MONO}`; g.textAlign = 'center';
    g.fillText(`К-${i + 1}`, w / 2, h - m * 0.9);
    g.strokeStyle = `rgba(80,60,50,${0.2 + R() * 0.3})`; g.lineWidth = 1;
    for (let k = 0; k < 6; k++) { g.beginPath(); const x = R() * w, y = R() * h; g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * w * 0.6, y + (R() - 0.5) * h * 0.4); g.stroke(); }
    if (R() < 0.3) bloodSplat(g, R() * w, R() * h, w * 0.15, i, 0.5);
    return c;
  }

  // ------------------------------------------------------------------ реф. 3/6: шлем анфас
  /** визор-очки: широкая полоса с вырезом под переносицу */
  function visorPath(s, ox = 0, oy = 0, wk = 1) {
    const p = new Path2D(), W = 0.47 * wk;
    const X = v => ox + v * s, Y = v => oy + v * s;
    p.moveTo(X(-W), Y(-0.08));
    p.bezierCurveTo(X(-W), Y(-0.2), X(-W + 0.04), Y(-0.23), X(-W + 0.12), Y(-0.235));
    p.bezierCurveTo(X(-0.15), Y(-0.25), X(0.15), Y(-0.25), X(W - 0.12), Y(-0.235));
    p.bezierCurveTo(X(W - 0.04), Y(-0.23), X(W), Y(-0.2), X(W), Y(-0.08));
    p.bezierCurveTo(X(W), Y(0.08), X(W - 0.05), Y(0.15), X(W - 0.14), Y(0.15));
    p.bezierCurveTo(X(0.2), Y(0.15), X(0.12), Y(0.13), X(0.08), Y(0.06));
    p.bezierCurveTo(X(0.05), Y(0.01), X(0.02), Y(-0.005), X(0), Y(-0.005));
    p.bezierCurveTo(X(-0.02), Y(-0.005), X(-0.05), Y(0.01), X(-0.08), Y(0.06));
    p.bezierCurveTo(X(-0.12), Y(0.13), X(-0.2), Y(0.15), X(-W + 0.14), Y(0.15));
    p.bezierCurveTo(X(-W + 0.05), Y(0.15), X(-W), Y(0.08), X(-W), Y(-0.08));
    p.closePath();
    return p;
  }
  const SHELL = [[-0.5, 0.2], [-0.52, -0.2], [-0.44, -0.55], [-0.22, -0.74], [0, -0.77], [0.22, -0.74], [0.44, -0.55], [0.52, -0.2], [0.5, 0.2], [0.44, 0.44], [0.3, 0.5], [-0.3, 0.5], [-0.44, 0.44]];
  const MASK = [[-0.2, 0.06], [0.2, 0.06], [0.23, 0.3], [0.13, 0.52], [-0.13, 0.52], [-0.23, 0.3]];
  function helmet(g, cx, cy, s, { visor = '#ff0033', visorDark = '#5a0010', shell = '#1c1a1d', rimCol = 'rgba(255,40,70,.55)', lamp = false, crack = 0, skull = false, glow = 1, hoses = true, seed = 6, mask = true, reflect = null, t = 0 } = {}) {
    const R = mulberry(seed);
    g.save(); g.translate(cx, cy);
    const sh = smooth(SHELL, s);
    const sg = g.createLinearGradient(-s * 0.5, -s * 0.7, s * 0.5, s * 0.5);
    sg.addColorStop(0, '#3a383c'); sg.addColorStop(0.4, shell); sg.addColorStop(1, '#070607');
    g.fillStyle = sg; g.fill(sh);
    g.save(); g.clip(sh);
    strokes(g, R, -s * 0.55, -s * 0.8, s * 1.1, s * 1.3, 70, ['#4a484c', '#0c0b0d', '#2a282c', '#5b595e'], { wMin: s * 0.006, wMax: s * 0.03, lMin: 0.04, lMax: 0.16, alpha: 0.3 });
    // шов купола и царапины
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = s * 0.012;
    g.beginPath(); g.moveTo(-s * 0.42, -s * 0.3); g.quadraticCurveTo(0, -s * 0.62, s * 0.42, -s * 0.3); g.stroke();
    g.strokeStyle = 'rgba(210,210,215,.35)'; g.lineWidth = s * 0.004;
    for (let i = 0; i < 6; i++) { const x = (R() - 0.5) * s * 0.8, y = -s * (0.2 + R() * 0.5); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * s * 0.12, y + (R() - 0.5) * s * 0.05); g.stroke(); }
    g.restore();
    rim(g, sh, rimCol, s * 0.03);
    if (lamp) {
      const ly = -s * 0.56;
      g.save(); g.fillStyle = '#300006'; g.beginPath(); g.ellipse(s * 0.05, ly, s * 0.2, s * 0.1, -0.08, 0, TAU); g.fill();
      const lg = g.createRadialGradient(s * 0.05, ly, 0, s * 0.05, ly, s * 0.2);
      lg.addColorStop(0, `rgba(255,30,50,${0.9 * glow})`); lg.addColorStop(0.35, `rgba(200,0,24,${0.8 * glow})`); lg.addColorStop(0.7, 'rgba(120,0,14,.6)'); lg.addColorStop(1, 'rgba(60,0,8,0)');
      g.fillStyle = lg; g.beginPath(); g.ellipse(s * 0.05, ly, s * 0.19, s * 0.095, -0.08, 0, TAU); g.fill();
      g.fillStyle = 'rgba(40,0,6,.8)'; g.beginPath(); g.ellipse(s * 0.07, ly + s * 0.005, s * 0.07, s * 0.035, -0.08, 0, TAU); g.fill();
      glowDot(g, s * 0.05, ly, s * 0.35, 'rgba(255,0,40,.5)', glow);
      g.restore();
    }
    // визор
    const vp = visorPath(s);
    g.fillStyle = '#050102'; g.save(); g.lineWidth = s * 0.05; g.strokeStyle = '#0b090b'; g.stroke(vp); g.restore();
    const vg = g.createLinearGradient(0, -s * 0.25, 0, s * 0.15);
    vg.addColorStop(0, visor); vg.addColorStop(0.55, visor); vg.addColorStop(1, visorDark);
    g.fillStyle = vg; g.fill(vp);
    g.save(); g.clip(vp);
    if (reflect) reflect(g, s);
    if (skull) drawSkullIn(g, s, R);
    strokes(g, R, -s * 0.5, -s * 0.25, s, s * 0.4, 26, ['rgba(255,255,255,.5)', 'rgba(120,0,20,.6)', 'rgba(255,120,140,.4)'], { wMin: s * 0.004, wMax: s * 0.015, lMin: 0.05, lMax: 0.2, alpha: 0.35, angle: 0.1, spread: 0.2 });
    g.globalAlpha = 0.35; g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(-s * 0.36, -s * 0.2); g.lineTo(-s * 0.2, -s * 0.2); g.lineTo(-s * 0.26, -s * 0.12); g.lineTo(-s * 0.4, -s * 0.12); g.fill();
    g.restore();
    g.save(); g.lineWidth = s * 0.012; g.strokeStyle = 'rgba(255,90,110,.8)'; g.stroke(vp); g.restore();
    glowDot(g, 0, -s * 0.05, s * 0.7, 'rgba(255,0,40,.35)', glow);
    if (crack) {
      g.save(); g.clip(vp); g.strokeStyle = 'rgba(255,240,240,.85)'; g.lineWidth = s * 0.006;
      const R2 = mulberry(seed + 5), cx0 = s * 0.18, cy0 = -s * 0.08;
      for (let k = 0; k < 9 * crack; k++) {
        let x = cx0, y = cy0, a = (k / 9) * TAU + R2() * 0.4; g.beginPath(); g.moveTo(x, y);
        for (let i = 0; i < 6; i++) { a += (R2() - 0.5) * 0.5; x += Math.cos(a) * s * 0.05; y += Math.sin(a) * s * 0.05; g.lineTo(x, y); }
        g.stroke();
      }
      g.restore();
    }
    if (mask) {
      const mp = smooth(MASK, s);
      const mg = g.createLinearGradient(0, s * 0.05, 0, s * 0.55);
      mg.addColorStop(0, '#2a282b'); mg.addColorStop(1, '#0a090a');
      g.fillStyle = mg; g.fill(mp);
      g.save(); g.clip(mp);
      strokes(g, R, -s * 0.25, 0, s * 0.5, s * 0.55, 24, ['#3c3a3e', '#050505'], { wMin: s * 0.005, wMax: s * 0.02, alpha: 0.4 });
      g.fillStyle = '#0d0c0e'; g.beginPath(); g.ellipse(0, s * 0.33, s * 0.1, s * 0.12, 0, 0, TAU); g.fill();
      g.strokeStyle = '#3a383c'; g.lineWidth = s * 0.008;
      for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(-s * 0.07, s * (0.33 + i * 0.035)); g.lineTo(s * 0.07, s * (0.33 + i * 0.035)); g.stroke(); }
      g.restore();
      rim(g, mp, 'rgba(255,60,80,.35)', s * 0.02);
      [[-0.15, 0.2], [0.15, 0.2], [-0.12, 0.42], [0.12, 0.42]].forEach(([x, y]) => { g.fillStyle = visor; g.beginPath(); g.arc(x * s, y * s, s * 0.012, 0, TAU); g.fill(); glowDot(g, x * s, y * s, s * 0.04, 'rgba(255,0,40,.8)', glow); });
    }
    if (hoses) {
      g.lineCap = 'round';
      [-1, 1].forEach(d => {
        const path = new Path2D();
        path.moveTo(d * s * 0.2, s * 0.3); path.bezierCurveTo(d * s * 0.36, s * 0.34, d * s * 0.5, s * 0.22, d * s * 0.52, s * 0.05);
        g.strokeStyle = '#4a0008'; g.lineWidth = s * 0.05; g.stroke(path);
        g.strokeStyle = visor; g.lineWidth = s * 0.032; g.stroke(path);
        g.strokeStyle = 'rgba(255,200,210,.45)'; g.lineWidth = s * 0.008; g.stroke(path);
      });
    }
    g.restore();
  }
  function drawSkullIn(g, s, R) {
    g.save();
    g.fillStyle = '#0a0001'; g.fillRect(-s * 0.5, -s * 0.3, s, s * 0.5);
    const sk = spline([[-0.2, -0.22], [0, -0.25], [0.2, -0.22], [0.27, -0.06], [0.22, 0.1], [0.12, 0.16], [-0.12, 0.16], [-0.22, 0.1], [-0.27, -0.06]], s);
    const skg = g.createRadialGradient(-s * 0.05, -s * 0.12, s * 0.02, 0, -s * 0.02, s * 0.3);
    skg.addColorStop(0, '#fff1ea'); skg.addColorStop(1, '#a8847a');
    g.fillStyle = skg; g.fill(sk);
    g.fillStyle = '#100002';
    [-1, 1].forEach(d => { g.beginPath(); g.ellipse(d * s * 0.1, -s * 0.05, s * 0.075, s * 0.065, d * 0.2, 0, TAU); g.fill(); });
    g.beginPath(); g.moveTo(0, s * 0.02); g.lineTo(-s * 0.03, s * 0.08); g.lineTo(s * 0.03, s * 0.08); g.fill();
    g.fillStyle = '#e9d6cc';
    for (let i = -3; i <= 3; i++) g.fillRect(i * s * 0.03 - s * 0.012, s * 0.1, s * 0.024, s * 0.04);
    bloodSplat(g, s * 0.05, -s * 0.02, s * 0.25, 5, 0.9);
    bloodSplat(g, -s * 0.18, s * 0.05, s * 0.15, 9, 0.8);
    g.strokeStyle = '#2a0003'; g.lineWidth = s * 0.02;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo((R() - 0.5) * s * 0.4, s * 0.12); g.bezierCurveTo((R() - 0.5) * s, s * 0.2, (R() - 0.5) * s, s * 0.3, (R() - 0.5) * s * 0.8, s * 0.3); g.stroke(); }
    g.restore();
  }

  // ------------------------------------------------------------------ реф. 6: броня
  /** фигура в броне анфас. top — верх шлема, h — высота до кулаков */
  function armor(g, cx, top, h, { leftLed = '#2a7bff', rightLed = '#ff1a3c', visor = '#ff0033', lamp = false, crack = 0, skull = false, glow = 1, t = 0, seed = 47, stripe = true, claws = false } = {}) {
    const s = h * 0.34, R = mulberry(seed), cy = top + s * 0.77;
    const X = v => cx + v * h, Y = v => top + v * h;
    const metal = (path, x0, y0, x1, y1, light = '#2e2c31', dark = '#0a090b') => {
      const gr = g.createLinearGradient(X(x0), Y(y0), X(x1), Y(y1)); gr.addColorStop(0, light); gr.addColorStop(1, dark);
      g.fillStyle = gr; g.fill(path);
      g.save(); g.clip(path);
      strokes(g, R, X(x0) - h * 0.1, Y(y0) - h * 0.1, Math.abs(X(x1) - X(x0)) + h * 0.2, Math.abs(Y(y1) - Y(y0)) + h * 0.2, 26, ['#47454b', '#060506', '#26242a', '#5c5a60'], { wMin: h * 0.003, wMax: h * 0.014, alpha: 0.35 });
      g.restore();
      g.save(); g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = h * 0.006; g.stroke(path); g.restore();
    };
    const led = (x, y, col, n = 4, vert = true) => {
      for (let k = 0; k < n; k++) {
        const a = 0.55 + 0.45 * Math.sin(t * 3.2 + k * 1.3 + x * 9);
        g.globalAlpha = a; g.fillStyle = col;
        if (vert) g.fillRect(X(x) - h * 0.004, Y(y + k * 0.045), h * 0.008, h * 0.028);
        else g.fillRect(X(x + k * 0.03), Y(y) - h * 0.004, h * 0.02, h * 0.008);
        g.globalAlpha = 1;
      }
      glowDot(g, X(x), Y(y + (vert ? n * 0.022 : 0)), h * 0.12, col === leftLed ? 'rgba(40,120,255,.55)' : 'rgba(255,20,60,.55)', glow);
    };
    // руки (сзади торса): плечо → предплечье из сегментов → кулак
    [-1, 1].forEach(d => {
      const col = d < 0 ? leftLed : rightLed;
      const raised = claws && d > 0;
      const upper = spline([[0.3 * d, 0.52], [0.42 * d, 0.55], [0.44 * d, 0.7], [0.4 * d, 0.82], [0.33 * d, 0.8], [0.31 * d, 0.64]], h, cx, top);
      metal(upper, 0.3 * d, 0.5, 0.44 * d, 0.82);
      if (!raised) {
        for (let k = 0; k < 4; k++) {
          const y = 0.8 + k * 0.058, x = (0.39 + k * 0.008) * d;
          const seg = spline([[x - 0.055, y], [x + 0.055, y], [x + 0.05, y + 0.06], [x - 0.05, y + 0.06]], h, cx, top);
          metal(seg, x - 0.05, y, x + 0.05, y + 0.06, k % 2 ? '#26242a' : '#312f35');
        }
        led(0.41 * d + 0.03 * d, 0.82, col, 4);
        const fist = spline([[0.36 * d, 1.03], [0.46 * d, 1.03], [0.47 * d, 1.1], [0.41 * d, 1.14], [0.35 * d, 1.1]], h, cx, top);
        metal(fist, 0.35 * d, 1.03, 0.47 * d, 1.14, '#1c1a1e', '#060506');
      } else {
        // поднятая рука: красная механическая перчатка, три лезвия (реф. 4)
        const fore = spline([[0.36, 0.78], [0.44, 0.76], [0.58, 0.62], [0.54, 0.56]], h, cx, top);
        metal(fore, 0.36, 0.56, 0.58, 0.8);
        const hx = 0.6, hy = 0.56;
        const glove = spline([[hx - 0.07, hy - 0.02], [hx + 0.05, hy - 0.07], [hx + 0.1, hy], [hx + 0.04, hy + 0.07], [hx - 0.06, hy + 0.05]], h, cx, top);
        g.fillStyle = '#7a0012'; g.fill(glove);
        g.save(); g.clip(glove); strokes(g, R, X(hx - 0.1), Y(hy - 0.1), h * 0.22, h * 0.2, 30, ['#ff1a3c', '#300004', '#c0001c', '#ff6070'], { wMin: 1, wMax: h * 0.018, alpha: 0.7 }); g.restore();
        bloodSplat(g, X(hx), Y(hy), h * 0.08, seed, 0.9);
        for (let c = -1; c <= 1; c++) {
          const bx = X(hx + 0.05), by = Y(hy + c * 0.025);
          const tipx = X(hx + 0.42 + c * 0.02), tipy = Y(hy - 0.18 + c * 0.06);
          const bl = new Path2D(); bl.moveTo(bx, by - h * 0.012); bl.quadraticCurveTo((bx + tipx) / 2, (by + tipy) / 2 - h * 0.04, tipx, tipy); bl.quadraticCurveTo((bx + tipx) / 2, (by + tipy) / 2 + h * 0.01, bx, by + h * 0.014); bl.closePath();
          const bg2 = g.createLinearGradient(bx, by, tipx, tipy); bg2.addColorStop(0, '#9a9aa2'); bg2.addColorStop(0.5, '#f2f2f6'); bg2.addColorStop(1, '#c8c8d0');
          g.fillStyle = bg2; g.fill(bl); g.strokeStyle = 'rgba(20,20,24,.6)'; g.lineWidth = 1; g.stroke(bl);
        }
      }
      // наплечник
      const pad = spline([[0.22 * d, 0.5], [0.34 * d, 0.46], [0.47 * d, 0.52], [0.49 * d, 0.62], [0.36 * d, 0.62], [0.26 * d, 0.58]], h, cx, top);
      metal(pad, 0.22 * d, 0.46, 0.49 * d, 0.62, '#38363b');
      rim(g, pad, d < 0 ? 'rgba(80,150,255,.35)' : 'rgba(255,60,80,.35)', h * 0.01);
      led(0.4 * d, 0.51, col, 3, true);
    });
    // торс
    const torso = spline([[-0.26, 0.47], [-0.12, 0.44], [0.12, 0.44], [0.26, 0.47], [0.31, 0.6], [0.29, 0.8], [0.25, 1.02], [-0.25, 1.02], [-0.29, 0.8], [-0.31, 0.6]], h, cx, top);
    metal(torso, -0.3, 0.44, 0.3, 1.02, '#2b292e', '#08070a');
    rim(g, torso, 'rgba(255,60,80,.3)', h * 0.016);
    const plate = spline([[-0.2, 0.53], [0.2, 0.53], [0.21, 0.72], [0.12, 0.79], [-0.12, 0.79], [-0.21, 0.72]], h, cx, top);
    metal(plate, -0.2, 0.53, 0.2, 0.79, '#343237', '#111013');
    for (let k = 0; k < 3; k++) { const y = 0.83 + k * 0.06; const ab = spline([[-0.17, y], [0.17, y], [0.16, y + 0.048], [-0.16, y + 0.048]], h, cx, top); metal(ab, -0.17, y, 0.17, y + 0.05, '#27252a', '#0d0c0e'); }
    g.fillStyle = '#0a090b'; g.fillRect(X(-0.26), Y(1.0), h * 0.52, h * 0.04);
    if (stripe) {
      const sy = 0.64;
      g.fillStyle = '#2a0005'; g.fillRect(X(-0.13), Y(sy) - h * 0.02, h * 0.26, h * 0.04);
      const rg = g.createLinearGradient(X(-0.12), 0, X(0.12), 0);
      rg.addColorStop(0, '#9a0016'); rg.addColorStop(0.5, '#ff2a48'); rg.addColorStop(1, '#9a0016');
      g.fillStyle = rg; g.fillRect(X(-0.115), Y(sy) - h * 0.012, h * 0.23, h * 0.024);
      glowDot(g, X(0), Y(sy), h * 0.26, 'rgba(255,0,40,.5)', glow);
    }
    // воротник и шея
    g.fillStyle = '#0c0b0d'; g.beginPath(); g.ellipse(X(0), Y(0.46), h * 0.15, h * 0.045, 0, 0, TAU); g.fill();
    g.fillStyle = '#141215'; g.fillRect(X(-0.08), Y(0.38), h * 0.16, h * 0.09);
    helmet(g, cx, cy, s, { visor, lamp, crack, skull, glow, seed });
  }

  // ------------------------------------------------------------------ реф. 4: рейдер с когтями
  function raider(g, x, top, h, { t = 0, glow = 1, claws = true, seed = 4 } = {}) {
    armor(g, x, top, h, { leftLed: '#1e6bff', rightLed: '#ff1a3c', claws, glow, t, seed, lamp: false });
  }
  /** стоящий на коленях сгорбленный силуэт с окровавленным лицом и красными шлангами (реф. 4) */
  function kneeling(g, x, y, h, { seed = 11 } = {}) {
    const R = mulberry(seed);
    g.save(); g.translate(x, y);
    const body = smooth([[-0.3, 0], [-0.34, -0.3], [-0.2, -0.52], [0.1, -0.56], [0.3, -0.4], [0.34, -0.1], [0.3, 0]], h);
    g.fillStyle = '#121013'; g.fill(body); rim(g, body, 'rgba(255,40,60,.3)', h * 0.02);
    g.fillStyle = '#1c1a1d'; g.beginPath(); g.ellipse(h * 0.05, -h * 0.66, h * 0.17, h * 0.15, 0.2, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.ellipse(h * 0.05, -h * 0.62, h * 0.17, h * 0.12, 0.2, 0, TAU); g.clip();
    g.fillStyle = '#8a0010'; g.fillRect(-h * 0.2, -h * 0.66, h * 0.5, h * 0.2);
    bloodSplat(g, h * 0.1, -h * 0.6, h * 0.14, seed, 1);
    strokes(g, R, -h * 0.15, -h * 0.72, h * 0.4, h * 0.2, 20, ['#ff1a3c', '#300004'], { alpha: 0.6 });
    g.restore();
    g.strokeStyle = '#ff1a3c'; g.lineWidth = h * 0.03; g.lineCap = 'round';
    g.beginPath(); g.moveTo(h * 0.2, -h * 0.58); g.bezierCurveTo(h * 0.5, -h * 0.6, h * 0.48, -h * 0.3, h * 0.25, -h * 0.28); g.stroke();
    g.beginPath(); g.moveTo(-h * 0.08, -h * 0.55); g.bezierCurveTo(-h * 0.3, -h * 0.5, -h * 0.25, -h * 0.3, -h * 0.1, -h * 0.3); g.stroke();
    for (let i = 0; i < 4; i++) { g.fillStyle = '#c0001a'; g.fillRect(h * (0.02 + i * 0.03), -h * 0.52, h * 0.01, h * (0.05 + R() * 0.08)); }
    g.restore();
  }

  // ------------------------------------------------------------------ реф. 5: красный череп-трофей
  function skull(g, cx, cy, s, { t = 0, seed = 5 } = {}) {
    g.save();
    helmet(g, cx, cy, s, { visor: '#ff2a48', visorDark: '#400008', crack: 1, skull: true, glow: 0.8 + 0.2 * Math.sin(t * 2), seed, hoses: true });
    // шланги и провода, торчащие снизу
    const R = mulberry(seed);
    g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      g.strokeStyle = i % 2 ? '#8a0012' : '#2a0004'; g.lineWidth = s * (0.01 + R() * 0.02);
      g.beginPath(); const x0 = cx + (R() - 0.5) * s * 0.4, y0 = cy + s * 0.45;
      g.moveTo(x0, y0); g.bezierCurveTo(x0 + (R() - 0.5) * s * 0.6, y0 + s * 0.2, x0 + (R() - 0.5) * s * 0.8, y0 + s * 0.35, x0 + (R() - 0.5) * s, y0 + s * (0.4 + R() * 0.3)); g.stroke();
    }
    bloodSplat(g, cx - s * 0.1, cy + s * 0.55, s * 0.3, seed + 1, 0.8);
    // красный монохром поверх
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ff1a2a'; g.fillRect(cx - s, cy - s, s * 2, s * 2);
    g.globalCompositeOperation = 'source-over';
    g.restore();
  }

  // ------------------------------------------------------------------ реф. 2: клон с зашитым лицом
  function clone(g, W, H, { t = 0, seed = 2, streaks = 1 } = {}) {
    const R = mulberry(seed);
    // фон — плотный поток белых и чёрных линий
    g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 220; i++) {
      const x = R() * W, w = 1 + R() * 3, a = 0.05 + R() * 0.35, y0 = R() * H * 0.3, len = H * (0.3 + R() * 0.8);
      g.fillStyle = R() < 0.55 ? `rgba(235,235,240,${a})` : `rgba(0,0,0,${a + 0.3})`;
      g.fillRect(x + Math.sin(t * 0.7 + i) * 2, y0 + ((t * 40 * (0.3 + R())) % H) - H * 0.3, w, len);
    }
    const cx = W / 2, s = Math.min(W * 0.9, H * 0.95);
    const top = H * 0.08;
    // торс
    const body = spline([[-0.07, 0.34], [-0.085, 0.45], [-0.34, 0.52], [-0.47, 0.64], [-0.52, 1.1], [0.52, 1.1], [0.47, 0.64], [0.34, 0.52], [0.085, 0.45], [0.07, 0.34]], s, cx, top);
    const bg = g.createLinearGradient(cx - s * 0.5, 0, cx + s * 0.5, 0);
    bg.addColorStop(0, '#6d6a6e'); bg.addColorStop(0.45, '#bdb8bb'); bg.addColorStop(1, '#4a474b');
    g.fillStyle = bg; g.fill(body);
    // голова
    const head = spline([[0, 0], [0.11, 0.02], [0.165, 0.1], [0.172, 0.2], [0.15, 0.29], [0.1, 0.36], [0.04, 0.395], [-0.04, 0.395], [-0.1, 0.36], [-0.15, 0.29], [-0.172, 0.2], [-0.165, 0.1], [-0.11, 0.02]], s, cx, top);
    const hg = g.createRadialGradient(cx - s * 0.05, top + s * 0.15, s * 0.02, cx, top + s * 0.2, s * 0.25);
    hg.addColorStop(0, '#d4cfd2'); hg.addColorStop(1, '#5b585c');
    g.fillStyle = hg; g.fill(head);
    [body, head].forEach(p => { g.save(); g.clip(p); strokes(g, R, cx - s * 0.6, top, s * 1.2, s * 1.2, 80, ['#8a8589', '#2a282b', '#e0dadd'], { wMin: 1, wMax: s * 0.012, alpha: 0.35, angle: Math.PI / 2, spread: 0.4 }); g.restore(); });
    // шрамы-кресты
    const stitch = (x1, y1, x2, y2) => {
      g.strokeStyle = '#050505'; g.lineWidth = s * 0.006; g.beginPath(); g.moveTo(cx + x1 * s, top + y1 * s); g.lineTo(cx + x2 * s, top + y2 * s); g.stroke();
      const n = Math.max(3, Math.round(Math.hypot(x2 - x1, y2 - y1) * 60)), nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny);
      for (let i = 0; i <= n; i++) { const k = i / n, px = cx + (x1 + (x2 - x1) * k) * s, py = top + (y1 + (y2 - y1) * k) * s; g.beginPath(); g.moveTo(px - nx / L * s * 0.012 - (x2 - x1) / L * s * 0.004, py - ny / L * s * 0.012); g.lineTo(px + nx / L * s * 0.012 + (x2 - x1) / L * s * 0.004, py + ny / L * s * 0.012); g.stroke(); }
    };
    stitch(-0.16, 0.12, 0.16, 0.14); stitch(-0.02, 0.02, 0.03, 0.38); stitch(-0.12, 0.3, 0.12, 0.28);
    stitch(-0.35, 0.6, 0.3, 0.95); stitch(0.32, 0.58, -0.3, 0.98); stitch(-0.05, 0.5, 0.02, 1.05);
    // белые глаза
    [-1, 1].forEach(d => { g.fillStyle = '#f4f6f8'; g.beginPath(); g.ellipse(cx + d * s * 0.068, top + s * 0.2, s * 0.032, s * 0.016, 0, 0, TAU); g.fill(); glowDot(g, cx + d * s * 0.068, top + s * 0.2, s * 0.08, 'rgba(255,255,255,.8)', 0.6); });
    // вертикальные штрихи: падающий свет / слёзы
    for (let i = 0; i < 30 * streaks; i++) {
      const x = cx + (R() - 0.5) * s * 0.9, y = top + R() * s * 0.4, L = s * (0.2 + R() * 0.8);
      g.fillStyle = `rgba(250,250,255,${0.15 + R() * 0.35})`; g.fillRect(x, y + ((t * 30 * (0.5 + R())) % (s * 0.3)), 1 + R() * 2, L);
    }
    vignette(g, W, H, 0.85);
  }

  // ------------------------------------------------------------------ силуэт стоящего человека (реф. 1)
  function figure(g, x, base, h, { body = '#050304', eyes = null, glasses = false, wide = 1, head = 1, t = 0, rimCol = null } = {}) {
    g.save(); g.translate(x, base);
    const w = h * 0.26 * wide;
    const p = new Path2D();
    p.moveTo(-w * 0.55, 0); p.lineTo(-w * 0.62, -h * 0.45);
    p.quadraticCurveTo(-w * 0.95, -h * 0.72, -w * 0.62, -h * 0.8);
    p.quadraticCurveTo(-w * 0.2, -h * 0.84, -w * 0.12, -h * 0.84);
    p.lineTo(w * 0.12, -h * 0.84); p.quadraticCurveTo(w * 0.2, -h * 0.84, w * 0.62, -h * 0.8);
    p.quadraticCurveTo(w * 0.95, -h * 0.72, w * 0.62, -h * 0.45); p.lineTo(w * 0.55, 0); p.closePath();
    g.fillStyle = body; g.fill(p);
    const hr = h * 0.075 * head;
    g.beginPath(); g.ellipse(0, -h * 0.9, hr, hr * 1.2, 0, 0, TAU); g.fill();
    if (rimCol) { rim(g, p, rimCol, h * 0.012); }
    if (eyes) { [-1, 1].forEach(d => { g.fillStyle = eyes; g.beginPath(); g.arc(d * hr * 0.38, -h * 0.905, hr * 0.12, 0, TAU); g.fill(); glowDot(g, d * hr * 0.38, -h * 0.905, hr * 0.5, eyes, 0.6); }); }
    if (glasses) { g.strokeStyle = 'rgba(230,240,255,.7)'; g.lineWidth = Math.max(1, hr * 0.08); [-1, 1].forEach(d => { g.strokeRect(d * hr * 0.42 - hr * 0.28, -h * 0.92, hr * 0.56, hr * 0.32); }); glowDot(g, -hr * 0.4, -h * 0.9, hr * 0.5, 'rgba(255,255,255,.9)', 0.5 + 0.5 * Math.sin(t * 2)); }
    g.restore();
  }
  /** лежащее тело (силуэт) */
  function lying(g, x, y, s, { dir = 1, body = '#050304', blood = 0, seed = 3 } = {}) {
    g.save(); g.translate(x, y); g.scale(dir, 1);
    if (blood) bloodSplat(g, s * 0.1, s * 0.05, s * 0.5 * blood, seed, 0.55);
    g.fillStyle = body;
    g.beginPath(); g.ellipse(0, 0, s * 0.55, s * 0.12, 0.02, 0, TAU); g.fill();
    g.beginPath(); g.arc(s * 0.62, -s * 0.03, s * 0.1, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(-s * 0.72, s * 0.04, s * 0.25, s * 0.07, 0.1, 0, TAU); g.fill();
    g.lineWidth = s * 0.06; g.strokeStyle = body; g.lineCap = 'round';
    g.beginPath(); g.moveTo(s * 0.25, -s * 0.05); g.lineTo(s * 0.45, s * 0.18); g.stroke();
    g.restore();
  }

  // ------------------------------------------------------------------ пиксельный текст (как на заставке)
  const pixCache = {};
  function pixText(g, text, x, y, size, { font = SERIF, weight = 700, color = '#efe6cf', px = 3, spacing = 0.18, align = 'center', alpha = 1 } = {}) {
    const key = `${text}|${size}|${font}|${weight}|${color}|${px}|${spacing}`;
    let c = pixCache[key];
    if (!c) {
      const small = Math.max(6, Math.round(size / px));
      const m = offCanvas(10, 10).getContext('2d');
      m.font = `${weight} ${small}px ${font}`;
      const chars = [...text], sp = small * spacing;
      const w = Math.ceil(chars.reduce((a, ch) => a + m.measureText(ch).width + sp, 0) + 4), h = Math.ceil(small * 1.4);
      const sc = offCanvas(w, h), sg = sc.getContext('2d');
      sg.font = `${weight} ${small}px ${font}`; sg.textBaseline = 'middle'; sg.fillStyle = color;
      let cx = 2; for (const ch of chars) { sg.fillText(ch, cx, h / 2); cx += sg.measureText(ch).width + sp; }
      // пороговая бинаризация — жёсткий пиксель
      const img = sg.getImageData(0, 0, w, h), d = img.data;
      for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0;
      sg.putImageData(img, 0, 0);
      c = pixCache[key] = { c: sc, w: w * px, h: h * px };
      if (Object.keys(pixCache).length > 80) for (const k of Object.keys(pixCache).slice(0, 40)) delete pixCache[k];
    }
    g.save(); g.imageSmoothingEnabled = false; g.globalAlpha = alpha;
    const dx = align === 'center' ? x - c.w / 2 : align === 'right' ? x - c.w : x;
    g.drawImage(c.c, dx, y - c.h / 2, c.w, c.h);
    g.restore();
    return c.w;
  }

  // ------------------------------------------------------------------ реф. 3: ЗАСТАВКА
  /** чёрный силуэт человека в пиджаке (для визора заставки) */
  function man(g, x, top, h, col = '#060001') {
    const w = h * 0.34;
    g.fillStyle = col;
    g.beginPath(); g.ellipse(x, top + h * 0.085, h * 0.068, h * 0.085, 0, 0, TAU); g.fill();
    g.fillRect(x - h * 0.035, top + h * 0.15, h * 0.07, h * 0.06);
    const p = new Path2D();
    p.moveTo(x - w * 0.18, top + h * 0.2); p.quadraticCurveTo(x - w * 0.46, top + h * 0.21, x - w * 0.5, top + h * 0.3);
    p.lineTo(x - w * 0.56, top + h * 0.75); p.lineTo(x - w * 0.46, top + h * 1.2); p.lineTo(x + w * 0.46, top + h * 1.2); p.lineTo(x + w * 0.56, top + h * 0.75);
    p.lineTo(x + w * 0.5, top + h * 0.3); p.quadraticCurveTo(x + w * 0.46, top + h * 0.21, x + w * 0.18, top + h * 0.2); p.closePath();
    g.fill(p);
    g.strokeStyle = 'rgba(120,0,12,.55)'; g.lineWidth = Math.max(1, h * 0.012);
    [-1, 1].forEach(d => { g.beginPath(); g.moveTo(x + d * w * 0.34, top + h * 0.34); g.lineTo(x + d * w * 0.38, top + h * 0.72); g.stroke(); });
  }
  /** статичная часть заставки пререндерится; t — анимация (мерцание визора, «лампа», силуэты) */
  let splashBase = null;
  function splashRender(W, H) {
    const c = offCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    // пиксельный кровавый дым по краям и снизу — в низком разрешении, растянутый без сглаживания
    const px = Math.max(8, Math.round(Math.min(W, H) / 42));
    const lw = Math.ceil(W / px), lh = Math.ceil(H / px), low = offCanvas(lw, lh), lg = low.getContext('2d'), R = mulberry(4747);
    for (let i = 0; i < 70; i++) {
      const side = R();
      const x = (side < 0.4 ? R() * 0.2 : side < 0.8 ? 0.8 + R() * 0.2 : R()) * lw;
      const y = (side < 0.8 ? 0.35 + R() * 0.65 : 0.75 + R() * 0.25) * lh, r = (0.03 + R() * 0.11) * lw;
      const gr = lg.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${110 + R() * 50 | 0},0,${R() * 14 | 0},${0.35 + R() * 0.45})`); gr.addColorStop(1, 'rgba(40,0,4,0)');
      lg.fillStyle = gr; lg.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const img = lg.getImageData(0, 0, lw, lh), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = d[i + 3] / 255 * d[i]; const q = v > 95 ? 128 : v > 55 ? 88 : v > 22 ? 48 : 0; d[i] = q; d[i + 1] = 0; d[i + 2] = q ? 4 : 0; d[i + 3] = 255; }
    lg.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false; g.drawImage(low, 0, 0, lw * px, lh * px); g.imageSmoothingEnabled = true;
    const s = Math.min(W * 0.86, H * 0.64), cx = W / 2, cy = H * 0.57;
    // шея и плечи
    const sh = smooth([[-0.24, 0.4], [-0.26, 0.72], [-0.6, 0.9], [-0.95, 1.5], [0.95, 1.5], [0.6, 0.9], [0.26, 0.72], [0.24, 0.4]], s, cx, cy);
    g.fillStyle = '#020001'; g.fill(sh); rim(g, sh, 'rgba(130,0,14,.6)', s * 0.018);
    // голова в шлеме
    const shell = spline([[-0.44, 0.42], [-0.5, 0.1], [-0.5, -0.25], [-0.42, -0.55], [-0.22, -0.74], [0, -0.79], [0.22, -0.74], [0.42, -0.55], [0.5, -0.25], [0.5, 0.1], [0.44, 0.42], [0.2, 0.56], [-0.2, 0.56]], s, cx, cy);
    g.fillStyle = '#040102'; g.fill(shell);
    g.save(); g.clip(shell);
    strokes(g, R, cx - s * 0.6, cy - s * 0.8, s * 1.2, s * 1.4, 60, ['#1a0306', '#000', '#260509'], { wMin: s * 0.004, wMax: s * 0.028, alpha: 0.35 });
    g.restore();
    rim(g, shell, 'rgba(150,0,18,.75)', s * 0.024);
    rim(g, shell, 'rgba(255,40,60,.3)', s * 0.007);
    // наушники по бокам
    [-1, 1].forEach(dd => {
      const ep = spline([[0.46 * dd, -0.16], [0.56 * dd, -0.14], [0.57 * dd, 0.12], [0.47 * dd, 0.14]], s, cx, cy);
      g.fillStyle = '#060103'; g.fill(ep); g.strokeStyle = 'rgba(140,0,16,.55)'; g.lineWidth = s * 0.006; g.stroke(ep);
    });
    splashBase = { c, W, H, s, cx, cy };
  }
  function splash(g, W, H, t = 0, { flicker = 1 } = {}) {
    if (!splashBase || splashBase.W !== W || splashBase.H !== H) splashRender(W, H);
    const { c, s, cx, cy } = splashBase;
    g.drawImage(c, 0, 0);
    const fl = 0.9 + 0.1 * Math.sin(t * 3.1) + (Math.random() < 0.03 * flicker ? -0.25 : 0);
    // «лампа» на макушке
    const ly = cy - s * 0.63, lx = cx + s * 0.07;
    g.save();
    g.fillStyle = '#140002'; g.beginPath(); g.ellipse(lx, ly, s * 0.18, s * 0.115, -0.1, 0, TAU); g.fill();
    const lgr = g.createRadialGradient(lx, ly, 0, lx, ly, s * 0.17);
    lgr.addColorStop(0, `rgba(150,0,18,${0.95 * fl})`); lgr.addColorStop(0.5, `rgba(225,8,34,${0.95 * fl})`); lgr.addColorStop(0.85, 'rgba(110,0,12,.8)'); lgr.addColorStop(1, 'rgba(30,0,3,0)');
    g.fillStyle = lgr; g.beginPath(); g.ellipse(lx, ly, s * 0.17, s * 0.105, -0.1, 0, TAU); g.fill();
    g.fillStyle = 'rgba(80,0,8,.9)'; g.beginPath(); g.ellipse(lx + s * 0.01, ly + s * 0.008, s * 0.06, s * 0.038, -0.1, 0, TAU); g.fill();
    glowDot(g, lx, ly, s * 0.4, 'rgba(255,0,40,.3)', fl);
    g.restore();
    // визор-очки
    const vs = s * 1.12, vcx = cx, vcy = cy + s * 0.06;
    const vp = visorPath(vs, vcx, vcy, 1);
    g.save(); g.lineWidth = s * 0.06; g.strokeStyle = '#050002'; g.stroke(vp); g.restore();
    const vg = g.createLinearGradient(0, vcy - vs * 0.25, 0, vcy + vs * 0.16);
    vg.addColorStop(0, `rgba(${Math.round(200 * fl)},6,18,1)`); vg.addColorStop(0.55, `rgba(${Math.round(232 * fl)},12,26,1)`); vg.addColorStop(1, 'rgba(130,0,14,1)');
    g.fillStyle = vg; g.fill(vp);
    g.save(); g.clip(vp);
    const R = mulberry(77);
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(70,0,8,${0.12 + R() * 0.3})`; g.fillRect(vcx + (R() - 0.5) * vs * 0.95, vcy - vs * 0.26, 1 + R() * s * 0.01, vs * (0.08 + R() * 0.35)); }
    // семь силуэтов: крайние ниже, центральный — самый высокий
    const HT = [0.1, 0.075, 0.05, 0.03, 0.05, 0.075, 0.1], XS = [-0.36, -0.245, -0.125, 0, 0.125, 0.245, 0.36];
    for (let i = 0; i < 7; i++) {
      const fh = vs * 0.44, fx = vcx + XS[i] * vs, ftop = vcy - vs * 0.22 + HT[i] * vs + Math.sin(t * 0.7 + i * 1.7) * 0.5;
      man(g, fx, ftop, fh * (1 - HT[i] * 0.8));
    }
    g.restore();
    // переносица: красная дуга поверх силуэтов и контур визора
    g.save(); g.clip(vp);
    g.strokeStyle = `rgba(255,${30 * fl | 0},50,.95)`; g.lineWidth = s * 0.024;
    g.beginPath(); g.moveTo(vcx - vs * 0.3, vcy + vs * 0.2); g.bezierCurveTo(vcx - vs * 0.14, vcy + vs * 0.16, vcx - vs * 0.08, vcy + vs * 0.01, vcx, vcy + vs * 0.005); g.bezierCurveTo(vcx + vs * 0.08, vcy + vs * 0.01, vcx + vs * 0.14, vcy + vs * 0.16, vcx + vs * 0.3, vcy + vs * 0.2); g.stroke();
    g.restore();
    g.save(); g.lineWidth = s * 0.016; g.strokeStyle = `rgba(255,${36 * fl | 0},56,.9)`; g.stroke(vp); g.restore();
    glowDot(g, vcx, vcy, s * 0.75, 'rgba(255,0,30,.16)', fl);
    // срыв строки — пиксельный глитч
    if (Math.random() < 0.07 * flicker) {
      const k = g.canvas.width / W, y = Math.random() * H, hh = rand(4, 16);
      g.drawImage(g.canvas, 0, y * k, g.canvas.width, hh * k, rand(-24, 24), y, W, hh);
    }
    return { s, cx, cy, vcy, vs };
  }

  // ------------------------------------------------------------------ фото мамы (для «Образа» и стола)
  function motherPhoto(W, H) {
    const c = offCanvas(W, H), g = c.getContext('2d'), r = mulberry(4747);
    g.fillStyle = '#efe6cf'; g.fillRect(0, 0, W, H);
    const m = Math.round(W * 0.05), iw = W - 2 * m, ih = H - 2 * m;
    g.save(); g.beginPath(); g.rect(m, m, iw, ih); g.clip(); g.translate(m, m);
    let gr = g.createLinearGradient(0, 0, 0, ih * 0.56); gr.addColorStop(0, '#5a90c2'); gr.addColorStop(1, '#c2d9e6');
    g.fillStyle = gr; g.fillRect(0, 0, iw, ih * 0.56);
    for (let i = 0; i < 8; i++) { const x = r() * iw, y = ih * (0.04 + r() * 0.26), s = iw * (0.07 + r() * 0.11); const cg = g.createRadialGradient(x, y, 0, x, y, s * 1.6); cg.addColorStop(0, 'rgba(255,255,255,.7)'); cg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = cg; g.beginPath(); g.ellipse(x, y, s * 1.6, s * 0.65, 0, 0, TAU); g.fill(); }
    const hz = ih * 0.5;
    for (let i = 0; i < 5; i++) { const x = r() * iw; g.fillStyle = '#3a2a1c'; g.fillRect(x, hz - ih * 0.1, iw * 0.012, ih * 0.1); }
    for (let i = 0; i < 70; i++) { const x = r() * iw, y = hz - ih * 0.02 - r() * ih * 0.13, s = iw * (0.03 + r() * 0.055); g.fillStyle = `hsl(${92 + r() * 34}, ${28 + r() * 18}%, ${15 + r() * 16}%)`; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); }
    gr = g.createLinearGradient(0, hz, 0, ih); gr.addColorStop(0, '#76a14a'); gr.addColorStop(1, '#3b6628');
    g.fillStyle = gr; g.fillRect(0, hz - 2, iw, ih - hz + 2);
    for (let i = 0; i < 1500; i++) { const x = r() * iw, y = hz + Math.pow(r(), 0.75) * (ih - hz), len = (4 + r() * 16) * (0.35 + (y - hz) / (ih - hz)); g.strokeStyle = `hsla(${78 + r() * 42}, ${34 + r() * 28}%, ${24 + r() * 32}%, .85)`; g.lineWidth = r() < 0.2 ? 1.6 : 1; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 5, y - len * 0.6, x + (r() - 0.5) * 8, y - len); g.stroke(); }
    const cx = iw * 0.5, hy = ih * 0.38, hr = iw * 0.1;
    g.fillStyle = '#6b5647';
    g.beginPath(); g.moveTo(cx - iw * 0.32, ih); g.bezierCurveTo(cx - iw * 0.32, ih * 0.63, cx - iw * 0.19, ih * 0.56, cx - hr * 0.6, ih * 0.52); g.lineTo(cx + hr * 0.6, ih * 0.52); g.bezierCurveTo(cx + iw * 0.19, ih * 0.56, cx + iw * 0.32, ih * 0.63, cx + iw * 0.32, ih); g.closePath(); g.fill();
    g.fillStyle = '#d4a286'; g.beginPath(); g.moveTo(cx - hr * 0.42, ih * 0.45); g.lineTo(cx + hr * 0.42, ih * 0.45); g.lineTo(cx + hr * 0.55, ih * 0.53); g.quadraticCurveTo(cx, ih * 0.6, cx - hr * 0.55, ih * 0.53); g.closePath(); g.fill();
    g.fillStyle = '#4b2f1b'; g.beginPath(); g.arc(cx + hr * 0.12, hy - hr * 1.12, hr * 0.5, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(cx, hy - hr * 0.08, hr * 1.06, hr * 1.2, 0, 0, TAU); g.fill();
    const fg = g.createRadialGradient(cx - hr * 0.25, hy - hr * 0.2, hr * 0.1, cx, hy, hr * 1.1); fg.addColorStop(0, '#f0c4a6'); fg.addColorStop(1, '#c48c6c');
    g.fillStyle = fg; g.beginPath(); g.ellipse(cx, hy + hr * 0.1, hr * 0.8, hr * 1, 0, 0, TAU); g.fill();
    g.fillStyle = '#4b2f1b'; g.beginPath(); g.moveTo(cx - hr * 0.88, hy + hr * 0.05); g.bezierCurveTo(cx - hr * 0.98, hy - hr * 1.2, cx + hr * 0.92, hy - hr * 1.3, cx + hr * 0.88, hy); g.bezierCurveTo(cx + hr * 0.55, hy - hr * 0.72, cx - hr * 0.3, hy - hr * 0.82, cx - hr * 0.88, hy + hr * 0.05); g.fill();
    const ey = hy + hr * 0.04;
    g.fillStyle = '#2a170c'; [-1, 1].forEach(s => { g.beginPath(); g.ellipse(cx + s * hr * 0.31, ey, hr * 0.1, hr * 0.055, 0, 0, TAU); g.fill(); });
    g.strokeStyle = 'rgba(70, 40, 25, .7)'; g.lineWidth = Math.max(1, iw * 0.005); [-1, 1].forEach(s => { g.beginPath(); g.moveTo(cx + s * hr * 0.17, ey - hr * 0.17); g.quadraticCurveTo(cx + s * hr * 0.33, ey - hr * 0.25, cx + s * hr * 0.47, ey - hr * 0.16); g.stroke(); });
    g.strokeStyle = 'rgba(140, 60, 55, .85)'; g.lineWidth = Math.max(1.2, iw * 0.006); g.beginPath(); g.moveTo(cx - hr * 0.25, ey + hr * 0.6); g.quadraticCurveTo(cx + hr * 0.03, ey + hr * 0.7, cx + hr * 0.28, ey + hr * 0.55); g.stroke();
    g.fillStyle = 'rgba(255, 210, 150, .13)'; g.fillRect(0, 0, iw, ih);
    const vg = g.createRadialGradient(iw / 2, ih / 2, iw * 0.3, iw / 2, ih / 2, iw * 0.9); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,20,5,.5)'); g.fillStyle = vg; g.fillRect(0, 0, iw, ih);
    for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,245,225,.08)' : 'rgba(30,20,10,.1)'; g.fillRect(r() * iw, r() * ih, 1.2, 1.2); }
    g.restore();
    g.strokeStyle = 'rgba(255, 250, 235, .6)'; g.lineWidth = W * 0.004; g.beginPath(); g.moveTo(W * 0.06, H * 0.36); g.lineTo(W * 0.34, H * 0.43); g.lineTo(W * 0.58, H * 0.39); g.lineTo(W * 0.95, H * 0.48); g.stroke();
    g.strokeStyle = 'rgba(120, 100, 80, .25)'; g.lineWidth = W * 0.01; g.beginPath(); g.moveTo(W * 0.7, 0); g.lineTo(W * 0.62, H); g.stroke();
    return c;
  }

  return { TAU, grain, grainTile, strokes, rim, smooth, glowDot, bloodSplat, concrete, grate, lattice, warnSign, vignette, scan, profile, photoK, visorPath, helmet, armor, raider, kneeling, skull, clone, figure, lying, pixText, splash, motherPhoto };
})();
