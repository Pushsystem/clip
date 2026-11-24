"""Generate the cute pig voiceover: soft Thai voice pitched up, slight formant lift, gentle nasal EQ, harsh highs tamed."""
import json, subprocess, time, hashlib, os, shutil
PIG = ("aresample=44100,asetrate=44100*1.06,aresample=44100,atempo=0.9434,"  # small formant lift: cute, not chipmunk
       "highpass=f=140,equalizer=f=1300:t=q:w=1.4:g=2.5,"                     # light cute 'snout' nasal
       "equalizer=f=3500:t=q:w=1.2:g=-3,equalizer=f=6500:t=q:w=1:g=-4,"       # tame harsh/sibilant highs -> easy on the ears
       "lowpass=f=10000,"
       "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2")
os.makedirs('audio/cache', exist_ok=True)
for i, l in enumerate(json.load(open('script.json'))):
    cached = f"audio/cache/{hashlib.md5(l['say'].encode()).hexdigest()[:12]}.mp3"
    for attempt in range(6):
        if os.path.exists(cached): break  # the TTS service occasionally drops a request
        if subprocess.run(['edge-tts', '--voice', 'th-TH-PremwadeeNeural', '--rate=+10%', '--pitch=+25Hz', '--text', l['say'],
                           '--write-media', cached + '.part'], capture_output=True).returncode == 0:
            os.replace(cached + '.part', cached); break
        time.sleep(5 * (attempt + 1))
    else: raise SystemExit(f'TTS failed for line {i}')
    shutil.copy(cached, f'audio/raw{i}.mp3')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'audio/raw{i}.mp3', '-af', PIG, '-ar', '44100', '-ac', '1',
                    f'audio/vo{i}.wav'], check=True)
    d = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'audio/vo{i}.wav'],
                       capture_output=True, text=True).stdout.strip()
    print(i, l['scene'], d)
