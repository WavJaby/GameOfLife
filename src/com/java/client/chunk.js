class Chunk {
    chunkWidth = 16;
    chunkHeight = 16;
    deadPixel;
    alivePixelA;
    alivePixelB;
    teamACount = 0;
    teamBCount = 0;
    //記錄整個chunk
    chunkMap = [];
    //活的
    alivePixelList = [];

    chunkTime = 0;


    constructor(locX, locY, cw, ch, tac, tbc, deadC) {
        this.locX = locX;
        this.locY = locY;
        this.chunkWidth = cw;
        this.chunkHeight = ch;
        this.alivePixelA = tac;
        this.alivePixelB = tbc;
        this.deadPixel = deadC;

        this.canvasElement = document.createElement('canvas');
        this.canvas = this.canvasElement.getContext('2d');

        for (let x = 0; x < this.chunkWidth; x++) {
            let yCache = [];
            for (let y = 0; y < this.chunkHeight; y++) {
                yCache[y] = 0;

                //TODO this is for debug
                this.count++;
            }
            this.chunkMap[x] = yCache;
        }
    }

    refreshChunkCanvas() {
        const realWidth = ((this.chunkWidth * realPixelSize * 10) | 0) / 10;
        const realHeight = ((this.chunkHeight * realPixelSize * 10) | 0) / 10;
        this.canvas.canvas.width = realWidth;
        this.canvas.canvas.height = realHeight;
        this.canvasElement.width = realWidth;
        this.canvasElement.height = realHeight;
    }

    clear(canvas) {
        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        let thisPixSize = realPixelSize;
        if (screenScale > drawLineScreenScale) {
            chunkStartX += cGap / 2;
            chunkStartY += cGap / 2;
            thisPixSize -= cGap;
        }

        canvas.fillStyle = this.deadPixel;
        for (const i of this.alivePixelList) {
            this.chunkMap[i[0]][i[1]] = 0;
            canvas.fillRect(chunkStartX + realPixelSize * i[0],
                chunkStartY + realPixelSize * i[1],
                thisPixSize, thisPixSize);
        }
        this.alivePixelList = [];
    }

    updateCells(changeList, canvas, user) {
        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        this.count = 0;

        for (const i of changeList) {
            const teamID = user ? user : i[2];
            this.alivePixelList.push([i[0], i[1]])
            const lastTeamID = this.chunkMap[i[0]][i[1]];
            this.chunkMap[i[0]][i[1]] = teamID;
            if (teamID === teamAID) {
                this.teamACount++;
                canvas.fillStyle = this.alivePixelA;
                this.canvas.fillStyle = this.alivePixelA;
            } else if (teamID === teamBID) {
                this.teamBCount++;
                canvas.fillStyle = this.alivePixelB;
                this.canvas.fillStyle = this.alivePixelB;
            } else {
                if (lastTeamID === teamAID)
                    this.teamACount--;
                else if (lastTeamID === teamBID)
                    this.teamBCount--;
                canvas.fillStyle = this.deadPixel;
                this.canvas.fillStyle = this.deadPixel;
            }

            canvas.fillRect(chunkStartX + realPixelSize * i[0] + cGap / 2,
                chunkStartY + realPixelSize * i[1] + cGap / 2,
                realPixelSize - cGap, realPixelSize - cGap);

            this.canvas.fillRect(realPixelSize * i[0],
                realPixelSize * i[1],
                realPixelSize, realPixelSize);
        }
    }

    lastDrawTime = 0;
    lastDrawScale = 0;

    //更新整個chunk
    drawChunk(canvas) {
        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        // for (const i of this.alivePixelList) {
        //     const team = this.chunkMap[i[0]][i[1]];
        //     if (team === 0)
        //         continue;
        //     else {
        //         if (team === 1)
        //             canvas.fillStyle = this.alivePixelA;
        //         else if (team === 2)
        //             canvas.fillStyle = this.alivePixelB;
        //     }
        //
        //     //fill square
        //     canvas.fillRect(chunkStartX + realPixelSize * i[0],
        //         chunkStartY + realPixelSize * i[1],
        //         realPixelSize, realPixelSize);
        // }

        if (this.lastDrawScale !== screenScale || this.lastDrawTime < worldTime - 1) {
            this.refreshChunkCanvas();

            for (let i = 0; i < this.alivePixelList.length; i++) {
                const x = this.alivePixelList[i][0];
                const y = this.alivePixelList[i][1];
                const team = this.chunkMap[x][y];
                if (team === 0) {
                    this.alivePixelList.splice(i, 1);
                    i--;
                    continue;
                } else {
                    if (team === 1)
                        this.canvas.fillStyle = this.alivePixelA;
                    else if (team === 2)
                        this.canvas.fillStyle = this.alivePixelB;
                }

                //fill square
                this.canvas.fillRect(realPixelSize * x, realPixelSize * y, realPixelSize, realPixelSize);
            }

            if (this.alivePixelList.length === 0)
                unloadChunk(this.locX, this.locY);
            this.lastDrawTime = worldTime;
            this.lastDrawScale = screenScale;
        }

        canvas.drawImage(this.canvasElement, chunkStartX, chunkStartY);
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