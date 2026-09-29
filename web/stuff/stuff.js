/**
 * Some stuff.
 * Tunable from query string: ?refreshEvery=6&injectEvery=1&gensPerFrame=1&edge=0&fillDead=0&darkBelow=28&dither=8&ditherStrength=22&instant
 * @param {ChunkManager} chunkManager
 * @param {Color[]} colors
 * @param calculateGeneration
 * @param repaint
 */
function Stuff(chunkManager, colors, calculateGeneration, repaint) {
    let frameCounter = 0;
    const params = new URLSearchParams(location.search);
    const self = this;
    window.stuff = this;
    const chunkSize = 16;
    // bayer dither, size 0 = off, strength in rgb units
    const DITHER_SIZE = +(params.get('dither') ?? 8);
    const DITHER_STRENGTH = +(params.get('ditherStrength') ?? 22);
    // fraction carries over between frames
    const GENS_PER_FRAME = +(params.get('gensPerFrame') ?? 1);
    let genCredit = 0;
    // luma gradient threshold, 0 = off
    const EDGE_THRESHOLD = +(params.get('edge') ?? 0);
    // hsv value, darker -> dead cell; palette.py uses the same cutoff
    const DARK_BELOW = +(params.get('darkBelow') ?? 28);
    const DARK_METRIC = params.get('darkMetric') ?? 'value';
    const FILL_DEAD_ONLY = params.get('fillDead') === '1';
    const INJECT_EVERY = +(params.get('injectEvery') ?? 1);
    // below ~4 the bayer blocks show
    const REFRESH_EVERY = +(params.get('refreshEvery') ?? 6);
    // rgb555 -> palette index
    const LUT_BITS = 5, LUT_SHIFT = 8 - LUT_BITS;
    const SRGB_TO_LINEAR = new Float32Array(256);
    for (let c = 0; c < 256; c++) {
        const v = c / 255;
        SRGB_TO_LINEAR[c] = v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    }

    const video = document.getElementById('stuffVideo');
    let initial = params.has('instant') ? 0 : 10;
    let frameLoopStarted = false;
    let playing = false;
    let paletteReady = false;
    const frameCtx = document.createElement('canvas').getContext('2d', {willReadFrequently: false, alpha: false});
    let frameWidth = 0, frameHeight = 0, chunksX = 0, chunksY = 0;
    let seenFirstFrame = false, sizeKnown = false, videoRegion = null;
    let chunkPools = [], chunkViews = [], chunkCounts = null;
    video.addEventListener('loadedmetadata', function () {
        video.volume = 0.5;
        frameWidth = video.videoWidth;
        frameHeight = video.videoHeight;
        frameCtx.canvas.width = frameWidth;
        frameCtx.canvas.height = frameHeight;
        seenFirstFrame = false;
        sizeKnown = true;
        chunksX = Math.ceil(frameWidth / chunkSize);
        chunksY = Math.ceil(frameHeight / chunkSize);
        videoRegion = {x0: 0, y0: 0, x1: chunksX - 1, y1: chunksY - 1};
        // reused every frame
        chunkPools = [];
        chunkViews = [];
        chunkCounts = new Uint16Array(chunksX * chunksY);
        for (let c = 0; c < chunksX * chunksY; c++) {
            const pool = [];
            for (let k = 0; k < chunkSize * chunkSize; k++) pool.push([0, 0, 0]);
            chunkPools.push(pool);
            chunkViews.push([]);
        }
    });
    if (video.readyState >= 1) video.dispatchEvent(new Event('loadedmetadata'));
    this.play = function (state) {
        if (!paletteReady || !sizeKnown) return playing;

        if (!state) {
            const lastInit = initial;
            if (initial > 0)
                initial--;

            if (initial === 0) {
                if (!frameLoopStarted) {
                    frameLoopStarted = true;
                    scheduleFrame();
                }
                video.play();
                playing = true;
                lifeRule.region = videoRegion;
                return lastInit === 0;
            }
        } else {
            video.pause();
            playing = false;
            lifeRule.region = null;
        }
        return true;
    };

    // Read palette
    const lut = new Uint8Array(1 << (LUT_BITS * 3));
    let firstIndex = 0;
    const palette = new Image();
    palette.onload = function () {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = this.width;
        ctx.canvas.height = this.height;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(palette, 0, 0, this.width, this.height);
        const data = ctx.getImageData(0, 0, this.width, this.height).data;
        const seen = {};
        const paletteRgb = [];
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const key = (r << 16) | (g << 8) | b;
            if (seen[key] !== undefined) continue;
            seen[key] = true;
            paletteRgb.push([r, g, b]);
        }
        const visible = paletteRgb.filter(c => brightness(c[0], c[1], c[2]) >= DARK_BELOW);
        firstIndex = colors.length;
        for (const [r, g, b] of visible)
            colors.push(new Color(r, g, b));
        buildLut(visible);
        chunkManager.addTeam(new Array(visible.length).fill(0));
        paletteReady = true;
    };
    palette.src = 'web/stuff/palette.png';

    const ditherMatrix = DITHER_SIZE < 2 ? null
        : bayerInts(DITHER_SIZE).map(row => row.map(v => ((v + 0.5) / (DITHER_SIZE * DITHER_SIZE) - 0.5) * DITHER_STRENGTH));

    // refresh phase per pixel, bayer so it spreads evenly instead of streaking
    const REFRESH_TILE = 16, REFRESH_MASK = REFRESH_TILE - 1;
    const refreshPhase = new Uint8Array(REFRESH_TILE * REFRESH_TILE);
    {
        const m = bayerInts(REFRESH_TILE), cells = REFRESH_TILE * REFRESH_TILE;
        for (let y = 0; y < REFRESH_TILE; y++)
            for (let x = 0; x < REFRESH_TILE; x++)
                refreshPhase[(y << 4) | x] = (m[y][x] * REFRESH_EVERY / cells) | 0;
    }

    function bayerInts(size) {
        let m = [[0, 2], [3, 1]];
        for (let n = 2; n < size; n *= 2) {
            const next = [];
            for (let y = 0; y < n * 2; y++) {
                next.push([]);
                for (let x = 0; x < n * 2; x++)
                    next[y].push(4 * m[y % n][x % n] + [[0, 2], [3, 1]][(y / n) | 0][(x / n) | 0]);
            }
            m = next;
        }
        return m;
    }

    // not luma: it cuts dark blue
    function brightness(r, g, b) {
        if (DARK_METRIC === 'luma') return 0.299 * r + 0.587 * g + 0.114 * b;
        return r > g ? (r > b ? r : b) : (g > b ? g : b);
    }

    function toOklab(r, g, b) {
        const lr = SRGB_TO_LINEAR[r], lg = SRGB_TO_LINEAR[g], lb = SRGB_TO_LINEAR[b];
        const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
        const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
        const s2 = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
        return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s2,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s2,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s2];
    }

    function buildLut(paletteRgb) {
        const lab = paletteRgb.map(c => toOklab(c[0], c[1], c[2]));
        const steps = 1 << LUT_BITS, half = 1 << (LUT_SHIFT - 1);
        for (let r5 = 0; r5 < steps; r5++)
            for (let g5 = 0; g5 < steps; g5++)
                for (let b5 = 0; b5 < steps; b5++) {
                    const r = (r5 << LUT_SHIFT) + half, g = (g5 << LUT_SHIFT) + half, b = (b5 << LUT_SHIFT) + half;
                    // index 0 = dead
                    if (brightness(r, g, b) < DARK_BELOW) continue;
                    const [L, a, bb] = toOklab(r, g, b);
                    let best = 0, bestDist = Infinity;
                    for (let k = 0; k < lab.length; k++) {
                        const dL = lab[k][0] - L, da = lab[k][1] - a, db = lab[k][2] - bb;
                        const dist = dL * dL + da * da + db * db;
                        if (dist < bestDist) {
                            bestDist = dist;
                            best = k;
                        }
                    }
                    lut[(r5 << (LUT_BITS * 2)) | (g5 << LUT_BITS) | b5] = firstIndex + best;
                }
    }

    function clamp(v) {
        return v < 0 ? 0 : v > 255 ? 255 : v;
    }

    function scheduleFrame() {
        if ('requestVideoFrameCallback' in video)
            video.requestVideoFrameCallback(processFrame);
        else
            requestAnimationFrame(processFrame);
    }

    function processFrame() {
        if (video.ended)
            lifeRule.region = null;
        if (playing && !video.ended) {
            const t0 = performance.now();
            frameCounter++;
            // generation first, else injected cells die before they are seen
            genCredit += GENS_PER_FRAME;
            while (genCredit >= 1) {
                calculateGeneration(true);
                genCredit--;
            }
            const tGen = performance.now();
            const firstFrame = !seenFirstFrame;
            const inject = firstFrame || frameCounter % INJECT_EVERY === 0;
            let rgba = null;
            if (inject) {
                frameCtx.drawImage(video, 0, 0, frameWidth, frameHeight);
                rgba = frameCtx.getImageData(0, 0, frameWidth, frameHeight).data;
                seenFirstFrame = true;
            } else
                chunkCounts.fill(0);
            const tGrab = performance.now();
            let changedCells = 0;
            const refreshNow = ((frameCounter / INJECT_EVERY) | 0) % REFRESH_EVERY;
            for (let cy = 0; inject && cy < chunksY; cy++)
                for (let cx = 0; cx < chunksX; cx++) {
                    const pool = chunkPools[cy * chunksX + cx];
                    const liveMap = FILL_DEAD_ONLY ? chunkManager.getChunk(cx, cy).chunkMap : null;
                    let count = 0;
                    for (let i = 0; i < chunkSize; i++) {
                        const y = i + cy * chunkSize;
                        if (y >= frameHeight) break;
                        const ditherRow = ditherMatrix === null ? null : ditherMatrix[y % DITHER_SIZE];
                        const refreshRow = refreshPhase.subarray((y & REFRESH_MASK) << 4);
                        for (let j = 0; j < chunkSize; j++) {
                            const x = j + cx * chunkSize;
                            if (x >= frameWidth) break;
                            const q = (y * frameWidth + x) * 4;
                            let r = rgba[q], g = rgba[q + 1], b = rgba[q + 2];
                            if (liveMap !== null && liveMap[j][i] !== 0) continue;
                            if (EDGE_THRESHOLD > 0) {
                                if (x === 0 || y === 0 || x === frameWidth - 1 || y === frameHeight - 1) continue;
                                const rowStep = frameWidth * 4;
                                const lLeft = (rgba[q - 4] * 77 + rgba[q - 3] * 151 + rgba[q - 2] * 28) >> 8;
                                const lRight = (rgba[q + 4] * 77 + rgba[q + 5] * 151 + rgba[q + 6] * 28) >> 8;
                                const lUp = (rgba[q - rowStep] * 77 + rgba[q - rowStep + 1] * 151 + rgba[q - rowStep + 2] * 28) >> 8;
                                const lDown = (rgba[q + rowStep] * 77 + rgba[q + rowStep + 1] * 151 + rgba[q + rowStep + 2] * 28) >> 8;
                                if (Math.abs(lRight - lLeft) + Math.abs(lDown - lUp) < EDGE_THRESHOLD) continue;
                            }
                            if (!firstFrame && refreshRow[x & REFRESH_MASK] !== refreshNow) continue;
                            if (ditherRow !== null) {
                                const t = ditherRow[x % DITHER_SIZE];
                                r = clamp(r + t);
                                g = clamp(g + t);
                                b = clamp(b + t);
                            }
                            const cell = pool[count++];
                            cell[0] = j;
                            cell[1] = i;
                            cell[2] = lut[(r >> LUT_SHIFT << (LUT_BITS * 2)) | (g >> LUT_SHIFT << LUT_BITS) | (b >> LUT_SHIFT)];
                        }
                    }
                    chunkCounts[cy * chunksX + cx] = count;
                    changedCells += count;
                }
            const t1 = performance.now();
            for (let c = 0; c < chunkPools.length; c++) {
                const count = chunkCounts[c];
                if (count === 0) continue;
                const view = chunkViews[c], pool = chunkPools[c];
                view.length = count;
                for (let k = 0; k < count; k++) view[k] = pool[k];
                chunkManager.getChunk(c % chunksX, (c / chunksX) | 0).setCellsColor(view);
            }
            const t2 = performance.now();
            repaint();
            const t3 = performance.now();
            self.changedRatio = changedCells / (frameWidth * frameHeight);
            self.frameMs = t3 - t0;
            self.phases = {generation: tGen - t0, grab: tGrab - tGen, scan: t1 - tGrab, setCells: t2 - t1, repaint: t3 - t2};
        }
        scheduleFrame();
    }
}
