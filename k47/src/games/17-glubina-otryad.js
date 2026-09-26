/* ==========================================================================
   Глава 17 · перенесено из прототипа «Мини-игры» (механика сохранена)
   ========================================================================== */
defineFrag(16, {
  id: "squad", name: "Запомни их",
  text: "Он смотрел на шлемы товарищей — на парня с «Вектором», который всегда нервно смеялся перед боем; на женщину с пистолетом-пулемётом, которая тихо напевала что-то себе под нос; на старика с обрезом, который никогда не снимал шлем. К-6 запоминал их. Он делал это всегда.",
  how: "Пятнадцать шлемов на платформе буровой. Запомни каждого: номер, визор, привычку. После прыжка ты увидишь тех, кто не поднялся. Назови их — хотя бы четверых из пяти.",
  keys: "ДО ПРЫЖКА 35 СЕКУНД · «К ПРЫЖКУ» — РАНЬШЕ · ОТВЕТ — ТАП ИЛИ 1–4",
  note: "Пятнадцать теней на платформе. Я помню, кто они были. Чтобы не забыть, когда их не станет.",
  mem: "ПЯТНАДЦАТЬ ШЛЕМОВ", start: ctx => gameSquad(ctx),
});

/* ==========================================================================
   Ф-06 · ЗАПОМНИ ИХ — «Глубина». Пятнадцать шлемов, пятеро не поднимутся.
   ========================================================================== */
const SQUAD = [
  { n: '01', role: 'Командир', tr: 'седина на висках, дважды ранен' },
  { n: '02', role: 'Заместитель', tr: 'жуёт смолу, почти не моргает' },
  { n: '03', role: 'Стрелок', tr: '«Вектор», нервно смеётся перед боем' },
  { n: '04', role: 'Стрелок', tr: 'пистолет-пулемёт, напевает под нос' },
  { n: '05', role: 'Старик', tr: 'обрез, никогда не снимает шлем' },
  { n: '06', role: 'Пулемётчик', tr: 'пишет письма, которые не отправляет' },
  { n: '07', role: 'Медик', tr: 'раздаёт жгуты заранее' },
  { n: '08', role: 'Связист', tr: 'насвистывает, когда страшно' },
  { n: '09', role: 'Сапёр', tr: 'крестится перед прыжком' },
  { n: '10', role: 'Снайпер', tr: 'никогда не говорит первым' },
  { n: '11', role: 'Новичок', tr: 'первый цикл, трясутся руки' },
  { n: '12', role: 'Гранатомётчик', tr: 'шутит про погоду' },
  { n: '13', role: 'Разведчик', tr: 'наклейка с котом на шлеме' },
  { n: '14', role: 'Штурмовик', tr: 'трижды стучит по прикладу' },
];
const VISORS = ['#3fa9f5', '#ff5a3c', '#46e08a', '#f5d03f', '#b36cff', '#ff6ec7', '#9fb3c0'];
const MARKS = ['stripe', 'cross', 'dots', 'chip', 'band'];
function helmetSVG(h, { cracked = false, me = false } = {}) {
  const vis = me ? '#ff1a44' : h.visor;
  const mk = h.mark, mc = '#d9ccb0';
  let mark = '';
  if (mk === 'stripe') mark = `<rect x="55" y="12" width="10" height="42" fill="${mc}" opacity=".85"/>`;
  else if (mk === 'cross') mark = `<path d="M84 26h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill="#c9302c"/>`;
  else if (mk === 'dots') mark = `<circle cx="80" cy="30" r="4" fill="${mc}"/><circle cx="90" cy="36" r="4" fill="${mc}"/><circle cx="84" cy="44" r="4" fill="${mc}"/>`;
  else if (mk === 'chip') mark = `<path d="M22 44 L34 26 L40 34 L30 48 Z" fill="#11151a"/><path d="M26 42 L34 30" stroke="#6b737b" stroke-width="2"/>`;
  else if (mk === 'band') mark = `<path d="M17 50 C40 44 80 44 103 50 L103 56 C80 50 40 50 17 56 Z" fill="${mc}" opacity=".7"/>`;
  const cat = h.n === '13' ? '<g transform="translate(78 24)"><path d="M0 14 L2 2 L8 8 L14 8 L20 2 L22 14 C22 22 0 22 0 14Z" fill="#f2efe6"/><circle cx="7" cy="13" r="1.6" fill="#222"/><circle cx="15" cy="13" r="1.6" fill="#222"/></g>' : '';
  const crack = cracked ? '<path d="M48 58 L58 66 L53 73 L66 80 M58 66 L72 62" stroke="#f4f8fb" stroke-width="2.2" fill="none" stroke-linecap="round"/>' : '';
  return `<svg viewBox="0 0 120 104" aria-hidden="true">
    <path d="M14 70 C14 30 38 10 60 10 C82 10 106 30 106 70 L106 84 C106 90 100 94 94 94 L26 94 C20 94 14 90 14 84 Z" fill="${cracked ? '#22272c' : '#2d343b'}" stroke="#0b0e11" stroke-width="3"/>
    ${mark}${cat}
    <path d="M24 57 L96 57 L91 79 C79 85 41 85 29 79 Z" fill="${vis}" opacity="${cracked ? .45 : .9}"/>
    <path d="M30 61 L52 61" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>
    <text x="22" y="47" font-family="monospace" font-size="${me ? 12 : 14}" font-weight="700" fill="#e3e9ee">${esc(h.n)}</text>
    ${crack}
  </svg>`;
}

function gameSquad(ctx) {
  const { scope, body } = ctx;
  const combos = shuffle(VISORS.flatMap(v => MARKS.map(m => [v, m]))).slice(0, SQUAD.length);
  const squad = SQUAD.map((s, i) => ({ ...s, visor: combos[i][0], mark: combos[i][1] }));
  const me = { n: 'К-6', role: 'Ты', tr: 'запоминает всех', visor: '#ff1a44', mark: 'band', me: true };
  const order = shuffle([...squad]); order.splice(irand(4, 10), 0, me);
  const drill = scope.own(A.loopOsc({ type: 'sawtooth', freq: 47, vol: 0, lp: 220 }));
  const drillN = scope.own(A.loopNoise({ type: 'lowpass', freq: 300, q: .7, vol: 0 }));
  drill.vol(.05, .8); drillN.vol(.07, .8);
  const MEM = 35;
  let left = MEM;

  const wrap = ctx.el('div', 'sq');
  wrap.innerHTML = `<p class="sq-lead">К-6 запоминал их. Он делал это всегда. Чтобы помнить, кто они были.</p>`;
  const grid = ctx.el('div', 'sq-grid', wrap);
  order.forEach(h => {
    const c = ctx.el('div', `sq-card${h.me ? ' me' : ''}`, grid);
    c.innerHTML = `${helmetSVG(h, { me: h.me })}<span class="nm">${h.me ? 'К-6 · ТЫ' : `№${esc(h.n)} · ${esc(h.role.toUpperCase())}`}</span><span class="tr">${esc(h.tr)}</span>`;
  });
  const go = ctx.el('div', '', wrap); go.style.cssText = 'position:sticky;bottom:-12px;text-align:center;margin:14px -12px -12px;padding:12px;background:linear-gradient(0deg,#050002 60%,rgba(5,0,2,0))';
  const jump = ctx.el('button', 'btn btn-primary', go, 'К ПРЫЖКУ');
  ctx.hint('ЗАПОМНИ: НОМЕР, ВИЗОР, ПРИВЫЧКУ · ПОСЛЕ ПРЫЖКА НАЗОВИ ТЕХ, КТО НЕ ПОДНЯЛСЯ');
  const upd = () => ctx.stat(`ДО ПРЫЖКА ${Math.ceil(left)} С`);
  upd();

  return new Promise(resolve => {
    let phase = 'mem';
    const iv = scope.loop(dt => {
      if (phase !== 'mem') return false;
      left -= dt; upd();
      if (left <= 0) battle();
    });
    scope.on(jump, 'click', () => { A.sfx.click(); battle(); });
    async function battle() {
      if (phase !== 'mem') return;
      phase = 'battle'; iv();
      jump.disabled = true;
      ctx.stat('ПРОЙДЕНО!');
      drill.freq(90, .1); A.sfx.thud(.5);
      await scope.wait(300);
      drill.vol(0, .05); drillN.vol(0, .05);
      grid.classList.add('dark');
      ctx.say('— Пройдено! Первая волна — бегом!', { pos: 'mid', cls: 'red' });
      A.sfx.whoosh(.2);
      await scope.wait(1400);
      ctx.say('Их встретили шквальным огнём. Семнадцать. Восемнадцать. Он не успел сосчитать.', { pos: 'mid', cls: 'red' });
      for (let i = 0; i < 9; i++) {
        A.sfx.gunfire(irand(3, 7), .28); if (i % 3 === 0) FX.shake('sm');
        FX.flash(i % 2 ? '#ffcc88' : '#ff0033', 220, .35);
        await scope.wait(rand(260, 420));
      }
      ctx.unsay('mid');
      await scope.wait(700);
      await ctx.line('Штрек затих. Пятеро не поднялись.', { pos: 'mid', ms: 2400 });
      quiz();
    }
    async function quiz() {
      phase = 'quiz';
      wrap.remove();
      const fallen = shuffle(squad).slice(0, 5);
      let right = 0;
      const q = ctx.el('div', 'sq-q');
      ctx.hint('ВЫБЕРИ ПРИВЫЧКУ ТОГО, КТО ЛЕЖИТ ПЕРЕД ТОБОЙ · 1–4');
      for (let i = 0; i < fallen.length; i++) {
        const h = fallen[i];
        ctx.stat(`${i + 1}/5 · ВЕРНО ${right}`);
        const opts = shuffle([h.tr, ...shuffle(squad.filter(x => x !== h)).slice(0, 3).map(x => x.tr)]);
        q.innerHTML = `<div class="who">${helmetSVG(h, { cracked: true })}</div><p class="qt">№${esc(h.n)} · КТО ЭТО БЫЛ?</p><div class="opts"></div>`;
        const box = $('.opts', q);
        const pickOpt = await new Promise(res => {
          const btns = opts.map((o, k) => {
            const b = ctx.el('button', 'btn', box, `${k + 1} · ${esc(o)}`);
            b.addEventListener('click', () => res(k));
            return b;
          });
          btns[0].focus({ preventScroll: true });
          const kh = e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= 4) { document.removeEventListener('keydown', kh); res(k - 1); } };
          document.addEventListener('keydown', kh);
          scope.own(() => document.removeEventListener('keydown', kh));
        });
        const btns = $$('.btn', box);
        btns.forEach(b => { b.disabled = true; });
        const ok = opts[pickOpt] === h.tr;
        btns[opts.indexOf(h.tr)].classList.add('right');
        if (ok) { right++; A.sfx.chime(700, .05); }
        else { btns[pickOpt].classList.add('wrong'); A.sfx.buzz(); }
        ctx.stat(`${i + 1}/5 · ВЕРНО ${right}`);
        await scope.wait(ok ? 1100 : 1900);
      }
      q.innerHTML = '';
      if (right >= 4) {
        await ctx.line('Он запомнил их. Чтобы не забыть, когда их не станет.', { pos: 'mid', ms: 2800 });
        resolve({ ok: 'ok', detail: `НАЗВАНО ${right}/5` });
      } else {
        await ctx.line('Шлемы одинаковые. Лица стираются — как и его собственное.', { pos: 'mid', cls: 'red', ms: 2800 });
        resolve({ ok: 'fail', detail: `НАЗВАНО ${right}/5 · НУЖНО 4` });
      }
    }
  });
}
