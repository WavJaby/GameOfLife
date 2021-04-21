const teamAID = 1;
const teamBID = 2;

class Chunk {
    chunkWidth = 16;
    chunkHeight = 16;
    pixelSize = 5;
    gap = 1;
    deadPixel = 'rgb(10, 10, 10)';
    alivePixelA = 'rgb(0, 200, 200)';
    alivePixelB = 'rgb(200, 200, 200)';
    //記錄整個chunk
    chunkMap = [];
    //活的
    alivePixelList = [];

    constructor(locX, locY, cw, ch, pSize, gap, tac, tbc, deadC) {
        this.locX = locX;
        this.locY = locY;
        this.chunkWidth = cw;
        this.chunkHeight = ch;
        this.pixelSize = pSize;
        this.gap = gap;
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
        const pixSize = ((this.pixelSize * screenScale + this.gap) * 10 | 0) / 10;
        let chunkStartX = this.locX * pixSize * this.chunkWidth;
        let chunkStartY = this.locY * pixSize * this.chunkHeight;

        let thisPixSize = pixSize;
        if (screenScale > drawLineScreenScale) {
            chunkStartX += this.gap / 2;
            chunkStartY += this.gap / 2;
            thisPixSize -= this.gap;
        }

        canvas.fillStyle = this.deadPixel;
        for (const i of this.alivePixelList) {
            this.chunkMap[i[0]][i[1]] = 0;
            canvas.fillRect(chunkStartX + pixSize * i[0],
                chunkStartY + pixSize * i[1],
                thisPixSize, thisPixSize);
        }
        this.alivePixelList = [];
    }

    addCells(addList, canvas, user) {
        const pixSize = ((this.pixelSize * screenScale + this.gap) * 10 | 0) / 10;
        let chunkStartX = this.locX * pixSize * this.chunkWidth;
        let chunkStartY = this.locY * pixSize * this.chunkHeight;

        let thisPixSize = pixSize;
        if (screenScale > drawLineScreenScale) {
            chunkStartX += this.gap / 2;
            chunkStartY += this.gap / 2;
            thisPixSize -= this.gap;
        }

        this.count = 0;
        for (const i of addList) {
            this.chunkMap[i[0]][i[1]] = user;
            this.alivePixelList.push([i[0], i[1]])
            if (user === teamAID)
                canvas.fillStyle = this.alivePixelA;
            else if (user === teamBID)
                canvas.fillStyle = this.alivePixelB;

            canvas.fillRect(chunkStartX + pixSize * i[0],
                chunkStartY + pixSize * i[1],
                thisPixSize, thisPixSize);
        }
    }

    //user改變cells
    updateCells(changeList, canvas) {
        const pixSize = ((this.pixelSize * screenScale + this.gap) * 10 | 0) / 10;
        let chunkStartX = this.locX * pixSize * this.chunkWidth;
        let chunkStartY = this.locY * pixSize * this.chunkHeight;

        let thisPixSize = pixSize;
        if (screenScale > drawLineScreenScale) {
            chunkStartX += this.gap / 2;
            chunkStartY += this.gap / 2;
            thisPixSize -= this.gap;
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

            canvas.fillRect(chunkStartX + pixSize * i[0],
                chunkStartY + pixSize * i[1],
                thisPixSize, thisPixSize);
        }
    }

    //更新整個chunk
    drawChunk(canvas) {
        const pixSize = ((this.pixelSize * screenScale + this.gap) * 10 | 0) / 10;
        let chunkStartX = this.locX * pixSize * this.chunkWidth;
        let chunkStartY = this.locY * pixSize * this.chunkHeight;

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
            canvas.fillRect(chunkStartX + pixSize * i[0],
                chunkStartY + pixSize * i[1],
                pixSize, pixSize);
        }
    }

    //更新改變的cells
    drawChangeCells(canvas) {
        if (this.changeList.length === 0)
            return;

        const pixSize = ((this.pixelSize * screenScale + this.gap) * 10 | 0) / 10;
        let chunkStartX = this.locX * pixSize * this.chunkWidth;
        let chunkStartY = this.locY * pixSize * this.chunkHeight;

        let thisPixSize = pixSize;
        if (screenScale > drawLineScreenScale) {
            chunkStartX += this.gap / 2;
            chunkStartY += this.gap / 2;
            thisPixSize -= this.gap;
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
            canvas.fillRect(chunkStartX + pixSize * i[0],
                chunkStartY + pixSize * i[1],
                thisPixSize, thisPixSize);
        }
    }


    printMapData() {
        for (let y = 0; y < this.chunkHeight; y++) {
            let str = '';
            for (let x = 0; x < this.chunkWidth; x++) {
                str += this.chunkMap[x][y] + ",";
            }
            console.log(str);
        }
    }
}