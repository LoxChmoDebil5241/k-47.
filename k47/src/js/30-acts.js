/* ==========================================================================
   ПЕРЕХОДЫ МЕЖДУ СЦЕНАМИ: единая точка входа startAct(name, opts)
   Игра идёт линейно: бланк → комната и терминал (вся история) → пробуждение в капсуле.
   Каждая сцена: Acts[name].enter(scope, opts). Всё, что сцена создаёт
   (таймеры, слушатели, тикеры, WebGL), регистрируется в scope и снимается
   при уходе. Переход: вспышка → затемнение (opacity) → смена → проявление.
   ========================================================================== */
const Acts = {};
const ACT_ROOTS = { contract: '#act-contract', room: '#act-room', awake: '#act-awake', psych: '#act-psych', read: '#act-read' };
let actScope = null;
let actBusy = false;

/**
 * @param {string} name   сцена
 * @param {object} opts   flash — цвет вспышки; overlay — оставить предыдущую сцену видимой (inert) под новой;
 *                        fast — короткое затемнение; остальное передаётся в enter()
 */
async function startAct(name, opts = {}) {
  if (actBusy || !Acts[name]) return false;
  actBusy = true;
  const prev = GameState.act;
  const curtain = $('#curtain');
  if (opts.flash) FX.flash(opts.flash, 800, 0.85);
  Modal.closeAll();
  if (opts.overlay) await wait(220);
  else { curtain.classList.add('on'); await wait(opts.fast ? 380 : 950); }

  if (actScope) actScope.dispose();
  for (const [key, sel] of Object.entries(ACT_ROOTS)) {
    const root = $(sel);
    if (key === name) { root.hidden = false; root.inert = false; }
    else if (opts.overlay && key === prev) { root.hidden = false; root.inert = true; }
    else { root.hidden = true; root.inert = false; }
  }
  GameState.act = name;
  GameState.sub = opts.sub ?? null;
  const scope = actScope = new Scope(name);
  // сцена может сама сказать «готова» (scope.ready()) и дальше играть сценарий,
  // не держа занавес; иначе ждём конца enter(), но не дольше 10 с
  let markReady;
  const ready = new Promise(r => { markReady = r; });
  scope.ready = () => markReady();
  const entering = (async () => {
    try { await Acts[name].enter(scope, opts); }
    catch (e) { console.error(`[scene:${name}]`, e); }
  })();
  await Promise.race([entering, ready, wait(10000)]);
  Save.progress();
  curtain.classList.remove('on');
  setTimeout(() => { actBusy = false; }, opts.overlay ? 120 : 420);
  return true;
}

function setSub(sub) { GameState.sub = sub; Save.progress(); }

/**
 * Уйти на заставку: затемнение, сцена снимается. wipe — стереть прогресс
 * (смерть, отказ, «закончить цикл»); без wipe — просто выйти, сохранение остаётся.
 */
async function leaveToBoot({ wipe = false, all = false } = {}) {
  if (actBusy) return;
  actBusy = true;
  const curtain = $('#curtain');
  curtain.classList.add('on');
  Audio47.setAmbient(null, 1.2);
  await wait(1300);
  Modal.closeAll();
  Game.resume();
  if (actScope) { actScope.dispose(); actScope = null; }
  Object.values(ACT_ROOTS).forEach(sel => { const r = $(sel); r.hidden = true; r.inert = false; });
  $('#deathFreeze').classList.remove('on');
  if (wipe) Save.wipe({ all });
  FX.setLevel(0, { instant: true });
  FX.clearBlood();
  showBoot();
  curtain.classList.remove('on');
  actBusy = false;
}
/** смерть или отказ: прогресс стирается — снова заставка, с самого начала */
let wipeAllNext = false;   // «Закончить цикл»: стереть вообще всё, включая блокнот
const resetToBoot = () => { const all = wipeAllNext; wipeAllNext = false; return leaveToBoot({ wipe: true, all }); };

/** выстрел в игрока (из меню «Закончить цикл» и там, где нет своей сцены смерти) */
async function shootPlayer({ all = false } = {}) {
  const room = Acts.room && Acts.room.ctx;
  if (all) wipeAllNext = true;
  if (GameState.act === 'room' && room && !room.dead) { room.die({ muzzle: false }); return; }
  Audio47.sfx.shot();
  FX.flash('#fff2cc', 90, 0.95); setTimeout(() => FX.flash('#ff2200', 260, 0.6), 110);
  FX.shake('lg'); FX.vibrate([60, 40, 90, 30, 120]);
  await wait(380);
  $('#deathFreeze').classList.add('on');
  Audio47.sfx.glitch(3);
  await wait(2400);
  resetToBoot();
}

/** не перехватывать клавиши, пока пользователь печатает */
const isTyping = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
