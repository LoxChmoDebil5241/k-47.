/* ==========================================================================
   ТРЕЩИНЫ НА СТЕКЛЕ — общий генератор (удары по экрану терминала).
   Детерминированы по seed: треснутый экран выглядит одинаково после перезагрузки.
   Координаты нормированы (0…1), рисуются на любом холсте.
   ========================================================================== */
const Cracks = (() => {
  function rng(seed) { let s = (seed >>> 0) || 47; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  /** одна трещина с центром в (x, y), aspect — ширина/высота холста */
  function make(x, y, seed, aspect = 1.6) {
    const r = rng(seed), R = (a, b) => a + r() * (b - a);
    const lines = [], spokes = 9 + Math.floor(r() * 6), ends = [];
    for (let i = 0; i < spokes; i++) {
      let a = (Math.PI * 2 * i) / spokes + R(-0.3, 0.3), cx = x, cy = y, dist = 0;
      const len = R(0.25, 0.75), pts = [[cx, cy]];
      while (dist < len) { const st = R(0.015, 0.05); a += R(-0.22, 0.22); cx += Math.cos(a) * st / aspect; cy += Math.sin(a) * st; dist += st; pts.push([cx, cy]); }
      lines.push({ w: R(1.1, 2), pts }); ends.push(pts);
      if (r() < 0.65) {
        const from = pts[1 + Math.floor(r() * Math.max(1, pts.length - 2))] || pts[0];
        let ba = a + R(0.5, 1.1) * (r() < 0.5 ? -1 : 1), bx = from[0], by = from[1], bd = 0;
        const bp = [[bx, by]], bl = len * R(0.15, 0.4);
        while (bd < bl) { const st = R(0.012, 0.03); ba += R(-0.3, 0.3); bx += Math.cos(ba) * st / aspect; by += Math.sin(ba) * st; bd += st; bp.push([bx, by]); }
        lines.push({ w: 0.7, pts: bp });
      }
    }
    [2, 4, 7].forEach(k => {
      for (let i = 0; i < ends.length; i++) {
        if (r() < 0.35) continue;
        const A = ends[i], B = ends[(i + 1) % ends.length], pa = A[Math.min(A.length - 1, k)], pb = B[Math.min(B.length - 1, k)];
        if (pa && pb) lines.push({ w: 0.8, pts: [pa, [(pa[0] + pb[0]) / 2 + R(-0.006, 0.006), (pa[1] + pb[1]) / 2 + R(-0.006, 0.006)], pb] });
      }
    });
    return { x, y, lines };
  }
  /** трещины по точкам ударов игрока (нормированные координаты) */
  function fromHits(hits, seed, aspect = 1.6) { return hits.map(([x, y], i) => make(x, y, seed + i * 101, aspect)); }
  function draw(g, cracks, W, H, { alpha = 1, scale = 1 } = {}) {
    g.save();
    g.lineJoin = g.lineCap = 'round';
    for (const c of cracks) {
      const cx = c.x * W, cy = c.y * H, rr = 70 * scale;
      const gl = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
      gl.addColorStop(0, `rgba(255,255,255,${0.35 * alpha})`); gl.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gl; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
      for (const l of c.lines) {
        g.strokeStyle = `rgba(235,235,240,${(l.w > 1 ? 0.7 : 0.45) * alpha})`; g.lineWidth = l.w * scale;
        g.beginPath(); l.pts.forEach(([px, py], i) => (i ? g.lineTo(px * W, py * H) : g.moveTo(px * W, py * H))); g.stroke();
      }
    }
    g.restore();
  }
  return { make, fromHits, draw };
})();
