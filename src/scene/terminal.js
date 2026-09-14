import * as THREE from 'three';
import { scene } from './renderer.js';
import { MATS, glowTex } from './room.js';

const screenCanvas = document.createElement('canvas');
screenCanvas.width = 512;
screenCanvas.height = 384;
const sctx = screenCanvas.getContext('2d');

export function drawScreenImage(t) {
  const W = screenCanvas.width, H = screenCanvas.height;
  sctx.fillStyle = '#0a0002'; sctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 4) {
    sctx.fillStyle = 'rgba(255,0,51,0.06)';
    sctx.fillRect(0, y, W, 2);
  }
  sctx.strokeStyle = 'rgba(255,0,51,0.18)'; sctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 32) { sctx.beginPath(); sctx.moveTo(x, 0); sctx.lineTo(x, H); sctx.stroke(); }
  for (let y = 0; y <= H; y += 32) { sctx.beginPath(); sctx.moveTo(0, y); sctx.lineTo(W, y); sctx.stroke(); }
  sctx.fillStyle = '#ff3355';
  sctx.font = 'bold 22px "Courier New", monospace';
  sctx.fillText('> OBJ-4471 / ТЕРМИНАЛ', 22, 40);
  sctx.font = '16px "Courier New", monospace';
  sctx.fillStyle = '#ff5577';
  sctx.fillText('> СИСТЕМА ГОТОВА', 22, 80);
  sctx.fillText('> АРХИВ ДОСТУПЕН', 22, 108);
  sctx.fillText('> 48 ГЛАВ', 22, 136);
  sctx.fillText('> КОД: •••• •••• ••••', 22, 164);
  const cx = W * 0.72, cy = H * 0.65, r = 70;
  sctx.beginPath(); sctx.arc(cx, cy, r, 0, Math.PI * 2);
  sctx.strokeStyle = 'rgba(255,0,51,0.25)'; sctx.lineWidth = 3; sctx.stroke();
  const a0 = (t * 1.5) % (Math.PI * 2);
  sctx.beginPath(); sctx.arc(cx, cy, r, a0, a0 + Math.PI * 0.7);
  sctx.strokeStyle = '#ff0033'; sctx.lineWidth = 5;
  sctx.shadowColor = '#ff0033'; sctx.shadowBlur = 20; sctx.stroke(); sctx.shadowBlur = 0;
  sctx.fillStyle = '#ff3355';
  sctx.font = 'bold 14px "Courier New", monospace';
  sctx.textAlign = 'center';
  sctx.fillText('SCAN', cx, cy + 4);
  sctx.textAlign = 'left';
  if (Math.floor(t * 3) % 2 === 0) { sctx.fillStyle = '#ff3355'; sctx.fillRect(22, H - 40, 12, 18); }
  const barW = W - 44;
  sctx.fillStyle = 'rgba(255,0,51,0.15)'; sctx.fillRect(22, H - 20, barW, 4);
  sctx.fillStyle = '#ff0033';
  sctx.shadowColor = '#ff0033'; sctx.shadowBlur = 10;
  sctx.fillRect(22, H - 20, barW * (Math.sin(t * 0.7) * 0.5 + 0.5), 4);
  sctx.shadowBlur = 0;
}

drawScreenImage(0);
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
screenTex.anisotropy = 4;

export const terminalGroup = new THREE.Group();
terminalGroup.position.set(0, 1.55, -3.4);
terminalGroup.scale.setScalar(0.92);
scene.add(terminalGroup);

const bodyW = 3.2, bodyH = 2.4, bodyD = 0.5;
const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), MATS.case);
body.position.y = 0.15; terminalGroup.add(body);

const topBevel = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.06, 0.08, bodyD + 0.06), MATS.caseLight);
topBevel.position.y = 0.15 + bodyH / 2 + 0.02; terminalGroup.add(topBevel);

const chin = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.04, 0.15, bodyD + 0.08), MATS.caseLight);
chin.position.y = 0.15 - bodyH / 2 - 0.04; chin.rotation.x = 0.18; terminalGroup.add(chin);

const innerFrame = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.18, bodyH - 0.18, bodyD - 0.02), MATS.inner);
innerFrame.position.y = 0.15; terminalGroup.add(innerFrame);

export const screenMat = new THREE.MeshStandardMaterial({
  map: screenTex, emissive: 0xffffff, emissiveMap: screenTex,
  emissiveIntensity: 1.7, roughness: 0.25, metalness: 0.0,
});
const screenW = bodyW - 0.35, screenH = bodyH - 0.35;
const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), screenMat);
screenMesh.position.set(0, 0.15, bodyD / 2 + 0.005);
terminalGroup.add(screenMesh);

const bezelThickness = 0.06, bezelDepth = 0.025;
const bezelFrameW = screenW + 0.12, bezelFrameH = screenH + 0.12;
const bezelTop = new THREE.Mesh(new THREE.BoxGeometry(bezelFrameW, bezelThickness, bezelDepth), MATS.bezel);
bezelTop.position.set(0, 0.15 + screenH/2 + bezelThickness/2 + 0.02, bodyD/2 + bezelDepth/2);
terminalGroup.add(bezelTop);
const bezelBot = bezelTop.clone();
bezelBot.position.y = 0.15 - screenH/2 - bezelThickness/2 - 0.02;
terminalGroup.add(bezelBot);
const bezelLeft = new THREE.Mesh(new THREE.BoxGeometry(bezelThickness, bezelFrameH, bezelDepth), MATS.bezel);
bezelLeft.position.set(-screenW/2 - bezelThickness/2 - 0.02, 0.15, bodyD/2 + bezelDepth/2);
terminalGroup.add(bezelLeft);
const bezelRight = bezelLeft.clone();
bezelRight.position.x = screenW/2 + bezelThickness/2 + 0.02;
terminalGroup.add(bezelRight);

const lowerLipMat = new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.45, metalness: 0.85 });
const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(bezelFrameW + 0.02, 0.16, bezelDepth + 0.04), lowerLipMat);
lowerLip.position.set(0, 0.15 - screenH/2 - bezelThickness - 0.08 - 0.03, bodyD/2 + (bezelDepth + 0.04)/2 - 0.005);
terminalGroup.add(lowerLip);

const neonOffset = bodyD/2 + bezelDepth + 0.003;
const neonTop = new THREE.Mesh(new THREE.BoxGeometry(screenW + 0.04, 0.012, 0.005), MATS.neonFrame);
neonTop.position.set(0, 0.15 + screenH/2 + 0.045, neonOffset); terminalGroup.add(neonTop);
const neonBot = neonTop.clone(); neonBot.position.y = 0.15 - screenH/2 - 0.045; terminalGroup.add(neonBot);
const neonLeft = new THREE.Mesh(new THREE.BoxGeometry(0.012, screenH + 0.04, 0.005), MATS.neonFrame);
neonLeft.position.set(-screenW/2 - 0.045, 0.15, neonOffset); terminalGroup.add(neonLeft);
const neonRight = neonLeft.clone(); neonRight.position.x = screenW/2 + 0.045; terminalGroup.add(neonRight);

const neckMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0d, roughness: 0.6, metalness: 0.6 });
const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 0.9, 16), neckMat);
stand.position.y = -1.35; terminalGroup.add(stand);
const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.08, 24), neckMat);
base.position.y = -1.80; terminalGroup.add(base);

export const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: 0xff0033,
  blending: THREE.AdditiveBlending, transparent: true,
  depthWrite: false, opacity: 0.85,
}));
glowSprite.scale.set(6.0, 5.0, 1);
glowSprite.position.set(0, 0.15, 0.4);
terminalGroup.add(glowSprite);

export { screenCanvas, screenTex };
