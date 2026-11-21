"""Narration timing -> subtitle cues (voice/cues.json, read by the page and mix.py) and subtitles_th.srt.
Each line starts at START[id] (film seconds). Every cue is held >= max(1.8 s, speech + 0.6 s).
Run: <LIB>/.venv/bin/python tools/cues.py   (build.sh does)"""
import json, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = os.path.join(HERE, 'voice')
START = {'v1': 0.35, 'v2': 3.9, 'v3': 8.0, 'v4': 12.4, 'v5': 16.3, 'v6': 19.6, 'v7': 22.45, 'v8': 27.9}
LINES = {'v1': ['รู้ไหม มัทฉะกระป๋องนี้', 'ชื่อแปลว่า “มังกรเมฆ”'],
         'v2': ['Unryu จาก Morihan', 'แบรนด์ชาเก่าแก่แห่งอุจิ เกียวโต'],
         'v3': ['เกรดพิธีการ คัดใบชาเก็บแรกของฤดู', 'ที่ปลูกใต้ร่มเงา'],
         'v4': ['แล้วโม่ด้วยครกหินแบบดั้งเดิม'],
         'v5': ['หอมโทนดอกไม้ หวานซับซ้อน', 'อูมามิเข้มข้น'],
         'v6': ['เนียนนุ่ม', 'ทิ้งท้ายด้วยกลิ่นสาหร่ายบางๆ'],
         'v7': ['ชงเพียวคือที่สุด', 'หรือทำลาเต้ก็เขียวสวย'],
         'v8': ['สนใจ กดตะกร้าได้เลย']}
dur = json.load(open(os.path.join(V, 'dur.json')))
cues = [{'id': i, 't0': round(t - 0.3, 3), 't1': round(t + dur[i] + 0.7, 3), 'lines': LINES[i], 'spoken': dur[i]} for i, t in START.items()]
for a, b in zip(cues, cues[1:]):
    if a['t1'] > b['t0'] - 0.05: a['t1'] = round(b['t0'] - 0.05, 3)
cues[-1]['t1'] = 31.4
bad = [c['id'] for c in cues if c['t1'] - c['t0'] < max(1.8, c['spoken'] + 0.6) - 1e-6]
for c in cues: print(f"{c['id']}  {c['t0']:6.2f}-{c['t1']:6.2f}  {c['t1'] - c['t0']:.2f}s (spoken {c['spoken']:.2f})  {' / '.join(c['lines'])}")
if bad: print('TOO SHORT:', bad)
json.dump({'start': START, 'dur': dur, 'cues': cues}, open(os.path.join(V, 'cues.json'), 'w'), ensure_ascii=False, indent=1)
fmt = lambda s: f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round(s % 1 * 1000)) % 1000:03d}"
with open(os.path.join(HERE, 'subtitles_th.srt'), 'w', encoding='utf-8') as f:
    for n, c in enumerate(cues, 1): f.write(f"{n}\n{fmt(c['t0'])} --> {fmt(c['t1'])}\n" + '\n'.join(c['lines']) + '\n\n')
print('cues', len(cues))
