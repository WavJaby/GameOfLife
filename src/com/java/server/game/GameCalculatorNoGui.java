package com.java.server.game;

import com.java.game.CellData;

import java.util.*;
import java.util.concurrent.*;

public class GameCalculatorNoGui {
    public static float screenScale = 0.3f;
    public Map<String, ChunkNoGui> chunks = new ConcurrentHashMap<>();
    public CopyOnWriteArrayList<String> needChangeChunk = new CopyOnWriteArrayList<>();

    //world
    public int worldTime = 0;

    //chunk info
    public int cWidth;
    public int cHeight;
    public int cPixSize;
    int cGap;

    //team
    public final int teamAID = 1;
    public final int teamBID = 2;

    //debug
    public int calculateTime = 0;

    //兩隊的數量
    static int teamACount = 0;
    static int teamBCount = 0;
    //chunk的範圍
    final static int minChunkX = -1000, minChunkY = -1000, maxChunkX = 1000, maxChunkY = 1000;

    //thread
    ExecutorService service = Executors.newFixedThreadPool(4);

    public GameCalculatorNoGui() {
        final ChunkNoGui homeChunk = new ChunkNoGui(0, 0, this);
        cWidth = homeChunk.chunkWidth;
        cHeight = homeChunk.chunkHeight;
        cPixSize = homeChunk.pixelSize;
        cGap = homeChunk.gap;
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

    //計算所有chunk
    public int calculateAllChunks() {
//        //取得所有chunk
//        Object[] chunks1 = chunks.values().toArray();
//        //計數器
//        CountDownLatch countDownLatch = new CountDownLatch(chunks1.length);
//        //refresh all chunk
//        for (Object chunk : chunks1) {
//            calculateTime += ((ChunkNoGui) chunk).calculateChunk();
//            //TODO this is for debug
//            calculateTime++;
//            countDownLatch.countDown();
//        }

        CountDownLatch countDownLatch = new CountDownLatch(chunks.size());
//        Collection<ChunkNoGui> chunkCache = new ArrayList<>(chunks.values());
        chunks.values().parallelStream().forEach((item) -> {
            calculateTime += item.calculateChunk();
            //TODO this is for debug
            calculateTime++;
            countDownLatch.countDown();
        });

//        //refresh all chunk
//        for (Object chunk : chunks1) {
//            service.execute(() -> {
//                synchronized (chunks1) {
//                    count += ((ChunkNoGui) chunk).calculateChunk();
//                    countDownLatch.countDown();
//                    //TODO this is for debug
//                    count++;
//                }
//            });
//        }

//        int eachTime = chunks1.length / 4;
//        for (int i = 0; i < 4; i++) {
//            int finalI = i;
//            service.execute(() -> {
//                int times = finalI < 3 ? eachTime * (finalI + 1) : chunks1.length;
//                synchronized (chunks1) {
//                    for (int j = eachTime * finalI; j < times; j++) {
//                        count += ((ChunkNoGui) chunks1[j]).calculateChunk();
//                        countDownLatch.countDown();
//                        //TODO this is for debug
//                        count++;
//                    }
//                }
//            });
//        }

//        int eachTime = chunks1.length / 2;
//        service.execute(() -> {
//            for (int j = 0; j < eachTime; j++) {
//                count += ((ChunkNoGui) chunks1[j]).calculateChunk();
//                countDownLatch.countDown();
//                //TODO this is for debug
//                count++;
//            }
//        });
//
//        service.execute(() -> {
//            for (int j = eachTime; j < chunks1.length; j++) {
//                count += ((ChunkNoGui) chunks1[j]).calculateChunk();
//                countDownLatch.countDown();
//                //TODO this is for debug
//                count++;
//            }
//        });
//
//        try {
//            countDownLatch.await();
//        } catch (InterruptedException e) {
//            e.printStackTrace();
//        }


        //計算需要增加的邊緣區域

        try {
            countDownLatch.await();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        calculateChangeLaterChunk();

        //標記成沒算過
        for (Object chunk : chunks.values()) {
            ((ChunkNoGui) chunk).beforeChange = null;
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

    public void unloadChunk(int x, int y) {
        if (chunks.get(x + "," + y) != null)
            chunks.remove(x + "," + y);
    }
}