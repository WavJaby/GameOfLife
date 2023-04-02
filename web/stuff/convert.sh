#!/bin/bash

ffmpeg -i input.webm -vf "crop=2880:2160:480:0,scale=320:240:flags=lanczos,fps=25,hqdn3d=2:1.5:3:2.5,unsharp=5:5:1.2,eq=saturation=1.15:contrast=1.06" -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart stuff.mp4
ffmpeg -i stuff.mp4 -vf "palettegen=max_colors=64" palette.png
