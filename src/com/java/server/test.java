package com.java.server;

import com.wavjaby.json.JsonObject;

import java.nio.ByteBuffer;

public class test {
    public static void main(String[] args) {
        byte[] a = new byte[]{(byte) 0x7F, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF};
//        System.out.println(wrapped.getLong());
        System.out.println(printByte(a));

        long time = System.nanoTime();
        long times = 9223372036L;
        System.out.println(times);
        long result = 0;
        for (long j = 0; j < times; j++) {
            result = byteArrayToLong(a, 8, 0);

//            for (byte b : a) {
//                result <<= 8;
//                result += b & 0xFF;
////                result += (long) (a[i] & 0xFF) << (8 * (a.length - i - 1));
//            }
        }
        long end = System.nanoTime();
        System.out.println(((double) (end - time) / 1000000) / times);

        System.out.println(result);

        time = System.nanoTime();
        for (long j = 0; j < times; j++) {
            result = ByteBuffer.wrap(a).getLong();
        }
        end = System.nanoTime();
        System.out.println(((double) (end - time) / 1000000) / times);

        System.out.println(result);

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
}
