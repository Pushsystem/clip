// "ถ้าคุณเกิดเป็นหมู" — the user's boss-pig mascot tells four facts about pigs. The five pictures are the user's own;
// everything else (camera moves, cards, tags, call-outs, transitions) is drawn in the Mid-century Cartoon engine. 1080×1920.
import { PAL, setClock, shape, ink, plane, text, fit, measure, star, sparkle, rays, ellipse, rrect, rect, spline, xform,
  arrow, dashed, clamp, lerp, seg, ss, eo, eio, back, twos, TAU, paperFinish, kidney } from './engine/toon.js';
import { mark } from './cast.js';

const W = 1080, H = 1920;
export const BPM = 120, BEAT = 60 / BPM;
const COL = { ink: PAL.ink, paper: '#FBF3E2', accent: PAL.coral };
const STEPC = [PAL.teal, PAL.mustard, PAL.coral, PAL.plum];
const VO_T = { v1: 0.4, v2: 3.9, v3: 5.9, v4: 8.7, v5: 12.9, v6: 14.5, v7: 17.4, v8: 21.9, v9: 25.5, v10: 28.9, v11: 31.2 };
export const DUR = 35.2;
const S = [
  { id: 'hook', t0: 0, t1: 3.6 },
  { id: 'clean', t0: 3.6, t1: 12.6, n: 1, small: 'ข้อ 1 จาก 4', label: 'สะอาด', tr: 'iris' },
  { id: 'smart', t0: 12.6, t1: 21.6, n: 2, small: 'ข้อ 2 จาก 4', label: 'ฉลาด', tr: 'iris' },
  { id: 'fast', t0: 21.6, t1: 25.2, n: 3, small: 'ข้อ 3 จาก 4', label: 'วิ่งเร็ว', tr: 'iris' },
  { id: 'nose', t0: 25.2, t1: 28.7, n: 4, small: 'ข้อ 4 จาก 4', label: 'จมูกดี', tr: 'iris' },
  { id: 'recap', t0: 28.7, t1: 30.8, tr: 'cut' },
  { id: 'end', t0: 30.8, t1: DUR, tr: 'wipeUp' },
];
const SILENCE = [[28.55, 28.85]];
const sec = id => S.find(s => s.id === id);
export function section(t) { return S.find(s => t >= s.t0 && t < s.t1) || S[S.length - 1]; }
let SUBS = [], EVS = [], LINES = {}, IMG = {};
export function setup(durs, lines, imgs) {
  IMG = imgs || {};
  for (const l of lines) LINES[l.id] = l.text;
  const ids = Object.keys(VO_T);
  SUBS = ids.map((id, i) => {
    const t0 = VO_T[id], d = durs[id] || 2.2, next = i + 1 < ids.length ? VO_T[ids[i + 1]] - 0.12 : DUR - 0.5;
    return { id, t0: t0 - 0.05, t1: Math.min(next, t0 + Math.max(1.85, d + 0.6)), text: LINES[id] || id };
  });
  buildEvents(durs);
}
export const srtCues = () => SUBS.map(s => ({ t0: s.t0, t1: s.t1, text: s.text }));
export const events = () => EVS;
const ev = (t, type, o = {}) => EVS.push({ t: +t.toFixed(4), type, ...o });

// ------------------------------------------------------------------ helpers
const pop = (t, t0, d = 0.28) => back(seg(t, t0, t0 + d), 1.9);
function cam(ctx, cx, cy, z = 1, r = 0) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.rotate(r); ctx.translate(-cx, -cy); }
function ground(ctx, wall, floor, fy = 1250) {
  ctx.fillStyle = wall; ctx.fillRect(-3000, -3000, 9000, 9000);
  plane(ctx, rect(-3000, fy, 9000, 4000), floor);
  ink(ctx, [[-3000, fy], [9000, fy]], 4, { seed: 50, breaks: 0.3, taper: false });
}
// arms keyframes, sampled on twos with an ease (one in-between feel)
function keys(t, K) {
  t = twos(t);
  if (t <= K[0].t) return K[0].v;
  for (let i = 1; i < K.length; i++) if (t <= K[i].t) {
    const u = eio(seg(t, K[i - 1].t, K[i].t)), a = K[i - 1].v, b = K[i].v, o = {};
    for (const k in b) o[k] = typeof b[k] === 'number' ? lerp(a[k], b[k], u) : (u < 0.5 ? a[k] : b[k]);
    return o;
  }
  return K[K.length - 1].v;
}
const blinkAt = (t, ts) => ts.some(b => t > b && t < b + 0.13) ? 1 : 0;

let TXT = [];   // texts drawn this frame (for window.TEXTS)
function note(id, str, x0, y0, x1, y1, pass) { TXT.push({ id, text: str, x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1), ...(pass ? { pass: true } : {}) }); }

// caption card (bottom, above the phone UI band)
function caption(ctx, t) {
  const cue = SUBS.find(s => t >= s.t0 && t < s.t1); if (!cue) return;
  const a = Math.min(ss(seg(t, cue.t0, cue.t0 + 0.16)), 1 - ss(seg(t, cue.t1 - 0.14, cue.t1)));
  const f = fit(ctx, cue.text, '500 {px}px Prompt', 48, 860, 1, 34);
  const w = measure(ctx, f.lines[0], f.font) + 130, h = 100, x = W / 2 - w / 2, y = 1500;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 12);
  shape(ctx, rrect(x, y, w, h, 16), { fill: COL.paper, line: 3.4, seed: 901, grain: 0.15, breaks: 0.08, off: [5, 5] });
  star(ctx, x + 34, y + h / 2, 15, { n: 8, inner: 0.4, fill: COL.accent, off: [0, 0], rot: t * 0.8 });
  star(ctx, x + w - 34, y + h / 2, 15, { n: 8, inner: 0.4, fill: COL.accent, off: [0, 0], rot: -t * 0.8 });
  text(ctx, f.lines[0], W / 2, y + h / 2 + f.px * 0.36, { font: f.font, fill: COL.ink, align: 'center' });
  ctx.restore();
  note('cap_' + cue.id, cue.text, x, y, x + w, y + h);
}
// step header: ink disc with numeral, "ขั้นที่ n จาก 5", slab title with cream plate; slides in on twos
function stepHeader(ctx, t, s) {
  const k = eo(seg(twos(t), s.t0 + 0.3, s.t0 + 0.65));
  if (k <= 0) return;
  ctx.save(); ctx.translate(-(1 - k) * 700, 0);
  shape(ctx, rrect(40, 176, 220 + measure(ctx, s.label, '70px Chonburi'), 160, 24), { fill: COL.paper, line: 4, seed: 699, grain: 0.15, off: [5, 5] });
  shape(ctx, ellipse(122, 252, 58, 58, 40), { fill: COL.ink, line: 0, seed: 700, grain: 0.1, off: [0, 0] });
  text(ctx, String(s.n), 122, 278, { font: '68px Slab', fill: COL.paper, align: 'center' });
  text(ctx, s.small, 204, 222, { font: '600 30px Prompt', fill: COL.ink, track: 3 });
  text(ctx, s.label, 202, 300, { font: '70px Chonburi', fill: COL.ink, plate: PAL.white, off: [4, 4] });
  ctx.restore();
  if (k > 0.95) note('hdr' + s.id, `${s.small} ${s.label}`, 64, 190, 204 + measure(ctx, s.label, '70px Chonburi'), 320);
}
// detail tag: paper card with an accent star, pops on its beat
function tag(ctx, t, t0, str, x, y, o = {}) {
  const k = pop(t, t0); if (k <= 0) return null;
  const font = `600 ${o.px || 44}px Prompt`, px = o.px || 44;
  const w = measure(ctx, str, font) + 110, h = px * 1.2 + 40;
  const X = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  ctx.save(); ctx.translate(X + w / 2, y + h / 2); ctx.scale(k, k); ctx.rotate(o.rot || 0); ctx.translate(-(X + w / 2), -(y + h / 2));
  shape(ctx, rrect(X, y, w, h, 16), { fill: COL.paper, line: 3.8, seed: 710, grain: 0.15, off: [6, 5] });
  star(ctx, X + 42, y + h / 2, 19, { n: 8, inner: 0.42, fill: o.star || COL.accent, off: [0, 0], rot: t * 0.6 });
  text(ctx, str, X + 74, y + h / 2 + px * 0.36, { font, fill: COL.ink });
  ctx.restore();
  if (k > 0.9) note('tag_' + str, str, X, y, X + w, y + h);
  return { x: X, y, w, h };
}
// round call-out with a dashed leader line
function callout(ctx, t, t0, cx, cy, r, inner, bgc, leader) {
  const k = back(seg(t, t0, t0 + 0.32), 1.5); if (k <= 0) return;
  const R = r * k;
  if (leader) { const a = Math.atan2(leader[1] - cy, leader[0] - cx); dashed(ctx, [[cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16)], leader], 4.5, 16, 11, -t * 40, COL.ink, clamp(k)); shape(ctx, ellipse(leader[0], leader[1], 10, 10, 12), { fill: COL.ink, line: 0, off: [0, 0], grain: 0 }); }
  shape(ctx, ellipse(cx, cy, R + 18, R + 18, 72), { fill: COL.paper, line: 4.8, seed: 720, grain: 0.15, breaks: 0.05 });
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  ctx.fillStyle = bgc; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.translate(cx, cy); ctx.scale(k, k); inner(ctx); ctx.restore();
  ink(ctx, ellipse(cx, cy, R, R, 72), 4.5, { closed: true, seed: 721, breaks: 0.1 });
}
function medallion(ctx, t, tStamp, x, y, n, r = 120) {
  const k = pop(t, tStamp, 0.24); if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate((1 - k) * 0.4);
  star(ctx, 0, 0, r * 1.22, { n: 16, inner: 0.84, fill: PAL.white, off: [0, 0], rot: n * 0.2 });
  shape(ctx, ellipse(0, 0, r, r, 64), { fill: STEPC[(n - 1) % STEPC.length], line: 5, seed: 730 + n, grain: 0.3 });
  text(ctx, String(n), 0, r * 0.38, { font: `${Math.round(r * 1.1)}px Slab`, fill: COL.ink, plate: PAL.white, off: [5, 5], align: 'center' });
  ctx.restore();
}
// ------------------------------------------------------------------ the pictures
// draw picture n so that its point (px, py) sits at screen (sx, sy), at zoom z over "cover"; clamped so it always fills the frame
function photo(ctx, n, px, py, z = 1, sx = 540, sy = 900, rot = 0) {
  const im = IMG[n]; if (!im) return;
  const base = Math.max(W / im.width, H / im.height), s = base * z;
  let x = sx - px * s, y = sy - py * s;
  x = clamp(x, W - im.width * s, 0); y = clamp(y, H - im.height * s, 0);
  ctx.save(); if (rot) { ctx.translate(540, 960); ctx.rotate(rot); ctx.translate(-540, -960); }
  ctx.drawImage(im, x, y, im.width * s, im.height * s); ctx.restore();
}
// keyframed camera over a picture: K = [{t, px, py, z}]
function shot(ctx, n, t, K, shake = 0) {
  let a = K[0], b = K[0], u = 0;
  for (let i = 1; i < K.length; i++) if (t >= K[i - 1].t) { a = K[i - 1]; b = K[i]; u = eio(seg(t, a.t, b.t)); }
  const dx = shake ? Math.sin(t * 83) * shake : 0, dy = shake ? Math.cos(t * 71) * shake : 0;
  photo(ctx, n, lerp(a.px, b.px, u), lerp(a.py, b.py, u), lerp(a.z, b.z, u), 540 + dx, 900 + dy);
}
function speedLines(ctx, t, k = 1) {
  const f = Math.floor(t * 12);
  for (let i = 0; i < 10; i++) { const y = 300 + ((i * 173 + f * 41) % 1100), x = (i * 97 + f * 60) % 300; ink(ctx, [[-50 + x, y], [-50 + x + 260 * k, y]], 6, { seed: 70 + i, color: PAL.white, taper: true }); }
}
function truffle(c) {
  shape(c, spline([[-90, 20], [-80, -50], [-20, -90], [50, -80], [95, -20], [80, 50], [10, 80], [-60, 70]], true, 6), { fill: '#5A4031', line: 4.4, seed: 80, grain: 0.6 });
  for (let i = 0; i < 9; i++) shape(c, ellipse(-50 + (i % 3) * 45, -40 + Math.floor(i / 3) * 40, 7, 6, 8), { fill: '#3D2A20', line: 0, grain: 0, off: [0, 0], seed: 81 + i });
}
function joystick(c) {
  shape(c, rrect(-110, 20, 220, 90, 20), { fill: PAL.ink, line: 4, seed: 90, grain: 0.1 });
  ink(c, [[0, 30], [30, -80]], 18, { seed: 91, taper: false }); shape(c, ellipse(30, -90, 34, 34, 20), { fill: PAL.coral, line: 4, seed: 92, grain: 0.1 });
  shape(c, ellipse(70, 66, 16, 16, 14), { fill: PAL.mustard, line: 3, seed: 93, grain: 0 });
}

// ------------------------------------------------------------------ scenes
function sceneHook(ctx, t) {
  shot(ctx, 4, t, [{ t: 0, px: 600, py: 330, z: 1.15 }, { t: 3.6, px: 590, py: 290, z: 1.35 }]);
  const k = pop(t, 0.3, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 260); ctx.scale(k, k); ctx.translate(-540, -260);
    shape(ctx, rrect(90, 150, 900, 250, 26), { fill: COL.paper, line: 5, seed: 10, grain: 0.15 });
    text(ctx, 'ถ้าคุณเกิดเป็น', 540, 250, { font: '70px Chonburi', fill: COL.ink, align: 'center' });
    text(ctx, 'หมู?', 540, 370, { font: '110px Chonburi', fill: COL.ink, plate: PAL.coral, off: [6, 5], align: 'center' });
    ctx.restore();
    if (k > 0.9) note('title', 'ถ้าคุณเกิดเป็น หมู?', 90, 150, 990, 400);
  }
}
function sceneClean(ctx, t, s) {
  shot(ctx, 1, t, [{ t: 3.6, px: 600, py: 700, z: 1.0 }, { t: 5.8, px: 580, py: 760, z: 1.08 }, { t: 8.6, px: 600, py: 1100, z: 1.25 }, { t: 12.6, px: 560, py: 500, z: 1.15 }]);
  if (t > 4.0) for (let i = 0; i < 6; i++) { const q = (t * 1.3 + i / 6) % 1; sparkle(ctx, 200 + i * 140, 1350 - q * 140, 26 * (1 - q), { fill: PAL.white, rot: i }); }
  tag(ctx, t, 6.3, 'ที่นอน ≠ ห้องน้ำ', 60, 420, { px: 48, star: PAL.teal });
  tag(ctx, t, 9.3, 'แทบไม่มีเหงื่อ → ลงโคลน', 60, 540, { px: 44, star: PAL.brown });
  tag(ctx, t, 10.4, 'ตัวเย็น + กันแดด', 1020, 660, { px: 44, align: 'right', star: PAL.mustard });
}
function sceneSmart(ctx, t, s) {
  shot(ctx, 3, t, [{ t: 12.6, px: 600, py: 600, z: 1.0 }, { t: 14.4, px: 560, py: 420, z: 1.2 }, { t: 17.3, px: 520, py: 520, z: 1.05 }, { t: 21.6, px: 600, py: 600, z: 1.12 }]);
  tag(ctx, t, 15.0, 'จำชื่อตัวเองได้', 60, 420, { px: 46, star: PAL.mustard });
  tag(ctx, t, 16.0, 'เก่งพอ ๆ กับหมา', 60, 540, { px: 46, star: PAL.coral });
  callout(ctx, t, 17.8, 800, 1180, 170, c => joystick(c), PAL.blueL, [700, 900]);
  tag(ctx, t, 18.4, 'เล่นเกมด้วยจอย!', 540, 1330, { px: 46, align: 'center', star: PAL.blue });
}
function sceneFast(ctx, t, s) {
  shot(ctx, 2, t, [{ t: 21.6, px: 420, py: 520, z: 1.0 }, { t: 25.2, px: 760, py: 620, z: 1.0 }], t > 22.0 ? 4 : 0);
  if (t > 22.0) speedLines(ctx, t, 1);
  const k = pop(t, 22.8, 0.28);
  if (k > 0) { ctx.save(); ctx.translate(800, 1130); ctx.scale(k, k); ctx.rotate(-0.06);
    star(ctx, 0, 0, 230, { n: 16, inner: 0.72, fill: PAL.mustard, line: 4.5, seed: 60 });
    text(ctx, '~17', 0, 20, { font: '120px Slab', fill: COL.ink, plate: PAL.white, off: [5, 4], align: 'center' });
    text(ctx, 'กม./ชม.', 0, 96, { font: '600 46px Prompt', fill: COL.ink, align: 'center' }); ctx.restore();
    if (k > 0.95) note('speed', '~17 กม./ชม.', 600, 940, 1000, 1330); }
}
function sceneNose(ctx, t, s) {
  shot(ctx, 4, t, [{ t: 25.2, px: 600, py: 450, z: 1.1 }, { t: 28.7, px: 640, py: 290, z: 1.7 }]);
  // scent lines rising from the ground to the snout
  if (t > 26.0) for (let i = 0; i < 3; i++) { const q = ((t - 26) * 0.8 + i / 3) % 1; ink(ctx, spline([[300 + i * 60, 1300 - q * 300], [330 + i * 60, 1240 - q * 300], [300 + i * 60, 1180 - q * 300]], false, 6), 7, { seed: 100 + i, color: PAL.white, alpha: 1 - q }); }
  callout(ctx, t, 26.3, 300, 1150, 170, c => truffle(c), PAL.kraftL, [540, 820]);
  tag(ctx, t, 26.0, 'ดมหาเห็ดทรัฟเฟิล', 1020, 1300, { px: 44, align: 'right', star: PAL.brown });
}
function sceneRecap(ctx, t, s) {
  const cuts = [[28.7, 1, 'สะอาด', PAL.teal, 600, 500], [29.25, 3, 'ฉลาด', PAL.mustard, 560, 420], [29.75, 2, 'วิ่งเร็ว', PAL.coral, 420, 400], [30.2, 4, 'จมูกดี', PAL.plum, 640, 300]];
  let c = cuts[0]; for (const x of cuts) if (t >= x[0]) c = x;
  const k = clamp((t - c[0]) / 0.06);
  photo(ctx, c[1], c[4], c[5], 1.3 + 0.08 * (1 - k));
  ctx.save(); ctx.translate(540, 1240); ctx.scale(lerp(1.08, 1, k), lerp(1.08, 1, k)); ctx.rotate(-0.05);
  shape(ctx, rrect(-330, -110, 660, 200, 24), { fill: c[3], line: 6, seed: 110, grain: 0.15 });
  text(ctx, c[2], 0, 40, { font: '120px Chonburi', fill: COL.paper, plate: COL.ink, off: [5, 5], align: 'center' }); ctx.restore();
  note('recap_' + c[2], c[2], 210, 1130, 870, 1330, true);
}
function sceneEnd(ctx, t, s) {
  shot(ctx, 5, t, [{ t: 30.8, px: 600, py: 700, z: 1.15 }, { t: 33.0, px: 620, py: 640, z: 1.0 }]);
  const k = pop(t, 31.3, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 260); ctx.scale(k, k); ctx.translate(-540, -260);
    shape(ctx, rrect(90, 150, 900, 250, 26), { fill: COL.paper, line: 5, seed: 11, grain: 0.15 });
    text(ctx, 'เกิดเป็นหมู', 540, 260, { font: '76px Chonburi', fill: COL.ink, align: 'center' });
    text(ctx, 'ก็ไม่เลว!', 540, 370, { font: '96px Chonburi', fill: COL.ink, plate: PAL.mustard, off: [6, 5], align: 'center' });
    ctx.restore();
    if (k > 0.95) note('end', 'เกิดเป็นหมู ก็ไม่เลว!', 90, 150, 990, 400);
  }
  for (let i = 0; i < 5; i++) { const q = (t * 0.9 + i / 5) % 1; sparkle(ctx, 140 + i * 200, 700 - q * 200, 30 * (1 - q), { fill: PAL.white, rot: i }); }
}

const SCENE = { hook: sceneHook, clean: sceneClean, smart: sceneSmart, fast: sceneFast, nose: sceneNose, recap: sceneRecap, end: sceneEnd };
function drawSection(ctx, t, s) {
  ctx.save(); SCENE[s.id](ctx, t, s); ctx.restore();
  if (s.n) { ctx.save(); stepHeader(ctx, t, s); ctx.restore(); }
}
const MED = [540, 860];
export function renderFilm(ctx, t, Q) {
  setClock(t); TXT = [];
  ctx.fillStyle = PAL.ink; ctx.fillRect(0, 0, W, H);
  const s = section(t), i = S.indexOf(s), prev = S[i - 1];
  const TR = 0.42;
  ctx.save();
  if (prev && t < s.t0 + TR && s.tr !== 'cut') {
    const u = seg(t, s.t0, s.t0 + TR);
    const tOld = Math.min(t, prev.t1 - 0.02);
    if (s.tr === 'iris') {
      drawSection(ctx, tOld, prev);
      ctx.save(); ctx.beginPath(); ctx.arc(MED[0], MED[1], eo(u) * 2300 + 1, 0, TAU); ctx.clip();
      drawSection(ctx, Math.max(t, s.t0 + 0.01), s); ctx.restore();
      ink(ctx, ellipse(MED[0], MED[1], eo(u) * 2300 + 1, eo(u) * 2300 + 1, 90), 8, { closed: true, seed: 980, breaks: 0.05 });
      if (s.n && u < 0.6) medallion(ctx, t, s.t0 - 0.36, MED[0], MED[1], s.n);
    } else {
      const blockC = PAL.teal, p = eio(u) * 2;
      drawSection(ctx, p < 1 ? tOld : Math.max(t, s.t0 + 0.01), p < 1 ? prev : s);
      ctx.fillStyle = blockC;
      const top = p < 1 ? H * (1 - p) : 0, bot = p < 1 ? H : H * (2 - p); ctx.fillRect(0, top, W, bot - top); ink(ctx, [[0, top], [W, top]], 6, { seed: 981, taper: false });
    }
  } else {
    drawSection(ctx, t, s);
    const nx = S[i + 1];
    if (nx && nx.n && nx.tr === 'iris' && t >= nx.t0 - 0.36) medallion(ctx, t, nx.t0 - 0.36, MED[0], MED[1], nx.n);
  }
  ctx.restore();
  if (t > 34.2) {
    const u = eo(seg(t, 34.2, 34.9)), r = lerp(1500, 360, u);
    ctx.save(); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(560, 760, r, 0, TAU, true); ctx.fill(); ctx.restore();
  }
  if (Q.get('nosubs') !== '1') caption(ctx, t);
  paperFinish(ctx, W, H, 0.35);
}
export function texts(t) { return TXT; }

function buildEvents(durs) {
  EVS = [];
  for (const [id, t] of Object.entries(VO_T)) ev(t, 'vo', { id, dur: durs[id] || 2 });
  ev(0.3, 'pop'); ev(0.5, 'oink');
  for (const s of S) {
    if (s.n && s.tr === 'iris') { ev(s.t0 - 0.36, 'stamp'); ev(s.t0, 'iris', { dur: 0.42 }); }
    if (s.tr === 'wipeUp') ev(s.t0, 'paper_swish', { gain: 1.2 });
    if (s.n) ev(s.t0 + 0.3, 'slide');
  }
  ev(4.0, 'squeak'); ev(5.0, 'squeak'); ev(6.3, 'pop'); ev(9.3, 'pop'); ev(10.4, 'pop'); ev(8.7, 'mud');
  ev(15.0, 'pop'); ev(16.0, 'pop'); ev(17.8, 'pop'); ev(18.0, 'blip'); ev(18.3, 'blip'); ev(18.6, 'blip'); ev(18.4, 'pop');
  ev(21.8, 'whoosh', { dur: 0.6 }); for (let k = 0; k < 10; k++) ev(22.0 + k * 0.3, 'wheel'); ev(22.8, 'pop'); ev(23.0, 'whistle', { up: 1 });
  ev(26.0, 'sniff'); ev(26.4, 'sniff'); ev(26.3, 'pop'); ev(26.0, 'pop');
  [28.7, 29.25, 29.75, 30.2].forEach((t, i) => ev(t, 'stamp', { gain: 0.8 }));
  ev(31.3, 'pop'); ev(31.5, 'sparkle'); ev(32.6, 'oink'); ev(34.2, 'iris', { dur: 0.7 });
  EVS.sort((a, b) => a.t - b.t);
}
