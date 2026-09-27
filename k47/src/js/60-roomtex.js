/* ==========================================================================
   КОМНАТА — процедурные текстуры (никаких загрузок с сервера)
   ========================================================================== */
const RoomTex = (() => {
  let cache = null;
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  /** бесшовный бетон: зерно, пятна, поры, трещины */
  function concrete(w = 512, h = 512, base = '#5a5a5e') {
    const c = canvas(w, h), g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 45;
      d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n, 0, 255); d[i + 2] = clamp(d[i + 2] + n, 0, 255);
    }
    g.putImageData(img, 0, 0);
    const wrap = (fn, x, y, r) => {
      for (let ox = -w; ox <= w; ox += w) for (let oy = -h; oy <= h; oy += h) {
        const nx = x + ox, ny = y + oy;
        if (nx + r < 0 || nx - r > w || ny + r < 0 || ny - r > h) continue;
        fn(nx, ny);
      }
    };
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * 80, dark = Math.random() > 0.5;
      wrap((nx, ny) => {
        const gr = g.createRadialGradient(nx, ny, 0, nx, ny, r);
        gr.addColorStop(0, dark ? 'rgba(20,20,25,0.25)' : 'rgba(160,160,165,0.15)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(nx, ny, r, 0, Math.PI * 2); g.fill();
      }, x, y, r);
    }
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 0.3 + Math.random() * 1.7, a = 0.12 + Math.random() * 0.3;
      wrap((nx, ny) => { g.fillStyle = `rgba(20,20,25,${a})`; g.beginPath(); g.arc(nx, ny, r, 0, Math.PI * 2); g.fill(); }, x, y, r + 1);
    }
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * w, y = Math.random() * h, segs = 8 + (Math.random() * 8 | 0);
      const st = Array.from({ length: segs }, () => [(Math.random() - 0.5) * 32, (Math.random() - 0.5) * 32]);
      const a = 0.25 + Math.random() * 0.35, lw = 0.4 + Math.random() * 0.9;
      for (let ox = -w; ox <= w; ox += w) for (let oy = -h; oy <= h; oy += h) {
        let px = x + ox, py = y + oy;
        g.strokeStyle = `rgba(15,15,18,${a})`; g.lineWidth = lw; g.beginPath(); g.moveTo(px, py);
        st.forEach(([sx, sy]) => { px += sx; py += sy; g.lineTo(px, py); }); g.stroke();
      }
    }
    return c;
  }

  /** матовая крашеная сталь офисного стола: мелкая шлифовка и потёртости */
  function metal(w = 512, h = 256, base = [118, 122, 126]) {
    const c = canvas(w, h), g = c.getContext('2d');
    g.fillStyle = `rgb(${base.join(',')})`; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      const y = Math.random() * h, x = Math.random() * w, len = rand(20, 160);
      g.strokeStyle = Math.random() < 0.5 ? `rgba(255,255,255,${rand(0.02, 0.06)})` : `rgba(0,0,0,${rand(0.03, 0.08)})`;
      g.lineWidth = rand(0.5, 1.2); g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + rand(-0.6, 0.6)); g.stroke();
    }
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = rand(6, 40);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(40,36,30,${rand(0.08, 0.2)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 18; i++) {
      g.strokeStyle = `rgba(200,200,205,${rand(0.08, 0.2)})`; g.lineWidth = 0.6;
      const x = Math.random() * w, y = Math.random() * h;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-30, 30), y + rand(-8, 8)); g.stroke();
    }
    return c;
  }

  function leather() {
    const c = canvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#3a120a'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.15})`; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 0.3 + Math.random() * 1.2, 0, Math.PI * 2); g.fill(); }
    return c;
  }

  /** сид-генератор для стабильного вида фото */
  const seeded = seed => { let s = (seed * 9301 + 49297) % 233280 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

  /** поляроид на стене: выцветший снимок, лицо стёрто временем, подпись от руки */
  function photo(i) {
    const W = 256, H = 320, c = canvas(W, H), g = c.getContext('2d'), r = seeded(i + 11);
    // бумага: пожелтевшая, в пятнах
    g.fillStyle = '#e6dec9'; g.fillRect(0, 0, W, H);
    const yel = g.createLinearGradient(0, 0, W, H); yel.addColorStop(0, 'rgba(160,130,60,0.10)'); yel.addColorStop(1, 'rgba(120,90,40,0.22)');
    g.fillStyle = yel; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 5; k++) {
      const x = r() * W, y = r() * H, rr = 10 + r() * 36, st = g.createRadialGradient(x, y, 0, x, y, rr);
      st.addColorStop(0, `rgba(120,90,40,${0.06 + r() * 0.1})`); st.addColorStop(1, 'rgba(120,90,40,0)');
      g.fillStyle = st; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    // снимок
    const ix = 18, iy = 18, iw = W - 36, ih = 222;
    g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    const scene = Math.floor(r() * 4);
    const bgs = [['#5d665f', '#2b302d'], ['#9fb2bd', '#59624a'], ['#2a2420', '#0d0b0a'], ['#dfe6ea', '#9aa6ad']];
    const [b0, b1] = bgs[scene];
    const bg = g.createLinearGradient(0, iy, 0, iy + ih); bg.addColorStop(0, b0); bg.addColorStop(1, b1);
    g.fillStyle = bg; g.fillRect(ix, iy, iw, ih);
    if (scene === 1) { g.fillStyle = 'rgba(80,90,50,0.8)'; g.fillRect(ix, iy + ih * 0.62, iw, ih * 0.38); }
    if (scene === 2) { const sp = g.createRadialGradient(ix + iw * 0.5, iy + 30, 0, ix + iw * 0.5, iy + 30, 160); sp.addColorStop(0, 'rgba(255,220,170,0.35)'); sp.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sp; g.fillRect(ix, iy, iw, ih); }
    // голова и плечи
    const cx = ix + iw * (0.42 + r() * 0.16), cyH = iy + ih * (0.36 + r() * 0.06);
    const cloth = ['#3a3d33', '#55504a', '#2d3440', '#c9c6bd', '#4a3a2c'][Math.floor(r() * 5)];
    g.save(); if ('filter' in g) g.filter = 'blur(1.5px)';
    g.fillStyle = cloth;
    g.beginPath(); g.moveTo(cx - 90, iy + ih); g.quadraticCurveTo(cx - 80, cyH + 62, cx - 26, cyH + 52); g.lineTo(cx + 26, cyH + 52); g.quadraticCurveTo(cx + 80, cyH + 62, cx + 90, iy + ih); g.closePath(); g.fill();
    g.fillStyle = '#b89478'; g.fillRect(cx - 13, cyH + 30, 26, 26);
    g.fillStyle = `hsl(${22 + r() * 10},${28 + r() * 14}%,${52 + r() * 12}%)`;
    g.beginPath(); g.ellipse(cx, cyH, 31, 40, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = ['#2a1d14', '#4a3524', '#161210', '#7a6a58'][Math.floor(r() * 4)];
    g.beginPath(); g.ellipse(cx, cyH - 22, 34, 24, 0, Math.PI, 0); g.fill();
    g.restore();
    // лицо стёрто: светлое размытое пятно
    g.save(); if ('filter' in g) g.filter = 'blur(6px)';
    g.fillStyle = `rgba(240,236,226,${0.55 + r() * 0.3})`;
    g.beginPath(); g.ellipse(cx + (r() - 0.5) * 6, cyH + 4, 24, 30, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    // выцветание, тонировка, зерно, виньетка
    g.fillStyle = r() < 0.5 ? 'rgba(160,110,50,0.22)' : 'rgba(40,110,120,0.16)'; g.fillRect(ix, iy, iw, ih);
    g.fillStyle = 'rgba(255,250,235,0.10)'; g.fillRect(ix, iy, iw, ih);
    for (let k = 0; k < 900; k++) { const v = r(); g.fillStyle = `rgba(${v < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.12})`; g.fillRect(ix + r() * iw, iy + r() * ih, 1.4, 1.4); }
    const vg = g.createRadialGradient(ix + iw / 2, iy + ih / 2, 40, ix + iw / 2, iy + ih / 2, 170);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = vg; g.fillRect(ix, iy, iw, ih);
    g.restore();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
    // пометки маркером
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (i % 3 === 1) {
      g.strokeStyle = 'rgba(160,12,22,0.85)'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(ix + 22, iy + 24); g.lineTo(ix + iw - 20, iy + ih - 26); g.moveTo(ix + iw - 24, iy + 20); g.lineTo(ix + 20, iy + ih - 22); g.stroke();
    } else if (i % 7 === 3) {
      g.strokeStyle = 'rgba(170,16,26,0.8)'; g.lineWidth = 4;
      g.beginPath(); g.ellipse(cx, cyH + 2, 48, 56, 0.2, 0.3, Math.PI * 2.15); g.stroke();
    }
    // подпись
    g.save(); g.translate(28, 290); g.rotate((r() - 0.5) * 0.06);
    g.fillStyle = '#1f2a55'; g.font = 'italic 30px Georgia, "Times New Roman", serif';
    g.fillText(`К-${i}`, 0, 0);
    g.font = 'italic 17px Georgia, "Times New Roman", serif'; g.fillStyle = 'rgba(31,42,85,0.75)';
    g.fillText(['цикл 1', 'Купол-7', '2999', 'штрек 4', 'ОП-12', '—'][Math.floor(r() * 6)], 120, -2);
    g.restore();
    // полоска скотча у некоторых
    if (i % 4 === 2) { g.save(); g.translate(W / 2, 8); g.rotate((r() - 0.5) * 0.3); g.fillStyle = 'rgba(235,230,200,0.55)'; g.fillRect(-40, -10, 80, 22); g.restore(); }
    return c;
  }

  /** порядок появления фото (по одной на прочитанную главу) и раскладка без наложений */
  function photoLayout() {
    const r = seeded(4701), cols = 8, rows = 6, cells = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) cells.push([x, y]);
    for (let k = cells.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [cells[k], cells[j]] = [cells[j], cells[k]]; }
    return cells.slice(0, 47).map(([x, y]) => ({ col: x, row: y, rot: (r() - 0.5) * 0.14, jx: (r() - 0.5) * 0.05, jy: (r() - 0.5) * 0.02, scale: 0.94 + r() * 0.08 }));
  }

  /** надпись мелом на стене: часть кода */
  function chalkCode(part, digits) {
    const c = canvas(512, 160), g = c.getContext('2d');
    g.clearRect(0, 0, 512, 160);
    g.translate(18, 18); g.rotate(-0.04);
    g.fillStyle = 'rgba(235,235,225,0.85)'; g.font = 'italic 34px "Courier New", monospace';
    g.fillText(`${part}/3`, 0, 34);
    g.font = 'bold 84px "Courier New", monospace';
    g.fillText(digits.split('').join(' '), 0, 118);
    g.strokeStyle = 'rgba(235,235,225,0.6)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-4, 132); g.bezierCurveTo(120, 124, 300, 140, 440, 128); g.stroke();
    // меловая «пыль»: стираем точки, чтобы штрихи были рваными
    g.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 1600; k++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.8})`; g.fillRect(Math.random() * 480 - 20, Math.random() * 150 - 20, 2, 2); }
    return c;
  }

  /** жёлтая записка на столе: часть кода */
  function stickyNote(part, digits) {
    const c = canvas(256, 256), g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 256, 256); bg.addColorStop(0, '#efe39a'); bg.addColorStop(1, '#d9c86e');
    g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, 0, 256, 26);
    for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(90,70,20,${Math.random() * 0.08})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    g.save(); g.translate(24, 70); g.rotate(-0.05);
    g.fillStyle = '#23305e'; g.font = 'italic 30px Georgia, serif'; g.fillText(`${part}/3`, 0, 0);
    g.font = 'bold 60px "Courier New", monospace'; g.fillText(digits, 0, 78);
    g.font = 'italic 22px Georgia, serif'; g.fillStyle = 'rgba(35,48,94,0.8)'; g.fillText('не забыть. код терминала', 0, 130);
    g.restore();
    return c;
  }

  /** ободок экрана банкомата: тёмный металл, трафаретная маркировка и часть кода */
  function bezel(part, digits) {
    const c = canvas(512, 400), g = c.getContext('2d');
    g.fillStyle = '#16171a'; g.fillRect(0, 0, 512, 400);
    for (let k = 0; k < 900; k++) { g.strokeStyle = `rgba(255,255,255,${Math.random() * 0.03})`; const y = Math.random() * 400; g.beginPath(); g.moveTo(0, y); g.lineTo(512, y + (Math.random() - 0.5) * 2); g.stroke(); }
    g.strokeStyle = 'rgba(255,0,51,0.35)'; g.lineWidth = 2; g.strokeRect(10, 10, 492, 380);
    g.fillStyle = 'rgba(220,220,225,0.55)'; g.font = '14px "Courier New", monospace';
    g.fillText('OBJ-4471 · VITEZSTVI', 24, 34);
    g.fillStyle = 'rgba(235,235,240,0.85)'; g.font = 'bold 22px "Courier New", monospace';
    g.fillText(`${part}/3  ${digits}`, 330, 380);
    return c;
  }

  /** световой короб над экраном */
  function signTex() {
    const c = canvas(512, 96), g = c.getContext('2d');
    g.fillStyle = '#120205'; g.fillRect(0, 0, 512, 96);
    g.shadowColor = '#ff0033'; g.shadowBlur = 18; g.fillStyle = '#ff2d4d'; g.font = 'bold 52px "Courier New", monospace'; g.textAlign = 'center';
    g.fillText('OBJ-4471', 256, 66);
    return c;
  }

  /** фигуры в проёме: охранник в шлеме с красным визором и пистолетом; худой в очках (из кабинета) */
  function figure(kind) {
    const c = canvas(256, 560), g = c.getContext('2d');
    if (kind === 'guard') {
      const body = () => {
        g.beginPath();
        g.ellipse(128, 70, 44, 50, 0, Math.PI, 0); g.lineTo(172, 104); g.quadraticCurveTo(160, 120, 146, 124);
        g.lineTo(150, 132); g.quadraticCurveTo(214, 136, 222, 196); g.lineTo(226, 300); g.lineTo(204, 304); g.lineTo(196, 230);
        g.quadraticCurveTo(176, 196, 146, 214); g.lineTo(152, 226); g.lineTo(104, 226); g.lineTo(110, 214); g.quadraticCurveTo(80, 196, 60, 230);
        g.lineTo(52, 304); g.lineTo(30, 300); g.lineTo(34, 196); g.quadraticCurveTo(42, 136, 106, 132); g.lineTo(110, 124);
        g.quadraticCurveTo(96, 120, 84, 104); g.closePath();
        g.moveTo(66, 300); g.lineTo(190, 300); g.lineTo(186, 548); g.lineTo(146, 548); g.lineTo(130, 380); g.lineTo(124, 380); g.lineTo(110, 548); g.lineTo(70, 548); g.closePath();
        g.moveTo(84, 250); g.lineTo(172, 250); g.lineTo(178, 310); g.lineTo(78, 310); g.closePath();
      };
      g.save(); g.shadowColor = 'rgba(255,0,40,0.55)'; g.shadowBlur = 22; g.fillStyle = '#040404'; body(); g.fill(); g.restore();
      g.fillStyle = '#020202'; body(); g.fill();
      // пистолет в вытянутых руках, дуло на нас
      g.fillStyle = '#0b0b0c'; g.fillRect(114, 196, 28, 24);
      g.fillStyle = '#000'; g.beginPath(); g.arc(128, 204, 6, 0, Math.PI * 2); g.fill();
      // красный визор
      g.save(); g.shadowColor = '#ff0022'; g.shadowBlur = 20; g.fillStyle = '#ff1a2e';
      g.beginPath(); g.moveTo(90, 66); g.quadraticCurveTo(128, 56, 166, 66); g.lineTo(162, 82); g.quadraticCurveTo(128, 74, 94, 82); g.closePath(); g.fill();
      g.restore();
      g.fillStyle = 'rgba(255,200,200,0.8)'; g.fillRect(106, 67, 22, 2);
    } else if (kind === 'warden') {
      // смотритель: плотный, в халате, с планшетом у груди
      const body = () => {
        g.beginPath();
        g.ellipse(128, 76, 34, 40, 0, 0, Math.PI * 2);
        g.moveTo(112, 112); g.lineTo(144, 112); g.lineTo(148, 128);
        g.quadraticCurveTo(204, 136, 208, 196); g.lineTo(214, 350); g.lineTo(196, 352); g.lineTo(186, 230);
        g.lineTo(190, 400); g.lineTo(176, 548); g.lineTo(140, 548); g.lineTo(132, 404); g.lineTo(124, 404);
        g.lineTo(116, 548); g.lineTo(80, 548); g.lineTo(66, 400); g.lineTo(70, 230); g.lineTo(60, 352); g.lineTo(42, 350);
        g.lineTo(48, 196); g.quadraticCurveTo(52, 136, 108, 128); g.closePath();
      };
      g.save(); g.shadowColor = 'rgba(150,200,255,0.45)'; g.shadowBlur = 20; g.fillStyle = '#0c1118'; body(); g.fill(); g.restore();
      g.fillStyle = '#0a0e14'; body(); g.fill();
      g.fillStyle = '#131b26'; g.beginPath(); g.moveTo(92, 132); g.lineTo(164, 132); g.lineTo(178, 410); g.lineTo(78, 410); g.closePath(); g.fill();
      g.fillStyle = '#1d2a3a'; g.fillRect(104, 200, 54, 70);
      g.fillStyle = 'rgba(120,200,255,0.35)'; g.fillRect(108, 204, 46, 58);
    } else {
      const body = () => {
        g.beginPath();
        g.ellipse(128, 78, 30, 38, 0, 0, Math.PI * 2);
        g.moveTo(116, 112); g.lineTo(140, 112); g.lineTo(142, 128);
        g.quadraticCurveTo(186, 134, 190, 184); g.lineTo(198, 330); g.lineTo(184, 334); g.lineTo(174, 214);
        g.lineTo(178, 380); g.lineTo(164, 548); g.lineTo(136, 548); g.lineTo(130, 390); g.lineTo(126, 390);
        g.lineTo(120, 548); g.lineTo(92, 548); g.lineTo(78, 380); g.lineTo(82, 214); g.lineTo(72, 334); g.lineTo(58, 330);
        g.lineTo(66, 184); g.quadraticCurveTo(70, 134, 114, 128); g.closePath();
      };
      g.save(); g.shadowColor = 'rgba(200,210,220,0.35)'; g.shadowBlur = 18; g.fillStyle = '#0a0b0c'; body(); g.fill(); g.restore();
      g.fillStyle = '#060607'; body(); g.fill();
      // халат чуть светлее тела
      g.fillStyle = '#121316';
      g.beginPath(); g.moveTo(96, 132); g.lineTo(160, 132); g.lineTo(172, 396); g.lineTo(84, 396); g.closePath(); g.fill();
      g.strokeStyle = '#1d1f23'; g.lineWidth = 3; g.beginPath(); g.moveTo(118, 134); g.lineTo(128, 250); g.lineTo(138, 134); g.stroke();
      // седые, чуть растрёпанные волосы — по размеру головы
      g.fillStyle = '#8c9093';
      g.beginPath(); g.moveTo(98, 76); g.quadraticCurveTo(96, 50, 112, 44); g.quadraticCurveTo(118, 36, 130, 38);
      g.quadraticCurveTo(142, 36, 150, 44); g.quadraticCurveTo(162, 50, 160, 76); g.quadraticCurveTo(154, 58, 128, 56);
      g.quadraticCurveTo(104, 58, 98, 76); g.closePath(); g.fill();
      g.strokeStyle = '#a3a7aa'; g.lineWidth = 2; g.lineCap = 'round';
      [[104, 54, 98, 47], [118, 42, 114, 35], [138, 40, 143, 34], [152, 50, 159, 46], [158, 66, 164, 64]].forEach(([a, b, x, y]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(x, y); g.stroke(); });
      // очки: отблеск
      g.strokeStyle = 'rgba(150,160,170,0.7)'; g.lineWidth = 2.5; g.strokeRect(106, 76, 18, 11); g.strokeRect(132, 76, 18, 11);
      g.beginPath(); g.moveTo(124, 81); g.lineTo(132, 81); g.stroke();
      g.fillStyle = 'rgba(190,200,210,0.25)'; g.fillRect(107, 77, 16, 9); g.fillRect(133, 77, 16, 9);
    }
    return c;
  }

  /** надпись для мысли в пространстве комнаты */
  function thoughtTex(text) {
    const c = canvas(1024, 128), g = c.getContext('2d');
    g.font = 'bold 50px "Courier New", monospace';
    const w = Math.min(1000, Math.ceil(g.measureText(text).width) + 40);
    c.width = w;
    g.font = 'bold 50px "Courier New", monospace'; g.textBaseline = 'middle';
    g.shadowColor = '#ff0022'; g.shadowBlur = 18; g.fillStyle = '#ff3346';
    g.fillText(text, 20, 64);
    g.shadowBlur = 0; g.fillStyle = 'rgba(255,200,205,0.9)'; g.fillText(text, 20, 64);
    return c;
  }

  /** конус света под лампой: вертикальный градиент прозрачности */
  function coneTex() {
    const c = canvas(64, 256), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, 'rgba(255,236,200,0.9)'); gr.addColorStop(0.5, 'rgba(255,236,200,0.25)'); gr.addColorStop(1, 'rgba(255,236,200,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    return c;
  }

  /** фото на столе: женщина, чьего лица никто не помнит */
  function oldPhoto() {
    const c = canvas(256, 320), g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 160); sky.addColorStop(0, '#d8c8a0'); sky.addColorStop(1, '#b8a878');
    g.fillStyle = sky; g.fillRect(0, 0, 256, 160);
    const meadow = g.createLinearGradient(0, 160, 0, 320); meadow.addColorStop(0, '#8a7a50'); meadow.addColorStop(1, '#4a3e20');
    g.fillStyle = meadow; g.fillRect(0, 160, 256, 160);
    for (let i = 0; i < 400; i++) {
      g.strokeStyle = `rgba(60,50,20,${0.1 + Math.random() * 0.2})`; g.lineWidth = 0.5 + Math.random() * 1.2;
      const x = Math.random() * 256, y = 160 + Math.random() * 160;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 10, y - 5 - Math.random() * 10); g.stroke();
    }
    g.save(); if ('filter' in g) g.filter = 'blur(7px)';
    g.fillStyle = '#4a2e18';
    g.beginPath(); g.ellipse(128, 200, 46, 78, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(128, 132, 28, 0, Math.PI * 2); g.fill();
    g.restore();
    g.fillStyle = '#ffffff'; g.shadowColor = '#ffffff'; g.shadowBlur = 8;
    g.beginPath(); g.arc(119, 130, 3.5, 0, Math.PI * 2); g.arc(137, 130, 3.5, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
    for (let i = 0; i < 3000; i++) { const v = Math.random(); g.fillStyle = `rgba(${v < 0.5 ? 0 : 255},${v < 0.5 ? 0 : 255},${v < 0.5 ? 0 : 255},${Math.random() * 0.1})`; g.fillRect(Math.random() * 256, Math.random() * 320, 1, 1); }
    const vig = g.createRadialGradient(128, 160, 40, 128, 160, 220); vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(50,25,5,0.75)');
    g.fillStyle = vig; g.fillRect(0, 0, 256, 320);
    return c;
  }

  /** износ носителя прямо на экране терминала: царапины и кровь (чем больше прочитано — тем больше) */
  const agingCache = {};
  function agingOverlay(level) {
    const q = Math.round(clamp(level, 0, 1) * 20) / 20;
    if (q <= 0) return null;
    if (agingCache[q]) return agingCache[q];
    const c = canvas(512, 384), g = c.getContext('2d'), r = seeded(4747);
    const n = Math.round(q * 150);
    g.lineCap = 'round';
    for (let i = 0; i < 150; i++) {
      const x = r() * 512, y = r() * 384, len = 20 + r() * 110, a = r() * Math.PI * 2, al = 0.12 + r() * 0.3, w = 0.5 + r() * 1.2;
      if (i >= n) continue;
      g.strokeStyle = `rgba(220,220,225,${al})`; g.lineWidth = w;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (r() - 0.5) * 10, y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
    const spots = Math.round(q * 12);
    for (let i = 0; i < 12; i++) {
      const x = r() * 512, y = r() * 384, rr = 10 + r() * 34, drip = r() * 60;
      if (i >= spots) continue;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, 'rgba(120,0,6,0.75)'); gr.addColorStop(0.7, 'rgba(90,0,4,0.45)'); gr.addColorStop(1, 'rgba(60,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(100,0,5,0.6)'; g.lineWidth = 2 + r() * 2;
      g.beginPath(); g.moveTo(x + (r() - 0.5) * rr * 0.6, y); g.lineTo(x + (r() - 0.5) * 4, y + rr * 0.4 + drip); g.stroke();
    }
    return (agingCache[q] = c);
  }

  /** экран терминала, ~10 раз в секунду. st: { codeOk, cracked, cracks, aging } */
  function drawScreen(c, t, st = {}) {
    const g = c.getContext('2d'), W = c.width, H = c.height;
    g.fillStyle = '#0a0002'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) { g.fillStyle = 'rgba(255,0,51,0.06)'; g.fillRect(0, y, W, 2); }
    g.strokeStyle = 'rgba(255,0,51,0.14)'; g.lineWidth = 1;
    for (let x = 0; x <= W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y <= H; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const blink = Math.floor(t * 3) % 2 === 0;
    g.fillStyle = '#ff3355'; g.font = 'bold 22px "Courier New", monospace';
    g.fillText('> OBJ-4471 / ТЕРМИНАЛ', 22, 40);
    g.font = '16px "Courier New", monospace'; g.fillStyle = '#ff5577';
    if (!st.codeOk) {
      g.fillText('> ВВЕДИТЕ КОД ДОСТУПА', 22, 84);
      g.font = 'bold 30px "Courier New", monospace'; g.textAlign = 'center';
      g.fillText('____  ____  ____', W / 2, 190);
      g.font = '14px "Courier New", monospace'; g.fillStyle = 'rgba(255,85,119,0.75)';
      g.fillText('3 × 4 ЦИФРЫ', W / 2, 226);
      g.textAlign = 'left';
      if (blink) { g.fillStyle = '#ff3355'; g.fillRect(W / 2 - 138, 162, 3, 32); }
    } else {
      g.fillText('> СИСТЕМА ГОТОВА', 22, 80);
      g.fillText('> АРХИВ ДОСТУПЕН', 22, 108);
      g.fillText(`> ${BOOK.length} ГЛАВ`, 22, 136);
      const cx = W * 0.72, cy = H * 0.62, r = 64;
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,0,51,0.25)'; g.lineWidth = 3; g.stroke();
      const a0 = (t * 1.5) % (Math.PI * 2);
      g.beginPath(); g.arc(cx, cy, r, a0, a0 + Math.PI * 0.7); g.strokeStyle = '#ff0033'; g.lineWidth = 5; g.stroke();
      g.fillStyle = '#ff3355'; g.font = 'bold 14px "Courier New", monospace'; g.textAlign = 'center'; g.fillText('SCAN', cx, cy + 4); g.textAlign = 'left';
    }
    if (blink) { g.fillStyle = '#ff3355'; g.fillRect(22, H - 40, 12, 18); }
    g.fillStyle = 'rgba(255,0,51,0.15)'; g.fillRect(22, H - 20, W - 44, 4);
    g.fillStyle = '#ff0033'; g.fillRect(22, H - 20, (W - 44) * (Math.sin(t * 0.7) * 0.5 + 0.5), 4);
    const ov = st.aging ? agingOverlay(st.aging) : null;
    if (ov) g.drawImage(ov, 0, 0, W, H);
    if (st.cracked) {
      for (let k = 0; k < 4; k++) { if (Math.random() < 0.5) continue; g.fillStyle = `rgba(255,0,40,${0.1 + Math.random() * 0.25})`; g.fillRect(0, Math.random() * H, W, 2 + Math.random() * 10); }
      g.fillStyle = blink ? '#ff2244' : '#aa0018'; g.font = 'bold 18px "Courier New", monospace';
      g.fillText('ОШИБКА 0x47 // НОСИТЕЛЬ ПОВРЕЖДЁН', 22, H - 58);
      if (st.cracks) Cracks.draw(g, st.cracks, W, H, { alpha: 0.95, scale: 0.9 });
    }
  }

  function glow(color = '255,255,255') {
    const c = canvas(128, 128), g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${color},1)`); gr.addColorStop(0.3, `rgba(${color},0.45)`); gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return c;
  }

  return {
    /** общие (не зависящие от цикла) текстуры — создаются один раз */
    get() {
      if (!cache) {
        cache = {
          concrete: concrete(), floor: concrete(512, 512, '#2e2e31'),
          metal: metal(), metalDark: metal(256, 256, [70, 73, 77]), atm: metal(256, 256, [38, 40, 44]),
          leather: leather(), oldPhoto: oldPhoto(),
          photos: Array.from({ length: 47 }, (_, i) => photo(i)), layout: photoLayout(),
          screen: canvas(512, 384), glow: glow(), cone: coneTex(), sign: signTex(),
          guard: figure('guard'), thin: figure('thin'), warden: figure('warden'),
        };
        drawScreen(cache.screen, 0);
      }
      return cache;
    },
    /** части кода текущего цикла: 1/3 — записка на столе, 2/3 — мел на стене, 3/3 — ободок экрана */
    codeParts(code) { return [code.slice(0, 4), code.slice(4, 8), code.slice(8, 12)]; },
    stickyNote, chalkCode, bezel, thoughtTex, drawScreen,
  };
})();
