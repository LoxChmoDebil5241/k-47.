import * as THREE from 'three';

export const CONFIG = {
  render: {
    pixelRatioMax: 1.75,
    toneMappingExposure: 1.15,
    fogDensity: 0.055,
  },
  camera: {
    fov: 60, near: 0.05, far: 200,
    outsidePos: new THREE.Vector3(0, 2.15, 2.6),
    outsideRotX: -0.14,
    insidePos: new THREE.Vector3(0, 1.55, -3.4),
    deskViewPos: new THREE.Vector3(3.4, 1.8, 0),
    deskViewRotX: -0.25,
    deskApproachPos: new THREE.Vector3(1.8, 1.55, 0),
    deskApproachRotX: -0.45,
    wallViewPos: new THREE.Vector3(-3.4, 1.8, 0),
    wallViewRotX: -0.1,
    wallApproachPos: new THREE.Vector3(-6.4, 1.7, 0),
    wallApproachRotX: -0.02,
    peerPos: new THREE.Vector3(0, 2.15, -1.8),
    peerRotX: -0.14,
    endYawTurn: -Math.PI * 0.62,
    endYawDesk: -Math.PI / 2,
    endYawWall: Math.PI / 2,
    endYawOutside: 0,
  },
  timings: { turn: 1.8, approach: 1.5, enter: 1.6, exit: 1.6, peer: 1.8 },
  notebook: {
    pages: 47,
    key: 'obj4471_notebook_47',
    maxCharsPerPage: 4000,
    saveDebounceMs: 400,
  },
  photos: { count: 47 },
};

export const Easing = {
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export const $ = id => document.getElementById(id);
