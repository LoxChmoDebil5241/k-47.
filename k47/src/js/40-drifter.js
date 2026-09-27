/* ==========================================================================
   ПЛЫВУЩИЕ ФРАЗЫ — общий механизм для мыслей на бланке и «взгляда в темноту».
   Каждая фраза: появляется, плывёт с лёгким покачиванием/дрожью, растворяется.
   Анимация — в едином цикле Loop через scope.tick (без собственных rAF).
   ========================================================================== */
function createDrifter(scope, layer, id = 'drift') {
  const items = [];
  let running = false;

  function tick(dt, now) {
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.t += dt;
      const p = Math.min(1, it.t / it.life);
      const e = easeOutCubic(p);
      const x = lerp(it.x0, it.x1, e) + Math.sin(now * it.sx + it.px) * it.ax + (Math.random() - 0.5) * it.shake;
      const y = lerp(it.y0, it.y1, e) + Math.cos(now * it.sy + it.py) * it.ay + (Math.random() - 0.5) * it.shake;
      let op = p < it.fin ? p / it.fin : p > 1 - it.fout ? (1 - p) / it.fout : 1;
      it.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${(it.s0 + (it.s1 - it.s0) * e).toFixed(3)})`;
      it.el.style.opacity = (op * it.alpha).toFixed(3);
      if (p >= 1) { it.el.remove(); items.splice(i, 1); }
    }
    if (!items.length) { running = false; scope.untick(id); }
  }

  return {
    /**
     * @param {string} text
     * @param {object} o  cls — css-класс; from — 'edge' | 'inside'; life — секунды;
     *                    alpha, shake (px), blur (px), scale [s0, s1], area — {x, y, w, h}
     */
    spawn(text, o = {}) {
      const el = document.createElement('div');
      el.className = o.cls || 'drift-thought';
      el.textContent = text;
      if (o.color) el.style.color = o.color;
      if (o.blur) el.style.filter = `blur(${o.blur}px)`;
      layer.appendChild(el);
      const A = o.area || { x: 0, y: 0, w: layer.clientWidth || window.innerWidth, h: layer.clientHeight || window.innerHeight };
      const w = el.offsetWidth, h = el.offsetHeight;
      let x0, y0, x1, y1;
      if (o.from === 'edge') {
        const side = Math.random();
        if (side < 0.25) { x0 = A.x + A.w + 20; y0 = A.y + A.h * rand(0.15, 0.85); }
        else if (side < 0.5) { x0 = A.x - w - 20; y0 = A.y + A.h * rand(0.15, 0.85); }
        else if (side < 0.75) { x0 = A.x + A.w * rand(0.1, 0.8); y0 = A.y - h - 20; }
        else { x0 = A.x + A.w * rand(0.1, 0.8); y0 = A.y + A.h + 20; }
        x1 = A.x + A.w * rand(0.15, 0.7); y1 = A.y + A.h * rand(0.2, 0.8);
      } else {
        x0 = A.x + rand(0, Math.max(10, A.w - w)); y0 = A.y + rand(0, Math.max(10, A.h - h));
        const ang = rand(0, Math.PI * 2), dist = rand(50, 170);
        x1 = clamp(x0 + Math.cos(ang) * dist, A.x - w * 0.3, A.x + A.w - w * 0.7); y1 = clamp(y0 + Math.sin(ang) * dist, A.y, A.y + A.h - h);
      }
      const [s0, s1] = o.scale || [0.96, 1.04];
      items.push({
        el, t: 0, life: o.life || rand(7, 11), x0, y0, x1, y1, s0, s1,
        ax: rand(8, 26), ay: rand(6, 18), sx: rand(0.0005, 0.0013), sy: rand(0.0006, 0.0014), px: rand(0, 6.28), py: rand(0, 6.28),
        shake: o.shake || 0, alpha: o.alpha ?? 1, fin: o.fin ?? 0.2, fout: o.fout ?? 0.28,
      });
      if (!running) { running = true; scope.tick(id, tick); }
      return el;
    },
    count: () => items.length,
    clear() { items.splice(0).forEach(it => it.el.remove()); if (running) { running = false; scope.untick(id); } },
  };
}
