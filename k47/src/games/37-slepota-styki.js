/* ==========================================================================
   Глава 37 · «Слепота» — БИТЬ В СТЫКИ
   Плазма сожгла К-39 обе кисти. Белая вспышка, потом — ярость.
   Рейдер в силовой броне (референс 6). Стыки: шея, подмышки, щель у забрала.
   Бей костями точно в стык, пока он открыт. По пластинам — кости крошатся.
   Когда костей не останется — зубы. А потом застрекочет пулемёт.
   ========================================================================== */
defineFrag(36, {
  id: 'blind', name: 'Ярость без выхода',
  text: 'Из его горла вырвался звук — не крик, не стон, а низкий, гортанный, животный рёв. Все те «он», которые умирали до него, — они кричали сейчас. Их голоса слились в один, и этот голос не просил пощады. Он требовал крови.',
  how: 'Сначала всё белое — вспышка плазмы. Когда проступит силуэт, бей по стыкам брони, пока они подсвечены: шея, подмышки, щель у забрала. Попал в пластину — кость ломается. Кончились кости — зубы: жми быстро. Успей до пулемёта.',
  keys: 'ТАП / КЛИК ПО СТЫКУ · ЗУБЫ — ЧАСТО ЖАТЬ ПРОБЕЛ ИЛИ КНОПКУ',
  note: 'Кости вместо пальцев. Я бил в стыки, пока они не сломались, а потом — зубами. Пулемёт поставил точку. Я был и остался мясом.',
  mem: 'ЯРОСТЬ', start: gameBlind,
});

function gameBlind(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const SEAMS = [
    { k: 'neck', n: 'ШЕЯ', x: 0, y: 0.5 },
    { k: 'visor', n: 'ЗАБРАЛО', x: 0, y: 0.3 },
    { k: 'armL', n: 'ПОДМЫШКА', x: -0.3, y: 0.7 },
    { k: 'armR', n: 'ПОДМЫШКА', x: 0.3, y: 0.7 },
  ];
  let t = 0, over = false, white = 1, bone = 1, foe = 1, open = -1, openT = 0, nextOpen = 1.4, mg = 0, teeth = false, flash = 0, shake = 0, miss = 0;
  const MG_T = 34;
  const foeM = ctx.meter('РЕЙДЕР', { cls: 'red', right: 14, top: 14 });
  const boneM = ctx.meter('КОСТИ', { cls: 'amb', left: 14, top: 14 });
  const ringL = scope.own(A.loopOsc({ type: 'sine', freq: 3100, vol: 0 }));
  ringL.vol(0.03, 0.2);
  ctx.hint('БЕЛОЕ — ЭТО ВСПЫШКА · ЖДИ СИЛУЭТ · БЕЙ В СВЕТЯЩИЙСЯ СТЫК');
  A.sfx.whoosh(0.3); A.sfx.hiss(1.4, 0.1);

  return new Promise(resolve => {
    const fig = () => { const h = Math.min(C.H * 0.8, C.W * 1.1); return { cx: C.W * 0.5, top: C.H * 0.05, h }; };
    const seamPos = s => { const F = fig(); return [F.cx + s.x * F.h, F.top + s.y * F.h]; };
    function strike(x, y) {
      if (over || white > 0.55 || teeth) return;
      let hit = -1;
      SEAMS.forEach((s, i) => { const [sx, sy] = seamPos(s); if (Math.hypot(sx - x, sy - y) < Math.max(26, fig().h * 0.05)) hit = i; });
      if (hit >= 0 && hit === open) {
        foe -= 0.13; bone -= 0.05; flash = 1; shake = 0.5; open = -1; nextOpen = rand(0.35, 0.8);
        A.sfx.squelch(0.3); A.sfx.crunch(0.2); FX.shake('sm');
        ctx.say(pick(['Кость вошла в шею.', 'В подмышку, где защита тоньше.', 'В щель у забрала.', 'Обломком — зазубренным, как пила.']), { pos: 'top', cls: 'red' }); scope.timeout(() => ctx.unsay('top'), 900);
      } else {
        bone -= 0.14; miss++; A.sfx.crunch(0.35); A.tone({ f: 300, f2: 120, dur: 0.1, vol: 0.05 });
        ctx.say('Кость скрежетнула о пластину и раскрошилась.', { pos: 'top' }); scope.timeout(() => ctx.unsay('top'), 800);
      }
      if (bone <= 0 && foe > 0) { teeth = true; bone = 0; ctx.say('Костей не осталось. Зубы.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1200); biteB.hidden = false; }
      if (foe <= 0) win();
    }
    const ctl = ctx.el('div', 'ctl');
    const biteB = ctx.el('button', 'btn big-btn btn-primary', ctl, 'ЗУБАМИ'); biteB.hidden = true;
    const bite = () => { if (!teeth || over) return; foe -= 0.035; shake = 0.4; A.sfx.crunch(0.18); if (foe <= 0) win(); };
    scope.on(biteB, 'pointerdown', e => { e.preventDefault(); bite(); });
    scope.on(C.cv, 'pointerdown', e => { const r = C.cv.getBoundingClientRect(); strike(e.clientX - r.left, e.clientY - r.top); });
    ctx.keys(e => {
      if (e.code === 'Space') { e.preventDefault(); if (teeth) bite(); else if (open >= 0) { const [x, y] = seamPos(SEAMS[open]); strike(x, y); } }
    });
    async function win() {
      if (over) return; over = true; ringL.vol(0, 0.4); open = -1; biteB.hidden = true;
      await ctx.line('Штурмовик перестал сопротивляться.', { pos: 'top', ms: 2000 });
      A.sfx.gunfire(14, 0.35);
      FX.flash('#ffffff', 200, 0.4);
      await ctx.line('Стрекотница. Очередь. Аккуратные технологичные отверстия.', { pos: 'top', cls: 'red', ms: 2600 });
      await ctx.line('Не боль, а бессмысленная ярость, которая так и не нашла выхода.', { pos: 'top', ms: 2600 });
      resolve({ ok: 'ok', detail: `ПРОМАХОВ ${miss} · ДО ПУЛЕМЁТА ${Math.max(0, Math.round(MG_T - mg))} С` });
    }
    async function lose() {
      over = true; ringL.vol(0, 0.3);
      A.sfx.gunfire(16, 0.35); FX.flash('#ff0000', 400, 0.6);
      await ctx.line('Пулемёт застрекотал раньше. Рейдер поднялся с пола.', { pos: 'top', cls: 'red', ms: 2800 });
      resolve({ ok: 'fail', detail: `РЕЙДЕР ${Math.round(foe * 100)}%` });
    }
    scope.loop(dt => {
      t += dt; white = Math.max(0, white - dt * 0.28); flash = Math.max(0, flash - dt * 3); shake = Math.max(0, shake - dt * 2);
      if (!over) {
        mg += dt;
        if (white < 0.55 && !teeth) {
          if (open >= 0) { openT -= dt; if (openT <= 0) { open = -1; nextOpen = rand(0.3, 0.9); } }
          else { nextOpen -= dt; if (nextOpen <= 0) { open = irand(0, SEAMS.length - 1); openT = rand(0.8, 1.2) - mg / MG_T * 0.3; } }
        }
        if (teeth) foe = Math.min(1, foe + dt * 0.02);
        foeM.set(foe); boneM.set(bone);
        ctx.stat(teeth ? 'ЗУБЫ' : `ДО ПУЛЕМЁТА ${Math.max(0, Math.ceil(MG_T - mg))} С`);
        if (mg >= MG_T) lose();
      }
      draw();
    });
    function draw() {
      const { g, W, H } = C, F = fig();
      g.save();
      if (shake > 0) g.translate(rand(-1, 1) * shake * 10, rand(-1, 1) * shake * 10);
      g.fillStyle = '#0c0708'; g.fillRect(-20, -20, W + 40, H + 40);
      // рейдер в силовой броне — референс 6
      Art.armor(g, F.cx, F.top, F.h, { t, blood: 1 - foe, cracked: foe < 0.5, seed: 37 });
      // стыки
      SEAMS.forEach((s, i) => {
        const [x, y] = seamPos(s);
        if (i === open) {
          const p = 0.5 + 0.5 * Math.sin(t * 16);
          g.strokeStyle = `rgba(255,255,255,${0.6 + p * 0.4})`; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, 14 + p * 8, 0, Math.PI * 2); g.stroke();
          g.fillStyle = '#fff'; g.font = `11px ${MONO}`; g.textAlign = 'center'; g.fillText(s.n, x, y - 26);
        }
      });
      // культи с костями
      const bx = W * 0.5, by = H * 1.02;
      [-1, 1].forEach(sd => {
        g.fillStyle = '#1a0c0a'; g.beginPath(); g.moveTo(bx + sd * W * 0.12, by); g.lineTo(bx + sd * W * 0.2, by); g.lineTo(bx + sd * W * 0.09, H * 0.78); g.lineTo(bx + sd * W * 0.06, H * 0.8); g.closePath(); g.fill();
        const len = H * 0.08 * Math.max(0.15, bone);
        g.strokeStyle = '#e9e2d4'; g.lineWidth = 5; g.beginPath(); g.moveTo(bx + sd * W * 0.075, H * 0.79); g.lineTo(bx + sd * W * 0.06, H * 0.79 - len); g.stroke();
        g.fillStyle = 'rgba(255,120,40,.5)'; g.beginPath(); g.arc(bx + sd * W * 0.075, H * 0.79, 6, 0, Math.PI * 2); g.fill();
      });
      g.restore();
      if (flash > 0) { g.fillStyle = `rgba(138,10,24,${flash * 0.35})`; g.fillRect(0, 0, W, H); }
      if (white > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(1, white * 1.2)})`; g.fillRect(0, 0, W, H); }
      if (teeth) { g.fillStyle = 'rgba(90,0,10,.25)'; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.7);
    }
  });
}
