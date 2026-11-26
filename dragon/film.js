// "ทำไมทั่วโลกมีมังกร" — three theories in a classroom lesson (Mid-century Cartoon), vertical 1080×1920.
import { PAL, setClock, shape, ink, plane, text, fit, measure, star, sparkle, rays, ellipse, rrect, rect, spline, xform,
  arrow, dashed, clamp, lerp, seg, ss, eo, eio, back, twos, TAU, paperFinish, kidney } from './engine/toon.js';
import { drawHunter, hunterJoints, hunterToScreen, mixc, bone } from './cast.js';
import { dragonWest, dragonEast, featheredSerpent, cloud, rain, snake, tigerHead, eagle, chimera, skeleton, jar, bolt, waves, flame } from './dcast.js';

const W = 1080, H = 1920;
export const BPM = 120, BEAT = 60 / BPM;
const COL = { ink: PAL.ink, paper: '#FBF3E2', accent: PAL.coral };
const STEPC = [PAL.mustard, PAL.coral, PAL.blue];
const VO_T = { v1: 0.4, v2: 3.8, v3: 6.7, v4: 9.5, v5: 13.3, v6: 15.6, v7: 19.2, v8: 21.4, v9: 23.8, v10: 28.3, v11: 32.1 };
export const DUR = 37.8;
const S = [
  { id: 'hook', t0: 0, t1: 3.6 },
  { id: 'world', t0: 3.6, t1: 9.2, tr: 'wipeUp' },
  { id: 'bones', t0: 9.2, t1: 18.9, n: 1, small: 'ทฤษฎีที่ 1 จาก 3', label: 'กระดูกยักษ์', tr: 'iris' },
  { id: 'fear', t0: 18.9, t1: 28.0, n: 2, small: 'ทฤษฎีที่ 2 จาก 3', label: 'กลัวนักล่า', tr: 'iris' },
  { id: 'nature', t0: 28.0, t1: 31.8, n: 3, small: 'ทฤษฎีที่ 3 จาก 3', label: 'ธรรมชาติ', tr: 'iris' },
  { id: 'end', t0: 31.8, t1: DUR, tr: 'wipeUp' },
];
const SILENCE = [[31.55, 31.95]];
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
// ------------------------------------------------------------------ scenes
function sceneHook(ctx, t) {
  ctx.fillStyle = PAL.plum; ctx.fillRect(0, 0, W, H);
  rays(ctx, 540, 1050, 30, 1500, PAL.white, { alpha: 0.1, rot: t * 0.05 });
  // a dragon's silhouette behind a cloud, eye opening
  ctx.save(); ctx.globalAlpha = 0.9;
  dragonEast(ctx, 420, 1060, 1.35, t, { col: '#523650' });
  ctx.restore();
  cloud(ctx, 300, 1260, 1.6, PAL.white, 1); cloud(ctx, 820, 1200, 1.3, PAL.white, 2);
  const eye = seg(t, 1.6, 1.9);
  if (eye > 0) shape(ctx, ellipse(760, 880, 26, 26 * eye, 20), { fill: PAL.mustard, line: 4, seed: 30, grain: 0 });
  const k = pop(t, 0.3, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 380); ctx.scale(k, k); ctx.translate(-540, -380);
    text(ctx, 'ทำไมทั่วโลก', 540, 360, { font: '96px Chonburi', fill: COL.paper, plate: COL.ink, off: [6, 5], align: 'center' });
    text(ctx, 'มีมังกร?', 540, 500, { font: '128px Chonburi', fill: PAL.mustard, plate: COL.ink, off: [6, 5], align: 'center' });
    ctx.restore();
    if (k > 0.9) note('title', 'ทำไมทั่วโลก มีมังกร?', 150, 260, 930, 520);
  }
}
function band(ctx, y0, y1, col) { plane(ctx, rect(0, y0, W, y1 - y0), col); ink(ctx, [[0, y1], [W, y1]], 5, { seed: y0, taper: false }); }
function sceneWorld(ctx, t, s) {
  ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, W, H);
  band(ctx, 0, 700, PAL.coralL); band(ctx, 700, 1100, PAL.blueL); band(ctx, 1100, 1920, PAL.avocadoL);
  const k1 = pop(t, 3.9, 0.3), k2 = pop(t, 5.1, 0.3), k3 = pop(t, 6.8, 0.3);
  if (k1 > 0) { ctx.save(); ctx.translate(430, 650); ctx.scale(k1, k1); dragonWest(ctx, -40, 30, 0.95, t, { fire: seg(t, 4.5, 4.9) }); ctx.restore(); }
  if (k2 > 0) { ctx.save(); ctx.translate(540, 950); ctx.scale(k2, k2); cloud(ctx, 270, -150, 0.6, PAL.white, 3); rain(ctx, 170, -120, 200, 200, t); dragonEast(ctx, -120, 60, 1.0, t); ctx.restore(); }
  if (k3 > 0) { ctx.save(); ctx.translate(500, 1330); ctx.scale(k3, k3); featheredSerpent(ctx, -20, 60, 1.25, t); ctx.restore(); }
  tag(ctx, t, 4.1, 'ยุโรป', 40, 240, { px: 46, star: PAL.coral });
  tag(ctx, t, 5.3, 'จีน', 40, 730, { px: 46, star: PAL.blue });
  tag(ctx, t, 7.0, 'อเมริกากลาง', 40, 1130, { px: 46, star: PAL.teal });
}
function sceneBones(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, lerp(1.0, 1.04, ss(seg(t, s.t0, s.t1))));
  ctx.fillStyle = PAL.blueL; ctx.fillRect(-2000, -2000, 6000, 6000);
  plane(ctx, rect(-2000, 900, 6000, 300), PAL.kraft); plane(ctx, rect(-2000, 1200, 6000, 2000), PAL.kraftD);
  ink(ctx, [[-2000, 900], [4000, 900]], 5, { seed: 40, taper: false });
  for (let i = 0; i < 12; i++) shape(ctx, ellipse((i * 173) % 1080, 980 + (i * 97) % 400, 10 + i % 3 * 4, 6, 10), { fill: PAL.kraftL, line: 0, grain: 0, off: [0, 0], seed: 41 + i });
  // the skeleton is revealed as the digger works
  const u = ss(seg(t, 10.4, 12.8));
  skeleton(ctx, 560, 1170, 0.95, u);
  // the dragon it suggests: a dashed outline drawn on top
  const d = seg(t, 13.5, 14.6);
  if (d > 0) { ctx.save(); ctx.globalAlpha = 0.85; dragonWest(ctx, 520, 1290, 1.2, t, { col: PAL.avocadoL }); ctx.restore(); ctx.save(); ctx.globalAlpha = 1 - d * 0.75; skeleton(ctx, 560, 1170, 0.95, 1); ctx.restore(); }
  // digger at left with a shovel
  const dig = t > 10.0 && t < 12.8 ? Math.sin(twos(t) * 7) : 0;
  const P = { x: 170, y: 920, s: 0.85, cloth: PAL.kraftL, clothD: PAL.kraftD, belt: PAL.brown, neat: true, hat: 'straw' };
  const pose = { ...P, face: t > 12.8 ? 'wow' : 'neutral', armF: { a1: 0.6 + dig * 0.3, a2: 0.9 + dig * 0.4 }, armB: { a1: 0.9 + dig * 0.3, a2: 0.6 }, handF: 'grip', handB: 'grip', look: [10, 8], blink: blinkAt(t, [11.2, 16.5]) };
  drawHunter(ctx, pose);
  const hd = hunterToScreen(P, hunterJoints(pose, 'F').ha), a = 0.6 + dig * 0.3;
  ink(ctx, [[hd[0] - Math.cos(a) * 80, hd[1] - Math.sin(a) * 80], [hd[0] + Math.cos(a) * 140, hd[1] + Math.sin(a) * 140]], 12, { seed: 45, taper: false });
  shape(ctx, xform(rrect(-10, -26, 70, 52, 10), hd[0] + Math.cos(a) * 140, hd[1] + Math.sin(a) * 140, a), { fill: PAL.chromeD, line: 3.6, seed: 46, grain: 0.3 });
  ctx.restore();
  tag(ctx, t, 13.5, 'ซากไดโนเสาร์ = ซากมังกร?', 540, 345, { px: 44, align: 'center' });
  callout(ctx, t, 15.8, 800, 690, 180, c => { jar(c, 0, 120, 0.95); text(c, 'กระดูก', 0, 42, { font: '600 34px Prompt', fill: COL.ink, align: 'center' }); text(c, 'มังกร', 0, 84, { font: '600 34px Prompt', fill: COL.coralD || PAL.coralD, align: 'center' }); }, PAL.mustardL, [700, 1100]);
  if (t > 16.2) note('jar', 'กระดูกมังกร', 700, 580, 860, 700);
}
function sceneFear(ctx, t, s) {
  ctx.fillStyle = PAL.mustardL; ctx.fillRect(0, 0, W, H);
  const asm = t >= 24.0;
  if (!asm) {
    callout(ctx, t, 19.7, 260, 640, 190, c => snake(c, 0, 0, 1.0, t), PAL.avocadoL);
    callout(ctx, t, 20.4, 820, 640, 190, c => tigerHead(c, 0, 0, 1.1, 0.4), PAL.coralL);
    callout(ctx, t, 21.1, 540, 1080, 200, c => eagle(c, 0, 20, 1.2, t), PAL.blueL);
    if (t > 21.6) note('c1', 'งู', 0, 0, 0, 0, true);
  } else {
    const K = [eo(seg(t, 24.2, 24.8)), eo(seg(t, 25.0, 25.5)), eo(seg(t, 25.8, 26.3))];
    if (t > 26.4) { rays(ctx, 540, 950, 30, 900 * pop(t, 26.4, 0.4), PAL.white, { alpha: 0.5, rot: t * 0.1 }); star(ctx, 540, 950, 430 * pop(t, 26.4, 0.4), { n: 16, inner: 0.78, fill: PAL.mustard, line: 4, off: [0, 0], seed: 50 }); }
    chimera(ctx, 480, 1000, 0.95, t, K, [[-220, -380], [340, -400], [0, 140]]);
    tag(ctx, t, 26.3, '= มังกร!', 540, 1300, { px: 56, align: 'center', star: PAL.coral });
  }
  ['งู', 'เสือ', 'นกล่าเหยื่อ'].forEach((w, i) => { const xy = [[260, 880], [820, 880], [540, 1330]][i]; const k = pop(t, 19.9 + i * 0.7, 0.25); if (k > 0 && !asm) { text(ctx, w, xy[0], xy[1], { font: '600 44px Prompt', fill: COL.ink, plate: PAL.white, off: [3, 3], align: 'center' }); note('w' + i, w, xy[0] - 80, xy[1] - 44, xy[0] + 80, xy[1] + 6, true); } });
}
function sceneNature(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, lerp(1.0, 1.05, ss(seg(t, s.t0, s.t1))));
  ctx.fillStyle = '#4A3D5E'; ctx.fillRect(-2000, -2000, 6000, 6000);
  const f = Math.floor(t * 12);
  if ((t > 28.8 && t < 29.0) || (t > 29.6 && t < 29.75)) { ctx.fillStyle = 'rgba(255,250,230,0.35)'; ctx.fillRect(-2000, -2000, 6000, 6000); }
  const em = seg(t, 30.4, 31.2);
  cloud(ctx, 300, 640, 1.5, PAL.chrome, 4); cloud(ctx, 780, 580, 1.3, PAL.chrome, 5);
  if (em > 0) { ctx.save(); ctx.globalAlpha = em; dragonEast(ctx, 330, 860, 1.1, t, { col: PAL.blueL }); ctx.restore(); }
  if (t > 28.8) bolt(ctx, 640, 640, 1.5, 0); if (t > 29.6) bolt(ctx, 260, 680, 1.2, 1);
  rain(ctx, 60, 700, 960, 500, t, PAL.blueL);
  if (t > 30.2) { const k = pop(t, 30.2, 0.3); for (let i = 0; i < 4; i++) flame(ctx, 760 + i * 70, 1230, -Math.PI / 2 + (i - 1.5) * 0.15, 170 * k, t, i); }
  waves(ctx, -200, 1240 - seg(t, 28.4, 29.4) * 60, 1300, t);
  ctx.restore();
  tag(ctx, t, 28.6, 'น้ำท่วม', 40, 1080, { px: 44, star: PAL.blue });
  tag(ctx, t, 29.3, 'พายุ', 740, 380, { px: 44, star: PAL.mustard });
  tag(ctx, t, 30.2, 'ไฟ', 820, 1060, { px: 44, star: PAL.coral });
}
function sceneEnd(ctx, t, s) {
  ctx.fillStyle = PAL.tealL; ctx.fillRect(0, 0, W, H);
  rays(ctx, 540, 1050, 30, 1600, PAL.white, { alpha: 0.3, rot: 0.05 });
  star(ctx, 540, 1000, 470, { n: 18, inner: 0.8, fill: PAL.mustardL, off: [0, 0], line: 4, seed: 60 });
  const k1 = pop(t, 32.2, 0.3), k2 = pop(t, 32.5, 0.3), k3 = pop(t, 32.8, 0.3);
  if (k2 > 0) { ctx.save(); ctx.translate(560, 760); ctx.scale(k2 * 0.6, k2 * 0.6); dragonEast(ctx, 0, 0, 1, t); ctx.restore(); }
  if (k1 > 0) { ctx.save(); ctx.translate(330, 1180); ctx.scale(k1 * 0.6, k1 * 0.6); dragonWest(ctx, 0, 0, 1, t, { fire: 0 }); ctx.restore(); }
  if (k3 > 0) { ctx.save(); ctx.translate(760, 1220); ctx.scale(k3 * 0.62, k3 * 0.62); featheredSerpent(ctx, 0, 0, 1, t); ctx.restore(); }
  const k = pop(t, 33.6, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 400); ctx.scale(k, k); ctx.translate(-540, -400);
    text(ctx, 'มังกร', 540, 380, { font: '150px Chonburi', fill: COL.ink, plate: PAL.coral, off: [7, 6], align: 'center' });
    text(ctx, 'ความกลัวที่คนทั้งโลกมีร่วมกัน', 540, 470, { font: '600 46px Prompt', fill: COL.ink, plate: PAL.white, off: [3, 3], align: 'center' });
    ctx.restore();
    if (k > 0.95) note('endtitle', 'มังกร ความกลัวที่คนทั้งโลกมีร่วมกัน', 180, 240, 900, 490);
  }
}

const SCENE = { hook: sceneHook, world: sceneWorld, bones: sceneBones, fear: sceneFear, nature: sceneNature, end: sceneEnd };
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
      const top = p < 1 ? H * (1 - p) : 0, bot = p < 1 ? H : H * (2 - p); ctx.fillRect(0, top, W, bot - top); ink(ctx, [[0, top], [W, top]], 6, { seed: 981, taper: false });
    }
  } else {
    drawSection(ctx, t, s);
    const nx = S[i + 1];
    if (nx && nx.n && nx.tr === 'iris' && t >= nx.t0 - 0.36) medallion(ctx, t, nx.t0 - 0.36, MED[0], MED[1], nx.n);
  }
  ctx.restore();
  if (t > 36.9) {
    const u = eo(seg(t, 36.9, 37.6)), r = lerp(1500, 420, u);
    ctx.save(); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(540, 980, r, 0, TAU, true); ctx.fill(); ctx.restore();
  }
  if (Q.get('nosubs') !== '1') caption(ctx, t);
  paperFinish(ctx, W, H, 0.9);
}
export function texts(t) { return TXT; }

function buildEvents(durs) {
  EVS = [];
  for (const [id, t] of Object.entries(VO_T)) ev(t, 'vo', { id, dur: durs[id] || 2 });
  ev(0.0, 'rumble', { dur: 3.4 }); ev(0.3, 'pop'); ev(1.6, 'growl');
  for (const s of S) {
    if (s.n && s.tr === 'iris') { ev(s.t0 - 0.36, 'stamp'); ev(s.t0, 'iris', { dur: 0.42 }); }
    if (s.tr === 'wipeUp') ev(s.t0, 'paper_swish', { gain: 1.2 });
    if (s.n) ev(s.t0 + 0.3, 'slide');
  }
  ev(3.9, 'pop'); ev(4.5, 'fireblast'); ev(5.1, 'pop'); ev(5.3, 'rain', { dur: 1.6 }); ev(6.8, 'pop'); ev(7.0, 'hiss');
  for (let k = 0; k < 9; k++) ev(10.0 + k * 0.3, 'dig'); ev(12.8, 'pop', { gain: 0.6 });
  ev(13.5, 'pen_write', { dur: 1.1 }); ev(13.5, 'pop'); ev(15.8, 'pop'); ev(16.3, 'grind');
  ev(19.7, 'pop'); ev(19.8, 'hiss'); ev(20.4, 'pop'); ev(20.5, 'roar'); ev(21.1, 'pop'); ev(21.2, 'screech');
  ev(24.2, 'whoosh', { dur: 0.5 }); ev(25.0, 'whoosh', { dur: 0.5 }); ev(25.8, 'whoosh', { dur: 0.5 }); ev(24.8, 'box_thump'); ev(25.5, 'box_thump', { pitch: 2 }); ev(26.3, 'box_thump', { pitch: 4 });
  ev(26.4, 'sparkle'); ev(26.5, 'roar'); ev(26.5, 'pop');
  ev(28.0, 'rain', { dur: 3.5 }); ev(28.4, 'surf', { dur: 1.6 }); ev(28.8, 'thunder'); ev(29.6, 'thunder'); ev(30.2, 'fireblast'); ev(28.6, 'pop'); ev(29.3, 'pop'); ev(30.2, 'pop');
  [32.2, 32.5, 32.8].forEach(t => ev(t, 'pop', { gain: 0.7 })); ev(33.6, 'pop'); ev(33.7, 'sparkle'); ev(36.9, 'iris', { dur: 0.7 });
  EVS.sort((a, b) => a.t - b.t);
}
