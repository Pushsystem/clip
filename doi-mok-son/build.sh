#!/bin/sh
# Rebuild "ดอยหมอกสน" from scratch: sh build.sh
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
"$LIB/.venv/bin/python" "$LIB/core/audio/sampler.py" --need marimba glockenspiel vibraphone woodblock
cd "$LIB"
echo "== 1. events + reading-time check"
node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE" --q textonly
echo "== 2. subtitles (burned into the picture; exported for reference)"
node "$HERE/subs.mjs"
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/out/cues.json" "$HERE/subtitles_th.srt"
echo "== 3. score + foley + mix"
"$LIB/.venv/bin/python" "$HERE/mix.py"
echo "== 4. picture (24 fps; software GL is slow, ~1 h)"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
echo "== 5. master (-14 LUFS, light grain)"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/doi-mok-son.mp4" 24 1 || sh "$HERE/mux6.sh" "$HERE"   # ffmpeg 6 fallback
echo "== 6. poster"
node core/render/still.mjs "$HERE" 23.2 --q nohud --prefix poster_ --out "$HERE/out/stills"
cp "$HERE/out/stills/poster_23.2.jpg" "$HERE/poster.jpg"
echo "done: $HERE/doi-mok-son.mp4"
