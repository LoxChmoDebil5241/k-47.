/* ==========================================================================
   МАЛЫЕ 3D-СЦЕНЫ (капсула, кабинет психолога): общий каркас на Three.js.
   Камера стоит на месте; «осмотреться» — зажать и вести, в пределах углов.
   Всё, что создаётся, освобождается в dispose().
   ========================================================================== */
async function createMini3D(scope, mount, { bg = 0x000000, fov = 60, yawLim = 0.5, up = 0.15, down = 0.25, pos = [0, 1.6, 0], yaw = 0, pitch = 0 } = {}) {
  const THREE = await Promise.race([
    import('three'),
    new Promise((_, rej) => setTimeout(() => rej(new Error('three: timeout')), 9000)),
  ]);
  if (!scope.alive) throw new Error('scene closed');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.innerHTML = '';
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 90);
  camera.rotation.order = 'YXZ'; camera.position.set(...pos);

  const trash = [];
  const keep = x => (trash.push(x), x);
  const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return keep(t); };
  const lam = o => keep(new THREE.MeshLambertMaterial(o));
  const phong = o => keep(new THREE.MeshPhongMaterial(o));
  const basic = o => keep(new THREE.MeshBasicMaterial(o));
  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene) => { keep(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);

  // ---------- осмотр ----------
  const look = { y: 0, p: 0, ty: 0, tp: 0, drag: false, lx: 0, ly: 0, enabled: true };
  const base = { yaw, pitch };
  scope.on(mount, 'pointerdown', e => { if (!look.enabled) return; look.drag = true; look.lx = e.clientX; look.ly = e.clientY; try { mount.setPointerCapture(e.pointerId); } catch { /* */ } });
  scope.on(mount, 'pointermove', e => {
    if (!look.drag) return;
    const dx = e.clientX - look.lx, dy = e.clientY - look.ly; look.lx = e.clientX; look.ly = e.clientY;
    look.ty = clamp(look.ty - dx * 0.004, -yawLim, yawLim);
    look.tp = clamp(look.tp - dy * 0.004, -down, up);
  });
  const end = () => { look.drag = false; };
  scope.on(mount, 'pointerup', end); scope.on(mount, 'pointercancel', end);
  scope.on(document, 'keydown', e => {
    if (!look.enabled || Modal.isOpen() || isTyping(e)) return;
    if (e.code === 'ArrowLeft') look.ty = clamp(look.ty + 0.12, -yawLim, yawLim);
    else if (e.code === 'ArrowRight') look.ty = clamp(look.ty - 0.12, -yawLim, yawLim);
    else if (e.code === 'ArrowUp') look.tp = clamp(look.tp + 0.08, -down, up);
    else if (e.code === 'ArrowDown') look.tp = clamp(look.tp - 0.08, -down, up);
  });

  let shakeAmp = 0, time = 0;
  const hooks = [];
  function resize() {
    const w = mount.clientWidth || window.innerWidth, h = mount.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = fov * (camera.aspect < 1 ? Math.min(1.45, 1 + (1 - camera.aspect) * 0.8) : 1);
    camera.updateProjectionMatrix();
  }
  resize();
  scope.on(window, 'k47:resize', resize);
  const v3 = new THREE.Vector3();

  const api = {
    THREE, scene, camera, renderer, keep, tex, lam, phong, basic, mesh, box, look, base,
    setShake(a) { shakeAmp = a; },
    onTick(fn) { hooks.push(fn); },
    /** экранные координаты точки (px) и видна ли она */
    project(x, y, z) {
      v3.set(x, y, z).project(camera);
      const r = mount.getBoundingClientRect();
      return { x: (v3.x + 1) / 2 * r.width, y: (1 - v3.y) / 2 * r.height, visible: v3.z < 1 && Math.abs(v3.x) < 1.2 && Math.abs(v3.y) < 1.2 };
    },
    tick(dt) {
      time += dt;
      const k = 1 - Math.pow(0.9, dt * 60);
      look.y += (look.ty - look.y) * k; look.p += (look.tp - look.p) * k;
      camera.rotation.set(base.pitch + look.p + (Math.random() - 0.5) * shakeAmp * 0.5, base.yaw + look.y + (Math.random() - 0.5) * shakeAmp, (Math.random() - 0.5) * shakeAmp * 0.3);
      camera.position.y = pos[1] + Math.sin(time * 0.9) * 0.006;
      hooks.forEach(fn => fn(dt, time));
      renderer.render(scene, camera);
    },
    dispose() {
      trash.forEach(x => { try { x.dispose(); } catch { /* */ } });
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* */ }
      renderer.domElement.remove();
    },
  };
  scope.tick('mini3d', dt => api.tick(dt));
  scope.onDispose(() => api.dispose());
  return api;
}
