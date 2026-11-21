#!/bin/sh
# fallback master for ffmpeg 6 (mux.sh needs 7+): two-pass loudnorm to -14 LUFS on the WAV, then mux with light grain
set -e; D="$1"; cd "$D/out"
J=$(ffmpeg -hide_banner -i mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -y -hide_banner -loglevel error -i mix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -ar 48000 mix_norm.wav
ffmpeg -y -hide_banner -loglevel error -i video.mp4 -i mix_norm.wav -map 0:v -map 1:a -vf "noise=alls=3:allf=t" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -r 24 -c:a aac -b:a 192k -shortest -movflags +faststart "$D/doi-mok-son.mp4"
