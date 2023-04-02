'use strict';

const minChunkX = -1024, minChunkY = -1024, maxChunkX = 1024, maxChunkY = 1024;
const cellWallSize = 2;
// screen
const zoomDelta = 1;
const screenMinScale = 1;
const drawLineScreenScale = 15;
const strokeStyle = 'rgb(54, 54, 54)';
const placeErrorColor = 'rgb(255, 0, 0)';
const cellStateColors = [new Color(10, 10, 10)];
const teamID = 1;

function Main() {
    const world = {x: 0, y: 0, scale: 5};
    const chunkManager = new ChunkManager(world);
    // main canvas
    const gameWindow = document.getElementById('gamePage');
    const playground = document.createElement('canvas');
    playground.className = "playground";
    gameWindow.appendChild(playground);
    const canvas = playground.getContext('2d');
    const buffFrame = document.createElement('canvas').getContext('2d');
    // minimap canvas
    const minMap = new MiniMap(cellStateColors, world, chunkManager);
    gameWindow.appendChild(minMap.miniMapElement);
    // minimap canvas
    const templateManager = new TemplateManager(chunkManager, world);
    gameWindow.appendChild(templateManager.templateDisplayElement);

    // team bar
    const teamState = document.getElementById('teamState');
    const teamStateElements = [];
    // control UI
    const startButton = document.getElementById('start');
    const nextButton = document.getElementById('next');
    // UI
    const timeCount = document.getElementById('count');
    const calculateCount = document.getElementById('calculateCount');
    const calculateTime = document.getElementById('calculateTime');
    // game
    const chunkWidth = 16, chunkHeight = 16
    let simulateInterval;
    // move
    const moveTimeThreshold = 500;
    let mouseDown = false;
    let moved = false;
    let startMoveX, startMoveY, startMoveWorldX, startMoveWorldY, startMoveTime;

    /** init */
    chunkManager.addTeam([0, 0]);
    cellStateColors.push(
        new Color(0, 200, 200),
        new Color(200, 200, 200)
    );
    const stuff = new Stuff(chunkManager, canvas, cellStateColors, calculateTeam, minMap.updateMiniMap);
    gameWindow.style.backgroundColor = cellStateColors[0].toString();

    if (1) {
        chunkManager.getChunk(0, 0).addCells([
            [12, 2], [13, 2], [14, 2], [11, 3], [14, 3], [15, 3], [10, 4], [14, 4], [10, 5], [15, 5], [12, 6], [0, 7], [1, 7], [2, 7], [3, 7], [9, 7], [11, 7], [0, 8],
            [4, 8], [5, 8], [7, 8], [9, 8], [10, 8], [11, 8], [13, 8], [14, 8], [0, 9], [6, 9], [7, 9], [13, 9], [1, 10], [4, 10], [5, 10], [7, 10], [10, 10], [13, 10],
            [15, 10], [7, 11], [9, 11], [11, 11], [13, 11], [15, 11], [1, 12], [4, 12], [5, 12], [7, 12], [10, 12], [13, 12], [0, 13], [6, 13], [7, 13], [11, 13],
            [13, 13], [15, 13], [0, 14], [4, 14], [5, 14], [7, 14], [9, 14], [10, 14], [13, 14], [0, 15], [1, 15], [2, 15], [3, 15], [9, 15], [11, 15], [13, 15], [15, 15]
        ], canvas, 1);
        chunkManager.getChunk(1, 0).addCells([
            [2, 0], [1, 1], [2, 1], [3, 1], [3, 2], [4, 2], [0, 3], [3, 3], [5, 3], [6, 3], [0, 4], [3, 4], [5, 4], [1, 5], [3, 5], [5, 5], [7, 5], [8, 5], [1, 6], [3, 6], [7, 6],
            [8, 6], [0, 7], [4, 7], [6, 7], [7, 7], [8, 7], [8, 8], [9, 8], [0, 10], [1, 11], [7, 11], [8, 11], [9, 11], [10, 11], [0, 12], [1, 12], [3, 12], [5, 12], [6, 12],
            [10, 12], [3, 13], [4, 13], [10, 13], [0, 14], [3, 14], [5, 14], [6, 14], [9, 14], [1, 15], [3, 15]
        ], canvas, 0);
        chunkManager.getChunk(0, 1).addCells([
            [10, 0], [11, 0], [13, 0], [13, 1], [1, 2], [2, 2], [12, 2], [13, 2], [15, 2], [2, 3], [3, 3], [4, 3], [6, 3], [10, 3], [15, 3], [2, 4], [3, 4], [7, 4], [9, 4],
            [14, 4], [2, 5], [3, 5], [5, 5], [7, 5], [9, 5], [11, 5], [5, 6], [7, 6], [10, 6], [12, 6], [4, 7], [5, 7], [7, 7], [10, 7], [11, 7], [12, 7], [15, 7], [6, 8],
            [7, 8], [12, 8], [13, 8], [14, 8], [7, 9], [8, 9], [9, 9], [8, 10]
        ], canvas, 1);
        chunkManager.getChunk(1, 1).addCells([
            [0, 0], [3, 0], [5, 0], [6, 0], [9, 0], [3, 1], [4, 1], [10, 1], [0, 2], [1, 2], [3, 2], [5, 2], [6, 2], [10, 2], [1, 3], [7, 3], [8, 3], [9, 3],
            [10, 3], [0, 5], [0, 6]
        ], canvas, 0);
        // calculateTeam();
    }
    templateManager.loadTemplate();
    calculateTeam();
    resizeScreen();
    addEventListener("resize", resizeScreen);
    minMap.updateMiniMap(true);
    minMap.updateLocationText();


    function calculateAllChunks() {
        let timer = window.performance.now();
        const needChange = chunkManager.calculateGeneration();
        timer = window.performance.now() - timer;

        //更新畫面
        //計算畫面中有幾個chunk
        const xChunkCount = (playground.width / (world.scale * chunkWidth) | 0) + 2;
        const yChunkCount = (playground.height / (world.scale * chunkHeight) | 0) + 2;
        //計算chunk開始位置
        const startX = ((-world.x / world.scale / chunkWidth | 0) - 1 + (world.x < 0));
        const startY = ((-world.y / world.scale / chunkHeight | 0) - 1 + (world.y < 0));
        const worldTime = chunkManager.getTime();
        for (const chunk of needChange) {
            chunk.renderChange(
                chunk.x >= startX && chunk.x < startX + xChunkCount &&
                chunk.y >= startY && chunk.y < startY + yChunkCount,
                worldTime,
                canvas
            );
        }

        calculateTeam();
        minMap.updateMiniMap();

        // renderAllChunks();

        calculateTime.innerText = '每幀計算時間: ' + timer + 'ms';
        calculateCount.innerText = 'for迴圈次數: ' + chunkManager.calculateCount;
        timeCount.innerText = worldTime.toString();
    }

    function calculateTeam() {
        if (teamStateElements.length !== chunkManager.getTeamLength()) {
            for (let i = teamStateElements.length; i < chunkManager.getTeamLength(); i++) {
                const ele = document.createElement('div');
                ele.style.background = cellStateColors[i + 1].toString();
                teamStateElements.push(ele);
                teamState.appendChild(ele);
            }
        }
        const total = chunkManager.getTotalTeamCount();
        let i = 0;
        for (const ele of teamStateElements) {
            const teamPer = chunkManager.teamCount[i++] / total * 100;
            ele.style.width = teamPer + '%';
            ele.teamPer = teamPer;
            if (teamPer > 3)
                ele.innerText = Math.round(teamPer * 10) / 10 + '%';
            else
                ele.innerText = '';
        }
        const sorted = [];
        Array.prototype.push.apply(sorted, teamStateElements);
        sorted.sort((i, j) => j.teamPer - i.teamPer);
        teamState.append(...sorted);
    }

    function renderAllChunks() {
        const viewWidth = playground.width;
        const viewHeight = playground.height;
        const worldX = world.x + 0.5 | 0, worldY = world.y + 0.5 | 0;

        buffFrame.imageSmoothingEnabled = false;
        buffFrame.fillStyle = cellStateColors[0].toString();
        buffFrame.fillRect(0, 0, viewWidth, viewHeight);
        //計算畫面中有幾個chunk
        const xChunkCount = (viewWidth / (world.scale * chunkWidth) | 0) + 2;
        const yChunkCount = (viewHeight / (world.scale * chunkHeight) | 0) + 2;
        //計算chunk開始位置
        const startX = ((-world.x / world.scale / chunkWidth | 0) - 1 + (world.x < 0));
        const startY = ((-world.y / world.scale / chunkHeight | 0) - 1 + (world.y < 0));
        chunkManager.renderChunksInRange(startX, startY, xChunkCount, yChunkCount, buffFrame);
        minMap.setLocation(startX + 1, startY + 1, xChunkCount - 2, yChunkCount - 2);

        // Draw grid
        if (world.scale > drawLineScreenScale) {
            const viewWidth = playground.width;
            const viewHeight = playground.height;

            buffFrame.lineWidth = cellWallSize;
            buffFrame.strokeStyle = strokeStyle;
            buffFrame.beginPath();
            const lStartX = worldX % world.scale;
            const lStartY = worldY % world.scale;
            for (let y = 0; y < viewHeight + world.scale; y += world.scale) {
                buffFrame.moveTo(0, lStartY + y);
                buffFrame.lineTo(viewWidth, lStartY + y);
            }
            for (let x = 0; x < viewWidth + world.scale; x += world.scale) {
                buffFrame.moveTo(lStartX + x, 0);
                buffFrame.lineTo(lStartX + x, viewHeight);
            }
            buffFrame.stroke();
        }

        // Update frame buff to main canvas
        // console.time('renderAllChunks');
        canvas.imageSmoothingEnabled = false;
        canvas.drawImage(buffFrame.canvas, 0, 0);
        // console.timeEnd('renderAllChunks');
        // debug();
    }

    /** listener */
    startButton.onclick = function () {
        if (!stuff.playing()) {
            stuff.play();
            return;
        }
        if (!simulateInterval) {
            startButton.innerText = 'stop';
            simulateInterval = setInterval(calculateAllChunks, 10);
        } else {
            startButton.innerText = 'start';
            clearInterval(simulateInterval);
            simulateInterval = null;
        }
    }

    nextButton.onclick = calculateAllChunks;

    window.onkeydown = function (event) {
        if (templateManager.selectTemplate())
            templateManager.rotateTemplate(event);
    }

    playground.onmousedown = function (event) {
        if (!mouseDown) {
            startMoveX = event.offsetX - world.x;
            startMoveY = event.offsetY - world.y;
            startMoveWorldX = world.x;
            startMoveWorldY = world.y;
            startMoveTime = window.performance.now();
            mouseDown = true;
        }
    }

    playground.onmouseup = function (event) {
        // On click
        if (!moved && window.performance.now() - startMoveTime < moveTimeThreshold) {
            // Check if place template
            if (templateManager.selectTemplate()) {
                // Place template
                const change = templateManager.checkPlaceTemplate(event);
                console.log(change);
                if (change != null) {
                    for (const x in change) {
                        const chunkX = change[x];
                        for (const y in chunkX)
                            chunkManager.getChunk(x, y).addCells(chunkX[y], canvas, teamID);
                    }
                    templateManager.clearSelect();
                }
            }
            // Place one cell
            else {
                const worldX = (world.x + 0.5) | 0;
                const worldY = (world.y + 0.5) | 0;
                const x = (event.offsetX - worldX) / world.scale;
                const y = (event.offsetY - worldY) / world.scale;
                const cx = (x / chunkWidth - (x < 0)) | 0;
                const cy = (y / chunkHeight - (y < 0)) | 0;

                const chunk = chunkManager.getChunk(cx, cy);

                //chunk裡的x,y
                const xInC = (x - cx * chunkWidth) | 0;
                const yInC = (y - cy * chunkHeight) | 0;
                const state = chunk.chunkMap[xInC][yInC];
                if (state === 0 || state === teamID + 1) {
                    chunk.addCells([[xInC, yInC]], canvas, teamID);
                    calculateTeam();
                }
            }
        }
        minMap.updateMiniMap(true);
        mouseDown = false;
        moved = false;
    }

    playground.onmousemove = function (event) {
        //移動
        if (mouseDown && !event.shiftKey) {
            const moveX = event.offsetX - startMoveX;
            const moveY = event.offsetY - startMoveY;
            const moveThreshold = 6;
            if (Math.abs(moveX - startMoveWorldX) > moveThreshold ||
                Math.abs(moveY - startMoveWorldY) > moveThreshold ||
                window.performance.now() - startMoveTime > moveTimeThreshold) {
                world.x = moveX;
                world.y = moveY;
                moved = true;
                updateLocation();
            }
        }
        minMap.updateLocationText(event);
        templateManager.updateLocation(event);
    }

    playground.onmouseleave = function (event) {
        mouseDown = false;
    }

    playground.onwheel = function (event) {
        const lastWorldScale = world.scale;
        world.scale += (event.deltaY > 0 ? -zoomDelta : zoomDelta);
        if (world.scale < screenMinScale)
            world.scale = screenMinScale;
        if (lastWorldScale === world.scale)
            return;

        const vecX = event.offsetX - world.x;
        const vecY = event.offsetY - world.y;
        world.x -= (vecX * world.scale / lastWorldScale - vecX);
        world.y -= (vecY * world.scale / lastWorldScale - vecY);

        updateLocation();
        templateManager.updateLocation(event);

        // if (selectModel)
        //     window.requestAnimationFrame(function () {
        //         drawTemplate(event.offsetX, event.offsetY, true)
        //     });
    }

    function updateLocation() {
        // world.x |= 0;
        // world.y |= 0;
        requestAnimationFrame(renderAllChunks);
    }

    function resizeScreen() {
        if (playground.width !== gameWindow.offsetWidth || playground.height !== gameWindow.offsetHeight) {
            buffFrame.canvas.width = playground.width = gameWindow.offsetWidth;
            buffFrame.canvas.height = playground.height = gameWindow.offsetHeight;
            renderAllChunks();
        }
    }

    function debug() {
        const adjustX = world.x < 0;
        const adjustY = world.y < 0;

        const viewWidth = playground.width;
        const viewHeight = playground.height;
        //計算畫面中有幾個chunk
        const xChunkCount = (viewWidth / (world.scale * chunkWidth) | 0);
        const yChunkCount = (viewHeight / (world.scale * chunkHeight) | 0);
        //計算chunk開始位置
        const startX = ((-world.x / world.scale / chunkWidth | 0) + adjustX);
        const startY = ((-world.y / world.scale / chunkHeight | 0) + adjustY);

        const chunks = chunkManager.getChunks();

        for (let x = 0; x < xChunkCount; x++) {
            //計算chunk位置X
            const cx = chunks[startX + x | 0];
            if (cx === undefined) continue;
            for (let y = 0; y < yChunkCount; y++) {
                //計算chunk位置Y
                const chunk = cx[startY + y | 0];
                if (chunk === undefined) continue;

                let chunkStartX = chunk.x * chunkWidth * world.scale + world.x;
                let chunkStartY = chunk.y * chunkHeight * world.scale + world.y;

                for (const [x, y] of chunk.getAliveCells()) {
                    let col = (chunk.cellData[x][y] + 1) / 7 * 255;
                    canvas.fillStyle = `rgb(0,${col},0)`;
                    canvas.fillRect(chunkStartX + world.scale * x + world.scale / 4,
                        chunkStartY + world.scale * y + world.scale / 4,
                        world.scale / 2, world.scale / 2);
                }
                canvas.font = '12px Arial';

                // debug用
                canvas.beginPath();
                canvas.lineWidth = 2;
                canvas.strokeStyle = 'blue';
                canvas.rect(chunkStartX, chunkStartY, world.scale * chunkWidth, world.scale * chunkHeight);
                canvas.stroke();

                canvas.textAlign = 'left';
                canvas.fillStyle = 'blue';
                canvas.fillText(chunk.x + ',' + chunk.y,
                    chunkStartX + 2,
                    chunkStartY + 12);

                canvas.textAlign = 'center';
                canvas.fillStyle = 'red';
                for (let y = 0; y < chunkHeight; y++) {
                    for (let x = 0; x < chunkWidth; x++) {
                        if (chunk.cellData[x][y] > 0)
                            canvas.fillText(chunk.cellData[x][y], chunkStartX + x * world.scale + world.scale / 2,
                                chunkStartY + y * world.scale + world.scale / 2 + 5);
                    }
                }
            }
        }
    }
}

window.onload = Main;
const out = console.log;
