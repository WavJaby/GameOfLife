let chunks = {};
let needChangeChunk = [];
let canvas;
//螢幕設定
let screenScale = 1;
let screenMinScale = 0.01;
let drawLineScreenScale = 2;
let strokeStyle = "rgb(54, 54, 54)";
let placeErrorColor = "rgb(255, 0, 0)";

//遊戲時間
let worldTime = 0;
//兩隊的數量
let teamACount = 0;
let teamBCount = 0;

//chunk的範圍
let minChunkX = -1000, minChunkY = -1000, maxChunkX = 1000, maxChunkY = 1000;
//chunk的資訊
let cWidth, cHeight, cPixSize, cGap, cTeamAColor, cTeamBColor, cDeadColor;
//算小地圖用
let lastChunkX = 0, lastChunkY = 0;

//在的隊伍
let teamID = 1;

//計算需要載入的chunk
let lastChunkStartX = 0, lastChunkStartY = 0
    , lastChunkCountX = 0, lastChunkCountY = 0;
let nowChunkStartX, nowChunkStartY,
    nowChunkCountX, nowChunkCountY;

let count = 0;

//世界時間顯示
let worldTimeText;

function startGame(cw, ch, deadPixelColor, teamAColor, teamBColor) {
    const playground = document.getElementById('playground');
    canvas = playground.getContext('2d');
    const gameWindow = document.getElementById('gamePage');

    const teamA = document.getElementById('teamA');
    const teamB = document.getElementById('teamB');

    cPixSize = 5;
    cGap = 1;
    cWidth = cw;
    cHeight = ch;
    cTeamAColor = teamAColor;
    cTeamBColor = teamBColor;
    cDeadColor = deadPixelColor;

    gameWindow.style.backgroundColor = cDeadColor;
    teamA.style.backgroundColor = cTeamAColor;
    teamB.style.backgroundColor = cTeamBColor;

    function drawAllChunks() {
        const pixSize = ((cPixSize * screenScale + cGap) * 10 | 0) / 10;
        const adjustX = mapX < 0;
        const adjustY = mapY < 0;

        nowChunkCountX = (canvas.canvas.width / (pixSize * cWidth) | 0) + 0;
        nowChunkCountY = (canvas.canvas.height / (pixSize * cHeight) | 0) + 0;

        //計算chunk開始位置X
        nowChunkStartX = ((-mapX / pixSize / cWidth | 0) - 0 + adjustX);
        //計算chunk開始位置Y
        nowChunkStartY = ((-mapY / pixSize / cHeight | 0) - 0 + adjustY);
        lastChunkX = nowChunkStartX + nowChunkCountX / 2;
        lastChunkY = nowChunkStartY + nowChunkCountY / 2;

        let loadList = '';

        for (let x = 0; x < nowChunkCountX; x++) {
            //計算chunk位置X
            let cx = nowChunkStartX + x | 0;
            for (let y = 0; y < nowChunkCountY; y++) {
                //計算chunk位置Y
                let cy = nowChunkStartY + y | 0;

                if (chunks[cx + ',' + cy] !== undefined)
                    chunks[cx + ',' + cy].drawChunk(canvas);

                if (lastChunkStartX !== nowChunkStartX || lastChunkStartY !== nowChunkStartY ||
                    lastChunkCountX !== nowChunkCountX || lastChunkCountY !== nowChunkCountY) {
                    if (cy < lastChunkStartY || cy > lastChunkStartY + lastChunkCountY - 1 ||
                        cx < lastChunkStartX || cx > lastChunkStartX + lastChunkCountX - 1) {
                        loadList += cx + ',' + cy + ";"
                    }
                }

                // //debug用
                // canvas.beginPath();
                // canvas.lineWidth = "2";
                // canvas.strokeStyle = "blue";
                // canvas.rect(
                //     cx * pixSize * cWidth, cy * pixSize * cHeight,
                //     pixSize * cWidth,
                //     pixSize * cHeight);
                // canvas.stroke();
                //
                // canvas.font = '12px';
                // canvas.fillStyle = "red";
                // canvas.fillText(cx + ',' + cy,
                //     cx * pixSize * cWidth, cy * pixSize * cHeight + 10);
            }
        }

        //取得chunk更新
        let zoomChange;
        if (lastChunkStartX !== nowChunkStartX || lastChunkStartY !== nowChunkStartY ||
            (zoomChange = (lastChunkCountX !== nowChunkCountX || lastChunkCountY !== nowChunkCountY))) {
            let updateArea;
            if (zoomChange) {
                updateArea = [Math.min(nowChunkStartX, lastChunkStartX), Math.min(nowChunkStartY, lastChunkStartY),
                    Math.max(nowChunkCountX, lastChunkCountX), Math.max(nowChunkCountY, lastChunkCountY)]
            }//沒有縮放
            else {
                updateArea = [nowChunkStartX, nowChunkStartY,
                    Math.max(nowChunkCountX, lastChunkCountX), Math.max(nowChunkCountY, lastChunkCountY)]
            }
            requestChunk(loadList.slice(0, -1), updateArea);
        }

        //劃格線
        if (screenScale > drawLineScreenScale) {
            canvas.lineWidth = cGap;
            canvas.strokeStyle = strokeStyle;
            canvas.beginPath();
            const lStartX = nowChunkStartX * pixSize * cWidth;
            const lStartY = nowChunkStartY * pixSize * cHeight;
            const viewWidth = lStartX + nowChunkCountX * pixSize * cWidth;
            const viewHeight = lStartY + nowChunkCountY * pixSize * cHeight;
            for (let y = 0; y < nowChunkCountY * cHeight; y++) {
                canvas.moveTo(lStartX, lStartY + y * pixSize);
                canvas.lineTo(viewWidth, lStartY + y * pixSize);
            }

            for (let x = 0; x < nowChunkCountX * cWidth; x++) {
                canvas.moveTo(lStartX + x * pixSize, lStartY);
                canvas.lineTo(lStartX + x * pixSize, viewHeight);
            }
            canvas.stroke();
        }

        //更新
        lastChunkStartX = nowChunkStartX;
        lastChunkStartY = nowChunkStartY;
        lastChunkCountX = nowChunkCountX;
        lastChunkCountY = nowChunkCountY;
    }

    //計算所有chunk
    function calculateAllChunks() {
        let timer = window.performance.now();
        //calculate all chunk
        for (const i in chunks) {
            count += chunks[i].calculateChunk();
            //TODO this is for debug
            count++;
        }
        calculateChangeLaterChunk();
        calculateTeam();
        updateMiniMap();

        calculateTime.innerText = '每禎計算時間: ' + (window.performance.now() - timer) + 'ms';
        calculateCount.innerText = 'for迴圈次數: ' + count;
        timeCount.innerText = '' + ++time;
        count = 0;
    }

    //計算兩隊佔有量
    function calculateTeam() {
        const all = (100 / (teamACount + teamBCount));
        const teamAPer = all * teamACount;
        const teamBPer = all * teamBCount;
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
    const calculateCount = document.getElementById('calculateCount');
    const calculateTime = document.getElementById('calculateTime');
    const locationView = document.getElementById('location');
    worldTimeText = document.getElementById('count');
    //模擬
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

    //範例
    let lastExamplePlaceX = 0, lastExamplePlaceY = 0;

    function drawExample(x, y, need, failed) {
        const objectWidth = model[0][0];
        const objectHeight = model[0][1];

        const pixSize = (cPixSize * screenScale + cGap) | 0;
        let startX = ((x - mapX - pixSize / 2) / pixSize | 0) * pixSize;
        let startY = ((y - mapY - pixSize / 2) / pixSize | 0) * pixSize;
        //置中
        startX -= pixSize * (objectWidth / 2 | 0);
        startY -= pixSize * (objectHeight / 2 | 0);

        //負的地方需要更改
        if ((x - mapX) < pixSize / 2)
            startX -= pixSize;
        if ((y - mapY) < pixSize / 2)
            startY -= pixSize;

        //刷新螢幕
        if (startX !== lastExamplePlaceX || startY !== lastExamplePlaceY || need) {
            refreshScreen();
            lastExamplePlaceX = startX;
            lastExamplePlaceY = startY;
        } else {
            return;
        }

        if (failed)
            canvas.fillStyle = placeErrorColor;
        else if (teamID === teamAID)
            canvas.fillStyle = this.alivePixelA;
        else if (teamID === teamBID)
            canvas.fillStyle = this.alivePixelB;


        //畫範例
        for (let y = 0; y < objectHeight; y++) {
            startY += pixSize;
            let cache = startX;
            for (let x = 0; x < objectWidth; x++) {
                startX += pixSize;
                if (model[y + 1][x] === 0)
                    continue;

                canvas.fillRect(startX, startY, pixSize, pixSize);
            }
            startX = cache;
        }
    }

    function placeExample(x, y) {
        const modelWidth = model[0][0];
        const modelHeight = model[0][1];

        const pixSize = (cPixSize * screenScale + cGap) | 0;
        let startX = ((x - mapX - pixSize / 2) / pixSize | 0) * pixSize;
        let startY = ((y - mapY - pixSize / 2) / pixSize | 0) * pixSize;
        // //置中
        startX -= pixSize * (modelWidth / 2 | 0);
        startY -= pixSize * (modelHeight / 2 | 0);

        //負的地方需要更改
        if ((x - mapX) < pixSize / 2)
            startX -= pixSize;
        if ((y - mapY) < pixSize / 2)
            startY -= pixSize;

        let needChangeChunk = {};
        for (let y = 0; y < modelHeight; y++) {
            startY += pixSize;
            let cache = startX;
            for (let x = 0; x < modelWidth; x++) {
                startX += pixSize;

                let cx = (startX + 0.1) / pixSize / cWidth | 0;
                let cy = (startY + 0.1) / pixSize / cWidth | 0;
                if (startX < 0)
                    cx--;
                if (startY < 0)
                    cy--;

                let xInC = startX / pixSize - (cx * cWidth) | 0;
                let yInC = startY / pixSize - (cy * cHeight) | 0;

                //看看這附近有沒有東西
                if (chunks[cx + ',' + cy] !== undefined)
                    //有東西
                    if (chunks[cx + ',' + cy].cellData[xInC][yInC] > 0) {
                        drawExample(lastModelPosX, lastModelPosY, true, true);
                        return false;
                    }
                let thisChunk = needChangeChunk[cx + ',' + cy]
                if (!thisChunk)
                    thisChunk = needChangeChunk[cx + ',' + cy] = [];


                if (model[y + 1][x] !== 0)
                    thisChunk.push([xInC, yInC])
            }
            startX = cache;
        }

        for (const i in needChangeChunk) {
            let chunk = chunks[i];
            const j = i.split(',')
            //沒load的話
            if (chunk === undefined)
                chunk = loadChunk(parseInt(j[0]), parseInt(j[1]));
            chunk.addCells(needChangeChunk[i], canvas, teamID)
        }
        calculateChangeLaterChunk();
        return true;
    }

    let lastModelPosX = 0, lastModelPosY = 0;
    window.onkeydown = (event) => {
        if (selectModel) {
            if (event.key === 'r') {
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
                drawExample(lastModelPosX, lastModelPosY, true);
            }
        }
    }

    window.onkeyup = (event) => {
        // if (selectModel) {
        //     if (event.key === 'Shift') {
        //         refreshScreen();
        //         selectModel = false;
        //     }
        // }
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
                if (!event.shiftKey && donePlace)
                    selectModel = false;
                calculateTeam();
            }
            //一般的點選
            else {
                const pixSize = ((cPixSize * screenScale + cGap) * 10 | 0) / 10;
                let x = (event.offsetX - mapX) / pixSize;
                let y = (event.offsetY - mapY) / pixSize;
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

                //chunk裡的x,y
                let xInC = x - (cx * cWidth) | 0;
                let yInC = y - (cy * cHeight) | 0;
                if (chunk.chunkMap[xInC][yInC] > 0 && chunk.chunkMap[xInC][yInC] !== teamID) {
                    canvas.fillStyle = placeErrorColor;
                    let chunkStartX = cx * pixSize * cWidth;
                    let chunkStartY = cy * pixSize * cHeight;
                    canvas.fillRect(chunkStartX + xInC * pixSize, chunkStartY + yInC * pixSize, pixSize, pixSize);
                } else {
                    chunk.addCells([[xInC, yInC]], canvas, teamID);
                    calculateChangeLaterChunk();
                    calculateTeam();
                }
                // chunk.drawChangeCells(canvas);
            }
        }
        //還在選取狀態
        else if (selectModel) {
            drawExample(event.offsetX, event.offsetY, true);
        }
        updateMiniMap(true);
        drag = false;
    }

    //移動
    playground.onmousemove = (event) => {
        //畫範例
        if (selectModel) {
            lastModelPosX = event.offsetX;
            lastModelPosY = event.offsetY;
            drawExample(event.offsetX, event.offsetY);
        }

        if (event.shiftKey)
            return
        //移動
        if (drag) {
            let moveToX = event.offsetX - moveX;
            let moveToY = event.offsetY - moveY;
            move(moveToX, moveToY);
        }
    }

    playground.onmouseleave = (event) => {
        drag = false;
    }


    //縮放
    playground.onwheel = (event) => {
        const lastScreenScale = screenScale;

        let delta = 0.2;
        if (event.deltaY > 0)
            delta *= -1;

        screenScale = Math.round((screenScale + delta) * 10) / 10;

        // screenScale = (screenScale * 10 | 0) / 10;
        if (screenScale < screenMinScale) {
            screenScale = screenMinScale;
        }

        if (lastScreenScale === screenScale)
            return

        let pixSize = ((cPixSize * lastScreenScale + cGap) * 10 | 0) / 10;
        let xLast = (event.offsetX - mapX) / pixSize;
        let yLast = (event.offsetY - mapY) / pixSize;
        pixSize = ((cPixSize * screenScale + cGap) * 10 | 0) / 10;
        let xNow = (event.offsetX - mapX) / pixSize;
        let yNow = (event.offsetY - mapY) / pixSize;

        move((xNow - xLast) * pixSize, (yNow - yLast) * pixSize);
    }

    //視窗重設
    function resizeScreen() {
        // console.log('refreshScreen')
        if (canvas.canvas.width !== gameWindow.offsetWidth || canvas.canvas.height !== gameWindow.offsetHeight) {
            canvas.canvas.width = gameWindow.offsetWidth;
            canvas.canvas.height = gameWindow.offsetHeight;
            canvas.translate(mapX, mapY);
        }
        clear();
        window.requestAnimationFrame(drawAllChunks);
    }

    function refreshScreen() {
        clear();
        window.requestAnimationFrame(drawAllChunks);
        // window.requestAnimationFrame(debug);
    }

    function move(moveToX, moveToY) {
        mapX += moveToX | 0;
        mapY += moveToY | 0;
        moveX += moveToX | 0;
        moveY += moveToY | 0;
        canvas.setTransform(1, 0, 0, 1, mapX, mapY);

        const pixSize = ((cPixSize * screenScale + cGap) * 10 | 0) / 10;
        locationView.innerText = '座標: ' + -(mapX / pixSize | 0) + ',' + (mapY / pixSize | 0);
        refreshScreen();
    }

    function moveTo(x, y) {
        let moveToX = x - mapX;
        let moveToY = y - mapY;
        move(moveToX, moveToY);
    }

    function clear() {
        canvas.fillStyle = cDeadColor;
        canvas.fillRect(-canvas.canvas.width - mapX, -canvas.canvas.height - mapY, canvas.canvas.width * 2, canvas.canvas.height * 2);
    }

    //setup
    resizeScreen();
    calculateTeam();
    loadExample();
    loadMiniMap({
        deadPixel: cDeadColor,
        alivePixelA: cTeamAColor,
        alivePixelB: cTeamBColor,
        chunkWidth: cWidth,
        chunkHeight: cHeight,
        pixelSize: cPixSize,
        gap: cGap
    });

    function debug() {
        for (const i in chunks) {
            const chunk = chunks[i];
            const pixSize = ((cPixSize * screenScale + cGap) * 10 | 0) / 10;

            let chunkStartX = chunk.locX * pixSize * cWidth;
            let chunkStartY = chunk.locY * pixSize * cHeight;
            for (let i = 0; i < chunk.alivePixelList.length; i++) {
                const x = chunk.alivePixelList[i][0];
                const y = chunk.alivePixelList[i][1];
                let col = (chunk.cellData[x][y] + 1) / 7 * 255;
                canvas.fillStyle = `rgb(0,${col},0)`;
                canvas.fillRect(chunkStartX + pixSize * x + cPixSize * screenScale / 4,
                    chunkStartY + pixSize * y + cPixSize * screenScale / 4,
                    cPixSize * screenScale / 2, cPixSize * screenScale / 2);
            }
            canvas.fillStyle = chunk.deadPixel;

            //debug用
            canvas.beginPath();
            canvas.lineWidth = "2";
            canvas.strokeStyle = "blue";
            canvas.rect(
                chunkStartX, chunkStartY,
                pixSize * cWidth,
                pixSize * cHeight);
            canvas.stroke();

            canvas.font = '12px white';
            canvas.fillStyle = "red";
            canvas.fillText(chunk.locX + ',' + chunk.locY,
                chunkStartX,
                chunkStartY + 10);

            // canvas.font = '10px';
            // canvas.fillStyle = "red";
            // // console.log(chunkStartX, chunkStartY)
            // for (let y = 0; y < cHeight; y++) {
            //     for (let x = 0; x < cWidth; x++) {
            //         canvas.fillText(chunk.cellData[x][y], chunkStartX + x * pixSize + cPixSize * screenScale / 2,
            //             chunkStartY + y * pixSize + cPixSize * screenScale / 2);
            //     }
            // }
        }
    }
}

function updateWorldTime(time) {
    worldTime = time;
    worldTimeText.innerText = '世界時間: ' + worldTime;
}

const loadChunk = (x, y) => {
    const chunk = new Chunk(x, y, cWidth, cHeight, cPixSize, cGap, cTeamAColor, cTeamBColor, cDeadColor);
    chunks[x + ',' + y] = chunk;
    chunk.drawChunk(canvas);
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
}