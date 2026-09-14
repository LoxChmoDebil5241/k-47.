import { $ } from '../config.js';
import { state } from '../core/state.js';
import { Audio } from '../core/audio.js';
import { FocusTrap } from '../core/focus-trap.js';
import { CHAPTERS, getParagraphsForChapter } from '../content/chapters.js';

export const readerState = {
  currentChapter: 0,
  visibleParagraphs: 1,
  totalParagraphs: 0,
};

let triggerEndingSequenceFn = null;
export function setEndingTrigger(fn) { triggerEndingSequenceFn = fn; }

export function renderReaderChapter(index, skipWarning = false) {
  const DOM = {
    readerMain: $('readerMain'),
    readerIndicator: $('readerIndicator'),
    readerPrev: $('readerPrev'),
    readerNext: $('readerNext'),
    readerVisibleCount: $('readerVisibleCount'),
    readerTotalCount: $('readerTotalCount'),
  };
  const chapter = CHAPTERS[index];
  if (!chapter) return;
  if (chapter.requiresCycle && !state.cycle47Complete) {
    if (triggerEndingSequenceFn) triggerEndingSequenceFn();
    return;
  }
  const proceed = () => {
    readerState.currentChapter = index;
    const paragraphs = getParagraphsForChapter(chapter);
    readerState.totalParagraphs = paragraphs.length;
    readerState.visibleParagraphs = Math.min(1, paragraphs.length);
    let html = `
      <div class="reader-chapter-header">
        <div class="ch-number">Глава ${chapter.number}</div>
        <div class="ch-title">${chapter.title}</div>
      </div>
      <div class="reader-text">
        ${paragraphs.map((p, i) => `<p data-index="${i}">${p}</p>`).join('')}
      </div>
    `;
    DOM.readerMain.innerHTML = html;
    DOM.readerIndicator.textContent = `ГЛ. ${chapter.number} · ${chapter.title}`;
    DOM.readerPrev.disabled = index === 0;
    DOM.readerNext.disabled = index === CHAPTERS.length - 1;
    DOM.readerVisibleCount.textContent = readerState.visibleParagraphs;
    DOM.readerTotalCount.textContent = readerState.totalParagraphs;
    updateReaderRedline();
    DOM.readerMain.scrollTop = 0;
    if (!state.chaptersOpened.has(chapter.id)) {
      state.chaptersOpened.add(chapter.id);
      import('./photo-wall.js').then(m => m.refreshPhotoReveal());
      import('./cracks.js').then(m => m.updateTerminalAging());
    }
  };
  if (!state.systemWarningShown && !skipWarning) {
    state.systemWarningShown = true;
    showSystemWarning(proceed);
  } else {
    proceed();
  }
}

export function updateReaderRedline() {
  const DOM = {
    readerMain: $('readerMain'),
    readerVisibleCount: $('readerVisibleCount'),
    readerTotalCount: $('readerTotalCount'),
    readerParagraphPrev: $('readerParagraphPrev'),
    readerParagraphNext: $('readerParagraphNext'),
  };
  const paragraphs = DOM.readerMain.querySelectorAll('.reader-text p');
  paragraphs.forEach((p, i) => p.classList.toggle('visible', i < readerState.visibleParagraphs));
  DOM.readerVisibleCount.textContent = readerState.visibleParagraphs;
  DOM.readerTotalCount.textContent = readerState.totalParagraphs;
  DOM.readerParagraphPrev.disabled = readerState.visibleParagraphs <= 0;
  DOM.readerParagraphNext.disabled = readerState.visibleParagraphs >= readerState.totalParagraphs;
}

export function openReader() {
  if (state.phase !== 'inside') return;
  const DOM = { readerOverlay: $('readerOverlay') };
  DOM.readerOverlay.classList.add('active');
  renderReaderChapter(readerState.currentChapter);
  if (Audio.isEnabled()) Audio.whoosh(0.5, false);
  FocusTrap.activate(DOM.readerOverlay);
}

export function closeReader() {
  const DOM = { readerOverlay: $('readerOverlay') };
  DOM.readerOverlay.classList.remove('active');
  FocusTrap.deactivate();
  if (Audio.isEnabled()) Audio.click();
}

export function showSystemWarning(cb) {
  const DOM = { sysWarning: $('sysWarning'), sysWarningOk: $('sysWarningOk') };
  DOM.sysWarning.classList.add('active');
  FocusTrap.activate(DOM.sysWarning);
  const handler = () => {
    DOM.sysWarning.classList.remove('active');
    FocusTrap.deactivate();
    DOM.sysWarningOk.removeEventListener('click', handler);
    showUserAgreement(cb);
  };
  DOM.sysWarningOk.addEventListener('click', handler);
}

export function showUserAgreement(cb) {
  const DOM = {
    userAgreement: $('userAgreement'),
    agreementAccept: $('agreementAccept'),
    agreementCancel: $('agreementCancel'),
    readerOverlay: $('readerOverlay'),
  };
  DOM.userAgreement.classList.add('active');
  FocusTrap.activate(DOM.userAgreement);
  const items = DOM.userAgreement.querySelectorAll('.agreement-item');
  const updateAccept = () => {
    const all = [...items].every(it => it.classList.contains('checked'));
    DOM.agreementAccept.disabled = !all;
  };
  items.forEach(it => {
    const toggle = () => {
      it.classList.toggle('checked');
      it.setAttribute('aria-checked', it.classList.contains('checked') ? 'true' : 'false');
      updateAccept();
    };
    it.onclick = toggle;
    it.onkeydown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
    };
  });
  DOM.agreementAccept.onclick = () => {
    DOM.userAgreement.classList.remove('active');
    FocusTrap.deactivate();
    state.agreementAccepted = true;
    if (cb) cb();
  };
  DOM.agreementCancel.onclick = () => {
    DOM.userAgreement.classList.remove('active');
    FocusTrap.deactivate();
    DOM.readerOverlay.classList.remove('active');
  };
  updateAccept();
}

export function bindReaderNav() {
  const DOM = {
    readerPrev: $('readerPrev'),
    readerNext: $('readerNext'),
    readerParagraphPrev: $('readerParagraphPrev'),
    readerParagraphNext: $('readerParagraphNext'),
    readerParagraphReset: $('readerParagraphReset'),
    readerClose: $('readerClose'),
  };
  const bind = (el, fn) => {
    if (!el) return;
    el.addEventListener('click', (e) => { e.stopPropagation(); Audio.navClick(); fn(); });
    el.addEventListener('mouseenter', () => { if (Audio.isEnabled()) Audio.hover(); });
  };
  bind(DOM.readerPrev, () => {
    if (readerState.currentChapter > 0) renderReaderChapter(readerState.currentChapter - 1, true);
  });
  bind(DOM.readerNext, () => {
    if (readerState.currentChapter < CHAPTERS.length - 1) renderReaderChapter(readerState.currentChapter + 1, true);
  });
  bind(DOM.readerParagraphPrev, () => {
    if (readerState.visibleParagraphs > 0) { readerState.visibleParagraphs--; updateReaderRedline(); }
  });
  bind(DOM.readerParagraphNext, () => {
    if (readerState.visibleParagraphs < readerState.totalParagraphs) { readerState.visibleParagraphs++; updateReaderRedline(); }
  });
  bind(DOM.readerParagraphReset, () => {
    readerState.visibleParagraphs = 0;
    updateReaderRedline();
  });
  bind(DOM.readerClose, closeReader);
    }
