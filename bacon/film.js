// "หมูเล่าเรื่องเบคอน" — a pig tells how bacon and eggs became breakfast (Mid-century Cartoon), vertical 1080×1920.
import { PAL, setClock, shape, ink, plane, text, fit, measure, star, sparkle, rays, ellipse, rrect, rect, spline, xform,
  arrow, dashed, clamp, lerp, seg, ss, eo, eio, back, twos, TAU, paperFinish, kidney } from './engine/toon.js';
import { drawBoar, mark, mixc, cup, toast, egg, bacon, plate, cloche, envelope, factory, newspaper, bush } from './cast.js';

const W = 1080, H = 1920;
export const BPM = 120, BEAT = 60 / BPM;
const COL = { ink: PAL.ink, paper: '#FBF3E2', accent: PAL.coral };
const STEPC = [PAL.mustard, PAL.teal, PAL.coral];
const VO_T = { v1: 0.4, v2: 4.0, v3: 8.4, v4: 11.1, v5: 13.4, v6: 15.9, v7: 18.2, v8: 21.6, v9: 24.8, v10: 27.8, v11: 30.6, v12: 32.8, v13: 36.0, v14: 38.8 };
export const DUR = 42.4;
const S = [
  { id: 'hook', t0: 0, t1: 3.8 },
  { id: 'y1920', t0: 3.8, t1: 8.2, tr: 'wipeUp' },
  { id: 'beech', t0: 8.2, t1: 13.2, tr: 'wipeSide' },
  { id: 'bernays', t0: 13.2, t1: 18.0, tr: 'wipeUp' },
  { id: 'letters', t0: 18.0, t1: 21.5, n: 1, small: 'แผนขั้นที่ 1 จาก 3', label: 'ถามหมอ', tr: 'iris' },
  { id: 'yes', t0: 21.5, t1: 24.7, n: 2, small: 'แผนขั้นที่ 2 จาก 3', label: 'หมอตอบว่าใช่', tr: 'iris' },
  { id: 'news', t0: 24.7, t1: 27.6, n: 3, small: 'แผนขั้นที่ 3 จาก 3', label: 'ขึ้นหน้าหนึ่ง', tr: 'iris' },
  { id: 'reveal', t0: 27.6, t1: 32.6, tr: 'cut' },
  { id: 'std', t0: 32.6, t1: 35.8, tr: 'wipeUp' },
  { id: 'belief', t0: 35.8, t1: 38.6, tr: 'cut' },
  { id: 'end', t0: 38.6, t1: DUR, tr: 'wipeSide' },
];
const SILENCE = [[27.45, 27.75], [30.2, 30.6]];
const LID = 30.6;
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
// the narrator: the pig, held body, talking jaw on twos while its line plays
function talking(t) { for (const [id, t0] of Object.entries(VO_T)) { const d = LINES._d?.[id] || 2.2; if (t >= t0 && t < t0 + d) return Math.floor(twos(t) * 6) % 2 ? 0.55 : 0.1; } return 0; }
function pig(ctx, t, x, y, s, o = {}) { drawBoar(ctx, x, y, { k: 1, s, jaw: o.mute ? 0 : talking(t), blink: blinkAt(t, o.blinks || [1.7, 6.2, 12.1, 20.3, 34.4]), ...o }); }

// ------------------------------------------------------------------ scenes
function sceneHook(ctx, t) {
  ctx.fillStyle = PAL.pink; ctx.fillRect(0, 0, W, H);
  rays(ctx, 540, 1150, 30, 1500, PAL.white, { alpha: 0.3, rot: t * 0.05 });
  star(ctx, 540, 1150, 420, { n: 18, inner: 0.78, fill: PAL.mustardL, line: 4, off: [0, 0], seed: 10 });
  pig(ctx, t, 470, 1330, 1.25, { face: 'neutral' });
  const kk = clamp((t - 0.2) / 0.5);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 80 + kk * 1000, H); ctx.clip();
  text(ctx, 'ฉันคือหมู', 540, 260, { font: '70px Sriracha', fill: PAL.coralD, align: 'center' });
  ctx.restore();
  const k = pop(t, 0.35, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 420); ctx.scale(k, k); ctx.translate(-540, -420);
    text(ctx, 'ทำไมคนกินเบคอน', 540, 400, { font: '92px Chonburi', fill: COL.ink, plate: PAL.white, off: [6, 5], align: 'center' });
    text(ctx, 'ทุกเช้า?', 540, 530, { font: '120px Chonburi', fill: COL.ink, plate: PAL.coral, off: [6, 5], align: 'center' });
    ctx.restore();
    if (k > 0.9) note('title', 'ฉันคือหมู ทำไมคนกินเบคอน ทุกเช้า?', 120, 200, 960, 550);
  }
}
function scene1920(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, lerp(1.0, 1.04, ss(seg(t, s.t0, s.t1))));
  ground(ctx, PAL.blueL, PAL.kraft, 1100);
  plate(ctx, 540, 1080, 1.3);
  const k1 = pop(t, 4.6, 0.3), k2 = pop(t, 5.3, 0.3);
  if (k1 > 0) { ctx.save(); ctx.translate(380, 1060); ctx.scale(k1, k1); cup(ctx, 0, 0, 1.1); ctx.restore(); }
  if (k2 > 0) { ctx.save(); ctx.translate(700, 1050); ctx.scale(k2, k2); toast(ctx, 0, 0, 1.0, 0.1); ctx.restore(); }
  pig(ctx, t, 860, 1400, 0.6, { face: 'neutral', dir: -1 });
  ctx.restore();
  tag(ctx, t, 4.2, 'ปี 1920', 60, 240, { px: 56 });
  tag(ctx, t, 6.0, 'มื้อเช้าเบา ๆ', 540, 560, { px: 50, align: 'center', star: PAL.blue });
}
function sceneBeech(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, 1);
  ground(ctx, PAL.mustardL, PAL.avocado, 1000);
  factory(ctx, 540, 1000, 1.25);
  const sg = pop(t, 8.5, 0.3);
  if (sg > 0) { ctx.save(); ctx.translate(540, 620); ctx.scale(sg, sg); shape(ctx, rrect(-220, -60, 440, 110, 12), { fill: COL.paper, line: 4.4, seed: 20, grain: 0.15 }); text(ctx, 'บีชนัท', 0, 24, { font: '72px Chonburi', fill: COL.ink, align: 'center' }); ctx.restore(); if (sg > 0.95) note('sign', 'บีชนัท', 320, 560, 760, 670); }
  // the bacon, and then the realisation that it is me
  const bk = pop(t, 9.6, 0.3);
  if (bk > 0) { ctx.save(); ctx.translate(320, 1180); ctx.scale(bk, bk); bacon(ctx, 0, 0, 1.2, -0.1, 1); ctx.restore(); }
  const me = t > 11.1;
  pig(ctx, t, me ? 700 : 760, 1380, 0.95, { face: me ? (t > 11.6 ? 'worried' : 'wow') : 'neutral', dir: -1 });
  if (t > 11.2) arrow(ctx, [430, 1120], [600, 1180], { u: seg(t, 11.2, 11.5), w: 7, head: 36, bend: -0.4, fill: PAL.coral });
  ctx.restore();
  tag(ctx, t, 9.8, 'อยากขายเบคอนให้มากขึ้น', 540, 300, { px: 44, align: 'center' });
  if (t > 11.3) tag(ctx, t, 11.3, 'เบคอน = ฉัน', 40, 1250, { px: 46, star: PAL.pink });
}
function sceneBernays(ctx, t, s) {
  ctx.fillStyle = PAL.tealL; ctx.fillRect(0, 0, W, H);
  // a name card (no portrait: the man is named, not drawn)
  const k = pop(t, 13.5, 0.3);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 560); ctx.scale(k, k); ctx.rotate(-0.03);
    shape(ctx, rrect(-420, -150, 840, 300, 20), { fill: COL.paper, line: 5, seed: 30, grain: 0.15 });
    text(ctx, 'เอ็ดเวิร์ด', 0, -30, { font: '86px Chonburi', fill: COL.ink, align: 'center' });
    text(ctx, 'เบอร์เนย์ส', 0, 90, { font: '86px Chonburi', fill: PAL.tealD, align: 'center' });
    ctx.restore();
    if (k > 0.95) note('name', 'เอ็ดเวิร์ด เบอร์เนย์ส', 120, 410, 960, 710);
  }
  tag(ctx, t, 14.3, 'บิดาแห่งการประชาสัมพันธ์', 540, 760, { px: 44, align: 'center', star: PAL.teal });
  // a bacon advert that never runs: stamped out
  const ak = pop(t, 15.9, 0.3);
  if (ak > 0) {
    ctx.save(); ctx.translate(400, 1180); ctx.scale(ak, ak); ctx.rotate(0.05);
    shape(ctx, rrect(-200, -200, 400, 360, 14), { fill: PAL.mustardL, line: 4.4, seed: 31, grain: 0.2 });
    bacon(ctx, 0, -60, 1.2, 0, 2);
    text(ctx, 'ซื้อเบคอน!', 0, 90, { font: '60px Chonburi', fill: COL.ink, align: 'center' });
    ctx.restore();
    mark(ctx, 400, 1160, 150, false, pop(t, 16.6, 0.22), 4);
  }
  pig(ctx, t, 820, 1420, 0.65, { face: t > 16.6 ? 'wow' : 'neutral', dir: -1 });
}
function sceneLetters(ctx, t, s) {
  ctx.fillStyle = PAL.mustardL; ctx.fillRect(0, 0, W, H);
  const N = 40, u = seg(t, 18.4, 19.9);
  for (let i = 0; i < N; i++) { if (i / N > u) break; const r = Math.floor(i / 5), c = i % 5; const k = pop(t, 18.4 + i / N * 1.5, 0.2); ctx.save(); ctx.translate(150 + c * 195, 450 + r * 115); ctx.scale(k, k); envelope(ctx, 0, 0, 1.15, null, i); ctx.restore(); }
  const n = Math.round(5000 * ss(u));
  if (n > 0) { shape(ctx, rrect(260, 1340, 560, 140, 20), { fill: COL.ink, line: 0, seed: 40, grain: 0, off: [0, 0] }); text(ctx, n.toLocaleString('en-US'), 540, 1440, { font: '96px Slab', fill: COL.paper, align: 'center' }); note('n', n.toLocaleString('en-US'), 260, 1340, 820, 1480, n !== 5000); }
}
function sceneYes(ctx, t, s) {
  ctx.fillStyle = PAL.mustardL; ctx.fillRect(0, 0, W, H);
  const u = seg(t, 21.7, 22.4);
  for (let i = 0; i < 40; i++) { const r = Math.floor(i / 5), c = i % 5; const yes = i % 10 !== 7 && i / 40 < u * 1.05; envelope(ctx, 150 + c * 195, 450 + r * 115, 1.15, yes ? 'yes' : null, i); }
  const n = Math.round(4500 * ss(u));
  shape(ctx, rrect(260, 1340, 560, 140, 20), { fill: PAL.tealD, line: 0, seed: 41, grain: 0, off: [0, 0] });
  text(ctx, n.toLocaleString('en-US'), 540, 1440, { font: '96px Slab', fill: COL.paper, align: 'center' });
  note('n2', n.toLocaleString('en-US'), 260, 1340, 820, 1480, n !== 4500);
  if (t > 22.0) { const k = pop(t, 22.0, 0.25); ctx.save(); ctx.translate(820, 330); ctx.scale(k, k); star(ctx, 0, 0, 120, { n: 14, inner: 0.7, fill: PAL.teal, line: 4, seed: 42 }); text(ctx, 'ใช่!', 0, 26, { font: '80px Chonburi', fill: COL.paper, align: 'center' }); ctx.restore(); }
}
function sceneNews(ctx, t, s) {
  ctx.fillStyle = PAL.coralL; ctx.fillRect(0, 0, W, H);
  rays(ctx, 540, 900, 30, 1400, PAL.white, { alpha: 0.3, rot: t * 0.1 });
  const u = eo(seg(t, 24.75, 25.2));
  newspaper(ctx, 540, 900, lerp(0.1, 1.2, u), lerp(-6, -0.05, u), 'หมอแนะนำ', 'มื้อเช้าหนัก ๆ!');
  if (u > 0.98) note('head', 'หมอแนะนำ มื้อเช้าหนัก ๆ!', 160, 300, 920, 700);
}
function sceneReveal(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 1000, lerp(1.0, 1.06, ss(seg(t, 27.6, LID))));
  ground(ctx, PAL.blueL, PAL.kraft, 1150);
  plate(ctx, 560, 1150, 1.6);
  const lift = t < LID ? 0 : eo(seg(t, LID, LID + 0.15));
  const wob = t < LID ? 0 : 0.12 * Math.exp(-9 * (t - LID)) * Math.cos(26 * (t - LID));
  if (lift > 0) { bacon(ctx, 470, 1100, 1.0, -0.1, 3); bacon(ctx, 520, 1140, 1.0, 0.1, 5); egg(ctx, 690, 1110, 1.2, 1); }
  if (t > LID) { rays(ctx, 560, 1100, 24, 600 * lift, PAL.white, { alpha: 0.5 }); for (let i = 0; i < 5; i++) sparkle(ctx, 400 + i * 80, 960 - (i % 2) * 40, 30, { fill: PAL.white, rot: i }); }
  ctx.save(); ctx.translate(560 + lift * 380, 1150 - lift * 500); ctx.rotate(lift * 0.6 + wob); cloche(ctx, 0, 0, 1.6); ctx.restore();
  // the pig peeks from the right edge
  pig(ctx, t, 1000, 1600, 0.8, { face: t > LID + 0.1 ? 'wow' : 'neutral', dir: -1 });
  ctx.restore();
  if (t > LID + 0.2) tag(ctx, t, LID + 0.2, 'เบคอนกับไข่', 540, 380, { px: 60, align: 'center', star: PAL.coral });
}
function sceneStd(ctx, t, s) {
  const zu = ss(seg(t, 32.6, 34.4));
  ctx.save(); cam(ctx, 540, 960, lerp(2.2, 1.0, zu), lerp(0.4, 0, zu));
  ctx.fillStyle = PAL.teal; ctx.fillRect(-2000, -2000, 6000, 6000);
  for (let r = -1; r < 8; r++) for (let c = -1; c < 4; c++) {
    const x = 180 + c * 360 + (r % 2) * 180, y = 300 + r * 260;
    shape(ctx, ellipse(x, y, 140, 140, 40), { fill: PAL.white, line: 4, seed: 50 + (r * 4 + c) % 7, grain: 0.1 });
    bacon(ctx, x - 20, y - 30, 0.75, 0.5, r + c); bacon(ctx, x + 10, y + 10, 0.75, 0.5, r + c + 2); egg(ctx, x + 50, y + 60, 0.8, (r + c) % 3);
  }
  ctx.restore();
  tag(ctx, t, 33.2, 'มาตรฐานมื้อเช้า', 540, 280, { px: 52, align: 'center', star: PAL.mustard });
}
function sceneBelief(ctx, t, s) {
  ctx.fillStyle = PAL.mustardL; ctx.fillRect(0, 0, W, H);
  // left half: what he didn't sell; right: what he did
  const k1 = pop(t, 36.0, 0.3), k2 = pop(t, 36.7, 0.3);
  if (k1 > 0) { ctx.save(); ctx.translate(540, 520); ctx.scale(k1, k1); bacon(ctx, 0, 0, 1.6, 0, 7); ctx.restore(); mark(ctx, 760, 520, 100, false, pop(t, 36.3, 0.2), 5); }
  if (k2 > 0) {
    ctx.save(); ctx.translate(540, 980); ctx.scale(k2, k2);
    text(ctx, 'ขาย', 0, -40, { font: '80px Chonburi', fill: COL.ink, align: 'center' });
    text(ctx, 'ความเชื่อ', 0, 120, { font: '150px Chonburi', fill: COL.ink, plate: PAL.coral, off: [7, 6], align: 'center' });
    ctx.restore();
    if (k2 > 0.95) note('belief', 'ขาย ความเชื่อ', 180, 880, 900, 1130);
  }
  pig(ctx, t, 820, 1420, 0.6, { face: 'worried', dir: -1 });
}
function sceneEnd(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, 1);
  ground(ctx, PAL.pink, PAL.avocadoL, 1300);
  const u = seg(t, 39.2, 41.0);
  const hidden = t > 41.0;
  if (!hidden) pig(ctx, t, lerp(300, 760, ss(u)), 1300, 0.9, { face: 'worried', walk: u > 0 && u < 1 ? twos(t) * 12 : null });
  bush(ctx, 820, 1300, 1.15, hidden ? t - 41.0 : 0);
  if (hidden) { // the curly tail still sticks out of the bush
    const pts = []; for (let i = 0; i <= 26; i++) { const a = i / 26 * TAU * 1.4, r = 6 + i * 0.9; pts.push([620 - Math.cos(a) * r * 1.1, 1220 + Math.sin(a) * r * 1.1]); }
    ink(ctx, pts, 7, { seed: 60, color: PAL.ink }); ink(ctx, pts, 4, { seed: 61, color: PAL.pinkD });
  }
  ctx.restore();
  const k = pop(t, 38.8, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 420); ctx.scale(k, k); ctx.translate(-540, -420);
    text(ctx, 'หมูเล่า', 540, 330, { font: '66px Sriracha', fill: PAL.coralD, align: 'center' });
    text(ctx, 'เบคอนกับไข่', 540, 480, { font: '116px Chonburi', fill: COL.ink, plate: PAL.white, off: [6, 5], align: 'center' });
    ctx.restore();
    if (k > 0.95) note('endtitle', 'หมูเล่า เบคอนกับไข่', 160, 260, 920, 500);
  }
}

const SCENE = { hook: sceneHook, y1920: scene1920, beech: sceneBeech, bernays: sceneBernays, letters: sceneLetters, yes: sceneYes, news: sceneNews, reveal: sceneReveal, std: sceneStd, belief: sceneBelief, end: sceneEnd };
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
  if (t > 41.5) {
    const u = eo(seg(t, 41.5, 42.2)), r = lerp(1500, 260, u);
    ctx.save(); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(640, 1220, r, 0, TAU, true); ctx.fill(); ctx.restore();
  }
  if (Q.get('nosubs') !== '1') caption(ctx, t);
  paperFinish(ctx, W, H, 0.9);
}
export function texts(t) { return TXT; }

function buildEvents(durs) {
  LINES._d = durs;
  EVS = [];
  for (const [id, t] of Object.entries(VO_T)) ev(t, 'vo', { id, dur: durs[id] || 2 });
  ev(0.2, 'pen_write', { dur: 0.5 }); ev(0.6, 'pop'); ev(0.3, 'oink');
  for (const s of S) {
    if (s.n && s.tr === 'iris') { ev(s.t0 - 0.36, 'stamp'); ev(s.t0, 'iris', { dur: 0.42 }); }
    if (s.tr === 'wipeUp' || s.tr === 'wipeSide') ev(s.t0, 'paper_swish', { gain: 1.2 });
    if (s.n) ev(s.t0 + 0.3, 'slide');
  }
  ev(4.2, 'pop'); ev(4.6, 'clink'); ev(5.3, 'pop', { gain: 0.7 }); ev(6.0, 'pop');
  ev(8.5, 'box_thump'); ev(9.6, 'sizzle', { dur: 1.2, gain: 0.6 }); ev(9.8, 'pop'); ev(11.1, 'whistle', { up: 1 }); ev(11.3, 'pop'); ev(11.5, 'oink');
  ev(13.5, 'pop'); ev(14.3, 'pop'); ev(15.9, 'pop'); ev(16.6, 'stamp_no');
  for (let i = 0; i < 40; i += 2) ev(18.4 + i / 40 * 1.5, 'paper_flick', { gain: 0.6 });
  for (let k = 0; k < 10; k++) ev(21.7 + k * 0.07, 'tick'); ev(22.0, 'stamp_ok');
  ev(24.9, 'whoosh', { dur: 0.6 }); ev(25.5, 'box_thump', { pitch: 3 });
  ev(LID, 'lid'); ev(LID + 0.05, 'sparkle'); ev(LID + 0.1, 'sizzle', { dur: 1.4 }); ev(LID + 0.25, 'oink'); ev(LID + 0.2, 'pop');
  ev(33.2, 'pop');
  ev(36.0, 'pop'); ev(36.3, 'stamp_no'); ev(36.7, 'stamp');
  for (let k = 0; k < 7; k++) ev(39.2 + k * 0.25, 'hoof', { gain: 0.5 }); ev(41.0, 'rustle'); ev(38.8, 'pop'); ev(41.5, 'iris', { dur: 0.7 });
  EVS.sort((a, b) => a.t - b.t);
}
