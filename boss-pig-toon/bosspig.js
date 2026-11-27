// The boss pig, drawn in code after the user's mascot: big round pink head, folded ears, black sunglasses with gold
// rims, heavy eyebrows, gold chain with a $ pendant, gold watch, dark-brown suit, white shirt, black belt with a gold
// crown buckle, black shoes with gold soles. A 2D rig: arms (shoulder + elbow), legs (walk phase), head tilt, talking jaw.
// Units: feet at (0,0), top of head ≈ -690. Screen angles: 0 = right, π/2 = down.
import { PAL, shape, ink, ellipse, spline, xform, move, rrect, rect, TAU, clamp, lerp, reg, path, text } from './engine/toon.js';

export const PINK = '#F2A3A4', PINKD = '#D9807F', PINKL = '#F8C4C2', SUIT = '#3B2A24', SUITD = '#2A1D19', SHIRT = '#F5F1EA',
  SHIRTD = '#DCD6CC', GOLD = '#E8B43A', GOLDD = '#B9831C', SHADE = '#1F1A1A';
const UA = 105, FA = 95;
export function armJoints(p, side) {        // side 'R' = screen right, 'L' = screen left
  const sh = side === 'R' ? [190, -400] : [-190, -400];
  const rest = side === 'R' ? { a1: 1.25, a2: 1.45 } : { a1: 1.89, a2: 1.69 };
  const a = p['arm' + side] || rest;
  const el = [sh[0] + Math.cos(a.a1) * UA, sh[1] + Math.sin(a.a1) * UA];
  const ha = [el[0] + Math.cos(a.a2) * FA, el[1] + Math.sin(a.a2) * FA];
  return { sh, el, ha, a2: a.a2 };
}
export const toScreen = (p, q) => [p.x + q[0] * (p.s ?? 1) * (p.dir ?? 1), p.y + q[1] * (p.s ?? 1) + (p.bob || 0) * (p.s ?? 1)];

function ribbon(ctx, pts, w, col, seed) {
  const P = spline(pts, false, 6);
  ink(ctx, P, w + 9, { seed, taper: false, wob: 0.05 });
  const o = reg(seed, 1);
  ink(ctx, move(P, o[0] * 0.4, o[1] * 0.4), w, { seed: seed + 1, taper: false, wob: 0.03, color: col });
}
// a pig hand: a round mitten with a thumb; kinds 'fist', 'thumb' (thumb up), 'open' (palm, four finger bumps), 'grip'
export function hand(ctx, x, y, a, kind = 'fist', side = 1, k = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(kind === 'thumb' || kind === 'open' ? 0 : a); ctx.scale(k, k);
  const parts = [];
  if (kind === 'open') {
    parts.push(ellipse(0, 0, 34, 38, 24));
    [-24, -8, 8, 24].forEach((fx, i) => parts.push(ellipse(fx, -40 + Math.abs(fx) * 0.25, 10, 18, 14)));
    parts.push(ellipse(36 * side, 6, 16, 10, 14, 0, TAU, -0.6 * side));
  } else if (kind === 'thumb') {
    parts.push(ellipse(0, 6, 36, 32, 24)); parts.push(ellipse(-6 * side, -38, 12, 24, 16, 0, TAU, 0.15 * side));
  } else {
    parts.push(ellipse(10, 0, 34, 31, 24)); parts.push(ellipse(16, -24 * side, 14, 10, 14));
  }
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  for (const p of parts) { path(ctx, p); ctx.stroke(); }
  const o = reg(77, 0.5); ctx.fillStyle = PINK;
  for (const p of parts) { path(ctx, move(p, o[0] * 0.5, o[1] * 0.5)); ctx.fill(); }
  if (kind === 'fist' || kind === 'grip') { ctx.lineWidth = 2.6; ctx.lineCap = 'round'; for (const dy of [-8, 4, 16]) { ctx.beginPath(); ctx.moveTo(24, dy); ctx.lineTo(36, dy); ctx.stroke(); } }
  ctx.restore();
}
function arm(ctx, p, side, seed) {
  const J = armJoints(p, side);
  ribbon(ctx, [J.sh, [(J.sh[0] + J.el[0]) / 2, (J.sh[1] + J.el[1]) / 2], J.el, [(J.el[0] + J.ha[0]) / 2, (J.el[1] + J.ha[1]) / 2], J.ha], 74, SUIT, seed);
  // shirt cuff + (right arm) the gold watch
  const c = [J.ha[0] - Math.cos(J.a2) * 22, J.ha[1] - Math.sin(J.a2) * 22], n = [-Math.sin(J.a2), Math.cos(J.a2)];
  ink(ctx, [[c[0] + n[0] * 30, c[1] + n[1] * 30], [c[0] - n[0] * 30, c[1] - n[1] * 30]], 16, { seed: seed + 3, taper: false, color: SHIRT });
  if (side === 'R' && !p.noWatch) { const w = [J.ha[0] - Math.cos(J.a2) * 8, J.ha[1] - Math.sin(J.a2) * 8]; ink(ctx, [[w[0] + n[0] * 30, w[1] + n[1] * 30], [w[0] - n[0] * 30, w[1] - n[1] * 30]], 15, { seed: seed + 4, taper: false, color: GOLD }); shape(ctx, ellipse(w[0], w[1], 13, 13, 16), { fill: SHADE, line: 3, seed: seed + 5, grain: 0, off: [0, 0] }); }
  const kind = p['hand' + side] || 'fist';
  hand(ctx, J.ha[0] + Math.cos(J.a2) * 14, J.ha[1] + Math.sin(J.a2) * 14, J.a2, kind, side === 'R' ? 1 : -1, 1.25);
  return J;
}
function legs(ctx, p) {
  const ph = p.walk;
  [[-1, 0], [1, Math.PI]].forEach(([sx, o], i) => {
    const lift = ph == null ? 0 : Math.max(0, Math.sin(ph + o)) * (p.run ? 50 : 26);
    const sw = ph == null ? 0 : Math.cos(ph + o) * (p.run ? 46 : 22);
    const hip = [sx * 78, -150], foot = [sx * 84 + sw, -30 - lift];
    ribbon(ctx, [hip, [(hip[0] + foot[0]) / 2, (hip[1] + foot[1]) / 2], foot], 108, SUIT, 300 + i * 4);
    const fx = foot[0] + sx * 14, fy = foot[1] + 30;
    shape(ctx, spline([[fx - 54, fy], [fx - 50, fy - 34], [fx + 10, fy - 44], [fx + 56, fy - 22], [fx + 58, fy]], true, 5), { fill: SHADE, line: 4, seed: 310 + i, grain: 0.1 });
    ink(ctx, [[fx - 54, fy - 2], [fx + 58, fy - 2]], 7, { seed: 312 + i, color: GOLD, taper: false });
    ink(ctx, spline([[fx - 20, fy - 34], [fx + 10, fy - 38], [fx + 34, fy - 28]], false, 4), 4, { seed: 314 + i, color: '#5A5050' });
  });
}
function body(ctx, p) {
  // jacket: a wide pear, the shirt belly bulging out of it
  shape(ctx, spline([[-190, -420], [-90, -450], [90, -450], [190, -420], [235, -300], [228, -190], [170, -120], [-170, -120], [-228, -190], [-235, -300]], true, 8), { fill: SUIT, line: 4.6, seed: 320, grain: 0.35, breaks: 0.15 });
  shape(ctx, spline([[-80, -440], [80, -440], [150, -360], [178, -250], [150, -160], [0, -132], [-150, -160], [-178, -250], [-150, -360]], true, 8), { fill: SHIRT, line: 4, seed: 321, grain: 0.15, shade: [{ pts: [[50, -450], [200, -450], [200, -120], [70, -120]], color: SHIRTD, alpha: 0.6 }] });
  for (let i = 0; i < 4; i++) shape(ctx, ellipse(0, -400 + i * 62, 6, 6, 10), { fill: SHIRTD, line: 1.8, seed: 322, grain: 0, off: [0, 0] });
  [[-188, -300], [-192, -220], [188, -300], [192, -220]].forEach(([bx, by], i) => shape(ctx, ellipse(bx, by, 13, 13, 14), { fill: GOLD, line: 3, seed: 325 + i, grain: 0 }));
  // belt + crown buckle
  shape(ctx, rrect(-168, -168, 336, 38, 10), { fill: SHADE, line: 3.6, seed: 330, grain: 0.1 });
  shape(ctx, rrect(-44, -178, 88, 58, 8), { fill: GOLD, line: 3.6, seed: 331, grain: 0.1 });
  shape(ctx, [[-26, -136], [-26, -162], [-12, -150], [0, -168], [12, -150], [26, -162], [26, -136]], { fill: GOLDD, line: 2.4, seed: 332, grain: 0 });
  // gold chain + $
  const ch = spline([[-100, -440], [-60, -392], [0, -370], [60, -392], [100, -440]], false, 8);
  ink(ctx, ch, 12, { seed: 333, color: GOLDD, taper: false }); ink(ctx, ch, 7, { seed: 334, color: GOLD, taper: false });
  text(ctx, '$', 0, -296, { font: '86px Slab', fill: GOLD, plate: GOLDD, off: [3, 3], align: 'center' });
}
function head(ctx, p) {
  const face = p.face || 'cool', jaw = clamp(p.talk || 0);
  ctx.save(); ctx.translate(0, -470); ctx.rotate(p.tilt || 0); ctx.translate(0, 470);
  // ears (folded forward)
  [[-1, 340], [1, 342]].forEach(([sx, seed]) => {
    const e = spline([[sx * 70, -690], [sx * 150, -730], [sx * 220, -700], [sx * 238, -630], [sx * 205, -600], [sx * 180, -640], [sx * 120, -650]], true, 6);
    shape(ctx, e, { fill: PINK, line: 4.4, seed, grain: 0.2 });
    shape(ctx, spline([[sx * 150, -700], [sx * 210, -680], [sx * 218, -632], [sx * 190, -650]], true, 5), { fill: PINKD, line: 0, seed: seed + 5, grain: 0.1 });
  });
  // head
  shape(ctx, ellipse(0, -560, 182, 158, 64), { fill: PINK, line: 4.6, seed: 344, grain: 0.15, breaks: 0.1, shade: [{ pts: [[-170, -500], [170, -500], [170, -430], [-170, -430]], color: PINKD, alpha: 0.35 }] });
  shape(ctx, ellipse(-80, -680, 46, 22, 20, 0, TAU, -0.3), { fill: PINKL, line: 0, seed: 345, grain: 0, off: [0, 0] });
  // eyebrows (heavy, angled down to the middle = "boss")
  const lift = face === 'laugh' ? -6 : face === 'sniff' ? -14 : 0, ang = face === 'grumpy' ? 0.42 : face === 'sniff' ? 0.05 : 0.3;
  [-1, 1].forEach(sx => shape(ctx, xform([[-50, -6], [44, -12], [50, 4], [-46, 16]].map(([a, b]) => [a * sx, b]), sx * 72, -655 + lift, -sx * ang), { fill: PAL.ink, line: 0, seed: 346 + sx, grain: 0, off: [0, 0] }));
  // sunglasses
  [-1, 1].forEach(sx => { const g = rrect(sx * 74 - 64, -630, 128, 72, 24); shape(ctx, g, { fill: SHADE, line: 0, seed: 350 + sx, grain: 0, off: [0, 0] }); ink(ctx, g, 6, { closed: true, color: GOLD, seed: 352 + sx, taper: false });
    ink(ctx, [[sx * 30, -620], [sx * 46, -612]], 4, { color: '#5C5656', seed: 354 + sx }); });
  ink(ctx, [[-10, -616], [10, -616]], 6, { color: GOLD, seed: 356, taper: false });
  ink(ctx, [[-138, -612], [-176, -604]], 6, { color: GOLD, seed: 357, taper: false }); ink(ctx, [[138, -612], [176, -604]], 6, { color: GOLD, seed: 358, taper: false });
  // snout
  const sw = face === 'sniff' ? Math.sin((p.t || 0) * 40) * 4 : 0;
  shape(ctx, ellipse(sw, -520, 66, 46, 30), { fill: '#EE8F95', line: 4.2, seed: 360, grain: 0.1 });
  [-1, 1].forEach(sx => shape(ctx, ellipse(sw + sx * 22, -520, 10, 16, 12), { fill: '#7A3E3E', line: 0, seed: 361, grain: 0, off: [0, 0] }));
  // mouth
  if (face === 'laugh' || jaw > 0.3) {
    const h = face === 'laugh' ? 48 : 18 + jaw * 26;
    shape(ctx, spline([[-56, -466], [56, -466], [44, -466 + h * 0.8], [0, -466 + h], [-44, -466 + h * 0.8]], true, 5), { fill: '#6B2230', line: 4, seed: 362, grain: 0 });
    if (h > 30) shape(ctx, ellipse(4, -466 + h * 0.72, 26, 12, 16), { fill: PAL.coral, line: 0, seed: 363, grain: 0, off: [0, 0] });
    [-34, 34].forEach(fx => shape(ctx, [[fx - 8, -466], [fx + 8, -466], [fx, -452]], { fill: PAL.white, line: 2.4, seed: 364, grain: 0 }));
  } else if (face === 'grumpy') ink(ctx, spline([[-34, -452], [0, -466], [34, -452]], false, 5), 6, { seed: 365 });
  else ink(ctx, spline([[-40, -464], [0, -456], [44, -470]], false, 5), 6, { seed: 366 });   // the smirk
  ctx.restore();
}
export function drawBoss(ctx, p) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale((p.s ?? 1) * (p.dir ?? 1), p.s ?? 1);
  if (p.shadow !== false) { ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 4, 240, 22, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  legs(ctx, p);
  ctx.translate(0, p.bob || 0);
  if (p.behind) p.behind(ctx);
  body(ctx, p);
  if (p.crossed) {
    // arms folded across the belly
    ribbon(ctx, [[-190, -400], [-215, -300], [100, -270]], 74, SUIT, 370);
    hand(ctx, 150, -266, 0, 'fist', 1, 1.25);
    ribbon(ctx, [[190, -400], [215, -300], [-100, -235]], 74, SUIT, 374);
    hand(ctx, -150, -232, Math.PI, 'fist', -1, 1.25);
    ink(ctx, [[80, -282], [114, -278]], 16, { seed: 378, color: GOLD, taper: false });
  }
  head(ctx, p);
  if (!p.crossed) { arm(ctx, p, 'L', 380); arm(ctx, p, 'R', 390); }
  if (p.front) p.front(ctx);
  ctx.restore();
}
