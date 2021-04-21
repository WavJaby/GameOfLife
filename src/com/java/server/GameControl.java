package com.java.server;

import com.java.server.game.ChunkNoGui;
import com.java.server.game.GameCalculatorNoGui;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;

public class GameControl implements Runnable, ClientHandler.PlayerEvent {
    //人數限制
    public static int maxPlayer = 10;
    //人數
    private int playerCount;

    //遊戲
    private GameCalculatorNoGui game;
    private CountDownLatch countDownLatch = new CountDownLatch(1);

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
        long gameTickTimer = 0;
//        int tickTime = (1000 * 1000000) / 10;
        int tickTime = 10 * 1000000;


        int debugPrintCount = 0;
        long debugPrintTimer = 0;
        int eachPrintNum = (1000000 * 1000 / 2) / tickTime;

        game = new GameCalculatorNoGui();
        int calculateCount = 0;
        while (gameStart) {
            //計算chunk更新
            if (playerCount > 0 && (System.nanoTime() - gameTickTimer) > tickTime) {
                gameCalculateWait = new CountDownLatch(1);
                gameTickTimer = System.nanoTime();
                calculateCount = game.calculateAllChunks();
                debugPrintTimer += System.nanoTime() - gameTickTimer;
                //傳送更新的chunk
                sendChunkUpdateToPlayer();
                gameCalculateWait.countDown();
                //計算花費時間

                debugPrintCount++;
            }

            //debug
            if (debugPrintCount > eachPrintNum) {
                debugPrintCount = 0;

                System.out.print("\r每禎計算時間: " + ((float) debugPrintTimer / 1000000) / eachPrintNum + "ms, ");
                System.out.print("計算次數: " + calculateCount + ", ");
                System.out.print("世界時間: " + game.worldTime + ", ");
//                System.out.print(game.chunks);

                debugPrintTimer = 0;
            }

            try {
                Thread.sleep(0, 1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    private void sendChunkUpdateToPlayer() {
        MainServer.clients.entrySet().parallelStream().forEach(i -> {
            JsonBuilder viewArea = new JsonBuilder();

            Map<String, Object> thisPlayerData = playerData.get(i.getKey());
            if(thisPlayerData == null)
                return;

            //更新玩家視野中的chunk
            String[] updateChunkLoc = ((String) thisPlayerData.get("viewArea")).split(",");
            getViewAreaUpdate(updateChunkLoc, (int)thisPlayerData.get("worldTime"), viewArea);
            thisPlayerData.put("worldTime", game.worldTime);


            JsonBuilder builder = new JsonBuilder();
            builder.append("viewArea", viewArea);
            sendData(builder, "chunkUpdate", i.getValue());
        });

//        for (Map.Entry<String, ClientHandler> i : MainServer.clients.entrySet()) {
//            JsonBuilder viewArea = new JsonBuilder();
//
//            Map<String, Object> thisPlayerData = playerData.get(i.getKey());
//            if(thisPlayerData == null)
//                continue;
//
//            //更新玩家視野中的chunk
//            String[] updateChunkLoc = ((String) thisPlayerData.get("viewArea")).split(",");
//            getViewAreaUpdate(updateChunkLoc, (int)thisPlayerData.get("worldTime"), viewArea);
//            thisPlayerData.put("worldTime", game.worldTime);
//
//
//            JsonBuilder builder = new JsonBuilder();
//            builder.append("viewArea", viewArea);
//            sendData(builder, "chunkUpdate", i.getValue());
//        }
    }

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
        final String[] loginLabel = {"playerName"};
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

        thisPlayerData.put("viewArea", "");
        thisPlayerData.put("worldTime", game.worldTime);
        playerData.put(clientID, thisPlayerData);
        System.out.println(playerData);

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
        jsonBuilder.append("playerTeamID", game.teamAID);

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
                System.out.println("viewChange");
                viewChange(data, clientID, client);
                break;
            default:
                sendError("unknown event", client);
                break;
        }
    }

    private void viewChange(String data, String clientID, ClientHandler client) {
        final String[] labels = {"worldTime", "loadList", "viewArea"};

        //取得資料
        Map<String, Object> dataLabel = getLabel(data, labels);
        if (dataLabel.containsKey("fail")) {
            return;
        }

        //取得需要載入的chunk
        String[] loadChunkLoc = ((String) dataLabel.get("loadList")).split(";");

        //如果正在計算要等待
        try {
            gameCalculateWait.await();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        //傳出資料
        JsonBuilder loadChunk = new JsonBuilder();
        JsonBuilder viewArea = new JsonBuilder();
        for (String i : loadChunkLoc) {
            ChunkNoGui chunk;
            //有chunk有東西
            if ((chunk = game.chunks.get(i)) != null &&
                    chunk.aliveList.size() > 0) {
                loadChunk.appendArray(i, chunk.aliveList.toString()
                        .replaceFirst("\\[", "[[")
                        .replaceFirst("]", "]]")
                        .replace(", ", "],["));
            }
        }

        Map<String, Object> thisPlayerData = playerData.get(clientID);

        //更新玩家視野中的chunk
        String[] updateChunkLoc = ((String) thisPlayerData.get("viewArea")).split(",");
        int clientWorldTime = Integer.parseInt((String) dataLabel.get("worldTime"));
        getViewAreaUpdate(updateChunkLoc, clientWorldTime, viewArea);

        JsonBuilder builder = new JsonBuilder();
        builder.append("loadList", loadChunk);
        builder.append("viewArea", viewArea);

        sendData(builder, "viewChange", client);

        //更新玩家視野
        thisPlayerData.put("viewArea", (String) dataLabel.get("viewArea"));
        thisPlayerData.put("worldTime", clientWorldTime);
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
//        System.out.println(result);
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
        System.out.println();
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

//                System.out.println(data);
//                System.out.println(data.length());

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
