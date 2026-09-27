/* ==========================================================================
   Глава 46 · «Регламент» — НАЙТИ ПОДМЕНУ
   Внутренний документ № К-00/Р. Пункты берутся прямо из текста главы.
   Кто-то — Робин? Арина? — вписал в регламент три чужих пункта.
   Найди их, пока документ не ушёл на уничтожение «в присутствии свидетеля».
   ========================================================================== */
defineFrag(45, {
  id: 'rules', name: 'Три чужих пункта',
  text: '3.16. Актив обязан при обнаружении признаков самосознания или рефлексии (вопросы «за что?», «почему я?», «кто я?») немедленно сообщить персоналу.',
  how: 'Перед тобой пункты регламента — настоящие, из этой главы. Три из них подменены: кто-то вписал туда то, чего в регламенте быть не может. Тапни по подменённому пункту. Ложное обвинение — штраф. Лимит времени — пока свидетель не пришёл.',
  keys: 'ТАП / КЛИК ПО ПУНКТУ · TAB + ENTER — С КЛАВИАТУРЫ',
  note: 'Регламент № К-00/Р. Тридцать пять пунктов о том, на что я не имею права. Кто-то вписал туда три строчки о том, на что имею. Их нашли и вычеркнули. Я успел прочитать.',
  mem: 'ТРИ СТРОЧКИ', start: gameRules,
});

function gameRules(ctx) {
  const { scope } = ctx;
  const FAKES = [
    '3.12. Актив имеет право на имя. Персонал, называющий актива по имени, поощряется.',
    '3.27. Актив имеет право на улыбку в присутствии персонала.',
    '3.34. Актив имеет право на отказ от регенерации и на вечный покой.',
    '3.17. Актив имеет право хранить личные вещи: камушек, фотографию, шоколадку.',
    '3.26. Актив имеет право на слёзы. Персонал обязан отвернуться.',
    '3.24. Актив имеет право помнить прошлые циклы.',
    '4.3. Персонал, испытывающий сострадание к активу, освобождается от взыскания.',
  ];
  const src = (BOOK[45] && BOOK[45].p) || [];
  const real = src.filter(l => /^\d+\.\d+\.\s/.test(l) && l.length > 40 && l.length < 260);
  const pickN = Math.min(11, real.length);
  const chosen = shuffle(real).slice(0, pickN);
  // номера подмен берём у настоящих пунктов, не попавших в выборку, — чтобы номера не повторялись
  const spare = shuffle(real.filter(l => !chosen.includes(l)).map(l => l.match(/^\d+\.\d+\./)[0]).filter(n => /^3\./.test(n)));
  const fakes = shuffle(FAKES).slice(0, 3).map((f, k) => ({ t: spare[k] ? f.replace(/^\d+\.\d+\./, spare[k]) : f, fake: true }));
  const num = s => { const m = s.match(/^(\d+)\.(\d+)/); return m ? +m[1] * 100 + +m[2] : 0; };
  const list = [...chosen.map(t => ({ t, fake: false })), ...fakes].sort((a, b) => num(a.t) - num(b.t) || (a.fake ? 1 : -1));
  const doc = ctx.el('div', 'rg-doc');
  ctx.el('p', 'rg-head', doc, 'ВНУТРЕННИЙ ДОКУМЕНТ № К-00/Р · «СОВЕРШЕННО СЕКРЕТНО»');
  let found = 0, wrong = 0, over = false, t = 0;
  const LIMIT = 100;
  const upd = () => ctx.stat(`НАЙДЕНО ${found}/3 · ЛОЖНЫХ ${wrong}/3 · СВИДЕТЕЛЬ ЧЕРЕЗ ${Math.max(0, Math.ceil(LIMIT - t))} С`);
  upd();
  ctx.hint('ТРИ ПУНКТА НЕ ИЗ ЭТОГО РЕГЛАМЕНТА');
  const hum = scope.own(A.loopOsc({ type: 'sine', freq: 50, vol: 0 }));
  hum.vol(0.02, 1);

  return new Promise(resolve => {
    list.forEach(it => {
      const b = ctx.el('button', 'rg-item', doc, esc(it.t));
      b.addEventListener('click', () => {
        if (over || b.disabled) return;
        b.disabled = true;
        if (it.fake) { found++; b.classList.add('fake'); A.sfx.tear(); ctx.say('Чужой пункт. Вычеркнуть.', { pos: 'top', cls: 'amb' }); scope.timeout(() => ctx.unsay('top'), 1100); }
        else { wrong++; b.classList.add('real'); A.sfx.buzz(); FX.shake('sm'); ctx.say('Этот пункт — настоящий.', { pos: 'top', cls: 'red' }); scope.timeout(() => ctx.unsay('top'), 1100); }
        upd();
        if (found >= 3) end(true);
        else if (wrong >= 3) end(false, 'Ложные обвинения. Аттестация на профпригодность.');
      });
    });
    ctx.el('p', 'rg-foot', doc, 'Подпись: (неразборчиво) · Печать: перекрещенные мечи над планетой-крепостью');
    async function end(ok, why) {
      over = true; hum.vol(0, 0.5);
      $$('.rg-item', doc).forEach(b => { b.disabled = true; if (list[$$('.rg-item', doc).indexOf(b)].fake) b.classList.add('fake'); });
      if (ok) {
        await ctx.line('Три строчки вычеркнули. Но он успел их прочитать.', { pos: 'top', cls: 'amb', ms: 2600 });
        resolve({ ok: 'ok', detail: `ЛОЖНЫХ ОБВИНЕНИЙ ${wrong}` });
      } else {
        await ctx.line(why, { pos: 'top', cls: 'red', ms: 2600 });
        resolve({ ok: 'fail', detail: `НАЙДЕНО ${found}/3` });
      }
    }
    scope.loop(dt => {
      t += dt;
      if (!over) { if (Math.floor(t) !== Math.floor(t - dt)) upd(); if (t >= LIMIT) end(false, 'Уничтожение документа производится в присутствии свидетеля.'); }
    });
  });
}
