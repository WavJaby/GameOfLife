package com.java.server.game;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import static com.java.server.game.GameCalculatorNoGui.*;

public class ChunkNoGui {
    private final GameCalculatorNoGui calculator;

    public final int locX;
    public final int locY;
    public final int chunkWidth = 16;
    public final int chunkHeight = 16;
    private final int teamAID;
    private final int teamBID;

    //記錄整個chunk
    private final int[][] chunkMap = new int[chunkWidth][];
    //紀錄每個cell旁邊有幾個
    public int[][] cellData = new int[chunkWidth][];
    //舊的cell data
    public List<int[]> oldCellData = new ArrayList<>();
    //附近有東西的cell
    public List<int[]> alivePixelList = new ArrayList<>();
    //本來是活的
    public List<Object> beforeChange = null;
    //要更改的cell
    public List<int[]> changeList = new ArrayList<>();

    //活的list
    public final List[] aliveList = new List[]{new CopyOnWriteArrayList<String>(), new CopyOnWriteArrayList<String>()};

    int count = 0;
    boolean isAllZero = false;

    public int chunkAliveCount = 0;
    public int teamACount = 0;
    public int teamBCount = 0;

    public ChunkNoGui(int locX, int locY, GameCalculatorNoGui calculator) {
        this.calculator = calculator;
        this.locX = locX;
        this.locY = locY;
        this.teamAID = calculator.teamAID;
        this.teamBID = calculator.teamBID;
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
        count = 0;
        for (int[] i : changeList) {
            final int team = this.chunkMap[i[0]][i[1]];
            final String locInt = String.valueOf(i[0] + i[1] * chunkWidth);
            if (team > 0) {
                //計算各自的數量
                if (team == this.teamAID) {
                    calculator.teamACount--;
                    this.teamACount--;
                    //刪除
                    aliveList[0].remove(locInt);
                } else if (team == this.teamBID) {
                    calculator.teamBCount--;
                    this.teamBCount--;
                    //刪除
                    aliveList[1].remove(locInt);
                }
                this.chunkAliveCount--;

                chunkMap[i[0]][i[1]] = 0;
                calculateCellData(i[0], i[1], 0, false);
            } else {
                //計算各自的數量
                if (teamID == this.teamAID) {
                    calculator.teamACount++;
                    this.teamACount++;
                    //紀錄活細胞座標
                    aliveList[0].add(locInt);
                } else if (teamID == this.teamBID) {
                    calculator.teamBCount++;
                    this.teamBCount++;
                    //紀錄活細胞座標
                    aliveList[1].add(locInt);
                }
                this.chunkAliveCount++;

                chunkMap[i[0]][i[1]] = teamID;
                calculateCellData(i[0], i[1], 1, false);
            }

            if (!isLocInAliveList(i[0], i[1])) {
                alivePixelList.add(new int[]{i[0], i[1]});
            }

            this.changeList.add(new int[]{i[0], i[1]});
        }
    }

    //計算所有細胞死活
    public int calculateChunk() {
        beforeChange = new ArrayList<>();
        changeList.clear();
        boolean isAllZero = true;

        for (int i = 0; i < alivePixelList.size(); i++) {
            final int aliveX = alivePixelList.get(i)[0];
            final int aliveY = alivePixelList.get(i)[1];
            //附近的細胞數
            final int count = cellData[aliveX][aliveY];

            //現在細胞的狀態
            final int team = chunkMap[aliveX][aliveY];

            //地圖邊緣
            if (this.locY > maxChunkY || this.locX > maxChunkX || this.locX < minChunkX || this.locY < minChunkY) {
                //活的細胞全部殺
                if (team > 0)
                    changeList.add(new int[]{aliveX, aliveY});
                continue;
            }

            //現在是活的細胞
            if (team > 0) {
                // 生命數量稀少或過多要死亡
                if (count < 2 || count > 3) {
                    changeList.add(new int[]{aliveX, aliveY});
                }

                //這個細胞活著
                //紀錄位置
                this.beforeChange.add((aliveX + "," + aliveY));
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


            if ((count != 3 && team == 0 &&
                    aliveX != 0 && aliveY != 0 && aliveX != this.chunkWidth - 1 && aliveY != this.chunkHeight - 1) ||
                    (count == 0 && team == 0)) {
                alivePixelList.remove(i);
                i--;
            } else
                isAllZero = false;

            //TODO this is for debug
            this.count++;
        }

        //更新地圖
        for (int[] i : changeList) {
            final int team = chunkMap[i[0]][i[1]];
            final String locInt = String.valueOf(i[0] + i[1] * chunkWidth);
            //x, y
            if (team > 0) {
                //計算各自的數量
                if (team == this.teamAID) {
                    calculator.teamACount--;
                    this.teamACount--;
                    //刪除
                    aliveList[0].remove(locInt);
                } else if (team == this.teamBID) {
                    calculator.teamBCount--;
                    this.teamBCount--;
                    //刪除
                    aliveList[1].remove(locInt);
                }
                this.chunkAliveCount--;

                chunkMap[i[0]][i[1]] = 0;
                calculateCellData(i[0], i[1], 0, false);
            } else {
                final int newTeamID = calculateCellData(i[0], i[1], 1, true);
                chunkMap[i[0]][i[1]] = newTeamID;

                //計算各自的數量
                if (newTeamID == this.teamAID) {
                    calculator.teamACount++;
                    this.teamACount++;
                    //紀錄活細胞座標
                    aliveList[0].add(locInt);
                } else if (newTeamID == this.teamBID) {
                    calculator.teamBCount++;
                    this.teamBCount++;
                    //紀錄活細胞座標
                    aliveList[1].add(locInt);
                }
                this.chunkAliveCount++;
            }
        }

        //unload chunk如果沒用
        if (isAllZero)
            this.isAllZero = true;
        if (this.isAllZero && isAllZero && !calculator.needChangeChunk.contains(locX + "," + locY))
            calculator.unloadChunk(locX, locY);

//        System.out.println(Arrays.toString(aliveList));

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
            if (x > -1 && x < chunkWidth && y > -1 && y < chunkHeight) {
                int nowCell;
                //活的
                if (state > 0)
                    nowCell = (cellData[x][y] += 1);
                else
                    nowCell = (cellData[x][y] -= 1);

                //加入關注列表
                int lastCell = chunkMap[x][y];
                if (!isLocInAliveList(x, y) && ((lastCell == 0 && nowCell == 3) || (lastCell > 0 && nowCell > 0))) {
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
                ChunkNoGui nextChunk;

                if (!calculator.chunks.containsKey(cx + "," + cy)) {
                    nextChunk = calculator.loadChunk(cx, cy);
                } else
                    nextChunk = calculator.chunks.get(cx + "," + cy);


                //活的
                if (state > 0)
                    nextChunk.oldCellData.add(new int[]{x, y, 1});
                else
                    nextChunk.oldCellData.add(new int[]{x, y, -1});

                //加入關注列表
                int nowCell = nextChunk.cellData[x][y];
                int lastCell = nextChunk.chunkMap[x][y];
                if (!nextChunk.isLocInAliveList(x, y) && ((lastCell == 0 && nowCell == 3) || (lastCell > 0 && nowCell > 0))) {
                    nextChunk.alivePixelList.add(new int[]{x, y});
                }

                //需要之後處理
                if (!calculator.needChangeChunk.contains(cx + "," + cy)) {
                    calculator.needChangeChunk.add(cx + "," + cy);
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

    public boolean isLocInAliveList(int x, int y) {
        if (alivePixelList == null)
            return false;

        for (final int[] i : alivePixelList) {
            if (i[0] == x && i[1] == y)
                return true;

            //TODO this is for debug
            count++;
        }
        return false;
    }

    public int getBeforeChangePixel(int x, int y) {
        if (beforeChange == null)
            return -1;

        final String kernel = x + "," + y;
        for (int i = 0; i < beforeChange.size(); i += 2) {
            if (kernel.equals(beforeChange.get(i)))
                return (int) beforeChange.get(i + 1);

            //TODO this is for debug
            count++;
        }
        return -1;
    }

    public int getPixelValue(int x, int y) {
        return chunkMap[x][y];
    }
}
