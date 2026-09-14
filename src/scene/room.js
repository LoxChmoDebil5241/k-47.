import * as THREE from 'three';
import { scene } from './renderer.js';

scene.add(new THREE.AmbientLight(0x1a1a1f, 0.35));
scene.add(new THREE.HemisphereLight(0x442233, 0x0a0a0f, 0.4));

export const terminalLight = new THREE.PointLight(0xff0033, 4.0, 14, 1.8);
terminalLight.position.set(0, 1.7, -3.2);
scene.add(terminalLight);

export const deskLight = new THREE.PointLight(0xffaa66, 0.0, 8, 1.5);
deskLight.position.set(0, 2.6, 5.5);
scene.add(deskLight);

export const MATS = {
  room: new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: 0.95, metalness: 0.05 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x0e0e12, roughness: 1.0 }),
  case: new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.65, metalness: 0.55 }),
  caseLight: new THREE.MeshStandardMaterial({ color: 0x1a1a1f, roughness: 0.5, metalness: 0.7 }),
  inner: new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1.0 }),
  bezel: new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.55, metalness: 0.75 }),
  neonFrame: new THREE.MeshStandardMaterial({
    color: 0xff0033, emissive: 0xff0033, emissiveIntensity: 2.6,
    roughness: 0.35, metalness: 0.0,
  }),
};

const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), MATS.floor);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), MATS.room);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 3.2;
scene.add(ceiling);

const wallGeo = new THREE.PlaneGeometry(16, 3.2);
function wall(x, y, z, ry) {
  const w = new THREE.Mesh(wallGeo, MATS.room);
  w.position.set(x, y, z); w.rotation.y = ry; scene.add(w);
}
wall(0, 1.6, -8, 0);
wall(8, 1.6, 0, -Math.PI / 2);
wall(0, 1.6, 8, Math.PI);

const lw1 = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3.2), MATS.room);
lw1.position.set(-8, 1.6, -3.25); lw1.rotation.y = Math.PI / 2; scene.add(lw1);
const lw2 = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3.2), MATS.room);
lw2.position.set(-8, 1.6, 3.25); lw2.rotation.y = Math.PI / 2; scene.add(lw2);

const lintel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), MATS.room);
lintel.position.set(-8, 2.7, 0); lintel.rotation.y = Math.PI / 2; scene.add(lintel);

const rw = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.2), MATS.room);
rw.position.set(8, 1.6, 0); rw.rotation.y = -Math.PI / 2; scene.add(rw);

const corridorMat = new THREE.MeshStandardMaterial({ color: 0x08080c, roughness: 1.0 });
const corridorFloor = new THREE.Mesh(new THREE.PlaneGeometry(3, 6), corridorMat);
corridorFloor.rotation.x = -Math.PI / 2; corridorFloor.rotation.z = Math.PI / 2;
corridorFloor.position.set(-9.5, 0, 0); scene.add(corridorFloor);

const corridorBack = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.2), corridorMat);
corridorBack.rotation.y = Math.PI / 2; corridorBack.position.set(-11, 1.6, 0); scene.add(corridorBack);

export function createGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const glowTex = createGlowTexture();
