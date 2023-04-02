'use strict';

/**
 * @constructor
 */
function ChunkManager(world) {
    const thisInst = this;
    const chunkWidth = 16, chunkHeight = 16;

    /**@type{{Chunk}}*/
    const chunks = {};
    let worldTime = 0;
    this.calculateCount = 0;
    this.teamCount = [];

    /**
     * @param {int} x
     * @param {int} y
     * @return {Chunk}
     */
    this.getChunk = function (x, y) {
        let chunk = chunks[x];
        if (chunk === undefined)
            return loadChunk(x, y);
        chunk = chunk[y];
        if (chunk === undefined)
            return loadChunk(x, y);
        return chunk;
    }

    this.unloadChunk = function (x, y) {
        const chunk = chunks[x];
        if (chunk !== undefined && chunk[y] !== undefined)
            delete chunks[x][y];
    }

    function loadChunk(x, y) {
        worldTime++;
        const chunk = new Chunk(x, y, chunkWidth, chunkHeight, worldTime, world, thisInst);
        let cx = chunks[x];
        if (cx === undefined)
            cx = chunks[x] = {};
        cx[y] = chunk;
        return chunk;
    }

    /**
     * @return {Chunk[]}
     */
    this.calculateGeneration = function () {
        const needChange = [];
        //calculate all chunk
        for (const i in chunks) {
            const cx = chunks[i];
            for (const j in cx) {
                const chunk = cx[j];
                if (chunk.calculateChange(worldTime))
                    needChange.push(chunk);
            }
        }
        for (const chunk of needChange)
            chunk.calculateChunk();

        this.calculateCount = Object.values(chunks).map(i => Object.values(i).reduce((a, b) => a + b.getCount(), 0)).reduce((a, b) => a + b, 0);
        return needChange;
    }

    this.renderChunksInRange = function (startX, startY, xChunkCount, yChunkCount, canvas) {
        for (let x = 0; x < xChunkCount; x++) {
            //計算chunk位置X
            const cx = chunks[startX + x | 0];
            if (cx === undefined) continue;
            for (let y = 0; y < yChunkCount; y++) {
                //計算chunk位置Y
                const cy = cx[startY + y | 0];
                if (cy !== undefined)
                    cy.drawChunk(worldTime, canvas);
            }
        }
    }

    /**
     * @param {int} startX
     * @param {int} startY
     * @param {int} width
     * @param {int} height
     * @return {Chunk[]}
     */
    this.getChunkRange = function (startX, startY, width, height) {
        const outChunks = [];
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let chunk = chunks[startX + x];
                if (chunk === undefined) continue;
                chunk = chunk[startY + y];
                if (chunk === undefined) continue;
                outChunks.push(chunk);
            }
        }
        return outChunks;
    }

    /**
     * @param {int} startX
     * @param {int} startY
     * @param {int} width
     * @param {int} height
     * @param {{}} change
     * @param {int[][]} templateData
     * @return {boolean}
     */
    this.checkRangeAlive = function (startX, startY, width, height, change, templateData) {
        let chunk = undefined, lastChunkX = null, lastChunkY = null;

        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (templateData[i][j] === 0) continue;

                const cellGlobalX = startX + j;
                const cellGlobalY = startY + i;
                const chunkX = ((cellGlobalX + (startX < 0)) / chunkWidth - (startX < 0)) | 0;
                const chunkY = ((cellGlobalY + (startY < 0)) / chunkHeight - (startY < 0)) | 0;
                const cellX = cellGlobalX - chunkX * chunkWidth;
                const cellY = cellGlobalY - chunkY * chunkHeight;
                // console.log(chunkX, chunkY, cellX, cellY);

                if (lastChunkX !== chunkX || lastChunkY !== chunkY) {
                    chunk = chunks[chunkX];
                    if (chunk !== undefined)
                        chunk = chunk[chunkY];
                    lastChunkX = chunkX;
                    lastChunkY = chunkY;
                }

                if (chunk !== undefined) {
                    if (chunk.cellData[cellX][cellY] > 0)
                        return true;
                }

                let changeChunkX, changeChunkY;
                if ((changeChunkX = change[chunkX]) === undefined)
                    changeChunkX = change[chunkX] = {};
                if ((changeChunkY = changeChunkX[chunkY]) === undefined)
                    changeChunkY = changeChunkX[chunkY] = [];

                changeChunkY.push([cellX, cellY]);
            }
        }
        return false;
    };

    /**
     * @return {number}
     */
    this.getTime = function () {
        return worldTime;
    }

    /**
     * @return {{Chunk}}
     */
    this.getChunks = function () {
        return chunks;
    }

    this.addTeam = function (teams) {
        Array.prototype.push.apply(this.teamCount, teams);
    }

    this.getTeamLength = function () {
        return this.teamCount.length;
    }

    this.getTotalTeamCount = function () {
        return this.teamCount.reduce((a, b) => a + b, 0);
    }
}