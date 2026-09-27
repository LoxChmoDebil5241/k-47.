/* ==========================================================================
   Глава 23 · «Пыль» — ЗАПОМНИТЬ ПРЕПАРАТЫ
   Бывший склад, лавки с занозами, клоны сидят на полу. Лектор показывает
   препараты на голограмме. Потом — практика: ситуация в штреке, и нужно
   узнать средство по виду. К-14 запомнил каждый цвет эпипена.
   ========================================================================== */
defineFrag(22, {
  id: 'dust', name: 'Препараты',
  text: '— Гиперзин поставляется именно в таких эпипенах, стим-пак красного цвета. Запомните цвет — не перепутайте с другими. К-14 пошёл первым. Он знал, что запомнит всё. Каждое слово. Каждый жест. Каждый цвет эпипена. Каждый запрет.',
  how: 'Слушай лектора: семь средств, у каждого свой вид, путь введения и время. Потом — практика: ситуация в штреке и три средства на выбор, узнавай по виду. Нужно пять верных из семи.',
  keys: 'СЛАЙДЫ — ТАП / ПРОБЕЛ · ОТВЕТ — КНОПКИ ИЛИ 1 / 2 / 3',
  note: 'Красный эпипен с жёлтой этикеткой. Синий баллончик с зелёной «N». Белый порошок — полграмма, не больше. Ловлю себя на том, что заучиваю цвета. Зачем?',
  mem: 'КРАСНЫЙ ЭПИПЕН', start: gameDust,
});

/** препарат на голограмме: ephedrine | desoxy | hyperzine | aranesp | impedrizine | fentanyl | nocturin */
function drawDrug(g, key, x, y, s, t = 0, mono = false) {
  const u = s / 100, c = (hex, rgb) => (mono ? `rgba(255,60,90,${rgb})` : hex);
  g.save(); g.translate(x, y);
  g.lineWidth = Math.max(1, 1.5 * u); g.strokeStyle = mono ? 'rgba(255,60,90,.9)' : 'rgba(255,255,255,.35)';
  switch (key) {
    case 'ephedrine': {
      g.fillStyle = c('#f2f2f0', 0.7); g.beginPath(); g.moveTo(-34 * u, 20 * u); g.quadraticCurveTo(0, -24 * u, 34 * u, 20 * u); g.closePath(); g.fill();
      for (let i = 0; i < 30; i++) { g.fillStyle = c('#ffffff', 0.5); g.fillRect((Math.sin(i * 7.3) * 30) * u, (14 - Math.abs(Math.cos(i * 3.1)) * 20) * u, 2 * u, 2 * u); }
      g.fillStyle = c('#b8b8b4', 0.4); g.fillRect(-40 * u, 20 * u, 80 * u, 4 * u);
      break;
    }
    case 'desoxy': {
      g.strokeStyle = c('#d9e4ea', 0.9); g.lineWidth = 2 * u; g.beginPath(); g.moveTo(-40 * u, 0); g.quadraticCurveTo(-10 * u, -30 * u, 20 * u, -6 * u); g.stroke();
      g.fillStyle = c('rgba(200,230,255,.35)', 0.35); Art.rr(g, 18 * u, -14 * u, 30 * u, 16 * u, 4 * u); g.fill(); g.stroke();
      g.fillStyle = c('rgba(210,240,255,.6)', 0.5); g.fillRect(22 * u, -10 * u, 18 * u, 8 * u);
      break;
    }
    case 'hyperzine': {
      g.fillStyle = c('#c8101e', 0.9); Art.rr(g, -40 * u, -11 * u, 80 * u, 22 * u, 10 * u); g.fill();
      g.fillStyle = c('#f5c518', 0.55); g.fillRect(-14 * u, -11 * u, 26 * u, 22 * u);
      g.fillStyle = c('#2a2a2a', 0.3); g.fillRect(40 * u, -4 * u, 10 * u, 8 * u);
      g.fillStyle = mono ? 'rgba(255,60,90,1)' : '#fff'; g.font = `${Math.round(8 * u)}px ${MONO}`; g.textAlign = 'center'; g.fillText('STIM', 0, 3 * u);
      break;
    }
    case 'aranesp': {
      g.fillStyle = c('#2a1a10', 0.6); Art.rr(g, -26 * u, -34 * u, 52 * u, 64 * u, 6 * u); g.fill(); g.stroke();
      g.fillStyle = c('#16110c', 0.4); g.fillRect(-10 * u, -42 * u, 20 * u, 9 * u);
      g.fillStyle = c('rgba(90,50,20,.8)', 0.5); g.fillRect(-26 * u, -4 * u + Math.sin(t * 2) * 2 * u, 52 * u, 34 * u);
      break;
    }
    case 'impedrizine': {
      g.fillStyle = c('rgba(220,240,255,.35)', 0.35); Art.rr(g, -22 * u, -34 * u, 44 * u, 50 * u, 8 * u); g.fill(); g.stroke();
      g.fillStyle = c('rgba(140,200,255,.55)', 0.55); g.fillRect(-18 * u, -8 * u, 36 * u, 22 * u);
      g.strokeStyle = c('#c9d8e0', 0.8); g.beginPath(); g.moveTo(0, 16 * u); g.quadraticCurveTo(10 * u, 36 * u, -6 * u, 44 * u); g.stroke();
      break;
    }
    case 'fentanyl': {
      g.fillStyle = c('rgba(230,230,230,.35)', 0.35); g.beginPath(); g.moveTo(-26 * u, -20 * u); g.lineTo(26 * u, -20 * u); g.lineTo(22 * u, 24 * u); g.lineTo(-22 * u, 24 * u); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = c('#ffffff', 0.7); g.fillRect(-18 * u, 6 * u, 36 * u, 14 * u);
      g.strokeStyle = mono ? 'rgba(255,60,90,1)' : '#ff0033'; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(-30 * u, -26 * u); g.lineTo(30 * u, 30 * u); g.moveTo(30 * u, -26 * u); g.lineTo(-30 * u, 30 * u); g.stroke();
      break;
    }
    case 'nocturin': {
      g.fillStyle = c('#2c4a78', 0.7); Art.rr(g, -16 * u, -34 * u, 32 * u, 62 * u, 8 * u); g.fill();
      g.fillStyle = c('#1c2f50', 0.4); g.fillRect(-8 * u, -44 * u, 16 * u, 10 * u);
      g.fillStyle = mono ? 'rgba(255,60,90,1)' : '#22dd66'; g.font = `bold ${Math.round(22 * u)}px ${MONO}`; g.textAlign = 'center'; g.fillText('N', 0, 4 * u);
      break;
    }
  }
  g.restore();
}
const DRUGS = {
  ephedrine: 'Эфедрин', desoxy: 'Дизоксиэфедрин', hyperzine: 'Гиперзин', aranesp: 'Аранепс', impedrizine: 'Импедризин', fentanyl: 'Фентанил', nocturin: 'Ноктюрин',
};

function gameDust(ctx) {
  const { scope } = ctx;
  const vent = scope.own(A.loopNoise({ type: 'lowpass', freq: 380, q: 0.5, vol: 0 }));
  vent.vol(0.03, 1);
  const SLIDES = [
    { t: 'ЭФЕДРИН', lines: ['Порошок. Белый, мелкокристаллический. Внутрь или под язык.', 'Действует через пятнадцать секунд, держит два-три часа.', 'Обычная доза — полграмма. Больше — не пробуйте.'], k: 'ephedrine' },
    { t: 'ДИЗОКСИЭФЕДРИН', lines: ['Изогнутая игла с прозрачным тюбиком. В бедро или плечо.', 'Через три секунды — почти мгновенно. Держит час-полтора.', 'Одна ампула. Две — сердце встанет через семь минут.'], k: 'desoxy' },
    { t: 'ГИПЕРЗИН', lines: ['Красный эпипен с жёлтой этикеткой. В вену, под давлением.', 'Пять-десять минут — финальный рывок. Добежать до эвакуатора.', 'После — пустой мешок: вырубит на несколько часов.'], k: 'hyperzine' },
    { t: 'АРАНЕПС', lines: ['Канистра тёмной жидкости. Пьётся как сок.', 'Не даёт уснуть, не даёт остановиться.', 'Два глотка в сутки. Привыкание — с первого приёма.'], k: 'aranesp' },
    { t: 'ИМПЕДРИЗИН', lines: ['Стабилизатор для тяжелораненых. Внутривенно.', 'Отключает сознание, дыхание — за аппаратом.', 'Сорок минут без реанимации — смерть. Не для боя.'], k: 'impedrizine' },
    { t: 'ФЕНТАНИЛ — ЗАПРЕЩЁН', lines: ['Пакет белого порошка. В сто раз сильнее морфина.', 'Два грамма — остановка дыхания.', 'Нашли — сдайте старшему. Иначе трибунал, без регенерации.'], k: 'fentanyl' },
    { t: 'НОКТЮРИН', lines: ['Матово-синий баллончик с зелёной «N». Ингалятор.', 'Три-пять секунд — и глубокий сон на несколько часов.', 'Только медикам. На себя — строжайше запрещено.'], k: 'nocturin' },
  ].map(s => ({ ...s, draw: (g, W, H, t) => drawDrug(g, s.k, W / 2, H / 2, Math.min(W, H) * 0.95, t, true) }));
  const LOOK = {
    ephedrine: 'белый порошок · под язык', desoxy: 'изогнутая игла с прозрачным тюбиком', hyperzine: 'красный эпипен с жёлтой этикеткой', aranesp: 'канистра тёмной жидкости',
    impedrizine: 'капельница · внутривенно', fentanyl: 'пакет белого порошка → сдать старшему', nocturin: 'синий баллончик с зелёной «N»',
  };
  const CASES = shuffle([
    ['До эвакуатора двести метров. Сил — ноль. Нужен последний рывок.', 'hyperzine'],
    ['Товарищ ранен несовместимо с жизнью. До хирурга полчаса.', 'impedrizine'],
    ['Медик просит усыпить раненого перед транспортировкой — он мешает.', 'nocturin'],
    ['У убитого рейдера — пакет белого порошка. «Сильнее морфина в сто раз».', 'fentanyl'],
    ['Двенадцать часов на ногах. Спать нельзя, силы нужны долго.', 'aranesp'],
    ['Перед штурмом: страх и усталость, эффект нужен на два-три часа.', 'ephedrine'],
    ['Нужно прямо сейчас, за три секунды, стать машиной без боли.', 'desoxy'],
  ]);
  const items = CASES.map(([q, a]) => {
    const others = shuffle(Object.keys(DRUGS).filter(k => k !== a)).slice(0, 2);
    const opts = shuffle([a, ...others]);
    return { q, opts: opts.map(k => LOOK[k]), a: opts.indexOf(a), why: `${DRUGS[a]}: ${LOOK[a]}.` };
  });
  ctx.hint('СЛУШАЙ ЛЕКТОРА · ПОТОМ УЗНАВАЙ СРЕДСТВО ПО ВИДУ');

  return (async () => {
    await ctx.line('— Садитесь на пол. Все. Лавки — для тех, кто умеет слушать стоя.', { pos: 'top', ms: 2600 });
    await mgSlides(ctx, SLIDES, { voice: 'ЛЕКТОР · ЧЕРЕЗ МЕСЯЦ ВАС КИНУТ В ШТРЕКИ', ms: 7000 });
    if (!scope.alive) return { ok: 'fail' };
    await ctx.line('— Теперь практика. Штрек. Аптечек нет. Только то, что в кармане.', { pos: 'top', ms: 2600 });
    const r = await mgQuiz(ctx, items, { time: 14, title: 'ПРАКТИКА' });
    if (r.right >= 5) {
      await ctx.line('— Встать. Все свободны.', { pos: 'top', ms: 1800 });
      await ctx.line('К-14 пошёл первым. Он запомнил даже запах этого зала.', { pos: 'top', ms: 2600 });
      return { ok: 'ok', detail: `ВЕРНО ${r.right}/7` };
    }
    await ctx.line('— Вы сдохнете в первом же штреке. И вас не воскресят.', { pos: 'top', cls: 'red', ms: 2800 });
    return { ok: 'fail', detail: `ВЕРНО ${r.right}/7 · НУЖНО 5` };
  })();
}
