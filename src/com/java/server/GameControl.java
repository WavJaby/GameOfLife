package com.java.server;

import com.java.server.game.ChunkNoGui;
import com.java.server.game.GameCalculatorNoGui;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class GameControl implements Runnable, ClientHandler.PlayerEvent {
    //人數限制
    public static int maxPlayer = 10;
    //人數
    private int playerCount;

    //遊戲
    private GameCalculatorNoGui game;

    //遊戲狀態
    public boolean gameStart;

    private Map<String, Map<String, Object>> playerData = new HashMap<>();

    GameControl() {
        gameStart = true;
        playerCount = 0;
    }

    private CountDownLatch gameCalculateWait;

    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName());

        long gameTickTimer = 0;
//        int tickTime = (1000 * 1000000) / 10;
        int tickTime = 100 * 1000000;//10ms


        int debugPrintCount = 0;
        long debugPrintTimer = 0;
        int eachPrintNum = (1000000 * 1000 / 2) / tickTime;

        game = new GameCalculatorNoGui();
        int calculateCount = 0;
        while (gameStart) {
            //計算chunk更新
            if (playerCount > 0 && (System.nanoTime() - gameTickTimer) > tickTime) {
//            if ((System.nanoTime() - gameTickTimer) > tickTime) {
                gameCalculateWait = new CountDownLatch(1);

                //開始計時
                gameTickTimer = System.nanoTime();


                //準備傳送更新的chunk
                new Thread(this::sendChunkUpdateToPlayer).start();
                //計算地圖
                calculateCount = game.calculateAllChunks();
                //結束計時
                debugPrintTimer += System.nanoTime() - gameTickTimer;
                //繼續資料傳送
                gameCalculateWait.countDown();

                if (game.worldTime == 100) {
                    game.addCells();
                }

                debugPrintCount++;

//                if (game.worldTime == 600) {
//                    gameStart = false;
//                }
            }

            //debug
            if (debugPrintCount > eachPrintNum || !gameStart) {
                debugPrintCount = 0;

                System.out.print("\r每禎計算時間: " + ((float) debugPrintTimer / 1000000) / eachPrintNum + "ms, ");
                System.out.print("計算次數: " + calculateCount + ", ");
                System.out.print("世界時間: " + game.worldTime + ", ");
//                System.out.print(game.chunks);

                debugPrintTimer = 0;
            }

            try {
                long timer = System.nanoTime();

                //等待玩家放置處理
                placingCell.await();
                //等待如果玩家正在移動
                viewChanging.await();
                //等待取得更新的地圖資料
                gettingMapUpdate.await();

//                System.out.print("\r" + ((float) (System.nanoTime() - gameTickTimer) / 1000000));
                Thread.sleep(0, 50000);
            } catch (InterruptedException e) {
                viewChangingCount = 0;
                e.printStackTrace();
            }
        }
    }

    private CountDownLatch gettingMapUpdate = new CountDownLatch(0);

    private void sendChunkUpdateToPlayer() {
        gettingMapUpdate = new CountDownLatch(MainServer.clients.size());
        MainServer.clients.entrySet().parallelStream().forEach(i -> {
            JsonBuilder viewArea = new JsonBuilder();

            Map<String, Object> thisPlayerData = playerData.get(i.getKey());
            if (thisPlayerData == null) {
                gettingMapUpdate.countDown();
                return;
            }

            //更新玩家視野中的chunk
            String[] updateChunkLoc = ((String) thisPlayerData.get("viewArea")).split(",");

            //如果正在計算要等待
            try {
                gameCalculateWait.await();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            int playerWorldTime = (int) thisPlayerData.get("worldTime");

            //如果被算過就不用更新
            if (playerWorldTime == game.worldTime) {
                gettingMapUpdate.countDown();
                return;
            }

            //更新玩家事視野
            getViewAreaUpdate(updateChunkLoc, playerWorldTime, viewArea);
            //更新玩家時間
            thisPlayerData.put("worldTime", game.worldTime);
            //資料取得完畢
            gettingMapUpdate.countDown();

            JsonBuilder builder = new JsonBuilder();
            builder.append("viewArea", viewArea);
            builder.append("teamACount", game.teamACount);
            builder.append("teamBCount", game.teamBCount);
            sendData(builder, "chunkUpdate", i.getValue());
        });
    }

    //Data process
    private final String splitDataStr = "\r\n\r\n";
    private final String splitKeyStr = "\r\n";

    private Map<String, Object> getLabel(String data, String[] labels) {
        int startLoc;
        int endLoc = 0;

        Map<String, Object> labelData = new HashMap<>();
        //取得玩家資料
        for (String label : labels) {
            //尋找變數
            startLoc = data.indexOf(label + splitKeyStr, endLoc);
            if (startLoc > -1) {
                startLoc += label.length() + splitKeyStr.length();
                //尋找資料結束
                endLoc = data.indexOf(splitDataStr, startLoc);
                if (endLoc > -1) {
                    labelData.put(label, data.substring(startLoc, endLoc));
                } else
                    labelData.put("fail", "data wrong");
            } else
                labelData.put("fail", "cant find variable: " + label);

        }
        return labelData;
    }

    //login
    private boolean login(String data, String clientID, ClientHandler client) {
        final String[] loginLabel = {"playerName", "teamID"};
        //已經登入過
        if (playerData.containsKey(clientID)) {
            loginFailed("already login", client);
            return false;
        }

        //取得資料
        Map<String, Object> thisPlayerData = getLabel(data, loginLabel);
        if (thisPlayerData.containsKey("fail")) {
            loginFailed((String) thisPlayerData.get("fail"), client);
            return false;
        }

        if (((String) thisPlayerData.get("playerName")).length() == 0) {
            loginFailed("name empty", client);
            return false;
        }

        int teamID = Integer.parseInt((String) thisPlayerData.get("teamID"));
        if (teamID == 0 || teamID > 2) {
            loginFailed("teamID wrong", client);
            return false;
        }
        System.out.println(teamID);

        thisPlayerData.put("viewArea", "");
        thisPlayerData.put("worldTime", game.worldTime);
        thisPlayerData.put("teamID", teamID);
        playerData.put(clientID, thisPlayerData);

        return true;
    }

    private void loginFailed(String reason, ClientHandler client) {
        JsonBuilder jsonBuilder = new JsonBuilder();
        client.sendData((char) GameOpcode.loginFailed +
                jsonBuilder.append("reason", reason).getResult()
        );
    }

    private void loginSuccess(String clientID, ClientHandler client) {
        JsonBuilder playerLoc = new JsonBuilder();
        playerLoc.append("x", 0);
        playerLoc.append("y", 0);
        JsonBuilder chunkInfo = new JsonBuilder();
        chunkInfo.append("width", game.cWidth);
        chunkInfo.append("height", game.cHeight);

        JsonBuilder jsonBuilder = new JsonBuilder();
        jsonBuilder.append("playerName", (String) playerData.get(clientID).get("playerName"));
        jsonBuilder.append("playerID", clientID);
        jsonBuilder.append("chunkInfo", chunkInfo);
        jsonBuilder.append("playerLoc", playerLoc);
        jsonBuilder.append("worldTime", game.worldTime);
        jsonBuilder.append("teamID", (int) playerData.get(clientID).get("teamID"));

        client.sendData((char) GameOpcode.loginSuccess +
                jsonBuilder.getResult()
        );
    }

    //chunk
    private void receiveData(String data, String clientID, ClientHandler client) {
        final String[] labels = {"type"};

        //如果玩家不存在
        if (!playerData.containsKey(clientID)) {
            sendError("unknown playerID", client);
            return;
        }

        //取得資料
        Map<String, Object> dataLabel = getLabel(data, labels);
        if (dataLabel.containsKey("fail")) {
            return;
        }


        switch ((String) dataLabel.get("type")) {
            case "viewChange":
//                System.out.println("viewChange");
                viewChange(data, clientID, client);
                break;
            case "place":
                System.out.println("place");
                placeCell(data, clientID, client);
                break;
            default:
                sendError("unknown event", client);
                break;
        }
    }


    private CountDownLatch placingCell = new CountDownLatch(0);
    private int placingCellCount = 0;

    private void placeCell(String data, String clientID, ClientHandler client) {
        final String[] labels = {"placeList"};
        //取得資料
        Map<String, Object> dataLabel = getLabel(data, labels);
        if (dataLabel.containsKey("fail")) {
            return;
        }
        String[] placeList = ((String) dataLabel.get("placeList")).split(";");
        int playerTeamID = (int) playerData.get(clientID).get("teamID");

        String[] chunkChangeList = new String[placeList.length / 2];
        int[][][] cellChangeList = new int[placeList.length / 2][][];

        //解data
        for (int i = 0; i < placeList.length; i += 2) {
            //在chunk中的位置
            String[] locList = placeList[i + 1].split(",");
            //轉換成int array
            int[][] cellLocation = new int[locList.length][];
            for (int j = 0; j < locList.length; j++) {
                int loc = Integer.parseInt(locList[j]);
                cellLocation[j] = new int[]{loc % game.cWidth, loc / game.cWidth};
            }
            chunkChangeList[i / 2] = placeList[i];
            cellChangeList[i / 2] = cellLocation;

            System.out.println(placeList[i]);
            System.out.println(Arrays.deepToString(cellLocation));
        }

        //開始等待
        if (placingCellCount == 0)
            placingCell = new CountDownLatch(1);

        //如果正在計算要等待
        try {
            gameCalculateWait.await();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        placingCellCount++;
        //加入地圖
        for (int i = 0; i < chunkChangeList.length; i++) {
            ChunkNoGui chunk = game.chunks.get(chunkChangeList[i]);
            synchronized (game.chunks.values()) {
                if (chunk == null)
                    chunk = game.loadChunk(chunkChangeList[i]);
            }
            chunk.addCells(cellChangeList[i], playerTeamID);
        }
        game.calculateChangeLaterChunk();
        placingCellCount--;

        //所有玩家都處理完後取消等待
        if (placingCellCount == 0)
            placingCell.countDown();
    }


    private CountDownLatch viewChanging = new CountDownLatch(0);
    private int viewChangingCount = 0;

    private void viewChange(String data, String clientID, ClientHandler client) {
        final String[] labels = {"worldTime", "loadList", "viewArea"};

        //取得資料
        Map<String, Object> dataLabel = getLabel(data, labels);
        if (dataLabel.containsKey("fail")) {
            return;
        }

        Map<String, Object> thisPlayerData = playerData.get(clientID);
        //取得需要載入的chunk
        String[] requireList = ((String) dataLabel.get("loadList")).split(";");
        //取得玩家視野
//        String[] updateChunkLoc = ((String) thisPlayerData.get("viewArea")).split(",");
        //玩家的世界時間
        int clientWorldTime = Integer.parseInt((String) dataLabel.get("worldTime"));
        //更新玩家視野
        thisPlayerData.put("viewArea", (String) dataLabel.get("viewArea"));
        //更新玩家時間
        thisPlayerData.put("worldTime", clientWorldTime);

        //資料
        JsonBuilder loadList = new JsonBuilder();
        JsonBuilder viewArea = new JsonBuilder();
        JsonBuilder outputData = new JsonBuilder();

        CountDownLatch dataGet = new CountDownLatch(1);
        Thread thread1 = new Thread(() -> {
            //取得需要的chunk
            getRequireChunk(requireList, loadList, outputData);
            dataGet.countDown();
        });
//        Thread thread2 = new Thread(() -> {
//            //取得玩家視野內的更新
//            getViewAreaUpdate(updateChunkLoc, clientWorldTime, viewArea);
//            dataGet.countDown();
//        });

        //讓計算等待所有人更新完視野
        if (viewChangingCount == 0)
            viewChanging = new CountDownLatch(1);

        //如果正在計算要等待
        try {
            gameCalculateWait.await();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        viewChangingCount++;

        //開始取得地圖資料
        thread1.start();
//        thread2.start();
        //等待取得資料
        try {
            dataGet.await();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        viewChangingCount--;

        //所有人都計算完成
        if (viewChangingCount == 0)
            viewChanging.countDown();

        outputData.append("loadList", loadList);
        outputData.append("viewArea", viewArea);
        //傳送資料
        sendData(outputData, "viewChange", client);
    }

    private void getRequireChunk(String[] requireList, JsonBuilder requireChunk, JsonBuilder outData) {
        StringBuilder builder = new StringBuilder();
        builder.append("[");

        if (requireList[0].length() > 0)
            for (String i : requireList) {
                ChunkNoGui chunk;
                //有chunk有東西
                if ((chunk = game.chunks.get(i)) != null &&
                        (chunk.aliveList[0].size() > 0 || chunk.aliveList[1].size() > 0)) {
                    requireChunk.appendArray(i, Arrays.toString(chunk.aliveList));
                } else {
                    if (builder.length() > 1)
                        builder.append(",");

                    builder.append("\"").append(i).append("\"");
                }
            }
        builder.append("]");
        outData.appendArray("nullChunk", builder.toString());
    }

    private void getViewAreaUpdate(String[] updateChunkLoc, int clientWorldTime, JsonBuilder viewArea) {
        if (updateChunkLoc.length > 3 && clientWorldTime < game.worldTime) {
            int StartX = Integer.parseInt(updateChunkLoc[0]);
            int StartY = Integer.parseInt(updateChunkLoc[1]);
            int CountX = Integer.parseInt(updateChunkLoc[2]);
            int CountY = Integer.parseInt(updateChunkLoc[3]);
            for (int x = 0; x < CountX; x++) {
                int cx = StartX + x;
                for (int y = 0; y < CountY; y++) {
                    int cy = StartY + y;
                    ChunkNoGui chunk;
                    if ((chunk = game.chunks.get(cx + "," + cy)) != null) {
                        StringBuilder builder = new StringBuilder();
                        builder.append("[");
                        for (int i = 0; i < chunk.changeList.size(); i++) {
                            if (i > 0)
                                builder.append(",");
                            int[] locData = chunk.changeList.get(i);
                            builder.append("[")
                                    .append(locData[0] + locData[1] * game.cWidth)
                                    .append(",")
                                    .append(chunk.getPixelValue(locData[0], locData[1]))
                                    .append("]");
                        }
                        builder.append("]");
                        viewArea.appendArray(cx + "," + cy, builder.toString());
                    }
                }
            }
        }
    }

    private void sendData(JsonBuilder data, String type, ClientHandler client) {
        JsonBuilder jsonBuilder = new JsonBuilder();
        jsonBuilder.append("worldTime", game.worldTime);
        jsonBuilder.append("type", type);
        jsonBuilder.append("data", data);

        String result = jsonBuilder.getResult();
        client.sendData((char) GameOpcode.data + result);
    }

    //send error
    private void sendError(String reason, ClientHandler client) {
        JsonBuilder jsonBuilder = new JsonBuilder();
        jsonBuilder.append("reason", reason);
        client.sendData((char) GameOpcode.error + jsonBuilder.getResult());
    }

    @Override
    public void ReceiveData(char opcode, String data, String clientID, ClientHandler client) {
        switch (opcode) {
            case GameOpcode.login:
                System.out.println("Player login");
                //登入成功
                if (login(data, clientID, client)) {
                    loginSuccess(clientID, client);
                    System.out.println("Player login success");
                    playerCount++;
                } else
                    System.out.println("Player login failed");

                System.out.println("player count: " + playerCount);
                break;
            case GameOpcode.playerDisconnect:
                //中斷連線
                System.out.println("Player disconnect");
                client.closeSocket();

                System.out.println("player count: " + playerCount);
                break;
            case GameOpcode.data:
                receiveData(data, clientID, client);

                break;
            default:
                break;
        }

    }

    @Override
    public void ClientDisconnect(String clientID) {
        if (playerData.containsKey(clientID)) {
            playerData.remove(clientID);
            playerCount--;
        }
    }
}
