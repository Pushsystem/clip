// Cast for "หมูมาเอง": a Stone Age hunter (front view, held body, moving arms), a wild boar that becomes a
// domestic pig (side view, parameter k: 0 wild → 1 domestic), and the paper props (huts, rubbish heap, foods, stamps).
// Drawn with the style engine (off-register fill, breathing broken ink line). Limited animation: callers pass
// on-twos times.
import { PAL, shape, ink, ellipse, spline, xform, move, rrect, rect, TAU, clamp, lerp, reg, path, starPts, text } from './engine/toon.js';

const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
export const mixc = (a, b, k) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(k)).toString(16).padStart(2, '0')).join(''); };

// ---------------------------------------------------------------- hands (UPA four-finger glove, bare skin)
export function drawHand(ctx, x, y, a, kind = 'open', side = 1, k = 1, skin = PAL.skin) {
  const parts = [], seps = [];
  const E = (cx, cy, rx, ry, rot = 0) => parts.push(ellipse(cx, cy, rx, ry, 18, 0, TAU, rot));
  E(12, 0, 15, 13.5);
  if (kind === 'open') {
    [-0.62, 0, 0.62].forEach(r => E(12 + Math.cos(r) * 25, Math.sin(r) * 25, 12, 5, r));
    E(4, -15 * side, 10, 5, -1.35 * side);
  } else if (kind === 'point') {
    E(38, -5 * side, 19, 4.8); E(25, 5 * side, 7, 6); E(20, 11 * side, 6, 5.5); E(8, -14 * side, 8.5, 5, -1.0 * side);
  } else { E(26, -8, 6.5, 6.5); E(28, 1, 6.5, 6.5); E(25, 10, 6, 6); E(12, -14 * side, 9, 5.5, -0.4 * side); seps.push([[22, -3.5], [30, -3.5]], [[22, 5.5], [29, 5.5]]); }
  const P = parts.map(p => xform(p, x, y, a, k));
  ctx.save(); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 6 * k; ctx.lineJoin = 'round';
  for (const p of P) { path(ctx, p); ctx.stroke(); }
  const o = reg(77, 0.6); ctx.fillStyle = skin;
  for (const p of P) { path(ctx, move(p, o[0] * 0.5, o[1] * 0.5)); ctx.fill(); }
  ctx.lineWidth = 2.4 * k; ctx.lineCap = 'round';
  for (const s2 of seps) { const q = xform(s2, x, y, a, k); ctx.beginPath(); ctx.moveTo(...q[0]); ctx.lineTo(...q[1]); ctx.stroke(); }
  ctx.restore();
}

// ---------------------------------------------------------------- the hunter
// pose: {x, y (feet), s, face:'neutral'|'puzzled'|'chew'|'wow'|'smile', armF/armB:{a1,a2}, handF/handB,
//        legs:{run phase or null}, spear:{a} (held in the front hand), look:[dx,dy], blink}
export const TUNIC = '#9A6440', TUNICD = '#77482B', TUNICL = '#B98A5E';
const UA = 105, FA = 95;
export function hunterJoints(p, which) {
  const sh = which === 'F' ? [60, -404] : [-60, -404];
  const rest = which === 'F' ? { a1: 1.28, a2: 1.45 } : { a1: 1.86, a2: 1.7 };
  const arm = p[which === 'F' ? 'armF' : 'armB'] || rest;
  const el = [sh[0] + Math.cos(arm.a1) * UA, sh[1] + Math.sin(arm.a1) * UA];
  const ha = [el[0] + Math.cos(arm.a2) * FA, el[1] + Math.sin(arm.a2) * FA];
  return { sh, el, ha, a2: arm.a2 };
}
export const hunterToScreen = (p, q) => [p.x + q[0] * (p.s ?? 1), p.y + q[1] * (p.s ?? 1)];
function limb(ctx, pts, seed, col, w = 28) {
  const P = spline(pts, false, 6);
  ink(ctx, P, w, { seed, taper: false, wob: 0.08 });
  const o = reg(seed, 1);
  ink(ctx, move(P, o[0] * 0.5, o[1] * 0.5), w * 0.64, { seed: seed + 1, taper: false, wob: 0.05, color: col });
}
function arm(ctx, p, which, seed) {
  const J = hunterJoints(p, which);
  limb(ctx, [J.sh, [(J.sh[0] + J.el[0]) / 2, (J.sh[1] + J.el[1]) / 2], J.el, [(J.el[0] + J.ha[0]) / 2, (J.el[1] + J.ha[1]) / 2], J.ha], seed, PAL.skin);
  if (which === 'F' && p.spear) drawSpear(ctx, J.ha, p.spear.a);
  if (which === 'F' && p.rifle) drawRifle(ctx, J.ha, p.rifle.a);
  drawHand(ctx, J.ha[0], J.ha[1], J.a2, p[which === 'F' ? 'handF' : 'handB'] || 'open', which === 'F' ? -1 : 1);
  return J;
}
function drawRifle(ctx, h, a) {
  const c = Math.cos(a), s = Math.sin(a), P = (d, n = 0) => [h[0] + c * d - s * n, h[1] + s * d + c * n];
  shape(ctx, [P(-150, -6), P(-40, -12), P(-30, 14), P(-150, 34)], { fill: PAL.brown, line: 3.6, seed: 1310, grain: 0.4 });
  ink(ctx, [P(-40, -4), P(260, -4)], 12, { seed: 1311, taper: false });
}
function drawSpear(ctx, h, a) {
  const L0 = -170, L1 = 300, c = Math.cos(a), s = Math.sin(a);
  const A = [h[0] + c * L0, h[1] + s * L0], B = [h[0] + c * L1, h[1] + s * L1];
  ink(ctx, [A, B], 15, { seed: 801, taper: false, wob: 0.1 });
  ink(ctx, move([A, B], 3, 2), 8, { seed: 802, taper: false, wob: 0.05, color: PAL.kraft });
  const tip = xform([[0, -20], [70, 0], [0, 20], [-12, 0]], B[0], B[1], a);
  shape(ctx, tip, { fill: PAL.chromeD, line: 3.5, seed: 803, grain: 0.3 });
  ink(ctx, xform([[-14, -12], [-4, 12]], B[0], B[1], a), 4, { seed: 804, taper: false });
}
function legs(ctx, p) {
  const run = p.run;
  [[-1, 0], [1, Math.PI]].forEach(([sx, ph], i) => {
    const hip = [sx * 30, -248];
    let foot;
    if (run == null) foot = [sx * 40, -14];
    else { const a = Math.PI / 2 + Math.sin(run + ph) * 0.55; foot = [hip[0] + Math.cos(a) * 236, hip[1] + Math.sin(a) * 236 - Math.max(0, Math.cos(run + ph)) * 26]; }
    const knee = [(hip[0] + foot[0]) / 2 + sx * 6, (hip[1] + foot[1]) / 2];
    limb(ctx, [hip, knee, foot], 820 + i * 3, PAL.skin, 30);
    shape(ctx, ellipse(foot[0] + sx * 10, foot[1] + 2, 28, 12, 18), { fill: PAL.skin, line: 3.6, seed: 826 + i, grain: 0.1 });
  });
}
export function drawHunter(ctx, p) {
  const face = p.face || 'neutral';
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale((p.s ?? 1) * (p.dir ?? 1), p.s ?? 1);
  if (p.bob) ctx.translate(0, p.bob);
  if (p.shadow !== false) { ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(8, 2, 110, 13, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  arm(ctx, p, 'B', 700);
  legs(ctx, p);
  // bare torso under the tunic
  shape(ctx, spline([[-62, -404], [-40, -440], [40, -440], [62, -404], [60, -300], [56, -250], [-56, -250], [-60, -300]], true, 6), { fill: PAL.skin, line: 4, seed: 710, grain: 0.15, breaks: 0.2 });
  // fur tunic: over one shoulder, zigzag hem
  const tunic = [[-66, -438], [-34, -446], [-6, -432], [66, -366], [70, -300], [74, -226], [52, -246], [32, -214], [12, -244], [-8, -212], [-28, -244], [-48, -214], [-74, -232], [-70, -320]];
  if (p.cloth) {
    // a robe or shirt covering both shoulders, with a belt
    const robe = spline([[-64, -404], [-40, -446], [40, -446], [64, -404], [64, -300], [70, -226], [-70, -226], [-64, -300]], true, 6);
    shape(ctx, robe, { fill: p.cloth, line: 4.2, seed: 712, grain: 0.35, breaks: 0.18, shade: [{ pts: [[30, -450], [90, -450], [90, -200], [36, -200]], color: p.clothD || TUNICD, alpha: 0.5 }] });
    if (p.belt) shape(ctx, rrect(-66, -300, 132, 22, 6), { fill: p.belt, line: 3, seed: 713, grain: 0.2 });
    ink(ctx, [[-30, -444], [0, -404], [30, -444]], 4, { seed: 714 });
  } else {
  shape(ctx, tunic, { fill: TUNIC, line: 4.2, seed: 712, grain: 0.45, breaks: 0.18, shade: [{ pts: [[30, -440], [90, -440], [90, -200], [36, -200]], color: TUNICD, alpha: 0.55 }] });
  [[-30, -380, 14, 9], [10, -320, 16, 10], [-40, -290, 12, 8], [40, -270, 13, 8], [-8, -400, 10, 7]].forEach(([x, y, rx, ry], i) =>
    shape(ctx, ellipse(x, y, rx, ry, 14), { fill: TUNICL, line: 0, seed: 716 + i, grain: 0.2 }));
  }
  // neck + head
  shape(ctx, rect(-20, -462, 40, 34), { fill: PAL.skin, line: 0, seed: 720, grain: 0 });
  drawHead(ctx, p, face);
  if (p.hat === 'mongol') helmet(ctx, 0, -560, 1, false);
  if (p.hat === 'straw') { shape(ctx, ellipse(0, -566, 118, 22, 30), { fill: PAL.mustard, line: 4, seed: 1300, grain: 0.4 }); shape(ctx, spline([[-60, -566], [-52, -626], [0, -640], [52, -626], [60, -566]], true, 5), { fill: PAL.mustard, line: 4, seed: 1301, grain: 0.4 }); ink(ctx, [[-58, -584], [58, -584]], 9, { color: PAL.coralD, seed: 1302, taper: false }); }
  if (p.hat === 'bicorne') { shape(ctx, spline([[-120, -560], [-60, -600], [0, -640], [60, -600], [120, -560], [0, -580]], true, 5), { fill: PAL.ink, line: 3, seed: 1303, grain: 0.2 }); ink(ctx, [[-100, -566], [100, -566]], 6, { color: PAL.mustard, seed: 1304, taper: false }); }
  arm(ctx, p, 'F', 730);
  ctx.restore();
}
function drawHead(ctx, p, face) {
  const blink = p.blink ?? 0, look = p.look || [0, 0];
  // shaggy hair behind
  const hair = []; for (let i = 0; i <= 18; i++) { const a = Math.PI * 0.92 + i / 18 * Math.PI * 1.16, r = p.neat ? (i % 2 ? 72 : 78) : i % 2 ? 76 : 96; hair.push([Math.cos(a) * r, -520 + Math.sin(a) * r * 0.95]); }
  hair.push([82, -470], [70, -440], [-70, -440], [-82, -470]);
  shape(ctx, hair, { fill: PAL.hair, line: 0, seed: 740, grain: 0.35 });
  // egg head: nose is part of the outline (a bump on the right cheek line)
  const head = spline([[0, -588], [48, -568], [66, -520], [64, -486], [76, -474], [64, -462], [54, -440], [24, -420], [-24, -420], [-54, -440], [-66, -490], [-56, -560]], true, 6);
  shape(ctx, head, { fill: PAL.skin, line: 4, seed: 741, grain: 0.15, breaks: 0.14 });
  // fringe
  shape(ctx, spline([[-62, -540], [-44, -590], [10, -604], [60, -572], [64, -538], [40, -556], [20, -536], [0, -560], [-20, -534], [-40, -556]], true, 5), { fill: PAL.hair, line: 0, seed: 742, grain: 0.35 });
  // brows
  const brow = { neutral: [0, 0], puzzled: [-0.25, 0.35], chew: [0.15, 0.15], wow: [-0.35, -0.35], smile: [-0.1, -0.1] }[face] || [0, 0];
  const lift = { puzzled: [0, -12], wow: [-10, -10] }[face] || [0, 0];
  [-24, 24].forEach((x, i) => {
    const r = i ? brow[1] : -brow[0], y = -516 + lift[i];
    ink(ctx, xform([[-15, 0], [15, 0]], x, y, r), 8, { seed: 744 + i, taper: true });
  });
  // eyes
  [-22, 24].forEach((x, i) => {
    const X = x + look[0], Y = -494 + look[1];
    if (blink > 0.5 || face === 'chew') ink(ctx, spline([[X - 9, Y], [X, Y + (face === 'chew' ? -5 : 3)], [X + 9, Y]], false, 4), 4, { seed: 750 + i });
    else if (face === 'wow') { shape(ctx, ellipse(X, Y, 11, 13, 16), { fill: PAL.white, line: 3, seed: 752 + i, grain: 0, off: [0, 0] }); shape(ctx, ellipse(X, Y + 1, 5, 6, 12), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] }); }
    else shape(ctx, ellipse(X, Y, 6.5, 8.5, 14), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
  });
  // mouth + cheeks
  if (face === 'chew') {
    shape(ctx, ellipse(-40, -452, 18, 14, 16), { fill: PAL.skinD, line: 3, seed: 760, grain: 0.1 });
    shape(ctx, ellipse(42, -452, 18, 14, 16), { fill: PAL.skinD, line: 3, seed: 761, grain: 0.1 });
    ink(ctx, spline([[-16, -448], [-8, -442], [0, -448], [8, -442], [16, -448]], false, 4), 4, { seed: 762 });
  } else if (face === 'wow') {
    shape(ctx, ellipse(2, -446, 14, 18, 18), { fill: PAL.coralD, line: 3.6, seed: 763, grain: 0.1 });
  } else if (face === 'smile') {
    shape(ctx, spline([[-24, -456], [0, -452], [24, -456], [14, -434], [-14, -434]], true, 5), { fill: PAL.coralD, line: 3.6, seed: 764, grain: 0.1 });
  } else if (face === 'puzzled') {
    ink(ctx, spline([[-16, -444], [0, -450], [16, -440]], false, 5), 4.5, { seed: 765 });
  } else ink(ctx, spline([[-16, -448], [0, -444], [16, -448]], false, 5), 4.5, { seed: 766 });
  // stubble dots
  [[-30, -436], [-14, -428], [6, -426], [26, -432], [38, -442]].forEach(([x, y], i) => shape(ctx, ellipse(x, y, 2.2, 2.2, 6), { fill: PAL.hair, line: 0, grain: 0, off: [0, 0], seed: 770 + i }));
}

// ---------------------------------------------------------------- the boar → pig
// o: {k 0 wild..1 domestic, dir, s, run (leg phase), walk (leg phase, smaller), face:'neutral'|'sniff'|'munch'|'smug', jaw 0..1, dip 0..1, blink}
export const BOAR = '#6E4A35', BOARD = '#4E3324', PIG = '#EFA9A0', PIGD = '#D27F78', PIGL = '#F7CCC4';
export function drawBoar(ctx, x, y, o = {}) {
  const k = clamp(o.k ?? 0), s = o.s ?? 1, dir = o.dir ?? 1;
  const body = o.col || mixc(BOAR, PIG, k), bodyD = o.colD || mixc(BOARD, PIGD, k), snoutC = o.snout || mixc('#8E6450', PIGL, k);
  const earK = o.ear ?? k;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  if (o.shadow !== false) { ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(10, 2, 190, 14, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  const ph = o.run ?? o.walk;
  const amp = o.run != null ? 0.55 : o.walk != null ? 0.3 : 0;
  // far legs (darker), then body, then near legs
  const leg = (lx, off, far, seed) => {
    const a = Math.PI / 2 + (ph != null ? Math.sin(ph + off) * amp : 0);
    const top = [lx, -96], foot = [lx + Math.cos(a) * 92, -96 + Math.sin(a) * 92];
    ink(ctx, [top, foot], 30, { seed, taper: false, wob: 0.06 });
    ink(ctx, move([top, foot], 3, 2), 19, { seed: seed + 1, taper: false, wob: 0.04, color: far ? bodyD : body });
    shape(ctx, ellipse(foot[0] + 4, foot[1] - 2, 15, 9, 12), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
    if (o.points || (o.belt && lx > 50)) { ink(ctx, [[top[0] + (foot[0] - top[0]) * 0.55, top[1] + (foot[1] - top[1]) * 0.55], [foot[0], foot[1] - 8]], 19, { seed: seed + 3, taper: false, color: PAL.white }); }
  };
  leg(-104, Math.PI, true, 900); leg(104, 0, true, 904);
  // tail
  if (k < 0.5) ink(ctx, [[-176, -168], [-202, -140], [-210, -108]], 7, { seed: 910 });
  else { const pts = []; for (let i = 0; i <= 26; i++) { const a = i / 26 * TAU * 1.4, r = 6 + i * 0.9; pts.push([-180 - Math.cos(a) * r, -162 + Math.sin(a) * r]); } ink(ctx, pts, 6, { seed: 911 }); }
  // body bean (rounder as it becomes a pig)
  const bulge = 18 * k;
  const bean = spline([[-178, -160], [-150, -232 - bulge], [-40, -266 - bulge], [80, -252 - bulge], [150, -214], [178, -150], [150, -86 + bulge * 0.4], [40, -70 + bulge * 0.6], [-90, -74 + bulge * 0.6], [-166, -102]], true, 8);
  shape(ctx, bean, { fill: body, line: 4.4, seed: 912, grain: 0.4 * (1 - k) + 0.2, breaks: 0.16, shade: [{ pts: [[-200, -120], [200, -120], [200, -40], [-200, -40]], color: bodyD, alpha: 0.5 }] });
  if (o.belt) { ctx.save(); path(ctx, bean); ctx.clip(); ctx.fillStyle = PAL.white; ctx.fillRect(70, -300, 80, 260); ctx.restore(); ink(ctx, bean, 4.4, { closed: true, seed: 913, breaks: 0.16 }); }
  // mane: bristle spikes along the back, shrinking away
  if (k < 0.95) {
    const m = (1 - k) * 34, pts = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12, bx = lerp(-130, 120, u), by = -252 - bulge + Math.sin(u * Math.PI) * -12 + (u < 0.1 || u > 0.9 ? 12 : 0); pts.push([bx, by + 8], [bx + 10, by - m * (0.6 + 0.4 * Math.sin(i * 2.1))]); }
    pts.push([120, -230], [-130, -230]);
    shape(ctx, pts, { fill: bodyD, line: 3, seed: 916, grain: 0.3, breaks: 0.25 });
  }
  leg(-70, 0, false, 920); leg(136, Math.PI, false, 924);
  // head (dip lowers it toward the ground; jaw opens for munching)
  const dip = clamp(o.dip ?? 0), jaw = clamp(o.jaw ?? 0);
  ctx.save(); ctx.translate(150, -170); ctx.rotate(dip * 0.55); ctx.translate(-150, 170);
  const head = spline([[110, -238], [190, -222], [248, -176], [266, -138], [250, -110], [210, -96], [140, -104]], true, 8);
  // ears
  const earW = [[150, -226], [168, -290], [192, -228]], earP = [[152, -228], [214, -250], [222, -196]];
  shape(ctx, earW.map((q, i) => [lerp(q[0], earP[i][0], earK), lerp(q[1], earP[i][1], earK)]), { fill: bodyD, line: 3.6, seed: 930, grain: 0.3 });
  shape(ctx, head, { fill: body, line: 4.2, seed: 932, grain: 0.3, breaks: 0.14 });
  // lower jaw
  if (jaw > 0.02) shape(ctx, xform([[0, 0], [70, 8], [56, 26], [0, 20]], 196, -108, jaw * 0.5), { fill: bodyD, line: 3.4, seed: 934, grain: 0.2 });
  // snout disc
  shape(ctx, ellipse(266, -136, 14 + 6 * k, 26 + 4 * k, 20), { fill: snoutC, line: 3.8, seed: 936, grain: 0.1 });
  [[262, -146], [262, -126]].forEach(([nx, ny], i) => shape(ctx, ellipse(nx + 2, ny, 3.2, 5, 10), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0], seed: 938 + i }));
  // tusk
  if (k < 0.9) { const tk = 1 - k; shape(ctx, [[226, -112], [238, -112 - 44 * tk], [244, -110]], { fill: PAL.white, line: 3, seed: 940, grain: 0 }); }
  // eye + brow
  const face = o.face || 'neutral';
  if (face === 'wow') {
    shape(ctx, ellipse(206, -174, 14, 16, 16), { fill: PAL.white, line: 3, seed: 952, grain: 0, off: [0, 0] });
    shape(ctx, ellipse(208, -172, 6, 7, 12), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
    ink(ctx, xform([[-14, 0], [14, 0]], 206, -204, -0.2), 6, { seed: 953 });
    shape(ctx, ellipse(236, -106, 12, 14, 14), { fill: PAL.coralD, line: 3, seed: 954, grain: 0 });
  } else if (face === 'worried') {
    shape(ctx, ellipse(206, -172, 6.5, 8, 12), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
    ink(ctx, xform([[-14, 0], [14, 0]], 206, -194, -0.45), 6, { seed: 955 });
    ink(ctx, spline([[214, -108], [224, -114], [234, -108], [244, -114]], false, 4), 3.6, { seed: 956 });
    shape(ctx, spline([[170, -220], [176, -206], [170, -198], [164, -206]], true, 4), { fill: PAL.blueL, line: 2.6, seed: 957, grain: 0 });
  } else if (face === 'ko') {
    ink(ctx, [[196, -182], [216, -162]], 5, { seed: 949 }); ink(ctx, [[216, -182], [196, -162]], 5, { seed: 950 });
    ink(ctx, spline([[214, -112], [232, -116], [246, -110]], false, 4), 3.6, { seed: 951 });
  } else if (face === 'smug') {
    ink(ctx, spline([[196, -176], [206, -170], [216, -176]], false, 4), 4.5, { seed: 942 });
    ink(ctx, [[192, -196], [220, -192]], 6, { seed: 943 });
    shape(ctx, spline([[214, -114], [236, -106], [250, -112], [236, -100]], true, 4), { fill: PAL.coralD, line: 3, seed: 944, grain: 0 });
  } else {
    if ((o.blink ?? 0) > 0.5) ink(ctx, [[198, -172], [214, -172]], 4, { seed: 945 });
    else shape(ctx, ellipse(206, -172, 6.5, 8, 12), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
    ink(ctx, xform([[-14, 0], [14, 0]], 206, -194, k < 0.5 ? 0.35 : 0), 6, { seed: 946 });
    ink(ctx, spline([[214, -112], [232, -108], [246, -114]], false, 4), 3.6, { seed: 947 });
  }
  if (face === 'sniff') [[288, -150], [300, -128], [292, -108]].forEach((q, i) => ink(ctx, [[q[0], q[1]], [q[0] + 18, q[1] - 4 + i * 4]], 4, { seed: 948 + i }));
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------- props
export function hut(ctx, x, y, s = 1, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(8, 2, 150, 12, 0, 0, TAU); ctx.fill(); ctx.restore();
  const wall = o.wall || PAL.kraftL, roof = o.roof || PAL.mustardD;
  shape(ctx, spline([[-120, 0], [-120, -110], [120, -110], [120, 0]], true, 3), { fill: wall, line: 4, seed: 960 + (o.seed || 0), grain: 0.4 });
  shape(ctx, spline([[-34, 0], [-34, -60], [0, -84], [34, -60], [34, 0]], true, 4), { fill: PAL.inkSoft, line: 0, seed: 961, grain: 0.2 });
  if (o.china) {
    shape(ctx, [[-170, -96], [-120, -120], [-90, -186], [90, -186], [120, -120], [170, -96], [100, -112], [-100, -112]], { fill: roof, line: 4.2, seed: 962 + (o.seed || 0), grain: 0.35 });
    shape(ctx, [[-110, -180], [-60, -200], [-40, -240], [40, -240], [60, -200], [110, -180]], { fill: roof, line: 4, seed: 963, grain: 0.35 });
  } else {
    shape(ctx, spline([[-160, -96], [-8, -300], [8, -300], [160, -96], [0, -120]], true, 4), { fill: roof, line: 4.2, seed: 962 + (o.seed || 0), grain: 0.5, breaks: 0.2 });
    for (let i = 0; i < 5; i++) ink(ctx, [[-110 + i * 55, -112], [-60 + i * 30, -190]], 3, { seed: 964 + i, color: PAL.mustardD });
  }
  ctx.restore();
}
export function heap(ctx, x, y, s = 1, seed = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(6, 2, 170, 12, 0, 0, TAU); ctx.fill(); ctx.restore();
  shape(ctx, spline([[-170, 0], [-120, -70], [-40, -120], [40, -112], [120, -70], [170, 0]], true, 6), { fill: PAL.kraftD, line: 4.2, seed: 980 + seed, grain: 0.5 });
  bone(ctx, -60, -90, 0.3, 0.9); bone(ctx, 50, -70, -0.5, 0.8);
  shape(ctx, spline([[-10, -110], [20, -150], [40, -138], [12, -104]], true, 4), { fill: PAL.mustard, line: 3.4, seed: 984, grain: 0.3 });   // a peel
  shape(ctx, ellipse(100, -40, 18, 22, 16), { fill: PAL.coral, line: 3.4, seed: 985, grain: 0.3 });                                    // an apple core
  shape(ctx, ellipse(-120, -30, 22, 12, 16, 0, TAU, 0.3), { fill: PAL.avocado, line: 3.2, seed: 986, grain: 0.3 });                       // a leaf
  ctx.restore();
}
export function bone(ctx, x, y, a, s = 1) {
  const P = []; const end = (cx) => [ellipse(cx, -9, 10, 10, 12), ellipse(cx, 9, 10, 10, 12)];
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
  for (const e of [...end(-40), ...end(40)]) shape(ctx, e, { fill: PAL.white, line: 3, seed: 990, grain: 0 });
  shape(ctx, rect(-40, -8, 80, 16), { fill: PAL.white, line: 0, seed: 991, grain: 0 });
  ink(ctx, [[-38, -8], [38, -8]], 3, { seed: 992 }); ink(ctx, [[-38, 8], [38, 8]], 3, { seed: 993 });
  ctx.restore();
}
export function mushroom(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, spline([[-26, 0], [-20, -70], [20, -70], [26, 0]], true, 4), { fill: PAL.white, line: 4, seed: 1000, grain: 0.1 });
  shape(ctx, spline([[-100, -60], [-60, -140], [0, -160], [60, -140], [100, -60]], true, 6), { fill: PAL.coral, line: 4.4, seed: 1001, grain: 0.3 });
  [[-50, -100, 14], [10, -128, 12], [56, -92, 13], [-10, -84, 9]].forEach(([a, b, r], i) => shape(ctx, ellipse(a, b, r, r * 0.8, 14), { fill: PAL.white, line: 0, seed: 1002 + i, grain: 0 }));
  ctx.restore();
}
export function berries(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ink(ctx, spline([[0, -150], [10, -110], [-6, -70]], false, 5), 5, { seed: 1010, color: PAL.avocadoD });
  shape(ctx, ellipse(30, -150, 36, 16, 16, 0, TAU, -0.4), { fill: PAL.avocado, line: 3.4, seed: 1011, grain: 0.3 });
  [[-30, -60], [8, -50], [44, -64], [-12, -20], [26, -14], [-46, -24], [6, 18]].forEach(([a, b], i) => shape(ctx, ellipse(a, b, 26, 26, 18), { fill: PAL.plum, line: 3.6, seed: 1012 + i, grain: 0.25 }));
  ctx.restore();
}
export function meat(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.5);
  bone(ctx, 70, 0, 0, 0.9);
  shape(ctx, spline([[-120, 0], [-90, -70], [-10, -76], [50, -26], [50, 26], [-10, 76], [-90, 70]], true, 6), { fill: PAL.coralD, line: 4.4, seed: 1020, grain: 0.35, shade: [{ pts: [[-140, 20], [60, 20], [60, 90], [-140, 90]], color: PAL.brown, alpha: 0.35 }] });
  ink(ctx, spline([[-80, -30], [-40, -40], [0, -24]], false, 5), 5, { seed: 1021, color: PAL.coralL });
  ctx.restore();
}
// ✓ / ✗ rubber stamp mark
export function mark(ctx, x, y, r, ok, k = 1, seed = 0) {
  if (k <= 0) return;
  const col = ok ? PAL.tealD : PAL.coralD;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(ok ? -0.12 : 0.1);
  shape(ctx, ellipse(0, 0, r, r, 48), { fill: PAL.white, line: 0, seed: 1030 + seed, grain: 0.2, alpha: 0.9 });
  ink(ctx, ellipse(0, 0, r, r, 48), r * 0.12, { closed: true, color: col, seed: 1031 + seed, breaks: 0.15 });
  if (ok) ink(ctx, [[-r * 0.45, 0], [-r * 0.1, r * 0.38], [r * 0.5, -r * 0.4]], r * 0.2, { color: col, seed: 1032 + seed, taper: false });
  else { ink(ctx, [[-r * 0.42, -r * 0.42], [r * 0.42, r * 0.42]], r * 0.2, { color: col, seed: 1033 + seed, taper: false }); ink(ctx, [[r * 0.42, -r * 0.42], [-r * 0.42, r * 0.42]], r * 0.2, { color: col, seed: 1034 + seed, taper: false }); }
  ctx.restore();
}

// Mongol-style iron helmet: a dome with a spike and a fur-trimmed rim. dome up (as worn / as a grill)
export function helmet(ctx, x, y, s = 1, glow = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ink(ctx, [[0, -86], [0, -130]], 10, { seed: 1100, taper: false });
  shape(ctx, ellipse(0, -138, 10, 10, 12), { fill: PAL.mustard, line: 3, seed: 1101, grain: 0 });
  const dome = spline([[-82, 0], [-74, -50], [-40, -84], [0, -92], [40, -84], [74, -50], [82, 0]], false, 6);
  shape(ctx, [...dome, [82, 0]], { fill: PAL.chromeD, line: 4.4, seed: 1102, grain: 0.35, shade: [{ pts: [[20, -100], [100, -100], [100, 4], [30, 4]], color: '#6B7571', alpha: 0.6 }] });
  for (let i = -2; i <= 2; i++) ink(ctx, [[i * 26, -6], [i * 18, -78]], 3, { seed: 1103 + i, color: '#5E6764' });
  shape(ctx, rrect(-96, -14, 192, 26, 12), { fill: PAL.brown, line: 3.8, seed: 1110, grain: 0.5 });
  if (glow) { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = PAL.coral; ctx.beginPath(); ctx.ellipse(0, -40, 70, 40, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
export function fire(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, rrect(-110, -26, 220, 30, 12), { fill: PAL.brown, line: 3.6, seed: 1120, grain: 0.5 });
  shape(ctx, xform(rrect(-100, -16, 200, 28, 12), 0, -24, 0.18), { fill: PAL.brownL, line: 3.6, seed: 1121, grain: 0.5 });
  const f = Math.floor(t * 12);
  const fl = k => { const pts = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8, r = i % 2 ? 0.55 : 1; pts.push([Math.cos(Math.PI + a) * 80 * k * (i % 2 ? 0.8 : 1), -30 - Math.sin(a) * (110 + ((f * 7 + i * 13) % 5) * 9) * k * r]); } return pts; };
  shape(ctx, fl(1), { fill: PAL.coral, line: 3.6, seed: 1122 + (f % 3), grain: 0.2 });
  shape(ctx, fl(0.6), { fill: PAL.mustard, line: 0, seed: 1125, grain: 0.1 });
  ctx.restore();
}
// meat slice (a pink strip with fat line)
export function slice(ctx, x, y, a, s = 1, cooked = 0, col) {
  const c = mixc(col || '#E98F86', '#A8563C', cooked);
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
  shape(ctx, spline([[-40, -10], [0, -16], [40, -10], [42, 8], [0, 14], [-42, 8]], true, 4), { fill: c, line: 3, seed: 1130, grain: 0.2 });
  ink(ctx, [[-34, 2], [34, 0]], 4, { color: PAL.white, seed: 1131, taper: true });
  ctx.restore();
}
// the Thai mookata, side cutaway: clay charcoal pot, moat of soup around a slotted dome
export function mookataSide(ctx, x, y, s = 1, o = {}) {
  const t = o.t || 0, f = Math.floor(t * 12);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(8, 2, 260, 16, 0, 0, TAU); ctx.fill(); ctx.restore();
  // clay pot with coals
  shape(ctx, [[-190, -170], [190, -170], [150, 0], [-150, 0]], { fill: PAL.kraftD, line: 4.4, seed: 1140, grain: 0.5 });
  [-90, 0, 90].forEach((cx, i) => shape(ctx, ellipse(cx, -80, 22, 14, 12), { fill: PAL.ink, line: 0, seed: 1141 + i, grain: 0, off: [0, 0] }));
  [-60, -10, 50, 100, -110].forEach((cx, i) => shape(ctx, ellipse(cx, -150 + (i % 2) * 6, 26, 14, 12), { fill: (f + i) % 3 ? PAL.coral : PAL.mustard, line: 2.5, seed: 1145 + i, grain: 0.2 }));
  // pan: the moat (soup) as a shallow tray, the dome in the middle
  shape(ctx, [[-260, -190], [260, -190], [244, -150], [-244, -150]], { fill: PAL.chrome, line: 4.4, seed: 1150, grain: 0.2 });
  const soup = o.soup || PAL.mustardL;
  shape(ctx, [[-250, -206], [-120, -206], [-120, -188], [-250, -188]], { fill: soup, line: 0, seed: 1151, grain: 0.2, off: [0, 0] });
  shape(ctx, [[120, -206], [250, -206], [250, -188], [120, -188]], { fill: soup, line: 0, seed: 1152, grain: 0.2, off: [0, 0] });
  ink(ctx, [[-262, -212], [-262, -188], [262, -188], [262, -212]], 4.4, { seed: 1153, taper: false });
  // veg + bubbles in the moat
  if (o.veg !== false) { shape(ctx, ellipse(-200, -210, 26, 10, 12, 0, TAU, 0.2), { fill: PAL.avocado, line: 3, seed: 1154, grain: 0.2 }); shape(ctx, ellipse(196, -210, 20, 12, 12), { fill: PAL.white, line: 3, seed: 1155, grain: 0.1 }); }
  for (let i = 0; i < 4; i++) { const bx = [-160, -230, 170, 220][i], ph = (f + i * 3) % 6; if (ph < 4) ink(ctx, ellipse(bx, -214 - ph * 4, 5, 5, 10), 2.5, { closed: true, seed: 1156 + i }); }
  // dome
  const dome = [...spline([[-130, -188], [-118, -260], [-70, -320], [0, -340], [70, -320], [118, -260], [130, -188]], false, 8), [130, -188]];
  shape(ctx, dome, { fill: PAL.chromeD, line: 4.6, seed: 1160, grain: 0.35, shade: [{ pts: [[30, -350], [140, -350], [140, -180], [40, -180]], color: '#6B7571', alpha: 0.6 }] });
  for (let i = -3; i <= 3; i++) ink(ctx, [[i * 34, -196], [i * 20, -318]], 3, { seed: 1165 + i, color: '#5A6360', breaks: 0.3 });
  // meat on the dome
  const ck = o.cooked || 0;
  if (o.meat !== false) [[-70, -282, -0.6], [0, -328, 0], [70, -282, 0.6], [-102, -228, -1.0], [102, -228, 1.0]].forEach(([mx, my, a], i) => slice(ctx, mx, my, a, 0.9, Math.min(1, ck * (1 + i * 0.1))));
  // steam
  if (o.steam) for (let i = 0; i < 3; i++) { const u = ((t * 0.8 + i / 3) % 1); ink(ctx, spline([[-60 + i * 60, -360 - u * 120], [-40 + i * 60, -400 - u * 120], [-60 + i * 60, -440 - u * 120]], false, 6), 6, { seed: 1170 + i, color: PAL.white, alpha: 1 - u }); }
  ctx.restore();
}
// top view: rim, soup moat ring, slotted dome as a starburst pattern, meat radiating
export function mookataTop(ctx, x, y, R, rot = 0, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  shape(ctx, ellipse(0, 0, R, R, 90), { fill: PAL.chrome, line: 5, seed: 1180, grain: 0.2 });
  shape(ctx, ellipse(0, 0, R * 0.9, R * 0.9, 90), { fill: o.soup || PAL.mustardL, line: 3.5, seed: 1181, grain: 0.3 });
  shape(ctx, ellipse(0, 0, R * 0.62, R * 0.62, 90), { fill: PAL.chromeD, line: 4.5, seed: 1182, grain: 0.3 });
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; ink(ctx, [[Math.cos(a) * R * 0.14, Math.sin(a) * R * 0.14], [Math.cos(a) * R * 0.58, Math.sin(a) * R * 0.58]], 3.4, { seed: 1183 + i, color: '#5A6360', taper: true }); }
  shape(ctx, ellipse(0, 0, R * 0.12, R * 0.12, 30), { fill: PAL.ink, line: 0, seed: 1210, grain: 0, off: [0, 0] });
  const n = o.n ?? 8;
  for (let i = 0; i < n; i++) { const a = i / 8 * TAU + 0.2; slice(ctx, Math.cos(a) * R * 0.38, Math.sin(a) * R * 0.38, a, R / 260, o.cooked || 0); }
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; const cx = Math.cos(a) * R * 0.76, cy = Math.sin(a) * R * 0.76;
    if (i % 3 === 0) shape(ctx, ellipse(cx, cy, R * 0.07, R * 0.035, 12, 0, TAU, a), { fill: PAL.avocado, line: 2.5, seed: 1220 + i, grain: 0.2 });
    else if (i % 3 === 1) shape(ctx, ellipse(cx, cy, R * 0.04, R * 0.04, 12), { fill: PAL.white, line: 2.5, seed: 1230 + i, grain: 0.1 });
    else shape(ctx, ellipse(cx, cy, R * 0.045, R * 0.03, 12, 0, TAU, a), { fill: PAL.mustard, line: 2.5, seed: 1240 + i, grain: 0.1 }); }
  ctx.restore();
}
export function sauceBowl(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(6, 2, 150, 12, 0, 0, TAU); ctx.fill(); ctx.restore();
  shape(ctx, spline([[-150, -110], [150, -110], [110, -10], [60, 0], [-60, 0], [-110, -10]], true, 5), { fill: PAL.white, line: 4.4, seed: 1250, grain: 0.15, shade: [{ pts: [[40, -120], [170, -120], [170, 10], [50, 10]], color: PAL.paperD, alpha: 0.7 }] });
  ink(ctx, spline([[-120, -60], [0, -50], [120, -60]], false, 6), 6, { seed: 1251, color: PAL.blue, taper: false });
  shape(ctx, ellipse(0, -110, 150, 26, 40), { fill: PAL.coralD, line: 4, seed: 1252, grain: 0.3 });
  [[-60, -112], [-20, -104], [30, -116], [70, -106], [0, -118], [-90, -108], [100, -112]].forEach(([a, b], i) => shape(ctx, ellipse(a, b, i % 2 ? 6 : 4, 4, 8), { fill: i % 3 ? PAL.mustardL : PAL.white, line: 0, grain: 0, off: [0, 0], seed: 1253 + i }));
  ctx.restore();
}
export function chopHand(ctx, x, y, a, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
  ink(ctx, [[-260, 0], [0, 0]], 34, { seed: 1260, taper: false });
  ink(ctx, [[-260, 3], [-6, 3]], 22, { seed: 1261, taper: false, color: PAL.teal });
  ink(ctx, [[10, -16], [170, -40]], 7, { seed: 1262, taper: false, color: PAL.kraftD });
  ink(ctx, [[10, -4], [172, -22]], 7, { seed: 1263, taper: false, color: PAL.kraftD });
  drawHand(ctx, 0, 0, 0, 'grip', 1, 1.1);
  ctx.restore();
}

export function ship(ctx, x, y, s = 1, seed = 0, t = 0) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 2 + seed) * 6); ctx.scale(s, s); ctx.rotate(Math.sin(t * 1.5 + seed) * 0.02);
  ink(ctx, [[-120, -60], [-120, -300]], 6, { seed: 1400 + seed, taper: false }); ink(ctx, [[20, -60], [20, -340]], 6, { seed: 1401 + seed, taper: false }); ink(ctx, [[140, -60], [140, -260]], 6, { seed: 1402 + seed, taper: false });
  [[-120, -280, 70, 90], [20, -320, 80, 110], [140, -240, 60, 80]].forEach(([mx, my, w, h], i) => shape(ctx, spline([[mx - w, my], [mx + w, my], [mx + w * 0.9, my + h], [mx, my + h * 1.1], [mx - w * 0.9, my + h]], true, 4), { fill: PAL.white, line: 3.4, seed: 1403 + seed + i, grain: 0.15 }));
  shape(ctx, rect(-40, -110, 34, 60), { fill: PAL.ink, line: 0, seed: 1410, grain: 0 });
  shape(ctx, [[-230, -70], [240, -70], [200, 10], [-190, 10]], { fill: PAL.brown, line: 4.4, seed: 1411 + seed, grain: 0.4 });
  ink(ctx, [[-220, -40], [228, -40]], 8, { color: PAL.white, seed: 1412, taper: false });
  for (let i = 0; i < 7; i++) shape(ctx, rect(-170 + i * 52, -50, 18, 14), { fill: PAL.ink, line: 0, seed: 1413, grain: 0, off: [0, 0] });
  shape(ctx, [[20, -340], [80, -326], [20, -312]], { fill: PAL.coral, line: 2.5, seed: 1414, grain: 0 });
  ctx.restore();
}
export function soldier(ctx, x, y, s, col, seed = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, rrect(-16, -70, 32, 56, 12), { fill: col, line: 2.8, seed: 1420 + seed % 7, grain: 0.1 });
  shape(ctx, ellipse(0, -86, 13, 13, 14), { fill: PAL.skin, line: 2.6, seed: 1430 + seed % 5, grain: 0 });
  shape(ctx, rrect(-15, -106, 30, 14, 4), { fill: PAL.ink, line: 0, seed: 1440, grain: 0, off: [0, 0] });
  ink(ctx, [[-8, -14], [-8, 0]], 7, { seed: 1441, taper: false }); ink(ctx, [[8, -14], [8, 0]], 7, { seed: 1442, taper: false });
  ctx.restore();
}
export function cannon(ctx, x, y, s = 1, seed = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, xform(rrect(-70, -18, 150, 36, 16), 0, -60, -0.35), { fill: PAL.inkSoft, line: 3.6, seed: 1450 + seed, grain: 0.3 });
  shape(ctx, ellipse(-10, -30, 30, 30, 20), { fill: PAL.brown, line: 3.6, seed: 1451 + seed, grain: 0.3 });
  ink(ctx, [[-10, -60], [-10, 0]], 3, { seed: 1452 }); ink(ctx, [[-40, -30], [20, -30]], 3, { seed: 1453 });
  ctx.restore();
}
export function tent(ctx, x, y, s, col, seed = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, [[-60, 0], [0, -80], [60, 0]], { fill: col, line: 3.4, seed: 1460 + seed, grain: 0.3 });
  shape(ctx, [[-12, 0], [0, -40], [12, 0]], { fill: PAL.ink, line: 0, seed: 1461, grain: 0, off: [0, 0] });
  ctx.restore();
}
export function halo(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ink(ctx, ellipse(0, 0, 70, 18, 40), 10, { closed: true, color: PAL.mustard, seed: 1470 });
  ctx.restore();
}
export function wing(ctx, x, y, s = 1, flap = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.3 - flap * 0.3);
  shape(ctx, spline([[0, 0], [-60, -90], [-130, -110], [-110, -60], [-140, -40], [-100, -10], [-110, 20]], true, 5), { fill: PAL.white, line: 3.6, seed: 1480, grain: 0.1 });
  ctx.restore();
}

export function cup(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, ellipse(0, 0, 110, 22, 30), { fill: PAL.white, line: 3.6, seed: 1500, grain: 0.1 });
  shape(ctx, spline([[-70, -150], [70, -150], [60, -20], [-60, -20]], true, 4), { fill: PAL.white, line: 4, seed: 1501, grain: 0.1 });
  ink(ctx, spline([[66, -120], [110, -110], [110, -60], [62, -50]], false, 6), 12, { seed: 1502 }); ink(ctx, spline([[66, -120], [108, -110], [108, -60], [62, -50]], false, 6), 5, { seed: 1503, color: PAL.white });
  shape(ctx, ellipse(0, -150, 70, 14, 30), { fill: PAL.brown, line: 3, seed: 1504, grain: 0.2 });
  ink(ctx, [[-60, -100], [60, -100]], 8, { seed: 1505, color: PAL.coral, taper: false });
  ctx.restore();
}
export function toast(ctx, x, y, s = 1, a = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
  shape(ctx, spline([[-80, 60], [-90, -40], [-60, -90], [0, -96], [60, -90], [90, -40], [80, 60]], true, 6), { fill: PAL.kraftD, line: 4, seed: 1510, grain: 0.4 });
  shape(ctx, spline([[-62, 44], [-70, -32], [-46, -70], [0, -76], [46, -70], [70, -32], [62, 44]], true, 6), { fill: PAL.kraftL, line: 0, seed: 1511, grain: 0.4 });
  ctx.restore();
}
export function egg(ctx, x, y, s = 1, seed = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, spline([[-70, 0], [-60, -40], [-10, -56], [50, -40], [74, 0], [40, 40], [-30, 44]], true, 6), { fill: PAL.white, line: 3.6, seed: 1520 + seed, grain: 0.1 });
  shape(ctx, ellipse(4, -4, 26, 24, 20), { fill: PAL.mustard, line: 3.4, seed: 1525 + seed, grain: 0.2 });
  ctx.restore();
}
export function bacon(ctx, x, y, s = 1, a = 0, seed = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
  const top = [], bot = []; for (let i = 0; i <= 12; i++) { const u = i / 12, xx = -120 + u * 240, yy = Math.sin(u * 9 + seed) * 10; top.push([xx, yy - 22]); bot.push([xx, yy + 22]); }
  shape(ctx, [...top, ...bot.reverse()], { fill: '#C8553D', line: 3.6, seed: 1530 + seed, grain: 0.3 });
  const mid = []; for (let i = 0; i <= 12; i++) { const u = i / 12; mid.push([-116 + u * 232, Math.sin(u * 9 + seed) * 10 - 2]); }
  ink(ctx, mid, 9, { seed: 1535 + seed, color: '#F2D6C4', taper: true });
  ctx.restore();
}
export function plate(ctx, x, y, s = 1, seed = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, ellipse(0, 0, 200, 50, 40), { fill: PAL.white, line: 4, seed: 1540 + seed, grain: 0.1 });
  ink(ctx, ellipse(0, -4, 150, 34, 40), 3, { closed: true, seed: 1541, color: PAL.blueL });
  ctx.restore();
}
export function cloche(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, [...spline([[-180, 0], [-160, -110], [-80, -180], [0, -196], [80, -180], [160, -110], [180, 0]], false, 8), [180, 0]], { fill: PAL.chrome, line: 4.6, seed: 1550, grain: 0.2, shade: [{ pts: [[40, -220], [200, -220], [200, 10], [60, 10]], color: PAL.chromeD, alpha: 0.6 }] });
  shape(ctx, ellipse(0, -206, 22, 16, 20), { fill: PAL.chromeD, line: 3.6, seed: 1551, grain: 0 });
  ink(ctx, spline([[-120, -120], [-80, -150], [-40, -164]], false, 6), 8, { seed: 1552, color: PAL.white, taper: true });
  ctx.restore();
}
export function envelope(ctx, x, y, s = 1, mk = null, seed = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, rrect(-60, -40, 120, 80, 6), { fill: mk === 'yes' ? PAL.tealL : PAL.white, line: 3, seed: 1560 + seed % 5, grain: 0.1 });
  ink(ctx, [[-58, -38], [0, 8], [58, -38]], 3, { seed: 1565 + seed % 3 });
  if (mk === 'yes') ink(ctx, [[-18, 6], [-4, 22], [24, -12]], 8, { seed: 1570, color: PAL.tealD, taper: false });
  ctx.restore();
}
export function factory(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, rect(140, -420, 70, 260), { fill: PAL.brownL, line: 4, seed: 1580, grain: 0.4 });
  shape(ctx, [[-260, 0], [-260, -200], [-160, -260], [-160, -200], [-60, -260], [-60, -200], [40, -260], [40, -200], [260, -200], [260, 0]], { fill: PAL.brick || PAL.coralD, line: 4.4, seed: 1581, grain: 0.4 });
  for (let i = 0; i < 4; i++) shape(ctx, rect(-220 + i * 120, -150, 70, 60), { fill: PAL.mustardL, line: 3, seed: 1582 + i, grain: 0.1 });
  shape(ctx, rect(-50, -80, 100, 80), { fill: PAL.inkSoft, line: 3, seed: 1586, grain: 0.2 });
  ctx.restore();
}
export function newspaper(ctx, x, y, s, a, head1, head2) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
  shape(ctx, rect(-330, -420, 660, 840), { fill: '#F4EEDC', line: 4.6, seed: 1590, grain: 0.3 });
  ink(ctx, [[-300, -300], [300, -300]], 5, { seed: 1591, taper: false }); ink(ctx, [[-300, -290], [300, -290]], 2, { seed: 1592, taper: false });
  text(ctx, 'THE DAILY', 0, -330, { font: '44px Slab', fill: PAL.ink, align: 'center' });
  text(ctx, head1, 0, -190, { font: '86px Chonburi', fill: PAL.ink, align: 'center' });
  text(ctx, head2, 0, -80, { font: '78px Chonburi', fill: PAL.coralD, align: 'center' });
  shape(ctx, rect(-300, -20, 280, 220), { fill: PAL.paperD, line: 3, seed: 1593, grain: 0.2 });
  for (let i = 0; i < 9; i++) ink(ctx, [[20, -10 + i * 26], [300, -10 + i * 26]], 3, { seed: 1594 + i, color: PAL.paperDD, taper: false });
  for (let i = 0; i < 6; i++) ink(ctx, [[-300, 240 + i * 26], [300, 240 + i * 26]], 3, { seed: 1604 + i, color: PAL.paperDD, taper: false });
  ctx.restore();
}
export function bush(ctx, x, y, s = 1, rustle = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(rustle * 40) * 0.03 * (rustle > 0 ? 1 : 0));
  shape(ctx, spline([[-200, 0], [-210, -100], [-150, -190], [-60, -230], [40, -220], [130, -190], [200, -110], [210, 0]], true, 6), { fill: PAL.avocado, line: 4.4, seed: 1610, grain: 0.4 });
  for (let i = 0; i < 6; i++) ink(ctx, spline([[-140 + i * 55, -60 - (i % 2) * 50], [-120 + i * 55, -80 - (i % 2) * 50], [-100 + i * 55, -60 - (i % 2) * 50]], false, 4), 3.5, { seed: 1611 + i, color: PAL.avocadoD });
  ctx.restore();
}
