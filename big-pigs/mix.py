"""5 หมูตัวโต — original cool-jazz score (synthesised: vibraphone, flute, pizzicato bass, brushes, celesta, snaps),
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
SILENCES = [(17.0, 17.4)]
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

def snare_roll(t0, d, v=.25):
    n = int(d / .0625)
    for i in range(n): put(brush_tap(v * (.5 + .5 * i / n)), t0 + i * .0625, 1, -.1)
def snare_roll(t0, d, v=.25):
    n = int(d / .0625)
    for i in range(n): put(brush_tap(v * (.5 + .5 * i / n)), t0 + i * .0625, 1, -.1)
# --- hook 0–3.0: five rising vibes notes for five silhouettes, then the title chord
for i, m_ in enumerate([60, 64, 67, 70, 72]): put(vib_note(m_, 1.0, .3), 0.2 + i * .25, 1, -.4 + .2 * i)
chord('F6', 1.5, .32, 1.6); walk('F6', 1.5, 3.0); brushes(1.5, 3.0, .8)
# --- countdown: each breed a chord one step higher, trotting bass, ride from #3
CD = [(3.0, 7.2, 'F6'), (7.2, 10.6, 'Gm7'), (10.6, 14.1, 'Am7'), (14.1, 17.0, 'Bb6')]
for i, (t0, t1, c) in enumerate(CD):
    chord(c, t0, .32 + i * .02, 1.6); walk(c, t0, t1, .5 + i * .03); brushes(t0, t1, .8)
    if i >= 2:
        t = t0
        while t < t1 - .05: put(ride(.13), t, 1, .35); t += BEAT
    for k, m_ in enumerate([72, 74, 77]): put(flute(m_ + i * 2, .3, .26), t0 + 1.35 + k * .2)
snare_roll(15.8, 1.2, .3)
# --- #1 17.4–21.0 after the silence: the big hit, celebration
chord('C9', 17.4, .48, 2.4, .02); put(bass(36, 1.2, .7), 17.4); walk('C9', 17.9, 21.0, .55)
t = 17.4
while t < 20.95: put(ride(.16), t, 1, .35); put(bongo(int((t - 17.4) / .5) % 2 == 0, .26), t, 1, -.3); t += BEAT
# --- Big Bill 21.0–32.4: low, weighty, then the scale
low = lambda m_: put(bass(m_, .9, .7), 0)
chord('Dm7', 21.0, .3, 1.8); walk('Dm7', 21.0, 26.9, .55); brushes(21.0, 26.9, .7)
for k in range(14): put(vib_note(62 + k, .25, .14), 23.4 + k * .085, 1, .2)
chord('Bb69', 24.6, .4, 1.8)
chord('F6', 27.4, .3, 1.4); walk('F6', 27.4, 32.4, .5); brushes(27.4, 32.4, .7)
chord('F69', 29.9, .44, 2.2, .02); put(flute(84, 1.0, .3), 30.0)
# --- end 32.4–38.4: the seesaw settles, final button
chord('Gm7', 32.6, .28, 1.4); walk('Gm7', 32.6, 34.8, .45); chord('C9', 34.8, .3, 1.2)
chord('F69', 35.4, .4, 2.0, .02); walk('F6', 35.4, 37.5, .45); chord('F69', 37.5, .34, 1.0, .03); put(bass(29, 1.0, .6), 37.5)
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

def bang():
    d = .9; tt = t_(d); return norm(lp(nz(d), 2500) * np.exp(-tt / .12) + 1.2 * nz(d) * np.exp(-tt / .015) + .6 * np.sin(2 * np.pi * 60 * tt) * np.exp(-tt / .2))
def cock(): return norm(np.concatenate([clack(1.6, 1)[:int(.06 * SR)], np.zeros(int(.08 * SR)), clack(1.2, 1)[:int(.08 * SR)]]))
def coin(): d = .6; tt = t_(d); return norm(sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / dd) for f, dd in [(2100, .3), (3150, .2), (4700, .1)]))
def march(d):
    x = np.zeros(len(t_(d)))
    for k in range(int(d / .25)):
        o = int(k * .25 * SR); c = lp(nz(.08), 600) * env_exp(.08, .015); x[o:o + len(c)] += c[:len(x) - o]
    return norm(x)
def horn(): d = 1.0; tt = t_(d); f = 110; x = sum(np.sin(2 * np.pi * f * h * tt) / h for h in range(1, 7)); return norm(lp(x, 1200)) * np.minimum(1, tt / .08) * np.minimum(1, (d - tt) / .2)
def clunk():
    a = thump(1, 90)[:int(.25 * SR)]; b = clack(.7, 1)[:int(.25 * SR)]; n = max(len(a), len(b)); return norm(np.pad(a, (0, n - len(a))) + .5 * np.pad(b, (0, n - len(b))))
def tick(): return norm(clack(1.5, 1)[:int(.05 * SR)])
def harp():
    x = np.zeros(int(1.6 * SR))
    for i, m_ in enumerate([67, 71, 74, 79, 83, 86]):
        d = 1.0; tt = t_(d); n = np.sin(2 * np.pi * hz(m_) * tt) * np.exp(-tt / .4); o = int(i * .07 * SR); x[o:o + len(n)] += n
    return norm(x)

def oink():
    d = .35; tt = t_(d); f = 220 + 80 * np.sin(np.pi * tt / d); saw = (np.cumsum(f) / SR) % 1 * 2 - 1
    return norm(bp(saw * (0.6 + .4 * np.sin(2 * np.pi * 30 * tt)), 300, 2500)) * np.sin(np.pi * tt / d) ** .5
def clink(): d = .5; tt = t_(d); return norm(sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / dd) for f, dd in [(2600, .2), (3900, .12), (5200, .06)]))
def paper_flick(): d = .1; tt = t_(d); return norm(bp(nz(d), 2000, 8000) * np.exp(-tt / .02))
def lid():
    d = .7; tt = t_(d); return norm(sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / dd) for f, dd in [(880, .4), (1320, .25), (2310, .12)]) + .4 * bp(nz(d), 1500, 6000) * np.exp(-tt / .03))
def rustle(): d = .8; tt = t_(d); return norm(bp(nz(d), 1500, 6000) * (rng.random(len(tt)) > .6)) * np.sin(np.pi * tt / d)
def sizzle(d):
    tt = t_(d); x = hp(nz(d), 3000) * (0.5 + .5 * (rng.random(len(tt)) > .97))
    return norm(lp(x, 9000)) * np.minimum(1, tt / .2) * np.minimum(1, (d - tt) / .3)

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
    elif ty == 'oink': add(fx, oink(), t, .3, .2)
    elif ty == 'clink': add(fx, clink(), t, .2, -.2)
    elif ty == 'paper_flick': add(fx, paper_flick(), t, .2 * g, -.3 + (t % 1) * .6)
    elif ty == 'lid': add(fx, lid(), t, .45, .2)
    elif ty == 'rustle': add(fx, rustle(), t, .3, .3)
    elif ty == 'bang': add(fx, bang(), t, .9, .1)
    elif ty == 'cock': add(fx, cock(), t, .35, -.2)
    elif ty == 'coin': add(fx, coin(), t, .3 * g, .2)
    elif ty == 'march': add(fx, march(e.get('dur', 1)), t, .3, 0)
    elif ty == 'horn': add(fx, horn(), t, .25 * g, -.3)
    elif ty == 'clunk': add(fx, clunk(), t, .35, .2)
    elif ty == 'tick': add(fx, tick(), t, .2, .3)
    elif ty == 'harp': add(fx, harp(), t, .3, 0)
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
