package com.java.server;


import java.io.*;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Scanner;
import java.util.concurrent.CountDownLatch;
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

    //等待handshake
    private final CountDownLatch countDownLatch = new CountDownLatch(1);

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

        int buffLength = 1024;
        try {
            while (running) {
                byte[] packetData = new byte[buffLength];
                int length = in.read(packetData);
                long timeStart = System.nanoTime();

                while (length == buffLength) {
                    length = Math.min(in.available(), buffLength);
                    int lastLength = packetData.length;
                    packetData = arrayExpand(packetData, length);
                    length = in.read(packetData, lastLength, length);
                }

                //解讀
                byte[] data = unMaskData(packetData);
                //連線關閉
                if (data == null)
                    break;

                String message = new String(data, 1, data.length - 1);
                gameControl.ReceiveData((char) data[0], message, id, this);

                long timeEnd = System.nanoTime();
                System.out.println("use:" + (double) (timeEnd - timeStart) / 1000000 + "ms");

            }

        } catch (IOException e) {
            closeSocket();
            return;
        }
        closeSocket();
    }

    public void sendData(String message) {
        //等待handshake
        try {
            countDownLatch.await();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        sendTextFrameData(message.getBytes(StandardCharsets.UTF_8));
    }

    public void sendData(byte[] message) {
        //等待handshake
        try {
            countDownLatch.await();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        sendTextFrameData(message);
    }

    private void sendTextFrameData(byte[] payloadInput) {
        int fin = 1, opcode = Opcode.textFrame, mask = 0;
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
            out.write(frameHead);
            if (extendedLength != null) {
                out.write(extendedLength);
            }
            out.write(payloadInput);

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    //    private boolean dataReadDone;
//    private byte[] payloadData;
    private byte[] unMaskData(byte[] inData) throws IOException {
//        if (dataReadDone)
//            payloadData = new byte[inData.length];
//        dataReadDone = false;

        int fin = (inData[0] >> 7) & 0x1;
        int opcode = ((char) inData[0]) & 0x0f;
        //如果連接關閉
        if (opcode == Opcode.connectionClose) {
            return null;
        }


        //資料大小
        int packetLength = inData[1] & 0x7f;
        long payloadLength = packetLength;
        int payloadStartLoc = 2;
        if (packetLength == 126) {
            payloadStartLoc += 2;
            payloadLength = byteArrayToLong(inData, 2, 2);
        } else if (packetLength == 127) {
            payloadStartLoc += 8;
            payloadLength = byteArrayToLong(inData, 8, 2);
        }

//        System.out.println(payloadLength);

        //read mask byte
        byte[] readMask = new byte[4];
        readMask[0] = inData[payloadStartLoc++];
        readMask[1] = inData[payloadStartLoc++];
        readMask[2] = inData[payloadStartLoc++];
        readMask[3] = inData[payloadStartLoc++];

        //payload data
        byte[] payload = new byte[(int) payloadLength];
        //unmasking
        for (int i = 0; i < payloadLength; i++) {
            payload[i] = (byte) ((int) inData[payloadStartLoc + i] ^ (int) readMask[i % 4]);
        }
        return payload;
    }

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
                countDownLatch.countDown();
                return true;
            } else
                return false;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

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

    private static String printByte(byte[] bytes) {
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

    private final static char[] hexArray = "0123456789ABCDEF".toCharArray();

    public static String bytesToHex(byte[] bytes) {
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
