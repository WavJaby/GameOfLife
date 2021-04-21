package com.java.game;

import java.awt.*;
import java.util.LinkedList;

public class Handler {
    LinkedList<GameObject> objects = new LinkedList<>();

    public void tick(Graphics g) {
        for (int i = 0; i < objects.size(); i++){
            GameObject tempObject = objects.get(i);

            tempObject.tick(g);
        }
    }

    public void render(Graphics g){
        for (int i = 0; i < objects.size(); i++){
            GameObject tempObject = objects.get(i);

            tempObject.render(g);
        }
    }

    public void addObject(GameObject object) {
        this.objects.add(object);
    }

    public void removeObject(GameObject object) {
        this.objects.remove(object);
    }
}
