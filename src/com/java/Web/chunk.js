class Chunk {
    chunkWidth = 10;
    chunkHeight = 10;
    pixelSize = 20;
    gap = 2;
    deadPixel = 'rgb(10, 10, 10)';
    alivePixel = 'rgb(200, 200, 200)';
    //記錄整個chunk
    chunkMap = [];
    //紀錄每個cell旁邊有幾個
    cellData = [];
    //附近有東西的cell
    alivePixelList = [];
    //要更改的cell
    changeList = [];

    constructor(locX, locY) {
        this.locX = locX;
        this.locY = locY;
        for (let x = 0; x < this.chunkWidth; x++) {
            let yCache = [];
            let yDataCache = [];
            for (let y = 0; y < this.chunkHeight; y++) {
                yCache[y] = 0;
                yDataCache[y] = 0;
            }
            this.chunkMap[x] = yCache;
            this.cellData[x] = yDataCache;
        }
    }

    //更新整個chunk
    drawChunk(canvas) {
        let chunkStartX = this.locX * (this.pixelSize + this.gap) * this.chunkWidth;
        let chunkStartY = this.locY * (this.pixelSize + this.gap) * this.chunkHeight;

        canvas.fillStyle = this.deadPixel;
        for (let x = 0; x < this.chunkWidth; x++) {
            for (let y = 0; y < this.chunkHeight; y++) {
                //如果是活的換顏色
                if (this.chunkMap[x][y] > 0)
                    canvas.fillStyle = this.alivePixel;
                //fill square
                canvas.fillRect(chunkStartX + (this.pixelSize + this.gap) * x,
                    chunkStartY + (this.pixelSize + this.gap) * y,
                    this.pixelSize, this.pixelSize);
                //如果是活的換回來
                if (this.chunkMap[x][y] > 0)
                    canvas.fillStyle = this.deadPixel;
            }
        }
    }

    //已經加過的
    addedPixel = [];

    //user改變cells
    addCells(changeList, canvas) {
        let chunkStartX = this.locX * (this.pixelSize + this.gap) * this.chunkWidth;
        let chunkStartY = this.locY * (this.pixelSize + this.gap) * this.chunkHeight;
        this.count = 0;
        for (const i of changeList) {
            //換顏色
            if (this.chunkMap[i[0]][i[1]] < 1)
                canvas.fillStyle = this.alivePixel;
            canvas.fillRect(chunkStartX + (this.pixelSize + this.gap) * i[0],
                chunkStartY + (this.pixelSize + this.gap) * i[1],
                this.pixelSize, this.pixelSize);
            canvas.fillStyle = this.deadPixel;

            //告訴鄰居
            //x, y
            if (this.chunkMap[i[0]][i[1]] > 0) {
                this.chunkMap[i[0]][i[1]] = 0;
                this.calculateCellData(i[0], i[1], 0);
            } else {
                this.chunkMap[i[0]][i[1]] = 1;
                if (this.addedPixel.indexOf(i[0] + ',' + i[1]) === -1) {
                    this.alivePixelList.push([i[0], i[1]]);
                    this.addedPixel.push(i[0] + ',' + i[1]);
                }
                this.calculateCellData(i[0], i[1], 1);
            }

        }
    }

    count;

    //計算所有細胞死活
    calculateChunk() {
        this.addedPixel = [];
        this.changeList = [];
        const aPxlCache = [...this.alivePixelList];
        this.alivePixelList = [];

        for (const i of aPxlCache) {
            //附近的細胞數
            const count = this.cellData[i[0]][i[1]];

            //現在是活的細胞
            if (this.chunkMap[i[0]][i[1]] > 0) {
                // 生命數量稀少或過多要死亡
                if (count < 2 || count > 3) {
                    this.changeList.push([i[0], i[1]]);
                }
            }
            //現在是死的細胞
            else {
                //繁殖
                if (count === 3) {
                    this.changeList.push([i[0], i[1]]);
                }
            }
        }

        //更新地圖
        for (const i of this.changeList) {
            //x, y
            if (this.chunkMap[i[0]][i[1]] > 0) {
                this.chunkMap[i[0]][i[1]] = 0;
                this.calculateCellData(i[0], i[1], 0);
            } else {
                this.chunkMap[i[0]][i[1]] = 1;
                this.calculateCellData(i[0], i[1], 1);
            }
        }

        // console.log(this.count);
        this.count = 0;
    }

    //告訴八位鄰居你附近有活細胞
    calculateCellData(cellX, cellY, state) {
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

            // let count = state > 0 ? 1 : -1;
            if (x > -1 && x < this.chunkWidth &&
                y > -1 && y < this.chunkHeight) {
                //活的
                if (state > 0)
                    this.cellData[x][y] += 1;
                else
                    this.cellData[x][y] -= 1;

                if (this.cellData[x][y] > 0 && this.addedPixel.indexOf(x + ',' + y) === -1) {
                    this.alivePixelList.push([x, y]);
                    this.addedPixel.push(x + ',' + y);
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
                    x += 10;
                else if (x === this.chunkWidth)
                    x -= 10;
                if (y < 0)
                    y += 10;
                else if (y === this.chunkHeight)
                    y -= 10;

                //load chunk
                let nextChunk = chunks[cx + ',' + cy];
                if (nextChunk === undefined)
                    nextChunk = loadChunk(cx, cy);

                //活的
                if (state > 0)
                    nextChunk.cellData[x][y] += 1;
                else
                    nextChunk.cellData[x][y] -= 1;

                // if ((cx + ',' + cy) === '0,1') {
                //     console.log(x + ',' + y + " " + nextChunk.cellData[x][y]);
                // }

                // console.log(x + ',' + y + " " + nextChunk.cellData[x][y]);

                if (nextChunk.cellData[x][y] > 0 && nextChunk.addedPixel.indexOf(x + ',' + y) === -1) {
                    nextChunk.alivePixelList.push([x, y]);
                    nextChunk.addedPixel.push(x + ',' + y);
                    console.log(x + ',' + y + " " + nextChunk.alivePixelList);
                }

                // console.log(x / this.chunkWidth)
                // console.log('aaa:', cx, cy)
                // console.log('bbb:', x, y)
                // console.log('loc:', newX, newY)
            }

            //TODO this is for debug
            this.count++;
        }
    }

    //更新改變的cells
    drawChangeCells(canvas) {
        let chunkStartX = this.locX * (this.pixelSize + this.gap) * this.chunkWidth;
        let chunkStartY = this.locY * (this.pixelSize + this.gap) * this.chunkHeight;
        for (const i of this.changeList) {
            //x, y
            if (this.chunkMap[i[0]][i[1]] > 0) {
                canvas.fillStyle = this.alivePixel;
            } else {
                canvas.fillStyle = this.deadPixel;
            }

            canvas.fillRect(chunkStartX + (this.pixelSize + this.gap) * i[0],
                chunkStartY + (this.pixelSize + this.gap) * i[1],
                this.pixelSize, this.pixelSize);
        }
    }

    printCellData() {
        for (let y = 0; y < this.chunkHeight; y++) {
            let str = '';
            for (let x = 0; x < this.chunkWidth; x++) {
                str += this.cellData[x][y] + ",";
            }
            console.log(str);
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


    // count;
    //
    // //計算這個chunk所有生命體死活
    // calculateChunk() {
    //     let changeList = [];
    //     let alivePixelCopy = [...this.alivePixelList];
    //     let donePixList = [];
    //     this.alivePixelList = [];
    //
    //     this.count = 0;
    //     for (const i of alivePixelCopy) {
    //         //計算活的細胞周圍
    //         let count = this.calculatePixelLoc(i, changeList, donePixList);
    //         // 生命數量稀少或過多
    //         if (count < 2 || count > 3) {
    //             changeList.push(i);
    //         } else //保持不變
    //             this.alivePixelList.push(i);
    //     }
    //
    //     //更新地圖
    //     for (const i of changeList) {
    //         //換顏色
    //         if (this.chunkMap[i] === 0) {
    //             this.chunkMap[i] = 1;
    //         } else {
    //             this.chunkMap[i] = 0;
    //         }
    //     }
    //
    //     console.log(this.count);
    //     return changeList;
    // }
    //
    // //計算某個位置周圍方塊
    // calculatePixelLoc(i, changeList, donePixList) {
    //     let loc = this.intToLoc(i);
    //     let count = 0;
    //     //計算活座標周圍的細胞
    //     for (let j = 0; j < 8; j++) {
    //         let x, y;
    //         if (j < 3) {
    //             x = j - 1;
    //             y = -1;
    //         } else if (j < 5) {
    //             x = (j - 3) * 2 - 1;
    //             y = 0;
    //         } else {
    //             x = j - 6;
    //             y = 1;
    //         }
    //         x += loc[0];
    //         y += loc[1];
    //
    //         if (x > -1 && x < this.chunkWidth &&
    //             y > -1 && y < this.chunkHeight) {
    //             const thisLoc = this.locToInt(x, y);
    //             //有活的細胞
    //             if (this.chunkMap[thisLoc] === 1)
    //                 count++;
    //             else//是死的細胞且沒算過
    //                 //要算有沒有生命體要復活
    //             if (changeList !== undefined && donePixList.indexOf(x + ',' + y) === -1) {
    //                 //這個細胞周圍有幾個和活的
    //                 let count2 = this.calculatePixelLoc(thisLoc);
    //
    //                 //復活(繁殖)
    //                 if (count2 === 3) {
    //                     changeList.push(thisLoc);
    //                     this.alivePixelList.push(thisLoc);
    //                 }
    //
    //                 //標記為算過
    //                 donePixList.push(x + ',' + y);
    //             }
    //         } else {
    //             // 在境外且算過
    //             if (donePixList !== undefined && donePixList.indexOf(x + ',' + y) === -1) {
    //                 // let cx = x / this.chunkWidth + this.locX | 0;
    //                 // let cy = y / this.chunkHeight + this.locY | 0;
    //                 // if (x < 0)
    //                 //     cx--;
    //                 // if (y < 0)
    //                 //     cy--;
    //                 // let newX = x - (cx * this.chunkWidth);
    //                 // let newY = y - (cy * this.chunkHeight);
    //
    //                 //計算chunk位置
    //                 let cx = this.locX + x / this.chunkWidth | 0;
    //                 let cy = this.locY + y / this.chunkHeight | 0;
    //                 if (x < 0)
    //                     cx--;
    //                 if (y < 0)
    //                     cy--;
    //
    //                 // console.log(x / this.chunkWidth)
    //                 console.log('aaa:', cx, cy)
    //                 // console.log('bbb:', x, y)
    //                 // console.log('loc:', newX, newY)
    //
    //                 //標記為算過
    //                 donePixList.push(x + ',' + y);
    //             }
    //
    //             // // if (changeList !== undefined && donePixList.indexOf(this.locToInt(x, y)) > -1)
    //             // if (changeList !== undefined && donePixList.indexOf(this.locToInt(x, y)) === -1) {
    //             //     console.log(x, y);
    //             //     console.log(donePixList)
    //             // }
    //         }
    //         this.count++;
    //     }
    //     return count;
    // }
    //
    // //更新整個螢幕
    // drawChunk(canvas) {
    //     let chunkStartX = this.locX * (this.pixelSize + this.gap) * this.chunkWidth;
    //     let chunkStartY = this.locY * (this.pixelSize + this.gap) * this.chunkHeight;
    //
    //     canvas.fillStyle = this.deadPixel;
    //     for (let i = 0; i < this.chunkMap.length; i++) {
    //         //如果是活的換顏色
    //         if (this.chunkMap[i] === 1)
    //             canvas.fillStyle = this.alivePixel;
    //         canvas.fillRect(chunkStartX + (this.pixelSize + this.gap) * (i % this.chunkWidth),
    //             chunkStartY + (this.pixelSize + this.gap) * ((i / this.chunkWidth) | 0),
    //             this.pixelSize, this.pixelSize);
    //         //如果是活的換回來
    //         if (this.chunkMap[i] === 1)
    //             canvas.fillStyle = this.deadPixel;
    //     }
    // }
    //
    // //更新需要更新的格子
    // updatePixel(canvas, updatePixel, user) {
    //     let chunkStartX = this.locX * (this.pixelSize + this.gap) * this.chunkWidth;
    //     let chunkStartY = this.locY * (this.pixelSize + this.gap) * this.chunkHeight;
    //
    //     for (const pos of updatePixel) {
    //         //如果是死亡的
    //         if (this.chunkMap[pos] === 0) {
    //             //如果是手改，改變顏色
    //             if (user) {
    //                 //換成白色
    //                 canvas.fillStyle = this.alivePixel;
    //                 //改變地圖
    //                 this.chunkMap[pos] = 1;
    //                 //加入活著的名單
    //                 if (this.alivePixelList.indexOf(pos) === -1)
    //                     this.alivePixelList.push(pos)
    //             } else {
    //                 //換成黑色
    //                 canvas.fillStyle = this.deadPixel;
    //             }
    //         }//如果是活的
    //         else {
    //             //如果是手改
    //             if (user) {
    //                 //換成黑色
    //                 canvas.fillStyle = this.deadPixel;
    //                 //改變地圖
    //                 this.chunkMap[pos] = 0;
    //                 //因為死了所以刪除名單
    //                 const index = this.alivePixelList.indexOf(pos);
    //                 if (index !== -1)
    //                     this.alivePixelList.splice(index, 1);
    //             } else {
    //                 //換成白色
    //                 canvas.fillStyle = this.alivePixel;
    //             }
    //         }
    //         canvas.fillRect(chunkStartX + (this.pixelSize + this.gap) * (pos % this.chunkWidth),
    //             chunkStartY + (this.pixelSize + this.gap) * ((pos / this.chunkWidth) | 0),
    //             this.pixelSize, this.pixelSize);
    //     }
    // }
    //
    // intToLoc(input) {
    //     return [
    //         (input % this.chunkWidth),
    //         (input / this.chunkWidth) | 0
    //     ]
    // }
    //
    // locToInt(x, y) {
    //     return x + y * this.chunkWidth;
    // }
    //
    // intToLocW(input, width) {
    //     return [
    //         (input % width),
    //         (input / width) | 0
    //     ]
    // }
}