/* ==========================================================================
   Глава 35 · «Лёд» — ВЫБРАТЬ ШТРЕК ПО ТИПУ
   Трёхмерные развилки во льду (Three.js; без WebGL — плоская схема).
   Основной геологический — «дорога». Технический — только если нет другого.
   Логистический без приказа — дезертирство. Шахта — триста метров вниз.
   Средняя карстовая — там почти всегда кто-то живёт. Газовая — искра.
   ========================================================================== */
defineFrag(34, {
  id: 'ice', name: 'Живой организм',
  text: 'Штреки. Это не коридоры. Это — живой организм. Лёд не статичен, он дышит, он движется, он закрывает проходы. И запомните: ошибиться с типом — значит ошибиться с выбором пути. А ошибиться с выбором пути — значит умереть.',
  how: 'Семь развилок. У каждого прохода Выбро показывает размеры: основной геологический — 2–4 м в ширину и до 2,5 в высоту, технический — метр и ниже, логистический — от 4 до 16. Сканер (S) расскажет больше — тепло, газ, пустоту, — но тратит воздух. Выбирай проход: 1 / 2 / 3 или тап.',
  keys: '1 / 2 / 3 — ПРОХОД · S — СКАНЕР · ЗАЖАТЬ И ВЕСТИ / ← → — ОСМОТРЕТЬСЯ',
  note: 'Основной — дорога. Технический — только если нет другого. Логистический без приказа — дезертир. Газ — отключить всё и бегом. Я запомнил типы. Лёд всё равно закрывал проходы.',
  mem: 'ЛЁД ДЫШИТ', start: gameIce,
});

async function gameIce(ctx) {
  const { scope, body } = ctx;
  const T = {
    geo:   { r: 'Ш 3 м · В 2,4 м · РАСПОРКИ', scan: 'ЧИСТО', w: 3, h: 2.4 },
    tech:  { r: 'Ш 1,2 м · В 0,9 м · КАБЕЛИ', scan: 'ТЕСНО · НЕ РАЗВЕРНУТЬСЯ', w: 1.2, h: 0.9 },
    logi:  { r: 'Ш 12 м · В 5 м · КОЛЕИ ПЛАТФОРМ', scan: 'ВИБРАЦИЯ · ОХРАНА', w: 7, h: 4.6 },
    shaft: { r: 'УКЛОН 75° · ВНИЗ', scan: 'ПУСТОТА · 300 М', w: 2.6, h: 0 },
    kmid:  { r: 'ПОЛОСТЬ ~15 М · НЕПРАВИЛЬНАЯ', scan: 'ТЕПЛО · ДВИЖЕНИЕ', w: 3.6, h: 3.2, cave: true },
    kgas:  { r: 'ПОЛОСТЬ ~15 М · НЕПРАВИЛЬНАЯ', scan: 'МЕТАН', w: 3.6, h: 3.2, cave: true },
    kbig:  { r: 'ПОЛОСТЬ > 100 М · ЗАЛ', scan: 'АММИАК · ПЯТЬ МИНУТ', w: 5.5, h: 4.2, cave: true },
  };
  const JUNCTIONS = [['geo', 'tech', 'logi'], ['geo', 'kmid'], ['logi', 'geo', 'shaft'], ['tech', 'kgas', 'shaft'], ['geo', 'kbig', 'kmid'], ['kgas', 'geo'], ['kbig', 'shaft', 'logi']];
  let j = 0, air = 1, hp = 3, strikes = 0, scanned = false, busy = true, t = 0, opts = [];
  const view = ctx.el('div', 'ic-view');
  const airM = ctx.meter('ВОЗДУХ', { cls: 'ice', left: 14, top: 14 });
  const hpM = ctx.meter('ТЕЛО', { cls: 'ok', left: 14, top: 44 });
  const ctl = ctx.el('div', 'ctl ic-ctl');
  const scanB = ctx.el('button', 'btn', ctl, '<b>S</b> СКАНЕР');
  const choiceBox = ctx.el('div', 'ic-opts', ctl);
  const tags = ctx.el('div', 'ic-tags', body);
  ctx.hint('ГРУЗИТСЯ ЛЁД…');
  const wind = scope.own(A.loopNoise({ type: 'bandpass', freq: 420, q: 0.6, vol: 0 }));
  wind.vol(0.04, 1.5);

  // ---------- сцена: 3D или плоская схема ----------
  let S = null, R3 = null, flat = null;
  try {
    S = await createMini3D(scope, view, { bg: 0x02060a, fov: 70, yawLim: 0.4, up: 0.12, down: 0.2, pos: [0, 1.5, 4.5] });
    R3 = build3D(S);
  } catch (err) {
    if (!scope.alive) return { ok: 'fail' };
    flat = ctx.canvas(view);
  }
  if (!scope.alive) return { ok: 'fail' };
  ctx.hint('ВЫБРО ПОКАЗЫВАЕТ РАЗМЕРЫ · СКАНЕР — ТЕПЛО, ГАЗ, ПУСТОТА');

  function build3D(S) {
    const { THREE, scene, camera } = S;
    scene.fog = new THREE.FogExp2(0x02060a, 0.075);
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'), Rn = mulberry(35);
    x.fillStyle = '#6f8fa4'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${Rn() < 0.5 ? '220,240,255' : '20,40,60'},${Rn() * 0.12})`; x.fillRect(Rn() * 256, Rn() * 256, 2 + Rn() * 20, 1 + Rn() * 3); }
    x.strokeStyle = 'rgba(230,248,255,.35)';
    for (let i = 0; i < 26; i++) { x.beginPath(); let px = Rn() * 256, py = Rn() * 256; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (Rn() - 0.5) * 50; py += (Rn() - 0.5) * 50; x.lineTo(px, py); } x.stroke(); }
    const tIce = S.tex(c); tIce.wrapS = tIce.wrapT = THREE.RepeatWrapping; tIce.repeat.set(4, 2);
    const mIce = S.lam({ map: tIce, side: THREE.BackSide, color: 0x8fb0c4 });
    S.box(18, 6, 12, mIce, 0, 3, -1.5);
    scene.add(new THREE.AmbientLight(0x1a3a4a, 1.3));
    const lamp = new THREE.PointLight(0xbfe6ff, 7, 14, 1.3); lamp.position.set(0, 4.6, 0); scene.add(lamp);
    const head = new THREE.SpotLight(0xe8f6ff, 18, 16, 0.55, 0.6, 1.2); camera.add(head); head.position.set(0, 0, 0); head.target.position.set(0, -0.2, -1); camera.add(head.target); scene.add(camera);
    const black = S.basic({ color: 0x000000 });
    const mStrut = S.lam({ color: 0x55585e });
    const mGas = S.basic({ color: 0x88ff66, transparent: true, opacity: 0.08, depthWrite: false });
    const mOrg = S.basic({ color: 0x33ffaa, transparent: true, opacity: 0.5 });
    const mRail = S.lam({ color: 0x2a2c30 });
    const mLamp = S.basic({ color: 0xfff1c8 });
    const group = new THREE.Group(); scene.add(group);
    const geoCache = {};
    const G = (k, fn) => geoCache[k] || (geoCache[k] = S.keep(fn()));
    return {
      lamp,
      layout(types) {
        while (group.children.length) group.remove(group.children[0]);
        const n = types.length, span = n === 2 ? 7 : 11;
        return types.map((ty, i) => {
          const d = T[ty], cx = n === 1 ? 0 : -span / 2 + (span / (n - 1)) * i, z = -7.45;
          if (ty === 'shaft') {
            const hole = new THREE.Mesh(G('shaft', () => new THREE.CircleGeometry(1.3, 24)), black); hole.rotation.x = -Math.PI / 2; hole.position.set(cx, 0.02, -5.8); group.add(hole);
            for (let k = 0; k < 6; k++) { const p = new THREE.Mesh(G('post', () => new THREE.BoxGeometry(0.06, 0.9, 0.06)), mRail); const a = k / 6 * Math.PI * 2; p.position.set(cx + Math.cos(a) * 1.5, 0.45, -5.8 + Math.sin(a) * 1.5); group.add(p); }
            return { x: cx, y: 0.3, z: -5.8 };
          }
          const geo = d.cave
            ? G(`cave${ty}`, () => { const s = new THREE.Shape(), R = mulberry(ty.length * 13); for (let k = 0; k <= 18; k++) { const a = k / 18 * Math.PI * 2, r = 1 + (R() - 0.5) * 0.35; const px = Math.cos(a) * d.w / 2 * r, py = Math.sin(a) * d.h / 2 * r + d.h / 2; k ? s.lineTo(px, py) : s.moveTo(px, py); } return new THREE.ShapeGeometry(s); })
            : G(`rect${ty}`, () => new THREE.PlaneGeometry(d.w, d.h).translate(0, d.h / 2, 0));
          const m = new THREE.Mesh(geo, black); m.position.set(cx, ty === 'kbig' ? 0.2 : 0, z); group.add(m);
          if (ty === 'geo') { [-1, 1].forEach(s => { const st = new THREE.Mesh(G('strut', () => new THREE.BoxGeometry(0.12, 2.6, 0.12)), mStrut); st.position.set(cx + s * (d.w / 2 + 0.06), 1.3, z + 0.05); group.add(st); }); const bar = new THREE.Mesh(G('bar', () => new THREE.BoxGeometry(3.3, 0.12, 0.12)), mStrut); bar.position.set(cx, 2.46, z + 0.05); group.add(bar); const lp = new THREE.Mesh(G('lp', () => new THREE.BoxGeometry(0.4, 0.08, 0.08)), mLamp); lp.position.set(cx, 2.3, z + 0.1); group.add(lp); }
          if (ty === 'tech') { for (let k = 0; k < 3; k++) { const cb = new THREE.Mesh(G('cable', () => new THREE.CylinderGeometry(0.03, 0.03, 3, 6)), mRail); cb.rotation.z = Math.PI / 2; cb.position.set(cx, 0.75 + k * 0.07, z + 0.06); group.add(cb); } }
          if (ty === 'logi') { [-1.4, 1.4].forEach(o => { const tr = new THREE.Mesh(G('track', () => new THREE.BoxGeometry(0.3, 0.02, 7)), mRail); tr.position.set(cx + o, 0.01, z + 3.4); group.add(tr); }); }
          if (ty === 'kgas') { const fog = new THREE.Mesh(G('gas', () => new THREE.SphereGeometry(2.2, 12, 8)), mGas); fog.position.set(cx, 1.6, z + 0.6); group.add(fog); }
          if (ty === 'kmid' || ty === 'kgas') { const R = mulberry(i + j * 7); for (let k = 0; k < 14; k++) { const sp = new THREE.Mesh(G('spot', () => new THREE.SphereGeometry(0.05, 6, 4)), ty === 'kmid' ? mOrg : mGas); sp.position.set(cx + (R() - 0.5) * d.w * 1.3, 0.2 + R() * d.h * 1.1, z + 0.08); group.add(sp); } }
          return { x: cx, y: d.h * 0.55, z };
        });
      },
      camera,
    };
  }

  function drawFlat() {
    const { g, W, H } = flat;
    g.fillStyle = '#050a0e'; g.fillRect(0, 0, W, H);
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a3a4a'); bg.addColorStop(1, '#0a1820');
    g.fillStyle = bg; g.fillRect(W * 0.05, H * 0.1, W * 0.9, H * 0.72);
    const n = opts.length;
    opts.forEach((o, i) => {
      const d = T[o.ty], cx = W * (n === 2 ? 0.32 + i * 0.36 : 0.2 + i * 0.3), base = H * 0.82, s = H * 0.1;
      g.fillStyle = '#000';
      if (o.ty === 'shaft') { g.beginPath(); g.ellipse(cx, base + H * 0.06, s * 1.4, s * 0.4, 0, 0, Math.PI * 2); g.fill(); }
      else if (d.cave) { g.beginPath(); g.ellipse(cx, base - d.h * s / 2, d.w * s / 2, d.h * s / 2, 0, 0, Math.PI * 2); g.fill(); }
      else g.fillRect(cx - d.w * s / 2, base - d.h * s, d.w * s, d.h * s);
      if (o.ty === 'kgas') { g.fillStyle = 'rgba(136,255,102,.08)'; g.beginPath(); g.arc(cx, base - s * 1.5, s * 2, 0, Math.PI * 2); g.fill(); }
      o.sx = cx; o.sy = base - Math.max(0.6, d.h) * s * 0.6;
    });
    Art.vignette(g, W, H, 0.7);
  }

  return new Promise(resolve => {
    function show() {
      scanned = false; busy = false;
      opts = shuffle(JUNCTIONS[j]).map(ty => ({ ty }));
      const pts = R3 ? R3.layout(opts.map(o => o.ty)) : null;
      opts.forEach((o, i) => { o.p = pts ? pts[i] : null; });
      choiceBox.innerHTML = ''; tags.innerHTML = '';
      opts.forEach((o, i) => {
        const b = ctx.el('button', 'btn ic-opt', choiceBox, `<b>${i + 1}</b> ${esc(T[o.ty].r)}`);
        b.addEventListener('click', () => go(i));
        o.tag = ctx.el('div', 'ic-tag', tags, `<b>${i + 1}</b><span>${esc(T[o.ty].r)}</span><i></i>`);
      });
      if (S) { S.camera.position.set(0, 1.5, 4.5); S.base.yaw = 0; S.look.ty = 0; S.look.enabled = true; }
      ctx.stat(`РАЗВИЛКА ${j + 1}/${JUNCTIONS.length} · ЗАМЕЧАНИЙ ${strikes}`);
    }
    function scan() {
      if (busy || scanned) return;
      scanned = true; air -= 0.04; A.sfx.beep(900, 0.12, 0.04); A.sfx.beep(1200, 0.08, 0.03);
      opts.forEach(o => { const i = $('i', o.tag); i.textContent = T[o.ty].scan; i.className = /МЕТАН|ТЕПЛО|ПУСТОТА|АММИАК/.test(T[o.ty].scan) ? 'warn' : ''; });
    }
    async function go(i) {
      if (busy) return;
      busy = true; const ty = opts[i].ty; A.sfx.step(0.3); A.sfx.step(0.3, 0, 0.35);
      if (S) {
        S.look.enabled = false; S.look.ty = 0;
        const p = opts[i].p, from = S.camera.position.clone(), yaw = Math.atan2(-(p.x - from.x), -(p.z - from.z));
        let k = 0;
        await new Promise(res => { const stop = scope.loop(dt => { k = Math.min(1, k + dt / 1.4); const e = easeOut(k); S.base.yaw = yaw * Math.min(1, k * 3); S.camera.position.set(lerp(from.x, p.x, e), 1.5, lerp(from.z, p.z + (ty === 'shaft' ? 1.2 : 0.6), e)); if (k >= 1) { res(); return false; } }); scope.onDispose(stop); });
      } else await scope.wait(500);
      if (!scope.alive) return;
      tags.innerHTML = '';
      const hasGeo = JUNCTIONS[j].includes('geo');
      let msg = '', cls = '', dead = '';
      air -= 0.06;
      if (ty === 'geo') msg = 'Основной штрек. Дорога. Лампа через каждые сто метров.';
      else if (ty === 'tech') { if (hasGeo) { hp--; air -= 0.12; msg = 'Технический. Не развернуться. Застрял — выбирался задом, обдирая броню.'; cls = 'red'; A.sfx.crunch(0.25); } else { air -= 0.08; msg = 'Технический — потому что другого пути нет. Ползком.'; cls = 'amb'; } }
      else if (ty === 'logi') { strikes++; msg = strikes > 1 ? 'Второй раз в логистическом без приказа. Дезертир.' : 'Логистический штрек без приказа. Охрана записала номер.'; cls = 'red'; A.sfx.alarm(0.04); if (strikes > 1) dead = 'Дезертирство — смертельно.'; }
      else if (ty === 'shaft') { dead = 'Один неверный шаг — и вы летите вниз триста метров.'; A.sfx.whoosh(0.3); }
      else if (ty === 'kgas') { dead = 'Запах газа. Один искровой разряд.'; FX.flash('#ffb347', 500, 0.8); A.sfx.thud(0.8); }
      else if (ty === 'kmid') { hp--; msg = 'Средняя карстовая. Там почти всегда кто-то живёт.'; cls = 'red'; A.sfx.slash(0.3); FX.shake('lg'); }
      else if (ty === 'kbig') { air -= 0.2; msg = 'Подлёдный зал. Не дышать, не шуметь, не светить. Пять минут на выход.'; cls = 'amb'; A.sfx.breath(1.2, 0.08); }
      airM.set(air); hpM.set(hp / 3);
      if (!dead && hp <= 0) dead = 'Лёд закрыл проход за спиной.';
      if (!dead && air <= 0) dead = 'Баллон пуст. Воздух штрека — водород, гелий, этилен. Яд.';
      if (dead) { FX.shake('lg'); await ctx.line(dead, { pos: 'top', cls: 'red', ms: 2800 }); resolve({ ok: 'fail', detail: `РАЗВИЛКА ${j + 1} ИЗ ${JUNCTIONS.length}` }); return; }
      await ctx.line(msg, { pos: 'top', cls, ms: 2000 });
      j++;
      if (j >= JUNCTIONS.length) {
        await ctx.line('Впереди — свет распорок. Основной штрек. Дорога домой.', { pos: 'top', cls: 'amb', ms: 2400 });
        resolve({ ok: 'ok', detail: `ВОЗДУХ ${Math.round(air * 100)}% · ЗАМЕЧАНИЙ ${strikes}` });
        return;
      }
      show();
    }
    scope.on(scanB, 'click', scan);
    ctx.keys(e => { if (e.code === 'KeyS') { e.preventDefault(); scan(); } const n = parseInt(e.key, 10); if (n >= 1 && n <= opts.length) { e.preventDefault(); go(n - 1); } });
    if (flat) scope.on(flat.cv, 'pointerdown', e => { const r = flat.cv.getBoundingClientRect(), x = e.clientX - r.left; let bi = -1, bd = 1e9; opts.forEach((o, i) => { const d = Math.abs((o.sx || 0) - x); if (d < bd) { bd = d; bi = i; } }); if (bi >= 0 && bd < flat.W * 0.15) go(bi); });
    airM.set(air); hpM.set(1);
    show();
    scope.loop(dt => {
      t += dt;
      air -= dt * 0.0025; airM.set(air);
      if (R3) R3.lamp.intensity = 7 * (0.85 + 0.15 * Math.sin(t * 13) * (Math.random() < 0.04 ? 3 : 0.3));
      if (flat) drawFlat();
      if (!busy) opts.forEach(o => {
        let x, y, vis = true;
        if (S && o.p) { const pr = S.project(o.p.x, o.p.y, o.p.z); x = pr.x; y = pr.y; vis = pr.visible; } else { x = o.sx; y = o.sy; }
        if (o.tag && x !== undefined) { const hw = o.tag.offsetWidth / 2 + 4; x = clamp(x, hw, Math.max(hw, view.clientWidth - hw)); y = clamp(y, o.tag.offsetHeight + 60, view.clientHeight - 150); o.tag.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`; o.tag.style.opacity = vis ? 1 : 0; }
      });
      if (!busy && air <= 0) { busy = true; ctx.line('Баллон пуст.', { pos: 'top', cls: 'red', ms: 2000 }).then(() => resolve({ ok: 'fail', detail: `РАЗВИЛКА ${j + 1} ИЗ ${JUNCTIONS.length}` })); }
    });
  });
}
