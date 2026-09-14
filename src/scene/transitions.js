import { CONFIG, Easing, clamp } from '../config.js';
import { state } from '../core/state.js';
import { camera } from './renderer.js';

export function beginTransition(fromPos, toPos, fromRotX, toRotX, fromYaw, toYaw, duration, onComplete) {
  state.transition = {
    fromPos: fromPos.clone(),
    toPos: toPos.clone(),
    fromRotX, toRotX, fromYaw, toYaw,
    duration, elapsed: 0, onComplete,
  };
}

export function updateTransition(dt) {
  const tr = state.transition;
  if (!tr) return;
  tr.elapsed += dt;
  const raw = clamp(tr.elapsed / tr.duration, 0, 1);
  const k = Easing.easeInOutCubic(raw);
  camera.position.lerpVectors(tr.fromPos, tr.toPos, k);
  camera.rotation.x = tr.fromRotX + (tr.toRotX - tr.fromRotX) * k;
  camera.rotation.y = tr.fromYaw + (tr.toYaw - tr.fromYaw) * k;
  if (raw >= 1) {
    camera.position.copy(tr.toPos);
    camera.rotation.x = tr.toRotX;
    camera.rotation.y = tr.toYaw;
    const cb = tr.onComplete;
    state.transition = null;
    if (cb) cb();
  }
}
