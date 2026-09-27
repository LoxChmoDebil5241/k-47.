/* ==========================================================================
   ЗАСТАВКА (реф. 3): красный визор, семь силуэтов, пиксельный кремовый
   заголовок «К-47 / НОРМЫ РАСХОДА ПЛОТИ / ЦИКЛ-48.», внизу — «-и дальше без счёта».
   Первый заход — только название: любой клик/клавиша начинают игру.
   Если есть сохранение — «Продолжить», «Начать сначала», «Режим чтения».
   ========================================================================== */
const Boot = (() => {
  const el = $('#boot'), cv = $('#bootCv'), g = cv.getContext('2d');
  let running = false, t = 0, W = 0, H = 0, dpr = 1;
  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  function draw(dt) {
    t += dt;
    if (cv.width !== Math.round(window.innerWidth * dpr)) fit();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sp = Art.splash(g, W, H, t, { flicker: REDUCED ? 0 : 1 });
    const k = Math.min(1, sp.s / 560);
    const ty = sp.cy - sp.s * 0.43, px = Math.max(2, Math.round(3 * k));
    const a = Math.min(1, t / 1.6);
    const cream = '#efe6cf';
    Art.pixText(g, 'К-47', W / 2, ty, 26 * k, { px, color: cream, alpha: a });
    Art.pixText(g, 'НОРМЫ РАСХОДА ПЛОТИ', W / 2, ty + 32 * k, 31 * k, { px, color: cream, alpha: a, spacing: 0.2 });
    Art.pixText(g, 'ЦИКЛ-48.', W / 2, ty + 62 * k, 26 * k, { px, color: cream, alpha: a });
    const b = Math.min(1, Math.max(0, (t - 1.8) / 1.4));
    Art.pixText(g, '-и дальше без счёта', W / 2, sp.vcy + sp.vs * 0.33, 19 * k, { px: Math.max(1, px - 1), font: MONO, weight: 400, spacing: 0.55, color: cream, alpha: b * (0.75 + 0.25 * Math.sin(t * 1.4)) });
    Art.scan(g, W, H, 0.16);
  }
  function start() { if (running) return; running = true; t = 0; fit(); Loop.add('boot', draw); }
  function stop() { running = false; Loop.remove('boot'); }
  return { el, start, stop };
})();

function showBoot() {
  const hasSave = Save.has();
  Menu.setAvailable(false);
  const el = Boot.el, actions = $('#bootActions');
  el.hidden = false; el.classList.remove('gone');
  actions.hidden = !hasSave;
  $('#bootHint').hidden = hasSave;
  $('#bootMeta').textContent = hasSave ? `СОХРАНЁН ЦИКЛ · ПРОЧИТАНО ${readCount()}/${N_CH} · ВОССТАНОВЛЕНО ${countSt('ok')}` : (G.endings ? `ЦИКЛОВ ЗАВЕРШЕНО: ${G.endings}` : '');
  el.setAttribute('role', hasSave ? 'dialog' : 'button');
  Boot.start();
  A.setAmbient(null);
  let started = false;
  const cleanup = () => { el.removeEventListener('pointerdown', any); document.removeEventListener('keydown', any); };
  const go = mode => { if (started) return; started = true; cleanup(); begin(mode); };
  function any(e) {
    if (hasSave || !el.contains(e.target) && e.type === 'pointerdown') return;
    if (e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift' || /^F\d+$/.test(e.key) || e.code === 'KeyM' || e.ctrlKey || e.metaKey || e.altKey)) return;
    e.preventDefault();
    go('fresh');
  }
  $('#bootContinue').onclick = () => { A.unlock(); A.sfx.click(); go('continue'); };
  $('#bootRestart').onclick = async () => {
    A.unlock(); A.sfx.click();
    if (await askConfirm('НАЧАТЬ СНАЧАЛА?', 'Прогресс цикла будет стёрт. Свои записи в блокноте и остаточные данные останутся.', 'СНАЧАЛА', 'ОТМЕНА')) go('fresh');
  };
  $('#bootRead').onclick = () => { A.unlock(); A.sfx.click(); go('read'); };
  el.addEventListener('pointerdown', any);
  document.addEventListener('keydown', any);
  requestAnimationFrame(() => (hasSave ? $('#bootContinue') : el).focus({ preventScroll: true }));
}

function begin(mode) {
  A.unlock(); A.sfx.whoosh(0.2);
  Boot.el.classList.add('gone');
  setTimeout(() => { Boot.el.hidden = true; Boot.stop(); }, 1000);
  Menu.setAvailable(true);
  if (mode === 'read') { startAct('read', { fast: true }); return; }
  if (mode === 'fresh') { Save.wipe(); startAct('contract'); return; }
  Save.load();
  const act = !G.signed ? 'contract' : 'room';
  startAct(act, { resume: true, mode: act === 'room' ? G.sub : undefined });
}
