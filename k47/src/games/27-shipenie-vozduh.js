/* ==========================================================================
   Глава 27 · «Шипение» — ПРОДЕРЖАТЬСЯ БЕЗ ВОЗДУХА
   Баллон пробит, скафандр травит. На броне (референс 6) вспыхивают
   шипящие пробоины — зажимай их. Дыши реже: каждый вдох — воздух.
   Дойди до света за поворотом. Там сидит она.
   ========================================================================== */
defineFrag(26, {
  id: 'hiss', name: 'Без воздуха',
  text: 'Давление нарастало. Звон в ушах превратился в вой. Каждый вдох давался с трудом. И вдруг — свет. Лампочка, ярче других, горела за поворотом, освещая небольшой закуток. В этом закутке, спиной к нему, сидела она.',
  how: 'Пробоины шипят на броне — коснись и держи, чтобы зажать (одна рука — одна пробоина). Воздух уходит тем быстрее, чем больше открытых пробоин. Вдыхай, когда потемнеет в глазах, но не чаще: каждый вдох тратит баллон. Жми «ПОЛЗТИ», чтобы двигаться к свету.',
  keys: 'ЗАЖАТЬ — ДЕРЖАТЬ ПАЛЕЦ / КЛИК НА ПРОБОИНЕ · ВДОХ — B / ENTER · ПОЛЗТИ — → / D / КНОПКА',
  note: 'До сих пор слышу это ш-ш-ш. Я знал, что женщина с фотографии мне только мерещится, — и всё равно пошёл к ней. Опять фотография. Опять мама.',
  mem: 'Ш-Ш-Ш', start: gameHiss,
});

function gameHiss(ctx) {
  const { scope, body } = ctx;
  const C = ctx.canvas();
  const airM = ctx.meter('БАЛЛОН', { cls: 'ice', left: 14, top: 14 });
  const oxyM = ctx.meter('КИСЛОРОД В КРОВИ', { left: 14, top: 44 });
  const ctl = ctx.el('div', 'ctl');
  const breathB = ctx.el('button', 'btn big-btn', ctl, 'ВДОХ');
  const crawlB = ctx.el('button', 'btn btn-primary big-btn', ctl, 'ПОЛЗТИ ▶');
  let air = 1, oxy = 1, prog = 0, t = 0, over = false, nextLeak = 1.5, lastBreath = -9, lastCrawl = 0, dark = 0;
  const leaks = [];
  let held = null;
  const hissL = scope.own(A.loopNoise({ type: 'highpass', freq: 3800, q: 0.4, vol: 0 }));
  ctx.hint('ЗАЖИМАЙ ПРОБОИНЫ · ВДЫХАЙ РЕДКО · ПОЛЗИ К СВЕТУ');
  ctx.say('Баллон пробит. Он лежал на льду и слушал шипение.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2600);

  return new Promise(resolve => {
    const suit = () => { const h = Math.min(C.H * 0.8, C.W * 0.9); return { cx: C.W * 0.34, top: C.H * 0.1, h }; };
    function leakAt(x, y) { return leaks.findIndex(l => Math.hypot(l.x - x, l.y - y) < 34); }
    const rel = e => { const r = C.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    scope.on(C.cv, 'pointerdown', e => {
      const [x, y] = rel(e), i = leakAt(x, y);
      if (i >= 0) { held = { id: e.pointerId, leak: leaks[i] }; leaks[i].sealed = true; A.sfx.thud(0.08); try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ } }
    });
    const rel2 = e => { if (held && held.id === e.pointerId) { held.leak.sealed = false; held = null; } };
    scope.on(C.cv, 'pointerup', rel2); scope.on(C.cv, 'pointercancel', rel2);
    function breathe() {
      if (over) return;
      if (t - lastBreath < 1.2) { A.sfx.buzz(); air -= 0.02; ctx.say('Слишком часто. Баллон тает.', { pos: 'mid', cls: 'red' }); scope.timeout(() => ctx.unsay('mid'), 900); return; }
      lastBreath = t; oxy = Math.min(1, oxy + 0.38); air -= 0.035;
      A.sfx.breath(0.8, 0.1, true);
    }
    function crawl() {
      if (over || t - lastCrawl < 0.28) return;
      lastCrawl = t; prog = Math.min(1, prog + 0.022); oxy -= 0.012;
      A.noise({ type: 'lowpass', freq: 380, dur: 0.15, vol: 0.05 });
      if (prog >= 1) win();
    }
    scope.on(breathB, 'click', breathe);
    scope.on(crawlB, 'pointerdown', e => { e.preventDefault(); crawl(); });
    // клавиатура: зажать ближайшую пробоину — пробел
    ctx.keys(e => {
      if (e.code === 'KeyB' || e.key === 'Enter') { e.preventDefault(); breathe(); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); crawl(); }
      if (e.code === 'Space') { e.preventDefault(); const l = leaks.find(x => !x.sealed); if (l && !held) { held = { id: 'kb', leak: l }; l.sealed = true; } }
    });
    scope.on(document, 'keyup', e => { if (e.code === 'Space' && held && held.id === 'kb') { held.leak.sealed = false; held = null; } });

    async function win() {
      over = true; hissL.vol(0, 0.5);
      await ctx.line('За поворотом — свет. Спиной к нему сидела она.', { pos: 'top', cls: 'amb', ms: 2800 });
      await ctx.line('Лицо женщины с фотографии медленно таяло в темноте.', { pos: 'top', ms: 2800 });
      resolve({ ok: 'ok', detail: `БАЛЛОН ${Math.round(Math.max(0, air) * 100)}%` });
    }
    async function lose() {
      over = true; hissL.vol(0, 0.3);
      await ctx.line('Баллон замолчал. Тишина, что была чуть спокойнее.', { pos: 'mid', ms: 2800 });
      resolve({ ok: 'fail', detail: `ДО СВЕТА ${Math.round((1 - prog) * 100)}%` });
    }

    scope.loop(dt => {
      t += dt;
      if (!over) {
        const S = suit();
        nextLeak -= dt;
        if (nextLeak <= 0 && leaks.filter(l => !l.dead).length < 4) {
          nextLeak = rand(2, 3.6) * (1 - prog * 0.3);
          const spots = [[0, 0.72], [-0.2, 0.62], [0.2, 0.62], [-0.24, 0.85], [0.24, 0.85], [0, 0.4], [-0.1, 0.95], [0.12, 0.3]];
          const [dx, dy] = pick(spots);
          leaks.push({ x: S.cx + dx * S.h * 0.55 + rand(-10, 10), y: S.top + dy * S.h * 0.95, sealed: false, life: rand(7, 11), dead: false });
          A.sfx.hiss(0.5, 0.08);
        }
        leaks.forEach(l => { l.life -= dt * (l.sealed ? 2.2 : 1); if (l.life <= 0) l.dead = true; });   // под ладонью пробоину быстрее затягивает инеем
        for (let i = leaks.length - 1; i >= 0; i--) if (leaks[i].dead) { if (held && held.leak === leaks[i]) held = null; leaks.splice(i, 1); A.sfx.drip(0.04); }
        const open = leaks.filter(l => !l.sealed).length;
        air -= dt * (0.003 + open * 0.008);
        oxy -= dt * 0.055;
        hissL.vol(Math.min(0.12, open * 0.03));
        airM.set(air); oxyM.set(oxy);
        dark = clamp(1 - oxy * 1.4, 0, 1);
        ctx.stat(`ДО СВЕТА ${Math.round((1 - prog) * 100)}% · ПРОБОИН ${open}`);
        if (oxy <= 0 || air <= 0) lose();
      }
      draw();
    });

    function draw() {
      const { g, W, H } = C, S = suit();
      g.fillStyle = '#05080b'; g.fillRect(0, 0, W, H);
      // штрек и свет за поворотом приближается
      const lx = lerp(W * 1.1, W * 0.78, prog), lr = H * (0.2 + prog * 0.6);
      const lg = g.createRadialGradient(lx, H * 0.4, 0, lx, H * 0.4, lr);
      lg.addColorStop(0, `rgba(255,236,200,${0.25 + prog * 0.5})`); lg.addColorStop(1, 'rgba(255,236,200,0)');
      g.fillStyle = lg; g.fillRect(0, 0, W, H);
      if (prog > 0.6) { g.globalAlpha = (prog - 0.6) * 2.2; Art.human(g, lx, H * 0.7, H * 0.36, 'woman', { color: 'rgba(40,30,25,.85)' }); g.globalAlpha = 1; }
      // броня К-38 — полный комплект (референс 6)
      Art.armor(g, S.cx, S.top, S.h, { t, blood: 0.8, cracked: true, seed: 38 });
      // пробоины
      leaks.forEach(l => {
        const k = l.sealed ? 0.2 : 1;
        g.strokeStyle = `rgba(210,235,255,${0.6 * k})`; g.lineWidth = 1;
        for (let i = 0; i < 8; i++) { const a = rand(0, Math.PI * 2), r = rand(6, 22) * k; g.beginPath(); g.moveTo(l.x, l.y); g.lineTo(l.x + Math.cos(a) * r, l.y + Math.sin(a) * r); g.stroke(); }
        g.strokeStyle = l.sealed ? 'rgba(0,255,136,.9)' : `rgba(255,${80 + 80 * Math.sin(t * 12) | 0},90,.95)`; g.lineWidth = 2;
        g.beginPath(); g.arc(l.x, l.y, 16, 0, Math.PI * 2); g.stroke();
      });
      // темнота в глазах
      if (dark > 0) { Art.vignette(g, W, H, 0.4 + dark * 0.6, W / 2, H / 2, '0,0,0'); g.fillStyle = `rgba(0,0,0,${dark * 0.45})`; g.fillRect(0, 0, W, H); }
      g.fillStyle = 'rgba(180,220,245,.06)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
      Art.vignette(g, W, H, 0.6);
    }
  });
}
