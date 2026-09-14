import * as THREE from 'three';
import { CONFIG, clamp, $ } from './config.js';
import { state, GameState } from './core/state.js';
import { Timers } from './core/timers.js';
import { FocusTrap } from './core/focus-trap.js';
import { SaveSystem } from './core/save.js';
import { Audio } from './core/audio.js';
import { DialogAudio } from './core/dialog-audio.js';

import { scene, camera, renderer, composer, bloom, horrorPass, updateFXAA } from './scene/renderer.js';
import { terminalLight, deskLight, MATS } from './scene/room.js';
import { terminalGroup, screenMat, glowSprite, drawScreenImage, screenTex, screenCanvas } from './scene/terminal.js';
import { deskGroup, notebookGlowSprite } from './scene/desk.js';
import { beginTransition, updateTransition } from './scene/transitions.js';

import { logLine, initTelemetry } from './ui/telemetry.js';
import { buildPhotoWall, refreshPhotoReveal, redrawConnections, clearAllLinks } from './ui/photo-wall.js';
import { readerState, openReader, closeReader, renderReaderChapter, bindReaderNav, setEndingTrigger } from './ui/reader.js';
import { initNotebook, openNotebook, saveNotebook } from './ui/notebook.js';
import { dialog47State, openDialog47, closeDialog47, bindDialog47, setDialog47Complete } from './ui/dialog47.js';
import { crackState, setThoughtsStop, setAutoExit, startThoughtsAndCracks, updateTerminalAging } from './ui/cracks.js';
import { startThoughtsLoop, stopThoughts } from './ui/thoughts.js';
import { CHAPTERS } from './content/chapters.js';
import { initReset } from './ui/reset.js';

/* ============================================================
   INIT
   ============================================================ */
SaveSystem.init();
buildPhotoWall();
initNotebook();
initTelemetry();
bindReaderNav();
bindDialog47();
initReset();

/* ============================================================
   UI BAR MANAGEMENT
   ============================================================ */
const bars = {
  outside: $('barOutside'),
  inside: $('barInside'),
  facing: $('barFacing'),
  desk: $('barDesk'),
  wall: $('barWall'),
  wallClose: $('barWallClose'),
  notebook: $('barNotebook'),
};

const btns = {
  turnLeft: $('btnTurnLeft'),
  turn: $('btnTurn'),
  turnRight: $('btnTurnRight'),
  enter: $('btnEnter'),
  exit: $('btnExit'),
  back: $('btnBack'),
  peer: $('btnPeer'),
  approachDesk: $('btnApproachDesk'),
  backFromDesk: $('btnBackFromDesk'),
  approachWall: $('btnApproachWall'),
  backFromWall: $('btnBackFromWall'),
  backToWallVignette: $('btnBackToWallVignette'),
  clearLinks: $('btnClearLinks'),
  closeNotebook: $('btnCloseNotebook'),
  backFromNotebook: $('btnBackFromNotebook'),
  openReader: $('btnOpenReader'),
};

function setBar(name) {
  Object.entries(bars).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle('show', k === name);
  });
}
function setButtonState(...pairs) {
  pairs.forEach(([btn, disabled]) => { if (btn) btn.disabled = disabled; });
}
function disableAllOutside() {
  setButtonState([btns.turn, true], [btns.turnLeft, true], [btns.turnRight, true], [btns.enter, true]);
}
function enableAllOutside() {
  setButtonState([btns.turn, false], [btns.turnLeft, false], [btns.turnRight, false], [btns.enter, false]);
}
function showWall(mode) {
  const w = $('domWall');
  if (!mode) { w.classList.remove('active', 'close'); return; }
  w.classList.add('active');
  w.classList.toggle('close', mode === 'close');
}

/* ============================================================
   DOOR SCENE
   ============================================================ */
function startDoorScene() {
  state.doorScene = { active: true, elapsed: 0, frameVisible: false, silhouetteVisible: false, spoke: false, fired: false, peering: false };
  Timers.set('door-frame-cycle', () => {
    if (!state.doorScene.active) return;
    revealDoorFrame();
  }, 1200);
  logLine('Дверь открывается...', true);
}
function revealDoorFrame() {
  state.doorScene.frameVisible = true;
  $('doorReveal').classList.add('active');
  Timers.set('door-frame-visible', () => {
    $('doorReveal').classList.add('frame-visible');
    if (Audio.isEnabled()) Audio.whisper(1.8);
  }, 400);
}
function peekIntoDark() {
  if (!state.doorScene.active || state.doorScene.peering) return;
  state.doorScene.peering = true;
  state.phase = 'peering';
  if (Audio.isEnabled()) Audio.whoosh(1.5, false);
  $('doorReveal').classList.add('peering');
  setButtonState([btns.peer, true], [btns.back, true]);

  const fromPos = camera.position.clone();
  const fromRotX = camera.rotation.x;
  const fromYaw = camera.rotation.y;
  const toPos = CONFIG.camera.peerPos;
  const toRotX = CONFIG.camera.peerRotX;

  beginTransition(fromPos, toPos, fromRotX, toRotX, fromYaw, fromYaw, CONFIG.timings.peer, () => {
    Timers.set('door-reveal-silhouette', () => {
      if (!state.doorScene.active) return;
      revealSilhouette();
    }, 800);
  });
}
function revealSilhouette() {
  if (state.doorScene.silhouetteVisible) return;
  state.doorScene.silhouetteVisible = true;
  $('doorReveal').classList.add('silhouette-visible');
  if (Audio.isEnabled()) Audio.whisper(2.2);

  if (!state.cycle47Complete) {
    Timers.set('door-fire', () => {
      if (state.doorScene.active) fireBarrage();
    }, 1800);
  } else {
    Timers.set('door-speak', () => {
      if (state.doorScene.spoke) return;
      state.doorScene.spoke = true;
      $('silhouetteSpeech').classList.add('show', 'pulse');
      if (Audio.isEnabled()) Audio.whisper(2.0);
      Timers.set('door-autoturn', () => {
        $('silhouetteSpeech').classList.remove('show', 'pulse');
        autoTurnToTerminal();
      }, 2500);
    }, 2000);
  }
}
function fireBarrage() {
  if (state.doorScene.fired) return;
  state.doorScene.fired = true;
  if (Audio.isEnabled()) Audio.barrage(5.0);
  triggerFreeze();
}
function triggerFreeze() {
  try {
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    const snap = document.createElement('canvas');
    snap.width = w;
    snap.height = h;
    const ctx = snap.getContext('2d');
    ctx.drawImage(renderer.domElement, 0, 0);
    $('freezeImg').src = snap.toDataURL('image/jpeg', 0.75);
  } catch (e) {}
  const fz = $('freeze');
  fz.classList.add('active', 'tilted');
  if (Audio.isEnabled()) Audio.interference(3.6);
  Timers.set('freeze-reset', softResetExperience, 5000);
}
function softResetExperience() {
  $('freeze').classList.remove('active', 'tilted');
  $('freezeImg').src = '';
  stopDoorScene();
  camera.position.copy(CONFIG.camera.outsidePos);
  camera.rotation.set(CONFIG.camera.outsideRotX, 0, 0);
  $('ui').classList.remove('active');
  setBar('outside');
  enableAllOutside();
  showWall(null);
  deskGroup.visible = false;
  deskLight.intensity = 0.0;
  $('photoWall').classList.remove('active', 'interactive');
  $('screenOverlay').style.opacity = '0';
  state.overlayOn = false;
  horrorPass.uniforms.uRedTint.value = 0.0;
  GameState.reset();
  state.phase = 'outside';
  state.transition = null;
  Audio.stopDreadRamp(0.5);
  crackState.active = false;
  crackState.breakCount = 0;
  stopThoughts();
  $('thoughtsLayer').classList.remove('active');
  $('thoughtsLayer').innerHTML = '';
  $('crackOverlay').classList.remove('active');
  btns.turn.classList.add('highlight-pulse');
  logLine('Система перезапущена.', true);
}
function autoTurnToTerminal() {
  state.doorScene.active = false;
  state.doorScene.peering = false;
  Audio.stopDreadRamp(0.8);
  $('doorReveal').classList.remove('active', 'frame-visible', 'silhouette-visible', 'peering');
  $('silhouetteSpeech').classList.remove('show', 'pulse');
  if (state.phase === 'idle-after-turn' || state.phase === 'turning' || state.phase === 'peering') {
    state.phase = 'turning-back';
    Audio.whoosh(1.0, true);
    beginTransition(
      camera.position, CONFIG.camera.outsidePos,
      camera.rotation.x, CONFIG.camera.outsideRotX,
      camera.rotation.y, CONFIG.camera.endYawOutside,
      CONFIG.timings.turn,
      () => {
        state.phase = 'outside';
        setBar('outside');
        enableAllOutside();
        btns.back.disabled = true;
        btns.enter.classList.add('highlight-pulse');
        logLine('Войдите в терминал.', false);
      }
    );
  }
}
function stopDoorScene() {
  state.doorScene.active = false;
  state.doorScene.peering = false;
  Audio.stopDreadRamp(0.8);
  ['door-frame-cycle','door-frame-visible','door-silhouette','door-fire','door-speak','door-autoturn','gunflash-off','freeze-trigger','door-reveal-silhouette'].forEach(k => Timers.clear(k));
  $('doorReveal').classList.remove('active', 'frame-visible', 'silhouette-visible', 'peering');
  $('silhouetteSpeech').classList.remove('show', 'pulse');
}

/* ============================================================
   ACTIONS
   ============================================================ */
function startTurn(target, targetYaw, phase) {
  if (state.phase !== 'outside') return;
  state.phase = phase;
  disableAllOutside();
  Audio.whoosh(1.0, false);
  let targetPos, targetRotX;
  if (target === 'desk') { targetPos = CONFIG.camera.deskViewPos; targetRotX = CONFIG.camera.deskViewRotX; }
  else if (target === 'wall') { targetPos = CONFIG.camera.wallViewPos; targetRotX = CONFIG.camera.wallViewRotX; }
  else { targetPos = CONFIG.camera.outsidePos; targetRotX = CONFIG.camera.outsideRotX; }
  beginTransition(camera.position, targetPos, camera.rotation.x, targetRotX, camera.rotation.y, targetYaw, CONFIG.timings.turn, () => {
    if (target === 'desk') {
      state.phase = 'idle-at-desk';
      setBar('desk');
      setButtonState([btns.approachDesk, false], [btns.backFromDesk, false]);
      deskGroup.visible = true;
      deskLight.intensity = 2.2;
    } else if (target === 'wall') {
      state.phase = 'idle-at-wall';
      setBar('wall');
      setButtonState([btns.approachWall, false], [btns.backFromWall, false]);
      showWall('view');
      $('photoWall').classList.add('active');
      refreshPhotoReveal();
    } else {
      state.phase = 'idle-after-turn';
      setBar('facing');
      setButtonState([btns.peer, false], [btns.back, false]);
      startDoorScene();
    }
  });
}
function turnBackFromDesk() {
  if (state.phase !== 'idle-at-desk' && state.phase !== 'at-desk') return;
  state.phase = 'turning-back-from-desk';
  Audio.whoosh(1.0, true);
  beginTransition(camera.position, CONFIG.camera.outsidePos, camera.rotation.x, CONFIG.camera.outsideRotX, camera.rotation.y, CONFIG.camera.endYawOutside, CONFIG.timings.turn, backToOutsideComplete);
  $('notebookOverlay').classList.remove('active');
  FocusTrap.deactivate();
}
function turnBackFromWall() {
  if (state.phase !== 'idle-at-wall' && state.phase !== 'wall-close' && state.phase !== 'approaching-wall') return;
  const fromPos = camera.position.clone();
  const fromRotX = camera.rotation.x;
  const fromYaw = camera.rotation.y;
  state.phase = 'turning-back-from-wall';
  Audio.whoosh(1.2, true);
  setButtonState([btns.backFromWall, true], [btns.approachWall, true], [btns.backToWallVignette, true]);
  showWall(null);
  $('photoWall').classList.remove('active', 'interactive');
  beginTransition(fromPos, CONFIG.camera.outsidePos, fromRotX, CONFIG.camera.outsideRotX, fromYaw, CONFIG.camera.endYawOutside, CONFIG.timings.turn, backToOutsideComplete);
}
function backToOutsideComplete() {
  state.phase = 'outside';
  setBar('outside');
  enableAllOutside();
  showWall(null);
  deskGroup.visible = false;
  deskLight.intensity = 0.0;
  $('notebookOverlay').classList.remove('active');
  FocusTrap.deactivate();
  $('photoWall').classList.remove('active', 'interactive');
}
function approachDesk() {
  if (state.phase !== 'idle-at-desk') return;
  state.phase = 'approaching-desk';
  Audio.whoosh(0.7, false);
  setButtonState([btns.approachDesk, true], [btns.backFromDesk, true]);
  beginTransition(camera.position, CONFIG.camera.deskApproachPos, camera.rotation.x, CONFIG.camera.deskApproachRotX, camera.rotation.y, camera.rotation.y, CONFIG.timings.approach, () => {
    state.phase = 'at-desk';
    setBar('notebook');
    Timers.set('open-notebook', () => {
      openNotebook(renderer);
      setBar('notebook');
    }, 100);
  });
}
function approachWall() {
  if (state.phase !== 'idle-at-wall') return;
  state.phase = 'approaching-wall';
  Audio.whoosh(0.7, false);
  setButtonState([btns.approachWall, true], [btns.backFromWall, true]);
  showWall('close');
  Timers.set('photo-interactive', () => {
    $('photoWall').classList.add('active');
    redrawConnections();
    Timers.set('photo-interactive-2', () => $('photoWall').classList.add('interactive'), 500);
  }, 700);
  beginTransition(camera.position, CONFIG.camera.wallApproachPos, camera.rotation.x, CONFIG.camera.wallApproachRotX, camera.rotation.y, camera.rotation.y, CONFIG.timings.approach, () => {
    state.phase = 'wall-close';
    setBar('wallClose');
    setButtonState([btns.backToWallVignette, false]);
  });
}
function backToWallVignette() {
  if (state.phase !== 'wall-close') return;
  state.phase = 'backing-to-wall-vignette';
  Audio.whoosh(0.7, true);
  setButtonState([btns.backToWallVignette, true]);
  showWall('view');
  $('photoWall').classList.remove('interactive');
  beginTransition(camera.position, CONFIG.camera.wallViewPos, camera.rotation.x, CONFIG.camera.wallViewRotX, camera.rotation.y, camera.rotation.y, CONFIG.timings.approach, () => {
    state.phase = 'idle-at-wall';
    setBar('wall');
    setButtonState([btns.approachWall, false], [btns.backFromWall, false]);
  });
}
function enterSystem() {
  if (state.phase !== 'outside') return;
  state.phase = 'entering';
  disableAllOutside();
  btns.enter.classList.remove('highlight-pulse');
  Audio.systemTransition(true);
  beginTransition(camera.position, CONFIG.camera.insidePos, camera.rotation.x, 0, camera.rotation.y, 0, CONFIG.timings.enter, () => {
    state.phase = 'inside';
    $('ui').classList.add('active');
    setBar('inside');
    horrorPass.uniforms.uRedTint.value = 0.7;
    logLine('Доступ разрешён', false);
    if (state.doorScene.spoke && state.cycle47Complete && !dialog47State.isActive) {
      Timers.set('open-dialog', () => openDialog47(), 800);
    }
  });
}
function exitSystem() {
  if (state.phase !== 'inside' && state.phase !== 'final') return;
  if ($('readerOverlay').classList.contains('active')) closeReader();
  state.phase = 'exiting';
  setButtonState([btns.exit, true]);
  Audio.systemTransition(false);
  beginTransition(camera.position, CONFIG.camera.outsidePos, camera.rotation.x, CONFIG.camera.outsideRotX, camera.rotation.y, CONFIG.camera.endYawOutside, CONFIG.timings.exit, () => {
    state.phase = 'outside';
    $('ui').classList.remove('active');
    setBar('outside');
    enableAllOutside();
    setButtonState([btns.exit, false]);
    horrorPass.uniforms.uRedTint.value = 0.0;
  });
}
function autoExitToOutside() {
  if (state.phase === 'inside' || state.phase === 'final') {
    if ($('readerOverlay').classList.contains('active')) closeReader();
    state.phase = 'exiting';
    setButtonState([btns.exit, true]);
    Audio.systemTransition(false);
    beginTransition(camera.position, CONFIG.camera.outsidePos, camera.rotation.x, CONFIG.camera.outsideRotX, camera.rotation.y, CONFIG.camera.endYawOutside, CONFIG.timings.exit, () => {
      state.phase = 'outside';
      $('ui').classList.remove('active');
      setBar('outside');
      enableAllOutside();
      setButtonState([btns.exit, false]);
      horrorPass.uniforms.uRedTint.value = 0.0;
      btns.turn.classList.add('highlight-pulse');
      logLine('Повернитесь.', false);
    });
  }
}

/* ============================================================
   ENDING
   ============================================================ */
function triggerEndingSequence() {
  if (state.endingTriggered) return;
  state.endingTriggered = true;
  closeReader();
  showFileDamage();
}
function showFileDamage() {
  $('fileDamage').classList.add('active');
  FocusTrap.activate($('fileDamage'));
  if (Audio.isEnabled()) Audio.interference(2.0);
}
$('fileDamageOk').addEventListener('click', () => {
  $('fileDamage').classList.remove('active');
  FocusTrap.deactivate();
  if (Audio.isEnabled()) Audio.click();
  startThoughtsLoop();
  startThoughtsAndCracks();
  logLine('АРХИВ ПОВРЕЖДЁН. УДЕРЖИВАЙТЕ ЭКРАН.', false);
});

setEndingTrigger(triggerEndingSequence);
setThoughtsStop(stopThoughts);
setAutoExit(autoExitToOutside);
setDialog47Complete(() => {
  state.cycle47Complete = true;
  SaveSystem.save(true);
  logLine('Цикл завершён.', true);
});

/* ============================================================
   BUTTON BINDING
   ============================================================ */
function bindClick(el, fn) {
  if (!el) return;
  el.addEventListener('click', (e) => { e.stopPropagation(); Audio.click(); fn(); });
  el.addEventListener('mouseenter', () => { if (Audio.isEnabled()) Audio.hover(); });
}
bindClick(btns.turn, () => {
  btns.turn.classList.remove('highlight-pulse');
  startTurn('entity', CONFIG.camera.endYawTurn, 'turning');
});
bindClick(btns.turnLeft, () => startTurn('desk', CONFIG.camera.endYawDesk, 'turning-left'));
bindClick(btns.turnRight, () => startTurn('wall', CONFIG.camera.endYawWall, 'turning-right'));
bindClick(btns.enter, enterSystem);
bindClick(btns.exit, exitSystem);
bindClick(btns.peer, peekIntoDark);
bindClick(btns.approachDesk, approachDesk);
bindClick(btns.backFromDesk, turnBackFromDesk);
bindClick(btns.approachWall, approachWall);
bindClick(btns.backFromWall, turnBackFromWall);
bindClick(btns.backToWallVignette, backToWallVignette);
bindClick(btns.clearLinks, clearAllLinks);
bindClick(btns.closeNotebook, turnBackFromDesk);
bindClick(btns.backFromNotebook, turnBackFromDesk);
bindClick($('notebookClose'), turnBackFromDesk);
bindClick(btns.openReader, openReader);

/* ============================================================
   KEYBOARD
   ============================================================ */
window.addEventListener('keydown', (e) => {
  if ($('dialog47').classList.contains('active')) {
    if (e.key === 'Escape') closeDialog47();
    return;
  }
  if ($('readerOverlay').classList.contains('active')) {
    if (e.key === 'Escape') closeReader();
    if (e.key === 'ArrowLeft' && readerState.currentChapter > 0) {
      Audio.navClick();
      renderReaderChapter(readerState.currentChapter - 1, true);
    }
    if (e.key === 'ArrowRight' && readerState.currentChapter < CHAPTERS.length - 1) {
      Audio.navClick();
      renderReaderChapter(readerState.currentChapter + 1, true);
    }
    return;
  }
  if ($('notebookOverlay').classList.contains('active')) {
    if (e.key === 'Escape') turnBackFromDesk();
    return;
  }
  if (e.key === 'Escape') {
    if (state.phase === 'idle-at-desk') turnBackFromDesk();
    else if (state.phase === 'idle-at-wall') turnBackFromWall();
    else if (state.phase === 'wall-close') backToWallVignette();
    else if (state.phase === 'inside' || state.phase === 'final') exitSystem();
  }
  if (e.key === 'Enter' && state.phase === 'outside') enterSystem();
});

/* ============================================================
   SCREEN OVERLAY
   ============================================================ */
const ovCtx = $('screenOverlay').getContext('2d');
function resizeOverlay() {
  const pr = Math.min(window.devicePixelRatio, 2);
  $('screenOverlay').width = Math.floor(window.innerWidth * pr);
  $('screenOverlay').height = Math.floor(window.innerHeight * pr);
}
function drawOverlayFromScreen() {
  const c = $('screenOverlay');
  const vw = c.width, vh = c.height;
  ovCtx.fillStyle = '#000';
  ovCtx.fillRect(0, 0, vw, vh);
  const imgAspect = screenCanvas.width / screenCanvas.height;
  const vAspect = vw / vh;
  let dw, dh;
  if (vAspect > imgAspect) { dw = vw; dh = vw / imgAspect; }
  else { dh = vh; dw = vh * imgAspect; }
  ovCtx.drawImage(screenCanvas, (vw - dw) / 2, (vh - dh) / 2, dw, dh);
  const g = ovCtx.createRadialGradient(vw/2, vh/2, Math.min(vw,vh) * 0.25, vw/2, vh/2, Math.max(vw,vh) * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.85)');
  ovCtx.fillStyle = g;
  ovCtx.fillRect(0, 0, vw, vh);
}
resizeOverlay();
window.addEventListener('resize', resizeOverlay);

/* ============================================================
   VISIBILITY / PERF
   ============================================================ */
function updateTerminalVisibility() {
  let vis = 1.0;
  const p = state.transition;
  if (state.phase === 'entering' && p) vis = Math.max(0, 1 - (p.elapsed / p.duration) / 0.7);
  else if (state.phase === 'inside') vis = 0.6;
  else if (state.phase === 'exiting' && p) vis = Math.min(1, (p.elapsed / p.duration) / 0.8);
  else if (state.phase !== 'outside') vis = 0.6;
  const flicker = 0.85 + Math.sin(state.time * 27.0) * 0.04 + Math.sin(state.time * 3.1) * 0.06;
  const v = vis * flicker;
  screenMat.emissiveIntensity = 1.7 * v;
  MATS.neonFrame.emissiveIntensity = 2.6 * v;
  terminalLight.intensity = 4.0 * Math.max(v, 0.55);
  glowSprite.material.opacity = (0.7 + Math.sin(state.time * 2.0) * 0.15) * Math.max(vis, 0.5);
  const glowScale = 6.0 * (0.4 + 0.6 * Math.max(vis, 0.5));
  glowSprite.scale.set(glowScale, glowScale * 0.83, 1);
}
function updatePostFX() {
  horrorPass.uniforms.uTime.value = state.time;
  let abBoost = 1.0;
  const p = state.transition;
  if (p) {
    const phase = p.elapsed / p.duration;
    if (state.phase === 'entering' || state.phase === 'exiting') abBoost = 1.0 + Math.sin(phase * Math.PI) * 3.0;
    else if (state.phase === 'peering') abBoost = 1.0 + Math.sin(phase * Math.PI) * 2.5;
    else if (state.phase.startsWith('turning')) abBoost = 1.0 + Math.sin(phase * Math.PI) * 2.0;
  }
  if (state.doorScene.active) abBoost = Math.max(abBoost, 1.5 + state.doorScene.elapsed * 0.5);
  horrorPass.uniforms.uAberration.value = 0.0035 * abBoost;
  const bloomBase = 1.35;
  const bloomInside = (state.phase === 'inside' || state.phase === 'entering') ? 0.7 : 0;
  const bloomDoor = state.doorScene.silhouetteVisible ? 1.4 : (state.doorScene.active ? 0.6 : 0);
  bloom.strength += ((bloomBase + bloomInside + bloomDoor) - bloom.strength) * 0.05;
}

/* ============================================================
   ANIMATE
   ============================================================ */
function animate() {
  const dt = Math.min(state.clock.getDelta(), 0.05);
  state.time += dt;
  drawScreenImage(state.time);
  screenTex.needsUpdate = true;
  if (state.overlayOn) drawOverlayFromScreen();
  updateTransition(dt);
  if (state.phase === 'inside' || state.phase === 'final') {
    camera.position.x = CONFIG.camera.insidePos.x + Math.sin(state.time * 0.6) * 0.02;
    camera.position.y = CONFIG.camera.insidePos.y + Math.cos(state.time * 0.8) * 0.015;
  }
  if (state.doorScene.active) {
    state.doorScene.elapsed += dt;
    if (state.doorScene.silhouetteVisible && !state.doorScene.fired && !state.doorScene.spoke) {
      const s = 0.0025;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s;
      camera.rotation.z = (Math.random() - 0.5) * 0.005;
    }
  }
  updateTerminalVisibility();
  updatePostFX();
  if (deskGroup.visible) notebookGlowSprite.material.opacity = 0.3 + Math.sin(state.time * 2.5) * 0.1;
  composer.render();
  requestAnimationFrame(animate);
}

/* ============================================================
   RESIZE
   ============================================================ */
let resizeRafId = null;
function onResize() {
  if (resizeRafId) cancelAnimationFrame(resizeRafId);
  resizeRafId = requestAnimationFrame(() => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    const aspectFactor = Math.min(1, w / 900);
    terminalGroup.scale.setScalar(0.92 * (0.7 + 0.3 * aspectFactor));
    updateFXAA();
    resizeOverlay();
    if (state.overlayOn) drawOverlayFromScreen();
    if ($('photoWall').classList.contains('active')) redrawConnections();
  });
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

/* ============================================================
   SOUND TOGGLE
   ============================================================ */
$('soundToggle').addEventListener('click', (e) => {
  e.stopPropagation();
  const nowEnabled = !Audio.isEnabled();
  Audio.setEnabled(nowEnabled);
  DialogAudio.setEnabled(nowEnabled);
  $('soundToggle').textContent = nowEnabled ? 'ЗВУК' : 'ВЫКЛ';
  if (nowEnabled) Audio.click();
});

/* ============================================================
   BOOT
   ============================================================ */
function startExperience() {
  Audio.resume();
  Audio.startDrone();
  $('boot').classList.add('hide');
  Timers.set('boot-hide', () => { $('boot').style.display = 'none'; }, 800);
}
$('boot').addEventListener('click', startExperience, { once: true });
$('boot').addEventListener('touchstart', startExperience, { once: true, passive: true });

logLine('Инициализация...', true);
setTimeout(() => logLine('Терминал OBJ-4471', false), 400);
setTimeout(() => logLine('Архив из 48 глав доступен', true), 1000);

if (state.chaptersOpened.size > 0) {
  refreshPhotoReveal();
  updateTerminalAging();
}
if (state.cycle47Complete) {
  btns.turn.classList.remove('highlight-pulse');
}

animate();   ============================================================ */
const bars = {
  outside: $('barOutside'),
  inside: $('barInside'),
  facing: $('barFacing'),
  desk: $('barDesk'),
  wall: $('barWall'),
  wallClose: $('barWallClose'),
  notebook: $('barNotebook'),
};

const btns = {
  turnLeft: $('btnTurnLeft'),
  turn: $('btnTurn'),
  turnRight: $('btnTurnRight'),
  enter: $('btnEnter'),
  exit: $('btnExit'),
  back: $('btnBack'),
  peer: $('btnPeer'),
  approachDesk: $('btnApproachDesk'),
  backFromDesk: $('btnBackFromDesk'),
  approachWall: $('btnApproachWall'),
  backFromWall: $('btnBackFromWall'),
  backToWallVignette: $('btnBackToWallVignette'),
  clearLinks: $('btnClearLinks'),
  closeNotebook: $('btnCloseNotebook'),
  backFromNotebook: $('btnBackFromNotebook'),
  openReader: $('btnOpenReader'),
};

function setBar(name) {
  Object.entries(bars).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle('show', k === name);
  });
}
function setButtonState(...pairs) {
  pairs.forEach(([btn, disabled]) => { if (btn) btn.disabled = disabled; });
}
function disableAllOutside() {
  setButtonState([btns.turn, true], [btns.turnLeft, true], [btns.turnRight, true], [btns.enter, true]);
}
function enableAllOutside() {
  setButtonState([btns.turn, false], [btns.turnLeft, false], [btns.turnRight, false], [btns.enter, false]);
}
function showWall(mode) {
  const w = $('domWall');
  if (!mode) { w.classList.remove('active', 'close'); return; }
  w.classList.add('active');
  w.classList.toggle('close', mode === 'close');
}

/* ============================================================
   DOOR SCENE
   ============================================================ */
function startDoorScene() {
  state.doorScene = { active: true, elapsed: 0, frameVisible: false, silhouetteVisible: false, spoke: false, fired: false, peering: false };
  Timers.set('door-frame-cycle', () => {
    if (!state.doorScene.active) return;
    revealDoorFrame();
  }, 1200);
  logLine('Дверь открывается...', true);
}
function revealDoorFrame() {
  state.doorScene.frameVisible = true;
  $('doorReveal').classList.add('active');
  Timers.set('door-frame-visible', () => {
    $('doorReveal').classList.add('frame-visible');
    if (Audio.isEnabled()) Audio.whisper(1.8);
  }, 400);
}
function peekIntoDark() {
  if (!state.doorScene.active || state.doorScene.peering) return;
  state.doorScene.peering = true;
  state.phase = 'peering';
  if (Audio.isEnabled()) Audio.whoosh(1.5, false);
  $('doorReveal').classList.add('peering');
  setButtonState([btns.peer, true], [btns.back, true]);

  const fromPos = camera.position.clone();
  const fromRotX = camera.rotation.x;
  const fromYaw = camera.rotation.y;
  const toPos = CONFIG.camera.peerPos;
  const toRotX = CONFIG.camera.peerRotX;

  beginTransition(fromPos, toPos, fromRotX, toRotX, fromYaw, fromYaw, CONFIG.timings.peer, () => {
    Timers.set('door-reveal-silhouette', () => {
      if (!state.doorScene.active) return;
      revealSilhouette();
    }, 800);
  });
}
function revealSilhouette() {
  if (state.doorScene.silhouetteVisible) return;
  state.doorScene.silhouetteVisible = true;
  $('doorReveal').classList.add('silhouette-visible');
  if (Audio.isEnabled()) Audio.whisper(2.2);

  if (!state.cycle47Complete) {
    Timers.set('door-fire', () => {
      if (state.doorScene.active) fireBarrage();
    }, 1800);
  } else {
    Timers.set('door-speak', () => {
      if (state.doorScene.spoke) return;
      state.doorScene.spoke = true;
      $('silhouetteSpeech').classList.add('show', 'pulse');
      if (Audio.isEnabled()) Audio.whisper(2.0);
      Timers.set('door-autoturn', () => {
        $('silhouetteSpeech').classList.remove('show', 'pulse');
        autoTurnToTerminal();
      }, 2500);
    }, 2000);
  }
}
function fireBarrage() {
  if (state.doorScene.fired) return;
  state.doorScene.fired = true;
  if (Audio.isEnabled()) Audio.barrage(5.0);
  triggerFreeze();
}
function triggerFreeze() {
  try {
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    const snap = document.createElement('canvas');
    snap.width = w;
    snap.height = h;
    const ctx = snap.getContext('2d');
    ctx.drawImage(renderer.domElement, 0, 0);
    $('freezeImg').src = snap.toDataURL('image/jpeg', 0.75);
  } catch (e) {}
  const fz = $('freeze');
  fz.classList.add('active', 'tilted');
  if (Audio.isEnabled()) Audio.interference(3.6);
  Timers.set('freeze-reset', softResetExperience, 5000);
}
function softResetExperience() {
  $('freeze').classList.remove('active', 'tilted');
  $('freezeImg').src = '';
  stopDoorScene();
  camera.position.copy(CONFIG.camera.outsidePos);
  camera.rotation.set(CONFIG.camera.outsideRotX, 0, 0);
  $('ui').classList.remove('active');
  setBar('outside');
  enableAllOutside();
  showWall(null);
  deskGroup.visible = false;
  deskLight.intensity = 0.0;
  $('photoWall').classList.remove('active', 'interactive');
  $('screenOverlay').style.opacity = '0';
  state.overlayOn = false;
  horrorPass.uniforms.uRedTint.value = 0.0;
  GameState.reset();
  state.phase = 'outside';
  state.transition = null;
  Audio.stopDreadRamp(0.5);
  crackState.active = false;
  crackState.breakCount = 0;
  stopThoughts();
  $('thoughtsLayer').classList.remove('active');
  $('thoughtsLayer').innerHTML = '';
  $('crackOverlay').classList.remove('active');
  btns.turn.classList.add('highlight-pulse');
  logLine('Система перезапущена.', true);
}
function autoTurnToTerminal() {
  state.doorScene.active = false;
  state.doorScene.peering = false;
  Audio.stopDreadRamp(0.8);
  $('doorReveal').classList.remove('active', 'frame-visible', 'silhouette-visible', 'peering');
  $('silhouetteSpeech').classList.remove('show', 'pulse');
  if (state.phase === 'idle-after-turn' || state.phase === 'turning' || state.phase === 'peering') {
    state.phase = 'turning-back';
    Audio.whoosh(1.0, true);
    beginTransition(
      camera.position, CONFIG.camera.outsidePos,
      camera.rotation.x, CONFIG.camera.outsideRotX,
      camera.rotation.y, CONFIG.camera.endYawOutside,
      CONFIG.timings.turn,
      () => {
        state.phase = 'outside';
        setBar('outside');
        enableAllOutside();
        btns.back.disabled = true;
        btns.enter.classList.add('highlight-pulse');
        logLine('Войдите в терминал.', false);
      }
    );
  }
}
function stopDoorScene() {
  state.doorScene.active = false;
  state.doorScene.peering = false;
  Audio.stopDreadRamp(0.8);
  ['door-frame-cycle','door-frame-visible','door-silhouette','door-fire','door-speak','door-autoturn','gunflash-off','freeze-trigger','door-reveal-silhouette'].forEach(k => Timers.clear(k));
  $('doorReveal').classList.remove('active', 'frame-visible', 'silhouette-visible', 'peering');
  $('silhouetteSpeech').classList.remove('show', 'pulse');
}

/* ============================================================
   ACTIONS
   ============================================================ */
function startTurn(target, targetYaw, phase) {
  if (state.phase !== 'outside') return;
  state.phase = phase;
  disableAllOutside();
  Audio.whoosh(1.0, false);
  let targetPos, targetRotX;
  if (target === 'desk') { targetPos = CONFIG.camera.deskViewPos; targetRotX = CONFIG.camera.deskViewRotX; }
  else if (target === 'wall') { targetPos = CONFIG.camera.wallViewPos; targetRotX = CONFIG.camera.wallViewRotX; }
  else { targetPos = CONFIG.camera.outsidePos; targetRotX = CONFIG.camera.outsideRotX; }
  beginTransition(camera.position, targetPos, camera.rotation.x, targetRotX, camera.rotation.y, targetYaw, CONFIG.timings.turn, () => {
    if (target === 'desk') {
      state.phase = 'idle-at-desk';
      setBar('desk');
      setButtonState([btns.approachDesk, false], [btns.backFromDesk, false]);
      deskGroup.visible = true;
      deskLight.intensity = 2.2;
    } else if (target === 'wall') {
      state.phase = 'idle-at-wall';
      setBar('wall');
      setButtonState([btns.approachWall, false], [btns.backFromWall, false]);
      showWall('view');
      $('photoWall').classList.add('active');
      refreshPhotoReveal();
    } else {
      state.phase = 'idle-after-turn';
      setBar('facing');
      setButtonState([btns.peer, false], [btns.back, false]);
      startDoorScene();
    }
  });
}
function turnBackFromDesk() {
  if (state.phase !== 'idle-at-desk' && state.phase !== 'at-desk') return;
  state.phase = 'turning-back-from-desk';
  Audio.whoosh(1.0, true);
  beginTransition(camera.position, CONFIG.camera.outsidePos, camera.rotation.x, CONFIG.camera.outsideRotX, camera.rotation.y, CONFIG.camera.endYawOutside, CONFIG.timings.turn, backToOutsideComplete);
  $('notebookOverlay').classList.remove('active');
  FocusTrap.deactivate();
}
function turnBackFromWall() {
  if (state.phase !== 'idle-at-wall' && state.phase !== 'wall-close' && state.phase !== 'approaching-wall') return;
  const fromPos = camera.position.clone();
  const fromRotX = camera.rotation.x;
  const fromYaw = camera.rotation.y;
  state.phase = 'turning-back-from-wall';
  Audio.whoosh(1.2, true);
  setButtonState([btns.backFromWall, true], [btns.approachWall, true], [btns.backToWallVignette, true]);
  showWall(null);
  $('photoWall').classList.remove('active', 'interactive');
  beginTransition(fromPos, CONFIG.camera.outsidePos, fromRotX, CONFIG.camera.outsideRotX, fromYaw, CONFIG.camera.endYawOutside, CONFIG.timings.turn, backToOutsideComplete);
}
function backToOutsideComplete() {
  state.phase = 'outside';
  setBar('outside');
  enableAllOutside();
  showWall(null);
  deskGroup.visible = false;
  deskLight.intensity = 0.0;
  $('notebookOverlay').classList.remove('active');
  FocusTrap.deactivate();
  $('photoWall').classList.remove('active', 'interactive');
}
function approachDesk() {
  if (state.phase !== 'idle-at-desk') return;
  state.phase = 'approaching-desk';
  Audio.whoosh(0.7, false);
  setButtonState([btns.approachDesk, true], [btns.backFromDesk, true]);
  beginTransition(camera.position, CONFIG.camera.deskApproachPos, camera.rotation.x, CONFIG.camera.deskApproachRotX, camera.rotation.y, camera.rotation.y, CONFIG.timings.approach, () => {
    state.phase = 'at-desk';
    setBar('notebook');
    Timers.set('open-notebook', () => {
      openNotebook(renderer);
      setBar('notebook');
    }, 100);
  });
}
function approachWall() {
  if (state.phase !== 'idle-at-wall') return;
  state.phase = 'approaching-wall';
  Audio.whoosh(0.7, false);
  setButtonState([btns.approachWall, true], [btns.backFromWall, true]);
  showWall('close');
  Timers.set('photo-interactive', () => {
    $('photoWall').classList.add('active');
    redrawConnections();
    Timers.set('photo-interactive-2', () => $('photoWall').classList.add('interactive'), 500);
  }, 700);
  beginTransition(camera.position, CONFIG.camera.wallApproachPos, camera.rotation.x, CONFIG.camera.wallApproachRotX, camera.rotation.y, camera.rotation.y, CONFIG.timings.approach, () => {
    state.phase = 'wall-close';
    setBar('wallClose');
    setButtonState([btns.backToWallVignette, false]);
  });
}
function backToWallVignette() {
  if (state.phase !== 'wall-close') return;
  state.phase = 'backing-to-wall-vignette';
  Audio.whoosh(0.7, true);
  setButtonState([btns.backToWallVignette, true]);
  showWall('view');
  $('photoWall').classList.remove('interactive');
  beginTransition(camera.position, CONFIG.camera.wallViewPos, camera.rotation.x, CONFIG.camera.wallViewRotX, camera.rotation.y, camera.rotation.y, CONFIG.timings.approach, () => {
    state.phase = 'idle-at-wall';
    setBar('wall');
    setButtonState([btns.approachWall, false], [btns.backFromWall, false]);
  });
}
function enterSystem() {
  if (state.phase !== 'outside') return;
  state.phase = 'entering';
  disableAllOutside();
  btns.enter.classList.remove('highlight-pulse');
  Audio.systemTransition(true);
  beginTransition(camera.position, CONFIG.camera.insidePos, camera.rotation.x, 0, camera.rotation.y, 0, CONFIG.timings.enter, () => {
    state.phase = 'inside';
    $('ui').classList.add('active');
    setBar('inside');
    horrorPass.uniforms.uRedTint.value = 0.7;
    logLine('Доступ разрешён', false);
    if (state.doorScene.spoke && state.cycle47Complete && !dialog47State.isActive) {
      Timers.set('open-dialog', () => openDialog47(), 800);
    }
  });
}
function exitSystem() {
  if (state.phase !== 'inside' && state.phase !== 'final') return;
  if ($('readerOverlay').classList.contains('active')) closeReader();
  state.phase = 'exiting';
  setButtonState([btns.exit, true]);
  Audio.systemTransition(false);
  beginTransition(camera.position, CONFIG.camera.outsidePos, camera.rotation.x, CONFIG.camera.outsideRotX, camera.rotation.y, CONFIG.camera.endYawOutside, CONFIG.timings.exit, () => {
    state.phase = 'outside';
    $('ui').classList.remove('active');
    setBar('outside');
    enableAllOutside();
    setButtonState([btns.exit, false]);
    horrorPass.uniforms.uRedTint.value = 0.0;
  });
}
function autoExitToOutside() {
  if (state.phase === 'inside' || state.phase === 'final') {
    if ($('readerOverlay').classList.contains('active')) closeReader();
    state.phase = 'exiting';
    setButtonState([btns.exit, true]);
    Audio.systemTransition(false);
    beginTransition(camera.position, CONFIG.camera.outsidePos, camera.rotation.x, CONFIG.camera.outsideRotX, camera.rotation.y, CONFIG.camera.endYawOutside, CONFIG.timings.exit, () => {
      state.phase = 'outside';
      $('ui').classList.remove('active');
      setBar('outside');
      enableAllOutside();
      setButtonState([btns.exit, false]);
      horrorPass.uniforms.uRedTint.value = 0.0;
      btns.turn.classList.add('highlight-pulse');
      logLine('Повернитесь.', false);
    });
  }
}

/* ============================================================
   ENDING
   ============================================================ */
function triggerEndingSequence() {
  if (state.endingTriggered) return;
  state.endingTriggered = true;
  closeReader();
  showFileDamage();
}
function showFileDamage() {
  $('fileDamage').classList.add('active');
  FocusTrap.activate($('fileDamage'));
  if (Audio.isEnabled()) Audio.interference(2.0);
}
$('fileDamageOk').addEventListener('click', () => {
  $('fileDamage').classList.remove('active');
  FocusTrap.deactivate();
  if (Audio.isEnabled()) Audio.click();
  startThoughtsLoop();
  startThoughtsAndCracks();
  logLine('АРХИВ ПОВРЕЖДЁН. УДЕРЖИВАЙТЕ ЭКРАН.', false);
});

setEndingTrigger(triggerEndingSequence);
setThoughtsStop(stopThoughts);
setAutoExit(autoExitToOutside);
setDialog47Complete(() => {
  state.cycle47Complete = true;
  SaveSystem.save(true);
  logLine('Цикл завершён.', true);
});

/* ============================================================
   BUTTON BINDING
   ============================================================ */
function bindClick(el, fn) {
  if (!el) return;
  el.addEventListener('click', (e) => { e.stopPropagation(); Audio.click(); fn(); });
  el.addEventListener('mouseenter', () => { if (Audio.isEnabled()) Audio.hover(); });
}
bindClick(btns.turn, () => {
  btns.turn.classList.remove('highlight-pulse');
  startTurn('entity', CONFIG.camera.endYawTurn, 'turning');
});
bindClick(btns.turnLeft, () => startTurn('desk', CONFIG.camera.endYawDesk, 'turning-left'));
bindClick(btns.turnRight, () => startTurn('wall', CONFIG.camera.endYawWall, 'turning-right'));
bindClick(btns.enter, enterSystem);
bindClick(btns.exit, exitSystem);
bindClick(btns.peer, peekIntoDark);
bindClick(btns.approachDesk, approachDesk);
bindClick(btns.backFromDesk, turnBackFromDesk);
bindClick(btns.approachWall, approachWall);
bindClick(btns.backFromWall, turnBackFromWall);
bindClick(btns.backToWallVignette, backToWallVignette);
bindClick(btns.clearLinks, clearAllLinks);
bindClick(btns.closeNotebook, turnBackFromDesk);
bindClick(btns.backFromNotebook, turnBackFromDesk);
bindClick($('notebookClose'), turnBackFromDesk);
bindClick(btns.openReader, openReader);

/* ============================================================
   KEYBOARD
   ============================================================ */
window.addEventListener('keydown', (e) => {
  if ($('dialog47').classList.contains('active')) {
    if (e.key === 'Escape') closeDialog47();
    return;
  }
  if ($('readerOverlay').classList.contains('active')) {
    if (e.key === 'Escape') closeReader();
    if (e.key === 'ArrowLeft' && readerState.currentChapter > 0) {
      Audio.navClick();
      renderReaderChapter(readerState.currentChapter - 1, true);
    }
    if (e.key === 'ArrowRight' && readerState.currentChapter < CHAPTERS.length - 1) {
      Audio.navClick();
      renderReaderChapter(readerState.currentChapter + 1, true);
    }
    return;
  }
  if ($('notebookOverlay').classList.contains('active')) {
    if (e.key === 'Escape') turnBackFromDesk();
    return;
  }
  if (e.key === 'Escape') {
    if (state.phase === 'idle-at-desk') turnBackFromDesk();
    else if (state.phase === 'idle-at-wall') turnBackFromWall();
    else if (state.phase === 'wall-close') backToWallVignette();
    else if (state.phase === 'inside' || state.phase === 'final') exitSystem();
  }
  if (e.key === 'Enter' && state.phase === 'outside') enterSystem();
});

/* ============================================================
   SCREEN OVERLAY
   ============================================================ */
const ovCtx = $('screenOverlay').getContext('2d');
function resizeOverlay() {
  const pr = Math.min(window.devicePixelRatio, 2);
  $('screenOverlay').width = Math.floor(window.innerWidth * pr);
  $('screenOverlay').height = Math.floor(window.innerHeight * pr);
}
function drawOverlayFromScreen() {
  const c = $('screenOverlay');
  const vw = c.width, vh = c.height;
  ovCtx.fillStyle = '#000';
  ovCtx.fillRect(0, 0, vw, vh);
  const imgAspect = screenCanvas.width / screenCanvas.height;
  const vAspect = vw / vh;
  let dw, dh;
  if (vAspect > imgAspect) { dw = vw; dh = vw / imgAspect; }
  else { dh = vh; dw = vh * imgAspect; }
  ovCtx.drawImage(screenCanvas, (vw - dw) / 2, (vh - dh) / 2, dw, dh);
  const g = ovCtx.createRadialGradient(vw/2, vh/2, Math.min(vw,vh) * 0.25, vw/2, vh/2, Math.max(vw,vh) * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.85)');
  ovCtx.fillStyle = g;
  ovCtx.fillRect(0, 0, vw, vh);
}
resizeOverlay();
window.addEventListener('resize', resizeOverlay);

/* ============================================================
   VISIBILITY / PERF
   ============================================================ */
function updateTerminalVisibility() {
  let vis = 1.0;
  const p = state.transition;
  if (state.phase === 'entering' && p) vis = Math.max(0, 1 - (p.elapsed / p.duration) / 0.7);
  else if (state.phase === 'inside') vis = 0.6;
  else if (state.phase === 'exiting' && p) vis = Math.min(1, (p.elapsed / p.duration) / 0.8);
  else if (state.phase !== 'outside') vis = 0.6;
  const flicker = 0.85 + Math.sin(state.time * 27.0) * 0.04 + Math.sin(state.time * 3.1) * 0.06;
  const v = vis * flicker;
  screenMat.emissiveIntensity = 1.7 * v;
  MATS.neonFrame.emissiveIntensity = 2.6 * v;
  terminalLight.intensity = 4.0 * Math.max(v, 0.55);
  glowSprite.material.opacity = (0.7 + Math.sin(state.time * 2.0) * 0.15) * Math.max(vis, 0.5);
  const glowScale = 6.0 * (0.4 + 0.6 * Math.max(vis, 0.5));
  glowSprite.scale.set(glowScale, glowScale * 0.83, 1);
}
function updatePostFX() {
  horrorPass.uniforms.uTime.value = state.time;
  let abBoost = 1.0;
  const p = state.transition;
  if (p) {
    const phase = p.elapsed / p.duration;
    if (state.phase === 'entering' || state.phase === 'exiting') abBoost = 1.0 + Math.sin(phase * Math.PI) * 3.0;
    else if (state.phase === 'peering') abBoost = 1.0 + Math.sin(phase * Math.PI) * 2.5;
    else if (state.phase.startsWith('turning')) abBoost = 1.0 + Math.sin(phase * Math.PI) * 2.0;
  }
  if (state.doorScene.active) abBoost = Math.max(abBoost, 1.5 + state.doorScene.elapsed * 0.5);
  horrorPass.uniforms.uAberration.value = 0.0035 * abBoost;
  const bloomBase = 1.35;
  const bloomInside = (state.phase === 'inside' || state.phase === 'entering') ? 0.7 : 0;
  const bloomDoor = state.doorScene.silhouetteVisible ? 1.4 : (state.doorScene.active ? 0.6 : 0);
  bloom.strength += ((bloomBase + bloomInside + bloomDoor) - bloom.strength) * 0.05;
}

/* ============================================================
   ANIMATE
   ============================================================ */
function animate() {
  const dt = Math.min(state.clock.getDelta(), 0.05);
  state.time += dt;
  drawScreenImage(state.time);
  screenTex.needsUpdate = true;
  if (state.overlayOn) drawOverlayFromScreen();
  updateTransition(dt);
  if (state.phase === 'inside' || state.phase === 'final') {
    camera.position.x = CONFIG.camera.insidePos.x + Math.sin(state.time * 0.6) * 0.02;
    camera.position.y = CONFIG.camera.insidePos.y + Math.cos(state.time * 0.8) * 0.015;
  }
  if (state.doorScene.active) {
    state.doorScene.elapsed += dt;
    if (state.doorScene.silhouetteVisible && !state.doorScene.fired && !state.doorScene.spoke) {
      const s = 0.0025;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s;
      camera.rotation.z = (Math.random() - 0.5) * 0.005;
    }
  }
  updateTerminalVisibility();
  updatePostFX();
  if (deskGroup.visible) notebookGlowSprite.material.opacity = 0.3 + Math.sin(state.time * 2.5) * 0.1;
  composer.render();
  requestAnimationFrame(animate);
}

/* ============================================================
   RESIZE
   ============================================================ */
let resizeRafId = null;
function onResize() {
  if (resizeRafId) cancelAnimationFrame(resizeRafId);
  resizeRafId = requestAnimationFrame(() => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    const aspectFactor = Math.min(1, w / 900);
    terminalGroup.scale.setScalar(0.92 * (0.7 + 0.3 * aspectFactor));
    updateFXAA();
    resizeOverlay();
    if (state.overlayOn) drawOverlayFromScreen();
    if ($('photoWall').classList.contains('active')) redrawConnections();
  });
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

/* ============================================================
   SOUND TOGGLE
   ============================================================ */
$('soundToggle').addEventListener('click', (e) => {
  e.stopPropagation();
  const nowEnabled = !Audio.isEnabled();
  Audio.setEnabled(nowEnabled);
  DialogAudio.setEnabled(nowEnabled);
  $('soundToggle').textContent = nowEnabled ? 'ЗВУК' : 'ВЫКЛ';
  if (nowEnabled) Audio.click();
});

/* ============================================================
   BOOT
   ============================================================ */
function startExperience() {
  Audio.resume();
  Audio.startDrone();
  $('boot').classList.add('hide');
  Timers.set('boot-hide', () => { $('boot').style.display = 'none'; }, 800);
}
$('boot').addEventListener('click', startExperience, { once: true });
$('boot').addEventListener('touchstart', startExperience, { once: true, passive: true });

logLine('Инициализация...', true);
setTimeout(() => logLine('Терминал OBJ-4471', false), 400);
setTimeout(() => logLine('Архив из 48 глав доступен', true), 1000);

if (state.chaptersOpened.size > 0) {
  refreshPhotoReveal();
  updateTerminalAging();
}
if (state.cycle47Complete) {
  btns.turn.classList.remove('highlight-pulse');
}

animate();
