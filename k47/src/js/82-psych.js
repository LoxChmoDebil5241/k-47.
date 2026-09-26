/* ==========================================================================
   КАБИНЕТ ПСИХОЛОГА — секрет: 47 секунд в темноте после финала.
   Как в главе «После»: слишком светлая комната, фикус с жёлтыми кончиками,
   окно в космос, часы за стеной. Можно осмотреться. Ответы меняют то,
   что она скажет дальше.
   ========================================================================== */
const PSYCH = {
  feel: {
    q: 'Как ты себя чувствуешь?',
    a: [
      ['«Нормально».', { say: ['«Нормально». Удобное слово. Им закрывают двери.'] }],
      ['«Не знаю».', { say: ['Это честный ответ. Честнее, чем кажется.'], open: 1 }],
      ['Промолчать', { say: ['…', 'Ты можешь говорить. Здесь безопасно.'], quiet: 1 }],
      ['Считать секунды', { say: ['Ты считаешь. Я вижу, как двигаются губы.', 'Считай, если так легче. Только не вслух — часы и так громкие.'], count: 1 }],
    ],
  },
  name: {
    q: 'Ты помнишь своё имя?',
    a: [
      ['«Кристиан».', { say: ['Кристиан. Хорошо.', 'Скажи его ещё раз — про себя. Оно твоё.'], open: 1, name: 1 }],
      ['«К-48».', { say: ['Это номер на крышке капсулы.', 'Здесь у тебя есть право на имя. Даже если ты пока не знаешь, что с ним делать.'] }],
      ['«Не уверен, что оно моё».', { say: ['Имена никому не принадлежат до конца.', 'Но твоё к тебе ближе, чем номер.'], open: 1 }],
    ],
  },
  wrists: {
    q: 'Ты смотришь на мои запястья.',
    a: [
      ['«Я не хочу этого».', { say: ['Я знаю. Хотеть и уметь — разные вещи.', 'Тебя научили уметь. Хотеть — не научили.'], open: 1 }],
      ['«Я знаю, как».', { say: ['…', 'Я тоже знаю, что ты знаешь. Я читала твой файл.'], tense: 1 }],
      ['Ударить кулаком по столу', { punch: 1, say: ['…', 'Ты остановился сам.', 'Это важнее, чем удар. Запомни.'], tense: 1 }],
    ],
  },
  fear: {
    q: 'Ты боишься?',
    a: [
      ['«Нет».', { say: ['{fists}'] }],
      ['«Что меня вернут».', { say: ['В капсулу?', 'Я не могу обещать, что нет. Здесь этого никто не может обещать.'], open: 1 }],
      ['«Не знаю, куда идти после этой комнаты».', { say: ['Налево — столовая. Направо — комната отдыха. Прямо — выход.', 'Ты выберешь сам. Не сегодня.'], open: 1 }],
    ],
  },
  see: {
    q: 'Хочешь, я скажу тебе, что я вижу?',
    a: [
      ['Кивнуть', { say: ['Я вижу человека, которого никогда не учили быть человеком.', 'Тебя учили умирать. Теперь тебе не нужно умирать — и ты не знаешь, что делать.', 'Это не болезнь. Это последствие.'], open: 1 }],
      ['«Нет».', { say: ['Хорошо. Я запишу. Когда-нибудь ты прочитаешь сам.'] }],
    ],
  },
};

Acts.psych = {
  async enter(scope) {
    const root = $('#act-psych'), talk = $('#psTalk'), lineEl = $('#psLine'), choices = $('#psChoices');
    FX.setLevel(0, { instant: true }); FX.clearBlood(); FX.setVisible(false);
    Audio47.setAmbient('psych', 2);
    root.className = 'act act-psych';
    talk.hidden = true; $('#psVoice').textContent = ''; $('#psVoice').classList.remove('show');
    const st = { open: 0, tense: 0, quiet: 0, count: 0, name: 0 };

    // ---------- светлый кабинет ----------
    let m = null, hands = null, lookAt = null;
    try {
      m = await createMini3D(scope, $('#psView'), { bg: 0xf1f3f4, fov: 58, yawLim: 1.05, up: 0.14, down: 0.36, pos: [0, 1.2, 1.35], pitch: -0.04 });
    } catch (e) { console.warn('кабинет без 3D:', e.message); root.classList.add('flat'); }
    if (!scope.alive) return;
    if (m) {
      const { THREE, scene, mesh, box, lam, basic, phong, tex } = m;
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd6dadc, 1.7));
      const sun = new THREE.DirectionalLight(0xdfe9ff, 1.1); sun.position.set(-3, 3, 0); scene.add(sun);
      const wallM = lam({ color: 0xe9ecee }), white = lam({ color: 0xf6f7f7 }), grey = lam({ color: 0xd4d8db });
      const floor = mesh(new THREE.PlaneGeometry(6, 6), lam({ color: 0xd7dadc }), 0, 0, 0); floor.rotation.x = -Math.PI / 2;
      const ceil = mesh(new THREE.PlaneGeometry(6, 6), white, 0, 3, 0); ceil.rotation.x = Math.PI / 2;
      mesh(new THREE.PlaneGeometry(6, 3), wallM, 0, 1.5, -3);
      const wb = mesh(new THREE.PlaneGeometry(6, 3), wallM, 0, 1.5, 3); wb.rotation.y = Math.PI;
      const wl = mesh(new THREE.PlaneGeometry(6, 3), wallM, -3, 1.5, 0); wl.rotation.y = Math.PI / 2;
      const wr = mesh(new THREE.PlaneGeometry(6, 3), wallM, 3, 1.5, 0); wr.rotation.y = -Math.PI / 2;
      box(1.6, 0.03, 0.9, basic({ color: 0xffffff }), 0, 2.985, -0.3);                   // световая панель
      // окно в космос (левая стена)
      const sky = document.createElement('canvas'); sky.width = 1024; sky.height = 640;
      const sg = sky.getContext('2d'); sg.fillStyle = '#02040a'; sg.fillRect(0, 0, 1024, 640);
      for (let i = 0; i < 900; i++) { const b = Math.random(); sg.fillStyle = `rgba(255,255,255,${b * b})`; sg.fillRect(Math.random() * 1024, Math.random() * 640, b > 0.9 ? 2 : 1, b > 0.9 ? 2 : 1); }
      const neb = sg.createRadialGradient(760, 180, 10, 760, 180, 260); neb.addColorStop(0, 'rgba(90,110,200,0.25)'); neb.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = neb; sg.fillRect(0, 0, 1024, 640);
      const pl = sg.createRadialGradient(250, 760, 60, 250, 760, 520); pl.addColorStop(0, '#dfeaf2'); pl.addColorStop(0.55, '#9fb8c9'); pl.addColorStop(0.62, '#5d7a8f'); pl.addColorStop(0.64, 'rgba(40,70,100,0.3)'); pl.addColorStop(1, 'rgba(0,0,0,0)');
      sg.fillStyle = pl; sg.fillRect(0, 0, 1024, 640);
      sg.strokeStyle = 'rgba(80,110,140,0.4)'; sg.lineWidth = 2; for (let i = 0; i < 14; i++) { sg.beginPath(); sg.moveTo(80 + Math.random() * 360, 460 + Math.random() * 180); sg.lineTo(80 + Math.random() * 360, 460 + Math.random() * 180); sg.stroke(); }
      const win = mesh(new THREE.PlaneGeometry(1.9, 1.2), basic({ map: tex(sky), toneMapped: false }), -2.985, 1.65, -0.7); win.rotation.y = Math.PI / 2;
      [[0, 0.64, 2.02, 0.08], [0, -0.64, 2.02, 0.08]].forEach(([y, dy, w, h]) => { const f = box(0.08, h, w, white, -2.96, 1.65 + dy, -0.7); });
      [-1, 1].forEach(s => box(0.08, 1.36, 0.08, white, -2.96, 1.65, -0.7 + s * 0.99));
      box(0.2, 0.04, 2.1, white, -2.9, 1.03, -0.7);                                     // подоконник
      // фикус в углу: кончики листьев желтеют
      const leaf = document.createElement('canvas'); leaf.width = 128; leaf.height = 64;
      const lg = leaf.getContext('2d'); const lgr = lg.createLinearGradient(0, 0, 128, 0);
      lgr.addColorStop(0, '#2f5a2a'); lgr.addColorStop(0.72, '#3d7a34'); lgr.addColorStop(0.9, '#b9a43a'); lgr.addColorStop(1, '#d8c04a');
      lg.fillStyle = lgr; lg.beginPath(); lg.ellipse(64, 32, 62, 26, 0, 0, Math.PI * 2); lg.fill();
      lg.strokeStyle = 'rgba(20,40,15,0.6)'; lg.lineWidth = 2; lg.beginPath(); lg.moveTo(4, 32); lg.lineTo(124, 32); lg.stroke();
      const leafM = lam({ map: tex(leaf), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
      const fx = 2.35, fz = -2.35;
      mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.42, 20), lam({ color: 0xb66a45 }), fx, 0.21, fz);
      mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 20), lam({ color: 0x3a2a1c }), fx, 0.41, fz);
      mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.3, 8), lam({ color: 0x6b5238 }), fx, 1.05, fz);
      const lgeo = new THREE.PlaneGeometry(0.22, 0.11);
      for (let i = 0; i < 46; i++) {
        const a = i * 2.4, hgt = 0.7 + (i / 46) * 1.0, rad = 0.12 + Math.sin(i) * 0.05 + (1 - i / 46) * 0.14;
        const l = mesh(lgeo, leafM, fx + Math.cos(a) * rad, hgt, fz + Math.sin(a) * rad);
        l.rotation.set(-0.4 + Math.random() * 0.5, -a, 0.3 - Math.random() * 0.6);
      }
      // часы на стене — секундная стрелка тикает
      const face = mesh(new THREE.CircleGeometry(0.22, 40), basic({ color: 0xffffff }), 0.9, 2.2, -2.985);
      const rim = mesh(new THREE.TorusGeometry(0.22, 0.015, 8, 40), phong({ color: 0x2a2c2e }), 0.9, 2.2, -2.98);
      for (let i = 0; i < 12; i++) { const t = box(0.008, 0.035, 0.005, basic({ color: 0x222222 }), 0.9 + Math.sin(i / 12 * Math.PI * 2) * 0.18, 2.2 + Math.cos(i / 12 * Math.PI * 2) * 0.18, -2.98); t.rotation.z = -i / 12 * Math.PI * 2; }
      const hand = (len, w, col) => { const g = new THREE.Group(); g.position.set(0.9, 2.2, -2.975); scene.add(g); box(w, len, 0.004, basic({ color: col }), 0, len / 2 - 0.02, 0, g); return g; };
      const hH = hand(0.1, 0.014, 0x222222), hM = hand(0.15, 0.01, 0x222222), hS = hand(0.17, 0.004, 0xb3261e);
      hH.rotation.z = -1.1; hM.rotation.z = -3.9;
      let sec = 0;
      scope.every(1000, () => { sec++; hS.rotation.z = -sec / 60 * Math.PI * 2; Audio47.sfx.tick(0.6); });
      // дверь с табличкой «ВЫХОД»
      const dr = mesh(new THREE.PlaneGeometry(0.95, 2.1), lam({ color: 0xdfe3e6 }), 2.985, 1.05, 1.4); dr.rotation.y = -Math.PI / 2;
      const sign = document.createElement('canvas'); sign.width = 256; sign.height = 64;
      const sgx = sign.getContext('2d'); sgx.fillStyle = '#2f7d4a'; sgx.fillRect(0, 0, 256, 64); sgx.fillStyle = '#fff'; sgx.font = 'bold 34px "Courier New", monospace'; sgx.textAlign = 'center'; sgx.fillText('ВЫХОД', 128, 44);
      const sn = mesh(new THREE.PlaneGeometry(0.42, 0.1), basic({ map: tex(sign) }), 2.98, 2.3, 1.4); sn.rotation.y = -Math.PI / 2;
      box(0.05, 0.05, 0.12, phong({ color: 0x999999 }), 2.95, 1.05, 1.05);
      // белый стол, планшет, ручка, вода
      box(1.5, 0.04, 0.8, white, 0, 0.74, -0.25);
      [[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.1], [0.7, 0.1]].forEach(([x, z]) => box(0.04, 0.72, 0.04, grey, x, 0.36, z));
      const tablet = box(0.26, 0.012, 0.18, phong({ color: 0x1b1d20, emissive: 0x0d1a2a }), -0.15, 0.766, -0.45); tablet.rotation.y = 0.15;
      const pen = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.15, 6), phong({ color: 0x223355 }), 0.14, 0.768, -0.4); pen.rotation.set(0, 0.6, Math.PI / 2);
      mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 16), phong({ color: 0xcfe6f2, transparent: true, opacity: 0.45 }), 0.5, 0.87, -0.5);
      // психолог
      const chairM = lam({ color: 0xeceeef });
      box(0.5, 0.05, 0.48, chairM, 0, 0.46, -1.05); box(0.5, 0.6, 0.05, chairM, 0, 0.78, -1.3);
      const coat = lam({ color: 0xf1f1ef }), skin = lam({ color: 0xd9b8a0 }), hair = lam({ color: 0x3b2a20 });
      mesh(new THREE.CapsuleGeometry(0.17, 0.36, 6, 14), coat, 0, 0.95, -1.05);
      mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 10), skin, 0, 1.28, -1.05);
      const head = mesh(new THREE.SphereGeometry(0.11, 24, 18), skin, 0, 1.42, -1.04); head.scale.set(1, 1.12, 1);
      // волосы: шапочка откинута назад (чёлка выше глаз), сзади — каре до плеч
      const hr = mesh(new THREE.SphereGeometry(0.122, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, 0, 1.45, -1.06); hr.scale.set(1.06, 1.1, 1.06); hr.rotation.x = -0.7;
      const hb = mesh(new THREE.CylinderGeometry(0.128, 0.14, 0.24, 20, 1, true, Math.PI * 0.42, Math.PI * 1.16), hair, 0, 1.33, -1.07);
      hb.material.side = THREE.DoubleSide;
      const dark = lam({ color: 0x2a1c14 });
      [-0.038, 0.038].forEach(x => {
        mesh(new THREE.SphereGeometry(0.012, 10, 8), dark, x, 1.44, -0.94);                                    // глаза
        const brow = box(0.032, 0.005, 0.006, dark, x, 1.468, -0.938); brow.rotation.z = x > 0 ? -0.12 : 0.12;   // брови
      });
      box(0.036, 0.005, 0.006, lam({ color: 0x9a5a50 }), 0, 1.372, -0.94);                                     // рот
      const arm = (x, rz) => { const a = mesh(new THREE.CapsuleGeometry(0.045, 0.3, 4, 10), coat, x, 0.95, -0.8); a.rotation.set(1.1, 0, rz); return a; };
      arm(-0.19, -0.2); arm(0.19, 0.2);
      [-0.12, 0.1].forEach(x => mesh(new THREE.SphereGeometry(0.04, 12, 10), skin, x, 0.79, -0.58));
      // наши кулаки на краю стола
      hands = new THREE.Group(); scene.add(hands);
      [-0.3, 0.3].forEach(x => { const f = mesh(new THREE.SphereGeometry(0.07, 14, 10), skin, x, 0.8, 0.28, hands); f.scale.set(1.1, 0.8, 1.3); });
      // посмотреть в точку (фикус и т.п.)
      lookAt = (x, y, z) => {
        const dx = x - m.camera.position.x, dz = z - m.camera.position.z, dy = y - m.camera.position.y;
        m.look.ty = clamp(Math.atan2(-dx, -dz), -1.05, 1.05);
        m.look.tp = clamp(Math.atan2(dy, Math.hypot(dx, dz)) - m.base.pitch, -0.36, 0.14);
      };
    }

    // ---------- разговор ----------
    const line = async (text, { hold = true, q = false } = {}) => {
      talk.hidden = false;
      lineEl.classList.remove('show'); await scope.wait(380);
      lineEl.textContent = text; lineEl.className = `door-line show${q ? ' q' : ''}`;
      if (text !== '…') Audio47.sfx.mumble(Math.min(2.4, 0.5 + text.length * 0.045), 1.35);
      if (hold) await scope.wait(2300 + text.length * 45);
    };
    const ask = items => new Promise(res => {
      choices.innerHTML = '';
      items.forEach(([label, v], i) => {
        const b = document.createElement('button'); b.className = 'btn'; b.textContent = label; b.style.animationDelay = `${i * 80}ms`;
        b.addEventListener('click', () => { Audio47.sfx.click(); choices.innerHTML = ''; res(v); });
        choices.appendChild(b);
      });
      scope.timeout(() => { const f = $('button', choices); if (f) f.focus({ preventScroll: true }); }, 120);
    });
    async function node(key) {
      const n = PSYCH[key];
      await line(n.q, { q: true, hold: false });
      const r = await ask(n.a);
      if (!scope.alive) return;
      for (const k of ['open', 'tense', 'quiet', 'count', 'name']) st[k] += r[k] || 0;
      if (r.punch) {
        Audio47.sfx.thud(1.2); FX.shake('lg'); if (m) m.setShake(0.05); scope.timeout(() => m && m.setShake(0), 500);
      }
      for (let t of r.say) {
        if (t === '{fists}') t = st.tense ? 'Кулаки у тебя говорят другое. Но я поверю словам — сегодня.' : 'Хорошо. Тогда я буду бояться за двоих. Это моя работа.';
        await line(t);
      }
    }

    scope.ready();
    await scope.wait(2200);
    await line('Слишком светло, да? Здесь всегда так. Говорят, это успокаивает.');
    if (!scope.alive) return;
    for (const k of ['feel', 'name', 'wrists', 'fear', 'see']) { await node(k); if (!scope.alive) return; }
    if (st.open >= 3) {
      await line('Это уже начало.');
      await line('Возьми. Здесь номер. Позвони, если будет трудно.');
      await line('Ты не знаешь, что такое «трудно»? Узнаешь. Это когда хочется позвонить.');
    } else if (st.tense >= 2) {
      await line('На сегодня достаточно. Тебе нужно отдохнуть. Мне тоже.');
    } else {
      await line('На сегодня достаточно.');
    }
    await line(st.name ? 'Мы увидимся на следующей неделе, Кристиан.' : 'Мы увидимся на следующей неделе.');
    await line('Ты можешь идти.', { q: true, hold: false });
    const fin = await ask([['Посмотреть на фикус', 'ficus'], ['Встать и уйти', 'go']]);
    if (!scope.alive) return;
    if (fin === 'ficus') {
      if (lookAt) lookAt(2.35, 1.3, -2.35);
      await line('Полей его, если будешь проходить мимо. Кончики желтеют.');
      await line('Никто не знает, сколько ему нужно воды. Даже я.');
    }
    talk.hidden = true;
    root.classList.add('leaving');
    Audio47.setAmbient(null, 2.5);
    await scope.wait(3200);
    const voice = $('#psVoice');
    voice.textContent = 'К-48. Подъём.'; voice.classList.add('show');
    Audio47.sfx.mumble(1.3, 0.7);
    await scope.wait(3000);
    voice.classList.remove('show');
    await scope.wait(1200);
    voice.textContent = '— Замолчи.'; voice.classList.add('show', 'quiet');
    await scope.wait(2800);
    leaveToBoot();
  },
};
