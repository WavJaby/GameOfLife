#!/bin/bash

#ffmpeg -i input1.mp4 -vf "fps=20,scale=240:-1:flags=lanczos,palettegen=max_colors=64" palette.png
#ffmpeg -i input1.mp4 -map 0 -c copy -an -f segment -segment_time 5 -reset_timestamps 1 cache/output_%03d.mp4

#ffmpeg -i input1.mp4 -i palette.png -filter_complex "fps=20,scale=240:-1:flags=lanczos[x];[x][1:v]paletteuse" -f segment -segment_time 10 -reset_timestamps 1 segment/output_%03d.gif

for i in cache/output_*.mp4; do
    index=$(echo "$i" | grep -o -E '[0-9]{3}')
    ffmpeg -i "$i" -i palette.png -filter_complex "fps=20,scale=240:-1:flags=lanczos[x];[x][1:v]paletteuse" "segment/output_${index}.gif"
done
