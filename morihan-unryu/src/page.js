
// ---------- Thai-aware lettering: a "character" is a grapheme cluster (base + marks above/below, + sara am) ----------
const CLUSTER = /[^ัิ-ฺ็-๎ำ][ัิ-ฺ็-๎]*ำ?|[ัิ-ฺ็-๎ำ]/gu;
const clusters = s => s.match(CLUSTER) || [];

// ---------- extra parts ----------
const VO_START = { v1: 0.35, v2: 4.15, v3: 8.0, v4: 12.4, v5: 16.3, v6: 19.7, v7: 22.75, v8: 27.9 };
function rectP(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
function outlineRect(x0, y0, x1, y1, o, t0, d) { const P = rectP(x0, y0, x1, y1); return PEN(P.concat([P[0], [P[1][0] - 4, P[1][1] + 1]]), { w: o.w ?? 2.0, smooth: false, ta: 0.04, tb: 0.04, wob: 0.5, layer: o.layer, p: o.p }, t0, d); }
function band(path, w0, w1) {   // a thick body around a path (dragon body), tapering w0 → w1
  const N = path.length, A = [], B = [];
  for (let i = 0; i < N; i++) { const a = path[Math.max(0, i - 1)], b = path[Math.min(N - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, w = lerp(w0, w1, i / (N - 1)) * Math.sin(Math.PI / 2 * Math.min(1, (i / (N - 1)) * 8 + 0.2)) ** 0.5;
    A.push([path[i][0] + nx * w, path[i][1] + ny * w]); B.push([path[i][0] - nx * w, path[i][1] - ny * w]); }
  return A.concat(B.reverse());
}

let IMG = null;
const CUE = {}; let VOC = null, CAM = [], DYN = [], SFX = [];
function buildPage() {
  R = mulberry(20261121);

  // ================= A · the hook: "มังกรเมฆ?" (0–3.7 s) =================
  PEN([[140, 238], [700, 236]], { layer: 'light', w: 1.3, p: 0.5 }, 0.05, 0.12);            // a construction baseline
  TXT('มังกรเมฆ?', 150, 226, 116, { f: 'IT', k: 0.8, jit: 0.4 }, 0.3, 1.25);
  PEN([[150, 262], [380, 256], [640, 264]], { layer: 'coral', w: 5.2, ta: 0.06, tb: 0.25, wob: 1.0 }, 1.6, 0.18);
  TXT('雲龍', 790, 222, 112, { f: 'ZK', k: 0.8, jit: 0.3 }, 1.85, 0.5);
  // the cloud dragon, in one stroke: a sinuous body with cloud curls
  const DR = [];
  for (let i = 0; i <= 360; i++) { const s = i / 360, x = 150 + 900 * s, y = 455 - 50 * s + 52 * Math.sin(TAU * 1.25 * s + 0.4), r = 24 * (1 - 0.5 * s);
    DR.push([x + r * Math.cos(TAU * 7 * s + Math.PI), y + r * 0.9 * Math.sin(TAU * 7 * s + Math.PI)]); }
  const dragon = PEN(DR, { w: 2.6, ta: 0.04, tb: 0.05, wob: 0.6, smooth: false }, 2.55, 0.95);
  const hx = DR[360][0], hy = DR[360][1];
  const head = [[hx - 10, hy - 6], [hx + 30, hy - 34], [hx + 78, hy - 30], [hx + 104, hy - 8], [hx + 80, hy + 14], [hx + 30, hy + 22], [hx - 6, hy + 10]];
  PEN(head.concat([head[0]]), { w: 2.4, ta: 0.05, tb: 0.08 }, 3.52, 0.2);
  PEN([[hx + 40, hy - 30], [hx + 30, hy - 66], [hx + 52, hy - 88]], { w: 2.0, ta: 0.1, tb: 0.4 }, 3.74, 0.08);          // horn
  PEN([[hx + 98, hy + 2], [hx + 140, hy + 18], [hx + 128, hy + 46], [hx + 108, hy + 40]], { w: 1.6, ta: 0.1, tb: 0.5, p: 0.8 }, 3.84, 0.1);   // whisker
  PEN(ell(hx + 56, hy - 12, 5, 4, 0, 0, TAU, 10), { w: 2.6 }, 3.96, 0.04);              // eye
  const body = band(DR.filter((_, i) => i % 3 === 0), 30, 14);
  const headPoly = head;
  BLOB(body, C.cloud, { dx: 8, dy: 6, a: 0.8, amp: 2.5, ang: -0.2, sp: 14, stop: 0.55 }, 4.02, 0.28);   // pale, half coloured: still drawing
  CUE.dragon = { body, headPoly };

  // ================= B · the can: Morihan, Uji (3.9–7.4 s) =================
  const cx = 300, rx = 165, ry = 40, yT = 650, yB = 1130, lab0 = 815, lab1 = 1062;
  PEN([[cx, 590], [cx, 1190]], { layer: 'light', w: 1.2, p: 0.45 }, 4.45, 0.08);
  PEN(ell(cx, yT, rx, ry, 0, 2.6, 2.6 + TAU * 1.03, 60), { w: 2.8, ta: 0.04, tb: 0.06 }, 4.55, 0.24);
  PEN(ell(cx, 735, rx, ry, 0, 0.05, Math.PI - 0.05, 40), { w: 2.0, p: 0.85 }, 4.81, 0.1);         // lid edge
  PEN([[cx - rx, yT], [cx - rx + 1, (yT + yB) / 2], [cx - rx, yB]], { w: 2.8, ta: 0.03, tb: 0.08 }, 4.93, 0.12);
  PEN([[cx + rx, yT], [cx + rx - 1, (yT + yB) / 2], [cx + rx, yB]], { w: 2.8, ta: 0.03, tb: 0.08 }, 5.07, 0.12);
  PEN(ell(cx, yB, rx, ry, 0, 0.02, Math.PI - 0.02, 40), { w: 2.8, ta: 0.05, tb: 0.05 }, 5.21, 0.12);
  PEN(ell(cx, lab0, rx, ry, 0, 0.05, Math.PI - 0.05, 40), { w: 1.8, p: 0.8 }, 5.35, 0.08);
  PEN(ell(cx, lab1, rx, ry, 0, 0.05, Math.PI - 0.05, 40), { w: 1.8, p: 0.8 }, 5.45, 0.08);
  const sil = ell(cx, yT, rx, ry, 0, Math.PI, TAU, 30).concat(ell(cx, yB, rx, ry, 0, 0, Math.PI, 30));
  const label = ell(cx, lab0, rx - 2, ry, 0, Math.PI, 0, 30).concat(ell(cx, lab1, rx - 2, ry, 0, 0, Math.PI, 30));
  const shine = rectP(cx - 128, 750, cx - 112, 805), shine2 = rectP(cx - 128, 1075, cx - 112, 1120);
  BLOB(sil, C.can, { dx: 8, dy: 6, a: 0.94, amp: 2, ang: -0.35, sp: 12, holes: [label, shine, shine2] }, 5.55, 0.3);
  BLOB(ell(cx, yT, rx - 4, ry - 4, 0, 0, TAU, 40), C.canTop, { dx: 8, dy: 6, a: 0.5, amp: 1.5, ang: -0.2, sp: 10, holes: [ell(cx - 60, yT - 8, 50, 9, -0.1, 0, TAU, 16)] }, 5.86, 0.08);
  TXT('morihan', 238, 866, 40, { f: 'CB', k: 0.8 }, 5.96, 0.2);
  const un = TXT('Unryu', 186, 978, 98, { f: 'CB', k: 0.82, jit: 0.4 }, 6.18, 0.42);
  BLOB(rectP(180, 922, 428, 990), C.mustard, { dx: 10, dy: 8, a: 0.85, amp: 2.4, ang: -0.12, sp: 12 }, 6.62, 0.14);
  TXT('30 g.', 274, 1036, 34, { f: 'CB', k: 0.8 }, 6.78, 0.1);
  PEN([[476, 742], [520, 728], [560, 712]], { w: 1.8, ta: 0.1, tb: 0.3, p: 0.85 }, 6.9, 0.07);
  TXT('Morihan - อุจิ, เกียวโต', 572, 718, 52, { f: 'IT', k: 0.78 }, 6.98, 0.5);
  TXT('แบรนด์ชาเก่าแก่ของญี่ปุ่น', 580, 786, 42, { f: 'IT', k: 0.74 }, 7.5, 0.42);
  // v3 starts with the grade
  TXT('Ceremonial grade', 578, 892, 60, { f: 'CB', k: 0.82 }, 7.95, 0.36);
  TXT('มัทฉะเกรดพิธีการ', 582, 958, 48, { f: 'IT', k: 0.76 }, 8.33, 0.36);
  PEN(ell(758, 872, 196, 44, -0.03, 3.6, 3.6 + TAU * 1.04, 50), { layer: 'coral', w: 3.6, ta: 0.08, tb: 0.15, wob: 1 }, 8.71, 0.2);
  TXT('มัทฉะ 99% + น้ำตาล 1%', 582, 1046, 38, { f: 'IT', k: 0.66 }, 8.93, 0.32);
  TXT('(ช่วยไม่ให้จับตัวเป็นก้อน)', 582, 1096, 34, { f: 'IT', k: 0.6 }, 9.25, 0.32);

  // ================= C · the leaf under shade, the stone mill (8.9–15.4 s) =================
  PEN([[160, 1640], [158, 1300]], { w: 2.4, ta: 0.04, tb: 0.04 }, 9.6, 0.1);
  PEN([[570, 1640], [572, 1300]], { w: 2.4, ta: 0.04, tb: 0.04 }, 9.72, 0.1);
  const net = bez([140, 1298], [280, 1336], [450, 1336], [592, 1298], 30);
  PEN(net, { w: 2.4, ta: 0.04, tb: 0.06 }, 9.84, 0.14);
  for (let k = 0; k < 9; k++) { const x = 175 + k * 46; PEN([[x, 1292 + 8 * Math.sin(k)], [x + 26, 1326 - 3 * Math.cos(k)]], { layer: 'light', w: 1.4, p: 0.6, wob: 0.2 }, 9.99 + k * 0.02, 0.02); }
  BLOB(net.concat([[592, 1284], [140, 1284]]), '#8a8f86', { dx: 5, dy: 4, a: 0.55, amp: 1.5, ang: 0, sp: 8 }, 10.2, 0.08);
  const bushTop = []; for (let i = 0; i <= 50; i++) { const a = Math.PI + Math.PI * i / 50, r = 1 + 0.07 * Math.abs(Math.sin(a * 6)); bushTop.push([365 + 205 * Math.cos(a) * r, 1640 + 150 * Math.sin(a) * r]); }
  PEN(bushTop, { w: 2.6, ta: 0.05, tb: 0.06 }, 10.3, 0.26);
  PEN([[150, 1642], [365, 1646], [582, 1640]], { w: 2.2, ta: 0.05, tb: 0.1 }, 10.58, 0.08);
  const L1 = leafParts(300, 1610, -0.85, 215, 56, 0.1);
  drawLeaf(L1, 10.68, 0.38);
  BLOB(bushTop.concat([[580, 1642], [150, 1642]]), C.bush, { dx: 8, dy: 6, a: 0.85, amp: 2.2, ang: -0.4, sp: 12, cuts: [L1.outline], stop: 0.72 }, 11.08, 0.18);
  const leafBlob = BLOB(L1.outline, C.leaf, { dx: 7, dy: 5, a: 0.92, amp: 1.4, ang: -0.9, sp: 8 }, 11.28, 0.14);
  BLOB(L1.half, C.leafDk, { dx: 7, dy: 5, a: 0.42, amp: 1.2, ang: -0.9, sp: 7 }, 11.43, 0.06);
  TXT('First flush', 160, 1252, 56, { f: 'CB', k: 0.82, layer: 'coral' }, 11.5, 0.3);
  TXT('- ปลูกใต้ร่มเงา', 432, 1252, 42, { f: 'IT', k: 0.76 }, 11.82, 0.3);
  TXT('ใบชาเก็บแรกของฤดู', 262, 1712, 46, { f: 'IT', k: 0.76 }, 12.14, 0.32);
  // the stone mill (v4 at 11.2)
  const mx = 960;
  PEN([[mx, 1270], [mx, 1660]], { layer: 'light', w: 1.2, p: 0.45 }, 12.5, 0.05);
  PEN(ell(mx, 1330, 150, 32, 0, 2.8, 2.8 + TAU * 1.03, 50), { w: 2.7, ta: 0.04, tb: 0.06 }, 12.56, 0.14);
  PEN(ell(mx - 30, 1330, 18, 7, 0, 0, TAU * 1.05, 16), { w: 2.0 }, 12.71, 0.04);
  PEN([[mx - 150, 1330], [mx - 150, 1430]], { w: 2.7 }, 12.76, 0.05); PEN([[mx + 150, 1330], [mx + 150, 1430]], { w: 2.7 }, 12.82, 0.05);
  PEN(ell(mx, 1430, 150, 32, 0, 0.02, Math.PI - 0.02, 30), { w: 2.6 }, 12.88, 0.06);
  PEN([[mx - 175, 1452], [mx - 175, 1545]], { w: 2.7 }, 12.95, 0.05); PEN([[mx + 175, 1452], [mx + 175, 1545]], { w: 2.7 }, 13.01, 0.05);
  PEN(ell(mx, 1450, 175, 34, 0, -0.05, Math.PI + 0.05, 30), { w: 2.2, p: 0.85 }, 13.07, 0.05);
  PEN(ell(mx, 1545, 175, 36, 0, 0.02, Math.PI - 0.02, 30), { w: 2.6 }, 13.13, 0.06);
  PEN(ell(mx, 1600, 232, 50, 0, 0.1, Math.PI - 0.1, 40), { w: 2.6, ta: 0.05, tb: 0.05 }, 13.2, 0.08);
  PEN([[mx + 150, 1390], [mx + 236, 1392]], { w: 2.6 }, 13.29, 0.05); PEN([[mx + 236, 1392], [mx + 238, 1318]], { w: 2.6 }, 13.35, 0.05);
  for (let k = 0; k < 5; k++) PEN([[mx - 120 + k * 60, 1352 + (k % 2) * 6], [mx - 104 + k * 60, 1418]], { layer: 'light', w: 1.3, p: 0.6 }, 13.41 + k * 0.012, 0.012);
  const upper = ell(mx, 1330, 150, 32, 0, Math.PI, TAU, 24).concat(ell(mx, 1430, 150, 32, 0, 0, Math.PI, 24));
  const lower = ell(mx, 1450, 175, 34, 0, Math.PI, TAU, 24).concat(ell(mx, 1545, 175, 36, 0, 0, Math.PI, 24));
  BLOB(lower, '#a49c8f', { dx: 8, dy: 6, a: 0.8, amp: 2, ang: -0.3, sp: 12, cuts: [upper] }, 13.5, 0.1);
  BLOB(upper, C.stone, { dx: 8, dy: 6, a: 0.8, amp: 2, ang: -0.3, sp: 12, holes: [ell(mx - 30, 1330, 18, 7, 0, 0, TAU, 12)], stop: 0.8 }, 13.6, 0.1);
  BLOB(rectP(mx + 150, 1384, mx + 240, 1398).concat([[mx + 240, 1318], [mx + 230, 1318]]), C.wood, { dx: 5, dy: 4, a: 0.9, amp: 1, ang: 0, sp: 6 }, 13.7, 0.04);
  TXT('โม่ด้วยครกหิน', 730, 1262, 46, { f: 'IT', k: 0.76 }, 13.76, 0.3);
  // near-silence 14.1–14.9: the push into the mill; the shatter at 14.9 (the leaf's colour leaves as chips)
  const SH = 14.9;
  OCC(L1.outline.map(([x, y]) => [x + 7, y + 5]), SH, [], true);
  OCC(L1.outline, SH, [], true);
  const chips = [], [la, lb, lc, ld] = bbox(L1.outline);
  for (let i = 0; i < 150; i++) {
    let x, y, k = 0; do { x = rnd(la, lc); y = rnd(lb, ld); k++; } while (k < 30 && !inPoly(L1.outline, x, y));
    const n = 5 + (rnd() * 3 | 0), shape = []; for (let j = 0; j < n; j++) shape.push([TAU * j / n + rnd(-0.3, 0.3), rnd(0.6, 1.1)]);
    chips.push({ sx: x, sy: y, ob: Math.atan2(y - 1500, x - 320) + rnd(-0.6, 0.6), bl: rnd(10, 40), tb: SH + rnd(0, 0.2), T: rnd(0.55, 0.8),
      cx: lerp(x, mx - 30, 0.5) + rnd(-40, 60), cy: 1200 + rnd(-50, 50), s: rnd(6, 12), shape, rot: rnd(0, TAU), spin: rnd(-8, 8),
      col: [C.leaf, C.leafDk, C.matcha, '#9cc06a', '#6f9a4c'][i % 5] });
  }
  const chipAt = (q, t) => { const p = t - q.tb; if (p < 0) return null;
    if (p < 0.18) { const e = eo(p / 0.18); return [q.sx + Math.cos(q.ob) * q.bl * e, q.sy + Math.sin(q.ob) * q.bl * e, 1, q.rot]; }
    const u = (p - 0.18) / q.T; if (u > 1) return null; const e = Math.pow(u, 1.3), bx = q.sx + Math.cos(q.ob) * q.bl, by = q.sy + Math.sin(q.ob) * q.bl;
    return [(1 - e) ** 2 * bx + 2 * (1 - e) * e * q.cx + e * e * (mx - 30), (1 - e) ** 2 * by + 2 * (1 - e) * e * q.cy + e * e * 1330, u > 0.85 ? (1 - u) / 0.15 : 1, q.rot + q.spin * p]; };
  DYN.push({ t0: SH, t1: SH + 1.5, draw(t, c) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    for (const q of chips) { const s = chipAt(q, t); if (!s) continue; const [X, Y] = toScreen(c, s[0], s[1]), r = q.s * c.z * s[2];
      ctx.beginPath(); q.shape.forEach(([a, k], j) => { const x = X + Math.cos(a + s[3] + c.r) * r * k, y = Y + Math.sin(a + s[3] + c.r) * r * k; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
      ctx.fillStyle = q.col; ctx.globalAlpha = 0.92; ctx.fill(); }
    ctx.restore(); } });
  // ground: the powder comes out on the tray
  const pile = ell(mx + 120, 1612, 70, 26, 0, Math.PI, TAU, 20).concat([[mx + 190, 1618], [mx + 50, 1618]]);
  const ring = ell(mx, 1600, 226, 46, 0, 0.12, Math.PI - 0.12, 30).concat(ell(mx, 1560, 182, 30, 0, Math.PI - 0.2, 0.2, 30));
  BLOB(ring, C.matcha, { dx: 5, dy: 4, a: 0.9, amp: 2, ang: 0.1, sp: 7, cuts: [lower] }, 15.6, 0.22);
  PEN(ell(mx + 120, 1612, 70, 26, 0, Math.PI + 0.1, TAU - 0.1, 20), { w: 2.2, ta: 0.1, tb: 0.1 }, 15.84, 0.08);
  BLOB(pile, C.matchaDk, { dx: 6, dy: 4, a: 0.9, amp: 1.5, ang: 0, sp: 7 }, 15.94, 0.1);
  SFX.push({ t: 13.25, type: 'grind', d: 1.4, pan: 0.3 }, { t: SH, type: 'shatter', d: 1.3, pan: -0.1 });

  // ================= D · the taste (15.4–21.8 s) =================
  const fx = 214, fy = 1878;
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + TAU * k / 5; circleStroke(fx + Math.cos(a) * 40, fy + Math.sin(a) * 40, 30, { w: 2.2 }, 16.50 + k * 0.06, 0.06); }
  const petals = []; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + TAU * k / 5; petals.push(ell(fx + Math.cos(a) * 40, fy + Math.sin(a) * 40, 28, 28, 0, 0, TAU, 20)); }
  petals.forEach((P, k) => BLOB(P, C.pink, { dx: 6, dy: 5, a: 0.85, amp: 1.4, ang: -0.4, sp: 8 }, 16.82 + k * 0.03, 0.03));
  BLOB(ell(fx, fy, 16, 16, 0, 0, TAU, 14), C.mustard, { dx: 4, dy: 3, a: 0.9, amp: 1, ang: 0, sp: 6 }, 17.00, 0.04);
  TXT('หอมดอกไม้', 300, 1902, 56, { f: 'IT', k: 0.78 }, 17.08, 0.36);
  const drop = [[640, 1840], [668, 1880], [676, 1904], [664, 1928], [640, 1936], [616, 1928], [604, 1904], [612, 1880]];
  PEN(drop.concat([drop[0]]), { w: 2.4, ta: 0.05, tb: 0.05 }, 17.50, 0.1);
  BLOB(drop, C.matchaDk, { dx: 6, dy: 5, a: 0.9, amp: 1.2, ang: -0.3, sp: 7, holes: [ell(628, 1898, 6, 12, 0.3, 0, TAU, 10)] }, 17.62, 0.06);
  TXT('หวานซับซ้อน', 700, 1868, 46, { f: 'IT', k: 0.76 }, 17.70, 0.34);
  TXT('อูมามิเข้มข้น', 700, 1944, 58, { f: 'IT', k: 0.8 }, 18.08, 0.36);
  PEN([[702, 1966], [860, 1962], [1010, 1968]], { layer: 'coral', w: 4.6, ta: 0.06, tb: 0.25, wob: 1 }, 18.46, 0.12);
  // v6: silky, then seaweed
  const wv = (y0, ph) => Array.from({ length: 30 }, (_, i) => [150 + i * 14, y0 + 16 * Math.sin(i / 29 * TAU * 1.3 + ph)]);
  const w1 = wv(2026, 0), w2 = wv(2062, 0.35);
  PEN(w1, { w: 2.4, ta: 0.06, tb: 0.1 }, 18.90, 0.2); PEN(w2, { w: 2.2, ta: 0.06, tb: 0.1 }, 19.12, 0.2);
  BLOB(w1.concat(w2.slice().reverse()), C.silk, { dx: 6, dy: 5, a: 0.9, amp: 1.5, ang: 0.1, sp: 8 }, 19.34, 0.16);
  TXT('เนียนนุ่ม', 190, 2140, 54, { f: 'IT', k: 0.78 }, 19.52, 0.3);
  const kelp = (x0, ph, h) => Array.from({ length: 16 }, (_, i) => [x0 + 13 * Math.sin(i / 15 * TAU * 1.2 + ph), 2160 - i / 15 * h]);
  const kelps = [kelp(680, 0, 150), kelp(718, 1.4, 180), kelp(756, 2.6, 130)];
  kelps.forEach((K, i) => PEN(K, { w: 2.2, ta: 0.05, tb: 0.4 }, 19.90 + i * 0.1, 0.09));
  kelps.forEach((K, i) => BLOB(K.map(([x, y]) => [x - 8, y]).concat(K.slice().reverse().map(([x, y]) => [x + 8, y])), C.olive, { dx: 5, dy: 4, a: 0.88, amp: 1.2, ang: -1.3, sp: 6 }, 20.22 + i * 0.05, 0.05));
  TXT('กลิ่นสาหร่าย', 800, 2066, 50, { f: 'IT', k: 0.78 }, 20.40, 0.34);
  TXT('ทิ้งท้ายบางๆ', 800, 2124, 42, { f: 'IT', k: 0.74 }, 20.76, 0.3);
  // the swatch strip: the taste, read as colours
  [C.pink, C.silk, C.matchaDk, C.olive].forEach((col, i) => { const x = 160 + i * 118;
    outlineRect(x, 2196, x + 98, 2244, { w: 1.6, p: 0.8 }, 21.12 + i * 0.12, 0.06);
    BLOB(rectP(x, 2196, x + 98, 2244), col, { dx: 6, dy: 5, a: 0.9, amp: 1.6, ang: -0.1, sp: 9 }, 21.19 + i * 0.12, 0.05); });

  // ================= E · how to drink it (21.8–24.9 s) =================
  const bx = 360, by = 2470;
  PEN(ell(bx, by, 200, 46, 0, 2.9, 2.9 + TAU * 1.03, 50), { w: 2.8, ta: 0.04, tb: 0.06 }, 22.0, 0.16);
  const bL = bez([bx - 200, by], [bx - 196, by + 110], [bx - 110, by + 170], [bx, by + 172], 24), bR = bez([bx + 200, by], [bx + 196, by + 110], [bx + 110, by + 170], [bx, by + 172], 24);
  PEN(bL, { w: 2.8, ta: 0.03, tb: 0.06 }, 22.18, 0.12); PEN(bR, { w: 2.8, ta: 0.03, tb: 0.06 }, 22.32, 0.12);
  PEN([[bx - 62, by + 166], [bx - 56, by + 196], [bx + 56, by + 196], [bx + 62, by + 166]], { w: 2.4, smooth: false }, 22.46, 0.08);
  const bowlPoly = ell(bx, by, 200, 46, 0, Math.PI, TAU, 24).concat(bR.slice(1), bL.slice().reverse().slice(1));
  const surf = ell(bx, by + 4, 176, 36, 0, 0, TAU, 40);
  BLOB(bowlPoly, C.bowl, { dx: 8, dy: 6, a: 0.85, amp: 2, ang: -0.3, sp: 12, holes: [surf, rectP(bx - 150, by + 60, bx - 136, by + 110)] }, 22.56, 0.14);
  const foam = []; for (let k = 0; k < 16; k++) { const a = rnd(0, TAU), r = Math.sqrt(rnd()) * 0.75; foam.push(ell(bx + Math.cos(a) * 150 * r, by + 4 + Math.sin(a) * 28 * r, rnd(4, 9), rnd(2, 4), 0, 0, TAU, 10)); }
  BLOB(surf, C.matcha, { dx: 6, dy: 4, a: 0.95, amp: 1.5, ang: -0.1, sp: 8, holes: foam }, 22.72, 0.14);
  TXT('ชงเพียว', 200, 2356, 60, { f: 'IT', k: 0.8 }, 22.88, 0.28);
  PEN([[200, 2380], [300, 2376], [394, 2382]], { layer: 'coral', w: 4.6, ta: 0.06, tb: 0.25, wob: 1 }, 23.18, 0.1);
  // the latte glass
  const gx = 870;
  PEN(ell(gx, 2340, 130, 22, 0, 2.8, 2.8 + TAU * 1.03, 40), { w: 2.4, ta: 0.04, tb: 0.06, p: 0.9 }, 23.32, 0.12);
  PEN([[gx - 130, 2340], [gx - 108, 2690]], { w: 2.6 }, 23.46, 0.08); PEN([[gx + 130, 2340], [gx + 108, 2690]], { w: 2.6 }, 23.56, 0.08);
  PEN(ell(gx, 2690, 108, 18, 0, 0.02, Math.PI - 0.02, 24), { w: 2.6 }, 23.66, 0.06);
  PEN([[gx + 22, 2250], [gx + 44, 2620]], { w: 2.0 }, 23.74, 0.06); PEN([[gx + 46, 2250], [gx + 68, 2620]], { w: 2.0 }, 23.81, 0.06);
  const ice1 = rotP(rectP(gx - 90, 2420, gx - 30, 2480), gx - 60, 2450, 0.3), ice2 = rotP(rectP(gx - 20, 2400, gx + 30, 2450), gx + 5, 2425, -0.25);
  PEN(ice1.concat([ice1[0]]), { w: 1.8, smooth: false, p: 0.85 }, 23.88, 0.05); PEN(ice2.concat([ice2[0]]), { w: 1.8, smooth: false, p: 0.85 }, 23.94, 0.05);
  const latte = ell(gx, 2402, 126, 20, 0, Math.PI, TAU, 20).concat([[gx + 126, 2402], [gx + 109, 2688]], ell(gx, 2690, 108, 18, 0, 0, Math.PI, 20), [[gx - 126, 2402]]);
  const straw = [[gx + 22, 2402], [gx + 46, 2402], [gx + 68, 2620], [gx + 44, 2620]];
  BLOB(latte, C.latte, { dx: 7, dy: 5, a: 0.92, amp: 1.8, ang: -0.3, sp: 10, holes: [ice1, ice2, straw, rectP(gx - 112, 2500, gx - 100, 2640)] }, 24.0, 0.14);
  TXT('ลาเต้', 1012, 2470, 58, { f: 'IT', k: 0.8 }, 24.16, 0.24);
  TXT('หรือ', 596, 2500, 46, { f: 'IT', k: 0.74 }, 24.42, 0.14);
  TXT('(Usucha)', 412, 2354, 44, { f: 'CB', k: 0.78 }, 24.58, 0.2);

  // ================= the dragon wakes: re-registered matcha green on the whole page (25.6–26.5 s) =================
  BLOB(body, C.matcha, { dx: 8, dy: 6, a: 0.92, amp: 2.5, ang: -0.2, sp: 14, replace: true }, 25.62, 0.62);
  BLOB(headPoly, C.matchaDk, { dx: 7, dy: 5, a: 0.9, amp: 1.6, ang: -0.3, sp: 8, holes: [ell(hx + 56, hy - 12, 9, 7, 0, 0, TAU, 10)] }, 26.26, 0.12);
  [[hx + 150, hy - 60, 0.6], [hx + 170, hy + 0, 0], [hx + 140, hy + 60, -0.6]].forEach(([x, y, a], i) =>
    PEN([[x, y], [x + Math.cos(a) * 34, y + Math.sin(a) * 34]], { layer: 'coral', w: 4.2, ta: 0.1, tb: 0.2 }, 26.4 + i * 0.05, 0.05));
  CUE.wake = 25.62;

  // ================= F · the real thing, and where to get it (27.4–31.5 s) =================
  CUE.photo = { x: 420, y: 2985, w: 400, h: 533, rot: -0.05, t: 27.35 };
  SFX.push({ t: 27.42, type: 'drop', d: 0.25, pan: -0.3 }, { t: 27.66, type: 'tape', d: 0.18, pan: -0.5 }, { t: 27.82, type: 'tape', d: 0.18, pan: 0 });
  TXT('สนใจ?', 690, 2866, 64, { f: 'IT', k: 0.8 }, 27.95, 0.26);
  TXT('กดตะกร้า', 686, 2990, 96, { f: 'IT', k: 0.84, jit: 0.4 }, 28.24, 0.48);
  BLOB(rectP(684, 2926, 1060, 3004), C.mustard, { dx: 10, dy: 8, a: 0.85, amp: 2.4, ang: -0.12, sp: 13 }, 28.76, 0.16);
  TXT('ได้เลย', 690, 3090, 64, { f: 'IT', k: 0.8 }, 28.96, 0.26);
  arrow([[900, 3122], [880, 3180], [820, 3228], [748, 3246]], { layer: 'coral', w: 5, head: 26 }, 29.26, 0.32);
  CUE.done = 29.6;

  // ================= camera =================
  // k: d drift · g gesture (quick start, settles) · i push in (accelerating) · p punch
  CAM = [
    { t: 0.00, x: 425, y: 230, z: 1.72, r: -1.0, k: 'd' },          // the question, close
    { t: 1.80, x: 432, y: 232, z: 1.66, r: -0.8, k: 'd' },
    { t: 2.60, x: 650, y: 360, z: 1.03, r: 0.0, k: 'g' },           // pinch out: a question, and a drawing
    { t: 3.75, x: 652, y: 366, z: 1.03, r: 0.2, k: 'd' },
    { t: 4.50, x: 650, y: 880, z: 1.0, r: 0.5, k: 'g' },            // down the page to the can
    { t: 9.10, x: 652, y: 888, z: 1.0, r: 0.4, k: 'd' },
    { t: 9.90, x: 650, y: 1380, z: 1.0, r: -0.5, k: 'g' },          // to the tea field and the mill
    { t: 14.10, x: 655, y: 1384, z: 1.02, r: -0.5, k: 'd' },
    { t: 14.85, x: 655, y: 1450, z: 1.25, r: -0.3, k: 'i' },         // near-silence: closer on leaf and mill
    { t: 15.05, x: 650, y: 1460, z: 1.34, r: -0.3, k: 'p' },        // the shatter
    { t: 15.85, x: 930, y: 1460, z: 1.85, r: -0.3, k: 'g' },        // ride with the chips into the mill
    { t: 16.05, x: 935, y: 1462, z: 1.85, r: -0.3, k: 'd' },
    { t: 16.65, x: 650, y: 1960, z: 1.0, r: 0.4, k: 'g' },          // the taste
    { t: 21.30, x: 652, y: 1968, z: 1.0, r: 0.3, k: 'd' },
    { t: 22.05, x: 650, y: 2400, z: 1.0, r: -0.9, k: 'g' },         // a turn: how to drink it
    { t: 24.85, x: 652, y: 2406, z: 1.0, r: -0.6, k: 'd' },
    { t: 25.60, x: 650, y: 1640, z: 0.6, r: 0.0, k: 'g' },          // the whole page
    { t: 26.75, x: 650, y: 1640, z: 0.6, r: 0.0, k: 'd' },
    { t: 27.45, x: 650, y: 2930, z: 1.0, r: -0.5, k: 'g' },         // the real thing
    { t: FULL, x: 652, y: 2934, z: 1.02, r: -0.3, k: 'd' }];
  CAM.forEach((b, i) => { if (i && (b.k === 'g' || b.k === 'p' || b.k === 'i') && b.t > CAM[i - 1].t) SFX.push({ t: CAM[i - 1].t, type: b.k === 'p' ? 'punch' : b.k === 'i' ? 'push' : 'gesture', d: b.t - CAM[i - 1].t, pan: 0 }); });

  // the photo, taped onto the page (world-anchored, drawn over the page in screen space)
  DYN.push({ t0: CUE.photo.t, t1: 1e9, draw(t, c) {
    const P = CUE.photo, u = eo(clamp((t - P.t) / 0.28)), s = lerp(1.07, 1, u), lift = (1 - u) * 18;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(c.r); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
    ctx.translate(P.x, P.y); ctx.rotate(P.rot + (1 - u) * -0.04); ctx.scale(s, s);
    const fw = P.w + 28, fh = P.h + 28;
    ctx.globalAlpha = 0.22 * u + 0.1; ctx.fillStyle = '#6b5a48'; ctx.fillRect(-fw / 2 + 8 + lift, -fh / 2 + 10 + lift, fw, fh);
    ctx.globalAlpha = Math.min(1, u * 3);
    ctx.fillStyle = '#fbf8f1'; ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
    if (IMG) { const iw = IMG.width, ih = IMG.height, k = Math.max(P.w / iw, P.h / ih), sw = P.w / k, sh = P.h / k;
      ctx.drawImage(IMG, (iw - sw) / 2, (ih - sh) / 2 + ih * 0.06, sw, sh * 0.94, -P.w / 2, -P.h / 2, P.w, P.h); }
    ctx.globalCompositeOperation = 'multiply';
    for (const [tx_, ty, a, t0] of [[-P.w / 2 + 6, -fh / 2 + 4, -0.6, 27.66], [P.w / 2 - 6, -fh / 2 + 4, 0.55, 27.82]]) {
      const v = clamp((t - t0) / 0.12); if (v <= 0) continue;
      ctx.save(); ctx.translate(tx_, ty); ctx.rotate(a); ctx.fillStyle = C.mustard; ctx.globalAlpha = 0.75; ctx.fillRect(-60, -18, 120 * v, 36); ctx.restore(); }
    ctx.restore(); } });
}
function inPoly(P, x, y) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
