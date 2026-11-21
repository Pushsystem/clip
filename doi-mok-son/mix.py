"""ดอยหมอกสน — score (sampled marimba / glockenspiel / vibraphone / woodblock + modelled kalimba & music box) + foley + ambience → out/mix.wav
Run with the library's venv: "$LIB/.venv/bin/python" mix.py   (LIB from the environment)"""
import os, sys, json
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, lp, hp, bp, noise, brown, norm, t_, env_exp, step, pop, whoosh, ignite, limit
import soxr

HERE = os.path.dirname(os.path.abspath(__file__))
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
DUR = 30.0; N = int(DUR * SR)
S.seed(3); rng = np.random.default_rng(11)
B = .5; X = .125   # beat, 16th
m = lambda n: S.midi(n)

# ——— score ———
ev = []
def n(t, inst, p, d, v, pan=0, g=1): ev.append((t, inst, p, d, v, pan, g))
# A (0–10): marimba ostinato, voices added one at a time
OST = ['D4', 'A4', 'F#4', 'A4', 'E4', 'A4', 'F#4', 'B4', 'D4', 'A4', 'F#4', 'A4', 'E4', 'B4', 'A4', 'F#4']
for k in range(int(10 / X)):
    t = k * X; p = OST[k % 16]
    if t < 2 and k % 2: continue                      # bar 1: 8ths only
    n(t, 'marimba', p, .3, .52 + .12 * (k % 4 == 0), -.25)
    if t >= 4 and k % 4 == 2: n(t, 'marimba', S.name(m(p) + 12), .3, .38, .35)   # second marimba, upper octave answers
for k in range(int(4 / B), int(10 / B)):
    t = k * B; n(t, 'marimba', ['D2', 'D2', 'A2', 'A2', 'B1', 'B1', 'G2', 'A2'][k % 8], .5, .62, 0)
for k in range(int(4 / (2 * X)), int(10 / (2 * X))):
    n(k * 2 * X, 'woodblock', 'a' if k % 2 == 0 else 'b', None, .22 + .1 * (k % 4 == 0), .5)   # footsteps on the trail
# B (10–14): G chord; glockenspiel on every tent
OST_B = ['D4', 'B4', 'G4', 'B4', 'D5', 'B4', 'G4', 'A4']
for k in range(int(10 / X), int(14 / X)):
    t = k * X; p = (OST if t < 12 else OST_B)[k % (16 if t < 12 else 8)]
    n(t, 'marimba', p, .3, .55, -.25)
    if k % 4 == 2: n(t, 'marimba', S.name(m(p) + 12), .3, .4, .35)
for k in range(int(10 / B), int(14 / B)): n(k * B, 'marimba', ['D2', 'A2', 'G2', 'D2'][k % 4] if k * B < 12 else ['G1', 'D2', 'G2', 'D2'][k % 4], .5, .62)
for i, (t, p) in enumerate(zip([10.5, 11.0, 11.5, 12.0], ['A5', 'B5', 'D6', 'F#6'])): n(t, 'glockenspiel', p, 2.0, .7, [-.5, .3, -.2, .5][i])
# C (14–21): vibraphone chords, marimba gets denser and higher as the night speeds up
CH = [(14, ['B3', 'D4', 'F#4', 'A4']), (16, ['G3', 'B3', 'D4', 'F#4']), (18, ['E3', 'G3', 'B3', 'D4']), (20, ['A3', 'C#4', 'E4', 'A4'])]
for t, ps in CH:
    for j, p in enumerate(ps): n(t + j * .03, 'vibraphone', p, 2.2, .5, -.3 + .2 * j)
OST_C = ['B4', 'F#4', 'D5', 'F#4', 'A4', 'F#4', 'D5', 'E5']
for k in range(int(14 / X), int(21.2 / X)):
    t = k * X; p = OST_C[k % 8]
    n(t, 'marimba', p, .3, .5 + .1 * (t > 17), -.2)
    if t >= 17: n(t + X / 2, 'marimba', S.name(m(p) + 12), .2, .32, .4)
    if k % 4 == 0: n(t, 'marimba', ['B1', 'G1', 'E2', 'A1'][min(3, int((t - 14) / 2))], .5, .6)
for k in range(int(14 / (4 * X)), int(21 / (4 * X))): n(k * 4 * X, 'woodblock', 'c', None, .16, .55)
# E (26–30): the theme on a music box, then a ringing D chord
mus_ev = []
for t, p in [(26.0, 'F#5'), (26.5, 'E5'), (27.0, 'D5'), (27.5, 'A4'), (28.0, 'B4'), (28.25, 'D5'), (28.5, 'E5')]: mus_ev.append((t, p))
for p in ['D4', 'F#4', 'A4', 'D5']: n(29.0, 'vibraphone', p, 2.0, .45, 0)
n(29.0, 'glockenspiel', 'F#6', 2.0, .5, .2); n(29.0, 'marimba', 'D2', 1.0, .5)

music = S.render(ev, dur=DUR)
music = S.room(music, size=.35, mix=.14)

# tape-stop at 21.0: varispeed the last 0.9 s down to 0.15×, then true silence
ts0, ts1 = 20.25, 21.0
seg0 = music[int(ts0 * SR):int(22.5 * SR)].copy()
rate = np.ones(int((ts1 - ts0 + .9) * SR))
L = len(rate); k0 = int((ts1 - ts0 - .15) * SR)
rate[k0:] = np.linspace(1, .12, L - k0) ** 1.4
pos = np.cumsum(rate); pos = pos[pos < len(seg0) - 1]
out = np.stack([np.interp(pos, np.arange(len(seg0)), seg0[:, c]) for c in range(2)], 1)
fade = np.ones(len(out)); fade[-int(.25 * SR):] = np.linspace(1, 0, int(.25 * SR)); out *= fade[:, None]
music[int(ts0 * SR):] = 0
e = int(ts0 * SR) + len(out); music[int(ts0 * SR):e] = out[:N - int(ts0 * SR)]
# kalimba: one note when the yellow hiker points at the sun; the music box theme after
for t, p, v in [(24.0, 'A4', .75), (24.45, 'D5', .45)]: add(music, P.pluck('kalimba', p, None, v), t, .55, -.15)
for t, p in mus_ev: add(music, P.pluck('music_box', p, None, .7), t, .42, .1)

# ——— ambience & foley ———
fx = np.zeros((N, 2), np.float32)
def bed(x, t0, t1, g, pan=0, fi=.3, fo=.3):
    d = t1 - t0; x = x[:int(d * SR)]; tt = t_(d)[:len(x)]
    e = np.minimum(1, tt / fi) * np.minimum(1, (d - tt) / fo); add(fx, x * e, t0, g, pan)
wind = norm(lp(brown(DUR), 900))
bed(wind, 0, 20.2, .12); bed(wind[int(3 * SR):], 21.75, 30, .16, fi=1.8, fo=.4)
hiss = norm(hp(noise(DUR), 5000)) * (.6 + .4 * np.sin(np.arange(N) / SR * 2 * np.pi * 8))   # sped-up world, flickers on the 16ths
bed(hiss, 0, 20.9, .035)
# crickets at ×thousands: a dense high chirr (J-cut: starts before the cut at 14)
cr = np.sin(2 * np.pi * 4700 * t_(8)) * (np.abs(np.sin(2 * np.pi * 26 * t_(8))) ** 4) * (.6 + .4 * np.sin(2 * np.pi * 3.1 * t_(8)))
bed(cr, 13.6, 20.8, .06, .2, fi=.4)
# van engine, sped up: a buzzing saw that rises, then brakes
d = 1.6; tt = t_(d); f = 120 + 160 * (tt / d) ** .5 - 120 * np.clip((tt - 1.2) / .3, 0, 1)
saw = 2 * ((np.cumsum(f) / SR) % 1) - 1; add(fx, norm(lp(saw, 1200)) * np.minimum(1, tt / .2) * .5, 0, .22, .3)
def chirp(f0, f1, d, v=1):
    tt = t_(d); f = np.linspace(f0, f1, len(tt)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2 * v
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'brake': add(fx, bp(noise(.35), 2500, 4200) * env_exp(.35, .12), t, .08, .3)
    if ty == 'door': add(fx, step(1), t, .25, .3); add(fx, step(.7), t + .06, .15, .3)
    if ty == 'hop': add(fx, pop(1), t, .07, .2 - .1 * e.get('i', 0))
    if ty == 'step': add(fx, step(.6 + .4 * rng.random()), t, .05, rng.uniform(-.3, .3))
    if ty == 'tent': add(fx, whoosh(.3), t - .12, .22, [-.5, .3, -.2, .5][e['i']]); add(fx, lp(noise(.08), 900) * env_exp(.08, .02), t + .1, .25)
    if ty == 'fire': add(fx, ignite(1), t, .3)
    if ty == 'bird':   # first sound of real time
        for k, (dt, f0, f1, dd) in enumerate([(0, 3200, 4300, .09), (.13, 3400, 4600, .08), (.3, 4100, 3000, .14)]): add(fx, chirp(f0, f1, dd), t + dt, .2, -.4)
# fire crackle: fast in time-lapse, sparse in real time
for k in range(900):
    t = 16 + rng.random() * 2.4
    add(fx, hp(noise(.012), 2000) * env_exp(.012, .003) * rng.random(), t, .17, rng.uniform(-.2, .2))
for k in range(18):
    add(fx, hp(noise(.01), 2500) * env_exp(.01, .003), 22.3 + rng.random() * 7.5, .1, .1)
# real-time morning birds (sparse, after the silence)
for k in range(16):
    t = 22.9 + k * .45 + rng.random() * .35
    if 23.4 < t < 24.0: continue    # second near-silence before the kalimba
    f0 = rng.uniform(2600, 4200); add(fx, chirp(f0, f0 * rng.uniform(.8, 1.3), rng.uniform(.06, .14)), t, .09 + .05 * rng.random(), rng.uniform(-.7, .7))
# real-time distant bulbul-like phrase near the end
for k, (dt, f) in enumerate([(0, 2100), (.16, 2600), (.32, 2300), (.52, 2900)]): add(fx, chirp(f, f * 1.1, .12), 27.2 + dt, .1, .6)

mix = music * .9 + fx
for c in range(2): mix[:, c] = limit(mix[:, c], .95)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix →', os.path.join(HERE, 'out', 'mix.wav'), 'peak', float(np.abs(mix).max()))
with open(os.path.join(HERE, 'out', 'credits_instruments.txt'), 'w') as f: f.write('\n'.join(S.credits(['marimba', 'glockenspiel', 'vibraphone', 'woodblock']))) 
