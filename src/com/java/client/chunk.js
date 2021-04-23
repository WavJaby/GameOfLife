class Chunk {
    chunkWidth = 16;
    chunkHeight = 16;
    deadPixel = 'rgb(10, 10, 10)';
    alivePixelA = 'rgb(0, 200, 200)';
    alivePixelB = 'rgb(200, 200, 200)';
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
        this.teamACount = tac;
        this.teamBCount = tbc;
        this.deadPixel = deadC;

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

    addCells(addList, canvas, user) {
        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        let thisPixSize = realPixelSize;
        if (screenScale > drawLineScreenScale) {
            chunkStartX += cGap / 2;
            chunkStartY += cGap / 2;
            thisPixSize -= cGap;
        }

        this.count = 0;
        for (const i of addList) {
            this.chunkMap[i[0]][i[1]] = user;
            this.alivePixelList.push([i[0], i[1]])
            if (user === teamAID)
                canvas.fillStyle = this.alivePixelA;
            else if (user === teamBID)
                canvas.fillStyle = this.alivePixelB;

            canvas.fillRect(chunkStartX + realPixelSize * i[0],
                chunkStartY + realPixelSize * i[1],
                thisPixSize, thisPixSize);
        }
    }

    //user改變cells
    updateCells(changeList, canvas) {
        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        let thisPixSize = realPixelSize;
        if (screenScale > drawLineScreenScale) {
            chunkStartX += cGap / 2;
            chunkStartY += cGap / 2;
            thisPixSize -= cGap;
        }

        this.count = 0;

        for (const i of changeList) {
            this.alivePixelList.push([i[0], i[1]])
            this.chunkMap[i[0]][i[1]] = i[2];
            if (i[2] === teamAID)
                canvas.fillStyle = this.alivePixelA;
            else if (i[2] === teamBID)
                canvas.fillStyle = this.alivePixelB;
            else
                canvas.fillStyle = this.deadPixel;

            canvas.fillRect(chunkStartX + realPixelSize * i[0],
                chunkStartY + realPixelSize * i[1],
                thisPixSize, thisPixSize);
        }
    }

    //更新整個chunk
    drawChunk(canvas) {
        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        for (const i of this.alivePixelList) {
            const team = this.chunkMap[i[0]][i[1]];
            if (team === 0)
                continue;
            else {
                if (team === 1)
                    canvas.fillStyle = this.alivePixelA;
                else if (team === 2)
                    canvas.fillStyle = this.alivePixelB;
            }

            //fill square
            canvas.fillRect(chunkStartX + realPixelSize * i[0],
                chunkStartY + realPixelSize * i[1],
                realPixelSize, realPixelSize);
        }
    }

    //更新改變的cells
    drawChangeCells(canvas) {
        if (this.changeList.length === 0)
            return;

        let chunkStartX = this.locX * realPixelSize * this.chunkWidth;
        let chunkStartY = this.locY * realPixelSize * this.chunkHeight;

        let thisPixSize = realPixelSize;
        if (screenScale > drawLineScreenScale) {
            chunkStartX += cGap / 2;
            chunkStartY += cGap / 2;
            thisPixSize -= cGap;
        }


        for (const i of this.changeList) {
            const team = this.chunkMap[i[0]][i[1]];
            if (team === 0) {
                canvas.fillStyle = this.deadPixel;
            } else {
                if (team === 1)
                    canvas.fillStyle = this.alivePixelA;
                else if (team === 2)
                    canvas.fillStyle = this.alivePixelB;
            }
            canvas.fillRect(chunkStartX + realPixelSize * i[0],
                chunkStartY + realPixelSize * i[1],
                thisPixSize, thisPixSize);
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