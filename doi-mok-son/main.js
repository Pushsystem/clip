// ดอยหมอกสน — Tilt-Shift Miniature: a two-day hiking & camping trip on a model-sized mountain
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, seg, lerp, ss, eio, eo, back, hash, monotone } from '/core/lib.js';
import { buildWorld, terrainH, TRAIL, ROAD, PARK, CAMP, TENTS, FIRE, makeCar } from './world.js';
import { makeSky, sunElev } from './sky.js';
import { DUR, T, SHOTS, shotAt, windowAt, clockAt, rateAt, stepT, fmtClock, SIGNS, TITLE, BEAT } from './story.js';

const QS = new URLSearchParams(location.search);
const W = innerWidth || 1920, H = innerHeight || 1080;
await document.fonts.load('600 44px Kanit'); await document.fonts.load('500 30px Kanit'); await document.fonts.load('600 30px "Overpass Mono"');

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, .5, 14000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: +(QS.get('ssaa') || 1.5), msaa: 4, taps: +(QS.get('taps') || 72), ao: QS.has('ao') });
post.bloom.strength = .3; post.bloom.threshold = 1.05; post.bloom.radius = .5;

const world = buildWorld(scene);
const sky = makeSky(scene, renderer);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const G = (x, z, dy = 0) => V(x, terrainH(x, z) + dy, z);

// ——— hikers ———
const HK = [
  { jacket: '#e2392c', hat: '#f4f0e0', pack: '#27324a' },
  { jacket: '#f6c21a', hat: '#d8402e', pack: '#3a4a2a' },
  { jacket: '#1ab0c8', hat: '#f6c21a', pack: '#5a3424' },
  { jacket: '#d6488f', hat: '#2a5fc4', pack: '#2a2a30' },
];
const SC = 1.3;   // figures 30 % larger than life so they read
function cap(r, l, c) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), new THREE.MeshPhysicalMaterial({ color: c, roughness: .6, sheen: .8, sheenRoughness: .5, sheenColor: new THREE.Color('#fff') })); m.castShadow = true; return m; }
function makeHiker(d) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * .12, .82, 0); body.add(hip);
    const leg = cap(.085, .62, '#2c3140'); leg.position.y = -.4; hip.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(.13, .1, .24), new THREE.MeshStandardMaterial({ color: '#4a3020' })); boot.position.set(0, -.78, .05); hip.add(boot);
    legs.push(hip);
  }
  const torso = cap(.2, .42, d.jacket); torso.position.y = 1.15; body.add(torso);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(.36, .5, .2), new THREE.MeshStandardMaterial({ color: d.pack, roughness: .7 })); pack.position.set(0, 1.2, -.24); pack.castShadow = true; body.add(pack);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .4, 8), new THREE.MeshStandardMaterial({ color: '#e0d6c0' })); roll.rotation.z = Math.PI / 2; roll.position.set(0, 1.5, -.24); body.add(roll);
  const neck = new THREE.Group(); neck.position.y = 1.5; body.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.15, 14, 10), new THREE.MeshPhysicalMaterial({ color: '#e0a77a', roughness: .5, sheen: .6, sheenRoughness: .4 })); head.position.y = .14; head.castShadow = true; neck.add(head);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(.14, .17, .1, 12), new THREE.MeshStandardMaterial({ color: d.hat, roughness: .6 })); hat.position.y = .27; neck.add(hat);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .02, 14), new THREE.MeshStandardMaterial({ color: d.hat, roughness: .6 })); brim.position.y = .23; neck.add(brim);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5.5, 4) })); lamp.position.set(0, .2, .15); lamp.visible = false; neck.add(lamp);
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * .25, 1.36, 0); body.add(sh);
    const arm = cap(.065, .44, d.jacket); arm.position.y = -.27; sh.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshStandardMaterial({ color: '#e0a77a' })); hand.position.y = -.55; sh.add(hand);
    arms.push(sh);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.4, 14), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .3, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .03; g.add(shadow);
  g.scale.setScalar(SC);
  scene.add(g);
  return { g, body, legs, arms, neck, lamp, shadow };
}
const hikers = HK.map(makeHiker);
// pose: walk phase (radians), sit 0–1, point 0–1 (right arm), squash, head yaw
function pose(h, o) {
  const w = o.walk ?? 0, amp = o.walkAmp ?? 0, sit = o.sit ?? 0;
  h.legs[0].rotation.x = Math.sin(w) * .55 * amp - sit * 1.45;
  h.legs[1].rotation.x = -Math.sin(w) * .55 * amp - sit * 1.45;
  h.arms[0].rotation.set(-Math.sin(w) * .45 * amp - sit * .5, 0, -.12);
  const pt = o.point ?? 0;
  h.arms[1].rotation.set(lerp(Math.sin(w) * .45 * amp - sit * .5, -2.45, pt), lerp(0, .35, pt), lerp(.12, -.1, pt));
  h.body.position.y = -sit * .5 + Math.abs(Math.sin(w)) * .04 * amp;
  h.body.rotation.x = (o.lean ?? 0);
  h.neck.rotation.y = o.headYaw ?? 0;
  h.neck.rotation.x = o.headPitch ?? 0;
  const sq = o.squash ?? 1; h.body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
}

// ——— the van ———
const van = makeCar('#f2f1ea', true); scene.add(van);
const vanStop = ROAD.len - 1;
const vanS = monotone([[0, vanStop - 150], [.9, vanStop - 22], [T.vanPark, vanStop], [99, vanStop]]);

// ——— long-exposure headlamp trails ———
const NTR = 90;
const trailMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.7, 1.8), transparent: true, opacity: .9, depthWrite: false });
const trails = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 6, 4), trailMat, NTR * 4); trails.frustumCulled = false; scene.add(trails);

// ——— hikers' scripted paths ———
const door = (() => { const p = ROAD.at(vanStop); return { x: p.x + Math.cos(p.yaw) * 1.6, z: p.z - Math.sin(p.yaw) * 1.6 }; })();
const arch = TRAIL.at(1);
const SEATS = [-2.6, -.9, .9, 2.6].map(z => ({ x: 14.5, z }));
function nightPos(i, tau) {
  if (tau < 16) { const a = i * Math.PI / 2 + .3; return { x: FIRE.x + Math.cos(a) * 2.6, z: FIRE.z + Math.sin(a) * 2.6, yaw: Math.atan2(-Math.cos(a), -Math.sin(a)), sit: 1, walk: 0 }; }
  const ph = (tau - 16) * 2.4 + i * 1.57;
  const x = FIRE.x + Math.cos(ph) * (5 + 3 * Math.sin(1.7 * ph + i)) + (i - 1.5) * 2.2;
  const z = FIRE.z + Math.sin(ph) * (4.5 + 2 * Math.cos(1.3 * ph + i * 2));
  const dx = -Math.sin(ph), dz = Math.cos(ph);
  return { x, z, yaw: Math.atan2(dx, dz), sit: 0, walk: tau * 40 };
}
function hikerState(i, tw, t) {
  const sh = shotAt(t)[2];
  if (sh === 'trailhead') {
    const t0 = T.hop[i];
    if (tw < t0) return null;
    const u = tw - t0, sq = 1 - .25 * Math.sin(Math.PI * clamp(u / .25)) * (u < .25 ? 1 : 0);
    const d1 = Math.hypot(arch.x - door.x, arch.z - door.z), v = 15;
    const s = u * v;
    if (s < d1) { const k = s / d1; return { x: lerp(door.x, arch.x, k), z: lerp(door.z, arch.z, k), yaw: Math.atan2(arch.x - door.x, arch.z - door.z), walk: s * 2.2, squash: sq, hopY: u < .25 ? Math.sin(Math.PI * u / .25) * .5 : 0 }; }
    const p = TRAIL.at(1 + (s - d1)); return { x: p.x, z: p.z, yaw: p.yaw, walk: s * 2.2 };
  }
  if (sh === 'trail') {
    const s = 70 + (tw - 4) * 24 - i * 3.4, p = TRAIL.at(s);
    return { x: p.x, z: p.z, yaw: p.yaw, walk: s * 2.2 };
  }
  if (sh === 'camp') {
    const Tn = TENTS[i], k = Math.floor(tw * 8), a = hash(k * 7.3 + i * 13) * 6.28, r = 2.2 + hash(k * 3.1 + i) * 1.6;
    const busy = tw < T.tents[i] + .1;
    const x = Tn.x + Math.cos(a) * r * (busy ? .6 : 1), z = Tn.z + Math.sin(a) * r;
    return { x, z, yaw: a + 1.6, walk: k * 1.7, squash: 1 };
  }
  if (sh === 'night') {
    if (tw > 17.2) return null;
    return nightPos(i, tw);
  }
  // dawn: seated on the east lip, facing the sea of mist
  const S = SEATS[i];
  const o = { x: S.x, z: S.z, yaw: Math.PI / 2, sit: 1, walk: 0 };
  if (i === 1) { o.point = ss(seg(t, 23.85, 24.25)) * (1 - ss(seg(t, 25.4, 25.9))); o.antic = Math.sin(Math.PI * seg(t, 23.6, 23.85)) * .12; o.headPitch = -.18 * o.point; }
  if (i === 0) o.headYaw = .5 * ss(seg(t, 24.35, 24.8)) * (1 - ss(seg(t, 25.8, 26.3)));
  if (i === 2) o.headYaw = -.25 * ss(seg(t, 24.5, 24.9));
  if (i === 3) o.lean = .08 * Math.sin(t * 1.3);
  return o;
}

// ——— cameras ———
const BAND = (w, amp, mix, aper) => ({ w, amp, mix, aper });
const UPY = V(0, 1, 0);
const vanAt = tw => ROAD.at(vanS(tw));
const leaderAt = t => TRAIL.at(70 + (t - 4) * 24);
const fireP = G(FIRE.x, FIRE.z, 1);
const seatsC = G(14.5, 0, 1.25 * SC);
function shotCam(t) {
  const [t0, t1, name] = shotAt(t), u = seg(t, t0, t1);
  if (name === 'trailhead') {
    const tg = G(PARK.x + 4, PARK.z - 6); const off = V(lerp(30, 52, ss(u)), 92, lerp(72, 64, u));
    return { pos: tg.clone().add(off), look: tg, up: UPY, fov: 27, subj: vanAt(stepT(t)), band: BAND(.06, 26, .6, 6500), span: 140, az: 35 };
  }
  if (name === 'trail') {
    // smooth camera target: the leader's path, low-passed
    let ax = 0, az2 = 0, n = 0; for (let k = -6; k <= 6; k++) { const p = leaderAt(t + k * .12); ax += p.x; az2 += p.z; n++; }
    const tg = G(ax / n, az2 / n, 2); const off = V(-18 + 16 * u, 80, 62);
    const L = leaderAt(stepT(t));
    return { pos: tg.clone().add(off), look: tg, up: UPY, fov: 26, subj: V(L.x, L.y + 1.5, L.z), band: BAND(.05, 28, .62, 7000), span: 120, az: -30 };
  }
  if (name === 'camp') {
    const c = G(CAMP.x - 6, CAMP.z), yaw = lerp(-.25, .3, u);
    return { pos: c.clone().add(V(0, 58 - 5 * u, .01)), look: c, up: V(Math.sin(yaw), 0, -Math.cos(yaw)), fov: 30, subj: c, band: BAND(.09, 24, .88, 0), span: 60, az: 0, top: true };
  }
  if (name === 'night') {
    const tg = fireP.clone().add(V(6, 0, 0)); const off = V(lerp(-92, -70, eio(u)), lerp(60, 47, eio(u)), lerp(72, 56, eio(u)));
    return { pos: tg.clone().add(off), look: tg, up: UPY, fov: 29, subj: fireP, band: BAND(.06, 26, .6, 5200), span: 90, az: 15 };
  }
  if (name === 'mist') {
    const pos = V(3.2 + .8 * u, terrainH(3.5, .4) + 2.5, .4);
    const look = V(140, pos.y - 9, -4);
    return { pos, look, up: UPY, fov: 30, subj: seatsC, band: BAND(.04, 30, .45, 260), span: 40, dawn: true };
  }
  // end: crane back & up while the lens un-tilts
  const a = shotCam(25.999), k = eio(seg(t, 26, 30));
  const pos = a.pos.clone().lerp(G(-16, 9).add(V(0, 15, 0)), k);
  const look = a.look.clone().lerp(V(160, terrainH(14, 0) - 40, -10), k);
  const un = ss(seg(t, 26.4, 29.2));
  return { pos, look, up: UPY, fov: lerp(30, 36, k), subj: a.subj.clone().lerp(V(60, 120, 0), k), band: BAND(lerp(.04, .7, un), lerp(30, 0, un), lerp(.45, 0, un), lerp(260, 0, un)), span: lerp(40, 160, k), dawn: true, un };
}

// ——— HUD / signs overlay ———
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const ctx = ov.getContext('2d');
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function woodPanel(x, y, w, h, seed) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  rr(x, y, w, h, 10); ctx.fillStyle = '#5e3a20'; ctx.fill(); ctx.restore();
  ctx.save(); rr(x, y, w, h, 10); ctx.clip();
  for (let i = 0; i < 9; i++) { const yy = y + (i + .5) * h / 9 + Math.sin(i * 3.1 + seed) * 2; ctx.strokeStyle = i % 2 ? 'rgba(40,20,8,.25)' : 'rgba(140,90,50,.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, yy); for (let k = 0; k <= 12; k++) ctx.lineTo(x + k * w / 12, yy + Math.sin(k * 1.3 + i + seed) * 1.6); ctx.stroke(); }
  ctx.restore();
  rr(x + 6, y + 6, w - 12, h - 12, 6); ctx.strokeStyle = 'rgba(246,220,138,.55)'; ctx.lineWidth = 2; ctx.stroke();
  for (const sx of [x + 18, x + w - 18]) { ctx.beginPath(); ctx.arc(sx, y + h / 2, 4, 0, 7); ctx.fillStyle = '#a88a5a'; ctx.fill(); }
}
function pine(x, y, s, c) { ctx.fillStyle = c; for (let k = 0; k < 3; k++) { const w = s * (1 - k * .25), yy = y - k * s * .42; ctx.beginPath(); ctx.moveTo(x, yy - s * .55); ctx.lineTo(x + w / 2, yy); ctx.lineTo(x - w / 2, yy); ctx.closePath(); ctx.fill(); } ctx.fillRect(x - s * .07, y, s * .14, s * .22); }
const signBox = {};
function drawSign(sg, t) {
  const a = seg(t, sg.t0, sg.t0 + .22) * (1 - seg(t, sg.t1 - .2, sg.t1));
  if (a <= 0) return;
  ctx.font = '600 44px Kanit'; const tw = ctx.measureText(sg.text).width;
  const w = tw + 150, h = 86, x = (W - w) / 2, y0 = H - 112 - h;
  const drop = (1 - back(seg(t, sg.t0, sg.t0 + .35), 2.2)) * 26;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, drop);
  woodPanel(x, y0, w, h, sg.id.charCodeAt(1));
  pine(x + 52, y0 + h / 2 + 12, 34, '#f6dc8a');
  ctx.fillStyle = '#f6dc8a'; ctx.textBaseline = 'middle'; ctx.fillText(sg.text, x + 92, y0 + h / 2 + 2);
  ctx.restore();
  signBox[sg.id] = [x, y0, x + w, y0 + h];
}
function drawHUD(t, tw) {
  const c = clockAt(tw), f = fmtClock(c), r = rateAt(t);
  const x = 56, y = 48, w = 330, h = 92;
  ctx.save(); rr(x, y, w, h, 12); ctx.fillStyle = 'rgba(28,32,26,.55)'; ctx.fill();
  ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#f4efe2';
  ctx.font = '500 26px Kanit'; ctx.fillText('วันที่ ' + f.day, x + 22, y + 38);
  ctx.font = '600 34px "Overpass Mono"'; ctx.fillText(f.hm, x + 140, y + 39);
  const real = r < 1.5;
  ctx.font = '600 21px "Overpass Mono"'; ctx.fillStyle = real ? '#7ee08a' : '#ffbe3c';
  const rv = r >= 1000 ? Math.round(r / 100) * 100 : r >= 100 ? Math.round(r / 10) * 10 : Math.round(r);
  ctx.fillText(real ? '×1 REAL TIME' : '×' + rv.toLocaleString('en-US') + ' TIME-LAPSE', x + 22, y + 74);
  if (!real) { ctx.beginPath(); ctx.arc(x + w - 26, y + 66, 6, 0, 7); ctx.fill(); }
  ctx.restore();
}
function drawTitle(t) {
  if (t < TITLE.t0) return;
  const a = seg(t, TITLE.t0, TITLE.t0 + .25), drop = (1 - back(seg(t, TITLE.t0, TITLE.t0 + .45), 2.2)) * 40;
  ctx.font = '600 112px Kanit'; const tw = ctx.measureText(TITLE.main).width;
  ctx.font = '500 38px Kanit'; const sw = ctx.measureText(TITLE.sub).width;
  const w = Math.max(tw, sw) + 200, h = 230, x = (W - w) / 2, y0 = H - 112 - h;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, drop);
  woodPanel(x, y0, w, h, 4);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f6dc8a';
  ctx.font = '600 112px Kanit'; ctx.fillText(TITLE.main, W / 2, y0 + 92);
  ctx.font = '500 38px Kanit'; ctx.fillStyle = '#efe2c0'; ctx.fillText(TITLE.sub, W / 2, y0 + 176);
  pine(x + 60, y0 + 108, 52, '#f6dc8a'); pine(x + w - 60, y0 + 108, 52, '#f6dc8a');
  ctx.restore();
  signBox.title = [x, y0, x + w, y0 + h];
}

// ——— render ———
const _p = new THREE.Vector3();
function render(t) {
  const tw = stepT(t), clock = clockAt(tw), sh = shotAt(t)[2];
  const C = shotCam(t);
  // actors first (focus must not lag a frame)
  const vp = vanAt(tw); van.position.set(vp.x, vp.y + .1, vp.z); van.rotation.y = vp.yaw; van.visible = sh === 'trailhead';
  let ti = 0;
  for (let i = 0; i < 4; i++) {
    const h = hikers[i], s = hikerState(i, tw, t);
    h.g.visible = !!s;
    if (s) {
      const y = terrainH(s.x, s.z);
      h.g.position.set(s.x, y + (s.hopY || 0), s.z); h.g.rotation.y = s.yaw;
      pose(h, { walk: s.walk, walkAmp: s.walk ? 1 : 0, sit: s.sit, squash: s.squash, point: s.point, lean: (s.lean || 0) + (s.antic || 0), headYaw: s.headYaw, headPitch: s.headPitch });
      h.lamp.visible = sh === 'night' && tw >= 16;
    }
    // headlamp light trails (long exposure)
    if (sh === 'night' && tw >= 16 && tw <= 17.2) {
      for (let k = 0; k < NTR; k++) {
        const tau = Math.max(16, tw - k * (.85 / NTR)), p = nightPos(i, tau);
        _p.set(p.x, terrainH(p.x, p.z) + 1.85 * SC, p.z);
        const m = new THREE.Matrix4().compose(_p, new THREE.Quaternion(), V(1, 1, 1).multiplyScalar(1 - k / NTR * .6));
        trails.setMatrixAt(ti++, m);
      }
    }
  }
  trails.count = ti; trails.instanceMatrix.needsUpdate = true;

  // tents pop up on the beat
  world.camp.tents.forEach((m, i) => {
    const u = sh === 'trailhead' || sh === 'trail' ? 0 : seg(tw, T.tents[i], T.tents[i] + .375);
    const k = sh === 'camp' ? back(u, 2.6) : (sh === 'trailhead' || sh === 'trail') ? 0 : 1;
    m.visible = k > .001; m.scale.set(.6 + .4 * Math.min(k, 1.1), Math.max(k, .001), .6 + .4 * Math.min(k, 1.1));
    m.children[0].material.emissive = new THREE.Color(TENTS[i].c); m.children[0].material.emissiveIntensity = sh === 'night' ? .55 * seg(tw, 16.9, 17.2) * (1 - seg(tw, 17.7, 18.1)) : 0;
  });
  // campfire
  const fireOn = sh === 'night' ? seg(tw, T.fire, T.fire + .15) * (1 - seg(tw, 17.4, 18.6) * .85) : (sh === 'mist' || sh === 'end') ? .12 : 0;
  const fl = .8 + .2 * Math.sin(t * 31) + .15 * Math.sin(t * 17.3);
  world.camp.flame.visible = world.camp.core.visible = fireOn > .01;
  world.camp.flame.scale.set(fireOn, fireOn * fl, fireOn); world.camp.core.scale.set(fireOn, fireOn * fl, fireOn);
  world.camp.light.intensity = fireOn * fl * 90 * (sh === 'night' ? 1 : 0);

  // sky & light: sun cheated per shot (front light), real east at dawn
  const e = sunElev(clock);
  let azDir;
  if (C.dawn) azDir = V(1, 0, -.27).normalize();
  else if (C.top) azDir = V(.5, 0, .8).normalize();
  else { const d = C.pos.clone().sub(C.look); d.y = 0; d.normalize(); const a = C.az * Math.PI / 180; azDir = V(d.x * Math.cos(a) - d.z * Math.sin(a), 0, d.x * Math.sin(a) + d.z * Math.cos(a)); }
  const S = sky.apply(e, azDir, C.subj || C.look, C.span, { fog: C.dawn ? .00012 : .00016 });
  renderer.toneMappingExposure = S.expo;
  // mist builds through the night, drifts fast in time-lapse
  const mAmt = (sh === 'night' ? seg(clock, 21 * 3600, 26 * 3600) : 0) + (sh === 'mist' || sh === 'end' ? 1 : 0);
  for (const m of world.mist) { m.uniforms.amt.value = clamp(mAmt); m.uniforms.drift.value = clock / 2600 + t * .006; m.uniforms.col.value.copy(S.mist); m.uniforms.shade.value.copy(S.mistS); }
  world.stars.mat.opacity = clamp((S.night - .45) / .5) ** 1.5;
  world.stars.pts.rotation.set(.32, 0, 0); world.stars.pts.rotateOnAxis(V(0, Math.cos(.32), Math.sin(.32)).normalize(), clock / 86164 * Math.PI * 2);

  // camera
  camera.position.copy(C.pos); camera.up.copy(C.up); camera.lookAt(C.look); camera.fov = C.fov;
  camera.near = sh === 'mist' || sh === 'end' ? .3 : 4; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  // band follows the subject on screen
  const subj = C.subj instanceof THREE.Vector3 ? C.subj : V(C.subj.x, C.subj.y + 1, C.subj.z);
  const ndc = subj.clone().project(camera);
  const b = post.dof.band; b.y = clamp(ndc.y * .5 + .5, .2, .8); b.w = C.band.w; b.amp = C.band.amp; b.mix = C.band.mix; b.tilt = 0; b.pow = 1.2;
  post.dof.focus = Math.max(camera.position.distanceTo(subj), 1); post.dof.aper = C.band.aper; post.dof.maxCoc = C.un !== undefined ? lerp(28, 0, C.un) : 28;
  // grade: saturated by day, calmer at night
  const g = post.grade.material.uniforms;
  g.sat.value = lerp(1.3, 1.0, S.night); g.contrast.value = .34; g.warm.value = lerp(.35, .1, S.night) + (C.dawn ? .25 : 0); g.amt.value = .3; g.lift.value = .2;
  if (!QS.has('textonly')) post.composer.render();

  // overlay
  ctx.clearRect(0, 0, W, H);
  for (const k in signBox) delete signBox[k];
  if (!QS.has('nohud')) { drawHUD(t, tw); for (const sg of SIGNS) drawSign(sg, t); drawTitle(t); }
}

// ——— contract ———
window.DUR = DUR;
window.render = render;
window.TEXTS = t => {
  const out = [];
  for (const sg of SIGNS) if (t >= sg.t0 + .2 && t <= sg.t1 - .2) { ctx.font = '600 44px Kanit'; const w = ctx.measureText(sg.text).width + 150; out.push({ id: sg.id, text: sg.text, x0: (W - w) / 2, y0: H - 198, x1: (W + w) / 2, y1: H - 112 }); }
  if (t >= TITLE.t0 + .2) out.push({ id: 'title', text: TITLE.main + ' ' + TITLE.sub, x0: 300, y0: H - 342, x1: W - 300, y1: H - 112 });
  out.push({ id: 'clock', text: 'clock', x0: 56, y0: 48, x1: 386, y1: 140, pass: true });
  return out;
};
const EV = [];
EV.push({ t: 0, type: 'engine', t1: T.vanPark }, { t: T.vanPark, type: 'brake' }, { t: 1.8, type: 'door' });
T.hop.forEach((t, i) => EV.push({ t, type: 'hop', i }));
for (let t = 4; t < 10; t += .125) EV.push({ t, type: 'step' });
T.tents.forEach((t, i) => EV.push({ t, type: 'tent', i }));
EV.push({ t: T.fire, type: 'fire' }, { t: T.tapeStop, type: 'tapestop' }, { t: T.realTime, type: 'real' }, { t: T.bird, type: 'bird' }, { t: T.point, type: 'point' }, { t: TITLE.t0, type: 'title' });
SHOTS.forEach(s => EV.push({ t: s[0], type: 'cut', shot: s[2] }));
window.EV = EV;
render(+(QS.get('t') || 0));
window.READY = true;
