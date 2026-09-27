/* ==========================================================================
   ТЕРМИНАЛ OBJ-4471 — банкомат. Подходим вплотную и «влетаем» в экран.
   Сначала код из 12 цифр (части: записка на столе, мел на стене, ободок экрана).
   Дальше: телеметрия, журнал, архив с навигацией по главам и абзацам.
   Перед первым чтением — предупреждение и соглашение (отказ = охрана, смерть).
   Запертая глава 47: «ФАЙЛ ПОВРЕЖДЁН» → три удара → экран треснут → выход в комнату.
   В финале дочитываем 47–49 — и выстрел в спину.
   ========================================================================== */
const isLocked = i => i >= LOCK_FROM && !GameState.reader.unlocked;

function setupTerminal(ctx) {
  const { scope } = ctx;
  const R = GameState.reader, S = GameState.story;
  const ui = $('#termUI'), logEl = $('#termLog'), rd = $('#reader'), main = $('#rdMain'), art = $('#rdArticle');
  const panels = { main: $('#termMain'), code: $('#termCode'), norm: $('#termNorm') };
  const crackCv = $('#termCracks');

  // ---------- журнал ----------
  function log(text, cls = '') {
    const p = document.createElement('p');
    p.textContent = `> ${text}`; if (cls) p.className = cls;
    logEl.appendChild(p);
    while (logEl.children.length > 9) logEl.firstChild.remove();
  }
  ctx.log = log;
  function bootLog(instant) {
    logEl.innerHTML = '';
    const lines = [['Инициализация...', 'dim'], ['Терминал OBJ-4471']];
    if (!S.codeOk) lines.push(['Требуется код доступа', 'warn']);
    else {
      lines.push([`Архив из ${BOOK.length} глав доступен`]);
      if (S.cracked) lines.push(['Носитель повреждён', 'err']);
      else if (GameState.agingLevel > 0.08) lines.push([`Износ носителя: ${Math.round(GameState.agingLevel * 100)}%`, 'warn']);
      const fc = Frag.counts();
      if (fc.ok + fc.dist) lines.push([`Нейрослепок: восстановлено ${fc.ok}, искажено ${fc.dist}`, 'dim']);
      if (GameState.frag.wear >= 60) lines.push([`Износ носителя: ${GameState.frag.wear}% — КРИТИЧНО`, 'err']);
      if (S.stage === 'final') lines.push(['Главы 47–49 открыты', 'ok']);
      else lines.push(['Доступ разрешён', 'ok']);
    }
    lines.forEach(([t, c], i) => {
      if (instant) log(t, c);
      else scope.timeout(() => { log(t, c); Audio47.sfx.key(); }, 380 + i * 280);
    });
  }

  // ---------- телеметрия и часы ----------
  const tele = [['#tv1', '#tb1'], ['#tv2', '#tb2'], ['#tv3', '#tb3'], ['#tv4', '#tb4']].map(([v, b]) => [$(v), $(b)]);
  function updateTele() {
    const a = GameState.agingLevel + (S.cracked ? 0.35 : 0) + GameState.frag.wear / 250;
    const vals = [98 - a * 150, 74 + rand(-4, 4) - a * 40, 61 + rand(-2, 2), 12 + rand(-3, 3) + a * 160].map(v => Math.round(clamp(v, 3, 99)));
    tele.forEach(([v, b], i) => { v.textContent = `${vals[i]}%`; b.style.width = `${vals[i]}%`; });
    tele[3][1].classList.toggle('hot', vals[3] > 45);
    $('#termClock').textContent = new Date().toLocaleTimeString('ru-RU');
  }
  function stats() {
    $('#tcRead').textContent = `${R.read.size} / ${BOOK.length}`;
    $('#tcNorm').textContent = `${GameState.clicks.count} / ${CLICKS_NEEDED}`;
    const fc = Frag.counts();
    $('#tcFrag').textContent = `${fc.ok} / ${fc.total}`;
    $('#tcWear').textContent = `${GameState.frag.wear}%`;
    $('#tcWear').parentElement.classList.toggle('hot', GameState.frag.wear >= 60);
    const ch = BOOK[R.chapter];
    $('#tcLast').textContent = ch ? `ПОСЛЕДНЯЯ ЗАПИСЬ: ГЛ. ${R.chapter + 1} · «${ch.t}»` : '';
  }

  // ---------- трещины на экране (сохраняются) ----------
  /** трещины там, куда ударил игрок; точки ударов сохраняются вместе с сюжетом */
  function drawCracks(hits = S.hits) {
    const w = ui.clientWidth || window.innerWidth, h = ui.clientHeight || window.innerHeight, k = Math.min(2, window.devicePixelRatio || 1);
    crackCv.width = w * k; crackCv.height = h * k;
    const g = crackCv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); g.clearRect(0, 0, w, h);
    Cracks.draw(g, Cracks.fromHits(hits, crackSeed(), w / h), w, h, { scale: 1.3 });
    crackCv.hidden = !hits.length;
  }
  scope.on(window, 'k47:resize', () => { if (!crackCv.hidden) drawCracks(); });

  // ---------- какая панель в центре ----------
  function showPanel(name) {
    Object.entries(panels).forEach(([k, el]) => { el.hidden = k !== name; });
    // «ВЫЙТИ ИЗ СИСТЕМЫ» есть всегда — и при вводе кода, и на норме (на телефоне нет клавиши Esc)
    $('#termActions').hidden = false;
    $('#termRead').hidden = name !== 'main';
    ui.classList.toggle('mode-code', name === 'code');
    ui.classList.toggle('mode-norm', name === 'norm');
  }

  // ---------- вход: камера влетает в экран ----------
  ctx.enterTerminal = async () => {
    if (ctx.phase !== 'outside' || !ctx.R3) return;
    ctx.phase = 'moving'; ctx.setBar(null);
    ctx.stopCrawl && ctx.stopCrawl();
    Audio47.sfx.system(true);
    Audio47.sfx.whoosh(1.4);
    ctx.R3.shake(0.01, 1800);
    const fly = ctx.R3.moveTo('inside', { dur: 1.7, ease: 'in' });
    scope.timeout(() => $('#termFlash').classList.add('on'), 1450);
    await fly;
    if (!scope.alive) return;
    showTerminal(false);
    ctx.R3.setActive(false);
    scope.timeout(() => $('#termFlash').classList.remove('on'), 120);
  };

  function showTerminal(instant) {
    ctx.phase = 'terminal'; ctx.view = 'inside'; ctx.setBar(null);
    rd.hidden = true; ui.inert = false; ui.hidden = false;
    ui.classList.toggle('instant', !!instant);
    ui.classList.toggle('cracked', S.cracked);
    if (S.cracked) drawCracks(); else { crackCv.hidden = true; }
    $('#hitPrompt').hidden = true;
    FX.setVisible(true);
    stats(); bootLog(instant); updateTele();
    scope.tick('tele', updateTele, 4);
    setSub('terminal');
    if (!S.codeOk) { showPanel('code'); resetCode(); Audio47.setAmbient('reader'); }
    else if (S.stage === 'norm') { showPanel('norm'); ctx.norm.start(); }
    else { showPanel('main'); Audio47.setAmbient('reader'); }
    $('#termRead').textContent = S.stage === 'final' ? 'ДОЧИТАТЬ АРХИВ' : 'ЧИТАТЬ АРХИВ';
    scope.timeout(() => {
      if (ctx.phase !== 'terminal') return;
      const f = !panels.code.hidden ? panels.code : !panels.norm.hidden ? $('#normBtn') : $('#termRead');
      if (f) f.focus({ preventScroll: true });
    }, instant ? 60 : 1400);
  }
  ctx.showTerminal = showTerminal;

  // ---------- выход: отлетаем назад в комнату ----------
  async function exitTerminal({ auto = false } = {}) {
    if (ctx.phase !== 'terminal' && !auto) return;
    ctx.phase = 'moving';
    log('Выход из системы...', 'dim');
    Audio47.sfx.system(false);
    const r = await ctx.ensureRenderer();
    if (!r || !scope.alive) return;
    r.setActive(true); r.setPose('inside');
    r.setScreenState({ codeOk: S.codeOk, cracked: S.cracked, aging: GameState.agingLevel });
    r.setPhotoCount(Math.min(47, R.read.size));
    FX.setVisible(false);
    ui.classList.add('leaving');
    await scope.wait(380);
    ui.hidden = true; ui.classList.remove('leaving');
    rd.hidden = true;
    scope.untick('tele');
    Audio47.setAmbient('room');
    await r.moveTo('outside', { dur: 1.6, ease: 'out' });
    ctx.view = 'outside'; ctx.phase = 'outside'; ctx.setBar('outside');
    setSub('explore');
    ctx.onOutside && ctx.onOutside();
  }
  ctx.exitTerminal = exitTerminal;

  // ---------- код доступа: клавиатура как у банкомата ----------
  const slots = $$('#codeSlots i');
  let entered = '', codeBusy = false;
  function renderSlots() {
    slots.forEach((s, i) => { s.textContent = entered[i] || ''; s.classList.toggle('on', i < entered.length); s.classList.toggle('cur', i === entered.length); });
  }
  function resetCode(msg = '') { entered = ''; renderSlots(); $('#codeMsg').textContent = msg; $('#codeMsg').className = 'code-msg'; }
  function codeKey(k) {
    if (codeBusy || panels.code.hidden) return;
    if (/^\d$/.test(k)) { if (entered.length < 12) { entered += k; Audio47.sfx.beep(1150); renderSlots(); } else Audio47.sfx.error(); return; }
    if (k === 'back') { entered = entered.slice(0, -1); Audio47.sfx.beep(700); renderSlots(); return; }
    if (k === 'clear') { Audio47.sfx.beep(600); resetCode(); return; }
    if (k === 'cancel') { Audio47.sfx.click(); exitTerminal(); return; }
    if (k === 'enter') { submitCode(); return; }
    if (k === 'mod') { Audio47.sfx.beep(520); return; }
    Audio47.sfx.error();                               // буквы: код только из цифр
    $('#codeMsg').textContent = 'ТОЛЬКО ЦИФРЫ'; $('#codeMsg').className = 'code-msg err';
  }
  async function submitCode() {
    const msg = $('#codeMsg');
    if (entered.length < 12) { Audio47.sfx.error(); msg.textContent = 'НУЖНО 12 ЦИФР'; msg.className = 'code-msg err'; return; }
    codeBusy = true;
    msg.textContent = 'ПРОВЕРКА...'; msg.className = 'code-msg';
    await scope.wait(700);
    if (entered === S.code) {
      Audio47.sfx.success();
      msg.textContent = 'КОД ПРИНЯТ'; msg.className = 'code-msg ok';
      S.codeOk = true; Save.progress();
      if (ctx.R3) ctx.R3.setScreenState({ codeOk: true });
      log('Код принят', 'ok'); log(`Архив из ${BOOK.length} глав доступен`);
      await scope.wait(900);
      codeBusy = false;
      showPanel('main');
      $('#termRead').focus({ preventScroll: true });
    } else {
      Audio47.sfx.error(); FX.shake('sm');
      panels.code.classList.remove('deny'); void panels.code.offsetWidth; panels.code.classList.add('deny');
      log('Неверный код', 'err');
      msg.textContent = 'НЕВЕРНЫЙ КОД'; msg.className = 'code-msg err';
      await scope.wait(900);
      codeBusy = false;
      entered = ''; renderSlots();
    }
  }
  scope.on($('#atmPad'), 'click', e => { const b = e.target.closest('[data-k]'); if (b) codeKey(b.dataset.k); });

  // ---------- предупреждение → соглашение → архив ----------
  function requestArchive() {
    if (ctx.phase !== 'terminal') return;
    const start = S.stage === 'final' ? Math.max(R.chapter, LOCK_FROM) : R.chapter;
    if (R.agreed) { openReader(start); return; }
    log('Запрос доступа к архиву...');
    Audio47.sfx.error();
    Modal.open($('#warnModal'), { closable: false, focus: '#warnOk' });
  }
  const agreeItems = $$('.agree-item');
  function openAgreement() {
    agreeItems.forEach(it => { it.classList.remove('checked'); it.setAttribute('aria-checked', 'false'); });
    $('#agreeAccept').disabled = true;
    Modal.open($('#agreeModal'), { closable: false, focus: '.agree-item' });
  }
  function toggleAgree(it) {
    const on = !it.classList.contains('checked');
    it.classList.toggle('checked', on); it.setAttribute('aria-checked', String(on));
    Audio47.sfx.key();
    $('#agreeAccept').disabled = !agreeItems.every(x => x.classList.contains('checked'));
  }
  scope.on($('#warnOk'), 'click', () => { Audio47.sfx.click(); Modal.close($('#warnModal'), true); openAgreement(); });
  agreeItems.forEach(it => {
    scope.on(it, 'click', () => toggleAgree(it));
    scope.on(it, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleAgree(it); } });
  });
  scope.on($('#agreeAccept'), 'click', () => {
    Modal.close($('#agreeModal'), true);
    R.agreed = true; Save.progress();
    Audio47.sfx.success();
    log('Соглашение v.47 принято', 'ok');
    openReader(R.chapter);
  });
  scope.on($('#agreeRefuse'), 'click', () => { Modal.close($('#agreeModal'), true); startLockdown(); });

  // ---------- отказ: блокировка, отряд охраны, выстрелы — смерть ----------
  function startLockdown() {
    ctx.phase = 'lockdown';
    log('ОТКАЗ ОТ СОГЛАШЕНИЯ', 'warn'); log('ВЫЗВАН ОТРЯД ОХРАНЫ', 'err'); log('ОЖИДАЙТЕ...', 'err');
    const lock = $('#lockdown'), D = 10, t0 = Clock.now();
    let last = D;
    $('#lockCount').textContent = D; $('#lockBar').style.width = '0%';
    Modal.open(lock, { closable: false });
    Audio47.sfx.glitch(1.6);
    FX.flash('#ff0022', 400, 0.5);
    scope.tick('lock', () => {
      const el = (Clock.now() - t0) / 1000, rem = Math.max(0, D - el), s = Math.ceil(rem);
      if (s !== last) { last = s; $('#lockCount').textContent = s; Audio47.sfx.error(); if (s <= 3) FX.shake('sm'); }
      $('#lockBar').style.width = `${Math.min(100, (el / D) * 100)}%`;
      if (rem <= 0) { scope.untick('lock'); executeLockdown(); }
    });
  }
  async function executeLockdown() {
    Modal.close($('#lockdown'), true);
    const r = await ctx.ensureRenderer();
    if (!r || !scope.alive) return;
    scope.untick('tele');
    r.setActive(true); r.setPose('inside'); r.setFigure('guard'); r.setSilhouette(0); r.setEyes(0);
    ui.hidden = true; FX.setVisible(false);
    Audio47.setAmbient('room');
    Audio47.sfx.whoosh(1.2);
    await r.moveTo('facing', { dur: 1.9 });
    r.setSilhouette(1); r.setEyes(1);
    Audio47.sfx.whisper(1.5);
    await scope.wait(1300);
    Audio47.sfx.barrage(2.5);
    ctx.die({ muzzle: true });
  }

  // ---------- архив: главы и абзацы ----------
  let units = [], visible = 0, finalFired = false;
  function chapterUnits(i) {
    const out = []; let sep = false;
    for (const p of BOOK[i].p) { if (p === '---') { sep = true; continue; } out.push({ sep, text: p }); sep = false; }
    return out;
  }
  function footer(i) {
    const f = $('#chFoot');
    if (i < BOOK.length - 1) {
      const n = i + 1;
      f.innerHTML = isLocked(n)
        ? `<p class="note">Глава ${n + 1} · «${BOOK[n].t}» · заперта<br>НОРМА РАСХОДА ПЛОТИ НЕ ДОСТИГНУТА</p>
           <button class="btn btn-primary pulse" data-go="${n}" aria-label="Попробовать открыть главу ${n + 1}">ОТКРЫТЬ ГЛАВУ ${n + 1}</button>`
        : `<p class="note">Дальше — глава ${n + 1}</p>
           <button class="btn btn-primary" data-go="${n}" aria-label="Следующая глава: ${BOOK[n].t}">«${BOOK[n].t}» →</button>`;
    } else {
      f.innerHTML = '<p class="note">Конец архива. Дальше — без счёта.</p>';
    }
  }
  /** плашка статуса фрагмента под заголовком главы */
  function fragBadge(i) {
    const F = FRAGS[i]; if (!F) return '';
    const st = Frag.status(i) || 'none';
    const lbl = st === 'none' ? 'ФРАГМЕНТ НЕ ВОССТАНОВЛЕН' : `ФРАГМЕНТ ${STATUS_LABEL[st]}`;
    const btn = st === 'ok' ? '↻ ПРОЖИТЬ ЕЩЁ РАЗ' : '↻ ВОССТАНОВИТЬ';
    return `<div class="ch-frag st-${st}"><span class="chip">${lbl}</span><span class="fn">${esc(F.name)}</span><button class="rd-btn" data-frag="${i}" aria-label="${btn.slice(2)}: ${esc(F.name)}">${btn}</button></div>`;
  }
  function renderChapter(i) {
    const ch = BOOK[i];
    units = chapterUnits(i);
    const ratio = Frag.glitch(i), seed = 4700 + i * 97;
    const txt = (u, k) => (ratio ? glitchRich(u.text, ratio, seed + k * 13) : u.text);
    art.innerHTML = `<header class="ch-head"><p class="ch-num">Глава ${i + 1}</p><h2 class="ch-title" id="chTitle">${ch.t}</h2>${fragBadge(i)}</header>
      <div class="ch-text${ratio ? ' damaged' : ''}">${units.map((u, k) => `<div class="para" data-k="${k}" hidden>${u.sep ? '<p class="sep" aria-hidden="true">— — —</p>' : ''}<p>${txt(u, k)}</p></div>`).join('')}</div>
      <p class="rd-tap" id="rdTap">▼ нажми на текст — следующий абзац</p>
      <footer class="ch-foot" id="chFoot" hidden></footer>`;
    footer(i);
    $('#rdInd').textContent = `ГЛ. ${i + 1} / ${BOOK.length} · ${ch.t}`;
    $('#rdRead').textContent = `ПРОЧИТАНО ${R.read.size} / ${BOOK.length}`;
    $('#rdPrev').disabled = i === 0;
    $('#rdNext').disabled = i === BOOK.length - 1;
  }
  function setVisible(n, { scroll = true } = {}) {
    const prev = visible;
    visible = clamp(n, 0, units.length);
    const paras = $$('.para', art);
    paras.forEach((p, k) => { p.hidden = k >= visible; p.classList.remove('new'); });
    if (visible === prev + 1 && paras[visible - 1]) paras[visible - 1].classList.add('new');
    const all = visible >= units.length;
    $('#paraCount').textContent = visible; $('#paraTotal').textContent = units.length;
    $('#paraPrev').disabled = visible <= 0;
    $('#paraNext').disabled = all; $('#paraAll').disabled = all;
    $('#chFoot').hidden = !all; $('#rdTap').hidden = all;
    if (scroll && visible > prev && paras[visible - 1]) paras[visible - 1].scrollIntoView({ block: 'nearest', behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
    updateProgress();
    if (all && R.chapter === BOOK.length - 1 && S.stage === 'final') finalShot();
  }
  function updateProgress() {
    const max = main.scrollHeight - main.clientHeight;
    $('#rdProgress').style.width = `${units.length ? (visible / units.length) * 100 : 0}%`;
    $('#rdScroll').style.width = `${max > 0 ? (main.scrollTop / max) * 100 : 100}%`;
  }
  function markRead(i) {
    if (R.read.has(i)) return;
    R.read.add(i); Save.chapters();
    GameState.agingLevel = clamp(GameState.agingLevel + 0.01, 0, 1);
    FX.setLevel(GameState.agingLevel);
    Audio47.setIntensity(GameState.agingLevel / 0.5);
    log(`Блокнот: новая запись, стр. ${i + 1}`, 'dim');
    if (R.read.size <= 47) log(`На стене: фото №${R.read.size}`, 'dim');
  }
  /** мини-игра главы: сначала фрагмент, потом текст в том виде, в каком его удалось восстановить */
  async function playFragment(i, replay = false) {
    if (Frag.isBusy() || !FRAGS[i]) return;
    ctx.phase = 'fragment';
    const r = await Frag.run(i, { replay, onLog: (t, c) => log(t, c) });
    if (!scope.alive || r === 'dead') return;
    ctx.phase = 'reader';
    if (R.chapter === i) {
      const v = visible;
      renderChapter(i); visible = 0; setVisible(Math.max(1, v), { scroll: false });
    }
    stats();
    requestAnimationFrame(() => main.focus({ preventScroll: true }));
  }
  function openChapter(i, { first = false } = {}) {
    if (i < 0 || i >= BOOK.length || ctx.phase === 'dying' || ctx.phase === 'fragment') return;
    if (isLocked(i)) { lockedChapter(i); return; }
    if (!first && i !== R.chapter) Audio47.sfx.page();
    const wasRead = R.read.has(i);
    R.chapter = i;
    markRead(i);
    renderChapter(i);
    visible = 0;
    setVisible(wasRead ? units.length : 1, { scroll: false });
    main.scrollTop = 0;
    Save.progress();
    if (FRAGS[i] && !Frag.status(i)) playFragment(i);
  }
  function openReader(i, { direct = false } = {}) {
    if (!Number.isInteger(i) || i < 0 || i >= BOOK.length) i = 0;
    if (isLocked(i)) i = LOCK_FROM - 1;
    ctx.phase = 'reader';
    ui.inert = true; rd.hidden = false;
    rd.classList.toggle('instant', direct);
    rd.classList.remove('shot');
    if (!direct) Audio47.sfx.whoosh(0.5);
    setSub('reader');
    openChapter(i, { first: true });
    requestAnimationFrame(() => main.focus({ preventScroll: true }));
  }
  ctx.openReader = openReader;
  function closeReader() {
    if (ctx.phase !== 'reader') return;
    rd.hidden = true; ui.inert = false;
    ctx.phase = 'terminal'; setSub('terminal');
    stats(); log(`Сеанс чтения завершён · гл. ${R.chapter + 1}`, 'dim');
    $('#termRead').focus({ preventScroll: true });
  }

  // ---------- глава 47 заперта: повреждённый файл → три удара → выход ----------
  function lockedChapter(i) {
    Audio47.sfx.error(); Audio47.sfx.glitch(1.4);
    FX.bump(0.3);
    $('#damageCode').textContent = `ERR_0x47 // ГЛАВА ${i + 1} // НОРМА РАСХОДА ПЛОТИ НЕ ДОСТИГНУТА`;
    Modal.open($('#damageModal'), { closable: false, focus: '#damageOk' });
  }
  scope.on($('#damageOk'), 'click', () => { Audio47.sfx.click(); Modal.close($('#damageModal'), true); strikePhase(); });

  /** экран не отвечает — бьём по нему сами: три удара, каждый по нажатию */
  let strikes = [];
  function strikePhase() {
    ctx.phase = 'hits';
    rd.hidden = true; ui.inert = false;
    showPanel('main'); $('#termActions').hidden = true;
    strikes = [];
    const pr = $('#hitPrompt');
    pr.hidden = false; $('#hitCount').textContent = '0 / 3';
    log('ЭКРАН НЕ ОТВЕЧАЕТ', 'err');
    Audio47.sfx.glitch(1.2);
  }
  function strike(x, y) {
    if (ctx.phase !== 'hits' || strikes.length >= 3) return;
    strikes.push([clamp(x, 0.06, 0.94), clamp(y, 0.08, 0.92)]);
    const n = strikes.length;
    Audio47.sfx.thud(1); Audio47.sfx.crack();
    FX.shake('lg'); FX.flash('#ffffff', 260, 0.4); FX.vibrate([60, 30, 110]);
    drawCracks(strikes);
    ui.classList.add('cracked');
    $('#hitCount').textContent = `${n} / 3`;
    log(n < 3 ? 'СБОЙ ЭКРАНА' : 'НОСИТЕЛЬ ПОВРЕЖДЁН', 'err');
    if (n === 3) finishStrikes();
  }
  async function finishStrikes() {
    ctx.phase = 'hits-done';
    S.hits = strikes.slice(); S.cracked = true; S.stage = 'damaged'; Save.progress();
    await scope.wait(900);
    $('#hitPrompt').hidden = true;
    Audio47.sfx.glitch(1.8);
    log('Аварийный выход', 'err');
    await scope.wait(1100);
    exitTerminal({ auto: true });
  }
  scope.on(ui, 'pointerdown', e => {
    if (ctx.phase !== 'hits' || e.target.closest('button')) return;
    const r = ui.getBoundingClientRect();
    strike((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });

  // ---------- финал: дочитали — выстрел в спину ----------
  async function finalShot() {
    if (finalFired) return;
    finalFired = true;
    ctx.phase = 'dying';
    await scope.wait(3200);
    Audio47.sfx.steps(3, 1.6);
    await scope.wait(1900);
    Audio47.sfx.whisper(1.1);
    await scope.wait(900);
    Audio47.setAmbient(null, 0.2);
    Audio47.sfx.shot();
    FX.flash('#ffffff', 90, 1); scope.timeout(() => FX.flash('#990000', 500, 0.8), 100);
    FX.shake('lg'); FX.vibrate([120, 40, 200]);
    rd.classList.add('shot');
    await scope.wait(1700);
    startAct('awake', { flash: '#000000' });
  }

  // ---------- оглавление ----------
  function openToc() {
    const list = $('#tocList');
    list.innerHTML = BOOK.map((ch, i) => {
      const locked = isLocked(i), read = R.read.has(i), cur = i === R.chapter, fs = Frag.status(i);
      const fm = { ok: '◆', dist: '≈', dmg: '✕', skip: '·' }[fs] || '';
      const mark = locked ? 'заперта' : `${fm}${read ? ' ✓' : ''}`;
      const label = `Глава ${i + 1}. ${ch.t}${locked ? '. Заперта' : read ? '. Прочитана' : ''}${fs ? `. Фрагмент: ${STATUS_LABEL[fs].toLowerCase()}` : ''}`;
      return `<li><button class="toc-item${cur ? ' current' : ''}${locked ? ' locked' : ''}${fs ? ` fs-${fs}` : ''}" data-go="${i}" aria-label="${label}"${cur ? ' aria-current="true"' : ''}>
        <span class="n">${i + 1}</span><span class="t">${ch.t}</span><span class="m">${mark}</span></button></li>`;
    }).join('');
    Modal.open($('#tocModal'), { focus: '.toc-item.current' });
    const cur = $('.toc-item.current', list);
    if (cur) cur.scrollIntoView({ block: 'center' });
  }
  scope.on($('#tocList'), 'click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    Audio47.sfx.click();
    Modal.close($('#tocModal'), true);
    openChapter(+b.dataset.go);
  });

  // ---------- кнопки ----------
  const nav = (sel, fn) => scope.on($(sel), 'click', e => { e.stopPropagation(); if (ctx.phase === 'dying') return; Audio47.sfx.click(); fn(); });
  nav('#termRead', requestArchive);
  nav('#termExit', () => exitTerminal());
  nav('#rdPrev', () => openChapter(R.chapter - 1));
  nav('#rdNext', () => openChapter(R.chapter + 1));
  nav('#rdToc', openToc);
  nav('#rdClose', closeReader);
  nav('#paraPrev', () => setVisible(visible - 1, { scroll: false }));
  nav('#paraNext', () => setVisible(visible + 1));
  nav('#paraAll', () => setVisible(units.length, { scroll: false }));
  nav('#paraReset', () => { setVisible(0, { scroll: false }); main.scrollTop = 0; });
  scope.on(art, 'click', e => {
    if (ctx.phase === 'dying' || ctx.phase === 'fragment') return;
    const fb = e.target.closest('[data-frag]');
    if (fb) { e.stopPropagation(); Audio47.sfx.click(); playFragment(+fb.dataset.frag, true); return; }
    const go = e.target.closest('[data-go]');
    if (go) { Audio47.sfx.click(); openChapter(+go.dataset.go); return; }
    if (visible < units.length && !String(window.getSelection() || '')) { Audio47.sfx.key(); setVisible(visible + 1); }
  });
  scope.on(main, 'scroll', updateProgress, { passive: true });

  // ---------- клавиатура ----------
  scope.on(document, 'keydown', e => {
    if (Modal.isOpen() || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    const onBtn = e.target instanceof HTMLButtonElement;
    if (ctx.phase === 'hits' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); strike(rand(0.25, 0.75), rand(0.25, 0.7)); return; }
    if (ctx.phase === 'terminal') {
      if (!panels.code.hidden) {
        if (/^\d$/.test(e.key)) { e.preventDefault(); codeKey(e.key); return; }
        if (/^[a-zа-яё]$/i.test(e.key)) { e.preventDefault(); codeKey('letter'); return; }
        if (e.key === 'Backspace') { e.preventDefault(); codeKey('back'); return; }
        if (e.key === 'Enter' && !onBtn) { e.preventDefault(); codeKey('enter'); return; }
        if (e.key === 'Delete') { e.preventDefault(); codeKey('clear'); return; }
      }
      if (e.key === 'Escape') { e.preventDefault(); Audio47.sfx.click(); exitTerminal(); }
      return;
    }
    if (ctx.phase !== 'reader') return;
    switch (e.code) {
      case 'ArrowLeft': e.preventDefault(); openChapter(R.chapter - 1); break;
      case 'ArrowRight': e.preventDefault(); openChapter(R.chapter + 1); break;
      case 'ArrowDown': case 'Space': case 'Enter':
        if (onBtn && e.code !== 'ArrowDown') return;
        if (visible < units.length) { e.preventDefault(); Audio47.sfx.key(); setVisible(visible + 1); }
        break;
      case 'KeyT': e.preventDefault(); openToc(); break;
      case 'KeyA': e.preventDefault(); setVisible(units.length, { scroll: false }); break;
      case 'Escape': e.preventDefault(); Audio47.sfx.click(); closeReader(); break;
    }
  });
}
