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
  // старый сервис-воркер OBJ-4471 отдавал всё из кэша — снимаем его, чтобы не подсовывал устаревшие файлы
  try {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => { const w = r.active || r.waiting || r.installing; if (w && /\/sw\.js$/.test(w.scriptURL)) r.unregister(); })).catch(() => {});
      if (window.caches) caches.keys().then(ks => ks.filter(k => k.startsWith('obj4471')).forEach(k => caches.delete(k))).catch(() => {});
    }
  } catch { /* */ }
  showBoot();
  // для проверки из консоли: __k47.play(номер главы 0–48)
  window.__k47 = { get G() { return G; }, GAMES, play: i => Fragment.play(i), run: i => Fragment.run(i), startAct, Save, Settings, BOOK };
})();
