#!/usr/bin/env python3
"""Build palette.png from stuff.mp4: median cut + k-means in Oklab.

Oklab instead of ffmpeg palettegen's RGB -> slots spread the way the eye sees.
Pixels below --dark are skipped, stuff.js makes them dead cells anyway.
"""
import argparse
import subprocess
import sys
from math import copysign

SRGB_TO_LINEAR = [((c / 255 + 0.055) / 1.055) ** 2.4 if c / 255 > 0.04045 else (c / 255) / 12.92 for c in range(256)]


def cbrt(x):
    return copysign(abs(x) ** (1 / 3), x)


def srgb_to_oklab(r, g, b):
    lr, lg, lb = SRGB_TO_LINEAR[r], SRGB_TO_LINEAR[g], SRGB_TO_LINEAR[b]
    l = cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
    m = cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
    s = cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def oklab_to_srgb(L, a, bb):
    l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * bb) ** 3
    lin = (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
           -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
           -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    out = []
    for c in lin:
        c = 0.0 if c < 0 else (1.0 if c > 1 else c)
        c = 1.055 * c ** (1 / 2.4) - 0.055 if c > 0.0031308 else 12.92 * c
        out.append(max(0, min(255, round(c * 255))))
    return tuple(out)


def sample_pixels(video, fps, dark, target):
    """Decode at native resolution, keep RGB triples above the dark threshold.

    Downscaling first would be cheaper but area averaging invents colours that are in no frame, which is exactly
    the statistic being measured. Only the frame rate is reduced.
    """
    cmd = ['ffmpeg', '-v', 'error', '-i', video,
           '-vf', f'fps={fps}', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']
    raw = subprocess.run(cmd, stdout=subprocess.PIPE, check=True).stdout
    pixels = []
    # stride keeps the sample spread over the whole video instead of its first seconds
    total = len(raw) // 3
    stride = max(1, total // target)
    for i in range(0, total, stride):
        q = i * 3
        r, g, b = raw[q], raw[q + 1], raw[q + 2]
        if max(r, g, b) < dark:
            continue
        pixels.append((r, g, b))
    return pixels


def median_cut(points, n):
    """Split the bucket with the widest axis at its median until there are n buckets."""
    buckets = [points]
    while len(buckets) < n:
        widest, axis, spread = None, 0, -1.0
        for bucket in buckets:
            if len(bucket) < 2:
                continue
            for ax in range(3):
                lo = min(p[ax] for p in bucket)
                hi = max(p[ax] for p in bucket)
                if hi - lo > spread:
                    widest, axis, spread = bucket, ax, hi - lo
        if widest is None:
            break
        widest.sort(key=lambda p: p[axis])
        mid = len(widest) // 2
        buckets.remove(widest)
        buckets.append(widest[:mid])
        buckets.append(widest[mid:])
    return buckets


def kmeans(points, centroids, iterations):
    """Lloyd refinement in Oklab. Median cut only splits at medians of the widest axis, which leaves centroids off
    the density peaks; a few Lloyd passes move them onto the colours the video actually spends its pixels on."""
    k = len(centroids)
    for _ in range(iterations):
        sums = [[0.0, 0.0, 0.0, 0] for _ in range(k)]
        for L, a, b in points:
            best, bd = 0, 1e9
            for j in range(k):
                cL, ca, cb = centroids[j]
                d = (cL - L) ** 2 + (ca - a) ** 2 + (cb - b) ** 2
                if d < bd:
                    best, bd = j, d
            acc = sums[best]
            acc[0] += L
            acc[1] += a
            acc[2] += b
            acc[3] += 1
        moved = 0.0
        for j in range(k):
            L, a, b, n = sums[j]
            if n == 0:
                continue
            new = (L / n, a / n, b / n)
            moved += sum((new[t] - centroids[j][t]) ** 2 for t in range(3)) ** 0.5
            centroids[j] = new
        if moved < 1e-4:
            break
    return centroids


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('video', nargs='?', default='stuff.mp4')
    ap.add_argument('--colors', type=int, default=48)
    ap.add_argument('--dark', type=int, default=28, help='drop pixels whose max channel is below this')
    ap.add_argument('--samples', type=int, default=400000)
    ap.add_argument('--fps', type=float, default=3, help='frames per second to decode for the sample')
    ap.add_argument('--refine', type=int, default=8, help='Lloyd iterations after the median cut, 0 to skip')
    ap.add_argument('--refine-samples', type=int, default=40000)
    ap.add_argument('--out', default='palette.png')
    args = ap.parse_args()

    rgb = sample_pixels(args.video, args.fps, args.dark, args.samples)
    if len(rgb) < args.colors:
        sys.exit(f'only {len(rgb)} pixels above the dark threshold')
    print(f'{len(rgb)} sampled pixels above V>={args.dark}')

    lab = [srgb_to_oklab(*p) for p in rgb]
    buckets = median_cut(lab, args.colors)
    centroids = []
    for bucket in buckets:
        n = len(bucket)
        centroids.append((sum(p[0] for p in bucket) / n, sum(p[1] for p in bucket) / n, sum(p[2] for p in bucket) / n))
    if args.refine > 0:
        stride = max(1, len(lab) // args.refine_samples)
        centroids = kmeans(lab[::stride], centroids, args.refine)
        print(f'refined over {len(lab[::stride])} points')
    palette = [oklab_to_srgb(*c) for c in centroids]
    palette = sorted(set(palette))
    print(f'{len(palette)} distinct colours')

    # one row, one pixel per colour; stuff.js only reads the distinct set
    data = b''.join(bytes(c) for c in palette)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                    '-s', f'{len(palette)}x1', '-i', '-', '-frames:v', '1', '-update', '1', args.out],
                   input=data, check=True)
    print(f'wrote {args.out}')


if __name__ == '__main__':
    main()
