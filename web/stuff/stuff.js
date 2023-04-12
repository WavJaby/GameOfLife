/**
 * @param {ChunkManager} chunkManager
 * @param {Color[]} colors
 * @param calculateTeam
 * @param updateMiniMap
 * @param updateMainCanvas
 */
function Stuff(chunkManager, colors, calculateTeam, updateMiniMap, updateMainCanvas) {
    const frameWidth = 320, frameHeight = 240;
    const videoFps = 25;

    // const stopButton = document.getElementById('stopIt');
    const stuffVideo = document.getElementById('stuffVideo');
    let initial = 20;
    let playing = false;
    this.play = function (state) {
        if (!ready) return playing;

        if (!state) {
            const lastInit = initial;
            if (initial > 0)
                initial--;

            if (initial === 0) {
                if (lastInit === 1) {
                    initial = true;
                    requestAnimationFrame(processFrame);
                }
                stuffVideo.play();
                playing = true;
                return lastInit === 1;
            }
        } else {
            stuffVideo.pause();
            playing = false;
        }
        return true;
        // stopButton.style.display = 'block';
        // stopButton.textContent = 'pause';
        // stopButton.onclick = function () {
        //     if (!ready) return;
        //     if (stuffVideo.paused) {
        //         stuffVideo.play();
        //         stopButton.textContent = 'pause';
        //     } else {
        //         stuffVideo.pause();
        //         stopButton.textContent = 'play';
        //     }
        // }
    };

    // Read palette
    const colorTable = {};
    const palette = new Image();
    palette.onload = function () {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = this.width;
        ctx.canvas.height = this.height;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(palette, 0, 0, this.width, this.height);
        const data = ctx.getImageData(0, 0, this.width, this.height).data;
        let colorCount = 0;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const color = (r << 16) | (g << 8) | b;
            if (colorTable[color] === undefined) {
                colorTable[color] = colors.length;
                colors.push(new Color(r, g, b));
                colorCount++;
            }
        }
        // console.log(colorTable);
        chunkManager.addTeam(new Array(colorCount).fill(0));
    };
    palette.src = 'web/stuff/palette.png';

    // Read video
    let ready = stuffVideo.readyState === stuffVideo.HAVE_ENOUGH_DATA;
    stuffVideo.addEventListener('canplaythrough', function () {
        ready = true;
    }, {once: true});

    const frameCtx = document.createElement('canvas').getContext('2d', {willReadFrequently: true});
    frameCtx.canvas.width = frameWidth;
    frameCtx.canvas.height = frameHeight;
    const lastFrameColorIndexCache = new Uint8Array(frameWidth * frameHeight);
    // rgb555 -> nearest palette color
    const colorLookup = new Uint8Array(1 << 15);
    let lookupReady = false;
    let lastFrame = 0;

    function buildColorLookup() {
        const table = Object.keys(colorTable).map(i => [i >> 16, (i >> 8) & 0xFF, i & 0xFF, colorTable[i]]);
        for (let i = 0; i < colorLookup.length; i++) {
            const r = (i >> 7) & 0xF8, g = (i >> 2) & 0xF8, b = (i << 3) & 0xF8;
            let minDiff = -1;
            for (const [r1, g1, b1, index] of table) {
                const diff = (r - r1) * (r - r1) + (g - g1) * (g - g1) + (b - b1) * (b - b1);
                if (minDiff === -1 || diff < minDiff) {
                    minDiff = diff;
                    colorLookup[i] = index;
                }
            }
        }
        lookupReady = true;
    }

    function processFrame() {
        const frameNum = ((stuffVideo.currentTime + 0.001 * 60) / (1 / videoFps)) | 0;

        if (lastFrame - 1 < frameNum) {
            console.time('render');
            if (!lookupReady) buildColorLookup();
            const width = frameWidth, height = frameHeight;
            frameCtx.drawImage(stuffVideo, 0, 0, width, height);
            const frameRgbPixels = frameCtx.getImageData(0, 0, width, height).data;
            const out = [];
            let len = 0;
            for (let cx = 0; cx < width / 16; cx++) {
                for (let cy = 0; cy < height / 16; cy++) {
                    const result = [];
                    for (let i = 0; i < 16; i++)
                        for (let j = 0; j < 16; j++) {
                            const x = j + cx * 16;
                            const y = i + cy * 16;
                            if (x < width && y < height) {
                                const pixelColorIndex = y * width + x;
                                const pixelRgbIndex = pixelColorIndex * 4;
                                const r = frameRgbPixels[pixelRgbIndex],
                                    g = frameRgbPixels[pixelRgbIndex + 1],
                                    b = frameRgbPixels[pixelRgbIndex + 2];
                                const colorIndex = colorLookup[(r >> 3) << 10 | (g >> 3) << 5 | b >> 3];
                                if (lastFrameColorIndexCache[pixelColorIndex] === colorIndex)
                                    continue;

                                lastFrameColorIndexCache[pixelColorIndex] = colorIndex;
                                result.push([j, i, colorIndex]);
                            }
                        }
                    len += result.length;
                    out.push([cx, cy, result]);
                }
            }
            // console.log(len / lastFrameColorIndexCache.length * 100);
            for (const [cx, cy, result] of out)
                chunkManager.getChunk(cx, cy).setCellsColor(result);
            updateMainCanvas();
            calculateTeam();
            updateMiniMap(lastFrame % 5 === 0);
            console.timeEnd('render');

            lastFrame = frameNum + 1;
        }
        requestAnimationFrame(processFrame);
        // setTimeout(processFrame, 100);
    }

    function blobToImage(blob) {
        const urlCreator = window.URL || window.webkitURL;
        const img = document.createElement('img');
        img.src = urlCreator.createObjectURL(blob);
        return img;
    }

}

/**
 * @param {Number} num
 * @return {string}
 */
function toHex(num) {
    if (num < 16) return '0' + num.toString(16);
    return num.toString(16);
}
