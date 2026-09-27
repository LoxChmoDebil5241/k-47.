/* ==========================================================================
   ЗВУК — полностью синтезируется Web Audio API, ни одного файла.
   master ─┬─ amb  (фоновые гулы сцен, кроссфейд)
           ├─ sfx  (события)
           └─ verb (общая реверберация)
   ========================================================================== */
const A = (() => {
  let ac = null, master = null, comp = null, ambBus = null, sfxBus = null, verb = null;
  let enabled = Settings.sound !== false, volume = clamp(+Settings.vol || 0.85, 0, 1);
  let amb = null, wanted = null, held = false;
  const cache = {};

  function ensure() {
    if (ac) { if (ac.state === 'suspended' && !held && !document.hidden) ac.resume().catch(() => {}); return ac; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); } catch { return null; }
    comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.22;
    master = ac.createGain(); master.gain.value = enabled ? volume : 0;
    master.connect(comp); comp.connect(ac.destination);
    ambBus = ac.createGain(); ambBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.connect(master);
    const conv = ac.createConvolver(); conv.buffer = impulse(2.6, 2.4);
    verb = ac.createGain(); verb.gain.value = 0.26; verb.connect(conv); conv.connect(master);
    if (wanted) startAmbient(wanted, 2);
    return ac;
  }
  const live = () => !!ac && enabled && ac.state === 'running';
  const now = () => ac.currentTime;

  // ---------- строительные блоки ----------
  const osc = (type, f) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; return o; };
  const gain = v => { const g = ac.createGain(); g.gain.value = v; return g; };
  const filt = (type, f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const src = (buf, loop = true) => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = loop; return s; };
  function noiseBuf(kind = 'white', sec = 2) {
    const key = kind + sec;
    if (cache[key]) return cache[key];
    const len = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return (cache[key] = b);
  }
  function impulse(sec, decay) {
    const len = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * 0.5; }
    return b;
  }
  function dest(pan) {
    if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); p.connect(sfxBus); return p; }
    return sfxBus;
  }
  function envelope(g, t0, vol, attack, dur) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(attack + 0.01, dur));
  }
  /** тон: частота f → f2 за dur; фильтр по желанию; pan −1…1; rev — в реверберацию */
  function tone({ f = 440, f2 = 0, type = 'sine', dur = 0.2, vol = 0.2, at = 0, attack = 0.005, pan = 0, filter = null, rev = false } = {}) {
    if (!live()) return;
    const t0 = now() + Math.max(0, at), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + dur);
    envelope(g, t0, vol, attack, dur);
    if (filter) { const fl = filt(filter.type || 'bandpass', filter.freq || 1000, filter.q || 1); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(dest(pan)); if (rev) g.connect(verb);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise({ dur = 0.2, vol = 0.2, at = 0, type = 'bandpass', freq = 1000, f2 = 0, q = 1, attack = 0.005, pan = 0, kind = 'white', rev = false } = {}) {
    if (!live()) return;
    const t0 = now() + Math.max(0, at), s = src(noiseBuf(kind, 2)), fl = filt(type, freq, q), g = ac.createGain();
    if (f2) fl.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    envelope(g, t0, vol, attack, dur);
    s.connect(fl); fl.connect(g); g.connect(dest(pan)); if (rev) g.connect(verb);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }
  const dummy = () => ({ vol() {}, freq() {}, q() {}, pan() {}, stop() {} });
  /** петля шума: vol/freq меняются плавно; stop() — обязательно (через scope.own) */
  function loopNoise({ type = 'bandpass', freq = 800, q = 1, vol = 0, kind = 'white' } = {}) {
    if (!ensure()) return dummy();
    const s = src(noiseBuf(kind, 3)), fl = filt(type, freq, q), g = gain(vol), p = ac.createStereoPanner ? ac.createStereoPanner() : null;
    s.connect(fl); fl.connect(g); if (p) { g.connect(p); p.connect(sfxBus); } else g.connect(sfxBus);
    s.start(0, Math.random() * 1.5);
    let dead = false;
    return {
      vol(v, tc = 0.05) { if (!dead) g.gain.setTargetAtTime(Math.max(0, v), ac.currentTime, tc); },
      freq(f, tc = 0.05) { if (!dead) fl.frequency.setTargetAtTime(Math.max(20, f), ac.currentTime, tc); },
      q(v) { fl.Q.value = v; },
      pan(v) { if (p) p.pan.setTargetAtTime(clamp(v, -1, 1), ac.currentTime, 0.05); },
      stop() { if (dead) return; dead = true; try { g.gain.setTargetAtTime(0, ac.currentTime, 0.06); s.stop(ac.currentTime + 0.5); } catch { /* уже */ } },
    };
  }
  function loopOsc({ type = 'sine', freq = 110, vol = 0, lp = 0 } = {}) {
    if (!ensure()) return dummy();
    const o = osc(type, freq), g = gain(vol);
    if (lp) { const fl = filt('lowpass', lp); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(sfxBus); o.start();
    let dead = false;
    return {
      vol(v, tc = 0.05) { if (!dead) g.gain.setTargetAtTime(Math.max(0, v), ac.currentTime, tc); },
      freq(f, tc = 0.05) { if (!dead) o.frequency.setTargetAtTime(Math.max(1, f), ac.currentTime, tc); },
      q() {}, pan() {},
      stop() { if (dead) return; dead = true; try { g.gain.setTargetAtTime(0, ac.currentTime, 0.06); o.stop(ac.currentTime + 0.5); } catch { /* уже */ } },
    };
  }

  // ---------- фоновые гулы по сценам ----------
  const AMBIENT = {
    // бланк — ровный гул кабинета, высокий свист ламп
    contract() {
      const out = gain(0), nodes = [];
      const o1 = osc('sine', 45), o2 = osc('sine', 55.3), lfo = osc('sine', 0.25), lg = gain(1.4);
      lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
      o1.connect(gain(0.5)).connect(out); o2.connect(gain(0.32)).connect(out);
      const n = src(noiseBuf('brown', 4)); n.connect(filt('highpass', 900)).connect(gain(0.2)).connect(out);
      nodes.push(o1, o2, lfo, n);
      return { out, level: 0.16, nodes };
    },
    office() {
      const out = gain(0), nodes = [];
      const hum = osc('sawtooth', 50); hum.connect(filt('bandpass', 100, 8)).connect(gain(0.25)).connect(out);
      const hum2 = osc('sine', 100); hum2.connect(gain(0.12)).connect(out);
      const n = src(noiseBuf('brown', 4)); n.connect(filt('lowpass', 400)).connect(gain(0.35)).connect(out);
      nodes.push(hum, hum2, n);
      return { out, level: 0.14, nodes };
    },
    // станция подо льдом: низкие биения, дыхание вентиляции, далёкие удары и скрипы
    room() {
      const out = gain(0), nodes = [];
      [38.5, 41.2, 57.8].forEach((f, i) => { const o = osc('sine', f); o.connect(gain(i === 2 ? 0.35 : 1)).connect(out); nodes.push(o); });
      const n = src(noiseBuf('brown', 4)), lp = filt('lowpass', 180);
      n.connect(lp).connect(gain(0.9)).connect(out); nodes.push(n);
      const lfo = osc('sine', 0.07), lg = gain(90); lfo.connect(lg).connect(lp.frequency); nodes.push(lfo);
      const vent = src(noiseBuf('white', 4)), vf = filt('bandpass', 420, 0.8); vent.connect(vf).connect(gain(0.05)).connect(out); nodes.push(vent);
      let t = setTimeout(function creak() {
        if (live()) { if (Math.random() < 0.5) sfx.creak(0.3); else sfx.scrape(0.12, rand(-0.8, 0.8)); }
        t = setTimeout(creak, rand(7000, 16000));
      }, 5000);
      return { out, level: 0.22, nodes, cleanup: () => clearTimeout(t) };
    },
    // архив: давящий гул, плотнее с износом
    reader() {
      const out = gain(0), nodes = [];
      const lp = filt('lowpass', 150, 2), trem = gain(0.75);
      const s1 = osc('sawtooth', 32.7), s2 = osc('sawtooth', 49.1); s2.detune.value = 9;
      s1.connect(gain(0.5)).connect(lp); s2.connect(gain(0.3)).connect(lp); lp.connect(trem).connect(out);
      const lfo = osc('sine', 0.11), lg = gain(0.22); lfo.connect(lg).connect(trem.gain);
      const n = src(noiseBuf('brown', 4)), ng = gain(0.5); n.connect(filt('lowpass', 300)).connect(ng).connect(out);
      nodes.push(s1, s2, lfo, n);
      return { out, level: 0.2, nodes, setIntensity(v) { const t = now(); lp.frequency.setTargetAtTime(150 + v * 520, t, 0.6); ng.gain.setTargetAtTime(0.5 + v * 0.9, t, 0.6); } };
    },
    // 47 нажатий: пульсирующий, как сердце
    clicks() {
      const out = gain(0), nodes = [];
      const o = osc('sawtooth', 45), s = osc('sine', 60), lp = filt('lowpass', 130, 4), pul = gain(0.32);
      o.connect(lp); s.connect(gain(0.7)).connect(lp); lp.connect(pul).connect(out);
      const lfo = osc('sine', 1.15), lg = gain(0.3); lfo.connect(lg).connect(pul.gain);
      const n = src(noiseBuf('brown', 4)); n.connect(filt('lowpass', 150)).connect(gain(0.6)).connect(out);
      nodes.push(o, s, lfo, n);
      return { out, level: 0.3, nodes, setIntensity(v) { const t = now(); lfo.frequency.setTargetAtTime(1.15 + v * 1.4, t, 0.3); lp.frequency.setTargetAtTime(130 + v * 260, t, 0.3); } };
    },
    // мини-игры: тихая подложка «восстановления нейрослепка»
    frag() {
      const out = gain(0), nodes = [];
      const o = osc('sine', 55), o2 = osc('sine', 82.4); o2.detune.value = 7;
      o.connect(gain(0.6)).connect(out); o2.connect(gain(0.25)).connect(out);
      const n = src(noiseBuf('brown', 4)); n.connect(filt('lowpass', 220)).connect(gain(0.5)).connect(out);
      nodes.push(o, o2, n);
      return { out, level: 0.1, nodes };
    },
    // пробуждение — светлый, но неустойчивый аккорд
    ending() {
      const out = gain(0), nodes = [], trem = gain(0.75); trem.connect(out);
      [[110, 0.35], [220, 0.5], [329.63, 0.32], [493.88, 0.18]].forEach(([f, v]) => { const o = osc('sine', f); o.detune.value = rand(-5, 5); o.connect(gain(v)).connect(trem); nodes.push(o); });
      const lfo = osc('sine', 0.09), lg = gain(0.25); lfo.connect(lg).connect(trem.gain); nodes.push(lfo);
      const n = src(noiseBuf('white', 3)); n.connect(filt('bandpass', 5200, 3)).connect(gain(0.04)).connect(out); nodes.push(n);
      return { out, level: 0.09, nodes };
    },
    // кабинет психолога: ровная вентиляция, далёкий гул корабля
    psych() {
      const out = gain(0), nodes = [];
      const n = src(noiseBuf('white', 4)), bp = filt('bandpass', 620, 0.6); n.connect(bp).connect(gain(0.28)).connect(out);
      const lfo = osc('sine', 0.05), lg = gain(90); lfo.connect(lg).connect(bp.frequency);
      const b = src(noiseBuf('brown', 4)); b.connect(filt('lowpass', 120)).connect(gain(0.5)).connect(out);
      const o = osc('sine', 60); o.connect(gain(0.05)).connect(out);
      nodes.push(n, lfo, b, o);
      return { out, level: 0.1, nodes };
    },
    // тьма: почти ничего — только очень низкий гул
    dark() {
      const out = gain(0), nodes = [];
      const o = osc('sine', 31); o.connect(gain(0.6)).connect(out);
      const b = src(noiseBuf('brown', 4)); b.connect(filt('lowpass', 90)).connect(gain(0.6)).connect(out);
      nodes.push(o, b);
      return { out, level: 0.12, nodes };
    },
  };
  function startAmbient(name, fade = 1.6) {
    if (!ac) return;
    if (amb && amb.name === name) return;
    const t = now();
    if (amb) {
      const old = amb;
      old.out.gain.cancelScheduledValues(t); old.out.gain.setValueAtTime(old.out.gain.value, t); old.out.gain.linearRampToValueAtTime(0, t + fade);
      setTimeout(() => { old.nodes.forEach(n => { try { n.stop(); } catch { /* */ } }); try { old.out.disconnect(); } catch { /* */ } if (old.cleanup) old.cleanup(); }, fade * 1000 + 150);
      amb = null;
    }
    if (!name || !AMBIENT[name]) return;
    const layer = AMBIENT[name]();
    layer.name = name; layer.out.connect(ambBus); layer.nodes.forEach(n => n.start());
    layer.out.gain.setValueAtTime(0, t); layer.out.gain.linearRampToValueAtTime(layer.level, t + fade);
    amb = layer;
  }

  // ---------- звуки событий ----------
  function syllable(at, f, vol, pan = 0) { tone({ f, f2: f * rand(0.8, 1.15), type: 'sawtooth', dur: rand(0.07, 0.13), vol, at, attack: 0.012, pan, filter: { type: 'bandpass', freq: rand(450, 1500), q: 5 } }); }
  const sfx = {
    click() { tone({ f: 180, f2: 65, dur: 0.09, vol: 0.1 }); noise({ type: 'highpass', freq: 2400, dur: 0.02, vol: 0.05 }); },
    key() { noise({ freq: rand(2500, 4200), q: 3, dur: 0.025, vol: 0.07 }); },
    beep(f = 1200, dur = 0.08, vol = 0.05) { tone({ f, type: 'square', dur, vol, attack: 0.002 }); },
    buzz() { tone({ f: 110, type: 'square', dur: 0.26, vol: 0.07 }); tone({ f: 116, type: 'square', dur: 0.26, vol: 0.05 }); },
    error() { tone({ f: 110, f2: 104, type: 'square', dur: 0.12, vol: 0.06 }); tone({ f: 98, f2: 92, type: 'square', dur: 0.16, vol: 0.06, at: 0.16 }); },
    success() { [440, 554.37, 659.25, 880].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.5, vol: 0.08, at: i * 0.07, rev: true })); },
    chime(f = 880, vol = 0.08) { tone({ f, dur: 1.3, vol, attack: 0.01, rev: true }); tone({ f: f * 2.01, dur: 0.8, vol: vol * 0.35 }); tone({ f: f * 1.5, dur: 1, vol: vol * 0.25, at: 0.08 }); },
    sign() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { tone({ f, dur: 1.6, vol: 0.07, at: i * 0.09, attack: 0.03, rev: true }); tone({ f: f / 2, type: 'triangle', dur: 1.2, vol: 0.03, at: i * 0.09, attack: 0.03 }); }); },
    heartbeat(vol = 0.5, at = 0) {
      tone({ f: 60, f2: 30, dur: 0.18, vol: Math.min(1, vol), at, attack: 0.006 });
      noise({ type: 'lowpass', freq: 150, dur: 0.1, vol: vol * 0.35, at });
      tone({ f: 52, f2: 26, dur: 0.2, vol: Math.min(1, vol * 0.7), at: at + 0.2, attack: 0.006 });
    },
    step(vol = 0.3, pan = 0, at = 0) { noise({ type: 'lowpass', freq: 520, f2: 110, dur: 0.2, vol, at, pan }); tone({ f: 78, f2: 44, dur: 0.13, vol: vol * 0.6, at, pan }); },
    steps(count = 3, total = 1.4, vol = 0.14) { for (let i = 0; i < count; i++) sfx.step(vol, rand(-0.3, 0.3), ((i + 1) * total) / (count + 1)); },
    creak(vol = 0.3, pan = 0) {
      if (!live()) return;
      const t0 = now(), o = osc('sawtooth', rand(150, 210)), fl = filt('bandpass', rand(700, 1100), 7), g = gain(0), lfo = osc('sine', rand(18, 32)), lg = gain(22);
      o.frequency.linearRampToValueAtTime(rand(95, 130), t0 + 0.6);
      lfo.connect(lg); lg.connect(o.frequency); envelope(g, t0, vol * 0.7, 0.03, 0.62);
      o.connect(fl); fl.connect(g); g.connect(dest(pan)); g.connect(verb);
      o.start(t0); lfo.start(t0); o.stop(t0 + 0.7); lfo.stop(t0 + 0.7);
    },
    /** металлический скрежет */
    scrape(vol = 0.2, pan = 0) {
      if (!live()) return;
      const t0 = now(), d = rand(0.6, 1.4), o = osc('sawtooth', rand(300, 520)), am = osc('square', rand(35, 70)), ag = gain(0.5), fl = filt('bandpass', rand(1400, 2600), 12), g = gain(0);
      o.frequency.linearRampToValueAtTime(rand(180, 400), t0 + d);
      am.connect(ag).connect(g.gain); o.connect(fl); fl.connect(g); g.connect(dest(pan)); g.connect(verb);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol * 0.5, t0 + 0.08); g.gain.linearRampToValueAtTime(0, t0 + d);
      o.start(t0); am.start(t0); o.stop(t0 + d + 0.05); am.stop(t0 + d + 0.05);
      noise({ type: 'bandpass', freq: 3200, q: 4, dur: d, vol: vol * 0.3, pan });
    },
    thud(vol = 0.45) { tone({ f: 95, f2: 34, dur: 0.38, vol }); noise({ type: 'lowpass', freq: 320, dur: 0.22, vol: vol * 0.6, rev: true }); },
    shot(vol = 0.7) {
      noise({ type: 'bandpass', freq: 1800, f2: 180, q: 0.7, dur: 0.42, vol, attack: 0.002, rev: true });
      noise({ type: 'lowpass', freq: 500, dur: 0.7, vol: vol * 0.6, attack: 0.002 });
      tone({ f: 120, f2: 30, dur: 0.4, vol: vol * 0.85, attack: 0.002 });
    },
    pop(vol = 0.32) { noise({ type: 'bandpass', freq: 2600, q: 0.8, dur: 0.08, vol, attack: 0.001 }); tone({ f: 420, f2: 110, dur: 0.07, vol: vol * 0.6, attack: 0.001 }); },
    gunfire(n = 5, vol = 0.3) { for (let i = 0; i < n; i++) noise({ type: 'bandpass', freq: 1400, f2: 300, q: 0.8, dur: 0.12, vol: vol * rand(0.6, 1), at: i * rand(0.07, 0.11), attack: 0.001, pan: rand(-0.6, 0.6) }); },
    barrage(dur = 2.4) { let t = 0; while (t < dur) { noise({ type: 'lowpass', freq: rand(4500, 8000), q: 0.5, dur: 0.5, vol: 0.45, at: t, rev: true }); tone({ f: rand(80, 110), f2: 22, dur: 0.4, vol: 0.4, at: t }); t += rand(0.06, 0.3); } },
    plasma(vol = 0.3) { tone({ f: 1800, f2: 90, type: 'sawtooth', dur: 0.35, vol: vol * 0.5, filter: { type: 'lowpass', freq: 3000 } }); noise({ type: 'highpass', freq: 3000, dur: 0.3, vol: vol * 0.4 }); },
    tear() { for (let i = 0; i < 16; i++) noise({ freq: rand(1800, 4200), q: 2.5, dur: rand(0.04, 0.08), vol: rand(0.08, 0.16), at: i * 0.055, attack: 0.002 }); },
    stamp() { tone({ f: 120, f2: 38, dur: 0.3, vol: 0.5, attack: 0.002 }); noise({ type: 'lowpass', freq: 900, dur: 0.1, vol: 0.35, attack: 0.001, rev: true }); },
    glitch(dur = 0.4) { const n = Math.max(4, Math.round(dur * 18)); for (let i = 0; i < n; i++) tone({ f: rand(180, 2400), type: 'square', dur: 0.03, vol: 0.045, at: i * (dur / n), attack: 0.001 }); noise({ freq: 1200, q: 8, dur, vol: 0.05 }); },
    whisper(dur = 1.4, vol = 0.1, pan = 0) { noise({ freq: rand(2800, 4200), q: 3, dur, vol, attack: dur * 0.35, pan, rev: true }); },
    mumble(dur = 1, pitch = 1, vol = 0.1, pan = 0) { if (!live()) return; let t = 0; while (t < dur) { syllable(t, rand(105, 175) * pitch, vol * rand(0.6, 1), pan); t += rand(0.1, 0.19); } },
    whoosh(vol = 0.15, rev = false) { noise({ freq: rev ? 2400 : 300, f2: rev ? 300 : 2400, q: 1.2, dur: 0.7, vol, attack: 0.25 }); },
    scare() {
      if (!live()) return;
      [311.1, 329.6, 466.2, 622.3, 698.5].forEach(f => tone({ f, type: 'sawtooth', dur: 1.8, vol: 0.05, attack: 0.01, filter: { type: 'lowpass', freq: 3000 }, rev: true }));
      tone({ f: 130, f2: 28, dur: 0.9, vol: 0.6 }); noise({ freq: 1600, q: 0.6, dur: 0.5, vol: 0.35, rev: true });
    },
    crack() { tone({ f: 150, f2: 40, dur: 0.3, vol: 0.55 }); for (let k = 0; k < 12; k++) tone({ f: rand(900, 5200), f2: 180, type: pick(['sawtooth', 'square', 'triangle']), dur: 0.08, vol: rand(0.05, 0.12), at: k * 0.06 }); noise({ freq: 2000, f2: 420, q: 0.7, dur: 0.9, vol: 0.3, rev: true }); },
    tick(loud = 0.5) { noise({ freq: 3200, q: 6, dur: 0.018, vol: 0.05 * loud }); tone({ f: 1900, f2: 1500, dur: 0.02, vol: 0.02 * loud }); },
    page() { noise({ type: 'highpass', freq: 1800, dur: 0.3, vol: 0.1 }); },
    book() { noise({ freq: 1100, q: 2.5, dur: 0.45, vol: 0.14, kind: 'brown', rev: true }); },
    drawer() { noise({ freq: 700, q: 3, dur: 0.55, vol: 0.22, kind: 'brown', attack: 0.1, rev: true }); tone({ f: 150, f2: 60, dur: 0.12, vol: 0.14, at: 0.58 }); },
    nail(snap = false) { if (snap) { noise({ freq: 3500, q: 4, dur: 0.06, vol: 0.14 }); tone({ f: 120, f2: 50, dur: 0.1, vol: 0.08 }); } else { tone({ f: 180, f2: 600, type: 'triangle', dur: 0.2, vol: 0.1, rev: true }); tone({ f: 2400, f2: 1200, type: 'square', dur: 0.04, vol: 0.05 }); } },
    radio(dur = 3) { noise({ freq: 1600, q: 0.8, dur, vol: 0.1, attack: 0.02 }); sfx.mumble(dur * 0.6, 1.2, 0.05); },
    system(up = true) {
      tone({ f: up ? 73.4 : 220, f2: up ? 220 : 73.4, type: 'square', dur: 2.2, vol: 0.05, attack: 0.8, filter: { type: 'lowpass', freq: up ? 900 : 500 }, rev: true });
      tone({ f: 32, f2: 26, dur: 2.2, vol: 0.14, attack: 0.9 });
    },
    hiss(dur = 1, vol = 0.12) { noise({ type: 'highpass', freq: 3000, dur, vol, attack: 0.05 }); },
    drip(pan = 0) { tone({ f: rand(900, 1500), f2: rand(300, 500), dur: 0.09, vol: 0.05, pan, rev: true }); },
    alarm(vol = 0.08) { for (let i = 0; i < 3; i++) tone({ f: 740, f2: 520, type: 'sawtooth', dur: 0.42, vol, at: i * 0.5, filter: { type: 'lowpass', freq: 2000 } }); },
    flat(dur = 1.4) { tone({ f: 1000, type: 'sine', dur, vol: 0.05, attack: 0.01 }); },
    morse(long = false) { tone({ f: 740, type: 'sine', dur: long ? 0.3 : 0.1, vol: 0.08, attack: 0.004 }); },
    ice(vol = 0.1) { for (let i = 0; i < 5; i++) tone({ f: rand(2000, 5200), f2: rand(900, 1800), type: 'triangle', dur: 0.05, vol: vol * rand(0.4, 1), at: i * rand(0.02, 0.06) }); noise({ type: 'highpass', freq: 5000, dur: 0.2, vol: vol * 0.5 }); },
    stim() { noise({ type: 'highpass', freq: 5000, dur: 0.12, vol: 0.1 }); tone({ f: 220, f2: 880, dur: 0.4, vol: 0.05, type: 'triangle', at: 0.1 }); },
    torch(dur = 0.6) { noise({ type: 'bandpass', freq: 900, q: 0.6, dur, vol: 0.16, attack: 0.05, kind: 'brown' }); noise({ type: 'highpass', freq: 4000, dur, vol: 0.05 }); },
    roar() { tone({ f: 70, f2: 40, type: 'sawtooth', dur: 1.2, vol: 0.18, filter: { type: 'lowpass', freq: 400 }, rev: true }); noise({ freq: 300, q: 1, dur: 1.1, vol: 0.2, kind: 'brown', rev: true }); },
    snow() { tone({ f: rand(1800, 2600), dur: 0.5, vol: 0.02, attack: 0.1, rev: true }); },
  };

  /** нарастающая жуть при взгляде в темноту; stop() — отвернулись */
  function dread(durSec = 14.7) {
    if (!live()) return { stop() {} };
    const t = now(), out = gain(0); out.connect(sfxBus); out.connect(verb);
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.35, t + durSec);
    const sub = osc('sine', 25); sub.connect(gain(0.7)).connect(out);
    const n = src(noiseBuf('brown', 4)), bp = filt('bandpass', 200, 1.5);
    bp.frequency.setValueAtTime(200, t); bp.frequency.linearRampToValueAtTime(1200, t + durSec);
    n.connect(bp).connect(gain(0.9)).connect(out);
    const wh = osc('sawtooth', 3000); wh.frequency.setValueAtTime(3000, t); wh.frequency.linearRampToValueAtTime(6000, t + durSec); wh.connect(gain(0.06)).connect(out);
    [sub, n, wh].forEach(x => x.start(t));
    let dead = false;
    return { stop(fade = 0.6) { if (dead) return; dead = true; const s = now(); out.gain.cancelScheduledValues(s); out.gain.setValueAtTime(out.gain.value, s); out.gain.linearRampToValueAtTime(0, s + fade); [sub, n, wh].forEach(x => { try { x.stop(s + fade + 0.05); } catch { /* */ } }); } };
  }
  /** нарастающий гул удержания */
  function rumble(durMs) {
    if (!live()) return { stop() {} };
    const t = now(), D = durMs / 1000, out = gain(0); out.connect(sfxBus);
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.5, t + 0.15); out.gain.linearRampToValueAtTime(0.9, t + D);
    const o1 = osc('sine', 25), o2 = osc('triangle', 35);
    o1.frequency.linearRampToValueAtTime(52, t + D); o2.frequency.linearRampToValueAtTime(72, t + D);
    o1.connect(gain(0.7)).connect(out); o2.connect(gain(0.35)).connect(out);
    const n = src(noiseBuf('brown', 4)), bp = filt('bandpass', 120, 1); bp.frequency.linearRampToValueAtTime(700, t + D); n.connect(bp).connect(gain(0.8)).connect(out);
    [o1, o2, n].forEach(x => x.start(t));
    let dead = false;
    return { stop() { if (dead) return; dead = true; const s = now(); out.gain.cancelScheduledValues(s); out.gain.setValueAtTime(out.gain.value, s); out.gain.linearRampToValueAtTime(0, s + 0.12); [o1, o2, n].forEach(x => { try { x.stop(s + 0.15); } catch { /* */ } }); } };
  }

  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend().catch(() => {}); else if (!held) ac.resume().catch(() => {});
  });
  const applyGain = () => { if (ac && master) master.gain.setTargetAtTime(enabled ? volume : 0, ac.currentTime, 0.06); };

  return {
    ensure, sfx, tone, noise, loopNoise, loopOsc, dread, rumble,
    unlock() { ensure(); },
    setAmbient(name, fade) { wanted = name; if (ac) startAmbient(name, fade); },
    setIntensity(v) { if (amb && amb.setIntensity) amb.setIntensity(clamp(v, 0, 1)); },
    setEnabled(v) { enabled = !!v; Settings.sound = enabled; Settings.save(); applyGain(); if (enabled) ensure(); },
    setVolume(v) { volume = clamp(v, 0, 1); Settings.vol = volume; Settings.save(); applyGain(); },
    isOn: () => enabled,
    /** пауза игры: весь звук замирает */
    hold(on) { held = !!on; if (!ac) return; if (held) ac.suspend().catch(() => {}); else if (!document.hidden) ac.resume().catch(() => {}); },
    time: () => (ac ? ac.currentTime : 0),
  };
})();
