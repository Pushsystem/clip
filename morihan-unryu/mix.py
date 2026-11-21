"""Sound for «Morihan Unryu» (0-31.5 s): Thai narration + pencil on paper + a small kalimba / nylon-guitar score.

- Foley is driven by the page (events.json: one event per mark, gestures, the mill grinding, the leaf shattering, the photo).
- Score: 100 bpm (bar = 2.4 s), G major: kalimba motif, nylon guitar, double bass, soft shaker, vibraphone accents.
  Near-silences: 14.1-14.9 s (before the shatter) and 26.75-27.4 s (before the photo lands).
- Narration: voice/<id>.wav at voice/cues.json "start"; compressed, ~10 dB (RMS) above the music, which ducks while it speaks.
Run: LIB=<library> <LIB>/.venv/bin/python mix.py   (build.sh does)
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
LIB = os.environ['LIB']
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh, thump

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(D['dur']); EV = D['ev']; N = int(round(DUR * SR)); FULL = DUR
tt = np.arange(N) / SR
rng = np.random.default_rng(7)
VO = json.load(open(os.path.join(HERE, 'voice', 'cues.json')))


# ---------------- pencil foley ----------------
def activity(kinds):
    a = np.zeros(N); pw = np.zeros(N)
    for e in EV:
        if e['type'] not in kinds: continue
        i0 = int(e['t'] * SR); i1 = min(N, int((e['t'] + max(e['d'], 0.035)) * SR))
        if i1 <= i0: continue
        n = i1 - i0; env = np.ones(n)
        r = min(n // 3, int(0.01 * SR))
        if r > 0: env[:r] = np.linspace(0, 1, r); env[-r:] = np.linspace(1, 0, r)
        a[i0:i1] += env; pw[i0:i1] += env * e.get('pan', 0)
    pan = np.where(a > 1e-6, pw / np.maximum(a, 1e-6), 0)
    level = 1 - np.exp(-a * 1.1)
    k = int(0.015 * SR); ker = np.ones(k) / k
    return np.convolve(level, ker, 'same'), np.convolve(pan, ker, 'same')


def tooth_noise(lo, hi, grain_hz, depth, seed):
    r = np.random.default_rng(seed)
    x = bp(r.standard_normal(N), lo, hi, 2)
    g = lp(np.abs(r.standard_normal(N)), grain_hz, 1); g = g / (np.percentile(g, 95) + 1e-9)
    return x * ((1 - depth) + depth * np.clip(g, 0, 2.5))


def hand(rate, seed, sharp=1.0):
    r = np.random.default_rng(seed)
    ph = np.cumsum(rate * (1 + 2.5 * lp(r.standard_normal(N), 3, 1)) / SR) * 2 * np.pi
    return (0.5 + 0.5 * np.abs(np.sin(ph))) ** sharp


def pan_st(x, pan):
    th = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], 1)


fol = np.zeros((N, 2))
lv, pn = activity(['pencil']); fol += pan_st(tooth_noise(700, 4200, 380, 0.9, 1) * hand(5, 2) * lv, pn * 0.55) * 0.28
lv, pn = activity(['light']); fol += pan_st(tooth_noise(1400, 5200, 500, 0.9, 3) * hand(7, 4) * lv, pn * 0.55) * 0.11
lv, pn = activity(['write']); fol += pan_st(tooth_noise(900, 4800, 450, 0.92, 5) * hand(10, 6, 1.6) * lv, pn * 0.55) * 0.27
lv, pn = activity(['color']); fol += pan_st(tooth_noise(320, 2600, 220, 0.75, 7) * hand(13, 8, 2.0) * lv, pn * 0.55) * 0.23
for e in EV:
    t, d, p = e['t'], e['d'], e.get('pan', 0)
    if e['type'] == 'tap':
        add(fol, hp(click(pitch=0.7 + rng.random() * 0.25, v=1.0), 1800) * 0.035, t, 1.0, p * 0.5)
    elif e['type'] in ('gesture', 'punch'):
        n = int(d * SR); x = lp(hp(rng.standard_normal(n), 150), 1300, 2)
        u = np.linspace(0, 1, n); env = np.sin(np.pi * u) ** 1.5
        g = np.stack([x * env, np.roll(x, 211) * env], 1) * (0.05 if e['type'] == 'gesture' else 0.07)
        i0 = int(t * SR); i1 = min(N, i0 + n); fol[i0:i1] += g[:i1 - i0]
    elif e['type'] == 'push':     # the slow push into the near-silence: just a long, soft slide
        n = int(d * SR); x = lp(hp(rng.standard_normal(n), 120), 900, 2) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2
        add(fol, x * 0.04, t, 1.0, 0)
    elif e['type'] == 'grind':    # stone on stone: a low rumble that turns
        n = int(d * SR); u = np.linspace(0, 1, n)
        x = lp(rng.standard_normal(n), 260, 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 2.2 * u * d)) * np.minimum(1, u / 0.15) * np.minimum(1, (1 - u) / 0.3)
        add(fol, x / (np.abs(x).max() + 1e-9) * 0.16, t, 1.0, p * 0.5)
    elif e['type'] == 'shatter':  # a soft thump, then the chips pattering into the mill
        add(fol, thump(0.7, 70) * 0.2, t, 1.0, 0)
        for k in range(150):
            tk = t + 0.05 + rng.uniform(0, d) ** 1.4 * (d / d ** 1.4)
            g = hp(rng.standard_normal(int(0.004 * SR)), 2500) * np.exp(-np.arange(int(0.004 * SR)) / (0.0012 * SR))
            add(fol, g * 0.06 * rng.uniform(0.3, 1), tk, 1.0, np.clip(-0.5 + (tk - t) / d * 1.0 + rng.normal(0, 0.15), -1, 1))
    elif e['type'] == 'drop':     # the photo lands on the paper
        add(fol, lp(whoosh(0.22, 1.0), 3000) * 0.06, t - 0.12, 1.0, p)
        add(fol, lp(thump(0.4, 110), 1200) * 0.12, t + 0.1, 1.0, p)
    elif e['type'] == 'tape':     # masking tape torn and pressed
        n = int(d * SR); x = bp(rng.standard_normal(n), 1500, 7000, 2) * (0.5 + 0.5 * (rng.random(n) > 0.6)) * np.linspace(1, 0.3, n)
        add(fol, x * 0.06, t, 1.0, p)
room = lp(rng.standard_normal(N), 420, 2) * 0.003
fol += np.stack([room, np.roll(room, 1013)], 1)

# ---------------- score ----------------
BEAT = 60 / 100; BAR = 4 * BEAT
CH = {'G': ([55, 59, 62, 67], 43, 50), 'Em': ([52, 55, 59, 64], 40, 47), 'C': ([48, 55, 60, 64], 36, 43), 'D': ([50, 57, 62, 66], 38, 45),
      'Am': ([57, 60, 64, 69], 45, 52), 'Cmaj7': ([48, 55, 59, 64], 36, 43), 'Dsus': ([50, 57, 62, 67], 38, 45), 'Gadd9': ([55, 59, 62, 69], 43, 50)}
CHART = ['G', 'Em', 'Cmaj7', 'D', 'G', 'Em', 'Am', 'Dsus', 'G', 'Em', 'Cmaj7', 'D', 'Gadd9', 'Gadd9']
QUIET = [(14.1, 14.9), (26.75, 27.4)]
quiet = lambda t: any(a <= t < b for a, b in QUIET)
ev = []
for b, name in enumerate(CHART):
    t0 = b * BAR
    if t0 >= FULL: break
    vo, root, fifth = CH[name]
    sparse = b < 2                                   # the hook: kalimba alone, guitar thin
    if not sparse:
        for beat, p in ((0, root), (2, fifth)):
            t = t0 + beat * BEAT
            if not quiet(t) and t < 29.5: ev.append((t, 'jazz_bass', p, BEAT * 1.6, 0.6, -0.05, 0.95))
    for k in ([0, 3, 5] if not sparse else [0]):
        t = t0 + k / 2 * BEAT
        if quiet(t) or t >= 29.5 or t < 0.2: continue
        for j, p in enumerate(vo):
            ev.append((t + j * 0.012, 'guitar_nylon', p, 0.5, 0.3 + 0.05 * (k == 0), -0.18 + j * 0.06, 0.62))
# kalimba motif: a rising question (the hook), answered later
MOT = [(0, 74), (0.5, 76), (1, 79), (2, 81), (3, 79), (3.5, 76)]
for bar in (0, 1, 4, 8, 9):
    for bt, p in MOT:
        t = bar * BAR + bt * BEAT + 0.3
        if not quiet(t) and t < 29.5: ev.append((t, 'kalimba', p - (12 if p > 77 else 0) + 12 * 0 , 0.8, 0.45, 0.2, 0.6))
for i in range(int(FULL / (BEAT / 2))):
    t = i * BEAT / 2
    if t < 2 * BAR or quiet(t) or t > 29.5: continue
    ev.append((t, 'world_perc', 'egg_shaker_soft', 0.2, 0.18 + 0.08 * (i % 2), 0.3, 0.42))
# landings: the shatter (14.9), the whole page (25.6), the photo (27.42), the last chord (29.6)
for T, chord in [(14.9, 'C'), (25.6, 'G'), (27.42, 'Em'), (29.6, 'Gadd9')]:
    vo, root, _ = CH[chord]
    for j, p in enumerate(vo + [vo[1] + 12]):
        ev.append((T + j * 0.03, 'guitar_nylon', p, 2.2, 0.5, -0.25 + j * 0.1, 0.7))
    ev.append((T, 'jazz_bass', root, 1.8, 0.7, 0, 1.0))
# vibraphone: one soft note on each new idea
for t, p, v in [(0.35, 79, 0.35), (4.5, 74, 0.3), (8.0, 76, 0.3), (9.6, 71, 0.28), (12.5, 74, 0.28), (14.9, 83, 0.4),
                (16.5, 79, 0.3), (17.5, 81, 0.3), (19.0, 78, 0.28), (19.9, 74, 0.28), (21.12, 79, 0.24), (21.24, 81, 0.24), (21.36, 83, 0.24), (21.48, 86, 0.26),
                (22.0, 76, 0.3), (23.3, 79, 0.3), (25.62, 83, 0.4), (25.64, 86, 0.32), (28.24, 79, 0.34), (29.6, 83, 0.36), (29.62, 86, 0.3)]:
    ev.append((t, 'vibraphone', p, 1.4, v, 0.25, 0.55))
S.seed(11)
music = S.render(ev, dur=FULL + 2.5, master=False)
music = S.room(music, size=0.3, mix=0.16)[:N]
if len(music) < N: music = np.vstack([music, np.zeros((N - len(music), 2))])
music *= np.clip((FULL - tt) / 1.5, 0, 1)[:, None] ** 1.3

# ---------------- narration ----------------
voice = np.zeros((N, 2)); speak = np.zeros(N)
for vid, st in VO['start'].items():
    x, sr = sf.read(os.path.join(HERE, 'voice', vid + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr); x = hp(x, 80)
    x = compress(x / (np.abs(x).max() + 1e-9) * 0.6, thr=0.18, ratio=3.0)
    s = int(round(st * SR)); a, b = max(0, s), min(N, s + len(x))
    voice[a:b] += np.stack([x[a - s:b - s]] * 2, 1)
    speak[max(0, s - int(0.15 * SR)):min(N, s + len(x) + int(0.25 * SR))] = 1
k = int(0.12 * SR); speak = np.convolve(speak, np.ones(k) / k, 'same')
mid = np.stack([bp(music[:, c], 300, 4000, 2) for c in (0, 1)], 1)
music = music - mid * (0.55 * speak)[:, None]
music *= (1 - 0.45 * speak)[:, None]
rms = lambda x, m: np.sqrt(np.mean(x[m] ** 2) + 1e-12)
on = speak > 0.5
voice *= 10 ** (10 / 20) * rms(music.mean(1), on) / rms(voice.mean(1), voice.mean(1) != 0)
mix = voice + music + fol * (1 - 0.35 * speak)[:, None] * 0.9
mix = np.stack([compress(mix[:, 0], thr=0.35, ratio=2.2), compress(mix[:, 1], thr=0.35, ratio=2.2)], 1)
mix = np.stack([limit(mix[:, 0]), limit(mix[:, 1])], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3), '| voice vs music (speaking) dB', round(db(voice.mean(1)[on]) - db(music.mean(1)[on]), 1))
cr = S.credits(['kalimba', 'guitar_nylon', 'jazz_bass', 'world_perc', 'vibraphone'])
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
