let miniMapWidth;
let miniMapHeight;
let miniMapCanvas;

let backgroundColor, teamAColor, teamBColor;
let chunkWidthSize, chunkHeightSize;

let maxPixNum;
const threshold = 2;
const refreshRate = 30;
let miniMapRefreshTime = 0;


function loadMiniMap(homeChunk) {
    const miniMap = document.getElementById('miniMap');
    miniMapCanvas = miniMap.getContext('2d');

    miniMapWidth = 100;
    miniMapHeight = 100;
    miniMapCanvas.canvas.width = miniMapWidth;
    miniMapCanvas.canvas.height = miniMapHeight;

    miniMapCanvas.globalAlpha = 0.8;
    backgroundColor = homeChunk.deadPixel;

    //取顏色
    teamAColor = homeChunk.alivePixelA.replace('rgb(', '').replace(')', '');
    teamAColor = teamAColor.split(',');
    for (const i in teamAColor)
        teamAColor[i] = parseInt(teamAColor[i]);
    teamBColor = homeChunk.alivePixelB.replace('rgb(', '').replace(')', '');
    teamBColor = teamBColor.split(',');
    for (const i in teamBColor)
        teamBColor[i] = parseInt(teamBColor[i]);

    maxPixNum = 50;

    miniMap.onmouseover = () => {
        miniMapWidth *= 4;
        miniMapHeight *= 4;
        mapScale *= 2;
        miniMapCanvas.canvas.width = miniMapWidth;
        miniMapCanvas.canvas.height = miniMapHeight;
        miniMap.style.width = miniMapWidth + 'px';
        miniMap.style.height = miniMapHeight + 'px';
        requestAnimationFrame(refreshMiniMap);
    }

    miniMap.onmouseout = () => {
        miniMapWidth /= 4;
        miniMapHeight /= 4;
        mapScale /= 2;
        miniMapCanvas.canvas.width = miniMapWidth;
        miniMapCanvas.canvas.height = miniMapHeight;
        miniMap.style.width = miniMapWidth + 'px';
        miniMap.style.height = miniMapHeight + 'px';
        miniMapCanvas.globalAlpha = 0.8;
        requestAnimationFrame(refreshMiniMap);
    }

    updateMiniMap(true);
}

function updateMiniMap(need) {
    if (miniMapRefreshTime < refreshRate && need !== true) {
        miniMapRefreshTime++;
        return;
    } else {
        miniMapRefreshTime = 0;
    }

    requestAnimationFrame(refreshMiniMap);
}

let mapScale = 1;

function refreshMiniMap() {
    chunkWidthSize = cWidth * realPixelSize;
    chunkHeightSize = cHeight * realPixelSize;

    let width = miniMapWidth / mapScale;
    let height = miniMapHeight / mapScale;

    //重設背景
    miniMapCanvas.clearRect(0, 0, miniMapWidth, miniMapHeight);
    miniMapCanvas.fillStyle = backgroundColor;
    miniMapCanvas.fillRect(0, 0, miniMapWidth, miniMapHeight);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const chunk = chunks[(lastChunkX + x - width / 2 | 0) + ',' + (lastChunkY + y - height / 2 | 0)];
            if (chunk !== undefined) {
                const teamAc = chunk.teamACount;
                const teamBc = chunk.teamBCount;

                let r, g, b;
                if (teamAc > threshold && teamAc > teamBc) {
                    let scale = (teamAc + 20) / maxPixNum;
                    r = teamAColor[0] * scale;
                    g = teamAColor[1] * scale;
                    b = teamAColor[2] * scale;
                } else if (teamBc > threshold && teamBc > teamAc) {
                    let scale = (teamBc + 20) / maxPixNum;
                    r = teamBColor[0] * scale;
                    g = teamBColor[1] * scale;
                    b = teamBColor[2] * scale;
                } else {
                    continue;
                }

                miniMapCanvas.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
                miniMapCanvas.fillRect(x * mapScale, y * mapScale, mapScale, mapScale);
            }
        }
    }

    //現在的視野
    miniMapCanvas.beginPath();
    miniMapCanvas.lineWidth = '1';
    miniMapCanvas.strokeStyle = 'rgb(255,10,0)';
    const viewWidth = ((canvas.canvas.width / chunkWidthSize)) * mapScale;
    const viewHeight = ((canvas.canvas.height / chunkHeightSize)) * mapScale;
    miniMapCanvas.rect(miniMapWidth / 2 - viewWidth / 2, miniMapHeight / 2 - viewHeight / 2, viewWidth, viewHeight);
    miniMapCanvas.stroke();
}