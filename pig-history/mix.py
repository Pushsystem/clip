"""หมูมาเอง — original cool-jazz score (synthesised: vibraphone, flute, pizzicato bass, brushes, celesta, snaps),
material foley from the page's events, Thai narration, room tone; music ducks ~8 dB under the voice;
two true silences (before the munch, before the punchline). Writes out/mix.wav.
Run: $LIB/.venv/bin/python mix.py   (needs out/events.json from core/render/events.mjs and vo/*.wav)"""
import sys, os, json
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB', '/root/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, norm, brown, clack, whoosh, thump, ding, pop, add, compress, limit

D = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(D, 'out', 'events.json')))
DUR = E['dur']; N = int(round(DUR * SR)); EV = E['ev']
BEAT = 0.5
SILENCES = [(23.0, 23.3), (31.42, 31.85)]
rng = np.random.default_rng(55)
def nz(d): return rng.standard_normal(len(t_(d)))
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def env_ad(d, a=.004, tau=.1):
    x = env_exp(d, tau); n = int(a * SR)
    if n: x[:n] *= np.linspace(0, 1, n)
    return x

# ================================================================= instruments (synthesis)
def vib_note(m, d=1.8, v=.5, trem=.25):
    tt = t_(d); f = hz(m)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 1.1) + .28 * np.sin(2 * np.pi * 4 * f * tt) * np.exp(-tt / .12) + .08 * np.sin(2 * np.pi * 10 * f * tt) * np.exp(-tt / .03)
    x *= np.minimum(1, tt / .003) * (1 - trem * (.5 + .5 * np.sin(2 * np.pi * 5.2 * tt)))
    x[-int(.05 * SR):] *= np.linspace(1, 0, int(.05 * SR))
    return x * v
def celesta(m, v=.4):
    d = 1.4; tt = t_(d); f = hz(m)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / .5) + .4 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt / .15) + .15 * np.sin(2 * np.pi * 4.02 * f * tt) * np.exp(-tt / .05)
    return x * np.minimum(1, tt / .002) * v
def flute(m, d, v=.35):
    tt = t_(d); f = hz(m) * (1 + .006 * np.sin(2 * np.pi * 5.5 * tt) * np.minimum(1, tt / .25))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + .18 * np.sin(2 * ph) + .06 * np.sin(3 * ph) + .05 * bp(nz(d), 1500, 6000)
    e = np.minimum(1, tt / .05) * np.minimum(1, (d - tt) / .07)
    return x * e * v
def bass(m, d=.45, v=.6):
    tt = t_(d); f = hz(m)
    x = np.sin(2 * np.pi * f * tt) + .45 * np.sin(4 * np.pi * f * tt) + .2 * np.sin(6 * np.pi * f * tt)
    x = x * np.exp(-tt / .28) * np.minimum(1, tt / .004) + .3 * lp(nz(d), 900) * np.exp(-tt / .01)
    return x * v
def brush_tap(v=.3):
    d = .14; tt = t_(d); n = nz(d)
    return (bp(n, 1500, 9000) * np.exp(-tt / .04) + .4 * bp(n, 300, 1200) * np.exp(-tt / .02)) * v
def brush_sweep(d=.45, v=.12): n = nz(d); return bp(n, 1800, 7500) * np.sin(np.pi * t_(d) / d) * v
def ride(v=.18):
    d = .6; tt = t_(d); return (hp(nz(d), 5000) * np.exp(-tt / .18) + .3 * np.sin(2 * np.pi * 5200 * tt) * np.exp(-tt / .3)) * v
def bongo(hi=True, v=.4):
    d = .2; tt = t_(d); f = 420 if hi else 300
    return (np.sin(2 * np.pi * f * (1 + .2 * np.exp(-tt / .01)) * tt) * np.exp(-tt / .06) + .2 * bp(nz(d), 800, 3000) * np.exp(-tt / .01)) * v
def snap(v=.5):
    d = .12; tt = t_(d); return (bp(nz(d), 1800, 6000) * np.exp(-tt / .012) + .3 * np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt / .008)) * v

mus = np.zeros((N, 2))
def put(x, t, g=1.0, pan=0.0):
    if 0 <= t < DUR: add(mus, x, t, g, pan)

CH = {'F6': [53, 57, 60, 62], 'Gm7': [55, 58, 62, 65], 'Am7': [57, 60, 64, 67], 'Bb7': [58, 62, 65, 69], 'C9': [60, 64, 67, 70, 74],
      'G6': [55, 59, 62, 64], 'Dm7': [50, 53, 57, 60], 'F69': [53, 57, 62, 67, 69], 'clu': [41, 42, 47, 48]}
ROOT = {'F6': 41, 'Gm7': 43, 'Am7': 45, 'Bb7': 46, 'C9': 48, 'G6': 43, 'Dm7': 38, 'F69': 41}
def chord(name, t, v=.32, d=1.6, roll=.018, pan=-.2):
    for i, m in enumerate(CH[name]): put(vib_note(m, d, v), t + i * roll, 1, pan + i * .1)
def walk(name, t0, t1, v=.55):
    r = ROOT[name]; pat = [0, 4, 7, 9] if name in ('F6', 'G6', 'F69') else [0, 3, 7, 10] if name in ('Gm7', 'Am7', 'Dm7') else [0, 4, 7, 11]
    k = 0; t = t0
    while t < t1 - .05: put(bass(r + pat[k % 4], .45, v), t); k += 1; t += BEAT
def brushes(t0, t1, v=1.0):
    t = t0
    while t < t1 - .05:
        put(brush_sweep(.45, .1 * v), t, 1, -.2)
        if round((t - t0) / BEAT) % 2 == 1: put(brush_tap(.32 * v), t, 1, .1)
        t += BEAT

# --- hook 0–5.2: F6 arpeggio on swung eighths, bass walks in at 1.0
for i in range(10):
    m = CH['F6'][i % 4] + (12 if i % 8 >= 4 else 0)
    put(vib_note(m, 1.0, .26), .0 + i * BEAT * .5 + (.05 if i % 2 else 0), 1, -.3 + .06 * (i % 4))
chord('F6', 2.5, .22); walk('F6', 1.0, 5.2); brushes(1.0, 5.2)
put(flute(72, .6), 3.0); put(flute(74, .35), 3.6); put(flute(77, .9), 4.0)
# --- the five steps: each its own chord on its medallion
STEPS = [(5.2, 13.0, 'F6'), (13.0, 16.4, 'Gm7'), (16.4, 20.2, 'Am7'), (20.2, 23.8, 'Bb7'), (23.8, 28.0, 'C9')]
for t0, t1, c in STEPS:
    chord(c, t0, .34, 1.8)
    walk(c, t0, t1)
    if c == 'Gm7':      # the chase: ride + bongos, double feel
        t = t0
        while t < t1 - .05: put(ride(), t, 1, .35); put(bongo(int((t - t0) / .25) % 2 == 0, .3), t, 1, -.3); put(bongo(False, .22), t + .25, 1, -.3); t += BEAT
    else: brushes(t0, t1, .9)
    if c != 'Gm7':
        for k in range(1, int((t1 - t0) / 2)): chord(c, t0 + k * 2 + 1.0, .16, 1.2, .012)
# flute fragments in step 1 (between the foods)
for t, m, d in [(6.5, 77, .4), (6.9, 76, .4), (8.0, 72, .4), (8.4, 74, .4), (9.5, 77, .3), (9.8, 79, .3), (10.1, 81, .8)]: put(flute(m, d, .3), t)
# celesta on the huts
for t, m in [(17.5, 84), (18.0, 88), (18.5, 91)]: put(celesta(m, .45), t, 1, .3)
# generations: a vibes run up per animal, starburst a step up (G)
for i, t in enumerate([24.0, 24.5, 25.0, 25.5]):
    for j, m in enumerate([60, 64, 67, 72]): put(vib_note(m + i * 2, .9, .2), t + j * .05, 1, -.3 + j * .2)
chord('G6', 26.6, .38, 2.0)
# china: celesta + bass only
walk('Dm7', 28.5, 31.1, .45)
for i, m in enumerate([74, 77, 81, 79, 77]): put(celesta(m, .35), 28.7 + i * .5, 1, .3)
# reversal: snaps + bass, low cluster on ✗, full hit on ✓
t = 31.85
while t < 37.5: put(snap(.4), t + BEAT, 1, .3); walk('F6', t, min(t + 2, 37.5), .5); t += 2
chord('clu', 33.2, .4, 1.4, .0)
chord('F69', 35.7, .42, 2.2); put(flute(84, .9, .3), 35.7)
# ending: the five step chords return, then the final ring
for i, c in enumerate(['F6', 'Gm7', 'Am7', 'Bb7', 'C9']): chord(c, 37.6 + i * .55, .26, 1.4)
chord('F69', 40.4, .42, 1.3, .03); put(bass(41, 1.2, .6), 40.4); put(flute(81, 1.1, .28), 40.4)
mus = lp(mus.T, 9000).T

# ================================================================= foley
def stamp():
    d = .3; tt = t_(d); return norm(np.sin(2 * np.pi * 140 * (1 - .4 * tt) * tt) * env_exp(d, .035) + lp(nz(d), 1800) * env_exp(d, .012) * .9)
def paper_swish(d=.3): return norm(bp(nz(d), 1800, 8000)) * np.sin(np.pi * t_(d) / d) ** 2
def slide_whistle(up=True, d=.32):
    f = np.linspace(700, 1500, len(t_(d))) if up else np.linspace(1500, 700, len(t_(d)))
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * t_(d) / d) ** .6
def iris(d): tt = t_(d); return norm(bp(nz(d), 1000, 6000) * np.linspace(1, .2, len(tt))) * np.sin(np.pi * tt / d)
def pen_write(d=.5): x = bp(nz(d), 2000, 7000) * (0.5 + .5 * np.abs(np.sin(2 * np.pi * 11 * t_(d)))); return norm(x) * np.sin(np.pi * t_(d) / d)
def grab(): return norm(lp(nz(.12), 1500) * env_exp(.12, .02))
def chew():
    d = .14; tt = t_(d); return norm(bp(nz(d), 600, 3500) * (rng.random(len(tt)) > .55) * env_exp(d, .05))
def munch():
    d = .3; tt = t_(d); return norm(bp(nz(d), 400, 4000) * (rng.random(len(tt)) > .4) * env_exp(d, .09) + .5 * np.sin(2 * np.pi * 120 * tt) * env_exp(d, .04))
def hoof(): return norm(clack(1.4, 1)[:int(.08 * SR)])
def cardboard(p=0):
    d = .35; tt = t_(d); return norm(np.sin(2 * np.pi * 95 * 2 ** (p / 12) * (1 - .35 * tt) * tt) * env_exp(d, .06) + lp(nz(d), 900) * env_exp(d, .03) * .8)
def sniff():
    d = .18; tt = t_(d); return norm(bp(nz(d), 2500, 7000)) * np.sin(np.pi * tt / d) ** 2
def birds(d):
    x = np.zeros(len(t_(d)))
    for k in range(5):
        o = int((.3 + k * .62) * SR); dd = .16; tt = t_(dd); f = 3200 + 900 * np.sin(2 * np.pi * 9 * tt)
        c = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / dd) ** 2
        if o + len(c) < len(x): x[o:o + len(c)] += c
    return x * .5
def flies(d):
    tt = t_(d); f = 210 + 30 * np.sin(2 * np.pi * 1.3 * tt)
    saw = (np.cumsum(f) / SR) % 1 * 2 - 1
    return norm(bp(saw, 200, 3000)) * np.minimum(1, tt / .3) * np.minimum(1, (d - tt) / .3) * (0.6 + .4 * np.sin(2 * np.pi * .8 * tt))
def stamp_ok(): x = stamp(); d = ding(1); y = np.zeros(max(len(x), len(d) + int(.03 * SR))); y[:len(x)] += x; y[int(.03 * SR):int(.03 * SR) + len(d)] += d * .5; return norm(y)
def stamp_no():
    x = stamp(); d = .3; tt = t_(d); b = np.sign(np.sin(2 * np.pi * 110 * tt)) * env_exp(d, .12) * .25
    y = np.zeros(max(len(x), len(b))); y[:len(x)] += x; y[:len(b)] += lp(b, 1500); return norm(y)

fx = np.zeros((N, 2)); amb = np.zeros((N, 2)); vo = np.zeros((N, 2))
for e in EV:
    t, ty, g, pan = e['t'], e['type'], e.get('gain', 1.0), e.get('pan', 0.0)
    if ty == 'vo': continue
    if ty == 'pop': add(fx, pop(1), t, .32 * g, .2)
    elif ty == 'sparkle': add(fx, ding(1), t, .25 * g, .2)
    elif ty == 'grab': add(fx, grab(), t, .3)
    elif ty == 'stamp': add(fx, stamp(), t, .7)
    elif ty == 'stamp_ok': add(fx, stamp_ok(), t, .65)
    elif ty == 'stamp_no': add(fx, stamp_no(), t, .65)
    elif ty == 'iris': add(fx, iris(e.get('dur', .4)), t, .22)
    elif ty == 'paper_swish': add(fx, paper_swish(.35), t, .35 * g, .3)
    elif ty == 'slide': add(fx, paper_swish(.22), t, .14, -.4)
    elif ty == 'chew': add(fx, chew(), t, .3 * g, .1)
    elif ty == 'munch': add(fx, munch(), t, .7 * g, .2)
    elif ty == 'hoof': add(fx, hoof(), t, .3 * g, pan)
    elif ty == 'whoosh': add(fx, whoosh(e.get('dur', .4), 1), t, .3)
    elif ty == 'whistle': add(fx, slide_whistle(e.get('up', 0) == 1), t, .16)
    elif ty == 'box_thump': add(fx, cardboard(e.get('pitch', 0)), t, .6, pan)
    elif ty == 'birds': add(amb, birds(e.get('dur', 3)), t, .05, .4)
    elif ty == 'flies': add(amb, flies(e.get('dur', 2)), t, .04, -.2)
    elif ty == 'sniff': add(fx, sniff(), t, .3, .3)
    elif ty == 'pen_write': add(fx, pen_write(e.get('dur', .4)), t, .14, -.2)
    elif ty == 'vib_up': pass   # carried by the score

# narration
venv = np.zeros(N)
for e in EV:
    if e['type'] != 'vo': continue
    y, sr = sf.read(os.path.join(D, 'vo', e['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    if sr != SR:
        import soxr; y = soxr.resample(y, sr, SR)
    y = compress(norm(y, .9), thr=.3, ratio=3.0)
    add(vo, y, e['t'], .9, 0)
    s = int(e['t'] * SR); venv[s:s + len(y)] = 1

# room tone + a quiet clock on the half-note grid
room = lp(brown(DUR), 900) * .016
amb += np.stack([room, np.roll(room, 311)], 1)
for k in range(int(DUR / (2 * BEAT))): add(amb, clack(1.1, 1)[:int(.1 * SR)], k * 2 * BEAT, .025, -.6)

# ducking
k = int(.12 * SR); sm = np.convolve(venv, np.ones(k) / k, 'same')
mus *= (1 - sm * (1 - 10 ** (-8 / 20)))[:, None]

def gate(buf, a, b, fade=.02):
    s, e = int(a * SR), int(b * SR); f = int(fade * SR); m = np.ones(N); m[s:e] = 0
    m[max(0, s - f):s] = np.linspace(1, 0, min(f, s)); m[e:e + f] = np.linspace(0, 1, len(m[e:e + f])); buf *= m[:, None]
for a, b in SILENCES:
    gate(mus, a, b); gate(amb, a, b); gate(fx, a, b)

mus = norm(mus, .5)
mix = mus * .7 + fx * .9 + vo + amb
mix = limit(mix, .95)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out', 'mix.wav'), mix.astype(np.float32), SR)
sf.write(os.path.join(D, 'out', 'score.wav'), mus.astype(np.float32), SR)
r = lambda x: 20 * np.log10(np.sqrt(np.mean(x[np.abs(x).sum(1) > 1e-4] ** 2)) + 1e-9)
print('mix.wav', mix.shape, 'peak', round(float(np.abs(mix).max()), 3), 'voice rms dB', round(r(vo), 1), 'music rms dB', round(r(mus * .7), 1))
