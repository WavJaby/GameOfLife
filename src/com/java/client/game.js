let chunks = {};
let needChangeChunk = [];
let canvas;
//螢幕設定
let screenScale = 1;
let screenMinScale = 0.1;
let drawLineScreenScale = 1;
let strokeStyle = 'rgb(54, 54, 54)';
let placeErrorColor = 'rgb(255, 0, 0)';

//遊戲時間
let worldTime = 0;

//chunk的範圍
let minChunkX = -1000, minChunkY = -1000, maxChunkX = 1000, maxChunkY = 1000;
//chunk的資訊
let cWidth, cHeight, cPixSize, cGap, cTeamAColor, cTeamBColor, cDeadColor;
let realPixelSize;
const teamAID = 1;
const teamBID = 2;

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

class Game{
    //兩隊的數量
    teamACount = 0;
    teamBCount = 0;
    constructor(cw, ch, deadPixelColor, teamAColor, teamBColor) {
        const playground = document.getElementById('playground');
        canvas = playground.getContext('2d');
        const gameWindow = document.getElementById('gamePage');

        this.teamA = document.getElementById('teamA');
        this.teamB = document.getElementById('teamB');

        cPixSize = 5;
        cWidth = cw;
        cHeight = ch;
        cTeamAColor = teamAColor;
        cTeamBColor = teamBColor;
        cDeadColor = deadPixelColor;
        const drawPixGap = 2;
        const drawPixSize = 10;
        cGap = 0;
        cPixSize = drawPixSize;
        realPixelSize = ((cPixSize * screenScale + cGap) * 10 | 0) / 10;

        gameWindow.style.backgroundColor = cDeadColor;
        this.teamA.style.backgroundColor = cTeamAColor;
        this.teamB.style.backgroundColor = cTeamBColor;

        function drawAllChunks() {
            const adjustX = mapX < 0;
            const adjustY = mapY < 0;

            nowChunkCountX = (canvas.canvas.width / (realPixelSize * cWidth) | 0) + 0;
            nowChunkCountY = (canvas.canvas.height / (realPixelSize * cHeight) | 0) + 0;

            //計算chunk開始位置X
            nowChunkStartX = ((-mapX / realPixelSize / cWidth | 0) - 0 + adjustX);
            //計算chunk開始位置Y
            nowChunkStartY = ((-mapY / realPixelSize / cHeight | 0) - 0 + adjustY);
            lastChunkX = nowChunkStartX + nowChunkCountX / 2;
            lastChunkY = nowChunkStartY + nowChunkCountY / 2;

            let loadList = '';
            for (let x = 0; x < nowChunkCountX; x++) {
                //計算chunk位置X
                let cx = nowChunkStartX + x | 0;
                for (let y = 0; y < nowChunkCountY; y++) {
                    //計算chunk位置Y
                    let cy = nowChunkStartY + y | 0;

                    let chunk = chunks[cx + ',' + cy];
                    if (chunk !== undefined) {
                        chunk.drawChunk(canvas);
                    }

                    if (lastChunkStartX !== nowChunkStartX || lastChunkStartY !== nowChunkStartY ||
                        lastChunkCountX !== nowChunkCountX || lastChunkCountY !== nowChunkCountY) {
                        if (cy < lastChunkStartY || cy > lastChunkStartY + lastChunkCountY - 1 ||
                            cx < lastChunkStartX || cx > lastChunkStartX + lastChunkCountX - 1) {
                            // 沒有這個chunk或時間沒更新
                            if (chunk === undefined || chunk.chunkTime < worldTime) {
                                loadList += cx + ',' + cy + ';';
                            }
                        }
                    }

                    // if (chunk !== undefined) {
                    //     //debug用
                    //     canvas.beginPath();
                    //     canvas.lineWidth = '2';
                    //     canvas.strokeStyle = 'blue';
                    //     canvas.rect(
                    //         cx * realPixelSize * cWidth, cy * realPixelSize * cHeight,
                    //         realPixelSize * cWidth,
                    //         realPixelSize * cHeight);
                    //     canvas.stroke();
                    //
                    //     canvas.font = '12px';
                    //     canvas.fillStyle = 'red';
                    //     canvas.fillText(cx + ',' + cy,
                    //         cx * realPixelSize * cWidth, cy * realPixelSize * cHeight + 10);
                    // }
                }
            }

            // if (loadList.length > 0) {

            if (lastChunkStartX !== nowChunkStartX || lastChunkStartY !== nowChunkStartY ||
                lastChunkCountX !== nowChunkCountX || lastChunkCountY !== nowChunkCountY) {
                // console.log(loadList)

                //如果有放大縮小取得最大範圍
                const zoomChange = lastChunkCountX !== nowChunkCountX || lastChunkCountY !== nowChunkCountY;
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
                // }
            }

            //劃格線
            if (screenScale > drawLineScreenScale) {
                canvas.lineWidth = cGap;
                canvas.strokeStyle = strokeStyle;
                canvas.beginPath();
                const lStartX = nowChunkStartX * realPixelSize * cWidth;
                const lStartY = nowChunkStartY * realPixelSize * cHeight;
                const viewWidth = lStartX + nowChunkCountX * realPixelSize * cWidth;
                const viewHeight = lStartY + nowChunkCountY * realPixelSize * cHeight;
                for (let y = 0; y < nowChunkCountY * cHeight; y++) {
                    canvas.moveTo(lStartX, lStartY + y * realPixelSize);
                    canvas.lineTo(viewWidth, lStartY + y * realPixelSize);
                }

                for (let x = 0; x < nowChunkCountX * cWidth; x++) {
                    canvas.moveTo(lStartX + x * realPixelSize, lStartY);
                    canvas.lineTo(lStartX + x * realPixelSize, viewHeight);
                }
                canvas.stroke();
            }

            //更新
            lastChunkStartX = nowChunkStartX;
            lastChunkStartY = nowChunkStartY;
            lastChunkCountX = nowChunkCountX;
            lastChunkCountY = nowChunkCountY;
        }


        //計時器
        let interval;
        //UI
        const pauseButton = document.getElementById('pause');
        const locationView = document.getElementById('location');
        worldTimeText = document.getElementById('count');
        //暫停
        pauseButton.onclick = () => {
        }

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
            else if (teamID === teamAID)
                canvas.fillStyle = cTeamAColor;
            else if (teamID === teamBID)
                canvas.fillStyle = cTeamBColor;

            //畫範例
            for (let y = 0; y < objectHeight; y++) {
                startY += realPixelSize;
                let cache = startX;
                for (let x = 0; x < objectWidth; x++) {
                    startX += realPixelSize;
                    if (model[y + 1][x] === 0)
                        continue;

                    canvas.fillRect(startX, startY, realPixelSize, realPixelSize);
                }
                startX = cache;
            }

            lastMousePosX = x;
            lastMousePosY = y;
        }

        function placeExample(x, y, clear) {
            const modelWidth = model[0][0];
            const modelHeight = model[0][1];

            let startX = ((x - mapX - realPixelSize / 2) / realPixelSize | 0) * realPixelSize;
            let startY = ((y - mapY - realPixelSize / 2) / realPixelSize | 0) * realPixelSize;
            // //置中
            startX -= realPixelSize * (modelWidth / 2 | 0);
            startY -= realPixelSize * (modelHeight / 2 | 0);

            //負的地方需要更改
            if ((x - mapX) < realPixelSize / 2)
                startX -= realPixelSize;
            if ((y - mapY) < realPixelSize / 2)
                startY -= realPixelSize;

            //節省chunk的取得
            let lastCx = null, lastCy = null;
            let chunk;

            let needChangeChunk = {};
            let needChangeChunkSend = {};
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

                    //再chunk中的位置
                    let xInC = startX / realPixelSize - (cx * cWidth) | 0;
                    let yInC = startY / realPixelSize - (cy * cHeight) | 0;

                    if (lastCx !== cx || lastCy !== cy) {
                        chunk = chunks[cx + ',' + cy];
                        lastCx = cx;
                        lastCy = cy;
                    }

                    if (clear) {
                        if (chunk === undefined) {
                            canvas.fillStyle = cDeadColor;
                        }
                        //chunk有在
                        else {
                            let teamID = chunk.chunkMap[xInC][yInC];
                            if (teamID === teamAID)
                                canvas.fillStyle = cTeamAColor;
                            else if (teamID === teamBID)
                                canvas.fillStyle = cTeamBColor;
                            else
                                canvas.fillStyle = cDeadColor;
                        }
                        canvas.fillRect(startX, startY, realPixelSize, realPixelSize);

                    } else {
                        //放置
                        //看看這附近有沒有東西
                        if (chunk !== undefined)
                            //有東西
                            if (chunk.chunkMap[xInC][yInC] > 0) {
                                drawExample(lastMousePosX, lastMousePosY, true, true);
                                return false;
                            }

                        //加入替換清單
                        let thisChunk = needChangeChunk[cx + ',' + cy];
                        let thisChunkSend = needChangeChunkSend[cx + ',' + cy];
                        if (!thisChunk) {
                            thisChunk = needChangeChunk[cx + ',' + cy] = [];
                            thisChunkSend = needChangeChunkSend[cx + ',' + cy] = [];
                        }
                        thisChunkSend.push(yInC * cWidth + xInC);
                        thisChunk.push([xInC, yInC])
                    }
                }
                startX = cache;
            }

            if (!clear) {
                // for (const i in needChangeChunk) {
                //     let chunk = chunks[i];
                //     //沒load的話
                //     if (chunk === undefined)
                //         chunk = loadChunk(i);
                //     chunk.updateCells(needChangeChunk[i], canvas, teamID);
                // }
                placeCells(needChangeChunkSend);
                return true;
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
                    // selectModel = false;
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
                // if (selectModel) {
                //     const donePlace = placeExample(event.offsetX, event.offsetY);
                //     //沒有按住shift且放置成功
                //     if (!event.shiftKey && donePlace)
                //         selectModel = false;
                // }
                // //一般的點選
                // else {
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
                        chunk.updateCells([[xInC, yInC]], canvas, teamID);
                    }
                    // chunk.drawChangeCells(canvas);
                }
            // }
            //還在選取狀態
            // else if (selectModel) {
            //     drawExample(event.offsetX, event.offsetY, true);
            // }
            // updateMiniMap(true);
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
            // if (!drag && selectModel) {
            //     drawExample(event.offsetX, event.offsetY, false, false, true);
            // }
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
            realPixelSize = ((cPixSize * lastScreenScale + cGap) * 10 | 0) / 10;
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
            realPixelSize = ((cPixSize * screenScale + cGap) * 10 | 0) / 10;
            let xNow = (event.offsetX - mapX) / realPixelSize;
            let yNow = (event.offsetY - mapY) / realPixelSize;

            move((xNow - xLast) * realPixelSize, (yNow - yLast) * realPixelSize);

            // if (selectModel) {
            //     window.requestAnimationFrame(() => drawExample(event.offsetX, event.offsetY, true));
            // }
        }

        //視窗重設
        function resizeScreen() {
            if (canvas.canvas.width !== gameWindow.offsetWidth || canvas.canvas.height !== gameWindow.offsetHeight) {
                canvas.canvas.width = gameWindow.offsetWidth;
                canvas.canvas.height = gameWindow.offsetHeight;
                canvas.translate(mapX, mapY);
            }
            refreshScreen();
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
            canvas.fillStyle = cDeadColor;
            canvas.fillRect(-canvas.canvas.width - mapX, -canvas.canvas.height - mapY, canvas.canvas.width * 2, canvas.canvas.height * 2);
        }

        //setup
        resizeScreen();
        // loadExample();
        // loadMiniMap({
        //     deadPixel: cDeadColor,
        //     alivePixelA: cTeamAColor,
        //     alivePixelB: cTeamBColor,
        //     chunkWidth: cWidth,
        //     chunkHeight: cHeight,
        //     pixelSize: cPixSize,
        //     gap: cGap
        // });

        function debug() {
            for (const i in chunks) {
                const chunk = chunks[i];

                let chunkStartX = chunk.locX * realPixelSize * cWidth;
                let chunkStartY = chunk.locY * realPixelSize * cHeight;
                // for (let i = 0; i < chunk.alivePixelList.length; i++) {
                //     const x = chunk.alivePixelList[i][0];
                //     const y = chunk.alivePixelList[i][1];
                //     let col = (chunk.cellData[x][y] + 1) / 7 * 255;
                //     canvas.fillStyle = `rgb(0,${col},0)`;
                //     canvas.fillRect(chunkStartX + realPixelSize * x + cPixSize * screenScale / 4,
                //         chunkStartY + realPixelSize * y + cPixSize * screenScale / 4,
                //         cPixSize * screenScale / 2, cPixSize * screenScale / 2);
                // }
                // canvas.fillStyle = chunk.deadPixel;

                //debug用
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

                // canvas.font = '10px';
                // canvas.fillStyle = 'red';
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

    //計算兩隊佔有量
    calculateTeam() {
        const all = (100 / (this.teamACount + this.teamBCount));
        const teamAPer = all * this.teamACount;
        const teamBPer = all * this.teamBCount;
        this.teamA.style.width = teamAPer + '%';
        this.teamA.innerText = Math.round(teamAPer * 10) / 10 + '%';
        this.teamB.style.width = teamBPer + '%';
        this.teamB.innerText = Math.round(teamBPer * 10) / 10 + '%';
    }
}
// function startGame(cw, ch, deadPixelColor, teamAColor, teamBColor) {
//     const playground = document.getElementById('playground');
//     canvas = playground.getContext('2d');
//     const gameWindow = document.getElementById('gamePage');
//
//     const teamA = document.getElementById('teamA');
//     const teamB = document.getElementById('teamB');
//
//     cPixSize = 5;
//     cWidth = cw;
//     cHeight = ch;
//     cTeamAColor = teamAColor;
//     cTeamBColor = teamBColor;
//     cDeadColor = deadPixelColor;
//     const drawPixGap = 2;
//     const drawPixSize = 10;
//     cGap = 0;
//     cPixSize = drawPixSize;
//     realPixelSize = ((cPixSize * screenScale + cGap) * 10 | 0) / 10;
//
//     gameWindow.style.backgroundColor = cDeadColor;
//     teamA.style.backgroundColor = cTeamAColor;
//     teamB.style.backgroundColor = cTeamBColor;
//
//     function drawAllChunks() {
//         const adjustX = mapX < 0;
//         const adjustY = mapY < 0;
//
//         nowChunkCountX = (canvas.canvas.width / (realPixelSize * cWidth) | 0) + 0;
//         nowChunkCountY = (canvas.canvas.height / (realPixelSize * cHeight) | 0) + 0;
//
//         //計算chunk開始位置X
//         nowChunkStartX = ((-mapX / realPixelSize / cWidth | 0) - 0 + adjustX);
//         //計算chunk開始位置Y
//         nowChunkStartY = ((-mapY / realPixelSize / cHeight | 0) - 0 + adjustY);
//         lastChunkX = nowChunkStartX + nowChunkCountX / 2;
//         lastChunkY = nowChunkStartY + nowChunkCountY / 2;
//
//         let loadList = '';
//         for (let x = 0; x < nowChunkCountX; x++) {
//             //計算chunk位置X
//             let cx = nowChunkStartX + x | 0;
//             for (let y = 0; y < nowChunkCountY; y++) {
//                 //計算chunk位置Y
//                 let cy = nowChunkStartY + y | 0;
//
//                 let chunk = chunks[cx + ',' + cy];
//                 if (chunk !== undefined) {
//                     chunk.drawChunk(canvas);
//                 }
//
//                 if (lastChunkStartX !== nowChunkStartX || lastChunkStartY !== nowChunkStartY ||
//                     lastChunkCountX !== nowChunkCountX || lastChunkCountY !== nowChunkCountY) {
//                     if (cy < lastChunkStartY || cy > lastChunkStartY + lastChunkCountY - 1 ||
//                         cx < lastChunkStartX || cx > lastChunkStartX + lastChunkCountX - 1) {
//                         // 沒有這個chunk或時間沒更新
//                         if (chunk === undefined || chunk.chunkTime < worldTime) {
//                             loadList += cx + ',' + cy + ';';
//                         }
//                     }
//                 }
//
//                 // if (chunk !== undefined) {
//                 //     //debug用
//                 //     canvas.beginPath();
//                 //     canvas.lineWidth = '2';
//                 //     canvas.strokeStyle = 'blue';
//                 //     canvas.rect(
//                 //         cx * realPixelSize * cWidth, cy * realPixelSize * cHeight,
//                 //         realPixelSize * cWidth,
//                 //         realPixelSize * cHeight);
//                 //     canvas.stroke();
//                 //
//                 //     canvas.font = '12px';
//                 //     canvas.fillStyle = 'red';
//                 //     canvas.fillText(cx + ',' + cy,
//                 //         cx * realPixelSize * cWidth, cy * realPixelSize * cHeight + 10);
//                 // }
//             }
//         }
//
//         // if (loadList.length > 0) {
//
//         if (lastChunkStartX !== nowChunkStartX || lastChunkStartY !== nowChunkStartY ||
//             lastChunkCountX !== nowChunkCountX || lastChunkCountY !== nowChunkCountY) {
//             // console.log(loadList)
//
//             //如果有放大縮小取得最大範圍
//             const zoomChange = lastChunkCountX !== nowChunkCountX || lastChunkCountY !== nowChunkCountY;
//             let updateArea;
//             if (zoomChange) {
//                 updateArea = [Math.min(nowChunkStartX, lastChunkStartX), Math.min(nowChunkStartY, lastChunkStartY),
//                     Math.max(nowChunkCountX, lastChunkCountX), Math.max(nowChunkCountY, lastChunkCountY)]
//             }//沒有縮放
//             else {
//                 updateArea = [nowChunkStartX, nowChunkStartY,
//                     Math.max(nowChunkCountX, lastChunkCountX), Math.max(nowChunkCountY, lastChunkCountY)]
//             }
//             requestChunk(loadList.slice(0, -1), updateArea);
//             // }
//         }
//
//         //劃格線
//         if (screenScale > drawLineScreenScale) {
//             canvas.lineWidth = cGap;
//             canvas.strokeStyle = strokeStyle;
//             canvas.beginPath();
//             const lStartX = nowChunkStartX * realPixelSize * cWidth;
//             const lStartY = nowChunkStartY * realPixelSize * cHeight;
//             const viewWidth = lStartX + nowChunkCountX * realPixelSize * cWidth;
//             const viewHeight = lStartY + nowChunkCountY * realPixelSize * cHeight;
//             for (let y = 0; y < nowChunkCountY * cHeight; y++) {
//                 canvas.moveTo(lStartX, lStartY + y * realPixelSize);
//                 canvas.lineTo(viewWidth, lStartY + y * realPixelSize);
//             }
//
//             for (let x = 0; x < nowChunkCountX * cWidth; x++) {
//                 canvas.moveTo(lStartX + x * realPixelSize, lStartY);
//                 canvas.lineTo(lStartX + x * realPixelSize, viewHeight);
//             }
//             canvas.stroke();
//         }
//
//         //更新
//         lastChunkStartX = nowChunkStartX;
//         lastChunkStartY = nowChunkStartY;
//         lastChunkCountX = nowChunkCountX;
//         lastChunkCountY = nowChunkCountY;
//     }
//
//     //計算兩隊佔有量
//     function calculateTeam() {
//         const all = (100 / (teamACount + teamBCount));
//         const teamAPer = all * teamACount;
//         const teamBPer = all * teamBCount;
//         teamA.style.width = teamAPer + '%';
//         teamA.innerText = Math.round(teamAPer * 10) / 10 + '%';
//         teamB.style.width = teamBPer + '%';
//         teamB.innerText = Math.round(teamBPer * 10) / 10 + '%';
//     }
//
//
//     //計時器
//     let interval;
//     //UI
//     const pauseButton = document.getElementById('pause');
//     const nextButton = document.getElementById('next');
//     const calculateCount = document.getElementById('calculateCount');
//     const calculateTime = document.getElementById('calculateTime');
//     const locationView = document.getElementById('location');
//     worldTimeText = document.getElementById('count');
//     //暫停
//     pauseButton.onclick = () => {
//     }
//
//     //範例
//     let lastDrawPosX = 0, lastDrawPosY = 0;
//     let lastMousePosX = 0, lastMousePosY = 0;
//
//     function drawExample(x, y, need, failed, clear) {
//         const objectWidth = model[0][0];
//         const objectHeight = model[0][1];
//
//         let startX = ((x - mapX - realPixelSize / 2) / realPixelSize | 0) * realPixelSize;
//         let startY = ((y - mapY - realPixelSize / 2) / realPixelSize | 0) * realPixelSize;
//         //置中
//         startX -= realPixelSize * (objectWidth / 2 | 0);
//         startY -= realPixelSize * (objectHeight / 2 | 0);
//
//         //負的地方需要更改
//         if ((x - mapX) < realPixelSize / 2)
//             startX -= realPixelSize;
//         if ((y - mapY) < realPixelSize / 2)
//             startY -= realPixelSize;
//
//         //刷新螢幕
//         if (startX !== lastDrawPosX || startY !== lastDrawPosY || need) {
//             //清除上次畫的
//             if (clear)
//                 placeExample(lastMousePosX, lastMousePosY, true);
//             lastDrawPosX = startX;
//             lastDrawPosY = startY;
//         } else {
//             return;
//         }
//
//         if (failed)
//             canvas.fillStyle = placeErrorColor;
//         else if (teamID === teamAID)
//             canvas.fillStyle = cTeamAColor;
//         else if (teamID === teamBID)
//             canvas.fillStyle = cTeamBColor;
//
//         //畫範例
//         for (let y = 0; y < objectHeight; y++) {
//             startY += realPixelSize;
//             let cache = startX;
//             for (let x = 0; x < objectWidth; x++) {
//                 startX += realPixelSize;
//                 if (model[y + 1][x] === 0)
//                     continue;
//
//                 canvas.fillRect(startX, startY, realPixelSize, realPixelSize);
//             }
//             startX = cache;
//         }
//
//         lastMousePosX = x;
//         lastMousePosY = y;
//     }
//
//     function placeExample(x, y, clear) {
//         const modelWidth = model[0][0];
//         const modelHeight = model[0][1];
//
//         let startX = ((x - mapX - realPixelSize / 2) / realPixelSize | 0) * realPixelSize;
//         let startY = ((y - mapY - realPixelSize / 2) / realPixelSize | 0) * realPixelSize;
//         // //置中
//         startX -= realPixelSize * (modelWidth / 2 | 0);
//         startY -= realPixelSize * (modelHeight / 2 | 0);
//
//         //負的地方需要更改
//         if ((x - mapX) < realPixelSize / 2)
//             startX -= realPixelSize;
//         if ((y - mapY) < realPixelSize / 2)
//             startY -= realPixelSize;
//
//         //節省chunk的取得
//         let lastCx = null, lastCy = null;
//         let chunk;
//
//         let needChangeChunk = {};
//         let needChangeChunkSend = {};
//         for (let y = 0; y < modelHeight; y++) {
//             startY += realPixelSize;
//             let cache = startX;
//             for (let x = 0; x < modelWidth; x++) {
//                 startX += realPixelSize;
//                 if (model[y + 1][x] === 0)
//                     continue;
//
//                 let cx = (startX + 0.05) / realPixelSize / cWidth | 0;
//                 let cy = (startY + 0.05) / realPixelSize / cWidth | 0;
//                 if (startX < 0)
//                     cx--;
//                 if (startY < 0)
//                     cy--;
//
//                 //再chunk中的位置
//                 let xInC = startX / realPixelSize - (cx * cWidth) | 0;
//                 let yInC = startY / realPixelSize - (cy * cHeight) | 0;
//
//                 if (lastCx !== cx || lastCy !== cy) {
//                     chunk = chunks[cx + ',' + cy];
//                     lastCx = cx;
//                     lastCy = cy;
//                 }
//
//                 if (clear) {
//                     if (chunk === undefined) {
//                         canvas.fillStyle = deadPixelColor;
//                     }
//                     //chunk有在
//                     else {
//                         let teamID = chunk.chunkMap[xInC][yInC];
//                         if (teamID === teamAID)
//                             canvas.fillStyle = cTeamAColor;
//                         else if (teamID === teamBID)
//                             canvas.fillStyle = cTeamBColor;
//                         else
//                             canvas.fillStyle = deadPixelColor;
//                     }
//                     canvas.fillRect(startX, startY, realPixelSize, realPixelSize);
//
//                 } else {
//                     //放置
//                     //看看這附近有沒有東西
//                     if (chunk !== undefined)
//                         //有東西
//                         if (chunk.chunkMap[xInC][yInC] > 0) {
//                             drawExample(lastMousePosX, lastMousePosY, true, true);
//                             return false;
//                         }
//
//                     //加入替換清單
//                     let thisChunk = needChangeChunk[cx + ',' + cy];
//                     let thisChunkSend = needChangeChunkSend[cx + ',' + cy];
//                     if (!thisChunk) {
//                         thisChunk = needChangeChunk[cx + ',' + cy] = [];
//                         thisChunkSend = needChangeChunkSend[cx + ',' + cy] = [];
//                     }
//                     thisChunkSend.push(yInC * cWidth + xInC);
//                     thisChunk.push([xInC, yInC])
//                 }
//             }
//             startX = cache;
//         }
//
//         if (!clear) {
//             // for (const i in needChangeChunk) {
//             //     let chunk = chunks[i];
//             //     //沒load的話
//             //     if (chunk === undefined)
//             //         chunk = loadChunk(i);
//             //     chunk.updateCells(needChangeChunk[i], canvas, teamID);
//             // }
//             placeCells(needChangeChunkSend);
//             return true;
//         }
//     }
//
//     window.onkeydown = (event) => {
//         if (selectModel) {
//             if (event.key === 'r') {
//                 //先清除
//                 placeExample(lastMousePosX, lastMousePosY, true);
//                 const modelWidth = model[0][0];
//                 const modelHeight = model[0][1];
//                 let newModel = [];
//                 newModel.push([modelHeight, modelWidth]);
//
//                 for (let x = 0; x < modelWidth; x++) {
//                     let cache = []
//                     for (let y = modelHeight; y > 0; y--) {
//                         cache.push(model[y][x]);
//                     }
//                     newModel.push(cache);
//                 }
//
//                 model = newModel;
//                 drawExample(lastMousePosX, lastMousePosY, true);
//             }
//
//             if (event.key === 'f') {
//                 //先清除
//                 placeExample(lastMousePosX, lastMousePosY, true);
//                 const modelWidth = model[0][0];
//                 const modelHeight = model[0][1];
//                 let newModel = [];
//                 newModel.push([modelWidth, modelHeight]);
//
//                 for (let y = 0; y < modelHeight; y++) {
//                     let cache = [];
//                     for (let x = modelWidth; x > 0; x--) {
//                         cache.push(model[y + 1][x - 1]);
//                     }
//                     newModel.push(cache);
//                 }
//
//                 model = newModel;
//                 drawExample(lastMousePosX, lastMousePosY, true);
//             }
//
//             if (event.key === 'Escape') {
//                 selectModel = false;
//                 placeExample(lastMousePosX, lastMousePosY, true);
//             }
//         }
//     }
//
//     //移動部分
//     let drag = false;
//     let mapX = 0, mapY = 0;
//     let moveX = 0, moveY = 0;
//     let lastMoveX = 0, lastMoveY = 0;
//     playground.onmousedown = (event) => {
//         resizeScreen();
//         if (!drag) {
//             moveX += event.offsetX - moveX;
//             moveY += event.offsetY - moveY;
//             lastMoveX = moveX;
//             lastMoveY = moveY;
//             drag = true;
//         }
//     }
//
//     playground.onmouseup = (event) => {
//         //點一下的話
//         if (abs(lastMoveX - moveX) < 10 && abs(lastMoveY - moveY) < 10) {
//             if (selectModel) {
//                 const donePlace = placeExample(event.offsetX, event.offsetY);
//                 //沒有按住shift且放置成功
//                 if (!event.shiftKey && donePlace)
//                     selectModel = false;
//             }
//             //一般的點選
//             else {
//                 let x = (event.offsetX - mapX) / realPixelSize;
//                 let y = (event.offsetY - mapY) / realPixelSize;
//                 //計算chunk位置
//                 let cx = x / cWidth | 0;
//                 let cy = y / cHeight | 0;
//                 if (x < 0)
//                     cx--;
//                 if (y < 0)
//                     cy--;
//
//                 // console.log(cx, cy, x, y)
//
//                 let chunk = chunks[cx + ',' + cy];
//                 //沒load的話
//                 if (chunk === undefined)
//                     chunk = loadChunk(cx, cy);
//
//                 //chunk裡的x,y
//                 let xInC = x - (cx * cWidth) | 0;
//                 let yInC = y - (cy * cHeight) | 0;
//                 if (chunk.chunkMap[xInC][yInC] > 0 && chunk.chunkMap[xInC][yInC] !== teamID) {
//                     canvas.fillStyle = placeErrorColor;
//                     let chunkStartX = cx * realPixelSize * cWidth;
//                     let chunkStartY = cy * realPixelSize * cHeight;
//                     canvas.fillRect(chunkStartX + xInC * realPixelSize, chunkStartY + yInC * realPixelSize, realPixelSize, realPixelSize);
//                 } else {
//                     chunk.updateCells([[xInC, yInC]], canvas, teamID);
//                 }
//                 // chunk.drawChangeCells(canvas);
//             }
//         }
//         //還在選取狀態
//         else if (selectModel) {
//             drawExample(event.offsetX, event.offsetY, true);
//         }
//         updateMiniMap(true);
//         drag = false;
//     }
//
//     //移動
//     playground.onmousemove = (event) => {
//         //移動
//         if (drag && !event.shiftKey) {
//             let moveToX = event.offsetX - moveX;
//             let moveToY = event.offsetY - moveY;
//             move(moveToX, moveToY);
//         }
//
//         //畫範例
//         if (!drag && selectModel) {
//             drawExample(event.offsetX, event.offsetY, false, false, true);
//         }
//     }
//
//     playground.onmouseleave = (event) => {
//         drag = false;
//     }
//
//     let delta = 0.1;
//     //縮放
//     playground.onwheel = (event) => {
//         const lastScreenScale = screenScale;
//
//         delta = abs(delta);
//         if (event.deltaY > 0)
//             delta *= -1;
//
//         screenScale = Math.round((screenScale + delta) * 10) / 10;
//
//         // screenScale = (screenScale * 10 | 0) / 10;
//         if (screenScale < screenMinScale) {
//             screenScale = screenMinScale;
//         }
//
//         if (lastScreenScale === screenScale)
//             return
//
//         // 計算沒放大前位置
//         realPixelSize = ((cPixSize * lastScreenScale + cGap) * 10 | 0) / 10;
//         let xLast = (event.offsetX - mapX) / realPixelSize;
//         let yLast = (event.offsetY - mapY) / realPixelSize;
//
//         //如果需要畫線，更改cell之間的寬
//         if (screenScale > drawLineScreenScale) {
//             cGap = drawPixGap;
//             cPixSize = drawPixSize;
//             delta = 0.4;
//         } else {
//             cGap = 0;
//             delta = 0.1;
//         }
//
//         // 計算沒放大後位置
//         realPixelSize = ((cPixSize * screenScale + cGap) * 10 | 0) / 10;
//         let xNow = (event.offsetX - mapX) / realPixelSize;
//         let yNow = (event.offsetY - mapY) / realPixelSize;
//
//         move((xNow - xLast) * realPixelSize, (yNow - yLast) * realPixelSize);
//
//         if (selectModel) {
//             window.requestAnimationFrame(() => drawExample(event.offsetX, event.offsetY, true));
//         }
//     }
//
//     //視窗重設
//     function resizeScreen() {
//         if (canvas.canvas.width !== gameWindow.offsetWidth || canvas.canvas.height !== gameWindow.offsetHeight) {
//             canvas.canvas.width = gameWindow.offsetWidth;
//             canvas.canvas.height = gameWindow.offsetHeight;
//             canvas.translate(mapX, mapY);
//         }
//         refreshScreen();
//     }
//
//     function refreshScreen() {
//         window.requestAnimationFrame(clear);
//         window.requestAnimationFrame(drawAllChunks);
//         // window.requestAnimationFrame(debug);
//     }
//
//     function move(moveToX, moveToY) {
//         mapX += moveToX | 0;
//         mapY += moveToY | 0;
//         moveX += moveToX | 0;
//         moveY += moveToY | 0;
//         canvas.setTransform(1, 0, 0, 1, mapX, mapY);
//
//         locationView.innerText = '座標: ' + -(mapX / realPixelSize | 0) + ',' + (mapY / realPixelSize | 0);
//         refreshScreen();
//     }
//
//     this.moveTo = (x, y) => {
//         let moveToX = -x * realPixelSize - mapX;
//         let moveToY = y * realPixelSize - mapY;
//         move(moveToX, moveToY);
//     }
//
//     function clear() {
//         canvas.fillStyle = deadPixelColor;
//         canvas.fillRect(-canvas.canvas.width - mapX, -canvas.canvas.height - mapY, canvas.canvas.width * 2, canvas.canvas.height * 2);
//     }
//
//     //setup
//     resizeScreen();
//     loadExample();
//     loadMiniMap({
//         deadPixel: cDeadColor,
//         alivePixelA: cTeamAColor,
//         alivePixelB: cTeamBColor,
//         chunkWidth: cWidth,
//         chunkHeight: cHeight,
//         pixelSize: cPixSize,
//         gap: cGap
//     });
//
//     function debug() {
//         for (const i in chunks) {
//             const chunk = chunks[i];
//
//             let chunkStartX = chunk.locX * realPixelSize * cWidth;
//             let chunkStartY = chunk.locY * realPixelSize * cHeight;
//             // for (let i = 0; i < chunk.alivePixelList.length; i++) {
//             //     const x = chunk.alivePixelList[i][0];
//             //     const y = chunk.alivePixelList[i][1];
//             //     let col = (chunk.cellData[x][y] + 1) / 7 * 255;
//             //     canvas.fillStyle = `rgb(0,${col},0)`;
//             //     canvas.fillRect(chunkStartX + realPixelSize * x + cPixSize * screenScale / 4,
//             //         chunkStartY + realPixelSize * y + cPixSize * screenScale / 4,
//             //         cPixSize * screenScale / 2, cPixSize * screenScale / 2);
//             // }
//             // canvas.fillStyle = chunk.deadPixel;
//
//             //debug用
//             canvas.beginPath();
//             canvas.lineWidth = '2';
//             canvas.strokeStyle = 'blue';
//             canvas.rect(
//                 chunkStartX, chunkStartY,
//                 realPixelSize * cWidth,
//                 realPixelSize * cHeight);
//             canvas.stroke();
//
//             canvas.font = '12px white';
//             canvas.fillStyle = 'red';
//             canvas.fillText(chunk.locX + ',' + chunk.locY,
//                 chunkStartX,
//                 chunkStartY + 10);
//
//             // canvas.font = '10px';
//             // canvas.fillStyle = 'red';
//             // // console.log(chunkStartX, chunkStartY)
//             // for (let y = 0; y < cHeight; y++) {
//             //     for (let x = 0; x < cWidth; x++) {
//             //         canvas.fillText(chunk.cellData[x][y], chunkStartX + x * pixSize + cPixSize * screenScale / 2,
//             //             chunkStartY + y * pixSize + cPixSize * screenScale / 2);
//             //     }
//             // }
//         }
//     }
// }

function updateWorldTime(time) {
    worldTime = time;
    worldTimeText.innerText = '世界時間: ' + worldTime;
}

const loadChunk = (cx, cy) => {
    let loc = cx + ',' + cy;
    if (cy === undefined) {
        loc = cx;
        const spl = cx.split(',');
        cx = parseInt(spl[0]);
        cy = parseInt(spl[1]);
    }

    const chunk = new Chunk(cx, cy, cWidth, cHeight, cTeamAColor, cTeamBColor, cDeadColor);
    chunk.chunkTime = worldTime;
    chunks[loc] = chunk;
    return chunk;
}

const unloadChunk = (x, y) => {
    let loc = x + ',' + y;
    if (y === undefined)
        loc = x;

    if (chunks[loc] !== undefined) {
        delete chunks[loc];
    }
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