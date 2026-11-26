"""หมูกระทะมาจากไหน — original cool-jazz score (synthesised: vibraphone, flute, pizzicato bass, brushes, celesta, snaps),
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
SILENCES = [(28.95, 29.35)]
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

CH = {'Bb6': [58, 62, 65, 67], 'Cm7': [60, 63, 67, 70], 'Eb7': [63, 67, 70, 74], 'Gm7b': [55, 58, 62, 65], 'Eb6': [55, 58, 60, 63], 'F9': [57, 60, 63, 67], 'C69': [60, 64, 69, 74, 76], 'Bb69': [58, 62, 67, 72, 74], 'clu2': [43, 44, 49, 50], 'F6': [53, 57, 60, 62], 'Gm7': [55, 58, 62, 65], 'Am7': [57, 60, 64, 67], 'Bb7': [58, 62, 65, 69], 'C9': [60, 64, 67, 70, 74],
      'G6': [55, 59, 62, 64], 'Dm7': [50, 53, 57, 60], 'F69': [53, 57, 62, 67, 69], 'clu': [41, 42, 47, 48]}
ROOT = {'Bb6': 34, 'Cm7': 36, 'Eb7': 39, 'Eb6': 39, 'F9': 41, 'C69': 36, 'Bb69': 34, 'F6': 41, 'Gm7': 43, 'Am7': 45, 'Bb7': 46, 'C9': 48, 'G6': 43, 'Dm7': 38, 'F69': 41}
def chord(name, t, v=.32, d=1.6, roll=.018, pan=-.2):
    for i, m in enumerate(CH[name]): put(vib_note(m, d, v), t + i * roll, 1, pan + i * .1)
def walk(name, t0, t1, v=.55):
    r = ROOT[name]; pat = [0, 4, 7, 9] if name in ('F6', 'G6', 'F69', 'Bb6', 'Eb6', 'C69', 'Bb69') else [0, 3, 7, 10] if name in ('Gm7', 'Am7', 'Dm7', 'Cm7') else [0, 4, 7, 11]
    k = 0; t = t0
    while t < t1 - .05: put(bass(r + pat[k % 4], .45, v), t); k += 1; t += BEAT
def brushes(t0, t1, v=1.0):
    t = t0
    while t < t1 - .05:
        put(brush_sweep(.45, .1 * v), t, 1, -.2)
        if round((t - t0) / BEAT) % 2 == 1: put(brush_tap(.32 * v), t, 1, .1)
        t += BEAT

# --- hook 0–3.6: sizzle + vibes run on Bb6, bass enters at 0.5
for i in range(7): put(vib_note([58, 62, 65, 67, 70, 74, 77][i], 1.0, .26), .1 + i * .25, 1, -.3 + .1 * i)
walk('Bb6', .5, 3.6); brushes(.5, 3.6)
# --- three legends: each its own chord + colour of the band
LEG = [(3.6, 8.4, 'Cm7'), (8.4, 12.6, 'Dm7'), (12.6, 16.0, 'Eb7')]
for t0, t1, c in LEG:
    chord(c, t0, .34, 1.8); walk(c, t0, t1)
    for k in range(1, int((t1 - t0) / 2) + 1): chord(c, t0 + k * 2 - 1.0, .16, 1.2, .012)
brushes(3.6, 8.4)
t = 8.4                       # japan: ride + soft bongos
while t < 12.55: put(ride(.14), t, 1, .35); put(bongo(True, .2), t + .25, 1, -.3); t += BEAT
brushes(12.6, 16.0, .8)
for t, m_ in [(4.6, 70), (4.9, 72), (5.2, 74), (6.3, 77), (9.6, 74), (10.0, 72), (13.8, 75), (14.2, 74), (14.6, 70)]: put(flute(m_, .4, .28), t)
# --- turn: celesta + bass only, a cluster on the "?"
walk('Gm7', 16.0, 19.6, .45)
for i, m_ in enumerate([79, 82, 86, 84, 82, 79]): put(celesta(m_, .35), 16.2 + i * .5, 1, .3)
chord('clu2', 17.2, .35, 1.2, 0)
# --- the Thai recipe: brighter, Bb6 → Eb6 → F9, finger snaps
REC = [(19.6, 23.2, 'Bb6'), (23.2, 26.4, 'Eb6'), (26.4, 28.95, 'F9')]
for t0, t1, c in REC:
    chord(c, t0, .36, 1.8); walk(c, t0, t1, .55)
    t = t0
    while t < t1 - .05: put(snap(.32), t + BEAT, 1, .3); t += 2 * BEAT
brushes(19.6, 28.95, .9)
for i, t in enumerate([20.4, 21.2]): put(celesta(86 + i * 3, .4), t, 1, .3)
for k in range(8): put(vib_note(82 - k, .4, .12), 23.9 + k * .28, 1, .2)
# --- payoff (after the silence): ride, double feel, chord a step up (C)
chord('C69', 29.35, .4, 2.0); walk('C69', 29.35, 33.2, .55)
t = 29.35
while t < 33.15: put(ride(.17), t, 1, .35); put(bongo(int((t - 29.35) / .5) % 2 == 0, .26), t, 1, -.3); t += BEAT
# --- end: the chords of the film return, final Bb6/9
for i, c in enumerate(['Cm7', 'Dm7', 'Eb7', 'F9']): chord(c, 33.45 + i * .6, .26, 1.4)
walk('Bb6', 33.2, 35.6, .5)
chord('Bb69', 35.6, .42, 2.4, .03); put(flute(82, 1.0, .3), 35.6)
chord('Bb69', 37.6, .3, .9, .02); put(bass(34, 1.0, .6), 37.6)
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

def sizzle(d):
    tt = t_(d); x = hp(nz(d), 3000) * (0.5 + .5 * (rng.random(len(tt)) > .97)) 
    return norm(lp(x, 9000)) * np.minimum(1, tt / .2) * np.minimum(1, (d - tt) / .3)
def crackle(d):
    tt = t_(d); x = np.zeros(len(tt)); idx = rng.integers(0, len(tt), int(d * 18))
    for i in idx: x[i:i + 200] += np.exp(-np.arange(min(200, len(tt) - i)) / 30) * rng.uniform(.3, 1)
    return norm(bp(x, 800, 6000) + .3 * lp(nz(d), 400))
def metal():
    d = .8; tt = t_(d); return norm(sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / dd) for f, dd in [(523, .5), (1311, .25), (2210, .12), (3170, .08)]) + .5 * lp(nz(d), 2000) * np.exp(-tt / .02))
def slap(): d = .12; tt = t_(d); return norm(bp(nz(d), 500, 3000) * np.exp(-tt / .02))
def simmer(d):
    x = np.zeros(len(t_(d)))
    for i in rng.integers(0, len(x) - 3000, int(d * 7)):
        dd = .05; tt = t_(dd); f = rng.uniform(300, 700); b = np.sin(2 * np.pi * f * (1 + 2 * tt) * tt) * np.exp(-tt / .015); x[i:i + len(b)] += b
    return norm(x)
def drip(): d = .2; tt = t_(d); return norm(np.sin(2 * np.pi * (900 + 1400 * tt / d) * tt) * np.exp(-tt / .04))
def dip(): d = .35; tt = t_(d); return norm(lp(nz(d), 1200) * np.exp(-tt / .06) + .4 * np.sin(2 * np.pi * 220 * tt) * np.exp(-tt / .05))
def creak_s(): d = .5; tt = t_(d); return norm(bp(np.sign(np.sin(2 * np.pi * (80 + 40 * np.sin(2 * np.pi * 3 * tt)) * tt)), 300, 2000)) * np.sin(np.pi * tt / d)

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
    elif ty == 'sizzle': add(amb, sizzle(e.get('dur', 2)), t, .05 * g, .1)
    elif ty == 'fire': add(amb, crackle(e.get('dur', 3)), t, .07, .3)
    elif ty == 'metal': add(fx, metal(), t, .5, .2)
    elif ty == 'slap': add(fx, slap(), t, .4, .2)
    elif ty == 'simmer': add(amb, simmer(e.get('dur', 3)), t, .05, -.2)
    elif ty == 'drip': add(fx, drip(), t, .22, .2)
    elif ty == 'dip': add(fx, dip(), t, .5, .2)
    elif ty == 'creak': add(fx, creak_s(), t, .15, .2)

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
