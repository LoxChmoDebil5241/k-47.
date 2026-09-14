import { $, CONFIG, clamp } from '../config.js';
import { Timers } from '../core/timers.js';
import { Audio } from '../core/audio.js';
import { FocusTrap } from '../core/focus-trap.js';

const NB_KEY = CONFIG.notebook.key;
const NB_PAGES = CONFIG.notebook.pages;
const NB_MAX_CHARS = CONFIG.notebook.maxCharsPerPage;
let pages = new Array(NB_PAGES).fill('');
let currentPage = 0;

export function initNotebook() {
  const DOM = {
    notebookText: $('notebookText'),
    notebookCharCount: $('notebookCharCount'),
    pageIndicator: $('pageIndicator'),
    pagePrev: $('pagePrev'),
    pageNext: $('pageNext'),
    notebookDate: $('notebookDate'),
  };
  loadNotebook();
  DOM.notebookText.addEventListener('input', () => {
    if (DOM.notebookText.value.length > NB_MAX_CHARS) {
      DOM.notebookText.value = DOM.notebookText.value.slice(0, NB_MAX_CHARS);
    }
    pages[currentPage] = DOM.notebookText.value;
    DOM.notebookCharCount.textContent = DOM.notebookText.value.length + ' символов';
    scheduleSave();
  });
  DOM.notebookDate.textContent = new Date().toLocaleDateString('ru-RU');
  DOM.pagePrev.addEventListener('click', () => goToPage(-1));
  DOM.pageNext.addEventListener('click', () => goToPage(1));
}

function loadNotebook() {
  const DOM = {
    notebookText: $('notebookText'),
    notebookCharCount: $('notebookCharCount'),
    pageIndicator: $('pageIndicator'),
    pagePrev: $('pagePrev'),
    pageNext: $('pageNext'),
  };
  try {
    const raw = localStorage.getItem(NB_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && Array.isArray(obj.pages)) {
        for (let i = 0; i < NB_PAGES; i++) {
          pages[i] = (obj.pages[i] || '').toString().slice(0, NB_MAX_CHARS);
        }
      }
      if (typeof obj.currentPage === 'number') {
        currentPage = clamp(obj.currentPage, 0, NB_PAGES - 1);
      }
    }
  } catch (e) {}
  DOM.notebookText.value = pages[currentPage] || '';
  DOM.notebookCharCount.textContent = DOM.notebookText.value.length + ' символов';
  DOM.pageIndicator.textContent = `${currentPage + 1} / ${NB_PAGES}`;
  DOM.pagePrev.disabled = currentPage <= 0;
  DOM.pageNext.disabled = currentPage >= NB_PAGES - 1;
}

export function saveNotebook() {
  const DOM = {
    notebookSaveStatus: $('notebookSaveStatus'),
    notebookText: $('notebookText'),
  };
  pages[currentPage] = DOM.notebookText.value;
  try {
    localStorage.setItem(NB_KEY, JSON.stringify({ pages, currentPage }));
  } catch (e) {}
  DOM.notebookSaveStatus.classList.add('show');
  Timers.set('notebook-hide-status', () => DOM.notebookSaveStatus.classList.remove('show'), 1200);
}

function scheduleSave() {
  Timers.set('notebook-save', saveNotebook, CONFIG.notebook.saveDebounceMs);
}

function goToPage(delta) {
  const DOM = {
    notebookText: $('notebookText'),
    pageFlip: $('pageFlip'),
    pagePrev: $('pagePrev'),
    pageNext: $('pageNext'),
    pageIndicator: $('pageIndicator'),
  };
  const target = clamp(currentPage + delta, 0, NB_PAGES - 1);
  if (target === currentPage) return;
  pages[currentPage] = DOM.notebookText.value.slice(0, NB_MAX_CHARS);
  DOM.pageFlip.classList.remove('flipping');
  void DOM.pageFlip.offsetWidth;
  DOM.pageFlip.classList.add('flipping');
  if (Audio.isEnabled()) Audio.pageTurn();
  Timers.set('notebook-page', () => {
    currentPage = target;
    DOM.notebookText.value = pages[currentPage] || '';
    DOM.notebookText.style.opacity = '0';
    Timers.set('notebook-fade', () => { DOM.notebookText.style.opacity = '1'; }, 30);
    DOM.pageIndicator.textContent = `${currentPage + 1} / ${NB_PAGES}`;
    DOM.pagePrev.disabled = currentPage <= 0;
    DOM.pageNext.disabled = currentPage >= NB_PAGES - 1;
    saveNotebook();
  }, 180);
}

export function openNotebook(renderer, onClose) {
  const DOM = {
    notebookOverlay: $('notebookOverlay'),
    notebookText: $('notebookText'),
    notebookSaveStatus: $('notebookSaveStatus'),
  };
  try {
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    const snap = document.createElement('canvas');
    snap.width = Math.floor(w / 2);
    snap.height = Math.floor(h / 2);
    const ctx = snap.getContext('2d');
    ctx.drawImage(renderer.domElement, 0, 0, snap.width, snap.height);
    DOM.notebookOverlay.style.backgroundImage = `url(${snap.toDataURL('image/jpeg', 0.7)})`;
  } catch (e) {
    DOM.notebookOverlay.style.backgroundImage = 'none';
  }
  DOM.notebookOverlay.classList.add('active');
  DOM.notebookText.focus();
  FocusTrap.activate(DOM.notebookOverlay);
}
