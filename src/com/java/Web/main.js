let chunks = {};
let needChangeChunk = [];
let canvas;
let screenScale = 1;
let time = 0;

let count = 0;

window.onload = function () {
    const playground = document.getElementById('playground');
    canvas = playground.getContext('2d');
    canvas.canvas.width = window.innerWidth;
    canvas.canvas.height = window.innerHeight;

    const homeChunk = new Chunk(0, 0);
    let cWidth = homeChunk.chunkWidth;
    let cHeight = homeChunk.chunkHeight;
    let cPixSize = homeChunk.pixelSize;
    let cGap = homeChunk.gap;
    chunks["0,0"] = homeChunk;

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

    homeChunk.addCells([
        [3, 4],
        [2, 5],
        [3, 6],
        [5, 4],
    ], canvas, 1);

    homeChunk.addCells([
        [6, 6],
        [5, 7],
        [6, 7],
        [7, 7],
    ], canvas, 2);

    if (false) {
        homeChunk.addCells([[12, 2],
            [13, 2],
            [14, 2],
            [11, 3],
            [14, 3],
            [15, 3],
            [10, 4],
            [14, 4],
            [10, 5],
            [15, 5],
            [12, 6],
            [0, 7],
            [1, 7],
            [2, 7],
            [3, 7],
            [9, 7],
            [11, 7],
            [0, 8],
            [4, 8],
            [5, 8],
            [7, 8],
            [9, 8],
            [10, 8],
            [11, 8],
            [13, 8],
            [14, 8],
            [0, 9],
            [6, 9],
            [7, 9],
            [13, 9],
            [1, 10],
            [4, 10],
            [5, 10],
            [7, 10],
            [10, 10],
            [13, 10],
            [15, 10],
            [7, 11],
            [9, 11],
            [11, 11],
            [13, 11],
            [15, 11],
            [1, 12],
            [4, 12],
            [5, 12],
            [7, 12],
            [10, 12],
            [13, 12],
            [0, 13],
            [6, 13],
            [7, 13],
            [11, 13],
            [13, 13],
            [15, 13],
            [0, 14],
            [4, 14],
            [5, 14],
            [7, 14],
            [9, 14],
            [10, 14],
            [13, 14],
            [0, 15],
            [1, 15],
            [2, 15],
            [3, 15],
            [9, 15],
            [11, 15],
            [13, 15],
            [15, 15],
        ], canvas, 1);
        if (chunks['1,0'] === undefined)
            chunks['1,0'] = loadChunk(1, 0)
        chunks['1,0'].addCells([
            [2, 0],
            [1, 1],
            [2, 1],
            [3, 1],
            [3, 2],
            [4, 2],
            [0, 3],
            [3, 3],
            [5, 3],
            [6, 3],
            [0, 4],
            [3, 4],
            [5, 4],
            [1, 5],
            [3, 5],
            [5, 5],
            [7, 5],
            [8, 5],
            [1, 6],
            [3, 6],
            [7, 6],
            [8, 6],
            [0, 7],
            [4, 7],
            [6, 7],
            [7, 7],
            [8, 7],
            [8, 8],
            [9, 8],
            [0, 10],
            [1, 11],
            [7, 11],
            [8, 11],
            [9, 11],
            [10, 11],
            [0, 12],
            [1, 12],
            [3, 12],
            [5, 12],
            [6, 12],
            [10, 12],
            [3, 13],
            [4, 13],
            [10, 13],
            [0, 14],
            [3, 14],
            [5, 14],
            [6, 14],
            [9, 14],
            [1, 15],
            [3, 15]
        ], canvas, 1);

        if (chunks['0,1'] === undefined)
            chunks['0,1'] = loadChunk(0, 1)
        chunks['0,1'].addCells([
            [10, 0],
            [11, 0],
            [13, 0],
            [13, 1],
            [1, 2],
            [2, 2],
            [12, 2],
            [13, 2],
            [15, 2],
            [2, 3],
            [3, 3],
            [4, 3],
            [6, 3],
            [10, 3],
            [15, 3],
            [2, 4],
            [3, 4],
            [7, 4],
            [9, 4],
            [14, 4],
            [2, 5],
            [3, 5],
            [5, 5],
            [7, 5],
            [9, 5],
            [11, 5],
            [5, 6],
            [7, 6],
            [10, 6],
            [12, 6],
            [4, 7],
            [5, 7],
            [7, 7],
            [10, 7],
            [11, 7],
            [12, 7],
            [15, 7],
            [6, 8],
            [7, 8],
            [12, 8],
            [13, 8],
            [14, 8],
            [7, 9],
            [8, 9],
            [9, 9],
            [8, 10]
        ], canvas, 2);

        if (chunks['1,1'] === undefined)
            chunks['1,1'] = loadChunk(1, 1)
        chunks['1,1'].addCells([
            [0, 0],
            [3, 0],
            [5, 0],
            [6, 0],
            [9, 0],
            [3, 1],
            [4, 1],
            [10, 1],
            [0, 2],
            [1, 2],
            [3, 2],
            [5, 2],
            [6, 2],
            [10, 2],
            [1, 3],
            [7, 3],
            [8, 3],
            [9, 3],
            [10, 3],
            [0, 5],
            [0, 6]
        ], canvas, 2);
        calculateChangeLaterChunk();
    }


    const drawAllChunks = () => {
        const pixSize = (cPixSize * screenScale + cGap);
        const adjustX = mapX < 0;
        const adjustY = mapY < 0;

        const xChunkCount = (canvas.canvas.width / (pixSize * cWidth) | 0) + 1;
        const yChunkCount = (canvas.canvas.height / (pixSize * cHeight) | 0) + 1;

        for (let x = -1; x < xChunkCount; x++) {
            //計算chunk開始位置X
            const startX = ((-mapX / pixSize / cWidth | 0) + x + adjustX) * pixSize * cWidth;
            //計算chunk位置X
            let cx = startX / pixSize / cWidth | 0;

            for (let y = -1; y < yChunkCount; y++) {
                //計算chunk開始位置Y
                const startY = ((-mapY / pixSize / cHeight | 0) + y + adjustY) * pixSize * cHeight;
                //計算chunk位置Y
                let cy = startY / pixSize / cHeight | 0;

                if (chunks[cx + ',' + cy] !== undefined)
                    chunks[cx + ',' + cy].drawChunk(canvas);
            }
        }


        canvas.lineWidth = cGap;
        canvas.strokeStyle = "rgb(54, 54, 54)";
        canvas.beginPath();
        if (screenScale > 0.6) {
            const startX = ((-mapX / pixSize / cWidth | 0) + adjustX - 1) * pixSize * cWidth;
            const startY = ((-mapY / pixSize / cHeight | 0) + adjustY - 1) * pixSize * cHeight;
            const viewWidth = startX + (xChunkCount + 1) * pixSize * cWidth;
            const viewHeight = startY + (yChunkCount + 1) * pixSize * cHeight;
            for (let y = 0; y < (yChunkCount + 1) * cHeight; y++) {
                canvas.moveTo(startX, startY + y * pixSize);
                canvas.lineTo(viewWidth, startY + y * pixSize);
            }

            for (let x = 0; x < (xChunkCount + 1) * cWidth; x++) {
                canvas.moveTo(startX + x * pixSize, startY);
                canvas.lineTo(startX + x * pixSize, viewHeight);
            }
        }
        canvas.stroke();
    }

    //計算所有chunk
    const calculateAllChunks = () => {
        let timer = window.performance.now();
        //calculate all chunk
        for (const i in chunks) {
            count += chunks[i].calculateChunk();
            //TODO this is for debug
            count++;
        }
        calculateChangeLaterChunk();
        calculateTime.innerText = '每禎計算時間: ' + (window.performance.now() - timer) + 'ms';
        calculateCount.innerText = '計算次數: ' + count;
        timeCount.innerText = '' + ++time;
        count = 0;
    }


    //時間
    let interval;
    const startButton = document.getElementById('start');
    const nextButton = document.getElementById('next');
    const timeCount = document.getElementById('count');
    const calculateCount = document.getElementById('calculateCount');
    const calculateTime = document.getElementById('calculateTime');
    const locationView = document.getElementById('location');
    startButton.onclick = () => {
        if (!interval) {
            startButton.innerText = 'stop';
            interval = setInterval(() => {
                calculateAllChunks();
                for (const i in chunks) {
                    chunks[i].drawChangeCells(canvas);
                    //標記成沒算過
                    chunks[i].beforeChange = null;
                }
                // debug();
            }, 10);
        } else {
            startButton.innerText = 'start';
            clearInterval(interval);
            interval = null;
        }
    }

    nextButton.onclick = () => {
        calculateAllChunks();
        for (const i in chunks) {
            chunks[i].drawChangeCells(canvas);
            //標記成沒算過
            chunks[i].beforeChange = null;
        }
        // debug();
    };

    const debug = () => {
        for (const i in chunks) {
            const chunk = chunks[i];

            let chunkStartX = chunk.locX * (cPixSize * screenScale + cGap) * cWidth;
            let chunkStartY = chunk.locY * (cPixSize * screenScale + cGap) * cHeight;
            for (let i = 0; i < chunk.alivePixelList.length; i++) {
                const x = chunk.alivePixelList[i][0];
                const y = chunk.alivePixelList[i][1];
                let col = (chunk.cellData[x][y] + 1) / 7 * 255;
                canvas.fillStyle = `rgb(0,${col},0)`;
                canvas.fillRect(chunkStartX + (cPixSize * screenScale + cGap) * x + cPixSize * screenScale / 4,
                    chunkStartY + (cPixSize * screenScale + cGap) * y + cPixSize * screenScale / 4,
                    cPixSize * screenScale / 2, cPixSize * screenScale / 2);
            }
            canvas.fillStyle = chunk.deadPixel;

            //debug用
            canvas.beginPath();
            canvas.lineWidth = "2";
            canvas.strokeStyle = "blue";
            canvas.rect(
                chunkStartX, chunkStartY,
                (cPixSize * screenScale + cGap) * cWidth,
                (cPixSize * screenScale + cGap) * cHeight);
            canvas.stroke();

            // canvas.font = '12px white';
            // canvas.fillStyle = "red";
            // canvas.fillText((cx) + ',' + (cy),
            //     startX,
            //     startY + 10);

            // canvas.font = '10px';
            // canvas.fillStyle = "red";
            // // console.log(chunkStartX, chunkStartY)
            // for (let y = 0; y < cHeight; y++) {
            //     for (let x = 0; x < cWidth; x++) {
            //         canvas.fillText(chunk.cellData[x][y], chunkStartX + x * (cPixSize * screenScale + cGap) + cPixSize * screenScale / 2,
            //             chunkStartY + y * (cPixSize * screenScale + cGap) + cPixSize * screenScale / 2);
            //     }
            // }
        }
    }

    //移動方面
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
        //點一下的話
        if (abs(lastMoveX - moveX) < 10 && abs(lastMoveY - moveY) < 10) {
            let x = (event.clientX - mapX) / (cPixSize * screenScale + cGap);
            let y = (event.clientY - mapY) / (cPixSize * screenScale + cGap);
            //計算chunk位置
            let cx = x / cWidth | 0;
            let cy = y / cHeight | 0;
            if (x < 0)
                cx--;
            if (y < 0)
                cy--;

            let chunk = chunks[cx + ',' + cy];
            //沒load的話
            if (chunk === undefined)
                chunk = loadChunk(cx, cy);

            chunk.addCells([[x - (cx * cWidth) | 0, y - (cy * cHeight) | 0]], canvas, 2);
            calculateChangeLaterChunk();
            chunk.drawChangeCells(canvas);
        }
        drag = false;
    }

    //移動整個畫面
    playground.onmousemove = (event) => {
        if (drag) {
            let moveToX = event.clientX - moveX;
            let moveToY = event.clientY - moveY;
            canvas.translate(moveToX, moveToY);
            mapX += moveToX;
            mapY += moveToY;

            moveX += moveToX;
            moveY += moveToY;

            locationView.innerText = '座標: ' + (-mapX | 0) + ',' + (mapY | 0);

            clear();
            drawAllChunks();
            // debug();
        }
    }

    //縮放
    playground.onwheel = (event) => {
        //-0.01 * 0.2 = -0.002
        const delta = ((event.deltaY * -0.002) * 10 | 0) / 10;

        screenScale += delta;
        screenScale = (screenScale * 10 | 0) / 10
        if (screenScale < 0.1) {
            screenScale = 0.1;
        }

        if (screenScale > 0.1) {
            let moveToX = -(event.clientX - mapX) * delta / screenScale;
            let moveToY = -(event.clientY - mapY) * delta / screenScale;
            canvas.translate(moveToX, moveToY);
            mapX += moveToX;
            mapY += moveToY;

            moveX += moveToX;
            moveY += moveToY;
        }

        clear();
        drawAllChunks();
    }

    function clear() {
        canvas.clearRect(-canvas.canvas.width - mapX, -canvas.canvas.height - mapY, canvas.canvas.width * 2, canvas.canvas.height * 2);
    }

    //setup
    drawAllChunks();
}

//經過chunk邊界的資料需要等所有chunk計算完畢再更新資料
const calculateChangeLaterChunk = () => {
    for (const i of needChangeChunk) {
        const thisChunk = chunks[i];
        for (const j of thisChunk.oldCellData) {
            thisChunk.cellData[j[0]][j[1]] += j[2];
            if (!thisChunk.isLocInAliveList(j[0], j[1])) {
                thisChunk.alivePixelList.push([j[0], j[1]]);
            }

            //TODO this is for debug
            count++;
        }
        chunks[i].oldCellData = [];
    }
    needChangeChunk = [];
}

const loadChunk = (x, y) => {
    const chunk = new Chunk(x, y);
    chunks[x + ',' + y] = chunk;
    chunk.drawChunk(canvas);
    // console.log('load chunk: ' + x + ',' + y)
    return chunk;
}

const unloadChunk = (x, y) => {
    if (chunks[x + ',' + y] != null)
        delete chunks[x + ',' + y];
}

const abs = (input) => {
    return input < 0 ? -input : input;
}

Object.size = function (obj) {
    let size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};