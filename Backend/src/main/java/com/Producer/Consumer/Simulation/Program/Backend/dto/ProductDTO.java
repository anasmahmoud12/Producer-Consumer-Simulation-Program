package com.Producer.Consumer.Simulation.Program.Backend.dto;


public class ProductDTO {
    private String id;
    private String color;
    private long createdAt;

    public ProductDTO() {}

    public ProductDTO(String id, String color, long createdAt) {
        this.id = id;
        this.color = color;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}