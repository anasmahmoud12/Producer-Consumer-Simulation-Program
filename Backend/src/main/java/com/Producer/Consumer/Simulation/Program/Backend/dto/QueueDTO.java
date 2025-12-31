package com.Producer.Consumer.Simulation.Program.Backend.dto;

public class QueueDTO {
    private String id;
    private String type;
    private int productCount;
    private double x;
    private double y;

    // Constructors, Getters, Setters
    public QueueDTO() {}

    public QueueDTO(String id, String type, int productCount, double x, double y) {
        this.id = id;
        this.type = type;
        this.productCount = productCount;
        this.x = x;
        this.y = y;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getProductCount() { return productCount; }
    public void setProductCount(int productCount) { this.productCount = productCount; }
    public double getX() { return x; }
    public void setX(double x) { this.x = x; }
    public double getY() { return y; }
    public void setY(double y) { this.y = y; }
}