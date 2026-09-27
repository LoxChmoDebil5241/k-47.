/* ==========================================================================
   ТЕРМИНАЛ OBJ-4471 — банкомат. Подходим вплотную и «влетаем» в экран.
   Код из 12 цифр: записка на столе, мел на стене, ободок экрана.
   Архив: 49 глав. Нетронутая глава сначала восстанавливается мини-игрой:
     ВОССТАНОВЛЕН — чистый текст + запись в блокнот;
     ИСКАЖЁН     — текст с глитчами + особая запись;
     ПОВРЕЖДЁН   — глитч-текст, вымаранные слова, износ носителя.
   Глава 47 заперта: «ФАЙЛ ПОВРЕЖДЁН» → три удара по стеклу → экран треснул.
   В финале дочитываем 47–49 — и выстрел в спину.
   ========================================================================== */
const isLocked = i => i >= LOCK_FROM && !G.reader.unlocked;
const stageOpen = () => !$('#stage').hidden;
const STATUS_LABEL = { ok: 'ВОССТАНОВЛЕН', dist: 'ИСКАЖЁН', dmg: 'ПОВРЕЖДЁН' };

function setupTerminal(ctx) {
  const { scope } = ctx;
  const R = G.reader, S = G.story;
  const ui = $('#termUI'), logEl = $('#termLog'), rd = $('#reader'), main = $('#rdMain'), art = $('#rdArticle');
  const panels = { main: $('#termMain'), code: $('#termCode'), norm: $('#termNorm') };
  const crackCv = $('#termCracks');

  function log(text, cls = '') {
    const p = document.createElement('p'); p.textContent = `> ${text}`; if (cls) p.className = cls;
    logEl.appendChild(p);
    while (logEl.children.length > 12) logEl.firstChild.remove();
    logEl.scrollTop = logEl.scrollHeight;
  }
  ctx.log = log;
  function bootLog(instant) {
    logEl.innerHTML = '';
    const lines = [['Инициализация...', 'dim'], ['Терминал OBJ-4471']];
    if (!S.codeOk) lines.push(['Требуется код доступа', 'warn']);
    else {
      lines.push([`Архив из ${N_CH} глав · прочитано ${readCount()}`]);
      if (S.cracked) lines.push(['Носитель повреждён', 'err']);
      if (G.wear > 0) lines.push([`Износ носителя: ${G.wear}%`, G.wear > 60 ? 'err' : 'warn']);
      lines.push(S.stage === 'final' ? ['Главы 47–49 открыты', 'ok'] : ['Доступ разрешён', 'ok']);
    }
    lines.forEach(([t, c], i) => { if (instant) log(t, c); else scope.timeout(() => { log(t, c); A.sfx.key(); }, 380 + i * 260); });
  }
  const tele = [1, 2, 3, 4].map(n => [$(`#tv${n}`), $(`#tb${n}`)]);
  function updateTele() {
    const a = agingLevel() + (S.cracked ? 0.3 : 0);
    const vals = [98 - a * 120, 74 + rand(-4, 4) - a * 40, 61 + rand(-2, 2), G.wear].map(v => Math.round(clamp(v, 0, 99)));
    tele.forEach(([v, b], i) => { v.textContent = `${vals[i]}%`; b.style.width = `${vals[i]}%`; });
    tele[3][1].classList.toggle('hot', G.wear > 45);
    $('#termClock').textContent = new Date().toLocaleTimeString('ru-RU');
  }
  function stats() {
    $('#tcRead').textContent = `${readCount()} / ${N_CH}`;
    $('#tcOk').textContent = countSt('ok'); $('#tcDist').textContent = countSt('dist');
    $('#tcNorm').textContent = `${G.clicks} / ${CLICKS_NEEDED}`;
    $('#tcLast').textContent = BOOK[R.chapter] ? `ПОСЛЕДНЯЯ: ГЛ. ${R.chapter + 1} «${chTitle(R.chapter)}»` : '';
    $('#termBig').textContent = S.stage === 'final' ? 'ДОЧИТАЙ' : S.stage === 'after' ? 'К-48' : 'К-47';
    $('#termSub').textContent = S.stage === 'final' ? 'Последние главы открыты. Там — то, что бывает после.'
      : `Архив из ${N_CH} глав. Каждая запись повреждена. Прежде чем читать — проживи её заново. Восстановлено: ${countSt('ok')}.`;
  }
  function drawCracks(hits = S.hits) {
    const w = ui.clientWidth || window.innerWidth, h = ui.clientHeight || window.innerHeight, k = Math.min(2, window.devicePixelRatio || 1);
    crackCv.width = w * k; crackCv.height = h * k;
    const g = crackCv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); g.clearRect(0, 0, w, h);
    Cracks.draw(g, Cracks.fromHits(hits, crackSeed(), w / h), w, h, { scale: 1.3 });
    crackCv.hidden = !hits.length;
  }
  scope.on(window, 'k47:resize', () => { if (!crackCv.hidden) drawCracks(); });
  function showPanel(name) {
    Object.entries(panels).forEach(([k, el]) => { el.hidden = k !== name; });
    $('#termActions').hidden = false;
    $('#termRead').hidden = name !== 'main'; $('#termNb').hidden = name !== 'main';
  }

  // ---------- вход: камера влетает в экран ----------
  ctx.enterTerminal = async () => {
    if (ctx.phase !== 'outside' || !ctx.R3) return;
    ctx.phase = 'moving'; ctx.setBar(null);
    if (ctx.stopCrawl) ctx.stopCrawl();
    A.sfx.system(true); A.sfx.whoosh(0.2);
    ctx.R3.shake(0.01, 1800);
    const fly = ctx.R3.moveTo('inside', { dur: 1.6, ease: 'in' });
    scope.timeout(() => $('#termFlash').classList.add('on'), 1350);
    await fly;
    if (!scope.alive) return;
    showTerminal(false);
    ctx.R3.setActive(false);
    scope.timeout(() => $('#termFlash').classList.remove('on'), 120);
  };
  function showTerminal(instant) {
    ctx.phase = 'terminal'; ctx.view = 'inside'; ctx.setBar(null);
    rd.hidden = true; ui.inert = false; ui.hidden = false;
    ui.classList.toggle('instant', !!instant); ui.classList.toggle('cracked', S.cracked);
    if (S.cracked) drawCracks(); else crackCv.hidden = true;
    $('#hitPrompt').hidden = true;
    FX.setVisible(true); FX.setLevel(agingLevel());
    stats(); bootLog(instant); updateTele();
    scope.tick('tele', updateTele, 2);
    setSub('terminal');
    if (!S.codeOk) { showPanel('code'); resetCode(); A.setAmbient('reader'); }
    else if (S.stage === 'norm') { showPanel('norm'); ctx.norm.start(); }
    else { showPanel('main'); A.setAmbient('reader'); A.setIntensity(agingLevel()); }
    $('#termRead').textContent = S.stage === 'final' ? 'ДОЧИТАТЬ АРХИВ' : 'ЧИТАТЬ АРХИВ';
    scope.timeout(() => { if (ctx.phase !== 'terminal') return; const f = !panels.code.hidden ? $('#atmPad button') : !panels.norm.hidden ? $('#normBtn') : $('#termRead'); if (f) f.focus({ preventScroll: true }); }, instant ? 60 : 1300);
  }
  ctx.showTerminal = showTerminal;
  async function exitTerminal({ auto = false } = {}) {
    if (ctx.phase !== 'terminal' && !auto) return;
    ctx.phase = 'moving';
    log('Выход из системы...', 'dim'); A.sfx.system(false);
    const r = await ctx.ensureRenderer();
    if (!r || !scope.alive) return;
    r.setActive(true); r.setPose('inside');
    r.setScreenState({ codeOk: S.codeOk, cracked: S.cracked });
    r.setPhotoCount(Math.min(47, readCount()));
    FX.setVisible(false);
    ui.classList.add('leaving');
    await scope.wait(380);
    ui.hidden = true; ui.classList.remove('leaving'); rd.hidden = true;
    scope.untick('tele');
    A.setAmbient('room');
    await r.moveTo('outside', { dur: 1.5, ease: 'out' });
    ctx.view = 'outside'; ctx.phase = 'outside'; ctx.setBar('outside');
    setSub('explore');
    if (ctx.onOutside) ctx.onOutside();
  }
  ctx.exitTerminal = exitTerminal;

  // ---------- код доступа ----------
  const slots = $$('#codeSlots i');
  let entered = '', codeBusy = false, wrongTries = 0;
  const renderSlots = () => slots.forEach((s, i) => { s.textContent = entered[i] || ''; s.classList.toggle('on', i < entered.length); s.classList.toggle('cur', i === entered.length); });
  function resetCode(msg = '') { entered = ''; renderSlots(); $('#codeMsg').textContent = msg; $('#codeMsg').className = 'code-msg'; }
  function codeKey(k) {
    if (codeBusy || panels.code.hidden) return;
    if (/^\d$/.test(k)) { if (entered.length < 12) { entered += k; A.sfx.beep(1150); renderSlots(); } else A.sfx.error(); return; }
    if (k === 'back') { entered = entered.slice(0, -1); A.sfx.beep(700); renderSlots(); return; }
    if (k === 'clear') { A.sfx.beep(600); resetCode(); return; }
    if (k === 'cancel') { A.sfx.click(); exitTerminal(); return; }
    if (k === 'enter') { submitCode(); return; }
    if (k === 'mod') { A.sfx.beep(520); return; }
    A.sfx.error(); $('#codeMsg').textContent = 'ТОЛЬКО ЦИФРЫ'; $('#codeMsg').className = 'code-msg err';
  }
  async function submitCode() {
    const msg = $('#codeMsg');
    if (entered.length < 12) { A.sfx.error(); msg.textContent = 'НУЖНО 12 ЦИФР'; msg.className = 'code-msg err'; return; }
    codeBusy = true; msg.textContent = 'ПРОВЕРКА...'; msg.className = 'code-msg';
    await scope.wait(700);
    if (entered === S.code) {
      A.sfx.success(); msg.textContent = 'КОД ПРИНЯТ'; msg.className = 'code-msg ok';
      S.codeOk = true; Save.put();
      if (ctx.R3) ctx.R3.setScreenState({ codeOk: true });
      log('Код принят', 'ok'); log(`Архив из ${N_CH} глав доступен`);
      await scope.wait(900);
      codeBusy = false; showPanel('main'); stats(); A.setAmbient('reader');
      $('#termRead').focus({ preventScroll: true });
    } else {
      wrongTries++;
      A.sfx.error(); FX.shake('sm'); FX.chroma(200);
      panels.code.classList.remove('deny'); void panels.code.offsetWidth; panels.code.classList.add('deny');
      log('Неверный код', 'err');
      msg.textContent = wrongTries >= 3 ? 'НЕВЕРНО · ЗАПИСКА НА СТОЛЕ, МЕЛ У ПОЛА, ОБОДОК ЭКРАНА' : 'НЕВЕРНЫЙ КОД'; msg.className = 'code-msg err';
      await scope.wait(900);
      codeBusy = false; entered = ''; renderSlots();
    }
  }
  scope.on($('#atmPad'), 'click', e => { const b = e.target.closest('[data-k]'); if (b) codeKey(b.dataset.k); });

  // ---------- предупреждение → соглашение → архив ----------
  function requestArchive() {
    if (ctx.phase !== 'terminal') return;
    const start = S.stage === 'final' ? Math.max(R.chapter, LOCK_FROM) : R.chapter;
    if (R.agreed) { openReader(start); return; }
    log('Запрос доступа к архиву...'); A.sfx.error();
    Modal.open($('#warnModal'), { closable: false, focus: '#warnOk' });
  }
  const agreeItems = $$('.agree-item');
  function openAgreement() { agreeItems.forEach(it => { it.classList.remove('checked'); it.setAttribute('aria-checked', 'false'); }); $('#agreeAccept').disabled = true; Modal.open($('#agreeModal'), { closable: false, focus: '.agree-item' }); }
  function toggleAgree(it) { const on = !it.classList.contains('checked'); it.classList.toggle('checked', on); it.setAttribute('aria-checked', String(on)); A.sfx.key(); $('#agreeAccept').disabled = !agreeItems.every(x => x.classList.contains('checked')); }
  scope.on($('#warnOk'), 'click', () => { A.sfx.click(); Modal.close($('#warnModal'), true); openAgreement(); });
  agreeItems.forEach(it => { scope.on(it, 'click', () => toggleAgree(it)); scope.on(it, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleAgree(it); } }); });
  scope.on($('#agreeAccept'), 'click', () => { Modal.close($('#agreeModal'), true); R.agreed = true; Save.put(); A.sfx.success(); log('Соглашение v.47 принято', 'ok'); openReader(R.chapter); });
  scope.on($('#agreeRefuse'), 'click', () => { Modal.close($('#agreeModal'), true); startLockdown(); });

  // ---------- отказ: блокировка, отряд охраны, выстрелы ----------
  function startLockdown() {
    ctx.phase = 'lockdown';
    log('ОТКАЗ ОТ СОГЛАШЕНИЯ', 'warn'); log('ВЫЗВАН ОТРЯД ОХРАНЫ', 'err'); log('ОЖИДАЙТЕ...', 'err');
    const lock = $('#lockdown'), D = 10, t0 = Clock.now();
    let last = D;
    $('#lockCount').textContent = D; $('#lockBar').style.width = '0%';
    Modal.open(lock, { closable: false, onEsc: () => {} });
    A.sfx.glitch(1.6); A.sfx.alarm(0.1); FX.flash('#ff0022', 400, 0.5);
    scope.tick('lock', () => {
      const el = (Clock.now() - t0) / 1000, rem = Math.max(0, D - el), s = Math.ceil(rem);
      if (s !== last) { last = s; $('#lockCount').textContent = s; A.sfx.error(); if (s <= 3) FX.shake('sm'); }
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
    ui.hidden = true; FX.setVisible(false); A.setAmbient('room'); A.sfx.whoosh(0.2);
    await r.moveTo('facing', { dur: 1.9 });
    r.setSilhouette(1); r.setEyes(1); A.sfx.whisper(1.5);
    await scope.wait(1300);
    A.sfx.barrage(2.5);
    ctx.die({ muzzle: true, reason: 'ОТКАЗ ОТ СОГЛАШЕНИЯ v.47' });
  }

  // ---------- архив: главы и абзацы ----------
  let units = [], visible = 0, finalFired = false;
  function chapterUnits(i) { const out = []; let sep = false; for (const p of BOOK[i].p) { if (p === '---') { sep = true; continue; } out.push({ sep, text: p }); sep = false; } return out; }
  function paraBody(i, k, text) {
    const st = chStatus(i);
    if (st === 'ok' || G.story.stage === 'after' && st !== 'dmg') return paraHTML(text);
    return damagedHTML(text, st === 'dist' ? 'dist' : 'dmg', i * 1000 + k);
  }
  function footer(i) {
    const f = $('#chFoot');
    if (i < N_CH - 1) {
      const n = i + 1;
      f.innerHTML = isLocked(n)
        ? `<p class="note">Глава ${n + 1} · «${esc(chTitle(n))}» · заперта<br>НОРМА РАСХОДА ПЛОТИ НЕ ДОСТИГНУТА</p><button class="btn btn-primary pulse" data-go="${n}">ОТКРЫТЬ ГЛАВУ ${n + 1}</button>`
        : `<p class="note">Дальше — глава ${n + 1}${chStatus(n) ? '' : ' · фрагмент не восстановлен'}</p><button class="btn btn-primary" data-go="${n}">«${esc(chTitle(n))}» →</button>`;
    } else f.innerHTML = '<p class="note">Конец архива. Дальше — без счёта.</p>';
  }
  function renderChapter(i) {
    const st = chStatus(i), gm = GAMES[i];
    units = chapterUnits(i);
    const cls = st === 'ok' ? '' : st === 'dist' ? 'dist' : 'dmg';
    const banner = st && st !== 'ok' ? `<div class="rd-restore"><span>${st === 'dist' ? 'ЗАПИСЬ ИСКАЖЕНА: НЕЙРОСЛЕПОК РАСХОДИТСЯ С АРХИВОМ.' : 'ЗАПИСЬ ПОВРЕЖДЕНА: ЧАСТЬ СЛОВ УТЕРЯНА.'} Мини-игра «${esc(gm ? gm.name : '')}».</span><button class="btn btn-sm btn-amber" data-restore="${i}">ВОССТАНОВИТЬ ЗАНОВО</button></div>` : '';
    art.innerHTML = `<header class="ch-head"><p class="ch-num">ГЛАВА ${i + 1}</p><h2 class="ch-title" id="chTitle">${esc(chTitle(i))}</h2>
      <div class="ch-status">${st ? `<span class="chip ${st}">${STATUS_LABEL[st]}</span>` : ''}<span class="chip none">ФРАГМЕНТ: ${esc(gm ? gm.name.toUpperCase() : '')}</span></div></header>${banner}
      <div class="ch-text ${cls}">${units.map((u, k) => `<div class="para" data-k="${k}" hidden>${u.sep ? '<p class="sep" aria-hidden="true">— — —</p>' : ''}<p>${paraBody(i, k, u.text)}</p></div>`).join('')}</div>
      <p class="rd-tap" id="rdTap">▼ нажми на текст — следующий абзац</p>
      <footer class="ch-foot" id="chFoot" hidden></footer>`;
    footer(i);
    $('#rdInd').textContent = `ГЛ. ${i + 1} / ${N_CH} · ${chTitle(i)} · ПРОЧИТАНО ${readCount()}/${N_CH}`;
    $('#rdPrev').disabled = i === 0; $('#rdNext').disabled = i === N_CH - 1;
  }
  function setVisible(n, { scroll = true } = {}) {
    const prev = visible;
    visible = clamp(n, 0, units.length);
    const paras = $$('.para', art);
    paras.forEach((p, k) => { p.hidden = k >= visible; p.classList.remove('new'); });
    if (visible === prev + 1 && paras[visible - 1]) paras[visible - 1].classList.add('new');
    const all = visible >= units.length;
    $('#paraCount').textContent = visible; $('#paraTotal').textContent = units.length;
    $('#paraPrev').disabled = visible <= 0; $('#paraNext').disabled = all; $('#paraAll').disabled = all;
    $('#chFoot').hidden = !all; $('#rdTap').hidden = all;
    if (scroll && visible > prev && paras[visible - 1]) paras[visible - 1].scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
    updateProgress();
    if (all && R.chapter === N_CH - 1 && S.stage === 'final') finalShot();
  }
  function updateProgress() {
    const max = main.scrollHeight - main.clientHeight;
    $('#rdProgress').style.width = `${units.length ? (visible / units.length) * 100 : 0}%`;
    void max;
  }
  function markRead(i) {
    const c = chState(i);
    if (c.read) return;
    c.read = 1; Save.put();
    FX.setLevel(agingLevel()); A.setIntensity(agingLevel());
    log(`Блокнот: страница ${i + 1}`, 'dim');
    if (readCount() <= 47) log(`На стене: фото №${Math.min(47, readCount())}`, 'dim');
  }
  let opening = false;
  /** открыть главу; нетронутая — сначала восстановление (мини-игра) */
  async function openChapter(i, { first = false, force = false } = {}) {
    if (i < 0 || i >= N_CH || ctx.phase === 'dying' || opening) return;
    if (isLocked(i)) { lockedChapter(i); return; }
    if (!chStatus(i) || force) {
      opening = true;
      await Fragment.play(i);
      opening = false;
      if (!scope.alive) return;
      if (!chStatus(i)) {                     // отказались, а глава так и осталась нетронутой
        if (!art.textContent.trim()) closeReaderToTerminal();
        stats();
        return;
      }
      if (G.wear >= 100) { await carrierBreak(); if (!scope.alive) return; }
      FX.setLevel(agingLevel());
      if (ctx.phase !== 'reader') { ctx.phase = 'reader'; ui.inert = true; rd.hidden = false; setSub('reader'); }
    }
    if (!first && i !== R.chapter) A.sfx.page();
    const wasRead = chState(i).read;
    R.chapter = i;
    markRead(i);
    renderChapter(i);
    visible = 0;
    setVisible(wasRead ? units.length : 1, { scroll: false });
    main.scrollTop = 0;
    Save.put();
    ctx.hud && ctx.hud();
  }
  function openReader(i, { direct = false } = {}) {
    if (!Number.isInteger(i) || i < 0 || i >= N_CH) i = 0;
    if (isLocked(i)) i = LOCK_FROM - 1;
    ctx.phase = 'reader'; ui.inert = true; rd.hidden = false;
    rd.classList.toggle('instant', direct); rd.classList.remove('shot');
    if (!direct) A.sfx.whoosh(0.1);
    setSub('reader');
    if (!chStatus(i)) { art.innerHTML = ''; }
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

  // ---------- глава 47 заперта ----------
  function lockedChapter(i) {
    A.sfx.error(); A.sfx.glitch(1.4); FX.bump(0.3); FX.chroma(300);
    $('#damageCode').innerHTML = `ERR_0x47 // ГЛАВА ${i + 1} // НОРМА РАСХОДА ПЛОТИ НЕ ДОСТИГНУТА<br><br>Прочитано глав: ${readCount()} из ${LOCK_FROM}. Непрочитанное останется в архиве.`;
    Modal.open($('#damageModal'), { closable: false, focus: '#damageOk' });
  }
  scope.on($('#damageOk'), 'click', () => { A.sfx.click(); Modal.close($('#damageModal'), true); if (S.cracked) { closeReaderToTerminal(); return; } strikePhase(); });
  function closeReaderToTerminal() { rd.hidden = true; ui.inert = false; ctx.phase = 'terminal'; stats(); }
  let strikes = [];
  function strikePhase() {
    ctx.phase = 'hits'; rd.hidden = true; ui.inert = false;
    showPanel('main'); $('#termActions').hidden = true;
    strikes = [];
    $('#hitPrompt').hidden = false; $('#hitCount').textContent = '0 / 3';
    log('ЭКРАН НЕ ОТВЕЧАЕТ', 'err'); A.sfx.glitch(1.2);
  }
  function strike(x, y) {
    if (ctx.phase !== 'hits' || strikes.length >= 3) return;
    strikes.push([clamp(x, 0.06, 0.94), clamp(y, 0.08, 0.92)]);
    const n = strikes.length;
    A.sfx.thud(1); A.sfx.crack();
    FX.hit('#ffffff', true);
    drawCracks(strikes); ui.classList.add('cracked');
    $('#hitCount').textContent = `${n} / 3`;
    log(n < 3 ? 'СБОЙ ЭКРАНА' : 'НОСИТЕЛЬ ПОВРЕЖДЁН', 'err');
    if (n === 3) finishStrikes();
  }
  async function finishStrikes() {
    ctx.phase = 'hits-done';
    S.hits = strikes.slice(); S.cracked = true; S.stage = 'damaged'; Save.put();
    await scope.wait(900);
    $('#hitPrompt').hidden = true; A.sfx.glitch(1.8); log('Аварийный выход', 'err');
    await scope.wait(1100);
    exitTerminal({ auto: true });
  }
  scope.on(ui, 'pointerdown', e => { if (ctx.phase !== 'hits' || e.target.closest('button')) return; const r = ui.getBoundingClientRect(); strike((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });

  // ---------- финал: дочитали — выстрел в спину ----------
  async function finalShot() {
    if (finalFired) return;
    finalFired = true; ctx.phase = 'dying';
    await scope.wait(3200);
    A.sfx.steps(3, 1.6, 0.2);
    await scope.wait(1900);
    A.sfx.whisper(1.1, 0.14);
    await scope.wait(900);
    A.setAmbient(null, 0.2); A.sfx.shot(0.9);
    FX.flash('#ffffff', 90, 1); scope.timeout(() => FX.flash('#990000', 500, 0.8), 100);
    FX.shake('lg'); FX.vibrate([120, 40, 200]); FX.chroma(900); FX.addBlood(4);
    rd.classList.add('shot');
    await scope.wait(1700);
    startAct('awake', { flash: '#000000' });
  }

  // ---------- оглавление ----------
  function openToc() {
    const list = $('#tocList');
    list.innerHTML = BOOK.map((ch, i) => {
      const locked = isLocked(i), st = chStatus(i), cur = i === R.chapter, gm = GAMES[i];
      const chip = locked ? '<span class="chip lock">ЗАПЕРТА</span>' : st ? `<span class="chip ${st}">${STATUS_LABEL[st]}</span>` : '<span class="chip none">НЕ ТРОНУТА</span>';
      return `<li><button class="toc-item${cur ? ' current' : ''}${locked ? ' locked' : ''}" data-go="${i}" aria-label="Глава ${i + 1}. ${esc(chTitle(i))}. ${locked ? 'Заперта' : st ? STATUS_LABEL[st] : 'Не тронута'}"${cur ? ' aria-current="true"' : ''}>
        <span class="n">${i + 1}</span><span class="t">${esc(chTitle(i))}<span class="g">${esc(gm ? gm.name : '')}${G.ch[i] && G.ch[i].read ? ' · прочитана' : ''}</span></span>${chip}</button></li>`;
    }).join('');
    Modal.open($('#tocModal'), { focus: '.toc-item.current' });
    const cur = $('.toc-item.current', list); if (cur) cur.scrollIntoView({ block: 'center' });
  }
  scope.on($('#tocList'), 'click', e => { const b = e.target.closest('[data-go]'); if (!b || actName !== 'room') return; A.sfx.click(); Modal.close($('#tocModal'), true); openChapter(+b.dataset.go); });

  // ---------- кнопки ----------
  const nav = (sel, fn) => scope.on($(sel), 'click', e => { e.stopPropagation(); if (ctx.phase === 'dying' || opening) return; A.sfx.click(); fn(); });
  nav('#termRead', requestArchive);
  nav('#termNb', () => NotebookUI.open(R.chapter));
  nav('#termExit', () => exitTerminal());
  nav('#rdPrev', () => openChapter(R.chapter - 1));
  nav('#rdNext', () => openChapter(R.chapter + 1));
  nav('#rdToc', openToc);
  nav('#rdNb', () => NotebookUI.open(R.chapter));
  nav('#rdClose', closeReader);
  nav('#paraPrev', () => setVisible(visible - 1, { scroll: false }));
  nav('#paraNext', () => setVisible(visible + 1));
  nav('#paraAll', () => setVisible(units.length, { scroll: false }));
  scope.on(art, 'click', e => {
    if (ctx.phase === 'dying' || opening) return;
    const re = e.target.closest('[data-restore]');
    if (re) { A.sfx.click(); openChapter(+re.dataset.restore, { force: true }); return; }
    const go = e.target.closest('[data-go]');
    if (go) { A.sfx.click(); openChapter(+go.dataset.go); return; }
    if (visible < units.length && !String(window.getSelection() || '')) { A.sfx.key(); setVisible(visible + 1); }
  });
  scope.on(main, 'scroll', updateProgress, { passive: true });
  scope.on(document, 'keydown', e => {
    if (Modal.isOpen() || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey || stageOpen() || opening) return;
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
      if (e.key === 'Escape') { e.preventDefault(); A.sfx.click(); exitTerminal(); }
      return;
    }
    if (ctx.phase !== 'reader') return;
    switch (e.code) {
      case 'ArrowLeft': e.preventDefault(); openChapter(R.chapter - 1); break;
      case 'ArrowRight': e.preventDefault(); openChapter(R.chapter + 1); break;
      case 'ArrowDown': case 'Space': case 'Enter':
        if (onBtn && e.code !== 'ArrowDown') return;
        if (visible < units.length) { e.preventDefault(); A.sfx.key(); setVisible(visible + 1); }
        break;
      case 'KeyT': e.preventDefault(); openToc(); break;
      case 'KeyN': e.preventDefault(); NotebookUI.open(R.chapter); break;
      case 'KeyA': e.preventDefault(); setVisible(units.length, { scroll: false }); break;
      case 'Escape': e.preventDefault(); A.sfx.click(); closeReader(); break;
    }
  });
}
