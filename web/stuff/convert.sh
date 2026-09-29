#!/bin/bash
# ./convert.sh <source video> [width height fps]
set -euo pipefail
SRC="$1"
cd "$(dirname "$0")"
WIDTH="${2:-320}"; HEIGHT="${3:-240}"; FPS="${4:-25}"
# crop 4:3 out of the 16:9 pillarbox
FILTERS="crop=2880:2160:480:0,scale=${WIDTH}:${HEIGHT}:flags=lanczos,fps=${FPS},hqdn3d=2:1.5:3:2.5,unsharp=5:5:1.2,eq=saturation=1.15:contrast=1.06"
ffmpeg -y -hide_banner -loglevel warning -stats -i "$SRC" -map 0:v -map 0:a:0 -vf "${FILTERS}" \
    -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart stuff.mp4
python palette.py --colors 48 --out palette.png stuff.mp4
