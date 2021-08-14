package com.java.server;


import java.io.*;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Scanner;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ClientHandler implements Runnable {
    private String TAG = "Client";
    private final String LINE_END = "\r\n";
    private final String HANDSHAKE = "Upgrade: websocket" + LINE_END +
            "Connection: Upgrade" + LINE_END +
            "Sec-WebSocket-Accept: {sha1}" + LINE_END + LINE_END;

    private Socket socket;
    private String id;

    private OutputStream out;
    private InputStream in;

    boolean running = true;

    ClientHandler(Socket socket, String id) {
        this.socket = socket;
        this.id = id;
        TAG += " " + id;
        //get in/out stream
        try {
            in = socket.getInputStream();
            out = socket.getOutputStream();
        } catch (IOException e) {
            e.printStackTrace();
        }

//        new Thread(this).start();
    }

    /**
     * Data receive
     * Websocket
     */
    @Override
    public void run() {
        //握手
        boolean handShake = doHandShake();
        //握手失敗
        if (!handShake) {
            closeSocket();
            return;
        }
        System.out.println("[" + TAG + "]handshake done");

        try {
            while (running) {
                byte[] headerData = new byte[2];
                in.read(headerData);
                long timeStart = System.nanoTime();

                int fin = (headerData[0] >> 7) & 0x1;
                int opcode = (headerData[0]) & 0x0f;
                boolean mask = ((headerData[1] >> 7) & 0x1) > 0;
                int payloadLength = headerData[1] & 0x7F;
                long finalPayloadLength = payloadLength;
                //如果長度過大，讀取附加長度
                if (payloadLength > 125) {
                    byte[] extendedLength;
                    if (payloadLength == 126) {
                        //126
                        extendedLength = new byte[2];
                    } else {
                        //127
                        extendedLength = new byte[8];
                    }
                    in.read(extendedLength);

                    finalPayloadLength = byteArrayToLong(extendedLength, extendedLength.length, 0);
                }

                //讀資料
                byte[] packetData = readData(mask, finalPayloadLength, in);

                //收到關閉
                if (opcode == Opcode.connectionClose) {
                    running = false;
                    System.out.println(new String(packetData));
                } else {
                    //收到資料
                    String message = new String(packetData, 1, packetData.length - 1);
                    gameControl.ReceiveData((char) packetData[0], message, id, this);
                }

//                long timeEnd = System.nanoTime();
//                System.out.println("use:" + (double) (timeEnd - timeStart) / 1000000 + "ms");

            }

        } catch (IOException e) {
            closeSocket();
            e.printStackTrace();
            return;
        }
        closeSocket();
    }

    private byte[] readData(boolean mask, long payloadLength, InputStream in) throws IOException {
        byte[] payloadData = new byte[(int) payloadLength];
        byte[] maskData = null;
        //有mask的話讀取
        if (mask) {
            maskData = new byte[4];
            in.read(maskData);
        }
        in.read(payloadData);
        //有mask的解開
        if (mask) {
            //unmasking
            for (int i = 0; i < payloadLength; i++) {
                payloadData[i] = (byte) ((int) payloadData[i] ^ (int) maskData[i % 4]);
            }
        }

        return payloadData;
    }

    public void closeSocket() {
        running = false;
        if (gameControl != null)
            gameControl.ClientDisconnect(id);
        if (clientEvent != null)
            clientEvent.OnClose(id);

        if (!socket.isClosed())
            try {
                socket.close();
                in.close();
            } catch (IOException ioException) {
                ioException.printStackTrace();
            }
        System.out.println("[" + TAG + "]Client close");
    }

    /**
     * Data Send
     */
    private CountDownLatch dataSend = new CountDownLatch(0);
    private int dataSendCount = 0;

    synchronized public void sendData(String message) {
//        System.out.println(dataSend.getCount() == 0);
//        try {
//            dataSend.await();
//        } catch (InterruptedException e) {
//            e.printStackTrace();
//        }
//        if (dataSendCount == 0)
//            //設定這個客戶正在傳輸
//            dataSend = new CountDownLatch(1);
        splitData(message.getBytes(StandardCharsets.UTF_8));
//        if (dataSendCount == 0)
//            //傳輸結束
//            dataSend.countDown();
    }

    private final int maxPayloadLength = 65535;

    private void splitData(byte[] message) {
        dataSendCount++;
        try {
            //等待handshake
            handshake.await();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

//        System.out.println(message.length);

        int count = 0;
        while ((message.length - count * maxPayloadLength) > maxPayloadLength) {
            byte[] cache = new byte[maxPayloadLength];
            System.arraycopy(message, count * maxPayloadLength, cache, 0, maxPayloadLength);
            if (count == 0)
                sendTextFrameData(cache, 0, Opcode.textFrame);
            else
                sendTextFrameData(cache, 0, Opcode.continuationFrame);
            count++;
        }
        if (count > 0) {
            byte[] cache = new byte[(message.length - count * maxPayloadLength)];
            System.arraycopy(message, count * maxPayloadLength, cache, 0, cache.length);
            sendTextFrameData(cache, 1, Opcode.continuationFrame);
        } else
            sendTextFrameData(message, 1, Opcode.textFrame);
        dataSendCount--;
    }

    private void sendTextFrameData(byte[] payloadInput, int fin, int opcode) {
        int mask = 0;
        int dataLength = payloadInput.length;
        int payloadLength;
        byte[] extendedLength = null;

        if (dataLength < 126) {
            payloadLength = dataLength;
        } else if (dataLength < 65535 + 1) {
            payloadLength = 126;
            extendedLength = createLengthArray(dataLength, 2);
        } else {
            payloadLength = 127;
            extendedLength = createLengthArray(dataLength, 8);
        }

        //開頭資料
        byte[] frameHead = new byte[2];
        frameHead[0] = (byte) ((fin << 7) + opcode);
        frameHead[1] = (byte) ((mask << 7) + payloadLength);

        try {
            if (running) {
                out.write(frameHead);
                if (extendedLength != null) {
                    out.write(extendedLength);
                }
                out.write(payloadInput);
            }

        } catch (IOException e) {
            running = false;
            e.printStackTrace();
        }
    }

    /**
     * Handshake
     */
    private final CountDownLatch handshake = new CountDownLatch(1);

    public boolean doHandShake() {
        Scanner s = new Scanner(in, "UTF-8");
        String handshakeData = s.useDelimiter("\\r\\n\\r\\n").next();
        Matcher get = Pattern.compile("^GET").matcher(handshakeData);
        try {
            //web用的handshake
            if (get.find()) {
                //取得handshake key
                Matcher match = Pattern.compile("Sec-WebSocket-Key: (.*)").matcher(handshakeData);
                match.find();
                //make handshake
                byte[] response = ("" +
                        "HTTP/1.1 101 Switching Protocols" + LINE_END +
                        "Connection: Upgrade" + LINE_END +
                        "Upgrade: websocket" + LINE_END +
                        "Sec-WebSocket-Accept: " +
                        //加密handshake key
                        Base64.getEncoder().encodeToString(encryptSHA1(match.group(1) + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")) +
                        LINE_END + LINE_END).getBytes("UTF-8");
                //write handshake
                out.write(response, 0, response.length);

                //handshake結束
                handshake.countDown();
                return true;
            } else
                return false;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Data process
     */
    public static byte[] arrayExpand(byte[] original, int addArraySize) {
        int newLength = original.length + addArraySize;
        int preserveLength = Math.min(original.length, newLength);
        if (preserveLength > 0) {
            byte[] copy = new byte[newLength];
            System.arraycopy(original, 0, copy, 0,
                    preserveLength);
            return copy;
        }
        throw new ArrayIndexOutOfBoundsException("negative array size");
    }

    private static long byteArrayToLong(byte[] data, int length, int offset) {
        if (length == 2)
            return (data[offset] & 0xFF) << 8 |
                    (data[offset + 1] & 0xFF);
        else if (length == 8)
            return (long) (data[offset] & 0xFF) << 56 |
                    (long) (data[offset + 1] & 0xFF) << 48 |
                    (long) (data[offset + 2] & 0xFF) << 40 |
                    (long) (data[offset + 3] & 0xFF) << 32 |
                    (long) (data[offset + 4] & 0xFF) << 24 |
                    (data[offset + 5] & 0xFF) << 16 |
                    (data[offset + 6] & 0xFF) << 8 |
                    (data[offset + 7] & 0xFF);
        return 0;
    }

    private static byte[] createLengthArray(long number, int length) {
        byte[] array = new byte[length];
        for (byte i = 0; i < length; i++)
            array[length - i - 1] = (byte) (number >> i * 8);
        return array;
    }

    private static byte[] encryptSHA1(String inputString) {
        try {
            MessageDigest crypt = MessageDigest.getInstance("SHA-1");
            crypt.reset();
            crypt.update(inputString.getBytes("UTF-8"));
            return crypt.digest();
        } catch (NoSuchAlgorithmException | UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return null;
    }

    private static String getByteArray(byte[] bytes) {
        int i = 0;
        StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.append("[");
        for (; i < bytes.length - 1; i++) {
            stringBuilder.append(getBits(bytes[i])).append(",");
            if ((i + 1) % 4 == 0)
                stringBuilder.append("\n");
        }
        stringBuilder.append(getBits(bytes[i])).append("]");
        return stringBuilder.toString();
    }

    private static String getBits(byte byteIn) {
        return String.format("%8s", Integer.toBinaryString(byteIn & 0xFF)).replace(' ', '0');
    }

    public static String bytesToHex(byte[] bytes) {
        final char[] hexArray = "0123456789ABCDEF".toCharArray();
        char[] hexChars = new char[bytes.length * 3 - 1];
        for (int j = 0; j < bytes.length; j++) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 3] = hexArray[v >>> 4];
            hexChars[j * 3 + 1] = hexArray[v & 0x0F];
            if (j < bytes.length - 1)
                hexChars[j * 3 + 2] = ',';
        }
        return new String(hexChars);
    }

    /**
     * Event
     */
    private ClientEvent clientEvent;

    public void addEventListener(ClientEvent clientEvent) {
        this.clientEvent = clientEvent;
    }

    private GameControl gameControl;

    public void addEventListener(GameControl gameControl) {
        this.gameControl = gameControl;
    }

    public interface ClientEvent {
        void OnClose(String id);
    }

    //game
    public interface PlayerEvent {
        void ReceiveData(char opcode, String data, String clientID, ClientHandler client);

        void ClientDisconnect(String clientID);
    }
}
