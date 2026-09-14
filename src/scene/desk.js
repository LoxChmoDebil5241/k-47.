import * as THREE from 'three';
import { scene } from './renderer.js';
import { glowTex } from './room.js';

export const deskGroup = new THREE.Group();
deskGroup.position.set(6.0, 0, 0);
deskGroup.rotation.y = -Math.PI / 2;
deskGroup.visible = false;
scene.add(deskGroup);

const deskTopMat = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.7, metalness: 0.05 });
const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.1), deskTopMat);
deskTop.position.y = 0.9; deskGroup.add(deskTop);

const deskEdgeMat = new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 0.8 });
const deskEdge = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.02, 1.14), deskEdgeMat);
deskEdge.position.y = 0.94; deskGroup.add(deskEdge);

const legMat = new THREE.MeshStandardMaterial({ color: 0x14100a, roughness: 0.85, metalness: 0.1 });
const legGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.9, 8);
[[-0.85, 0.45, -0.45], [0.85, 0.45, -0.45], [-0.85, 0.45, 0.45], [0.85, 0.45, 0.45]].forEach(pos => {
  const leg = new THREE.Mesh(legGeo, legMat);
  leg.position.set(...pos); deskGroup.add(leg);
});

const notebookGroup = new THREE.Group();
notebookGroup.position.set(0.15, 0.95, 0.0);
notebookGroup.rotation.y = 0.15;
deskGroup.add(notebookGroup);

const paperMat = new THREE.MeshStandardMaterial({
  color: 0xe8dcc0, roughness: 0.95, metalness: 0.0,
  emissive: 0x221a0a, emissiveIntensity: 0.15,
});
const paperStack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.66), paperMat);
paperStack.position.y = 0.025; notebookGroup.add(paperStack);

const coverMat = new THREE.MeshStandardMaterial({
  color: 0x3a1a0a, roughness: 0.75, metalness: 0.1,
  emissive: 0x1a0a02, emissiveIntensity: 0.3,
});
const cover = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.04, 0.68), coverMat);
cover.position.y = -0.01; notebookGroup.add(cover);

const ribbonMat = new THREE.MeshStandardMaterial({
  color: 0xaa1a1a, roughness: 0.7, emissive: 0x330000, emissiveIntensity: 0.4,
});
const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.001, 0.28), ribbonMat);
ribbon.position.set(0.05, 0.053, 0.42); notebookGroup.add(ribbon);

export const notebookGlowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: 0xffaa66,
  blending: THREE.AdditiveBlending, transparent: true,
  depthWrite: false, opacity: 0.35,
}));
notebookGlowSprite.scale.set(1.4, 1.0, 1);
notebookGlowSprite.position.set(0.15, 1.15, 0.0);
deskGroup.add(notebookGlowSprite);

const mugMat = new THREE.MeshStandardMaterial({ color: 0x2a1a1a, roughness: 0.8, metalness: 0.15 });
const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.14, 16), mugMat);
mug.position.set(-0.6, 1.01, -0.15); deskGroup.add(mug);

const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 12, Math.PI), mugMat);
handle.rotation.z = Math.PI / 2;
handle.position.set(-0.53, 1.01, -0.15);
deskGroup.add(handle);
