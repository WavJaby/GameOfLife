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
    //附近有東西的cell
    alivePixelList = [null];
    aliveLength = 0;
    //要更改的cell
    changeList = [];
    cellDataCount = 0;

    chunkAliveCount = 0;
    teamACount = 0;
    teamBCount = 0;

    count = 0;

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
            }
            //活的
            else {
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

            this.addAlivePixel(i[0], i[1]);
        }
    }

    addAlivePixel(x, y) {
        const index = x + y * this.chunkWidth;

        //TODO this is for debug
        count += this.aliveLength;
        if (this.alivePixelList.indexOf(index) === -1) {
            this.alivePixelList[this.aliveLength++] = x + y * this.chunkWidth;
            this.alivePixelList[this.aliveLength] = null;
        }
    }

    removeAlivePixel(index) {
        if (index >= this.aliveLength) return;
        if (--this.aliveLength === 0)
            this.alivePixelList.length = 0;
        else if (index === this.aliveLength)
            this.alivePixelList[index] = null;
        else if (this.aliveLength > 0) {
            this.alivePixelList[index] = this.alivePixelList[this.aliveLength];
            this.alivePixelList[this.aliveLength] = null;
        }
    }

    getAlivePixelPos(i) {
        return this.numToLoc(this.alivePixelList[i]);
    }

    numToLoc(loc) {
        if (loc === null) return [-1, -1];
        return [loc % this.chunkWidth, loc / this.chunkWidth | 0];
    }

    //計算所有細胞死活
    calculateChange() {
        this.changeList.length = 0;

        for (let i = 0; i < this.aliveLength; i++) {
            const cell = this.alivePixelList[i];
            const aliveX = cell % this.chunkWidth;
            const aliveY = cell / this.chunkWidth | 0;
            //附近的細胞數
            const count = this.cellData[aliveX][aliveY];
            const team = this.chunkMap[aliveX][aliveY];

            //地圖邊緣
            if (this.locY > maxChunkY || this.locX > maxChunkX || this.locX < minChunkX || this.locY < minChunkY) {
                //活的細胞全部殺
                if (team > 0)
                    this.changeList.push([aliveX, aliveY, 0]);
                continue;
            }

            //現在是活的細胞
            if (team > 0) {
                // 生命數量稀少或過多要死亡
                if (count < 2 || count > 3)
                    this.changeList.push([aliveX, aliveY, 0]);
            }
            //現在是死的細胞
            else {
                //繁殖
                if (count === 3)
                    this.changeList.push([aliveX, aliveY, 0]);
            }

            if (team === 0 && count !== 3 ||
                team > 0 && (count === 2 || count === 3)
            ) {
                this.removeAlivePixel(i);
                i--;
            }

            //TODO this is for debug
            this.count++;
        }
    }

    calculateChunk() {
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

                this.calculateCellData(i[0], i[1], 0);
            } else {
                const team = this.calculateCellData(i[0], i[1], 1, true);
                i[2] = team;
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
            //TODO this is for debug
            this.count++;
        }

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
                if (state > 0) {
                    nowCell = ++this.cellData[x][y];
                    this.cellDataCount++;
                } else {
                    nowCell = --this.cellData[x][y];
                    this.cellDataCount--;
                }

                //加入關注列表
                const lastCell = this.chunkMap[x][y];
                if ((lastCell === 0 && nowCell === 3) || (lastCell > 0 && (nowCell < 2 || nowCell > 3))) {
                    this.addAlivePixel(x, y);
                }

                //要生成的話
                if (summon) {
                    // const teamID = this.getBeforeChangePixel(x, y);
                    const teamID = lastCell;
                    //這邊有活的
                    if (teamID > -1)
                        if (teamID === this.teamAID)
                            teamA++;
                        else if (teamID === this.teamBID)
                            teamB++;
                }
            } else {
                //計算chunk和cell的xy位置
                let cx = this.locX;
                let cy = this.locY;
                if (x < 0) {
                    cx--;
                    x += this.chunkWidth;
                } else if (x === this.chunkWidth) {
                    cx++;
                    x -= this.chunkWidth;
                }
                if (y < 0) {
                    cy--;
                    y += this.chunkHeight;
                } else if (y === this.chunkHeight) {
                    cy++;
                    y -= this.chunkHeight;
                }

                //load chunk
                let nextChunk = getChunk(cx, cy);

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

                // if (nextChunk.state > 0)
                nextChunk.haveAlive = true;
                //加入關注列表
                const lastCell = nextChunk.chunkMap[x][y];
                if ((lastCell === 0 && nowCell === 3) || (lastCell > 0 && (nowCell < 2 || nowCell > 3))) {
                    nextChunk.addAlivePixel(x, y);
                }

                //要生成的話
                if (summon) {
                    if (lastCell === this.teamAID)
                        teamA++;
                    else if (lastCell === this.teamBID)
                        teamB++;
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

    lastDrawTime = 0;
    lastDrawScale = 0;

    //更新整個chunk
    drawChunk(canvas) {
        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        if (this.lastDrawScale !== screenScale || this.lastDrawTime < worldTime) {
            this.refreshChunkCanvas();

            for (let i = 0; i < this.chunkWidth; i++) {
                for (let j = 0; j < this.chunkHeight; j++) {
                    const team = this.chunkMap[i][j];
                    if (team === 0) continue;
                    if (team === 1)
                        this.canvas.fillStyle = this.alivePixelA;
                    else if (team === 2)
                        this.canvas.fillStyle = this.alivePixelB;

                    //fill square
                    this.canvas.fillRect(realPixelSize * i, realPixelSize * j, realPixelSize, realPixelSize);
                }
            }

            this.lastDrawTime = worldTime;
            this.lastDrawScale = screenScale;
        }
        canvas.drawImage(this.canvasElement, chunkStartX, chunkStartY);
    }

    //更新改變的cells
    drawChangeCells(canvas) {
        this.lastDrawTime = worldTime;
        if (this.changeList.length === 0) {
            if (this.aliveLength === 0 && this.cellDataCount === 0)
                unloadChunk(this.locX, this.locY);
            return;
        }
        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        for (const i of this.changeList) {
            const team = this.chunkMap[i[0]][i[1]] = i[2];
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

    onlyUpdateMap() {
        if (this.changeList.length === 0) {
            if (this.aliveLength === 0 && this.cellDataCount === 0)
                unloadChunk(this.locX, this.locY);
            return;
        }
        for (const i of this.changeList)
            this.chunkMap[i[0]][i[1]] = i[2];
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