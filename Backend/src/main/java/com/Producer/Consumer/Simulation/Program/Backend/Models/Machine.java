package com.Producer.Consumer.Simulation.Program.Backend.Models;

import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.Observer;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.Subject;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

public class Machine implements Observer {
    private String id;
    private List<Queue> inputQueues;
    private Queue outputQueue;
    private int serviceTime;

    // ✅ Thread-safe fields
    private volatile Product currentProduct;
    private volatile boolean isProcessing;
    private volatile boolean isFlashing;

    private double x;
    private double y;
    private String defaultColor = "#94a3b8";

    public Machine(int serviceTime) {
        this.id = UUID.randomUUID().toString();
        this.serviceTime = serviceTime;
        this.inputQueues = new CopyOnWriteArrayList<>();
        this.isProcessing = false;
        this.isFlashing = false;
        this.x = 200;
        this.y = 100;
    }

    // ✅ ADDED: Private constructor for deep copy
    private Machine(String id, int serviceTime, boolean isProcessing,
                    boolean isFlashing, String currentColor, double x, double y) {
        this.id = id;  // Keep same ID
        this.serviceTime = serviceTime;
        this.isProcessing = isProcessing;
        this.isFlashing = isFlashing;
        this.x = x;
        this.y = y;
        this.inputQueues = new CopyOnWriteArrayList<>();

        // Create dummy product if processing (for snapshot visualization)
        if (isProcessing && currentColor != null && !currentColor.equals(defaultColor)) {
            this.currentProduct = new Product();
        }
    }


    public Machine deepCopy() {
        // Preserves: ID, service time, processing state, position, color
        return new Machine(
                this.id,
                this.serviceTime,
                this.isProcessing,
                this.isFlashing,
                this.getCurrentColor(),
                this.x,
                this.y
        );
    }

    public void addInputQueue(Queue queue) {
        if (!inputQueues.contains(queue)) {
            inputQueues.add(queue);
            queue.attach(this);
        }
    }

    public void removeInputQueue(Queue queue) {
        inputQueues.remove(queue);
        queue.detach(this);
    }

    public void setOutputQueue(Queue queue) {
        this.outputQueue = queue;
    }

    @Override
    public void update(Subject subject) {
        if (!isProcessing) {
            tryProcessNext();
        }
    }

    public synchronized void tryProcessNext() {
        if (isProcessing) {
            return;
        }

        for (Queue queue : inputQueues) {
            if (!queue.isEmpty()) {
                currentProduct = queue.dequeue();
                if (currentProduct != null) {
                    isProcessing = true;
                    System.out.println("[Machine " + id.substring(0,8) + "] Started processing " +
                            currentProduct.getId().substring(0,8) + " (color: " + currentProduct.getColor() + ")");
                    return;
                }
            }
        }
    }

    public synchronized void finishProcessing() {
        System.out.println("[Machine " + id.substring(0,8) + "] Finished processing");

        isFlashing = true;

        if (currentProduct != null && outputQueue != null) {
            outputQueue.enqueue(currentProduct);
        }

        currentProduct = null;
        isProcessing = false;
    }

    public synchronized void resetFlash() {
        isFlashing = false;
    }

    // Getters
    public String getId() {
        return id;
    }

    public int getServiceTime() {
        return serviceTime;
    }

    public Product getCurrentProduct() {
        return currentProduct;
    }

    public boolean isProcessing() {
        return isProcessing;
    }

    public boolean isFlashing() {
        return isFlashing;
    }

    public String getCurrentColor() {
        return currentProduct != null ? currentProduct.getColor() : defaultColor;
    }

    public double getX() {
        return x;
    }

    public double getY() {
        return y;
    }

    public void setX(double x) {
        this.x = x;
    }

    public void setY(double y) {
        this.y = y;
    }

    public List<Queue> getInputQueues() {
        return new ArrayList<>(inputQueues);
    }

    public Queue getOutputQueue() {
        return outputQueue;
    }
}