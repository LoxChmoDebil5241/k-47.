/* ==========================================================================
   Глава 43 · «Пропасть» — ЗАЧЕМ?
   К-46 лежит. Тёплая, уютная пустота. Имя скользит, как капля по стеклу.
   В темноте всплывают обрывки — «Кристиан», камушек, картошка, «ты
   справишься», соль. Удержи их, прежде чем растворятся. Если не делать
   ничего — пустота станет нормой. Потом — встать и идти; следы высыхают.
   ========================================================================== */
defineFrag(42, {
  id: 'abyss', name: 'Следы геля',
  text: 'Он смотрел на эти следы. Они были единственным доказательством того, что он вообще здесь был. Что он существовал. Что его тело было реальным, а не галлюцинацией в нейропрофиле.',
  how: 'В темноте всплывают обрывки памяти. Наведи и держи на обрывке, пока он не станет чётким, — он тает и уплывает. Пустота тёплая: пока ты ничего не держишь, она растёт. Удержи хотя бы пять. Потом встань и иди за санитаром: ← → по очереди.',
  keys: 'ДЕРЖАТЬ ПАЛЕЦ / КУРСОР НА ОБРЫВКЕ · ЗАЖАТЬ ПРОБЕЛ — БЛИЖАЙШИЙ · ← → — ШАГИ',
  note: 'К-46. Кристиан. Комаров. Цифры не складывались в образ. Через минуту гель высохнет, следы исчезнут. Но я поймал камушек, картошку и «ты справишься» — и пошёл.',
  noteDist: 'В этой записи пустота стала нормой. Я не поймал ни одного слова. Архив говорит, что я всё-таки встал.',
  mem: 'ЗАЧЕМ?', start: gameAbyss,
});

function gameAbyss(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const MEM = ['К-46', 'Кристиан', 'Комаров', 'фотография в кармане', 'камушек', 'картошка в фольге', '«Ты справишься»', 'соль на губах', 'шоколадка', 'бабочка', 'Берлога', '«Ты живой»'];
  let t = 0, over = false, phase = 'void', px = -1, py = -1, frags = [], nextF = 0.6, caught = 0, lost = 0, voidK = 0, kbHold = false, steps = 0, lastFoot = '', prints = [];
  const VOID_T = 42;
  const vM = ctx.meter('ПУСТОТА', { left: 14, top: 14 });
  ctx.hint('ДЕРЖИ ОБРЫВОК, ПОКА НЕ СТАНЕТ ЧЁТКИМ');
  const tone = scope.own(A.loopOsc({ type: 'sine', freq: 48, vol: 0 }));
  tone.vol(0.04, 3);
  const upd = () => ctx.stat(`ПОЙМАНО ${caught} · РАСТАЯЛО ${lost}`);
  upd();

  return new Promise(resolve => {
    const mv = e => { const r = C.cv.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; };
    scope.on(C.cv, 'pointermove', mv); scope.on(C.cv, 'pointerdown', mv);
    scope.on(C.cv, 'pointerleave', () => { px = py = -1; });
    ctx.keys(e => {
      if (phase === 'void' && e.code === 'Space') { e.preventDefault(); kbHold = true; }
      if (phase === 'walk') { if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); step('L'); } if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); step('R'); } }
    });
    scope.on(document, 'keyup', e => { if (e.code === 'Space') kbHold = false; });
    function walkPhase() {
      phase = 'walk'; vM.el.hidden = true;
      ctx.hint('← → ПО ОЧЕРЕДИ · СЛЕДУЙ ЗА САНИТАРОМ');
      ctx.say('— Следуй за мной, — сказал санитар.', { pos: 'top' }); scope.timeout(() => ctx.unsay('top'), 2200);
      const box = ctx.el('div', 'ctl');
      const l = ctx.el('button', 'btn big-btn', box, '← ЛЕВОЙ'), r = ctx.el('button', 'btn big-btn', box, 'ПРАВОЙ →');
      scope.on(l, 'pointerdown', e => { e.preventDefault(); step('L'); }); scope.on(r, 'pointerdown', e => { e.preventDefault(); step('R'); });
    }
    function step(f) {
      if (phase !== 'walk' || over || f === lastFoot) return;
      lastFoot = f; steps++; A.sfx.step(0.2, f === 'L' ? -0.2 : 0.2);
      prints.push({ x: 0.1 + steps * 0.045, f, age: 0 });
      ctx.stat(`ШАГ ${steps}/18`);
      if (steps >= 18) end();
    }
    async function end() {
      over = true; tone.vol(0, 1.5);
      await ctx.line('За его спиной капсула закрылась с тем же усталым шипением.', { pos: 'top', ms: 2400 });
      await ctx.line('Его влажные следы на полу уже начали сохнуть.', { pos: 'top', ms: 2400 });
      if (caught >= 5) resolve({ ok: 'ok', detail: `ПОЙМАНО ${caught} ИЗ ${caught + lost}` });
      else if (caught === 0 || voidK >= 1) resolve({ ok: 'dist', detail: 'ПУСТОТА — НОРМА' });
      else resolve({ ok: 'fail', detail: `ПОЙМАНО ${caught} ИЗ ${caught + lost}` });
    }
    scope.loop(dt => {
      t += dt;
      if (!over && phase === 'void') {
        nextF -= dt;
        if (nextF <= 0 && frags.length < 3) {
          nextF = rand(1.4, 2.6);
          const txt = MEM[(caught + lost) % MEM.length];
          frags.push({ txt, x: rand(0.15, 0.85), y: rand(0.2, 0.75), vx: rand(-0.03, 0.03), vy: rand(-0.02, 0.02), life: rand(4.5, 6), age: 0, focus: 0 });
        }
        let holding = false;
        const kbTarget = kbHold ? frags[0] : null;
        frags.forEach(f => {
          f.age += dt; f.x += f.vx * dt + Math.sin(t + f.y * 9) * 0.004; f.y += f.vy * dt;
          const on = f === kbTarget || (px >= 0 && Math.hypot(f.x * C.W - px, f.y * C.H - py) < 70);
          if (on) { f.focus += dt / 1.8; holding = true; if (Math.random() < dt * 4) A.sfx.type(0.02); }
          else f.focus = Math.max(0, f.focus - dt * 0.4);
          if (f.focus >= 1) { f.done = true; caught++; A.sfx.chime(440 + caught * 50, 0.04); ctx.say(f.txt, { pos: 'mid', cls: 'amb' }); scope.timeout(() => ctx.unsay('mid'), 1300); upd(); }
          else if (f.age >= f.life) { f.done = true; lost++; upd(); }
        });
        frags = frags.filter(f => !f.done);
        voidK = clamp(voidK + dt * (holding ? -0.04 : 0.03), 0, 1);
        vM.set(voidK);
        tone.vol(0.02 + voidK * 0.05);
        if (t >= VOID_T || voidK >= 1) { frags = []; walkPhase(); }
      }
      prints.forEach(p => { p.age += dt; });
      draw();
    });
    function draw() {
      const { g, W, H } = C;
      if (phase === 'void') {
        g.fillStyle = `rgb(${8 + voidK * 12 | 0},${6 + voidK * 6 | 0},${6 + voidK * 4 | 0})`; g.fillRect(0, 0, W, H);
        // тёплая пустота
        const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
        gr.addColorStop(0, `rgba(60,30,20,${0.2 + voidK * 0.4})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        frags.forEach(f => {
          const x = f.x * W, y = f.y * H, fade = Math.min(1, f.age * 2) * Math.min(1, (f.life - f.age) * 1.2);
          g.globalAlpha = Math.max(0, fade);
          g.font = `${Math.round(16 + f.focus * 8)}px ${MONO}`; g.textAlign = 'center';
          g.fillStyle = f.focus > 0.05 ? `rgba(239,230,207,${0.4 + f.focus * 0.6})` : 'rgba(143,176,196,.45)';
          g.fillText(f.focus > 0.6 ? f.txt : glitchPlain(f.txt, 1 - f.focus, f.age), x, y);
          if (f.focus > 0) { g.strokeStyle = 'rgba(255,179,71,.6)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y - 5, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f.focus); g.stroke(); }
          g.globalAlpha = 1;
        });
      } else {
        // белая капсульная, перфорированный пол, следы геля сохнут
        g.fillStyle = '#e8ecee'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#c9cfd3'; g.fillRect(0, H * 0.6, W, H * 0.4);
        g.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < W; x += 14) for (let y = H * 0.62; y < H; y += 14) g.fillRect(x, y, 3, 3);
        prints.forEach(p => { const a = Math.max(0, 0.6 - p.age * 0.06); g.fillStyle = `rgba(90,150,180,${a})`; g.beginPath(); g.ellipse(p.x * W, H * (p.f === 'L' ? 0.8 : 0.86), 8, 16, 0, 0, Math.PI * 2); g.fill(); });
        const k = Math.min(1, steps / 18);
        Art.human(g, W * (0.2 + k * 0.6), H * 0.84, H * 0.5, 'man', { color: '#6b6b70' });
        Art.human(g, W * (0.1 + k * 0.6), H * 0.84, H * 0.52, 'man', { color: '#1a1a1c', eyes: '#fff' });
      }
      Art.vignette(g, W, H, phase === 'void' ? 0.8 : 0.3);
    }
  });
}
/** плоский глитч для canvas-текста */
function glitchPlain(s, k, seed) {
  const r = mulberry(Math.floor(seed * 7) + s.length);
  return [...s].map(c => (c !== ' ' && r() < k * 0.7 ? GL_CHARS[Math.floor(r() * GL_CHARS.length)] : c)).join('');
}
