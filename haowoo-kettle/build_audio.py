"""Builds timeline.json, a per-frame voice envelope and the final audio mix (45 s)."""
import json, subprocess, numpy as np, wave

SR, FPS, TOTAL = 44100, 30, 45.0
L = json.load(open('script.json'))

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def reson(x, f, q):
    """2-pole resonator (formant)."""
    r = np.exp(-np.pi * f / q / SR); c = 2 * r * np.cos(2 * np.pi * f / SR)
    y = np.zeros_like(x); y1 = y2 = 0.0
    for i, v in enumerate(x):
        y0 = (1 - r) * v + c * y1 - r * r * y2; y[i] = y0; y2, y1 = y1, y0
    return y

def oink(seed=0, n_grunts=2, k=1.45):
    """Synthesized pig grunt 'oink-oink': jittery low pulse train + breath through nasal formants."""
    g = np.random.default_rng(seed); out = []
    for _ in range(n_grunts):
        d = (.22 + .05 * g.random()) / 1.3; m = int(d * SR); x = np.arange(m) / SR
        f0 = k * (165 - 70 * x / d) + 18 * g.standard_normal(m).cumsum() / np.sqrt(m) * 3   # falling, rough pitch
        ph = np.cumsum(f0 / SR); pulse = ((ph % 1) < .12).astype(np.float32) - .12
        src = pulse + .35 * g.standard_normal(m)                                        # buzz + snorty breath
        y = reson(src, 520 * k, 5) + .8 * reson(src, 1250 * k, 7) + .35 * reson(src, 2600 * k, 9)
        env = np.minimum(1, x / .02) * np.exp(-3.5 * x / d) * (1 + .5 * np.sin(2 * np.pi * 28 * x))  # flutter
        y = y * env; out += [y / np.max(np.abs(y)), np.zeros(int(.07 * SR))]
    return np.concatenate(out).astype(np.float32) * .5

# ---------- voice track + timeline ----------
vo = np.zeros(int(SR * TOTAL), np.float32)
t, GAP, timeline, oinks = 0.55, 0.45, [], [0.02]
for i, l in enumerate(L):
    a = load(f'audio/vo{i}.wav')
    s = int(t * SR); vo[s:s + len(a)] += a[: len(vo) - s]
    dur = len(a) / SR
    timeline.append({'scene': l['scene'], 'cap': l['cap'].split('|'), 'start': round(t, 3), 'end': round(t + dur, 3)})
    t += dur + GAP
    if l.get('oinkAfter'): oinks.append(t - GAP + .1); t += .45
# scene boundaries: each scene runs until the next one's voice begins; last one to the end
for i, s in enumerate(timeline):
    s['sceneStart'] = 0 if i == 0 else round(timeline[i]['start'] - 0.25, 3)
    s['sceneEnd'] = TOTAL if i == len(timeline) - 1 else round(timeline[i + 1]['start'] - 0.25, 3)
assert t < TOTAL, t
if t - GAP + .8 < TOTAL: oinks.append(t - GAP + .2)

# per-frame RMS envelope (drives the pig "talking" bounce)
hop = SR // FPS
env = [float(np.sqrt(np.mean(vo[i:i + hop] ** 2))) for i in range(0, len(vo), hop)][: int(TOTAL * FPS)]
m = max(env); env = [round(min(1, e / m * 1.6), 3) for e in env]
json.dump({'total': TOTAL, 'fps': FPS, 'scenes': timeline, 'env': env}, open('timeline.json', 'w'), ensure_ascii=False)

# ---------- music bed (original, synthesized) ----------
n = len(vo); tt = np.arange(n) / SR
bpm = 104; beat = 60 / bpm
mus = np.zeros(n, np.float32)
def add(sig, at):
    s = int(at * SR); e = min(n, s + len(sig)); mus[s:e] += sig[: e - s]
def tone(f, d, amp, kind='sine', dec=6):
    x = np.arange(int(d * SR)) / SR
    w = np.sin(2 * np.pi * f * x) if kind == 'sine' else (2 * ((f * x) % 1) - 1) * 0.5
    return (amp * w * np.exp(-dec * x)).astype(np.float32)
kick = (np.sin(2 * np.pi * (50 + 90 * np.exp(-30 * np.arange(int(.3 * SR)) / SR)) * np.arange(int(.3 * SR)) / SR)
        * np.exp(-9 * np.arange(int(.3 * SR)) / SR)).astype(np.float32) * .9
rng = np.random.default_rng(1)
hat = (rng.standard_normal(int(.05 * SR)) * np.exp(-90 * np.arange(int(.05 * SR)) / SR)).astype(np.float32) * .12
clap = (rng.standard_normal(int(.15 * SR)) * np.exp(-25 * np.arange(int(.15 * SR)) / SR)).astype(np.float32) * .25
# F – C – Dm – Bb
chords = [[87.31, 220.0, 261.6, 349.2], [65.41, 196.0, 261.6, 329.6], [73.42, 220.0, 293.7, 349.2], [58.27, 233.1, 293.7, 349.2]]
b = 0; k = 0.0
while k < TOTAL:
    bar, pos = divmod(b, 4)
    add(kick, k)
    if pos in (1, 3): add(clap, k)
    add(hat, k + beat / 2); add(hat * .6, k)
    ch = chords[(bar // 1) % 4]
    if pos == 0:
        for f in ch[1:]: add(tone(f, beat * 4, .05, 'saw', 1.2), k)
    add(tone(ch[0], beat * .9, .35, 'sine', 3), k); add(tone(ch[0] * 2, beat * .4, .12, 'sine', 8), k + beat / 2)
    # little pluck melody
    mel = [ch[2] * 2, ch[3] * 2, ch[1] * 2, ch[3] * 2][pos]
    if b % 2 == 0: add(tone(mel, .25, .06, 'sine', 12), k + beat * .75)
    b += 1; k += beat
# whoosh on each scene change + ding on CTA
for s in timeline[1:]:
    d = int(.35 * SR); x = np.arange(d) / SR
    w = rng.standard_normal(d) * np.sin(np.pi * x / .35) ** 2 * .25
    add(np.convolve(w, np.ones(8) / 8, 'same').astype(np.float32), s['sceneStart'] - .12)
add(tone(1318.5, .6, .18, 'sine', 5), timeline[-1]['sceneStart'] + .1); add(tone(1760, .5, .14, 'sine', 5), timeline[-1]['sceneStart'] + .18)

# pig oinks sit in the pauses only, never over speech
sfx = np.zeros(n, np.float32)
for j, at in enumerate(oinks):
    o = oink(j, 2 if j % 2 == 0 else 1); st = int(at * SR); e = min(n, st + len(o)); sfx[st:e] += o[: e - st]
print('oinks at', [round(o, 2) for o in oinks])
# sidechain-style ducking under the voice
venv = np.convolve(np.abs(vo), np.ones(SR // 10) / (SR // 10), 'same')
duck = 1 - 0.55 * np.clip(venv / (venv.max() * .25), 0, 1)
fade = np.clip(np.minimum(tt / .3, (TOTAL - tt) / 1.2), 0, 1)
mix = vo * 1.0 + sfx * 0.4 + mus * 0.32 * duck * fade
mix = mix / np.max(np.abs(mix)) * 0.93
with wave.open('audio/mix.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
for s in timeline: print(s['scene'], s['sceneStart'], s['start'], s['end'], s['sceneEnd'])
