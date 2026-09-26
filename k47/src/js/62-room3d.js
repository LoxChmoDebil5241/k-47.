/* ==========================================================================
   КОМНАТА — рендер (Three.js через importmap) и плоский запасной режим.
   Планировка: банкомат-терминал впереди, стена с фото слева, металлический
   офисный стол справа, тёмный проём за спиной. Подвесные лампы над стеной и столом.
   Общий интерфейс рендеров:
     setPose(name) · moveTo(name, {dur, ease}) → Promise · setLook(yaw, pitch)
     pick(nx, ny, mode) · setLinks(set) · markPhoto(i, color) · setPhotoCount(n)
     setFigure(kind) · setSilhouette(a) · setEyes(a) · muzzle()
     setScreenState(st) · setScreenVis(v) · setDread(v) · thought(text) · clearThoughts()
     radioLed(on) · shake(amp, ms) · redPulse() · setActive(on) · tick(dt) · resize() · dispose()
   ========================================================================== */
const POSES = {
  outside:   { pos: [0, 1.55, -4.85], rotX: -0.09, yaw: 0,            fov: 60 },
  wall:      { pos: [-3.4, 1.9, 0],   rotX: -0.03, yaw: Math.PI / 2,  fov: 60 },
  wallClose: { pos: [-5.6, 1.85, 0],  rotX: -0.02, yaw: Math.PI / 2,  fov: 60 },
  desk:      { pos: [3.4, 1.85, 0],   rotX: -0.3,  yaw: -Math.PI / 2, fov: 60 },
  deskClose: { pos: [5.5, 1.55, 0],   rotX: -0.55, yaw: -Math.PI / 2, fov: 60 },
  facing:    { pos: [0, 1.85, 1.2],   rotX: -0.03, yaw: Math.PI,      fov: 60 },
  doorClose: { pos: [0, 1.8, 5.0],    rotX: -0.02, yaw: Math.PI,      fov: 56 },
  inside:    { pos: [0, 1.63, -6.62], rotX: 0,     yaw: 0,            fov: 78 },
};
/** пределы «осмотреться»: вверх голова поворачивается слабее, чем вниз */
const LOOK_LIMITS = {
  wall: { yaw: Math.PI * 0.39, pitch: Math.PI * 0.07 },
  wallClose: { yaw: Math.PI * 0.22, pitch: Math.PI * 0.08 },
  desk: { yaw: Math.PI * 0.22, pitch: Math.PI * 0.06 },
  deskClose: { yaw: Math.PI * 0.16, pitch: Math.PI * 0.06 },
  outside: { yaw: Math.PI * 0.1, pitch: Math.PI * 0.05 },
  facing: { yaw: Math.PI * 0.1, pitch: Math.PI * 0.04 },
};
const LOOK_UP = 0.35;   // доля предела, на которую можно поднять взгляд
const EASE = {
  tension: t => (t < 0.5 ? 0.5 * (1 - Math.cos(Math.PI * t)) : 0.5 + 0.5 * Math.sin(Math.PI * (t - 0.5))),
  in: t => t * t * t,
  out: t => 1 - Math.pow(1 - t, 3),
};
/** стабильный seed трещин для кода текущего цикла */
const crackSeed = () => parseInt(GameState.story.code.slice(0, 6), 10) || 4747;

async function createRoom3D(mount) {
  const T = RoomTex.get();
  const [p1, p2, p3] = RoomTex.codeParts(GameState.story.code);
  const THREE = await Promise.race([
    import('three'),
    new Promise((_, rej) => setTimeout(() => rej(new Error('three: timeout')), 9000)),
  ]);
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
  let pr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.FogExp2(0x050505, 0.045);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 80);
  camera.rotation.order = 'YXZ';

  // ---------- фабрики с учётом освобождения памяти ----------
  const trash = [];
  const keep = x => (trash.push(x), x);
  const tex = (c, rep) => {
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    return keep(t);
  };
  const lam = o => keep(new THREE.MeshLambertMaterial(o));
  const phong = o => keep(new THREE.MeshPhongMaterial(o));
  const basic = o => keep(new THREE.MeshBasicMaterial(o));
  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene) => { keep(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
  const glowTex = tex(T.glow);
  const sprite = (color, opacity, sx, sy, parent = scene) => { const s = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity }))); s.scale.set(sx, sy, 1); parent.add(s); return s; };

  // ---------- стены, пол, потолок (16×16) ----------
  const H = 4.4;
  const wallMat = side => lam({ map: tex(T.concrete, side), color: 0x8a8a8e });
  const wall = (w, mat, x, z, ry) => { const m = mesh(new THREE.PlaneGeometry(w, H), mat, x, H / 2, z); m.rotation.y = ry; return m; };
  wall(16, wallMat([6, 1.7]), 0, -7.9, 0);
  wall(16, wallMat([6, 1.7]), -7.9, 0, Math.PI / 2);
  wall(16, wallMat([6, 1.7]), 7.9, 0, -Math.PI / 2);
  const dW = 1.7, dH = 2.6;
  const shape = new THREE.Shape();
  shape.moveTo(-8, 0); shape.lineTo(8, 0); shape.lineTo(8, H); shape.lineTo(-8, H); shape.lineTo(-8, 0);
  const hole = new THREE.Path();
  hole.moveTo(-dW / 2, 0.02); hole.lineTo(dW / 2, 0.02); hole.lineTo(dW / 2, dH); hole.lineTo(-dW / 2, dH); hole.lineTo(-dW / 2, 0.02);
  shape.holes.push(hole);
  const back = mesh(new THREE.ShapeGeometry(shape), lam({ map: tex(T.concrete, [1, 1]), color: 0x8a8a8e, side: THREE.DoubleSide }), 0, 0, 7.9);
  back.rotation.y = Math.PI;
  const backUV = back.geometry.attributes.uv;
  for (let i = 0; i < backUV.count; i++) backUV.setXY(i, (backUV.getX(i) + 8) / 16 * 6, backUV.getY(i) / H * 1.7);
  const frameMat = phong({ color: 0x0c0c10, shininess: 30 });
  box(dW + 0.28, 0.14, 0.18, frameMat, 0, dH + 0.07, 7.88);
  box(0.14, dH, 0.18, frameMat, -dW / 2 - 0.07, dH / 2, 7.88);
  box(0.14, dH, 0.18, frameMat, dW / 2 + 0.07, dH / 2, 7.88);
  const floor = mesh(new THREE.PlaneGeometry(16, 16), lam({ map: tex(T.floor, [5, 5]), color: 0x6a6a6e }));
  floor.rotation.x = -Math.PI / 2;
  const ceil = mesh(new THREE.PlaneGeometry(16, 16), lam({ color: 0x141416 }), 0, H, 0);
  ceil.rotation.x = Math.PI / 2;
  const corr = lam({ color: 0x1c1a18 });
  const cf = mesh(new THREE.PlaneGeometry(dW, 4), corr, 0, 0.01, 9.9); cf.rotation.x = -Math.PI / 2;
  const cl = mesh(new THREE.PlaneGeometry(4, dH), corr, -dW / 2, dH / 2, 9.9); cl.rotation.y = Math.PI / 2;
  const cr = mesh(new THREE.PlaneGeometry(4, dH), corr, dW / 2, dH / 2, 9.9); cr.rotation.y = -Math.PI / 2;
  const cc = mesh(new THREE.PlaneGeometry(dW, 4), corr, 0, dH, 9.9); cc.rotation.x = Math.PI / 2;
  const cb = mesh(new THREE.PlaneGeometry(dW, dH), lam({ color: 0x2a2622 }), 0, dH / 2, 11.9); cb.rotation.y = Math.PI;
  const doorLight = new THREE.PointLight(0xffdcb0, 7, 7, 1.4); doorLight.position.set(0, 2.2, 10.6); scene.add(doorLight);

  // ---------- свет: общий + подвесные промышленные лампы ----------
  const ambient = new THREE.AmbientLight(0x2a2a34, 1.1); scene.add(ambient);
  const darkMetal = phong({ color: 0x1b1d1f, shininess: 60, specular: 0x333333 });
  const shadeMat = phong({ color: 0x2d3a33, shininess: 70, specular: 0x444444, side: THREE.FrontSide });
  const shadeIn = basic({ color: 0xcfc6b0, side: THREE.BackSide });
  const cordMat = lam({ color: 0x0b0b0c });
  const coneTex = tex(T.cone);
  const lamps = [];
  function pendant(x, z, power) {
    const g = new THREE.Group(); g.position.set(x, H, z); scene.add(g);
    mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 18), darkMetal, 0, -0.015, 0, g);          // розетка на потолке
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.02, 6), cordMat, 0, -0.54, 0, g);           // шнур
    mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.09, 14), darkMetal, 0, -1.08, 0, g);         // патрон
    const shadeGeo = new THREE.CylinderGeometry(0.07, 0.36, 0.28, 32, 1, true);
    mesh(shadeGeo, shadeMat, 0, -1.24, 0, g);                                                   // плафон снаружи — эмаль
    mesh(shadeGeo.clone(), shadeIn, 0, -1.24, 0, g);                                            // изнутри — светлый
    const rim = mesh(new THREE.TorusGeometry(0.36, 0.009, 6, 40), darkMetal, 0, -1.38, 0, g); rim.rotation.x = Math.PI / 2;
    const bulb = mesh(new THREE.SphereGeometry(0.055, 16, 12), basic({ color: 0xfff1d6 }), 0, -1.3, 0, g);
    const halo = sprite(0xffdcae, 0.55, 1.1, 1.1, g); halo.position.set(0, -1.32, 0);
    const cone = mesh(new THREE.CylinderGeometry(0.34, 1.15, 2.9, 28, 1, true),
      basic({ map: coneTex, color: 0xffe2b8, transparent: true, opacity: 0.03, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide, fog: false }), 0, -1.38 - 1.45, 0, g);
    const spot = new THREE.SpotLight(0xffe0b4, power * 3.2, 12, 1.0, 0.7, 1.2);
    spot.position.set(x, H - 1.32, z); spot.target.position.set(x, 0, z); scene.add(spot, spot.target);
    const fill = new THREE.PointLight(0xfff0d0, power, 10, 1.5); fill.position.set(x, H - 1.45, z); scene.add(fill);
    const L = { spot, fill, bulb, halo, cone, power, dim: 1 };
    lamps.push(L);
    return L;
  }
  pendant(-6.5, 0, 8.5);     // над стеной с фото
  pendant(6.0, 0, 6.5);      // над столом

  // ---------- стена с фотографиями (слева): одно фото на прочитанную главу ----------
  const board = new THREE.Group(); board.position.set(-7.86, 1.9, 0); board.rotation.y = Math.PI / 2; scene.add(board);
  const pinMat = phong({ color: 0xa3121c, shininess: 90, specular: 0x552222 }), pinNeedle = phong({ color: 0x9a9a9e, shininess: 100 });
  const photos = [];
  T.layout.forEach((L, idx) => {
    const g = new THREE.Group();
    g.position.set((L.col - 3.5) * 0.44 + L.jx, (2.5 - L.row) * 0.39 + L.jy, 0.004 + idx * 0.0001);
    g.rotation.z = L.rot; g.scale.setScalar(L.scale);
    const mat = lam({ map: tex(T.photos[idx]), emissive: 0x1a1008, side: THREE.DoubleSide });
    const m = mesh(new THREE.PlaneGeometry(0.24, 0.3), mat, 0, 0, 0, g);
    m.userData.photo = idx;
    const nail = mesh(new THREE.SphereGeometry(0.013, 10, 8), pinMat, 0, 0.125, 0.016, g);
    const needle = mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.02, 5), pinNeedle, 0, 0.125, 0.006, g); needle.rotation.x = Math.PI / 2;
    g.visible = false;
    board.add(g);
    photos.push({ group: g, mesh: m, nail, mat });
  });
  const links = new THREE.Group(); scene.add(links);
  const threadMat = basic({ color: 0xcc1122 });
  // часть кода 2/3 — мелом, внизу справа, заметна только вблизи
  const chalk = mesh(new THREE.PlaneGeometry(0.42, 0.13), basic({ map: tex(RoomTex.chalkCode(2, p2)), transparent: true, color: 0xa8a8a0, depthWrite: false }), -7.87, 0.44, -2.6);
  chalk.rotation.y = Math.PI / 2;

  // ---------- металлический офисный стол (справа) ----------
  const desk = new THREE.Group(); desk.position.set(7.15, 0, 0); desk.rotation.y = -Math.PI / 2; scene.add(desk);
  const steel = phong({ map: tex(T.metal), color: 0xb8bcc0, shininess: 45, specular: 0x444444 });
  const steelDark = phong({ map: tex(T.metalDark), color: 0x9a9ea2, shininess: 35, specular: 0x333333 });
  const chrome = phong({ color: 0xc8c8cc, shininess: 110, specular: 0x999999 });
  const rubber = lam({ color: 0x111113 });
  box(2.9, 0.045, 1.15, steel, 0, 0.76, 0, desk);
  box(2.92, 0.03, 1.17, steelDark, 0, 0.73, 0, desk);
  box(2.9, 0.012, 1.15, lam({ color: 0x3b3f36 }), 0, 0.788, 0, desk);
  [[-1.4, -0.52], [-1.4, 0.52]].forEach(([x, z]) => box(0.05, 0.72, 0.05, steelDark, x, 0.36, z, desk));
  box(0.05, 0.05, 1.05, steelDark, -1.4, 0.06, 0, desk);
  box(2.3, 0.5, 0.02, steelDark, -0.25, 0.46, -0.55, desk);
  const ped = new THREE.Group(); ped.position.set(1.05, 0, 0.02); desk.add(ped);
  box(0.72, 0.72, 1.08, steelDark, 0, 0.36, 0, ped);
  const drawerFronts = [];
  [0.58, 0.36, 0.14].forEach((y, i) => {
    const f = box(0.68, 0.2, 0.02, steel, 0, y, 0.55, ped);
    box(0.24, 0.022, 0.03, chrome, 0, y + 0.03, 0.575, ped);
    drawerFronts.push(f);
    if (i === 0) f.userData.item = 'drawer';
  });
  box(0.72, 0.03, 1.08, rubber, 0, 0.015, 0, ped);
  const nb = new THREE.Group(); nb.position.set(-0.75, 0.795, 0.12); nb.rotation.y = 0.28; desk.add(nb);
  const leather = lam({ map: tex(T.leather), color: 0x6a2412 });
  box(0.5, 0.025, 0.68, leather, 0, 0.012, 0, nb);
  box(0.47, 0.06, 0.65, lam({ color: 0xd8cbb0 }), 0, 0.055, 0, nb);
  box(0.5, 0.025, 0.68, leather, 0, 0.098, 0, nb);
  const nbHit = box(0.7, 0.25, 0.85, basic({ visible: false }), 0, 0.08, 0, nb); nbHit.userData.item = 'notebook';
  const ph = new THREE.Group(); ph.position.set(0.4, 0.99, -0.25); ph.rotation.set(-0.18, -0.15, 0); desk.add(ph);
  const frameWood = lam({ color: 0x4a3a20 });
  box(0.34, 0.42, 0.02, frameWood, 0, 0, 0, ph);
  box(0.05, 0.1, 0.12, frameWood, 0, -0.18, -0.07, ph);
  mesh(new THREE.PlaneGeometry(0.28, 0.35), lam({ map: tex(T.oldPhoto), emissive: 0x1a0a04 }), 0, 0, 0.011, ph);
  const phHit = box(0.42, 0.5, 0.15, basic({ visible: false }), 0, 0, 0.05, ph); phHit.userData.item = 'photo';
  const radio = new THREE.Group(); radio.position.set(0.95, 0.95, 0.35); radio.rotation.y = -0.55; desk.add(radio);
  const radioMat = phong({ color: 0x141418, shininess: 40 });
  box(0.16, 0.32, 0.1, radioMat, 0, 0, 0, radio);
  box(0.17, 0.04, 0.11, rubber, 0, -0.17, 0, radio);
  mesh(new THREE.PlaneGeometry(0.1, 0.06), basic({ color: 0x22aa55 }), 0, 0.08, 0.051, radio);
  for (let i = 0; i < 6; i++) box(0.1, 0.006, 0.004, rubber, 0, -0.015 - i * 0.015, 0.052, radio);
  mesh(new THREE.CylinderGeometry(0.0035, 0.005, 0.3, 8), radioMat, 0.04, 0.3, 0, radio);
  const radioLedMat = basic({ color: 0x330000 });
  mesh(new THREE.SphereGeometry(0.008, 8, 8), radioLedMat, 0.05, 0.135, 0.052, radio);
  const radioHit = box(0.35, 0.6, 0.3, basic({ visible: false }), 0, 0.12, 0, radio); radioHit.userData.item = 'radio';
  mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.14, 16), lam({ color: 0x1a1010 }), -1.1, 0.86, 0.4, desk);
  const pencil = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.32, 6), lam({ color: 0x9a6622 }), 0.2, 0.8, 0.42, desk);
  pencil.rotation.set(0, 0.9, Math.PI / 2);
  const papers = box(0.42, 0.03, 0.56, lam({ color: 0xd8cbb0 }), -0.1, 0.81, 0.3, desk); papers.rotation.y = -0.4;
  // записка с частью кода 1/3
  const note = mesh(new THREE.PlaneGeometry(0.15, 0.15), lam({ map: tex(RoomTex.stickyNote(1, p1)), emissive: 0x2a2610 }), 0.22, 0.797, 0.02, desk);
  note.rotation.set(-Math.PI / 2, 0, 0.3);
  const noteHit = box(0.24, 0.06, 0.24, basic({ visible: false }), 0.22, 0.81, 0.02, desk); noteHit.userData.item = 'note';
  const deskHits = [nbHit, phHit, radioHit, noteHit, drawerFronts[0]];

  // ---------- терминал в корпусе-стойке (как у банкомата), с компьютерной клавиатурой ----------
  const atm = new THREE.Group(); atm.position.set(0, 0, -7.25); scene.add(atm);
  const body = phong({ map: tex(T.atm), color: 0x9aa0a8, shininess: 55, specular: 0x333333 });
  const bodyDark = phong({ color: 0x101114, shininess: 40 });
  const neonMat = basic({ color: 0xff0033, toneMapped: false });
  box(1.4, 0.06, 0.86, rubber, 0, 0.03, 0.02, atm);                                   // цоколь
  box(1.3, 1.02, 0.8, body, 0, 0.57, 0, atm);                                          // тумба стойки
  box(1.22, 0.012, 0.01, neonMat, 0, 0.1, 0.405, atm);                                 // неоновая полоса у пола
  for (let i = 0; i < 7; i++) box(0.7, 0.012, 0.01, bodyDark, 0, 0.3 + i * 0.05, 0.402, atm);   // вентиляционная решётка
  box(0.9, 0.012, 0.01, bodyDark, 0, 0.98, 0.402, atm);
  // наклонная полка с компьютерной клавиатурой
  const shelf = new THREE.Group(); shelf.position.set(0, 1.1, 0.34); shelf.rotation.x = 0.3; atm.add(shelf);
  box(1.24, 0.05, 0.42, body, 0, 0, 0, shelf);
  box(0.96, 0.03, 0.3, bodyDark, 0, 0.035, 0.0, shelf);                                // корпус клавиатуры
  const keyGeo = keep(new THREE.BoxGeometry(0.052, 0.018, 0.046));
  const keyMat = phong({ color: 0x2b2e33, shininess: 70, specular: 0x333333 }), keyLit = phong({ color: 0x3a1015, shininess: 70, emissive: 0x220006 });
  const rows = [[14, 0], [14, 0.02], [13, 0.035], [12, 0.05]];
  rows.forEach(([n, off], r) => {
    for (let c = 0; c < n; c++) {
      const k = new THREE.Mesh(keyGeo, r === 0 && c > 0 && c < 11 ? keyLit : keyMat);
      k.position.set(-0.43 + off + c * 0.062, 0.058, -0.1 + r * 0.056); shelf.add(k);
    }
  });
  box(0.36, 0.018, 0.046, keyMat, 0, 0.058, 0.124, shelf);                             // пробел
  box(0.2, 0.012, 0.16, bodyDark, 0.5, 0.036, 0.02, shelf);                            // коврик
  mesh(new THREE.SphereGeometry(0.035, 12, 8), keyMat, 0.5, 0.055, 0.02, shelf).scale.set(1, 0.45, 1.4);   // мышь
  // верхний корпус с экраном
  box(1.3, 0.96, 0.56, body, 0, 1.6, -0.12, atm);
  const fascia = new THREE.Group(); fascia.position.set(0, 1.6, 0.166); atm.add(fascia);
  mesh(new THREE.PlaneGeometry(1.08, 0.84), basic({ map: tex(RoomTex.bezel(3, p3)) }), 0, 0, 0, fascia);     // ободок с 3/3
  const screenTex = tex(T.screen);
  const screenMat = basic({ map: screenTex, toneMapped: false });
  const screen = mesh(new THREE.PlaneGeometry(0.88, 0.64), screenMat, 0, 0.03, 0.004, fascia);
  const sw = 0.88, sh = 0.64, sy = 0.03, nz = 0.012;
  box(sw + 0.03, 0.008, 0.006, neonMat, 0, sy + sh / 2 + 0.018, nz, fascia);
  box(sw + 0.03, 0.008, 0.006, neonMat, 0, sy - sh / 2 - 0.018, nz, fascia);
  box(0.008, sh + 0.03, 0.006, neonMat, -sw / 2 - 0.018, sy, nz, fascia);
  box(0.008, sh + 0.03, 0.006, neonMat, sw / 2 + 0.018, sy, nz, fascia);
  [-1, 1].forEach(s => box(0.05, 0.86, 0.34, bodyDark, s * 0.6, 0, 0.16, fascia));   // боковые шторки
  box(1.26, 0.05, 0.36, bodyDark, 0, 0.44, 0.16, fascia);                              // козырёк
  const cardLed = sprite(0xff2233, 0.6, 0.05, 0.05, fascia); cardLed.position.set(0.5, -0.4, 0.03);   // индикатор питания
  // световой короб сверху
  box(1.34, 0.24, 0.12, bodyDark, 0, 2.2, 0.12, atm);
  mesh(new THREE.PlaneGeometry(1.24, 0.2), basic({ map: tex(T.sign), toneMapped: false }), 0, 2.2, 0.181, atm);
  const termLight = new THREE.PointLight(0xff0033, 5, 5, 1.6); termLight.position.set(0, 1.7, -6.35); scene.add(termLight);
  const termGlow = sprite(0xff0033, 0.4, 2.6, 2.0); termGlow.position.set(0, 1.62, -7.2);   // за экраном: ореол вокруг, экран не заливает
  let screenState = { codeOk: false, cracked: false, cracks: null };

  // ---------- фигура в проёме ----------
  const figTex = { guard: tex(T.guard), thin: tex(T.thin) };
  const silMat = basic({ map: figTex.guard, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const sil = mesh(new THREE.PlaneGeometry(0.95, 2.08), silMat, 0, 1.04, 8.8); sil.rotation.y = Math.PI;
  const visor = sprite(0xff0022, 0, 0.5, 0.2); visor.position.set(0, 1.81, 8.72); visor.material.fog = false;
  const glints = [-0.052, 0.052].map(x => { const s = sprite(0xdde8ff, 0, 0.045, 0.03); s.position.set(x, 1.77, 8.72); s.material.fog = false; return s; });
  const muzzleFx = sprite(0xffe6a0, 0, 1.2, 1.2); muzzleFx.position.set(0, 1.32, 8.6); muzzleFx.material.fog = false;
  const muzzleLight = new THREE.PointLight(0xffd080, 0, 9, 1.2); muzzleLight.position.set(0, 1.4, 8.3); scene.add(muzzleLight);
  let figure = 'guard', muzzleT = 0;

  // ---------- мысли в пространстве комнаты ----------
  const floating = [];
  function thought(text) {
    const cnv = RoomTex.thoughtTex(text), t = new THREE.CanvasTexture(cnv); t.colorSpace = THREE.SRGBColorSpace;
    const h = rand(0.16, 0.26), w = h * (cnv.width / 128);
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const m = new THREE.Mesh(geo, mat);
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    if (floating.length >= 7) return;
    const yaw = Math.atan2(dir.x, dir.z) + rand(-0.55, 0.55), dist = rand(2, 6.5), up = rand(-0.22, 0.4);
    m.position.set(
      clamp(camera.position.x + Math.sin(yaw) * dist, -7.4, 7.4),
      clamp(camera.position.y + up * dist, 0.5, 3.6),
      clamp(camera.position.z + Math.cos(yaw) * dist, -7.4, 7.6),
    );
    m.lookAt(camera.position); m.rotateZ(rand(-0.08, 0.08)); m.rotateY(rand(-0.25, 0.25));
    scene.add(m);
    floating.push({ m, t, life: rand(6, 9), age: 0, v: new THREE.Vector3(rand(-0.06, 0.06), rand(-0.02, 0.05), rand(-0.06, 0.06)), flick: 0 });
  }
  function dropThought(f) { scene.remove(f.m); f.m.geometry.dispose(); f.m.material.dispose(); f.t.dispose(); }
  function clearThoughts(fast = true) { floating.forEach(f => { if (fast) f.life = Math.min(f.life, f.age + 0.6); }); }
  let dread = 0;

  // ---------- пост-обработка: аберрация, зерно, виньетка, красная тьма ----------
  const rt = keep(new THREE.WebGLRenderTarget(2, 2));
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const post = keep(new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, uTime: { value: 0 }, uAb: { value: 0.003 }, uRed: { value: 0 }, uDark: { value: 0 }, uGrain: { value: 0.045 }, uFx: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uTime, uAb, uRed, uDark, uGrain, uFx; varying vec2 vUv;
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main(){
        vec2 d = vUv - 0.5; float r = length(d);
        vec2 off = normalize(d + 1e-5) * (uAb * uFx + uDark * 0.006) * r;
        vec3 col = vec3(texture2D(tDiffuse, vUv - off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + off).b);
        col += vec3(uRed * 0.35 * (0.4 + r), 0.0, 0.0);
        float lum = dot(col, vec3(0.3, 0.59, 0.11));
        col = mix(col, vec3(lum * 1.15 + 0.012, lum * 0.1, lum * 0.09), uDark * 0.85);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
        vec3 c = gl_FragColor.rgb;
        c *= mix(0.3, 1.0, smoothstep(0.85 - uDark * 0.3, 0.2 - uDark * 0.15, r));
        c = c * (1.0 - uDark * 0.2) + vec3(0.46, 0.0, 0.04) * uDark * smoothstep(0.22, 0.78, r);  // экран краснеет от краёв
        c += (hash(vUv * vec2(1920.0, 1080.0) + fract(uTime * 7.0)) - 0.5) * (uGrain * uFx + uDark * 0.05);
        c *= 1.0 - uFx * (0.05 - 0.05 * sin(vUv.y * 900.0));
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  }));
  postScene.add(new THREE.Mesh(keep(new THREE.PlaneGeometry(2, 2)), post));

  // ---------- камера: базовая поза, переходы, осмотр ----------
  const V = THREE.Vector3;
  const base = { pos: new V(), rotX: 0, yaw: 0, fov: 60 };
  let fovK = 1, tween = null, lookY = 0, lookP = 0, time = 0, active = true, shakeT = 0, shakeDur = 1, shakeAmp = 0, red = 0, flick = 0, screenAcc = 1;
  let silA = 0, silT = 0, eyeA = 0, eyeT = 0, screenVis = 1;
  const poseOf = name => { const p = POSES[name]; return { pos: new V(...p.pos), rotX: p.rotX, yaw: p.yaw, fov: p.fov }; };
  function setPose(name) { const p = poseOf(name); base.pos.copy(p.pos); base.rotX = p.rotX; base.yaw = p.yaw; base.fov = p.fov; tween = null; }
  function moveTo(name, { dur = 1.6, ease = 'tension' } = {}) {
    return new Promise(resolve => {
      const to = poseOf(name);
      let yaw = base.yaw + lookY;
      while (to.yaw - yaw > Math.PI) yaw += Math.PI * 2;        // кратчайший поворот
      while (yaw - to.yaw > Math.PI) yaw -= Math.PI * 2;
      tween = { from: { pos: base.pos.clone(), rotX: base.rotX + lookP, yaw, fov: base.fov }, to, t: 0, t0: Clock.now(), dur, ease: EASE[ease] || EASE.tension, resolve };
      lookY = lookP = 0;
    });
  }

  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function resize() {
    const w = mount.clientWidth || window.innerWidth, h = mount.clientHeight || window.innerHeight;
    pr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    fovK = camera.aspect < 1 ? Math.min(1.45, 1 + (1 - camera.aspect) * 0.8) : 1;   // в портрете шире обзор
    rt.setSize(Math.floor(w * pr), Math.floor(h * pr));
  }
  resize();
  setPose('outside');

  let lost = false;
  const onLost = e => { e.preventDefault(); lost = true; }, onRestored = () => { lost = false; };
  renderer.domElement.addEventListener('webglcontextlost', onLost);
  renderer.domElement.addEventListener('webglcontextrestored', onRestored);

  function nailWorld(i) { const v = new V(); photos[i].nail.getWorldPosition(v); return v; }

  return {
    kind: 'webgl', element: renderer.domElement,
    setPose, moveTo,
    setLook(y, p) { lookY = y; lookP = p; },
    isMoving: () => !!tween,
    pick(nx, ny, mode) {
      ndc.set(nx, ny); raycaster.setFromCamera(ndc, camera);
      if (mode === 'wall') { const h = raycaster.intersectObjects(photos.filter(p => p.group.visible).map(p => p.mesh), false)[0]; return h ? { type: 'photo', index: h.object.userData.photo } : null; }
      if (mode === 'desk') { const h = raycaster.intersectObjects(deskHits, false)[0]; return h ? { type: 'item', id: h.object.userData.item } : null; }
      return null;
    },
    setLinks(set) {
      while (links.children.length) { const c = links.children.pop(); c.geometry.dispose(); }
      set.forEach(key => {
        const [a, b] = key.split('-').map(Number); if (!photos[a] || !photos[b] || !photos[a].group.visible || !photos[b].group.visible) return;
        const A = nailWorld(a), B = nailWorld(b), mid = A.clone().lerp(B, 0.5); mid.x += 0.03; mid.y -= A.distanceTo(B) * 0.08;
        const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
        links.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.004, 4, false), threadMat));
      });
    },
    markPhoto(i, color) { const p = photos[i]; if (!p) return; p.mat.emissive.setHex(color || 0x1a1008); },
    setPhotoCount(n) { photos.forEach((p, i) => { p.group.visible = i < n; }); },
    setFigure(kind) { figure = kind; silMat.map = figTex[kind] || figTex.guard; silMat.needsUpdate = true; },
    setSilhouette(a) { silT = a; }, setEyes(a) { eyeT = a; },
    muzzle() { muzzleT = 0.12; },
    setScreenState(st) { screenState = { ...screenState, ...st }; screenState.cracks = screenState.cracked ? Cracks.fromHits(GameState.story.hits, crackSeed(), 512 / 384) : null; screenAcc = 1; },
    setScreenVis(v) { screenVis = v; },
    setDread(v) { dread = clamp(v, 0, 1); },
    thought, clearThoughts,
    radioLed(on) { radioLedMat.color.setHex(on ? 0xff2222 : 0x330000); },
    shake(amp = 0.05, ms = 800) { shakeAmp = amp; shakeDur = shakeT = ms / 1000; },
    redPulse() { red = 1; },
    setActive(on) { active = on; },
    resize,
    tick(dt) {
      if (lost || !active) return;
      time += dt;
      let pulse = 0;
      if (tween) {
        tween.t = Math.min(1, (Clock.now() - tween.t0) / 1000 / tween.dur);   // по игровым часам: на паузе замирает
        const k = tween.ease(tween.t);
        base.pos.lerpVectors(tween.from.pos, tween.to.pos, k);
        base.rotX = lerp(tween.from.rotX, tween.to.rotX, k);
        base.yaw = lerp(tween.from.yaw, tween.to.yaw, k);
        base.fov = lerp(tween.from.fov, tween.to.fov, k);
        pulse = Math.sin(tween.t * Math.PI);
        if (tween.t >= 1) { const r = tween.resolve; tween = null; r(); }
      }
      camera.position.copy(base.pos);
      camera.position.y += Math.cos(time * 0.8) * 0.008;
      camera.rotation.y = base.yaw + lookY;
      camera.rotation.x = base.rotX + lookP;
      camera.rotation.z = 0;
      if (shakeT > 0) {
        shakeT -= dt; const k = Math.max(0, shakeT / shakeDur) * shakeAmp;
        camera.position.x += (Math.random() - 0.5) * k; camera.position.y += (Math.random() - 0.5) * k;
        camera.rotation.z = (Math.random() - 0.5) * k * 0.4;
      }
      camera.fov = (base.fov + pulse * 1.2) * fovK; camera.updateProjectionMatrix();
      // фигура в проёме
      silA += (silT - silA) * Math.min(1, dt * (silT > silA ? 3 : 1.2));
      eyeA += (eyeT - eyeA) * Math.min(1, dt * 4);
      silMat.opacity = silA;
      const ep = eyeA * (0.75 + 0.25 * Math.sin(time * 4.6));
      visor.material.opacity = figure === 'guard' ? ep : 0;
      glints.forEach((s, i) => { s.material.opacity = figure === 'thin' ? eyeA * 0.5 * Math.pow(Math.max(0, Math.sin(time * 0.9 + i * 1.7)), 8) : 0; });   // редкий блик на стёклах очков
      if (muzzleT > 0) { muzzleT -= dt; muzzleFx.material.opacity = Math.random() * 0.6 + 0.4; muzzleLight.intensity = 40; }
      else { muzzleFx.material.opacity = 0; muzzleLight.intensity = 0; }
      // лампы: редкое мерцание; во «взгляде в темноту» гаснут
      flick -= dt;
      if (flick <= 0) {
        flick = rand(0.05, Math.random() < 0.12 ? 0.3 : 3);
        lamps.forEach(L => { L.dim = Math.random() < 0.1 ? rand(0.2, 0.6) : 1; });
      }
      const dk = 1 - dread * 0.82;
      lamps.forEach(L => {
        const k = L.dim * dk;
        L.spot.intensity = L.power * 3.2 * k; L.fill.intensity = L.power * k;
        L.bulb.material.color.setRGB(0.35 + 0.65 * k, 0.33 + 0.6 * k, 0.28 + 0.56 * k);
        L.halo.material.opacity = 0.55 * k; L.cone.material.opacity = 0.03 * k;
      });
      ambient.intensity = 1.1 * (1 - dread * 0.6);
      // экран банкомата
      const fl = 0.85 + Math.sin(time * 27) * 0.04 + Math.sin(time * 3.1) * 0.06;
      screenMat.color.setScalar(clamp(screenVis * fl * 1.15, 0, 1));
      neonMat.color.setRGB(clamp((0.8 + Math.sin(time * 4) * 0.2) * screenVis + 0.2, 0, 1), 0, 0.2 * screenVis);
      termLight.intensity = 5 * Math.max(0.5, screenVis) * fl;
      termGlow.material.opacity = (0.36 + Math.sin(time * 2) * 0.06) * Math.max(0.4, screenVis);
      cardLed.material.opacity = 0.4 + 0.4 * (Math.sin(time * 5) > 0 ? 1 : 0);
      screenAcc += dt;
      if (screenAcc > 0.1) { screenAcc = 0; RoomTex.drawScreen(T.screen, time, screenState); screenTex.needsUpdate = true; }
      // мысли в пространстве
      for (let i = floating.length - 1; i >= 0; i--) {
        const f = floating[i];
        f.age += dt; f.m.position.addScaledVector(f.v, dt);
        const p = f.age / f.life;
        let op = p < 0.18 ? p / 0.18 : p > 0.75 ? Math.max(0, (1 - p) / 0.25) : 1;
        if (Math.random() < 0.04) f.flick = 0.1;
        if (f.flick > 0) { f.flick -= dt; op *= 0.35; }
        f.m.material.opacity = op * 0.95;
        if (f.age >= f.life) { dropThought(f); floating.splice(i, 1); }
      }
      red = Math.max(0, red - dt * 0.8);
      post.uniforms.uTime.value = time;
      post.uniforms.uRed.value = red;
      post.uniforms.uDark.value = dread;
      post.uniforms.uFx.value = Settings.fx ? 1 : 0;
      post.uniforms.uAb.value = 0.0028 + pulse * 0.007 + (shakeT > 0 ? 0.01 : 0) + red * 0.012;
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    },
    dispose() {
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
      while (links.children.length) links.children.pop().geometry.dispose();
      floating.splice(0).forEach(dropThought);
      trash.forEach(x => { try { x.dispose(); } catch { /* */ } });
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* */ }
      renderer.domElement.remove();
    },
  };
}

/** плоский режим (нет WebGL или CDN): каждый ракурс — нарисованная картинка */
function createRoomFlat(mount) {
  const T = RoomTex.get();
  const [p1, p2, p3] = RoomTex.codeParts(GameState.story.code);
  const chalkC = RoomTex.chalkCode(2, p2), noteC = RoomTex.stickyNote(1, p1), bezelC = RoomTex.bezel(3, p3);
  mount.innerHTML = '<div class="flat-room"><canvas width="1280" height="720"></canvas></div><p class="flat-note">3D недоступно · упрощённый режим</p>';
  const cv = $('canvas', mount), g = cv.getContext('2d'), W = 1280, H = 720;
  let view = 'outside', time = 0, acc = 1, silA = 0, silT = 0, eyeA = 0, eyeT = 0, lookY = 0, links = new Set(), marks = {}, count = 0, figure = 'guard', dread = 0, muzzleT = 0;
  let screenState = { codeOk: false, cracked: false, cracks: null };
  const photoRects = [];
  const deskRects = { notebook: [380, 420, 220, 120], photo: [680, 300, 120, 150], radio: [860, 330, 70, 130], note: [620, 440, 90, 70], drawer: [900, 520, 230, 70] };
  const glowAt = (x, y, r, color) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  function wallBg(dark = 0.6) { const p = g.createPattern(T.concrete, 'repeat'); g.fillStyle = p; g.fillRect(0, 0, W, H); g.fillStyle = `rgba(0,0,0,${dark})`; g.fillRect(0, 0, W, H); g.fillStyle = '#141416'; g.fillRect(0, H * 0.82, W, H * 0.18); }
  function lamp(x) { g.fillStyle = '#0b0b0c'; g.fillRect(x - 1, 0, 2, 70); g.fillStyle = '#2d3a33'; g.beginPath(); g.moveTo(x - 14, 70); g.lineTo(x + 14, 70); g.lineTo(x + 46, 110); g.lineTo(x - 46, 110); g.closePath(); g.fill(); glowAt(x, 112, 160, `rgba(255,226,180,${0.35 * (1 - dread * 0.8)})`); }
  function draw() {
    g.save(); g.translate(-lookY * 400, 0);
    const close = view === 'wallClose' || view === 'deskClose';
    if (view === 'outside' || view === 'inside') {
      wallBg(); glowAt(W / 2, 300, 420, 'rgba(255,0,51,0.3)');
      g.fillStyle = '#1a1c20'; g.fillRect(470, 110, 340, 560);                          // корпус банкомата
      g.fillStyle = '#120205'; g.fillRect(480, 90, 320, 40);
      g.fillStyle = '#ff2d4d'; g.font = 'bold 26px "Courier New", monospace'; g.textAlign = 'center'; g.fillText('OBJ-4471', W / 2, 119); g.textAlign = 'left';
      g.drawImage(bezelC, 490, 150, 300, 234);
      RoomTex.drawScreen(T.screen, time, screenState); g.drawImage(T.screen, 515, 170, 250, 188);
      g.strokeStyle = '#ff0033'; g.lineWidth = 2; g.strokeRect(512, 167, 256, 194);
      g.fillStyle = '#2a2d31'; g.fillRect(480, 410, 320, 40);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { g.fillStyle = '#8e9398'; g.fillRect(560 + c * 30, 416 + r * 10, 24, 7); }
      g.fillStyle = '#0a0a0c'; g.fillRect(560, 480, 160, 12);
    } else if (view === 'wall' || view === 'wallClose') {
      wallBg(0.45); lamp(W / 2);
      photoRects.length = 0;
      const sc = close ? 1.4 : 1, cw = 56 * sc, ch = 70 * sc, px = 104 * sc, py = 92 * sc;
      T.layout.forEach((L, i) => {
        if (i >= count) return;
        const x = W / 2 + (L.col - 3.5) * px, y = H / 2 - 20 + (L.row - 2.5) * py;
        g.save(); g.translate(x, y); g.rotate(-L.rot); g.drawImage(T.photos[i], -cw / 2, -ch / 2, cw, ch);
        if (marks[i]) { g.strokeStyle = '#ff2244'; g.lineWidth = 3; g.strokeRect(-cw / 2, -ch / 2, cw, ch); }
        g.fillStyle = '#a3121c'; g.beginPath(); g.arc(0, -ch / 2 + 5, 4, 0, Math.PI * 2); g.fill(); g.restore();
        photoRects[i] = [x, y - ch / 2, cw, ch];
      });
      g.drawImage(chalkC, close ? 1080 : 1010, close ? 640 : 610, close ? 150 : 100, close ? 47 : 31);
      g.strokeStyle = '#cc1122'; g.lineWidth = 2;
      links.forEach(k => { const [a, b] = k.split('-').map(Number); const A = photoRects[a], B = photoRects[b]; if (!A || !B) return; g.beginPath(); g.moveTo(A[0], A[1] + 5); g.lineTo(B[0], B[1] + 5); g.stroke(); });
    } else if (view === 'desk' || view === 'deskClose') {
      wallBg(); lamp(W / 2);
      g.fillStyle = '#6d7175'; g.fillRect(200, 480, 880, 40); g.fillStyle = '#4b4e52'; g.fillRect(200, 520, 880, 12);
      g.fillStyle = '#5a5d61'; g.fillRect(880, 532, 200, 180); g.fillStyle = '#7a7e82';
      [560, 620, 680].forEach(y => { g.fillRect(890, y - 20, 180, 50); }); g.fillStyle = '#c8c8cc'; [560, 620, 680].forEach(y => g.fillRect(950, y, 60, 5));
      g.drawImage(T.leather, 380, 420, 220, 60); g.drawImage(T.oldPhoto, 690, 300, 100, 125); g.fillStyle = '#141418'; g.fillRect(870, 340, 50, 120);
      g.save(); g.translate(665, 470); g.rotate(-0.2); g.drawImage(noteC, -40, -30, 80, 60); g.restore();
    } else if (view === 'facing' || view === 'doorClose') {
      wallBg(0.5);
      const s = view === 'doorClose' ? 1.5 : 1;
      g.save(); g.translate(640, 420); g.scale(s, s); g.translate(-640, -420);
      g.fillStyle = '#2a2622'; g.fillRect(560, 250, 160, 330); glowAt(640, 380, 180, 'rgba(255,220,176,0.25)');
      g.strokeStyle = '#0c0c10'; g.lineWidth = 14; g.strokeRect(553, 243, 174, 344);
      const fig = T[figure] || T.guard;
      if (silA > 0.01) { g.globalAlpha = silA; g.drawImage(fig, 600, 300, 80, 175); g.globalAlpha = 1; }
      const p = eyeA * (0.72 + 0.28 * Math.sin(time * 4.6));
      if (p > 0.01 && figure === 'guard') glowAt(640, 323, 22, `rgba(255,0,40,${p})`);
      if (muzzleT > 0) glowAt(640, 364, 90, 'rgba(255,230,160,0.95)');
      g.restore();
    }
    g.restore();
    if (dread > 0.01) { g.fillStyle = `rgba(90,0,0,${dread * 0.55})`; g.fillRect(0, 0, W, H); }
    const v = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 760);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.85)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    cv.style.transform = close ? 'scale(1.18)' : 'scale(1)';
  }
  const toCanvas = (nx, ny) => [(nx + 1) / 2 * W + lookY * 400, (1 - ny) / 2 * H];
  return {
    kind: 'flat', element: cv,
    setPose(name) { view = name; draw(); },
    moveTo(name, { dur = 1.2 } = {}) {
      return new Promise(res => { cv.style.opacity = '0'; setTimeout(() => { view = name; lookY = 0; draw(); cv.style.opacity = '1'; setTimeout(res, dur * 500); }, dur * 500); });
    },
    setLook(y) { lookY = y; },
    isMoving: () => false,
    pick(nx, ny, mode) {
      const [x, y] = toCanvas(nx, ny);
      const inR = ([rx, ry, rw, rh]) => x > rx - rw / 2 && x < rx + rw / 2 && y > ry && y < ry + rh;
      if (mode === 'wall') { const i = photoRects.findIndex(r => r && inR(r)); return i >= 0 ? { type: 'photo', index: i } : null; }
      if (mode === 'desk') { const k = Object.keys(deskRects).find(id => { const [rx, ry, rw, rh] = deskRects[id]; return x > rx && x < rx + rw && y > ry && y < ry + rh; }); return k ? { type: 'item', id: k } : null; }
      return null;
    },
    setLinks(set) { links = new Set(set); draw(); },
    markPhoto(i, color) { marks[i] = !!color && color !== 0x1a1008; draw(); },
    setPhotoCount(n) { count = n; draw(); },
    setFigure(kind) { figure = kind; },
    setSilhouette(a) { silT = a; }, setEyes(a) { eyeT = a; },
    muzzle() { muzzleT = 0.15; },
    setScreenState(st) { screenState = { ...screenState, ...st }; screenState.cracks = screenState.cracked ? Cracks.fromHits(GameState.story.hits, crackSeed(), 512 / 384) : null; },
    setScreenVis() {}, setDread(v) { dread = v; }, thought() {}, clearThoughts() {},
    radioLed() {}, shake() { FX.shake('lg'); }, redPulse() {}, setActive() {},
    resize() {},
    tick(dt) {
      time += dt; acc += dt; muzzleT -= dt;
      silA += (silT - silA) * Math.min(1, dt * 3); eyeA += (eyeT - eyeA) * Math.min(1, dt * 4);
      if (acc > 0.1) { acc = 0; draw(); }
    },
    dispose() { mount.innerHTML = ''; },
  };
}
