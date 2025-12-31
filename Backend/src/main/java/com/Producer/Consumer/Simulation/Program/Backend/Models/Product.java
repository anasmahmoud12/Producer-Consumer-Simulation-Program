package com.Producer.Consumer.Simulation.Program.Backend.Models;
import java.util.UUID;

public class Product {
    private String id;
    private String color;
    private long createdAt;

    public Product() {
        this.id = UUID.randomUUID().toString();
        this.color = generateRandomColor();
        this.createdAt = System.currentTimeMillis();
    }

    private String generateRandomColor() {
        int hue = (int) (Math.random() * 360);
        return String.format("hsl(%d, 70%%, 60%%)", hue);
    }

    public String getId() { return id; }
    public String getColor() { return color; }
    public long getCreatedAt() { return createdAt; }
}
