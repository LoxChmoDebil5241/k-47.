// ==========================================================================
// К-47 · медиа-слой: настоящие звуки и изображения поверх синтеза.
// Всё описано в media/manifest.json. Нет файла — работает прежний
// синтезированный звук / процедурная графика, игра ничего не теряет.
// ==========================================================================
const BASE = './media/';

async function loadManifest() {
  try {
    const r = await fetch(BASE + 'manifest.json', { cache: 'no-cache' });
    return r.ok ? await r.json() : {};
  } catch { return {}; }
}

const manifest = await loadManifest();
const A = window.Audio47;

// ---------- звук ----------
const buffers = new Map();   // путь → Promise<AudioBuffer|null>

function decode(path) {
  if (!buffers.has(path)) {
    buffers.set(path, (async () => {
      const raw = A && A.raw();
      if (!raw) return null;
      try {
        const r = await fetch(BASE + path);
        if (!r.ok) return null;
        return await raw.ctx.decodeAudioData(await r.arrayBuffer());
      } catch (e) { console.warn('[media] не удалось загрузить', path, e); return null; }
    })());
  }
  return buffers.get(path);
}

/** запись манифеста: "file.ogg" или { file, volume, rate, variants: [...] } */
const norm = e => (typeof e === 'string' ? { file: e } : e || {});
const pick = e => (e.variants && e.variants.length ? e.variants[Math.floor(Math.random() * e.variants.length)] : e.file);

function playBuffer(buf, { volume = 1, rate = 1, loop = false } = {}) {
  const raw = A.raw();
  const s = raw.ctx.createBufferSource(), g = raw.ctx.createGain();
  s.buffer = buf; s.loop = loop; s.playbackRate.value = rate; g.gain.value = volume;
  s.connect(g).connect(raw.out);
  s.start();
  return { src: s, gain: g, ctx: raw.ctx };
}

if (A) {
  // эффекты: Audio47.sfx.<имя>() → файл, если он есть
  const sfxMap = manifest.sfx || {};
  for (const [name, entry] of Object.entries(sfxMap)) {
    const orig = A.sfx[name];
    const e = norm(entry);
    const files = e.variants || [e.file];
    let ready = false;
    Promise.all(files.map(decode)).then(list => { ready = list.every(Boolean); });
    A.sfx[name] = (...args) => {
      if (!ready || !A.live()) return orig ? orig.apply(A.sfx, args) : undefined;
      buffers.get(pick(e)).then(buf => buf && playBuffer(buf, e));
    };
  }

  // фоны: Audio47.setAmbient(имя) → зацикленный файл, если он есть
  const ambMap = manifest.ambient || {};
  const origSet = A.setAmbient.bind(A);
  let cur = null;   // { name, node }
  const stopCur = (fade = 1.6) => {
    if (!cur) return;
    const { node } = cur; cur = null;
    if (!node) return;
    const t = node.ctx.currentTime;
    node.gain.gain.cancelScheduledValues(t);
    node.gain.gain.setValueAtTime(node.gain.gain.value, t);
    node.gain.gain.linearRampToValueAtTime(0, t + fade);
    try { node.src.stop(t + fade + 0.1); } catch { /* */ }
  };
  A.setAmbient = (name, fade = 1.6) => {
    const entry = name && ambMap[name];
    if (!entry) { stopCur(fade); return origSet(name, fade); }
    if (cur && cur.name === name) return;
    origSet(null, fade);            // гасим синтезированный фон
    stopCur(fade);
    const e = norm(entry);
    const mine = cur = { name, node: null };
    decode(e.file).then(buf => {
      if (cur !== mine) return;
      if (!buf) { cur = null; return origSet(name, fade); }  // файла нет — старый синтез
      const node = playBuffer(buf, { ...e, volume: 0, loop: true });
      const t = node.ctx.currentTime;
      node.gain.gain.linearRampToValueAtTime(e.volume ?? 0.6, t + fade);
      mine.node = node;
    });
  };
}

// ---------- изображения ----------
// manifest.backgrounds: { "<act>": "img/bg/room.jpg" | { file, opacity, blend } }
// act — contract, room, awake, psych, read (секции #act-<act>)
const bgMap = manifest.backgrounds || {};
const style = document.createElement('style');
style.textContent = `
.k47-bg { position:absolute; inset:0; z-index:0; pointer-events:none;
  background:center/cover no-repeat; opacity:0; transition:opacity 1.2s ease; }
.k47-bg.on { opacity:var(--k47-bg-op, 1); }`;
document.head.append(style);

for (const [act, entry] of Object.entries(bgMap)) {
  const root = document.getElementById('act-' + act);
  if (!root) { console.warn('[media] нет сцены', act); continue; }
  const e = norm(entry);
  const img = new Image();
  img.onload = () => {
    const layer = document.createElement('div');
    layer.className = 'k47-bg';
    layer.style.backgroundImage = `url("${BASE + e.file}")`;
    layer.style.setProperty('--k47-bg-op', e.opacity ?? 1);
    if (e.blend) layer.style.mixBlendMode = e.blend;
    if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
    root.prepend(layer);
    const sync = () => layer.classList.toggle('on', !root.hidden);
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['hidden'] });
    sync();
  };
  img.src = BASE + e.file;
}

/** для своих вставок: K47Media.url('img/x.png'), K47Media.play('audio/sfx/x.ogg') */
window.K47Media = {
  manifest,
  url: p => BASE + p,
  async play(path, opts) { const b = await decode(path); return b && A && A.live() ? playBuffer(b, opts) : null; },
};
