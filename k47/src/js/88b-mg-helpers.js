/* ==========================================================================
   МИНИ-ИГРЫ · ОБЩИЕ ПРИЁМЫ для новых глав
   Викторина с таймером, слайды-голограммы лектора, кнопка удержания,
   фон бетонной камеры, тикающий таймер с полоской.
   ========================================================================== */

/**
 * Викторина: items — [{ q, opts: [...], a: индекс верного, why?, pic?(g, W, H, t) }].
 * Клавиши 1…N, кнопки, полоска времени на вопрос. Вернёт { right, answers: [индексы] }.
 * judge(item, k) — своя проверка (вернуть 'ok' | 'dist' | 'bad'), иначе сравнение с a.
 */
async function mgQuiz(ctx, items, { time = 14, title = '', judge = null, cls = '' } = {}) {
  const { scope } = ctx;
  const box = ctx.el('div', `qz ${cls}`);
  const head = ctx.el('p', 'qz-title', box, esc(title));
  const picWrap = ctx.el('div', 'qz-pic', box);
  const qEl = ctx.el('p', 'qz-q', box);
  const opts = ctx.el('div', 'qz-opts', box);
  const bar = ctx.el('div', 'qz-bar', box, '<i></i>');
  const why = ctx.el('p', 'qz-why', box);
  let pic = null;
  if (items.some(x => x.pic)) pic = ctx.canvas(picWrap);
  else picWrap.remove();
  let right = 0; const answers = [], verdicts = [];
  for (let n = 0; n < items.length; n++) {
    if (!scope.alive) return { right, answers, verdicts };
    const it = items[n];
    head.textContent = `${title}${title ? ' · ' : ''}${n + 1} / ${items.length}`;
    qEl.textContent = it.q; why.textContent = ''; opts.innerHTML = '';
    let drawT = 0;
    const stopPic = pic && it.pic ? scope.loop(dt => { drawT += dt; pic.g.clearRect(0, 0, pic.W, pic.H); it.pic(pic.g, pic.W, pic.H, drawT); }) : null;
    if (pic) picWrap.style.display = it.pic ? '' : 'none';
    const k = await new Promise(res => {
      let done = false, left = time;
      const fin = v => { if (done) return; done = true; res(v); };
      const btns = it.opts.map((o, j) => { const b = ctx.el('button', 'btn', opts, `<b>${j + 1}</b> ${esc(o)}`); b.addEventListener('click', () => fin(j)); return b; });
      requestAnimationFrame(() => btns[0] && btns[0].focus({ preventScroll: true }));
      const kh = e => { const v = parseInt(e.key, 10); if (!done && v >= 1 && v <= it.opts.length) { e.preventDefault(); fin(v - 1); } };
      scope.on(document, 'keydown', kh);
      const i = $('i', bar);
      const stop = scope.loop(dt => {
        if (done) return false;
        left -= dt; i.style.width = `${Math.max(0, left / time) * 100}%`;
        i.classList.toggle('hot', left < time * 0.3);
        if (left <= 0) { fin(-1); return false; }
      });
      scope.onDispose(stop);
    });
    if (stopPic) stopPic();
    const btns = $$('.btn', opts);
    btns.forEach(b => { b.disabled = true; });
    const v = judge ? judge(it, k) : (k === it.a ? 'ok' : 'bad');
    verdicts.push(v); answers.push(k);
    if (it.a >= 0 && btns[it.a]) btns[it.a].classList.add('right');
    if (v === 'ok') { right++; A.sfx.chime(700, 0.05); }
    else { if (k >= 0 && btns[k]) btns[k].classList.add(v === 'dist' ? 'sel' : 'wrong'); A.sfx.buzz(); if (k < 0) why.textContent = 'ВРЕМЯ ВЫШЛО. '; }
    if (it.why) why.textContent += it.why;
    await scope.wait(v === 'ok' ? 1100 : 2300);
  }
  box.remove();
  return { right, answers, verdicts };
}

/**
 * Слайды лектора: красная голограмма + крупный заголовок + факты.
 * slides — [{ t: 'ЭФЕДРИН', lines: ['…'], draw?(g, W, H, t), ms? }]. Тап / пробел — дальше.
 */
async function mgSlides(ctx, slides, { voice = 'ЛЕКТОР', ms = 5200, color = '255,0,51' } = {}) {
  const { scope } = ctx;
  const box = ctx.el('div', 'lec');
  const cvWrap = ctx.el('div', 'lec-holo', box);
  const C = ctx.canvas(cvWrap);
  const txt = ctx.el('div', 'lec-txt', box);
  const nav = ctx.el('div', 'lec-nav', box);
  const next = ctx.el('button', 'btn', nav, 'ДАЛЬШЕ ▸');
  const cnt = ctx.el('span', 'lec-cnt', nav);
  let t = 0, idx = 0, left = 0, go = null;
  const draw = () => {
    const { g, W, H } = C, s = slides[idx];
    g.clearRect(0, 0, W, H);
    Art.holo(g, 4, 4, W - 8, H - 8, t, color);
    if (s && s.draw) { g.save(); s.draw(g, W, H, t); g.restore(); }
    if (Math.random() < 0.04) { g.fillStyle = `rgba(${color},.18)`; g.fillRect(0, Math.random() * H, W, 2 + Math.random() * 6); }
  };
  const stop = scope.loop(dt => { t += dt; left -= dt; draw(); if (left <= 0 && go) go(); });
  const advance = () => { if (go) go(); };
  scope.on(next, 'click', advance);
  scope.on(C.cv, 'pointerdown', advance);
  ctx.keys(e => { if (e.code === 'Space' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); advance(); } });
  for (idx = 0; idx < slides.length; idx++) {
    const s = slides[idx];
    txt.innerHTML = `<p class="lec-who">${esc(voice)}</p><h3>${esc(s.t)}</h3>${(s.lines || []).map(l => `<p>${esc(l)}</p>`).join('')}`;
    cnt.textContent = `${idx + 1} / ${slides.length}`;
    left = (s.ms || ms) / 1000; A.sfx.beep(700, 0.05, 0.03);
    await new Promise(res => { go = () => { go = null; res(); }; });
    if (!scope.alive) return;
  }
  stop();
  box.remove();
}

/** большая кнопка удержания (палец / мышь / клавиша key): { el, down } */
function mgHold(ctx, label, { key = 'Space', parent = null, cls = '' } = {}) {
  const { scope } = ctx;
  const wrap = parent || ctx.el('div', 'ctl');
  const b = ctx.el('button', `btn big-btn hold ${cls}`, wrap, esc(label));
  const st = { el: b, wrap, down: false, onDown: null, onUp: null };
  const on = e => { if (e) e.preventDefault(); if (st.down) return; st.down = true; b.classList.add('on'); st.onDown && st.onDown(); };
  const off = () => { if (!st.down) return; st.down = false; b.classList.remove('on'); st.onUp && st.onUp(); };
  scope.on(b, 'pointerdown', e => { try { b.setPointerCapture(e.pointerId); } catch { /* */ } on(e); });
  scope.on(b, 'pointerup', off); scope.on(b, 'pointercancel', off); scope.on(b, 'lostpointercapture', off);
  scope.on(document, 'keydown', e => { if (e.code === key && !e.repeat) on(e); });
  scope.on(document, 'keyup', e => { if (e.code === key) off(); });
  return st;
}

/** бетонная камера: стены, пол, лампа под потолком (для «Быта», «Соли», «Линии»…) */
function drawCell(g, W, H, { t = 0, lamp = 1, tint = '255,236,200', floor = 0.72, seed = 22 } = {}) {
  const R = mulberry(seed);
  const wall = g.createLinearGradient(0, 0, 0, H * floor);
  wall.addColorStop(0, '#1b1b1e'); wall.addColorStop(1, '#2a2a2e');
  g.fillStyle = wall; g.fillRect(0, 0, W, H * floor);
  const fl = g.createLinearGradient(0, H * floor, 0, H);
  fl.addColorStop(0, '#202024'); fl.addColorStop(1, '#0c0c0e');
  g.fillStyle = fl; g.fillRect(0, H * floor, W, H * (1 - floor));
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1;
  for (let i = 0; i < 14; i++) { const x = R() * W, y = R() * H * floor; g.beginPath(); g.moveTo(x, y); let px = x, py = y; for (let k = 0; k < 5; k++) { px += (R() - 0.5) * 30; py += R() * 18; g.lineTo(px, py); } g.stroke(); }
  for (let i = 0; i < 9; i++) { const x = R() * W, y = R() * H * floor, r = 10 + R() * 50; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(10,10,12,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  const flick = lamp * (0.92 + 0.08 * Math.sin(t * 31) * (Math.random() < 0.05 ? 3 : 1));
  const lg = g.createRadialGradient(W / 2, 0, 10, W / 2, 0, Math.max(W, H) * 0.8);
  lg.addColorStop(0, `rgba(${tint},${0.28 * flick})`); lg.addColorStop(1, `rgba(${tint},0)`);
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  g.fillStyle = `rgba(${tint},${0.9 * flick})`; g.fillRect(W / 2 - 30, 0, 60, 5);
}

/** таймер с полоской в шапке: вернёт { left(), stop() }; onEnd — по истечении */
function mgTimer(ctx, seconds, onEnd, { label = '' } = {}) {
  let left = seconds, on = true;
  const stop = ctx.scope.loop(dt => {
    if (!on) return false;
    left -= dt;
    if (label) ctx.stat(`${label} ${Math.max(0, Math.ceil(left))} С`);
    if (left <= 0) { on = false; onEnd && onEnd(); return false; }
  });
  return { left: () => Math.max(0, left), stop() { on = false; stop(); }, add(s) { left += s; } };
}
