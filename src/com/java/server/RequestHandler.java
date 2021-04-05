package com.java.server;


import java.io.*;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RequestHandler implements Runnable {
    private String TAG = "Client";
    private final String LINE_END = "\r\n";
    private final String HANDSHAKE = "Upgrade: websocket" + LINE_END +
            "Connection: Upgrade" + LINE_END +
            "Sec-WebSocket-Accept: {sha1}" + LINE_END + LINE_END;

    private Socket socket;
    private int id;

    private OutputStream writer;
    private InputStream in;

    boolean running = true;
    ClientEvent clientEvent;

    RequestHandler(Socket socket, int id) {
        this.socket = socket;
        this.id = id;
        new Thread(this).start();
    }

    public void AddEventListener(ClientEvent clientEvent) {
        this.clientEvent = clientEvent;
    }

    interface ClientEvent {
        void OnClose(int id);
    }

    @Override
    public void run() {
        TAG += " " + id;
        try {
            in = socket.getInputStream();
            writer = socket.getOutputStream();

            Scanner s = new Scanner(in, "UTF-8");
            String data = s.useDelimiter("\\r\\n\\r\\n").next();
            Matcher get = Pattern.compile("^GET").matcher(data);

            //web用的handshake
            if (get.find()) {
                //取得handshake key
                Matcher match = Pattern.compile("Sec-WebSocket-Key: (.*)").matcher(data);
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
                writer.write(response, 0, response.length);
            }
            System.out.println("[" + TAG + "]handshake done");

            DataInputStream dataIn = new DataInputStream(in);
            while (running) {
                //讀取
                byte[] packetData = new byte[dataIn.readInt()];
                dataIn.readFully(packetData);
                //解讀
                String message = readData(packetData);

                if (message != null) {
                    System.out.println("[" + TAG + "]receive: " + message);

                    sendData("hi".getBytes(StandardCharsets.UTF_8), writer);

//                        if (message.equals("getData")) {
//                            byte[] b = new FileReader("/data.json").data;
//                            sendData(b, writer);
//                        }
                }
                if(!running)
                    return;
            }

        } catch (IOException e) {
            System.out.println(TAG + e.getMessage());
        }

        System.out.println("[" + TAG + "]Client close");
        closeSocket();
    }

    public void sendData(String message) {
        sendData(message.getBytes(StandardCharsets.UTF_8), writer);
    }

    public void sendData(byte[] message) {
        sendData(message, writer);
    }


    private String readData(byte[] inData) throws IOException {
        int opcode = ((char) inData[0]) & 0x0f;
        //如果連接關閉
        if (opcode == Opcode.connectionClose) {
            running = false;
            return null;
        }

        //資料大小
        int packetLength = ((char) inData[1]) & 0x7f;

        //read mask byte
        byte[] readMask = new byte[4];
        readMask[0] = inData[2];
        readMask[1] = inData[3];
        readMask[2] = inData[4];
        readMask[3] = inData[5];

        //payload data
        byte[] payload = new byte[packetLength];
        //unmasking
        for (int i = 0; i < packetLength; i++) {
            payload[i] = (byte) ((int) inData[6 + i] ^ (int) readMask[i % 4]);
        }
        return new String(payload);
    }

    private void sendData(byte[] payloadInput, OutputStream writer) {
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
            writer.write(frameHead);
            if (extendedLength != null) {
                writer.write(extendedLength);
            }
            writer.write(payloadInput);

        } catch (IOException e) {
            e.printStackTrace();
        }
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
        try {
            socket.close();
        } catch (IOException ioException) {
            ioException.printStackTrace();
        }
        clientEvent.OnClose(id);
    }
}
