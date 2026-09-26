/* ==========================================================================
   Глава 15 · перенесено из прототипа «Мини-игры» (механика сохранена)
   ========================================================================== */
defineFrag(14, {
  id: "triumph", name: "Руки не слушаются",
  text: "Кристиан поднял пистолет. Ствол смотрел в голову отца. Он должен был нажать на спуск. Но рука не слушалась. Он сжал пальцы крепче, вдавил приклад в ладонь. Она всё равно дрожала.",
  how: "Та же техника, что в тире: дыхание, прицел, плавный спуск. Только теперь руки не слушаются. Запись одна — но решать тебе.",
  keys: "МЫШЬ / ПАЛЕЦ — ПРИЦЕЛ · ЗАЖАТЬ — ДЫХАНИЕ · РЕШЕНИЕ — КНОПКАМИ ИЛИ 1 / 2",
  note: "Он поднял руку и помахал. Один раз. Как будто прощался. — Прощай, — сказал я. Не ему. Себе.",
  noteDist: "В этой записи я опустил пистолет. Архив говорит — так не было. Я не знаю, какой из нас врёт.",
  mem: "ПОДНЯТАЯ РУКА", start: ctx => gameTriumph(ctx),
});

/* ==========================================================================
   Ф-05 · РУКИ НЕ СЛУШАЮТСЯ — «Триумф». Прицел не собирается. Решение за тобой.
   ========================================================================== */
function gameTriumph(ctx) {
  const { scope, body } = ctx;
  if (document.activeElement) document.activeElement.blur();
  const C = ctx.canvas();
  const meter = ctx.el('div', 'meter', body, 'ДЫХАНИЕ<div class="mb"><i></i></div>');
  meter.style.left = '14px'; meter.style.bottom = '14px';
  const mFill = $('i', meter);
  const ctl = ctx.el('div', 'ctl', body); ctl.hidden = true;
  const bPress = ctx.el('button', 'btn btn-primary big-btn', ctl, '1 · ЗАЖМУРИТЬСЯ И НАЖАТЬ');
  const bLower = ctx.el('button', 'btn big-btn', ctl, '2 · ОПУСТИТЬ ПИСТОЛЕТ');
  let t = 0, holding = false, breath = 1, headLift = 0, headT = 0, wave = -1, dark = 0, darkT = 0, over = false, choice = false, glitch = 0, lastNo = 0;
  let rx = 0, ry = 0;
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 46, vol: 0 }));
  hum.vol(.035, 2);
  ctx.hint('ПРИЦЕЛ — МЫШЬ / ПАЛЕЦ / СТРЕЛКИ · ЗАЖАТЬ — ЗАДЕРЖАТЬ ДЫХАНИЕ');
  ctx.stat('');

  return new Promise(resolve => {
    const aim = makeAim(ctx, {
      start: [C.W * .5, C.H * .45],
      onHold() { if (over) return; holding = true; },
      onRelease() {
        if (!holding) return; holding = false;
        if (!choice && !over && Clock.now() - lastNo > 1500) { lastNo = Clock.now(); ctx.say('Палец не слушается.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1300); }
      },
    });
    async function story() {
      await scope.wait(700);
      await ctx.line('Дверь не была заперта.', { pos: 'top', ms: 2000 });
      await ctx.line('Отец лежал на полу. Пьяный — так же, как всегда.', { pos: 'top', ms: 2700 });
      await ctx.line('Дыхание. Прицел. Плавный спуск.', { pos: 'top', ms: 3200 });
      await scope.wait(1800);
      headT = 1; A.sfx.creak(.12);
      await ctx.line('— Ты… — выдохнул он. — Ты… это…', { pos: 'top', ms: 2600 });
      await ctx.line('— Я… я не… я хотел…', { pos: 'top', ms: 2400 });
      await scope.wait(600);
      wave = 0;
      await ctx.line('Он поднял руку — грязную, дрожащую — и помахал. Один раз.', { pos: 'top', ms: 3200 });
      await ctx.line('«Я знаю. Ты прав», — сказал он без слов.', { pos: 'top', ms: 3000 });
      choice = true; ctl.hidden = false; bPress.focus({ preventScroll: true });
      ctx.hint('РЕШЕНИЕ — КНОПКИ ВНИЗУ ИЛИ 1 / 2');
    }
    story();
    async function press() {
      if (over || !choice) return;
      over = true; ctl.hidden = true; darkT = 1;
      ctx.say('Он зажмурился. Выдохнул.', { pos: 'mid', cls: 'ice' });
      await scope.wait(1300);
      ctx.unsay('mid');
      A.sfx.shot(.75); FX.flash('#ffffff', 900, 1); FX.shake('lg');
      hum.vol(0, .05);
      await scope.wait(2200);
      await ctx.line('Рука отца осталась поднятой. Потом упала.', { pos: 'mid', ms: 2800 });
      await ctx.line('— Прощай, — сказал он тихо. Не отцу. Себе.', { pos: 'mid', ms: 3000 });
      resolve({ ok: 'ok', detail: 'ВЫБОР: НАЖАТЬ' });
    }
    async function lower() {
      if (over || !choice) return;
      over = true; ctl.hidden = true;
      A.sfx.glitch(); glitch = 1; FX.flash('#ff0033', 600, .6);
      await ctx.line('Он опустил пистолет.', { pos: 'mid', ms: 2000 });
      A.sfx.glitch(); glitch = 1;
      ctx.say('НЕЙРОСЛЕПОК: РАСХОЖДЕНИЕ С ЗАПИСЬЮ', { pos: 'mid', cls: 'big red' });
      await scope.wait(2600);
      await ctx.line('Архив помнит выстрел. Эта версия будет помечена как искажённая.', { pos: 'bot', ms: 3200 });
      resolve({ ok: 'dist', detail: 'ВЫБОР: ОПУСТИТЬ' });
    }
    scope.on(bPress, 'click', press);
    scope.on(bLower, 'click', lower);
    scope.on(document, 'keydown', e => { if (e.key === '1') press(); else if (e.key === '2') lower(); });

    scope.loop(dt => {
      t += dt; aim.tick(dt);
      if (holding) breath = Math.max(0, breath - dt * 2.8); else breath = Math.min(1, breath + dt * .5);
      mFill.style.width = `${breath * 100}%`;
      meter.firstChild.textContent = holding && breath <= 0 ? 'ДЫХАНИЕ СБИЛОСЬ' : 'ДЫХАНИЕ';
      headLift += (headT - headLift) * Math.min(1, dt * .8);
      if (wave >= 0) wave = Math.min(1, wave + dt / 3.4);
      dark += (darkT - dark) * Math.min(1, dt * 3);
      glitch = Math.max(0, glitch - dt * .8);
      const amp = Math.min(C.W, C.H) * .075 * (1 + (holding ? .4 : 0));
      rx = aim.x + amp * (Math.sin(t * 1.3) * .5 + Math.sin(t * 3.1 + 1) * .3) + rand(-1, 1) * amp * .35;
      ry = aim.y + amp * (Math.cos(t * 1.1) * .5 + Math.sin(t * 2.7 + 2) * .3) + rand(-1, 1) * amp * .35;
      draw();
    });

    function draw() {
      const { g, W, H } = C;
      g.fillStyle = '#060405'; g.fillRect(0, 0, W, H);
      const fy = H * .6;
      const fl = g.createLinearGradient(0, fy, 0, H); fl.addColorStop(0, '#120c0b'); fl.addColorStop(1, '#070504');
      g.fillStyle = fl; g.fillRect(0, fy, W, H - fy);
      // холодный свет из проёма за спиной
      g.fillStyle = 'rgba(170, 190, 210, .07)';
      g.beginPath(); g.moveTo(W * .35, fy); g.lineTo(W * .65, fy); g.lineTo(W * .95, H); g.lineTo(W * .05, H); g.closePath(); g.fill();
      // бутылки
      g.fillStyle = 'rgba(60, 90, 70, .35)';
      [[.2, .8, -.9], [.26, .86, .3], [.78, .78, 1.3]].forEach(([x, y, a]) => { g.save(); g.translate(W * x, H * y); g.rotate(a); g.fillRect(-4, -14, 8, 28); g.fillRect(-2, -20, 4, 7); g.restore(); });
      // отец
      const bx = W * .54, by = H * .74, s = Math.min(W, H) * .12;
      g.fillStyle = '#020202';
      g.beginPath(); g.ellipse(bx, by, s * 2, s * .42, -.05, 0, Math.PI * 2); g.fill();
      const hx = bx - s * 2.1, hy = by - s * .15 - headLift * s * .5;
      g.beginPath(); g.moveTo(bx - s * 1.5, by - s * .2); g.lineTo(hx + s * .2, hy + s * .2); g.lineTo(hx + s * .4, hy + s * .45); g.lineTo(bx - s * 1.2, by + s * .2); g.fill();
      g.beginPath(); g.arc(hx, hy, s * .36, 0, Math.PI * 2); g.fill();
      // рука: лежит → поднимается → машет → падает
      let ax = bx - s * .4, ay = by - s * .1, ex = ax + s * .8, ey = by + s * .15;
      if (wave >= 0) {
        const up = wave < .25 ? wave / .25 : wave < .75 ? 1 : 1 - (wave - .75) / .25;
        const wav = wave >= .3 && wave < .7 ? Math.sin((wave - .3) / .4 * Math.PI * 2) * .35 : 0;
        ex = ax + s * (.3 + wav); ey = ay - s * 1.6 * easeOut(up);
      }
      g.strokeStyle = '#020202'; g.lineWidth = s * .2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(ex, ey); g.stroke();
      g.beginPath(); g.arc(ex, ey, s * .14, 0, Math.PI * 2); g.fill();
      const vg = g.createRadialGradient(W / 2, H * .6, Math.min(W, H) * .2, W / 2, H * .6, Math.max(W, H) * .75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.8)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      if (!over) drawReticle(g, rx, ry, 'rgba(255, 60, 90, .9)', 20);
      if (glitch > 0) {
        for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,0,51' : '0,220,255'}, ${glitch * .35})`; g.fillRect(0, Math.random() * H, W, rand(2, 16)); }
      }
      if (dark > .01) { g.fillStyle = `rgba(0,0,0,${dark})`; g.fillRect(0, 0, W, H); }
    }
  });
}
