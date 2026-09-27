/* ==========================================================================
   ЗВУКОВАЯ ШИНА (Web Audio API)
   master ─┬─ ambBus  (фоновые гулы сцен, кроссфейд)
           ├─ sfxBus  (события)
           └─ reverb  (общая реверберация)
   ========================================================================== */
const Audio47 = (() => {
  let ctx = null, master, ambBus, sfxBus, verb;
  let enabled = true;
  let amb = null;          // текущий фоновый слой
  let wanted = null;       // какой фон должен звучать (запомним до первого жеста)
  const cache = {};

  const live = () => !!ctx && enabled && ctx.state === 'running';
  const now = () => ctx.currentTime;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
    master = ctx.createGain(); master.gain.value = enabled ? 0.9 : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    ambBus = ctx.createGain(); ambBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    const conv = ctx.createConvolver(); conv.buffer = impulse(2.8, 2.3);
    verb = ctx.createGain(); verb.gain.value = 0.28; verb.connect(conv); conv.connect(master);
    return ctx;
  }

  // ---------- строительные блоки ----------
  const osc = (type, f) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; };
  const gain = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const filt = (type, f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const src = (buf, loop = true) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = loop; return s; };
  function noiseBuf(kind = 'white', sec = 2) {
    const key = kind + sec;
    if (cache[key]) return cache[key];
    const len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else d[i] = w;
    }
    return (cache[key] = b);
  }
  function impulse(sec, decay) {
    const len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * 0.5;
    }
    return b;
  }
  /** короткая огибающая: 0 → peak → 0.0001 */
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function burst(t, dur, { type = 'bandpass', f = 2000, q = 1, peak = 0.3, kind = 'white', to = sfxBus, rev = 0 } = {}) {
    const s = src(noiseBuf(kind, 2), false), fl = filt(type, f, q), g = gain(0);
    s.connect(fl).connect(g).connect(to);
    if (rev) g.connect(verb);
    env(g, t, 0.004, peak, dur);
    s.start(t, Math.random() * 0.7); s.stop(t + dur + 0.05);
    return fl;
  }
  function tone(t, type, f0, f1, dur, peak, { to = sfxBus, rev = false, a = 0.005 } = {}) {
    const o = osc(type, f0), g = gain(0);
    if (f1 && f1 !== f0) { o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); }
    o.connect(g).connect(to);
    if (rev) g.connect(verb);
    env(g, t, a, peak, dur);
    o.start(t); o.stop(t + a + dur + 0.05);
    return o;
  }

  // ---------- фоновые гулы по сценам ----------
  const AMBIENT = {
    // бланк — тихий гул кабинета
    contract() {
      const out = gain(0), nodes = [];
      const o1 = osc('sine', 45), o2 = osc('sine', 55.3);
      const lfo = osc('sine', 0.25), lg = gain(1.4);
      lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
      o1.connect(gain(0.5)).connect(out); o2.connect(gain(0.32)).connect(out);
      const n = src(noiseBuf('brown', 4)); n.connect(filt('highpass', 900)).connect(gain(0.2)).connect(out);
      nodes.push(o1, o2, lfo, n);
      return { out, level: 0.16, nodes };
    },
    // серая комната при отказе: гул ламп дневного света
    office() {
      const out = gain(0), nodes = [];
      const hum = osc('sawtooth', 50), hp = filt('bandpass', 100, 8); hum.connect(hp).connect(gain(0.25)).connect(out);
      const hum2 = osc('sine', 100); hum2.connect(gain(0.12)).connect(out);
      const n = src(noiseBuf('brown', 4)); n.connect(filt('lowpass', 400)).connect(gain(0.35)).connect(out);
      nodes.push(hum, hum2, n);
      return { out, level: 0.14, nodes };
    },
    // комната — биения низких частот + дыхание шума + скрипы
    room() {
      const out = gain(0), nodes = [];
      [38.5, 41.2, 57.8].forEach((f, i) => { const o = osc('sine', f); o.connect(gain(i === 2 ? 0.35 : 1)).connect(out); nodes.push(o); });
      const n = src(noiseBuf('brown', 4)), lp = filt('lowpass', 180);
      n.connect(lp).connect(gain(0.9)).connect(out); nodes.push(n);
      const lfo = osc('sine', 0.07), lg = gain(90); lfo.connect(lg).connect(lp.frequency); nodes.push(lfo);
      let t = setTimeout(function creak() { if (live()) sfx.creak(0.35); t = setTimeout(creak, rand(8000, 17000)); }, 6000);
      return { out, level: 0.22, nodes, cleanup: () => clearTimeout(t) };
    },
    // архив в терминале — давящий гул; плотнее с каждой главой
    reader() {
      const out = gain(0), nodes = [];
      const lp = filt('lowpass', 150, 2), trem = gain(0.75);
      const s1 = osc('sawtooth', 32.7), s2 = osc('sawtooth', 49.1); s2.detune.value = 9;
      s1.connect(gain(0.5)).connect(lp); s2.connect(gain(0.3)).connect(lp);
      lp.connect(trem).connect(out);
      const lfo = osc('sine', 0.11), lg = gain(0.22); lfo.connect(lg).connect(trem.gain);
      const n = src(noiseBuf('brown', 4)), nlp = filt('lowpass', 300), ng = gain(0.5);
      n.connect(nlp).connect(ng).connect(out);
      nodes.push(s1, s2, lfo, n);
      return {
        out, level: 0.24, nodes,
        setIntensity(v) { const t = now(); lp.frequency.setTargetAtTime(150 + v * 520, t, 0.6); ng.gain.setTargetAtTime(0.5 + v * 0.9, t, 0.6); },
      };
    },
    // 47 нажатий — пульсирующий: амплитуда качается как сердце
    clicks() {
      const out = gain(0), nodes = [];
      const o = osc('sawtooth', 45), s = osc('sine', 60), lp = filt('lowpass', 130, 4), pul = gain(0.32);
      o.connect(lp); s.connect(gain(0.7)).connect(lp); lp.connect(pul).connect(out);
      const lfo = osc('sine', 1.15), lg = gain(0.3); lfo.connect(lg).connect(pul.gain);
      const n = src(noiseBuf('brown', 4)); n.connect(filt('lowpass', 150)).connect(gain(0.6)).connect(out);
      nodes.push(o, s, lfo, n);
      return {
        out, level: 0.3, nodes,
        setIntensity(v) { const t = now(); lfo.frequency.setTargetAtTime(1.15 + v * 1.4, t, 0.3); lp.frequency.setTargetAtTime(130 + v * 260, t, 0.3); },
      };
    },
    // разбитие — рёв: растёт при удержании
    break() {
      const out = gain(0), nodes = [];
      const n = src(noiseBuf('white', 3)), bp = filt('bandpass', 180, 1.2), ng = gain(0.3);
      n.connect(bp).connect(ng).connect(out);
      const b = src(noiseBuf('brown', 4)); b.connect(filt('lowpass', 220)).connect(gain(1.2)).connect(out);
      const sub = osc('sawtooth', 29), slp = filt('lowpass', 90, 3), sg = gain(0.5);
      sub.connect(slp).connect(sg).connect(out);
      const lfo = osc('sine', 0.3), lg = gain(60); lfo.connect(lg).connect(bp.frequency);
      nodes.push(n, b, sub, lfo);
      return {
        out, level: 0.3, nodes,
        setIntensity(v) { const t = now(); ng.gain.setTargetAtTime(0.3 + v * 1.3, t, 0.15); bp.frequency.setTargetAtTime(180 + v * 520, t, 0.2); sg.gain.setTargetAtTime(0.5 + v * 0.9, t, 0.2); sub.frequency.setTargetAtTime(29 + v * 22, t, 0.3); },
      };
    },
    // пробуждение — светлый, но неустойчивый аккорд (sus2)
    ending() {
      const out = gain(0), nodes = [];
      const trem = gain(0.75); trem.connect(out);
      [[110, 0.35], [220, 0.5], [329.63, 0.32], [493.88, 0.18]].forEach(([f, v]) => { const o = osc('sine', f); o.detune.value = rand(-5, 5); o.connect(gain(v)).connect(trem); nodes.push(o); });
      const lfo = osc('sine', 0.09), lg = gain(0.25); lfo.connect(lg).connect(trem.gain); nodes.push(lfo);
      const n = src(noiseBuf('white', 3)); n.connect(filt('bandpass', 5200, 3)).connect(gain(0.04)).connect(out); nodes.push(n);
      return { out, level: 0.09, nodes };
    },
    // кабинет психолога — ровная вентиляция, далёкий гул корабля, ничего лишнего
    psych() {
      const out = gain(0), nodes = [];
      const n = src(noiseBuf('white', 4)), bp = filt('bandpass', 620, 0.6); n.connect(bp).connect(gain(0.28)).connect(out);
      const lfo = osc('sine', 0.05), lg = gain(90); lfo.connect(lg).connect(bp.frequency);
      const b = src(noiseBuf('brown', 4)); b.connect(filt('lowpass', 120)).connect(gain(0.5)).connect(out);
      const o = osc('sine', 60); o.connect(gain(0.05)).connect(out);
      nodes.push(n, lfo, b, o);
      return { out, level: 0.1, nodes };
    },
  };

  function startAmbient(name, fade = 1.6) {
    if (!ctx) return;
    if (amb && amb.name === name) return;
    const t = now();
    if (amb) {
      const old = amb;
      old.out.gain.cancelScheduledValues(t);
      old.out.gain.setValueAtTime(old.out.gain.value, t);
      old.out.gain.linearRampToValueAtTime(0, t + fade);
      setTimeout(() => { old.nodes.forEach(n => { try { n.stop(); } catch { /* */ } }); try { old.out.disconnect(); } catch { /* */ } old.cleanup && old.cleanup(); }, fade * 1000 + 120);
      amb = null;
    }
    if (!name || !AMBIENT[name]) return;
    const layer = AMBIENT[name]();
    layer.name = name;
    layer.out.connect(ambBus);
    layer.nodes.forEach(n => n.start());
    layer.out.gain.setValueAtTime(0, t);
    layer.out.gain.linearRampToValueAtTime(layer.level, t + fade);
    amb = layer;
  }

  // ---------- звуки событий ----------
  const sfx = {
    click() {
      if (!live()) return; const t = now();
      tone(t, 'sine', 180, 65, 0.1, 0.12);
      burst(t, 0.02, { type: 'highpass', f: 2400, peak: 0.06 });
    },
    key() {
      if (!live()) return; const t = now();
      burst(t, 0.025, { f: rand(2500, 4200), q: 3, peak: 0.08 });
    },
    whoosh(dur = 0.9, reverse = false) {
      if (!live()) return; const t = now();
      const s = src(noiseBuf('brown', 2), false), bp = filt('bandpass', reverse ? 1300 : 260, 1.2), g = gain(0);
      bp.frequency.setValueAtTime(reverse ? 1300 : 260, t); bp.frequency.exponentialRampToValueAtTime(reverse ? 260 : 1300, t + dur);
      s.connect(bp).connect(g).connect(sfxBus);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.28, t + dur * 0.4); g.gain.linearRampToValueAtTime(0, t + dur);
      s.start(t); s.stop(t + dur + 0.05);
    },
    // мягкий подтверждающий аккорд (подпись)
    sign() {
      if (!live()) return; const t = now();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone(t + i * 0.09, 'sine', f, f, 1.6, 0.07, { rev: true, a: 0.03 });
        tone(t + i * 0.09, 'triangle', f / 2, f / 2, 1.2, 0.03, { a: 0.03 });
      });
    },
    stamp() {
      if (!live()) return; const t = now();
      tone(t, 'sine', 110, 38, 0.35, 0.5);
      burst(t, 0.12, { type: 'lowpass', f: 600, peak: 0.35, rev: 1 });
    },
    creak(vol = 0.5) {
      if (!live()) return; const t = now(); const d = rand(0.8, 1.6);
      const o = osc('sawtooth', rand(60, 90)), bp = filt('bandpass', rand(500, 900), 14), g = gain(0);
      o.frequency.setValueAtTime(o.frequency.value, t); o.frequency.linearRampToValueAtTime(rand(95, 140), t + d);
      const am = osc('square', rand(18, 32)), ag = gain(0.5); am.connect(ag).connect(g.gain);
      o.connect(bp).connect(g).connect(sfxBus); g.connect(verb);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18 * vol, t + 0.2); g.gain.linearRampToValueAtTime(0, t + d);
      o.start(t); am.start(t); o.stop(t + d + 0.1); am.stop(t + d + 0.1);
    },
    whisper(dur = 1.6) {
      if (!live()) return; const t = now();
      const len = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) { const s = i / ctx.sampleRate; d[i] = (Math.random() * 2 - 1) * (0.4 + 0.6 * Math.abs(Math.sin(s * 17) + Math.sin(s * 3.3) * 0.5)); }
      const s = src(b, false), bp = filt('bandpass', 950, 4), g = gain(0);
      s.connect(bp).connect(g).connect(sfxBus); g.connect(verb);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.start(t); s.stop(t + dur);
    },
    // резкий «скример»: диссонансный кластер + провал в суббас
    scare() {
      if (!live()) return; const t = now();
      const lp = filt('lowpass', 5000, 1), g = gain(0);
      lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(500, t + 1.8);
      lp.connect(g).connect(sfxBus); g.connect(verb);
      env(g, t, 0.01, 0.34, 1.9);
      [311.1, 329.6, 466.2, 622.3, 698.5].forEach(f => { const o = osc('sawtooth', f); o.detune.value = rand(-25, 25); o.connect(lp); o.start(t); o.stop(t + 2); });
      tone(t, 'sine', 130, 28, 0.9, 0.6);
      burst(t, 0.5, { f: 1600, q: 0.6, peak: 0.4, rev: 1 });
    },
    // сердце: «тук-тук», громче к 47-му нажатию
    heartbeat(vol = 0.6) {
      if (!live()) return; const t = now();
      tone(t, 'sine', 58, 26, 0.2, Math.min(1, vol * 0.9));
      tone(t + 0.15, 'sine', 48, 21, 0.2, Math.min(1, vol * 0.6));
      burst(t, 0.03, { type: 'lowpass', f: 900, peak: vol * 0.35 });
    },
    glitch(dur = 1.6) {
      if (!live()) return; const t = now();
      [[400, 4, 5.5, 0.1], [1200, 8, 17, 0.08], [3200, 12, 3.2, 0.06], [88, 1, 12, 0.14]].forEach(([f, q, rate, v]) => {
        const s = src(noiseBuf('white', 3), false), bp = filt('bandpass', f, q), g = gain(v);
        const am = osc('square', rate), ag = gain(v * 0.7); am.connect(ag).connect(g.gain);
        s.connect(bp).connect(g).connect(sfxBus);
        g.gain.setTargetAtTime(0, t + dur * 0.8, 0.1);
        s.start(t); am.start(t); s.stop(t + dur + 0.3); am.stop(t + dur + 0.3);
      });
    },
    success() {
      if (!live()) return; const t = now();
      [440, 554.37, 659.25, 880].forEach((f, i) => tone(t + i * 0.07, 'triangle', f, f, 0.5, 0.08, { rev: true }));
    },
    error() {
      if (!live()) return; const t = now();
      tone(t, 'square', 110, 104, 0.12, 0.06); tone(t + 0.16, 'square', 98, 92, 0.16, 0.06);
    },
    shot() {
      if (!live()) return; const t = now();
      burst(t, 1.1, { type: 'lowpass', f: 5000, q: 0.5, peak: 0.7, rev: 1 });
      tone(t, 'sine', 95, 26, 0.5, 0.8);
    },
    // стекло: глухой удар + россыпь трелей + шипящий хвост
    crack() {
      if (!live()) return; const t = now();
      tone(t, 'sine', 150, 40, 0.3, 0.55);
      for (let k = 0; k < 12; k++) {
        const tt = t + k * 0.06 + Math.random() * 0.02;
        tone(tt, ['sawtooth', 'square', 'triangle'][k % 3], rand(900, 5200), 180, 0.08, rand(0.05, 0.14));
      }
      const fl = burst(t, 0.9, { f: 2000, q: 0.7, peak: 0.35, rev: 1 });
      fl.frequency.setValueAtTime(2000, t); fl.frequency.exponentialRampToValueAtTime(420, t + 0.9);
    },
    // часы за стеной
    tick(loud = 0.5) {
      if (!live()) return; const t = now();
      burst(t, 0.018, { type: 'bandpass', f: 3200, q: 6, peak: 0.05 * loud });
      tone(t, 'sine', 1900, 1500, 0.02, 0.02 * loud);
    },
    // удар кулаком по столу / по стеклу
    thud(v = 1) {
      if (!live()) return; const t = now();
      tone(t, 'sine', 90, 40, 0.28, 0.5 * v);
      burst(t, 0.09, { type: 'lowpass', f: 700, peak: 0.3 * v, rev: 1 });
    },
    // клавиша терминала
    beep(f = 1100) {
      if (!live()) return; const t = now();
      tone(t, 'square', f, f, 0.07, 0.035, { a: 0.002 });
    },
    page() {
      if (!live()) return; const t = now();
      burst(t, 0.3, { type: 'highpass', f: 1800, peak: 0.12 });
    },
    // шаги при подходе/отходе (как во «втором номере»)
    steps(count = 3, total = 1.4) {
      if (!live()) return;
      for (let i = 0; i < count; i++) {
        const t = now() + ((i + 1) * total) / (count + 1);
        tone(t, 'sine', rand(70, 90), 40, 0.12, 0.09, { rev: true });
        burst(t, 0.05, { f: rand(800, 1200), q: 1.2, peak: 0.05 });
      }
    },
    // вход/выход из терминала: свип фильтра + суббас
    system(up = true) {
      if (!live()) return; const t = now(), D = 2.4;
      const fl = filt('lowpass', up ? 220 : 2400, 16), g = gain(0);
      fl.frequency.setValueAtTime(up ? 220 : 2400, t); fl.frequency.exponentialRampToValueAtTime(up ? 2400 : 220, t + D);
      fl.connect(g).connect(sfxBus); g.connect(verb);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + D * 0.5); g.gain.linearRampToValueAtTime(0, t + D);
      const f0 = up ? 73.4 : 220;
      [f0, f0 * Math.SQRT2, f0 * 1.498].forEach((fr, i) => {
        const o = osc(i === 2 ? 'sawtooth' : 'square', fr);
        o.frequency.setValueAtTime(fr, t); o.frequency.exponentialRampToValueAtTime(fr * (up ? 3 : 1 / 3), t + D);
        o.connect(gain(i === 2 ? 0.35 : 0.7)).connect(fl); o.start(t); o.stop(t + D + 0.1);
      });
      tone(t, 'sine', 32, 26, D, 0.16, { a: D * 0.4 });
    },
    // очередь выстрелов (отряд охраны)
    barrage(dur = 2.4) {
      if (!live()) return;
      let t = now(); const end = t + dur;
      while (t < end) {
        burst(t, 0.5, { type: 'lowpass', f: rand(4500, 8000), q: 0.5, peak: 0.5, rev: 1 });
        tone(t, 'sine', rand(80, 110), 22, 0.4, 0.45);
        t += rand(0.06, 0.32);
      }
    },
    drawer() {
      if (!live()) return; const t = now();
      const s = src(noiseBuf('brown', 2), false), bp = filt('bandpass', 700, 3), g = gain(0);
      s.connect(bp).connect(g).connect(sfxBus); g.connect(verb);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.3, t + 0.1); g.gain.linearRampToValueAtTime(0.15, t + 0.42); g.gain.linearRampToValueAtTime(0, t + 0.6);
      s.start(t); s.stop(t + 0.65);
      tone(t + 0.6, 'sine', 150, 60, 0.12, 0.14);
    },
    book() {
      if (!live()) return; const t = now();
      burst(t, 0.45, { f: 1100, q: 2.5, peak: 0.16, kind: 'brown', rev: 1 });
    },
    nail(snap = false) {
      if (!live()) return; const t = now();
      if (snap) { burst(t, 0.06, { f: 3500, q: 4, peak: 0.14 }); tone(t, 'sine', 120, 50, 0.1, 0.08); }
      else { tone(t, 'triangle', 180, 600, 0.2, 0.1, { rev: true }); tone(t, 'square', 2400, 1200, 0.04, 0.05); }
    },
    // рация: треск и обрывки «голоса»
    radio(dur = 3) {
      if (!live()) return; const t = now();
      const s = src(noiseBuf('white', 3), false), bp = filt('bandpass', 1600, 0.8), g = gain(0.14);
      const am = osc('sine', 8), ag = gain(0.09); am.connect(ag).connect(g.gain);
      s.connect(bp).connect(g).connect(sfxBus);
      g.gain.setTargetAtTime(0, t + dur - 0.3, 0.1);
      s.start(t); am.start(t); s.stop(t + dur); am.stop(t + dur);
      [0.7, 2.1].forEach((off, k) => {
        [320, 700, 1200].forEach((f, i) => {
          const o = osc('sine', f), vb = osc('sine', 4 + i * 1.5), vg = gain(40), og = gain(0);
          vb.connect(vg).connect(o.frequency); o.connect(og).connect(sfxBus);
          const s0 = t + off, d = k ? 0.8 : 1.3;
          og.gain.setValueAtTime(0, s0); og.gain.linearRampToValueAtTime(0.025, s0 + 0.08); og.gain.linearRampToValueAtTime(0, s0 + d);
          o.start(s0); vb.start(s0); o.stop(s0 + d); vb.stop(s0 + d);
        });
      });
    },
    // невнятная «речь» силуэтов (реплики в сцене отказа)
    mumble(dur = 1, pitch = 1) {
      if (!live()) return; const t = now();
      [300, 650, 1100].forEach((f, i) => {
        const o = osc('sawtooth', f * pitch * 0.5), bp = filt('bandpass', f * pitch, 6), g = gain(0);
        const am = osc('sine', rand(5, 9)), ag = gain(0.02); am.connect(ag).connect(g.gain);
        o.connect(bp).connect(g).connect(sfxBus); g.connect(verb);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03 - i * 0.006, t + 0.05); g.gain.linearRampToValueAtTime(0, t + dur);
        o.start(t); am.start(t); o.stop(t + dur); am.stop(t + dur);
      });
    },
  };

  /** нарастающая «жуть» при взгляде в темноту; stop() — отвернулись */
  function dread(durSec = 14.7) {
    if (!live()) return { stop() {} };
    const t = now();
    const out = gain(0); out.connect(sfxBus); out.connect(verb);
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.35, t + durSec);
    const sub = osc('sine', 25); sub.connect(gain(0.7)).connect(out);
    const n = src(noiseBuf('brown', 4)), bp = filt('bandpass', 200, 1.5);
    bp.frequency.setValueAtTime(200, t); bp.frequency.linearRampToValueAtTime(1200, t + durSec);
    n.connect(bp).connect(gain(0.9)).connect(out);
    const wh = osc('sawtooth', 3000); wh.frequency.setValueAtTime(3000, t); wh.frequency.linearRampToValueAtTime(6000, t + durSec);
    wh.connect(gain(0.08)).connect(out);
    [sub, n, wh].forEach(x => x.start(t));
    return {
      stop(fade = 0.6) {
        const s = now();
        out.gain.cancelScheduledValues(s); out.gain.setValueAtTime(out.gain.value, s); out.gain.linearRampToValueAtTime(0, s + fade);
        [sub, n, wh].forEach(x => { try { x.stop(s + fade + 0.05); } catch { /* */ } });
      },
    };
  }

  /** нарастающий гул удержания; stop() — отпустили */
  function rumble(durMs) {
    if (!live()) return { stop() {} };
    const t = now(), D = durMs / 1000;
    const out = gain(0); out.connect(sfxBus);
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.5, t + 0.15); out.gain.linearRampToValueAtTime(0.9, t + D);
    const o1 = osc('sine', 25), o2 = osc('triangle', 35);
    o1.frequency.setValueAtTime(25, t); o2.frequency.setValueAtTime(35, t); o1.frequency.linearRampToValueAtTime(52, t + D); o2.frequency.linearRampToValueAtTime(72, t + D);
    o1.connect(gain(0.7)).connect(out); o2.connect(gain(0.35)).connect(out);
    const n = src(noiseBuf('brown', 4)), bp = filt('bandpass', 120, 1);
    bp.frequency.setValueAtTime(120, t); bp.frequency.linearRampToValueAtTime(700, t + D);
    n.connect(bp).connect(gain(0.8)).connect(out);
    [o1, o2, n].forEach(x => x.start(t));
    return {
      stop() {
        const s = now();
        out.gain.cancelScheduledValues(s); out.gain.setValueAtTime(out.gain.value, s); out.gain.linearRampToValueAtTime(0, s + 0.12);
        [o1, o2, n].forEach(x => { try { x.stop(s + 0.15); } catch { /* */ } });
      },
    };
  }

  function setEnabled(v) {
    enabled = !!v;
    Store.set(KEYS.audio, enabled);
    if (ctx) {
      master.gain.setTargetAtTime(enabled ? 0.9 : 0, now(), 0.06);
      if (enabled && ctx.state === 'suspended') ctx.resume();
    }
  }

  let held = false;          // пауза игры: звук заморожен
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (!held) ctx.resume();
  });

  return {
    /** вызвать из обработчика жеста пользователя */
    unlock() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      if (wanted && (!amb || amb.name !== wanted)) startAmbient(wanted);
    },
    setAmbient(name, fade) { wanted = name; if (ctx) startAmbient(name, fade); },
    setIntensity(v) { if (amb && amb.setIntensity) amb.setIntensity(clamp(v, 0, 1)); },
    setEnabled, isEnabled: () => enabled,
    /** пауза игры: заморозить все звуки и фоны; false — продолжить */
    hold(on) { held = !!on; if (!ctx) return; if (held) ctx.suspend(); else if (!document.hidden) ctx.resume(); },
    rumble, dread, sfx,
    /** общий контекст и шина событий — для звука мини-игр */
    raw() { if (!ensure()) return null; return { ctx, out: sfxBus, verb }; },
    live,
  };
})();
window.Audio47 = Audio47;
