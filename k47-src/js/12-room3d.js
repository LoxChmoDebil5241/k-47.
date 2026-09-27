/* ==========================================================================
   КОМНАТА OBJ-4471 — Three.js (через importmap) и плоский 2D-режим на случай,
   если WebGL/CDN недоступны. Промышленная камера подо льдом: бетон в инее,
   решётчатый пол, кабельные трассы, аварийные лампы, жёлтый знак напряжения.
   Впереди — банкомат-терминал, слева — стена с 47 профилями, справа — стол,
   за спиной — тёмный проём. Общий интерфейс рендеров:
     setPose · moveTo · setLook · pick · setLinks · markPhoto · setPhotoCount
     setFigure · setSilhouette · setEyes · muzzle · setScreenState · setDread
     radioLed · shake · setActive · tick · resize · dispose
   ========================================================================== */

// ---------- трещины на стекле (детерминированы по seed) ----------
const Cracks = (() => {
  function rng(seed) { let s = (seed >>> 0) || 47; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
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
    [2, 4, 7].forEach(k => { for (let i = 0; i < ends.length; i++) { if (r() < 0.35) continue; const A2 = ends[i], B = ends[(i + 1) % ends.length], pa = A2[Math.min(A2.length - 1, k)], pb = B[Math.min(B.length - 1, k)]; if (pa && pb) lines.push({ w: 0.8, pts: [pa, [(pa[0] + pb[0]) / 2 + R(-0.006, 0.006), (pa[1] + pb[1]) / 2 + R(-0.006, 0.006)], pb] }); } });
    return { x, y, lines };
  }
  const fromHits = (hits, seed, aspect = 1.6) => hits.map(([x, y], i) => make(x, y, seed + i * 101, aspect));
  function draw(g, cracks, W, H, { alpha = 1, scale = 1 } = {}) {
    g.save(); g.lineJoin = g.lineCap = 'round';
    for (const c of cracks) {
      const cx = c.x * W, cy = c.y * H, rr = 70 * scale, gl = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
      gl.addColorStop(0, `rgba(255,255,255,${0.35 * alpha})`); gl.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gl; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
      for (const l of c.lines) { g.strokeStyle = `rgba(235,235,240,${(l.w > 1 ? 0.7 : 0.45) * alpha})`; g.lineWidth = l.w * scale; g.beginPath(); l.pts.forEach(([px, py], i) => (i ? g.lineTo(px * W, py * H) : g.moveTo(px * W, py * H))); g.stroke(); }
    }
    g.restore();
  }
  return { make, fromHits, draw };
})();
const crackSeed = () => parseInt(G.story.code.slice(0, 6), 10) || 4747;

// ---------- процедурные текстуры комнаты ----------
const RoomArt = (() => {
  let cache = null;
  const codeParts = code => [code.slice(0, 4), code.slice(4, 8), code.slice(8, 12)];
  function stickyNote(part, digits) {
    const c = offCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#e9d56a'; g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(120,90,20,.18)'; g.fillRect(0, 0, 256, 34);
    Art.grain(g, 0, 0, 256, 256, 0.2, true);
    g.fillStyle = '#1d2850'; g.font = `italic 22px ${SERIF}`; g.fillText('код, часть ' + part + '/3', 22, 70);
    g.font = `700 64px ${MONO}`; g.fillText(digits, 26, 150);
    g.font = `italic 18px ${SERIF}`; g.fillText('не оборачивайся', 30, 210);
    Art.bloodSplat(g, 210, 225, 30, 7, 0.45);
    return c;
  }
  function chalkCode(part, digits) {
    const c = offCanvas(512, 160), g = c.getContext('2d');
    g.font = `700 92px ${MONO}`; g.fillStyle = 'rgba(235,235,225,.9)';
    g.fillText(digits, 20, 110); g.font = `36px ${MONO}`; g.fillText(`${part}/3`, 360, 60);
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.7})`; g.fillRect(Math.random() * 512, Math.random() * 160, 2, 2); }
    return c;
  }
  function bezel(part, digits) {
    const c = offCanvas(512, 400), g = c.getContext('2d');
    g.drawImage(Art.concrete(512, 400, { base: '#141315', tint: 'rgba(20,20,26,.3)', seed: 31, cracks: 2 }), 0, 0);
    g.clearRect(40, 40, 432, 300);
    g.strokeStyle = '#2d2b30'; g.lineWidth = 6; g.strokeRect(38, 38, 436, 304);
    g.fillStyle = 'rgba(200,200,190,.55)'; g.font = `22px ${MONO}`; g.fillText('OBJ-4471 · VITEZSTVI', 44, 28);
    g.font = `700 30px ${MONO}`; g.fillStyle = 'rgba(230,230,220,.7)'; g.fillText(`${part}/3 · ${digits}`, 290, 380);
    return c;
  }
  /** экран банкомата в комнате: красный монохром */
  function screen(c, t, st = {}) {
    const g = c.getContext('2d'), W = c.width, H = c.height;
    g.fillStyle = '#120104'; g.fillRect(0, 0, W, H);
    const gl = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.7);
    gl.addColorStop(0, 'rgba(120,0,20,.55)'); gl.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    g.fillStyle = '#ff3355'; g.font = `18px ${PIXEL}`; g.textAlign = 'center';
    g.fillText('OBJ-4471', W / 2, 60);
    g.font = `26px ${MONO}`;
    const blink = Math.floor(t * 1.6) % 2;
    if (!st.codeOk) { g.fillText('ВВЕДИТЕ КОД ДОСТУПА', W / 2, H * 0.48); if (blink) g.fillText('_ _ _ _  _ _ _ _  _ _ _ _', W / 2, H * 0.62); }
    else if (st.cracked) { g.fillStyle = '#ff1a3c'; g.fillText('НОСИТЕЛЬ ПОВРЕЖДЁН', W / 2, H * 0.5); g.font = `20px ${MONO}`; g.fillText('ERR_0x47', W / 2, H * 0.62); }
    else { g.fillText('АРХИВ К-47', W / 2, H * 0.46); g.font = `20px ${MONO}`; g.fillText(`ГЛАВ: 49 · ПРОЧИТАНО: ${readCount()}`, W / 2, H * 0.58); if (blink) g.fillText('▶ ВОЙТИ', W / 2, H * 0.72); }
    g.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
    if (Math.random() < 0.05) { g.fillStyle = 'rgba(255,0,51,.2)'; g.fillRect(0, Math.random() * H, W, rand(4, 20)); }
    if (st.cracked && st.hits && st.hits.length) Cracks.draw(g, Cracks.fromHits(st.hits, crackSeed(), W / H), W, H, { scale: 0.9 });
    g.textAlign = 'left';
  }
  function floorTex() {
    const c = offCanvas(512, 512), g = c.getContext('2d');
    g.fillStyle = '#0d0c0e'; g.fillRect(0, 0, 512, 512);
    // решётка из полос металла
    for (let i = 0; i < 512; i += 32) {
      g.fillStyle = '#26252a'; g.fillRect(i, 0, 10, 512); g.fillRect(0, i, 512, 10);
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(i, 0, 2, 512); g.fillRect(0, i, 512, 2);
    }
    const R = mulberry(12);
    Art.strokes(g, R, 0, 0, 512, 512, 120, ['#000', '#3a3a40', '#151416'], { wMin: 1, wMax: 5, alpha: 0.35 });
    for (let k = 0; k < 4; k++) Art.bloodSplat(g, R() * 512, R() * 512, 30 + R() * 60, k + 3, 0.35);
    Art.grain(g, 0, 0, 512, 512, 0.3, true);
    return c;
  }
  function ceilTex() {
    const c = offCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(80,80,90,.35)'; g.lineWidth = 3;
    for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    Art.grain(g, 0, 0, 256, 256, 0.3, true);
    return c;
  }
  function wallTex() {
    const c = Art.concrete(512, 256, { base: '#2a2729', tint: 'rgba(30,20,26,.25)', seed: 21, cracks: 8, frost: 0.9 });
    const g = c.getContext('2d'), R = mulberry(3);
    for (let i = 0; i < 3; i++) { const x = R() * 512; const lg = g.createLinearGradient(0, 40, 0, 256); lg.addColorStop(0, 'rgba(90,0,8,.4)'); lg.addColorStop(1, 'rgba(60,0,4,0)'); g.fillStyle = lg; g.fillRect(x, 40 + R() * 60, 2 + R() * 4, 160); }
    return c;
  }
  function glow(color = '255,255,255') {
    const c = offCanvas(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${color},1)`); gr.addColorStop(0.3, `rgba(${color},.35)`); gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
  }
  function figureTex(kind) {
    const c = offCanvas(256, 560), g = c.getContext('2d');
    if (kind === 'thin') Art.figure(g, 128, 560, 540, { body: '#050506', glasses: true, rimCol: 'rgba(210,220,235,.22)' });
    else Art.armor(g, 128, 20, 420, { seed: 9 });
    return c;
  }
  function signTex() { const c = offCanvas(256, 256); Art.warnSign(c.getContext('2d'), 128, 140, 210); return c; }
  function paperTex() {
    const c = offCanvas(256, 340), g = c.getContext('2d');
    g.fillStyle = '#e4dcc6'; g.fillRect(0, 0, 256, 340);
    g.strokeStyle = 'rgba(29,40,80,.25)'; for (let y = 40; y < 340; y += 18) { g.beginPath(); g.moveTo(10, y); g.lineTo(246, y); g.stroke(); }
    g.fillStyle = 'rgba(29,40,80,.7)'; g.font = `italic 15px ${SERIF}`; ['Личный блокнот', '15.04.2999', '', 'Считать будут', 'другие.'].forEach((s, i) => g.fillText(s, 20, 34 + i * 18));
    Art.grain(g, 0, 0, 256, 340, 0.15, true);
    return c;
  }
  return {
    get() { if (!cache) cache = { photos: Array.from({ length: 47 }, (_, i) => Art.photoK(i, 160, 200)), floor: floorTex(), ceil: ceilTex(), wall: wallTex(), glow: glow(), sign: signTex(), paper: paperTex(), mother: Art.motherPhoto(320, 400) }; return cache; },
    codeParts, stickyNote, chalkCode, bezel, screen, figureTex,
  };
})();

const POSES = {
  outside: { pos: [0, 1.62, -4.7], rotX: -0.07, yaw: 0, fov: 60 },
  wall: { pos: [-3.4, 1.9, 0], rotX: -0.03, yaw: Math.PI / 2, fov: 60 },
  wallClose: { pos: [-5.6, 1.85, 0], rotX: -0.02, yaw: Math.PI / 2, fov: 60 },
  desk: { pos: [3.4, 1.85, 0], rotX: -0.3, yaw: -Math.PI / 2, fov: 60 },
  deskClose: { pos: [5.5, 1.55, 0], rotX: -0.55, yaw: -Math.PI / 2, fov: 60 },
  facing: { pos: [0, 1.85, 1.2], rotX: -0.03, yaw: Math.PI, fov: 60 },
  doorClose: { pos: [0, 1.8, 5.0], rotX: -0.02, yaw: Math.PI, fov: 56 },
  inside: { pos: [0, 1.66, -6.9], rotX: 0, yaw: 0, fov: 70 },
};
const LOOK_LIMITS = {
  wall: { yaw: Math.PI * 0.39, pitch: Math.PI * 0.07 }, wallClose: { yaw: Math.PI * 0.22, pitch: Math.PI * 0.08 },
  desk: { yaw: Math.PI * 0.22, pitch: Math.PI * 0.06 }, deskClose: { yaw: Math.PI * 0.16, pitch: Math.PI * 0.06 },
  outside: { yaw: Math.PI * 0.12, pitch: Math.PI * 0.05 }, facing: { yaw: Math.PI * 0.1, pitch: Math.PI * 0.04 },
};
const LOOK_UP = 0.35;
const EASE = { tension: t => (t < 0.5 ? 0.5 * (1 - Math.cos(Math.PI * t)) : 0.5 + 0.5 * Math.sin(Math.PI * (t - 0.5))), in: t => t * t * t, out: t => 1 - Math.pow(1 - t, 3) };

/** загрузка Three.js с таймаутом (CDN может быть недоступен — тогда 2D) */
let threePromise = null;
function loadThree() {
  if (!threePromise) threePromise = Promise.race([import('three'), new Promise((_, rej) => setTimeout(() => rej(new Error('three: timeout')), 9000))]).catch(e => { threePromise = null; throw e; });
  return threePromise;
}
function hasWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }

async function createRoom3D(mount) {
  if (!hasWebGL()) throw new Error('WebGL недоступен');
  const T = RoomArt.get();
  const [p1, p2, p3] = RoomArt.codeParts(G.story.code);
  const THREE = await loadThree();
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040203);
  scene.fog = new THREE.FogExp2(0x050304, 0.05);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 80);
  camera.rotation.order = 'YXZ';

  const trash = [];
  const keep = x => (trash.push(x), x);
  const tex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return keep(t); };
  const lam = o => keep(new THREE.MeshLambertMaterial(o));
  const basic = o => keep(new THREE.MeshBasicMaterial(o));
  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene) => { keep(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
  const cyl = (rt, rb, h, mat, x, y, z, parent, seg = 12) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, parent);
  const glowTex = tex(T.glow);
  const sprite = (color, opacity, sx, sy, parent = scene) => { const s = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity }))); s.scale.set(sx, sy, 1); parent.add(s); return s; };

  // ---------- стены, пол, потолок ----------
  const H = 4.4;
  const wallMat = rep => lam({ map: tex(T.wall, rep), color: 0x8c8a90 });
  const wall = (w, mat, x, z, ry) => { const m = mesh(new THREE.PlaneGeometry(w, H), mat, x, H / 2, z); m.rotation.y = ry; return m; };
  wall(16, wallMat([4, 1.4]), 0, -7.9, 0);
  wall(16, wallMat([4, 1.4]), -7.9, 0, Math.PI / 2);
  wall(16, wallMat([4, 1.4]), 7.9, 0, -Math.PI / 2);
  const dW = 1.7, dH = 2.6;
  const shape = new THREE.Shape();
  shape.moveTo(-8, 0); shape.lineTo(8, 0); shape.lineTo(8, H); shape.lineTo(-8, H); shape.lineTo(-8, 0);
  const hole = new THREE.Path(); hole.moveTo(-dW / 2, 0.02); hole.lineTo(dW / 2, 0.02); hole.lineTo(dW / 2, dH); hole.lineTo(-dW / 2, dH); hole.lineTo(-dW / 2, 0.02);
  shape.holes.push(hole);
  const back = mesh(new THREE.ShapeGeometry(shape), lam({ map: tex(T.wall, [1, 1]), color: 0x8c8a90, side: THREE.DoubleSide }), 0, 0, 7.9);
  back.rotation.y = Math.PI;
  const bu = back.geometry.attributes.uv;
  for (let i = 0; i < bu.count; i++) bu.setXY(i, (bu.getX(i) + 8) / 16 * 4, bu.getY(i) / H * 1.4);
  const frameMat = lam({ color: 0x0b0b0e });
  box(dW + 0.28, 0.14, 0.18, frameMat, 0, dH + 0.07, 7.88); box(0.14, dH, 0.18, frameMat, -dW / 2 - 0.07, dH / 2, 7.88); box(0.14, dH, 0.18, frameMat, dW / 2 + 0.07, dH / 2, 7.88);
  const floor = mesh(new THREE.PlaneGeometry(16, 16), lam({ map: tex(T.floor, [6, 6]), color: 0x8a8a90 })); floor.rotation.x = -Math.PI / 2;
  const ceil = mesh(new THREE.PlaneGeometry(16, 16), lam({ map: tex(T.ceil, [8, 8]), color: 0x555560 }), 0, H, 0); ceil.rotation.x = Math.PI / 2;
  // коридор за проёмом
  const corr = lam({ color: 0x151315 });
  const cf = mesh(new THREE.PlaneGeometry(dW, 4), lam({ map: tex(T.floor, [1, 2]) }), 0, 0.01, 9.9); cf.rotation.x = -Math.PI / 2;
  const cl = mesh(new THREE.PlaneGeometry(4, dH), corr, -dW / 2, dH / 2, 9.9); cl.rotation.y = Math.PI / 2;
  const cr = mesh(new THREE.PlaneGeometry(4, dH), corr, dW / 2, dH / 2, 9.9); cr.rotation.y = -Math.PI / 2;
  const cc = mesh(new THREE.PlaneGeometry(dW, 4), corr, 0, dH, 9.9); cc.rotation.x = Math.PI / 2;
  const cb = mesh(new THREE.PlaneGeometry(dW, dH), lam({ color: 0x1c1618 }), 0, dH / 2, 11.9); cb.rotation.y = Math.PI;
  const doorLight = new THREE.PointLight(0xff5040, 4, 6, 1.4); doorLight.position.set(0, 2.2, 10.6); scene.add(doorLight);

  // ---------- кабельные трассы, трубы, решётки вентиляции ----------
  const cableMat = lam({ color: 0x0e0e10 }), pipeMat = lam({ color: 0x2a282c }), redPipe = lam({ color: 0x5a0a12 });
  [-7.6, 7.6].forEach(x => {
    box(0.4, 0.08, 16, cableMat, x, H - 0.35, 0);
    for (let k = 0; k < 4; k++) { const c = cyl(0.03, 0.03, 16, k === 1 ? redPipe : pipeMat, x + (k - 1.5) * 0.08, H - 0.28, 0, scene, 6); c.rotation.x = Math.PI / 2; }
  });
  { const p = cyl(0.09, 0.09, 16, pipeMat, 0, H - 0.25, -7.6, scene, 10); p.rotation.z = Math.PI / 2; }
  { const p = cyl(0.05, 0.05, 16, redPipe, 0, H - 0.5, -7.7, scene, 8); p.rotation.z = Math.PI / 2; }
  const ventC = offCanvas(128, 128), vg = ventC.getContext('2d'); vg.fillStyle = '#111013'; vg.fillRect(0, 0, 128, 128); for (let y = 8; y < 128; y += 14) { vg.fillStyle = '#000'; vg.fillRect(8, y, 112, 7); vg.fillStyle = '#2d2b30'; vg.fillRect(8, y + 7, 112, 2); }
  const ventM = lam({ map: tex(ventC) });
  [[7.88, 3.3, -3, -Math.PI / 2], [-7.88, 3.3, 4.5, Math.PI / 2], [4.5, 3.5, -7.88, 0]].forEach(([x, y, z, ry]) => { const v = mesh(new THREE.PlaneGeometry(1, 0.7), ventM, x, y, z); v.rotation.y = ry; });

  // ---------- свет: общий, подвесные лампы, красная тревога, синие полосы ----------
  const ambient = new THREE.AmbientLight(0x2c2530, 1.15); scene.add(ambient);
  const darkMetal = lam({ color: 0x1b1d1f });
  const shadeMat = lam({ color: 0x23282a, side: THREE.FrontSide });
  const shadeIn = basic({ color: 0xd8cdb4, side: THREE.BackSide });
  const lamps = [];
  function pendant(x, z, power) {
    const g = new THREE.Group(); g.position.set(x, H, z); scene.add(g);
    cyl(0.07, 0.07, 0.03, darkMetal, 0, -0.015, 0, g, 16);
    cyl(0.006, 0.006, 1.02, cableMat, 0, -0.54, 0, g, 6);
    cyl(0.03, 0.036, 0.09, darkMetal, 0, -1.08, 0, g, 12);
    const shade = mesh(keep(new THREE.ConeGeometry(0.34, 0.26, 20, 1, true)), shadeMat, 0, -1.24, 0, g);
    mesh(keep(new THREE.ConeGeometry(0.335, 0.255, 20, 1, true)), shadeIn, 0, -1.24, 0, g);
    const bulb = mesh(new THREE.SphereGeometry(0.06, 12, 10), basic({ color: 0xfff0d0 }), 0, -1.33, 0, g);
    const spr = sprite(0xffe6c0, 0.5, 1.1, 1.1, g); spr.position.set(0, -1.36, 0);
    const light = new THREE.PointLight(0xffdcb0, power, 9, 1.3); light.position.set(0, -1.4, 0); g.add(light);
    lamps.push({ g, light, spr, bulb, base: power, ph: rand(0, 10), swing: rand(0.01, 0.03) });
    return shade;
  }
  pendant(-5.2, 0, 9); pendant(4.8, 0, 8); pendant(0, -5.6, 7);
  // красный вращающийся маячок над терминалом
  const alarmG = new THREE.Group(); alarmG.position.set(1.9, 3.5, -7.75); scene.add(alarmG);
  cyl(0.12, 0.14, 0.12, darkMetal, 0, -0.06, 0, alarmG, 12);
  const alarmCap = mesh(new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), basic({ color: 0xff1030, transparent: true, opacity: 0.85 }), 0, 0, 0, alarmG);
  const alarmSpr = sprite(0xff0033, 0.6, 1.4, 1.4, alarmG);
  const alarmLight = new THREE.SpotLight(0xff0022, 12, 14, 0.5, 0.6, 1.2); alarmLight.position.set(0, 0, 0.1); alarmG.add(alarmLight); alarmG.add(alarmLight.target);
  // синие аварийные полосы вдоль пола
  const stripM = basic({ color: 0x2a7bff });
  [[-7.85, 0.12, 0, 0.04, 0.03, 15], [7.85, 0.12, 0, 0.04, 0.03, 15]].forEach(([x, y, z, w, h, d]) => box(w, h, d, stripM, x, y, z));
  box(15, 0.03, 0.04, stripM, 0, 0.12, -7.85);
  const blueL = new THREE.PointLight(0x2a7bff, 2, 6, 1.5); blueL.position.set(0, 0.3, -7); scene.add(blueL);

  // ---------- банкомат-терминал OBJ-4471 ----------
  const atm = new THREE.Group(); atm.position.set(0, 0, -7.55); scene.add(atm);
  const atmMat = lam({ color: 0x1c1b1f });
  box(1.5, 2.3, 0.7, atmMat, 0, 1.15, 0, atm);
  box(1.6, 0.12, 0.8, darkMetal, 0, 2.36, 0.02, atm);
  const fascia = new THREE.Group(); fascia.position.set(0, 1.5, 0.356); atm.add(fascia);
  mesh(new THREE.PlaneGeometry(1.08, 0.84), basic({ map: tex(RoomArt.bezel(3, p3)), transparent: true }), 0, 0, 0.002, fascia);
  const scrC = offCanvas(512, 384);
  RoomArt.screen(scrC, 0, { codeOk: G.story.codeOk, cracked: G.story.cracked, hits: G.story.hits });
  const scrTex = tex(scrC);
  const screenMesh = mesh(new THREE.PlaneGeometry(0.86, 0.62), basic({ map: scrTex, toneMapped: false }), 0, 0.02, 0.001, fascia);
  const scrGlow = sprite(0xff0033, 0.35, 2.4, 1.8, fascia); scrGlow.position.set(0, 0, 0.05);
  const scrLight = new THREE.PointLight(0xff1a3c, 5, 5, 1.4); scrLight.position.set(0, 1.5, -6.9); scene.add(scrLight);
  // клавиатура и щель для карты
  const pad = new THREE.Group(); pad.position.set(0, 0.95, 0.4); pad.rotation.x = -0.5; atm.add(pad);
  box(0.62, 0.36, 0.04, darkMetal, 0, 0, 0, pad);
  const keyM = lam({ color: 0x3a3a40 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) box(0.1, 0.06, 0.03, c === 3 ? lam({ color: r === 0 ? 0x6a0010 : r === 3 ? 0x0a5a2a : 0x6a5a10 }) : keyM, -0.2 + c * 0.135, 0.11 - r * 0.075, 0.025, pad);
  box(0.4, 0.03, 0.04, lam({ color: 0x050505 }), 0.1, 0.72 - 0.35, 0.37, atm);
  // знак высокого напряжения (реф. 4) и диагональная решётка на стене
  const sign = mesh(new THREE.PlaneGeometry(0.7, 0.7), lam({ map: tex(T.sign), transparent: true, alphaTest: 0.1 }), -1.55, 3.05, -7.88);
  const latC = offCanvas(512, 256), lg2 = latC.getContext('2d'); Art.lattice(lg2, 0, 0, 512, 256, 46, 'rgba(170,170,180,.8)', 7);
  mesh(new THREE.PlaneGeometry(3.4, 1.7), lam({ map: tex(latC), transparent: true, alphaTest: 0.2, color: 0x77777f }), 3.8, 2.7, -7.86);

  // ---------- стена с фото (слева) ----------
  const photos = [];
  const LAYOUT = Array.from({ length: 47 }, (_, i) => { const R = mulberry(500 + i); const col = i % 9, row = Math.floor(i / 9); return { x: -3.2 + col * 0.8 + (R() - 0.5) * 0.22, y: 3.2 - row * 0.52 + (R() - 0.5) * 0.12, rot: (R() - 0.5) * 0.22 }; });
  const photoGeo = keep(new THREE.PlaneGeometry(0.32, 0.4));
  const nailMat = lam({ color: 0x777777 }), nailGeo = keep(new THREE.SphereGeometry(0.018, 6, 5));
  LAYOUT.forEach((L, idx) => {
    const g = new THREE.Group(); g.position.set(-7.86, L.y, L.x); g.rotation.y = Math.PI / 2; scene.add(g);
    const mat = lam({ map: tex(T.photos[idx]), emissive: 0x140a08, side: THREE.DoubleSide });
    const m = new THREE.Mesh(photoGeo, mat); m.rotation.z = L.rot; m.userData.photo = idx; g.add(m);
    const nail = new THREE.Mesh(nailGeo, nailMat); nail.position.set(0, 0.17, 0.02); g.add(nail);
    photos.push({ group: g, mesh: m, nail, mat });
  });
  const chalk = mesh(new THREE.PlaneGeometry(0.46, 0.14), basic({ map: tex(RoomArt.chalkCode(2, p2)), transparent: true, color: 0xb0b0a8, depthWrite: false }), -7.87, 0.44, -2.6);
  chalk.rotation.y = Math.PI / 2;
  { const bc = offCanvas(256, 256); Art.bloodSplat(bc.getContext('2d'), 128, 90, 80, 44, 0.8); const bm = mesh(new THREE.PlaneGeometry(1.4, 1.4), basic({ map: tex(bc), transparent: true, depthWrite: false }), -7.87, 1.2, 3.6); bm.rotation.y = Math.PI / 2; }
  const threadMat = keep(new THREE.LineBasicMaterial({ color: 0xcc0022 }));
  let threads = null;

  // ---------- стол (справа) ----------
  const desk = new THREE.Group(); desk.position.set(6.6, 0, 0); desk.rotation.y = -Math.PI / 2; scene.add(desk);
  const deskMat = lam({ color: 0x55595e });
  box(2.4, 0.06, 1.1, deskMat, 0, 0.78, 0, desk);
  [[-1.12, -0.48], [1.12, -0.48], [-1.12, 0.48], [1.12, 0.48]].forEach(([x, z]) => box(0.06, 0.78, 0.06, darkMetal, x, 0.39, z, desk));
  const drawer = box(0.7, 0.2, 0.05, lam({ color: 0x484c51 }), 0.6, 0.64, 0.53, desk); drawer.userData.item = 'drawer';
  box(0.18, 0.025, 0.02, darkMetal, 0.6, 0.64, 0.565, desk);
  const nb = box(0.34, 0.03, 0.44, lam({ map: tex(T.paper) }), -0.4, 0.825, 0.05, desk); nb.userData.item = 'notebook'; nb.rotation.y = 0.15;
  const note = mesh(new THREE.PlaneGeometry(0.15, 0.15), lam({ map: tex(RoomArt.stickyNote(1, p1)), emissive: 0x2a2610 }), 0.22, 0.812, 0.02, desk); note.rotation.x = -Math.PI / 2; note.rotation.z = 0.3; note.userData.item = 'note';
  const frame = new THREE.Group(); frame.position.set(0.8, 0.81, 0.25); frame.rotation.set(-0.25, -0.4, 0); desk.add(frame);
  box(0.28, 0.34, 0.02, lam({ color: 0x2a1d14 }), 0, 0.17, 0, frame);
  const ph = mesh(new THREE.PlaneGeometry(0.22, 0.28), lam({ map: tex(T.mother) }), 0, 0.17, 0.012, frame); ph.userData.item = 'photo';
  frame.children.forEach(c => { c.userData.item = 'photo'; });
  const radio = new THREE.Group(); radio.position.set(-0.95, 0.81, -0.1); desk.add(radio);
  const rb = box(0.22, 0.34, 0.1, lam({ color: 0x1d2320 }), 0, 0.17, 0, radio); rb.userData.item = 'radio';
  const ant = cyl(0.008, 0.008, 0.3, darkMetal, 0.07, 0.48, 0, radio, 5); ant.userData.item = 'radio';
  const ledMat = basic({ color: 0x0a3a20 }); const led = box(0.03, 0.03, 0.01, ledMat, -0.06, 0.29, 0.055, radio); led.userData.item = 'radio';
  const ledSpr = sprite(0x00ff88, 0, 0.3, 0.3, radio); ledSpr.position.set(-0.06, 0.29, 0.08);
  // пепельница, камушек
  cyl(0.06, 0.07, 0.03, darkMetal, 0.35, 0.825, 0.35, desk, 10);
  const pickables = { desk: [], wall: photos.map(p => p.mesh) };
  desk.traverse(o => { if (o.isMesh && o.userData.item) pickables.desk.push(o); });

  // ---------- фигура в проёме: охранник (броня, реф. 6) или худой ----------
  const figG = new THREE.Group(); figG.position.set(0, 0, 9.25); figG.rotation.y = Math.PI; scene.add(figG);
  const guard = new THREE.Group(); figG.add(guard);
  const armM = lam({ color: 0x26252a }), armD = lam({ color: 0x131215 });
  const visorM = basic({ color: 0xff0033 }), redStrip = basic({ color: 0xff1a3c }), blueLed = basic({ color: 0x2a7bff });
  box(0.56, 0.7, 0.3, armM, 0, 1.25, 0, guard); box(0.5, 0.26, 0.28, armD, 0, 0.8, 0, guard);
  box(0.26, 0.04, 0.02, redStrip, 0, 1.32, 0.16, guard);
  [-1, 1].forEach(d => {
    const sh = mesh(new THREE.SphereGeometry(0.17, 12, 10), armM, d * 0.36, 1.52, 0, guard); sh.scale.set(1, 0.7, 1);
    box(0.13, 0.36, 0.14, armD, d * 0.38, 1.2, 0, guard);
    box(0.12, 0.36, 0.13, armM, d * 0.39, 0.86, 0.02, guard);
    for (let k = 0; k < 4; k++) box(0.03, 0.05, 0.01, d < 0 ? blueLed : redStrip, d * 0.39, 0.74 + k * 0.08, 0.09, guard);
    box(0.17, 0.72, 0.18, armD, d * 0.13, 0.36, 0, guard);
  });
  mesh(new THREE.SphereGeometry(0.2, 16, 12), armM, 0, 1.82, 0, guard);
  const visor = box(0.34, 0.1, 0.06, visorM, 0, 1.83, 0.17, guard);
  box(0.14, 0.12, 0.1, armD, 0, 1.68, 0.16, guard);
  const eyeSpr = sprite(0xff0022, 0, 1.2, 0.5, guard); eyeSpr.position.set(0, 1.84, 0.3);
  const gun = box(0.06, 0.08, 0.34, lam({ color: 0x0a0a0a }), 0.34, 1.1, 0.2, guard);
  const muzzleSpr = sprite(0xffd9a0, 0, 1.4, 1.4, guard); muzzleSpr.position.set(0.34, 1.12, 0.45);
  const thinMat = basic({ map: tex(RoomArt.figureTex('thin')), transparent: true, depthWrite: false, opacity: 0 });
  const thin = mesh(new THREE.PlaneGeometry(0.82, 1.8), thinMat, 0, 0.92, 0, figG);
  const guardMats = [];
  guard.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); keep(o.material); o.material.transparent = true; guardMats.push(o.material); } });
  let figure = 'guard', sil = 0, silT = 0, eyes = 0, eyesT = 0;

  // ---------- состояние камеры ----------
  const V = THREE.Vector3;
  const poseOf = n => { const p = POSES[n]; return { pos: new V(...p.pos), rotX: p.rotX, yaw: p.yaw, fov: p.fov }; };
  const base = poseOf('outside');
  let tween = null, lookY = 0, lookP = 0, shakeAmp = 0, shakeT = 0, active = true, time = 0, dread = 0, W = 1, Hh = 1, screenT = 0;
  const screenState = { codeOk: G.story.codeOk, cracked: G.story.cracked, hits: G.story.hits };
  function setPose(n) { const p = poseOf(n); base.pos.copy(p.pos); base.rotX = p.rotX; base.yaw = p.yaw; base.fov = p.fov; tween = null; }
  function moveTo(n, { dur = 1.6, ease = 'tension' } = {}) {
    const to = poseOf(n), from = { pos: base.pos.clone(), rotX: base.rotX, yaw: base.yaw, fov: base.fov };
    let dy = to.yaw - from.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    return new Promise(res => { tween = { from, to, dy, t: 0, dur, ease: EASE[ease] || EASE.tension, res }; });
  }
  function resize() {
    W = mount.clientWidth || window.innerWidth; Hh = mount.clientHeight || window.innerHeight;
    renderer.setSize(W, Hh, false);
    camera.aspect = W / Hh; camera.updateProjectionMatrix();
  }
  resize();
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function tick(dt) {
    time += dt;
    if (tween) {
      tween.t = Math.min(1, tween.t + dt / tween.dur);
      const k = tween.ease(tween.t);
      base.pos.lerpVectors(tween.from.pos, tween.to.pos, k);
      base.rotX = lerp(tween.from.rotX, tween.to.rotX, k); base.yaw = tween.from.yaw + tween.dy * k; base.fov = lerp(tween.from.fov, tween.to.fov, k);
      if (tween.t >= 1) { const r = tween.res; tween = null; r(); }
    }
    if (shakeT > 0) shakeT -= dt;
    const sh = shakeT > 0 ? shakeAmp : 0, dsh = dread * 0.012;
    camera.position.copy(base.pos);
    camera.position.y += Math.sin(time * 1.3) * 0.006;
    camera.rotation.set(base.rotX + lookP + (Math.random() - 0.5) * (sh + dsh), base.yaw + lookY + (Math.random() - 0.5) * (sh + dsh), (Math.random() - 0.5) * sh * 0.4);
    const fovK = camera.aspect < 1 ? Math.min(1.5, 1 + (1 - camera.aspect) * 0.85) : 1;
    camera.fov = base.fov * fovK; camera.updateProjectionMatrix();
    // лампы: дыхание, редкие сбои
    lamps.forEach(L => {
      const flick = Math.random() < 0.004 ? 0.1 : 1;
      L.light.intensity = L.base * (0.92 + 0.08 * Math.sin(time * 2 + L.ph)) * flick * (1 - dread * 0.6);
      L.spr.material.opacity = 0.5 * flick; L.g.rotation.z = Math.sin(time * 0.7 + L.ph) * L.swing;
    });
    alarmG.rotation.y = time * 2.4; alarmLight.intensity = 8 + dread * 40; alarmSpr.material.opacity = 0.45 + 0.25 * Math.sin(time * 6);
    ambient.color.setRGB(0.17 + dread * 0.35, 0.145 - dread * 0.05, 0.19 - dread * 0.08);
    scene.fog.color.setRGB(0.02 + dread * 0.14, 0.012, 0.016);
    // экран терминала
    screenT += dt;
    if (screenT > 0.25) { screenT = 0; RoomArt.screen(scrC, time, screenState); scrTex.needsUpdate = true; }
    scrLight.intensity = 4 + Math.sin(time * 9) * 0.4 + (Math.random() < 0.03 ? -2 : 0);
    // фигура
    sil += (silT - sil) * Math.min(1, dt * 3); eyes += (eyesT - eyes) * Math.min(1, dt * 4);
    guard.visible = figure === 'guard' && sil > 0.01; guardMats.forEach(m => { m.opacity = sil; });
    thin.visible = figure === 'thin' && sil > 0.01; thinMat.opacity = sil;
    eyeSpr.material.opacity = figure === 'guard' ? eyes * (0.7 + 0.3 * Math.sin(time * 5)) : 0;
    doorLight.intensity = 3 + sil * 3 + dread * 6;
    if (muzzleSpr.material.opacity > 0) muzzleSpr.material.opacity = Math.max(0, muzzleSpr.material.opacity - dt * 6);
    if (active) renderer.render(scene, camera);
  }
  function setLinksImpl(set) {
    if (threads) { scene.remove(threads); threads.geometry.dispose(); threads = null; }
    const pts = [];
    set.forEach(key => {
      const [a, b] = key.split('-').map(Number);
      if (!photos[a] || !photos[b] || !photos[a].group.visible || !photos[b].group.visible) return;
      const va = new V(), vb = new V(); photos[a].nail.getWorldPosition(va); photos[b].nail.getWorldPosition(vb);
      pts.push(va.x + 0.01, va.y, va.z, vb.x + 0.01, vb.y, vb.z);
    });
    if (!pts.length) return;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    threads = new THREE.LineSegments(geo, threadMat); scene.add(threads);
  }
  return {
    kind: 'webgl', setPose, moveTo, resize, tick,
    setLook(y, p) { lookY = y; lookP = p; },
    pick(nx, ny, mode) {
      ndc.set(nx, ny); raycaster.setFromCamera(ndc, camera);
      if (mode === 'wall') { const h = raycaster.intersectObjects(photos.filter(p => p.group.visible).map(p => p.mesh), false)[0]; return h ? { type: 'photo', index: h.object.userData.photo } : null; }
      if (mode === 'desk') { const h = raycaster.intersectObjects(pickables.desk, false)[0]; return h ? { type: 'item', id: h.object.userData.item } : null; }
      return null;
    },
    setLinks: setLinksImpl,
    markPhoto(i, color) { const p = photos[i]; if (p) p.mat.emissive.setHex(color || 0x140a08); },
    setPhotoCount(n) { photos.forEach((p, i) => { p.group.visible = i < n; }); },
    setFigure(k) { figure = k; },
    setSilhouette(a) { silT = a; },
    setEyes(a) { eyesT = a; },
    muzzle() { muzzleSpr.material.opacity = 1; doorLight.intensity = 30; },
    setScreenState(st) { Object.assign(screenState, st, { hits: G.story.hits }); RoomArt.screen(scrC, time, screenState); scrTex.needsUpdate = true; },
    setDread(v) { dread = clamp(v, 0, 1); },
    radioLed(on) { ledMat.color.setHex(on ? 0x00ff88 : 0x0a3a20); ledSpr.material.opacity = on ? 0.9 : 0; },
    shake(a, ms) { shakeAmp = a; shakeT = ms / 1000; },
    setActive(on) { active = !!on; renderer.domElement.style.visibility = on ? 'visible' : 'hidden'; },
    dispose() {
      if (threads) threads.geometry.dispose();
      trash.forEach(x => { try { x.dispose(); } catch { /* */ } });
      renderer.dispose(); try { renderer.forceContextLoss(); } catch { /* */ }
      renderer.domElement.remove();
    },
  };
}

/** плоский режим: те же виды, нарисованные на canvas (без WebGL) */
function createRoomFlat(mount) {
  const T = RoomArt.get();
  const [p1, p2, p3] = RoomArt.codeParts(G.story.code);
  const noteC = RoomArt.stickyNote(1, p1), chalkC = RoomArt.chalkCode(2, p2), bezelC = RoomArt.bezel(3, p3);
  const cv = document.createElement('canvas'); mount.appendChild(cv);
  const g = cv.getContext('2d');
  const wallC = Art.concrete(640, 360, { base: '#2a2729', seed: 21, cracks: 8, frost: 0.8 });
  const scrC = offCanvas(512, 384);
  let view = 'outside', W = 1, H = 1, dpr = 1, lookY = 0, time = 0, photoN = 0, links = new Set(), marks = {}, figure = 'guard', sil = 0, silT = 0, dread = 0, shakeT = 0, shakeA = 0, active = true, led = false, muzzle = 0;
  const st = { codeOk: G.story.codeOk, cracked: G.story.cracked, hits: G.story.hits };
  let tween = null;
  const hot = [];
  const L47 = Array.from({ length: 47 }, (_, i) => { const R = mulberry(500 + i); return { x: 0.12 + (i % 9) * 0.095 + (R() - 0.5) * 0.02, y: 0.14 + Math.floor(i / 9) * 0.13 + (R() - 0.5) * 0.02, r: (R() - 0.5) * 0.2 }; });
  function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); W = mount.clientWidth || window.innerWidth; H = mount.clientHeight || window.innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  resize();
  function wallBg(dark) { g.drawImage(wallC, 0, 0, W, H); g.fillStyle = `rgba(0,0,0,${dark})`; g.fillRect(0, 0, W, H); Art.grate(g, 0, H * 0.82, W, H * 0.18, 26, 'rgba(90,90,100,.25)'); }
  function draw() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    hot.length = 0;
    const ox = lookY * W * 0.4 + (shakeT > 0 ? rand(-shakeA, shakeA) * 400 : 0);
    g.save(); g.translate(ox, 0);
    const close = view === 'wallClose' || view === 'deskClose';
    if (view === 'outside' || view === 'inside') {
      wallBg(0.35);
      Art.warnSign(g, W * 0.3, H * 0.2, Math.min(W, H) * 0.1);
      const bw = Math.min(W * 0.36, H * 0.5), bx = W / 2 - bw / 2, by = H * 0.18;
      g.fillStyle = '#18171b'; g.fillRect(bx - bw * 0.1, by - bw * 0.1, bw * 1.2, H * 0.72);
      g.drawImage(bezelC, bx, by, bw, bw * 0.78);
      RoomArt.screen(scrC, time, st);
      g.drawImage(scrC, bx + bw * 0.1, by + bw * 0.1, bw * 0.8, bw * 0.58);
      Art.glowDot(g, W / 2, by + bw * 0.4, bw, 'rgba(255,0,40,.35)', 1);
    } else if (view === 'wall' || view === 'wallClose') {
      wallBg(0.45);
      const k = close ? 1.3 : 1;
      for (let i = 0; i < photoN; i++) {
        const L = L47[i], pw = W * 0.07 * k, x = W / 2 + (L.x - 0.5) * W * k, y = H * (0.1 + (L.y - 0.1) * k);
        g.save(); g.translate(x, y); g.rotate(L.r); g.drawImage(T.photos[i], -pw / 2, -pw * 0.62, pw, pw * 1.25);
        if (marks[i]) { g.strokeStyle = '#ff0033'; g.lineWidth = 3; g.strokeRect(-pw / 2, -pw * 0.62, pw, pw * 1.25); }
        g.restore();
        hot.push({ type: 'photo', index: i, x: x - pw / 2 + ox, y: y - pw * 0.62, w: pw, h: pw * 1.25 });
      }
      g.strokeStyle = '#cc0022'; g.lineWidth = 1.5;
      links.forEach(key => { const [a, b] = key.split('-').map(Number); const ha = hot.find(h => h.index === a), hb = hot.find(h => h.index === b); if (ha && hb) { g.beginPath(); g.moveTo(ha.x - ox + ha.w / 2, ha.y); g.lineTo(hb.x - ox + hb.w / 2, hb.y); g.stroke(); } });
      g.drawImage(chalkC, W * (close ? 0.62 : 0.66), H * 0.78, W * 0.14 * k, W * 0.045 * k);
    } else if (view === 'desk' || view === 'deskClose') {
      wallBg(0.55);
      const dg = g.createLinearGradient(0, H * 0.5, 0, H); dg.addColorStop(0, '#6c7177'); dg.addColorStop(1, '#3a3d41');
      g.fillStyle = dg; g.beginPath(); g.moveTo(W * 0.05, H * 0.5); g.lineTo(W * 0.95, H * 0.5); g.lineTo(W * 1.1, H); g.lineTo(-W * 0.1, H); g.fill();
      const item = (id, c, x, y, w, h) => { if (c) g.drawImage(c, x, y, w, h); else { g.fillStyle = '#1d2320'; g.fillRect(x, y, w, h); } hot.push({ type: 'item', id, x: x + ox, y, w, h }); };
      item('notebook', T.paper, W * 0.18, H * 0.58, W * 0.16, W * 0.2);
      item('note', noteC, W * 0.42, H * 0.64, W * 0.09, W * 0.09);
      item('photo', T.mother, W * 0.66, H * 0.52, W * 0.1, W * 0.125);
      item('radio', null, W * 0.08, H * 0.5, W * 0.06, W * 0.1);
      if (led) Art.glowDot(g, W * 0.1, H * 0.53, 20, 'rgba(0,255,136,.9)');
      item('drawer', null, W * 0.55, H * 0.86, W * 0.25, H * 0.08);
    } else {
      g.fillStyle = '#0b090a'; g.fillRect(0, 0, W, H);
      const dw = Math.min(W * 0.3, H * 0.36), dx = W / 2 - dw / 2, dh = H * 0.72, dy = H * 0.12;
      g.fillStyle = '#1c1416'; g.fillRect(dx, dy, dw, dh);
      Art.glowDot(g, W / 2, dy + dh * 0.4, dw, `rgba(255,70,50,${0.25 + dread * 0.3})`);
      g.globalAlpha = sil;
      if (figure === 'guard') Art.armor(g, W / 2, dy + dh * 0.1, dh * 0.75, { t: time });
      else Art.figure(g, W / 2, dy + dh, dh * 0.95, { glasses: true, t: time, rimCol: 'rgba(210,220,235,.25)' });
      g.globalAlpha = 1;
      if (muzzle > 0) { Art.glowDot(g, W / 2 + dh * 0.2, dy + dh * 0.5, dh * 0.6 * muzzle, 'rgba(255,220,160,1)'); muzzle -= 0.08; }
    }
    g.restore();
    if (dread > 0) { g.fillStyle = `rgba(80,0,10,${dread * 0.4})`; g.fillRect(0, 0, W, H); }
    Art.vignette(g, W, H, 0.75);
  }
  return {
    kind: 'flat', resize,
    setPose(n) { view = n; tween = null; },
    moveTo(n, { dur = 1.6 } = {}) { return new Promise(res => { tween = { t: 0, dur: Math.min(dur, 0.9), n, res }; }); },
    setLook(y) { lookY = y; },
    tick(dt) {
      time += dt; if (shakeT > 0) shakeT -= dt;
      if (tween) { tween.t += dt / tween.dur; if (tween.t >= 0.5 && view !== tween.n) view = tween.n; if (tween.t >= 1) { const r = tween.res; tween = null; r(); } }
      sil += (silT - sil) * Math.min(1, dt * 3);
      if (active) { draw(); if (tween) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(0,0,0,${Math.sin(Math.min(1, tween.t) * Math.PI)})`; g.fillRect(0, 0, cv.width, cv.height); } }
    },
    pick(nx, ny, mode) {
      const x = (nx + 1) / 2 * W, y = (1 - ny) / 2 * H;
      const h = hot.filter(q => (mode === 'wall' ? q.type === 'photo' : q.type === 'item')).reverse().find(q => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
      return h ? (h.type === 'photo' ? { type: 'photo', index: h.index } : { type: 'item', id: h.id }) : null;
    },
    setLinks(s) { links = new Set(s); },
    markPhoto(i, color) { marks[i] = color && color !== 0x140a08 && color !== 0x1a1008; },
    setPhotoCount(n) { photoN = n; },
    setFigure(k) { figure = k; }, setSilhouette(a) { silT = a; }, setEyes() {},
    muzzle() { muzzle = 1; },
    setScreenState(s) { Object.assign(st, s, { hits: G.story.hits }); },
    setDread(v) { dread = v; },
    radioLed(on) { led = on; },
    shake(a, ms) { shakeA = a; shakeT = ms / 1000; },
    setActive(on) { active = on; cv.style.visibility = on ? 'visible' : 'hidden'; },
    dispose() { cv.width = cv.height = 0; cv.remove(); },
  };
}
