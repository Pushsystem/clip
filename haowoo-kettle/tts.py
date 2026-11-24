"""Generate the cute pig voiceover: edge-tts (Thai) pitched up + slight formant lift + nasal EQ."""
import json, subprocess
PIG = ("aresample=44100,asetrate=44100*1.14,aresample=44100,atempo=0.87719,"  # +~2.3 semitones incl. formants -> small cartoon body
       "highpass=f=120,equalizer=f=1500:t=q:w=1.2:g=4,"                       # cute snouty nasal
       "equalizer=f=4000:t=q:w=1:g=2,"                                        # crisp consonants
       "vibrato=f=9:d=0.04,"                                                  # tiny bouncy wobble
       "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2")
for i, l in enumerate(json.load(open('script.json'))):
    subprocess.run(['edge-tts', '--voice', 'th-TH-NiwatNeural', '--rate=+14%', '--pitch=+35Hz', '--text', l['say'],
                    '--write-media', f'audio/raw{i}.mp3'], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'audio/raw{i}.mp3', '-af', PIG, '-ar', '44100', '-ac', '1',
                    f'audio/vo{i}.wav'], check=True)
    d = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'audio/vo{i}.wav'],
                       capture_output=True, text=True).stdout.strip()
    print(i, l['scene'], d)
