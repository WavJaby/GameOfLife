package com.java.server;

public class Opcode {
    public static final int continuationFrame = 0;
    public static final int textFrame = 0x1;
    public static final int binaryFrame = 0x2;
    public static final int connectionClose = 0x8;
    public static final int ping = 0x9;
    public static final int pong = 0xA;
}

/*
 *  0 denotes a continuation frame
 *  1 denotes a text frame
 *  2 denotes a binary frame
 *  3-7 are reserved for further non-control frames
 *  8 denotes a connection close
 *  9 denotes a ping
 *  A denotes a pong
 *  B-F are reserved for further control frames
 */
