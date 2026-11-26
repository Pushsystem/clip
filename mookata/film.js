// "หมูกระทะมาจากไหน" — three legends, then the Thai recipe in three steps (Mid-century Cartoon), vertical 1080×1920.
// One timeline drives the picture, the sound events (EV), the captions and the reading check (TEXTS).
import { PAL, setClock, shape, ink, plane, text, fit, measure, star, sparkle, rays, ellipse, rrect, rect, spline, xform,
  arrow, dashed, clamp, lerp, seg, ss, eo, eio, back, twos, TAU, paperFinish, kidney } from './engine/toon.js';
import { drawHunter, hunterJoints, hunterToScreen, mark, mixc, helmet, fire, slice, mookataSide, mookataTop, sauceBowl, chopHand } from './cast.js';

const W = 1080, H = 1920;
export const BPM = 120, BEAT = 60 / BPM;
const COL = { ink: PAL.ink, paper: '#FBF3E2', accent: PAL.coral };
const STEPC = [PAL.plum, PAL.blue, PAL.teal, PAL.coral, PAL.mustard, PAL.avocado];
const VO_T = { v1: 0.6, v2: 3.9, v3: 8.7, v4: 12.9, v5: 16.3, v6: 19.9, v7: 23.5, v8: 26.7, v9: 29.4, v10: 33.4 };
export const DUR = 38.5;
const S = [
  { id: 'hook', t0: 0, t1: 3.6 },
  { id: 'mongol', t0: 3.6, t1: 8.4, n: 1, small: 'ตำนานที่ 1 จาก 3', label: 'มองโกล', tr: 'iris' },
  { id: 'japan', t0: 8.4, t1: 12.6, n: 2, small: 'ตำนานที่ 2 จาก 3', label: 'ญี่ปุ่น', tr: 'iris' },
  { id: 'korea', t0: 12.6, t1: 16.0, n: 3, small: 'ตำนานที่ 3 จาก 3', label: 'เกาหลี?', tr: 'iris' },
  { id: 'turn', t0: 16.0, t1: 19.6, tr: 'wipeSide' },
  { id: 'moat', t0: 19.6, t1: 23.2, n: 4, num: 1, small: 'สูตรไทย 1 จาก 3', label: 'ร่องน้ำซุป', tr: 'wipeUp' },
  { id: 'drip', t0: 23.2, t1: 26.4, n: 5, num: 2, small: 'สูตรไทย 2 จาก 3', label: 'น้ำมันไหลลง', tr: 'iris' },
  { id: 'sauce', t0: 26.4, t1: 29.0, n: 6, num: 3, small: 'สูตรไทย 3 จาก 3', label: 'น้ำจิ้ม', tr: 'iris' },
  { id: 'top', t0: 29.0, t1: 33.2, tr: 'cut' },
  { id: 'end', t0: 33.2, t1: DUR, tr: 'wipeUp' },
];
const SILENCE = [[28.95, 29.35]];
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
  text(ctx, String(s.num ?? s.n), 122, 278, { font: '68px Slab', fill: COL.paper, align: 'center' });
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
// ------------------------------------------------------------------ scenes
function sceneHook(ctx, t) {
  ctx.fillStyle = PAL.coralL; ctx.fillRect(0, 0, W, H);
  rays(ctx, 540, 1060, 32, 1500, PAL.white, { alpha: 0.22, rot: t * 0.05 });
  mookataTop(ctx, 540, 1060, 400 * lerp(1.0, 1.06, ss(seg(t, 0, 3.6))), twos(t) * 0.04, { cooked: seg(t, 0, 3.6) * 0.6 });
  // sizzle sparkles
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + Math.floor(t * 12) * 0.7; sparkle(ctx, 540 + Math.cos(a) * 200, 1060 + Math.sin(a) * 200, 26, { fill: PAL.white, rot: a }); }
  const k = pop(t, 0.35, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 380); ctx.scale(k, k); ctx.translate(-540, -380);
    text(ctx, 'หมูกระทะ', 540, 380, { font: '130px Chonburi', fill: COL.ink, plate: PAL.white, off: [6, 5], align: 'center' });
    text(ctx, 'มาจากไหน?', 540, 520, { font: '104px Chonburi', fill: COL.ink, plate: PAL.mustard, off: [6, 5], align: 'center' });
    ctx.restore();
    if (k > 0.9) note('title', 'หมูกระทะ มาจากไหน?', 150, 250, 930, 540);
  }
}
const HELMET_T = [5.5, 6.2];
function sceneMongol(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, lerp(1.0, 1.04, ss(seg(t, s.t0, s.t1))));
  ground(ctx, PAL.mustardL, PAL.kraft);
  // distant felt tent
  shape(ctx, spline([[640, 1250], [650, 1130], [760, 1080], [870, 1130], [880, 1250]], true, 5), { fill: PAL.white, line: 4, seed: 300, grain: 0.3 });
  const P = { x: 300, y: 1300, s: 1.12, cloth: PAL.plum, clothD: '#523650', belt: PAL.mustard, neat: true };
  const off = t >= HELMET_T[0];
  const a = keys(t, [{ t: s.t0, v: { a1: 1.28, a2: 1.45 } }, { t: 5.0, v: { a1: -1.2, a2: -2.2 } }, { t: 5.5, v: { a1: -1.0, a2: -1.6 } }, { t: 6.0, v: { a1: -0.1, a2: 0.2 } }, { t: 7.0, v: { a1: 0.6, a2: -2.4 } }, { t: 8.4, v: { a1: 0.6, a2: -2.4 } }]);
  const face = t > 6.7 ? 'smile' : t > 5.2 ? 'wow' : 'neutral';
  fire(ctx, 770, 1260, 0.95, t);
  const u = eo(seg(t, HELMET_T[0], HELMET_T[1]));
  if (off) {
    const hx0 = P.x, hy0 = P.y - 560 * P.s, hx1 = 770, hy1 = 1150;
    const hx = lerp(hx0, hx1, u), hy = lerp(hy0, hy1, u) - Math.sin(u * Math.PI) * 220;
    helmet(ctx, hx, hy, 1.15 * lerp(P.s, 1, u), t > HELMET_T[1]);
    if (t > HELMET_T[1]) {
      [[6.6, -40, -0.4], [6.9, 30, 0.3], [7.2, -5, 0]].forEach(([tt, dx, ang], i) => {
        const k = seg(t, tt, tt + 0.2); if (k <= 0) return;
        slice(ctx, 770 + dx, lerp(900, 1150 - 100 - (i === 2 ? 14 : 0), eo(k)), ang, 0.9, seg(t, tt, tt + 1.6) * 0.7);
      });
      for (let i = 0; i < 3; i++) { const q = ((t * 0.8 + i / 3) % 1); ink(ctx, spline([[720 + i * 50, 980 - q * 140], [740 + i * 50, 940 - q * 140], [720 + i * 50, 900 - q * 140]], false, 6), 6, { seed: 310 + i, color: PAL.white, alpha: 1 - q }); }
    }
  }
  drawHunter(ctx, { ...P, face, hat: off ? null : 'mongol', armF: a, handF: t > 5.2 && t < 6.0 ? 'grip' : 'open', look: [10, 0], blink: blinkAt(t, [4.6, 7.8]) });
  ctx.restore();
  tag(ctx, t, 6.25, 'ย่างบนหมวกเหล็ก', 540, 430, { align: 'center', px: 48 });
}
function sceneJapan(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 1000, lerp(1.0, 1.06, ss(seg(t, s.t0, s.t1))));
  ground(ctx, PAL.blueL, PAL.blue, 1300);
  shape(ctx, ellipse(830, 760, 90, 90, 40), { fill: PAL.mustardL, line: 0, seed: 320, grain: 0.3 });
  mookataSide(ctx, 540, 1300, 1.45, { t, soup: PAL.chrome, veg: false, cooked: seg(t, 8.6, 12) * 0.7, steam: true });
  ctx.restore();
  tag(ctx, t, 10.0, 'ชื่อเมนู: เจงกิสข่าน', 540, 420, { align: 'center', px: 48 });
  tag(ctx, t, 10.6, 'เกือบ 100 ปี', 540, 560, { align: 'center', px: 44, star: PAL.blue });
}
function sceneKorea(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, 1);
  ground(ctx, PAL.avocadoL, PAL.avocado);
  // a hanging shop sign swings in and settles
  const k = seg(t, 13.4, 13.7);
  if (k > 0) {
    const ang = Math.sin((t - 13.4) * 9) * 0.35 * Math.exp(-(t - 13.4) * 2.2) * (k < 1 ? 1 : 1);
    const y0 = lerp(-200, 520, eo(k));
    ctx.save(); ctx.translate(620, y0 - 220); ctx.rotate(ang);
    ink(ctx, [[-200, 0], [-200, 200]], 4, { seed: 330 }); ink(ctx, [[200, 0], [200, 200]], 4, { seed: 331 });
    shape(ctx, rrect(-260, 200, 520, 170, 20), { fill: PAL.coralD, line: 5, seed: 332, grain: 0.35 });
    shape(ctx, rrect(-236, 222, 472, 126, 14), { fill: COL.paper, line: 3, seed: 333, grain: 0.15 });
    text(ctx, 'เนื้อย่างเกาหลี', 0, 310, { font: '64px Chonburi', fill: COL.ink, plate: PAL.mustard, off: [4, 4], align: 'center' });
    ctx.restore();
    if (k >= 1) note('sign', 'เนื้อย่างเกาหลี', 360, 420, 880, 590);
  }
  const P = { x: 280, y: 1310, s: 1.05, cloth: PAL.teal, clothD: PAL.tealD, neat: true };
  const a = keys(t, [{ t: s.t0, v: { a1: 1.28, a2: 1.45 } }, { t: 13.9, v: { a1: 1.28, a2: 1.45 } }, { t: 14.2, v: { a1: -0.6, a2: -0.8 } }, { t: 16, v: { a1: -0.6, a2: -0.8 } }]);
  drawHunter(ctx, { ...P, face: t > 14.2 ? 'smile' : 'neutral', armF: a, handF: t > 14.1 ? 'point' : 'open', look: [8, -8], blink: blinkAt(t, [13.2, 15.4]) });
  mookataSide(ctx, 780, 1300, 0.85, { t, cooked: 0.3 });
  ctx.restore();
  tag(ctx, t, 14.0, 'ชื่อไทยยุคก่อน', 620, 700, { align: 'center', px: 40 });
}
function sceneTurn(ctx, t, s) {
  ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 36; i++) { const x = (i * 197) % 1200 - 60, y = 200 + ((i * 331) % 1300); shape(ctx, ellipse(x, y, 7, 7, 10), { fill: PAL.pinkD, line: 0, grain: 0, off: [0, 0], seed: 400 + i }); }
  const cards = [[220, PAL.mustardL, c => helmet(c, 0, 50, 0.95)], [540, PAL.blueL, c => mookataSide(c, 0, 120, 0.42, { t, soup: PAL.chrome, veg: false })], [860, PAL.avocadoL, c => { shape(c, rrect(-120, -50, 240, 100, 14), { fill: PAL.coralD, line: 4, seed: 410, grain: 0.3 }); }]];
  const fly = eio(seg(t, 18.9, 19.6));
  cards.forEach(([x, bg, draw], i) => {
    const k = pop(t, 16.2 + i * 0.25, 0.3); if (k <= 0) return;
    const y = 760 - fly * (1400 + i * 120);
    callout(ctx, t, 16.2 + i * 0.25, x, y, 140, draw, bg);
  });
  const q = pop(t, 17.2, 0.3);
  if (q > 0 && fly < 0.3) { ctx.save(); ctx.translate(540, 760); ctx.scale(q, q); ctx.rotate(Math.sin(twos(t) * 6) * 0.05);
    star(ctx, 0, 0, 150, { n: 14, inner: 0.72, fill: PAL.mustard, line: 4, seed: 420 }); text(ctx, '?', 0, 60, { font: '170px Slab', fill: COL.ink, plate: PAL.coral, off: [6, 5], align: 'center' }); ctx.restore(); }
  const kk = clamp((t - 17.0) / 0.5);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 100 + kk * 980, H); ctx.clip();
  text(ctx, 'สูตรไทยแท้ๆ...', 540, 1180, { font: '66px Sriracha', fill: PAL.coralD, align: 'center' });
  ctx.restore();
  if (kk >= 1) note('turn_k', 'สูตรไทยแท้ๆ...', 300, 1120, 940, 1200);
}
function sceneMoat(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 1000, lerp(1.0, 1.04, ss(seg(t, s.t0, s.t1))));
  ground(ctx, PAL.tealL, PAL.teal, 1340);
  mookataSide(ctx, 540, 1340, 1.6, { t, cooked: seg(t, 19.6, 23.2) * 0.6, steam: true });
  ctx.restore();
  const r1 = tag(ctx, t, 20.4, 'ย่างข้างบน', 600, 440, { px: 48 });
  if (r1) arrow(ctx, [r1.x + 120, r1.y + r1.h + 10], [560, 760], { u: seg(t, 20.5, 20.9), w: 6, head: 34, bend: 0.2, fill: PAL.coral });
  const r2 = tag(ctx, t, 21.2, 'ต้มข้างล่าง', 60, 640, { px: 48 });
  if (r2) arrow(ctx, [r2.x + 100, r2.y + r2.h + 10], [200, 970], { u: seg(t, 21.3, 21.7), w: 6, head: 34, bend: -0.2, fill: PAL.teal });
}
function sceneDrip(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 1000, 1);
  ground(ctx, PAL.blueL, PAL.blue, 1340);
  mookataSide(ctx, 540, 1340, 1.25, { t, cooked: 0.7, soup: mixc(PAL.mustardL, PAL.mustard, seg(t, 24, 26)), steam: true });
  ctx.restore();
  callout(ctx, t, 23.6, 680, 600, 230, c => {
    c.fillStyle = PAL.blueL; c.fillRect(-260, -260, 520, 520);
    const slope = [[-240, -170], [-60, -60], [90, 60]];
    shape(c, [[-260, -190], [-60, -80], [110, 50], [110, 260], [-260, 260]], { fill: PAL.chromeD, line: 5, seed: 500, grain: 0.3 });
    shape(c, [[110, 80], [260, 80], [260, 260], [110, 260]], { fill: mixc(PAL.mustardL, PAL.mustard, seg(t, 24, 26)), line: 4, seed: 501, grain: 0.3 });
    slice(c, -150, -150, 0.55, 1.5, 0.6);
    for (let i = 0; i < 4; i++) {
      const q = ((t - 23.7) * 0.9 + i * 0.25) % 1; if (t < 23.7) break;
      const x = lerp(-120, 150, q), y = q < 0.8 ? lerp(-118, 40, q / 0.8) - 12 : lerp(40, 100, (q - 0.8) / 0.2);
      shape(c, spline([[x, y - 18], [x + 10, y], [x, y + 9], [x - 10, y]], true, 4), { fill: PAL.mustardL, line: 3, seed: 510 + i, grain: 0 });
    }
  }, PAL.blueL, [700, 980]);
  tag(ctx, t, 24.3, 'ซุปยิ่งหวาน', 40, 880, { px: 48, star: PAL.mustard });
}
function sceneSauce(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 1000, lerp(1.0, 1.05, ss(seg(t, s.t0, s.t1))));
  ground(ctx, PAL.mustardL, PAL.mustard, 1320);
  rays(ctx, 540, 1150, 28, 900, PAL.white, { alpha: 0.3 });
  const k = pop(t, 26.6, 0.3);
  if (k > 0) { ctx.save(); ctx.translate(540, 1320); ctx.scale(k, k); ctx.translate(-540, -1320); sauceBowl(ctx, 540, 1320, 1.7); ctx.restore(); }
  // chopsticks dip a slice in
  const d = seg(t, 27.3, 27.8), up = seg(t, 28.2, 28.6);
  const hy = lerp(830, 1170, eio(d)) - lerp(0, 300, eio(up));
  chopHand(ctx, 665, hy - 150, 2.55, 1.0);
  slice(ctx, 540, hy - 22, 0.3, 1.3, 0.8);
  for (let i = 0; i < 4; i++) if (t > 27.8) sparkle(ctx, 420 + i * 80, 1080 - ((t * 2 + i * 0.3) % 1) * 120, 22, { fill: PAL.white, rot: i });
  ctx.restore();
}
function sceneTop(ctx, t, s) {
  const zu = ss(seg(t, 29.0, 31.0));
  ctx.save(); cam(ctx, 540, 960, lerp(2.4, 1.0, zu), lerp(0.5, 0, zu));
  ctx.fillStyle = PAL.plum; ctx.fillRect(-2000, -2000, 6000, 6000);
  for (let i = 0; i < 40; i++) { const x = (i * 197) % 1300 - 100, y = (i * 331) % 2100 - 100; star(ctx, x, y, 14, { n: 4, inner: 0.25, fill: PAL.pink, off: [0, 0] }); }
  mookataTop(ctx, 540, 960, 380, -t * 0.08, { cooked: 0.6 });
  [[31.2, -10, 960, 0], [31.6, 1090, 960, Math.PI]].forEach(([tt, x, y, a], i) => {
    const k = eo(seg(t, tt, tt + 0.35)); if (k <= 0) return;
    const L = lerp(-260, 0, k); chopHand(ctx, x + Math.cos(a) * L, y + Math.sin(a) * L, a, 1);
  });
  ctx.restore();
  tag(ctx, t, 29.9, 'ต้นกำเนิด?', 540, 300, { align: 'center', px: 52, star: PAL.mustard });
}
function sceneEnd(ctx, t, s) {
  ctx.fillStyle = PAL.mustardL; ctx.fillRect(0, 0, W, H);
  rays(ctx, 540, 1100, 30, 1600, PAL.white, { alpha: 0.3, rot: 0.05 });
  star(ctx, 540, 1060, 440, { n: 18, inner: 0.8, fill: PAL.mustard, off: [0, 0], line: 4, seed: 600 });
  mookataSide(ctx, 540, 1330, 1.35, { t, cooked: 0.7, steam: true });
  const k = pop(t, 33.45, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 400); ctx.scale(k, k); ctx.translate(-540, -400);
    text(ctx, 'หมูกระทะ', 540, 330, { font: '70px Sriracha', fill: PAL.coralD, align: 'center' });
    text(ctx, 'สูตรของคนไทย', 540, 480, { font: '112px Chonburi', fill: COL.ink, plate: PAL.coral, off: [7, 6], align: 'center' });
    ctx.restore();
    if (k > 0.95) note('endtitle', 'หมูกระทะ สูตรของคนไทย', 120, 260, 960, 510);
  }
  mark(ctx, 880, 700, 100, true, pop(t, 35.6, 0.22), 9);
}

const SCENE = { hook: sceneHook, mongol: sceneMongol, japan: sceneJapan, korea: sceneKorea, turn: sceneTurn, moat: sceneMoat, drip: sceneDrip, sauce: sceneSauce, top: sceneTop, end: sceneEnd };
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
      if (s.n && u < 0.6) medallion(ctx, t, s.t0 - 0.36, MED[0], MED[1], s.num ?? s.n);
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
    if (nx && nx.n && nx.tr === 'iris' && t >= nx.t0 - 0.36) medallion(ctx, t, nx.t0 - 0.36, MED[0], MED[1], nx.num ?? nx.n);
  }
  ctx.restore();
  if (t > 37.6) {
    const u = eo(seg(t, 37.6, 38.3)), r = lerp(1500, 380, u);
    ctx.save(); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(540, 1050, r, 0, TAU, true); ctx.fill(); ctx.restore();
  }
  if (Q.get('nosubs') !== '1') caption(ctx, t);
  paperFinish(ctx, W, H, 0.9);
}
export function texts(t) { return TXT; }

function buildEvents(durs) {
  EVS = [];
  for (const [id, t] of Object.entries(VO_T)) ev(t, 'vo', { id, dur: durs[id] || 2 });
  ev(0.0, 'sizzle', { dur: 3.6 }); ev(0.35, 'pop');
  for (const s of S) {
    if (s.n && s.tr === 'iris') { ev(s.t0 - 0.36, 'stamp'); ev(s.t0, 'iris', { dur: 0.42 }); }
    if (s.tr === 'wipeUp' || s.tr === 'wipeSide') ev(s.t0, 'paper_swish', { gain: 1.2 });
    if (s.n) ev(s.t0 + 0.3, 'slide');
  }
  // mongol
  ev(3.6, 'fire', { dur: 4.8 }); ev(5.0, 'grab'); ev(5.5, 'whistle', { up: 1 }); ev(6.2, 'metal'); ev(6.6, 'sizzle', { dur: 1.8 });
  [6.8, 7.1, 7.4].forEach(t => ev(t, 'slap')); ev(6.25, 'pop', { gain: 0.6 });
  // japan
  ev(8.6, 'sizzle', { dur: 3.8, gain: 0.6 }); ev(10.0, 'pop'); ev(10.6, 'pop', { gain: 0.8 });
  // korea
  ev(13.4, 'whoosh', { dur: 0.35 }); ev(13.7, 'creak'); ev(14.1, 'grab'); ev(14.0, 'pop');
  // turn
  [16.2, 16.45, 16.7].forEach(t => ev(t, 'pop', { gain: 0.8 })); ev(17.2, 'stamp_no'); ev(17.0, 'pen_write', { dur: 0.6 }); ev(18.9, 'whoosh', { dur: 0.6 });
  // recipe
  ev(19.6, 'simmer', { dur: 9.3 }); ev(20.4, 'pop'); ev(21.2, 'pop'); ev(20.5, 'pen_write', { dur: 0.4 }); ev(21.3, 'pen_write', { dur: 0.4 });
  ev(23.6, 'pop'); for (let k = 0; k < 8; k++) ev(23.9 + k * 0.28, 'drip', { n: k }); ev(24.3, 'pop');
  ev(26.6, 'box_thump', { pitch: 4 }); ev(27.3, 'whoosh', { dur: 0.3 }); ev(27.8, 'dip'); ev(27.85, 'sparkle');
  // top + end
  ev(29.35, 'sizzle', { dur: 4.0, gain: 0.8 }); ev(29.9, 'pop'); [31.2, 31.6].forEach(t => ev(t, 'grab'));
  ev(33.45, 'pop'); ev(33.5, 'sparkle'); ev(35.6, 'stamp_ok'); ev(37.6, 'iris', { dur: 0.7 });
  EVS.sort((a, b) => a.t - b.t);
}
