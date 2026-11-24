"""Generate the pig-boss voiceover: edge-tts (Thai, male) -> pitch/formant drop + nasal EQ + slight grunt wobble."""
import json, subprocess
PIG = ("aresample=44100,asetrate=44100*0.85,aresample=44100,atempo=1.17647,"          # ~-3 semitones, bigger/chubbier body
       "highpass=f=70,equalizer=f=200:t=q:w=1:g=-3,"                   # less boom -> stays clear
       "equalizer=f=1100:t=q:w=1.2:g=6,"                               # nasal 'snout' honk
       "equalizer=f=3200:t=q:w=1:g=4,"                                 # consonant clarity
       "vibrato=f=7:d=0.07,"                                           # light grunty wobble
       "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2")
for i, l in enumerate(json.load(open('script.json'))):
    subprocess.run(['edge-tts', '--voice', 'th-TH-NiwatNeural', '--rate=+14%', '--text', l['say'],
                    '--write-media', f'audio/raw{i}.mp3'], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'audio/raw{i}.mp3', '-af', PIG, '-ar', '44100', '-ac', '1',
                    f'audio/vo{i}.wav'], check=True)
    d = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'audio/vo{i}.wav'],
                       capture_output=True, text=True).stdout.strip()
    print(i, l['scene'], d)
