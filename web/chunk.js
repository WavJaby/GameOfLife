'use strict';

/**
 * @param locX
 * @param locY
 * @param chunkWidth
 * @param chunkHeight
 * @param worldTime
 * @param world
 * @param {ChunkManager} chunkManager
 * @constructor
 */
function Chunk(locX, locY, chunkWidth, chunkHeight, worldTime, world, chunkManager) {
    const thisInstance = this;
    const canvasElement = document.createElement('canvas');
    const chunkCanvas = canvasElement.getContext('2d');
    canvasElement.width = chunkWidth;
    canvasElement.height = chunkHeight;

    const teamsCount = chunkManager.teamCount;
    this.teamsCount = new Uint8Array(teamsCount.length);
    //記錄整個chunk
    const chunkMap = this.chunkMap = new Array(chunkWidth);
    //紀錄每個cell旁邊有幾個
    const cellData = this.cellData = new Array(chunkWidth);
    //附近有東西的cell
    const activeCellList = [];
    let activeLength = 0;
    //要更改的cell
    const changeList = [];

    this.cellDataCount = 0;
    this.x = locX;
    this.y = locY;
    let chunkTime = worldTime;
    let thisCount = 0;

    for (let x = 0; x < chunkWidth; x++) {
        chunkMap[x] = new Uint8Array(chunkHeight);
        cellData[x] = new Uint8Array(chunkHeight);
    }


    //user改變cells
    this.addCells = function (changeList, canvas, teamID) {
        const worldX = (world.x + 0.5) | 0;
        const worldY = (world.y + 0.5) | 0;
        const chunkStartX = locX * world.scale * chunkWidth + worldX;
        const chunkStartY = locY * world.scale * chunkHeight + worldY;

        let offset, size;
        if (world.scale > drawLineScreenScale) {
            offset = cellWallSize * 0.5;
            size = world.scale - cellWallSize;
        } else {
            offset = 0;
            size = world.scale;
        }

        for (const i of changeList) {
            const state = chunkMap[i[0]][i[1]];
            if (state === 0)
                chunkCanvas.fillStyle = canvas.fillStyle = cellStateColors[teamID + 1].toString();
            else
                chunkCanvas.fillStyle = canvas.fillStyle = cellStateColors[0].toString();

            chunkCanvas.fillRect(i[0], i[1], 1, 1);
            canvas.fillRect((chunkStartX + world.scale * i[0] + offset) | 0, (chunkStartY + world.scale * i[1] + offset) | 0, size, size);

            // 告訴鄰居
            // x, y
            if (state === 0) {
                teamsCount[teamID]++;
                this.teamsCount[teamID]++;
                chunkMap[i[0]][i[1]] = teamID + 1;
                calculateCellData(i[0], i[1], true);
            } else {
                teamsCount[0]--;
                this.teamsCount[0]--;
                chunkMap[i[0]][i[1]] = 0;
                calculateCellData(i[0], i[1], false);
            }
            addActiveCell(i[0], i[1]);
        }
    }

    this.setCellsColor = function (changeList, canvas) {
        const worldX = (world.x + 0.5) | 0;
        const worldY = (world.y + 0.5) | 0;
        const chunkStartX = locX * world.scale * chunkWidth + worldX;
        const chunkStartY = locY * world.scale * chunkHeight + worldY;

        let offset, size;
        if (world.scale > drawLineScreenScale) {
            offset = cellWallSize * 0.5;
            size = world.scale - cellWallSize;
        } else {
            offset = 0;
            size = world.scale;
        }

        for (const i of changeList) {
            const orgState = chunkMap[i[0]][i[1]];
            const state = i[2];
            if (orgState === state) continue;
            chunkCanvas.fillStyle = canvas.fillStyle = cellStateColors[state].toString();

            chunkCanvas.fillRect(i[0], i[1], 1, 1);
            canvas.fillRect((chunkStartX + world.scale * i[0] + offset) | 0, (chunkStartY + world.scale * i[1] + offset) | 0, size, size);

            // 告訴鄰居
            // x, y
            if (state === 0) {
                if (orgState > 0) {
                    teamsCount[orgState - 1]--;
                    this.teamsCount[orgState - 1]--;
                    chunkMap[i[0]][i[1]] = 0;
                    calculateCellData(i[0], i[1], false);
                }
            } else {
                if (orgState > 0) {
                    teamsCount[orgState - 1]--;
                    this.teamsCount[orgState - 1]--;
                }
                teamsCount[state - 1]++;
                this.teamsCount[state - 1]++;
                chunkMap[i[0]][i[1]] = state;
                if (orgState === 0)
                    calculateCellData(i[0], i[1], true);
            }
            addActiveCell(i[0], i[1]);
        }
    }

    this.addActiveCell = addActiveCell;

    function addActiveCell(x, y) {
        const index = x + y * chunkWidth;

        if (activeLength === 0 || activeCellList.lastIndexOf(index, activeLength - 1) === -1)
            activeCellList[activeLength++] = x + y * chunkWidth;
    }

    function removeAliveCell(index) {
        if (index !== --activeLength)
            activeCellList[index] = activeCellList[activeLength];
    }

    this.getAliveCells = function () {
        return activeCellList.filter((v, i) => i < activeLength).map(loc => [loc % chunkWidth, loc / chunkWidth | 0]);
    }

    this.calculateChange = function (worldTime) {
        changeList.length = 0;

        if (thisInstance.cellDataCount === 0) {
            chunkManager.unloadChunk(locX, locY);
            return;
        }

        for (let i = 0; i < activeLength; i++) {
            const cell = activeCellList[i];
            const aliveX = cell % chunkWidth;
            const aliveY = cell / chunkWidth | 0;
            const count = cellData[aliveX][aliveY];
            const team = chunkMap[aliveX][aliveY];

            //地圖邊緣
            if (locY > maxChunkY || locX > maxChunkX || locX < minChunkX || locY < minChunkY) {
                //活的細胞全部殺
                if (team > 0)
                    changeList.push([aliveX, aliveY, 0]);
                continue;
            }

            //現在是活的細胞
            if (team > 0) {
                // 生命數量稀少或過多要死亡
                if (count < 2 || count > 3)
                    changeList.push([aliveX, aliveY, 0]);
            }
            //現在是死的細胞
            else {
                //繁殖
                if (count === 3)
                    changeList.push([aliveX, aliveY, 0]);
            }

            //移除不需要計算的細胞
            if (team === 0 && count !== 3 ||
                team > 0 && (count === 2 || count === 3)
            ) {
                removeAliveCell(i);
                i--;
            }

        }
        //TODO this is for debug
        thisCount += activeLength;

        // Nothing to change, update chunk time to world time
        if (changeList.length === 0 && chunkTime + 1 === worldTime)
            chunkTime = worldTime;

        return changeList.length > 0;
    }

    this.calculateChunk = function () {
        // Cell state change list
        for (const i of changeList) {
            const x = i[0], y = i[1];
            const state = chunkMap[x][y];
            // Change to dead state
            if (state === 0) {
                const team = calculateCellData(x, y, true, true);
                i[2] = team + 1;
                teamsCount[team]++;
                this.teamsCount[team]++;
            } else {
                calculateCellData(x, y, false);
                teamsCount[state - 1]--;
                this.teamsCount[state - 1]--;
            }
        }
        //TODO this is for debug
        thisCount += changeList.length;
    }

    this.renderChange = function (render, worldTime, canvas) {
        const worldX = (world.x + 0.5) | 0;
        const worldY = (world.y + 0.5) | 0;
        const chunkStartX = locX * world.scale * chunkWidth + worldX;
        const chunkStartY = locY * world.scale * chunkHeight + worldY;

        let offset, size;
        if (world.scale > drawLineScreenScale) {
            offset = cellWallSize * 0.5;
            size = world.scale - cellWallSize;
        } else {
            offset = 0;
            size = world.scale;
        }

        for (const i of changeList) {
            const team = chunkMap[i[0]][i[1]] = i[2];
            if (render) {
                chunkCanvas.fillStyle = canvas.fillStyle = cellStateColors[team].toString();
                canvas.fillRect((chunkStartX + world.scale * i[0] + offset) | 0, (chunkStartY + world.scale * i[1] + offset) | 0, size, size);
                chunkCanvas.fillRect(i[0], i[1], 1, 1);
            }
        }
        if (render && chunkTime + 1 === worldTime)
            chunkTime = worldTime;
    }

    /**
     * @param {int} cellX
     * @param {int} cellY
     * @param {boolean} state
     * @param {boolean} [calculateTeam]
     * @return {number|undefined}
     */
    function calculateCellData(cellX, cellY, state, calculateTeam) {
        let summonTeamCount;
        if (calculateTeam)
            summonTeamCount = new Uint32Array(teamsCount.length);

        // 8 cell around
        for (let j = 0; j < 8; j++) {
            let x, y;
            if (j < 3) {
                x = j - 1;
                y = -1;
            } else if (j < 5) {
                x = (j - 3) * 2 - 1;
                y = 0;
            } else {
                x = j - 6;
                y = 1;
            }
            x += cellX;
            y += cellY;

            //有在chunk內
            if (x > -1 && x < chunkWidth &&
                y > -1 && y < chunkHeight) {
                let nowCell;
                //活的
                if (state) {
                    nowCell = ++cellData[x][y];
                    thisInstance.cellDataCount++;
                } else {
                    nowCell = --cellData[x][y];
                    thisInstance.cellDataCount--;
                }

                //加入關注列表
                const lastCell = chunkMap[x][y];
                if ((lastCell === 0 && nowCell === 3) || (lastCell > 0 && (nowCell < 2 || nowCell > 3))) {
                    addActiveCell(x, y);
                }

                //要生成的話
                if (calculateTeam && lastCell > 0)
                    summonTeamCount[lastCell - 1]++;
            } else {
                //計算chunk和cell的xy位置
                let cx = locX;
                let cy = locY;
                if (x < 0) {
                    cx--;
                    x += chunkWidth;
                } else if (x === chunkWidth) {
                    cx++;
                    x -= chunkWidth;
                }
                if (y < 0) {
                    cy--;
                    y += chunkHeight;
                } else if (y === chunkHeight) {
                    cy++;
                    y -= chunkHeight;
                }

                //load chunk
                let nextChunk = chunkManager.getChunk(cx, cy);

                //活的
                let nowCell;
                //活的
                if (state > 0) {
                    nowCell = ++nextChunk.cellData[x][y];
                    nextChunk.cellDataCount++;
                } else {
                    nowCell = --nextChunk.cellData[x][y];
                    nextChunk.cellDataCount--;
                }

                //加入關注列表
                const lastCell = nextChunk.chunkMap[x][y];
                if ((lastCell === 0 && nowCell === 3) || (lastCell > 0 && (nowCell < 2 || nowCell > 3))) {
                    nextChunk.addActiveCell(x, y);
                }

                //要生成的話
                if (calculateTeam && lastCell > 0)
                    summonTeamCount[lastCell - 1]++;
            }
        }
        //TODO this is for debug
        thisCount += 8;

        if (calculateTeam) {
            let index = -1;
            let max = summonTeamCount[0];
            let equalList = null;

            for (let i = 1; i < summonTeamCount.length; i++)
                // Check if all team count is equal
                if (index === -1 && summonTeamCount[i] < max)
                    index = 0;
                // Find max Team count
                else if (summonTeamCount[i] > max) {
                    max = summonTeamCount[i];
                    index = i;
                }
                // Add team to equal list
                else if (summonTeamCount[i] === max) {
                    if (equalList == null) equalList = [];
                    equalList.push(i);
                }
            if (index === -1)
                return equalList[(Math.random() * equalList.length) | 0];
            return index;
        }
    }

    //更新整個chunk
    this.drawChunk = function (worldTime, canvas) {
        const chunkStartX = locX * world.scale * chunkWidth + (world.x + 0.5 | 0);
        const chunkStartY = locY * world.scale * chunkHeight + (world.y + 0.5 | 0);
        const realChunkWidth = ((chunkWidth * world.scale * 100) | 0) / 100;
        const realChunkHeight = ((chunkHeight * world.scale * 100) | 0) / 100;

        if (chunkTime !== worldTime) {
            chunkTime = worldTime;
            chunkCanvas.clearRect(0, 0, chunkWidth, chunkHeight);
            for (let i = 0; i < chunkWidth; i++) {
                for (let j = 0; j < chunkHeight; j++) {
                    const team = chunkMap[i][j];
                    if (team === 0) continue;
                    chunkCanvas.fillStyle = cellStateColors[team].toString();
                    //fill square
                    chunkCanvas.fillRect(i, j, 1, 1);
                }
            }
        }
        canvas.drawImage(canvasElement, chunkStartX, chunkStartY, realChunkWidth, realChunkHeight);
    }

    this.getCount = function () {
        const c = thisCount;
        thisCount = 0;
        return c;
    }

    function printCellData() {
        for (let y = 0; y < chunkHeight; y++) {
            let str = '';
            for (let x = 0; x < chunkWidth; x++) {
                str += cellData[x][y] + ',';
            }
            console.log(str);
        }
    }

    function printMapData() {
        for (let y = 0; y < chunkHeight; y++) {
            let str = '';
            for (let x = 0; x < chunkWidth; x++) {
                str += chunkMap[x][y] + ',';
            }
            console.log(str);
        }
    }
}