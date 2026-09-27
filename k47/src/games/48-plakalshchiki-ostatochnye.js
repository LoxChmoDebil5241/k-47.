/* ==========================================================================
   Глава 48 · перенесено из прототипа «Мини-игры» (механика сохранена)
   ========================================================================== */
defineFrag(47, {
  id: "residual", name: "Остаточные данные",
  text: "Помнят. Записывают в тайные файлы. Передают камушек из рук в руки, из кармана в карман, из смерти в жизнь. Кладут шоколад в левый нагрудный карман перед вылетом. Настраивают капсулы так, чтобы было чуть тише.",
  how: "Годы, циклы, К-82, К-103, К-134… Память К-47 стирается. То, что передают плакальщики, всплывает и тает — лови. Уместится только три. Шум тоже притворяется памятью. Чем больше фрагментов восстановлено, тем ярче воспоминания.",
  keys: "ТАП / КЛИК ПО ВОСПОМИНАНИЮ · 3 ЯЧЕЙКИ · TAB + ENTER ТОЖЕ РАБОТАЕТ",
  note: "Я что-то унёс с собой.",
  mem: null, start: ctx => gameResidual(ctx),
});

/* ==========================================================================
   Ф-10 · ОСТАТОЧНЫЕ ДАННЫЕ — «Пробуждение». Поймать, что унесёшь в К-48.
   ========================================================================== */
function gameResidual(ctx) {
  const { scope } = ctx;
  const DUR = 22, SLOTS = 3;
  const rsd = ctx.el('div', 'rsd');
  const hud = ctx.el('div', 'rsd-hud', rsd);
  const field = ctx.el('div', '', rsd); field.style.cssText = 'position:absolute;inset:0;z-index:4';
  const slotsEl = ctx.el('div', 'rsd-slots', rsd);
  const slots = Array.from({ length: SLOTS }, () => ctx.el('div', 'rsd-slot', slotsEl, 'ПУСТО'));
  const voice = ctx.el('p', 'rsd-voice', rsd);
  const bub = scope.own(A.loopNoise({ type: 'lowpass', freq: 380, q: 1.4, vol: 0 }));
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 58, vol: 0 }));
  bub.vol(.05, 1.5); hum.vol(.03, 1.5);
  const strong = FRAGS.filter(F => F && F.mem && (Frag.status(F.ch) === 'ok' || Frag.status(F.ch) === 'dist')).map(F => ({ label: F.mem, id: F.id }));
  const WEAK = ['МАМА', 'ТРАВА', 'РАЗ, ДВА, ТРИ…', 'ЛАДОНЬ НА ПЛЕЧЕ', '«НОРМАЛЬНО, КОМАРОВ»', 'МЕТИНА', 'ЗВЕЗДА НА ЗАПАДЕ',
    'СЕРЫЙ КАМУШЕК', 'КРОШКИ КАРТОШКИ', 'ШОКОЛАД В ЛЕВОМ КАРМАНЕ', 'СТИХИ ВПОЛГОЛОСА', 'НА ПОЛ-АТМОСФЕРЫ ТИШЕ', 'СОЛЬ НА ГУБАХ'];
  const JUNK = ['▒▒▒▒▒', 'ERR_0x47', '░░ШУМ░░', 'NULL', '▓▓▓ ▓▓', 'К-4█'];
  const caught = [];
  const mems = [];
  let e = 0, spawnT = .6, over = false, beatT = 0, tickT = 1;
  const rows = [['СИСТЕМА КАПСУЛЫ КР-48', ''], ['РЕГЕНЕРАЦИЯ БИОМАССЫ', '100%'], ['НЕЙРОПРОФИЛЬ К-47 → К-48', 'ЗАГРУЗКА'], ['ПАМЯТЬ ЦИКЛА 47', 'УДАЛЕНИЕ 0%'], ['ОСТАТОЧНЫЕ ДАННЫЕ', '0,00%']];
  const hudB = [];
  rows.forEach(([k, v], i) => scope.timeout(() => {
    const p = ctx.el('p', '', hud, '<span></span><b></b>');
    p.firstChild.textContent = k; p.lastChild.textContent = v; hudB[i] = p.lastChild;
    A.sfx.beep(i === 3 ? 520 : 1400, .06, .04);
  }, 300 + i * 450));
  ctx.hint('ЛОВИ ВОСПОМИНАНИЯ КАСАНИЕМ · 3 ЯЧЕЙКИ · ПУНКТИР — ШУМ, НЕ ЛОВИ');
  if (!strong.length) { ctx.say('Восстановленных фрагментов нет — воспоминания будут бледными.', { pos: 'mid', cls: 'ice' }); scope.timeout(() => ctx.unsay('mid'), 3200); }
  const realCount = () => caught.filter(c => !c.junk).length;
  const resid = () => (realCount() * .47 / SLOTS).toFixed(2).replace('.', ',');

  return new Promise(resolve => {
    function spawn() {
      const r = Math.random();
      let kind, label, id = null;
      if (r < .3) { kind = 'junk'; label = pick(JUNK); }
      else if (strong.length && r < .72) { kind = 'strong'; const s = pick(strong); label = s.label; id = s.id; }
      else { kind = 'weak'; label = pick(WEAK); }
      if (mems.some(m => m.label === label && m.alive) || (kind !== 'junk' && caught.some(c => c.label === label))) return;
      const b = document.createElement('button');
      b.className = `mem${kind === 'weak' ? ' dim' : ''}${kind === 'junk' ? ' junk' : ''}`;
      b.textContent = label;
      field.appendChild(b);
      const fw = field.clientWidth, fh = field.clientHeight;
      const m = { b, label, id, kind, alive: true, t: 0, life: kind === 'strong' ? 5.6 : kind === 'weak' ? 3.8 : 4.6, x: rand(.06, .72) * fw, y: rand(.3, .72) * fh, vy: -rand(12, 26), vx: rand(-8, 8) };
      mems.push(m);
      b.addEventListener('click', () => grab(m));
      b.setAttribute('aria-label', `Воспоминание: ${label}`);
    }
    function grab(m) {
      if (!m.alive || over) return;
      if (caught.length >= SLOTS) { A.sfx.buzz(); return; }
      m.alive = false; m.b.classList.add('caught');
      scope.timeout(() => m.b.remove(), 520);
      caught.push({ label: m.kind === 'junk' ? 'ШУМ' : m.label, id: m.id, junk: m.kind === 'junk' });
      const s = slots[caught.length - 1];
      s.textContent = m.kind === 'junk' ? 'ШУМ' : m.label;
      s.className = `rsd-slot full${m.kind === 'junk' ? ' junk' : ''}`;
      if (m.kind === 'junk') A.sfx.glitch(); else A.sfx.chime(m.kind === 'strong' ? 880 : 660, .06);
      if (hudB[4]) hudB[4].textContent = `${resid()}%`;
      if (caught.length >= SLOTS) scope.timeout(() => finish(), 900);
    }
    async function finish() {
      if (over) return;
      over = true;
      mems.forEach(m => { if (m.alive) { m.alive = false; m.b.style.transition = 'opacity .8s, filter .8s'; m.b.style.opacity = '0'; m.b.style.filter = 'blur(6px)'; } });
      if (hudB[3]) hudB[3].textContent = 'УДАЛЕНА';
      if (hudB[2]) hudB[2].textContent = 'ЗАГРУЖЕН';
      A.sfx.heartbeat(.5);
      await scope.wait(1500);
      voice.textContent = `К-${GameState.cycle + 1}. Подъём.`;
      voice.classList.add('show');
      A.sfx.mumble(1.4, .72, .12);
      await scope.wait(3200);
      const real = caught.filter(c => !c.junk);
      if (real.length) {
        Store.set(KEYS.residual, { from: GameState.cycle, to: GameState.cycle + 1, items: real.map(c => ({ id: c.id, label: c.label })), t: Date.now() });
        resolve({ ok: 'ok', detail: `ОСТАТОЧНЫЕ ДАННЫЕ ${resid()}%`, note: `Я унёс с собой: ${real.map(c => c.label.toLowerCase()).join(', ')}.` });
      } else {
        resolve({ ok: 'fail', detail: caught.length ? 'УНЕСЁН ТОЛЬКО ШУМ' : 'НИЧЕГО НЕ УНЕСЕНО' });
      }
    }
    scope.loop(dt => {
      if (!over) {
        e += dt;
        spawnT -= dt;
        if (spawnT <= 0) { spawnT = rand(.5, .85); spawn(); }
        const p = Math.min(100, Math.round(e / DUR * 100));
        if (hudB[3]) hudB[3].textContent = `УДАЛЕНИЕ ${p}%`;
        tickT -= dt; if (tickT <= 0) { tickT = 1; A.sfx.beep(1500, .03, .02); }
        beatT -= dt; if (beatT <= 0) { beatT = 1.1; A.sfx.heartbeat(.22); }
        ctx.stat(`ЯЧЕЕК ${caught.length}/${SLOTS} · УДАЛЕНИЕ ${p}%`);
        if (e >= DUR) finish();
      }
      mems.forEach(m => {
        if (!m.alive) return;
        m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt;
        const k = m.t / m.life, a = k < .12 ? k / .12 : k > .6 ? Math.max(0, 1 - (k - .6) / .4) : 1;
        m.b.style.transform = `translate(${m.x}px, ${m.y}px)`;
        m.b.style.opacity = String(a);
        m.b.style.filter = k > .6 ? `blur(${(k - .6) * 8}px)` : 'none';
        if (k > .55 && Math.random() < dt * 3 && m.kind !== 'junk') {
          const chars = [...m.b.textContent], i = Math.floor(Math.random() * chars.length);
          if (chars[i] !== ' ') { chars[i] = pick(['░', '▒']); m.b.textContent = chars.join(''); }
        }
        if (k >= 1) { m.alive = false; m.b.remove(); }
      });
      for (let i = mems.length - 1; i >= 0; i--) if (!mems[i].alive && !mems[i].b.isConnected) mems.splice(i, 1);
    });
  });
}
