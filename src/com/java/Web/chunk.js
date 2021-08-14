class Chunk {
    chunkWidth = 16;
    chunkHeight = 16;
    deadPixel = 'rgb(10, 10, 10)';
    // deadPixel = 'rgb(200, 200, 200)';
    teamAID = 1;
    alivePixelA = 'rgb(0, 200, 200)';
    teamBID = 2;
    alivePixelB = 'rgb(200, 200, 200)';
    // alivePixelB = 'rgb(10, 10, 10)';
    //記錄整個chunk
    chunkMap = [];
    //紀錄每個cell旁邊有幾個
    cellData = [];
    //舊的cell data
    oldCellData = [];
    //附近有東西的cell
    alivePixelList = [];
    //要更改的cell
    changeList = [];
    //本來是活的
    beforeChange = [];

    count = 0;
    isAllZero = false;

    chunkAliveCount = 0;
    teamACount = 0;
    teamBCount = 0;

    constructor(locX, locY) {
        this.locX = locX;
        this.locY = locY;

        this.canvasElement = document.createElement('canvas');
        this.canvas = this.canvasElement.getContext('2d');

        for (let x = 0; x < this.chunkWidth; x++) {
            let yCache = [];
            let yDataCache = [];
            for (let y = 0; y < this.chunkHeight; y++) {
                yCache[y] = 0;
                yDataCache[y] = 0;

                //TODO this is for debug
                this.count++;
            }
            this.chunkMap[x] = yCache;
            this.cellData[x] = yDataCache;
        }
    }

    refreshChunkCanvas() {
        const realWidth = ((this.chunkWidth * realPixelSize * 10) | 0) / 10;
        const realHeight = ((this.chunkHeight * realPixelSize * 10) | 0) / 10;
        this.canvas.canvas.width = realWidth;
        this.canvas.canvas.height = realHeight;
        this.canvasElement.width = realWidth;
        this.canvasElement.height = realHeight;
        // this.canvas.scale(realPixelSize, realPixelSize);
    }

    //user改變cells
    addCells(changeList, canvas, user) {
        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        this.count = 0;
        for (const i of changeList) {
            const team = this.chunkMap[i[0]][i[1]];
            //換顏色
            //死的
            if (team === 0) {
                if (user === this.teamAID) {
                    canvas.fillStyle = this.alivePixelA;
                    this.canvas.fillStyle = this.alivePixelA;
                } else if (user === this.teamBID) {
                    canvas.fillStyle = this.alivePixelB;
                    this.canvas.fillStyle = this.alivePixelB;
                }
                //活的
            } else {
                canvas.fillStyle = this.deadPixel;
                this.canvas.fillStyle = this.deadPixel;
            }

            canvas.fillRect(chunkStartX + realPixelSize * i[0] + cGap / 2,
                chunkStartY + realPixelSize * i[1] + cGap / 2,
                realPixelSize - cGap, realPixelSize - cGap);

            this.canvas.fillRect(realPixelSize * i[0],
                realPixelSize * i[1],
                realPixelSize, realPixelSize);

            //告訴鄰居
            //x, y
            if (team > 0) {
                //計算各自的數量
                if (team === this.teamAID) {
                    teamACount--;
                    this.teamACount--;
                } else if (team === this.teamBID) {
                    teamBCount--;
                    this.teamBCount--;
                }
                this.chunkAliveCount--;

                this.chunkMap[i[0]][i[1]] = 0;
                this.calculateCellData(i[0], i[1], 0);
            } else {
                //計算各自的數量
                if (user === this.teamAID) {
                    teamACount++;
                    this.teamACount++;
                } else if (user === this.teamBID) {
                    teamBCount++;
                    this.teamBCount++;
                }
                this.chunkAliveCount++;

                this.chunkMap[i[0]][i[1]] = user;
                this.calculateCellData(i[0], i[1], 1);
            }

            if (!this.isLocInAliveList(i[0], i[1])) {
                this.alivePixelList.push([i[0], i[1]]);
            }
        }
    }

    //計算所有細胞死活
    calculateChunk() {
        this.changeList = [];
        this.beforeChange = [];
        let isAllZero = true;

        for (let i = 0; i < this.alivePixelList.length; i++) {
            const aliveX = this.alivePixelList[i][0];
            const aliveY = this.alivePixelList[i][1];
            //附近的細胞數
            const count = this.cellData[aliveX][aliveY];
            const team = this.chunkMap[aliveX][aliveY];

            //地圖邊緣
            if (this.locY > maxChunkY || this.locX > maxChunkX || this.locX < minChunkX || this.locY < minChunkY) {
                //活的細胞全部殺
                if (team > 0)
                    this.changeList.push([aliveX, aliveY]);
                continue;
            }


            //現在是活的細胞
            if (team > 0) {
                // 生命數量稀少或過多要死亡
                if (count < 2 || count > 3) {
                    this.changeList.push([aliveX, aliveY]);
                }

                //這個細胞活著
                //紀錄位置
                this.beforeChange.push(aliveX + ',' + aliveY);
                //紀錄是哪一隊的
                this.beforeChange.push(this.chunkMap[aliveX][aliveY]);
            }
            //現在是死的細胞
            else {
                //繁殖
                if (count === 3) {
                    this.changeList.push([aliveX, aliveY]);
                }
            }

            if ((count !== 3 && team === 0 &&
                    aliveX !== 0 && aliveY !== 0 && aliveX !== this.chunkWidth - 1 && aliveY !== this.chunkHeight - 1) ||
                (count === 0 && team === 0)) {
                this.alivePixelList.splice(i, 1);
                i--;
            } else
                isAllZero = false;

            //TODO this is for debug
            this.count++;
        }

        //更新地圖
        for (const i of this.changeList) {
            const team = this.chunkMap[i[0]][i[1]];
            //需要改成死的
            if (team > 0) {
                //計算各自的數量
                if (team === this.teamAID) {
                    teamACount--;
                    this.teamACount--;
                } else if (team === this.teamBID) {
                    teamBCount--;
                    this.teamBCount--;
                }
                this.chunkAliveCount--;

                this.chunkMap[i[0]][i[1]] = 0;
                this.calculateCellData(i[0], i[1], 0);
            } else {
                const team = this.calculateCellData(i[0], i[1], 1, true);
                this.chunkMap[i[0]][i[1]] = team;
                //計算各自的數量
                if (team === this.teamAID) {
                    teamACount++;
                    this.teamACount++;
                } else if (team === this.teamBID) {
                    teamBCount++;
                    this.teamBCount++;
                }
                this.chunkAliveCount++;
            }
        }

        //unload chunk如果沒用
        if (isAllZero)
            this.isAllZero = true;
        if (this.isAllZero && isAllZero && needChangeChunk.indexOf(this.locX + ',' + this.locY) === -1)
            unloadChunk(this.locX, this.locY);

        // console.log(this.count);
        const cache = this.count;
        this.count = 0;
        return cache;
    }

    //告訴八位鄰居你附近有活細胞
    calculateCellData(cellX, cellY, state, summon) {
        let teamA = 0, teamB = 0;

        //計算座標周圍的細胞
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
            if (x > -1 && x < this.chunkWidth &&
                y > -1 && y < this.chunkHeight) {
                let nowCell;
                //活的
                if (state > 0)
                    nowCell = (this.cellData[x][y] += 1);
                else
                    nowCell = (this.cellData[x][y] -= 1);

                //加入關注列表
                const lastCell = this.chunkMap[x][y];
                if (!this.isLocInAliveList(x, y) && ((lastCell === 0 && nowCell === 3) || (lastCell > 0 && nowCell > 0))) {
                    this.alivePixelList.push([x, y]);
                }

                //要生成的話
                if (summon) {
                    const teamID = this.getBeforeChangePixel(x, y);
                    //這邊有活的
                    if (teamID > -1)
                        if (teamID === this.teamAID)
                            teamA++;
                        else if (teamID === this.teamBID)
                            teamB++;
                }
            } else {
                //計算chunk位置
                let cx = this.locX;
                let cy = this.locY;
                if (x < 0)
                    cx--;
                if (y < 0)
                    cy--;
                if (x === this.chunkWidth)
                    cx++;
                if (y === this.chunkHeight)
                    cy++;

                //計算鄰居chunk的cell的xy位置
                if (x < 0)
                    x += this.chunkWidth;
                else if (x === this.chunkWidth)
                    x -= this.chunkWidth;
                if (y < 0)
                    y += this.chunkHeight;
                else if (y === this.chunkHeight)
                    y -= this.chunkHeight;

                //load chunk
                let nextChunk = chunks[cx + ',' + cy];
                if (nextChunk === undefined)
                    nextChunk = loadChunk(cx, cy);


                //活的
                if (state > 0)
                    nextChunk.oldCellData.push([x, y, 1]);
                else
                    nextChunk.oldCellData.push([x, y, -1]);

                //加入關注列表
                const nowCell = nextChunk.cellData[x][y];
                const lastCell = nextChunk.chunkMap[x][y];
                if (!nextChunk.isLocInAliveList(x, y) && ((lastCell === 0 && nowCell === 3) || (lastCell > 0 && nowCell > 0))) {
                    nextChunk.alivePixelList.push([x, y]);
                }

                //需要之後處理
                if (needChangeChunk.indexOf(cx + ',' + cy) === -1) {
                    needChangeChunk.push(cx + ',' + cy);
                }

                //要生成的話
                if (summon) {
                    //那個chunk算過了，要拿舊資料
                    if (nextChunk.beforeChange != null) {
                        const teamID = nextChunk.getBeforeChangePixel(x, y);
                        //這邊有活的
                        if (teamID > -1)
                            if (teamID === this.teamAID)
                                teamA++;
                            else if (teamID === this.teamBID)
                                teamB++;
                    }
                    //還沒算過，直接拿map
                    else {
                        if (nextChunk.chunkMap[x][y] === this.teamAID)
                            teamA++;
                        else if (nextChunk.chunkMap[x][y] === this.teamBID)
                            teamB++;
                    }
                }
            }
            //TODO this is for debug
            this.count++;
        }

        if (summon) {
            if (teamA > teamB)
                return this.teamAID;
            else
                return this.teamBID;
        }
    }

    isLocInAliveList(x, y) {
        for (const i of this.alivePixelList) {
            if (i[0] === x && i[1] === y)
                return true;
            //TODO this is for debug
            this.count++;
        }
        return false;
    }

    getBeforeChangePixel(x, y) {
        const kernel = x + ',' + y;
        // if(this.beforeChange != null)
        for (let i = 0; i < this.beforeChange.length; i += 2) {
            if (kernel === this.beforeChange[i])
                return this.beforeChange[i + 1];

            //TODO this is for debug
            this.count++;
        }
        return -1;
    }

    lastDrawTime = 0;
    lastDrawScale = 0;

    //更新整個chunk
    drawChunk(canvas) {
        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        if (this.lastDrawScale !== screenScale || this.lastDrawTime < worldTime - 1) {
            // if (this.lastDrawScale !== screenScale)
            this.refreshChunkCanvas();

            for (const i of this.alivePixelList) {
                const team = this.chunkMap[i[0]][i[1]];
                if (team === 0)
                    continue;
                else {
                    if (team === 1)
                        this.canvas.fillStyle = this.alivePixelA;
                    else if (team === 2)
                        this.canvas.fillStyle = this.alivePixelB;
                }

                //fill square
                this.canvas.fillRect(realPixelSize * i[0], realPixelSize * i[1], realPixelSize, realPixelSize);
            }

            this.lastDrawTime = worldTime;
            this.lastDrawScale = screenScale;
        }

        canvas.drawImage(this.canvasElement, chunkStartX, chunkStartY);
    }

    //更新改變的cells
    drawChangeCells(canvas) {
        this.lastDrawTime = worldTime;
        if (this.changeList.length === 0)
            return;

        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        for (const i of this.changeList) {
            const team = this.chunkMap[i[0]][i[1]];
            if (team === 0) {
                canvas.fillStyle = this.deadPixel;
                this.canvas.fillStyle = this.deadPixel;
            } else {
                if (team === 1) {
                    canvas.fillStyle = this.alivePixelA;
                    this.canvas.fillStyle = this.alivePixelA;
                } else if (team === 2) {
                    canvas.fillStyle = this.alivePixelB;
                    this.canvas.fillStyle = this.alivePixelB;
                }
            }

            canvas.fillRect(chunkStartX + realPixelSize * i[0] + cGap / 2,
                chunkStartY + realPixelSize * i[1] + cGap / 2,
                realPixelSize - cGap, realPixelSize - cGap);

            this.canvas.fillRect(realPixelSize * i[0],
                realPixelSize * i[1],
                realPixelSize, realPixelSize);
        }
    }

    printCellData() {
        for (let y = 0; y < this.chunkHeight; y++) {
            let str = '';
            for (let x = 0; x < this.chunkWidth; x++) {
                str += this.cellData[x][y] + ',';
            }
            console.log(str);
        }
    }

    printMapData() {
        for (let y = 0; y < this.chunkHeight; y++) {
            let str = '';
            for (let x = 0; x < this.chunkWidth; x++) {
                str += this.chunkMap[x][y] + ',';
            }
            console.log(str);
        }
    }
}