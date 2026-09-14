import { CONFIG, $ } from '../config.js';
import { state } from '../core/state.js';
import { Audio } from '../core/audio.js';

const PHOTO_COUNT = CONFIG.photos.count;
const photos = [];
const connections = new Set();
let selectedNail = null;
let rngSeed = 47071;
let redrawRaf = null;

function rnd() {
  rngSeed = (rngSeed * 16807) % 2147483647;
  return rngSeed / 2147483647;
}

export function buildPhotoWall() {
  const DOM = { photoWall: $('photoWall') };
  const cols = 7, rows = 7;
  const xStart = 8, xEnd = 92, yStart = 12, yEnd = 88;
  const used = new Set();
  while (used.size < PHOTO_COUNT) {
    const c = Math.floor(rnd() * cols);
    const r = Math.floor(rnd() * rows);
    used.add(r * cols + c);
  }
  const cells = [...used];
  cells.sort((a, b) => {
    const ra = Math.floor(a / cols), rb = Math.floor(b / cols);
    if (ra !== rb) return ra - rb;
    return (a % cols) - (b % cols);
  });
  for (let i = 0; i < PHOTO_COUNT; i++) {
    const cell = cells[i];
    const col = cell % cols, row = Math.floor(cell / cols);
    const baseX = xStart + (col / (cols - 1)) * (xEnd - xStart);
    const baseY = yStart + (row / (rows - 1)) * (yEnd - yStart);
    const xPct = baseX + (rnd() - 0.5) * 4;
    const yPct = baseY + (rnd() - 0.5) * 4;
    const rotZ = (rnd() - 0.5) * 18;
    const rotY = (rnd() - 0.5) * 20;
    const scale = 0.85 + rnd() * 0.35;
    const el = document.createElement('div');
    el.className = 'photo-item';
    el.style.left = xPct + '%';
    el.style.top = yPct + '%';
    el.style.transform = `translate(-50%, -50%) rotateZ(${rotZ}deg) rotateY(${rotY}deg) scale(${scale})`;
    const frame = document.createElement('div');
    frame.className = 'photo-frame';
    const img = document.createElement('div');
    img.className = 'photo-img';
    const tint = 60 + rnd() * 60;
    img.style.background = `linear-gradient(${rnd()*360}deg, hsl(${tint}, 20%, 30%) 0%, hsl(${tint-20}, 15%, 12%) 100%)`;
    frame.appendChild(img);
    el.appendChild(frame);
    const nail = document.createElement('div');
    nail.className = 'photo-nail';
    el.appendChild(nail);
    el.addEventListener('click', (e) => { e.stopPropagation(); handleNailClick(i); });
    DOM.photoWall.appendChild(el);
    photos.push({ el, connections: new Set(), order: i });
  }
  refreshPhotoReveal();
}

export function refreshPhotoReveal() {
  const opened = state.chaptersOpened.size;
  photos.forEach((p, i) => {
    if (i < opened) p.el.classList.add('revealed');
    else p.el.classList.remove('revealed');
  });
}

export function redrawConnections() {
  if (redrawRaf) return;
  redrawRaf = requestAnimationFrame(() => {
    redrawRaf = null;
    const DOM = { photoSvg: $('photoSvg') };
    while (DOM.photoSvg.firstChild) DOM.photoSvg.removeChild(DOM.photoSvg.firstChild);
    DOM.photoSvg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    connections.forEach(key => {
      const [a, b] = key.split('-').map(Number);
      const pa = photos[a].el.getBoundingClientRect();
      const pb = photos[b].el.getBoundingClientRect();
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(pa.left + pa.width / 2));
      line.setAttribute('y1', String(pa.top));
      line.setAttribute('x2', String(pb.left + pb.width / 2));
      line.setAttribute('y2', String(pb.top));
      DOM.photoSvg.appendChild(line);
    });
  });
}

function handleNailClick(idx) {
  if (state.phase !== 'wall-close') return;
  if (!photos[idx].el.classList.contains('revealed')) return;
  if (Audio.isEnabled()) Audio.nailClick();
  if (selectedNail === null) {
    selectedNail = idx;
    photos[idx].el.classList.add('selected');
    return;
  }
  if (selectedNail === idx) {
    photos[idx].el.classList.remove('selected');
    selectedNail = null;
    return;
  }
  const a = Math.min(selectedNail, idx);
  const b = Math.max(selectedNail, idx);
  const key = `${a}-${b}`;
  if (connections.has(key)) {
    connections.delete(key);
    photos[a].connections.delete(b);
    photos[b].connections.delete(a);
    photos[a].el.classList.remove('connected');
    photos[b].el.classList.remove('connected');
  } else {
    connections.add(key);
    photos[a].connections.add(b);
    photos[b].connections.add(a);
    photos[a].el.classList.add('connected');
    photos[b].el.classList.add('connected');
  }
  if (Audio.isEnabled()) Audio.stringTension();
  photos[selectedNail].el.classList.remove('selected');
  selectedNail = null;
  redrawConnections();
}

export function clearAllLinks() {
  connections.clear();
  photos.forEach(p => {
    p.connections.clear();
    p.el.classList.remove('connected', 'selected');
  });
  selectedNail = null;
  redrawConnections();
  if (Audio.isEnabled()) Audio.click();
}
