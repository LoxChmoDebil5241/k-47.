import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { CONFIG } from '../config.js';
import { state } from '../core/state.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x050005, CONFIG.render.fogDensity);

export const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov,
  window.innerWidth / window.innerHeight,
  CONFIG.camera.near,
  CONFIG.camera.far
);
camera.position.copy(CONFIG.camera.outsidePos);
camera.rotation.order = 'YXZ';
camera.rotation.x = CONFIG.camera.outsideRotX;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: 'high-performance',
    stencil: false,
    preserveDrawingBuffer: true,
  });
} catch (e) {
  document.body.innerHTML = '<div style="color:#f35;padding:40px;font-family:monospace">WebGL не поддерживается</div>';
  throw e;
}
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.render.pixelRatioMax));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CONFIG.render.toneMappingExposure;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

export const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.35, 0.65, 0.15
);
composer.addPass(bloom);

const HorrorShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAberration: { value: 0.0035 },
    uVignette: { value: 1.15 },
    uGrain: { value: 0.045 },
    uRedTint: { value: 0.0 },
    uScanline: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime, uAberration, uVignette, uGrain, uRedTint, uScanline;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main() {
      vec2 uv = vUv;
      vec2 dir = uv - 0.5;
      float d = length(dir);
      vec2 offset = normalize(dir + 1e-6) * uAberration * d;
      float r = texture2D(tDiffuse, uv - offset).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv + offset).b;
      vec3 col = vec3(r, g, b);
      col.r += uRedTint * 0.15 * (1.0 - d);
      float vig = smoothstep(0.88, 0.22, d * uVignette);
      col *= mix(0.30, 1.0, vig);
      float n = hash(uv * vec2(1920.0, 1080.0) + uTime * 0.7);
      col += (n - 0.5) * uGrain;
      float scan = sin(uv.y * 900.0) * 0.5 + 0.5;
      col *= 1.0 - scan * uScanline;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export const horrorPass = new ShaderPass(HorrorShader);
composer.addPass(horrorPass);

export const fxaa = new ShaderPass(FXAAShader);
function updateFXAA() {
  const pr = renderer.getPixelRatio();
  fxaa.material.uniforms.resolution.value.set(
    1 / (window.innerWidth * pr),
    1 / (window.innerHeight * pr)
  );
}
updateFXAA();
composer.addPass(fxaa);

export { renderer, updateFXAA };
