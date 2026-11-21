
// ---------- subtitles: a paper chip, Thai, wiped in like a colour block (kept above TikTok's caption area) ----------
function drawSubs(t) {
  if (!VOC) return;
  const q = VOC.cues.find(c => t >= c.t0 && t < c.t1); if (!q) return;
  const fin = clamp((t - q.t0) / 0.2), fout = clamp((q.t1 - t) / 0.18);
  ctx.save();
  ctx.font = '46px SB'; const lines = q.lines, w = Math.max(...lines.map(s => ctx.measureText(s).width)) + 60, h = 34 + 62 * lines.length, x = 64, y = 1450 - h + 62;
  ctx.globalAlpha = fout;
  ctx.beginPath(); ctx.rect(x - 20, y - 20, (w + 40) * eo(fin), h + 40); ctx.clip();
  ctx.fillStyle = '#e4d6bd'; ctx.globalAlpha = fout * 0.75; ctx.beginPath(); ctx.roundRect(x + 9, y + 8, w, h, 12); ctx.fill();
  ctx.fillStyle = '#fbf7ee'; ctx.globalAlpha = fout * 0.96; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
  ctx.globalAlpha = fout * clamp((t - q.t0 - 0.08) / 0.18); ctx.fillStyle = '#43362e'; ctx.textBaseline = 'alphabetic';
  lines.forEach((s, i) => ctx.fillText(s, x + 30, y + 64 + i * 62));
  ctx.restore();
}

// ---------- render ----------
window.DUR = TO - FROM;
function renderFull(t) {
  const c = cam(t);
  renderMarks(t);
  const [x0, y0, w, h] = composite(c);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(1, 0, 0, 1, W / 2, H / 2); ctx.rotate(c.r); ctx.scale(c.z / S, c.z / S); ctx.translate(-(c.x - X0) * S, -(c.y - Y0) * S);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(WC, x0, y0, w, h, x0, y0, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const d of DYN) if (t >= d.t0 && t < d.t1) d.draw(t, c);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, 'rgba(120,100,80,0)'); g.addColorStop(1, 'rgba(120,100,80,0.10)');
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  if (CLEAN) return;
  drawStylus(t);
  drawSubs(t);
}
window.render = t => renderFull(FROM + t);
window.CAMAT = cam;

// every on-canvas text with its screen box, for readcheck (subtitles are checked from the .srt)
window.TEXTS = t => {
  t += FROM; const c = cam(t), out = [];
  EL.forEach((e, i) => { if (e.kind !== 'write' || t < e.t0) return; const [a, b, cc, d] = e.T.box;
    const cs = [[a, b], [cc, b], [a, d], [cc, d]].map(([x, y]) => toScreen(c, x, y)), bb = bbox(cs);
    out.push({ id: 'txt' + i, text: e.T.s, x0: bb[0], y0: bb[1], x1: bb[2], y1: bb[3] }); });
  return out;
};

async function boot() {
  GLY = await (await fetch('glyphs.json')).json();
  VOC = await (await fetch('voice/cues.json')).json();
  IMG = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'photos/1.jpg'; });
  await Promise.all([['IT', 'มัทฉะ Ag'], ['CB', 'Ag'], ['ZK', '雲龍'], ['SB', 'มัทฉะ']].map(([f, s]) => document.fonts.load(`40px ${f}`, s)));
  buildGrain();
  CACHE = mkTarget(); WORK = mkTarget(); TG = CACHE;
  buildPage();
  EL.sort((a, b) => a.t0 - b.t0);
  NIBS = EL.filter(e => e.nib);
  const ev = [];
  for (const e of EL) { if (e.kind === 'occ' || e.kind === 'none') continue; const tm = e.t0 + e.d / 2, c = cam(tm), p = e.nib ? e.nib(0.5) : e.wx;
    ev.push({ t: e.t0, type: e.kind, d: e.d, pan: clamp(toScreen(c, p[0], p[1])[0] / W * 2 - 1, -1, 1) }); }
  NIBS.forEach((e, i) => { const prev = NIBS.slice(0, i).reduce((m, q) => Math.max(m, q.t0 + q.d), -1); if (e.t0 - prev > 0.1) { const c = cam(e.t0), p = e.nib(0); ev.push({ t: e.t0, type: 'tap', d: 0, pan: clamp(toScreen(c, p[0], p[1])[0] / W * 2 - 1, -1, 1) }); } });
  ev.push(...SFX, { t: CUE.done, type: 'done', d: 0, pan: 0 }, { t: CUE.wake, type: 'wake', d: 0.7, pan: 0 });
  window.EV = ev.filter(e => e.t >= FROM && e.t < TO).map(e => ({ ...e, t: +(e.t - FROM).toFixed(4), d: +e.d.toFixed(4), pan: +e.pan.toFixed(3) }));
  window.CUE = CUE; window.VO_START = VO_START;
  window.READY = true;
}
boot();
</script>
</body></html>
