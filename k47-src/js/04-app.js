/* ==========================================================================
   СЦЕНЫ И ПЕРЕХОДЫ: startAct(name, opts) — единая точка входа.
   Линия: заставка → бланк → комната/терминал/архив (49 глав + мини-игры)
   → норма → проём → последние главы → выстрел → капсула → слова →
   кабинет психолога → тьма. Всё, что сцена создаёт, живёт в её Scope.
   ========================================================================== */
const Acts = {};
const ACT_ROOTS = { contract: '#act-contract', room: '#act-room', awake: '#act-awake', psych: '#act-psych', end: '#act-end', read: '#act-read' };
let actScope = null, actBusy = false, actName = null;

async function startAct(name, opts = {}) {
  if (actBusy || !Acts[name]) return false;
  actBusy = true;
  const curtain = $('#curtain');
  if (opts.flash) FX.flash(opts.flash, 800, 0.85);
  Modal.closeAll();
  curtain.classList.add('on');
  await wait(opts.fast ? 380 : 900);
  if (actScope) actScope.dispose();
  for (const [key, sel] of Object.entries(ACT_ROOTS)) $(sel).hidden = key !== name;
  $('#boot').hidden = true;
  actName = name;
  G.act = name === 'awake' || name === 'psych' || name === 'end' ? G.act : name;
  if (name !== 'read') Save.put();
  const scope = actScope = new Scope(name);
  let markReady;
  const ready = new Promise(r => { markReady = r; });
  scope.ready = () => markReady();
  const entering = (async () => { try { await Acts[name].enter(scope, opts); } catch (e) { console.error(`[scene:${name}]`, e); } })();
  await Promise.race([entering, ready, wait(10000)]);
  curtain.classList.remove('on');
  setTimeout(() => { actBusy = false; }, 420);
  return true;
}
function setSub(sub) { G.sub = sub; Save.put(true); }

/** на заставку; wipe — стереть цикл */
async function leaveToBoot({ wipe = false, all = false } = {}) {
  if (actBusy) return;
  actBusy = true;
  $('#curtain').classList.add('on');
  A.setAmbient(null, 1.2);
  await wait(1200);
  Modal.closeAll(); Game.resume();
  if (actScope) { actScope.dispose(); actScope = null; }
  actName = null;
  Object.values(ACT_ROOTS).forEach(sel => { $(sel).hidden = true; });
  $('#death').hidden = true;
  if (wipe) Save.wipe({ all });
  FX.setLevel(0, { instant: true }); FX.clearBlood();
  actBusy = false;
  showBoot();
  $('#curtain').classList.remove('on');
}

/** «старение» экрана носителя: прочитанное + износ + норма */
const agingLevel = () => clamp(readCount() * 0.007 + G.wear / 100 * 0.5 + (G.clicks >= CLICKS_NEEDED ? 0.18 : 0), 0, 1);

// ==========================================================================
//   ПАУЗА: замирают игровые часы, кадры, анимации и звук
// ==========================================================================
const Game = {
  paused: false,
  pause() { if (this.paused) return; this.paused = true; Clock.setPaused(true); A.hold(true); document.body.classList.add('paused'); },
  resume() { if (!this.paused) return; this.paused = false; Clock.setPaused(false); A.hold(false); document.body.classList.remove('paused'); },
};

function applySettings() {
  const b = document.body;
  b.classList.toggle('no-fx', !Settings.fx);
  b.classList.toggle('read-font-mono', Settings.font === 'mono');
  b.classList.toggle('read-s', Settings.size === 's');
  b.classList.toggle('read-l', Settings.size === 'l');
  A.setEnabled(Settings.sound);
}

let toastT = 0;
function toast(text, ms = 2200) {
  const el = $('#toast');
  el.textContent = text; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), ms);
}

// ==========================================================================
//   ИЗНОС НОСИТЕЛЯ И РЕЖИМЫ
//   СЮЖЕТ — износа нет; НОРМА — провалы и смерти изнашивают носитель;
//   ЖЁСТКИЙ — как в прототипе: любая смерть обрывает цикл целиком.
// ==========================================================================
const WEAR = { fail: { story: 0, norm: 6, hard: 10 }, death: { story: 0, norm: 10, hard: 0 }, restore: 3 };
function addWear(kind) {
  const v = (WEAR[kind] || {})[Settings.mode] || 0;
  G.wear = clamp(G.wear + v, 0, 100);
  Save.put();
  return v;
}
function healWear() { const before = G.wear; G.wear = clamp(G.wear - WEAR.restore, 0, 100); Save.put(); return before - G.wear; }

// ==========================================================================
//   СМЕРТЬ И РАЗРУШЕНИЕ НОСИТЕЛЯ — красный череп (реф. 5)
// ==========================================================================
const Death = (() => {
  const el = $('#death'), cv = $('#deathCv'), g = cv.getContext('2d');
  let run = false, t0 = 0;
  function draw(dt, now) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = window.innerWidth, H = window.innerHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = (now - t0) / 1000;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const s = Math.min(W * 0.62, H * 0.5) * (1 + Math.min(0.08, t * 0.01));
    Art.skull(g, W / 2 + (Math.random() < 0.05 ? rand(-6, 6) : 0), H * 0.36, s, { t });
    Art.scan(g, W, H, 0.3);
    Art.vignette(g, W, H, 0.9, '0,0,0', 0.25);
    if (Math.random() < 0.1) { g.fillStyle = 'rgba(255,0,40,.12)'; g.fillRect(0, Math.random() * H, W, rand(3, 20)); }
  }
  /**
   * @param {object} o  title, lines — текст; button — надпись; auto — мс до авто-продолжения
   * @returns {Promise<void>}
   */
  function show({ title = 'КЛОН УНИЧТОЖЕН', lines = '', button = 'ПОДЪЁМ', auto = 0 } = {}) {
    return new Promise(res => {
      Modal.closeAll();
      el.hidden = false; $('#deathT').textContent = title; $('#deathS').textContent = '';
      const btn = $('#deathOk'); btn.hidden = true; btn.textContent = button;
      t0 = performance.now();
      if (!run) { run = true; Loop.add('death', draw); }
      A.sfx.scare(); A.sfx.glitch(1.2); FX.chroma(600); FX.shake('lg');
      const L = String(lines).split('\n');
      let i = 0;
      const next = () => {
        if (i < L.length) { $('#deathS').textContent += (i ? '\n' : '') + L[i++]; A.sfx.beep(i % 2 ? 520 : 780, 0.05, 0.04); setTimeout(next, 520); return; }
        btn.hidden = false; btn.focus({ preventScroll: true });
        if (auto) setTimeout(finish, auto);
      };
      setTimeout(next, 900);
      let done = false;
      function finish() {
        if (done) return; done = true;
        btn.onclick = null; document.removeEventListener('keydown', key, true);
        el.hidden = true; run = false; Loop.remove('death');
        res();
      }
      const key = e => { if (!btn.hidden && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) { e.preventDefault(); e.stopPropagation(); A.sfx.click(); finish(); } };
      btn.onclick = () => { A.sfx.click(); finish(); };
      document.addEventListener('keydown', key, true);
    });
  }
  return { show };
})();

/** смерть «читателя» в комнате — по режиму: новая регенерация или обрыв цикла */
async function readerDeath(reason = '') {
  G.deaths++;
  if (Settings.mode === 'hard') {
    Save.put();
    await Death.show({ title: 'ЦИКЛ ПРЕРВАН', lines: `${reason}\nРЕЖИМ: ЖЁСТКИЙ\nНЕЙРОПРОФИЛЬ ЧИТАТЕЛЯ СТЁРТ\nВСЁ С САМОГО НАЧАЛА`, button: 'НАЧАТЬ ЗАНОВО' });
    Save.wipe(); showBootAfterDeath();
    return;
  }
  const w = addWear('death');
  await Death.show({
    title: 'ЧИТАТЕЛЬ УНИЧТОЖЕН',
    lines: `${reason}\nРЕГЕНЕРАЦИЯ БИОМАССЫ · 100%\nНЕЙРОПРОФИЛЬ ЧИТАТЕЛЯ ЗАГРУЖЕН\nСМЕРТЕЙ В ЦИКЛЕ: ${G.deaths}${w ? `\nИЗНОС НОСИТЕЛЯ +${w}% → ${G.wear}%` : ''}`,
  });
  if (G.wear >= 100) { await carrierBreak(); }
  startAct('room', { respawn: true, fast: true });
}
function showBootAfterDeath() {
  if (actScope) { actScope.dispose(); actScope = null; }
  Object.values(ACT_ROOTS).forEach(sel => { $(sel).hidden = true; });
  actName = null; actBusy = false;
  FX.setLevel(0, { instant: true }); FX.clearBlood();
  showBoot();
}
/** носитель разрушен: восстановленные записи утеряны (главы остаются, но повреждёнными) */
async function carrierBreak() {
  Object.values(G.ch).forEach(c => { if (c.st) c.st = 'dmg'; });
  G.notes = {}; G.wear = 0; G.cycle++;
  Save.put();
  await Death.show({ title: 'НОСИТЕЛЬ РАЗРУШЕН', lines: 'ИЗНОС 100%\nВСЕ ВОССТАНОВЛЕННЫЕ ЗАПИСИ УТЕРЯНЫ\nГЛАВЫ ОСТАЛИСЬ — ПОВРЕЖДЁННЫМИ\nНОВЫЙ НОСИТЕЛЬ ПОДКЛЮЧЁН', button: 'ПРОДОЛЖИТЬ' });
}

/** выстрел в игрока (из меню «Закончить цикл») */
async function shootAndWipe() {
  A.sfx.shot(); FX.flash('#fff2cc', 90, 0.95); setTimeout(() => FX.flash('#ff2200', 260, 0.6), 110); FX.shake('lg'); FX.vibrate([60, 40, 90, 30, 120]);
  await wait(500);
  await Death.show({ title: 'ЦИКЛ ЗАКОНЧЕН', lines: 'ПРОЧИТАННОЕ СТЁРТО\nВОССТАНОВЛЕННОЕ СТЁРТО\nЗАПИСИ В БЛОКНОТЕ СТЁРТЫ', button: 'НА ЗАСТАВКУ' });
  Save.wipe({ all: true }); showBootAfterDeath();
}

// ==========================================================================
//   МЕНЮ ПАУЗЫ И НАСТРОЙКИ — кнопка «⋯» или клавиша P
// ==========================================================================
const Menu = (() => {
  const btn = $('#menuBtn'), menu = $('#pauseMenu'), settings = $('#settingsMenu');
  const MODE_HINT = { story: 'износа нет, смерть не страшна', norm: 'провалы и смерти изнашивают носитель', hard: 'любая смерть — цикл с самого начала' };
  function renderSettings() {
    $('#setSound').textContent = Settings.sound ? 'ВКЛ' : 'ВЫКЛ'; $('#setSound').setAttribute('aria-pressed', String(Settings.sound));
    $('#setFx').textContent = Settings.fx ? 'ВКЛ' : 'ВЫКЛ'; $('#setFx').setAttribute('aria-pressed', String(Settings.fx));
    $('#setVol').value = Math.round(Settings.vol * 100);
    $$('#setMode button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === Settings.mode)));
    $$('#setFont button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === Settings.font)));
    $$('#setSize button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === Settings.size)));
    $('#setModeHint').textContent = MODE_HINT[Settings.mode];
    $('#setRead').textContent = actName === 'read' ? 'В ИГРУ' : 'ОТКРЫТЬ';
  }
  function open() {
    if (!menu.hidden || btn.hidden) return;
    Game.pause();
    $('#pmEnd').hidden = actName === 'read';
    $('#pmStats').hidden = actName === 'read';
    Modal.open(menu, { onClose: () => Game.resume(), focus: '#pmContinue' });
  }
  function closeAll() { Modal.closeAll(); Game.resume(); }
  function saveAll() { Save.put(); Notebook.save(); toast('ПРОГРЕСС СОХРАНЁН'); A.sfx.success(); }
  function stats() {
    const ok = countSt('ok'), dist = countSt('dist'), dmg = countSt('dmg');
    $('#stmGrid').innerHTML = [[readCount(), 'ПРОЧИТАНО'], [ok, 'ВОССТАНОВЛЕНО'], [dist, 'ИСКАЖЕНО'], [dmg, 'ПОВРЕЖДЕНО'], [`${G.wear}%`, 'ИЗНОС'], [G.deaths, 'СМЕРТЕЙ'], [`${G.clicks}/47`, 'НОРМА'], [G.cycle, 'НОСИТЕЛЬ']]
      .map(([v, l]) => `<div><b>${esc(v)}</b><span>${l}</span></div>`).join('');
    $('#stmList').innerHTML = BOOK.map((ch, i) => {
      const st = chStatus(i), c = G.ch[i];
      const chip = st ? `<span class="chip ${st}">${STATUS_LABEL[st]}</span>` : `<span class="chip ${i >= LOCK_FROM && !G.reader.unlocked ? 'lock' : 'none'}">${i >= LOCK_FROM && !G.reader.unlocked ? 'ЗАПЕРТА' : 'НЕ ТРОНУТА'}</span>`;
      return `<li><div class="toc-item" style="cursor:default"><span class="n">${i + 1}</span><span class="t">${esc(chTitle(i))}<span class="g">${esc(GAMES[i] ? GAMES[i].name : '')}${c && c.read ? ' · прочитана' : ''}</span></span>${chip}</div></li>`;
    }).join('');
    Modal.open($('#statsModal'));
  }

  btn.addEventListener('click', () => { A.unlock(); A.sfx.click(); open(); });
  document.addEventListener('keydown', e => {
    if (e.code === 'KeyP' && !isTyping(e) && !e.ctrlKey && !e.metaKey && !e.altKey && !btn.hidden && $('#stage').hidden === true) {
      e.preventDefault();
      if (!menu.hidden) Modal.close(menu); else if (!Modal.isOpen()) open();
    }
  });
  $('#pmContinue').addEventListener('click', () => { A.sfx.click(); Modal.close(menu); });
  $('#pmSave').addEventListener('click', saveAll);
  $('#pmStats').addEventListener('click', () => { A.sfx.click(); stats(); });
  $('#pmSettings').addEventListener('click', () => { A.sfx.click(); renderSettings(); Modal.open(settings, { focus: '#setSound' }); });
  $('#pmExit').addEventListener('click', () => { Save.put(); Notebook.save(); closeAll(); leaveToBoot(); });
  $('#pmEnd').addEventListener('click', async () => {
    const ok = await askConfirm('ЗАКОНЧИТЬ ЦИКЛ?', 'Всё будет стёрто: прочитанные главы, восстановленные фрагменты, норма, ответы, записи в блокноте. Игра начнётся с нуля.', 'ЗАКОНЧИТЬ', 'ОТМЕНА');
    if (!ok) return;
    closeAll();
    if (actScope) { actScope.dispose(); actScope = null; }
    shootAndWipe();
  });
  $('#setSound').addEventListener('click', () => { Settings.sound = !Settings.sound; Settings.save(); applySettings(); renderSettings(); A.sfx.click(); });
  $('#setFx').addEventListener('click', () => { Settings.fx = !Settings.fx; Settings.save(); applySettings(); renderSettings(); A.sfx.click(); });
  $('#setVol').addEventListener('input', e => { A.setVolume(+e.target.value / 100); });
  $('#setVol').addEventListener('change', () => A.sfx.beep(880, 0.08, 0.06));
  const seg = (sel, key) => $(sel).addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; Settings[key] = b.dataset.v; Settings.save(); applySettings(); renderSettings(); A.sfx.click(); });
  seg('#setMode', 'mode'); seg('#setFont', 'font'); seg('#setSize', 'size');
  $('#setRead').addEventListener('click', async () => {
    if (actName !== 'read') {
      const ok = await askConfirm('РЕЖИМ ЧТЕНИЯ', 'Только текст книги, все 49 глав открыты. Сохранение игры не пропадёт: вернуться можно с заставки.', 'ОТКРЫТЬ', 'ОТМЕНА');
      if (!ok) return;
      Save.put(); closeAll(); startAct('read', { fast: true });
    } else { closeAll(); leaveToBoot(); }
  });
  return { open, toast, setAvailable(on) { btn.hidden = !on; } };
})();
