import { state } from './state.js';
import { Timers } from './timers.js';

const KEY = 'obj4471_save_v2';
const VERSION = 2;

export const SaveSystem = {
  save(silent = false) {
    try {
      const data = {
        version: VERSION,
        timestamp: Date.now(),
        chaptersOpened: [...state.chaptersOpened],
        cycle47Complete: state.cycle47Complete,
        agreementAccepted: state.agreementAccepted,
        systemWarningShown: state.systemWarningShown,
        endingTriggered: state.endingTriggered,
      };
      localStorage.setItem(KEY, JSON.stringify(data));
      if (!silent) {
        const el = document.getElementById('notebookSaveStatus');
        if (el) {
          el.classList.add('show');
          Timers.set('save-hide', () => el.classList.remove('show'), 1200);
        }
      }
    } catch (e) {
      console.warn('Save failed:', e);
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== VERSION) return null;
      return data;
    } catch (e) {
      return null;
    }
  },

  apply(data) {
    if (!data) return;
    state.chaptersOpened = new Set(data.chaptersOpened || []);
    state.cycle47Complete = data.cycle47Complete || false;
    state.agreementAccepted = data.agreementAccepted || false;
    state.systemWarningShown = data.systemWarningShown || false;
    state.endingTriggered = data.endingTriggered || false;
    if (state.cycle47Complete) state.endingComplete = true;
  },

  clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  },

  init() {
    const data = this.load();
    if (data) this.apply(data);
    setInterval(() => this.save(true), 10000);
    window.addEventListener('beforeunload', () => this.save(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.save(true);
    });
  },
};
