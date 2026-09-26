/* ==========================================================================
   ТОЧКА ВХОДА: заставка при каждом заходе, продолжение сохранения, звук, ресайз.
   ========================================================================== */
const bootEl = $('#boot');

/**
 * Заставка — при каждом заходе. Впервые (или после смерти) — только название:
 * клик / тап / любая клавиша начинают игру. Если есть сохранение — «Продолжить» и «Начать сначала».
 */
function showBoot() {
  const hasSave = Save.hasProgress();
  Menu.setAvailable(false);
  const actions = $('#bootActions');
  bootEl.hidden = false;
  bootEl.classList.remove('gone');
  bootEl.classList.toggle('saved', hasSave);
  bootEl.setAttribute('role', hasSave ? 'dialog' : 'button');
  actions.hidden = !hasSave;
  void bootEl.offsetWidth;
  bootEl.classList.add('on');
  let started = false;
  const cleanup = () => { bootEl.removeEventListener('pointerdown', any); document.removeEventListener('keydown', any); };
  const go = (fresh) => { if (started) return; started = true; cleanup(); begin(fresh); };
  function any(e) {
    if (hasSave) return;
    if (e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift' || /^F\d+$/.test(e.key) || e.code === 'KeyM' || e.ctrlKey || e.metaKey || e.altKey)) return;
    if (e.type === 'pointerdown' && e.target.closest('#menuBtn')) return;
    e.preventDefault();
    go(true);
  }
  $('#bootContinue').onclick = () => go(false);
  $('#bootRestart').onclick = async () => {
    Audio47.unlock(); Audio47.sfx.click();
    const ok = await askConfirm('НАЧАТЬ СНАЧАЛА?', 'Прогресс цикла будет стёрт. Свои записи в блокноте останутся.', 'Сначала', 'Отмена');
    if (ok) go(true);
  };
  bootEl.addEventListener('pointerdown', any);
  document.addEventListener('keydown', any);
  requestAnimationFrame(() => (hasSave ? $('#bootContinue') : bootEl).focus({ preventScroll: true }));
}

function begin(fresh) {
  Audio47.unlock(); Audio47.sfx.whoosh(1.2);
  bootEl.classList.add('gone');
  setTimeout(() => { bootEl.hidden = true; bootEl.classList.remove('on'); }, 1000);
  if (fresh) Save.wipe();
  const saved = Save.load();
  Menu.setAvailable(true);
  if (!saved) { startAct('contract'); return; }
  if (saved.act === 'read') { startAct('read', { resume: true }); return; }
  const act = saved.act === 'contract' || !saved.signed ? 'contract' : 'room';   // старые сохранения тоже ведут в комнату
  startAct(act, { resume: true, mode: act === 'room' ? saved.sub : undefined });
}

(function boot() {
  Save.load();

  // ---------- настройки (звук, эффекты экрана); M — быстро выключить звук ----------
  Settings.apply();
  document.addEventListener('keydown', e => {
    if (e.code === 'KeyM' && !isTyping(e) && !e.ctrlKey && !e.metaKey && !e.altKey) { Audio47.unlock(); Settings.set('sound', !Settings.sound); Menu.toast(Settings.sound ? 'ЗВУК ВКЛЮЧЁН' : 'ЗВУК ВЫКЛЮЧЕН'); }
  });
  // первый любой жест разблокирует аудио (политика автозапуска браузеров)
  ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => Audio47.unlock(), { once: true, capture: true }));

  // ---------- ресайз / поворот экрана ----------
  let rz = 0;
  const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { FX.resize(); window.dispatchEvent(new Event('k47:resize')); }, 120); };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  
  showBoot();
})();
