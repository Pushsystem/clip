#!/bin/sh
# One command: «Morihan Unryu» (Tablet Sketch Explainer, vertical 1080x1920, 31.5 s).
#   fonts and voice are kept in the folder; this rebuilds glyphs, cues, page, events, picture, mix, master, checks and poster.
# Needs ffmpeg 7+ first on PATH (a copy lives in bin/), the library at LIB (its .venv with voice + core tiers).
set -e
LIB=/root/lemo-opuscar
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; NAME=morihan-unryu; SIZE=1080x1920; WORKERS=${WORKERS:-3}
export PATH="$HERE/bin:$PATH"
# voice (edge-tts, en-US-AvaMultilingualNeural reading Thai) only when missing; tools/tts_th.py passes the HTTPS proxy, tools/asr_th.py checks it
[ -f "$HERE/voice/v8.wav" ] || "$PY" "$HERE/tools/tts_th.py" "$HERE/voice/lines.json" "$HERE/voice" --voice en-US-AvaMultilingualNeural --rate +14%
"$PY" "$HERE/tools/skeleton.py"
"$PY" "$HERE/tools/cues.py"
sh "$HERE/tools/assemble.sh"
cd "$LIB"
"$PY" core/audio/sampler.py --need "$HERE/mix.py"
node core/render/events.mjs "$HERE" --size $SIZE
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --size $SIZE --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" 24 1
node core/render/readcheck.mjs "$HERE" --size $SIZE > "$HERE/out/readcheck.txt" && echo "readcheck ok" || echo "readcheck: see out/readcheck.txt"
node core/render/still.mjs "$HERE" 30.9 --size $SIZE --out "$HERE/out/stills" > /dev/null
ffmpeg -v error -y -i "$HERE/out/stills/t_30.9.jpg" -q:v 3 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
