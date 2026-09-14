export const Audio = (() => {
  let ctx = null, drone = null, enabled = true, started = false;
  let master = null, reverbNode = null, dreadState = null;

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      const irLen = Math.floor(ctx.sampleRate * 3.0);
      const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < irLen; i++) {
          const decay = Math.pow(1 - i / irLen, 2.4);
          d[i] = (Math.random() * 2 - 1) * decay * 0.55;
        }
      }
      reverbNode = ctx.createConvolver();
      reverbNode.buffer = ir;
      const rg = ctx.createGain();
      rg.gain.value = 0.32;
      reverbNode.connect(rg);
      rg.connect(ctx.destination);
    } catch (e) { console.warn('Audio init failed:', e); }
  }

  function resume() {
    init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function startDrone() {
    if (!enabled || started || !ctx) return;
    started = true;
    const out = ctx.createGain();
    out.gain.value = 0.0;
    out.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 4);
    out.connect(master);
    const oscs = [38.5, 41.2, 57.8].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.35 : 1.0;
      o.connect(g); g.connect(out); o.start();
      return o;
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.15;
    lfo.connect(lfoG);
    const bufSize = 4 * ctx.sampleRate;
    const nbuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const nd = nbuf.getChannelData(0);
    let lv = 0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      lv = (lv + 0.02 * w) / 1.02;
      nd[i] = lv * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = nbuf; noise.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = 'lowpass'; nf.frequency.value = 180; nf.Q.value = 0.7;
    const ng = ctx.createGain(); ng.gain.value = 0.25;
    noise.connect(nf); nf.connect(ng); ng.connect(out);
    lfoG.connect(nf.frequency); lfo.start(); noise.start();
    drone = { out, oscs, lfo, noise };
  }

  function setEnabled(v) {
    enabled = v;
    if (master) master.gain.value = v ? 0.9 : 0;
  }
  function isEnabled() { return enabled; }

  function click() {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + 0.16);
  }

  function navClick() {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1200, t);
    o.frequency.exponentialRampToValueAtTime(320, t + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.08);
  }

  function hover() {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(3200, t);
    o.frequency.exponentialRampToValueAtTime(4200, t + 0.04);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.012, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.07);
  }

  function whoosh(duration = 0.8, reverse = false) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const bs = Math.floor(ctx.sampleRate * duration);
    const nb = ctx.createBuffer(1, bs, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bs; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.03 * w) / 1.03;
      nd[i] = last * 4;
    }
    const src = ctx.createBufferSource(); src.buffer = nb;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.12, t + duration * 0.4);
    env.gain.linearRampToValueAtTime(0, t + duration);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 1.2;
    const f0 = reverse ? 1400 : 250;
    const f1 = reverse ? 250 : 1400;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + duration);
    src.connect(bp); bp.connect(env); env.connect(master);
    src.start(t); src.stop(t + duration);
  }

  function systemTransition(up = true) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const D = 2.6;
    const outBus = ctx.createGain();
    outBus.gain.value = 0.55;
    outBus.connect(master);
    if (reverbNode) outBus.connect(reverbNode);
    const f0 = up ? 73.4 : 220.0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(up ? 220 : 2400, t);
    filter.frequency.exponentialRampToValueAtTime(up ? 2400 : 220, t + D);
    filter.Q.value = 18;
    const filterGain = ctx.createGain();
    filterGain.gain.setValueAtTime(0, t);
    filterGain.gain.linearRampToValueAtTime(0.10, t + D * 0.5);
    filterGain.gain.linearRampToValueAtTime(0.0, t + D);
    filter.connect(filterGain); filterGain.connect(outBus);
    [f0, f0 * Math.SQRT2, f0 * Math.pow(2, 1/12) * Math.SQRT2].forEach((fr, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? 'sawtooth' : 'square';
      o.frequency.setValueAtTime(fr, t);
      o.frequency.exponentialRampToValueAtTime(fr * (up ? 3 : 1/3) * (1 + i * 0.005), t + D);
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.35 : 0.7;
      o.connect(g); g.connect(filter);
      o.start(t); o.stop(t + D + 0.1);
    });
    const sub = ctx.createOscillator();
    sub.type = 'sine'; sub.frequency.value = 28;
    const vib = ctx.createOscillator(); vib.type = 'sine'; vib.frequency.value = 8.2;
    const vibG = ctx.createGain(); vibG.gain.value = 5.5;
    vib.connect(vibG); vibG.connect(sub.frequency);
    vib.start(t); vib.stop(t + D + 0.1);
    const subG = ctx.createGain();
    subG.gain.setValueAtTime(0, t);
    subG.gain.linearRampToValueAtTime(0.18, t + D * 0.4);
    subG.gain.exponentialRampToValueAtTime(0.001, t + D);
    sub.connect(subG); subG.connect(outBus);
    sub.start(t); sub.stop(t + D + 0.1);
  }

  function whisper(dur = 1.4) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const bs = Math.floor(ctx.sampleRate * dur);
    const nb = ctx.createBuffer(1, bs, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < bs; i++) {
      const i_s = i / ctx.sampleRate;
      const mod = 0.4 + 0.6 * Math.abs(Math.sin(i_s * 17) + Math.sin(i_s * 3.3) * 0.5);
      nd[i] = (Math.random() * 2 - 1) * mod;
    }
    const ns = ctx.createBufferSource(); ns.buffer = nb;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    ns.connect(bp); bp.connect(g); g.connect(master);
    if (reverbNode) g.connect(reverbNode);
    ns.start(t); ns.stop(t + dur);
  }

  function stringTension() {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const D = 0.55;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(380, t + D);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(1400, t + D);
    bp.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + D);
    o.connect(bp); bp.connect(g); g.connect(master);
    if (reverbNode) g.connect(reverbNode);
    o.start(t); o.stop(t + D + 0.05);
  }

  function nailClick() {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(2400, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.04);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.06);
  }

  function pageTurn() {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const D = 0.35;
    const bs = Math.floor(ctx.sampleRate * D);
    const nb = ctx.createBuffer(1, bs, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < bs; i++) {
      const p = i / bs;
      const crack = Math.exp(-Math.pow((p - 0.15) * 18, 2)) + Math.exp(-Math.pow((p - 0.7) * 22, 2));
      nd[i] = (Math.random() * 2 - 1) * (0.15 + crack * 0.9);
    }
    const ns = ctx.createBufferSource(); ns.buffer = nb;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + D);
    ns.connect(hp); hp.connect(g); g.connect(master);
    if (reverbNode) g.connect(reverbNode);
    ns.start(t); ns.stop(t + D);
  }

  function barrage(duration = 5.0) {
    if (!enabled || !ctx) return duration;
    const t0 = ctx.currentTime;
    let t = t0;
    while (t - t0 < duration) {
      const interval = 0.05 + Math.random() * 0.35;
      const bs = Math.floor(ctx.sampleRate * 0.6);
      const nb = ctx.createBuffer(1, bs, ctx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let i = 0; i < bs; i++) { const p = i / bs; nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - p, 2.6); }
      const ns = ctx.createBufferSource(); ns.buffer = nb;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(5000 + Math.random() * 3000, t);
      lp.frequency.exponentialRampToValueAtTime(300, t + 0.6);
      const g = ctx.createGain(); g.gain.value = 0.5;
      ns.connect(lp); lp.connect(g); g.connect(master);
      if (reverbNode) g.connect(reverbNode);
      ns.start(t); ns.stop(t + 0.6);
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(80 + Math.random() * 30, t);
      sub.frequency.exponentialRampToValueAtTime(22, t + 0.35);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0, t);
      sg.gain.linearRampToValueAtTime(0.45, t + 0.005);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      sub.connect(sg); sg.connect(master);
      sub.start(t); sub.stop(t + 0.5);
      t += interval;
    }
    return duration;
  }

  function interference(duration = 3.2) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0.4;
    out.connect(master);
    const layers = [
      { f: 400,  q: 4, rate: 5.5, gain: 0.10 },
      { f: 1200, q: 8, rate: 17,  gain: 0.08 },
      { f: 3200, q: 12, rate: 3.2, gain: 0.06 },
      { f: 88,   q: 1, rate: 12,  gain: 0.14 },
    ];
    layers.forEach(L => {
      const bs = Math.floor(ctx.sampleRate * duration);
      const nb = ctx.createBuffer(1, bs, ctx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let i = 0; i < bs; i++) nd[i] = Math.random() * 2 - 1;
      const ns = ctx.createBufferSource(); ns.buffer = nb;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = L.f; bp.Q.value = L.q;
      const g = ctx.createGain(); g.gain.value = L.gain;
      const am = ctx.createOscillator();
      am.frequency.value = L.rate;
      const amG = ctx.createGain(); amG.gain.value = L.gain * 0.6;
      am.connect(amG); amG.connect(g.gain);
      am.start(t); am.stop(t + duration);
      ns.connect(bp); bp.connect(g); g.connect(out);
      ns.start(t); ns.stop(t + duration);
    });
  }

  function dreadRamp(duration, { onDone } = {}) {
    if (!enabled || !ctx) { if (onDone) setTimeout(onDone, duration * 1000); return; }
    const t = ctx.currentTime;
    const outBus = ctx.createGain();
    outBus.gain.value = 0.0;
    outBus.connect(master);
    if (reverbNode) outBus.connect(reverbNode);
    const freqs = [24.5, 32.7, 47.1, 61.7];
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      o.detune.value = (i - 1) * 7;
      const g = ctx.createGain();
      g.gain.value = i === 3 ? 0.22 : 1.0;
      o.connect(g); g.connect(outBus);
      o.start(t);
      return o;
    });
    const nLen = Math.floor(ctx.sampleRate * duration);
    const nbuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
    const nd = nbuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < nLen; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.015 * w) / 1.015;
      nd[i] = last * 5;
    }
    const ns = ctx.createBufferSource();
    ns.buffer = nbuf; ns.loop = true;
    const nbp = ctx.createBiquadFilter();
    nbp.type = 'bandpass'; nbp.frequency.value = 320; nbp.Q.value = 1.5;
    const nG = ctx.createGain(); nG.gain.value = 0;
    ns.connect(nbp); nbp.connect(nG); nG.connect(outBus);
    ns.start(t);
    outBus.gain.setValueAtTime(0, t);
    outBus.gain.linearRampToValueAtTime(0.16, t + duration);
    nG.gain.setValueAtTime(0, t);
    nG.gain.linearRampToValueAtTime(0.14, t + duration);
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.5, t);
    lfo.frequency.linearRampToValueAtTime(3.5, t + duration);
    const lfoG = ctx.createGain();
    lfoG.gain.value = 3.5;
    lfo.connect(lfoG);
    oscs.forEach(o => lfoG.connect(o.frequency));
    lfo.start(t);
    if (onDone) setTimeout(() => { if (dreadState) onDone(); }, duration * 1000);
    dreadState = { outBus, oscs, ns, lfo, nG };
  }

  function stopDreadRamp(fade = 1.2) {
    if (!dreadState || !ctx) return;
    const t = ctx.currentTime;
    const ds = dreadState;
    dreadState = null;
    try {
      ds.outBus.gain.cancelScheduledValues(t);
      ds.outBus.gain.setValueAtTime(ds.outBus.gain.value, t);
      ds.outBus.gain.linearRampToValueAtTime(0, t + fade);
      ds.nG.gain.cancelScheduledValues(t);
      ds.nG.gain.setValueAtTime(ds.nG.gain.value, t);
      ds.nG.gain.linearRampToValueAtTime(0, t + fade);
      setTimeout(() => {
        try { ds.oscs.forEach(o => o.stop()); ds.ns.stop(); ds.lfo.stop(); } catch (e) {}
      }, fade * 1000 + 50);
    } catch (e) {}
  }

  return {
    init, resume, startDrone, setEnabled, isEnabled,
    click, navClick, hover, whoosh, systemTransition, whisper,
    stringTension, nailClick, pageTurn, barrage, interference,
    dreadRamp, stopDreadRamp,
  };
})();
