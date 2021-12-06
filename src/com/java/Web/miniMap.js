function MiniMap(colors, canvas) {
    const miniMapWidth = 100;
    const miniMapHeight = 100;
    const canvasScale = 3;
    let mapScale = 1;
    const maxPixNum = 50;
    const threshold = 2;
    const refreshRate = 30;

    let miniMapCanvas;
    let chunkWidthSize, chunkHeightSize;

    let miniMapRefreshTime = 0;

    const miniMap = document.getElementById('miniMap');
    miniMapCanvas = miniMap.getContext('2d');
    miniMapCanvas.canvas.width = miniMapWidth;
    miniMapCanvas.canvas.height = miniMapHeight;
    miniMapCanvas.globalAlpha = 0.8;

    miniMap.onmouseover = () => {
        mapScale = 3;
        miniMapCanvas.canvas.width = miniMapWidth * canvasScale;
        miniMapCanvas.canvas.height = miniMapHeight * canvasScale;
        miniMap.style.width = miniMapWidth * canvasScale + 'px';
        miniMap.style.height = miniMapHeight * canvasScale + 'px';
        requestAnimationFrame(refreshMiniMap);
    }

    miniMap.onmouseout = () => {
        mapScale = 1;
        miniMapCanvas.canvas.width = miniMapWidth;
        miniMapCanvas.canvas.height = miniMapHeight;
        miniMap.style.width = miniMapWidth + 'px';
        miniMap.style.height = miniMapHeight + 'px';
        miniMapCanvas.globalAlpha = 0.8;
        requestAnimationFrame(refreshMiniMap);
    }

    this.updateMiniMap = function (need) {
        if (miniMapRefreshTime < refreshRate && need !== true) {
            miniMapRefreshTime++;
            return;
        } else {
            miniMapRefreshTime = 0;
        }

        requestAnimationFrame(refreshMiniMap);
    }

    let chunkX = 0, chunkY = 0;
    this.setLocation = function (x, y, xc, yc) {
        chunkX = x + xc / 2;
        chunkY = y + yc / 2;
    }

    function refreshMiniMap() {
        const width = miniMapWidth * mapScale;
        const height = miniMapHeight * mapScale;
        const canvasWidth = miniMapCanvas.canvas.width;
        const canvasHeight = miniMapCanvas.canvas.height;

        //重設背景
        miniMapCanvas.clearRect(0, 0, canvasWidth, canvasHeight);
        miniMapCanvas.fillStyle = colors[0];
        miniMapCanvas.fillRect(0, 0, canvasWidth, canvasHeight);

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let chunk = chunks[(chunkX + x - width / mapScale / 2) | 0];
                if (chunk === undefined) continue;
                chunk = chunk[(chunkY + y - height / mapScale / 2) | 0]
                if (chunk === undefined) continue;

                const teamAc = chunk.teams[0];
                const teamBc = chunk.teams[1];

                let r, g, b;
                if (teamAc > threshold && teamAc > teamBc) {
                    let scale = (teamAc + 20) / maxPixNum;
                    r = colors[1].r * scale;
                    g = colors[1].g * scale;
                    b = colors[1].b * scale;
                } else if (teamBc > threshold && teamBc > teamAc) {
                    let scale = (teamBc + 20) / maxPixNum;
                    r = colors[2].r * scale;
                    g = colors[2].g * scale;
                    b = colors[2].b * scale;
                } else {
                    continue;
                }

                miniMapCanvas.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
                miniMapCanvas.fillRect(x * mapScale, y * mapScale, mapScale, mapScale);
            }
        }

        //現在的視野
        chunkWidthSize = chunkWidth * realPixelSize;
        chunkHeightSize = chunkHeight * realPixelSize;
        miniMapCanvas.lineWidth = '1';
        miniMapCanvas.strokeStyle = 'rgb(255,10,0)';
        const viewWidth = ((canvas.width / chunkWidthSize)) * mapScale;
        const viewHeight = ((canvas.height / chunkHeightSize)) * mapScale;
        miniMapCanvas.beginPath();
        miniMapCanvas.rect(canvasWidth / 2 - viewWidth / 2, canvasHeight / 2 - viewHeight / 2, viewWidth, viewHeight);
        miniMapCanvas.stroke();
    }
}