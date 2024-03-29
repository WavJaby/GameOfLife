'use strict';

const minChunkX = -1024, minChunkY = -1024, maxChunkX = 1024, maxChunkY = 1024;
const cellWallSize = 2;
// screen
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
    let startMoveX, startMoveY;
    let pinchZoomBeginX, pinchZoomBeginY;
    let pinchZoomBeginScale;

    /** init */
    const world = {
        x: 0, y: 0,
        scale: 15, mainCanvas: buffFrame
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
    const stuff = new Stuff(chunkManager, cellStateColors, calculateTeam, minMap.updateMiniMap, updateMainCanvas);
    gameWindow.style.backgroundColor = cellStateColors[0].toString();

    templateManager.loadTemplate();
    world.y = 50;
    if (0) {
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
    resizeScreen();
    addEventListener('resize', resizeScreen);
    calculateTeam();
    minMap.updateMiniMap(true);
    minMap.updateLocationText();


    /** listener */
    function playState(state) {
        if (!stuff.play(state)) {
            world.x = 0;
            world.y = 0;
            world.scale = 5;
            updateLocation();
        }

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

    userInteractionManager(playground, clickDown, onDragEnd, onDrag, onMove, onClick, onRelease, onZoom, onPinchZoomBegin, onPinchZoom);

    function clickDown(clientX, clientY) {
        // console.log('d', clientX, clientY);
        startMoveX = clientX - world.x;
        startMoveY = clientY - world.y;
    }

    function onMove(clientX, clientY) {
        templateManager.updateLocation(clientX, clientY);
        minMap.updateLocationText(clientX, clientY);
    }

    function onDrag(clientX, clientY) {
        // console.log('m', clientX, clientY);
        const moveX = clientX - startMoveX;
        const moveY = clientY - startMoveY;
        world.x = moveX;
        world.y = moveY;
        updateLocation();
    }

    function onDragEnd(clientX, clientY) {
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

        updateMainCanvas();

        minMap.updateMiniMap(true);
    }

    function onRelease(clientX, clientY) {
        if (clientX > playground.width || clientY > playground.height) return;
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

            updateMainCanvas();

            minMap.updateMiniMap(true);
        }
    }

    function onZoom(clientX, clientY, delta) {
        const lastWorldScale = world.scale;
        world.scale -= delta * 0.03;
        if (world.scale < screenMinScale)
            world.scale = screenMinScale;
        if (lastWorldScale === world.scale)
            return;

        const vecX = clientX - world.x;
        const vecY = clientY - world.y;
        world.x -= (vecX * world.scale / lastWorldScale - vecX);
        world.y -= (vecY * world.scale / lastWorldScale - vecY);

        updateLocation();
    }

    function onPinchZoomBegin(p0, p1) {
        const dx = p1.clientX - p0.clientX;
        const dy = p1.clientY - p0.clientY;
        const curLen = Math.sqrt(dx * dx + dy * dy);

        pinchZoomBeginScale = world.scale / curLen;
        pinchZoomBeginX = (Math.min(p1.clientX, p0.clientX) + (Math.abs(dx) - curLen) * 0.5 - world.x) / world.scale;
        pinchZoomBeginY = (Math.min(p1.clientY, p0.clientY) + (Math.abs(dy) - curLen) * 0.5 - world.y) / world.scale;
    }

    function onPinchZoom(p0, p1) {
        const dx = p1.clientX - p0.clientX;
        const dy = p1.clientY - p0.clientY;
        const curLen = Math.sqrt(dx * dx + dy * dy);

        world.scale = curLen * pinchZoomBeginScale;
        if (world.scale < screenMinScale)
            world.scale = screenMinScale;

        world.x = Math.min(p1.clientX, p0.clientX) + (Math.abs(dx) - curLen) * 0.5 - pinchZoomBeginX * world.scale;
        world.y = Math.min(p1.clientY, p0.clientY) + (Math.abs(dy) - curLen) * 0.5 - pinchZoomBeginY * world.scale;

        updateLocation();
    }

    function calculateGeneration() {
        let timer = window.performance.now();
        const needChange = chunkManager.calculateGeneration();
        timer = window.performance.now() - timer;
        const generationCount = chunkManager.getGenerationCount();
        generationCounter.textContent = generationCount.toString();

        // Update canvas
        const viewWidth = playground.width;
        const viewHeight = playground.height;
        const chunkPixelWidth = world.scale * chunkWidth;
        const chunkPixelHeight = world.scale * chunkHeight;
        const chunkCountX = (viewWidth / chunkPixelWidth | 0) + 2;
        const chunkCountY = (viewHeight / chunkPixelHeight | 0) + 2;
        const startX = ((-world.x / world.scale / chunkWidth | 0) - (world.x < 0 ? 0 : 1));
        const startY = ((-world.y / world.scale / chunkHeight | 0) - (world.y < 0 ? 0 : 1));
        for (const chunk of needChange) {
            chunk.renderChange(
                startX, startY,
                chunk.x >= startX && chunk.x < startX + chunkCountX && chunk.y >= startY && chunk.y < startY + chunkCountY,
                generationCount
            );
        }
        updateMainCanvas(chunkCountX, chunkCountY, chunkPixelWidth, chunkPixelHeight);

        calculateTeam();
        minMap.updateMiniMap();

        // renderAllChunks();

        calculateTime.innerText = timer.toFixed(1) + 'ms';
        calculateCount.innerText = chunkManager.calculateCount.toString();
    }

    function renderAllChunks() {
        const viewWidth = playground.width;
        const viewHeight = playground.height;
        const chunkPixelWidth = world.scale * chunkWidth;
        const chunkPixelHeight = world.scale * chunkHeight;
        const chunkCountX = (viewWidth / chunkPixelWidth | 0) + 2;
        const chunkCountY = (viewHeight / chunkPixelHeight | 0) + 2;
        const startX = ((-world.x / world.scale / chunkWidth | 0) - (world.x < 0 ? 0 : 1));
        const startY = ((-world.y / world.scale / chunkHeight | 0) - (world.y < 0 ? 0 : 1));

        buffFrame.canvas.width = chunkCountX * chunkWidth;
        buffFrame.canvas.height = chunkCountY * chunkHeight;
        buffFrame.imageSmoothingEnabled = false;
        buffFrame.fillStyle = cellStateColors[0].toString();
        buffFrame.fillRect(0, 0, buffFrame.canvas.width, buffFrame.canvas.height);
        chunkManager.renderChunksInRange(startX, startY, chunkCountX, chunkCountY);

        minMap.setLocation(startX + 1, startY + 1, chunkCountX - 2, chunkCountY - 2);

        updateMainCanvas(chunkCountX, chunkCountY, chunkPixelWidth, chunkPixelHeight);
        // console.time('renderAllChunks');

        // console.timeEnd('renderAllChunks');
        // debug();
    }

    /**
     * @param {int} [chunkCountX]
     * @param {int} [chunkCountY]
     * @param {int} [chunkPixelWidth]
     * @param {int} [chunkPixelHeight]
     */
    function updateMainCanvas(chunkCountX, chunkCountY, chunkPixelWidth, chunkPixelHeight) {
        const viewWidth = playground.width;
        const viewHeight = playground.height;
        if (chunkCountX === undefined) {
            chunkPixelWidth = world.scale * chunkWidth;
            chunkPixelHeight = world.scale * chunkHeight;
            chunkCountX = (viewWidth / chunkPixelWidth | 0) + 2;
            chunkCountY = (viewHeight / chunkPixelHeight | 0) + 2;
        }

        canvas.imageSmoothingEnabled = false;
        canvas.drawImage(buffFrame.canvas,
            world.x % chunkPixelWidth - (world.x < 0 ? 0 : chunkPixelWidth), world.y % chunkPixelHeight - (world.y < 0 ? 0 : chunkPixelHeight),
            chunkCountX * chunkWidth * world.scale, chunkCountY * chunkHeight * world.scale
        );

        // Draw grid
        if (world.scale > drawLineScreenScale) {
            canvas.lineWidth = cellWallSize;
            canvas.strokeStyle = strokeStyle;
            canvas.beginPath();

            const lStartX = world.x % world.scale;
            const lStartY = world.y % world.scale;
            for (let y = 0; y < viewHeight + world.scale; y += world.scale) {
                canvas.moveTo(0, lStartY + y);
                canvas.lineTo(viewWidth, lStartY + y);
            }
            for (let x = 0; x < viewWidth + world.scale; x += world.scale) {
                canvas.moveTo(lStartX + x, 0);
                canvas.lineTo(lStartX + x, viewHeight);
            }
            canvas.stroke();
        }
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
            playground.width = gameWindow.offsetWidth;
            playground.height = gameWindow.offsetHeight;
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

function userInteractionManager(targetElement, onPress, onDragEnd, onDrag, onMove, onClick, onRelease, onZoom, onPinchZoomBegin, onPinchZoom) {
    const eventPrefixMap = {
        pointerdown: 'MSPointerDown',
        pointerup: 'MSPointerUp',
        pointercancel: 'MSPointerCancel',
        pointermove: 'MSPointerMove',
        pointerover: 'MSPointerOver',
        pointerout: 'MSPointerOut',
        pointerenter: 'MSPointerEnter',
        pointerleave: 'MSPointerLeave',
        gotpointercapture: 'MSGotPointerCapture',
        lostpointercapture: 'MSLostPointerCapture',
        maxTouchPoints: 'msMaxTouchPoints',
    };

    const moveTimeThreshold = 500;
    const moveThreshold = 6;

    let eventPointerId = -1;

    // Pinch zoom
    const pointerStart = new Map();
    const pointers = new Map();
    let pinchZooming = false;

    // Right click menu
    window.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });

    if ('TouchEvent' in window) {
        targetElement.addEventListener('touchstart', function (event) {
            event.preventDefault();
        });
    }

    if ('PointerEvent' in window) {
        targetElement.addEventListener('pointerdown', onClickDown);
        window.addEventListener('pointerup', onClickUp);
        window.addEventListener('pointermove', onClickMove);
    } else if (window.navigator && 'msPointerEnabled' in window.navigator) {
        // IE 10
        targetElement.addEventListener(eventPrefixMap.pointerdown, onClickDown);
        window.addEventListener(eventPrefixMap.pointerup, onClickUp);
        window.addEventListener(eventPrefixMap.pointermove, onClickMove);
    } else {
        targetElement.addEventListener('mousedown', onClickDown);
        window.addEventListener('mouseup', onClickUp);
        window.addEventListener('mousemove', onClickMove);
    }

    // Click down
    function onClickDown(event) {
        let pointerId;
        if (window.PointerEvent && event instanceof window.PointerEvent) {
            pointerId = event.pointerId;
        } else {
            pointerId = -1;
        }
        const continueMove = pointerStart.get(pointerId);
        event.moved = false;
        if (!continueMove) {
            pointerStart.set(pointerId, event);
            event.pinchZoom = false;
        }
        pointers.set(pointerId, event);

        // Pointer button
        const button = continueMove ? continueMove.button : event.button;
        if (button === 0) {
            onPress(event.clientX, event.clientY);
        }

        event.preventDefault();

        console.log('dn', event.pointerType);
    }


    // Move
    function onClickMove(event) {
        let pointerId;
        if (window.PointerEvent && event instanceof window.PointerEvent) {
            pointerId = event.pointerId;
        } else {
            pointerId = -1;
        }
        const havePointerPress = pointerStart.get(pointerId);
        if (havePointerPress) {
            const pointerEvent = pointers.get(pointerId);
            event.moved = pointerEvent.moved;
            event.pinchZoom = pointerEvent.pinchZoom;
            pointers.set(pointerId, event);
        }
        if (pointers.size === 2) {
            pinchZoom();
            return;
        }

        const clientX = event.clientX, clientY = event.clientY;
        if (!havePointerPress) {
            onMove(clientX, clientY);
            // console.log('move');
        } else if (!event.pinchZoom &&
            (eventPointerId === -1 || event.pointerId === eventPointerId) &&
            (event.moved || isPointerMove(havePointerPress, event))) {
            // Dragging
            eventPointerId = event.pointerId;
            event.moved = true;
            onDrag(clientX, clientY);
        }

        event.preventDefault();

        // console.log('mv', pointerType);
    }


    // Release
    function onClickUp(event) {
        let pointerId;
        if (window.PointerEvent && event instanceof window.PointerEvent) {
            pointerId = event.pointerId;
        } else {
            pointerId = -1;
        }
        const havePointerPress = pointerStart.has(pointerId);
        const pointerEvent = havePointerPress ? pointers.get(pointerId) : null;
        pointerStart.delete(pointerId);
        pointers.delete(pointerId);

        const clientX = event.clientX, clientY = event.clientY;
        // Drag
        if (havePointerPress) {
            if (!pointerEvent.pinchZoom)
                if (pointerEvent.moved)
                    onDragEnd(clientX, clientY);
                else
                    onClick(clientX, clientY);
        } else
            onRelease(clientX, clientY);

        event.preventDefault();

        console.log('up', event.pointerType);

        if (event.pointerId === eventPointerId)
            eventPointerId = -1;

        if (pinchZooming) {
            pinchZooming = false;
            pinchZoomEnd();
        }
    }

    targetElement.onwheel = function (event) {
        onZoom(event.clientX, event.clientY, event.deltaY);
        event.preventDefault();
    };

    // Pinch zoom
    function pinchZoom() {
        const valuesIterator = pointers.values();
        const p0 = valuesIterator.next().value;
        const p1 = valuesIterator.next().value;
        // console.log(p0, p1);

        if (!pinchZooming && (
            isPointerMove(pointerStart.get(p0.pointerId), p0) ||
            isPointerMove(pointerStart.get(p1.pointerId), p1))) {
            p0.pinchZoom = true;
            p1.pinchZoom = true;
            onPinchZoomBegin(p0, p1);
            pinchZooming = true;
            // console.log('Zoom start');
        } else if (pinchZooming) {
            onPinchZoom(p0, p1);
        }
    }

    function pinchZoomEnd() {
        if (pointers.size > 0) {
            const pointer = pointers.values().next().value;
            onClickDown(pointer);
        }
        // console.log('Zoom end');
    }

    function isPointerMove(pointerStart, pointer) {
        const dx = pointer.clientX - pointerStart.clientX;
        const dy = pointer.clientY - pointerStart.clientY;
        return Math.sqrt(dx * dx + dy * dy) > moveThreshold ||
            pointer.timeStamp - pointerStart.timeStamp > moveTimeThreshold;
    }
}