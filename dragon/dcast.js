// Dragons and their ingredients for "ทำไมทั่วโลกมีมังกร", drawn with the Mid-century engine.
import { PAL, shape, ink, ellipse, spline, xform, move, rrect, rect, TAU, clamp, lerp, reg, starPts, text } from './engine/toon.js';
import { bone, mixc } from './cast.js';

const ribbon = (ctx, pts, w, col, seed, stripes) => {
  ink(ctx, pts, w + 9, { seed, taper: false, wob: 0.06 });
  const o = reg(seed, 1);
  ink(ctx, move(pts, o[0] * 0.5, o[1] * 0.5), w, { seed: seed + 1, taper: false, wob: 0.04, color: col });
  if (stripes) for (let i = 4; i < pts.length - 2; i += 5) {
    const a = pts[i - 1], b = pts[i + 1], nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1;
    ink(ctx, [[pts[i][0] + nx / l * w * 0.35, pts[i][1] + ny / l * w * 0.35], [pts[i][0] - nx / l * w * 0.35, pts[i][1] - ny / l * w * 0.35]], 4, { seed: seed + i, color: stripes, taper: false });
  }
};
export const wave = (x0, y0, len, amp, n, ph, k = 40) => { const p = []; for (let i = 0; i <= k; i++) { const u = i / k; p.push([x0 + u * len, y0 + Math.sin(u * n * TAU + ph) * amp * (0.4 + 0.6 * u)]); } return p; };

export function flame(ctx, x, y, a, len, t, seed = 0) {
  const f = Math.floor(t * 12);
  const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10, r = Math.sin(u * Math.PI) * len * 0.22 * (1 + 0.25 * ((f * 7 + i * 3 + seed) % 3)); pts.push([u * len, -r]); }
  for (let i = 10; i >= 0; i--) { const u = i / 10, r = Math.sin(u * Math.PI) * len * 0.22 * (1 + 0.2 * ((f * 5 + i * 7 + seed) % 3)); pts.push([u * len, r]); }
  shape(ctx, xform(pts, x, y, a), { fill: PAL.coral, line: 3.6, seed: 2000 + seed + (f % 3), grain: 0.2 });
  shape(ctx, xform(pts.map(([px, py]) => [px * 0.7, py * 0.5]), x, y, a), { fill: PAL.mustard, line: 0, seed: 2005, grain: 0.1 });
}
// Western dragon, side view facing +x: heavy body, bat wings, horns, spade tail, breathes fire
export function dragonWest(ctx, x, y, s = 1, t = 0, o = {}) {
  const col = o.col || PAL.avocado, colD = PAL.avocadoD;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.dir || 1), s);
  ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(0, 4, 230, 16, 0, 0, TAU); ctx.fill(); ctx.restore();
  const flap = Math.sin(Math.floor(t * 12) / 12 * 5) * 0.2;
  // far wing
  shape(ctx, xform([[0, 0], [-60, -220], [40, -180], [90, -250], [150, -150], [200, -170], [150, -20]], -20, -170, -0.3 + flap), { fill: PAL.plum, line: 4, seed: 2010, grain: 0.3 });
  ribbon(ctx, spline([[-120, -110], [-220, -80], [-280, -140], [-330, -100]], false, 8), 30, col, 2011);
  shape(ctx, xform([[0, -24], [40, 0], [0, 24], [-12, 0]], -330, -100, 0.6), { fill: col, line: 3.6, seed: 2012, grain: 0.2 });
  [[-90, 1], [80, 0]].forEach(([lx], i) => { ink(ctx, [[lx, -90], [lx + 10, -6]], 34, { seed: 2013 + i, taper: false }); ink(ctx, [[lx + 2, -88], [lx + 12, -8]], 24, { seed: 2015 + i, taper: false, color: colD }); });
  shape(ctx, spline([[-160, -120], [-100, -200], [40, -210], [140, -160], [150, -90], [40, -60], [-120, -70]], true, 8), { fill: col, line: 4.4, seed: 2017, grain: 0.35, shade: [{ pts: [[-200, -110], [200, -110], [200, -40], [-200, -40]], color: PAL.mustardL, alpha: 0.6 }] });
  ribbon(ctx, spline([[110, -170], [170, -250], [210, -300]], false, 8), 46, col, 2018);
  shape(ctx, spline([[180, -330], [260, -330], [300, -300], [292, -280], [210, -270], [178, -296]], true, 6), { fill: col, line: 4.2, seed: 2019, grain: 0.3 });
  [[200, -330, 180, -380], [226, -332, 216, -386]].forEach(([a, b, c, d], i) => shape(ctx, [[a - 8, b], [c, d], [a + 10, b]], { fill: PAL.white, line: 3, seed: 2020 + i, grain: 0 }));
  shape(ctx, ellipse(236, -310, 7, 8, 12), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
  for (let i = 0; i < 6; i++) shape(ctx, [[-120 + i * 45, -196 + Math.abs(i - 2.5) * 4], [-100 + i * 45, -236], [-80 + i * 45, -200]], { fill: PAL.coral, line: 3, seed: 2022 + i, grain: 0.2 });
  // near wing
  shape(ctx, xform([[0, 0], [-70, -240], [30, -200], [80, -270], [150, -170], [210, -190], [160, -30]], 0, -160, -0.15 - flap), { fill: PAL.plum, line: 4.2, seed: 2030, grain: 0.3, shade: [{ pts: xform([[0, 0], [-70, -240], [30, -200]], 0, -160, -0.15 - flap), color: '#523650', alpha: 0.6 }] });
  if (o.fire) flame(ctx, 300, -290, -0.1, 260 * o.fire, t, 1);
  ctx.restore();
}
// Eastern dragon: a long serpentine ribbon with a maned head and whiskers; brings rain
export function dragonEast(ctx, x, y, s = 1, t = 0, o = {}) {
  const col = o.col || PAL.coral;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const ph = Math.floor(t * 12) / 12 * 3;
  const body = wave(-320, 0, 560, 70, 1.4, ph, 60);
  ribbon(ctx, body, 54, col, 2040, PAL.mustard);
  const head = body[body.length - 1];
  [[-200, 1], [0, -1]].forEach(([bx], i) => { const p = body[Math.round((bx + 320) / 560 * 60)]; ink(ctx, [[p[0], p[1] + 20], [p[0] - 10, p[1] + 70]], 14, { seed: 2045 + i, taper: false }); });
  ctx.save(); ctx.translate(head[0], head[1]);
  shape(ctx, spline([[-40, -60], [-10, -90], [-60, -110], [-20, -130], [-80, -120], [-70, -60]], true, 4), { fill: PAL.mustard, line: 3.4, seed: 2050, grain: 0.3 });
  shape(ctx, spline([[-40, -40], [30, -60], [90, -40], [100, -10], [60, 10], [-30, 20]], true, 6), { fill: col, line: 4.2, seed: 2051, grain: 0.3 });
  shape(ctx, [[-10, -54], [-40, -110], [6, -60]], { fill: PAL.white, line: 3, seed: 2052, grain: 0 });
  shape(ctx, ellipse(40, -34, 7, 8, 12), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
  ink(ctx, spline([[90, -14], [140, -30], [170, 0], [200, -16]], false, 6), 4, { seed: 2053 });
  ink(ctx, spline([[86, 0], [130, 20], [160, 6], [196, 30]], false, 6), 4, { seed: 2054 });
  ctx.restore();
  ctx.restore();
}
export function cloud(ctx, x, y, s = 1, col = PAL.white, seed = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, spline([[-160, 0], [-170, -50], [-110, -90], [-40, -120], [40, -110], [110, -80], [170, -40], [160, 0]], true, 6), { fill: col, line: 4, seed: 2060 + seed, grain: 0.2 });
  ctx.restore();
}
export function rain(ctx, x, y, w, h, t, col = PAL.blueD) {
  const f = Math.floor(t * 12);
  for (let i = 0; i < 14; i++) { const rx = x + (i * 53) % w, ry = y + ((i * 97 + f * 30) % h); ink(ctx, [[rx, ry], [rx - 8, ry + 26]], 4, { seed: 2070 + i, color: col, taper: false }); }
}
// Mesoamerican-style feathered serpent (our own design): green snake with a crest of feathers
export function featheredSerpent(ctx, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const ph = Math.floor(t * 12) / 12 * 4;
  const body = wave(-260, 0, 440, 50, 1.6, ph, 50);
  ribbon(ctx, body, 42, PAL.teal, 2080, PAL.tealL);
  const h = body[body.length - 1];
  for (let i = 0; i < 7; i++) { const a = -2.4 + i * 0.32; shape(ctx, xform(ellipse(0, -40, 13, 42, 14), h[0] - 20, h[1] - 10, a), { fill: i % 2 ? PAL.mustard : PAL.coral, line: 3, seed: 2085 + i, grain: 0.2 }); }
  shape(ctx, spline([[h[0] - 30, h[1] - 26], [h[0] + 40, h[1] - 30], [h[0] + 70, h[1] - 6], [h[0] + 40, h[1] + 18], [h[0] - 30, h[1] + 20]], true, 6), { fill: PAL.teal, line: 4, seed: 2095, grain: 0.3 });
  shape(ctx, ellipse(h[0] + 24, h[1] - 10, 6, 7, 12), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
  ink(ctx, [[h[0] + 68, h[1]], [h[0] + 96, h[1] - 6], [h[0] + 104, h[1] + 4]], 3.5, { seed: 2096, color: PAL.coralD });
  ctx.restore();
}
// the three animals our ancestors feared
export function snake(ctx, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const body = wave(-150, 20, 260, 40, 1.5, Math.floor(t * 12) / 12 * 4, 40);
  ribbon(ctx, body, 36, PAL.avocado, 2100, PAL.avocadoD);
  const h = body[body.length - 1];
  shape(ctx, ellipse(h[0] + 14, h[1], 34, 24, 20), { fill: PAL.avocado, line: 4, seed: 2105, grain: 0.3 });
  shape(ctx, ellipse(h[0] + 22, h[1] - 8, 5, 6, 10), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
  ink(ctx, [[h[0] + 46, h[1] + 4], [h[0] + 72, h[1]], [h[0] + 80, h[1] + 10]], 3.5, { seed: 2106, color: PAL.coralD });
  ctx.restore();
}
export function tigerHead(ctx, x, y, s = 1, roar = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  [[-80, -80], [80, -80]].forEach(([ex, ey], i) => shape(ctx, ellipse(ex, ey, 34, 34, 18), { fill: PAL.mustardD, line: 4, seed: 2110 + i, grain: 0.3 }));
  shape(ctx, spline([[-120, -20], [-90, -100], [0, -120], [90, -100], [120, -20], [80, 70], [0, 90], [-80, 70]], true, 6), { fill: PAL.mustard, line: 4.4, seed: 2112, grain: 0.35 });
  [[-100, -40], [100, -40], [-90, 10], [90, 10], [0, -110]].forEach(([sx, sy], i) => ink(ctx, i < 4 ? [[sx, sy], [sx * 0.7, sy + 10]] : [[0, -116], [0, -80]], 9, { seed: 2113 + i, color: PAL.ink, taper: true }));
  [-40, 40].forEach((ex, i) => shape(ctx, ellipse(ex, -30, 9, 11, 12), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] }));
  shape(ctx, ellipse(0, 30, 60, 44, 24), { fill: PAL.white, line: 3.4, seed: 2120, grain: 0.1 });
  shape(ctx, [[-16, 6], [16, 6], [0, 22]], { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
  const m = 20 + roar * 40;
  shape(ctx, spline([[-36, 44], [36, 44], [24, 44 + m], [-24, 44 + m]], true, 4), { fill: PAL.coralD, line: 3.6, seed: 2121, grain: 0 });
  [[-26, 44], [26, 44]].forEach(([fx, fy], i) => shape(ctx, [[fx - 8, fy], [fx + 8, fy], [fx, fy + 22 + roar * 10]], { fill: PAL.white, line: 2.6, seed: 2122 + i, grain: 0 }));
  ctx.restore();
}
export function eagleWing(ctx, x, y, s = 1, a = 0, flip = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * flip, s); ctx.rotate(a);
  shape(ctx, spline([[0, 0], [60, -80], [180, -130], [300, -120], [280, -80], [320, -60], [270, -30], [300, 0], [230, 10], [250, 40], [160, 30], [60, 40]], true, 5), { fill: PAL.brown, line: 4.2, seed: 2130, grain: 0.4 });
  for (let i = 0; i < 4; i++) ink(ctx, [[120 + i * 40, -70 + i * 6], [190 + i * 30, 10 + i * 4]], 3.5, { seed: 2131 + i, color: PAL.brownL });
  ctx.restore();
}
export function eagle(ctx, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const fl = Math.sin(Math.floor(t * 12) / 12 * 7) * 0.25;
  eagleWing(ctx, -20, -10, 0.6, -0.3 - fl, -1); eagleWing(ctx, 20, -10, 0.6, -0.3 - fl, 1);
  shape(ctx, ellipse(0, 20, 40, 60, 20), { fill: PAL.brown, line: 4, seed: 2140, grain: 0.3 });
  shape(ctx, ellipse(0, -50, 34, 32, 20), { fill: PAL.white, line: 4, seed: 2141, grain: 0.1 });
  shape(ctx, [[12, -56], [48, -46], [18, -30]], { fill: PAL.mustard, line: 3, seed: 2142, grain: 0 });
  shape(ctx, ellipse(4, -58, 5, 6, 10), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
  ctx.restore();
}
// the assembled dragon: snake body + tiger head + eagle wings, each part placed by k (0 away → 1 in place)
export function chimera(ctx, x, y, s, t, k = [1, 1, 1], from = []) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const P = (i, px, py) => { const f = from[i] || [px, py]; return [lerp(f[0], px, k[i]), lerp(f[1], py, k[i])]; };
  const w = P(2, 0, -150);
  if (k[2] > 0) { eagleWing(ctx, w[0] - 30, w[1], 1.0, 0.1 - Math.sin(Math.floor(t * 12) / 12 * 5) * 0.2, -1); }
  const b = P(0, 0, 0);
  if (k[0] > 0) { const body = wave(b[0] - 360, b[1], 620, 80, 1.3, Math.floor(t * 12) / 12 * 3, 60); ribbon(ctx, body, 70, PAL.avocado, 2150, PAL.avocadoD); }
  if (k[2] > 0) { eagleWing(ctx, w[0] + 30, w[1] + 20, 1.05, 0.15 - Math.sin(Math.floor(t * 12) / 12 * 5 + 1) * 0.2, 1); }
  const h = P(1, 300, -40);
  if (k[1] > 0) tigerHead(ctx, h[0], h[1], 0.9, 0.5 + 0.5 * Math.sin(Math.floor(t * 12) / 2));
  ctx.restore();
}
// a dragon skeleton laid out in the earth: vertebrae along a curve, ribs, a long skull
export function skeleton(ctx, x, y, s, u = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const sp = wave(-360, 0, 640, 60, 1.2, 0.6, 30);
  const n = Math.round(sp.length * u);
  for (let i = 0; i < n; i++) { const [px, py] = sp[i]; shape(ctx, ellipse(px, py, 14, 18, 12), { fill: PAL.white, line: 3, seed: 2160 + i % 5, grain: 0 });
    if (i > 6 && i < 20 && i % 2 === 0) { ink(ctx, spline([[px, py], [px - 20, py + 50], [px - 4, py + 90]], false, 4), 6, { seed: 2170 + i, color: PAL.white }); ink(ctx, spline([[px, py], [px - 20, py + 50], [px - 4, py + 90]], false, 4), 2.4, { seed: 2190 + i }); } }
  if (u >= 1) { const h = sp[sp.length - 1]; shape(ctx, [[h[0] - 10, h[1] - 30], [h[0] + 130, h[1] - 10], [h[0] + 120, h[1] + 20], [h[0] - 10, h[1] + 30]], { fill: PAL.white, line: 3.6, seed: 2200, grain: 0 });
    shape(ctx, ellipse(h[0] + 30, h[1] - 6, 10, 10, 12), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
    for (let i = 0; i < 5; i++) shape(ctx, [[h[0] + 40 + i * 18, h[1] + 18], [h[0] + 48 + i * 18, h[1] + 34], [h[0] + 56 + i * 18, h[1] + 18]], { fill: PAL.white, line: 2, seed: 2201, grain: 0 }); }
  ctx.restore();
}
export function jar(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, spline([[-90, 0], [-110, -120], [-70, -200], [70, -200], [110, -120], [90, 0]], true, 6), { fill: PAL.blueL, line: 4.4, seed: 2210, grain: 0.3 });
  shape(ctx, rrect(-80, -240, 160, 46, 12), { fill: PAL.brown, line: 4, seed: 2211, grain: 0.4 });
  shape(ctx, rrect(-80, -150, 160, 90, 8), { fill: PAL.white, line: 3.4, seed: 2212, grain: 0.1 });
  ctx.restore();
}
export function bolt(ctx, x, y, s = 1, seed = 0) {
  shape(ctx, xform([[0, 0], [40, 0], [20, 60], [50, 60], [-10, 170], [6, 90], [-24, 90]], x, y, 0, s), { fill: PAL.mustardL, line: 4, seed: 2220 + seed, grain: 0 });
}
export function waves(ctx, x0, y, w, t, col = PAL.blue) {
  const f = Math.floor(t * 12);
  for (let r = 0; r < 3; r++) { const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([x0 + u * w, y + r * 50 + Math.sin(u * 14 + f * 0.6 + r) * 18]); }
    pts.push([x0 + w, y + 400], [x0, y + 400]); shape(ctx, pts, { fill: r ? mixc(col, PAL.blueD, r * 0.4) : col, line: 4, seed: 2230 + r, grain: 0.2 }); }
}
