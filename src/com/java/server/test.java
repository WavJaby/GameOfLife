package com.java.server;


import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class test {
    public static void main(String[] args) {
        List[] aliveList = new List[]{new ArrayList<String>(), new ArrayList<String>()};
        System.out.println(Arrays.toString(aliveList));
    }
}
