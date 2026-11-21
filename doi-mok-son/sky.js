// Trip clock → sun elevation, sky gradient, fog, light rig, night factor.
import * as THREE from 'three';
import { clamp, lerp } from '/core/lib.js';

const H = 3600;
export const RISE = 6 * H + 5 * 60, SET = 18 * H;
export function sunElev(c) {
  const d = ((c % (24 * H)) + 24 * H) % (24 * H);
  if (d >= RISE && d <= SET) return 62 * Math.sin(Math.PI * (d - RISE) / (SET - RISE));
  const nt = d > SET ? d - SET : d + 24 * H - SET, nl = RISE + 24 * H - SET;
  return -42 * Math.sin(Math.PI * nt / nl);
}

const skyMat = new THREE.ShaderMaterial({
  uniforms: { zen: { value: new THREE.Color() }, horS: { value: new THREE.Color() }, horA: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(1, .1, 0) }, sunCol: { value: new THREE.Color() }, glow: { value: 1 } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
  fragmentShader: `varying vec3 vD; uniform vec3 zen, horS, horA, sunDir, sunCol; uniform float glow;
    void main(){ vec3 d = normalize(vD); float t = max(d.y, 0.);
      vec2 hd = normalize(d.xz + 1e-5), hs = normalize(sunDir.xz + 1e-5); float side = dot(hd, hs) * .5 + .5;
      vec3 hor = mix(horA, horS, pow(side, 2.2));
      vec3 c = mix(hor, zen, pow(t, .5));
      float s = max(dot(d, normalize(sunDir)), 0.);
      c += sunCol * (pow(s, 6.) * .35 + pow(s, 60.) * .7) * glow;
      c += sunCol * smoothstep(.9994, .9997, s) * 9. * glow;
      if (d.y < 0.) c = hor;
      gl_FragColor = vec4(c, 1.); }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});

// keyframes by sun elevation (degrees)
const K = [
  { e: -30, zen: '#03071a', horS: '#0a1230', horA: '#081028', sun: '#ff7a3c', sunI: 0, hemS: '#3a5290', hemG: '#141822', hemI: .55, night: 1, fog: '#0f1a36', expo: 1.6, glow: 0, mist: '#5a6a96', mistS: '#2a3458' },
  { e: -10, zen: '#081236', horS: '#1c2550', horA: '#121c44', sun: '#ff7a3c', sunI: 0, hemS: '#40589a', hemG: '#181c28', hemI: .6, night: 1, fog: '#18244a', expo: 1.6, glow: .1, mist: '#6a78a6', mistS: '#323c66' },
  { e: -4, zen: '#1e3170', horS: '#e5866a', horA: '#3c4c88', sun: '#ff8a60', sunI: 0, hemS: '#6076b6', hemG: '#2a2a36', hemI: .8, night: .75, fog: '#4c5688', expo: 1.45, glow: .7, mist: '#d8b0b4', mistS: '#7a7ea8' },
  { e: 0, zen: '#2f53a0', horS: '#f8a060', horA: '#7a86b4', sun: '#ff9a50', sunI: 1.6, hemS: '#7a8cc4', hemG: '#4a4038', hemI: .75, night: .45, fog: '#a09aba', expo: 1.25, glow: 1, mist: '#ffd8c0', mistS: '#a8a4c8' },
  { e: 4, zen: '#4a7cc4', horS: '#f8c690', horA: '#a9b8d4', sun: '#ffb877', sunI: 3.0, hemS: '#8aa6d6', hemG: '#5d5448', hemI: .7, night: .1, fog: '#b9c2d6', expo: 1.08, glow: 1, mist: '#fff0e0', mistS: '#c0c4dc' },
  { e: 14, zen: '#3f86d8', horS: '#eadcc4', horA: '#c3d3e6', sun: '#ffdcb0', sunI: 4.2, hemS: '#b3c6dc', hemG: '#8a7a62', hemI: .62, night: 0, fog: '#c4d2e2', expo: 1.0, glow: .9, mist: '#ffffff', mistS: '#d0d8e6' },
  { e: 70, zen: '#3a80dc', horS: '#dfe6ea', horA: '#cddcec', sun: '#fff0dc', sunI: 4.8, hemS: '#b8cae0', hemG: '#8d7d66', hemI: .6, night: 0, fog: '#c8d6e6', expo: 1.0, glow: .8, mist: '#ffffff', mistS: '#d4dcea' },
];
const _a = new THREE.Color(), _b = new THREE.Color();
const cl = (k0, k1, u, f) => _a.set(k0[f]).lerp(_b.set(k1[f]), u).clone();
export function skyState(e) {
  let i = 0; while (i < K.length - 2 && e > K[i + 1].e) i++;
  const k0 = K[i], k1 = K[i + 1], u = clamp((e - k0.e) / (k1.e - k0.e));
  const o = { e };
  for (const f of ['zen', 'horS', 'horA', 'sun', 'hemS', 'hemG', 'fog', 'mist', 'mistS']) o[f] = cl(k0, k1, u, f);
  for (const f of ['sunI', 'hemI', 'night', 'expo', 'glow']) o[f] = lerp(k0[f], k1[f], u);
  return o;
}

export function makeSky(scene, renderer) {
  const dome = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 16), skyMat); dome.frustumCulled = false; dome.renderOrder = -2; scene.add(dome);
  const sun = new THREE.DirectionalLight('#fff', 3); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .5; sun.shadow.radius = 2;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#9cbce6', '#6b6356', .9); scene.add(hemi);
  const fill = new THREE.DirectionalLight('#ffb48c', 0); scene.add(fill, fill.target);   // low warm fill from the sunrise side
  scene.fog = new THREE.FogExp2('#c8d4e2', .00016);
  const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat));
  const pm = new THREE.PMREMGenerator(renderer); const cache = new Map();
  const env = e => { const key = Math.round(e); if (!cache.has(key)) cache.set(key, pm.fromScene(envScene, 0, .1, 200).texture); return cache.get(key); };

  // dir: unit vector toward the sun's azimuth (horizontal), e: elevation in degrees
  function apply(e, azDir, focus, span, o = {}) {
    const s = skyState(e), er = e * Math.PI / 180;
    const dir = new THREE.Vector3(azDir.x * Math.cos(er), Math.sin(er), azDir.z * Math.cos(er)).normalize();
    const U = skyMat.uniforms;
    U.zen.value.copy(s.zen); U.horS.value.copy(s.horS); U.horA.value.copy(s.horA); U.sunDir.value.copy(dir); U.sunCol.value.copy(s.sun); U.glow.value = s.glow;
    const d = dir.clone(); if (d.y < .07) { d.y = .07; d.normalize(); }
    sun.color.copy(s.sun); sun.intensity = s.sunI * (o.sunMul ?? 1);
    sun.position.copy(focus).addScaledVector(d, 1500); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
    Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 100, far: 3200 }); sun.shadow.camera.updateProjectionMatrix();
    hemi.color.copy(s.hemS); hemi.groundColor.copy(s.hemG); hemi.intensity = s.hemI * (o.hemMul ?? 1);
    scene.fog.color.copy(s.fog); scene.fog.density = o.fog ?? .00016;
    const gi = clamp((3 - e) / 5) * clamp((e + 9) / 5) * 1.1; fill.intensity = gi;
    fill.position.copy(focus).add(new THREE.Vector3(azDir.x, .2, azDir.z).multiplyScalar(500)); fill.target.position.copy(focus); fill.target.updateMatrixWorld();
    scene.environment = env(e); scene.environmentIntensity = .3 + .3 * (1 - s.night);
    return { ...s, dir };
  }
  return { dome, sun, hemi, apply };
}
