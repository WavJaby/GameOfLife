let chunks = {};
let needChangeChunk = [];
let canvas;
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

//chunk的範圍
let minChunkX = -1000, minChunkY = -1000, maxChunkX = 1000, maxChunkY = 1000;
//算小地圖用
let lastChunkX = 0, lastChunkY = 0;

//在的隊伍
let teamID = 2;

//chunk的資訊
let cWidth, cHeight, cPixSize, cGap;

let realPixelSize;

let count = 0;

window.onload = function () {
    const playground = document.getElementById('playground');
    canvas = playground.getContext('2d');
    const gameWindow = document.getElementById('gamePage');

    const teamA = document.getElementById('teamA');
    const teamB = document.getElementById('teamB');

    const drawPixGap = 2;
    const drawPixSize = 10;
    cGap = 0;
    cPixSize = drawPixSize;
    realPixelSize = ((cPixSize * screenScale) * 10 | 0) / 10;
    //setup 數值
    const homeChunk = new Chunk(0, 0);
    cWidth = homeChunk.chunkWidth;
    cHeight = homeChunk.chunkHeight;

    chunks['0,0'] = homeChunk;

    gameWindow.style.backgroundColor = homeChunk.deadPixel;
    teamA.style.backgroundColor = homeChunk.alivePixelA;
    teamB.style.backgroundColor = homeChunk.alivePixelB;

    if (0) {
        homeChunk.addCells([
		[12,2],[13,2],[14,2],[11,3],[14,3],[15,3],[10,4],[14,4],[10,5],[15,5],[12,6],[0,7],[1,7],[2,7],[3,7],[9,7],[11,7],[0,8],
		[4,8],[5,8],[7,8],[9,8],[10,8],[11,8],[13,8],[14,8],[0,9],[6,9],[7,9],[13,9],[1,10],[4,10],[5,10],[7,10],[10,10],[13,10],
		[15,10],[7,11],[9,11],[11,11],[13,11],[15,11],[1,12],[4,12],[5,12],[7,12],[10,12],[13,12],[0,13],[6,13],[7,13],[11,13],
		[13,13],[15,13],[0,14],[4,14],[5,14],[7,14],[9,14],[10,14],[13,14],[0,15],[1,15],[2,15],[3,15],[9,15],[11,15],[13,15],[15,15]
	], canvas, 2);
        if (chunks['1,0'] === undefined)
            chunks['1,0'] = loadChunk(1, 0)
        chunks['1,0'].addCells([
		[2,0],[1,1],[2,1],[3,1],[3,2],[4,2],[0,3],[3,3],[5,3],[6,3],[0,4],[3,4],[5,4],[1,5],[3,5],[5,5],[7,5],[8,5],[1,6],[3,6],[7,6],
		[8,6],[0,7],[4,7],[6,7],[7,7],[8,7],[8,8],[9,8],[0,10],[1,11],[7,11],[8,11],[9,11],[10,11],[0,12],[1,12],[3,12],[5,12],[6,12],
		[10,12],[3,13],[4,13],[10,13],[0,14],[3,14],[5,14],[6,14],[9,14],[1,15],[3,15]
	], canvas, 1);

        if (chunks['0,1'] === undefined)
            chunks['0,1'] = loadChunk(0, 1)
        chunks['0,1'].addCells([
		[10,0],[11,0],[13,0],[13,1],[1,2],[2,2],[12,2],[13,2],[15,2],[2,3],[3,3],[4,3],[6,3],[10,3],[15,3],[2,4],[3,4],[7,4],[9,4],
		[14,4],[2,5],[3,5],[5,5],[7,5],[9,5],[11,5],[5,6],[7,6],[10,6],[12,6],[4,7],[5,7],[7,7],[10,7],[11,7],[12,7],[15,7],[6,8],
		[7,8],[12,8],[13,8],[14,8],[7,9],[8,9],[9,9],[8,10]], canvas, 2);

        if (chunks['1,1'] === undefined)
            chunks['1,1'] = loadChunk(1, 1)
        chunks['1,1'].addCells([
            [0, 0],[3, 0],[5, 0],[6, 0],[9, 0],[3, 1],[4, 1],[10, 1],[0, 2],[1, 2],[3, 2],[5, 2],[6, 2],[10, 2],[1, 3],[7, 3],[8, 3],[9, 3],
            [10, 3],[0, 5],[0, 6]
        ], canvas, 1);
        calculateChangeLaterChunk();
    }

    function drawAllChunks() {
        const adjustX = mapX < 0;
        const adjustY = mapY < 0;

        //計算畫面中有幾個chunk
        const xChunkCount = (canvas.canvas.width / (realPixelSize * cWidth) | 0) + 2;
        const yChunkCount = (canvas.canvas.height / (realPixelSize * cHeight) | 0) + 2;

        //計算chunk開始位置X
        const startX = ((-mapX / realPixelSize / cWidth | 0) - 1 + adjustX);
        //計算chunk開始位置Y
        const startY = ((-mapY / realPixelSize / cHeight | 0) - 1 + adjustY);
        lastChunkX = startX + xChunkCount / 2;
        lastChunkY = startY + yChunkCount / 2;

        for (let x = 0; x < xChunkCount; x++) {
            //計算chunk位置X
            let cx = startX + x | 0;
            for (let y = 0; y < yChunkCount; y++) {
                //計算chunk位置Y
                let cy = startY + y | 0;

                if (chunks[cx + ',' + cy] !== undefined)
                    chunks[cx + ',' + cy].drawChunk(canvas);
            }
        }

        if (screenScale > drawLineScreenScale) {
			canvas.lineWidth = cGap;
			canvas.strokeStyle = strokeStyle;
			canvas.beginPath();
            const lStartX = startX * realPixelSize * cWidth;
            const lStartY = startY * realPixelSize * cHeight;
            const viewWidth = lStartX + xChunkCount * realPixelSize * cWidth;
            const viewHeight = lStartY + yChunkCount * realPixelSize * cHeight;
            for (let y = 0; y < yChunkCount * cHeight; y++) {
                canvas.moveTo(lStartX, lStartY + y * realPixelSize);
                canvas.lineTo(viewWidth, lStartY + y * realPixelSize);
            }

            for (let x = 0; x < xChunkCount * cWidth; x++) {
                canvas.moveTo(lStartX + x * realPixelSize, lStartY);
                canvas.lineTo(lStartX + x * realPixelSize, viewHeight);
            }
			canvas.stroke();
        }
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

        //更新畫面
        const adjustX = mapX < 0;
        const adjustY = mapY < 0;
        //計算畫面中有幾個chunk
        const xChunkCount = (canvas.canvas.width / (realPixelSize * cWidth) | 0) + 2;
        const yChunkCount = (canvas.canvas.height / (realPixelSize * cHeight) | 0) + 2;
        //計算chunk開始位置X
        const startX = ((-mapX / realPixelSize / cWidth | 0) - 1 + adjustX);
        //計算chunk開始位置Y
        const startY = ((-mapY / realPixelSize / cHeight | 0) - 1 + adjustY);

        for (const i in chunks) {
            //標記成沒算過
            chunks[i].beforeChange = null;
            const thisChunk = chunks[i];
            if (thisChunk.locX >= startX && thisChunk.locX < startX + xChunkCount &&
                thisChunk.locY >= startY && thisChunk.locY < startY + yChunkCount)
                thisChunk.drawChangeCells(canvas);
        }

        calculateTeam();
        updateMiniMap();

        calculateTime.innerText = '每幀計算時間: ' + (window.performance.now() - timer) + 'ms';
        calculateCount.innerText = 'for迴圈次數: ' + count;
        timeCount.innerText = '' + ++worldTime;
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
        // debug();
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
        else if (teamID === homeChunk.teamAID)
            canvas.fillStyle = homeChunk.alivePixelA;
        else if (teamID === homeChunk.teamBID)
            canvas.fillStyle = homeChunk.alivePixelB;

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

                let cx = (startX + 0.05) / realPixelSize / cWidth | 0;
                let cy = (startY + 0.05) / realPixelSize / cWidth | 0;
                if (startX < 0)
                    cx--;
                if (startY < 0)
                    cy--;

                //在chunk中的位置
                let xInC = startX / realPixelSize - (cx * cWidth) | 0;
                let yInC = startY / realPixelSize - (cy * cHeight) | 0;

                if (lastCx !== cx || lastCy !== cy) {
                    chunk = chunks[cx + ',' + cy];
                    lastCx = cx;
                    lastCy = cy;
                }

                if (clear) {
                    if (chunk === undefined) {
                        canvas.fillStyle = homeChunk.deadPixel;
                    }
                    //chunk有在
                    else {
                        let teamID = chunk.chunkMap[xInC][yInC];
                        if (teamID === homeChunk.teamAID)
                            canvas.fillStyle = homeChunk.alivePixelA;
                        else if (teamID === homeChunk.teamBID)
                            canvas.fillStyle = homeChunk.alivePixelB;
                        else
                            canvas.fillStyle = homeChunk.deadPixel;
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
                    let thisChunk = needChangeChunk[cx + ',' + cy]
                    if (!thisChunk)
                        thisChunk = needChangeChunk[cx + ',' + cy] = [];
                    thisChunk.push([xInC, yInC])
                }
            }
            startX = cache;
        }
		
        if (!clear) {
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
		
		startXsav += realPixelSize;
		startYsav += realPixelSize;
		
		if (screenScale > drawLineScreenScale) {
			canvas.lineWidth = cGap;
			canvas.strokeStyle = strokeStyle;
			canvas.beginPath();
            const viewWidth = startXsav + modelWidth * realPixelSize;
            const viewHeight = startYsav + modelHeight * realPixelSize;
            for (let y = 0; y < modelHeight+1; y++) {
				let ly = startYsav + y * realPixelSize;
                canvas.moveTo(startXsav, ly);
                canvas.lineTo(viewWidth, ly);
            }

            for (let x = 0; x < modelWidth+1; x++) {
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
                let cx = x / cWidth | 0;
                let cy = y / cHeight | 0;
                if (x < 0)
                    cx--;
                if (y < 0)
                    cy--;

                // console.log(cx, cy, x, y)

                let chunk = chunks[cx + ',' + cy];
                //沒load的話
                if (chunk === undefined)
                    chunk = loadChunk(cx, cy);

                //chunk裡的x,y
                let xInC = x - (cx * cWidth) | 0;
                let yInC = y - (cy * cHeight) | 0;
                if (chunk.chunkMap[xInC][yInC] > 0 && chunk.chunkMap[xInC][yInC] !== teamID) {
                    canvas.fillStyle = placeErrorColor;
                    let chunkStartX = cx * realPixelSize * cWidth;
                    let chunkStartY = cy * realPixelSize * cHeight;
                    canvas.fillRect(chunkStartX + xInC * realPixelSize, chunkStartY + yInC * realPixelSize, realPixelSize, realPixelSize);
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

    let delta = 0.1;
    //縮放
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
        realPixelSize = ((cPixSize * lastScreenScale) * 10 | 0) / 10;
        let xLast = (event.offsetX - mapX) / realPixelSize;
        let yLast = (event.offsetY - mapY) / realPixelSize;

        //如果需要畫線，更改cell之間的寬
        if (screenScale > drawLineScreenScale) {
            cGap = drawPixGap;
            cPixSize = drawPixSize;
            delta = 0.4;
        } else {
            cGap = 0;
            delta = 0.1;
        }

        // 計算沒放大後位置
        realPixelSize = ((cPixSize * screenScale) * 10 | 0) / 10;
        let xNow = (event.offsetX - mapX) / realPixelSize;
        let yNow = (event.offsetY - mapY) / realPixelSize;

        move((xNow - xLast) * realPixelSize, (yNow - yLast) * realPixelSize);

        if (selectModel) {
            window.requestAnimationFrame(() => drawExample(event.offsetX, event.offsetY, true));
        }
    }

    //視窗重設
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

    function move(moveToX, moveToY) {
        mapX += moveToX | 0;
        mapY += moveToY | 0;
        moveX += moveToX | 0;
        moveY += moveToY | 0;
        canvas.setTransform(1, 0, 0, 1, mapX, mapY);

        locationView.innerText = '座標: ' + -(mapX / realPixelSize | 0) + ',' + (mapY / realPixelSize | 0);
        refreshScreen();
    }

    this.moveTo = (x, y) => {
        let moveToX = -x * realPixelSize - mapX;
        let moveToY = y * realPixelSize - mapY;
        move(moveToX, moveToY);
    }

    function clear() {
        canvas.fillStyle = homeChunk.deadPixel;
        canvas.fillRect(-canvas.canvas.width - mapX, -canvas.canvas.height - mapY, canvas.canvas.width * 2, canvas.canvas.height * 2);
    }

    //setup
    resizeScreen();
    calculateTeam();
    loadExample();
    loadMiniMap(homeChunk);

    function debug() {
        for (const i in chunks) {
            const chunk = chunks[i];

            let chunkStartX = chunk.locX * realPixelSize * cWidth;
            let chunkStartY = chunk.locY * realPixelSize * cHeight;
            for (let i = 0; i < chunk.alivePixelList.length; i++) {
                const x = chunk.alivePixelList[i][0];
                const y = chunk.alivePixelList[i][1];
                let col = (chunk.cellData[x][y] + 1) / 7 * 255;
                canvas.fillStyle = `rgb(0,${col},0)`;
                canvas.fillRect(chunkStartX + realPixelSize * x + cPixSize * screenScale / 4,
                    chunkStartY + realPixelSize * y + cPixSize * screenScale / 4,
                    cPixSize * screenScale / 2, cPixSize * screenScale / 2);
            }
            // canvas.fillStyle = chunk.deadPixel;

            // debug用
            canvas.beginPath();
            canvas.lineWidth = '2';
            canvas.strokeStyle = 'blue';
            canvas.rect(
                chunkStartX, chunkStartY,
                realPixelSize * cWidth,
                realPixelSize * cHeight);
            canvas.stroke();

            canvas.font = '12px white';
            canvas.fillStyle = 'red';
            canvas.fillText(chunk.locX + ',' + chunk.locY,
                chunkStartX,
                chunkStartY + 10);

            canvas.font = '10px';
            canvas.fillStyle = 'red';
            // console.log(chunkStartX, chunkStartY)
            for (let y = 0; y < cHeight; y++) {
                for (let x = 0; x < cWidth; x++) {
                    canvas.fillText(chunk.cellData[x][y], chunkStartX + x * realPixelSize + cPixSize * screenScale / 2,
                        chunkStartY + y * realPixelSize + cPixSize * screenScale / 2);
                }
            }
        }
    }
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
    // chunk.drawChunk(canvas);
    // console.log('load chunk: ' + x + ',' + y)
    return chunk;
}

const unloadChunk = (x, y) => {
    if (chunks[x + ',' + y] !== undefined)
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
