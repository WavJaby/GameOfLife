package com.java;

import java.util.ArrayList;
import java.util.List;

public class Main {
    static List<Object> beforeChange = new ArrayList<>();

    public static void main(String[] args) {
        beforeChange.add("1,0");
        beforeChange.add(1);
        beforeChange.add("1,0");
        beforeChange.add(1);
        beforeChange.add("1,0");
        beforeChange.add(1);

        System.out.println(getBeforeChangePixel(0,1));
        System.out.println(getBeforeChangePixel(1,0));

    }

    private static int getBeforeChangePixel(int x, int y) {
        final String kernel = x + "," + y;
        for (int i = 0; i < beforeChange.size(); i += 2) {
            if (kernel.equals(beforeChange.get(i)))
                return (int) beforeChange.get(i + 1);
        }
        return -1;
    }
}
