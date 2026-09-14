import { $, clamp } from '../config.js';

const THOUGHTS = [
  'Что?', 'Почему?', 'Что было дальше?', 'Может если нажать сильнее?',
  'А если еще раз?', 'Почему ничего не меняется?', 'Это ведь не конец?',
  'А если обернуться?', 'Что там за дверью?', 'Кто это сделал?',
  'Зачем я это читал?', 'Что если нажать дважды?', 'Может это сон?',
  'Кто я теперь?', 'Что будет после?',
];

const thoughtObjects = [];
let thoughtsActive = false;
let thoughtsRafId = null;

export function spawnThoughts() {
  const layer = $('thoughtsLayer');
  layer.classList.add('active');
  layer.innerHTML = '';
  thoughtObjects.length = 0;
  THOUGHTS.forEach((text, i) => {
    const el = document.createElement('div');
    el.className = 'thought';
    el.textContent = text;
    const startX = Math.random() * 70 + 15;
    const startY = Math.random() * 70 + 15;
    el.style.left = startX + '%';
    el.style.top = startY + '%';
    layer.appendChild(el);
    thoughtObjects.push({
      el, x: startX, y: startY,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.015,
      delay: i * 500,
      startTime: performance.now(),
    });
  });
}

function updateThoughts(now) {
  if (!thoughtsActive) { thoughtsRafId = null; return; }
  thoughtObjects.forEach(t => {
    const age = now - t.startTime - t.delay;
    if (age < 0) { t.el.style.opacity = '0'; return; }
    const inPhase = clamp(age / 1200, 0, 1);
    const outPhaseStart = 8000 + Math.random() * 2000;
    const outPhase = clamp((age - outPhaseStart) / 1600, 0, 1);
    const opacity = inPhase * (1 - outPhase);
    t.x += t.vx * 16;
    t.y += t.vy * 16;
    if (t.x < -20) t.x = 120;
    if (t.x > 120) t.x = -20;
    if (t.y < -10) t.y = 110;
    if (t.y > 110) t.y = -10;
    const wobble = Math.sin(age * 0.001 + t.delay) * 1.5;
    t.el.style.left = t.x + '%';
    t.el.style.top = (t.y + wobble) + '%';
    t.el.style.opacity = String(opacity);
  });
  thoughtsRafId = requestAnimationFrame(updateThoughts);
}

export function startThoughtsLoop() {
  thoughtsActive = true;
  spawnThoughts();
  if (thoughtsRafId) cancelAnimationFrame(thoughtsRafId);
  thoughtsRafId = requestAnimationFrame(updateThoughts);
}

export function stopThoughts() {
  thoughtsActive = false;
  if (thoughtsRafId) { cancelAnimationFrame(thoughtsRafId); thoughtsRafId = null; }
}
