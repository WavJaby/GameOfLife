package com.java.game;

import java.awt.*;
import java.util.ArrayList;
import java.util.List;

import static com.java.game.GameCalculation.*;

public class Chunk {
    int locX, locY;
    int chunkWidth = 16;
    int chunkHeight = 16;
    int pixelSize = 5;
    int gap = 1;
    Color deadPixel = Color.black;
    int teamAID = 1;
    Color alivePixelA = Color.white;
    int teamBID = 2;
    Color alivePixelB = Color.cyan;

    //記錄整個chunk
    int[][] chunkMap = new int[chunkWidth][];
    //紀錄每個cell旁邊有幾個
    int[][] cellData = new int[chunkWidth][];
    //舊的cell data
    List<int[]> oldCellData = new ArrayList<>();
    //附近有東西的cell
    List<int[]> alivePixelList = new ArrayList<>();
    //要更改的cell
    List<int[]> changeList = new ArrayList<>();
    //本來是活的
    List<Object> beforeChange = null;

    int count = 0;
    boolean isAllZero = false;

    Chunk(int locX, int locY) {
        this.locX = locX;
        this.locY = locY;
        for (int x = 0; x < chunkWidth; x++) {
            int[] yCache = new int[chunkHeight];
            int[] yDataCache = new int[chunkHeight];
            for (int y = 0; y < chunkHeight; y++) {
                yCache[y] = 0;
                yDataCache[y] = 0;

                //TODO this is for debug
                count++;
            }
            chunkMap[x] = yCache;
            cellData[x] = yDataCache;
        }
    }

    //user改變cells
    public void addCells(int[][] changeList, int teamID) {
        final int chunkStartX = (int) (locX * (pixelSize * screenScale + gap) * chunkWidth);
        final int chunkStartY = (int) (locY * (pixelSize * screenScale + gap) * chunkHeight);
        count = 0;
        for (int[] i : changeList) {
//            //換顏色
//            if (this.chunkMap[i[0]][i[1]] < 1) {
//                if (teamID == teamAID)
//                    canvas.fillStyle = alivePixelA;
//                else if (teamID == teamBID)
//                    canvas.fillStyle = alivePixelB;
//            }
//
//            canvas.fillRect(chunkStartX + (this.pixelSize * screenScale + this.gap) * i[0],
//                    chunkStartY + (this.pixelSize * screenScale + this.gap) * i[1],
//                    this.pixelSize * screenScale, this.pixelSize * screenScale);
//            canvas.fillStyle = this.deadPixel;

            //告訴鄰居
            //x, y
            if (chunkMap[i[0]][i[1]] > 0) {
                chunkMap[i[0]][i[1]] = 0;
                calculateCellData(i[0], i[1], 0, false);
            } else {
                chunkMap[i[0]][i[1]] = teamID;
                calculateCellData(i[0], i[1], 1, false);
            }

            if (!isLocInAliveList(i[0], i[1])) {
                alivePixelList.add(new int[]{i[0], i[1]});
            }
        }
    }

    //計算所有細胞死活
    public int calculateChunk() {
        changeList = new ArrayList<>();
        beforeChange = new ArrayList<>();
        boolean isAllZero = true;

        for (int i = 0; i < alivePixelList.size(); i++) {
            final int aliveX = alivePixelList.get(i)[0];
            final int aliveY = alivePixelList.get(i)[1];
            //附近的細胞數
            final int count = cellData[aliveX][aliveY];

            //現在是活的細胞
            if (chunkMap[aliveX][aliveY] > 0) {
                // 生命數量稀少或過多要死亡
                if (count < 2 || count > 3) {
                    changeList.add(new int[]{aliveX, aliveY});
                }

                //這個細胞活著
                //紀錄位置
                this.beforeChange.add(aliveX + ',' + aliveY);
                //紀錄是哪一隊的
                this.beforeChange.add(chunkMap[aliveX][aliveY]);
            }
            //現在是死的細胞
            else {
                //繁殖
                if (count == 3) {
                    changeList.add(new int[]{aliveX, aliveY});
                }
            }

            // console.log(x,y,count)
            if (count == 0 && chunkMap[aliveX][aliveY] == 0) {
                alivePixelList.remove(i);
                i--;
            } else
                isAllZero = false;

            //TODO this is for debug
            this.count++;
        }

        //更新地圖
        for (int[] i : changeList) {
            //x, y
            if (chunkMap[i[0]][i[1]] > 0) {
                chunkMap[i[0]][i[1]] = 0;
                calculateCellData(i[0], i[1], 0, false);
            } else {
                chunkMap[i[0]][i[1]] = calculateCellData(i[0], i[1], 1, true);
            }
        }

        //unload chunk如果沒用
        if (isAllZero)
            this.isAllZero = true;
        if (this.isAllZero && isAllZero && !needChangeChunk.contains(locX + "," + locY))
            unloadChunk(locX, locY);

        // console.log(this.count);
        int cache = count;
        count = 0;
        return cache;
    }

    //告訴八位鄰居你附近有活細胞
    private int calculateCellData(int cellX, int cellY, int state, boolean summon) {
        int teamA = 0, teamB = 0;

        //計算座標周圍的細胞
        for (int j = 0; j < 8; j++) {
            int x, y;
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
                //活的
                if (state > 0)
                    cellData[x][y] += 1;
                else
                    cellData[x][y] -= 1;

                //加入關注列表
                if (!isLocInAliveList(x, y)) {
                    alivePixelList.add(new int[]{x, y});
                }

                //要生成的話
                if (summon) {
                    int teamID = getBeforeChangePixel(x, y);
                    //這邊有活的
                    if (teamID > -1)
                        if (teamID == teamAID)
                            teamA++;
                        else if (teamID == teamBID)
                            teamB++;
                }
            } else {
                //計算chunk位置
                int cx = locX;
                int cy = locY;
                if (x < 0)
                    cx--;
                if (y < 0)
                    cy--;
                if (x == chunkWidth)
                    cx++;
                if (y == chunkHeight)
                    cy++;

                //計算鄰居chunk的cell的xy位置
                if (x < 0)
                    x += chunkWidth;
                else if (x == chunkWidth)
                    x -= chunkWidth;
                if (y < 0)
                    y += chunkHeight;
                else if (y == chunkHeight)
                    y -= chunkHeight;

                //load chunk
                Chunk nextChunk;
                if (!chunks.containsKey(cx + "," + cy))
                    nextChunk = loadChunk(cx, cy);
                else
                    nextChunk = chunks.get(cx + "," + cy);

                //活的
                if (state > 0)
                    nextChunk.oldCellData.add(new int[]{x, y, 1});
                else
                    nextChunk.oldCellData.add(new int[]{x, y, -1});

                //加入關注列表
                if (!nextChunk.isLocInAliveList(x, y)) {
                    nextChunk.alivePixelList.add(new int[]{x, y});
                }

                //需要之後處理
                if (!needChangeChunk.contains(cx + "," + cy)) {
                    needChangeChunk.add(cx + "," + cy);
                }

                //要生成的話
                if (summon) {
                    //那個chunk算過了，要拿舊資料
                    if (nextChunk.beforeChange != null) {
                        int teamID = nextChunk.getBeforeChangePixel(x, y);
                        //這邊有活的
                        if (teamID > -1)
                            if (teamID == teamAID)
                                teamA++;
                            else if (teamID == teamBID)
                                teamB++;
                    }
                    //還沒算過，直接拿map
                    else {
                        if (nextChunk.chunkMap[x][y] == teamAID)
                            teamA++;
                        else if (nextChunk.chunkMap[x][y] == teamBID)
                            teamB++;
                    }
                }
            }
            //TODO this is for debug
            count++;
        }

        if (summon) {
            if (teamA > teamB)
                return teamAID;
            else
                return teamBID;
        }
        return -1;
    }

    //更新整個chunk
    public void drawChunk(Graphics canvas) {
        final int pixSize = (int) (pixelSize * screenScale + gap);
        final int chunkStartX = locX * pixSize * chunkWidth;
        final int chunkStartY = locY * pixSize * chunkHeight;

        for (int[] i : alivePixelList) {
            //如果是活的換顏色
            if (chunkMap[i[0]][i[1]] > 0)
                canvas.setColor(alivePixelA);
            else
                canvas.setColor(deadPixel);

            //fill square
            canvas.fillRect(chunkStartX + pixSize * i[0],
                    chunkStartY + pixSize * i[1],
                    pixSize, pixSize);
        }
    }

    //更新改變的cells
    public void drawChangeCells(Graphics canvas) {
        final int pixSize = (int) (pixelSize * screenScale + gap);
        final int chunkStartX = locX * pixSize * chunkWidth;
        final int chunkStartY = locY * pixSize * chunkHeight;
        for (int[] i : changeList) {
            //x, y
            if (chunkMap[i[0]][i[1]] > 0)
                canvas.setColor(alivePixelA);
            else
                canvas.setColor(deadPixel);

            canvas.fillRect(chunkStartX + pixSize * i[0],
                    chunkStartY + pixSize * i[1],
                    pixSize, pixSize);
        }
    }

    public void printCellData() {
        for (int y = 0; y < chunkHeight; y++) {
            String str = "";
            for (int x = 0; x < chunkWidth; x++) {
                str += cellData[x][y] + ",";
            }
            System.out.println(str);
        }
    }

    public void printMapData() {
        for (int y = 0; y < chunkHeight; y++) {
            String str = "";
            for (int x = 0; x < chunkWidth; x++) {
                str += chunkMap[x][y] + ",";
            }
            System.out.println(str);
        }
    }

    public boolean isLocInAliveList(int x, int y) {
        for (final int[] i : alivePixelList) {
            if (i[0] == x && i[1] == y)
                return true;
            //TODO this is for debug
            count++;
        }
        return false;
    }

    public int getBeforeChangePixel(int x, int y) {
        final String kernel = x + "," + y;
        for (int i = 0; i < beforeChange.size(); i += 2) {
            if (kernel.equals(beforeChange.get(i)))
                return (int) beforeChange.get(i + 1);

            //TODO this is for debug
            count++;
        }
        return -1;
    }
}
