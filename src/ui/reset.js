import { $ } from '../config.js';
import { SaveSystem } from '../core/save.js';
import { Audio } from '../core/audio.js';

const RESET_CODE = '474747';
let entered = '';

export function initReset() {
  const modal = $('resetModal');
  const input = $('resetInput');
  const digitView = $('resetDigits');
  const btnCancel = $('resetCancel');
  const btnConfirm = $('resetConfirm');
  const trigger = $('resetToggle');

  if (!modal || !input || !trigger) return;

  function openModal() {
    entered = '';
    updateView();
    modal.classList.add('active');
    if (input) input.value = '';
    if (Audio.isEnabled()) Audio.click();
  }
  function closeModal() {
    modal.classList.remove('active');
    entered = '';
    updateView();
  }
  function updateView() {
    if (digitView) digitView.textContent = entered.padEnd(6, '·').split('').join(' ');
    if (btnConfirm) btnConfirm.disabled = entered !== RESET_CODE;
  }
  function pressDigit(d) {
    if (entered.length >= 6) return;
    entered += d;
    updateView();
    if (Audio.isEnabled()) Audio.navClick();
  }
  function backspace() {
    entered = entered.slice(0, -1);
    updateView();
    if (Audio.isEnabled()) Audio.click();
  }
  function confirmReset() {
    if (entered !== RESET_CODE) return;
    if (Audio.isEnabled()) Audio.interference(1.5);
    SaveSystem.clear();
    try { localStorage.removeItem('obj4471_notebook_47'); } catch (e) {}
    try { localStorage.removeItem('obj4471_save_v2'); } catch (e) {}
    closeModal();
    if (Audio.isEnabled()) Audio.whoosh(1.2, true);
    setTimeout(() => {
      window.location.reload();
    }, 900);
  }

  trigger.addEventListener('click', (e) => { e.stopPropagation(); openModal(); });
  if (btnCancel) btnCancel.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
  if (btnConfirm) btnConfirm.addEventListener('click', (e) => { e.stopPropagation(); confirmReset(); });

  document.querySelectorAll('.reset-key').forEach(k => {
    k.addEventListener('click', (e) => {
      e.stopPropagation();
      const v = k.dataset.value;
      if (v === 'back') backspace();
      else if (v === 'clear') { entered = ''; updateView(); }
      else pressDigit(v);
    });
  });

  // Клавиатура (физическая)
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key >= '0' && e.key <= '9') pressDigit(e.key);
    else if (e.key === 'Backspace') backspace();
    else if (e.key === 'Escape') closeModal();
    else if (e.key === 'Enter' && entered === RESET_CODE) confirmReset();
  });
}
