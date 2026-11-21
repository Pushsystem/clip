// ---------- camera ----------
const gease = u => 0.45 * eio(u) + 0.55 * eo(u);
const sstep = x => { x = clamp(x); return x * x * (3 - 2 * x); };
function cam(t) {
  let i = 0; while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
  const a = CAM[i], b = CAM[i + 1], span = b.t - a.t, u0 = span > 1e-6 ? clamp((t - a.t) / span) : 1;
  const u = b.k === 'g' ? gease(u0) : b.k === 'i' ? Math.pow(u0, 2.4) : b.k === 'p' ? eo(u0) : eio(u0);
  let x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u);
  if (b.k === 'f') { const p = b.fn(t), w = sstep(u0 / 0.25) * (1 - sstep((u0 - 0.8) / 0.2)); x = lerp(x, p[0], w); y = lerp(y, p[1], w); }
  return { x, y, z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)), r: lerp(a.r, b.r, u) * Math.PI / 180 };
}
function toScreen(c, x, y) { const dx = (x - c.x) * c.z, dy = (y - c.y) * c.z, cs = Math.cos(c.r), sn = Math.sin(c.r); return [W / 2 + dx * cs - dy * sn, H / 2 + dx * sn + dy * cs]; }
function toWorld(c, X, Y) { const dx = X - W / 2, dy = Y - H / 2, cs = Math.cos(-c.r), sn = Math.sin(-c.r); return [c.x + (dx * cs - dy * sn) / c.z, c.y + (dx * sn + dy * cs) / c.z]; }

// ---------- stylus: on the mark being made; lifts between marks; leaves the frame in long pauses ----------
let NIBS = [];
const OFF = [W + 220, H * 0.62];
function stylusAt(t) {
  const c = cam(t); let act = null;
  for (const e of NIBS) if (t >= e.t0 && t < e.t0 + e.d) act = e;
  if (act) { const p = act.nib((t - act.t0) / act.d); return { P: toScreen(c, p[0], p[1]), lift: 0 }; }
  let prev = null, next = null;
  for (const e of NIBS) { if (e.t0 + e.d <= t && (!prev || e.t0 + e.d >= prev.t0 + prev.d)) prev = e; if (e.t0 > t && (!next || e.t0 < next.t0)) next = e; }
  const ta = prev ? prev.t0 + prev.d : -9, tb = next ? next.t0 : 1e9, gap = tb - ta;
  const pa = prev ? toScreen(c, ...prev.nib(1)) : OFF, pb = next ? toScreen(c, ...next.nib(0)) : OFF;
  if (gap > 1.1 || !prev || !next) {   // away from the glass
    if (prev && t - ta < 0.45) { const u = eio((t - ta) / 0.45); return { P: [lerp(pa[0], OFF[0], u), lerp(pa[1], OFF[1], u)], lift: Math.min(1, u * 2) }; }
    if (next && tb - t < 0.45) { const u = eio(1 - (tb - t) / 0.45); return { P: [lerp(OFF[0], pb[0], u), lerp(OFF[1], pb[1], u)], lift: Math.min(1, (1 - u) * 2) }; }
    return null;
  }
  const u = (t - ta) / gap;
  return { P: [lerp(pa[0], pb[0], eio(u)), lerp(pa[1], pb[1], eio(u))], lift: Math.sin(Math.PI * u) * clamp(gap / 0.3, 0.25, 1) };
}
function drawStylus(t) {
  const n = stylusAt(t); if (!n) return;
  const [X, Y] = n.P, n2 = stylusAt(t + 1 / 48), lean = n2 ? clamp((n2.P[0] - X) * 0.004, -0.06, 0.06) : 0;
  const ang = 0.98 + lean, d = [Math.cos(ang), Math.sin(ang)], nn = [-d[1], d[0]], h0 = 4 + n.lift * 26;
  const P = (s, o) => [X + d[0] * s + nn[0] * o, Y + d[1] * s + nn[1] * o];
  const body = (k = 0) => { const L = 600, rw = 12.5, sh = s => [k * (h0 + s * 0.05) * 0.9, k * (h0 + s * 0.05) * 0.35];
    return [[0, 0], [12, -2.6], [46, -rw], [L, -rw], [L + 8, -rw * 0.6], [L + 8, rw * 0.6], [L, rw], [46, rw], [12, 2.6]].map(([s, o]) => { const q = P(s, o), e = sh(s); return [q[0] + e[0], q[1] + e[1]]; }); };
  ctx.save();
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(120,98,76,0.16)'; ctx.beginPath(); polyPath(ctx, body(1)); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#fbf8f2'; ctx.beginPath(); polyPath(ctx, body(0)); ctx.fill();
  ctx.fillStyle = '#ebe5da'; ctx.beginPath(); polyPath(ctx, [P(46, 4), P(600, 4), P(600, 12.5), P(46, 12.5)]); ctx.fill();
  ctx.fillStyle = '#ddd6cb'; ctx.beginPath(); polyPath(ctx, [P(12, -2.6), P(46, -12.5), P(46, 12.5), P(12, 2.6)]); ctx.fill();
  ctx.fillStyle = '#4a3f37'; ctx.beginPath(); polyPath(ctx, [P(0, 0), P(12, -2.6), P(12, 2.6)]); ctx.fill();
  ctx.strokeStyle = '#c9bdab'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.beginPath(); polyPath(ctx, body(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(...P(46, -12.5)); ctx.lineTo(...P(46, 12.5)); ctx.stroke();
  ctx.restore();
}

// ---------- composite: paper × colour × pencil layers with the grain threshold ----------
const IMGS = {};
function composite(c) {
  const cs = [[0, 0], [W, 0], [0, H], [W, H]].map(([X, Y]) => toWorld(c, X, Y));
  const [a, b, cc, d] = bbox(cs);
  const x0 = Math.max(0, Math.floor(PX(a)) - 2), y0 = Math.max(0, Math.floor(PY(b)) - 2), x1 = Math.min(BW, Math.ceil(PX(cc)) + 2), y1 = Math.min(BH, Math.ceil(PY(d)) + 2);
  const w = x1 - x0, h = y1 - y0, key = w + 'x' + h;
  const img = IMGS[key] || (IMGS[key] = new ImageData(w, h)), o = img.data;
  const fd = TG.fx.getImageData(x0, y0, w, h).data, pp = hex(C.paper), Ls = ORDER.map(n => [TG.L[n], LAYERS[n].col, LAYERS[n].alpha]);
  for (let y = 0; y < h; y++) {
    const row = (y + y0) * BW + x0;
    for (let x = 0; x < w; x++) {
      const i = row + x, j = (y * w + x) * 4, g = GRAIN[i], g2 = GRAIN2[i];
      const pk = (0.985 + 0.03 * g2) * (0.99 + 0.02 * g);
      let r = pp[0] * pk, gg = pp[1] * pk, bb = pp[2] * (0.985 + 0.03 * g2) * (0.985 + 0.025 * g);
      const fa = fd[j + 3] / 255;
      if (fa) { const al = fa * (0.86 + 0.14 * (1 - g * 0.8)); r *= 1 - al + al * fd[j] / 255; gg *= 1 - al + al * fd[j + 1] / 255; bb *= 1 - al + al * fd[j + 2] / 255; }
      for (let q = 0; q < 3; q++) { const v = Ls[q][0][i]; if (!v) continue;
        const al = clamp((v * 0.9 - g * 0.85 + 0.32) * 2.1) * Ls[q][2]; if (al <= 0) continue; const col = Ls[q][1];
        r *= 1 - al + al * col[0]; gg *= 1 - al + al * col[1]; bb *= 1 - al + al * col[2]; }
      o[j] = r * 255; o[j + 1] = gg * 255; o[j + 2] = bb * 255; o[j + 3] = 255;
    }
  }
  wx.putImageData(img, x0, y0);
  return [x0, y0, w, h];
}

// ---------- cache of finished marks ----------
function clearTarget(T) { for (const n of ORDER) T.L[n].fill(0); T.fx.clearRect(0, 0, BW, BH); }
function renderMarks(t) {
  let k = 0; while (k < EL.length && t >= EL[k].t0 + EL[k].d) k++;
  if (cacheK > k) { clearTarget(CACHE); cacheK = 0; }
  if (cacheK < k) { TG = CACHE; for (let i = cacheK; i < k; i++) EL[i].apply(1); cacheK = k; }
  let partial = false; for (let i = k; i < EL.length; i++) if (t >= EL[i].t0) { partial = true; break; }
  if (!partial) { TG = CACHE; return; }
  for (const n of ORDER) WORK.L[n].set(CACHE.L[n]);
  WORK.fx.clearRect(0, 0, BW, BH); WORK.fx.drawImage(CACHE.fc, 0, 0);
  TG = WORK;
  for (let i = k; i < EL.length; i++) { const e = EL[i]; if (t >= e.t0) e.apply(clamp((t - e.t0) / e.d)); }
}

