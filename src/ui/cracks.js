import { $ } from '../config.js';
import { state } from '../core/state.js';
import { Timers } from '../core/timers.js';
import { Audio } from '../core/audio.js';
import { CHAPTERS } from '../content/chapters.js';

export const crackState = {
  breakCount: 0,
  maxBreaks: 3,
  holdDuration: 4700,
  isHolding: false,
  holdTimer: null,
  progressSvg: null,
  progressCircle: null,
  audioCtx: null,
  active: false,
};

let thoughtsStopFn = null;
export function setThoughtsStop(fn) { thoughtsStopFn = fn; }
let autoExitFn = null;
export function setAutoExit(fn) { autoExitFn = fn; }

function setupCrackAudio() {
  if (!crackState.audioCtx) {
    try {
      crackState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
  }
  if (crackState.audioCtx.state === 'suspended') crackState.audioCtx.resume();
}

function playCrackSound() {
  const ac = crackState.audioCtx;
  if (!ac) return;
  const now = ac.currentTime;
  const D = 0.9;
  const thud = ac.createOscillator();
  const thudGain = ac.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(150, now);
  thud.frequency.exponentialRampToValueAtTime(40, now + 0.3);
  thudGain.gain.setValueAtTime(0.5, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  thud.connect(thudGain); thudGain.connect(ac.destination);
  thud.start(now); thud.stop(now + 0.3);
  for (let k = 0; k < 12; k++) {
    const t = now + k * 0.06 + Math.random() * 0.02;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = ['sawtooth', 'square', 'triangle'][k % 3];
    osc.frequency.setValueAtTime(800 + Math.random() * 4500, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    g.gain.setValueAtTime(0.08 + Math.random() * 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t); osc.stop(t + 0.08);
  }
}

function createProgressRing(x, y) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'hold-progress');
  svg.setAttribute('width', '100');
  svg.setAttribute('height', '100');
  svg.style.left = x + 'px';
  svg.style.top = y + 'px';
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '50');
  circle.setAttribute('cy', '50');
  circle.setAttribute('r', '45');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', 'rgba(255, 51, 85, 0.85)');
  circle.setAttribute('stroke-width', '3');
  svg.appendChild(circle);
  document.body.appendChild(svg);
  crackState.progressSvg = svg;
  crackState.progressCircle = circle;
  const startTime = performance.now();
  const update = (now) => {
    if (!crackState.isHolding) return;
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / crackState.holdDuration, 1);
    if (crackState.progressCircle) {
      const c = 2 * Math.PI * 45;
      crackState.progressCircle.style.strokeDasharray = c;
      crackState.progressCircle.style.strokeDashoffset = c * (1 - progress);
    }
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function removeProgressRing() {
  if (crackState.progressSvg) {
    crackState.progressSvg.remove();
    crackState.progressSvg = null;
    crackState.progressCircle = null;
  }
}

function shakeTerminal() {
  const el = $('ui');
  const intensity = 10;
  const duration = 400;
  const start = performance.now();
  function shake(now) {
    const elapsed = now - start;
    if (elapsed < duration) {
      const progress = elapsed / duration;
      const cur = intensity * (1 - progress);
      el.style.transform = `translate(${(Math.random() - 0.5) * cur * 2}px, ${(Math.random() - 0.5) * cur * 2}px)`;
      requestAnimationFrame(shake);
    } else {
      el.style.transform = 'translate(0, 0)';
    }
  }
  requestAnimationFrame(shake);
}

export function addCracksToContainer(container, count) {
  const W = window.innerWidth, H = window.innerHeight;
  for (let c = 0; c < count; c++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const crackCount = 8 + Math.floor(Math.random() * 4);
    const maxRadius = Math.max(W, H) * 0.6;
    for (let i = 0; i < crackCount; i++) {
      const crack = document.createElement('div');
      crack.className = 'crack-line';
      const angle = (Math.PI * 2 * i / crackCount) + (Math.random() - 0.5) * 0.8;
      const length = maxRadius * (0.5 + Math.random() * 0.5);
      const thickness = 0.6 + Math.random() * 1.4;
      crack.style.left = x + 'px';
      crack.style.top = y + 'px';
      crack.style.width = length + 'px';
      crack.style.height = thickness + 'px';
      crack.style.transform = `rotate(${angle}rad)`;
      crack.style.background = `linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(200,200,200,0.4) 30%, rgba(150,150,150,0.25) 60%, rgba(100,100,100,0.15) 100%)`;
      crack.style.borderRadius = (thickness / 2) + 'px';
      crack.style.boxShadow = '0 0 6px rgba(255,255,255,0.18)';
      container.appendChild(crack);
      requestAnimationFrame(() => crack.classList.add('visible'));
    }
  }
}

export function addScratchesToSvg(svg, count, seed) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  let rngLocal = seed;
  const r = () => {
    rngLocal = (rngLocal * 16807) % 2147483647;
    return rngLocal / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const x1 = r() * 100, y1 = r() * 100;
    const len = 3 + r() * 15;
    const ang = r() * Math.PI * 2;
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x1 + Math.cos(ang) * len));
    line.setAttribute('y2', String(y1 + Math.sin(ang) * len));
    line.setAttribute('opacity', String(0.15 + r() * 0.35));
    svg.appendChild(line);
  }
}

export function updateTerminalAging() {
  const opened = state.chaptersOpened.size;
  const el = $('terminalAging');
  if (opened === 0) { el.classList.remove('active'); return; }
  el.classList.add('active');
  const level = Math.min(opened / CHAPTERS.length, 1);
  addScratchesToSvg($('agingScratchesSvg'), Math.floor(level * 40), 47071 + opened);
  el.style.filter = `brightness(${1 - level * 0.25})`;
}

export function doBreak(x, y) {
  if (crackState.breakCount >= crackState.maxBreaks) return;
  crackState.breakCount++;
  playCrackSound();
  addCracksToContainer($('crackOverlay'), 1);
  addCracksToContainer($('readerCracks'), 1);
  addCracksToContainer($('dialogCracks'), 1);
  shakeTerminal();
  if (crackState.breakCount >= crackState.maxBreaks) {
    state.endingComplete = true;
    state.cycle47Complete = true;
    crackState.active = false;
    removeProgressRing();
    document.removeEventListener('mousedown', crackDownHandler, true);
    document.removeEventListener('mouseup', crackUpHandler, true);
    document.removeEventListener('mouseleave', crackUpHandler, true);
    document.removeEventListener('touchstart', crackDownHandler, true);
    document.removeEventListener('touchend', crackUpHandler, true);
    document.removeEventListener('touchcancel', crackUpHandler, true);
    if (thoughtsStopFn) thoughtsStopFn();
    Timers.set('hide-thoughts', () => {
      const tl = $('thoughtsLayer');
      tl.classList.remove('active');
      tl.innerHTML = '';
    }, 2000);
    Timers.set('auto-exit', () => { if (autoExitFn) autoExitFn(); }, 1200);
  }
}

export function crackDownHandler(e) {
  if (!crackState.active) return;
  if (state.phase !== 'inside' && state.phase !== 'final') return;
  e.preventDefault();
  let x, y;
  if (e.touches) { x = e.touches[0].clientX; y = e.touches[0].clientY; }
  else { x = e.clientX; y = e.clientY; }
  startCrackHold(x, y);
}

export function crackUpHandler() {
  if (!crackState.active) return;
  endCrackHold();
}

function startCrackHold(x, y) {
  if (!crackState.active || crackState.isHolding || crackState.breakCount >= crackState.maxBreaks) return;
  setupCrackAudio();
  crackState.isHolding = true;
  createProgressRing(x, y);
  crackState.holdTimer = setTimeout(() => {
    if (!crackState.isHolding) return;
    crackState.isHolding = false;
    removeProgressRing();
    doBreak(x, y);
  }, crackState.holdDuration);
}

function endCrackHold() {
  if (!crackState.isHolding) return;
  crackState.isHolding = false;
  clearTimeout(crackState.holdTimer);
  removeProgressRing();
}

export function startThoughtsAndCracks() {
  crackState.active = true;
  crackState.breakCount = 0;
  $('crackOverlay').classList.add('active');
  document.addEventListener('mousedown', crackDownHandler, true);
  document.addEventListener('mouseup', crackUpHandler, true);
  document.addEventListener('mouseleave', crackUpHandler, true);
  document.addEventListener('touchstart', crackDownHandler, { capture: true, passive: false });
  document.addEventListener('touchend', crackUpHandler, { capture: true, passive: false });
  document.addEventListener('touchcancel', crackUpHandler, true);
  if (Audio.isEnabled()) Audio.whisper(2.0);
      }
