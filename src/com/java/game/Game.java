package com.java.game;

import java.awt.*;
import java.awt.image.BufferStrategy;

public class Game extends Canvas implements Runnable {
    public static int WIDTH = 900, HEIGHT = WIDTH / 12 * 9;

    private Thread thread;
    private boolean running = false;

    //render
    private Handler handler;

    public Game() {
        //render handler
        handler = new Handler();
//        this.addKeyListener(new KeyInput(handler));

        //create game window and thread(tick, render)
        new GameWindow(WIDTH, HEIGHT, "game of life", this);
        WIDTH = getWidth();
        HEIGHT = getHeight();
        System.out.println(getWidth() + "x" + getHeight());

        handler.addObject(new GameCalculation(0, 0, ID.Chunk));

//        //add an object
//        handler.addObject(new Player(WIDTH / 2, HEIGHT / 2, ID.Player));
//
//        Random random = new Random();
//        for (int i = 0; i < 10; i++)
//            handler.addObject(new BasicEnemy(random.nextInt(WIDTH), random.nextInt(HEIGHT), ID.BasicEnemy));
    }

    public synchronized void start() {
        thread = new Thread(this);
        thread.start();
        running = true;
    }

    public synchronized void stop() {
        try {
            thread.join();
            running = false;
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void run() {
        long lastTime = System.nanoTime();
        double amountOfTicks = 100.0;
        double ns = 1000000000 / amountOfTicks;
        double delta = 0;
        long timer = System.currentTimeMillis();
        int frames = 0;
        while (running) {
            long now = System.nanoTime();
            delta += (now - lastTime) / ns;
            lastTime = now;
            while (delta >= 1) {
                tick();
                delta--;
            }
            if (running)
                render();
            frames++;

            if (System.currentTimeMillis() - timer > 1000) {
                timer += 1000;
                System.out.println("FPS: " + frames);
                frames = 0;
            }
        }
        stop();
    }

    private void tick() {
        BufferStrategy bs = this.getBufferStrategy();
        if (bs == null) {
            this.createBufferStrategy(3);
            return;
        }

        Graphics g = bs.getDrawGraphics();


        handler.tick(g);

        g.dispose();
        bs.show();
    }

    private void render() {
        BufferStrategy bs = this.getBufferStrategy();
        if (bs == null) {
            this.createBufferStrategy(3);
            return;
        }

        Graphics g = bs.getDrawGraphics();

//        g.setColor(Color.BLACK);
//        g.fillRect(0, 0, WIDTH, HEIGHT);

        //render game object
        handler.render(g);

        g.dispose();
        bs.show();
    }


    public static void main(String[] args) {
        new Game();
    }
}
