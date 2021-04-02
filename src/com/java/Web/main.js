let chunks;
let canvas;

window.onload = function () {
    const playground = document.getElementById('playground');
    canvas = playground.getContext('2d');
    canvas.canvas.width = window.innerWidth;
    canvas.canvas.height = window.innerHeight;

    chunks = {};
    let homeChunk = new Chunk(0, 0);
    let cWidth = homeChunk.chunkWidth;
    let cHeight = homeChunk.chunkHeight;
    let cPixSize = homeChunk.pixelSize;
    let cGap = homeChunk.gap;
    // currentChunk.updatePixel(canvas, [
    //     locToInt(0, 4, cWidth),
    //     locToInt(0, 5, cWidth),
    //     locToInt(1, 4, cWidth),
    //     locToInt(1, 5, cWidth),
    //     locToInt(10, 4, cWidth),
    //     locToInt(10, 5, cWidth),
    //     locToInt(10, 6, cWidth),
    //     locToInt(11, 3, cWidth),
    //     locToInt(11, 7, cWidth),
    //     locToInt(12, 2, cWidth),
    //     locToInt(12, 8, cWidth),
    //     locToInt(13, 2, cWidth),
    //     locToInt(13, 8, cWidth),
    //     locToInt(14, 5, cWidth),
    //     locToInt(15, 3, cWidth),
    //     locToInt(15, 7, cWidth),
    //     locToInt(16, 4, cWidth),
    //     locToInt(16, 5, cWidth),
    //     locToInt(16, 6, cWidth),
    //     locToInt(17, 5, cWidth),
    //     locToInt(20, 2, cWidth),
    //     locToInt(20, 3, cWidth),
    //     locToInt(20, 4, cWidth),
    //     locToInt(21, 2, cWidth),
    //     locToInt(21, 3, cWidth),
    //     locToInt(21, 4, cWidth),
    //     locToInt(22, 1, cWidth),
    //     locToInt(22, 5, cWidth),
    //     locToInt(24, 0, cWidth),
    //     locToInt(24, 1, cWidth),
    //     locToInt(24, 5, cWidth),
    //     locToInt(24, 6, cWidth),
    //     locToInt(34, 2, cWidth),
    //     locToInt(34, 3, cWidth),
    //     locToInt(35, 2, cWidth),
    //     locToInt(35, 3, cWidth),
    // ], true);
    // currentChunk.updatePixel(canvas, [
    //     locToInt(7, 9, cWidth),
    //     locToInt(8, 9, cWidth)
    // ], true)
    chunks["0,0"] = homeChunk;
    // chunks["1,1"] = new Chunk(1, 1, canva s);
    // chunks["1,0"] = new Chunk(1, 0, canvas);
    // chunks["-1,0"] = new Chunk(-1, 0, canvas);
    // chunks["-2,0"] = new Chunk(-2, 0, canvas);

    // homeChunk.addCells([
    //     [0, 4],
    //     [0, 5],
    //     [1, 4],
    //     [1, 5],
    //     [10, 4],
    //     [10, 5],
    //     [10, 6],
    //     [11, 3],
    //     [11, 7],
    //     [12, 2],
    //     [12, 8],
    //     [13, 2],
    //     [13, 8],
    //     [14, 5],
    //     [15, 3],
    //     [15, 7],
    //     [16, 4],
    //     [16, 5],
    //     [16, 6],
    //     [17, 5],
    //     [20, 2],
    //     [20, 3],
    //     [20, 4],
    //     [21, 2],
    //     [21, 3],
    //     [21, 4],
    //     [22, 1],
    //     [22, 5],
    //     [24, 0],
    //     [24, 1],
    //     [24, 5],
    //     [24, 6],
    //     [34, 2],
    //     [34, 3],
    //     [35, 2],
    //     [35, 3]
    // ])

    // homeChunk.addCells([
    //     [1,0],
    //     [2,1],
    //     [2,2],
    //     [1,2],
    //     [0,2],
    // ])


    const drawChunks = () => {
        //load all chunk
        for (const i in chunks) {
            const chunk = chunks[i];
            chunk.drawChunk(canvas);

            canvas.beginPath();
            canvas.lineWidth = "2";
            canvas.strokeStyle = "red";
            canvas.rect(chunk.locX * (cPixSize + cGap) * cWidth, chunk.locY * (cPixSize + cGap) * cHeight,
                (cPixSize + cGap) * cWidth,
                (cPixSize + cGap) * cHeight);
            canvas.stroke();

            //debug
            let chunkStartX = chunk.locX * (cPixSize + cGap) * cWidth + 300;
            let chunkStartY = chunk.locY * (cPixSize + cGap) * cHeight;
            for (const i of chunk.alivePixelList) {
                let col = chunk.cellData[i[0]][i[1]] / 5 * 255;
                canvas.fillStyle = `rgb(${col},${col},${col})`;
                canvas.fillRect(chunkStartX + (cPixSize + cGap) * i[0],
                    chunkStartY + (cPixSize + cGap) * i[1],
                    cPixSize, cPixSize);
            }
            canvas.fillStyle = chunk.deadPixel;

            canvas.font = '12px white';
            canvas.fillStyle = "red";
            // console.log(chunkStartX, chunkStartY)
            for (let y = 0; y < cHeight; y++) {
                for (let x = 0; x < cWidth; x++) {
                    canvas.fillText(chunk.cellData[x][y], chunkStartX + x * (cPixSize + cGap) + cPixSize / 2, chunkStartY + y * (cPixSize + cGap) + cPixSize / 2);
                }
            }
        }
    }
    drawChunks();

    //play time
    let interval;
    const startButton = document.getElementById('start');
    startButton.onclick = () => {
        if (!interval) {
            startButton.innerText = 'stop';
            interval = setInterval(() => {
                //refresh all chunk
                for (const i in chunks) {
                    chunks[i].calculateChunk();
                    // console.log(changeList)
                    // console.log(drag)
                    if (!drag) {
                        // chunks[i].drawChangeCells(canvas);
                        drawChunks();
                    }
                }
            }, 500);
        } else {
            startButton.innerText = 'start';
            clearInterval(interval);
            interval = null;
        }
    }

    //movement
    let drag = false;
    let mapX = 0, mapY = 0;
    let moveX = 0, moveY = 0;
    let lastMoveX = 0, lastMoveY = 0;
    playground.onmousedown = (event) => {
        if (!drag) {
            moveX += event.clientX - moveX;
            moveY += event.clientY - moveY;
            lastMoveX = moveX;
            lastMoveY = moveY;
            drag = true;
        }
    }

    playground.onmouseup = (event) => {
        mapX += lastMoveX - moveX;
        mapY += lastMoveY - moveY;
        if (abs(lastMoveX - moveX) < 10 && abs(lastMoveY - moveY) < 10) {
            let x = (mapX + event.clientX) / (cPixSize + cGap);
            let y = (mapY + event.clientY) / (cPixSize + cGap);
            //計算chunk位置
            let cx = x / cWidth | 0;
            let cy = y / cHeight | 0;
            if (x < 0)
                cx--;
            if (y < 0)
                cy--;

            // console.log(cx + ',' + cy);
            // console.log([[x - (cx * cWidth) | 0, y - (cy * cHeight) | 0]])
            chunks[cx + ',' + cy].addCells([[x - (cx * cWidth) | 0, y - (cy * cHeight) | 0]], canvas);
            drawChunks();

            // drawChunks();
            // chunks[cx + ',' + cy].drawUserChange(canvas, changeList);

            // if ((mapX + event.clientX) < 0) {
            //     x += cWidth;
            // }
            // if ((mapY + event.clientY) < 0) {
            //     y += cHeight;
            // }

            // console.log(x - (cx * cWidth) | 0, y - (cy * cHeight) | 0)
            // console.log(cx + ',' + cy);
            // console.log(x - (cx * cWidth), y - (cy * cHeight));
            // chunks[cx + ',' + cy].updatePixel(canvas, [
            //     locToInt(x - (cx * cWidth) | 0, y - (cy * cHeight) | 0, cWidth)
            // ], true);
        }
        drag = false;
    }

    playground.onmousemove = (event) => {
        if (drag) {
            canvas.translate(event.clientX - moveX, event.clientY - moveY);
            moveX += event.clientX - moveX;
            moveY += event.clientY - moveY;

            clear();
            drawChunks();
        }
    }

    function clear() {
        canvas.clearRect(mapX - playground.width, mapY - playground.height, 3 * playground.width, 3 * playground.height);
    }
}

const loadChunk = (x, y) => {
    const chunk = new Chunk(x, y);
    chunks[x + ',' + y] = chunk;
    chunk.drawChunk(canvas);
    console.log('load chunk: ' + x + ',' + y)
    return chunk;
}

const locToInt = (x, y, width) => {
    return y * width + x;
}

const abs = (input) => {
    return input < 0 ? -input : input;
}