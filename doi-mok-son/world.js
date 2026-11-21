// ดอยหมอกสน — the procedural mountain: terrain, pine forest, trail, road, trailhead, camp meadow, mist, stars.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, mulberry } from '/core/lib.js';

// ——— noise ———
function h2(i, j) { let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
function vn(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return lerp(lerp(h2(i, j), h2(i + 1, j), u), lerp(h2(i, j + 1), h2(i + 1, j + 1), u), v);
}
export function fbm(x, z, o = 4) { let a = .5, s = 0, n = 0; for (let k = 0; k < o; k++) { s += a * vn(x, z); n += a; x = x * 2.03 + 17.1; z = z * 2.03 - 9.4; a *= .5; } return s / n; }
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ——— layout ———
export const CAMP = new THREE.Vector3(-8, 0, 0);
export const PARK = { x: -352, z: 82, w: 34, d: 20 };
const rnd = mulberry(7);
const HILLS = [];
for (let i = 0; i < 34; i++) HILLS.push({ x: 1500 + rnd() * 2400, z: -2600 + rnd() * 5200, h: 40 + rnd() * 85, w: 140 + rnd() * 240 });
for (let i = 0; i < 14; i++) HILLS.push({ x: -3200 + rnd() * 2300, z: -2600 + rnd() * 5200, h: 70 + rnd() * 120, w: 200 + rnd() * 300 });
// a near "island" peak just east, so the sea of mist has a shore
HILLS.push({ x: 620, z: -380, h: 95, w: 80 }, { x: 820, z: 330, h: 105, w: 100 }, { x: 1250, z: -60, h: 120, w: 150 });

function rawH(x, z) {
  const spine = 178 + 14 * Math.sin(z / 150 + .6) + 8 * Math.sin(z / 61 + 2);
  const w = x < 0 ? 175 : 74;
  let h = spine * Math.exp(-x * x / (2 * w * w)) + 6;
  for (const k of HILLS) { const dx = x - k.x, dz = z - k.z; h += k.h * Math.exp(-(dx * dx + dz * dz) / (2 * k.w * k.w)); }
  const dc = Math.hypot(x - CAMP.x, z - CAMP.z);
  h += (fbm(x * .011, z * .011) - .5) * 30 * sstep(40, 140, dc) * (x > 60 && x < 1400 ? .4 : 1) + (fbm(x * .05, z * .05, 2) - .5) * 4;
  return h;
}
const CAMP_H = rawH(CAMP.x, CAMP.z) + 1.5;
const PARK_H = rawH(PARK.x, PARK.z) - 1;
export function terrainH(x, z) {
  let h = rawH(x, z);
  // camp meadow: an ellipse, its east edge at x ≈ 20 where the ridge falls away
  const ex = (x - CAMP.x) / 30, ez = (z - CAMP.z) / 27, e = Math.sqrt(ex * ex + ez * ez);
  h = lerp(h, CAMP_H + (fbm(x * .08, z * .08, 2) - .5) * .8, 1 - sstep(.85, 1.25, e));
  const px = (x - PARK.x) / (PARK.w * .8), pz = (z - PARK.z) / (PARK.d * .9), pe = Math.max(Math.abs(px), Math.abs(pz));
  h = lerp(h, PARK_H, 1 - sstep(1, 1.9, pe));
  return h;
}

// ——— paths ———
function catmull(P, step) {
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, P.length - 1)];
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.ceil(L / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(P[P.length - 1]);
  return out;
}
function measure(P) { const S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return S; }
export function makePath(ctrl, step = 1) {
  const P = catmull(ctrl, step), S = measure(P);
  const at = s => {
    s = clamp(s, 0, S[S.length - 1] - 1e-3);
    let i = 0, j = S.length - 1; while (j - i > 1) { const m = (i + j) >> 1; if (S[m] <= s) i = m; else j = m; }
    const u = (s - S[i]) / (S[j] - S[i] || 1), x = lerp(P[i][0], P[j][0], u), z = lerp(P[i][1], P[j][1], u);
    return { x, z, y: terrainH(x, z), yaw: Math.atan2(P[j][0] - P[i][0], P[j][1] - P[i][1]) };
  };
  return { P, S, len: S[S.length - 1], at };
}
// trail: trailhead arch → switchbacks up the west slope → camp meadow
export const TRAIL = makePath([[-336, 64], [-318, 52], [-292, 46], [-268, 30], [-262, 18], [-238, 12], [-214, 22], [-196, 8], [-178, -6], [-150, 2], [-128, 14], [-104, 4], [-84, -8], [-62, -2], [-44, 6], [-30, 2]]);
export const ROAD = makePath([[-900, 420], [-760, 330], [-640, 300], [-540, 210], [-470, 170], [-420, 110], [-385, 88], [PARK.x + 6, PARK.z + 2]], 2);

function distTo(path, x, z) { let d = 1e9; const P = path.P; for (let i = 0; i < P.length; i += 2) { const dx = P[i][0] - x, dz = P[i][1] - z; const q = dx * dx + dz * dz; if (q < d) d = q; } return Math.sqrt(d); }

// ——— materials ———
const C = c => new THREE.Color(c);
function col(x, z, h, slope) {
  const n = fbm(x * .02, z * .02, 3), n2 = fbm(x * .11 + 40, z * .11, 2);
  const forest = C('#33622a').lerp(C('#4a7a32'), n).lerp(C('#6b6a3a'), n2 * .35);
  let c = forest;
  // rice paddies and fields in the low valleys (saturated, patchy)
  if (h < 34) {
    const k = clamp((34 - h) / 10), cell = h2(Math.floor((x + z * .3) / 26), Math.floor((z - x * .3) / 18));
    const f = cell < .45 ? C('#8cd23c') : cell < .75 ? C('#b8d84a') : cell < .9 ? C('#5fae32') : C('#d8c05a');
    c = c.clone().lerp(f, k);
  }
  // golden ridge grass on the high bare slopes and the meadow
  const dc = Math.hypot(x - CAMP.x, z - CAMP.z);
  const meadow = 1 - sstep(30, 48, dc);
  const high = sstep(150, 175, h) * (n2 > .45 ? 1 : .6);
  c = c.clone().lerp(C('#5c7d32').lerp(C('#9a9046'), n2 * .7), Math.max(meadow, high * .7));
  // rock on steep faces
  c.lerp(C('#8c7b66'), sstep(.55, .8, slope) * .8);
  return c;
}

function buildTerrain(scene) {
  const mk = (x0, x1, z0, z1, nx, nz, sinkBox) => {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
    const p = g.attributes.position, cols = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i); let h = terrainH(x, z);
      if (sinkBox && x > sinkBox[0] && x < sinkBox[1] && z > sinkBox[2] && z < sinkBox[3]) h -= 40;
      p.setY(i, h);
    }
    g.computeVertexNormals();
    const nr = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { const c = col(p.getX(i), p.getZ(i), p.getY(i), 1 - nr.getY(i)); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return g;
  };
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, metalness: 0 });
  const main = new THREE.Mesh(mk(-650, 350, -500, 500, 250, 250), mat); main.receiveShadow = true; main.castShadow = true;
  const far = new THREE.Mesh(mk(-3500, 4500, -3500, 3500, 160, 140, [-649, 349, -499, 499]), mat); far.receiveShadow = true;
  scene.add(main, far);
}

function ribbon(path, w, y0, color, step = 1) {
  const pos = [], idx = [];
  const P = path.P;
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(i - 1, 0)], b = P[Math.min(i + 1, P.length - 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const nx = -dz * w / 2, nz = dx * w / 2;
    for (const s of [-1, 1]) { const x = P[i][0] + nx * s, z = P[i][1] + nz * s; pos.push(x, terrainH(x, z) + y0, z); }
    if (i > 0) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color, roughness: .9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 });
  m.side = THREE.DoubleSide; const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; return mesh;
}

// ——— pine trees (instanced) ———
function pineGeo(detail) {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(.18, .32, 6, 5); trunk.translate(0, 3, 0); parts.push([trunk, '#5b3a24']);
  const layers = detail ? [[0, 4.2, 6.5], [3.2, 3.4, 5.5], [6, 2.4, 4.6], [8.4, 1.3, 3.4]] : [[0, 4, 9], [5, 2.4, 6]];
  for (const [y, r, h] of layers) { const c = new THREE.ConeGeometry(r, h, detail ? 8 : 6); c.translate(0, 5 + y + h / 2, 0); parts.push([c, '#ffffff']); }
  const geos = parts.map(([g, c]) => { const cc = C(c), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g.toNonIndexed ? g.toNonIndexed() : g; });
  return mergeGeometries(geos);
}
function buildForest(scene) {
  const r = mulberry(21);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 });
  const place = (n, box, scale, geo, test) => {
    const im = new THREE.InstancedMesh(geo, mat, n); im.castShadow = true; im.receiveShadow = true;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
    let k = 0, tries = 0;
    while (k < n && tries < n * 30) {
      tries++;
      const x = lerp(box[0], box[1], r()), z = lerp(box[2], box[3], r());
      if (!test(x, z)) continue;
      const h = terrainH(x, z);
      const sc = scale * (.7 + r() * .6);
      p.set(x, h - .5, z); e.set((r() - .5) * .06, r() * 6.28, (r() - .5) * .06); q.setFromEuler(e); s.set(sc, sc * (.9 + r() * .3), sc);
      m.compose(p, q, s); im.setMatrixAt(k, m);
      const g = C('#2f7d2c').lerp(C('#1d5a26'), r()).lerp(C('#5a9a32'), r() * .35);
      im.setColorAt(k, g); k++;
    }
    im.count = k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    scene.add(im); return im;
  };
  const near = (x, z) => {
    const h = terrainH(x, z);
    if (h < 33) return false;
    const dc = Math.hypot((x - CAMP.x) / 1.15, z - CAMP.z); if (dc < 44) return false;
    if (Math.abs(x - PARK.x) < PARK.w && Math.abs(z - PARK.z) < PARK.d + 8) return false;
    const dt = distTo(TRAIL, x, z); if (dt < 8 || (dt < 14 && r() < .6)) return false;
    if (distTo(ROAD, x, z) < 9) return false;
    const dens = fbm(x * .015 + 3, z * .015, 3);
    return r() < sstep(.32, .6, dens) * (h > 175 ? .35 : 1);
  };
  place(9000, [-640, 340, -490, 490], 1.05, pineGeo(true), near);
  place(9000, [-3400, 4400, -3400, 3400], 2.4, pineGeo(false), (x, z) => {
    if (x > -660 && x < 360 && z > -510 && z < 510) return false;
    const h = terrainH(x, z); if (h < 40) return false;
    return r() < sstep(.35, .62, fbm(x * .004, z * .004, 3));
  });
}

// ——— small props ———
const box = (w, h, d, c, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? .7, metalness: o.m ?? 0, emissive: o.e ?? '#000', emissiveIntensity: o.ei ?? 0 })); m.castShadow = true; m.receiveShadow = true; return m; };

function buildTrailhead(scene) {
  const g = new THREE.Group();
  // parking lot
  const lot = box(PARK.w, .3, PARK.d, '#55575c', { r: .95 }); lot.position.set(PARK.x, PARK_H + .05, PARK.z); g.add(lot);
  for (let i = 0; i < 8; i++) { const l = box(.18, .32, 5, '#f2f2ea'); l.position.set(PARK.x - PARK.w / 2 + 3 + i * 3.4, PARK_H + .07, PARK.z - PARK.d / 2 + 3.2); g.add(l); }
  // ranger hut, green roof
  const hut = box(9, 3.2, 6, '#e9dcc4'); hut.position.set(PARK.x - 8, PARK_H + 1.6, PARK.z + 14); g.add(hut);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(.01, 6.4, 2.4, 4, 1), new THREE.MeshStandardMaterial({ color: '#2f8a5a', roughness: .6 }));
  roof.rotation.y = Math.PI / 4; roof.scale.set(1.25, 1, .9); roof.position.set(PARK.x - 8, PARK_H + 4.4, PARK.z + 14); roof.castShadow = true; g.add(roof);
  const door = box(1.2, 2.1, .1, '#7a4a2a'); door.position.set(PARK.x - 8, PARK_H + 1.05, PARK.z + 10.95); g.add(door);
  // trailhead arch at the start of the trail
  const a = TRAIL.at(1);
  const arch = new THREE.Group();
  for (const s of [-1, 1]) { const p = box(.4, 4.2, .4, '#6b4226'); p.position.set(s * 2.2, 2.1, 0); arch.add(p); }
  const beam = box(5.6, .9, .35, '#7d4e2c'); beam.position.y = 4.1; arch.add(beam);
  const plate = box(4.2, .55, .38, '#f0d27a'); plate.position.y = 4.1; arch.add(plate);
  arch.position.set(a.x, a.y, a.z); arch.rotation.y = a.yaw; g.add(arch);
  // three parked cars
  const cars = [['#d93b30', 0], ['#2c63c8', 2], ['#e8e6df', 4]];
  for (const [c, i] of cars) { const car = makeCar(c); car.position.set(PARK.x - PARK.w / 2 + 4.7 + i * 3.4, PARK_H + .2, PARK.z - PARK.d / 2 + 3.2); car.rotation.y = 0; g.add(car); }
  scene.add(g);
}
export function makeCar(c, van = false) {
  const g = new THREE.Group();
  const L = van ? 5.0 : 4.2, Hh = van ? 1.95 : 1.2;
  const body = box(1.85, Hh * .62, L, c, { r: .35, m: .2 }); body.position.y = .45 + Hh * .31; g.add(body);
  const cab = box(1.7, Hh * .42, van ? L * .92 : L * .55, c, { r: .35, m: .2 }); cab.position.set(0, .45 + Hh * .62 + Hh * .2, van ? -.1 : -.2); g.add(cab);
  const glass = box(1.74, Hh * .3, van ? L * .86 : L * .5, '#1d2a38', { r: .1, m: .6 }); glass.position.set(0, .45 + Hh * .62 + Hh * .2, van ? -.1 : -.2); glass.scale.set(1.01, 1, 1.01); g.add(glass);
  for (const sx of [-.85, .85]) for (const sz of [-L * .32, L * .32]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .28, 10), new THREE.MeshStandardMaterial({ color: '#1b1b1d', roughness: .8 })); w.rotation.z = Math.PI / 2; w.position.set(sx, .36, sz); g.add(w); }
  // contact shadow
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.3, L + .5), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .35, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .04; g.add(sh);
  return g;
}

// ——— camp: tents, fire ring, grass ———
export const TENTS = [
  { x: -22, z: -8, c: '#f0761a', yaw: .4 },
  { x: -14, z: 9, c: '#2a7fd6', yaw: -.3 },
  { x: -28, z: 7, c: '#f3c42a', yaw: .9 },
  { x: -6, z: -12, c: '#dd3a2e', yaw: -.8 },
];
export const FIRE = { x: -9, z: -1 };
function tentMesh(c) {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: c, roughness: .55 }));
  dome.scale.set(1.35, 1.25, 1.1); dome.castShadow = true; dome.receiveShadow = true; g.add(dome);
  const fly = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#f4f1e6', roughness: .6 }));
  fly.scale.set(.5, .95, .5); fly.position.set(0, 0, 1.0); g.add(fly);
  const door = new THREE.Mesh(new THREE.CircleGeometry(.45, 10, 0, Math.PI), new THREE.MeshStandardMaterial({ color: '#2a2320' })); door.position.set(0, .02, 1.11); g.add(door);
  for (const a of [.6, 2.2, 3.8, 5.4]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.6, 4), new THREE.MeshStandardMaterial({ color: '#333' })); p.position.set(Math.cos(a) * 1.0, .9, Math.sin(a) * .8); p.rotation.set(Math.sin(a) * .5, 0, -Math.cos(a) * .5); g.add(p); }
  const sh = new THREE.Mesh(new THREE.CircleGeometry(1.9, 16), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .28, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .05; g.add(sh);
  return g;
}
function buildCamp(scene) {
  const tents = TENTS.map(T => { const m = tentMesh(T.c); m.position.set(T.x, terrainH(T.x, T.z), T.z); m.rotation.y = T.yaw; scene.add(m); return m; });
  // fire ring
  const fy = terrainH(FIRE.x, FIRE.z);
  const ring = new THREE.Group(); ring.position.set(FIRE.x, fy, FIRE.z);
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2; const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.32, 0), new THREE.MeshStandardMaterial({ color: '#8d8a84', roughness: .9 })); s.position.set(Math.cos(a) * 1.1, .15, Math.sin(a) * 1.1); s.castShadow = true; ring.add(s); }
  for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.4, 6), new THREE.MeshStandardMaterial({ color: '#4a2e1c' })); l.rotation.set(Math.PI / 2, 0, i * 1.05); l.position.y = .18; ring.add(l); }
  const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 1.6, .35), transparent: true, opacity: 1, depthWrite: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.55, 1.6, 8), flameMat); flame.position.y = .9; ring.add(flame);
  const core = new THREE.Mesh(new THREE.ConeGeometry(.3, 1.0, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4, 1.4), transparent: true, depthWrite: false })); core.position.y = .6; ring.add(core);
  const light = new THREE.PointLight('#ff9a4a', 0, 40, 1.6); light.position.y = 1.4; ring.add(light);
  // log benches around the fire
  for (const [a, l] of [[.3, 2.6], [2.2, 2.2], [4.1, 2.4]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, l, 8), new THREE.MeshStandardMaterial({ color: '#6b4428', roughness: .9 })); b.rotation.z = Math.PI / 2; b.rotation.y = a + Math.PI / 2; b.position.set(Math.cos(a) * 2.6, .22, Math.sin(a) * 2.6); b.castShadow = true; ring.add(b); }
  scene.add(ring);
  // grass tufts on the meadow and its east lip (foreground for the close-up)
  const r = mulberry(5), n = 2600;
  const tg = new THREE.ConeGeometry(.07, 1, 3); tg.translate(0, .5, 0);
  const tm = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .9 });
  const im = new THREE.InstancedMesh(tg, tm, n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  let k = 0;
  while (k < n) {
    const a = r() * Math.PI * 2, rr = Math.sqrt(r());
    const x = CAMP.x + 14 + (r() - .3) * 26, z = CAMP.z + (r() - .5) * 34;
    if (Math.hypot(x - FIRE.x, z - FIRE.z) < 3.5) continue;
    p.set(x, terrainH(x, z) - .05, z); e.set((r() - .5) * .7, a, (r() - .5) * .7); q.setFromEuler(e);
    const h = .35 + r() * .55 * rr; s.set(1, h, 1); m.compose(p, q, s); im.setMatrixAt(k, m);
    im.setColorAt(k, C('#a6a04a').lerp(C('#6f8a34'), r()).lerp(C('#c8b066'), r() * .4)); k++;
  }
  im.receiveShadow = true; scene.add(im);
  return { tents, flame, core, flameMat, light, ring };
}

// ——— mist (stacked noise sheets) ———
function buildMist(scene) {
  const mats = [];
  const layers = [48, 55, 62, 69, 76, 83, 90, 97];
  for (let i = 0; i < layers.length; i++) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      uniforms: { drift: { value: 0 }, amt: { value: 0 }, col: { value: new THREE.Color('#fff') }, shade: { value: new THREE.Color('#ccd') }, k: { value: i } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `varying vec3 vW; uniform float drift, amt, k; uniform vec3 col, shade;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        float fb(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n(p); p=p*2.02+vec2(5.3,1.7); a*=.5; } return s; }
        void main(){
          vec2 p = vW.xz * .0032 + vec2(drift * (1. + k*.15), drift * .35) + k * 3.7;
          float f = fb(p);
          float edge = smoothstep(80., 360., vW.x);          // keep the ridge itself clear: mist lives in the valleys east
          float a = smoothstep(.36 + k*.035 - amt*.12, .7 + k*.02, f) * amt * edge * (k < 0.5 ? .85 : .5);
          vec3 c = mix(shade, col, clamp(smoothstep(.4, .85, f) * .7 + k*.06, 0., 1.));
          gl_FragColor = vec4(c, a);
        }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000, 1, 1), mat); m.rotation.x = -Math.PI / 2; m.position.set(2500, layers[i], 0); m.renderOrder = 2 + i;
    scene.add(m); mats.push(mat);
  }
  return mats;
}

// ——— stars ———
function buildStars(scene) {
  const r = mulberry(99), n = 2400, p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r(), v = r() * .95 + .05, th = u * Math.PI * 2, ph = Math.acos(v);
    p[i * 3] = Math.sin(ph) * Math.cos(th) * 8000; p[i * 3 + 1] = Math.cos(ph) * 8000; p[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 8000;
    const b = .4 + r() * r() * 2.2; c[i * 3] = b; c[i * 3 + 1] = b; c[i * 3 + 2] = b * (1.05 + r() * .2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const mat = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = -1; scene.add(pts);
  return { pts, mat };
}

export function buildWorld(scene) {
  buildTerrain(scene);
  scene.add(ribbon(TRAIL, 1.9, .35, '#a8673f'));
  scene.add(ribbon(ROAD, 6.5, .3, '#4b4d52'));
  buildForest(scene);
  buildTrailhead(scene);
  const camp = buildCamp(scene);
  const mist = buildMist(scene);
  const stars = buildStars(scene);
  return { camp, mist, stars, CAMP_H, PARK_H };
}
