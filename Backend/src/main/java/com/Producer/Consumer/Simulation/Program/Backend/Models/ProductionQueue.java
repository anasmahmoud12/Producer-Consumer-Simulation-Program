package com.Producer.Consumer.Simulation.Program.Backend.Models;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
@EqualsAndHashCode(callSuper = true)

@Data
public class ProductionQueue extends SimulationNode implements Serializable {
    private static final long serialVersionUID = 1L;

    private int capacity;
    private List<Product> products;
    private List<String> waitingMachines;

    // NEW: Track input machine (only one allowed)
    private String inputMachineId;
    // NEW: Track output machines (can have multiple)
    private List<String> outputMachineIds;

    public ProductionQueue() {
        this.products = new ArrayList<>();
        this.waitingMachines = new ArrayList<>();
        this.outputMachineIds = new ArrayList<>();
    }

    public ProductionQueue(String id, double x, double y, int capacity) {
        super(id, x, y, "queue");
        this.capacity = capacity;
        this.products = new ArrayList<>();
        this.waitingMachines = new ArrayList<>();
        this.outputMachineIds = new ArrayList<>();
    }

    // NEW: Validation methods
    public boolean canAddInputMachine() {
        return inputMachineId == null; // Only one input allowed
    }

    public boolean canAddOutputMachine() {
        return true; // Multiple outputs allowed
    }

    public void addOutputMachine(String machineId) {
        if (!outputMachineIds.contains(machineId)) {
            outputMachineIds.add(machineId);
        }
    }

    public void removeOutputMachine(String machineId) {
        outputMachineIds.remove(machineId);
    }

    public synchronized boolean addProduct(Product product) {
        if (products.size() < capacity) {
            products.add(product);
            product.setEnteredQueueAt(System.currentTimeMillis());
            return true;
        }
        return false;
    }

    public synchronized Product removeProduct() {
        if (!products.isEmpty()) {
            products.sort((a, b) -> Integer.compare(b.getPriority(), a.getPriority()));
            return products.remove(0);
        }
        return null;
    }

    // Getters and Setters
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public List<Product> getProducts() { return products; }
    public void setProducts(List<Product> products) { this.products = products; }

    public List<String> getWaitingMachines() { return waitingMachines; }
    public void setWaitingMachines(List<String> waitingMachines) {
        this.waitingMachines = waitingMachines;
    }

    public String getInputMachineId() { return inputMachineId; }
    public void setInputMachineId(String inputMachineId) {
        this.inputMachineId = inputMachineId;
    }

    public List<String> getOutputMachineIds() { return outputMachineIds; }
    public void setOutputMachineIds(List<String> outputMachineIds) {
        this.outputMachineIds = outputMachineIds;
    }
}