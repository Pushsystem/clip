// "5 หมูตัวโต" — a countdown of five big pig breeds, then the record holder (Mid-century Cartoon), vertical 1080×1920.
import { PAL, setClock, shape, ink, plane, text, fit, measure, star, sparkle, rays, ellipse, rrect, rect, spline, xform,
  arrow, dashed, clamp, lerp, seg, ss, eo, eio, back, twos, TAU, paperFinish, kidney } from './engine/toon.js';
import { drawBoar, drawHunter, mark, mixc } from './cast.js';

const W = 1080, H = 1920;
export const BPM = 120, BEAT = 60 / BPM;
const COL = { ink: PAL.ink, paper: '#FBF3E2', accent: PAL.coral };
const STEPC = [PAL.mustard, PAL.coral, PAL.teal, PAL.blue, PAL.avocado];
const VO_T = { v1: 0.4, v2: 3.3, v3: 7.5, v4: 10.9, v5: 14.4, v6: 17.6, v7: 21.3, v8: 27.0, v9: 29.7, v10: 32.8 };
export const DUR = 38.4;
const BREED = {
  5: { col: '#F4D9CF', colD: '#E2B6A8', ear: 0, snout: PAL.pink, ground: [PAL.blueL, PAL.avocado], tags: ['อังกฤษ', 'เลี้ยงมากที่สุดในโลก'], feat: 'ear' },
  4: { col: '#F4D9CF', colD: '#E2B6A8', ear: 1, snout: PAL.pink, ground: [PAL.mustardL, PAL.avocado], tags: ['เดนมาร์ก', 'ลำตัวยาวพิเศษ'], feat: 'len', len: 1.2 },
  3: { col: '#B5552F', colD: '#8C3E22', ear: 0.8, snout: '#D98A6A', ground: [PAL.tealL, PAL.avocado], tags: ['อเมริกา', 'สีแดง ตัวหนา'], feat: 'col' },
  2: { col: '#2E2A2B', colD: '#1B1819', ear: 0, snout: '#5A5254', belt: true, ground: [PAL.coralL, PAL.avocado], tags: ['อเมริกา', 'คาดเข็มขัดขาว'], feat: 'belt' },
  1: { col: '#2E2A2B', colD: '#1B1819', ear: 0.9, snout: PAL.white, points: true, ground: [PAL.mustard, PAL.avocadoD], tags: ['โอไฮโอ สหรัฐฯ', 'ดำ เท้าขาว'], feat: 'points' },
};
const NAMES = { 5: 'ลาร์จไวท์', 4: 'แลนด์เรซ', 3: 'ดูร็อค', 2: 'แฮมเชียร์', 1: 'โปแลนด์ไชน่า' };
const S = [
  { id: 'hook', t0: 0, t1: 3.0 },
  { id: 'b5', t0: 3.0, t1: 7.2, n: 5, small: 'อันดับ 5', label: NAMES[5], tr: 'iris' },
  { id: 'b4', t0: 7.2, t1: 10.6, n: 4, small: 'อันดับ 4', label: NAMES[4], tr: 'iris' },
  { id: 'b3', t0: 10.6, t1: 14.1, n: 3, small: 'อันดับ 3', label: NAMES[3], tr: 'iris' },
  { id: 'b2', t0: 14.1, t1: 17.2, n: 2, small: 'อันดับ 2', label: NAMES[2], tr: 'iris' },
  { id: 'b1', t0: 17.2, t1: 21.0, n: 1, small: 'อันดับ 1', label: NAMES[1], tr: 'iris' },
  { id: 'bill', t0: 21.0, t1: 32.4, tr: 'wipeUp' },
  { id: 'end', t0: 32.4, t1: DUR, tr: 'wipeSide' },
];
const SILENCE = [[17.0, 17.4]];
const sec = id => S.find(s => s.id === id);
export function section(t) { return S.find(s => t >= s.t0 && t < s.t1) || S[S.length - 1]; }
let SUBS = [], EVS = [], LINES = {};
export function setup(durs, lines) {
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
function breedPig(ctx, n, x, y, s, t, o = {}) {
  const b = BREED[n];
  ctx.save(); ctx.translate(x, y); ctx.scale(b.len || 1, 1);
  drawBoar(ctx, 0, 0, { k: 1, s, col: b.col, colD: b.colD, ear: b.ear, snout: b.snout, belt: b.belt, points: b.points, blink: blinkAt(t, [t0b(n) + 1.4]), ...o });
  ctx.restore();
}
const t0b = n => sec('b' + n).t0;
// balance scale: post, beam tilted by a (rad), two pans; returns pan centres
function balance(ctx, cx, cy, w, a, seed = 0) {
  shape(ctx, [[cx - 60, cy + 420], [cx + 60, cy + 420], [cx + 20, cy], [cx - 20, cy]], { fill: PAL.brown, line: 4, seed: 400 + seed, grain: 0.3 });
  const L = [cx - Math.cos(a) * w, cy - Math.sin(a) * w], R = [cx + Math.cos(a) * w, cy + Math.sin(a) * w];
  ink(ctx, [L, R], 16, { seed: 401 + seed, taper: false }); ink(ctx, [L, R], 9, { seed: 402 + seed, taper: false, color: PAL.mustard });
  shape(ctx, ellipse(cx, cy, 22, 22, 20), { fill: PAL.mustard, line: 4, seed: 403, grain: 0 });
  for (const P of [L, R]) { ink(ctx, [P, [P[0] - 150, P[1] + 120]], 3.5, { seed: 404 }); ink(ctx, [P, [P[0] + 150, P[1] + 120]], 3.5, { seed: 405 });
    shape(ctx, [[P[0] - 190, P[1] + 120], [P[0] + 190, P[1] + 120], [P[0] + 150, P[1] + 150], [P[0] - 150, P[1] + 150]], { fill: PAL.chrome, line: 4, seed: 406, grain: 0.2 }); }
  return [[L[0], L[1] + 120], [R[0], R[1] + 120]];
}
function car(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, spline([[-200, -40], [-190, -100], [-110, -110], [-70, -180], [70, -180], [120, -110], [200, -95], [210, -40]], true, 6), { fill: PAL.teal, line: 4.4, seed: 420, grain: 0.3 });
  shape(ctx, [[-60, -165], [0, -165], [0, -115], [-90, -115]], { fill: PAL.blueL, line: 3, seed: 421, grain: 0 }); shape(ctx, [[15, -165], [60, -165], [100, -115], [15, -115]], { fill: PAL.blueL, line: 3, seed: 422, grain: 0 });
  [-120, 120].forEach((wx, i) => { shape(ctx, ellipse(wx, -40, 42, 42, 24), { fill: PAL.ink, line: 0, seed: 423 + i, grain: 0, off: [0, 0] }); shape(ctx, ellipse(wx, -40, 16, 16, 12), { fill: PAL.chrome, line: 0, seed: 425, grain: 0, off: [0, 0] }); });
  ctx.restore();
}

// ------------------------------------------------------------------ scenes
function sceneHook(ctx, t) {
  ctx.fillStyle = PAL.mustardL; ctx.fillRect(0, 0, W, H);
  rays(ctx, 540, 1150, 30, 1500, PAL.white, { alpha: 0.35, rot: t * 0.05 });
  // five silhouettes growing left to right, on the beat
  [[150, 0.38], [330, 0.5], [530, 0.62], [740, 0.74], [960, 0.86]].forEach(([x, s], i) => { const k = pop(t, 0.2 + i * 0.25, 0.25); if (k > 0) { ctx.save(); ctx.translate(x, 1300); ctx.scale(k, k); drawBoar(ctx, -60 * s, 0, { k: 1, s, col: PAL.ink, colD: PAL.ink, snout: PAL.inkSoft, shadow: false }); ctx.restore(); } });
  ink(ctx, [[0, 1300], [W, 1300]], 5, { seed: 11, taper: false });
  const k = pop(t, 0.5, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 420); ctx.scale(k, k); ctx.translate(-540, -420);
    text(ctx, '5 หมูตัวโต', 540, 400, { font: '120px Chonburi', fill: COL.ink, plate: PAL.white, off: [6, 5], align: 'center' });
    text(ctx, 'ที่สุดในโลก', 540, 530, { font: '96px Chonburi', fill: COL.ink, plate: PAL.coral, off: [6, 5], align: 'center' });
    ctx.restore();
    if (k > 0.9) note('title', '5 หมูตัวโต ที่สุดในโลก', 150, 290, 930, 550);
  }
}
function sceneBreed(ctx, t, s) {
  const n = s.n, b = BREED[n];
  const big = n === 1;
  ctx.save(); cam(ctx, 540, 1000, lerp(1.0, big ? 1.08 : 1.04, ss(seg(t, s.t0, s.t1))));
  ground(ctx, b.ground[0], b.ground[1], 1280);
  if (big) { rays(ctx, 540, 1100, 30, 1500, PAL.white, { alpha: 0.3, rot: t * 0.05 }); }
  // the pig trots in from the right and stops in the centre
  const u = ss(seg(t, s.t0 + 0.4, s.t0 + 1.3));
  const x = lerp(1400, big ? 470 : 500, u), walking = u > 0 && u < 1;
  breedPig(ctx, n, x, 1280, big ? 1.45 : 1.2, t, { walk: walking ? twos(t) * 10 : null, dir: 1 });
  ctx.restore();
  tag(ctx, t, s.t0 + 0.9, b.tags[0], 60, 420, { px: 46, star: STEPC[(n - 1) % 5] });
  tag(ctx, t, s.t0 + 1.1, b.tags[1], 60, 530, { px: 46, star: PAL.coral });
  // a call-out on the defining feature
  const fx = { ear: [830, 690, 190, -220, 1.5], len: [830, 690, 40, -150, 0.42], col: [830, 690, 60, -160, 0.6], belt: [830, 690, 110, -160, 1.1], points: [830, 690, 150, -40, 1.4] }[b.feat];
  callout(ctx, t, s.t0 + 1.9, fx[0], fx[1], 150, c => {
    c.save(); c.scale(fx[4], fx[4]); c.translate(-fx[2], -fx[3]);
    drawBoar(c, 0, 0, { k: 1, s: 1, col: b.col, colD: b.colD, ear: b.ear, snout: b.snout, belt: b.belt, points: b.points, shadow: false }); c.restore();
  }, b.ground[0]);
}
function sceneBill(ctx, t, s) {
  ctx.fillStyle = PAL.blueL; ctx.fillRect(0, 0, W, H);
  const phase2 = t >= 26.9;
  if (!phase2) {
    rays(ctx, 540, 1150, 30, 1500, PAL.white, { alpha: 0.3, rot: t * 0.05 });
    plane(ctx, rect(0, 1250, W, 700), PAL.avocadoL); ink(ctx, [[0, 1250], [W, 1250]], 5, { seed: 30, taper: false });
    breedPig(ctx, 1, 470, 1250, lerp(1.2, 1.7, eo(seg(t, 21.3, 22.0))), t, {});
    tag(ctx, t, 21.6, 'ปี 1933', 60, 260, { px: 54 });
    tag(ctx, t, 22.6, 'บิ๊กบิล', 1020, 260, { px: 54, align: 'right', star: PAL.coral });
    const w = Math.round(1157 * ss(seg(t, 23.4, 24.6)));
    if (t > 23.3) { shape(ctx, rrect(220, 440, 640, 160, 22), { fill: COL.ink, line: 0, seed: 31, grain: 0, off: [0, 0] }); text(ctx, `${w.toLocaleString('en-US')} กก.`, 540, 555, { font: '104px Slab', fill: COL.paper, align: 'center' }); note('w', `${w.toLocaleString('en-US')} กก.`, 220, 440, 860, 600, w !== 1157); }
    // length bar
    if (t > 24.8) { const u = seg(t, 24.8, 25.3); ink(ctx, [[110, 1340], [lerp(110, 970, u), 1340]], 6, { seed: 33, taper: false }); ink(ctx, [[110, 1315], [110, 1365]], 6, { seed: 34, taper: false }); if (u >= 1) ink(ctx, [[970, 1315], [970, 1365]], 6, { seed: 35, taper: false }); if (u >= 1) { text(ctx, '2.75 ม.', 540, 1310, { font: '600 46px Prompt', fill: COL.ink, plate: PAL.white, off: [3, 3], align: 'center' }); } }
  } else {
    // weighed against a car
    const a = lerp(0.25, 0, eo(seg(t, 27.6, 28.6))) + (t > 28.6 ? 0.02 * Math.exp(-4 * (t - 28.6)) * Math.sin((t - 28.6) * 14) : 0);
    plane(ctx, rect(0, 1440, W, 500), PAL.avocadoL);
    const [L, R] = balance(ctx, 540, 980, 300, a);
    breedPig(ctx, 1, L[0] - 60, L[1], 0.7, t, {});
    if (t > 27.4) { const k = pop(t, 27.4, 0.3); ctx.save(); ctx.translate(R[0], R[1]); ctx.scale(k, k); car(ctx, 0, 0, 0.8); ctx.restore(); }
    tag(ctx, t, 27.4, '1,157 กก.', L[0], 620, { px: 46, align: 'center', star: PAL.ink });
    tag(ctx, t, 27.9, 'รถเก๋ง 1 คัน', R[0], 620, { px: 46, align: 'center', star: PAL.teal });
    // the world-record stamp
    if (t > 29.9) { const k = pop(t, 29.9, 0.22); ctx.save(); ctx.translate(540, 380); ctx.scale(k, k); ctx.rotate(-0.12);
      ink(ctx, rrect(-280, -70, 560, 140, 18), 10, { closed: true, color: PAL.coralD, seed: 32 }); text(ctx, 'สถิติโลก', 0, 32, { font: '92px Chonburi', fill: PAL.coralD, align: 'center' }); ctx.restore();
      if (k > 0.95) note('rec', 'สถิติโลก', 260, 310, 820, 450); }
  }
}
function sceneEnd(ctx, t, s) {
  ctx.fillStyle = PAL.coralL; ctx.fillRect(0, 0, W, H);
  plane(ctx, rect(0, 1440, W, 500), PAL.mustardL);
  const a = lerp(-0.2, 0, eo(seg(t, 33.8, 34.8))) + (t > 34.8 ? 0.02 * Math.exp(-4 * (t - 34.8)) * Math.sin((t - 34.8) * 14) : 0);
  const [L, R] = balance(ctx, 540, 980, 300, a, 1);
  breedPig(ctx, 1, L[0] - 50, L[1], 0.62, t, { face: 'smug' });
  const people = [[PAL.teal, -105], [PAL.mustard, -35], [PAL.plum, 35], [PAL.blue, 105]];
  people.forEach(([c, dx], i) => { const k = pop(t, 33.2 + i * 0.2, 0.25); if (k > 0) { ctx.save(); ctx.translate(R[0] + dx, R[1]); ctx.scale(k, k); drawHunter(ctx, { x: 0, y: 0, s: 0.32, cloth: c, clothD: c, neat: true, face: 'wow', shadow: false }); ctx.restore(); } });
  tag(ctx, t, 33.4, '~300 กก.', L[0], 600, { px: 46, align: 'center', star: PAL.ink });
  tag(ctx, t, 34.0, 'คน 4 คน', R[0], 600, { px: 46, align: 'center', star: PAL.teal });
  const k = pop(t, 35.4, 0.32);
  if (k > 0) { ctx.save(); ctx.translate(540, 330); ctx.scale(k, k); ctx.translate(-540, -330);
    text(ctx, 'หมูตัวโต!', 540, 360, { font: '120px Chonburi', fill: COL.ink, plate: PAL.white, off: [6, 5], align: 'center' }); ctx.restore();
    if (k > 0.95) note('end', 'หมูตัวโต!', 230, 260, 850, 390); }
}

const SCENE = { hook: sceneHook, b5: sceneBreed, b4: sceneBreed, b3: sceneBreed, b2: sceneBreed, b1: sceneBreed, bill: sceneBill, end: sceneEnd };
function drawSection(ctx, t, s) {
  ctx.save(); SCENE[s.id](ctx, t, s); ctx.restore();
  if (s.n) { ctx.save(); stepHeader(ctx, t, s); ctx.restore(); }
}
const MED = [540, 860];
export function renderFilm(ctx, t, Q) {
  setClock(t); TXT = [];
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
      const up = s.tr === 'wipeUp', blockC = up ? PAL.teal : PAL.coral;
      const p = eio(u) * 2;
      drawSection(ctx, p < 1 ? tOld : Math.max(t, s.t0 + 0.01), p < 1 ? prev : s);
      ctx.fillStyle = blockC;
      if (up) { const top = p < 1 ? H * (1 - p) : 0, bot = p < 1 ? H : H * (2 - p); ctx.fillRect(0, top, W, bot - top); ink(ctx, [[0, top], [W, top]], 6, { seed: 981, taper: false }); }
      else { const l = p < 1 ? W * (1 - p) : 0, r = p < 1 ? W : W * (2 - p); ctx.fillRect(l, 0, r - l, H); ink(ctx, [[l, 0], [l, H]], 6, { seed: 982, taper: false }); }
    }
  } else {
    drawSection(ctx, t, s);
    const nx = S[i + 1];
    if (nx && nx.n && nx.tr === 'iris' && t >= nx.t0 - 0.36) medallion(ctx, t, nx.t0 - 0.36, MED[0], MED[1], nx.n);
  }
  ctx.restore();
  if (t > 37.5) {
    const u = eo(seg(t, 37.5, 38.2)), r = lerp(1500, 300, u);
    ctx.save(); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(250, 1140, r, 0, TAU, true); ctx.fill(); ctx.restore();
  }
  if (Q.get('nosubs') !== '1') caption(ctx, t);
  paperFinish(ctx, W, H, 0.9);
}
export function texts(t) { return TXT; }

function buildEvents(durs) {
  EVS = [];
  for (const [id, t] of Object.entries(VO_T)) ev(t, 'vo', { id, dur: durs[id] || 2 });
  [0.2, 0.45, 0.7, 0.95, 1.2].forEach((t, i) => ev(t, 'box_thump', { pitch: -i * 2 })); ev(0.5, 'pop'); ev(1.4, 'oink');
  for (const s of S) {
    if (s.n && s.tr === 'iris') { ev(s.t0 - 0.36, 'stamp'); ev(s.t0, 'iris', { dur: 0.42 }); }
    if (s.tr === 'wipeUp' || s.tr === 'wipeSide') ev(s.t0, 'paper_swish', { gain: 1.2 });
    if (s.n) { ev(s.t0 + 0.3, 'slide'); for (let k = 0; k < 4; k++) ev(s.t0 + 0.45 + k * 0.22, 'hoof', { gain: 0.5 }); ev(s.t0 + 1.35, 'oink'); ev(s.t0 + 0.9, 'pop'); ev(s.t0 + 1.4, 'pop'); ev(s.t0 + 1.9, 'pop', { gain: 0.6 }); }
  }
  ev(21.3, 'box_thump', { pitch: -6 }); ev(21.6, 'pop'); ev(22.6, 'pop');
  for (let k = 0; k < 14; k++) ev(23.4 + k * 0.085, 'tick'); ev(24.6, 'stamp'); ev(24.8, 'pen_write', { dur: 0.5 });
  ev(26.9, 'paper_swish'); ev(27.4, 'pop'); ev(27.6, 'creak'); ev(28.6, 'clunk'); ev(27.9, 'pop'); ev(29.9, 'stamp_ok');
  [33.2, 33.4, 33.6, 33.8].forEach(t => ev(t, 'pop', { gain: 0.6 })); ev(33.8, 'creak'); ev(34.8, 'clunk'); ev(35.4, 'pop'); ev(35.5, 'oink'); ev(37.5, 'iris', { dur: 0.7 });
  EVS.sort((a, b) => a.t - b.t);
}
