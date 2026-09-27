/* ==========================================================================
   МАЛЫЕ 3D-СЦЕНЫ (капсула, кабинет психолога, штреки): общий каркас.
   Камера стоит на месте; «осмотреться» — зажать и вести, в пределах углов.
   ========================================================================== */
async function createMini3D(scope, mount, { bg = 0x000000, fov = 60, yawLim = 0.5, up = 0.15, down = 0.25, pos = [0, 1.6, 0], yaw = 0, pitch = 0, look = true } = {}) {
  if (!hasWebGL()) throw new Error('WebGL недоступен');
  const THREE = await loadThree();
  if (!scope.alive) throw new Error('scene closed');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.innerHTML = ''; mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 90);
  camera.rotation.order = 'YXZ'; camera.position.set(...pos);
  const trash = [];
  const keep = x => (trash.push(x), x);
  const tex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return keep(t); };
  const lam = o => keep(new THREE.MeshLambertMaterial(o));
  const phong = o => keep(new THREE.MeshPhongMaterial(o));
  const basic = o => keep(new THREE.MeshBasicMaterial(o));
  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene) => { keep(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
  const lk = { y: 0, p: 0, ty: 0, tp: 0, drag: false, lx: 0, ly: 0, enabled: look };
  const base = { yaw, pitch, pos: new THREE.Vector3(...pos) };
  scope.on(mount, 'pointerdown', e => { if (!lk.enabled) return; lk.drag = true; lk.lx = e.clientX; lk.ly = e.clientY; try { mount.setPointerCapture(e.pointerId); } catch { /* */ } });
  scope.on(mount, 'pointermove', e => { if (!lk.drag) return; const dx = e.clientX - lk.lx, dy = e.clientY - lk.ly; lk.lx = e.clientX; lk.ly = e.clientY; lk.ty = clamp(lk.ty - dx * 0.004, -yawLim, yawLim); lk.tp = clamp(lk.tp - dy * 0.004, -down, up); });
  const end = () => { lk.drag = false; };
  scope.on(mount, 'pointerup', end); scope.on(mount, 'pointercancel', end);
  scope.on(document, 'keydown', e => {
    if (!lk.enabled || Modal.isOpen() || isTyping(e) || stageOpen()) return;
    if (e.code === 'ArrowLeft') lk.ty = clamp(lk.ty + 0.12, -yawLim, yawLim); else if (e.code === 'ArrowRight') lk.ty = clamp(lk.ty - 0.12, -yawLim, yawLim);
    else if (e.code === 'ArrowUp') lk.tp = clamp(lk.tp + 0.08, -down, up); else if (e.code === 'ArrowDown') lk.tp = clamp(lk.tp - 0.08, -down, up);
  });
  let shakeAmp = 0, time = 0, active = true;
  const hooks = [];
  function resize() {
    const w = mount.clientWidth || window.innerWidth, h = mount.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = fov * (camera.aspect < 1 ? Math.min(1.45, 1 + (1 - camera.aspect) * 0.8) : 1);
    camera.updateProjectionMatrix();
  }
  resize();
  scope.on(window, 'k47:resize', resize);
  const v3 = new THREE.Vector3();
  const api = {
    THREE, scene, camera, renderer, keep, tex, lam, phong, basic, mesh, box, look: lk, base, resize,
    setShake(a) { shakeAmp = a; }, onTick(fn) { hooks.push(fn); }, setActive(on) { active = on; },
    project(x, y, z) { v3.set(x, y, z).project(camera); const r = mount.getBoundingClientRect(); return { x: (v3.x + 1) / 2 * r.width, y: (1 - v3.y) / 2 * r.height, visible: v3.z < 1 && Math.abs(v3.x) < 1.2 && Math.abs(v3.y) < 1.2 }; },
    tick(dt) {
      time += dt;
      const k = 1 - Math.pow(0.9, dt * 60);
      lk.y += (lk.ty - lk.y) * k; lk.p += (lk.tp - lk.p) * k;
      camera.rotation.set(base.pitch + lk.p + (Math.random() - 0.5) * shakeAmp * 0.5, base.yaw + lk.y + (Math.random() - 0.5) * shakeAmp, (Math.random() - 0.5) * shakeAmp * 0.3);
      camera.position.copy(base.pos); camera.position.y += Math.sin(time * 0.9) * 0.006;
      hooks.forEach(fn => fn(dt, time));
      if (active) renderer.render(scene, camera);
    },
    dispose() { trash.forEach(x => { try { x.dispose(); } catch { /* */ } }); renderer.dispose(); try { renderer.forceContextLoss(); } catch { /* */ } renderer.domElement.remove(); },
  };
  scope.tick('mini3d', dt => api.tick(dt));
  scope.onDispose(() => api.dispose());
  return api;
}

/* ==========================================================================
   ПРОБУЖДЕНИЕ — изнутри капсулы. Стекло светится синим, по нему стекают
   капли геля; за ним размыто: худой (Ройзман), смотритель с планшетом,
   широкий охранник в броне (реф. 6). Обрывки фраз над головами.
   «К-48. Подъём.» — чётко. Экран дрожит и гаснет → заставка → слова.
   ========================================================================== */
const AWAKE_TALK = {
  thin: ['регенерация… в пределах…', 'реакция зрачков…', 'он нас слышит?', '…минимальная анестезия', 'запишите время'],
  warden: ['пульс пятьдесят восемь', 'К-48… протокол…', 'гель откачан', '…открываю крышку', 'показатели чистые'],
  guard: ['…периметр…', 'объект в капсуле', 'готов', '…жду команды'],
};
const LAST_WORDS = ['Человек стоит ровно столько, сколько за него готовы заплатить.', 'Иногда — три эсминца. Иногда — подпись на мокром от пота стекле.',
  'Люди продают друг друга тихо: за оклад, за жильё, за обещание вечности.', 'Ошибаются один раз. Подписывают. Остальное делают уже за тебя.',
  'Контракт не спрашивает, чего ты хотел. Он спрашивает, сколько ты выдержишь.', 'Обман — не в словах. Обман — в том, что ты сам очень хотел поверить.',
  'И кто-то всегда останется товаром.', 'Расходным материалом.', 'Цифрой в отчёте.', 'Цифрой на счёте.', 'Навсегда.', 'Чего бы он ни хотел.', 'И тьма.'];

function figureCanvas(kind) {
  const c = offCanvas(256, 560), g = c.getContext('2d');
  if (kind === 'thin') Art.figure(g, 128, 560, 540, { body: '#0a1018', glasses: true, rimCol: 'rgba(160,210,255,.35)' });
  else if (kind === 'warden') { Art.figure(g, 128, 560, 520, { body: '#0d141c', rimCol: 'rgba(160,210,255,.3)' }); g.fillStyle = '#5ab8ff'; g.fillRect(150, 250, 44, 58); Art.glowDot(g, 172, 279, 60, 'rgba(90,184,255,.7)'); }
  else Art.armor(g, 128, 30, 400, { seed: 3 });
  return c;
}

Acts.awake = {
  async enter(scope) {
    const root = $('#act-awake'), stage = $('#awStage'), labelsEl = $('#awLabels'), fin = $('#awFinal');
    FX.setLevel(0, { instant: true }); FX.clearBlood(); FX.setVisible(false);
    A.setAmbient('ending', 3);
    root.className = 'scene act-awake';
    stage.hidden = false; fin.hidden = true; labelsEl.innerHTML = ''; $('#finWords').textContent = ''; fin.className = 'final';
    Menu.setAvailable(false);
    let m = null;
    const figs = {};
    try { m = await createMini3D(scope, $('#awView'), { bg: 0x08111b, fov: 62, yawLim: 0.55, up: 0.13, down: 0.2, pos: [0, 1.55, 0], yaw: Math.PI }); }
    catch (e) { console.warn('капсула без 3D:', e.message); }
    if (!scope.alive) return;
    if (m) {
      const { THREE, scene, mesh, box, lam, basic, phong, tex } = m;
      scene.fog = new THREE.FogExp2(0x0b1622, 0.075);
      scene.add(new THREE.HemisphereLight(0x9cc8ff, 0x0a0f18, 0.8));
      const grid = offCanvas(256, 256), gg = grid.getContext('2d'); gg.fillStyle = '#0d1520'; gg.fillRect(0, 0, 256, 256); gg.strokeStyle = 'rgba(120,170,220,0.18)'; gg.lineWidth = 2;
      for (let i = 0; i <= 256; i += 32) { gg.beginPath(); gg.moveTo(i, 0); gg.lineTo(i, 256); gg.stroke(); gg.beginPath(); gg.moveTo(0, i); gg.lineTo(256, i); gg.stroke(); }
      Art.bloodSplat(gg, 90, 160, 40, 8, 0.4);
      const floor = mesh(new THREE.PlaneGeometry(12, 22), lam({ map: tex(grid, [6, 10]) }), 0, 0, 8); floor.rotation.x = -Math.PI / 2;
      const wallM = lam({ map: tex(Art.concrete(256, 128, { base: '#1a2634', tint: 'rgba(40,80,120,.2)', seed: 5, frost: 0.6 }), [4, 1]) });
      const wl = mesh(new THREE.PlaneGeometry(22, 4), wallM, -5, 2, 8); wl.rotation.y = Math.PI / 2;
      const wr = mesh(new THREE.PlaneGeometry(22, 4), wallM, 5, 2, 8); wr.rotation.y = -Math.PI / 2;
      const bk = mesh(new THREE.PlaneGeometry(10, 4), wallM, 0, 2, 16.5); bk.rotation.y = Math.PI;
      const ceil = mesh(new THREE.PlaneGeometry(10, 22), lam({ color: 0x0c131c }), 0, 3.6, 8); ceil.rotation.x = Math.PI / 2;
      const door = mesh(new THREE.PlaneGeometry(1.5, 2.5), basic({ color: 0xffe9c8 }), 0.4, 1.25, 16.45); door.rotation.y = Math.PI;
      const dl = new THREE.PointLight(0xffe0b8, 5, 8, 1.4); dl.position.set(0.4, 1.8, 15.6); scene.add(dl);
      [[-1.6, 3], [1.6, 3], [-1.6, 8.5], [1.6, 8.5], [0, 13]].forEach(([x, z]) => box(1.8, 0.05, 0.25, basic({ color: 0xdff2ff }), x, 3.55, z));
      [[0, 3.2, 3], [0, 3.2, 9]].forEach(([x, y, z]) => { const l = new THREE.PointLight(0xbfe0ff, 6, 10, 1.3); l.position.set(x, y, z); scene.add(l); });
      // ряды капсул — в каждой одно и то же лицо (реф. 2)
      const glass = phong({ color: 0x6fb6e6, transparent: true, opacity: 0.22, emissive: 0x0b2a44, shininess: 90, depthWrite: false });
      const cloneC = offCanvas(256, 360); Art.clone(cloneC.getContext('2d'), 256, 360, { t: 1, seed: 2 });
      const cloneM = basic({ map: tex(cloneC), transparent: true, opacity: 0.55, depthWrite: false, color: 0x9fd4ff });
      [[-3.3, 3.4], [3.3, 3.4], [-3.3, 7], [3.3, 7], [-3.3, 10.6], [3.3, 10.6]].forEach(([x, z]) => {
        const f = mesh(new THREE.PlaneGeometry(0.8, 1.2), cloneM, x, 1.5, z); f.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
        mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.3, 20, 1, true), glass, x, 1.25, z);
        box(1.3, 0.14, 1.3, lam({ color: 0x1c2733 }), x, 0.07, z); box(1.3, 0.14, 1.3, lam({ color: 0x1c2733 }), x, 2.45, z);
      });
      const fig = (key, x, z, h, wk = 1) => { const t = tex(figureCanvas(key)); const w = h * 0.457 * wk; const plane = mesh(new THREE.PlaneGeometry(w, h), basic({ map: t, transparent: true, depthWrite: false }), x, h / 2, z); figs[key] = { plane, h }; return plane; };
      fig('thin', -1.7, 5.4, 1.92); fig('warden', 1.5, 3.9, 1.86); fig('guard', 0.4, 15.2, 2.05, 1.2);
      const visor = new THREE.Sprite(m.keep(new THREE.SpriteMaterial({ map: tex(RoomArt.get().glow), color: 0xff0022, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.9 })));
      visor.scale.set(0.6, 0.22, 1); visor.position.set(0.4, 1.78, 15.1); scene.add(visor);
      m.onTick((dt, t) => { Object.values(figs).forEach(f => f.plane.lookAt(m.camera.position.x, f.plane.position.y, m.camera.position.z)); visor.material.opacity = 0.7 + 0.3 * Math.sin(t * 4); });
    }
    // капли геля на стекле
    const dc = $('#awDrops'), dg = dc.getContext('2d'), drops = [];
    scope.tick('drops', dt => {
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = dc.clientWidth, H = dc.clientHeight;
      if (dc.width !== Math.round(W * dpr)) { dc.width = Math.round(W * dpr); dc.height = Math.round(H * dpr); }
      dg.setTransform(dpr, 0, 0, dpr, 0, 0); dg.clearRect(0, 0, W, H);
      if (drops.length < 40 && Math.random() < dt * 8) drops.push({ x: Math.random() * W, y: -10, v: rand(10, 60), r: rand(2, 6), trail: [] });
      drops.forEach(d => { d.y += d.v * dt; d.x += Math.sin(d.y * 0.05) * 0.2; d.v *= 1 + dt * 0.3; if (Math.random() < 0.3) d.trail.push([d.x, d.y]); if (d.trail.length > 30) d.trail.shift(); });
      for (let i = drops.length - 1; i >= 0; i--) if (drops[i].y > H + 20) drops.splice(i, 1);
      dg.strokeStyle = 'rgba(180,230,255,.18)'; dg.fillStyle = 'rgba(200,240,255,.35)';
      drops.forEach(d => { dg.lineWidth = d.r * 0.6; dg.beginPath(); d.trail.forEach(([x, y], i) => (i ? dg.lineTo(x, y) : dg.moveTo(x, y))); dg.stroke(); dg.beginPath(); dg.ellipse(d.x, d.y, d.r * 0.7, d.r, 0, 0, Math.PI * 2); dg.fill(); });
    }, 30);
    const labels = {};
    ['thin', 'warden', 'guard'].forEach(k => { const el = document.createElement('p'); el.className = 'aw-label'; labelsEl.appendChild(el); labels[k] = el; });
    const headOf = k => (figs[k] ? [figs[k].plane.position.x, figs[k].h + 0.22, figs[k].plane.position.z] : null);
    if (m) m.onTick(() => {
      for (const k in labels) {
        const h = headOf(k); if (!h) continue;
        const p = m.project(...h), el = labels[k], half = Math.min(el.offsetWidth / 2 + 8, labelsEl.clientWidth / 2);
        el.style.transform = `translate(${clamp(p.x, half, labelsEl.clientWidth - half).toFixed(0)}px, ${p.y.toFixed(0)}px) translate(-50%, -100%)`;
        el.style.visibility = p.visible ? 'visible' : 'hidden';
      }
    });
    else { const at = { thin: [28, 44], warden: [64, 48], guard: [50, 36] }; for (const k in labels) labels[k].style.transform = `translate(${at[k][0]}vw, ${at[k][1]}vh) translate(-50%, -100%)`; }
    const say = () => {
      const k = pick(Object.keys(labels)), el = labels[k];
      el.textContent = pick(AWAKE_TALK[k]); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
      if (Math.random() < 0.5) A.sfx.mumble(0.9, k === 'guard' ? 0.7 : k === 'thin' ? 1.1 : 0.9, 0.08);
      scope.timeout(() => el.classList.remove('show'), 2600);
    };
    scope.ready();
    // ---------- сценарий ----------
    let talking = true;
    scope.timeout(() => { root.classList.add('open'); A.sfx.heartbeat(0.35); A.sfx.hiss(1.4, 0.1); }, 700);
    const stopTalk = scope.every(() => rand(1600, 2800), () => { if (talking) say(); });
    scope.timeout(say, 2200);
    await scope.wait(15500);
    talking = false; stopTalk();
    if (figs.warden && m) {
      A.sfx.steps(5, 4.5, 0.16);
      const f = figs.warden, x0 = f.plane.position.x, z0 = f.plane.position.z, T0 = Clock.now(), D = 5000;
      m.onTick(() => { const p = Math.min(1, (Clock.now() - T0) / D), e = easeInOut(p); f.plane.position.x = lerp(x0, 0.12, e); f.plane.position.z = lerp(z0, 1.25, e); f.plane.position.y = f.h / 2 + Math.abs(Math.sin(p * Math.PI * 5)) * 0.02 * (1 - p); });
    }
    await scope.wait(5600);
    const crisp = labels.warden;
    crisp.textContent = 'К-48. Подъём.'; crisp.className = 'aw-label crisp show';
    if (!m) crisp.style.transform = 'translate(50vw, 40vh) translate(-50%, -100%)';
    root.classList.add('focus');
    A.sfx.mumble(1.4, 0.72, 0.14); A.sfx.heartbeat(0.6);
    await scope.wait(2800);
    root.classList.add('strain');
    const rum = A.rumble(3600), T1 = Clock.now();
    if (m) m.onTick(() => m.setShake(Math.min(0.06, (Clock.now() - T1) / 3600 * 0.06)));
    const stopShake = scope.every(420, () => FX.shake('sm'));
    await scope.wait(3600);
    rum.stop(); stopShake(); if (m) m.setShake(0);
    A.sfx.system(false); A.sfx.glitch(0.5);
    root.classList.add('crt-off');
    await scope.wait(1300);
    stage.hidden = true; if (m) m.setActive(false);
    A.setAmbient(null, 0.5);
    // ---------- заставка → «И ДАЛЬШЕ БЕЗ СЧЁТА.» → последние слова ----------
    fin.hidden = false; fin.className = 'final show-title';
    const fc = $('#finCv'), fg = fc.getContext('2d');
    let ft = 0;
    scope.tick('fin', dt => {
      ft += dt;
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = fc.clientWidth, H = fc.clientHeight;
      if (fc.width !== Math.round(W * dpr)) { fc.width = Math.round(W * dpr); fc.height = Math.round(H * dpr); }
      fg.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sp = Art.splash(fg, W, H, ft, { flicker: 1.5 });
      const k = Math.min(1, sp.s / 560), px = Math.max(2, Math.round(3 * k)), ty = sp.cy - sp.s * 0.43;
      if (!fin.classList.contains('show-cut')) {
        Art.pixText(fg, 'К-48', W / 2, ty, 26 * k, { px }); Art.pixText(fg, 'НОРМЫ РАСХОДА ПЛОТИ', W / 2, ty + 32 * k, 31 * k, { px, spacing: 0.2 }); Art.pixText(fg, 'ЦИКЛ-49.', W / 2, ty + 62 * k, 26 * k, { px });
      }
      Art.scan(fg, W, H, 0.18);
    }, 30);
    await scope.wait(3400);
    A.sfx.glitch(0.6); FX.flash('#ff0033', 180, 0.5); FX.chroma(300);
    fin.className = 'final show-title show-cut';
    await scope.wait(3800);
    scope.untick('fin');
    fin.className = 'final';
    await scope.wait(900);
    const words = $('#finWords');
    for (const w of LAST_WORDS) {
      words.textContent = w; words.classList.remove('on'); void words.offsetWidth; words.classList.add('on');
      const last = w === 'И тьма.';
      await scope.wait(last ? 3400 : 2200 + w.length * 45);
      words.classList.remove('on');
      await scope.wait(last ? 1600 : 900);
    }
    G.story.stage = 'after'; G.reader.unlocked = true; G.endings++; Save.put();
    startAct('psych', { flash: '#ffffff' });
  },
};

/* ==========================================================================
   КАБИНЕТ ПСИХОЛОГА — как в главе «После»: слишком светлая стерильная камера,
   где всё не так. Фикус с жёлтыми кончиками, окно в космос, часы за стеной,
   слишком ровный свет. Твои кулаки на краю стола. Ответы меняют её слова.
   ========================================================================== */
const PSYCH = {
  feel: { q: 'Как ты себя чувствуешь?', a: [
    ['«Нормально».', { say: ['«Нормально». Удобное слово. Им закрывают двери.'] }],
    ['«Не знаю».', { say: ['Это честный ответ. Честнее, чем кажется.'], open: 1 }],
    ['Промолчать', { say: ['…', 'Ты можешь говорить. Здесь безопасно.'], quiet: 1 }],
    ['Считать секунды', { say: ['Ты считаешь. Я вижу, как двигаются губы.', 'Считай, если так легче. Только не вслух — часы и так громкие.'], count: 1 }]] },
  name: { q: 'Ты помнишь своё имя?', a: [
    ['«Кристиан».', { say: ['Кристиан. Хорошо.', 'Скажи его ещё раз — про себя. Оно твоё.'], open: 1, name: 1 }],
    ['«К-48».', { say: ['Это номер на крышке капсулы.', 'Здесь у тебя есть право на имя. Даже если ты пока не знаешь, что с ним делать.'] }],
    ['«Не уверен, что оно моё».', { say: ['Имена никому не принадлежат до конца.', 'Но твоё к тебе ближе, чем номер.'], open: 1 }]] },
  wrists: { q: 'Ты смотришь на мои запястья.', a: [
    ['«Я не хочу этого».', { say: ['Я знаю. Хотеть и уметь — разные вещи.', 'Тебя научили уметь. Хотеть — не научили.'], open: 1 }],
    ['«Я знаю, как».', { say: ['…', 'Я тоже знаю, что ты знаешь. Я читала твой файл.'], tense: 1 }],
    ['Ударить кулаком по столу', { punch: 1, say: ['…', 'Ты остановился сам.', 'Это важнее, чем удар. Запомни.'], tense: 1 }]] },
  fear: { q: 'Ты боишься?', a: [
    ['«Нет».', { say: ['{fists}'] }],
    ['«Что меня вернут».', { say: ['В капсулу?', 'Я не могу обещать, что нет. Здесь этого никто не может обещать.'], open: 1 }],
    ['«Не знаю, куда идти после этой комнаты».', { say: ['Налево — столовая. Направо — комната отдыха. Прямо — выход.', 'Ты выберешь сам. Не сегодня.'], open: 1 }]] },
  see: { q: 'Хочешь, я скажу тебе, что я вижу?', a: [
    ['Кивнуть', { say: ['Я вижу человека, которого никогда не учили быть человеком.', 'Тебя учили умирать. Теперь тебе не нужно умирать — и ты не знаешь, что делать.', 'Это не болезнь. Это последствие.'], open: 1 }],
    ['«Нет».', { say: ['Хорошо. Я запишу. Когда-нибудь ты прочитаешь сам.'] }]] },
};

Acts.psych = {
  async enter(scope) {
    const root = $('#act-psych'), talk = $('#psTalk'), lineEl = $('#psLine'), choices = $('#psChoices');
    FX.setLevel(0, { instant: true }); FX.clearBlood(); FX.setVisible(false);
    A.setAmbient('psych', 2);
    root.className = 'scene act-psych';
    talk.hidden = true; $('#psVoice').textContent = ''; $('#psVoice').className = 'ps-voice'; $('#psTension').textContent = '';
    Menu.setAvailable(false);
    const st = { open: 0, tense: 0, quiet: 0, count: 0, name: 0 };
    let m = null, hands = null, lookAt = null;
    try { m = await createMini3D(scope, $('#psView'), { bg: 0xf1f3f4, fov: 58, yawLim: 1.05, up: 0.14, down: 0.36, pos: [0, 1.2, 1.35], pitch: -0.04 }); }
    catch (e) { console.warn('кабинет без 3D:', e.message); root.classList.add('flat'); }
    if (!scope.alive) return;
    if (m) {
      const { THREE, scene, mesh, box, lam, basic, phong, tex } = m;
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd6dadc, 1.8));
      const sun = new THREE.DirectionalLight(0xdfe9ff, 1.1); sun.position.set(-3, 3, 0); scene.add(sun);
      const wallM = lam({ color: 0xe9ecee }), white = lam({ color: 0xf6f7f7 }), grey = lam({ color: 0xd4d8db });
      const floor = mesh(new THREE.PlaneGeometry(6, 6), lam({ color: 0xd7dadc }), 0, 0, 0); floor.rotation.x = -Math.PI / 2;
      const ceil = mesh(new THREE.PlaneGeometry(6, 6), white, 0, 3, 0); ceil.rotation.x = Math.PI / 2;
      mesh(new THREE.PlaneGeometry(6, 3), wallM, 0, 1.5, -3);
      const wb = mesh(new THREE.PlaneGeometry(6, 3), wallM, 0, 1.5, 3); wb.rotation.y = Math.PI;
      const wl = mesh(new THREE.PlaneGeometry(6, 3), wallM, -3, 1.5, 0); wl.rotation.y = Math.PI / 2;
      const wr = mesh(new THREE.PlaneGeometry(6, 3), wallM, 3, 1.5, 0); wr.rotation.y = -Math.PI / 2;
      box(1.6, 0.03, 0.9, basic({ color: 0xffffff }), 0, 2.985, -0.3);
      // единственное неправильное пятно: камера наблюдения с красной точкой
      box(0.12, 0.08, 0.14, lam({ color: 0x2a2c2e }), 2.9, 2.8, -2.85); box(0.02, 0.02, 0.01, basic({ color: 0xff0033 }), 2.88, 2.8, -2.77);
      const sky = offCanvas(1024, 640), sg = sky.getContext('2d'); sg.fillStyle = '#02040a'; sg.fillRect(0, 0, 1024, 640);
      for (let i = 0; i < 900; i++) { const b = Math.random(); sg.fillStyle = `rgba(255,255,255,${b * b})`; sg.fillRect(Math.random() * 1024, Math.random() * 640, b > 0.9 ? 2 : 1, b > 0.9 ? 2 : 1); }
      const pl = sg.createRadialGradient(250, 760, 60, 250, 760, 520); pl.addColorStop(0, '#dfeaf2'); pl.addColorStop(0.55, '#9fb8c9'); pl.addColorStop(0.62, '#5d7a8f'); pl.addColorStop(0.64, 'rgba(40,70,100,0.3)'); pl.addColorStop(1, 'rgba(0,0,0,0)');
      sg.fillStyle = pl; sg.fillRect(0, 0, 1024, 640);
      const win = mesh(new THREE.PlaneGeometry(1.9, 1.2), basic({ map: tex(sky), toneMapped: false }), -2.985, 1.65, -0.7); win.rotation.y = Math.PI / 2;
      [[0.64], [-0.64]].forEach(([dy]) => box(0.08, 0.08, 2.02, white, -2.96, 1.65 + dy, -0.7));
      [-1, 1].forEach(s => box(0.08, 1.36, 0.08, white, -2.96, 1.65, -0.7 + s * 0.99));
      box(0.2, 0.04, 2.1, white, -2.9, 1.03, -0.7);
      const leaf = offCanvas(128, 64), lg = leaf.getContext('2d'), lgr = lg.createLinearGradient(0, 0, 128, 0);
      lgr.addColorStop(0, '#2f5a2a'); lgr.addColorStop(0.72, '#3d7a34'); lgr.addColorStop(0.9, '#b9a43a'); lgr.addColorStop(1, '#d8c04a');
      lg.fillStyle = lgr; lg.beginPath(); lg.ellipse(64, 32, 62, 26, 0, 0, Math.PI * 2); lg.fill();
      const leafM = lam({ map: tex(leaf), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
      const fx = 2.35, fz = -2.35;
      mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.42, 20), lam({ color: 0xb66a45 }), fx, 0.21, fz);
      mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.3, 8), lam({ color: 0x6b5238 }), fx, 1.05, fz);
      const lgeo = new THREE.PlaneGeometry(0.22, 0.11);
      for (let i = 0; i < 46; i++) { const a = i * 2.4, hgt = 0.7 + (i / 46) * 1.0, rad = 0.12 + Math.sin(i) * 0.05 + (1 - i / 46) * 0.14; const l = mesh(lgeo, leafM, fx + Math.cos(a) * rad, hgt, fz + Math.sin(a) * rad); l.rotation.set(-0.4 + Math.random() * 0.5, -a, 0.3 - Math.random() * 0.6); }
      mesh(new THREE.CircleGeometry(0.22, 40), basic({ color: 0xffffff }), 0.9, 2.2, -2.985);
      mesh(new THREE.TorusGeometry(0.22, 0.015, 8, 40), phong({ color: 0x2a2c2e }), 0.9, 2.2, -2.98);
      for (let i = 0; i < 12; i++) { const t = box(0.008, 0.035, 0.005, basic({ color: 0x222222 }), 0.9 + Math.sin(i / 12 * Math.PI * 2) * 0.18, 2.2 + Math.cos(i / 12 * Math.PI * 2) * 0.18, -2.98); t.rotation.z = -i / 12 * Math.PI * 2; }
      const hand = (len, w, col) => { const gg = new THREE.Group(); gg.position.set(0.9, 2.2, -2.975); scene.add(gg); box(w, len, 0.004, basic({ color: col }), 0, len / 2 - 0.02, 0, gg); return gg; };
      const hH = hand(0.1, 0.014, 0x222222), hM = hand(0.15, 0.01, 0x222222), hS = hand(0.17, 0.004, 0xb3261e);
      hH.rotation.z = -1.1; hM.rotation.z = -3.9;
      let sec = 0;
      scope.every(1000, () => { sec++; hS.rotation.z = -sec / 60 * Math.PI * 2; A.sfx.tick(0.7); });
      const dr = mesh(new THREE.PlaneGeometry(0.95, 2.1), lam({ color: 0xdfe3e6 }), 2.985, 1.05, 1.4); dr.rotation.y = -Math.PI / 2;
      const sign = offCanvas(256, 64), sx = sign.getContext('2d'); sx.fillStyle = '#2f7d4a'; sx.fillRect(0, 0, 256, 64); sx.fillStyle = '#fff'; sx.font = `bold 34px ${MONO}`; sx.textAlign = 'center'; sx.fillText('ВЫХОД', 128, 44);
      const sn = mesh(new THREE.PlaneGeometry(0.42, 0.1), basic({ map: tex(sign) }), 2.98, 2.3, 1.4); sn.rotation.y = -Math.PI / 2;
      box(1.5, 0.04, 0.8, white, 0, 0.74, -0.25);
      [[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.1], [0.7, 0.1]].forEach(([x, z]) => box(0.04, 0.72, 0.04, grey, x, 0.36, z));
      const tablet = box(0.26, 0.012, 0.18, phong({ color: 0x1b1d20, emissive: 0x0d1a2a }), -0.15, 0.766, -0.45); tablet.rotation.y = 0.15;
      mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 16), phong({ color: 0xcfe6f2, transparent: true, opacity: 0.45 }), 0.5, 0.87, -0.5);
      const chairM = lam({ color: 0xeceeef });
      box(0.5, 0.05, 0.48, chairM, 0, 0.46, -1.05); box(0.5, 0.6, 0.05, chairM, 0, 0.78, -1.3);
      const coat = lam({ color: 0xf1f1ef }), skin = lam({ color: 0xd9b8a0 }), hair = lam({ color: 0x3b2a20 });
      mesh(new THREE.CapsuleGeometry(0.17, 0.36, 6, 14), coat, 0, 0.95, -1.05);
      mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 10), skin, 0, 1.28, -1.05);
      const head = mesh(new THREE.SphereGeometry(0.11, 24, 18), skin, 0, 1.42, -1.04); head.scale.set(1, 1.12, 1);
      const hr = mesh(new THREE.SphereGeometry(0.122, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, 0, 1.45, -1.06); hr.scale.set(1.06, 1.1, 1.06); hr.rotation.x = -0.7;
      const hb = mesh(new THREE.CylinderGeometry(0.128, 0.14, 0.24, 20, 1, true, Math.PI * 0.42, Math.PI * 1.16), hair, 0, 1.33, -1.07); hb.material.side = THREE.DoubleSide;
      const dark = lam({ color: 0x2a1c14 });
      [-0.038, 0.038].forEach(x => { mesh(new THREE.SphereGeometry(0.012, 10, 8), dark, x, 1.44, -0.94); const brow = box(0.032, 0.005, 0.006, dark, x, 1.468, -0.938); brow.rotation.z = x > 0 ? -0.12 : 0.12; });
      box(0.036, 0.005, 0.006, lam({ color: 0x9a5a50 }), 0, 1.372, -0.94);
      const arm = (x, rz) => { const a = mesh(new THREE.CapsuleGeometry(0.045, 0.3, 4, 10), coat, x, 0.95, -0.8); a.rotation.set(1.1, 0, rz); return a; };
      arm(-0.19, -0.2); arm(0.19, 0.2);
      [-0.12, 0.1].forEach(x => mesh(new THREE.SphereGeometry(0.04, 12, 10), skin, x, 0.79, -0.58));
      // её запястья — тонкие белые полоски шрамов
      [-0.12, 0.1].forEach(x => box(0.05, 0.004, 0.01, basic({ color: 0xf6e8e0 }), x, 0.805, -0.62));
      hands = new THREE.Group(); scene.add(hands);
      [-0.3, 0.3].forEach(x => { const f = mesh(new THREE.SphereGeometry(0.07, 14, 10), skin, x, 0.8, 0.28, hands); f.scale.set(1.1, 0.8, 1.3); });
      lookAt = (x, y, z) => { const dx = x - m.camera.position.x, dz = z - m.camera.position.z, dy = y - m.camera.position.y; m.look.ty = clamp(Math.atan2(-dx, -dz), -1.05, 1.05); m.look.tp = clamp(Math.atan2(dy, Math.hypot(dx, dz)) - m.base.pitch, -0.36, 0.14); };
    }
    const line = async (text, { hold = true, q = false } = {}) => {
      talk.hidden = false; lineEl.classList.remove('show'); await scope.wait(380);
      lineEl.textContent = text; lineEl.className = `door-line show${q ? ' q' : ''}`;
      if (text !== '…') A.sfx.mumble(Math.min(2.4, 0.5 + text.length * 0.045), 1.35, 0.08);
      if (hold) await scope.wait(2300 + text.length * 45);
    };
    const ask = items => new Promise(res => {
      choices.innerHTML = '';
      items.forEach(([label, v], i) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = label; b.style.animationDelay = `${i * 80}ms`; b.addEventListener('click', () => { A.sfx.click(); choices.innerHTML = ''; res(v); }); choices.appendChild(b); });
      scope.timeout(() => { const f = $('button', choices); if (f) f.focus({ preventScroll: true }); }, 120);
    });
    async function node(key) {
      const n = PSYCH[key];
      await line(n.q, { q: true, hold: false });
      const r = await ask(n.a);
      if (!scope.alive) return;
      for (const k of ['open', 'tense', 'quiet', 'count', 'name']) st[k] += r[k] || 0;
      $('#psTension').textContent = st.tense ? `КУЛАКИ СЖАТЫ · ${st.tense}` : '';
      if (r.punch) { A.sfx.thud(1.2); FX.shake('lg'); if (m) m.setShake(0.05); scope.timeout(() => m && m.setShake(0), 500); if (hands) hands.position.y = -0.04; scope.timeout(() => { if (hands) hands.position.y = 0; }, 600); }
      for (let t of r.say) { if (t === '{fists}') t = st.tense ? 'Кулаки у тебя говорят другое. Но я поверю словам — сегодня.' : 'Хорошо. Тогда я буду бояться за двоих. Это моя работа.'; await line(t); }
    }
    scope.ready();
    await scope.wait(2200);
    await line('Слишком светло, да? Здесь всегда так. Говорят, это успокаивает.');
    if (!scope.alive) return;
    for (const k of ['feel', 'name', 'wrists', 'fear', 'see']) { await node(k); if (!scope.alive) return; }
    if (st.open >= 3) { await line('Это уже начало.'); await line('Возьми. Здесь номер. Позвони, если будет трудно.'); await line('Ты не знаешь, что такое «трудно»? Узнаешь. Это когда хочется позвонить.'); }
    else if (st.tense >= 2) await line('На сегодня достаточно. Тебе нужно отдохнуть. Мне тоже.');
    else await line('На сегодня достаточно.');
    await line(st.name ? 'Мы увидимся на следующей неделе, Кристиан.' : 'Мы увидимся на следующей неделе.');
    await line('Ты можешь идти.', { q: true, hold: false });
    const fin = await ask([['Посмотреть на фикус', 'ficus'], ['Встать и уйти', 'go']]);
    if (!scope.alive) return;
    if (fin === 'ficus') { if (lookAt) lookAt(2.35, 1.3, -2.35); await line('Полей его, если будешь проходить мимо. Кончики желтеют.'); await line('Никто не знает, сколько ему нужно воды. Даже я.'); }
    talk.hidden = true;
    root.classList.add('leaving');
    A.setAmbient(null, 2.5);
    await scope.wait(3200);
    const voice = $('#psVoice');
    voice.textContent = 'К-48. Подъём.'; voice.classList.add('show'); A.sfx.mumble(1.3, 0.7, 0.14);
    await scope.wait(3000);
    voice.classList.remove('show'); await scope.wait(1200);
    voice.textContent = '— Замолчи.'; voice.className = 'ps-voice show quiet';
    await scope.wait(2800);
    startAct('end', { fast: true });
  },
};

/* ==========================================================================
   ТЬМА — конец цикла. Если остаться в темноте 47 секунд — камушек.
   ========================================================================== */
Acts.end = {
  async enter(scope) {
    const root = $('#act-end'), cv = $('#endCv'), g = cv.getContext('2d'), stone = $('#endStone');
    FX.setLevel(0, { instant: true }); FX.clearBlood(); FX.setVisible(false);
    A.setAmbient('dark', 3);
    Menu.setAvailable(false);
    stone.textContent = ''; stone.classList.remove('on'); $('#endActions').hidden = true;
    let t = 0;
    scope.tick('dark', dt => {
      t += dt;
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const a = Math.max(0, Math.min(1, (t - 40) / 7));
      if (a > 0) { Art.glowDot(g, W / 2, H * 0.62, 40 + a * 30, `rgba(150,150,160,${a * 0.5})`); g.fillStyle = `rgba(110,112,118,${a})`; g.beginPath(); g.ellipse(W / 2, H * 0.62, 18, 13, 0.3, 0, Math.PI * 2); g.fill(); }
    }, 24);
    scope.ready();
    await scope.wait(3000);
    const res = Store.get(KEYS.res, null);
    const carried = [...(res && Array.isArray(res.items) ? res.items.map(x => x.label) : []), ...G.diverted];
    stone.textContent = carried.length ? `Остаточные данные: ${carried.slice(0, 5).map(s => s.toLowerCase()).join(' · ')}.` : 'Остаточные данные: 0,00%.';
    stone.classList.add('on');
    await scope.wait(5000);
    stone.classList.remove('on');
    await scope.wait(1500);
    const acts = $('#endActions'); acts.hidden = false;
    const go = fn => { scope.clear(secret); fn(); };
    $('#endAgain').onclick = () => go(() => { A.sfx.click(); Save.wipe(); Menu.setAvailable(true); startAct('contract', { flash: '#88ddff' }); });
    $('#endRead').onclick = () => go(() => { A.sfx.click(); Menu.setAvailable(true); startAct('read', { fast: true }); });
    $('#endBoot').onclick = () => go(() => { A.sfx.click(); leaveToBoot(); });
    $('#endBoot').focus({ preventScroll: true });
    // остаться в темноте 47 секунд
    const secret = scope.timeout(() => {
      acts.hidden = true;
      stone.textContent = 'Серый камушек — гладкий, отполированный тысячами прикосновений. Он перейдёт к следующему.';
      stone.classList.add('on'); A.sfx.chime(330, 0.05);
      scope.timeout(() => { acts.hidden = false; }, 6000);
    }, 47000);
  },
};

/* ==========================================================================
   РЕЖИМ ЧТЕНИЯ — только текст книги, все 49 глав открыты. Без эффектов.
   Место чтения сохраняется отдельно; сохранение игры не трогается.
   ========================================================================== */
Acts.read = {
  enter(scope) {
    const pos = Store.get('k47c48_readpos', 0) | 0;
    let cur = clamp(pos, 0, N_CH - 1);
    FX.setLevel(0, { instant: true }); FX.clearBlood(); FX.setVisible(false);
    A.setAmbient(null, 1);
    Menu.setAvailable(true);
    const main = $('#rmMain'), art = $('#rmArticle');
    function render(i) {
      const ch = BOOK[i];
      const paras = ch.p.map(p => (p === '---' ? '<p class="sep" aria-hidden="true">— — —</p>' : `<p>${paraHTML(p)}</p>`)).join('');
      art.innerHTML = `<header class="ch-head"><p class="ch-num">ГЛАВА ${i + 1}</p><h2 class="ch-title">${esc(chTitle(i))}</h2></header><div class="ch-text">${paras}</div>
        <footer class="ch-foot">${i < N_CH - 1 ? `<p class="note">Дальше — глава ${i + 2}</p><button class="btn btn-primary" data-go="${i + 1}">«${esc(chTitle(i + 1))}» →</button>` : '<p class="note">Конец книги. Дальше — без счёта.</p>'}</footer>`;
      $('#rmInd').textContent = `ГЛ. ${i + 1} / ${N_CH} · ${chTitle(i)}`;
      $('#rmPrev').disabled = i === 0; $('#rmNext').disabled = i === N_CH - 1;
      main.scrollTop = 0; progress();
    }
    function open(i) { if (i < 0 || i >= N_CH) return; if (i !== cur) A.sfx.page(); cur = i; Store.set('k47c48_readpos', cur); render(i); }
    function progress() { const max = main.scrollHeight - main.clientHeight; $('#rmProgress').style.width = `${max > 0 ? (main.scrollTop / max) * 100 : 100}%`; }
    function toc() {
      $('#tocList').innerHTML = BOOK.map((ch, i) => `<li><button class="toc-item${i === cur ? ' current' : ''}" data-go="${i}" aria-label="Глава ${i + 1}. ${esc(chTitle(i))}"${i === cur ? ' aria-current="true"' : ''}><span class="n">${i + 1}</span><span class="t">${esc(chTitle(i))}</span><span class="m"></span></button></li>`).join('');
      Modal.open($('#tocModal'), { focus: '.toc-item.current' });
      const c = $('.toc-item.current'); if (c) c.scrollIntoView({ block: 'center' });
    }
    scope.on($('#tocList'), 'click', e => { if (actName !== 'read') return; const b = e.target.closest('[data-go]'); if (!b) return; Modal.close($('#tocModal'), true); open(+b.dataset.go); });
    scope.on($('#rmPrev'), 'click', () => open(cur - 1));
    scope.on($('#rmNext'), 'click', () => open(cur + 1));
    scope.on($('#rmToc'), 'click', () => { A.sfx.click(); toc(); });
    const leave = () => { A.sfx.click(); Store.set('k47c48_readpos', cur); leaveToBoot(); };
    scope.on($('#rmExit'), 'click', leave);
    scope.on(art, 'click', e => { const b = e.target.closest('[data-go]'); if (b) open(+b.dataset.go); });
    scope.on(main, 'scroll', progress, { passive: true });
    scope.on(document, 'keydown', e => {
      if (Modal.isOpen() || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'ArrowLeft') { e.preventDefault(); open(cur - 1); } else if (e.code === 'ArrowRight') { e.preventDefault(); open(cur + 1); }
      else if (e.code === 'KeyT') { e.preventDefault(); toc(); } else if (e.key === 'Escape') { e.preventDefault(); leave(); }
    });
    render(cur);
    requestAnimationFrame(() => main.focus({ preventScroll: true }));
  },
};
