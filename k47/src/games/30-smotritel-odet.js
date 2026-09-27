/* ==========================================================================
   Глава 30 · «Смотритель» — ОДЕТЬ, НЕ ПОПАСТЬ В КАМЕРУ
   Робин у капсулы. Форму можно бросить на пол, как всегда, — а можно
   протянуть. Воротник, лямки, плечи, застёжки, шоколадка в карман, шёпот.
   Под потолком камера медленно водит красным глазом. Три цикла.
   ========================================================================== */
defineFrag(29, {
  id: 'keeper', name: 'Ты справишься',
  text: 'Он начал помогать. Сначала — поправлять воротник. Потом — затягивать лямки бронежилета. Потом — укладывать форму аккуратно. Он делал это быстро, почти незаметно. Не глядя в глаза.',
  how: 'Три пробуждения. Протяни форму — или брось на пол, как положено. Потом помогай: нажимай на мигающие точки на клоне по порядку (воротник, лямки, плечи, застёжки, карман, шёпот). Камера под потолком ведёт лучом: пока красный луч на вас — замри. Каждая замеченная помощь ложится в досье. Досье заполнится — вызовут в кабинет раньше срока.',
  keys: 'ТАП / КЛИК ПО ТОЧКЕ — ПОМОЧЬ · ПРОБЕЛ / ENTER — СЛЕДУЮЩАЯ ТОЧКА · НИЧЕГО НЕ ЖМИ, ПОКА ЛУЧ НА ВАС',
  note: 'Смотритель, который протягивал форму и шептал «ты справишься». Я запомнил. Где другой? Никто не ответил, а новый смотритель просто отвёл глаза.',
  mem: 'ТЫ СПРАВИШЬСЯ', start: gameKeeper,
});

function gameKeeper(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const STEPS = [
    { k: 'collar', n: 'ВОРОТНИК', x: 0, y: 0.46 },
    { k: 'strapL', n: 'ЛЯМКА', x: -0.12, y: 0.56 },
    { k: 'strapR', n: 'ЛЯМКА', x: 0.12, y: 0.56 },
    { k: 'shoulder', n: 'ПЛЕЧИ', x: -0.25, y: 0.52 },
    { k: 'clasp', n: 'ЗАСТЁЖКИ', x: 0, y: 0.7 },
    { k: 'pocket', n: 'ШОКОЛАДКА', x: 0.17, y: 0.8 },
    { k: 'whisper', n: '«ТЫ СПРАВИШЬСЯ»', x: 0.13, y: 0.2 },
  ];
  let t = 0, over = false, cycle = 0, stage = 'form', step = 0, dossier = 0, care = 0, careMax = 0, flash = 0, flashCol = '255,0,51', gel = 1;
  let cam = 0.1, camDir = 1, camSpd = 0.22, camPause = 0;
  const dosM = ctx.meter('ДОСЬЕ', { cls: 'red', right: 14, top: 14 });
  const careM = ctx.meter('ЗАБОТА', { cls: 'amb', left: 14, top: 14 });
  const upd = () => ctx.stat(`ПРОБУЖДЕНИЕ ${Math.min(3, cycle + 1)}/3 · ${stage === 'help' ? `${step}/${STEPS.length}` : ''}`);
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 55, vol: 0 }));
  hum.vol(0.02, 1);
  ctx.hint('ПОМОГАЙ, ПОКА КАМЕРА СМОТРИТ В СТОРОНУ · КРАСНЫЙ ЛУЧ НА ВАС — ЗАМРИ');

  return new Promise(resolve => {
    const fig = () => { const h = Math.min(C.H * 0.78, C.W * 0.95); return { cx: C.W * 0.5, top: C.H * 0.14, h }; };
    const ptPos = s => { const F = fig(); return [F.cx + s.x * F.h, F.top + s.y * F.h]; };
    const seen = () => Math.abs(cam - 0.5) < 0.13;          // луч камеры над клоном
    const K47_WORDS = ['— Иди. Стой. Жди.', '— Держись, парень.', '— Ты справишься.'];

    async function wake() {
      stage = 'wake'; step = 0; gel = 1; upd();
      A.sfx.hiss(0.9, 0.07); A.sfx.drip(0.06);
      await ctx.line(cycle === 0 ? 'Крышка капсулы открылась. Гель стекал по телу.' : cycle === 1 ? 'Через день. Или через неделю. Тот же — или другой. Но всегда один.' : 'Белые глаза. К-37.', { pos: 'top', ms: 2400 });
      if (!scope.alive || over) return;
      stage = 'form';
      const k = await ctx.choose(['Бросить форму на пол', 'Протянуть форму']);
      if (k === 0) {
        A.sfx.thud(0.15);
        await ctx.line('Он поднял её с пола. Надел. Механически. Не глядя.', { pos: 'top', ms: 2200 });
        careMax += STEPS.length + 1;
        return next();
      }
      care++; careMax += STEPS.length + 1;
      if (seen()) { dossier += 0.12; flash = 1; flashCol = '255,0,51'; A.sfx.beep(1400, 0.05, 0.03); }
      await ctx.line('Клон смотрел на форму несколько секунд. Потом взял. Пальцы дрогнули.', { pos: 'top', ms: 2200 });
      stage = 'help'; upd();
    }
    function help(i) {
      if (over || stage !== 'help' || i !== step) { if (stage === 'help') A.sfx.click(); return; }
      const s = STEPS[step];
      if (seen()) {
        dossier += 0.16; flash = 1; flashCol = '255,0,51'; A.sfx.beep(1400, 0.06, 0.04); FX.shake('sm');
        ctx.say('Камера видела всё.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 1000);
      } else { flash = 0.6; flashCol = '255,179,71'; }
      care++; step++;
      if (s.k === 'pocket') A.noise({ type: 'bandpass', freq: 4200, q: 1.5, dur: 0.25, vol: 0.05 });
      else if (s.k === 'whisper') A.sfx.whisper(1, 0.08);
      else A.sfx.type(0.05);
      upd();
      if (dossier >= 1) return caught();
      if (step >= STEPS.length) {
        stage = 'done';
        scope.timeout(async () => {
          await ctx.line(cycle === 2 ? '— Ты справишься.' : pick(['Клон не ответил. Но его пальцы дрогнули.', 'Он сжал шоколадку в кулаке и убрал в карман.']), { pos: 'top', cls: 'amb', ms: 2200 });
          next();
        }, 300);
      }
    }
    async function next() {
      if (over) return;
      cycle++;
      if (cycle < 3) return wake();
      over = true;
      const k = care / Math.max(1, careMax);
      if (k >= 0.75) {
        await ctx.line('— Ты помнишь меня? — спросил Робин.', { pos: 'top', ms: 2000 });
        await ctx.line('— Ты называешь меня Кристиан. Ты даёшь мне шоколад. Я запомнил.', { pos: 'top', cls: 'amb', ms: 3200 });
        await ctx.line('В тот же день его вызвали в кабинет начальника.', { pos: 'top', cls: 'red', ms: 2400 });
        resolve({ ok: 'ok', detail: `ЗАБОТА ${Math.round(k * 100)}% · ДОСЬЕ ${Math.round(Math.min(1, dossier) * 100)}%` });
      } else {
        await ctx.line('— Иди. Стой. Жди.', { pos: 'top', ms: 1800 });
        await ctx.line('Белые глаза ничего не выражали. Он никого не запомнил.', { pos: 'top', ms: 2600 });
        resolve({ ok: 'fail', detail: `ЗАБОТА ${Math.round(k * 100)}%` });
      }
    }
    async function caught() {
      over = true; stage = 'done';
      FX.flash('#ff0033', 300, 0.4);
      await ctx.line('— Робин. Ты знаешь, зачем мы тебя вызвали?', { pos: 'top', cls: 'red', ms: 2400 });
      await ctx.line('Досье заполнилось раньше, чем К-37 успел запомнить.', { pos: 'top', ms: 2600 });
      resolve({ ok: 'fail', detail: `ПРОБУЖДЕНИЕ ${cycle + 1} ИЗ 3` });
    }

    scope.on(C.cv, 'pointerdown', e => {
      if (stage !== 'help') return;
      const r = C.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const i = STEPS.findIndex(s => { const [px, py] = ptPos(s); return Math.hypot(px - x, py - y) < 30; });
      if (i >= 0) help(i);
    });
    ctx.keys(e => { if (stage === 'help' && (e.code === 'Space' || e.key === 'Enter')) { e.preventDefault(); help(step); } });

    scope.loop(dt => {
      t += dt; flash = Math.max(0, flash - dt * 2); gel = Math.max(0, gel - dt * 0.15);
      if (camPause > 0) camPause -= dt;
      else { cam += camDir * camSpd * dt; if (cam > 0.95 || cam < 0.05) { camDir *= -1; cam = clamp(cam, 0.05, 0.95); camPause = rand(0.4, 1.4); camSpd = rand(0.16, 0.3) + cycle * 0.04; } }
      dosM.set(dossier); careM.set(care / Math.max(1, careMax));
      draw();
    });
    wake();

    function draw() {
      const { g, W, H } = C, F = fig();
      g.fillStyle = '#0a0d10'; g.fillRect(0, 0, W, H);
      // капсульная: овалы капсул вдоль стены
      for (let i = 0; i < 5; i++) { const x = W * (0.1 + i * 0.2); g.fillStyle = '#0f1a22'; Art.rr(g, x - 30, H * 0.12, 60, H * 0.55, 30); g.fill(); g.strokeStyle = 'rgba(136,221,255,.18)'; g.stroke(); }
      // лужа геля
      g.fillStyle = `rgba(80,180,230,${0.12 + gel * 0.2})`; g.beginPath(); g.ellipse(F.cx, F.top + F.h * 0.98, F.h * 0.3, F.h * 0.04, 0, 0, Math.PI * 2); g.fill();
      // клон
      Art.clone(g, F.cx, F.top, F.h, { seed: 30 + cycle, lines: false, scars: cycle * 3, skin: '#b3bdc4', t });
      // бронежилет — криво, пока не поправили
      const fixed = stage === 'help' ? step : stage === 'done' ? STEPS.length : 0;
      g.save(); g.translate(F.cx, F.top + F.h * 0.68); g.rotate(fixed >= 4 ? 0 : 0.12 - fixed * 0.03);
      g.fillStyle = 'rgba(28,32,38,.92)'; Art.rr(g, -F.h * 0.2, -F.h * 0.16, F.h * 0.4, F.h * 0.34, 8); g.fill();
      g.strokeStyle = 'rgba(107,107,112,.8)'; g.lineWidth = 2; g.stroke();
      g.restore();
      // точки помощи
      if (stage === 'help') STEPS.forEach((s, i) => {
        const [x, y] = ptPos(s);
        if (i < step) { g.fillStyle = 'rgba(0,255,136,.7)'; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); return; }
        if (i > step) return;
        const p = 0.5 + 0.5 * Math.sin(t * 6);
        g.strokeStyle = `rgba(255,179,71,${0.5 + p * 0.5})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 14 + p * 6, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#ffb347'; g.font = `12px ${MONO}`; g.textAlign = 'center'; g.fillText(s.n, x, y - 26);
      });
      // камера под потолком и её луч
      const cx0 = W * 0.5, cy0 = 6, bx = W * cam, by = H;
      const onUs = seen();
      g.fillStyle = onUs ? 'rgba(255,0,51,.16)' : 'rgba(255,0,51,.06)';
      g.beginPath(); g.moveTo(cx0, cy0); g.lineTo(bx - W * 0.1, by); g.lineTo(bx + W * 0.1, by); g.closePath(); g.fill();
      g.fillStyle = '#222'; g.fillRect(cx0 - 16, 0, 32, 14);
      g.fillStyle = onUs || Math.sin(t * 4) > 0 ? '#ff0033' : '#5a0610'; g.beginPath(); g.arc(cx0, 10, 4, 0, Math.PI * 2); g.fill();
      if (onUs && stage === 'help') { g.fillStyle = '#ff0033'; g.font = `14px ${PIXEL}`; g.textAlign = 'center'; g.fillText('● REC', cx0, 34); }
      if (flash > 0) { g.fillStyle = `rgba(${flashCol},${flash * 0.18})`; g.fillRect(0, 0, W, H); }
      Art.scan(g, W, H, 0.08);
      Art.vignette(g, W, H, 0.65);
    }
  });
}
