package com.java.game;

import javax.swing.*;
import java.awt.*;

public class GameOfLIfe extends JFrame {
    private final int windowWidth = 500;
    private final int windowHeight = 500;
    private int screenWidth;
    private int screenHeight;


    GameOfLIfe() {
        super("Game of life");
        Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();
        screenWidth = screenSize.width;
        screenHeight = screenSize.height;

        setContentPane(new Game());
        setLocationRelativeTo(null);

        setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        setSize(windowWidth, windowHeight);
        setVisible(true);
    }

    public static void main(String[] args) {
        new GameOfLIfe();
    }
}
