import { $, clamp } from '../config.js';

export function logLine(text, dim = false) {
  const DOM = { log: $('log') };
  const div = document.createElement('div');
  div.className = 'log-line' + (dim ? ' dim' : '');
  div.textContent = '> ' + text;
  DOM.log.appendChild(div);
  const MAX_LOG_LINES = 9;
  while (DOM.log.children.length > MAX_LOG_LINES) DOM.log.removeChild(DOM.log.firstChild);
}

export function initTelemetry() {
  const telemetry = [
    { v: $('v1'), b: $('b1'), base: 98, range: 2 },
    { v: $('v2'), b: $('b2'), base: 74, range: 15 },
    { v: $('v3'), b: $('b3'), base: 61, range: 8 },
    { v: $('v4'), b: $('b4'), base: 12, range: 25 },
  ];
  setInterval(() => {
    const d = new Date();
    const clock = $('clock');
    if (clock) clock.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
  }, 500);
  setInterval(() => {
    telemetry.forEach(o => {
      const val = clamp(o.base + (Math.random() - 0.5) * o.range, 0, 100);
      o.v.textContent = Math.floor(val) + '%';
      o.b.style.width = val + '%';
    });
  }, 900);
}
