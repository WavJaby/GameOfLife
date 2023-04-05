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
const out = console.log;

window.onload = Main;

function Main() {
    const gameWindow = document.getElementById('gamePage');
    // Main canvas
    const playground = document.createElement('canvas');
    playground.className = 'playground';
    gameWindow.appendChild(playground);
    const canvas = playground.getContext('2d');
    const buffFrame = document.createElement('canvas').getContext('2d');
    // Team counter
    const teamState = document.getElementById('teamState');
    const teamStateElements = [];

    // UI
    const navBar = document.createElement('div');
    navBar.className = 'controls';
    gameWindow.appendChild(navBar);

    createPlayButton(playState, navBar);
    const nextStepBtn = createIconButton('Next step', 'web/icon/next.svg', navBar);
    nextStepBtn.onclick = calculateGeneration;

    const generationCounter = createTextWithLabel('Gen: ', 'generationCounter', navBar);
    // generationCounter.textContent = location.href;
    generationCounter.textContent = '0';

    const detailWindow = document.createElement('div');
    detailWindow.className = 'detailWindow';
    gameWindow.appendChild(detailWindow);

    const calculateCount = createTextWithLabel('Cal: ', 'calculateCount', detailWindow);
    calculateCount.textContent = '0';
    const calculateTime = createTextWithLabel('Cal Time: ', 'calculateTime', detailWindow);
    calculateTime.textContent = '0';

    // game
    const chunkWidth = 16, chunkHeight = 16
    let simulateInterval;
    // move
    let totalZoomDelta = 0;
    let startMoveX, startMoveY;

    /** init */
    const world = {
        x: 0, y: 0,
        scale: 5, mainCanvas: canvas
    };
    // Chunk manager
    const chunkManager = new ChunkManager(world);
    // Minimap
    const minMap = new MiniMap(cellStateColors, world, chunkManager);
    gameWindow.appendChild(minMap.miniMapElement);
    // Template
    const templateManager = new TemplateManager(chunkManager, world);
    gameWindow.appendChild(templateManager.templateDisplayElement);

    chunkManager.addTeam([0, 0]);
    cellStateColors.push(
        new Color(0, 200, 200),
        new Color(200, 200, 200)
    );
    const stuff = new Stuff(chunkManager, cellStateColors, calculateTeam, minMap.updateMiniMap);
    gameWindow.style.backgroundColor = cellStateColors[0].toString();

    templateManager.loadTemplate();
    world.y = 50;
    resizeScreen();
    addEventListener('resize', resizeScreen);
    if (1) {
        chunkManager.getChunk(0, 0).addCells([
            [12, 2], [13, 2], [14, 2], [11, 3], [14, 3], [15, 3], [10, 4], [14, 4], [10, 5], [15, 5], [12, 6], [0, 7], [1, 7], [2, 7], [3, 7], [9, 7], [11, 7], [0, 8],
            [4, 8], [5, 8], [7, 8], [9, 8], [10, 8], [11, 8], [13, 8], [14, 8], [0, 9], [6, 9], [7, 9], [13, 9], [1, 10], [4, 10], [5, 10], [7, 10], [10, 10], [13, 10],
            [15, 10], [7, 11], [9, 11], [11, 11], [13, 11], [15, 11], [1, 12], [4, 12], [5, 12], [7, 12], [10, 12], [13, 12], [0, 13], [6, 13], [7, 13], [11, 13],
            [13, 13], [15, 13], [0, 14], [4, 14], [5, 14], [7, 14], [9, 14], [10, 14], [13, 14], [0, 15], [1, 15], [2, 15], [3, 15], [9, 15], [11, 15], [13, 15], [15, 15]
        ], 1);
        chunkManager.getChunk(1, 0).addCells([
            [2, 0], [1, 1], [2, 1], [3, 1], [3, 2], [4, 2], [0, 3], [3, 3], [5, 3], [6, 3], [0, 4], [3, 4], [5, 4], [1, 5], [3, 5], [5, 5], [7, 5], [8, 5], [1, 6], [3, 6], [7, 6],
            [8, 6], [0, 7], [4, 7], [6, 7], [7, 7], [8, 7], [8, 8], [9, 8], [0, 10], [1, 11], [7, 11], [8, 11], [9, 11], [10, 11], [0, 12], [1, 12], [3, 12], [5, 12], [6, 12],
            [10, 12], [3, 13], [4, 13], [10, 13], [0, 14], [3, 14], [5, 14], [6, 14], [9, 14], [1, 15], [3, 15]
        ], 0);
        chunkManager.getChunk(0, 1).addCells([
            [10, 0], [11, 0], [13, 0], [13, 1], [1, 2], [2, 2], [12, 2], [13, 2], [15, 2], [2, 3], [3, 3], [4, 3], [6, 3], [10, 3], [15, 3], [2, 4], [3, 4], [7, 4], [9, 4],
            [14, 4], [2, 5], [3, 5], [5, 5], [7, 5], [9, 5], [11, 5], [5, 6], [7, 6], [10, 6], [12, 6], [4, 7], [5, 7], [7, 7], [10, 7], [11, 7], [12, 7], [15, 7], [6, 8],
            [7, 8], [12, 8], [13, 8], [14, 8], [7, 9], [8, 9], [9, 9], [8, 10]
        ], 1);
        chunkManager.getChunk(1, 1).addCells([
            [0, 0], [3, 0], [5, 0], [6, 0], [9, 0], [3, 1], [4, 1], [10, 1], [0, 2], [1, 2], [3, 2], [5, 2], [6, 2], [10, 2], [1, 3], [7, 3], [8, 3], [9, 3],
            [10, 3], [0, 5], [0, 6]
        ], 0);
        // calculateTeam();
    }
    calculateTeam();
    minMap.updateMiniMap(true);
    minMap.updateLocationText();


    /** listener */
    function playState(state) {
        // if (stuff.play()) {
        //     world.x = 0;
        //     world.y = 0;
        //     world.scale = 5;
        //     updateLocation();
        //     return;
        // }

        if (state) {
            simulateInterval = setInterval(calculateGeneration, 5);
        } else {
            clearInterval(simulateInterval);
            simulateInterval = null;
        }
    }

    window.onkeydown = function (event) {
        if (templateManager.selectTemplate())
            templateManager.rotateTemplate(event);
    }

    userInteractionManager(playground, clockDown, endDrag, onDrag, onMove, onClick);

    function clockDown(clientX, clientY) {
        startMoveX = clientX - world.x;
        startMoveY = clientY - world.y;
    }

    function onMove(clientX, clientY) {
        templateManager.updateLocation(clientX, clientY);
    }

    function onDrag(clientX, clientY) {
        const moveX = clientX - startMoveX;
        const moveY = clientY - startMoveY;
        world.x = moveX;
        world.y = moveY;
        updateLocation();
        minMap.updateLocationText(clientX, clientY);
    }

    function endDrag(clientX, clientY) {
        minMap.updateMiniMap(true);
    }

    function onClick(clientX, clientY) {
        // Check if place template
        if (templateManager.selectTemplate()) {
            // Place template
            const change = templateManager.checkPlaceTemplate(clientX, clientY);
            if (change != null) {
                for (/**@type{int}*/const x in change) {
                    const chunkX = change[x];
                    for (/**@type{int}*/const y in chunkX)
                        chunkManager.getChunk(x, y).addCells(chunkX[y], teamID);
                }
                templateManager.clearSelect();
            }
        }
        // Place single cell
        else {
            const worldX = (world.x + 0.5) | 0;
            const worldY = (world.y + 0.5) | 0;
            const x = (clientX - worldX) / world.scale;
            const y = (clientY - worldY) / world.scale;
            const cx = (x / chunkWidth - (x < 0)) | 0;
            const cy = (y / chunkHeight - (y < 0)) | 0;

            const chunk = chunkManager.getChunk(cx, cy);

            //chunk裡的x,y
            const xInC = (x - cx * chunkWidth) | 0;
            const yInC = (y - cy * chunkHeight) | 0;
            const state = chunk.chunkMap[xInC][yInC];
            if (state === 0 || state === teamID + 1) {
                chunk.addCells([[xInC, yInC]], teamID);
                calculateTeam();
            }
        }
        minMap.updateMiniMap(true);
    }

    playground.onwheel = function (event) {
        totalZoomDelta += event.deltaY * 0.03;
        if (Math.abs(totalZoomDelta) < 1) return;

        const lastWorldScale = world.scale;
        world.scale += totalZoomDelta > 0 ? 1 : -1;
        totalZoomDelta -= totalZoomDelta | 0;
        if (world.scale < screenMinScale)
            world.scale = screenMinScale;
        if (lastWorldScale === world.scale)
            return;

        const vecX = event.clientX - world.x;
        const vecY = event.clientY - world.y;
        world.x -= (vecX * world.scale / lastWorldScale - vecX);
        world.y -= (vecY * world.scale / lastWorldScale - vecY);

        updateLocation();
        templateManager.updateLocation(event.clientX, event.clientY);
        event.preventDefault();
    }

    function calculateGeneration() {
        let timer = window.performance.now();
        const needChange = chunkManager.calculateGeneration();
        timer = window.performance.now() - timer;
        const generationCount = chunkManager.getGenerationCount();
        generationCounter.textContent = generationCount.toString();

        //更新畫面
        //計算畫面中有幾個chunk
        const xChunkCount = (playground.width / (world.scale * chunkWidth) | 0) + 2;
        const yChunkCount = (playground.height / (world.scale * chunkHeight) | 0) + 2;
        //計算chunk開始位置
        const startX = ((-world.x / world.scale / chunkWidth | 0) - 1 + (world.x < 0));
        const startY = ((-world.y / world.scale / chunkHeight | 0) - 1 + (world.y < 0));
        for (const chunk of needChange) {
            chunk.renderChange(
                chunk.x >= startX && chunk.x < startX + xChunkCount &&
                chunk.y >= startY && chunk.y < startY + yChunkCount,
                generationCount,
                canvas
            );
        }

        calculateTeam();
        minMap.updateMiniMap();

        // renderAllChunks();

        calculateTime.innerText = timer.toFixed(1) + 'ms';
        calculateCount.innerText = chunkManager.calculateCount.toString();
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

        // console.time('renderAllChunks');
        // Update frame buff to main canvas
        canvas.imageSmoothingEnabled = false;
        canvas.drawImage(buffFrame.canvas, 0, 0);
        // console.timeEnd('renderAllChunks');
        // debug();
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

    function updateLocation() {
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

function createPlayButton(onStateChange, parent) {
    const playButton = document.createElement('button');
    const playIconImage = new Image();
    playIconImage.src = 'web/icon/play.svg';
    const pauseIconImage = new Image();
    pauseIconImage.src = 'web/icon/pause.svg';
    playButton.appendChild(playIconImage);
    playButton.title = 'play';

    let state = false;
    playButton.onclick = function () {
        if (state) {
            playButton.title = 'Pause';
            playButton.replaceChild(playIconImage, pauseIconImage);
        } else {
            playButton.title = 'Play';
            playButton.replaceChild(pauseIconImage, playIconImage);
        }
        state = !state;
        onStateChange(state);
    }
    parent.appendChild(playButton);
}

function createIconButton(title, iconUrl, parent) {
    const button = document.createElement('button');
    const icon = new Image();
    icon.src = iconUrl;
    button.appendChild(icon);
    button.title = title;
    parent.appendChild(button);
    return button;
}

function createTextWithLabel(label, className, parent) {
    const text = document.createElement('p');
    text.className = className;
    text.textContent = label;
    const textContent = document.createElement('span');
    text.appendChild(textContent);
    parent.appendChild(text);
    return textContent;
}

function userInteractionManager(targetElement, clickDown, endDrag, onDrag, onMove, onClick) {
    const moveTimeThreshold = 500;
    const moveThreshold = 6;
    let mouseLeftDown = false;
    let touchDown = false;
    let moved = false;
    let startClickDownX, startClickDownY;
    let startTime;

    // Click down
    targetElement.addEventListener('touchstart', onClickDown);
    targetElement.addEventListener('mousedown', onClickDown);

    function onClickDown(event) {
        if (!touchDown && !mouseLeftDown) {
            moved = false;
            startTime = window.performance.now();
            // Touch
            if (event instanceof TouchEvent) {
                const touch = event.targetTouches[0];
                touchDown = true;
                clickDown(startClickDownX = touch.clientX, startClickDownY = touch.clientY);
            }
            // Mouse
            else {
                // Mouse left click
                if (event.button === 0) {
                    mouseLeftDown = true;
                    clickDown(startClickDownX = event.clientX, startClickDownY = event.clientY);
                }
            }

            // console.log('down', touchDown, mouseLeftDown);
        }

        // if (event instanceof MouseEvent)
        event.preventDefault();
    }


    // Move
    targetElement.addEventListener('touchmove', onClickMove);
    window.addEventListener('mousemove', onClickMove);

    function onClickMove(event) {
        const touchEvent = event instanceof TouchEvent;
        let clientX, clientY;
        if (touchEvent) {
            const touch = event.targetTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        if ((touchEvent && touchDown || !touchEvent && mouseLeftDown) && (
            Math.abs(clientX - startClickDownX) > moveThreshold ||
            Math.abs(clientY - startClickDownY) > moveThreshold ||
            window.performance.now() - startTime > moveTimeThreshold)
        ) {
            moved = true;
            onDrag(clientX, clientY);
        } else
            onMove(clientX, clientY);
        if (event instanceof MouseEvent)
            event.preventDefault();
    }


    // Release
    // targetElement.addEventListener('touchcancel', onMouseUp);
    targetElement.addEventListener('touchend', onClickUp);
    window.addEventListener('mouseup', onClickUp);

    function onClickUp(event) {
        const touchEvent = event instanceof TouchEvent;
        let clientX, clientY;

        // console.log('up', touchDown, mouseLeftDown);

        if (touchEvent) {
            const touch = event.changedTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;

            if (event.targetTouches.length > 0) {
                //TODO: multiple touch support
            }
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }


        if (touchEvent && touchDown || !touchEvent && mouseLeftDown) {
            if (moved)
                endDrag(clientX, clientY);
            else
                onClick(clientX, clientY);

            touchDown = false;
            mouseLeftDown = false;
        }

        if (event instanceof MouseEvent)
            event.preventDefault();
    }


    window.addEventListener('contextmenu', function (event) {
        if (touchDown || mouseLeftDown)
            event.preventDefault();
    });
}