/* ==========================================================================
   ПРОБУЖДЕНИЕ — от первого лица, изнутри капсулы. Стекло светится синим,
   за ним размыто: худой (Ройзман), смотритель с планшетом и широкий охранник
   в шлеме с визором у выхода. Над головами — обрывки фраз, не разобрать.
   Смотритель подходит: «К-48. Подъём.» — чётко. Экран дрожит и гаснет.
   Дальше: заставка → «И ДАЛЬШЕ БЕЗ СЧЁТА.» → последние слова → тьма.
   В темноте 47 секунд — и начинается кабинет психолога.
   ========================================================================== */
const AWAKE_TALK = {
  thin: ['регенерация… в пределах…', 'реакция зрачков…', 'он нас слышит?', '…минимальная анестезия', 'запишите время'],
  warden: ['пульс пятьдесят восемь', 'К-48… протокол…', 'гель откачан', '…открываю крышку', 'показатели чистые'],
  guard: ['…периметр…', 'объект в капсуле', 'готов', '…жду команды'],
};
const LAST_WORDS = [
  'Человек стоит ровно столько, сколько за него готовы заплатить.',
  'Иногда — три эсминца. Иногда — подпись на мокром от пота стекле.',
  'Люди продают друг друга тихо: за оклад, за жильё, за обещание вечности.',
  'Ошибаются один раз. Подписывают. Остальное делают уже за тебя.',
  'Контракт не спрашивает, чего ты хотел. Он спрашивает, сколько ты выдержишь.',
  'Обман — не в словах. Обман — в том, что ты сам очень хотел поверить.',
  'И кто-то всегда останется товаром.',
  'Расходным материалом.',
  'Цифрой в отчёте.',
  'Цифрой на счёте.',
  'Навсегда.',
  'Чего бы он ни хотел.',
  'И тьма.',
];

Acts.awake = {
  async enter(scope) {
    const root = $('#act-awake'), stage = $('#awStage'), labelsEl = $('#awLabels'), fin = $('#awFinal');
    Save.wipe();                         // цикл закончен: при следующем заходе — просто заставка
    FX.setLevel(0, { instant: true }); FX.clearBlood(); FX.setVisible(false);
    Audio47.setAmbient('ending', 3);
    root.className = 'act act-awake';
    stage.hidden = false; fin.hidden = true; labelsEl.innerHTML = '';
    $('#finActions').hidden = true; $('#finWords').textContent = ''; fin.className = 'final';

    // ---------- лаборатория за стеклом ----------
    let m = null;
    const figs = {};
    try {
      m = await createMini3D(scope, $('#awView'), { bg: 0x08111b, fov: 62, yawLim: 0.55, up: 0.13, down: 0.2, pos: [0, 1.55, 0], yaw: Math.PI });
    } catch (e) { console.warn('капсула без 3D:', e.message); root.classList.add('flat'); }
    if (!scope.alive) return;
    if (m) {
      const { THREE, scene, mesh, box, lam, basic, phong, tex } = m;
      const T = RoomTex.get();
      scene.fog = new THREE.FogExp2(0x0b1622, 0.075);
      scene.add(new THREE.HemisphereLight(0x9cc8ff, 0x0a0f18, 0.7));
      const grid = document.createElement('canvas'); grid.width = grid.height = 256;
      const gg = grid.getContext('2d'); gg.fillStyle = '#0d1520'; gg.fillRect(0, 0, 256, 256); gg.strokeStyle = 'rgba(120,170,220,0.18)'; gg.lineWidth = 2;
      for (let i = 0; i <= 256; i += 32) { gg.beginPath(); gg.moveTo(i, 0); gg.lineTo(i, 256); gg.stroke(); gg.beginPath(); gg.moveTo(0, i); gg.lineTo(256, i); gg.stroke(); }
      const gt = tex(grid); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(6, 10);
      const floor = mesh(new THREE.PlaneGeometry(12, 22), lam({ map: gt }), 0, 0, 8); floor.rotation.x = -Math.PI / 2;
      const wallM = lam({ color: 0x1a2634 });
      const wl = mesh(new THREE.PlaneGeometry(22, 4), wallM, -5, 2, 8); wl.rotation.y = Math.PI / 2;
      const wr = mesh(new THREE.PlaneGeometry(22, 4), wallM, 5, 2, 8); wr.rotation.y = -Math.PI / 2;
      const back = mesh(new THREE.PlaneGeometry(10, 4), wallM, 0, 2, 16.5); back.rotation.y = Math.PI;
      const ceil = mesh(new THREE.PlaneGeometry(10, 22), lam({ color: 0x0c131c }), 0, 3.6, 8); ceil.rotation.x = Math.PI / 2;
      // выход вдали: светлый проём
      const door = mesh(new THREE.PlaneGeometry(1.5, 2.5), basic({ color: 0xffe9c8 }), 0.4, 1.25, 16.45); door.rotation.y = Math.PI;
      const dl = new THREE.PointLight(0xffe0b8, 5, 8, 1.4); dl.position.set(0.4, 1.8, 15.6); scene.add(dl);
      [[-1.6, 3], [1.6, 3], [-1.6, 8.5], [1.6, 8.5], [0, 13]].forEach(([x, z]) => { box(1.8, 0.05, 0.25, basic({ color: 0xdff2ff }), x, 3.55, z); });
      [[0, 3.2, 3], [0, 3.2, 9]].forEach(([x, y, z]) => { const l = new THREE.PointLight(0xbfe0ff, 6, 10, 1.3); l.position.set(x, y, z); scene.add(l); });
      // другие капсулы
      const glass = phong({ color: 0x6fb6e6, transparent: true, opacity: 0.22, emissive: 0x0b2a44, shininess: 90, depthWrite: false });
      [[-3.3, 3.4], [3.3, 3.4], [-3.3, 7], [3.3, 7], [-3.3, 10.6], [3.3, 10.6]].forEach(([x, z]) => {
        mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.3, 20, 1, true), glass, x, 1.25, z);
        box(1.3, 0.14, 1.3, lam({ color: 0x1c2733 }), x, 0.07, z);
        box(1.3, 0.14, 1.3, lam({ color: 0x1c2733 }), x, 2.45, z);
      });
      // фигуры: плоскости, всегда повёрнутые к нам
      const fig = (key, texKey, x, z, h, wk = 1) => {
        const t = tex(T[texKey]);
        const w = h * 0.457 * wk;
        const plane = mesh(new THREE.PlaneGeometry(w, h), basic({ map: t, transparent: true, depthWrite: false }), x, h / 2, z);
        figs[key] = { plane, h, x, z };
        return plane;
      };
      fig('thin', 'thin', -1.7, 5.4, 1.92);
      fig('warden', 'warden', 1.5, 3.9, 1.86);
      fig('guard', 'guard', 0.4, 15.2, 2.05, 1.45);
      const visor = new THREE.Sprite(m.keep(new THREE.SpriteMaterial({ map: tex(T.glow), color: 0xff0022, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.9 })));
      visor.scale.set(0.6, 0.22, 1); visor.position.set(0.4, 1.8, 15.1); scene.add(visor);
      m.onTick((dt, t) => {
        Object.values(figs).forEach(f => { f.plane.lookAt(m.camera.position.x, f.plane.position.y, m.camera.position.z); });
        visor.material.opacity = 0.7 + 0.3 * Math.sin(t * 4);
      });
    }

    // ---------- обрывки фраз над головами (размыты, не разобрать до конца) ----------
    const labels = {};
    ['thin', 'warden', 'guard'].forEach(k => { const el = document.createElement('p'); el.className = 'aw-label'; labelsEl.appendChild(el); labels[k] = el; });
    const headOf = k => figs[k] ? [figs[k].plane.position.x, figs[k].h + 0.22, figs[k].plane.position.z] : null;
    if (m) m.onTick(() => {
      for (const k in labels) {
        const h = headOf(k); if (!h) continue;
        const p = m.project(...h), el = labels[k];
        const half = Math.min(el.offsetWidth / 2 + 8, labelsEl.clientWidth / 2);   // фраза не уходит за край экрана
        const x = clamp(p.x, half, labelsEl.clientWidth - half);
        el.style.transform = `translate(${x.toFixed(0)}px, ${p.y.toFixed(0)}px) translate(-50%, -100%)`;
        labels[k].style.visibility = p.visible ? 'visible' : 'hidden';
      }
    });
    if (!m) {                                    // без 3D: фразы стоят над условными силуэтами
      const at = { thin: [28, 44], warden: [64, 48], guard: [50, 36] };
      for (const k in labels) labels[k].style.transform = `translate(${at[k][0]}vw, ${at[k][1]}vh) translate(-50%, -100%)`;
    }
    const say = () => {
      const k = pick(Object.keys(labels)), el = labels[k];
      el.textContent = pick(AWAKE_TALK[k]); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
      if (Math.random() < 0.5) Audio47.sfx.mumble(0.9, k === 'guard' ? 0.7 : k === 'thin' ? 1.1 : 0.9);
      scope.timeout(() => el.classList.remove('show'), 2600);
    };

    scope.ready();
    runAwake(scope, { root, stage, labels, figs, m, say });
  },
};

/** сценарий капсулы: разговоры → смотритель подходит → «К-48. Подъём.» → экран гаснет */
async function runAwake(scope, { root, stage, labels, figs, m, say }) {
    let talking = true;
    const talk = () => { if (talking) say(); };
    scope.timeout(() => { root.classList.add('open'); Audio47.sfx.heartbeat(0.35); }, 700);
    const stopTalk = scope.every(() => rand(1600, 2800), talk);
    scope.timeout(talk, 2200);
    await scope.wait(15500);
    talking = false; stopTalk();
    // смотритель подходит к стеклу
    if (figs.warden) {
      Audio47.sfx.steps(5, 4.5);
      const f = figs.warden, x0 = f.plane.position.x, z0 = f.plane.position.z, T0 = Clock.now(), D = 5000;
      m.onTick(() => {
        const p = Math.min(1, (Clock.now() - T0) / D), e = easeInOutCubic(p);
        f.plane.position.x = lerp(x0, 0.12, e); f.plane.position.z = lerp(z0, 1.25, e);
        f.plane.position.y = f.h / 2 + Math.abs(Math.sin(p * Math.PI * 5)) * 0.02 * (1 - p);
      });
    }
    await scope.wait(5600);
    const crisp = labels.warden;
    crisp.textContent = 'К-48. Подъём.'; crisp.className = 'aw-label crisp show';
    root.classList.add('focus');
    Audio47.sfx.mumble(1.4, 0.72); Audio47.sfx.heartbeat(0.6);
    await scope.wait(2800);
    // экран дрожит, как от напряжения, — и гаснет
    root.classList.add('strain');
    const rum = Audio47.rumble(3600);
    const T1 = Clock.now();
    if (m) m.onTick(() => m.setShake(Math.min(0.06, (Clock.now() - T1) / 3600 * 0.06)));
    const stopShake = scope.every(420, () => FX.shake('sm'));
    await scope.wait(3600);
    rum.stop(); stopShake();
    if (m) m.setShake(0);
    Audio47.sfx.system(false); Audio47.sfx.glitch(0.5);
    root.classList.add('crt-off');
    await scope.wait(1300);
    stage.hidden = true;
    scope.untick('mini3d');                     // капсула погасла — больше не рисуем
    Audio47.setAmbient(null, 0.5);
    finale(scope);
}

/** финальная заставка → «И ДАЛЬШЕ БЕЗ СЧЁТА.» → последние слова → тьма (47 с — кабинет психолога) */
async function finale(scope) {
  const fin = $('#awFinal'), words = $('#finWords'), actions = $('#finActions');
  fin.hidden = false; fin.className = 'final show-title';
  await scope.wait(3400);
  Audio47.sfx.glitch(0.6); FX.flash('#ff0033', 180, 0.5);
  fin.className = 'final show-cut';
  await scope.wait(3800);
  fin.className = 'final show-words';
  await scope.wait(900);
  for (const w of LAST_WORDS) {
    words.textContent = w; words.classList.remove('on'); void words.offsetWidth; words.classList.add('on');
    const last = w === 'И тьма.';
    await scope.wait(last ? 3400 : 2200 + w.length * 45);
    words.classList.remove('on');
    await scope.wait(last ? 1600 : 900);
  }
  fin.className = 'final dark';
  await scope.wait(2600);
  actions.hidden = false;
  const go = fn => { scope.clear(secret); fn(); };
  $('#awRestart').onclick = () => go(() => { Audio47.sfx.click(); startAct('contract', { flash: '#88ddff' }); });
  $('#awExit').onclick = () => go(() => { Audio47.sfx.click(); leaveToBoot(); });
  // если просто остаться в темноте — 47 секунд
  const secret = scope.timeout(() => startAct('psych', { flash: '#ffffff' }), 47000);
}
