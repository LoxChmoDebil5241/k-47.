import * as THREE from 'three';

const _state = {
  phase: 'outside',
  time: 0,
  clock: new THREE.Clock(),
  overlayOn: false,
  transition: null,
  doorScene: {
    active: false, elapsed: 0, frameVisible: false,
    silhouetteVisible: false, spoke: false, fired: false,
  },
  chaptersOpened: new Set(),
  endingTriggered: false,
  endingComplete: false,
  cycle47Complete: false,
  agreementAccepted: false,
  systemWarningShown: false,
};

export const GameState = {
  get: () => _state,
  reset: () => {
    _state.endingTriggered = false;
    _state.endingComplete = false;
    _state.doorScene = {
      active: false, elapsed: 0, frameVisible: false,
      silhouetteVisible: false, spoke: false, fired: false,
    };
  },
  resetCycle: () => { _state.cycle47Complete = false; },
};

export const state = _state;
