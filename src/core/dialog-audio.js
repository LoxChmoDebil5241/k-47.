import { Audio } from './audio.js';

export const DialogAudio = (() => {
  let enabled = true;
  let droneNodes = null;

  function setEnabled(v) {
    enabled = v;
    if (!v) stopDrone();
  }

  function startDrone() {
    if (!enabled) return;
    stopDrone();
    const ctx = getCtx();
    if (!ctx) return;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer; noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 150;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start();
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth'; osc.frequency.value = 45;
    const oscGain = ctx.createGain(); oscGain.gain.value = 0.06;
    osc.connect(oscGain); oscGain.connect(ctx.destination);
    osc.start();
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine'; osc2.frequency.value = 60;
    const oscGain2 = ctx.createGain(); oscGain2.gain.value = 0.04;
    osc2.connect(oscGain2); oscGain2.connect(ctx.destination);
    osc2.start();
    droneNodes = { noise, osc, osc2, gain, oscGain, oscGain2 };
  }

  function playInterference() {
    if (!enabled) return;
    stopDrone();
    const ctx = getCtx();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / bufferSize * 3);
      const freq = 200 + Math.random() * 800;
      data[i] = (Math.random() * 2 - 1) * env * 0.8 * Math.sin(2 * Math.PI * freq * i / ctx.sampleRate);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer; noise.loop = true;
    const gain = ctx.createGain(); gain.gain.value = 0.6;
    noise.connect(gain); gain.connect(ctx.destination);
    noise.start();
    droneNodes = { noise, gain };
  }

  function playClickSound() {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.18);
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  }

  function stopDrone() {
    if (!droneNodes) return;
    try {
      if (droneNodes.noise) droneNodes.noise.stop();
      if (droneNodes.osc) droneNodes.osc.stop();
      if (droneNodes.osc2) droneNodes.osc2.stop();
    } catch (e) {}
    droneNodes = null;
  }

  function getCtx() {
    Audio.resume();
    if (!window.__objCtx) {
      try { window.__objCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (window.__objCtx.state === 'suspended') window.__objCtx.resume();
    return window.__objCtx;
  }

  return { startDrone, playInterference, playClickSound, stopDrone, setEnabled };
})();
