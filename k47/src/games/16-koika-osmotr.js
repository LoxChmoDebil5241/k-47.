/* ==========================================================================
   Глава 16 · «Койка» — ТЕРПЕТЬ ОСМОТР
   Тьма. Медик в маске осматривает, как лошадь на ярмарке. Будь манекеном:
   не двигайся, пока щупают пульс и бьют молоточком. Потом — луч фонаря
   в глаза. Отвести его рукой (как было) или вытерпеть до конца.
   ========================================================================== */
defineFrag(15, {
  id: 'cot', name: 'Терпеть осмотр',
  text: 'Холодные пальцы грубо раздвинули ему веки, и в глаза врезался ослепительный луч фонаря — резкий, белый, режущий по живому. Инстинктивно, слабым, почти детским движением, Кристиан отвёл руку с фонариком. И в этот миг медик замер.',
  how: 'Удерживай «ЗАМЕРЕТЬ» и не двигай ни мышью, ни пальцем, пока идёт процедура. Шевельнёшься — медик вколет седатив. Когда в глаза ударит свет, решай: отвести руку с фонариком или терпеть, пока не кончится.',
  keys: 'ЗАМЕРЕТЬ — ДЕРЖАТЬ ПРОБЕЛ ИЛИ КНОПКУ, НЕ ДВИГАЯ УКАЗАТЕЛЬ · В КОНЦЕ — КНОПКИ ИЛИ 1 / 2',
  note: 'Осматривали, как лошадь на ярмарке. Испугались одного — что я отвёл фонарик от глаз. Живой здесь опаснее мёртвого: ремни затянули туже.',
  noteDist: 'В этой записи я вытерпел свет и не шевельнулся. Медик кивнул и ушёл. Архив говорит — моя рука поднялась сама.',
  mem: 'ЛУЧ ФОНАРЯ', start: gameCot,
});

function gameCot(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const box = ctx.el('div', 'ctl');
  const hold = mgHold(ctx, 'ЗАМЕРЕТЬ', { key: 'Space', parent: box, cls: 'ice' });
  const tensionM = ctx.meter('ТЕЛО', { cls: 'ice', left: 14, top: 14 });
  const STEPS = [
    { k: 'pulse', t: 'ПУЛЬС', d: 4.5, line: 'Пальцы на запястье. Холодные.' },
    { k: 'ribs', t: 'РЁБРА', d: 4.5, line: 'Ладонь давит на грудь. Считают рёбра.' },
    { k: 'hammer', t: 'РЕФЛЕКСЫ', d: 5, line: 'Молоточек. Колено. Ещё раз.' },
  ];
  let si = -1, stepT = 0, t = 0, over = false, strikes = 0, moved = 0, lastPtr = null, light = 0, lightT = 0, hammerHit = 0, phase = 'wait';
  const vent = scope.own(A.loopNoise({ type: 'lowpass', freq: 400, q: 0.5, vol: 0 }));
  vent.vol(0.04, 1);
  ctx.hint('ДЕРЖИ «ЗАМЕРЕТЬ» ВСЮ ПРОЦЕДУРУ И НЕ ДВИГАЙ УКАЗАТЕЛЬ');

  return new Promise(resolve => {
    // любое движение указателя или другая клавиша во время процедуры — шевеление
    scope.on(window, 'pointermove', e => {
      if (phase !== 'proc' || !hold.down) { lastPtr = null; return; }
      if (e.target === hold.el) {
        if (!lastPtr) { lastPtr = [e.clientX, e.clientY]; return; }
        const d = Math.hypot(e.clientX - lastPtr[0], e.clientY - lastPtr[1]);
        if (d > 18) twitch();
        return;
      }
      twitch();
    });
    ctx.keys(e => { if (phase === 'proc' && e.code !== 'Space') twitch(); });
    function twitch() {
      if (over || phase !== 'proc') return;
      moved += 1;
      if (moved > 3) {
        moved = 0; strikes++; A.sfx.buzz(); FX.shake('sm');
        ctx.say(strikes < 2 ? 'Медик заметил движение. Взгляд стал холоднее.' : 'Шприц. Укол в шею.', { pos: 'mid', cls: 'red' });
        scope.timeout(() => ctx.unsay('mid'), 1500);
        if (strikes >= 2) sedate();
      }
    }
    async function sedate() {
      if (over) return; over = true; phase = 'end';
      A.sfx.hiss(0.6, 0.1); FX.flash('#000', 1500, 0.9);
      await ctx.line('Ватная тишина. Ремни. Каталка. Он больше ничего не помнит.', { pos: 'mid', ms: 2800 });
      resolve({ ok: 'fail', detail: `ПРОЦЕДУР ${Math.max(0, si)} ИЗ 4` });
    }
    function nextStep() {
      si++;
      if (si >= STEPS.length) { toLight(); return; }
      phase = 'wait'; stepT = 0;
      ctx.say(`Медик: «${STEPS[si].t}».`, { pos: 'top', cls: 'ice' });
      scope.timeout(() => { if (over) return; phase = 'proc'; moved = 0; ctx.say(STEPS[si].line, { pos: 'top' }); A.sfx.step(0.1, 0.4); }, 1400);
    }
    async function toLight() {
      phase = 'light'; lightT = 0;
      ctx.say('Холодные пальцы раздвинули веки.', { pos: 'top' });
      A.sfx.click();
    }
    let decided = false;
    async function decide() {
      decided = true;
      const k = await ctx.choose(['Отвести руку с фонариком', 'Терпеть свет']);
      if (over) return;
      if (k === 0) {
        over = true; phase = 'end'; light = 0.3;
        A.sfx.thud(0.3); A.sfx.creak(0.2);
        await ctx.line('И в этот миг медик замер.', { pos: 'top', cls: 'red', ms: 2200 });
        A.sfx.stamp();
        await ctx.line('Ремни щёлкнули — туже, чем раньше.', { pos: 'top', ms: 2400 });
        resolve({ ok: 'ok', detail: 'РУКА ПОДНЯЛАСЬ' });
      } else {
        phase = 'endure'; lightT = 0; box.hidden = false;
        ctx.say('Терпи. Держи «ЗАМЕРЕТЬ».', { pos: 'top', cls: 'ice' });
      }
    }

    scope.timeout(nextStep, 1200);
    scope.loop(dt => {
      t += dt;
      if (!over) {
        if (phase === 'proc') {
          if (!hold.down) { stepT = Math.max(0, stepT - dt * 0.5); if (Math.random() < dt * 1.2) twitch(); }
          else stepT += dt;
          if (STEPS[si].k === 'hammer') { hammerHit = Math.max(0, hammerHit - dt * 4); if (Math.random() < dt * 1.3) { hammerHit = 1; A.sfx.thud(0.15); } }
          tensionM.set(stepT / STEPS[si].d);
          ctx.stat(`${STEPS[si].t} · ${Math.round(stepT / STEPS[si].d * 100)}% · ЗАМЕЧАНИЙ ${strikes}/2`);
          if (stepT >= STEPS[si].d) { A.sfx.beep(900, 0.05, 0.03); nextStep(); }
        } else if (phase === 'light') {
          lightT += dt; light = Math.min(1, lightT / 2.2);
          tensionM.set(light); ctx.stat('СВЕТ В ГЛАЗА');
          if (light >= 1 && !decided) { box.hidden = true; decide(); }
        } else if (phase === 'endure') {
          light = 1;
          if (hold.down) lightT += dt; else lightT = Math.max(0, lightT - dt);
          tensionM.set(1 - lightT / 5); ctx.stat(`ТЕРПЕТЬ ${Math.round(lightT / 5 * 100)}%`);
          if (lightT >= 5) {
            over = true; phase = 'end';
            (async () => { A.sfx.glitch(); await ctx.line('Он не шевельнулся. Медик кивнул и ушёл.', { pos: 'top', ms: 2400 }); ctx.say('НЕЙРОСЛЕПОК: РАСХОЖДЕНИЕ С ЗАПИСЬЮ', { pos: 'mid', cls: 'big red' }); await scope.wait(2400); resolve({ ok: 'dist', detail: 'СВЕТ ВЫТЕРПЛЕН' }); })();
          }
        }
      }
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#010102'; g.fillRect(0, 0, W, H);
      // едва различимые силуэты медиков — в темноте
      const lamp = 0.04 + (phase === 'light' || phase === 'endure' ? light * 0.15 : 0);
      g.globalAlpha = 0.9;
      Art.human(g, W * 0.72, H * 0.98, H * 0.9, 'doctor', { color: `rgba(${20 + lamp * 200},${22 + lamp * 200},${26 + lamp * 200},1)` });
      Art.human(g, W * 0.24, H * 1.02, H * 0.84, 'doctor', { color: 'rgba(12,12,14,1)' });
      g.globalAlpha = 1;
      // маска и глаза медика
      g.fillStyle = 'rgba(230,235,240,.5)'; g.fillRect(W * 0.72 - H * 0.03, H * 0.98 - H * 0.9 * 0.9, H * 0.06, H * 0.03);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(W * 0.72 - H * 0.02, H * 0.98 - H * 0.9 * 0.94, 4, 2); g.fillRect(W * 0.72 + H * 0.01, H * 0.98 - H * 0.9 * 0.94, 4, 2);
      if (si >= 0 && STEPS[si] && STEPS[si].k === 'hammer' && hammerHit > 0) { g.fillStyle = `rgba(255,255,255,${hammerHit * 0.15})`; g.fillRect(0, 0, W, H); }
      // луч фонаря
      if (light > 0) {
        const r = Math.max(W, H) * (0.15 + light * 0.9);
        const gr = g.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, r);
        gr.addColorStop(0, `rgba(255,255,255,${light})`); gr.addColorStop(0.35, `rgba(235,245,255,${light * 0.8})`); gr.addColorStop(1, 'rgba(200,220,240,0)');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      }
      // веки — сверху и снизу
      const lid = phase === 'light' || phase === 'endure' ? 0.02 : 0.28;
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H * lid); g.fillRect(0, H * (1 - lid), W, H * lid);
      Art.vignette(g, W, H, 0.85);
      Art.grain(g, W, H, 0.08);
    }
  });
}
