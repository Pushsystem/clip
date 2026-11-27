// "ถ้าคุณเกิดเป็นหมู" (animated) — the boss pig, redrawn in code after the user's mascot and rigged, acts out four pig facts. 1080×1920.
import { PAL, setClock, shape, ink, plane, text, fit, measure, star, sparkle, rays, ellipse, rrect, rect, spline, xform,
  arrow, dashed, clamp, lerp, seg, ss, eo, eio, back, twos, TAU, paperFinish, kidney } from './engine/toon.js';
import { mark } from './cast.js';
import { drawBoss, armJoints, hand, GOLD, GOLDD, SUIT } from './bosspig.js';

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
// ------------------------------------------------------------------ the boss pig in action
let DURS = {};
function talk(t) { for (const [id, t0] of Object.entries(VO_T)) { const d = DURS[id] || 2; if (t >= t0 && t < t0 + d) return Math.floor(twos(t) * 7) % 2 ? 0.9 : 0.15; } return 0; }
// two-bone IK in the pig's local space: shoulder → target, bend ±1
function ik(side, tgt, bend = 1) {
  const sh = side === 'R' ? [190, -400] : [-190, -400], L1 = 105, L2 = 95;
  const dx = tgt[0] - sh[0], dy = tgt[1] - sh[1], d = clamp(Math.hypot(dx, dy), 20, L1 + L2 - 1);
  const a = Math.atan2(dy, dx), al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const a1 = a + bend * al, el = [sh[0] + Math.cos(a1) * L1, sh[1] + Math.sin(a1) * L1];
  return { a1, a2: Math.atan2(tgt[1] - el[1], tgt[0] - el[0]) };
}
// the store: warm dark wall, gold-lit shelves with boxes and bottles, a neon house outline, a glossy floor
function store(ctx, t, fy = 1300, x0 = 0) {
  ctx.fillStyle = '#56443B'; ctx.fillRect(-3000, -3000, 9000, 9000);
  ink(ctx, [[x0 + 330, 520], [x0 + 540, 330], [x0 + 750, 520], [x0 + 750, 900], [x0 + 330, 900], [x0 + 330, 520]], 10, { seed: 40, color: GOLD, taper: false });
  for (let side = 0; side < 2; side++) for (let r = 0; r < 4; r++) {
    const sx = x0 + (side ? 820 : -40), y = 420 + r * 220;
    ink(ctx, [[sx, y], [sx + 300, y]], 10, { seed: 42 + r, color: GOLD, taper: false });
    for (let k = 0; k < 4; k++) { const bx = sx + 20 + k * 70, c = [PAL.white, PAL.pink, PAL.blueL, PAL.tealL][(r + k + side) % 4];
      if ((r + k) % 3 === 0) { shape(ctx, rrect(bx, y - 110, 34, 104, 8), { fill: c, line: 3, seed: 50 + k, grain: 0.1 }); shape(ctx, rect(bx + 8, y - 128, 18, 20), { fill: PAL.blue, line: 2.5, seed: 51, grain: 0 }); }
      else shape(ctx, rrect(bx, y - 70, 60, 64, 8), { fill: c, line: 3, seed: 52 + k, grain: 0.1 }); }
  }
  plane(ctx, rect(-3000, fy, 9000, 2000), '#5C5352'); ink(ctx, [[-3000, fy], [9000, fy]], 5, { seed: 60, taper: false });
  for (let i = -6; i < 14; i++) ink(ctx, [[x0 + i * 180, fy], [x0 + i * 260 - 400, fy + 700]], 3, { seed: 61 + i, color: '#6E6463', taper: false });
}
function mopHead(ctx, x, y) {
  shape(ctx, ellipse(x, y, 150, 30, 30), { fill: PAL.white, line: 4, seed: 70, grain: 0.3 });
  for (let i = 0; i < 12; i++) ink(ctx, [[x - 140 + i * 25, y + 6], [x - 146 + i * 25, y + 34]], 9, { seed: 71 + i, color: PAL.white });
  shape(ctx, ellipse(x, y - 8, 110, 18, 30), { fill: PAL.mustard, line: 3.5, seed: 72, grain: 0 });
}
function spray(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, rrect(-34, -60, 68, 130, 16), { fill: PAL.blueL, line: 4, seed: 80, grain: 0.1 });
  shape(ctx, rrect(-34, 0, 68, 70, 14), { fill: PAL.blue, line: 0, seed: 81, grain: 0, off: [0, 0] });
  shape(ctx, [[-20, -60], [20, -60], [24, -96], [60, -96], [60, -80], [-20, -80]], { fill: PAL.white, line: 3.6, seed: 82, grain: 0 });
  ctx.restore();
}
function cart(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, rrect(-60, -360, 130, 130, 14), { fill: PAL.blueL, line: 3.6, seed: 90, grain: 0.1 }); shape(ctx, rrect(80, -340, 120, 110, 14), { fill: PAL.pink, line: 3.6, seed: 91, grain: 0.1 });
  shape(ctx, rrect(-10, -440, 140, 80, 14), { fill: PAL.white, line: 3.6, seed: 92, grain: 0.1 });
  ink(ctx, [[190, -420], [210, -250]], 10, { seed: 93, color: PAL.kraft, taper: false }); shape(ctx, [[180, -470], [250, -470], [230, -410], [196, -410]], { fill: PAL.mustard, line: 3, seed: 94, grain: 0 });
  shape(ctx, [[-120, -260], [260, -260], [230, -80], [-90, -80]], { fill: 'rgba(0,0,0,0)', line: 0, seed: 95 });
  ink(ctx, [[-120, -260], [260, -260], [230, -80], [-90, -80], [-120, -260]], 8, { seed: 96, color: GOLD, taper: false });
  for (let i = 1; i < 6; i++) ink(ctx, [[-120 + i * 63, -260], [-90 + i * 53, -80]], 4, { seed: 97 + i, color: GOLD, taper: false });
  ink(ctx, [[-90, -170], [245, -170]], 4, { seed: 103, color: GOLD, taper: false });
  ink(ctx, [[-120, -260], [-200, -300]], 9, { seed: 104, color: PAL.chromeD, taper: false });
  ink(ctx, [[-90, -80], [-110, -30], [230, -30], [230, -80]], 7, { seed: 105, color: PAL.chromeD, taper: false });
  [-90, 200].forEach((wx, i) => shape(ctx, ellipse(wx, -10, 22, 22, 16), { fill: PAL.ink, line: 0, seed: 106 + i, grain: 0, off: [0, 0] }));
  ctx.restore();
}
function truffle(c) {
  shape(c, spline([[-90, 20], [-80, -50], [-20, -90], [50, -80], [95, -20], [80, 50], [10, 80], [-60, 70]], true, 6), { fill: '#5A4031', line: 4.4, seed: 110, grain: 0.6 });
  for (let i = 0; i < 9; i++) shape(c, ellipse(-50 + (i % 3) * 45, -40 + Math.floor(i / 3) * 40, 7, 6, 8), { fill: '#3D2A20', line: 0, grain: 0, off: [0, 0], seed: 111 + i });
}
function joystick(c, s = 1) {
  c.save(); c.scale(s, s);
  shape(c, rrect(-110, 20, 220, 90, 20), { fill: PAL.ink, line: 4, seed: 120, grain: 0.1 });
  ink(c, [[0, 30], [30, -80]], 18, { seed: 121, taper: false }); shape(c, ellipse(30, -90, 34, 34, 20), { fill: PAL.coral, line: 4, seed: 122, grain: 0.1 });
  shape(c, ellipse(70, 66, 16, 16, 14), { fill: PAL.mustard, line: 3, seed: 123, grain: 0 });
  c.restore();
}
function mud(c) {
  shape(c, ellipse(0, 60, 170, 60, 40), { fill: PAL.brown, line: 4, seed: 130, grain: 0.5 });
  for (let i = 0; i < 4; i++) ink(c, ellipse(-80 + i * 50, 50 + (i % 2) * 14, 12, 8, 12), 3, { closed: true, seed: 131 + i, color: PAL.brownL });
  shape(c, ellipse(70, -80, 46, 46, 24), { fill: PAL.mustard, line: 4, seed: 135, grain: 0.1 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ink(c, [[70 + Math.cos(a) * 60, -80 + Math.sin(a) * 60], [70 + Math.cos(a) * 82, -80 + Math.sin(a) * 82]], 5, { seed: 136 + i, color: PAL.mustardD }); }
}
function boxes(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  [[0, 0, 170, 110], [10, -110, 150, 100], [20, -205, 130, 95]].forEach(([bx, by, w, h], i) => { shape(ctx, rect(bx - w / 2, by - h, w, h), { fill: PAL.kraft, line: 3.6, seed: 140 + i, grain: 0.3 }); ink(ctx, [[bx - w / 2, by - h + 20], [bx + w / 2, by - h + 20]], 8, { seed: 143 + i, color: PAL.kraftL, taper: false }); });
  ctx.restore();
}

// ------------------------------------------------------------------ scenes
const P0 = { x: 540, y: 1430, s: 1.1 };
function boss(ctx, t, p) { drawBoss(ctx, { ...P0, talk: talk(t), t, ...p }); }
function sceneHook(ctx, t) {
  ctx.save(); cam(ctx, 540, lerp(1000, 900, ss(seg(t, 0, 3.6))), lerp(1.0, 1.12, ss(seg(t, 0, 3.6))));
  store(ctx, t, 1430);
  const tap = Math.floor(twos(t) * 4) % 2 ? -10 : 0;
  boss(ctx, t, { face: 'grumpy', crossed: true, bob: tap * 0.3 });
  ctx.restore();
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
  ctx.save(); cam(ctx, 540, 960, lerp(1.0, 1.05, ss(seg(t, s.t0, s.t1))));
  store(ctx, t, 1430);
  // mopping: the mop head slides left-right on twos; both hands ride the pole (IK)
  const tw = twos(t), sw = Math.sin(tw * 5) * 130;
  const B = [260 + sw, -20], T = [40 + sw * 0.35, -430];      // pole bottom (mop head) and top, pig-local
  const along = u => [lerp(T[0], B[0], u), lerp(T[1], B[1], u)];
  const hR = along(0.12), hL = along(0.45);
  const front = c => { ink(c, [T, B], 16, { seed: 150, color: PAL.chromeD, taper: false }); ink(c, [T, B], 9, { seed: 151, color: PAL.chrome, taper: false }); mopHead(c, B[0], B[1] + 10); };
  boss(ctx, t, { face: t > 8.7 && t < 9.4 ? 'laugh' : 'cool', armR: ik('R', hR, -1), armL: ik('L', hL, 1), handR: 'grip', handL: 'grip', bob: Math.abs(Math.sin(tw * 5)) * 8, behind: null, front });
  for (let i = 0; i < 6; i++) { const q = (t * 1.3 + i / 6) % 1; sparkle(ctx, 200 + i * 140, 1440 - q * 140, 30 * (1 - q), { fill: PAL.white, rot: i }); }
  ctx.restore();
  tag(ctx, t, 6.3, 'ที่นอน ≠ ห้องน้ำ', 60, 420, { px: 48, star: PAL.teal });
  callout(ctx, t, 9.0, 820, 640, 160, c => mud(c), PAL.blueL);
  tag(ctx, t, 9.3, 'ไม่มีเหงื่อ → ลงโคลน', 60, 540, { px: 44, star: PAL.brown });
  tag(ctx, t, 10.4, 'ตัวเย็น + กันแดด', 60, 660, { px: 44, star: PAL.mustard });
}
function sceneSmart(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, lerp(1.05, 1.0, ss(seg(t, s.t0, s.t1))));
  store(ctx, t, 1430);
  const tw = twos(t);
  if (t < 17.6) {
    const tapHead = t > 15.0 && t < 16.4;
    const armL = tapHead ? ik('L', [-120, -640 + Math.abs(Math.sin(tw * 9)) * 20], 1) : { a1: 2.2, a2: 1.2 };
    boss(ctx, t, { face: 'laugh', armR: { a1: -0.5, a2: -1.57 }, handR: 'thumb', armL, handL: tapHead ? 'fist' : 'grip', tilt: Math.sin(tw * 3) * 0.05,
      front: c => { if (!tapHead) { const J = armJoints({ armL }, 'L'); spray(c, J.ha[0] - 10, J.ha[1] - 30, 1.1); } } });
  } else {
    // playing a game: both hands on a joystick held at the belly, the stick waggling
    const w = Math.sin(tw * 14) * 0.4;
    boss(ctx, t, { face: 'laugh', armR: ik('R', [70, -250], -1), armL: ik('L', [-70, -230], 1), handR: 'grip', handL: 'grip', bob: Math.abs(Math.sin(tw * 7)) * 6,
      front: c => { c.save(); c.translate(0, -230); c.rotate(w * 0.1); joystick(c, 1.0); c.restore(); } });
  }
  ctx.restore();
  tag(ctx, t, 15.0, 'จำชื่อตัวเองได้', 60, 420, { px: 46, star: PAL.mustard });
  tag(ctx, t, 16.0, 'เก่งพอ ๆ กับหมา', 60, 540, { px: 46, star: PAL.coral });
  tag(ctx, t, 18.0, 'เล่นเกมด้วยจอย!', 60, 660, { px: 46, star: PAL.blue });
}
function sceneFast(ctx, t, s) {
  const u = seg(t, 21.7, 25.2), wx = lerp(-200, 2000, u);
  ctx.save(); cam(ctx, wx + 160, 960, 0.9);
  store(ctx, t, 1300, Math.floor((wx - 540) / 1080) * 1080); store(ctx, t, 1300, Math.floor((wx - 540) / 1080) * 1080 + 1080);
  const tw = twos(t);
  for (let i = 0; i < 6; i++) ink(ctx, [[wx - 280 - i * 40, 820 + i * 70], [wx - 520 - i * 60, 820 + i * 70]], 8, { seed: 160 + i, color: PAL.white, breaks: 0.2 });
  cart(ctx, wx + 400, 1320, 1.0);
  boss(ctx, t, { x: wx, y: 1320, face: 'laugh', walk: tw * 18, run: true, bob: -Math.abs(Math.sin(tw * 18)) * 24, armR: ik('R', [235, -300], -1), armL: ik('L', [150, -320], -1), handR: 'grip', handL: 'grip', tilt: 0.06 });
  ctx.restore();
  const k = pop(t, 22.8, 0.28);
  if (k > 0) { ctx.save(); ctx.translate(820, 470); ctx.scale(k, k); ctx.rotate(-0.06);
    star(ctx, 0, 0, 200, { n: 16, inner: 0.72, fill: PAL.mustard, line: 4.5, seed: 170 });
    text(ctx, '~17', 0, 18, { font: '110px Slab', fill: COL.ink, plate: PAL.white, off: [5, 4], align: 'center' });
    text(ctx, 'กม./ชม.', 0, 88, { font: '600 42px Prompt', fill: COL.ink, align: 'center' }); ctx.restore();
    if (k > 0.95) note('speed', '~17 กม./ชม.', 640, 300, 1000, 650); }
}
function sceneNose(ctx, t, s) {
  const z = lerp(1.5, 2.2, ss(seg(t, 25.2, 28.7)));
  ctx.save(); cam(ctx, 540, 1430 - 600, z);
  store(ctx, t, 1430);
  boss(ctx, t, { face: 'sniff', armR: ik('R', [120, -560], -1), handR: 'fist', bob: Math.sin(twos(t) * 10) * 4, tilt: -0.08 + Math.sin(twos(t) * 6) * 0.03 });
  ctx.restore();
  if (t > 26.0) for (let i = 0; i < 3; i++) { const q = ((t - 26) * 0.8 + i / 3) % 1; ink(ctx, spline([[260 + i * 60, 1300 - q * 360], [290 + i * 60, 1240 - q * 360], [260 + i * 60, 1180 - q * 360]], false, 6), 8, { seed: 180 + i, color: PAL.white, alpha: 1 - q }); }
  callout(ctx, t, 26.3, 270, 1180, 160, c => truffle(c), PAL.kraftL);
  tag(ctx, t, 26.0, 'ดมหาเห็ดทรัฟเฟิล', 1020, 1320, { px: 44, align: 'right', star: PAL.brown });
}
function sceneRecap(ctx, t, s) {
  const cuts = [[28.7, 'สะอาด', PAL.teal], [29.25, 'ฉลาด', PAL.mustard], [29.75, 'วิ่งเร็ว', PAL.coral], [30.2, 'จมูกดี', PAL.plum]];
  let i = 0; for (let j = 0; j < 4; j++) if (t >= cuts[j][0]) i = j;
  const c = cuts[i], k = clamp((t - c[0]) / 0.06);
  ctx.fillStyle = c[2]; ctx.fillRect(0, 0, W, H);
  rays(ctx, 540, 900, 28, 1500, PAL.white, { alpha: 0.25 });
  const poses = [
    { face: 'cool', armR: { a1: 0.7, a2: 2.4 }, armL: { a1: 1.5, a2: 0.4 } },
    { face: 'laugh', armR: { a1: -0.5, a2: -1.57 }, handR: 'thumb' },
    { face: 'laugh', walk: 1.0, run: true, armR: { a1: 0.3, a2: -0.3 }, armL: { a1: 2.8, a2: 2.9 } },
    { face: 'sniff', tilt: -0.1 },
  ];
  ctx.save(); cam(ctx, 540, 1000, lerp(1.1, 1.0, k));
  boss(ctx, t, { ...poses[i], talk: 0 });
  ctx.restore();
  ctx.save(); ctx.translate(540, 1240); ctx.scale(lerp(1.08, 1, k), lerp(1.08, 1, k)); ctx.rotate(-0.05);
  shape(ctx, rrect(-330, -110, 660, 200, 24), { fill: COL.paper, line: 6, seed: 190, grain: 0.15 });
  text(ctx, c[1], 0, 40, { font: '120px Chonburi', fill: COL.ink, plate: c[2], off: [5, 5], align: 'center' }); ctx.restore();
  note('recap_' + c[1], c[1], 210, 1130, 870, 1330, true);
}
function sceneEnd(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, 1.0);
  store(ctx, t, 1430);
  const tw = twos(t), wave = Math.sin(tw * 9) * 0.35;
  const armL = ik('L', [-150, -300], 1);
  boss(ctx, t, { face: 'laugh', armR: { a1: -0.55 + wave * 0.2, a2: -1.5 + wave }, handR: 'open', armL, handL: 'grip', bob: Math.abs(Math.sin(tw * 4)) * 6,
    front: c => boxes(c, -170, -270, 0.9) });
  ctx.restore();
  const k = pop(t, 31.3, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 260); ctx.scale(k, k); ctx.translate(-540, -260);
    shape(ctx, rrect(90, 150, 900, 250, 26), { fill: COL.paper, line: 5, seed: 11, grain: 0.15 });
    text(ctx, 'เกิดเป็นหมู', 540, 260, { font: '76px Chonburi', fill: COL.ink, align: 'center' });
    text(ctx, 'ก็ไม่เลว!', 540, 370, { font: '96px Chonburi', fill: COL.ink, plate: PAL.mustard, off: [6, 5], align: 'center' });
    ctx.restore();
    if (k > 0.95) note('end', 'เกิดเป็นหมู ก็ไม่เลว!', 90, 150, 990, 400);
  }
  for (let i = 0; i < 5; i++) { const q = (t * 0.9 + i / 5) % 1; sparkle(ctx, 140 + i * 200, 900 - q * 200, 30 * (1 - q), { fill: PAL.white, rot: i }); }
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
      const p = eio(u) * 2;
      drawSection(ctx, p < 1 ? tOld : Math.max(t, s.t0 + 0.01), p < 1 ? prev : s);
      ctx.fillStyle = PAL.teal;
      const top = p < 1 ? H * (1 - p) : 0, bot = p < 1 ? H : H * (2 - p); ctx.fillRect(0, top, W, bot - top); ink(ctx, [[0, top], [W, top]], 6, { seed: 981, taper: false });
    }
  } else {
    drawSection(ctx, t, s);
    const nx = S[i + 1];
    if (nx && nx.n && nx.tr === 'iris' && t >= nx.t0 - 0.36) medallion(ctx, t, nx.t0 - 0.36, MED[0], MED[1], nx.n);
  }
  ctx.restore();
  if (t > 34.2) {
    const u = eo(seg(t, 34.2, 34.9)), r = lerp(1500, 380, u);
    ctx.save(); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(540, 860, r, 0, TAU, true); ctx.fill(); ctx.restore();
  }
  if (Q.get('nosubs') !== '1') caption(ctx, t);
  paperFinish(ctx, W, H, 0.6);
}
export function texts(t) { return TXT; }

function buildEvents(durs) {
  DURS = durs;
  EVS = [];
  for (const [id, t] of Object.entries(VO_T)) ev(t, 'vo', { id, dur: durs[id] || 2 });
  ev(0.3, 'pop'); ev(0.5, 'oink'); for (let k = 0; k < 7; k++) ev(0.25 + k * 0.5, 'tap');
  for (const s of S) {
    if (s.n && s.tr === 'iris') { ev(s.t0 - 0.36, 'stamp'); ev(s.t0, 'iris', { dur: 0.42 }); }
    if (s.tr === 'wipeUp') ev(s.t0, 'paper_swish', { gain: 1.2 });
    if (s.n) ev(s.t0 + 0.3, 'slide');
  }
  for (let k = 0; k < 14; k++) ev(3.8 + k * 0.63, 'squeak');
  ev(6.3, 'pop'); ev(9.0, 'pop'); ev(9.3, 'pop'); ev(10.4, 'pop'); ev(9.2, 'mud');
  ev(15.0, 'pop'); ev(16.0, 'pop'); for (let k = 0; k < 5; k++) ev(15.0 + k * 0.28, 'tap'); ev(18.0, 'pop'); for (let k = 0; k < 10; k++) ev(17.7 + k * 0.35, 'blip');
  ev(21.8, 'whoosh', { dur: 0.6 }); for (let k = 0; k < 14; k++) ev(21.8 + k * 0.25, 'wheel'); for (let k = 0; k < 12; k++) ev(21.85 + k * 0.29, 'hoof', { gain: 0.5 }); ev(22.8, 'pop'); ev(23.0, 'whistle', { up: 1 });
  ev(25.8, 'sniff'); ev(26.2, 'sniff'); ev(26.6, 'sniff'); ev(26.3, 'pop'); ev(26.0, 'pop');
  [28.7, 29.25, 29.75, 30.2].forEach(t => ev(t, 'stamp', { gain: 0.8 }));
  ev(31.3, 'pop'); ev(31.5, 'sparkle'); ev(32.6, 'oink'); ev(34.2, 'iris', { dur: 0.7 });
  EVS.sort((a, b) => a.t - b.t);
}
