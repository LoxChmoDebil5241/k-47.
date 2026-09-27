/* ==========================================================================
   ТОЧКА ВХОДА: настройки, блокнот, звук по первому жесту, ресайз,
   заставка. Горячие клавиши: P — пауза, M — звук.
   ========================================================================== */
(function boot() {
  Notebook.load();
  Save.load();
  applySettings();
  document.addEventListener('keydown', e => {
    if (e.code === 'KeyM' && !isTyping(e) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      A.unlock(); Settings.sound = !Settings.sound; Settings.save(); applySettings();
      toast(Settings.sound ? 'ЗВУК ВКЛЮЧЁН' : 'ЗВУК ВЫКЛЮЧЕН');
    }
  });
  ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => A.unlock(), { capture: true }));
  let rz = 0;
  const onResize = () => { clearTimeout(rz); rz = setTimeout(() => window.dispatchEvent(new Event('k47:resize')), 120); };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  // вкладка скрыта — ставим на паузу (не для заставки)
  document.addEventListener('visibilitychange', () => { if (document.hidden && actName && !Game.paused && !Modal.isOpen() && !$('#menuBtn').hidden) Menu.open(); });
  window.addEventListener('pagehide', () => { if (actName && actName !== 'read') Save.put(); Notebook.save(); });
  showBoot();
  // для проверки из консоли: __k47.play(номер главы 0–48)
  window.__k47 = { G, GAMES, play: i => Fragment.play(i), run: i => Fragment.run(i), startAct, Save, Settings, BOOK };
})();
