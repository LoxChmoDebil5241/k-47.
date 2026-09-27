/* ==========================================================================
   Глава 29 · «Коктейль» — СМЕШАТЬ СТИМУЛЯТОРЫ
   Карстовая полость, фильтраторы из трещин, нематоды из техштрека, рейдеры.
   «Эфедрин — долгий, но слабый. Дизоксиэфедрин — быстрый, но жёсткий откат.
   Гиперзин — короткий, но мощный. Аранепс — энергия, но зависимость.
   Если смешать всё — сердце остановится через минуту».
   Продержись шесть минут (здесь — минута за десять секунд).
   ========================================================================== */
defineFrag(28, {
  id: 'cocktail', name: 'Коктейль',
  text: 'Он принял решение. Но не вслепую. Он начал перебирать в голове: «Эфедрин — долгий, но слабый. Дизоксиэфедрин — быстрый, но жёсткий откат. Гиперзин — короткий, но мощный. Аранепс — энергия, но зависимость. Если смешать всё — сердце остановится через минуту».',
  how: 'Волны тварей и рейдеров идут одна за другой. Когда волна бьёт, нужна СИЛА выше отметки — иначе ранение. Силу дают стимуляторы, у каждого свой характер и откат, и каждый разгоняет ПУЛЬС. Пульс за 200 — сердце остановится. Продержись шесть минут.',
  keys: '1 — ЭФЕДРИН · 2 — ДИЗОКСИЭФЕДРИН · 3 — ГИПЕРЗИН · 4 — АРАНЕПС · ИЛИ КНОПКИ',
  note: 'Всё по той лекции: эфедрин, красный эпипен, аранепс. Лектор ведь предупреждал. Шесть минут, пересчитанных поминутно. Потом сердце остановилось, и только баллон ещё шипел.',
  mem: 'ШЕСТАЯ МИНУТА', start: gameCocktail,
});

function gameCocktail(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const MIN = 10, TOTAL = MIN * 6;
  const DR = [
    { k: 'ephedrine', n: 'ЭФЕДРИН', rise: 0.25, amp: 0.28, dur: 26, pulse: 10, crash: 0.05 },
    { k: 'desoxy', n: 'ДИЗОКСИЭФЕДРИН', rise: 0.05, amp: 0.5, dur: 12, pulse: 26, crash: 0.3 },
    { k: 'hyperzine', n: 'ГИПЕРЗИН', rise: 0.02, amp: 0.8, dur: 6, pulse: 38, crash: 0.45 },
    { k: 'aranesp', n: 'АРАНЕПС', rise: 0.4, amp: 0.3, dur: 18, pulse: 14, crash: 0.1 },
  ];
  const doses = [];
  let t = 0, over = false, hp = 1, pulse = 88, fatigue = 0, aranespN = 0, nextWave = 4.5, wave = null, flash = 0, hitFx = 0;
  const hpM = ctx.meter('ТЕЛО', { cls: 'ok', left: 14, top: 14 });
  const strM = ctx.meter('СИЛА', { cls: 'amb', left: 14, top: 44 });
  const ctl = ctx.el('div', 'ctl ck-drugs');
  const drugBtns = DR.map((d, i) => ctx.el('button', 'btn', ctl, `<b>${i + 1}</b> ${d.n}`));
  const beat = { t: 0 };
  const hum = scope.own(A.loopOsc({ type: 'sawtooth', freq: 44, vol: 0, lp: 200 }));
  hum.vol(0.03, 1);
  ctx.hint('ПОЛОСКА ВОЛНЫ — КОГДА УДАР · СИЛА ВЫШЕ ОТМЕТКИ — УСТОИШЬ · ПУЛЬС ЗА 200 — СМЕРТЬ');

  return new Promise(resolve => {
    drugBtns.forEach((b, i) => scope.on(b, 'click', () => inject(i)));
    ctx.keys(e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 4) { e.preventDefault(); inject(n - 1); } });
    function inject(i) {
      if (over) return;
      const d = DR[i];
      let amp = d.amp;
      if (d.k === 'aranesp') { aranespN++; amp = d.amp / aranespN; }
      doses.push({ d, t: 0, amp });
      pulse += d.pulse;
      A.sfx.hiss(0.2, 0.05); A.tone({ f: 200 + i * 80, f2: 400 + i * 120, dur: 0.25, vol: 0.04 });
      flash = 0.6;
      ctx.say(`${d.n}${d.k === 'aranesp' && aranespN > 1 ? ' — слабее. Привыкание.' : ''}`, { pos: 'mid', cls: 'amb' }); scope.timeout(() => ctx.unsay('mid'), 900);
    }
    function strength() {
      let s = 0.18 - fatigue * 0.12;
      doses.forEach(x => {
        const d = x.d, u = x.t;
        if (u < d.rise) s += x.amp * (u / d.rise);
        else if (u < d.rise + d.dur) s += x.amp;
        else if (u < d.rise + d.dur + 4) s -= d.crash * (1 - (u - d.rise - d.dur) / 4);
      });
      return clamp(s, 0, 1.2);
    }
    async function end(ok, why) {
      over = true; hum.vol(0, 0.4);
      if (ok) {
        await ctx.line('Шестая минута.', { pos: 'mid', cls: 'big', ms: 1800 });
        await ctx.line('Эффект стимуляторов кончился. Сердце остановилось.', { pos: 'mid', ms: 2600 });
        await ctx.line('Только шипение баллона — тише, тише…', { pos: 'mid', cls: 'ice', ms: 2400 });
        resolve({ ok: 'ok', detail: `ПУЛЬС НА ФИНИШЕ ${Math.round(pulse)}` });
      } else {
        FX.flash('#ff0000', 500, 0.7);
        await ctx.line(why, { pos: 'mid', cls: 'red', ms: 2600 });
        resolve({ ok: 'fail', detail: `МИНУТА ${Math.floor(t / MIN) + 1} ИЗ 6` });
      }
    }

    scope.loop(dt => {
      t += dt; flash = Math.max(0, flash - dt * 2); hitFx = Math.max(0, hitFx - dt * 2);
      if (!over) {
        doses.forEach(x => { x.t += dt; });
        for (let i = doses.length - 1; i >= 0; i--) if (doses[i].t > doses[i].d.rise + doses[i].d.dur + 4) doses.splice(i, 1);
        pulse += (88 + fatigue * 20 - pulse) * dt * 0.06;
        fatigue = Math.min(1, fatigue + dt / 90);
        const s = strength();
        strM.set(s); hpM.set(hp);
        nextWave -= dt;
        if (!wave && nextWave <= 0) { wave = { t: 0, warn: 2.2, need: clamp(0.35 + t / TOTAL * 0.35 + rand(-0.05, 0.08), 0.3, 0.8), kind: pick(['ФИЛЬТРАТОРЫ', 'НЕМАТОДЫ', 'РЕЙДЕРЫ']) }; A.sfx.alarm(0.03); }
        if (wave) {
          wave.t += dt;
          if (wave.t >= wave.warn) {
            if (s >= wave.need) { A.sfx.gunfire(5, 0.2); A.sfx.crunch(0.3); ctx.say(`${wave.kind}: устоял.`, { pos: 'top', cls: 'amb' }); }
            else { hp -= 0.22 + (wave.need - s) * 0.4; hitFx = 1; A.sfx.slash(0.3); A.sfx.thud(0.5); FX.shake('lg'); ctx.say(`${wave.kind}: не хватило сил.`, { pos: 'top', cls: 'red' }); }
            scope.timeout(() => ctx.unsay('top'), 1400);
            wave = null; nextWave = rand(4.5, 7) * (1 - t / TOTAL * 0.35);
          }
        }
        beat.t -= dt;
        if (beat.t <= 0) { beat.t = 60 / Math.max(40, pulse); A.sfx.heartbeat(clamp((pulse - 80) / 160, 0.12, 0.7)); }
        ctx.stat(`МИНУТА ${Math.min(6, Math.floor(t / MIN) + 1)}/6 · ПУЛЬС ${Math.round(pulse)}`);
        if (pulse >= 200) end(false, 'Сердце не выдержало коктейля. Раньше срока.');
        else if (hp <= 0) end(false, 'Они вцепились раньше, чем кончилась шестая минута.');
        else if (t >= TOTAL) end(true);
      }
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      // карстовая полость: лёд каскадами, лужи воды с кровью
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b1720'); bg.addColorStop(1, '#05090c');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      const R = mulberry(29);
      for (let i = 0; i < 16; i++) { g.fillStyle = `rgba(143,176,196,${0.05 + R() * 0.08})`; g.beginPath(); const x = R() * W; g.moveTo(x, 0); g.lineTo(x + R() * 30 - 15, H * (0.15 + R() * 0.25)); g.lineTo(x + 20, 0); g.fill(); }
      g.fillStyle = 'rgba(90,10,16,.35)'; g.beginPath(); g.ellipse(W * 0.5, H * 0.88, W * 0.35, H * 0.05, 0, 0, Math.PI * 2); g.fill();
      // волна приближается из трещин
      if (wave) {
        const k = Math.min(1, wave.t / wave.warn);
        for (let i = 0; i < 7; i++) { const x = W * (0.62 + i * 0.05) - k * W * 0.2, y = H * (0.6 + (i % 3) * 0.08); g.fillStyle = 'rgba(10,6,8,.95)'; g.beginPath(); g.ellipse(x, y, W * 0.03, H * 0.025, Math.sin(t * 5 + i) * 0.3, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,40,60,.8)'; g.fillRect(x - 3, y - 2, 3, 2); }
        if (wave.kind === 'РЕЙДЕРЫ') Art.raider(g, W * 0.85 - k * W * 0.15, H * 0.8, H * 0.42, { dir: -1, t, lunge: k });
        // шкала удара
        const bw = Math.min(W * 0.5, 360), bx = (W - bw) / 2, by = H * 0.12;
        g.fillStyle = 'rgba(255,0,51,.15)'; g.fillRect(bx, by, bw, 6); g.fillStyle = '#ff0033'; g.fillRect(bx, by, bw * k, 6);
        g.fillStyle = '#ffb347'; g.font = `12px ${MONO}`; g.textAlign = 'center'; g.fillText(`${wave.kind} · НУЖНО СИЛЫ ${Math.round(wave.need * 100)}%`, W / 2, by - 6);
      }
      // К-41: клешня, броня
      Art.raider(g, W * 0.3, H * 0.86, H * 0.52, { dir: 1, t, blood: 1 - hp, claws: true });
      // отметка нужной силы на полоске СИЛА
      if (wave) { g.fillStyle = '#fff'; g.fillRect(14 + Math.min(260, W * 0.6) * wave.need, 44 + 18, 2, 10); }
      // пульс
      g.fillStyle = pulse > 170 ? '#ff0033' : pulse > 140 ? '#ffb347' : '#88ddff'; g.font = `${Math.round(H * 0.05)}px ${PIXEL}`; g.textAlign = 'right'; g.fillText(`${Math.round(pulse)}`, W - 20, H * 0.12);
      g.font = `11px ${MONO}`; g.fillText('ПУЛЬС', W - 20, H * 0.12 + 16);
      if (flash > 0) { g.fillStyle = `rgba(255,179,71,${flash * 0.15})`; g.fillRect(0, 0, W, H); }
      if (hitFx > 0) { g.fillStyle = `rgba(160,0,10,${hitFx * 0.4})`; g.fillRect(0, 0, W, H); }
      if (pulse > 160) { g.fillStyle = `rgba(255,0,0,${(pulse - 160) / 200 * (0.5 + 0.5 * Math.sin(t * pulse / 10))})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.7);
    }
  });
}
