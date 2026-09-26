/* ==========================================================================
   ПАУЗА И НАСТРОЙКИ — кнопка «⋯» вместо кнопки звука.
   ПРОДОЛЖИТЬ · СОХРАНИТЬ ПРОГРЕСС · НАСТРОЙКИ · ЗАКОНЧИТЬ ЦИКЛ · ВЫЙТИ
   Настройки: эффекты экрана, звук, режим чтения (только текст книги).
   На паузе замирают игровые часы (таймеры сцен), кадры, анимации и звук.
   ========================================================================== */
const Settings = {
  fx: Store.get(KEYS.fx, true) !== false,
  sound: Store.get(KEYS.audio, true) !== false,
  apply() {
    document.body.classList.toggle('no-fx', !this.fx);
    Audio47.setEnabled(this.sound);
    GameState.audioOn = this.sound;
  },
  set(key, v) { this[key] = !!v; Store.set(key === 'fx' ? KEYS.fx : KEYS.audio, this[key]); this.apply(); },
};

const Game = {
  paused: false,
  pause() { if (this.paused) return; this.paused = true; Clock.setPaused(true); Audio47.hold(true); document.body.classList.add('paused'); },
  resume() { if (!this.paused) return; this.paused = false; Clock.setPaused(false); Audio47.hold(false); document.body.classList.remove('paused'); },
};

const Menu = (() => {
  const btn = $('#menuBtn'), menu = $('#pauseMenu'), settings = $('#settingsMenu'), toastEl = $('#toast');
  let toastT = 0;
  function toast(text) {
    toastEl.textContent = text; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  function renderSettings() {
    $('#setFx').textContent = Settings.fx ? 'ВКЛ' : 'ВЫКЛ';
    $('#setFx').setAttribute('aria-pressed', String(Settings.fx));
    $('#setSound').textContent = Settings.sound ? 'ВКЛ' : 'ВЫКЛ';
    $('#setSound').setAttribute('aria-pressed', String(Settings.sound));
    $('#setRead').textContent = GameState.readMode ? 'ВЕРНУТЬСЯ В ИГРУ' : 'РЕЖИМ ЧТЕНИЯ';
  }
  function open() {
    if (menu.hidden === false || btn.hidden) return;
    Game.pause();
    $('#pmEnd').hidden = GameState.readMode;
    $('#pmSave').hidden = false;
    Modal.open(menu, { onClose: () => Game.resume(), focus: '#pmContinue' });
  }
  function closeAll() { Modal.closeAll(); Game.resume(); }
  function saveAll() {
    Save.progress(); Save.chapters(); Save.clicks(); Save.choices(); Save.notebook();
    toast('ПРОГРЕСС СОХРАНЁН');
  }

  btn.addEventListener('click', () => { Audio47.unlock(); open(); });
  document.addEventListener('keydown', e => {
    if (e.code === 'KeyP' && !isTyping(e) && !e.ctrlKey && !e.metaKey && !e.altKey && !btn.hidden) {
      e.preventDefault();
      if (!menu.hidden) Modal.close(menu); else if (!Modal.isOpen()) open();
    }
  });
  $('#pmContinue').addEventListener('click', () => { Audio47.sfx.click(); Modal.close(menu); });
  $('#pmSave').addEventListener('click', () => { saveAll(); });
  $('#pmSettings').addEventListener('click', () => { renderSettings(); Modal.open(settings, { focus: '#setFx' }); });
  $('#pmExit').addEventListener('click', () => { saveAll(); closeAll(); leaveToBoot(); });
  $('#pmEnd').addEventListener('click', async () => {
    const ok = await askConfirm('ЗАКОНЧИТЬ ЦИКЛ?', 'Все данные будут стёрты: прочитанные главы, клики, ответы, записи в блокноте. Игра начнётся с нуля.', 'Закончить', 'Отмена');
    if (!ok) return;
    closeAll();
    shootPlayer({ all: true });
  });
  $('#setFx').addEventListener('click', () => { Settings.set('fx', !Settings.fx); renderSettings(); });
  $('#setSound').addEventListener('click', () => { Settings.set('sound', !Settings.sound); renderSettings(); Audio47.sfx.click(); });
  $('#setRead').addEventListener('click', async () => {
    if (!GameState.readMode) {
      const ok = await askConfirm('РЕЖИМ ЧТЕНИЯ', 'Только текст книги, без игры. Если вы перейдёте в режим чтения и решите вернуться в игровой — вы начнёте с начала.', 'Перейти', 'Отмена');
      if (!ok) return;
      closeAll();
      Save.wipe();
      GameState.readMode = true;
      startAct('read', { fast: true });
    } else {
      const ok = await askConfirm('ИГРОВОЙ РЕЖИМ', 'Вернуться в игру? Цикл начнётся с самого начала.', 'Вернуться', 'Отмена');
      if (!ok) return;
      closeAll();
      Save.wipe();
      startAct('contract', { flash: '#88ddff' });
    }
  });
  return {
    open, toast,
    /** кнопка «⋯» доступна в игре, но не на заставке */
    setAvailable(on) { btn.hidden = !on; },
  };
})();
