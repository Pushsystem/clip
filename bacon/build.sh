#!/bin/sh
# One command: "หมูเล่าเรื่องเบคอน" (Mid-century Cartoon, vertical 1080x1920, 24 fps) — run from anywhere.
#   sh build.sh            voice (if missing) + check, events, picture, mix, master (-14 LUFS), subtitles, readcheck, poster
#   VOICE=1 sh build.sh    regenerate the Thai voice
LIB=${LIB:-/root/lemo-opuscar}
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; NAME=bacon; SZ=1080x1920
CA=${SSL_CERT_FILE:-/root/.ccr/ca-bundle.crt}
mkdir -p "$HERE/out"
cd "$LIB"
# 1. Thai voice (edge-tts th-TH-NiwatNeural; online) + Whisper check (character comparison for Thai)
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/vo/v14.wav" ]; then
  SSL_CERT_FILE="$CA" "$PY" -I "$HERE/tools/tts_proxy.py" core/tts/tts_zh.py "$HERE/vo/lines.json" "$HERE/vo"
fi
"$PY" -I "$HERE/tools/asr_th.py" "$HERE/vo/lines.json" "$HERE/vo"
# 2. events → 3. picture → 4. score + foley + voice
node core/render/events.mjs "$HERE" --out "$HERE/out/events.json"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --size $SZ --out "$HERE/out/video.mp4"
LIB="$LIB" "$PY" "$HERE/mix.py"
# 5. master: two-pass loudnorm to -14 LUFS / -1.5 dBTP (by hand: mux.sh needs ffmpeg 7), light grain, mux
cd "$HERE/out"
J=$(ffmpeg -hide_banner -i mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
set -- $(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
ffmpeg -v error -y -i mix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$1:measured_TP=$2:measured_LRA=$3:measured_thresh=$4:offset=$5:linear=true,aresample=48000" -ar 48000 master.wav
ffmpeg -v error -y -i video.mp4 -i master.wav -map 0:v -map 1:a -vf "noise=alls=3:allf=t" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart -shortest "$HERE/$NAME.mp4"
ffmpeg -hide_banner -i "$HERE/$NAME.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -A14 Summary | grep -E "I:|Peak:"
# 6. subtitles (burned in; exported for reference), reading check, poster
cd "$LIB"
node "$HERE/tools/cues.mjs" > "$HERE/out/cues.json"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/subtitles_th.srt"
node core/render/readcheck.mjs "$HERE" --size $SZ > "$HERE/out/readcheck.txt" || true
ffmpeg -v error -y -ss 38.0 -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 3 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
