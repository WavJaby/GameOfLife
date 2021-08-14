package com.java.server;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadPoolExecutor;

public class MainServer implements ClientHandler.ClientEvent, Runnable {
    private static final String TAG = "Main";
    private static final int portNumber = 25565;
    private static ServerSocket serverSocket;
    public static boolean mainStart;

    //客戶端ID
    public static final Map<String, ClientHandler> clients = new ConcurrentHashMap<>();

    public static int clientCount = 0;

    //處理程序
    private static ExecutorService service = Executors.newFixedThreadPool(GameControl.maxPlayer + 1);

    private static GameControl gameControl;

    @Override
    public void run() {
        clients.clear();
        mainStart = true;
        //server
        try {
            serverSocket = new ServerSocket(portNumber);
            System.out.println("[" + TAG + "]伺服器開啟");

            while (mainStart) {
                //等待連接
                Socket clientSocket = serverSocket.accept();
                //生成ID
                String clientID = generateID();

                //開啟客戶端
                ClientHandler requestHandler = new ClientHandler(clientSocket, clientID);

                //人數過多斷開連接
                if (((ThreadPoolExecutor) service).getActiveCount() == GameControl.maxPlayer) {
                    //人數過多的處理
                    service.submit(() -> {
                        requestHandler.doHandShake();
                        String failedMessage = new JsonBuilder().append("reason", "maxPlayer").getResult();
                        requestHandler.sendData((char) GameOpcode.connectFailed + failedMessage);
                        requestHandler.closeSocket();
                    });
                    System.out.println("[" + TAG + "]" + "中斷" + clientID + ", 原因: 人數過多");
                    continue;
                }
                clients.put(clientID, requestHandler);

                //on client close
                requestHandler.addEventListener(new MainServer());
                //玩家動作
                requestHandler.addEventListener(gameControl);

                //加入處理
                service.submit(requestHandler);

                //連線數增加
                clientCount++;
                System.out.println("[" + TAG + "]連接客戶端!");
                System.out.println("[" + TAG + "]" + clientCount + "個客戶端已連接");
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        System.out.println("[" + TAG + "]伺服器關閉!");
    }

    public static void stopServer() {
        if (serverSocket.isClosed())
            return;

        mainStart = false;
        if (clients.size() > 0) {
            for (ClientHandler i : clients.values()) {
                if (i != null)
                    i.closeSocket();
            }
        }
        try {
            serverSocket.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void broadcastMessage(String message) {
        for (ClientHandler i : clients.values()) {
            i.sendData(message);
        }
    }

//    public static void broadcastMessage(byte[] message) {
//        for (ClientHandler i : clients.values()) {
//            i.sendData(message);
//        }
//    }

    @Override
    public void OnClose(String id) {
        clients.remove(id);
        clientCount = clients.size();
        System.out.println("[" + TAG + "]" + clientCount + "個客戶端已連接");
    }

    private final static Random randomID = new Random(0);

    public static String generateID() {
        int leftLimit = 48;
        int rightLimit = 57;
        int targetStringLength = 5;

        StringBuilder buffer = new StringBuilder(targetStringLength);
        for (int i = 0; i < targetStringLength; i++) {
            int randomLimitedInt = leftLimit + (int)
                    (randomID.nextFloat() * (rightLimit - leftLimit + 1));
            buffer.append((char) randomLimitedInt);
        }
        return buffer.toString();
    }

    public static void main(String[] args) {
        //開啟伺服器
        new Thread(new MainServer()).start();

        //遊戲控制
        gameControl = new GameControl();
        new Thread(gameControl).start();
    }
}
