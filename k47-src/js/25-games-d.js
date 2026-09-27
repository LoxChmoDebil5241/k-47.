/* ==========================================================================
   НОВЫЕ ФРАГМЕНТЫ · часть 4
   Сталь · Дозировки · Снаряжение · Штреки (3D) · Тихий путь · Без рук ·
   Сорок единиц · Соль
   ========================================================================== */

/** силуэт ствола для голограммы лектора; центр — (x, y), длина ~L */
function drawGun(g, kind, x, y, L, col = '#88ddff') {
  const u = L / 112;
  g.save(); g.translate(x, y); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = Math.max(1, u * 1.4); g.lineCap = 'round';
  const R = (a, b, w, h) => g.fillRect(a * u, b * u, w * u, h * u);
  const P = pts => { g.beginPath(); pts.forEach(([a, b], k) => (k ? g.lineTo(a * u, b * u) : g.moveTo(a * u, b * u))); g.closePath(); g.fill(); };
  const Lp = (a, b, c, d) => { g.beginPath(); g.moveTo(a * u, b * u); g.lineTo(c * u, d * u); g.stroke(); };
  switch (kind) {
    case 'bur': R(-30, -6, 44, 11); R(14, -4, 24, 5); R(14, 2, 18, 3); P([[-6, 5], [4, 5], [6, 22], [-3, 22]]); P([[-24, 5], [-17, 5], [-19, 17], [-26, 17]]); R(-52, -4, 22, 2.5); R(-52, 2, 22, 2); R(-56, -7, 5, 14); break;
    case 'buran': R(-28, -7, 46, 12); R(18, -5, 36, 5); R(18, 1, 26, 3); g.beginPath(); g.arc(6 * u, 14 * u, 11 * u, 0, Math.PI * 2); g.fill(); P([[-22, 5], [-15, 5], [-17, 18], [-24, 18]]); P([[-28, -6], [-58, -3], [-60, 9], [-28, 4]]); break;
    case 'pump': R(-10, -5, 64, 4); R(-4, 0, 48, 4); R(12, -2, 16, 8); R(-26, -6, 18, 11); P([[-26, -4], [-36, -2], [-38, 5], [-26, 5]]); P([[-36, -3], [-62, -1], [-62, 11], [-38, 6]]); break;
    case 'wt': R(-20, -6, 34, 11); R(14, -3, 12, 4); R(-4, 5, 7, 24); P([[-16, 5], [-10, 5], [-12, 17], [-18, 17]]); R(-38, -4, 18, 2.5); R(-40, -6, 3, 8); break;
    case 'vector': P([[-24, -7], [14, -7], [18, -2], [8, 8], [-24, 8]]); R(16, -4, 28, 7); P([[-4, 6], [4, 6], [2, 28], [-6, 28]]); P([[-18, 8], [-12, 8], [-14, 20], [-20, 20]]); R(-44, -5, 20, 8); break;
    case 'mg': R(8, -3, 52, 4); R(-26, -8, 36, 14); R(-16, 6, 18, 14); R(-6, -14, 12, 4); Lp(46, 1, 38, 20); Lp(46, 1, 54, 20); P([[-26, -6], [-56, -4], [-58, 10], [-26, 6]]); break;
    case 'sniper': R(8, -2, 58, 3); R(-22, -5, 32, 9); R(-18, -15, 30, 6); R(-12, -9, 3, 5); R(4, -9, 3, 5); Lp(52, 0, 46, 16); Lp(52, 0, 58, 16); P([[-22, -4], [-62, -6], [-64, 10], [-40, 10], [-22, 5]]); break;
    case 'sawn': R(-4, -6, 30, 4); R(-4, -1, 30, 4); R(-18, -7, 14, 11); P([[-18, 0], [-10, 2], [-18, 18], [-27, 16]]); break;
    case 'pistol': R(-14, -6, 30, 8); P([[-12, 2], [-2, 2], [-4, 18], [-14, 18]]); break;
  }
  g.restore();
}

// ============================================================ 32 · СТАЛЬ
const GUNS = {
  bur: { n: '«Короткий Бур»', s: 'дробовик · ствол 40 см · 8 патронов · лёгкий · до 15 м' },
  buran: { n: '«Буран»', s: 'дробовик · барабан 12 · тяжёлый · долгая перезарядка' },
  pump: { n: 'Помповое', s: 'надёжно · прощает грязь и лёд · обе руки на перезарядку' },
  wt: { n: 'WT', s: 'ПП 9 мм · 32 патрона · 900 в минуту · броню не берёт' },
  vector: { n: '«Вектор»', s: 'ПП .45 · пробивает броню · точно до 100 м · тяжёлые патроны' },
  mg: { n: 'Пулемёт', s: 'лента · 20 кг · стена свинца · стоять на месте' },
  sniper: { n: 'Снайперская', s: 'оптика · один выстрел · ждать час' },
  sawn: { n: 'Обрез', s: 'без приклада · одна рука · точности никакой' },
  pistol: { n: 'Пистолет 9 мм', s: 'скрытно · добить раненого · или себя' },
};
const STEEL_Q = [
  { q: 'Узкий тоннель, противник за поворотом, метров десять. Не цепляться за стены. Вес решает всё.', a: 'bur' },
  { q: 'Зачистка. Вы знаете: враг за углом. Нужно быстро высадить магазин в стену — без перезарядки.', a: 'buran' },
  { q: 'Рейдеры в бронежилетах с керамикой. Шестьдесят метров. Остановить быстро и двигаться дальше.', a: 'vector' },
  { q: 'Три дня во льду. Всё в грязи, мороз, затворы клинит. Нужно одно: чтобы выстрелило.', a: 'pump' },
  { q: 'Прижать врага огнём, пока товарищи заходят с фланга. Можно не целиться — просто швырять пули.', a: 'wt' },
  { q: 'Удержать тоннель. Позицию не менять. Ни фауна, ни рейдеры не должны высунуться.', a: 'mg' },
  { q: 'Щель, куда не пролезет ничего с прикладом. Одна рука занята. Другого выхода нет.', a: 'sawn' },
  { q: 'Один выстрел — в командира вражеского отряда. Есть час на ожидание. Промах — приговор.', a: 'sniper' },
];
function gameSteel(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const wrap = ctx.el('div', 'g-center');
  const panel = ctx.el('div', 'g-panel ice', wrap);
  const tbar = meterEl(ctx, 'ВРЕМЯ НА ОТВЕТ', 'ice');
  const cards = ctx.el('div', 'g-cards', wrap);
  const qs = shuffle(STEEL_Q).slice(0, 7), T = 13;
  let k = 0, right = 0, left = T, locked = true, t = 0, over = false, flick = 0;
  ctx.hint('ТАП ПО ОРУЖИЮ ИЛИ 1–5 · НА ОТВЕТ 13 СЕКУНД · НУЖНО 5 ИЗ 7');
  const bg = cachedBg(C, (g, W, H) => {
    g.drawImage(Art.concrete(Math.round(W), Math.round(H), { base: '#141619', tint: 'rgba(20,40,60,.25)', seed: 32, cracks: 5 }), 0, 0, W, H);
    Art.grate(g, 0, 0, W, H * 0.08, 16, 'rgba(120,140,160,.2)');
    for (let i = 0; i < 20; i++) Art.figure(g, W * (0.05 + i * 0.047), H * 1.02, H * 0.2, { body: '#040506', head: 1.1 });
  });
  return new Promise(resolve => {
    function next() {
      if (k >= qs.length) return finish();
      const q = qs[k]; left = T; locked = false;
      panel.innerHTML = `<div class="g-h">СИТУАЦИЯ ${k + 1}/7</div><div class="g-text" style="color:#cfeaf8">${esc(q.q)}</div>`;
      const opts = shuffle([q.a, ...shuffle(Object.keys(GUNS).filter(x => x !== q.a)).slice(0, 4)]);
      cards.innerHTML = '';
      opts.forEach((id, n) => {
        const b = ctx.el('button', 'g-card ice', cards);
        const cv = document.createElement('canvas'); cv.width = 240; cv.height = 70; cv.style.cssText = 'width:100%;height:auto;display:block;margin-bottom:.3rem';
        const g2 = cv.getContext('2d'); drawGun(g2, id, 120, 32, 190, '#88ddff'); g2.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < 70; y += 3) g2.fillRect(0, y, 240, 1);
        b.appendChild(cv);
        b.insertAdjacentHTML('beforeend', `<b>${n + 1} · ${GUNS[id].n}</b><small>${GUNS[id].s}</small>`);
        b.dataset.id = id;
        scope.on(b, 'click', () => answer(id));
      });
      A.sfx.beep(900, 0.04, 0.04); flick = 0.4;
    }
    function answer(id) {
      if (locked || over) return; locked = true;
      const q = qs[k], ok = id === q.a;
      $$('.g-card', cards).forEach(b => { b.disabled = true; if (b.dataset.id === q.a) b.classList.add('right'); else if (b.dataset.id === id) b.classList.add('wrong'); });
      if (ok) { right++; A.sfx.chime(620, 0.05); } else { A.sfx.buzz(); FX.shake('sm'); }
      ctx.say(ok ? '— Сталь выживает, — кивает лектор.' : id ? `— ${GUNS[id].n}? — Он усмехается. — В штреке это смерть.` : '— Думаете? В штреке думать некогда.', { pos: 'bot', cls: ok ? 'ice' : 'red' });
      scope.timeout(() => { ctx.unsay('bot'); k++; next(); }, 1700);
    }
    function finish() {
      over = true; cards.innerHTML = '';
      const ok = right >= 5;
      panel.innerHTML = `<div class="g-h">ИТОГ</div><div class="g-text" style="color:#cfeaf8">${ok ? 'Здесь не нужна красота. Нужна надёжность.' : 'Лектор долго смотрит в зал. «Кто-то из вас не вернётся».'}</div>`;
      scope.timeout(() => resolve({ ok: ok ? 'ok' : 'fail', detail: `ВЕРНО ${right}/7` }), 2200);
    }
    scope.on(document, 'keydown', e => { const n = parseInt(e.key, 10); const b = $$('.g-card', cards)[n - 1]; if (b && !b.disabled) b.click(); });
    ctx.say('— В штреках выживает сталь, — лектор переключает слайд.', { pos: 'bot' });
    scope.timeout(() => { ctx.unsay('bot'); next(); }, 1600);
    scope.loop(dt => {
      t += dt; flick = Math.max(0, flick - dt);
      if (!locked && !over) { left -= dt; if (left <= 0) answer(null); }
      tbar.set(left / T);
      ctx.stat(`СИТУАЦИЯ ${Math.min(k + 1, 7)}/7 · ВЕРНО ${right}`);
      const { g, W, H } = C;
      g.drawImage(bg(), 0, 0, W, H);
      // проектор и голограмма
      const pr = g.createLinearGradient(0, 0, 0, H); pr.addColorStop(0, `rgba(136,221,255,${0.16 + (flick > 0 ? Math.random() * 0.1 : 0)})`); pr.addColorStop(1, 'rgba(136,221,255,0)');
      g.fillStyle = pr; g.beginPath(); g.moveTo(W * 0.48, H * 0.06); g.lineTo(W * 0.52, H * 0.06); g.lineTo(W * 0.9, H); g.lineTo(W * 0.1, H); g.closePath(); g.fill();
      if (!over && qs[k]) { g.globalAlpha = 0.12 + Math.sin(t * 7) * 0.03; drawGun(g, qs[k].a === 'bur' ? 'buran' : 'bur', W * 0.5, H * 0.2, Math.min(W * 0.5, 360), '#88ddff'); g.globalAlpha = 1; }
      Art.scan(g, W, H, 0.12);
      Art.vignette(g, W, H, 0.6);
    });
  });
}

// ============================================================ 33 · ДОЗИРОВКИ
const DOSE_ROUTES = ['внутрь / под язык', 'внутримышечно', 'в вену', 'ингаляция'];
const DOSE_Q = [
  { q: 'Двадцатый час смены, ещё три до конца. Усталость и страх. Боя нет — есть пятнадцать минут подождать.', d: 'Эфедрин', r: 0, dose: ['полграмма', 'два грамма', 'ложку, пока не отпустит', 'полграмма каждые полчаса'] },
  { q: 'Через три минуты — бой. Нужно ничего не чувствовать: ни холода, ни боли. Час продержаться.', d: 'Дизоксиэфедрин', r: 1, dose: ['одна ампула', 'две ампулы — для верности', 'ампула каждые десять минут', 'половина ампулы'] },
  { q: 'Силы на нуле. До эвакуатора — финальный рывок. Потом можно упасть.', d: 'Гиперзин', r: 2, dose: ['один эпипен', 'два эпипена', 'эпипен каждые пять минут', 'половину — остальное потом'] },
  { q: 'Неделя в штреках без сна. Нужно не остановиться. Банка стоит рядом.', d: 'Аранепс', r: 0, dose: ['два глотка в сутки', 'банку в сутки', 'пить, пока не проснёшься', 'глоток каждый час'] },
  { q: 'Ранение несовместимо с жизнью. Хирург — через полчаса. Довезти любой ценой.', d: 'Импедризин', r: 2, dose: ['одна доза — реанимация в течение 40 минут', 'одна доза — хирург подождёт и два часа', 'две дозы — надёжнее', 'по капле, чтобы оставался в сознании'] },
  { q: 'Медику нужно усыпить раненого перед транспортировкой. Он кричит и срывает повязки.', d: 'Ноктюрин', r: 3, dose: ['один вдох — пациенту, 3–5 секунд', 'полный баллон — пусть спит', 'себе — чтобы успокоиться', 'по вдоху каждые пять минут'] },
];
function gameDoses(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const wrap = ctx.el('div', 'g-center'); wrap.style.justifyContent = 'flex-end';
  const panel = ctx.el('div', 'g-panel', wrap);
  const cards = ctx.el('div', 'g-cards', wrap);
  const vit = meterEl(ctx, 'ПУЛЬС РАНЕНОГО', 'ok');
  const qs = shuffle(DOSE_Q).slice(0, 5), T = 30;
  let k = 0, step = 0, pick = {}, right = 0, left = T, over = false, t = 0, locked = true, patientHue = 0;
  ctx.hint('ПРЕПАРАТ → СПОСОБ → ДОЗА · КНОПКИ ИЛИ 1–4 · 30 СЕКУНД НА РАНЕНОГО · НУЖНО 4 ИЗ 5');
  return new Promise(resolve => {
    function show() {
      const q = qs[k];
      const head = `<div class="g-h">РАНЕНЫЙ ${k + 1}/5 · ШАГ ${step + 1}/3</div><div class="g-text">${esc(q.q)}</div>`;
      panel.innerHTML = head + (step ? `<div class="g-sub" style="margin-top:.5rem">${esc(pick.d)}${step > 1 ? ' · ' + esc(DOSE_ROUTES[pick.r]) : ''}</div>` : '');
      cards.innerHTML = '';
      let opts;
      if (step === 0) { const others = shuffle(DRUGS.filter(d => d.n !== q.d)).slice(0, 3); opts = shuffle([DRUGS.find(d => d.n === q.d), ...others]).map(d => ({ v: d.n, html: `<b>${esc(d.n)}</b><small>${esc(d.look)}</small>`, drug: d })); }
      else if (step === 1) opts = DOSE_ROUTES.map((r, n) => ({ v: n, html: `<b>${esc(r)}</b>` }));
      else opts = shuffle(q.dose.map((d, n) => ({ v: n, html: `<b style="font-size:.9rem">${esc(d)}</b>` })));
      opts.forEach((o, n) => {
        const b = ctx.el('button', 'g-card', cards);
        if (o.drug) { const cv = document.createElement('canvas'); cv.width = 80; cv.height = 60; cv.style.cssText = 'float:right;width:52px;height:39px;margin-left:.3rem'; drawDrug(cv.getContext('2d'), o.drug, 40, 32, 46); b.appendChild(cv); }
        b.insertAdjacentHTML('beforeend', o.html); const bb = $('b', b); bb.textContent = `${n + 1} · ${bb.textContent}`;
        scope.on(b, 'click', () => choose(o.v));
      });
      locked = false;
    }
    function choose(v) {
      if (locked || over) return;
      A.sfx.key();
      if (step === 0) { pick.d = v; if (v === 'Фентанил') { verdict(false, '— Фентанил? Трибунал. Расстрел. Без права на клонирование.'); return; } step = 1; show(); return; }
      if (step === 1) { pick.r = v; step = 2; show(); return; }
      pick.dose = v; verdict(pick.d === qs[k].d && pick.r === qs[k].r && v === 0);
    }
    function verdict(ok, line) {
      locked = true;
      const q = qs[k];
      if (ok) { right++; A.sfx.chime(560, 0.05); } else { A.sfx.error(); FX.flash('#ff0033', 250, 0.25); }
      const reason = ok ? 'Раненый дышит ровнее.' : line || `Правильно: ${q.d}, ${DOSE_ROUTES[q.r]}, ${q.dose[0]}. Лектор не повторяет дважды.`;
      ctx.say(reason, { pos: 'top', cls: ok ? '' : 'red' });
      scope.timeout(() => { ctx.unsay('top'); k++; step = 0; pick = {}; left = T; if (k >= qs.length) finish(); else show(); }, ok ? 1500 : 3200);
    }
    function finish() {
      over = true; cards.innerHTML = '';
      const ok = right >= 4;
      panel.innerHTML = `<div class="g-h">ИТОГ ЛЕКЦИИ</div><div class="g-text">${ok ? '— Ваше тело — не вечное. Даже если вы клон.' : '— Мы не восстанавливаем тех, кто убил себя сам. Это не входит в контракт.'}</div>`;
      scope.timeout(() => resolve({ ok: ok ? 'ok' : 'fail', detail: `ВЕРНО ${right}/5` }), 2400);
    }
    scope.on(document, 'keydown', e => { const n = parseInt(e.key, 10); const b = $$('.g-card', cards)[n - 1]; if (b) b.click(); });
    ctx.say('— Сколько, куда и как часто, — лектор стучит по голограмме. — Перепутаете — умрёте.', { pos: 'top' });
    scope.timeout(() => { ctx.unsay('top'); show(); }, 2000);
    const bg = cachedBg(C, (g, W, H) => { g.drawImage(Art.concrete(Math.round(W), Math.round(H), { base: '#191718', seed: 33, cracks: 7 }), 0, 0, W, H); Art.grate(g, 0, H * 0.55, W, H * 0.45, 26, 'rgba(90,90,100,.2)'); });
    scope.loop(dt => {
      t += dt;
      if (!locked && !over) { left -= dt; if (left <= 0) { verdict(false, 'Слишком долго. Он перестал дышать, пока вы думали.'); } }
      const pulse = over ? 0.5 : clamp(left / T, 0, 1);
      vit.set(pulse); vit.label(`ПУЛЬС РАНЕНОГО · ${Math.max(0, Math.ceil(left))} С`);
      ctx.stat(`РАНЕНЫЙ ${Math.min(k + 1, 5)}/5 · ВЕРНО ${right}`);
      patientHue += dt;
      const { g, W, H } = C;
      g.drawImage(bg(), 0, 0, W, H);
      const s = Math.min(W, H) * 0.5;
      Art.lying(g, W * 0.5, H * 0.3, s, { body: '#0b0809', blood: 0.8, seed: 33 + k });
      // монитор
      g.strokeStyle = pulse > 0.3 ? '#00ff88' : '#ff0033'; g.lineWidth = 2; g.beginPath();
      for (let x = 0; x <= W; x += 4) { const ph = (x / W * 5 + t * (0.6 + pulse)) % 1; const y = H * 0.1 - (ph < 0.07 ? Math.sin(ph / 0.07 * Math.PI) * 18 * pulse : 0); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      Art.vignette(g, W, H, 0.65);
    });
  });
}

// ============================================================ 34 · СНАРЯЖЕНИЕ
const GEAR = [
  { id: 'sloy', n: 'Броня «Слой»', kg: 8, grp: 'armor', c: '#1a1a1e', s: 'осколки, пистолет · для разведки' },
  { id: 'shakal', n: 'Броня «Шакал»', kg: 18, grp: 'armor', c: '#8a0a18', s: 'рабочая лошадка · держит очередь' },
  { id: 'pancir', n: 'Броня «Панцирь»', kg: 35, grp: 'armor', c: '#d4001e', s: 'штурм · медленный, шумный' },
  { id: 'avar', n: 'Аварийный баллон', kg: 2, grp: 'tank', c: '#2a7bff', s: 'синий · 5 минут · всегда на поясе' },
  { id: 'base', n: 'Базовый баллон', kg: 9, grp: 'tank', c: '#2a7bff', s: 'синий · 2 часа · на спине' },
  { id: 'twin', n: 'Двойной аварийный', kg: 4, grp: 'tank', c: '#2a7bff', s: 'синий · 40 минут · для карста' },
  { id: 'fuel', n: 'Баллон горючей смеси', kg: 6, grp: 'tank', c: '#ff0033', s: 'КРАСНЫЙ · для резака · не дышать' },
  { id: 'cutS', n: 'Носимый резак', kg: 1.5, grp: 'tool', c: '#88ddff', s: 'аккумулятор · 10 минут' },
  { id: 'cutL', n: 'Переносной резак', kg: 8, grp: 'tool', c: '#88ddff', s: 'от горючей смеси · режет лёд и броню' },
  { id: 'torch', n: 'Газовая горелка', kg: 1, grp: 'tool', c: '#ffb347', s: 'огонь · фауна отступает · не в газе' },
  { id: 'vibro', n: 'Сканер «Выбро»', kg: 1, grp: 'scan', c: '#00ff88', s: 'лёд, пустоты · 50 м · 70%' },
  { id: 'life', n: 'Сканер на живность', kg: 1, grp: 'scan', c: '#00ff88', s: 'тепло и движение · 100 м · тишина' },
  { id: 'cave', n: 'Сканер на полости', kg: 1, grp: 'scan', c: '#00ff88', s: 'карсты и каверны · 20 м' },
  { id: 'mags', n: 'Подсумки: 3 магазина ПП', kg: 3, grp: 'ammo', c: '#6b6b70', s: 'если больше — без еды' },
  { id: 'food', n: 'Аптечка и еда', kg: 3, grp: 'ammo', c: '#6b6b70', s: 'чем легче — тем живее' },
];
const LOADOUT_TASKS = [
  { t: 'Разведка по основному штреку. Девяносто минут. Быстро и тихо. Увидеть фауну раньше, чем она вас.', max: 20,
    rules: [[s => s.has('avar'), 'Аварийный баллон — всегда, в любых условиях.'], [s => s.has('base'), 'Девяносто минут — нужен базовый баллон на два часа.'], [s => s.has('sloy'), 'Разведчику — «Слой»: быстро и бесшумно.'], [s => s.has('life'), 'Фауну видит сканер на живность.'], [s => !s.has('fuel') || s.has('cutL'), 'Красный баллон без резака — лишний вес, который может взорваться.']] },
  { t: 'Вскрыть завал в техническом штреке у карстовой полости. Тридцать минут. Лёд и арматура.', max: 34,
    rules: [[s => s.has('avar'), 'Аварийный баллон — всегда.'], [s => s.has('twin'), 'В карст — двойной аварийный: если один разгерметизируется, есть второй.'], [s => s.has('cutL') && s.has('fuel'), 'Лёд и арматуру режет переносной резак. Ему нужна красная горючая смесь.'], [s => !s.has('pancir'), 'В «Панцире» в технический штрек не пролезть.'], [s => s.has('cave'), 'За стеной в два метра может быть пустота на сотню. Сканер на полости.']] },
  { t: 'Штурм. Удержать логистический узел час. Помощь не придёт. Бой будет.', max: 58,
    rules: [[s => s.has('avar'), 'Аварийный баллон — всегда.'], [s => s.has('pancir'), 'Штурм — «Панцирь». Скорость не важна, важна живучесть.'], [s => s.has('base'), 'Час боя — базовый баллон на спину.'], [s => s.has('mags'), 'Берите только патроны. Магазины.']] },
];
function gameLoadout(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const wrap = ctx.el('div', 'g-center'); wrap.style.justifyContent = 'flex-start'; wrap.style.paddingTop = '52px';
  const panel = ctx.el('div', 'g-panel ice', wrap);
  const kgM = meterEl(ctx, 'ВЕС', 'amb');
  const cards = ctx.el('div', 'g-cards', wrap); cards.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
  const goRow = ctx.el('div', 'ctl'); goRow.style.position = 'relative'; goRow.style.bottom = 'auto'; wrap.appendChild(goRow);
  const go = ctx.el('button', 'btn btn-primary big-btn', goRow, 'В ШТРЕК');
  let task = 0, tries = 0, passed = 0, sel = new Set(), over = false, t = 0;
  ctx.hint('ТАП ПО ПРЕДМЕТУ — ВЗЯТЬ / СНЯТЬ · «В ШТРЕК» ИЛИ ENTER — ПРОВЕРКА · ДВЕ ПОПЫТКИ НА ЗАДАНИЕ');
  const els = GEAR.map(it => {
    const b = ctx.el('button', 'g-card ice', cards, `<b style="font-size:.85rem;color:${it.c === '#ff0033' ? '#ff6680' : it.c === '#2a7bff' ? '#8fc3ff' : '#fff'}">${esc(it.n)}</b><small>${it.kg} кг · ${esc(it.s)}</small>`);
    b.style.minHeight = '0'; b.style.padding = '.5rem .6rem';
    scope.on(b, 'click', () => { if (over) return; if (sel.has(it.id)) sel.delete(it.id); else { if (it.grp === 'armor') GEAR.filter(x => x.grp === 'armor').forEach(x => sel.delete(x.id)); sel.add(it.id); } A.sfx.click(); sync(); });
    return b;
  });
  const weight = () => GEAR.filter(x => sel.has(x.id)).reduce((a, x) => a + x.kg, 0);
  function sync() { els.forEach((b, n) => b.classList.toggle('sel', sel.has(GEAR[n].id))); const w = weight(), mx = LOADOUT_TASKS[Math.min(task, 2)].max; kgM.set(w / mx); kgM.label(`ВЕС ${w} / ${mx} КГ`); kgM.el.style.color = w > mx ? '#ff6680' : ''; }
  function brief() { const T = LOADOUT_TASKS[task]; panel.innerHTML = `<div class="g-h">ЗАДАНИЕ ${task + 1}/3 · ПОПЫТКА ${tries + 1}/2</div><div class="g-text" style="color:#cfeaf8">${esc(T.t)}</div><div class="g-sub" style="color:#8fc3dd">ПРЕДЕЛ ВЕСА — ${T.max} КГ · СИНИЙ — КИСЛОРОД, КРАСНЫЙ — ГОРЮЧЕЕ</div>`; sync(); }
  return new Promise(resolve => {
    function check() {
      if (over) return;
      const T = LOADOUT_TASKS[task];
      const errs = T.rules.filter(([f, m]) => m && !f(sel)).map(([, m]) => m);
      if (weight() > T.max) errs.push(`Перегруз: ${weight()} кг. В штреке лишний вес — лишняя смерть.`);
      if (sel.has('fuel') && !sel.has('base') && !sel.has('twin') && !sel.has('avar')) errs.unshift('Из красного баллона не дышат. Смерть через три секунды.');
      if (!errs.length) {
        passed++; A.sfx.chime(500 + task * 120, 0.05);
        ctx.say('— Годится. Идите.', { pos: 'top', cls: 'ice' });
        return advance();
      }
      A.sfx.error(); FX.shake('sm');
      ctx.say(errs[0], { pos: 'top', cls: 'red' });
      tries++;
      if (tries >= 2) return advance();
      brief();
      scope.timeout(() => ctx.unsay('top'), 3200);
    }
    function advance() {
      over = true;
      scope.timeout(() => {
        ctx.unsay('top'); task++; tries = 0; sel = new Set();
        if (task >= 3) { go.disabled = true; const ok = passed >= 2; panel.innerHTML = `<div class="g-h">ИТОГ</div><div class="g-text" style="color:#cfeaf8">${ok ? 'Аварийный баллон на пять минут — не спасение. Это время, чтобы умереть в другом месте.' : 'Двое из группы не вернулись. Никто не спросил, кто их собирал.'}</div>`; return scope.timeout(() => resolve({ ok: ok ? 'ok' : 'fail', detail: `ЗАДАНИЙ ${passed}/3` }), 2600); }
        over = false; brief();
      }, 2600);
    }
    scope.on(go, 'click', check);
    scope.on(document, 'keydown', e => { if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) check(); });
    brief();
    scope.loop(dt => {
      t += dt;
      ctx.stat(`ЗАДАНИЕ ${Math.min(task + 1, 3)}/3 · ГОДНО ${passed}`);
      const { g, W, H } = C;
      g.fillStyle = '#03070b'; g.fillRect(0, 0, W, H);
      // голограмма бойца справа за карточками
      const h = H * 0.62, cx = W * 0.82, top = H * 0.3;
      g.globalAlpha = 0.25 + Math.sin(t * 5) * 0.04;
      const armor = sel.has('pancir') ? 1.3 : sel.has('shakal') ? 1.12 : 1;
      Art.figure(g, cx, top + h, h, { body: '#0e3448', wide: armor, rimCol: 'rgba(136,221,255,.9)' });
      const tanks = GEAR.filter(x => x.grp === 'tank' && sel.has(x.id));
      tanks.forEach((x, n) => { g.fillStyle = x.c; g.fillRect(cx - h * 0.16 + n * h * 0.09, top + h * 0.25, h * 0.07, h * 0.24); });
      g.globalAlpha = 1;
      Art.scan(g, W, H, 0.2);
      Art.vignette(g, W, H, 0.5, '0,10,20');
    });
  });
}

// ============================================================ 35 · ШТРЕКИ (3D, фолбэк — вид сверху)
const ICE_TYPES = {
  geo: { n: 'ГЕОРАЗВЕДКА', s: 'ОСНОВНОЙ ШТРЕК · ИДТИ МОЖНО', c: '#88ddff' },
  tech: { n: 'ТЕХНИЧЕСКИЙ', s: 'ТЕСНО · НЕ РАЗВЕРНУТЬСЯ · МЕДЛЕННО', c: '#ffb347' },
  gas: { n: 'ГАЗОВЫЙ КАРСТ', s: 'ФОНАРЬ — ПОГАСИТЬ · ОГОНЬ — НЕЛЬЗЯ', c: '#c8ff5a' },
  flood: { n: 'ЗАТОПЛЕННЫЙ КАРСТ', s: 'ВОДА С АММИАКОМ · НЕ ВХОДИТЬ', c: '#4aa8d8' },
  log: { n: 'ЛОГИСТИКА · МАГИСТРАЛЬ', s: 'ОХРАНА · БЕЗ ПРИКАЗА — НЕ ВХОДИТЬ', c: '#ff3355' },
};
function iceMaze(R, n = 6) {
  const S = n * 2 + 1;
  const m = Array.from({ length: S }, () => Array(S).fill('#'));
  const vis = new Set([`0,${n - 1}`]); m[(n - 1) * 2 + 1][1] = '.';
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < n && y < n && !vis.has(`${x},${y}`));
    if (!nb.length) { stack.pop(); continue; }
    const [x, y, dx, dy] = nb[Math.floor(R() * nb.length)];
    m[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = '.'; m[y * 2 + 1][x * 2 + 1] = '.'; vis.add(`${x},${y}`); stack.push([x, y]);
  }
  for (let k = 0; k < n + 2; k++) {
    const x = 1 + Math.floor(R() * (S - 2)), y = 1 + Math.floor(R() * (S - 2));
    if (m[y][x] === '#' && ((x % 2 === 0 && y % 2 === 1) || (x % 2 === 1 && y % 2 === 0))) m[y][x] = '.';
  }
  const start = [1, S - 2], exit = [S - 2, 1];
  const key = (x, y) => y * S + x, open = (x, y) => x >= 0 && y >= 0 && x < S && y < S && m[y][x] !== '#';
  const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  // кратчайший путь
  const prev = new Map([[key(...start), null]]), q = [start];
  while (q.length) { const [x, y] = q.shift(); if (x === exit[0] && y === exit[1]) break; D4.forEach(([dx, dy]) => { const X = x + dx, Y = y + dy; if (open(X, Y) && !prev.has(key(X, Y))) { prev.set(key(X, Y), [x, y]); q.push([X, Y]); } }); }
  const path = []; for (let p = exit; p; p = prev.get(key(...p))) path.unshift(p);
  const type = Array.from({ length: S }, () => Array(S).fill(null));
  const onPath = new Set(path.map(p => key(...p)));
  path.forEach(([x, y], i) => { const f = i / (path.length - 1); type[y][x] = f < 0.2 || f > 0.8 ? 'geo' : f < 0.46 ? 'tech' : f < 0.72 ? 'gas' : 'geo'; });
  // ворота «дышащего льда» — на последнем отрезке
  const gates = [];
  const gi = Math.floor(path.length * 0.88); if (path[gi] && gi < path.length - 1) gates.push({ x: path[gi][0], y: path[gi][1], ph: 0, open: 1 });
  // боковые ветви: тупики и петли
  const guards = [], seen = new Set();
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (!open(x, y) || onPath.has(key(x, y)) || seen.has(key(x, y))) continue;
    const comp = [], att = new Set(), st = [[x, y]]; seen.add(key(x, y));
    while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); D4.forEach(([dx, dy]) => { const X = a + dx, Y = b + dy; if (!open(X, Y)) return; if (onPath.has(key(X, Y))) att.add(key(X, Y)); else if (!seen.has(key(X, Y))) { seen.add(key(X, Y)); st.push([X, Y]); } }); }
    const r = R(), ty = att.size >= 2 ? 'log' : r < 0.45 ? 'flood' : r < 0.7 ? 'log' : 'geo';
    comp.forEach(([a, b]) => { type[b][a] = ty; });
    if (ty === 'log') { const far = comp[comp.length - 1]; guards.push({ x: far[0], y: far[1] }); }
  }
  return { S, m, type, start, exit, path, gates, guards, open, D4 };
}
async function gameIce(ctx) {
  const { scope, body } = ctx;
  const M = iceMaze(mulberry(hash(`ice${G.cycle}`)));
  const { S, type, D4 } = M;
  const B = 2, WH = 2.6;
  const o2M = meterEl(ctx, 'КИСЛОРОД', 'ice');
  let px = M.start[0], py = M.start[1], dir = 0, yaw = 0, yawTo = 0, torch = true, o2 = 1, strikes = 0, over = false, t = 0;
  let move = null, fuse = 0, scans = 2, scanT = 0, msgT = 0, bob = 0, torchPow = 20;
  // начальное направление — туда, где открыто
  for (let d = 0; d < 4; d++) if (M.open(px + D4[d][0], py + D4[d][1])) { dir = d; break; }
  yaw = yawTo = -dir * Math.PI / 2;
  const seen = new Set();
  const gateAt = (x, y) => M.gates.find(g => g.x === x && g.y === y);
  const passable = (x, y) => M.open(x, y) && !(gateAt(x, y) && gateAt(x, y).open < 0.5);
  const tyAt = (x, y) => type[y] && type[y][x];
  const mount = ctx.el('div', 'g-3d');
  const loading = ctx.el('div', 'g-center', body, '<div class="g-sub" style="color:#8fc3dd">ЛЁД ДЫШИТ… ЗАГРУЗКА ШТРЕКОВ</div>');
  const miniBox = ctx.el('div', 'g-mini'); miniBox.hidden = true; const mini = ctx.canvas(miniBox);
  const row = ctx.el('div', 'ctl ice-pad');
  const bt = ['↺', '▲', '↻', '▼', 'ФОНАРЬ', `СКАН ×${scans}`].map(l => ctx.el('button', 'btn', row, l));
  bt[4].classList.add('btn-amber');
  ctx.hint('W / ↑ — ВПЕРЁД · S / ↓ — НАЗАД · A D / ← → — ПОВОРОТ · F — ФОНАРЬ · E — СКАНЕР · ЧИТАЙ ТАБЛИЧКИ');
  const msg = (text, cls = '') => { ctx.say(text, { pos: 'top', cls }); msgT = 2.6; };

  // ---------- 3D
  let v3 = null;
  try { v3 = await createMini3D(scope, mount, { bg: 0x020609, fov: 70, look: false, pos: [px * B, 1.6, py * B], yaw }); } catch (e) { v3 = null; }
  if (!scope.alive) return { ok: 'abort' };
  loading.remove();
  let water = [], gasBoxes = [], gateMeshes = [], guardMeshes = [], dust = null, spot = null, exitLight = null;
  if (v3) {
    const { THREE, scene, camera, tex, lam, phong, basic, mesh, box, keep } = v3;
    scene.fog = new THREE.FogExp2(0x02070b, 0.16);
    scene.add(new THREE.HemisphereLight(0x3a6a88, 0x05080a, 0.35));
    scene.add(camera);
    spot = new THREE.SpotLight(0xe6f4ff, 26, 18, 0.62, 0.55, 1.4); spot.position.set(0.15, -0.1, 0); camera.add(spot); spot.target.position.set(0, -0.15, -1); camera.add(spot.target);
    const iceC = Art.concrete(256, 256, { base: '#26404f', tint: 'rgba(160,220,255,.18)', seed: 35, cracks: 10, frost: 0.9 });
    const iceT = tex(iceC, [1, 1.3]);
    const wallMat = lam({ map: iceT, color: 0x8fb8d0 });
    // стены — только те, что граничат с проходами
    const walls = [];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (!M.open(x, y)) {
      let near = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (M.open(x + dx, y + dy)) near = true;
      if (near) walls.push([x, y]);
    }
    const inst = new THREE.InstancedMesh(keep(new THREE.BoxGeometry(B, WH, B)), wallMat, walls.length);
    const mx = new THREE.Matrix4(), col = new THREE.Color();
    walls.forEach(([x, y], k) => { mx.makeTranslation(x * B, WH / 2, y * B); inst.setMatrixAt(k, mx); const h = mulberry(x * 31 + y)(); col.setRGB(0.75 + h * 0.25, 0.85 + h * 0.15, 1); inst.setColorAt(k, col); });
    scene.add(inst); keep({ dispose: () => inst.dispose() });
    const floorC = offCanvas(128, 128), fg = floorC.getContext('2d'); fg.drawImage(Art.concrete(128, 128, { base: '#1b2a33', seed: 3, cracks: 4, frost: 0.6 }), 0, 0); Art.grate(fg, 0, 0, 128, 128, 16, 'rgba(160,200,220,.18)');
    const floor = mesh(new THREE.PlaneGeometry(S * B, S * B), lam({ map: tex(floorC, [S, S]) }), (S - 1) * B / 2, 0, (S - 1) * B / 2); floor.rotation.x = -Math.PI / 2;
    const ceil = mesh(new THREE.PlaneGeometry(S * B, S * B), lam({ map: tex(iceC, [S, S]), color: 0x6a8a9a }), (S - 1) * B / 2, WH, (S - 1) * B / 2); ceil.rotation.x = Math.PI / 2;
    // типы зон
    const techMat = lam({ color: 0x2a2622 }), cableMat = lam({ color: 0x0c0c0c });
    const floodMat = phong({ color: 0x0b3a44, emissive: 0x041a20, shininess: 90, transparent: true, opacity: 0.85 });
    const gasMat = basic({ color: 0x9adf3a, transparent: true, opacity: 0.07, depthWrite: false });
    const logMat = basic({ color: 0xff0033 });
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const ty = tyAt(x, y); if (!ty || !M.open(x, y)) continue;
      const X = x * B, Z = y * B;
      if (ty === 'tech') { box(B, WH - 1.35, B, techMat, X, 1.35 + (WH - 1.35) / 2, Z); for (let c = 0; c < 3; c++) box(0.05, 0.05, B, cableMat, X - 0.5 + c * 0.25, 1.3, Z); }
      if (ty === 'flood') { const w = mesh(new THREE.PlaneGeometry(B, B), floodMat, X, 0.04, Z); w.rotation.x = -Math.PI / 2; water.push(w); }
      if (ty === 'gas') { const gbx = box(B * 0.98, WH * 0.9, B * 0.98, gasMat, X, WH * 0.45, Z); gasBoxes.push(gbx); }
      if (ty === 'log') { box(B, 0.02, 0.08, logMat, X, 0.02, Z); }
    }
    // таблички на входах в зону
    const signCache = {};
    const signTex = ty => signCache[ty] || (signCache[ty] = (() => {
      const c = offCanvas(512, 180), g = c.getContext('2d'), T = ICE_TYPES[ty];
      g.fillStyle = '#0b0b0d'; g.fillRect(0, 0, 512, 180); g.strokeStyle = T.c; g.lineWidth = 8; g.strokeRect(6, 6, 500, 168);
      for (let i = -2; i < 14; i++) { g.fillStyle = i % 2 ? '#111' : T.c; g.beginPath(); g.moveTo(i * 40, 150); g.lineTo(i * 40 + 20, 150); g.lineTo(i * 40 + 40, 174); g.lineTo(i * 40 + 20, 174); g.fill(); }
      Art.warnSign(g, 60, 72, 70, 1);
      g.fillStyle = T.c; g.font = `700 44px ${DISP}`; g.fillText(T.n, 112, 76);
      g.fillStyle = '#e8e8e8'; g.font = `22px ${MONO}`; g.fillText(T.s, 112, 118);
      return tex(c);
    })());
    const signGeo = keep(new THREE.PlaneGeometry(1.5, 0.53));
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (!M.open(x, y)) continue;
      D4.forEach(([dx, dy]) => {
        const ax = x - dx, ay = y - dy; if (!M.open(ax, ay)) return;
        const ty = tyAt(x, y); if (!ty || ty === tyAt(ax, ay)) return;
        const s = new THREE.Mesh(signGeo, lam({ map: signTex(ty), emissive: 0x222222, side: THREE.DoubleSide }));
        s.position.set(x * B - dx * B * 0.42, ty === 'tech' ? 1.1 : 2.05, y * B - dy * B * 0.42);
        s.rotation.y = Math.atan2(-dx, -dy);
        scene.add(s);
      });
    }
    // ворота из дышащего льда
    M.gates.forEach(gt => { const gm = box(B * 0.98, WH, 0.5, lam({ map: iceT, color: 0xe0f4ff, emissive: 0x0a2030 }), gt.x * B, WH / 2, gt.y * B); const dx = M.open(gt.x + 1, gt.y) ? 1 : 0; if (dx) gm.rotation.y = Math.PI / 2; gateMeshes.push({ gt, gm }); });
    // охрана на магистралях
    const guardC = offCanvas(256, 512); Art.armor(guardC.getContext('2d'), 128, 30, 470, { glow: 1, seed: 7 });
    const guardMat = basic({ map: tex(guardC), transparent: true, alphaTest: 0.05 });
    M.guards.slice(0, 4).forEach((gd, k) => {
      const gm = mesh(new THREE.PlaneGeometry(0.9, 1.8), guardMat, gd.x * B, 0.9, gd.y * B); guardMeshes.push(gm);
      if (k < 2) { const l = new THREE.PointLight(0xff0022, 3, 6, 1.4); l.position.set(gd.x * B, 2.1, gd.y * B); scene.add(l); }
    });
    // выход — шлюз
    const ex = offCanvas(256, 256), eg = ex.getContext('2d'); eg.fillStyle = '#062030'; eg.fillRect(0, 0, 256, 256); eg.strokeStyle = '#88ddff'; eg.lineWidth = 10; eg.strokeRect(10, 10, 236, 236); eg.fillStyle = '#88ddff'; eg.font = `700 54px ${DISP}`; eg.textAlign = 'center'; eg.fillText('ШЛЮЗ', 128, 140);
    const exitMesh = mesh(new THREE.PlaneGeometry(1.6, 1.6), basic({ map: tex(ex) }), M.exit[0] * B, 1.2, M.exit[1] * B - B * 0.49);
    const eOpen = D4.findIndex(([dx, dy]) => M.open(M.exit[0] + dx, M.exit[1] + dy));
    const [bdx, bdy] = D4[(eOpen + 2) % 4];
    exitMesh.position.set(M.exit[0] * B + bdx * B * 0.49, 1.2, M.exit[1] * B + bdy * B * 0.49); exitMesh.rotation.y = Math.atan2(-bdx, -bdy);
    exitLight = new THREE.PointLight(0x4aa8d8, 7, 12, 1.2); exitLight.position.set(M.exit[0] * B, 1.8, M.exit[1] * B); scene.add(exitLight);
    // ледяная пыль
    const N = 260, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = rand(-4, 4); pos[i * 3 + 1] = rand(0, WH); pos[i * 3 + 2] = rand(-4, 4); }
    const pg = keep(new THREE.BufferGeometry()); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dust = new THREE.Points(pg, keep(new THREE.PointsMaterial({ color: 0xcfefff, size: 0.025, transparent: true, opacity: 0.7, depthWrite: false })));
    scene.add(dust);
    v3.onTick((dt, time) => {
      const p = pg.attributes.position.array;
      for (let i = 0; i < N; i++) { p[i * 3 + 1] -= dt * (0.05 + (i % 7) * 0.02); if (p[i * 3 + 1] < 0) p[i * 3 + 1] = WH; }
      pg.attributes.position.needsUpdate = true;
      dust.position.set(v3.base.pos.x, 0, v3.base.pos.z);
      water.forEach((w, k) => { w.material.opacity = 0.75 + Math.sin(time * 2 + k) * 0.1; });
      gasBoxes.forEach((b, k) => { b.material.opacity = (torch ? 0.05 : 0.11) + Math.sin(time * 1.3 + k) * 0.02; });
      gateMeshes.forEach(({ gt, gm }) => { gm.scale.y = Math.max(0.02, 1 - gt.open); gm.position.y = WH * gm.scale.y / 2; });
      guardMeshes.forEach(gm => gm.lookAt(camera.position.x, 0.9, camera.position.z));
      exitLight.intensity = 6 + Math.sin(time * 3) * 1.5;
      spot.intensity = torch ? torchPow * (0.94 + Math.random() * 0.06) : 0;
    });
  } else {
    mount.remove();
    ctx.say('3D недоступно — схема штреков.', { pos: 'bot', cls: 'amb' }); scope.timeout(() => ctx.unsay('bot'), 2500);
  }
  const C2 = v3 ? null : ctx.canvas();
  if (C2) body.insertBefore(C2.cv, row);

  return new Promise(resolve => {
    const end = (ok, detail, text, cls) => { if (over) return; over = true; row.remove(); if (text) ctx.say(text, { pos: 'mid', cls }); scope.timeout(() => resolve({ ok, detail }), 2800); };
    function turn(d) { if (over || move) return; dir = (dir + d + 4) % 4; yawTo -= d * Math.PI / 2; A.sfx.step(0.05); }
    function step(back) {
      if (over || move) return;
      const d = back ? (dir + 2) % 4 : dir, [dx, dy] = D4[d], nx = px + dx, ny = py + dy;
      if (!M.open(nx, ny)) { A.sfx.ice(0.12); FX.shake('sm'); return; }
      if (!passable(nx, ny)) { msg('Лёд сомкнулся. Жди, пока он выдохнет.', 'ice'); A.sfx.ice(0.2); return; }
      const ty = tyAt(nx, ny);
      move = { fx: px, fy: py, tx: nx, ty: ny, t: 0, dur: (ty === 'tech' ? 0.95 : 0.42) * (back ? 1.3 : 1), kind: ty };
      A.sfx.step(0.1 + (ty === 'tech' ? 0.05 : 0), 0);
      if (ty === 'tech') A.sfx.scrape(0.08);
    }
    function arrive() {
      const ty = tyAt(px, py), prevTy = tyAt(move.fx, move.fy);
      const bounce = () => { px = move.fx; py = move.fy; };
      if (ty === 'flood') { o2 -= 0.22; A.noise({ type: 'lowpass', freq: 600, dur: 1.2, vol: 0.2 }); FX.flash('#4aa8d8', 400, 0.4); FX.shake('lg'); msg('Вода с аммиаком. Минус семь минут жизни. Назад!', 'red'); bounce(); }
      else if (ty === 'log') { strikes++; A.sfx.alarm(0.07); FX.hit('#ff0033'); msg(strikes < 3 ? `— Без приказа на магистрали? Назад. (${strikes}/3)` : '— Дезертир.', 'red'); bounce(); if (strikes >= 3) end('fail', 'ЗАДЕРЖАН НА МАГИСТРАЛИ', 'Логистический штрек без приказа — значит, заблудился. Или дезертир. И то и другое — смертельно.', 'red'); }
      else if (ty === 'gas' && prevTy !== 'gas' && torch) { fuse = 1.3; msg('Газ! ФОНАРЬ! (F)', 'red'); A.sfx.hiss(1.2, 0.12); }
      else if (ty !== prevTy && ICE_TYPES[ty]) msg(`${ICE_TYPES[ty].n}. ${ICE_TYPES[ty].s.split(' · ')[0].toLowerCase()}.`, ty === 'tech' ? 'amb' : 'ice');
      if (px === M.exit[0] && py === M.exit[1]) { A.sfx.system(true); A.sfx.chime(700, 0.06); end('ok', `КИСЛОРОД ${Math.round(o2 * 100)}%`, 'Шлюз. Шипение воздуха. Лёд выдохнул за спиной.'); }
    }
    function toggleTorch() { if (over) return; torch = !torch; A.sfx.click(); bt[4].classList.toggle('btn-amber', torch); if (!torch && fuse > 0) { fuse = 0; msg('Темнота. Дыши медленно.', 'ice'); } else if (torch && tyAt(px, py) === 'gas') { fuse = 0.9; msg('Газ! Погаси!', 'red'); A.sfx.hiss(0.8, 0.12); } }
    function scan() { if (over || scans <= 0) return; scans--; scanT = 4.5; bt[5].textContent = `СКАН ×${scans}`; bt[5].disabled = !scans; A.sfx.radio(0.5); }
    [() => turn(-1), () => step(false), () => turn(1), () => step(true), toggleTorch, scan].forEach((f, k) => scope.on(bt[k], 'click', f));
    scope.on(document, 'keydown', e => {
      const c = e.code;
      if (c === 'KeyW' || c === 'ArrowUp') { e.preventDefault(); step(false); } else if (c === 'KeyS' || c === 'ArrowDown') { e.preventDefault(); step(true); }
      else if (c === 'KeyA' || c === 'ArrowLeft') turn(-1); else if (c === 'KeyD' || c === 'ArrowRight') turn(1);
      else if (c === 'KeyF' && !e.repeat) toggleTorch(); else if ((c === 'KeyE' || c === 'KeyQ') && !e.repeat) scan();
    });
    // свайпы / тапы по виду
    let sw = null;
    const view = v3 ? mount : C2.cv;
    scope.on(view, 'pointerdown', e => { sw = { x: e.clientX, y: e.clientY }; });
    scope.on(view, 'pointerup', e => {
      if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) turn(dx < 0 ? 1 : -1);
      else if (dy < -40) step(false); else if (dy > 40) step(true);
      else { const r = view.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width; if (fx < 0.3) turn(-1); else if (fx > 0.7) turn(1); else step(false); }
    });
    msg('Лёд дышит и закрывает проходы. Выход — синий свет шлюза.', 'ice');

    scope.loop(dt => {
      t += dt;
      // дыхание льда
      M.gates.forEach(gt => { gt.ph += dt; const cyc = gt.ph % 7; const target = cyc < 4 ? 1 : 0; if (!(gt.x === px && gt.y === py) && !(move && move.tx === gt.x && move.ty === gt.y)) gt.open += (target - gt.open) * Math.min(1, dt * 1.6); if (Math.abs(cyc - 4) < dt) A.sfx.ice(0.15); });
      if (!over) {
        o2 -= dt / 190 * (tyAt(px, py) === 'tech' ? 1.3 : 1);
        if (fuse > 0) { fuse -= dt; if (fuse <= 0) { FX.flash('#ffb347', 900, 1); FX.shake('lg'); A.sfx.barrage(0.6); A.rumble(900); end('fail', 'ВЗРЫВ В ГАЗОВОМ КАРСТЕ', 'Вспышка. Пещера взорвалась вместе с тобой.', 'red'); } }
        if (o2 <= 0) { o2 = 0; A.sfx.flat(1.6); end('fail', 'КИСЛОРОД 0%', 'Баллон пуст. Лёд закрылся за спиной, как веко.', 'red'); }
        ctx.stat(`КИСЛОРОД ${Math.round(o2 * 100)}% · ${ICE_TYPES[tyAt(px, py)] ? ICE_TYPES[tyAt(px, py)].n : ''} · ФОНАРЬ ${torch ? 'ВКЛ' : 'ВЫКЛ'} · ЗАМЕЧАНИЙ ${strikes}/3`);
      }
      if (msgT > 0) { msgT -= dt; if (msgT <= 0) ctx.unsay('top'); }
      o2M.set(o2);
      // перемещение
      let cx = px, cy = py;
      if (move) {
        move.t += dt / move.dur; const k = easeInOut(Math.min(1, move.t));
        cx = lerp(move.fx, move.tx, k); cy = lerp(move.fy, move.ty, k); bob += dt * 9;
        if (move.t >= 1) { px = move.tx; py = move.ty; cx = px; cy = py; arrive(); move = null; if (!over) { cx = px; cy = py; } }
      }
      yaw += (yawTo - yaw) * Math.min(1, dt * 10);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) + Math.abs(dy) <= (torch ? 3 : 1)) seen.add(`${px + dx},${py + dy}`);
      const crouch = tyAt(Math.round(cx), Math.round(cy)) === 'tech' ? 0.95 : 1.6;
      if (v3) {
        v3.base.pos.set(cx * B, lerp(v3.base.pos.y, crouch, Math.min(1, dt * 6)) + (move ? Math.sin(bob) * 0.03 : 0), cy * B);
        v3.base.yaw = yaw;
        // фонарь слабее, когда стена вплотную — иначе пересвет
        let ahead = 0; for (let k = 1; k <= 3; k++) { if (M.open(px + D4[dir][0] * k, py + D4[dir][1] * k)) ahead++; else break; }
        torchPow += ((move ? 16 : 7 + ahead * 5) - torchPow) * Math.min(1, dt * 5);
        const gasNow = tyAt(px, py) === 'gas';
        v3.scene.fog.color.setHex(gasNow ? 0x0b1404 : 0x02070b); v3.scene.fog.density = torch ? 0.16 : 0.24;
      }
      // миникарта сканера
      if (scanT > 0 || C2) drawMap(scanT > 0);
      if (scanT > 0) { scanT -= dt; if (!C2) miniBox.hidden = scanT <= 0; }
    });
    function drawMap(scanOn) {
      const tgt = C2 || mini; if (!C2) miniBox.hidden = false;
      const { g, W, H } = tgt;
      g.clearRect(0, 0, W, H);
      if (C2) { g.fillStyle = '#020609'; g.fillRect(0, 0, W, H); }
      const cell = C2 ? Math.min(W / 9, H / 9) : Math.min(W, H) / 9;
      const ox = W / 2 - (px + 0.5) * cell, oy = H / 2 - (py + 0.5) * cell;
      const R = scanOn ? 4 : torch ? 2.6 : 1.2;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - px, y - py), vis = d <= R || (C2 && seen.has(`${x},${y}`));
        if (!vis) continue;
        const a = d <= R ? 1 - d / (R + 1.5) : 0.25;
        const X = ox + x * cell, Y = oy + y * cell;
        if (!M.open(x, y)) { g.fillStyle = `rgba(136,221,255,${0.45 * a})`; g.fillRect(X, Y, cell, cell); continue; }
        const ty = tyAt(x, y);
        g.fillStyle = ty === 'flood' ? `rgba(74,168,216,${0.5 * a})` : ty === 'gas' ? `rgba(200,255,90,${0.25 * a})` : ty === 'log' ? `rgba(255,0,51,${0.35 * a})` : ty === 'tech' ? `rgba(255,179,71,${0.2 * a})` : `rgba(40,78,98,${0.95 * a})`;
        g.fillRect(X + 1, Y + 1, cell - 2, cell - 2);
        const gt = gateAt(x, y); if (gt && gt.open < 0.5) { g.fillStyle = `rgba(220,245,255,${0.8 * a})`; g.fillRect(X + 2, Y + 2, cell - 4, cell - 4); }
        if (x === M.exit[0] && y === M.exit[1]) { Art.glowDot(g, X + cell / 2, Y + cell / 2, cell, 'rgba(136,221,255,.9)', a); }
        if (M.guards.some(q => q.x === x && q.y === y)) { g.fillStyle = '#ff0033'; g.fillRect(X + cell * 0.35, Y + cell * 0.3, cell * 0.3, cell * 0.4); }
      }
      // знаки у входа в зону (фолбэк: подписи)
      if (C2) {
        g.font = `${Math.max(9, cell * 0.2)}px ${MONO}`; g.textAlign = 'center';
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
          if (!M.open(x, y) || Math.hypot(x - px, y - py) > R + 0.5) continue;
          const ty = tyAt(x, y); if (!ty || ty === 'geo') continue;
          if (D4.some(([dx, dy]) => M.open(x + dx, y + dy) && tyAt(x + dx, y + dy) !== ty)) { g.fillStyle = ICE_TYPES[ty].c; g.fillText(ICE_TYPES[ty].n.split(' ')[0], ox + (x + 0.5) * cell, oy + y * cell + cell * 0.2); }
        }
        g.textAlign = 'left';
      }
      // игрок
      const cxp = ox + (px + 0.5) * cell, cyp = oy + (py + 0.5) * cell;
      g.fillStyle = '#ff0033'; g.beginPath();
      const fx = Math.cos(-Math.PI / 2 + dir * Math.PI / 2), fy = Math.sin(-Math.PI / 2 + dir * Math.PI / 2);
      g.moveTo(cxp + fx * cell * 0.35, cyp + fy * cell * 0.35); g.lineTo(cxp - fy * cell * 0.22 - fx * cell * 0.2, cyp + fx * cell * 0.22 - fy * cell * 0.2); g.lineTo(cxp + fy * cell * 0.22 - fx * cell * 0.2, cyp - fx * cell * 0.22 - fy * cell * 0.2); g.closePath(); g.fill();
      if (torch && C2) { const gr = g.createRadialGradient(cxp, cyp, 0, cxp, cyp, cell * 3); gr.addColorStop(0, 'rgba(230,244,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
      if (C2) Art.vignette(g, W, H, 0.7);
      else { g.strokeStyle = 'rgba(136,221,255,.5)'; g.strokeRect(0.5, 0.5, W - 1, H - 1); g.fillStyle = '#88ddff'; g.font = `10px ${MONO}`; g.fillText('ВЫБРО · 70%', 6, 14); }
      // пеленг на шлюз, если он за краем
      const ex = ox + (M.exit[0] + 0.5) * cell, ey = oy + (M.exit[1] + 0.5) * cell;
      if (ex < 0 || ey < 0 || ex > W || ey > H) {
        const an = Math.atan2(ey - cyp, ex - cxp), rr = Math.min(W, H) * 0.42;
        const bx = W / 2 + Math.cos(an) * rr, by = H / 2 + Math.sin(an) * rr;
        g.save(); g.translate(bx, by); g.rotate(an); g.fillStyle = '#88ddff'; g.beginPath(); g.moveTo(9, 0); g.lineTo(-6, -6); g.lineTo(-6, 6); g.closePath(); g.fill(); g.restore();
      }
    }
  });
}

// ============================================================ 36 · ТИХИЙ ПУТЬ
const TACTICS_Q = [
  { q: 'Развилка. Слева гудит буровая, справа капает вода.', o: ['Налево — там свои, шумно', 'Направо — тихо', 'Разделиться и проверить оба'], a: 1, why: 'Шумный путь и тихий — всегда тихий. Одиночка в штреке мёртв.' },
  { q: 'Разведчик поднял кулак. Впереди — шорох.', o: ['Огонь на звук', 'Замереть и слушать', 'Рвануть мимо, пока не заметили'], a: 1, why: 'Звук в штреках идёт на сотни метров. Слушайте.' },
  { q: 'Сканер на живность показывает красное. Цели не видно.', o: ['Уходить. Бегом', 'Подойти и проверить', 'Посветить горелкой'], a: 0, why: 'Если сканер показывает красное — уходите. Даже если не видите цель.' },
  { q: 'Рейдеры впереди. Вас не заметили. Их больше.', o: ['Ударить первыми, пока не ждут', 'Отойти и переждать', 'Сдаться'], a: 1, why: 'Первое правило — не искать боя.' },
  { q: 'Замыкающий отстал на повороте. Связь глохнет во льду.', o: ['Идти дальше — он догонит', 'Вернуться за ним', 'Ждать на месте час'], a: 1, why: 'Своих не бросаем. Одиночка в штреке — мёртв.' },
  { q: 'Технический штрек короче на двадцать минут. Вы втроём.', o: ['Лезть — втроём можно', 'Идти длинным основным', 'Послать одного разведать'], a: 1, why: 'Технические — только при крайней необходимости. И никогда в одиночку.' },
];
function gameTactics(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const wrap = ctx.el('div', 'g-center'); wrap.style.justifyContent = 'flex-end'; wrap.style.paddingBottom = '18px';
  const panel = ctx.el('div', 'g-panel ice', wrap);
  const cards = ctx.el('div', 'g-cards', wrap);
  const qs = shuffle(TACTICS_Q).slice(0, 4);
  let k = 0, right = 0, phase = 'q', burn = 0, burning = false, enemy = 0, over = false, t = 0, locked = false, squad = [1, 1, 1], flicker = 0;
  ctx.hint('ТАП ПО ВАРИАНТУ ИЛИ 1–3 · ПОТОМ ГОРЕЛКА — ЗАЖАТЬ И ДЕРЖАТЬ (ПРОБЕЛ)');
  return new Promise(resolve => {
    function show() {
      const q = qs[k]; locked = false;
      panel.innerHTML = `<div class="g-h">РАЗВИЛКА ${k + 1}/4</div><div class="g-text" style="color:#cfeaf8">${esc(q.q)}</div>`;
      cards.innerHTML = '';
      q.o.forEach((o, n) => { const b = ctx.el('button', 'g-card ice', cards, `<b style="font-size:.95rem">${n + 1} · ${esc(o)}</b>`); scope.on(b, 'click', () => answer(n)); });
    }
    function answer(n) {
      if (locked || phase !== 'q') return; locked = true;
      const q = qs[k], ok = n === q.a;
      $$('.g-card', cards).forEach((b, m) => { b.disabled = true; if (m === q.a) b.classList.add('right'); else if (m === n) b.classList.add('wrong'); });
      if (ok) { right++; A.sfx.chime(520, 0.04); } else { A.sfx.gunfire(3, 0.15); FX.hit('#ff0033'); }
      ctx.say(q.why, { pos: 'top', cls: ok ? 'ice' : 'red' });
      scope.timeout(() => { ctx.unsay('top'); k++; if (k === 3) toBurn(); else if (k >= qs.length) finish(); else show(); }, 2600);
    }
    function toBurn() {
      phase = 'burn'; squad = [1, 0, 1]; A.sfx.shot(0.4); FX.flash('#ff0033', 300, 0.5);
      panel.innerHTML = '<div class="g-h">ОГНЕВОЙ УБИТ</div><div class="g-text" style="color:#cfeaf8">Тело не унести. Если враг получит ДНК — снимет копию. Сожги — и иди дальше.</div>';
      cards.innerHTML = '';
      const b = ctx.el('button', 'g-key', cards, 'ГОРЕЛКА'); cards.style.display = 'flex'; cards.style.justifyContent = 'center';
      ctx.hold(b, () => { burning = true; b.classList.add('on'); }, () => { burning = false; b.classList.remove('on'); });
      A.sfx.steps(4, 3, 0.08);
    }
    function finish() {
      over = true; phase = 'end'; cards.innerHTML = '';
      const ok = right >= 3 && burn >= 1;
      panel.innerHTML = `<div class="g-h">ИТОГ</div><div class="g-text" style="color:#cfeaf8">${ok ? 'Своих не бросаем. Мёртвых не оставляем. Сожги — и иди дальше.' : 'Группа не вернулась. Где-то во льду ходит чужая копия огневого.'}</div>`;
      scope.timeout(() => resolve({ ok: ok ? 'ok' : 'fail', detail: `ПРАВИЛ ${right}/4 · ${burn >= 1 ? 'СОЖЖЁН' : 'НЕ СОЖЖЁН'}` }), 2600);
    }
    scope.on(document, 'keydown', e => { const n = parseInt(e.key, 10); if (phase === 'q' && n >= 1 && n <= 3) answer(n - 1); });
    show();
    const bg = cachedBg(C, (g, W, H) => {
      g.fillStyle = '#04080b'; g.fillRect(0, 0, W, H);
      const vx = W / 2, vy = H * 0.42;
      for (let i = 0; i < 12; i++) { const k = i / 12, s = 1 - k; g.strokeStyle = `rgba(136,221,255,${0.05 + s * 0.12})`; g.lineWidth = 1 + s * 3; g.beginPath(); g.ellipse(vx, vy + s * H * 0.05, W * 0.55 * s + 20, H * 0.5 * s + 12, 0, 0, Math.PI * 2); g.stroke(); }
      g.drawImage(Art.concrete(Math.round(W), Math.round(H * 0.3), { base: '#0e1a22', seed: 36, frost: 0.8, cracks: 3 }), 0, H * 0.7, W, H * 0.3);
    });
    scope.loop(dt => {
      t += dt;
      if (phase === 'burn' && !over) {
        enemy += dt / 16;
        if (burning) { burn += dt / 4.5; if (Math.random() < dt * 8) A.sfx.torch(0.2); flicker = 1; } else burn = Math.max(0, burn - dt * 0.05);
        if (burn >= 1) { A.sfx.whoosh(0.3); k = 3; phase = 'q2'; scope.timeout(() => { if (qs[3]) { phase = 'q'; show(); } else finish(); }, 1600); ctx.say('Сожжён. Копию не снимут.', { pos: 'top', cls: 'amb' }); scope.timeout(() => ctx.unsay('top'), 1500); cards.style.display = ''; }
        else if (enemy >= 1) { A.sfx.gunfire(5, 0.2); ctx.say('Рейдеры подошли раньше. Тело осталось им.', { pos: 'top', cls: 'red' }); phase = 'q2'; cards.style.display = ''; scope.timeout(() => { ctx.unsay('top'); if (qs[3]) { phase = 'q'; show(); } else finish(); }, 2000); }
      }
      ctx.stat(phase === 'burn' ? `СЖИГАНИЕ ${Math.round(burn * 100)}% · ШАГИ ВРАГА ${Math.round(enemy * 100)}%` : `РАЗВИЛКА ${Math.min(k + 1, 4)}/4 · ПО ПРАВИЛАМ ${right}`);
      flicker = Math.max(0, flicker - dt * 2);
      const { g, W, H } = C;
      g.drawImage(bg(), 0, 0, W, H);
      const names = ['РАЗВЕДЧИК', 'ОГНЕВОЙ', 'ЗАМЫКАЮЩИЙ'];
      names.forEach((n, i) => {
        const x = W * (0.36 + i * 0.14), s = H * (0.32 - i * 0.03), base = H * 0.72 - i * H * 0.02;
        if (squad[i]) { Art.armor(g, x, base - s, s, { t: t + i, glow: 0.8, seed: 36 + i }); }
        else { Art.lying(g, x, base - s * 0.1, s * 0.6, { body: '#0a0a0c', blood: 0.7, seed: 36 }); if (phase === 'burn' || burn >= 1) { const f = burn; for (let q = 0; q < 16 * f; q++) { g.fillStyle = `rgba(255,${120 + Math.random() * 120 | 0},40,${0.3 + Math.random() * 0.4})`; g.beginPath(); g.arc(x + rand(-s * 0.3, s * 0.3), base - s * 0.1 - rand(0, s * 0.5 * f), rand(3, 10), 0, Math.PI * 2); g.fill(); } Art.glowDot(g, x, base - s * 0.2, s * f, 'rgba(255,140,40,.6)', f); } }
        g.fillStyle = squad[i] ? '#8fc3dd' : '#ff3355'; g.font = `9px ${MONO}`; g.textAlign = 'center'; g.fillText(n, x, base + 14); g.textAlign = 'left';
      });
      if (flicker) { g.fillStyle = `rgba(255,120,40,${flicker * 0.08})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.6);
    });
  });
}

// ============================================================ 37 · БЕЗ РУК
function gameBlind(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const hpM = meterEl(ctx, 'ТЫ');
  const enM = meterEl(ctx, 'ШТУРМОВИК', '', { left: '14px', top: '48px' });
  const row = ctx.el('div', 'ctl');
  const bL = ctx.el('button', 'btn big-btn', row, '← УКЛОН'), bH = ctx.el('button', 'btn btn-primary big-btn', row, 'УДАР'), bR = ctx.el('button', 'btn big-btn', row, 'УКЛОН →');
  let hp = 3, en = 7, t = 0, over = false, pos = 0, posV = 0, state = 'idle', stT = 1.4, side = 0, rage = 0, dodged = 0, hitAnim = 0, dmgAnim = 0;
  ctx.hint('ВИЗОР ВСПЫХНУЛ — УХОДИ В ДРУГУЮ СТОРОНУ (← →) · ПОСЛЕ ПРОМАХА ОН РАСКРЫТ — БЕЙ (ПРОБЕЛ / ТАП)');
  ctx.say('Плазма сожгла кисти. Из обрубков — белые кости. Этого хватит.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2600);
  return new Promise(resolve => {
    const dodge = d => { if (over) return; pos = d; posV = 0.6; if (state === 'wind') dodged = d; A.sfx.whoosh(0.08); };
    const strike = () => {
      if (over || hitAnim > 0) return;
      hitAnim = 0.25;
      if (state === 'open') { en--; rage = Math.min(1, rage + 0.25); A.sfx.crack(); A.sfx.thud(0.4); FX.hit('#ff0033'); FX.shake('sm'); state = 'recover'; stT = 0.6; if (en <= 0) win(); }
      else { A.sfx.scrape(0.15); if (state === 'idle' && Math.random() < 0.4) { state = 'wind'; stT = 0.5; dodged = 0; side = Math.random() < 0.5 ? -1 : 1; A.sfx.beep(1800, 0.06, 0.05); } }
    };
    scope.on(bL, 'click', () => dodge(-1)); scope.on(bR, 'click', () => dodge(1)); scope.on(bH, 'click', strike);
    scope.on(document, 'keydown', e => { if (e.repeat) return; if (e.code === 'ArrowLeft' || e.code === 'KeyA') dodge(-1); if (e.code === 'ArrowRight' || e.code === 'KeyD') dodge(1); if (e.code === 'Space') { e.preventDefault(); strike(); } });
    let sw = null;
    scope.on(C.cv, 'pointerdown', e => { sw = { x: e.clientX, y: e.clientY }; });
    scope.on(C.cv, 'pointerup', e => { if (!sw) return; const dx = e.clientX - sw.x; sw = null; if (Math.abs(dx) > 40) dodge(dx < 0 ? -1 : 1); else strike(); });
    function win() { over = true; row.remove(); ctx.say('Штурмовик падает. Тишина. Потом — очередь в спину. Точка.', { pos: 'mid', cls: 'red' }); A.sfx.gunfire(6, 0.2); FX.flash('#ffffff', 600, 0.6); scope.timeout(() => resolve({ ok: 'ok', detail: `ПРОПУЩЕНО ${3 - hp}` }), 3200); }
    function lose() { over = true; row.remove(); ctx.say('Мясо, которое можно перемолоть.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `ШТУРМОВИК ${7 - en}/7` }), 2800); }
    scope.loop(dt => {
      t += dt;
      posV -= dt; if (posV <= 0 && !K.ArrowLeft && !K.ArrowRight && !K.KeyA && !K.KeyD) pos = 0;
      hitAnim = Math.max(0, hitAnim - dt); dmgAnim = Math.max(0, dmgAnim - dt);
      if (!over) {
        stT -= dt;
        if (stT <= 0) {
          if (state === 'idle' || state === 'recover') { state = 'wind'; dodged = 0; side = Math.random() < 0.5 ? -1 : 1; stT = Math.max(0.45, 0.9 - (7 - en) * 0.05); A.sfx.beep(1600, 0.08, 0.05); }
          else if (state === 'wind') {
            // удар приходится на сторону side: безопасно, если ты ушёл в противоположную
            if (dodged === -side) { state = 'open'; stT = 0.85; A.sfx.whoosh(0.2); }
            else { hp--; dmgAnim = 0.5; A.sfx.thud(0.6); FX.hit('#ff0033', true); FX.shake('lg'); state = 'recover'; stT = 1; if (hp <= 0) lose(); }
          } else if (state === 'open') { state = 'recover'; stT = rand(0.6, 1.2); }
        }
        ctx.stat(`УДАРОВ ${7 - en}/7 · ЯРОСТЬ ${Math.round(rage * 100)}% · ${state === 'open' ? 'ОН РАСКРЫТ!' : state === 'wind' ? 'ВИЗОР!' : ''}`);
      }
      hpM.set(hp / 3); enM.set(en / 7);
      const { g, W, H } = C;
      g.fillStyle = '#060304'; g.fillRect(0, 0, W, H);
      const gr = g.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.7); gr.addColorStop(0, '#1d0a0e'); gr.addColorStop(1, '#030102'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const ex = W / 2 - pos * W * 0.18 + (state === 'wind' ? side * W * 0.03 : 0), sc = H * 0.95;
      g.save();
      if (state === 'open') { g.translate(ex, H); g.rotate(side * 0.08); g.translate(-ex, -H); }
      Art.armor(g, ex, H * 0.08, sc, { t, glow: state === 'wind' ? 1.6 : 0.8, seed: 37, claws: true, visor: state === 'wind' ? '#ffffff' : '#ff0033' });
      g.restore();
      if (state === 'wind') { Art.glowDot(g, ex, H * 0.14, W * 0.3, 'rgba(255,255,255,.7)', 0.8); g.fillStyle = 'rgba(255,0,51,.35)'; const sx = side < 0 ? 0 : W * 0.6; g.fillRect(sx, 0, W * 0.4, H); g.fillStyle = '#fff'; g.font = `700 ${Math.round(W * 0.05)}px ${DISP}`; g.textAlign = 'center'; g.fillText(side < 0 ? '◀ УДАР СЛЕВА' : 'УДАР СПРАВА ▶', side < 0 ? W * 0.2 : W * 0.8, H * 0.5); g.textAlign = 'left'; }
      if (state === 'open') { g.strokeStyle = '#00ff88'; g.lineWidth = 3; g.beginPath(); g.arc(ex, H * 0.45, 30 + Math.sin(t * 20) * 4, 0, Math.PI * 2); g.stroke(); }
      // костяные стилеты
      [-1, 1].forEach(d => {
        const bx = W / 2 + d * W * 0.22 + pos * W * 0.05, by = H + (hitAnim > 0 ? -H * 0.15 : 0);
        g.fillStyle = '#4a0a10'; g.beginPath(); g.ellipse(bx, by, W * 0.07, H * 0.14, d * 0.3, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#e8e2d6'; g.beginPath(); g.moveTo(bx - 6, by - H * 0.1); g.lineTo(bx + d * 10, by - H * 0.32); g.lineTo(bx + 6, by - H * 0.1); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(bx + 10, by - H * 0.08); g.lineTo(bx + d * 24, by - H * 0.24); g.lineTo(bx + 18, by - H * 0.08); g.closePath(); g.fill();
      });
      if (dmgAnim > 0) { g.fillStyle = `rgba(160,0,20,${dmgAnim})`; g.fillRect(0, 0, W, H); }
      if (rage > 0) { g.fillStyle = `rgba(255,0,40,${rage * 0.08})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.7);
    });
  });
}

// ============================================================ 38 · СОРОК ЕДИНИЦ
function gameGrin(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const tM = meterEl(ctx, 'ТЕМПЕРАТУРА ТЕЛА', 'amb');
  const sM = meterEl(ctx, 'ВНИМАНИЕ САНИТАРОВ', '', { left: '14px', top: '48px' });
  const key = ctx.el('button', 'g-key', ctx.el('div', 'ctl'), 'ШЕВЕЛИТЬСЯ');
  key.parentElement.style.bottom = '14px'; key.style.width = key.style.height = 'min(150px, 36vw)';
  const DUR = 50;
  let temp = 33.4, stir = false, sus = 0, t = 0, over = false, beamA = 0, beamV = 0.55, bags = 0, lampA = 0, grinT = 0;
  ctx.hold(key, () => { stir = true; key.classList.add('on'); }, () => { stir = false; key.classList.remove('on'); });
  ctx.hint('ЗАЖМИ «ШЕВЕЛИТЬСЯ» / ПРОБЕЛ — ГРЕЕШЬСЯ, НО ШУМ · ЗЕЛЁНЫЙ ЛУЧ МОНИТОРА НА ТЕБЕ — ОТПУСТИ · НЕ НИЖЕ 28°');
  ctx.say('Пол ангара. Сорок тел. Санитары пакуют их в мешки по одному.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2800);
  return new Promise(resolve => {
    scope.loop(dt => {
      t += dt; lampA += dt * 2.2;
      beamA += beamV * dt; if (beamA > 1.1 || beamA < -1.1) beamV *= -1;
      const inBeam = Math.abs(beamA - 0.05) < 0.22;
      if (!over) {
        temp += (stir ? 0.55 : -0.2) * dt;
        temp = Math.min(36.6, temp);
        if (stir && inBeam) { sus += dt * 0.9; if (Math.random() < dt * 4) A.sfx.beep(2000, 0.03, 0.04); }
        else sus = Math.max(0, sus - dt * 0.12);
        if (stir && Math.random() < dt * 2) A.sfx.scrape(0.05);
        if (Math.random() < dt * 0.5) { bags++; A.sfx.tear(); }
        grinT = stir ? grinT + dt : Math.max(0, grinT - dt);
        if (temp <= 28) { over = true; key.parentElement.remove(); A.sfx.flat(1.8); ctx.say('Двадцать восемь. Биомонитор пискнул: «Единица сорок — мёртв». Мешок застегнули.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: 'УПАКОВАН' }), 3200); }
        else if (sus >= 1) { over = true; key.parentElement.remove(); A.sfx.alarm(0.07); ctx.say('— Этот шевелится. — Добей. Потом упакуем.', { pos: 'mid', cls: 'red' }); A.sfx.shot(0.4); FX.flash('#ffffff', 300, 0.6); scope.timeout(() => resolve({ ok: 'fail', detail: `ТЕМПЕРАТУРА ${temp.toFixed(1)}°` }), 3200); }
        else if (t >= DUR) { over = true; key.parentElement.remove(); A.sfx.chime(400, 0.05); ctx.say(`Тридцать один и два. Он и был мёртвый. Но кто-то забыл ему об этом сказать.`, { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `ТЕМПЕРАТУРА ${temp.toFixed(1)}°` }), 3400); }
        ctx.stat(`${temp.toFixed(1)}° · ОСТАЛОСЬ ${Math.max(0, Math.ceil(DUR - t))} С · В МЕШКАХ ${bags}`);
      }
      tM.set((temp - 26) / 10.6); sM.set(sus);
      const { g, W, H } = C;
      g.fillStyle = '#0a0808'; g.fillRect(0, 0, W, H);
      Art.grate(g, 0, 0, W, H, 34, 'rgba(90,80,80,.12)');
      // тела рядами
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
        const x = W * (0.1 + c * 0.16), y = H * (0.2 + r * 0.19), me = r === 2 && c === 3;
        if (!me && ((r * 6 + c) < bags % 24)) { g.fillStyle = '#16181c'; g.beginPath(); g.ellipse(x, y, W * 0.07, H * 0.035, 0, 0, Math.PI * 2); g.fill(); continue; }
        Art.lying(g, x, y, Math.min(W * 0.12, H * 0.16), { body: me ? '#241a18' : '#0e0b0b', blood: me ? 0 : 0.4, seed: r * 6 + c, dir: c % 2 ? 1 : -1 });
        if (me) { if (stir) { g.strokeStyle = 'rgba(255,179,71,.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, W * 0.08 + Math.sin(t * 30) * 2, H * 0.05, 0, 0, Math.PI * 2); g.stroke(); } if (grinT > 0.5) { g.strokeStyle = '#e8e2d6'; g.lineWidth = 1.5; g.beginPath(); g.arc(x + W * 0.07, y + 2, 5, 0.2, Math.PI - 0.2); g.stroke(); } }
      }
      // санитар с биомонитором и луч
      const ox = W * 0.58, oy = H * 0.02;
      Art.figure(g, ox, H * 0.1, H * 0.18, { body: '#1c1f22' });
      const ang = Math.PI / 2 + beamA * 0.55;
      g.fillStyle = inBeam && stir ? 'rgba(255,0,51,.18)' : 'rgba(0,255,136,.1)';
      g.beginPath(); g.moveTo(ox, oy + H * 0.08); g.lineTo(ox + Math.cos(ang - 0.12) * H * 1.2, oy + Math.sin(ang - 0.12) * H * 1.2); g.lineTo(ox + Math.cos(ang + 0.12) * H * 1.2, oy + Math.sin(ang + 0.12) * H * 1.2); g.closePath(); g.fill();
      // аварийная лампа
      const la = (Math.sin(lampA) + 1) / 2; g.fillStyle = `rgba(255,0,40,${0.05 + la * 0.1})`; g.fillRect(0, 0, W, H);
      if (temp < 30) { g.fillStyle = `rgba(160,210,240,${(30 - temp) / 6})`; g.fillRect(0, 0, W, H); }
      Art.vignette(g, W, H, 0.7);
    });
  });
}

// ============================================================ 39 · СОЛЬ
function gameSalt(ctx) {
  const { scope } = ctx;
  const C = ctx.canvas();
  const K = keyState(scope);
  const bM = meterEl(ctx, 'ГОРЕЧЬ', '');
  const SIGNS = [
    { n: 'ПОТ НА ГУБАХ', x: 0.01, y: 0.855, t: 'Солёный. Живой.' },
    { n: 'СТУК СЕРДЦА', x: 0.05, y: 0.66, t: 'Тук. Тук. Медленно, но стучит.' },
    { n: 'ТЕПЛО ШЕИ', x: -0.035, y: 0.8, t: 'Под пальцами — горячая жилка.' },
    { n: 'ДЫХАНИЕ', x: 0, y: 0.915, t: 'Ноздри втягивают сухой воздух.' },
    { n: 'ПУЛЬС НА ЗАПЯСТЬЕ', x: -0.15, y: 0.45, t: 'Шрам на запястье. Под ним — удары.' },
  ];
  // координаты признаков — в долях роста фигуры от её основания
  const fig = (W, H) => { const h = Math.min(W * 0.9, H * 0.95) * 0.95; return { h, base: H * 0.98 }; };
  const spot = (s, W, H) => { const { h, base } = fig(W, H); return [W / 2 + s.x * h, base - s.y * h]; };
  let cx = 0.5, cy = 0.6, ptr = false, found = 0, hold = 0, bitter = 0.1, t = 0, over = false, jitX = 0, jitY = 0, beatT = 0;
  const done = new Set();
  ctx.hint('ВОДИ ПО ТЕЛУ — ИЩИ ТЕПЛО · ЗАЖМИ НА НАЙДЕННОМ · СТРЕЛКИ + ПРОБЕЛ ТОЖЕ · ПЯТЬ ПРИЗНАКОВ');
  ctx.say('Сухая камера. Горечь таблеток на нёбе. Где-то под ней — я.', { pos: 'top' });
  scope.timeout(() => ctx.unsay('top'), 2800);
  const posOf = e => { const r = C.cv.getBoundingClientRect(); cx = (e.clientX - r.left) / r.width; cy = (e.clientY - r.top) / r.height; };
  scope.on(C.cv, 'pointerdown', e => { ptr = true; posOf(e); try { C.cv.setPointerCapture(e.pointerId); } catch { /* */ } });
  scope.on(C.cv, 'pointermove', e => { if (e.pointerType === 'mouse' || ptr) posOf(e); });
  scope.on(C.cv, 'pointerup', () => { ptr = false; });
  // карта тела рисуется один раз
  const bodyC = cachedBg(C, (g, W, H) => {
    const { h, base } = fig(W, H);
    Art.figure(g, W / 2, base, h, { body: '#2a1c1e' });
    const [wx, wy] = spot(SIGNS[4], W, H);
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(wx - 8, wy - 10); g.lineTo(wx + 6, wy + 12); g.stroke();
  });
  return new Promise(resolve => {
    scope.loop(dt => {
      t += dt;
      const sp = dt * 0.28; if (K.ArrowLeft) cx -= sp; if (K.ArrowRight) cx += sp; if (K.ArrowUp) cy -= sp; if (K.ArrowDown) cy += sp;
      jitX += (rand(-1, 1) * bitter * 0.02 - jitX) * dt * 3; jitY += (rand(-1, 1) * bitter * 0.02 - jitY) * dt * 3;
      const X = clamp(cx + jitX, 0, 1), Y = clamp(cy + jitY, 0, 1);
      const { g, W, H } = C;
      // ближайший ненайденный признак
      let best = null, bd = 9;
      SIGNS.forEach((s, k) => { if (done.has(k)) return; const [sx, sy] = spot(s, W, H); const d = Math.hypot(X * W - sx, Y * H - sy) / Math.min(W, H); if (d < bd) { bd = d; best = k; } });
      const warm = clamp(1 - bd / 0.35, 0, 1);
      if (!over) {
        bitter += dt / 85;
        beatT -= dt; if (beatT <= 0) { beatT = 1.2 - warm * 0.6; A.sfx.heartbeat(0.05 + warm * 0.3); }
        const pressing = ptr || K.Space;
        if (pressing && bd < 0.045) { hold += dt; if (hold >= 1.1) { done.add(best); found++; hold = 0; bitter = Math.max(0, bitter - 0.12); A.sfx.chime(380 + found * 70, 0.05); ctx.say(`${SIGNS[best].n}. ${SIGNS[best].t}`, { pos: 'top', cls: 'amb' }); scope.timeout(() => ctx.unsay('top'), 1800); if (found >= SIGNS.length) { over = true; scope.timeout(() => { ctx.say('Пока я чувствую соль — я есть. Не номер. Не актив.', { pos: 'mid' }); scope.timeout(() => resolve({ ok: 'ok', detail: `ГОРЕЧЬ ${Math.round(bitter * 100)}%` }), 3000); }, 1400); } } }
        else hold = Math.max(0, hold - dt * 2);
        if (bitter >= 1) { over = true; A.sfx.flat(1.5); ctx.say('Горечь заглушила всё. Ни соли, ни стука. Никого.', { pos: 'mid', cls: 'red' }); scope.timeout(() => resolve({ ok: 'fail', detail: `ПРИЗНАКОВ ${found}/5` }), 3000); }
        ctx.stat(`ПРИЗНАКОВ ЖИЗНИ ${found}/5`);
      }
      bM.set(bitter);
      g.fillStyle = '#030202'; g.fillRect(0, 0, W, H);
      // тело видно только под ладонью
      g.save();
      const R = Math.min(W, H) * 0.2;
      g.beginPath(); g.arc(X * W, Y * H, R, 0, Math.PI * 2); g.clip();
      g.drawImage(bodyC(), 0, 0, W, H);
      const wr = g.createRadialGradient(X * W, Y * H, 0, X * W, Y * H, R);
      wr.addColorStop(0, `rgba(255,${140 - warm * 60 | 0},60,${0.1 + warm * 0.45})`); wr.addColorStop(1, 'rgba(0,0,0,.85)');
      g.fillStyle = wr; g.fillRect(0, 0, W, H);
      g.restore();
      // найденные — тёплые точки
      done.forEach(k => { const [sx, sy] = spot(SIGNS[k], W, H); Art.glowDot(g, sx, sy, 26, 'rgba(255,160,80,.9)', 0.8); });
      // ладонь
      g.strokeStyle = `rgba(255,${200 - warm * 120 | 0},${160 - warm * 120 | 0},.7)`; g.lineWidth = 2; g.beginPath(); g.arc(X * W, Y * H, 14, 0, Math.PI * 2); g.stroke();
      if (hold > 0) { g.strokeStyle = '#ffb347'; g.lineWidth = 4; g.beginPath(); g.arc(X * W, Y * H, 20, -Math.PI / 2, -Math.PI / 2 + hold / 1.1 * Math.PI * 2); g.stroke(); }
      // горечь: серая пелена и зерно
      g.fillStyle = `rgba(90,96,90,${bitter * 0.35})`; g.fillRect(0, 0, W, H);
      for (let i = 0; i < bitter * 60; i++) { g.fillStyle = 'rgba(200,200,190,.08)'; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
      Art.vignette(g, W, H, 0.8);
    });
  });
}
