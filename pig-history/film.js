// "หมูมาเอง" — a 1950s classroom lesson in five numbered steps (Mid-century Cartoon), vertical 1080×1920.
// One timeline (TL) drives the picture, the sound events (EV), the captions (SUBS) and the reading check (TEXTS).
import { PAL, setClock, shape, ink, plane, text, fit, measure, star, sparkle, rays, ellipse, rrect, rect, spline, xform,
  arrow, dashed, clamp, lerp, seg, ss, eo, eio, back, twos, TAU, paperFinish, kidney, starPts } from './engine/toon.js';
import { drawHunter, hunterJoints, hunterToScreen, drawBoar, hut, heap, mushroom, berries, meat, mark, mixc, PIG } from './cast.js';

const W = 1080, H = 1920;
export const BPM = 120, BEAT = 60 / BPM;
const COL = { ink: PAL.ink, paper: '#FBF3E2', accent: PAL.coral };
// one colour per step medallion (the pig keeps its pink all film; the hunter's tunic stays brown)
const STEPC = [PAL.teal, PAL.avocado, PAL.blue, PAL.mustard, PAL.coral];

// ------------------------------------------------------------------ timeline
// VO start times (s); lines and durations come from vo/lines.json + vo/dur.json
const VO_T = { v1: 0.5, v2: 5.6, v3: 8.4, v4: 10.8, v5: 13.3, v6: 16.7, v7: 20.4, v8: 24.0, v9: 26.4, v10: 28.8, v11: 31.9, v12: 34.5 };
export const DUR = 41.7;
const S = [
  { id: 'hook', t0: 0, t1: 5.2 },
  { id: 'try', t0: 5.2, t1: 13.0, n: 1, label: 'ลองกิน', tr: 'iris' },
  { id: 'hunt', t0: 13.0, t1: 16.4, n: 2, label: 'ล่า', tr: 'iris' },
  { id: 'village', t0: 16.4, t1: 20.2, n: 3, label: 'ตั้งหมู่บ้าน', tr: 'wipeUp' },
  { id: 'heap', t0: 20.2, t1: 23.8, n: 4, label: 'กองขยะ', tr: 'iris' },
  { id: 'gens', t0: 23.8, t1: 28.5, n: 5, label: 'รุ่นแล้วรุ่นเล่า', tr: 'iris' },
  { id: 'china', t0: 28.5, t1: 31.7, tr: 'wipeSide' },
  { id: 'split', t0: 31.7, t1: 37.5, tr: 'cut' },
  { id: 'end', t0: 37.5, t1: DUR, tr: 'irisPig' },
];
const SILENCE = [[23.0, 23.3], [31.42, 31.85]];
const MUNCH = 23.3;
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
  text(ctx, `ขั้นที่ ${s.n} จาก 5`, 204, 222, { font: '600 30px Prompt', fill: COL.ink, track: 3 });
  text(ctx, s.label, 202, 300, { font: '70px Chonburi', fill: COL.ink, plate: PAL.white, off: [4, 4] });
  ctx.restore();
  if (k > 0.95) note('hdr' + s.n, `ขั้นที่ ${s.n} จาก 5 ${s.label}`, 64, 190, 204 + measure(ctx, s.label, '70px Chonburi'), 320);
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
  shape(ctx, ellipse(0, 0, r, r, 64), { fill: STEPC[(n - 1) % 5], line: 5, seed: 730 + n, grain: 0.3 });
  text(ctx, String(n), 0, r * 0.38, { font: `${Math.round(r * 1.1)}px Slab`, fill: COL.ink, plate: PAL.white, off: [5, 5], align: 'center' });
  ctx.restore();
}
function questionMark(ctx, x, y, k, t) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(Math.sin(twos(t) * 6) * 0.06);
  star(ctx, 0, 0, 82, { n: 12, inner: 0.7, fill: PAL.mustardL, line: 3.5, seed: 61 });
  text(ctx, '?', 0, 36, { font: '110px Slab', fill: COL.ink, plate: PAL.coral, off: [5, 4], align: 'center' });
  ctx.restore();
}

// ------------------------------------------------------------------ scenes (each draws in world px; camera inside)
function sceneHook(ctx, t) {
  const s = sec('hook');
  ctx.save(); cam(ctx, 540, 960, lerp(1.0, 1.045, ss(seg(t, 0, 5.2))));
  ground(ctx, PAL.mustardL, PAL.mustard);
  rays(ctx, 760, 1000, 30, 1400, PAL.white, { alpha: 0.18, rot: 0.1 });
  // boar sniffing the ground at right, facing the hunter
  const tw = twos(t);
  drawBoar(ctx, 790, 1250, { k: 0, dir: -1, s: 0.95, face: tw % 1.4 < 0.7 ? 'sniff' : 'neutral', dip: 0.25 + 0.2 * Math.sin(tw * 5), blink: blinkAt(t, [2.6]) });
  // hunter: hand to chin (puzzled), then looks at us
  const arm = keys(t, [{ t: 0.3, v: { a1: 1.28, a2: 1.45 } }, { t: 0.9, v: { a1: 2.1, a2: -2.3 } }, { t: 4.6, v: { a1: 2.1, a2: -2.3 } }, { t: 5.0, v: { a1: 1.28, a2: 1.45 } }]);
  drawHunter(ctx, { x: 300, y: 1290, s: 1.22, face: t > 0.8 ? 'puzzled' : 'neutral', armF: { a1: arm.a1, a2: arm.a2 }, handF: t > 0.8 ? 'grip' : 'open',
    look: t > 2.4 ? [-4, 2] : [8, 4], blink: blinkAt(t, [1.6, 4.1]) });
  questionMark(ctx, 520, 700, pop(t, 2.0), t);
  ctx.restore();
  // title (screen space)
  const kk = clamp((t - 0.15) / 0.5);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 80 + kk * 1000, H); ctx.clip();
  text(ctx, 'บทเรียนวันนี้', 540, 250, { font: '64px Sriracha', fill: PAL.coralD, align: 'center' });
  ctx.restore();
  const k2 = pop(t, 0.5, 0.32);
  if (k2 > 0) {
    ctx.save(); ctx.translate(540, 330); ctx.scale(k2, k2); ctx.translate(-540, -330);
    text(ctx, 'หมูกินได้...', 540, 380, { font: '104px Chonburi', fill: COL.ink, plate: PAL.white, off: [6, 5], align: 'center' });
    text(ctx, 'ใครบอก?', 540, 500, { font: '104px Chonburi', fill: COL.ink, plate: PAL.coral, off: [6, 5], align: 'center' });
    ctx.restore();
    if (k2 > 0.9) note('title', 'บทเรียนวันนี้ หมูกินได้... ใครบอก?', 150, 190, 930, 520);
  }
}

function sceneTry(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, lerp(1.0, 1.03, ss(seg(t, s.t0, s.t1))));
  ground(ctx, PAL.tealL, PAL.teal);
  const P = { x: 300, y: 1300, s: 1.18 };
  // the hand offers each food up to the call-out (anticipation down, fast lift, settle)
  const items = [[6.3, 7.0, 'mush', false], [7.8, 8.5, 'berry', true], [9.3, 10.0, 'meat', true]];
  const K = [{ t: s.t0, v: { a1: 1.28, a2: 1.45 } }];
  for (const [ti] of items) K.push({ t: ti - 0.3, v: { a1: 1.45, a2: 1.6 } }, { t: ti, v: { a1: -0.55, a2: -0.95 } }, { t: ti + 0.55, v: { a1: -0.45, a2: -0.8 } });
  K.push({ t: 10.6, v: { a1: 0.9, a2: -2.3 } }, { t: 12.8, v: { a1: 0.9, a2: -2.3 } });
  const a = keys(t, K);
  const chew = t > 10.5 && t < 12.6;
  const face = chew ? (Math.floor(twos(t) * 4) % 2 ? 'chew' : 'smile') : t > 6.9 && t < 7.6 ? 'wow' : 'neutral';
  const pose = { ...P, face, armF: a, handF: 'grip', look: [10, -6], blink: blinkAt(t, [6.1, 9.0, 12.2]) };
  drawHunter(ctx, pose);
  const J = hunterJoints(pose, 'F'), hand = hunterToScreen(P, J.ha);
  // which food is current
  let cur = null; for (const it of items) if (t >= it[0] - 0.05) cur = it;
  if (cur && t < 10.6) {
    const draw = { mush: mushroom, berry: berries, meat }[cur[2]];
    const kk = pop(t, cur[0] - 0.05, 0.22);
    ctx.save(); ctx.translate(hand[0] + 20, hand[1] - 40); ctx.scale(0.55 * kk, 0.55 * kk); draw(ctx, 0, 60, 1); ctx.restore();
  }
  ctx.restore();
  // call-out: the verdict on each food (screen space, native scale)
  callout(ctx, t, 6.2, 740, 700, 220, c => {
    let it = null; for (const x of items) if (t >= x[0]) it = x;
    if (!it) return;
    const draw = { mush: mushroom, berry: berries, meat }[it[2]];
    const kk = pop(t, it[0], 0.25);
    c.save(); c.scale(kk, kk); draw(c, 0, 80, 1.15); c.restore();
    mark(c, 90, 90, 70, it[3], pop(t, it[1], 0.2), it[3] ? 1 : 2);
  }, PAL.paper, hunterToScreen(P, [130, -620]));
  tag(ctx, t, 10.4, 'กินเนื้อมา 2 ล้านปี+', 540, 1090, { align: 'center', px: 46 });
}

function sceneHunt(ctx, t, s) {
  const u = seg(t, s.t0 + 0.2, s.t1 - 0.1);
  const bx = lerp(420, 2300, u), hxp = bx - 470 + Math.sin(u * 9) * 20;
  const cx = (bx + hxp) / 2 + 30;
  ctx.save(); cam(ctx, cx, 960, 1);
  ground(ctx, PAL.avocadoL, PAL.avocado);
  // grass tufts and stones for parallax reference
  for (let i = 0; i < 14; i++) { const gx = -200 + i * 230 + (i % 3) * 40; ink(ctx, [[gx, 1250], [gx + 10, 1210]], 6, { seed: 200 + i, color: PAL.avocadoD }); ink(ctx, [[gx + 16, 1250], [gx + 34, 1218]], 6, { seed: 220 + i, color: PAL.avocadoD }); }
  for (let i = 0; i < 6; i++) shape(ctx, kidney(100 + i * 470, 1330 + (i % 2) * 60, 46), { fill: PAL.avocadoD, line: 0, grain: 0.3, seed: 240 + i });
  const tw = twos(t);
  // speed lines behind the boar
  for (let i = 0; i < 4; i++) ink(ctx, [[bx - 260 - i * 30, 1060 + i * 34], [bx - 420 - i * 60, 1060 + i * 34]], 6, { seed: 260 + i, breaks: 0.2 });
  drawBoar(ctx, bx, 1250 - Math.abs(Math.sin(tw * 14)) * 22, { k: 0, s: 0.9, run: tw * 14, face: 'neutral' });
  drawHunter(ctx, { x: hxp, y: 1290 - Math.abs(Math.sin(tw * 12)) * 26, s: 1.0, face: 'wow', run: tw * 12,
    armF: { a1: -0.4, a2: -0.7 }, handF: 'grip', spear: { a: -0.2 }, armB: { a1: 2.6, a2: 2.4 }, look: [10, 0] });
  ctx.restore();
  tag(ctx, t, 14.2, 'หลายหมื่นปี', 540, 440, { align: 'center', px: 50 });
}

function sceneVillage(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, lerp(1.0, 1.05, ss(seg(t, s.t0, s.t1))));
  ground(ctx, PAL.blueL, PAL.blue, 1180);
  // soft birds
  for (let i = 0; i < 3; i++) { const bx = 200 + i * 300 + Math.sin(twos(t) * 2 + i) * 20, by = 640 + i * 40; ink(ctx, spline([[bx - 24, by], [bx - 10, by - 12], [bx, by], [bx + 10, by - 12], [bx + 24, by]], false, 4), 4, { seed: 300 + i }); }
  [[17.5, 220, 0.95], [18.0, 540, 1.1], [18.5, 860, 0.95]].forEach(([ti, x, sc], i) => {
    const k = pop(t, ti, 0.3); if (k <= 0) return;
    ctx.save(); ctx.translate(x, 1180); ctx.scale(1, k); ctx.translate(-x, -1180); hut(ctx, x, 1180, sc, { seed: i }); ctx.restore();
  });
  // the hunter, now a villager: smaller, front, waving
  const wave = Math.sin(twos(t) * 10) * 0.25;
  drawHunter(ctx, { x: 540, y: 1410, s: 0.62, face: 'smile', armF: { a1: -0.7 + wave * 0.3, a2: -1.5 + wave }, handF: 'open', blink: blinkAt(t, [19.2]) });
  ctx.restore();
  tag(ctx, t, 17.0, '~10,000 ปีก่อน', 540, 420, { align: 'center', px: 50 });
}

function sceneHeap(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, 1);
  ground(ctx, PAL.mustardL, PAL.mustard, 1220);
  hut(ctx, 150, 1220, 0.75, { seed: 3 }); hut(ctx, 380, 1220, 0.6, { seed: 4 });
  const hk = pop(t, 20.6, 0.3);
  if (hk > 0) { ctx.save(); ctx.translate(610, 1220); ctx.scale(hk, hk); ctx.translate(-610, -1220); heap(ctx, 610, 1220, 1.05); ctx.restore(); }
  // flies
  if (t > 20.8) for (let i = 0; i < 3; i++) { const a = twos(t) * 7 + i * 2.1; shape(ctx, ellipse(610 + Math.cos(a) * 90, 1040 + Math.sin(a * 1.3) * 30, 6, 6, 8), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] }); }
  // the boar walks in from the right, sniffs, then munches
  const u = ss(seg(t, 21.2, 22.6));
  const bx = lerp(1380, 880, u);
  const walking = t > 21.2 && t < 22.6;
  const munching = t >= MUNCH;
  const tw = twos(t);
  drawBoar(ctx, bx, 1220, { k: 0.05, dir: -1, s: 0.92, walk: walking ? tw * 10 : null,
    face: t > 22.6 && t < MUNCH ? 'sniff' : 'neutral', dip: munching ? 0.5 : t > 22.6 ? 0.3 : 0, jaw: munching ? (Math.floor(tw * 6) % 2 ? 0.8 : 0.1) : 0 });
  callout(ctx, t, 22.55, 540, 640, 210, c => {
    drawBoar(c, -330, 300, { k: 0.05, dir: 1, s: 1.6, face: t < MUNCH ? 'sniff' : 'neutral', dip: t < MUNCH ? 0.15 : 0.35, jaw: munching ? (Math.floor(tw * 6) % 2 ? 0.8 : 0.1) : 0, shadow: false });
  }, PAL.mustardL, [bx - 230, 1080]);
  if (munching) for (let i = 0; i < 4; i++) { const q = (tw - MUNCH) * 3 + i * 0.25; sparkle(ctx, 680 - (q % 1) * 60 + i * 12, 1110 - (q % 1) * 90, 18, { fill: PAL.white, rot: i }); }
  ctx.restore();
}

function sceneGens(ctx, t, s) {
  const P = [[290, 700], [790, 700], [290, 1150], [790, 1150]];
  const zu = ss(seg(t, 24.0, 25.9));
  ctx.save(); cam(ctx, lerp(P[0][0] + 40, 540, zu), lerp(P[0][1] - 100, 930, zu), lerp(1.9, 1.0, zu), lerp(0.08, 0, zu));
  ctx.fillStyle = COL.paper; ctx.fillRect(-2000, -2000, 6000, 6000);
  // atomic textile dots in the background
  for (let i = 0; i < 40; i++) { const x = (i * 197) % 1200 - 60, y = 380 + ((i * 331) % 1100); shape(ctx, ellipse(x, y, 7, 7, 10), { fill: PAL.pink, line: 0, grain: 0, off: [0, 0], seed: 400 + i }); }
  P.forEach(([x, y], i) => {
    const t0 = 24.0 + i * 0.5, k = pop(t, t0, 0.3);
    if (i === 3 && t > 26.6) { rays(ctx, x, y - 110, 28, 300 * pop(t, 26.6, 0.4), PAL.mustardL, { alpha: 0.8, rot: twos(t) * 0.2 }); star(ctx, x, y - 110, 200 * pop(t, 26.6, 0.4), { n: 14, inner: 0.72, fill: PAL.mustard, off: [0, 0], line: 3.5, seed: 410 }); }
    if (k > 0) { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y);
      drawBoar(ctx, x - 20, y, { k: i / 3, s: 0.62, face: i === 3 ? 'smug' : 'neutral', blink: blinkAt(t, [25.4 + i * 0.3]) }); ctx.restore(); }
    // generation label under each
    if (k > 0.2) { const str = `รุ่น ${i + 1}`; text(ctx, str, x, y + 74, { font: '600 40px Prompt', fill: COL.ink, plate: PAL.white, off: [3, 3], align: 'center' }); }
    if (i < 3) { const n = P[i + 1], u = seg(t, t0 + 0.2, t0 + 0.5);
      if (u > 0) arrow(ctx, i === 1 ? [P[i][0] - 60, P[i][1] + 110] : [x + 170, y - 120], i === 1 ? [n[0] + 60, n[1] - 260] : [n[0] - 160, n[1] - 120], { u, w: 6, head: 34, bend: i === 1 ? -0.25 : -0.3, fill: PAL.coral, bob: 0 }); }
  });
  ctx.restore();
  P.forEach(([x, y], i) => { if (pop(t, 24.0 + i * 0.5, 0.3) > 0.9 && zu > 0.9) note('gen' + i, `รุ่น ${i + 1}`, x - 60, y + 30, x + 60, y + 90); });
  tag(ctx, t, 26.45, 'หมูบ้าน!', 790, 1310, { align: 'center', px: 52, star: PAL.mustard });
}

function sceneChina(ctx, t, s) {
  ctx.save(); cam(ctx, 540, 960, 1);
  ground(ctx, '#CFE0E6', PAL.blueD, 1200);
  hut(ctx, 230, 1200, 0.9, { china: true, roof: PAL.coralD, wall: PAL.white, seed: 5 });
  hut(ctx, 820, 1200, 0.7, { china: true, roof: PAL.coralD, wall: PAL.white, seed: 6 });
  const u = seg(t, 28.7, 31.7);
  drawBoar(ctx, lerp(420, 640, u), 1300, { k: 1, s: 0.75, walk: twos(t) * 8, face: 'neutral', blink: blinkAt(t, [30.0]) });
  ctx.restore();
  const kk = clamp((t - 28.65) / 0.6);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 100 + kk * 980, H); ctx.clip();
  text(ctx, 'อีกฟากหนึ่งของโลก', 540, 300, { font: '66px Sriracha', fill: PAL.coralD, align: 'center' });
  ctx.restore();
  if (kk >= 1) note('china_k', 'อีกฟากหนึ่งของโลก', 230, 240, 850, 320);
  tag(ctx, t, 29.1, 'จีน ~9,000 ปีก่อน', 540, 400, { align: 'center', px: 50 });
}

function sceneSplit(ctx, t, s) {
  const push = lerp(1, 1.05, ss(seg(t, 35.8, 37.5)));
  ctx.save(); ctx.translate(540, 1140); ctx.scale(push, push); ctx.translate(-540, -1140);
  // top block: the question as people think of it
  plane(ctx, rect(0, 0, W, 820), PAL.coralL);
  plane(ctx, rect(0, 820, W, 1100), PAL.tealL);
  ink(ctx, [[0, 820], [W, 820]], 6, { seed: 500, breaks: 0.1, taper: false });
  drawHunter(ctx, { x: 250, y: 760, s: 0.6, face: 'neutral', armF: { a1: -0.2, a2: -0.2 }, handF: 'point', blink: blinkAt(t, [32.8]) });
  drawBoar(ctx, 760, 760, { k: 1, s: 0.6, dir: -1 });
  text(ctx, 'คนค้นพบว่าหมูกินได้?', 540, 330, { font: '600 62px Prompt', fill: COL.ink, plate: PAL.white, off: [4, 4], align: 'center' });
  note('splitA', 'คนค้นพบว่าหมูกินได้?', 160, 270, 920, 350);
  mark(ctx, 540, 560, 120, false, pop(t, 33.2, 0.22), 7);
  // bottom block: what really happened
  const kb = clamp((t - 34.4) / 0.25);
  if (kb > 0) {
    heap(ctx, 640, 1400, 1.0, 2);
    drawBoar(ctx, 600, 1330, { k: 1, s: 0.85, face: 'smug', jaw: t > 35.7 ? 0 : (Math.floor(twos(t) * 6) % 2 ? 0.6 : 0) });
    text(ctx, 'หมูค้นพบว่าขยะคนกินได้!', 540, 960, { font: '600 62px Prompt', fill: COL.ink, plate: PAL.white, off: [4, 4], align: 'center', alpha: kb });
    if (kb >= 1) note('splitB', 'หมูค้นพบว่าขยะคนกินได้!', 150, 900, 930, 980);
    mark(ctx, 880, 1110, 110, true, pop(t, 35.7, 0.22), 8);
  }
  ctx.restore();
}

function sceneEnd(ctx, t, s) {
  ctx.fillStyle = PAL.mustardL; ctx.fillRect(0, 0, W, H);
  rays(ctx, 540, 1060, 30, 1600, PAL.white, { alpha: 0.32, rot: 0.05 });
  star(ctx, 540, 1060, 420, { n: 18, inner: 0.78, fill: PAL.mustard, off: [0, 0], line: 4, seed: 600 });
  heap(ctx, 560, 1300, 1.2, 4);
  drawBoar(ctx, 500, 1220, { k: 1, s: 1.15, face: 'smug' });
  const k = pop(t, 37.65, 0.32);
  if (k > 0) {
    ctx.save(); ctx.translate(540, 420); ctx.scale(k, k); ctx.translate(-540, -420);
    text(ctx, 'จบบทเรียน', 540, 300, { font: '60px Sriracha', fill: PAL.coralD, align: 'center' });
    text(ctx, 'หมูมาเอง', 540, 480, { font: '150px Chonburi', fill: COL.ink, plate: PAL.coral, off: [7, 6], align: 'center' });
    ctx.restore();
    if (k > 0.95) note('endtitle', 'จบบทเรียน หมูมาเอง', 200, 240, 880, 510);
  }
}

const SCENE = { hook: sceneHook, try: sceneTry, hunt: sceneHunt, village: sceneVillage, heap: sceneHeap, gens: sceneGens, china: sceneChina, split: sceneSplit, end: sceneEnd };
function drawSection(ctx, t, s) {
  ctx.save(); SCENE[s.id](ctx, t, s); ctx.restore();
  if (s.n) { ctx.save(); stepHeader(ctx, t, s); ctx.restore(); }
}

// ------------------------------------------------------------------ the frame
const MED = [540, 860];   // where the medallion stamps on the outgoing scene
export function renderFilm(ctx, t, Q) {
  setClock(t); TXT = [];
  const s = section(t), i = S.indexOf(s), prev = S[i - 1];
  const TR = 0.42;
  ctx.save();
  if (prev && t < s.t0 + TR && s.tr !== 'cut') {
    const u = seg(t, s.t0, s.t0 + TR);
    const tOld = Math.min(t, prev.t1 - 0.02);
    if (s.tr === 'iris' || s.tr === 'irisPig') {
      drawSection(ctx, tOld, prev);
      const c = s.tr === 'irisPig' ? [600, 1140] : MED;
      ctx.save(); ctx.beginPath(); ctx.arc(c[0], c[1], eo(u) * 2300 + 1, 0, TAU); ctx.clip();
      drawSection(ctx, Math.max(t, s.t0 + 0.01), s); ctx.restore();
      ink(ctx, ellipse(c[0], c[1], eo(u) * 2300 + 1, eo(u) * 2300 + 1, 90), 8, { closed: true, seed: 980, breaks: 0.05 });
      if (s.n && u < 0.6) medallion(ctx, t, s.t0 - 0.36, c[0], c[1], s.n);
    } else {
      // colour-block wipe: a block sweeps across, the new card is revealed behind it
      const up = s.tr === 'wipeUp', blockC = up ? PAL.avocado : PAL.coral;
      const p = eio(u) * 2;            // 0..2: block covers by 1, uncovers by 2
      drawSection(ctx, p < 1 ? tOld : Math.max(t, s.t0 + 0.01), p < 1 ? prev : s);
      ctx.fillStyle = blockC;
      if (up) { const top = p < 1 ? H * (1 - p) : 0, bot = p < 1 ? H : H * (2 - p); ctx.fillRect(0, top, W, bot - top); ink(ctx, [[0, top], [W, top]], 6, { seed: 981, taper: false }); }
      else { const l = p < 1 ? W * (1 - p) : 0, r = p < 1 ? W : W * (2 - p); ctx.fillRect(l, 0, r - l, H); ink(ctx, [[l, 0], [l, H]], 6, { seed: 982, taper: false }); }
      if (s.n) { ctx.save(); stepHeader(ctx, t, s); ctx.restore(); }
    }
  } else {
    drawSection(ctx, t, s);
    // the next step's medallion stamps onto the outgoing scene one beat before the cut
    const nx = S[i + 1];
    if (nx && nx.n && nx.tr === 'iris' && t >= nx.t0 - 0.36) medallion(ctx, t, nx.t0 - 0.36, MED[0], MED[1], nx.n);
  }
  ctx.restore();
  // iris-out onto the pig to close the film
  if (t > 40.5) {
    const u = eo(seg(t, 40.5, 41.2)), r = lerp(1500, 330, u);
    ctx.save(); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(680, 1090, r, 0, TAU, true); ctx.fill(); ctx.restore();
  }
  if (Q.get('nosubs') !== '1') caption(ctx, t);
  paperFinish(ctx, W, H, 0.9);
}
export function texts(t) { return TXT; }

// ------------------------------------------------------------------ sound events
function buildEvents(durs) {
  EVS = [];
  for (const [id, t] of Object.entries(VO_T)) ev(t, 'vo', { id, dur: durs[id] || 2 });
  ev(0.5, 'pop', { gain: 0.8 }); ev(2.0, 'sparkle'); ev(0.9, 'grab');
  for (const s of S) {
    if (s.n && s.tr === 'iris') { ev(s.t0 - 0.36, 'stamp'); ev(s.t0, 'iris', { dur: 0.42 }); }
    if (s.tr === 'wipeUp' || s.tr === 'wipeSide') ev(s.t0, 'paper_swish', { gain: 1.2 });
    if (s.tr === 'irisPig') ev(s.t0, 'iris', { dur: 0.42 });
    if (s.n) ev(s.t0 + 0.3, 'slide');
  }
  // step 1
  [[6.3, 7.0, false], [7.8, 8.5, true], [9.3, 10.0, true]].forEach(([a, b, ok]) => { ev(a - 0.3, 'grab'); ev(a, 'pop'); ev(b, ok ? 'stamp_ok' : 'stamp_no'); });
  ev(6.2, 'pop', { gain: 0.6 });
  for (let k = 0; k < 8; k++) ev(10.6 + k * 0.25, 'chew', { gain: 0.8 });
  ev(10.4, 'pop');
  // step 2
  for (let k = 0; k < 13; k++) ev(13.3 + k * 0.22, 'hoof', { pan: -0.6 + k * 0.1 });
  ev(13.4, 'whoosh', { dur: 0.5 }); ev(15.6, 'whoosh', { dur: 0.5 }); ev(14.2, 'pop');
  ev(13.2, 'whistle', { up: 1 });
  // step 3
  ev(17.0, 'pop'); [17.5, 18.0, 18.5].forEach((t, i) => ev(t, 'box_thump', { pitch: i * 2, pan: -0.5 + i * 0.5 }));
  ev(16.6, 'birds', { dur: 3.4 });
  // step 4
  ev(20.6, 'box_thump', { pitch: -3 }); ev(20.8, 'flies', { dur: 2.2 });
  for (let k = 0; k < 6; k++) ev(21.25 + k * 0.23, 'hoof', { gain: 0.6, pan: 0.6 - k * 0.1 });
  ev(22.65, 'sniff'); ev(22.85, 'sniff');
  ev(MUNCH, 'munch'); ev(MUNCH + 0.3, 'munch', { gain: 0.7 });
  // step 5
  [24.0, 24.5, 25.0, 25.5].forEach((t, i) => { ev(t, 'pop', { gain: 0.9 }); ev(t, 'vib_up', { n: i }); if (i < 3) ev(t + 0.2, 'pen_write', { dur: 0.3 }); });
  ev(24.5, 'whistle', { up: 0 }); ev(26.6, 'sparkle'); ev(26.6, 'pop');
  // china
  ev(28.65, 'pen_write', { dur: 0.6 }); ev(29.1, 'pop', { gain: 0.7 });
  // split
  ev(31.7, 'pop'); ev(33.2, 'stamp_no'); ev(34.4, 'paper_swish'); ev(35.7, 'stamp_ok');
  for (let k = 0; k < 6; k++) ev(34.5 + k * 0.17, 'chew', { gain: 0.5 });
  // end
  ev(37.65, 'pop'); ev(37.7, 'sparkle'); ev(40.5, 'iris', { dur: 0.7 });
  EVS.sort((a, b) => a.t - b.t);
}
export const SILENCES = SILENCE;
