/* ==========================================================================
   К-47 · ЯДРО
   Утилиты, хранилище, сохранение цикла, игровые часы (замирают на паузе),
   единый цикл кадров (один requestAnimationFrame), области видимости сцен
   (Scope — всё созданное снимается одним dispose()), модальные окна.
   ========================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wait = ms => new Promise(r => setTimeout(r, ms));
const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const TOUCH = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
const MONO = "'Share Tech Mono', 'Courier New', monospace";
const PIXEL = "'Press Start 2P', 'Courier New', monospace";
const DISP = "'Oswald', 'Arial Narrow', Impact, sans-serif";
const SERIF = "'PT Serif', Georgia, serif";
/** детерминированный генератор — стабильный «шум», трещины, фотографии */
const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const isTyping = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
const plural = (n, one, few, many) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many; };

// ---------- безопасное хранилище (в приватном режиме localStorage может бросать) ----------
const Store = {
  get(k, fb) { try { const r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); } catch { return fb; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

// ---------- литературная основа: 49 глав ----------
const BOOK = (() => {
  try { return JSON.parse(document.getElementById('book-data').textContent); }
  catch (e) { console.error('Книга не загружена', e); return []; }
})();
const N_CH = BOOK.length;               // 49
const LOCK_FROM = 46;                   // индекс главы «47.»: с неё архив заперт до выполнения нормы
const CLICKS_NEEDED = 47;
const chTitle = i => (BOOK[i] ? BOOK[i].t.replace(/\.$/, '') : '');

/** текст абзаца → безопасный HTML (разрешено только подчёркивание <u>) */
const paraHTML = t => esc(t).replace(/&lt;(\/?)u&gt;/g, '<$1u>');

// ---------- глитч-текст ----------
const GL_CHARS = '▓▒░█▚▞#%@&$ΞΨ47_/\\|';
function glitchHTML(text, ratio, seed = 47) {
  const r = mulberry(seed);
  let out = '';
  for (const ch of String(text)) {
    if (/[\p{L}\p{N}]/u.test(ch) && r() < ratio) out += `<span class="gl">${esc(GL_CHARS[Math.floor(r() * GL_CHARS.length)])}</span>`;
    else out += esc(ch);
  }
  return out;
}
/** повреждённая глава: буквы-помехи + вымаранные слова. dist — слабее, dmg — сильнее, но читаемо */
function damagedHTML(text, level, seed) {
  const r = mulberry(seed);
  const ratio = level === 'dmg' ? 0.075 : 0.025, redact = level === 'dmg' ? 0.045 : 0.012;
  return String(text).split(/(\s+)/).map(w => {
    if (/^\s+$/.test(w) || !w) return w;
    if (w.length > 3 && r() < redact) return `<span class="rd-x">${'█'.repeat(Math.min(12, w.length))}</span>`;
    let o = '';
    for (const ch of w) o += /[\p{L}\p{N}]/u.test(ch) && r() < ratio ? `<span class="gl">${esc(GL_CHARS[Math.floor(r() * GL_CHARS.length)])}</span>` : esc(ch);
    return o;
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

// ==========================================================================
//   СОХРАНЕНИЕ ЦИКЛА
// ==========================================================================
const KEYS = { save: 'k47c48_save', set: 'k47c48_settings', nb: 'k47c48_notebook', res: 'k47_residual', legacyNb: 'k47_notebook' };
const STAGES = ['explore', 'damaged', 'norm', 'feel', 'final', 'after'];
const genCode = () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
const freshSave = (cycle = 47) => ({
  v: 1, cycle, deaths: 0, wear: 0, act: null, sub: null, signed: false,
  story: { stage: 'explore', code: genCode(), codeOk: false, cracked: false, hits: [] },
  reader: { chapter: 0, agreed: false, unlocked: false },
  ch: {},            // индекс главы → { st: 'ok'|'dist'|'dmg', read: 0|1, tries }
  notes: {},         // индекс главы → { t, k } — строка нейрослепка, восстановленная мини-игрой
  clicks: 0,
  choices: { emotion: null, asked: [], finished: false },
  diverted: [],      // воспоминания, спрятанные при передаче актива (глава 47)
  endings: 0, t: Date.now(),
});
let G = freshSave();

const Save = {
  _t: 0,
  /** сохранить сейчас (или чуть позже — lazy) */
  put(lazy = false) {
    G.t = Date.now();
    if (lazy) { clearTimeout(this._t); this._t = setTimeout(() => Store.set(KEYS.save, G), 400); return; }
    clearTimeout(this._t);
    return Store.set(KEYS.save, G);
  },
  has() { const s = Store.get(KEYS.save, null); return !!(s && s.act); },
  /** загрузить и привести к корректному виду; вернуть true, если есть сохранённый цикл */
  load() {
    const s = Store.get(KEYS.save, null);
    if (!s || typeof s !== 'object') { G = freshSave(); return false; }
    const d = freshSave(Number.isInteger(s.cycle) && s.cycle >= 47 ? s.cycle : 47);
    d.deaths = Math.max(0, s.deaths | 0);
    d.wear = clamp(+s.wear || 0, 0, 100);
    d.act = typeof s.act === 'string' ? s.act : null;
    d.sub = typeof s.sub === 'string' ? s.sub : null;
    d.signed = !!s.signed;
    const st = s.story || {};
    d.story = {
      stage: STAGES.includes(st.stage) ? st.stage : 'explore',
      code: /^\d{12}$/.test(st.code || '') ? st.code : genCode(),
      codeOk: !!st.codeOk, cracked: !!st.cracked,
      hits: Array.isArray(st.hits) ? st.hits.filter(h => Array.isArray(h) && h.length === 2).slice(0, 3).map(([x, y]) => [clamp(+x || .5, .05, .95), clamp(+y || .5, .05, .95)]) : [],
    };
    const rd = s.reader || {};
    d.reader = { chapter: clamp(rd.chapter | 0, 0, N_CH - 1), agreed: !!rd.agreed, unlocked: !!rd.unlocked };
    if (s.ch && typeof s.ch === 'object') for (const [k, v] of Object.entries(s.ch)) {
      const i = +k;
      if (Number.isInteger(i) && i >= 0 && i < N_CH && v && typeof v === 'object') d.ch[i] = { st: ['ok', 'dist', 'dmg'].includes(v.st) ? v.st : null, read: v.read ? 1 : 0, tries: Math.max(0, v.tries | 0) };
    }
    if (s.notes && typeof s.notes === 'object') for (const [k, v] of Object.entries(s.notes)) {
      const i = +k;
      if (Number.isInteger(i) && i >= 0 && i < N_CH && v && typeof v.t === 'string') d.notes[i] = { t: v.t.slice(0, 600), k: v.k === 'dist' ? 'dist' : 'ok' };
    }
    d.clicks = clamp(s.clicks | 0, 0, CLICKS_NEEDED);
    const c = s.choices || {};
    d.choices = { emotion: typeof c.emotion === 'string' ? c.emotion : null, asked: Array.isArray(c.asked) ? c.asked.filter(x => typeof x === 'string') : [], finished: !!c.finished };
    d.diverted = Array.isArray(s.diverted) ? s.diverted.filter(x => typeof x === 'string').slice(0, 5) : [];
    d.endings = Math.max(0, s.endings | 0);
    G = d;
    return !!G.act;
  },
  /** новый цикл: прогресс стирается; блокнот игрока и остаточные данные остаются */
  wipe({ keepCycle = false, all = false } = {}) {
    const next = keepCycle ? G.cycle : G.cycle;
    const endings = G.endings;
    G = freshSave(next);
    G.endings = endings;
    Store.del(KEYS.save);
    if (all) { Store.del(KEYS.nb); Store.del(KEYS.res); Notebook.reset(); }
  },
};
// статусы фрагментов
const chState = i => G.ch[i] || (G.ch[i] = { st: null, read: 0, tries: 0 });
const chStatus = i => (G.ch[i] && G.ch[i].st) || null;
const countSt = st => Object.values(G.ch).filter(c => c.st === st).length;
const readCount = () => Object.values(G.ch).filter(c => c.read).length;

// ---------- настройки ----------
const Settings = Object.assign({ sound: true, vol: 0.85, fx: true, mode: 'norm', font: 'book', size: 'm' }, Store.get(KEYS.set, {}) || {});
if (!['story', 'norm', 'hard'].includes(Settings.mode)) Settings.mode = 'norm';
Settings.save = () => Store.set(KEYS.set, { sound: Settings.sound, vol: Settings.vol, fx: Settings.fx, mode: Settings.mode, font: Settings.font, size: Settings.size });

// ---------- блокнот игрока: страница = глава ----------
const Notebook = {
  pages: Array(N_CH).fill(''), current: 0,
  load() {
    const nb = Store.get(KEYS.nb, null) || Store.get(KEYS.legacyNb, null);
    this.pages = Array(N_CH).fill('');
    if (typeof nb === 'string') this.pages[0] = nb.slice(0, 4000);
    else if (nb && Array.isArray(nb.pages)) nb.pages.slice(0, N_CH).forEach((t, i) => { this.pages[i] = String(t || '').slice(0, 4000); });
    this.current = clamp((nb && nb.current) | 0, 0, N_CH - 1);
  },
  save() { Store.set(KEYS.nb, { pages: this.pages, current: this.current }); },
  reset() { this.pages = Array(N_CH).fill(''); this.current = 0; },
};

// ==========================================================================
//   ИГРОВЫЕ ЧАСЫ — все таймеры сцен идут по ним и замирают на паузе
// ==========================================================================
const Clock = (() => {
  let t = 0, paused = false, seq = 1;
  const timers = new Map();
  return {
    now: () => t,
    get paused() { return paused; },
    setPaused(p) { paused = !!p; },
    pending: () => timers.size > 0,
    advance(ms) {
      if (paused) return;
      t += ms;
      if (!timers.size) return;
      for (const [id, tm] of [...timers]) {
        if (!timers.has(id) || t < tm.due) continue;
        timers.delete(id);
        try { tm.fn(); } catch (e) { console.error('[timer]', e); }
      }
    },
    after(ms, fn) { const id = seq++; timers.set(id, { due: t + Math.max(0, ms), fn }); Loop.wake(); return id; },
    cancel(id) { timers.delete(id); },
  };
})();

// ==========================================================================
//   ЕДИНЫЙ ЦИКЛ КАДРОВ: не больше одного requestAnimationFrame на всё
// ==========================================================================
const Loop = (() => {
  const tickers = new Map();
  let raf = 0, last = 0, inFrame = false;
  const need = () => tickers.size > 0 || Clock.pending();
  function frame(now) {
    inFrame = true;
    const raw = Math.max(0, now - last);
    last = now;
    const dt = Math.min(0.1, raw / 1000);
    Clock.advance(Math.min(250, raw));
    if (!Clock.paused) {
      for (const [id, fn] of [...tickers]) {
        if (!tickers.has(id)) continue;
        try { fn(dt, now); } catch (e) { console.error('[loop]', id, e); tickers.delete(id); }
      }
    }
    inFrame = false;
    raf = need() ? requestAnimationFrame(frame) : 0;
  }
  const wake = () => { if (!raf && !inFrame) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  // вкладка скрыта — rAF стоит; при возврате не «проматываем» таймеры рывком
  document.addEventListener('visibilitychange', () => { if (!document.hidden) last = performance.now(); });
  return {
    wake,
    add(id, fn) { tickers.set(id, fn); wake(); },
    addThrottled(id, fps, fn) {
      const step = 1 / fps; let acc = step;
      this.add(id, (dt, now) => { acc += dt; if (acc >= step) { const d = acc; acc = 0; fn(d, now); } });
    },
    remove(id) { tickers.delete(id); if (!need() && raf && !inFrame) { cancelAnimationFrame(raf); raf = 0; } },
    has: id => tickers.has(id),
    get size() { return tickers.size; },
  };
})();

// ==========================================================================
//   SCOPE — таймеры (по игровым часам), слушатели, тикеры, звуковые петли
//   сцены или мини-игры. dispose() снимает всё разом: без утечек.
// ==========================================================================
let scopeSeq = 0;
class Scope {
  constructor(name) { this.name = `${name}#${++scopeSeq}`; this.timers = new Set(); this.listeners = []; this.tickers = new Set(); this.alive = true; this.cleanups = []; this._n = 0; }
  timeout(fn, ms) {
    if (!this.alive) return 0;
    const id = Clock.after(ms, () => { this.timers.delete(id); if (this.alive) fn(); });
    this.timers.add(id); return id;
  }
  clear(id) { Clock.cancel(id); this.timers.delete(id); }
  /** повтор каждые ms (число или функция); вернёт функцию остановки */
  every(ms, fn) {
    let id = 0, on = true;
    const next = () => (typeof ms === 'function' ? ms() : ms);
    const run = () => { if (!on) return; fn(); if (on) id = this.timeout(run, next()); };
    id = this.timeout(run, next());
    return () => { on = false; this.clear(id); };
  }
  /** промис, который после dispose никогда не разрешится — цепочки сами обрываются */
  wait(ms) { return new Promise(res => this.timeout(res, ms)); }
  on(target, type, fn, opts) { if (!this.alive) return; target.addEventListener(type, fn, opts); this.listeners.push([target, type, fn, opts]); }
  tick(id, fn, fps) { if (!this.alive) return; const key = `${this.name}:${id}`; fps ? Loop.addThrottled(key, fps, fn) : Loop.add(key, fn); this.tickers.add(key); }
  untick(id) { const key = `${this.name}:${id}`; Loop.remove(key); this.tickers.delete(key); }
  /** fn(dt, now) каждый кадр; вернуть false — остановить. Возвращает функцию остановки */
  loop(fn) {
    const id = `L${++this._n}`;
    this.tick(id, (dt, now) => { if (fn(Math.min(0.05, dt), now) === false) this.untick(id); });
    return () => this.untick(id);
  }
  own(x) { this.cleanups.push(x); return x; }
  onDispose(fn) { this.cleanups.push(fn); }
  now() { return Clock.now(); }
  dispose() {
    if (!this.alive) return;
    this.alive = false;
    this.timers.forEach(id => Clock.cancel(id)); this.timers.clear();
    this.listeners.forEach(([t, ty, fn, o]) => t.removeEventListener(ty, fn, o)); this.listeners = [];
    this.tickers.forEach(k => Loop.remove(k)); this.tickers.clear();
    this.cleanups.forEach(x => {
      try { if (typeof x === 'function') x(); else if (x && x.stop) x.stop(); else if (x && x.dispose) x.dispose(); } catch (e) { console.error(e); }
    });
    this.cleanups = [];
  }
}

// ==========================================================================
//   МОДАЛЬНЫЕ ОКНА: стек, фокус-трап, Escape, клик по фону
// ==========================================================================
const Modal = (() => {
  const stack = [];
  const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusables = root => $$(FOCUSABLE, root).filter(el => !el.closest('[hidden]') && (el.offsetParent !== null || el === document.activeElement));
  function open(el, { closable = true, onClose = null, onEsc = null, focus = null } = {}) {
    if (stack.some(m => m.el === el)) return;
    stack.push({ el, closable, onClose, onEsc, prev: document.activeElement });
    el.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      const target = (focus && (typeof focus === 'string' ? $(focus, el) : focus)) || focusables(el)[0] || el;
      try { target.focus({ preventScroll: true }); } catch { /* ignore */ }
    });
  }
  function close(el, silent = false) {
    const i = stack.findIndex(m => m.el === el);
    if (i < 0) { el.hidden = true; return; }
    const [m] = stack.splice(i, 1);
    el.hidden = true;
    document.body.classList.toggle('modal-open', stack.length > 0);
    if (m.prev && document.contains(m.prev) && !m.prev.closest('[hidden]')) { try { m.prev.focus({ preventScroll: true }); } catch { /* ignore */ } }
    if (!silent && m.onClose) m.onClose();
  }
  function closeAll() { [...stack].reverse().forEach(m => close(m.el, true)); }
  const top = () => stack[stack.length - 1];
  document.addEventListener('keydown', e => {
    const m = top();
    if (!m) return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (m.onEsc) m.onEsc();
      else if (m.closable) { A.sfx.click(); close(m.el); }
      return;
    }
    if (e.key === 'Tab') {
      const items = focusables(m.el);
      if (!items.length) { e.preventDefault(); m.el.focus(); return; }
      const first = items[0], last = items[items.length - 1];
      if (!m.el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    // пока открыто окно, клавиши не уходят в сцену под ним
    if (!m.el.contains(e.target)) e.stopImmediatePropagation();
  }, true);
  document.addEventListener('click', e => {
    const m = top(); if (!m) return;
    if (e.target === m.el && m.closable && !m.onEsc) { close(m.el); return; }
    const btn = e.target.closest('[data-close]');
    if (btn && m.el.contains(btn)) { A.sfx.click(); close(m.el); }
  });
  return { open, close, closeAll, isOpen: () => stack.length > 0, top, get depth() { return stack.length; }, has: el => stack.some(m => m.el === el) };
})();

/** своё подтверждение вместо confirm() */
function askConfirm(title, text, yes = 'ДА', no = 'НЕТ') {
  return new Promise(resolve => {
    const m = $('#confirmModal');
    $('#cfTitle').textContent = title; $('#cfText').textContent = text;
    $('#cfYes').textContent = yes; $('#cfNo').textContent = no;
    let done = false;
    const finish = v => { if (done) return; done = true; $('#cfYes').onclick = $('#cfNo').onclick = null; Modal.close(m, true); resolve(v); };
    $('#cfYes').onclick = () => { A.sfx.click(); finish(true); };
    $('#cfNo').onclick = () => { A.sfx.click(); finish(false); };
    Modal.open(m, { onClose: () => finish(false), onEsc: () => finish(false), focus: '#cfNo' });
  });
}

/** холст на весь родитель с учётом DPR; o.W / o.H — в CSS-пикселях */
function makeCanvas(scope, parent, { dprMax = 2, cls = 'gcv', alpha = true } = {}) {
  const cv = document.createElement('canvas');
  cv.className = cls; cv.setAttribute('aria-hidden', 'true');
  parent.appendChild(cv);
  const g = cv.getContext('2d', { alpha });
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
  if (scope) { scope.on(window, 'k47:resize', () => o.fit()); scope.onDispose(() => { cv.width = cv.height = 0; cv.remove(); }); }
  return o;
}
/** офскрин-холст */
const offCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
