package com.java.server;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;

public class Main implements RequestHandler.ClientEvent {
    private static final String TAG = "Main";
    private static final int portNumber = 25565;
    private static ServerSocket serverSocket;
    private static List<RequestHandler> clients = new ArrayList<>();
    private static List<Integer> canUseID = new ArrayList<>();

    public static boolean mainStart;

    public static void main(String[] args) {
//        new Thread(() -> new Window(clients)).start();
//        new Window(clients);
//        new Thread(() -> new AutoReload()).start();

        initServer();
    }

    public static void stopServer() {
        if (serverSocket.isClosed())
            return;

        mainStart = false;
        if (clients.size() > 0) {
            for (RequestHandler i : clients) {
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

    public static void initServer() {
        clients.clear();
        canUseID.clear();
        new Thread(() -> {
            mainStart = true;
            //server
            try {
                serverSocket = new ServerSocket(portNumber);
                System.out.println("[" + TAG + "]伺服器開啟");
                while (mainStart) {
                    Socket clientSocket = serverSocket.accept();
                    //生成ID
                    int clientID = clients.size();
                    if (canUseID.size() > 0) {
                        clientID = canUseID.get(0);
                    }

                    RequestHandler requestHandler = new RequestHandler(clientSocket, clientID);
                    //結束的event接收端是main
                    requestHandler.AddEventListener(new Main());
                    //加入list
                    if (canUseID.size() > 0) {
                        clients.set(clientID, requestHandler);
                        canUseID.remove(0);
                    } else {
                        clients.add(requestHandler);
                    }

                    System.out.println("[" + TAG + "]連接客戶端!");
                    System.out.println("[" + TAG + "]有" + clients.size() + "個客戶端已連接");

//                executor.execute(client);

                }
            } catch (IOException e) {
//            e.printStackTrace();
            }
            System.out.println("[" + TAG + "]伺服器關閉!");
        }).start();
    }

    public static void reloadClient() {
        for (RequestHandler i : clients) {
            i.sendData("reload");
        }
    }

    public static void sendMessage(String message) {
        for (RequestHandler i : clients) {
            i.sendData(message);
        }
    }

    public static void sendMessage(byte[] message) {
        for (RequestHandler i : clients) {
            i.sendData(message);
        }
    }

    @Override
    public void OnClose(int id) {
        clients.set(id, null);
        canUseID.add(id);
        System.out.println("[" + TAG + "]客戶端" + id + "斷開連接!");
        int clientCount = (clients.size() - canUseID.size());
        if (clientCount < 0)
            clientCount = 0;
        System.out.println("[" + TAG + "]有" + clientCount + "個客戶端已連接");
    }
}
