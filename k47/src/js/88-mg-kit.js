/* ==========================================================================
   МИНИ-ИГРЫ · НАБОР
   Звук поверх общей шины Audio47, холсты с DPR, глитч-текст, прицел,
   процедурная графика по референсам: броня с синими/красными индикаторами,
   рейдер с когтями, чёрный профиль К-47, клон со шрамами, красный череп,
   силуэты. Всё рисуется в рантайме — ни одной загрузки.
   ========================================================================== */
const MONO = "'Share Tech Mono', 'Courier New', monospace";
const PIXEL = "'Press Start 2P', 'Courier New', monospace";
const REDUCED = REDUCED_MOTION;
const irand = (a, b) => Math.floor(rand(a, b + 1));
const easeOut = easeOutCubic;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** детерминированный генератор для стабильного «шума» */
const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ---------- ЗВУК мини-игр: синтез поверх общего контекста (пауза и «звук выкл» — общие) ---------- */
const A = (() => {
  let ac = null, master = null, nbuf = null;
  function ensure() {
    const r = Audio47.raw();
    if (!r) return null;
    if (ac !== r.ctx) {
      ac = r.ctx;
      master = ac.createGain(); master.gain.value = 0.85; master.connect(r.out);
      nbuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = nbuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return ac;
  }
  const live = () => !!ensure() && Audio47.isEnabled();
  const T = (at = 0) => ac.currentTime + Math.max(0, at);
  function dest(pan) {
    if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); p.connect(master); return p; }
    return master;
  }
  function envelope(g, t0, vol, attack, dur) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(attack + 0.01, dur));
  }
  function tone({ f = 440, f2 = 0, type = 'sine', dur = 0.2, vol = 0.2, at = 0, attack = 0.005, pan = 0, filter = null } = {}) {
    if (!live()) return;
    const t0 = T(at), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + dur);
    envelope(g, t0, vol, attack, dur);
    if (filter) {
      const fl = ac.createBiquadFilter(); fl.type = filter.type || 'bandpass'; fl.frequency.value = filter.freq || 1000; fl.Q.value = filter.q || 1;
      o.connect(fl); fl.connect(g);
    } else o.connect(g);
    g.connect(dest(pan)); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise({ dur = 0.2, vol = 0.2, at = 0, type = 'bandpass', freq = 1000, f2 = 0, q = 1, attack = 0.005, pan = 0 } = {}) {
    if (!live()) return;
    const t0 = T(at), s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = nbuf; s.loop = true;
    fl.type = type; fl.frequency.setValueAtTime(freq, t0); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    envelope(g, t0, vol, attack, dur);
    s.connect(fl); fl.connect(g); g.connect(dest(pan));
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }
  const dummy = () => ({ vol() {}, freq() {}, q() {}, stop() {} });
  function loopNoise({ type = 'bandpass', freq = 800, q = 1, vol = 0 } = {}) {
    if (!ensure()) return dummy();
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = nbuf; s.loop = true; fl.type = type; fl.frequency.value = freq; fl.Q.value = q; g.gain.value = vol;
    s.connect(fl); fl.connect(g); g.connect(master); s.start(0, Math.random() * 1.5);
    return {
      vol(v, tc = 0.05) { g.gain.setTargetAtTime(Math.max(0, v), ac.currentTime, tc); },
      freq(f, tc = 0.05) { fl.frequency.setTargetAtTime(Math.max(20, f), ac.currentTime, tc); },
      q(v) { fl.Q.value = v; },
      stop() { try { g.gain.setTargetAtTime(0, ac.currentTime, 0.06); s.stop(ac.currentTime + 0.5); } catch { /* уже остановлен */ } },
    };
  }
  function loopOsc({ type = 'sine', freq = 110, vol = 0, lp = 0 } = {}) {
    if (!ensure()) return dummy();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    if (lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(master); o.start();
    return {
      vol(v, tc = 0.05) { g.gain.setTargetAtTime(Math.max(0, v), ac.currentTime, tc); },
      freq(f, tc = 0.05) { o.frequency.setTargetAtTime(Math.max(1, f), ac.currentTime, tc); },
      q() {},
      stop() { try { g.gain.setTargetAtTime(0, ac.currentTime, 0.06); o.stop(ac.currentTime + 0.5); } catch { /* уже остановлен */ } },
    };
  }
  function syllable(at, f, vol, pan = 0) {
    tone({ f, f2: f * rand(0.8, 1.15), type: 'sawtooth', dur: rand(0.07, 0.13), vol, at, attack: 0.012, pan, filter: { type: 'bandpass', freq: rand(450, 1500), q: 5 } });
  }
  const sfx = {
    click() { tone({ f: 1900, type: 'square', dur: 0.035, vol: 0.035 }); },
    beep(f = 1200, dur = 0.08, vol = 0.05) { tone({ f, type: 'square', dur, vol }); },
    buzz() { tone({ f: 110, type: 'square', dur: 0.26, vol: 0.07 }); tone({ f: 116, type: 'square', dur: 0.26, vol: 0.05 }); },
    chime(f = 880, vol = 0.08) { tone({ f, dur: 1.3, vol, attack: 0.01 }); tone({ f: f * 2.01, dur: 0.8, vol: vol * 0.35 }); tone({ f: f * 1.5, dur: 1, vol: vol * 0.25, at: 0.08 }); },
    heartbeat(vol = 0.5, at = 0) {
      tone({ f: 64, f2: 40, dur: 0.17, vol, at, attack: 0.006 });
      noise({ type: 'lowpass', freq: 140, dur: 0.1, vol: vol * 0.35, at });
      tone({ f: 56, f2: 36, dur: 0.2, vol: vol * 0.72, at: at + 0.21, attack: 0.006 });
    },
    step(vol = 0.3, pan = 0, at = 0) {
      noise({ type: 'lowpass', freq: 520, f2: 110, dur: 0.2, vol, at, pan });
      tone({ f: 78, f2: 44, dur: 0.13, vol: vol * 0.6, at, pan });
    },
    creak(vol = 0.22, pan = 0) {
      if (!live()) return;
      const t0 = T(), o = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(rand(150, 210), t0); o.frequency.linearRampToValueAtTime(rand(95, 130), t0 + 0.55);
      lfo.frequency.value = rand(18, 32); lg.gain.value = 22; lfo.connect(lg); lg.connect(o.frequency);
      fl.type = 'bandpass'; fl.frequency.value = rand(700, 1100); fl.Q.value = 7;
      envelope(g, t0, vol, 0.03, 0.6);
      o.connect(fl); fl.connect(g); g.connect(dest(pan));
      o.start(t0); lfo.start(t0); o.stop(t0 + 0.65); lfo.stop(t0 + 0.65);
    },
    thud(vol = 0.45) { tone({ f: 95, f2: 34, dur: 0.38, vol }); noise({ type: 'lowpass', freq: 320, dur: 0.22, vol: vol * 0.6 }); },
    shot(vol = 0.7) {
      noise({ type: 'bandpass', freq: 1800, f2: 180, q: 0.7, dur: 0.42, vol, attack: 0.002 });
      noise({ type: 'lowpass', freq: 500, dur: 0.7, vol: vol * 0.6, attack: 0.002 });
      tone({ f: 120, f2: 38, dur: 0.32, vol: vol * 0.8, attack: 0.002 });
    },
    pop(vol = 0.32) { noise({ type: 'bandpass', freq: 2600, q: 0.8, dur: 0.08, vol, attack: 0.001 }); tone({ f: 420, f2: 110, dur: 0.07, vol: vol * 0.6, attack: 0.001 }); },
    tear() { for (let i = 0; i < 16; i++) noise({ type: 'bandpass', freq: rand(1800, 4200), q: 2.5, dur: rand(0.04, 0.08), vol: rand(0.08, 0.16), at: i * 0.055, attack: 0.002 }); },
    stamp() { tone({ f: 120, f2: 40, dur: 0.22, vol: 0.5, attack: 0.002 }); noise({ type: 'lowpass', freq: 900, dur: 0.1, vol: 0.35, attack: 0.001 }); },
    glitch() { for (let i = 0; i < 7; i++) tone({ f: rand(180, 2400), type: 'square', dur: 0.03, vol: 0.045, at: i * 0.034, attack: 0.001 }); },
    whisper(dur = 1.4, vol = 0.1, pan = 0) { noise({ type: 'bandpass', freq: rand(2800, 4200), q: 3, dur, vol, attack: dur * 0.35, pan }); },
    mumble(dur = 1, pitch = 1, vol = 0.1, pan = 0) {
      if (!live()) return;
      let t = 0; while (t < dur) { syllable(t, rand(105, 175) * pitch, vol * rand(0.6, 1), pan); t += rand(0.1, 0.19); }
    },
    whoosh(vol = 0.15) { noise({ type: 'bandpass', freq: 300, f2: 2400, q: 1.2, dur: 0.6, vol, attack: 0.2 }); },
    gunfire(n = 5, vol = 0.3) { for (let i = 0; i < n; i++) { const at = i * rand(0.07, 0.11); noise({ type: 'bandpass', freq: 1400, f2: 300, q: 0.8, dur: 0.12, vol: vol * rand(0.6, 1), at, attack: 0.001, pan: rand(-0.6, 0.6) }); } },
    // новые звуки для 39 игр
    hiss(dur = 0.8, vol = 0.12) { noise({ type: 'highpass', freq: 3200, q: 0.5, dur, vol, attack: 0.02 }); },
    alarm(vol = 0.06) { tone({ f: 880, f2: 660, type: 'square', dur: 0.35, vol, filter: { type: 'lowpass', freq: 1800 } }); tone({ f: 880, f2: 660, type: 'square', dur: 0.35, vol, at: 0.45, filter: { type: 'lowpass', freq: 1800 } }); },
    slash(vol = 0.2) { noise({ type: 'bandpass', freq: 5200, f2: 1400, q: 1.5, dur: 0.14, vol, attack: 0.002 }); tone({ f: 1800, f2: 600, type: 'sawtooth', dur: 0.08, vol: vol * 0.3 }); },
    crunch(vol = 0.3) { for (let i = 0; i < 5; i++) noise({ type: 'bandpass', freq: rand(500, 1600), q: 2, dur: 0.05, vol: vol * rand(0.5, 1), at: i * 0.03, attack: 0.001 }); tone({ f: 90, f2: 40, dur: 0.18, vol: vol * 0.7 }); },
    drip(vol = 0.08) { tone({ f: rand(900, 1400), f2: rand(300, 500), dur: 0.09, vol, attack: 0.001 }); },
    breath(dur = 1.2, vol = 0.08, inhale = true) { noise({ type: 'bandpass', freq: inhale ? 700 : 500, f2: inhale ? 1300 : 300, q: 0.9, dur, vol, attack: dur * 0.45 }); },
    squelch(vol = 0.2) { noise({ type: 'lowpass', freq: 600, f2: 150, q: 3, dur: 0.25, vol }); tone({ f: 140, f2: 70, type: 'triangle', dur: 0.2, vol: vol * 0.5 }); },
    type(vol = 0.03) { noise({ type: 'bandpass', freq: rand(2500, 4200), q: 3, dur: 0.025, vol, attack: 0.001 }); },
    ding(f = 1320, vol = 0.05) { tone({ f, dur: 0.6, vol, attack: 0.004 }); },
  };
  return { ensure, sfx, loopNoise, loopOsc, tone, noise, time: () => (ac ? ac.currentTime : 0) };
})();

/** холст на весь родитель с учётом DPR; o.W / o.H — в CSS-пикселях */
function makeCanvas(scope, parent, { dprMax = 2, cls = 'gcv' } = {}) {
  const cv = document.createElement('canvas');
  cv.className = cls; cv.setAttribute('aria-hidden', 'true');
  parent.appendChild(cv);
  const g = cv.getContext('2d');
  const o = { cv, g, W: 1, H: 1, dpr: 1, onResize: null };
  o.fit = () => {
    const r = parent.getBoundingClientRect();
    o.dpr = Math.min(dprMax, window.devicePixelRatio || 1);
    o.W = Math.max(1, r.width); o.H = Math.max(1, r.height);
    cv.width = Math.round(o.W * o.dpr); cv.height = Math.round(o.H * o.dpr);
    cv.style.width = `${o.W}px`; cv.style.height = `${o.H}px`;
    g.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
    if (o.onResize) o.onResize();
  };
  o.fit();
  scope.on(window, 'resize', () => o.fit());
  return o;
}

/* ---------- глитч-текст ---------- */
const GL_CHARS = '▓▒░█▚▞#%@&$ΞΨ47_/\\|';
function glitchHTML(text, ratio, seed = 47) {
  const r = mulberry(seed);
  let out = '';
  for (const ch of text) {
    if (/[\p{L}\p{N}]/u.test(ch) && r() < ratio) out += `<span class="gl">${esc(GL_CHARS[Math.floor(r() * GL_CHARS.length)])}</span>`;
    else out += esc(ch);
  }
  return out;
}
/** то же для текста книги, где встречаются теги: теги не трогаем, текст не экранируем повторно */
function glitchRich(html, ratio, seed = 47) {
  if (ratio <= 0) return html;
  const r = mulberry(seed);
  return html.split(/(<[^>]+>|&[a-z#0-9]+;)/i).map(part => {
    if (!part || part[0] === '<' || (part[0] === '&' && part.endsWith(';'))) return part;
    let out = '';
    for (const ch of part) out += /[\p{L}\p{N}]/u.test(ch) && r() < ratio ? `<span class="gl">${esc(GL_CHARS[Math.floor(r() * GL_CHARS.length)])}</span>` : ch;
    return out;
  }).join('');
}
/** текст «проявляется»: глитч уходит за несколько шагов */
function revealText(el, text, seed = 47, from = 0.5) {
  const steps = REDUCED ? 1 : 12;
  for (let i = 0; i <= steps; i++) {
    setTimeout(() => {
      const k = 1 - i / steps;
      el.innerHTML = i === steps ? esc(text) : glitchHTML(text, from * k, seed + i * 7);
    }, i * 95);
  }
}

/* ---------- прицел: мышь — абсолютно, палец — относительно, стрелки ---------- */
function makeAim(ctx, { onHold, onRelease, start }) {
  const { scope, body } = ctx;
  const a = { x: start[0], y: start[1], ptr: null, keys: {} };
  const rect = () => body.getBoundingClientRect();
  const clampA = () => { const r = rect(); a.x = clamp(a.x, 0, r.width); a.y = clamp(a.y, 0, r.height); };
  scope.on(body, 'pointerdown', e => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    try { body.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    a.ptr = { id: e.pointerId, lx: e.clientX, ly: e.clientY };
    if (e.pointerType === 'mouse') { const r = rect(); a.x = e.clientX - r.left; a.y = e.clientY - r.top; }
    onHold();
  });
  scope.on(body, 'pointermove', e => {
    if (e.pointerType === 'mouse') { const r = rect(); a.x = e.clientX - r.left; a.y = e.clientY - r.top; return; }
    if (!a.ptr || a.ptr.id !== e.pointerId) return;
    a.x += e.clientX - a.ptr.lx; a.y += e.clientY - a.ptr.ly; a.ptr.lx = e.clientX; a.ptr.ly = e.clientY; clampA();
  });
  const up = e => { if (!a.ptr || a.ptr.id !== e.pointerId) return; a.ptr = null; onRelease(); };
  scope.on(body, 'pointerup', up);
  scope.on(body, 'pointercancel', e => { if (a.ptr && a.ptr.id === e.pointerId) a.ptr = null; });
  scope.on(document, 'keydown', e => {
    if (e.key === 'Escape') return;
    if (e.key.startsWith('Arrow')) { e.preventDefault(); a.keys[e.key] = true; }
    if (e.code === 'Space' && !e.repeat) { e.preventDefault(); onHold(); }
  });
  scope.on(document, 'keyup', e => {
    if (e.key.startsWith('Arrow')) a.keys[e.key] = false;
    if (e.code === 'Space') { e.preventDefault(); onRelease(); }
  });
  a.tick = dt => {
    const v = 260 * dt;
    if (a.keys.ArrowLeft) a.x -= v; if (a.keys.ArrowRight) a.x += v;
    if (a.keys.ArrowUp) a.y -= v; if (a.keys.ArrowDown) a.y += v;
    if (a.keys.ArrowLeft || a.keys.ArrowRight || a.keys.ArrowUp || a.keys.ArrowDown) clampA();
  };
  return a;
}
function drawReticle(g, x, y, col = 'rgba(255, 40, 70, .95)', r = 18) {
  g.strokeStyle = col; g.lineWidth = 1.6;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  g.beginPath();
  g.moveTo(x - r - 8, y); g.lineTo(x - 5, y); g.moveTo(x + 5, y); g.lineTo(x + r + 8, y);
  g.moveTo(x, y - r - 8); g.lineTo(x, y - 5); g.moveTo(x, y + 5); g.lineTo(x, y + r + 8);
  g.stroke();
  g.fillStyle = col; g.beginPath(); g.arc(x, y, 1.8, 0, Math.PI * 2); g.fill();
}

/* ==========================================================================
   ГРАФИКА ПО РЕФЕРЕНСАМ (Canvas 2D, процедурно)
   ========================================================================== */
const Art = (() => {
  const PAL = {
    black: '#050203', black2: '#0a0508', black3: '#111014',
    red: '#ff0033', red2: '#d4001e', blood: '#8a0a18', blood2: '#5a0610',
    ice: '#88ddff', ice2: '#4aa8d8', ice3: '#1a3a4a', amber: '#ffb347', green: '#00ff88',
    ash: '#6b6b70', navy: '#1d2850', paper: '#efe6cf', frost: '#8fb0c4',
  };
  const cache = new Map();
  /** закэшированный рисунок: fn(g, w, h) рисуется один раз в offscreen-холст */
  function cached(key, w, h, fn) {
    let c = cache.get(key);
    if (!c) {
      c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
      fn(c.getContext('2d'), c.width, c.height);
      cache.set(key, c);
      if (cache.size > 90) cache.delete(cache.keys().next().value);
    }
    return c;
  }
  let grainTiles = null;
  function grain(g, W, H, a = 0.08) {
    if (!grainTiles) {
      grainTiles = Array.from({ length: 3 }, () => {
        const c = document.createElement('canvas'); c.width = c.height = 96;
        const x = c.getContext('2d'), img = x.createImageData(96, 96), d = img.data;
        for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.random() < 0.5 ? 120 : 0; }
        x.putImageData(img, 0, 0); return c;
      });
    }
    g.save(); g.globalAlpha = a;
    g.fillStyle = g.createPattern(grainTiles[(Math.random() * 3) | 0], 'repeat');
    g.translate((Math.random() * 96) | 0, (Math.random() * 96) | 0);
    g.fillRect(-96, -96, W + 96, H + 96);
    g.restore();
  }
  function scan(g, W, H, a = 0.12) {
    g.fillStyle = `rgba(0,0,0,${a})`;
    for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
  }
  function vignette(g, W, H, a = 0.7, cx = W / 2, cy = H / 2, color = '0,0,0') {
    const vg = g.createRadialGradient(cx, cy, Math.min(W, H) * 0.25, cx, cy, Math.max(W, H) * 0.78);
    vg.addColorStop(0, `rgba(${color},0)`); vg.addColorStop(1, `rgba(${color},${a})`);
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  /** кровь: пятно + брызги + подтёки вниз */
  function blood(g, x, y, r, seed = 7, a = 1) {
    const R = mulberry(seed);
    g.save(); g.globalAlpha *= a;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(120,0,10,.95)'); gr.addColorStop(0.6, 'rgba(90,0,8,.8)'); gr.addColorStop(1, 'rgba(60,0,4,0)');
    g.fillStyle = gr; g.beginPath();
    for (let k = 0; k <= 18; k++) { const an = k / 18 * Math.PI * 2, rr = r * (0.7 + R() * 0.45); const px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr; k ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.fill();
    g.fillStyle = 'rgba(110,0,10,.9)';
    for (let k = 0; k < 14; k++) { const an = R() * Math.PI * 2, d = r * (1 + R() * 1.4); g.beginPath(); g.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, 0.8 + R() * r * 0.09, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(100,0,8,.85)'; g.lineCap = 'round';
    for (let k = 0; k < 4; k++) { if (R() < 0.35) continue; const dx = x + (R() - 0.5) * r * 1.2; g.lineWidth = 1 + R() * r * 0.12; g.beginPath(); g.moveTo(dx, y); g.lineTo(dx + (R() - 0.5) * 3, y + r * (0.6 + R() * 2.2)); g.stroke(); }
    g.restore();
  }
  /** небрежные «мазки кистью» поверх фигуры — артбучная фактура */
  function strokes(g, x, y, w, h, seed, color = 'rgba(255,255,255,.05)', n = 30) {
    const R = mulberry(seed);
    g.save(); g.strokeStyle = color; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      g.lineWidth = 0.6 + R() * 2.2;
      const px = x + R() * w, py = y + R() * h, len = 4 + R() * Math.min(w, h) * 0.18, an = -0.6 + R() * 1.2;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(an) * len, py + Math.sin(an) * len); g.stroke();
    }
    g.restore();
  }
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

  /**
   * ПОЛНЫЙ КОМПЛЕКТ БРОНИ, анфас (референс 6): матовый шлем, красный визор,
   * маска с красными точками, красные шланги, сегментные наплечники —
   * левый с синей подсветкой, правый с красной, красная полоса на груди.
   * cx — центр, top — макушка шлема, h — высота бюста.
   */
  function armor(g, cx, top, h, o = {}) {
    const u = h / 100, t = o.t || 0, seed = o.seed || 6;
    const R = mulberry(seed);
    const visor = o.visor || '#ff1a3a', left = o.left || '#2f6bff', right = o.right || '#ff1a2e';
    const glowK = 0.75 + 0.25 * Math.sin(t * 2.3);
    g.save();
    // торс и плечи (под головой)
    const body = g.createLinearGradient(0, top + 50 * u, 0, top + 110 * u);
    body.addColorStop(0, '#2a2b2f'); body.addColorStop(1, '#101114');
    g.fillStyle = body;
    g.beginPath();
    g.moveTo(cx - 20 * u, top + 52 * u); g.lineTo(cx + 20 * u, top + 52 * u);
    g.lineTo(cx + 33 * u, top + 62 * u); g.lineTo(cx + 30 * u, top + 108 * u);
    g.lineTo(cx - 30 * u, top + 108 * u); g.lineTo(cx - 33 * u, top + 62 * u); g.closePath(); g.fill();
    // нагрудник
    g.fillStyle = '#1b1c20';
    g.beginPath(); g.moveTo(cx - 17 * u, top + 60 * u); g.lineTo(cx + 17 * u, top + 60 * u); g.lineTo(cx + 15 * u, top + 96 * u); g.lineTo(cx, top + 102 * u); g.lineTo(cx - 15 * u, top + 96 * u); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = Math.max(1, u * 0.5);
    g.beginPath(); g.moveTo(cx - 12 * u, top + 64 * u); g.lineTo(cx - 3 * u, top + 70 * u); g.moveTo(cx + 12 * u, top + 64 * u); g.lineTo(cx + 3 * u, top + 70 * u);
    g.moveTo(cx - 14 * u, top + 88 * u); g.lineTo(cx + 14 * u, top + 88 * u); g.stroke();
    // красная полоса на груди
    if (o.chest !== false) {
      g.save(); g.shadowColor = right; g.shadowBlur = 14 * u * glowK;
      g.fillStyle = right; rr(g, cx - 8 * u, top + 74 * u, 16 * u, 3.2 * u, 1.2 * u); g.fill();
      g.fillStyle = 'rgba(255,200,210,.7)'; g.fillRect(cx - 6 * u, top + 74.8 * u, 7 * u, 0.7 * u);
      g.restore();
    }
    // наплечники: сегменты с подсветкой в щелях
    const pauldron = (sx, col) => {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        const x = cx + sx * (21 + c * 5.4) * u - (sx < 0 ? 5 * u : 0), y = top + (57 + r * 6.2 + c * 1.5) * u;
        g.fillStyle = r % 2 ? '#26272b' : '#1c1d21'; rr(g, x, y, 5 * u, 5.4 * u, 0.9 * u); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = Math.max(1, 0.4 * u); g.stroke();
        if ((r + c + seed) % 3 !== 0) {
          g.save(); g.shadowColor = col; g.shadowBlur = 6 * u * glowK; g.fillStyle = col;
          g.fillRect(x + (sx < 0 ? 4.2 : 0.2) * u, y + 1 * u, 0.7 * u, 3.4 * u); g.restore();
        }
      }
    };
    pauldron(-1, left); pauldron(1, right);
    // шея и маска
    g.fillStyle = '#141518'; g.fillRect(cx - 7 * u, top + 44 * u, 14 * u, 10 * u);
    // шланги
    g.save(); g.strokeStyle = '#d0102a'; g.lineWidth = 1.5 * u; g.lineCap = 'round'; g.shadowColor = '#ff0033'; g.shadowBlur = 6 * u;
    g.beginPath(); g.moveTo(cx - 9 * u, top + 40 * u); g.bezierCurveTo(cx - 20 * u, top + 38 * u, cx - 20 * u, top + 47 * u, cx - 14 * u, top + 50 * u); g.stroke();
    g.beginPath(); g.moveTo(cx + 9 * u, top + 40 * u); g.bezierCurveTo(cx + 22 * u, top + 42 * u, cx + 17 * u, top + 48 * u, cx + 22 * u, top + 52 * u); g.stroke();
    g.restore();
    // шлем
    const hg = g.createLinearGradient(0, top, 0, top + 40 * u);
    hg.addColorStop(0, '#3b3d41'); hg.addColorStop(0.6, '#232427'); hg.addColorStop(1, '#141416');
    g.fillStyle = hg;
    g.beginPath(); g.ellipse(cx, top + 22 * u, 17 * u, 21 * u, 0, Math.PI, 0); g.lineTo(cx + 17 * u, top + 33 * u); g.quadraticCurveTo(cx, top + 37 * u, cx - 17 * u, top + 33 * u); g.closePath(); g.fill();
    // потёртости и камуфляжные пятна на куполе
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '90,95,80' : '20,20,22'},${0.18 + R() * 0.2})`; g.beginPath(); g.ellipse(cx + (R() - 0.5) * 26 * u, top + (4 + R() * 16) * u, (1 + R() * 3) * u, (0.6 + R() * 1.6) * u, R() * 3, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(235,235,240,.8)'; g.lineWidth = 0.7 * u;
    g.beginPath(); g.moveTo(cx + 9 * u, top + 12 * u); g.lineTo(cx + 12 * u, top + 17 * u); g.lineTo(cx + 11 * u, top + 19 * u); g.stroke();
    // маска
    g.fillStyle = '#26272b';
    g.beginPath(); g.moveTo(cx - 9 * u, top + 33 * u); g.lineTo(cx + 9 * u, top + 33 * u); g.lineTo(cx + 7 * u, top + 45 * u); g.quadraticCurveTo(cx, top + 49 * u, cx - 7 * u, top + 45 * u); g.closePath(); g.fill();
    g.save(); g.shadowColor = '#ff0033'; g.shadowBlur = 5 * u;
    g.fillStyle = '#ff2240';
    [[-5, 38], [5, 38], [-3, 44], [3, 44]].forEach(([dx, dy]) => { g.fillRect(cx + dx * u - 0.6 * u, top + dy * u, 1.2 * u, 1.4 * u); });
    g.restore();
    // визор
    g.save(); g.shadowColor = visor; g.shadowBlur = 22 * u * glowK;
    const vg = g.createLinearGradient(0, top + 23 * u, 0, top + 34 * u);
    vg.addColorStop(0, '#ff5a6e'); vg.addColorStop(0.4, visor); vg.addColorStop(1, '#8a0016');
    g.fillStyle = vg;
    g.beginPath(); g.moveTo(cx - 15 * u, top + 24 * u); g.quadraticCurveTo(cx, top + 21 * u, cx + 15 * u, top + 24 * u);
    g.lineTo(cx + 14 * u, top + 32 * u); g.quadraticCurveTo(cx + 5 * u, top + 34 * u, cx + 2 * u, top + 31 * u); g.lineTo(cx - 2 * u, top + 31 * u);
    g.quadraticCurveTo(cx - 5 * u, top + 34 * u, cx - 14 * u, top + 32 * u); g.closePath(); g.fill();
    g.restore();
    g.fillStyle = 'rgba(255,220,225,.35)'; g.fillRect(cx - 11 * u, top + 25 * u, 8 * u, 0.9 * u);
    if (o.cracked) {
      g.strokeStyle = 'rgba(255,240,240,.85)'; g.lineWidth = 0.6 * u;
      g.beginPath(); g.moveTo(cx + 3 * u, top + 26 * u); g.lineTo(cx + 7 * u, top + 29 * u); g.lineTo(cx + 5 * u, top + 32 * u); g.moveTo(cx + 7 * u, top + 29 * u); g.lineTo(cx + 12 * u, top + 27 * u); g.stroke();
    }
    strokes(g, cx - 32 * u, top, 64 * u, 108 * u, seed + 3, 'rgba(255,255,255,.035)', 44);
    if (o.blood) { blood(g, cx + 12 * u, top + 70 * u, 9 * u, seed + 11, o.blood); blood(g, cx - 6 * u, top + 30 * u, 4 * u, seed + 13, o.blood * 0.8); }
    g.restore();
  }

  /**
   * РЕЙДЕР С КОГТЯМИ (референс 4): серо-чёрная броня, красный визор-щель,
   * синие светящиеся полоски на плече, красная механическая перчатка с тремя лезвиями.
   * cx — центр, base — линия пола, h — рост. dir: 1 — смотрит вправо, -1 — влево.
   */
  function raider(g, cx, base, h, o = {}) {
    const u = h / 100, dir = o.dir || 1, t = o.t || 0, lunge = o.lunge || 0;
    g.save(); g.translate(cx, base); g.scale(dir, 1);
    const top = -h;
    const armorG = g.createLinearGradient(0, top, 0, 0);
    armorG.addColorStop(0, '#3a3b3f'); armorG.addColorStop(0.5, '#222327'); armorG.addColorStop(1, '#0d0d10');
    g.fillStyle = armorG;
    // ноги
    g.beginPath(); g.moveTo(-9 * u, -48 * u); g.lineTo(-2 * u, -48 * u); g.lineTo(-4 * u, 0); g.lineTo(-13 * u, 0); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(1 * u, -48 * u); g.lineTo(9 * u, -48 * u); g.lineTo(12 * u + lunge * 6 * u, 0); g.lineTo(4 * u + lunge * 6 * u, 0); g.closePath(); g.fill();
    // торс
    g.beginPath(); g.moveTo(-13 * u, -80 * u); g.lineTo(12 * u, -80 * u); g.lineTo(11 * u, -48 * u); g.lineTo(-10 * u, -46 * u); g.closePath(); g.fill();
    g.fillStyle = '#18191c'; g.fillRect(-9 * u, -76 * u, 17 * u, 12 * u);
    g.save(); g.shadowColor = '#ff0033'; g.shadowBlur = 8 * u; g.fillStyle = '#ff1a2e'; rr(g, 0, -68 * u, 7 * u, 2.2 * u, 0.8 * u); g.fill(); g.restore();
    // наплечник со синими полосками (дальнее плечо)
    g.fillStyle = '#26272b'; rr(g, -18 * u, -83 * u, 9 * u, 16 * u, 2 * u); g.fill();
    g.save(); g.shadowColor = '#2f6bff'; g.shadowBlur = 7 * u; g.fillStyle = '#3f86ff';
    for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) { if ((i + k + Math.floor(t * 2)) % 5 === 0) continue; g.fillRect(-24 * u - k * 3 * u, (-82 + i * 4.2) * u, 1.1 * u, 2.6 * u); }
    g.restore();
    // рука с перчаткой-когтем
    const ax = 10 * u, ay = -74 * u, hx = (28 + lunge * 8) * u, hy = (-62 - lunge * 4) * u;
    g.strokeStyle = '#2a2b2f'; g.lineWidth = 6 * u; g.lineCap = 'round';
    g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(22 * u, -70 * u, hx - 3 * u, hy); g.stroke();
    if (o.claws !== false) {
      g.fillStyle = '#b3121f'; g.beginPath(); g.ellipse(hx, hy, 4.4 * u, 3.6 * u, -0.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(40,0,4,.6)'; for (let i = 0; i < 6; i++) g.fillRect(hx - 3 * u + (i % 3) * 2 * u, hy - 2 * u + Math.floor(i / 3) * 2 * u, 1.2 * u, 1.2 * u);
      g.fillStyle = '#e8e8ec'; g.strokeStyle = '#8a8c90'; g.lineWidth = 0.4 * u;
      for (let k = -1; k <= 1; k++) {
        g.beginPath(); g.moveTo(hx + 3 * u, hy + k * 1.6 * u - 0.8 * u); g.lineTo(hx + 20 * u, hy + k * 3.2 * u - 2 * u); g.lineTo(hx + 3 * u, hy + k * 1.6 * u + 0.8 * u); g.closePath(); g.fill(); g.stroke();
      }
    }
    // шлем
    g.fillStyle = '#2e3034'; g.beginPath(); g.ellipse(0, -90 * u, 8.5 * u, 10 * u, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1c1d20'; g.beginPath(); g.moveTo(1 * u, -88 * u); g.lineTo(10 * u, -87 * u); g.lineTo(9 * u, -80 * u); g.lineTo(2 * u, -79 * u); g.closePath(); g.fill();
    g.save(); g.shadowColor = '#ff0022'; g.shadowBlur = 12 * u; g.fillStyle = '#ff2a3c';
    g.beginPath(); g.moveTo(-1 * u, -93 * u); g.lineTo(9 * u, -92 * u); g.lineTo(8.5 * u, -89 * u); g.lineTo(-1 * u, -89.5 * u); g.closePath(); g.fill();
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(3 * u, -92.4 * u, 3 * u, 0.9 * u);
    // красные шланги
    g.strokeStyle = '#d0102a'; g.lineWidth = 1.2 * u;
    g.beginPath(); g.moveTo(-6 * u, -86 * u); g.bezierCurveTo(-16 * u, -88 * u, -14 * u, -80 * u, -8 * u, -79 * u); g.stroke();
    strokes(g, -20 * u, -100 * u, 40 * u, 100 * u, 44, 'rgba(255,255,255,.04)', 26);
    if (o.blood) blood(g, 20 * u, -64 * u, 5 * u, 91, o.blood);
    g.restore();
  }

  /** ЧЁРНЫЙ ПРОФИЛЬ К-47 (референс 1): матовый профиль, две белые точки-глаза без зрачков */
  function profile(g, cx, cy, h, o = {}) {
    const u = h / 100;
    g.save(); g.translate(cx, cy); if (o.dir === -1) g.scale(-1, 1);
    if (o.bg) { g.fillStyle = o.bg; g.fillRect(-60 * u, -55 * u, 120 * u, 110 * u); }
    const pg = g.createLinearGradient(-30 * u, 0, 30 * u, 0);
    pg.addColorStop(0, '#020202'); pg.addColorStop(0.7, '#0b0b0c'); pg.addColorStop(1, '#141416');
    g.fillStyle = pg;
    g.beginPath();
    g.moveTo(-26 * u, 50 * u); g.lineTo(-24 * u, 30 * u); g.quadraticCurveTo(-22 * u, 18 * u, -16 * u, 14 * u);
    g.quadraticCurveTo(-26 * u, 4 * u, -26 * u, -14 * u); g.quadraticCurveTo(-24 * u, -40 * u, 0, -42 * u);
    g.quadraticCurveTo(18 * u, -41 * u, 20 * u, -24 * u); g.lineTo(21 * u, -14 * u); g.lineTo(27 * u, -4 * u); g.lineTo(21 * u, -1 * u);
    g.lineTo(22 * u, 4 * u); g.lineTo(20 * u, 6 * u); g.lineTo(21 * u, 10 * u); g.quadraticCurveTo(18 * u, 17 * u, 10 * u, 17 * u);
    g.lineTo(6 * u, 22 * u); g.lineTo(8 * u, 30 * u); g.quadraticCurveTo(30 * u, 34 * u, 34 * u, 50 * u); g.closePath(); g.fill();
    g.save(); g.shadowColor = '#fff'; g.shadowBlur = 6 * u; g.fillStyle = o.eyes || '#ffffff';
    g.beginPath(); g.arc(13 * u, -12 * u, 1.7 * u, 0, Math.PI * 2); g.arc(18 * u, -12.5 * u, 1.5 * u, 0, Math.PI * 2); g.fill();
    g.restore();
    if (o.tag) { g.fillStyle = 'rgba(255,255,255,.4)'; g.font = `${Math.round(6 * u)}px ${MONO}`; g.textAlign = 'left'; g.fillText(o.tag, -24 * u, 46 * u); }
    g.restore();
  }

  /** КЛОН С ЗАШИТЫМ ЛИЦОМ (референс 2): торс в чёрных шрамах-крестах, белые глаза, штрихи-помехи */
  function clone(g, cx, top, h, o = {}) {
    const u = h / 100, R = mulberry(o.seed || 2), t = o.t || 0;
    g.save();
    if (o.lines !== false) {
      g.globalAlpha = 0.5;
      for (let i = 0; i < 90; i++) { const x = cx + (R() - 0.5) * 120 * u; g.strokeStyle = R() < 0.5 ? 'rgba(235,235,240,.25)' : 'rgba(0,0,0,.6)'; g.lineWidth = 0.5 + R() * 2; g.beginPath(); g.moveTo(x, top - 10 * u); g.lineTo(x + (R() - 0.5) * 6 * u, top + 110 * u); g.stroke(); }
      g.globalAlpha = 1;
    }
    const skin = o.skin || '#cfc6c0';
    g.fillStyle = skin;
    g.beginPath(); g.moveTo(cx - 32 * u, top + 100 * u); g.quadraticCurveTo(cx - 34 * u, top + 52 * u, cx - 11 * u, top + 46 * u);
    g.lineTo(cx + 11 * u, top + 46 * u); g.quadraticCurveTo(cx + 34 * u, top + 52 * u, cx + 32 * u, top + 100 * u); g.closePath(); g.fill();
    g.fillRect(cx - 5 * u, top + 34 * u, 10 * u, 14 * u);
    g.beginPath(); g.ellipse(cx, top + 22 * u, 11 * u, 14 * u, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(40,30,30,.35)'; g.beginPath(); g.ellipse(cx, top + 12 * u, 11 * u, 6 * u, 0, Math.PI, 0); g.fill();
    // шрамы-кресты
    g.strokeStyle = '#0b0707'; g.lineCap = 'round';
    for (let i = 0; i < (o.scars ?? 14); i++) {
      const x = cx + (R() - 0.5) * 50 * u, y = top + (52 + R() * 44) * u, s = (1.4 + R() * 2.4) * u;
      g.lineWidth = 0.7 * u + R() * u; g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y + s); g.moveTo(x + s, y - s); g.lineTo(x - s, y + s); g.stroke();
    }
    // зашитый рот
    g.lineWidth = 0.6 * u; g.beginPath(); g.moveTo(cx - 5 * u, top + 29 * u); g.lineTo(cx + 5 * u, top + 29 * u);
    for (let k = -4; k <= 4; k += 2) { g.moveTo(cx + k * u, top + 27.6 * u); g.lineTo(cx + k * u + 0.4 * u, top + 30.4 * u); }
    g.stroke();
    // белые глаза
    g.save(); g.shadowColor = '#fff'; g.shadowBlur = 8 * u; g.fillStyle = '#fbfbff';
    g.beginPath(); g.ellipse(cx - 4.5 * u, top + 20 * u, 2.6 * u, 1.6 * u, 0, 0, Math.PI * 2); g.ellipse(cx + 4.5 * u, top + 20 * u, 2.6 * u, 1.6 * u, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    // слёзы / падающий свет
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 0.5 * u;
    for (let i = 0; i < 6; i++) { const x = cx + (i < 3 ? -4.5 : 4.5) * u + (R() - 0.5) * 2 * u; const len = (8 + ((t * 20 + i * 13) % 40)) * u; g.beginPath(); g.moveTo(x, top + 22 * u); g.lineTo(x, top + 22 * u + len); g.stroke(); }
    if (o.blood) blood(g, cx + 6 * u, top + 8 * u, 4 * u, 5, o.blood);
    g.restore();
  }

  /** КРАСНЫЙ ЧЕРЕП-ТРОФЕЙ (референс 5): шлем с разбитым визором, из-под — окровавленный череп с проводами */
  function skull(g, cx, cy, s, o = {}) {
    const u = s / 100, t = o.t || 0, R = mulberry(o.seed || 5);
    g.save(); g.translate(cx, cy);
    const pulse = 0.85 + 0.15 * Math.sin(t * 3);
    // плечи
    g.fillStyle = '#3a0008';
    g.beginPath(); g.moveTo(-58 * u, 70 * u); g.quadraticCurveTo(-50 * u, 34 * u, -20 * u, 30 * u); g.lineTo(20 * u, 30 * u); g.quadraticCurveTo(50 * u, 34 * u, 58 * u, 70 * u); g.closePath(); g.fill();
    for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '140,10,24' : '20,0,4'},.8)`; rr(g, (-55 + (i % 6) * 6 + (i < 6 ? 0 : 76)) * u, (40 + Math.floor((i % 6) / 2) * 7) * u, 5 * u, 6 * u, u); g.fill(); }
    // провода и шланги
    g.strokeStyle = '#1a0003'; g.lineWidth = 2.2 * u; g.lineCap = 'round';
    [[-22, 8, -40, 4, -36, 22], [22, 8, 42, 2, 38, 22], [-14, 22, -30, 30, -26, 40], [16, 20, 30, 30, 34, 38]].forEach(([a, b, c, d, e, f]) => { g.beginPath(); g.moveTo(a * u, b * u); g.quadraticCurveTo(c * u, d * u, e * u, f * u); g.stroke(); });
    // шлем
    const hg = g.createRadialGradient(-8 * u, -40 * u, 4 * u, 0, -24 * u, 46 * u);
    hg.addColorStop(0, `rgba(255,40,60,${pulse})`); hg.addColorStop(0.5, '#c0001c'); hg.addColorStop(1, '#4a0008');
    g.fillStyle = hg;
    g.beginPath(); g.ellipse(0, -22 * u, 32 * u, 36 * u, 0, Math.PI, 0); g.lineTo(32 * u, -4 * u); g.lineTo(-32 * u, -4 * u); g.closePath(); g.fill();
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(20,0,3,.85)'; g.beginPath(); g.ellipse((R() - 0.5) * 44 * u, (-52 + R() * 26) * u, (1.5 + R() * 5) * u, (1 + R() * 3) * u, R() * 3, 0, Math.PI * 2); g.fill(); }
    // разбитый визор
    g.fillStyle = '#0a0002';
    g.beginPath(); g.moveTo(-27 * u, -18 * u); g.quadraticCurveTo(0, -24 * u, 27 * u, -18 * u); g.lineTo(26 * u, -4 * u); g.lineTo(-26 * u, -4 * u); g.closePath(); g.fill();
    g.fillStyle = 'rgba(70,70,76,.55)'; g.beginPath(); g.moveTo(-24 * u, -17 * u); g.lineTo(-6 * u, -19 * u); g.lineTo(-10 * u, -9 * u); g.lineTo(-22 * u, -8 * u); g.closePath(); g.fill();
    // череп
    g.fillStyle = '#d4001e';
    g.beginPath(); g.ellipse(0, 2 * u, 15 * u, 17 * u, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a0006';
    g.beginPath(); g.ellipse(-6 * u, -1 * u, 4 * u, 4.6 * u, 0.2, 0, Math.PI * 2); g.ellipse(6 * u, -1 * u, 4 * u, 4.6 * u, -0.2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(0, 5 * u); g.lineTo(-2 * u, 9 * u); g.lineTo(2 * u, 9 * u); g.closePath(); g.fill();
    g.fillStyle = '#8a0a18'; g.fillRect(-9 * u, 12 * u, 18 * u, 7 * u);
    g.fillStyle = '#ffd0d6'; for (let k = 0; k < 6; k++) g.fillRect((-8 + k * 2.9) * u, 12.6 * u, 1.8 * u, 2.6 * u);
    g.fillStyle = 'rgba(40,40,46,.9)'; for (let k = 0; k < 4; k++) g.fillRect((5 + k * 2.2) * u, (14 + k % 2) * u, 1.4 * u, 3.4 * u);
    blood(g, 4 * u, 8 * u, 10 * u, 17, 0.9);
    // кровь с краёв
    g.strokeStyle = '#6a0010'; g.lineWidth = 1.3 * u;
    for (let k = 0; k < 5; k++) { const x = (-12 + k * 6) * u; g.beginPath(); g.moveTo(x, 18 * u); g.lineTo(x + (R() - 0.5) * u, (22 + R() * 14 + Math.sin(t + k) * 2) * u); g.stroke(); }
    g.restore();
  }

  /** силуэт человека: man | suit | woman | child | doctor | soldier | fat */
  function human(g, x, base, h, kind = 'man', o = {}) {
    const u = h / 100;
    g.save(); g.translate(x, base);
    g.fillStyle = o.color || '#000';
    const wide = kind === 'fat' ? 1.45 : kind === 'child' ? 0.9 : kind === 'woman' ? 0.86 : 1;
    const head = kind === 'child' ? 9.5 : 7.4;
    g.beginPath(); g.ellipse(0, -(100 - head) * u, head * 0.82 * u, head * u, 0, 0, Math.PI * 2); g.fill();
    g.beginPath();
    g.moveTo(-4 * u, -(100 - head * 2) * u); g.lineTo(4 * u, -(100 - head * 2) * u);
    g.quadraticCurveTo(15 * wide * u, -(96 - head * 2) * u, 16 * wide * u, -74 * u);
    g.lineTo(15 * wide * u, -46 * u); g.lineTo(11 * u, -44 * u);
    if (kind === 'woman' || kind === 'doctor') { g.lineTo(13 * u, -20 * u); g.lineTo(6 * u, -20 * u); }
    g.lineTo(7 * u, 0); g.lineTo(1.5 * u, 0); g.lineTo(0, -38 * u); g.lineTo(-1.5 * u, 0); g.lineTo(-7 * u, 0);
    if (kind === 'woman' || kind === 'doctor') { g.lineTo(-6 * u, -20 * u); g.lineTo(-13 * u, -20 * u); }
    g.lineTo(-11 * u, -44 * u); g.lineTo(-15 * wide * u, -46 * u); g.lineTo(-16 * wide * u, -74 * u);
    g.quadraticCurveTo(-15 * wide * u, -(96 - head * 2) * u, -4 * u, -(100 - head * 2) * u);
    g.closePath(); g.fill();
    if (kind === 'suit') { g.strokeStyle = 'rgba(80,0,10,.6)'; g.lineWidth = u; g.beginPath(); g.moveTo(-4 * u, -84 * u); g.lineTo(0, -70 * u); g.lineTo(4 * u, -84 * u); g.stroke(); }
    if (kind === 'soldier') {
      g.beginPath(); g.ellipse(0, -(100 - head) * u - 2 * u, head * 1.05 * u, head * 0.9 * u, 0, Math.PI, 0); g.fill();
      g.save(); g.shadowColor = '#ff0022'; g.shadowBlur = 8 * u; g.fillStyle = o.visor || '#ff1a2e'; g.fillRect(-5 * u, -(100 - head) * u - 1.5 * u, 10 * u, 2 * u); g.restore();
    }
    if (o.eyes) { g.save(); g.shadowColor = o.eyes; g.shadowBlur = 5 * u; g.fillStyle = o.eyes; g.fillRect(-3 * u, -(100 - head) * u - 0.5 * u, 1.6 * u, 1.2 * u); g.fillRect(1.4 * u, -(100 - head) * u - 0.5 * u, 1.6 * u, 1.2 * u); g.restore(); }
    g.restore();
  }

  /** голограмма лектора: красный монохром, сетка, скан-линии */
  function holo(g, x, y, w, h, t = 0, color = '255,0,51') {
    g.save();
    const bg = g.createLinearGradient(0, y, 0, y + h);
    bg.addColorStop(0, `rgba(${color},.10)`); bg.addColorStop(1, `rgba(${color},.02)`);
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    g.strokeStyle = `rgba(${color},.14)`; g.lineWidth = 1;
    for (let gx = x; gx <= x + w; gx += 24) { g.beginPath(); g.moveTo(gx, y); g.lineTo(gx, y + h); g.stroke(); }
    for (let gy = y; gy <= y + h; gy += 24) { g.beginPath(); g.moveTo(x, gy); g.lineTo(x + w, gy); g.stroke(); }
    const sy = y + ((t * 60) % h);
    g.fillStyle = `rgba(${color},.12)`; g.fillRect(x, sy, w, 3);
    g.strokeStyle = `rgba(${color},.6)`; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    g.restore();
  }

  return { PAL, cached, grain, scan, vignette, blood, strokes, rr, armor, raider, profile, clone, skull, human, holo };
})();
