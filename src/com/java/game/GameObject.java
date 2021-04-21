package com.java.game;

import java.awt.*;

public abstract class GameObject {
    protected int x, y;
    protected ID id;
    protected int velX, velY;

    public GameObject(int x, int y, ID id) {
        this.x = x;
        this.y = Game.HEIGHT - y;
        this.id = id;
    }

    public abstract void tick(Graphics g);

    public abstract void render(Graphics g);

    public int getX() {
        return x;
    }

    public void setX(int x) {
        this.x = x;
    }

    public int getY() {
        return y;
    }

    public void setY(int y) {
        this.y = Game.HEIGHT - y;
    }

    public ID getId() {
        return id;
    }

    public void setId(ID id) {
        this.id = id;
    }

    public int getValX() {
        return velX;
    }

    public void setValX(int velX) {
        this.velX = velX;
    }

    public int getValY() {
        return velY;
    }

    public void setValY(int valY) {
        this.velY = -valY;
    }
}
