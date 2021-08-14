package com.java.server.game;

import com.java.game.CellData;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class GameCalculatorNoGui {
    public Map<String, ChunkNoGui> chunks = new ConcurrentHashMap<>();
    public List<String> needChangeChunk = new ArrayList<>();

    //world
    public int worldTime = 0;

    //chunk info
    public int cWidth;
    public int cHeight;

    //team
    public final int teamAID = 1;
    public final int teamBID = 2;

    //debug
    public int calculateTime = 0;

    //兩隊的數量
    public int teamACount = 0;
    public int teamBCount = 0;
    //chunk的範圍
    final static int minChunkX = -1000, minChunkY = -1000, maxChunkX = 1000, maxChunkY = 1000;

    //thread
    ExecutorService service = Executors.newFixedThreadPool(4);

    public GameCalculatorNoGui() {
        final ChunkNoGui homeChunk = new ChunkNoGui(0, 0, this);
        cWidth = homeChunk.chunkWidth;
        cHeight = homeChunk.chunkHeight;
        chunks.put("0,0", homeChunk);

//        homeChunk.addCells(new int[][]{
//                new int[]{1, 0},
//                new int[]{2, 1},
//                new int[]{0, 2},
//                new int[]{1, 2},
//                new int[]{2, 2},
//        }, 1);

        CellData cellData = new CellData();

        homeChunk.addCells(cellData.cellData00, 1);

        if (!chunks.containsKey("1,0"))
            chunks.put("1,0", loadChunk(1, 0));
        chunks.get("1,0").addCells(cellData.cellData10, 1);

        if (!chunks.containsKey("0,1"))
            chunks.put("0,1", loadChunk(0, 1));
        chunks.get("0,1").addCells(cellData.cellData01, 2);

        if (!chunks.containsKey("1,1"))
            chunks.put("1,1", loadChunk(1, 1));
        chunks.get("1,1").addCells(cellData.cellData11, 2);
        calculateChangeLaterChunk();
    }

    public void addCells() {
        chunks.get("0,0").addCells(new int[][]{new int[]{13, 13}}, 1);
        calculateChangeLaterChunk();
    }

    //計算所有chunk
    public int calculateAllChunks() {
        //refresh all chunk
        for (ChunkNoGui chunk : chunks.values()) {
            calculateTime += chunk.calculateChunk();
            //TODO this is for debug
            calculateTime++;
        }

        calculateChangeLaterChunk();

        //標記成沒算過
        for (ChunkNoGui chunk : chunks.values()) {
            chunk.beforeChange = null;
            //TODO this is for debug
            calculateTime++;
        }
        worldTime++;
        int cache = calculateTime;
        calculateTime = 0;
        return cache;
    }

    //經過chunk邊界的資料需要等所有chunk計算完畢再更新資料
    public void calculateChangeLaterChunk() {
        for (String i : needChangeChunk) {
            final ChunkNoGui chunk;
            for (int[] j : (chunk = chunks.get(i)).oldCellData) {
                chunk.cellData[j[0]][j[1]] += j[2];
                //這裡可能會生成
                if (!chunk.isLocInAliveList(j[0], j[1])) {
                    chunk.alivePixelList.add(new int[]{j[0], j[1]});
                }
                //將新的chunk或其他設定成沒算過
                chunk.beforeChange = null;

                //TODO this is for debug
                calculateTime++;
            }
            chunk.oldCellData.clear();
        }
        needChangeChunk.clear();
    }

    public ChunkNoGui loadChunk(int x, int y) {
        final ChunkNoGui chunk = new ChunkNoGui(x, y, this);
        chunks.put(x + "," + y, chunk);
        return chunk;
    }

    public ChunkNoGui loadChunk(String loc) {
        String[] location = loc.split(",");
        final ChunkNoGui chunk = new ChunkNoGui(
                Integer.parseInt(location[0]),
                Integer.parseInt(location[1]),
                this);
        chunks.put(loc, chunk);
        return chunk;
    }

    public void unloadChunk(int x, int y) {
        if (chunks.get(x + "," + y) != null)
            chunks.remove(x + "," + y);
    }
}