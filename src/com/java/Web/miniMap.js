/**
 * @param {Color[]} teamColors
 * @param world
 * @param {ChunkManager} chunkManager
 * @constructor
 */
function MiniMap(teamColors, world, chunkManager) {
    this.miniMapElement = document.createElement('div');
    this.miniMapElement.className = 'miniMap';
    // Canvas
    const miniMap = document.createElement('canvas');
    const canvas = miniMap.getContext('2d');
    // Location text
    const locationView = document.createElement('span');
    locationView.className = 'location';

    let miniMapWidth, miniMapHeight;
    let mapScale;

    const maxPixNum = 100;
    const threshold = 2;
    const refreshRate = 30;

    let chunkX = 0, chunkY = 0;
    let chunkXC = 0, chunkYC = 0;

    let miniMapRefreshTime = 0;

    this.miniMapElement.appendChild(locationView);
    this.miniMapElement.appendChild(miniMap);
    setMiniMapSize(100, 100, 1);

    function toNormalScale() {
        setMiniMapSize(100, 100, 1);
        refreshMiniMap();
    }

    miniMap.onmouseout = toNormalScale;

    miniMap.onmouseover = function () {
        setMiniMapSize(400, 400, 2);
        refreshMiniMap();
    };

    function setMiniMapSize(width, height, scale) {
        miniMapWidth = miniMap.width = width;
        miniMapHeight = miniMap.height = height;
        mapScale = scale;
    }

    this.updateMiniMap = function (force) {
        if (miniMapRefreshTime > refreshRate || force) {
            miniMapRefreshTime = 0;
            refreshMiniMap();
        } else
            miniMapRefreshTime++;
    }

    this.updateLocationText = function (event) {
        if (!event)
            locationView.innerText = '座標: 0,0';
        else {
            const x = (event.clientX - world.x) / world.scale;
            const y = (event.clientY - world.y) / world.scale;
            locationView.innerText = '座標: ' + (x - (x < 0) | 0) + ',' + (y - (y < 0) | 0);
        }
    }

    this.setLocation = function (x, y, xc, yc) {
        chunkX = x;
        chunkY = y;
        chunkXC = xc;
        chunkYC = yc;
    }

    function refreshMiniMap() {
        // fill background
        canvas.fillStyle = teamColors[0].toString();
        canvas.fillRect(0, 0, miniMapWidth, miniMapHeight);

        const chunkCountX = miniMapWidth / mapScale;
        const chunkCountY = miniMapHeight / mapScale;
        const chunkStartX = (chunkX - chunkCountX / 2 + chunkXC / 2) | 0;
        const chunkStartY = (chunkY - chunkCountY / 2 + chunkYC / 2) | 0;
        for (const chunk of chunkManager.getChunkRange(chunkStartX, chunkStartY, chunkCountX, chunkCountY)) {
            const teamAc = chunk.teamsCount[0];
            const teamBc = chunk.teamsCount[1];

            let scale, color;
            if (teamAc > threshold && teamAc > teamBc) {
                scale = (teamAc + 20) / maxPixNum;
                color = teamColors[1];
            } else if (teamBc > threshold && teamBc > teamAc) {
                scale = (teamBc + 20) / maxPixNum;
                color = teamColors[2];
            } else
                continue;
            if (scale > 1)
                scale = 1;
            canvas.fillStyle = 'rgb(' + color.r * scale + ',' + color.g * scale + ',' + color.b * scale + ')';
            canvas.fillRect((chunk.x - chunkStartX) * mapScale, (chunk.y - chunkStartY) * mapScale, mapScale, mapScale);
        }

        //視野
        canvas.lineWidth = 1;
        canvas.strokeStyle = 'rgb(255,10,0)';
        canvas.beginPath();
        const x = ((chunkCountX / 2 - chunkXC / 2) * mapScale + 0.5) | 0;
        const y = ((chunkCountY / 2 - chunkYC / 2) * mapScale + 0.5) | 0;
        canvas.rect(x, y, chunkXC * mapScale, chunkYC * mapScale);
        canvas.stroke();
    }
}