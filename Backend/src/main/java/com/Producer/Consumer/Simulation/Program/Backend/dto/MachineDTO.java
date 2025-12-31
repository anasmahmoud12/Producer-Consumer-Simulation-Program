package com.Producer.Consumer.Simulation.Program.Backend.dto;

import java.util.List;

public class MachineDTO {
    private String id;
    private int serviceTime;
    private boolean isProcessing;
    private boolean isFlashing;
    private String currentColor;
    private ProductDTO currentProduct;
    private double x;
    private double y;
    private List<String> inputQueueIds;
    private String outputQueueId;

    // Constructors, Getters, Setters
    public MachineDTO() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public int getServiceTime() { return serviceTime; }
    public void setServiceTime(int serviceTime) { this.serviceTime = serviceTime; }
    public boolean isProcessing() { return isProcessing; }
    public void setProcessing(boolean processing) { isProcessing = processing; }
    public boolean isFlashing() { return isFlashing; }
    public void setFlashing(boolean flashing) { isFlashing = flashing; }
    public String getCurrentColor() { return currentColor; }
    public void setCurrentColor(String currentColor) { this.currentColor = currentColor; }
    public ProductDTO getCurrentProduct() { return currentProduct; }
    public void setCurrentProduct(ProductDTO currentProduct) { this.currentProduct = currentProduct; }
    public double getX() { return x; }
    public void setX(double x) { this.x = x; }
    public double getY() { return y; }
    public void setY(double y) { this.y = y; }
    public List<String> getInputQueueIds() { return inputQueueIds; }
    public void setInputQueueIds(List<String> inputQueueIds) { this.inputQueueIds = inputQueueIds; }
    public String getOutputQueueId() { return outputQueueId; }
    public void setOutputQueueId(String outputQueueId) { this.outputQueueId = outputQueueId; }
}
