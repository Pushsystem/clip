// ดอยหมอกสน — timeline: 120 BPM (beat 0.5 s, bar 2 s), 30 s, 15 bars.
// Each clock window holds the trip clock (seconds since 00:00 of day 1) and a time-lapse rate curve.
import { clamp, ss, seg, lerp } from '/core/lib.js';

export const BPM = 120, BEAT = .5, BAR = 2;
export const DUR = 30;

export const T = {
  vanPark: 1.5, hop: [2.0, 2.25, 2.5, 2.75],
  tents: [10.5, 11.0, 11.5, 12.0],
  sunset: 16.0, fire: 16.0,
  tapeStop: 21.0, realTime: 22.0, bird: 22.0, point: 24.0,
  craneUp: 26.0,
};

export const SHOTS = [
  [0, 4, 'trailhead'], [4, 10, 'trail'], [10, 14, 'camp'], [14, 20, 'night'], [20, 26, 'mist'], [26, 30, 'end'],
];
export const shotAt = t => SHOTS.find(s => t < s[1]) || SHOTS[SHOTS.length - 1];

const H = 3600, M = 60;
// overnight rate: 600× until sunset, ramps to ~9000× through the night, then lands at 1× at 22.0
const R = 9470;
const nightRate = t => {
  if (t < 16) return 600;
  if (t < 17) return lerp(600, R, ss(seg(t, 16, 17)));
  if (t < 20.5) return R;
  if (t < 22) { const u = seg(t, 20.5, 22); return 1 + (R - 1) * Math.pow(1 - ss(u), 1.6); }
  return 1;
};
export const WINDOWS = [
  { name: 'trailhead', t0: 0, t1: 4, clock0: 7 * H + 40 * M, rate: () => 40, day: 1 },
  { name: 'trail', t0: 4, t1: 10, clock0: 9 * H + 20 * M, rate: () => 20, day: 1 },
  { name: 'camp', t0: 10, t1: 14, clock0: 15 * H + 5 * M, rate: () => 60, day: 1 },
  { name: 'night', t0: 14, t1: DUR + .5, clock0: 17 * H + 40 * M, rate: nightRate, day: 1 },
];
for (const W of WINDOWS) {
  const n = Math.ceil((W.t1 - W.t0) * 1000) + 1, tab = new Float64Array(n); let acc = 0;
  for (let i = 0; i < n; i++) { tab[i] = acc; const t = W.t0 + i / 1000; acc += (W.rate(t) + W.rate(t + .001)) / 2 / 1000; }
  W.tab = tab;
}
export const windowAt = t => WINDOWS.find(w => t < w.t1) || WINDOWS[WINDOWS.length - 1];
export function clockAt(t, W = windowAt(t)) {
  const f = clamp((t - W.t0) * 1000, 0, W.tab.length - 1), i = Math.floor(f), u = f - i;
  const a = W.tab[i], b = W.tab[Math.min(i + 1, W.tab.length - 1)];
  return W.clock0 + a + (b - a) * u;
}
export const rateAt = t => windowAt(t).rate(t);
// world time stepping: 8 Hz in time-lapse (a 16th note), 12 Hz between ×2 and ×6, smooth below ×2
export function stepT(t) {
  const r = rateAt(t), W = windowAt(t);
  if (r < 2) return t;
  const hz = r < 6 ? 12 : 8;
  return W.t0 + Math.floor((t - W.t0) * hz + 1e-6) / hz;
}
export const fmtClock = c => {
  const day = c >= 24 * H ? 2 : 1, s = Math.floor(c) % (24 * H);
  return { day, hm: String(Math.floor(s / H)).padStart(2, '0') + ':' + String(Math.floor(s / M) % 60).padStart(2, '0') };
};

// in-world signs (Thai captions), all inside the lower blur band
export const SIGNS = [
  { id: 's1', t0: .15, t1: 3.85, text: 'จุดเริ่มเดินป่า · ดอยหมอกสน' },
  { id: 's2', t0: 4.4, t1: 9.85, text: 'เดินป่าขึ้นสันเขา 6 กิโลเมตร' },
  { id: 's3', t0: 10.3, t1: 13.85, text: 'ตั้งแคมป์บนสันเขา' },
  { id: 's4', t0: 14.4, t1: 19.85, text: 'คืนนี้รอบกองไฟ' },
  { id: 's5', t0: 22.2, t1: 25.7, text: 'เช้าวันที่สอง · ทะเลหมอก' },
];
export const TITLE = { t0: 25.88, t1: 30.0, main: 'ดอยหมอกสน', sub: 'เดินป่า · ตั้งแคมป์ 2 วัน 1 คืน' };
