/* ==========================================================================
   К-47 · ЯДРО
   Утилиты, хранилище, единый GameState, единый цикл кадров (один rAF),
   области видимости сцен (Scope), модальные окна с фокус-трапом.
   ========================================================================== */

// ---------- утилиты ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- безопасное хранилище (localStorage может быть недоступен) ----------
const KEYS = {
  progress: 'k47_progress',
  notebook: 'k47_notebook',
  chapters: 'k47_chapters_read',
  clicks: 'k47_clicks',
  choices: 'k47_choices',
  audio: 'k47_audio',
  fx: 'k47_fx',
  frags: 'k47_frags',        // результаты мини-игр: статусы глав, записи, износ носителя
  residual: 'k47_residual',  // остаточные данные — переживают смену цикла
  cycle: 'k47_cycle',        // номер клона: растёт с каждой смертью
};
const Store = {
  get(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* приватный режим */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

// ---------- литературная основа ----------
const BOOK = (() => {
  try { return JSON.parse(document.getElementById('book-data').textContent); }
  catch (e) { console.error('Книга не загружена', e); return []; }
})();
const LOCK_FROM = 46;          // индекс главы «47.» — с неё архив заперт до выполнения нормы
const CLICKS_NEEDED = 47;
const HOLD_MS = 4700;

// ---------- ЕДИНЫЙ GameState ----------
const GameState = {
  act: null,                // текущая сцена: contract | room | clicks | break | ending
  sub: null,                // подэтап сцены (для комнаты: explore | terminal | reader)
  agingLevel: 0,            // 0…1 — степень «старения» экрана
  audioOn: true,
  contract: { signed: false },
  reader: { chapter: 0, read: new Set(), unlocked: false, agreed: false },
  clicks: { count: 0, done: false },
  choices: { emotion: null, asked: [], finished: false },
  notebook: { pages: [], current: 0 },   // блокнот со стола: страница = глава
  // восстановление нейрослепка: мини-игра перед каждой главой
  frag: { st: {}, notes: {}, wear: 0 },  // st[i]: ok | dist | dmg | skip; notes[i]: { t, k }; wear 0…100
  cycle: 47,                // номер текущего клона (К-47 → после смерти К-48, К-49…)
  // сюжет в комнате: explore → damaged → norm → feel → final
  story: { stage: 'explore', code: '', codeOk: false, cracked: false, hits: [] },
  readMode: false,          // режим чтения: только текст книги
};
const NB_PAGES = BOOK.length;
const STAGES = ['explore', 'damaged', 'norm', 'feel', 'final'];
/** код доступа к терминалу: 12 цифр, новый на каждый цикл */
const genCode = () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
GameState.story.code = genCode();

const Save = {
  progress() {
    const s = GameState;
    Store.set(KEYS.progress, {
      act: s.act === 'awake' || s.act === 'psych' ? null : s.act,   // после финала — снова только заставка
      sub: s.sub, agingLevel: s.agingLevel,
      signed: s.contract.signed,
      chapter: s.reader.chapter, unlocked: s.reader.unlocked, agreed: s.reader.agreed,
      story: s.story,
      t: Date.now(),
    });
  },
  chapters() { Store.set(KEYS.chapters, [...GameState.reader.read]); },
  clicks() { Store.set(KEYS.clicks, GameState.clicks.count); },
  choices() { Store.set(KEYS.choices, GameState.choices); },
  notebook() { Store.set(KEYS.notebook, GameState.notebook); },
  frags() { Store.set(KEYS.frags, GameState.frag); },
  cycle() { Store.set(KEYS.cycle, GameState.cycle); },
  hasProgress() { const p = Store.get(KEYS.progress, null); return !!(p && p.act); },
  /** восстановить всё сохранённое в GameState; вернуть объект прогресса или null */
  load() {
    const s = GameState;
    s.audioOn = Store.get(KEYS.audio, true) !== false;
    const nb = Store.get(KEYS.notebook, null);
    const pages = new Array(NB_PAGES).fill('');
    if (typeof nb === 'string') pages[0] = nb;                       // старый формат — одна страница
    else if (nb && Array.isArray(nb.pages)) nb.pages.slice(0, NB_PAGES).forEach((t, i) => { pages[i] = String(t || '').slice(0, 4000); });
    s.notebook = { pages, current: clamp((nb && nb.current) | 0, 0, NB_PAGES - 1) };
    const p = Store.get(KEYS.progress, null);
    const read = Store.get(KEYS.chapters, []);
    s.reader.read = new Set(Array.isArray(read) ? read.filter(n => Number.isInteger(n) && n >= 0 && n < BOOK.length) : []);
    s.clicks.count = clamp(parseInt(Store.get(KEYS.clicks, 0), 10) || 0, 0, CLICKS_NEEDED);
    s.cycle = Math.max(47, parseInt(Store.get(KEYS.cycle, 47), 10) || 47);
    const fr = Store.get(KEYS.frags, null), okSt = ['ok', 'dist', 'dmg', 'skip'];
    s.frag = { st: {}, notes: {}, wear: 0 };
    if (fr && typeof fr === 'object') {
      if (fr.st && typeof fr.st === 'object') for (const [k, v] of Object.entries(fr.st)) if (okSt.includes(v) && +k >= 0 && +k < BOOK.length) s.frag.st[k] = v;
      if (fr.notes && typeof fr.notes === 'object') for (const [k, v] of Object.entries(fr.notes)) if (v && typeof v.t === 'string') s.frag.notes[k] = { t: v.t.slice(0, 600), k: v.k === 'dist' ? 'dist' : 'ok' };
      s.frag.wear = clamp(+fr.wear || 0, 0, 100);
    }
    s.clicks.done = s.clicks.count >= CLICKS_NEEDED;
    const ch = Store.get(KEYS.choices, null);
    if (ch && typeof ch === 'object') {
      s.choices.emotion = ch.emotion || null;
      s.choices.asked = Array.isArray(ch.asked) ? ch.asked : [];
      s.choices.finished = !!ch.finished;
    }
    if (!p || !p.act) return null;
    s.contract.signed = !!p.signed;
    s.reader.chapter = clamp(p.chapter | 0, 0, BOOK.length - 1);
    s.reader.unlocked = !!p.unlocked || s.choices.finished;
    s.reader.agreed = !!p.agreed;
    s.agingLevel = clamp(+p.agingLevel || 0, 0, 1);
    const st = p.story || {};
    s.story = {
      stage: STAGES.includes(st.stage) ? st.stage : 'explore',
      code: /^\d{12}$/.test(st.code || '') ? st.code : genCode(),
      codeOk: !!st.codeOk, cracked: !!st.cracked,
      hits: Array.isArray(st.hits) ? st.hits.filter(h => Array.isArray(h) && h.length === 2).slice(0, 3).map(([x, y]) => [clamp(+x || 0.5, 0.05, 0.95), clamp(+y || 0.5, 0.05, 0.95)]) : [],
    };
    s.readMode = p.act === 'read';
    return p;
  },
  /** новый цикл (и любая смерть): стираем прогресс, оставляем звук и свои записи в блокноте */
  wipe({ all = false } = {}) {
    [KEYS.progress, KEYS.chapters, KEYS.clicks, KEYS.choices, KEYS.frags].forEach(Store.remove);
    if (all) { Store.remove(KEYS.notebook); GameState.notebook = { pages: Array(NB_PAGES).fill(''), current: 0 }; }
    const s = GameState;
    s.act = null; s.sub = null; s.agingLevel = 0;
    s.contract.signed = false;
    s.reader.chapter = 0; s.reader.read = new Set(); s.reader.unlocked = false; s.reader.agreed = false;
    s.clicks.count = 0; s.clicks.done = false;
    s.choices.emotion = null; s.choices.asked = []; s.choices.finished = false;
    s.story = { stage: 'explore', code: genCode(), codeOk: false, cracked: false, hits: [] };
    s.readMode = false;
    s.frag = { st: {}, notes: {}, wear: 0 };
  },
};

// ---------- ИГРОВЫЕ ЧАСЫ: все таймеры сцен идут по ним и замирают на паузе ----------
const Clock = (() => {
  let t = 0, paused = false, seq = 1;
  const timers = new Map();
  return {
    now: () => t,
    get paused() { return paused; },
    setPaused(p) { paused = !!p; },
    pending: () => timers.size > 0,
    advance(ms) {
      if (paused || !timers.size) { if (!paused) t += ms; return; }
      t += ms;
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

// ---------- ЕДИНЫЙ цикл кадров: не более одного requestAnimationFrame ----------
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
  return {
    wake,
    add(id, fn) { tickers.set(id, fn); wake(); },
    /** обработчик с ограничением частоты (для canvas-эффектов — 30 FPS) */
    addThrottled(id, fps, fn) {
      const step = 1 / fps; let acc = step;
      this.add(id, (dt, now) => { acc += dt; if (acc >= step) { const d = acc; acc = 0; fn(d, now); } });
    },
    remove(id) { tickers.delete(id); if (!need() && raf && !inFrame) { cancelAnimationFrame(raf); raf = 0; } },
    has: id => tickers.has(id),
  };
})();

// ---------- Scope: таймеры (игровые часы)/слушатели/тикеры сцены, снимаются одним вызовом ----------
class Scope {
  static seq = 0;
  constructor(name) { this.name = name; this.timers = new Set(); this.listeners = []; this.tickers = new Set(); this.alive = true; this.cleanups = []; }
  timeout(fn, ms) {
    if (!this.alive) return 0;
    const id = Clock.after(ms, () => { this.timers.delete(id); if (this.alive) fn(); });
    this.timers.add(id); return id;
  }
  clear(id) { Clock.cancel(id); this.timers.delete(id); }
  /** повтор каждые ms (по игровым часам); вернёт функцию остановки */
  every(ms, fn) {
    let id = 0, on = true;
    const run = () => { if (!on) return; fn(); if (on) id = this.timeout(run, typeof ms === 'function' ? ms() : ms); };
    id = this.timeout(run, typeof ms === 'function' ? ms() : ms);
    return () => { on = false; this.clear(id); };
  }
  /** промис, который никогда не разрешится после dispose — цепочки сами обрываются */
  wait(ms) { return new Promise(res => this.timeout(res, ms)); }
  on(target, type, fn, opts) { target.addEventListener(type, fn, opts); this.listeners.push([target, type, fn, opts]); }
  tick(id, fn, fps) { const key = `${this.name}:${id}`; fps ? Loop.addThrottled(key, fps, fn) : Loop.add(key, fn); this.tickers.add(key); }
  untick(id) { const key = `${this.name}:${id}`; Loop.remove(key); this.tickers.delete(key); }
  onDispose(fn) { this.cleanups.push(fn); }
  /** кадр за кадром fn(dt, t) по игровым часам (dt ≤ 0.05 с); вернуть false — остановить; вернёт функцию остановки */
  loop(fn) {
    const id = `loop${++Scope.seq}`;
    this.tick(id, dt => { if (fn(Math.min(0.05, dt), Clock.now()) === false) this.untick(id); });
    return () => this.untick(id);
  }
  /** освободить вместе со сценой: функция или объект со stop() */
  own(x) { this.onDispose(() => { if (typeof x === 'function') x(); else if (x && x.stop) x.stop(); }); return x; }
  dispose() {
    this.alive = false;
    this.timers.forEach(id => Clock.cancel(id)); this.timers.clear();
    this.listeners.forEach(([t, ty, fn, o]) => t.removeEventListener(ty, fn, o)); this.listeners = [];
    this.tickers.forEach(k => Loop.remove(k)); this.tickers.clear();
    this.cleanups.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); this.cleanups = [];
  }
}

// ---------- модальные окна: стек, фокус-трап, Escape ----------
const Modal = (() => {
  const stack = [];
  const FOCUSABLE = 'button:not([disabled]):not([hidden]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusables = root => $$(FOCUSABLE, root).filter(el => el.offsetParent !== null || el === document.activeElement);
  function open(el, { closable = true, onClose = null, focus = null } = {}) {
    if (stack.some(m => m.el === el)) return;
    stack.push({ el, closable, onClose, prev: document.activeElement });
    el.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      const target = (focus && (typeof focus === 'string' ? $(focus, el) : focus)) || focusables(el)[0] || el;
      try { target.focus({ preventScroll: true }); } catch { /* ignore */ }
    });
  }
  function close(el, silent = false) {
    const i = stack.findIndex(m => m.el === el);
    if (i < 0) return;
    const [m] = stack.splice(i, 1);
    el.hidden = true;
    document.body.classList.toggle('modal-open', stack.length > 0);
    if (m.prev && document.contains(m.prev)) { try { m.prev.focus({ preventScroll: true }); } catch { /* ignore */ } }
    if (!silent && m.onClose) m.onClose();
  }
  function closeAll() { [...stack].reverse().forEach(m => close(m.el, true)); }
  const top = () => stack[stack.length - 1];
  document.addEventListener('keydown', e => {
    const m = top();
    if (!m) return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (m.closable) { Audio47.sfx.click(); close(m.el); }
      return;
    }
    if (e.key === 'Tab') {
      const items = focusables(m.el);
      if (!items.length) { e.preventDefault(); m.el.focus(); return; }
      const first = items[0], last = items[items.length - 1];
      if (!m.el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);
  // закрытие по кнопкам [data-close] и клику по фону
  document.addEventListener('click', e => {
    const m = top(); if (!m) return;
    if (e.target === m.el && m.closable) close(m.el);
    const btn = e.target.closest('[data-close]');
    if (btn && m.el.contains(btn)) { Audio47.sfx.click(); close(m.el); }
  });
  return { open, close, closeAll, isOpen: () => stack.length > 0, top };
})();

/** кастомное подтверждение вместо confirm() */
function askConfirm(title, text, yes = 'Да', no = 'Нет') {
  return new Promise(resolve => {
    const m = $('#confirmModal');
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    $('#confirmYes').textContent = yes;
    $('#confirmNo').textContent = no;
    let done = false;
    const finish = v => { if (done) return; done = true; Modal.close(m, true); resolve(v); };
    $('#confirmYes').onclick = () => { Audio47.sfx.click(); finish(true); };
    $('#confirmNo').onclick = () => { Audio47.sfx.click(); finish(false); };
    Modal.open(m, { onClose: () => finish(false), focus: '#confirmNo' });
  });
}

/** печать текста в элемент (для реплик) */
function setText(el, text, cls) { el.textContent = text; if (cls !== undefined) el.className = cls; }
