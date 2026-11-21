"""Thai speech check: transcribe each voice/<id>.wav with faster-whisper (language th) and compare by character similarity.
usage: python tools/asr_th.py voice/lines.json voice [--threshold 0.85]  (writes voice/words.json)"""
import sys, json, os, re, difflib
import numpy as np, soundfile as sf
from faster_whisper import WhisperModel
lines = json.load(open(sys.argv[1])); vd = sys.argv[2]
th = float(sys.argv[sys.argv.index('--threshold') + 1]) if '--threshold' in sys.argv else 0.85
norm = lambda s: re.sub(r'[\s“”"?!,.ๆ]', '', s.lower())
m = WhisperModel(os.environ.get('WHISPER_MODEL', 'small'), device='cpu', compute_type='int8')
bad = 0; words = {}
for L in lines:
    y, sr = sf.read(os.path.join(vd, L['id'] + '.wav'), dtype='float32')
    if sr != 16000:
        import soxr; y = soxr.resample(y, sr, 16000)
    pad = np.zeros(8000, np.float32)
    segs, _ = m.transcribe(np.concatenate([pad, y, pad]), language='th', beam_size=5, word_timestamps=True)
    segs = list(segs); got = ''.join(s.text for s in segs)
    words[L['id']] = [[w.word, round(w.start - 0.5, 3), round(w.end - 0.5, 3)] for s in segs for w in (s.words or [])]
    want = L.get('asr', L.get('say', L['text']))
    r = difflib.SequenceMatcher(None, norm(want), norm(got)).ratio(); ok = r >= th; bad += not ok
    print(('ok  ' if ok else 'BAD ') + L['id'], f'{r:.2f}', '|', want, '|', got)
json.dump(words, open(os.path.join(vd, 'words.json'), 'w'), ensure_ascii=False, indent=1)
print('mismatches:', bad); sys.exit(1 if bad else 0)
