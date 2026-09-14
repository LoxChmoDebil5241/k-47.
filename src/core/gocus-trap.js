const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const FocusTrap = (() => {
  let activeTrap = null;
  function activate(container) {
    if (activeTrap) deactivate();
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      const items = [...container.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const prevFocus = document.activeElement;
    container.addEventListener('keydown', handler);
    activeTrap = { container, handler, prevFocus };
    const firstItem = container.querySelector(FOCUSABLE);
    if (firstItem) setTimeout(() => firstItem.focus(), 50);
  }
  function deactivate() {
    if (!activeTrap) return;
    activeTrap.container.removeEventListener('keydown', activeTrap.handler);
    if (activeTrap.prevFocus && activeTrap.prevFocus.focus) {
      try { activeTrap.prevFocus.focus(); } catch (e) {}
    }
    activeTrap = null;
  }
  return { activate, deactivate };
})();
