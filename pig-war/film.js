// "หมูตัวเดียวเกือบทำสงคราม" — the 1859 Pig War on San Juan Island, told as five escalating rounds (Mid-century Cartoon), 1080×1920.
import { PAL, setClock, shape, ink, plane, text, fit, measure, star, sparkle, rays, ellipse, rrect, rect, spline, xform,
  arrow, dashed, clamp, lerp, seg, ss, eo, eio, back, twos, TAU, paperFinish, kidney } from './engine/toon.js';
import { drawHunter, drawBoar, mark, mixc, ship, soldier, cannon, tent, halo, wing } from './cast.js';

const W = 1080, H = 1920;
export const BPM = 120, BEAT = 60 / BPM;
const COL = { ink: PAL.ink, paper: '#FBF3E2', accent: PAL.coral };
const US = PAL.blue, USD = PAL.blueD, UK = PAL.coral, UKD = PAL.coralD, NAVY = '#3B4766';
const STEPC = [PAL.mustard, PAL.avocado, PAL.coral, PAL.teal, PAL.plum];
const VO_T = { v1: 0.4, v2: 3.4, v3: 8.2, v4: 12.8, v5: 15.7, v6: 18.9, v7: 20.8, v8: 24.4, v9: 27.6, v10: 29.5, v11: 33.2, v12: 36.8, v13: 41.8 };
export const DUR = 46.5;
const S = [
  { id: 'hook', t0: 0, t1: 3.2 },
  { id: 'map', t0: 3.2, t1: 8.0, tr: 'wipeUp' },
  { id: 'pig', t0: 8.0, t1: 12.6, n: 1, small: 'ยกที่ 1 จาก 5', label: 'หมูบุกแปลงผัก', tr: 'iris' },
  { id: 'money', t0: 12.6, t1: 15.5, n: 2, small: 'ยกที่ 2 จาก 5', label: 'ค่าหมู', tr: 'iris' },
  { id: 'army', t0: 15.5, t1: 27.2, n: 3, small: 'ยกที่ 3 จาก 5', label: 'ส่งกำลัง', tr: 'iris' },
  { id: 'admiral', t0: 27.2, t1: 33.0, n: 4, small: 'ยกที่ 4 จาก 5', label: 'ไม่ยิง!', tr: 'cut' },
  { id: 'camps', t0: 33.0, t1: 36.6, tr: 'wipeSide' },
  { id: 'verdict', t0: 36.6, t1: 41.4, n: 5, small: 'ยกที่ 5 จาก 5', label: 'คำตัดสิน', tr: 'iris' },
  { id: 'end', t0: 41.4, t1: DUR, tr: 'wipeUp' },
];
const SILENCE = [[27.15, 27.55]];
const BANG = 11.3;
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
function bigNum(ctx, str, x, y, px, plate, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  text(ctx, str, 0, 0, { font: `${px}px Slab`, fill: COL.ink, plate, off: [5, 4], align: 'center' });
  ctx.restore();
}
// stylised San Juan Islands (not to scale): Vancouver Island at left, mainland at right, the island between two straits
function islandMap(ctx, t, o = {}) {
  ctx.fillStyle = PAL.tealL; ctx.fillRect(-2000, -2000, 6000, 6000);
  for (let i = 0; i < 18; i++) { const x = (i * 211) % 1100, y = 300 + (i * 397) % 1300; ink(ctx, spline([[x, y], [x + 20, y - 8], [x + 40, y]], false, 4), 3, { seed: 600 + i, color: PAL.teal }); }
  const vi = spline([[-200, 200], [180, 260], [260, 520], [200, 820], [250, 1120], [160, 1420], [-200, 1500]], true, 8);
  shape(ctx, vi, { fill: o.vi || PAL.avocadoL, line: 4.4, seed: 610, grain: 0.3 });
  const ml = spline([[1280, 160], [880, 220], [820, 520], [900, 760], [840, 1100], [940, 1440], [1280, 1500]], true, 8);
  shape(ctx, ml, { fill: o.ml || PAL.avocadoL, line: 4.4, seed: 611, grain: 0.3 });
  const isl = spline([[470, 620], [600, 560], [690, 640], [670, 800], [700, 940], [600, 1020], [500, 960], [440, 820]], true, 8);
  shape(ctx, isl, { fill: o.isl || PAL.mustardL, line: 4.4, seed: 612, grain: 0.3 });
  [[400, 1120, 40], [720, 470, 34], [760, 1110, 30]].forEach(([x, y, r], i) => shape(ctx, kidney(x, y, r, i), { fill: PAL.mustardL, line: 3.4, seed: 613 + i, grain: 0.3 }));
  if (o.lines) {
    const u1 = o.lines[0], u2 = o.lines[1];
    if (u1 > 0) dashed(ctx, spline([[330, 300], [360, 640], [380, 900], [330, 1300]], false, 10), 7, 22, 14, 0, US, u1);
    if (u2 > 0) dashed(ctx, spline([[760, 300], [770, 640], [780, 900], [810, 1300]], false, 10), 7, 22, 14, 0, UK, u2);
  }
}

// ------------------------------------------------------------------ scenes
function sceneHook(ctx, t) {
  const c = eio(seg(t, 0.3, 1.6));
  ctx.fillStyle = PAL.mustardL; ctx.fillRect(0, 0, W, H);
  plane(ctx, rect(0, 0, W, lerp(0, 640, c)), UK); plane(ctx, rect(0, lerp(1920, 1280, c), W, 700), US);
  ink(ctx, [[0, lerp(0, 640, c)], [W, lerp(0, 640, c)]], 6, { seed: 20, taper: false }); ink(ctx, [[0, lerp(1920, 1280, c)], [W, lerp(1920, 1280, c)]], 6, { seed: 21, taper: false });
  // ships above, cannons below, pointing at the little pig in the middle
  if (c > 0.5) { ship(ctx, 270, 610, 0.42, 1, t); ship(ctx, 800, 610, 0.42, 2, t); cannon(ctx, 260, 1400, 1.2, 1); ctx.save(); ctx.translate(820, 1400); ctx.scale(-1, 1); cannon(ctx, 0, 0, 1.2, 2); ctx.restore(); }
  rays(ctx, 540, 1000, 28, 500, PAL.white, { alpha: 0.4, rot: t * 0.1 });
  const tw = twos(t);
  drawBoar(ctx, 500, 1130, { k: 1, s: 0.9, face: tw % 1 < 0.5 ? 'neutral' : 'sniff', blink: blinkAt(t, [1.8]) });
  const k = pop(t, 0.25, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 300); ctx.scale(k, k); ctx.translate(-540, -300);
    text(ctx, 'หมูตัวเดียว', 540, 250, { font: '100px Chonburi', fill: COL.paper, plate: COL.ink, off: [6, 5], align: 'center' });
    text(ctx, 'เกือบทำสงคราม!', 540, 380, { font: '88px Chonburi', fill: COL.ink, plate: PAL.white, off: [6, 5], align: 'center' });
    ctx.restore();
    if (k > 0.9) note('title', 'หมูตัวเดียว เกือบทำสงคราม!', 150, 160, 930, 400);
  }
}
function sceneMap(ctx, t, s) {
  ctx.save(); cam(ctx, 560, 850, lerp(1.0, 1.12, ss(seg(t, s.t0, s.t1))));
  islandMap(ctx, t, { lines: [seg(t, 5.6, 6.4), seg(t, 6.4, 7.2)] });
  drawBoar(ctx, 560, 820, { k: 1, s: 0.32, face: 'neutral' });
  text(ctx, 'เกาะซานฮวน', 580, 1000, { font: '600 40px Prompt', fill: COL.ink, plate: PAL.white, off: [3, 3], align: 'center', alpha: clamp((t - 4.0) / 0.3) });
  ctx.restore();
  tag(ctx, t, 3.6, 'ปี 1859', 60, 220, { px: 56 });
  tag(ctx, t, 5.8, 'อเมริกาว่า', 60, 1260, { px: 42, star: US });
  tag(ctx, t, 6.3, 'อังกฤษว่า', 1020, 1260, { px: 42, star: UK, align: 'right' });
  if (t > 4.0) note('isl', 'เกาะซานฮวน', 400, 940, 760, 1020);
}
function scenePig(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, lerp(1.0, 1.04, ss(seg(t, s.t0, s.t1))));
  ground(ctx, PAL.blueL, PAL.kraft, 1250);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { const x = 520 + i * 150 + r * 30, y = 1300 + r * 70; shape(ctx, kidney(x, y - 20, 34, 0.4 + i), { fill: PAL.avocado, line: 3, seed: 700 + r * 4 + i, grain: 0.3 }); }
  const tw = twos(t);
  const dead = t >= BANG + 0.25;
  if (!dead) drawBoar(ctx, 720, 1290, { k: 1, s: 0.8, dir: -1, dip: 0.4 + 0.15 * Math.sin(tw * 9), face: 'neutral', jaw: Math.floor(tw * 6) % 2 ? 0.5 : 0 });
  else { ctx.save(); ctx.translate(720, 1180); ctx.rotate(Math.PI); drawBoar(ctx, 0, 0, { k: 1, s: 0.8, dir: -1, face: 'ko', shadow: false }); ctx.restore(); }
  const aim = t > 10.3;
  const P = { x: 230, y: 1320, s: 1.05, cloth: US, clothD: USD, belt: PAL.brown, neat: true, hat: 'straw' };
  drawHunter(ctx, { ...P, face: t > 9.2 && t < BANG ? 'puzzled' : t > BANG ? 'wow' : 'neutral', armF: aim ? { a1: -0.05, a2: -0.02 } : { a1: 1.0, a2: 0.2 }, handF: 'grip',
    armB: aim ? { a1: 0.5, a2: -0.2 } : undefined, rifle: { a: aim ? -0.02 + (t > BANG && t < BANG + 0.3 ? -0.25 : 0) : -1.2 }, look: [10, 0], blink: blinkAt(t, [8.8]) });
  // the shot: a starburst, the scene jolts
  if (t > BANG && t < BANG + 0.9) { const k = pop(t, BANG, 0.15); star(ctx, 600, 1120, 230 * k, { n: 14, inner: 0.55, fill: PAL.mustard, line: 4.5, seed: 720 }); text(ctx, 'ปัง!', 600, 1150, { font: '90px Chonburi', fill: COL.ink, plate: PAL.white, off: [4, 4], align: 'center', alpha: k }); }
  ctx.restore();
  tag(ctx, t, 9.4, 'แปลงมันฝรั่ง', 540, 520, { px: 46, star: PAL.avocado });
}
function sceneMoney(ctx, t, s) {
  plane(ctx, rect(0, 0, W, 960), PAL.blueL); plane(ctx, rect(0, 960, W, 960), PAL.coralL);
  ink(ctx, [[0, 960], [W, 960]], 6, { seed: 800, taper: false });
  drawHunter(ctx, { x: 270, y: 900, s: 0.72, cloth: US, clothD: USD, belt: PAL.brown, neat: true, hat: 'straw', face: 'smile', armF: { a1: -0.5, a2: -0.6 }, handF: 'open', blink: blinkAt(t, [14.0]) });
  drawHunter(ctx, { x: 810, y: 1460, s: 0.72, cloth: UK, clothD: UKD, belt: PAL.brown, neat: true, face: t > 14.6 ? 'wow' : 'puzzled', armF: { a1: -2.2, a2: -2.6 }, handF: 'point', blink: blinkAt(t, [13.4]) });
  const k1 = pop(t, 13.5, 0.3), k2 = pop(t, 14.15, 0.3);
  if (k1 > 0) { shape(ctx, ellipse(700, 560, 150 * k1, 150 * k1, 48), { fill: PAL.mustard, line: 5, seed: 810, grain: 0.3 }); bigNum(ctx, '$10', 700, 600, 100, PAL.white, k1); }
  if (k2 > 0) { shape(ctx, ellipse(380, 1240, 190 * k2, 190 * k2, 48), { fill: PAL.mustard, line: 5, seed: 811, grain: 0.3 }); bigNum(ctx, '$100', 380, 1280, 110, PAL.white, k2); }
  if (k1 > 0.9) note('m10', '$10', 600, 520, 800, 620); if (k2 > 0.9) note('m100', '$100', 260, 1190, 500, 1300);
}
function sceneArmy(ctx, t, s) {
  // top: the British at sea; bottom: the Americans on shore
  plane(ctx, rect(0, 0, W, 900), PAL.blueL); plane(ctx, rect(0, 640, W, 260), PAL.blue);
  plane(ctx, rect(0, 900, W, 1020), PAL.mustardL);
  ink(ctx, [[0, 900], [W, 900]], 6, { seed: 900, taper: false });
  const ships = t < 24.9 ? (t >= 19.6 ? 3 : 0) : 5;
  const SX = [[200, 760], [540, 790], [880, 760], [360, 640], [720, 640]];
  for (let i = 0; i < ships; i++) { const t0 = i < 3 ? 19.6 + i * 0.2 : 24.9 + (i - 3) * 0.25; const k = eo(seg(t, t0, t0 + 0.4)); if (k > 0) ship(ctx, SX[i][0] + (1 - k) * 600, SX[i][1], 0.5, i, t); }
  // American soldiers: a grid that fills (each figure ≈ 16 men)
  const n = t < 21.6 ? (t >= 17.6 ? Math.round(4 * eo(seg(t, 17.6, 18.2))) : 0) : 4 + Math.round(25 * eo(seg(t, 21.6, 23.0)));
  for (let i = 0; i < n; i++) { const r = Math.floor(i / 8), c = i % 8; soldier(ctx, 110 + c * 122 + (r % 2) * 40, 1190 + r * 85, 1.2, US, i); }
  const nc = t >= 23.2 ? Math.min(5, Math.floor((t - 23.2) / 0.12) + 1) : 0;
  for (let i = 0; i < nc; i++) cannon(ctx, 330 + i * 105, 1060, 0.62, i);
  // counters
  const usN = t < 17.6 ? 0 : t < 21.6 ? 64 : Math.round(lerp(64, 461, eo(seg(t, 21.6, 23.0))));
  if (usN) { bigNum(ctx, String(usN), 900, 1060, 96, US, pop(t, 17.6, 0.25)); note('usn', `${usN}`, 780, 980, 1020, 1080, usN !== 64 && usN !== 461); }
  if (t > 23.2) { tag(ctx, t, 23.3, 'ปืนใหญ่ 14', 40, 930, { px: 42, star: US }); }
  if (t >= 19.6) { const ukS = t < 24.9 ? 'เรือรบ 3' : 'เรือรบ 5'; tag(ctx, t, t < 24.9 ? 19.6 : 24.9, ukS, 60, 380, { px: 44, star: UK }); }
  if (t >= 25.4) { bigNum(ctx, '2,140', 790, 470, 92, UK, pop(t, 25.4, 0.25)); note('ukn', '2,140', 640, 390, 950, 490); }
}
function sceneAdmiral(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, lerp(1.0, 1.05, ss(seg(t, 27.6, 33.0))));
  ground(ctx, PAL.blueL, PAL.blue, 1200);
  ship(ctx, 800, 1150, 0.75, 3, t);
  const P = { x: 330, y: 1330, s: 1.1, cloth: NAVY, clothD: '#2A3350', belt: PAL.mustard, neat: true, hat: 'bicorne' };
  const a = keys(t, [{ t: 27.6, v: { a1: 1.28, a2: 1.45 } }, { t: 28.4, v: { a1: 1.28, a2: 1.45 } }, { t: 28.8, v: { a1: -0.2, a2: -1.5 } }, { t: 33, v: { a1: -0.2, a2: -1.5 } }]);
  drawHunter(ctx, { ...P, face: t > 28.8 ? 'puzzled' : 'neutral', armF: a, handF: 'open', look: [-4, 0], blink: blinkAt(t, [30.5, 32.2]) });
  ctx.restore();
  mark(ctx, 800, 820, 120, false, pop(t, 28.9, 0.22), 3);
  const k = pop(t, 29.9, 0.3);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 520); ctx.scale(k, k); ctx.translate(-540, -520);
    shape(ctx, rrect(110, 430, 860, 190, 30), { fill: COL.paper, line: 4.5, seed: 950, grain: 0.15 });
    shape(ctx, [[300, 610], [340, 700], [380, 612]], { fill: COL.paper, line: 0, seed: 951, grain: 0, off: [0, 0] });
    ink(ctx, [[300, 618], [340, 700], [380, 618]], 4.5, { seed: 952 });
    text(ctx, 'สงครามเพราะหมู?', 540, 510, { font: '600 54px Prompt', fill: COL.ink, align: 'center' });
    text(ctx, 'ไม่เอาด้วย!', 540, 590, { font: '64px Chonburi', fill: UKD, align: 'center' });
    ctx.restore();
    if (k > 0.95) note('bubble', 'สงครามเพราะหมู? ไม่เอาด้วย!', 110, 430, 970, 620);
  }
}
function sceneCamps(ctx, t, s) {
  ctx.save(); cam(ctx, 570, 790, 1.9);
  islandMap(ctx, t, {});
  [[540, 640, UK], [600, 650, UK], [570, 680, UK]].forEach(([x, y, c], i) => { const k = pop(t, 33.6 + i * 0.15, 0.25); if (k > 0) tent(ctx, x, y, 0.5 * k, c, i); });
  [[560, 930, US], [620, 920, US], [590, 960, US]].forEach(([x, y, c], i) => { const k = pop(t, 34.1 + i * 0.15, 0.25); if (k > 0) tent(ctx, x, y, 0.5 * k, c, i + 3); });
  ctx.restore();
  const yr = t < 34.6 ? 1860 : Math.min(1872, 1860 + Math.floor((t - 34.6) / 0.12));
  shape(ctx, rrect(290, 1250, 500, 170, 24), { fill: COL.paper, line: 4.5, seed: 960, grain: 0.15 });
  bigNum(ctx, String(yr), 540, 1375, 120, PAL.mustard, 1);
  note('yr', String(yr), 290, 1250, 790, 1420, true);
  tag(ctx, t, 33.4, 'อยู่ด้วยกัน 12 ปี', 540, 220, { px: 50, align: 'center' });
}
function sceneVerdict(ctx, t, s) {
  ctx.save(); cam(ctx, 560, 850, 1.0);
  const turn = seg(t, 39.6, 40.0);
  islandMap(ctx, t, { isl: mixc(PAL.mustardL, US, turn) });
  ctx.restore();
  const k = pop(t, 37.4, 0.3);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 520); ctx.scale(k, k); ctx.rotate(-0.04); ctx.translate(-540, -520);
    shape(ctx, rrect(200, 330, 680, 400, 16), { fill: PAL.white, line: 4.5, seed: 970, grain: 0.2 });
    text(ctx, 'คำตัดสิน', 540, 430, { font: '64px Chonburi', fill: COL.ink, align: 'center' });
    text(ctx, '1872', 540, 520, { font: '60px Slab', fill: COL.ink, plate: PAL.mustardL, off: [3, 3], align: 'center' });
    for (let i = 0; i < 3; i++) ink(ctx, [[280, 570 + i * 40], [800, 570 + i * 40]], 4, { seed: 971 + i, color: PAL.paperDD, taper: false });
    ctx.restore();
    if (k > 0.95) note('doc', 'คำตัดสิน 1872', 200, 330, 880, 560);
  }
  const ks = pop(t, 39.6, 0.2);
  if (ks > 0) {
    ctx.save(); ctx.translate(560, 680); ctx.scale(ks, ks); ctx.rotate(-0.12);
    ink(ctx, rrect(-230, -60, 460, 120, 16), 9, { closed: true, color: USD, seed: 980 });
    text(ctx, 'อเมริกา', 0, 28, { font: '78px Chonburi', fill: USD, align: 'center' });
    ctx.restore();
    if (ks > 0.95) note('stamp', 'อเมริกา', 330, 620, 790, 740);
  }
}
function sceneEnd(ctx, t, s) {
  ctx.fillStyle = PAL.blueL; ctx.fillRect(0, 0, W, H);
  rays(ctx, 540, 1000, 30, 1600, PAL.white, { alpha: 0.35, rot: 0.05 });
  const fy = Math.sin(twos(t) * 3) * 16;
  wing(ctx, 470, 920 + fy, 1.1, Math.sin(twos(t) * 8) * 0.5);
  drawBoar(ctx, 470, 1100 + fy, { k: 1, s: 1.1, face: 'smug', shadow: false });
  ctx.save(); ctx.translate(570, 860 + fy); ctx.scale(-1, 1); wing(ctx, 0, 0, 1.0, Math.sin(twos(t) * 8 + 1) * 0.5); ctx.restore();
  halo(ctx, 700, 830 + fy, 1.1);
  const k = pop(t, 41.6, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 320); ctx.scale(k, k); ctx.translate(-540, -320);
    text(ctx, 'สงครามหมู 1859', 540, 300, { font: '64px Sriracha', fill: PAL.coralD, align: 'center' });
    ctx.restore();
    if (k > 0.95) note('endk', 'สงครามหมู 1859', 300, 240, 780, 320);
  }
  tag(ctx, t, 43.6, 'ผู้เสียชีวิต: 1 (หมู)', 540, 1250, { px: 52, align: 'center', star: PAL.coral });
}

const SCENE = { hook: sceneHook, map: sceneMap, pig: scenePig, money: sceneMoney, army: sceneArmy, admiral: sceneAdmiral, camps: sceneCamps, verdict: sceneVerdict, end: sceneEnd };
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
  // shake on the shot
  if (t > BANG && t < BANG + 0.3) { const a = (1 - seg(t, BANG, BANG + 0.3)) * 14; ctx.translate(Math.sin(t * 90) * a, Math.cos(t * 77) * a); }
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
  if (t > 45.6) {
    const u = eo(seg(t, 45.6, 46.3)), r = lerp(1500, 400, u);
    ctx.save(); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(560, 1000, r, 0, TAU, true); ctx.fill(); ctx.restore();
  }
  if (Q.get('nosubs') !== '1') caption(ctx, t);
  paperFinish(ctx, W, H, 0.9);
}
export function texts(t) { return TXT; }

function buildEvents(durs) {
  EVS = [];
  for (const [id, t] of Object.entries(VO_T)) ev(t, 'vo', { id, dur: durs[id] || 2 });
  ev(0.3, 'paper_swish'); ev(1.5, 'box_thump', { pitch: -4 }); ev(0.6, 'pop');
  for (const s of S) {
    if (s.n && s.tr === 'iris') { ev(s.t0 - 0.36, 'stamp'); ev(s.t0, 'iris', { dur: 0.42 }); }
    if (s.tr === 'wipeUp' || s.tr === 'wipeSide') ev(s.t0, 'paper_swish', { gain: 1.2 });
    if (s.n) ev(s.t0 + 0.3, 'slide');
  }
  ev(3.6, 'pop'); ev(5.6, 'pen_write', { dur: 0.8 }); ev(6.4, 'pen_write', { dur: 0.8 }); ev(5.8, 'pop', { gain: 0.7 }); ev(6.3, 'pop', { gain: 0.7 });
  for (let k = 0; k < 9; k++) ev(8.3 + k * 0.3, 'chew', { gain: 0.6 }); ev(9.4, 'pop');
  ev(10.3, 'cock'); ev(BANG, 'bang'); ev(BANG + 0.3, 'whistle', { up: 0 });
  ev(13.5, 'coin'); ev(14.15, 'coin', { gain: 1.3 });
  ev(17.6, 'march', { dur: 0.8 }); ev(17.6, 'pop'); [19.6, 19.8, 20.0].forEach(t => ev(t, 'horn', { gain: 0.6 })); ev(19.6, 'pop');
  ev(21.6, 'march', { dur: 1.6 }); for (let i = 0; i < 5; i++) ev(23.2 + i * 0.12, 'clunk'); ev(23.3, 'pop');
  [24.9, 25.15].forEach(t => ev(t, 'horn')); ev(24.9, 'pop'); ev(25.4, 'pop');
  ev(28.9, 'stamp_no'); ev(29.9, 'pop');
  [33.6, 33.75, 33.9, 34.1, 34.25, 34.4].forEach(t => ev(t, 'pop', { gain: 0.5 })); ev(33.4, 'pop');
  for (let k = 0; k < 12; k++) ev(34.6 + k * 0.12, 'tick');
  ev(37.4, 'paper_swish'); ev(39.6, 'stamp');
  ev(41.6, 'pop'); ev(41.8, 'harp'); ev(43.6, 'pop'); ev(45.6, 'iris', { dur: 0.7 });
  EVS.sort((a, b) => a.t - b.t);
}
