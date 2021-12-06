let chunks = {};
//螢幕設定
let screenScale = 1.5;
let screenMinScale = 0.1;
let drawLineScreenScale = 1.5;
let strokeStyle = 'rgb(54, 54, 54)';
let placeErrorColor = 'rgb(255, 0, 0)';

//遊戲時間
let worldTime = 0;

//兩隊的數量
let teamACount = 0;
let teamBCount = 0;
const teams = [0, 0];
const colors = [
    new Color(10, 10, 10),
    new Color(0, 200, 200),
    new Color(200, 200, 200)
]

//chunk的範圍
let minChunkX = -1000, minChunkY = -1000, maxChunkX = 1000, maxChunkY = 1000;

//在的隊伍
let teamID = 2;

//chunk的資訊
const chunkWidth = 16, chunkHeight = 16
const cellSize = 10, cellWallGap = 2;
let cellGap = 0;

let realPixelSize;

window.onload = function () {
    const playground = document.getElementById('playground');
    const canvas = playground.getContext('2d');

    const canvasHelper = new Worker('canvas.js');
    const minMap = new MiniMap(colors, canvas.canvas);
    // worker.onmessage = function (e) {
    //     console.log(e.data);
    // }

    // canvasHelper.postMessage(document);


    const gameWindow = document.getElementById('gamePage');

    const teamA = document.getElementById('teamA');
    const teamB = document.getElementById('teamB');

    realPixelSize = ((cellSize * screenScale) * 10 | 0) / 10;

    gameWindow.style.backgroundColor = colors[0].toString();
    teamA.style.backgroundColor = colors[1].toString();
    teamB.style.backgroundColor = colors[2].toString();

    if (1) {
        getChunk(0, 0).addCells([
            [12, 2], [13, 2], [14, 2], [11, 3], [14, 3], [15, 3], [10, 4], [14, 4], [10, 5], [15, 5], [12, 6], [0, 7], [1, 7], [2, 7], [3, 7], [9, 7], [11, 7], [0, 8],
            [4, 8], [5, 8], [7, 8], [9, 8], [10, 8], [11, 8], [13, 8], [14, 8], [0, 9], [6, 9], [7, 9], [13, 9], [1, 10], [4, 10], [5, 10], [7, 10], [10, 10], [13, 10],
            [15, 10], [7, 11], [9, 11], [11, 11], [13, 11], [15, 11], [1, 12], [4, 12], [5, 12], [7, 12], [10, 12], [13, 12], [0, 13], [6, 13], [7, 13], [11, 13],
            [13, 13], [15, 13], [0, 14], [4, 14], [5, 14], [7, 14], [9, 14], [10, 14], [13, 14], [0, 15], [1, 15], [2, 15], [3, 15], [9, 15], [11, 15], [13, 15], [15, 15]
        ], canvas, 2);
        getChunk(1, 0).addCells([
            [2, 0], [1, 1], [2, 1], [3, 1], [3, 2], [4, 2], [0, 3], [3, 3], [5, 3], [6, 3], [0, 4], [3, 4], [5, 4], [1, 5], [3, 5], [5, 5], [7, 5], [8, 5], [1, 6], [3, 6], [7, 6],
            [8, 6], [0, 7], [4, 7], [6, 7], [7, 7], [8, 7], [8, 8], [9, 8], [0, 10], [1, 11], [7, 11], [8, 11], [9, 11], [10, 11], [0, 12], [1, 12], [3, 12], [5, 12], [6, 12],
            [10, 12], [3, 13], [4, 13], [10, 13], [0, 14], [3, 14], [5, 14], [6, 14], [9, 14], [1, 15], [3, 15]
        ], canvas, 1);
        getChunk(0, 1).addCells([
            [10, 0], [11, 0], [13, 0], [13, 1], [1, 2], [2, 2], [12, 2], [13, 2], [15, 2], [2, 3], [3, 3], [4, 3], [6, 3], [10, 3], [15, 3], [2, 4], [3, 4], [7, 4], [9, 4],
            [14, 4], [2, 5], [3, 5], [5, 5], [7, 5], [9, 5], [11, 5], [5, 6], [7, 6], [10, 6], [12, 6], [4, 7], [5, 7], [7, 7], [10, 7], [11, 7], [12, 7], [15, 7], [6, 8],
            [7, 8], [12, 8], [13, 8], [14, 8], [7, 9], [8, 9], [9, 9], [8, 10]
        ], canvas, 2);
        getChunk(1, 1).addCells([
            [0, 0], [3, 0], [5, 0], [6, 0], [9, 0], [3, 1], [4, 1], [10, 1], [0, 2], [1, 2], [3, 2], [5, 2], [6, 2], [10, 2], [1, 3], [7, 3], [8, 3], [9, 3],
            [10, 3], [0, 5], [0, 6]
        ], canvas, 1);
        // calculateTeam();
    }

    function drawAllChunks() {
        const adjustX = mapX < 0;
        const adjustY = mapY < 0;

        //計算畫面中有幾個chunk
        const xChunkCount = (canvas.canvas.width / (realPixelSize * chunkWidth) | 0) + 2;
        const yChunkCount = (canvas.canvas.height / (realPixelSize * chunkHeight) | 0) + 2;

        //計算chunk開始位置X
        const startX = ((-mapX / realPixelSize / chunkWidth | 0) - 1 + adjustX);
        //計算chunk開始位置Y
        const startY = ((-mapY / realPixelSize / chunkHeight | 0) - 1 + adjustY);
        minMap.setLocation(startX + 1, startY + 1, xChunkCount - 2, yChunkCount - 2);

        for (let x = 0; x < xChunkCount; x++) {
            //計算chunk位置X
            const cx = chunks[startX + x | 0];
            if (cx === undefined) continue;
            for (let y = 0; y < yChunkCount; y++) {
                //計算chunk位置Y
                const cy = cx[startY + y | 0];
                if (cy !== undefined)
                    cy.drawChunk(canvas);
            }
        }

        if (screenScale > drawLineScreenScale) {
            canvas.lineWidth = cellGap;
            canvas.strokeStyle = strokeStyle;
            canvas.beginPath();
            const lStartX = startX * realPixelSize * chunkWidth;
            const lStartY = startY * realPixelSize * chunkHeight;
            const viewWidth = lStartX + xChunkCount * realPixelSize * chunkWidth;
            const viewHeight = lStartY + yChunkCount * realPixelSize * chunkHeight;
            for (let y = 0; y < yChunkCount * chunkHeight; y++) {
                canvas.moveTo(lStartX, lStartY + y * realPixelSize);
                canvas.lineTo(viewWidth, lStartY + y * realPixelSize);
            }

            for (let x = 0; x < xChunkCount * chunkWidth; x++) {
                canvas.moveTo(lStartX + x * realPixelSize, lStartY);
                canvas.lineTo(lStartX + x * realPixelSize, viewHeight);
            }
            canvas.stroke();
        }
    }

    //計算所有chunk
    function calculateAllChunks() {
        let timer = window.performance.now();
        let count = 0;
        let needChange = [];
        //calculate all chunk
        for (const i in chunks) {
            const cx = chunks[i];
            for (const j in cx) {
                const chunk = cx[j];
                if (chunk.calculateChange(worldTime % 16 === 0))
                    needChange.push(chunk);
                //TODO this is for debug
                count++;
            }
        }
        for (const chunk of needChange) {
            count += chunk.calculateChunk();
            //TODO this is for debug
            count++;
        }
        for (const chunk of needChange) {
            count += chunk.updateMap();
            //TODO this is for debug
            count++;
        }

        //更新畫面
        const adjustX = mapX < 0;
        const adjustY = mapY < 0;
        //計算畫面中有幾個chunk
        const xChunkCount = (canvas.canvas.width / (realPixelSize * chunkWidth) | 0) + 2;
        const yChunkCount = (canvas.canvas.height / (realPixelSize * chunkHeight) | 0) + 2;
        //計算chunk開始位置X
        const startX = ((-mapX / realPixelSize / chunkWidth | 0) - 1 + adjustX);
        //計算chunk開始位置Y
        const startY = ((-mapY / realPixelSize / chunkHeight | 0) - 1 + adjustY);
        for (const chunk of needChange) {
            if (chunk.locX >= startX && chunk.locX < startX + xChunkCount &&
                chunk.locY >= startY && chunk.locY < startY + yChunkCount)
                // worker.postMessage([thisChunk.drawChangeCells, canvas])
                chunk.drawChangeCells(canvas);
        }

        calculateTeam();
        minMap.updateMiniMap();

        calculateTime.innerText = '每幀計算時間: ' + (window.performance.now() - timer) + 'ms';
        calculateCount.innerText = 'for迴圈次數: ' + count;
        timeCount.innerText = '' + ++worldTime;
    }

    //計算兩隊佔有量
    function calculateTeam() {
        const all = (100 / (teams[0] + teams[1]));
        const teamAPer = all * teams[0];
        const teamBPer = all * teams[1];
        teamA.style.width = teamAPer + '%';
        teamA.innerText = Math.round(teamAPer * 10) / 10 + '%';
        teamB.style.width = teamBPer + '%';
        teamB.innerText = Math.round(teamBPer * 10) / 10 + '%';
    }

    //計時器
    let interval;
    //UI
    const startButton = document.getElementById('start');
    const nextButton = document.getElementById('next');
    const timeCount = document.getElementById('count');
    const calculateCount = document.getElementById('calculateCount');
    const calculateTime = document.getElementById('calculateTime');
    const locationView = document.getElementById('location');
    //模擬
    startButton.onclick = () => {
        if (!interval) {
            startButton.innerText = 'stop';
            interval = setInterval(() => {
                calculateAllChunks();
                // refreshScreen();
            }, 10);
        } else {
            startButton.innerText = 'start';
            clearInterval(interval);
            interval = null;
        }
    }

    nextButton.onclick = () => {
        calculateAllChunks();
        // refreshScreen();
    };

    //範例
    let lastDrawPosX = 0, lastDrawPosY = 0;
    let lastMousePosX = 0, lastMousePosY = 0;

    function drawExample(x, y, need, failed, clear) {
        const objectWidth = model[0][0];
        const objectHeight = model[0][1];

        let startX = ((x - mapX - realPixelSize / 2) / realPixelSize | 0) * realPixelSize;
        let startY = ((y - mapY - realPixelSize / 2) / realPixelSize | 0) * realPixelSize;
        //置中
        startX -= realPixelSize * (objectWidth / 2 | 0);
        startY -= realPixelSize * (objectHeight / 2 | 0);

        //負的地方需要更改
        if ((x - mapX) < realPixelSize / 2)
            startX -= realPixelSize;
        if ((y - mapY) < realPixelSize / 2)
            startY -= realPixelSize;

        //刷新螢幕
        if (startX !== lastDrawPosX || startY !== lastDrawPosY || need) {
            //清除上次畫的
            if (clear)
                placeExample(lastMousePosX, lastMousePosY, true);
            lastDrawPosX = startX;
            lastDrawPosY = startY;
        } else {
            return;
        }

        if (failed)
            canvas.fillStyle = placeErrorColor;
        else
            canvas.fillStyle = colors[teamID];

        //畫範例
        for (let y = 0; y < objectHeight; y++) {
            for (let x = 0; x < objectWidth; x++) {
                if (model[y + 1][x] === 0)
                    continue;
                canvas.fillRect(startX + realPixelSize * (x + 1), startY + realPixelSize * (y + 1), realPixelSize, realPixelSize);
            }
        }

        lastMousePosX = x;
        lastMousePosY = y;
    }

    function placeExample(x, y, clear) {
        const modelWidth = model[0][0];
        const modelHeight = model[0][1];

        let startX = ((x - mapX - realPixelSize / 2) / realPixelSize | 0) * realPixelSize;
        let startY = ((y - mapY - realPixelSize / 2) / realPixelSize | 0) * realPixelSize;
        //置中
        startX -= realPixelSize * (modelWidth / 2 | 0);
        startY -= realPixelSize * (modelHeight / 2 | 0);
        let startXsav = startX;
        let startYsav = startY;

        //負的地方需要更改
        if ((x - mapX) < realPixelSize / 2)
            startX -= realPixelSize;
        if ((y - mapY) < realPixelSize / 2)
            startY -= realPixelSize;

        //節省chunk的取得
        let lastCx = null, lastCy = null;
        let chunk;

        let needChangeChunk = {};
        for (let y = 0; y < modelHeight; y++) {
            startY += realPixelSize;
            let cache = startX;
            for (let x = 0; x < modelWidth; x++) {
                startX += realPixelSize;
                if (model[y + 1][x] === 0)
                    continue;

                let cx = (startX + 0.05) / realPixelSize / chunkWidth | 0;
                let cy = (startY + 0.05) / realPixelSize / chunkWidth | 0;
                if (startX < 0)
                    cx--;
                if (startY < 0)
                    cy--;

                //在chunk中的位置
                let xInC = startX / realPixelSize - (cx * chunkWidth) | 0;
                let yInC = startY / realPixelSize - (cy * chunkHeight) | 0;

                if (lastCx !== cx || lastCy !== cy) {
                    chunk = chunks[cx];
                    if (chunk !== undefined)
                        chunk = chunk[cy];
                    lastCx = cx;
                    lastCy = cy;
                }

                if (clear) {
                    if (chunk === undefined) {
                        canvas.fillStyle = colors[0];
                    }
                    //chunk有在
                    else {
                        let teamID = chunk.chunkMap[xInC][yInC];
                        canvas.fillStyle = colors[teamID];
                    }
                    canvas.fillRect(startX, startY, realPixelSize, realPixelSize);

                } else {
                    //放置
                    //看看這附近有沒有東西
                    if (chunk !== undefined)
                        //有東西
                        if (chunk.cellData[xInC][yInC] > 0) {
                            drawExample(lastMousePosX, lastMousePosY, true, true);
                            return false;
                        }

                    //加入替換清單
                    const thisChunk = needChangeChunk[cx + ',' + cy];
                    if (thisChunk === undefined)
                        needChangeChunk[cx + ',' + cy] = [[xInC, yInC]];
                    else
                        thisChunk.push([xInC, yInC])
                }
            }
            startX = cache;
        }

        if (!clear) {
            for (const i in needChangeChunk) {
                const j = i.split(',');
                getChunk(parseInt(j[0]), parseInt(j[1]))
                    .addCells(needChangeChunk[i], canvas, teamID)
            }
            // calculateChangeLaterChunk();
            return true;
        }

        startXsav += realPixelSize;
        startYsav += realPixelSize;

        if (screenScale > drawLineScreenScale) {
            canvas.lineWidth = cellGap;
            canvas.strokeStyle = strokeStyle;
            canvas.beginPath();
            const viewWidth = startXsav + modelWidth * realPixelSize;
            const viewHeight = startYsav + modelHeight * realPixelSize;
            for (let y = 0; y < modelHeight + 1; y++) {
                let ly = startYsav + y * realPixelSize;
                canvas.moveTo(startXsav, ly);
                canvas.lineTo(viewWidth, ly);
            }

            for (let x = 0; x < modelWidth + 1; x++) {
                let lx = startXsav + x * realPixelSize;
                canvas.moveTo(lx, startYsav);
                canvas.lineTo(lx, viewHeight);
            }
            canvas.stroke();
        }
    }

    window.onkeydown = (event) => {
        if (selectModel) {
            if (event.key === 'r') {
                //先清除
                placeExample(lastMousePosX, lastMousePosY, true);
                const modelWidth = model[0][0];
                const modelHeight = model[0][1];
                let newModel = [];
                newModel.push([modelHeight, modelWidth]);

                for (let x = 0; x < modelWidth; x++) {
                    let cache = []
                    for (let y = modelHeight; y > 0; y--) {
                        cache.push(model[y][x]);
                    }
                    newModel.push(cache);
                }

                model = newModel;
                drawExample(lastMousePosX, lastMousePosY, true);
            }

            if (event.key === 'f') {
                //先清除
                placeExample(lastMousePosX, lastMousePosY, true);
                const modelWidth = model[0][0];
                const modelHeight = model[0][1];
                let newModel = [];
                newModel.push([modelWidth, modelHeight]);

                for (let y = 0; y < modelHeight; y++) {
                    let cache = [];
                    for (let x = modelWidth; x > 0; x--) {
                        cache.push(model[y + 1][x - 1]);
                    }
                    newModel.push(cache);
                }

                model = newModel;
                drawExample(lastMousePosX, lastMousePosY, true);
            }

            if (event.key === 'Escape') {
                selectModel = false;
                placeExample(lastMousePosX, lastMousePosY, true);
            }
        }
    }

    //移動部分
    let drag = false;
    let mapX = 0, mapY = 0;
    let moveX = 0, moveY = 0;
    let lastMoveX = 0, lastMoveY = 0;
    playground.onmousedown = (event) => {
        resizeScreen();
        if (!drag) {
            moveX += event.offsetX - moveX;
            moveY += event.offsetY - moveY;
            lastMoveX = moveX;
            lastMoveY = moveY;
            drag = true;
        }
    }

    playground.onmouseup = (event) => {
        //點一下的話
        if (abs(lastMoveX - moveX) < 10 && abs(lastMoveY - moveY) < 10) {
            if (selectModel) {
                const donePlace = placeExample(event.offsetX, event.offsetY);
                //沒有按住shift且放置成功
                if (!event.shiftKey && donePlace)
                    selectModel = false;
                calculateTeam();
            }
            //一般的點選
            else {
                let x = (event.offsetX - mapX) / realPixelSize;
                let y = (event.offsetY - mapY) / realPixelSize;
                //計算chunk位置
                let cx = x / chunkWidth | 0;
                let cy = y / chunkHeight | 0;
                if (x < 0)
                    cx--;
                if (y < 0)
                    cy--;

                const chunk = getChunk(cx, cy);

                //chunk裡的x,y
                let xInC = x - (cx * chunkWidth) | 0;
                let yInC = y - (cy * chunkHeight) | 0;
                if (chunk.chunkMap[xInC][yInC] > 0 && chunk.chunkMap[xInC][yInC] !== teamID) {
                    canvas.fillStyle = placeErrorColor;
                    let chunkStartX = cx * realPixelSize * chunkWidth;
                    let chunkStartY = cy * realPixelSize * chunkHeight;
                    canvas.fillRect(chunkStartX + xInC * realPixelSize, chunkStartY + yInC * realPixelSize, realPixelSize, realPixelSize);
                } else {
                    chunk.addCells([[xInC, yInC]], canvas, teamID);
                    // calculateChangeLaterChunk();
                    calculateTeam();
                }
                // chunk.drawChangeCells(canvas);
            }
        }
        //還在選取狀態
        else if (selectModel) {
            drawExample(event.offsetX, event.offsetY, true);
        }
        minMap.updateMiniMap(true);
        drag = false;
    }

    playground.onmousemove = (event) => {
        //移動
        if (drag && !event.shiftKey) {
            let moveToX = event.offsetX - moveX;
            let moveToY = event.offsetY - moveY;
            move(moveToX, moveToY);
        }

        //畫範例
        if (!drag && selectModel) {
            drawExample(event.offsetX, event.offsetY, false, false, true);
        }
    }

    playground.onmouseleave = (event) => {
        drag = false;
    }

    function move(moveToX, moveToY) {
        mapX += moveToX | 0;
        mapY += moveToY | 0;
        moveX += moveToX | 0;
        moveY += moveToY | 0;
        canvas.setTransform(1, 0, 0, 1, mapX, mapY);

        locationView.innerText = '座標: ' + -(mapX / realPixelSize | 0) + ',' + (mapY / realPixelSize | 0);
        refreshScreen();
    }

    //縮放
    let delta = 0.1;
    playground.onwheel = (event) => {
        const lastScreenScale = screenScale;

        delta = abs(delta);
        if (event.deltaY > 0)
            delta *= -1;

        screenScale = Math.round((screenScale + delta) * 10) / 10;

        // screenScale = (screenScale * 10 | 0) / 10;
        if (screenScale < screenMinScale) {
            screenScale = screenMinScale;
        }

        if (lastScreenScale === screenScale)
            return

        // 計算沒放大前位置
        realPixelSize = ((cellSize * lastScreenScale) * 10 | 0) / 10;
        let xLast = (event.offsetX - mapX) / realPixelSize;
        let yLast = (event.offsetY - mapY) / realPixelSize;

        //如果需要畫線，更改cell之間的寬
        if (screenScale > drawLineScreenScale) {
            cellGap = cellWallGap;
            delta = 0.4;
        } else {
            cellGap = 0;
            delta = 0.1;
        }

        // 計算沒放大後位置
        realPixelSize = ((cellSize * screenScale) * 10 | 0) / 10;
        let xNow = (event.offsetX - mapX) / realPixelSize;
        let yNow = (event.offsetY - mapY) / realPixelSize;

        move((xNow - xLast) * realPixelSize, (yNow - yLast) * realPixelSize);

        if (selectModel) {
            window.requestAnimationFrame(() => drawExample(event.offsetX, event.offsetY, true));
        }
    }

    function resizeScreen() {
        if (canvas.canvas.width !== gameWindow.offsetWidth || canvas.canvas.height !== gameWindow.offsetHeight) {
            canvas.canvas.width = gameWindow.offsetWidth;
            canvas.canvas.height = gameWindow.offsetHeight;
            canvas.translate(mapX, mapY);
            refreshScreen();
        }
    }

    function refreshScreen() {
        window.requestAnimationFrame(clear);
        window.requestAnimationFrame(drawAllChunks);
        // window.requestAnimationFrame(debug);
    }

    this.moveTo = (x, y) => {
        let moveToX = -x * realPixelSize - mapX;
        let moveToY = y * realPixelSize - mapY;
        move(moveToX, moveToY);
    }

    function clear() {
        canvas.fillStyle = colors[0];
        canvas.fillRect(-canvas.canvas.width - mapX, -canvas.canvas.height - mapY, canvas.canvas.width * 2, canvas.canvas.height * 2);
    }

    //setup
    resizeScreen();
    calculateTeam();
    loadExample();
    minMap.updateMiniMap(true);

    function debug() {
        for (const i in chunks) {
            const chunkX = chunks[i];
            for (const j in chunkX) {
                const chunk = chunkX[j];

                let chunkStartX = chunk.locX * realPixelSize * chunkWidth;
                let chunkStartY = chunk.locY * realPixelSize * chunkHeight;
                for (let i = 0; i < chunk.aliveLength; i++) {
                    const [x, y] = chunk.getAlivePixelPos(i);
                    if (x === -1) break;
                    let col = (chunk.cellData[x][y] + 1) / 7 * 255;
                    canvas.fillStyle = `rgb(0,${col},0)`;
                    canvas.fillRect(chunkStartX + realPixelSize * x + cellSize * screenScale / 4,
                        chunkStartY + realPixelSize * y + cellSize * screenScale / 4,
                        cellSize * screenScale / 2, cellSize * screenScale / 2);
                }
                canvas.font = '12px Arial';

                // debug用
                canvas.beginPath();
                canvas.lineWidth = '2';
                canvas.strokeStyle = 'blue';
                canvas.rect(
                    chunkStartX, chunkStartY,
                    realPixelSize * chunkWidth,
                    realPixelSize * chunkHeight);
                canvas.stroke();

                canvas.textAlign = 'left';
                canvas.fillStyle = 'blue';
                canvas.fillText(chunk.locX + ',' + chunk.locY,
                    chunkStartX + 2,
                    chunkStartY + 12);

                canvas.textAlign = 'center';
                canvas.fillStyle = 'red';
                // console.log(chunkStartX, chunkStartY)
                for (let y = 0; y < chunkHeight; y++) {
                    for (let x = 0; x < chunkWidth; x++) {
                        if (chunk.cellData[x][y] > 0)
                            canvas.fillText(chunk.cellData[x][y], chunkStartX + x * realPixelSize + cellSize * screenScale / 2,
                                chunkStartY + y * realPixelSize + cellSize * screenScale / 2 + 5);
                    }
                }
            }
        }
    }
}

const loadChunk = function (x, y) {
    const chunk = new Chunk(x, y);
    let cx = chunks[x];
    if (cx === undefined)
        cx = chunks[x] = {};
    cx[y] = chunk;
    return chunk;
}

function getChunk(x, y) {
    let chunk = chunks[x];
    if (chunk === undefined)
        return loadChunk(x, y);
    chunk = chunk[y];
    if (chunk === undefined)
        return loadChunk(x, y);
    return chunk;
}

const unloadChunk = function (x, y) {
    const chunk = chunks[x];
    if (chunk !== undefined && chunk[y] !== undefined)
        delete chunks[x][y];
}

const out = console.log;

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
}
