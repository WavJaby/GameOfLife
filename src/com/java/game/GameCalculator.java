package com.java.game;

import java.awt.*;
import java.util.*;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class GameCalculator {
    public static float screenScale = 0.3f;
    public static Map<String, Chunk> chunks = new LinkedHashMap<>();
    public static List<String> needChangeChunk = new ArrayList<>();

    //world
    int time = 0;
    static int mapX = 300;
    static int mapY = 300;

    //chunk info
    int cWidth;
    int cHeight;
    int cPixSize;
    int cGap;

    //debug
    int count = 0;

    //thread
    ExecutorService service = Executors.newFixedThreadPool(4);

    public GameCalculator() {
        final Chunk homeChunk = new Chunk(0, 0);
        cWidth = homeChunk.chunkWidth;
        cHeight = homeChunk.chunkHeight;
        cPixSize = homeChunk.pixelSize;
        cGap = homeChunk.gap;

        chunks.put("0,0", homeChunk);

        //初始化
        CellData cellData = new CellData();
    }

//    public GameCalculator(int x, int y, ID id) {
//        super(x, y, id);
//        final Chunk homeChunk = new Chunk(0, 0);
//        cWidth = homeChunk.chunkWidth;
//        cHeight = homeChunk.chunkHeight;
//        cPixSize = homeChunk.pixelSize;
//        cGap = homeChunk.gap;
//
//        chunks.put("0,0", homeChunk);
//
//        //初始化
//        CellData cellData = new CellData();
////        homeChunk.addCells(new int[][]{
////                {3, 4},
////                {2, 5},
////                {3, 6},
////                {5, 4},
////        }, 1);
////        homeChunk.addCells(new int[][]{
////                {6, 6},
////                {5, 7},
////                {6, 7},
////                {7, 7},
////        }, 2);
////        calculateChangeLaterChunk();
//
//        homeChunk.addCells(cellData.cellData00, 1);
//
//        if (!chunks.containsKey("1,0"))
//            chunks.put("1,0", loadChunk(1, 0));
//        chunks.get("1,0").addCells(cellData.cellData10, 1);
//
//        if (!chunks.containsKey("0,1"))
//            chunks.put("0,1", loadChunk(0, 1));
//        chunks.get("0,1").addCells(cellData.cellData01, 2);
//
//        if (!chunks.containsKey("1,1"))
//            chunks.put("1,1", loadChunk(1, 1));
//        chunks.get("1,1").addCells(cellData.cellData11, 2);
//        calculateChangeLaterChunk();
//    }

    public void drawAllChunks(Graphics2D g) {
        final int pixSize = (int) (cPixSize * screenScale + cGap);
        final int adjustX = mapX < 0 ? 1 : 0;
        final int adjustY = mapY < 0 ? 1 : 0;

        final int xChunkCount = (Game.WIDTH / (pixSize * cWidth)) + 1;
        final int yChunkCount = (Game.HEIGHT / (pixSize * cHeight)) + 1;

        for (int x = -1; x < xChunkCount; x++) {
            //計算chunk開始位置X
            final int startX = ((-mapX / pixSize / cWidth) + x + adjustX) * pixSize * cWidth;
            //計算chunk位置X
            final int cx = startX / pixSize / cWidth;

            for (int y = -1; y < yChunkCount; y++) {
                //計算chunk開始位置Y
                final int startY = ((-mapY / pixSize / cHeight) + y + adjustY) * pixSize * cHeight;
                //計算chunk位置Y
                final int cy = startY / pixSize / cHeight;

                if (chunks.containsKey(cx + "," + cy))
                    chunks.get(cx + "," + cy).drawChunk(g);
            }
        }

        g.setStroke(new BasicStroke(cGap));
        g.setColor(Color.darkGray);
        if (screenScale > 0.6) {
            final int startX = ((-mapX / pixSize / cWidth) + adjustX - 1) * pixSize * cWidth + mapX;
            final int startY = ((-mapY / pixSize / cHeight) + adjustY - 1) * pixSize * cHeight + mapY;
            final int viewWidth = startX + (xChunkCount + 1) * pixSize * cWidth;
            final int viewHeight = startY + (yChunkCount + 1) * pixSize * cHeight;
            for (int y = 0; y < (yChunkCount + 1) * cHeight; y++) {
                g.drawLine(startX, startY + y * pixSize,
                        viewWidth, startY + y * pixSize);
            }

            for (int x = 0; x < (xChunkCount + 1) * cWidth; x++) {
                g.drawLine(startX + x * pixSize, startY,
                        startX + x * pixSize, viewHeight);
            }
        }
    }

    //計算所有chunk
    public void calculateAllChunks() {
        final long timer = System.nanoTime();

        //取得所有chunk
        Object[] chunks1 = chunks.values().toArray();
        //計數器
        CountDownLatch countDownLatch = new CountDownLatch(chunks1.length);

        //refresh all chunk
        for (Object chunk : chunks1) {
            count += ((Chunk) chunk).calculateChunk();
            countDownLatch.countDown();
            //TODO this is for debug
            count++;
        }

//        //refresh all chunk
//        for (Object chunk : chunks1) {
//            service.execute(() -> {
//                synchronized (chunks1) {
//                    count += ((Chunk) chunk).calculateChunk();
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
//                        count += ((Chunk) chunks1[j]).calculateChunk();
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
//                count += ((Chunk) chunks1[j]).calculateChunk();
//                countDownLatch.countDown();
//                //TODO this is for debug
//                count++;
//            }
//        });
//
//        service.execute(() -> {
//            for (int j = eachTime; j < chunks1.length; j++) {
//                count += ((Chunk) chunks1[j]).calculateChunk();
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
        calculateChangeLaterChunk();

        //標記成沒算過
        for (Object chunk : chunks1) {
            ((Chunk) chunk).beforeChange = null;
            //TODO this is for debug
            count++;
        }
        final long nano = (System.nanoTime() - timer);


        System.out.print("\r每禎計算時間: " + ((float) nano / 1000000) + "ms, ");
        System.out.print("計算次數: " + count + ", ");
        System.out.print(++time + ", ");
        count = 0;
    }

    //經過chunk邊界的資料需要等所有chunk計算完畢再更新資料
    public void calculateChangeLaterChunk() {
        for (String i : needChangeChunk) {
            final Chunk chunk;
            for (int[] j : (chunk = chunks.get(i)).oldCellData) {
                chunk.cellData[j[0]][j[1]] += j[2];
                //這裡可能會生成
                if (!chunk.isLocInAliveList(j[0], j[1])) {
                    chunk.alivePixelList.add(new int[]{j[0], j[1]});
                }
                //將新的chunk或其他設定成沒算過
                chunk.beforeChange = null;

                //TODO this is for debug
                count++;
            }
            chunk.oldCellData.clear();
        }
        needChangeChunk.clear();
    }

    public static Chunk loadChunk(int x, int y) {
        final Chunk chunk = new Chunk(x, y);
        chunks.put(x + "," + y, chunk);
//        chunk.drawChunk(g);
        // console.log("load chunk: " + x + "," + y)
        return chunk;
    }

    public static void unloadChunk(int x, int y) {
        if (chunks.get(x + "," + y) != null)
            chunks.remove(x + "," + y);
    }

//    @Override
//    public void tick(Graphics g) {
//        calculateAllChunks();
//    }
//
//    @Override
//    public void render(Graphics g) {
//        drawAllChunks((Graphics2D) g);
//    }
}