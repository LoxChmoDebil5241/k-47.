/* ==========================================================================
   Глава 33 · «Лекция» — СТОЯТЬ У СТЕНЫ И ЗАПОМНИТЬ
   Живые сидят на полу. Трое клонов стоят у дальней стены — им не приказали
   садиться. К-14 запоминает всё: каждое слово, каждый цвет эпипена.
   Карточки-пары «препарат ↔ примета». Когда лектор смотрит на клонов —
   руки неподвижно, взгляд не отводить.
   ========================================================================== */
defineFrag(32, {
  id: 'lecture', name: 'Каждый цвет эпипена',
  text: 'К-14 пошёл первым. Он знал, что запомнит всё. Каждое слово. Каждый жест. Каждый цвет эпипена. Каждый запрет. Он запомнил даже то, как пахнет в этом зале — потом, машинным маслом и страхом.',
  how: 'Карточки лежат рубашкой вверх: препараты и их приметы. Открывай по две — найди все пары. Когда взгляд лектора (красный луч) останавливается на клонах у стены — не трогай карточки: «Сидеть. Я не сказал "встать"». Ошибок можно не больше десяти, замечаний — не больше двух.',
  keys: 'ТАП / КЛИК — ОТКРЫТЬ КАРТОЧКУ · СТРЕЛКИ + ПРОБЕЛ — С КЛАВИАТУРЫ',
  note: 'Эфедрин — полграмма. Дизоксиэфедрин — одна ампула, две — сердце через семь минут. Гиперзин — красный эпипен с жёлтой этикеткой. Ноктюрин — синий, «N». Нас не воскресят, если мы убьём себя сами. Это не входит в контракт.',
  mem: 'НЕ ВХОДИТ В КОНТРАКТ', start: gameLecture,
});

function gameLecture(ctx) {
  const { scope } = ctx;
  const PAIRS = [
    ['ЭФЕДРИН', 'белый порошок · под язык · через 15 минут', '#efe6cf'],
    ['ДИЗОКСИЭФЕДРИН', 'одна ампула в бедро · две — сердце через 7 минут', '#88ddff'],
    ['ГИПЕРЗИН', 'красный эпипен с жёлтой этикеткой · 5–10 минут', '#ff0033'],
    ['АРАНЕПС', 'канистра · два глотка в сутки', '#ffb347'],
    ['ИМПЕДРИЗИН', 'отключает сознание · 40 минут до реанимации', '#6b6b70'],
    ['ФЕНТАНИЛ', 'запрещён · трибунал · пуля в затылок', '#8a0a18'],
    ['НОКТЮРИН', 'синий ингалятор, зелёная «N» · 3–5 секунд', '#4aa8d8'],
  ];
  const deck = shuffle(PAIRS.flatMap((p, i) => [{ id: i, face: p[0], kind: 'name', col: p[2] }, { id: i, face: p[1], kind: 'fact', col: p[2] }]));
  const wrap = ctx.el('div', 'lc-wrap');
  const C = ctx.canvas(ctx.el('div', 'lc-holo', wrap));
  const grid = ctx.el('div', 'lc-grid', wrap);
  let open = [], found = 0, misses = 0, strikes = 0, over = false, t = 0, lock = false, cur = 0;
  let gaze = 0.1, gazeDir = 1, gazeHold = 0;
  const cards = deck.map((d, i) => {
    const b = ctx.el('button', 'lc-card', grid, `<span class="lc-back">К-47</span><span class="lc-face ${d.kind}" style="--c:${d.col}">${esc(d.face)}</span>`);
    b.setAttribute('aria-label', `Карточка ${i + 1}, закрыта`);
    scope.on(b, 'click', () => flipRef(i));
    return { ...d, b, done: false };
  });
  const upd = () => ctx.stat(`ПАРЫ ${found}/${PAIRS.length} · ОШИБКИ ${misses}/10 · ЗАМЕЧАНИЯ ${strikes}/2`);
  upd();
  ctx.hint('ЛУЧ НА КЛОНАХ — РУКИ НЕПОДВИЖНО');
  const vent = scope.own(A.loopNoise({ type: 'lowpass', freq: 500, q: 0.4, vol: 0 }));
  vent.vol(0.02, 1);
  const onUs = () => gaze > 0.78;
  let flipRef = () => {};

  return new Promise(resolve => {
    flipRef = i => flip(i);
    function flip(i) {
      if (over || lock) return;
      const c = cards[i];
      if (c.done || open.includes(c)) return;
      if (onUs()) {
        strikes++; A.sfx.buzz(); FX.shake('sm');
        ctx.say(strikes === 1 ? '— Сидеть. Я не сказал «встать».' : '— Ты. Да, ты, у стены.', { pos: 'top', cls: 'red' }); scope.timeout(() => ctx.unsay('top'), 1600);
        upd();
        if (strikes > 2) return end(false, 'Лектор кивнул смотрителю. Клона увели раньше конца лекции.');
        return;
      }
      c.b.classList.add('open'); c.b.setAttribute('aria-label', c.face); open.push(c); A.sfx.type(0.04);
      if (open.length === 2) {
        const [a, b] = open;
        if (a.id === b.id) {
          a.done = b.done = true; open = []; found++;
          a.b.classList.add('done'); b.b.classList.add('done'); A.sfx.chime(620 + found * 40, 0.04);
          upd();
          if (found >= PAIRS.length) end(true);
        } else {
          misses++; lock = true; A.sfx.click(); upd();
          scope.timeout(() => { a.b.classList.remove('open'); b.b.classList.remove('open'); a.b.setAttribute('aria-label', 'Карточка, закрыта'); b.b.setAttribute('aria-label', 'Карточка, закрыта'); open = []; lock = false; }, 900);
          if (misses > 10) end(false, 'Слова путались. Цвета эпипенов сливались в один.');
        }
      }
    }
    const cols = () => (grid.clientWidth < 520 ? 3 : grid.clientWidth < 760 ? 4 : 7);
    ctx.keys(e => {
      const n = cards.length, w = cols();
      if (e.code === 'ArrowRight') cur = (cur + 1) % n;
      else if (e.code === 'ArrowLeft') cur = (cur - 1 + n) % n;
      else if (e.code === 'ArrowDown') cur = Math.min(n - 1, cur + w);
      else if (e.code === 'ArrowUp') cur = Math.max(0, cur - w);
      else if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); flip(cur); return; }
      else return;
      e.preventDefault(); cards[cur].b.focus({ preventScroll: true });
    });
    async function end(ok, why) {
      over = true; vent.vol(0, 0.5);
      if (ok) {
        await ctx.line('— Вопросы? — спросил лектор. Никто не ответил.', { pos: 'top', ms: 2200 });
        await ctx.line('— Мы не восстанавливаем тех, кто убил себя сам. Это не входит в контракт.', { pos: 'top', cls: 'red', ms: 3000 });
        resolve({ ok: 'ok', detail: `ОШИБОК ${misses} · ЗАМЕЧАНИЙ ${strikes}` });
      } else {
        await ctx.line(why, { pos: 'top', cls: 'red', ms: 2600 });
        resolve({ ok: 'fail', detail: `ПАР ${found} ИЗ ${PAIRS.length}` });
      }
    }
    scope.loop(dt => {
      t += dt;
      if (gazeHold > 0) gazeHold -= dt;
      else { gaze += gazeDir * dt * 0.28; if (gaze > 1 || gaze < 0) { gazeDir *= -1; gaze = clamp(gaze, 0, 1); gazeHold = gaze > 0.5 ? rand(1.4, 2.6) : rand(0.3, 1.2); if (gaze > 0.5) A.sfx.step(0.1, 0.6); } }
      wrap.classList.toggle('watched', onUs());
      draw();
    });
    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#0b0a0a'; g.fillRect(0, 0, W, H);
      // голограмма над головами: схема тела
      Art.holo(g, W * 0.3, 6, W * 0.4, H - 12, t);
      g.strokeStyle = 'rgba(255,0,51,.7)'; g.lineWidth = 1.5;
      const hx = W / 2, hy = H * 0.2, s = H * 0.7;
      g.beginPath(); g.arc(hx, hy, s * 0.08, 0, Math.PI * 2); g.moveTo(hx, hy + s * 0.08); g.lineTo(hx, hy + s * 0.5); g.moveTo(hx - s * 0.18, hy + s * 0.2); g.lineTo(hx + s * 0.18, hy + s * 0.2); g.stroke();
      g.fillStyle = `rgba(255,0,51,${0.5 + 0.4 * Math.sin(t * 4)})`; g.beginPath(); g.arc(hx - s * 0.03, hy + s * 0.2, 4, 0, Math.PI * 2); g.fill();
      // зал: сидящие живые, три клона у стены справа
      for (let i = 0; i < 12; i++) Art.human(g, W * (0.05 + i * 0.05), H * 1.05, H * 0.45, 'man', { color: '#050505' });
      [0.84, 0.9, 0.96].forEach((x, i) => Art.human(g, W * x, H * 1.02, H * 0.85, 'man', { color: '#030303', eyes: i === 1 ? '#fff' : '#bbb' }));
      // луч взгляда лектора
      const lx = W * 0.22, gx = lerp(W * 0.1, W * 0.93, gaze);
      g.fillStyle = onUs() ? 'rgba(255,0,51,.2)' : 'rgba(255,0,51,.07)';
      g.beginPath(); g.moveTo(lx, H * 0.3); g.lineTo(gx - 30, H); g.lineTo(gx + 30, H); g.closePath(); g.fill();
      Art.human(g, lx, H * 1.02, H * 0.9, 'man', { color: '#0d0b0a', eyes: '#d6e8ff' });
      Art.vignette(g, W, H, 0.5);
    }
  });
}
