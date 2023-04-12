/**
 * @param {ChunkManager} chunkManager
 * @param {Color[]} colors
 * @param calculateTeam
 * @param updateMiniMap
 * @param updateMainCanvas
 */
function Stuff(chunkManager, colors, calculateTeam, updateMiniMap, updateMainCanvas) {
    // const gifSegmentUrl = 'web/stuff/stuff.gif';
    const gifSegmentUrl = 'web/stuff/segment/output_%%.gif';
    let readGifSegmentIndex = 0, totalGifSegment = 42;
    const frameWidth = 240, frameHeight = 188;
    const gifFps = 20;

    // const stopButton = document.getElementById('stopIt');
    const stuffAudio = document.getElementById('stuffAudio');
    let initial = 30;
    let playing = false;
    this.play = function (state) {
        if (readers.length === 0) return playing;

        if (!state) {
            const lastInit = initial;
            if (initial > 0) {
                initial--;
            } else {
                if (lastInit === 1) {
                    initial = true;
                    requestAnimationFrame(processFrame);
                }
                stuffAudio.play();
                playing = true;
                return lastInit === 1;
            }
        } else {
            stuffAudio.pause();
            playing = false;
        }
        return true;
        // stopButton.style.display = 'block';
        // stopButton.textContent = 'pause';
        // stopButton.onclick = function () {
        //     if (readers.length === 0) return;
        //     if (stuffAudio.paused) {
        //         stuffAudio.play();
        //         stopButton.textContent = 'pause';
        //     } else {
        //         stuffAudio.pause();
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

    // Read gif
    const readers = [];
    readSegment().then(readSegment);

    const lastFrameColorIndexCache = new Uint8Array(frameWidth * frameHeight);
    const frameColorIndexCache = new Uint8Array(frameWidth * frameHeight);
    let lastFrame = 0, playedFrameOffset = 0;
    let gifBuff = null;

    async function readSegment() {
        if (readGifSegmentIndex < totalGifSegment) {
            gifBuff = await fetch(gifSegmentUrl.replace('%%', (readGifSegmentIndex++).toString().padStart(3, '0')))
                .then(i => i.blob()).then(i => i.arrayBuffer());
            const gifReader = new GifReader(new Uint8Array(gifBuff));
            readers.push(gifReader);
            console.log(gifReader.numFrames() / 20 + 'sec');
        }
    }

    async function processFrame() {
        const frameNum = ((stuffAudio.currentTime + 0.001 * 60) / (1 / gifFps)) | 0;

        if (lastFrame - 1 < frameNum) {
            console.time('render');
            let reader = await getReader();
            // console.log(frameNum + ' skip: ' + (frameNum - lastFrame));
            const width = reader.width, height = reader.height;
            for (let i = lastFrame; i < frameNum; i++) {
                const frameRgbPixels = new Uint8Array(width * height * 4);
                let index = i - playedFrameOffset;
                if (index >= reader.numFrames()) {
                    reader = await getReader(true);
                    if (reader === null) return;
                    index = i - playedFrameOffset;
                }
                reader.decodeAndBlitFrameRGBA(index, frameRgbPixels);
                for (let j = 0, k = 0; j < frameRgbPixels.length; j += 4, k++) {
                    const r = frameRgbPixels[j], g = frameRgbPixels[j + 1], b = frameRgbPixels[j + 2];
                    const color = (r << 16) | (g << 8) | b;
                    if (color === 0) continue;
                    frameColorIndexCache[k] = colorTable[color];
                }
            }

            const frameRgbPixels = new Uint8Array(width * height * 4);
            let index = frameNum - playedFrameOffset;
            if (index >= reader.numFrames()) {
                reader = await getReader(true);
                if (reader === null) return;
                index = frameNum - playedFrameOffset;
            }
            reader.decodeAndBlitFrameRGBA(index, frameRgbPixels);
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
                                const color = (r << 16) | (g << 8) | b;
                                let colorIndex;
                                if (color === 0) {
                                    if (lastFrameColorIndexCache[pixelColorIndex] === frameColorIndexCache[pixelColorIndex])
                                        continue;
                                    colorIndex = frameColorIndexCache[pixelColorIndex];
                                } else
                                    colorIndex = frameColorIndexCache[pixelColorIndex] = colorTable[color];

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

    async function getReader(getNext) {
        if (getNext) {
            console.log('Read next gif');
            playedFrameOffset += readers.shift().numFrames();
            if (readers.length === 0) {
                stuffAudio.pause();
                await readSegment();
                stuffAudio.play();
            } else
                readSegment();
        }
        return readers[0];
    }

    function blobToImage(blob) {
        const urlCreator = window.URL || window.webkitURL;
        const img = document.createElement('img');
        img.src = urlCreator.createObjectURL(blob);
        return img;
    }

    // // Video
    // const v = document.getElementById('v');
    // v.addEventListener('loadedmetadata', function (e) {
    //     const width = this.videoWidth, height = this.videoHeight;
    //
    //     const ctx = document.createElement('canvas').getContext('2d');
    //     ctx.canvas.width = width;
    //     ctx.canvas.height = height;
    //
    //     v.addEventListener('play', function () {
    //         console.log('Play');
    //         draw(this, ctx, width, height);
    //     });
    //
    //     // v.play();
    // });
    //
    // function draw(v, ctx, width, height) {
    //     if (v.paused || v.ended) return false;
    //     ctx.imageSmoothingEnabled = false;
    //     ctx.drawImage(v, 0, 0, width, height);
    //     const data = ctx.getImageData(0, 0, width, height).data;
    //     const outPixel = new Uint8Array(width * height);
    //     for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    //         const r = data[i], g = data[i + 1], b = data[i + 2];
    //         let closestColorIndex = -1, minDiff = -1;
    //         for (let k = 0; k < colorTable.length; k++) {
    //             const r1 = (colorTable[k] >> 16) & 0xFF, g1 = (colorTable[k] >> 8) & 0xFF, b1 = colorTable[k] & 0xFF;
    //             const diff = Math.abs(r - r1) + Math.abs(g - g1) + Math.abs(b - b1);
    //             if (minDiff === -1 || diff < minDiff) {
    //                 minDiff = diff;
    //                 closestColorIndex = k + colorIndexOffset;
    //                 if (minDiff < 20) break;
    //             }
    //         }
    //         outPixel[j] = closestColorIndex;
    //     }
    //
    //     requestAnimationFrame(function () {
    //         // console.time('t');
    //         for (let cx = 0; cx < width / 16; cx++) {
    //             for (let cy = 0; cy < height / 16; cy++) {
    //                 const result = new Array(16 * 16);
    //                 let k = 0;
    //                 for (let i = 0; i < 16; i++)
    //                     for (let j = 0; j < 16; j++) {
    //                         const x = j + cx * 16;
    //                         const y = i + cy * 16;
    //                         if (x < width && y < height)
    //                             result[k++] = [j, i, outPixel[y * width + x]];
    //                     }
    //                 chunkManager.getChunk(cx, cy).setCellsColor(result.splice(0, k), mainCanvas);
    //             }
    //         }
    //         // console.timeEnd('t');
    //     });
    //
    //     setTimeout(draw, 50, v, ctx, width, height);
    // }
}

/**
 * @param {Number} num
 * @return {string}
 */
function toHex(num) {
    if (num < 16) return '0' + num.toString(16);
    return num.toString(16);
}