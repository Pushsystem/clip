"""Thai speech check: transcribe every vo/<id>.wav with faster-whisper and compare character by character
(Thai has no spaces, so the library's word comparison does not apply). Exit 1 if any line is below the threshold.
Usage: $LIB/.venv/bin/python tools/asr_th.py vo/lines.json vo [--model small] [--threshold 0.8]"""
import sys, json, os, re, difflib, argparse
ap = argparse.ArgumentParser(); ap.add_argument('lines'); ap.add_argument('dir'); ap.add_argument('--model', default='small'); ap.add_argument('--threshold', type=float, default=0.8)
a = ap.parse_args()
from faster_whisper import WhisperModel
m = WhisperModel(a.model, device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[\s\.\,\?\!…"\'ๆ]', '', s)
bad = 0; out = {}
for L in json.load(open(a.lines)):
    want = norm(L.get('say') or L['text'])
    segs, _ = m.transcribe(os.path.join(a.dir, L['id'] + '.wav'), language='th', beam_size=5, word_timestamps=False)
    got = ''.join(s.text for s in segs)
    r = difflib.SequenceMatcher(None, want, norm(got)).ratio()
    ok = r >= a.threshold or (L.get('asr') and norm(L['asr']) == norm(got))
    bad += not ok; out[L['id']] = {'got': got, 'ratio': round(r, 3)}
    print(('OK  ' if ok else 'BAD ') + f"{L['id']} {r:.2f} | {L['text']} | {got}")
json.dump(out, open(os.path.join(a.dir, 'asr.json'), 'w'), ensure_ascii=False, indent=1)
sys.exit(1 if bad else 0)
