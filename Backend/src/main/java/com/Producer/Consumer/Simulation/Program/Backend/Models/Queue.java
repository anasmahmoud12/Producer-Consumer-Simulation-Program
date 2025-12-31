package com.Producer.Consumer.Simulation.Program.Backend.Models;

import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.Subject;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.UUID;

public class Queue extends Subject {
    private String id;
    private String type; // "start", "normal", "end"
    private ConcurrentLinkedQueue<Product> products;
    private double x;
    private double y;

    public Queue(String type) {
        this.id = UUID.randomUUID().toString();
        this.type = type;
        this.products = new ConcurrentLinkedQueue<>();
        this.x = 100;
        this.y = 100;
    }

    // ✅ ADDED: Private constructor for deep copy
    private Queue(String id, String type, int productCount, double x, double y) {
        this.id = id;  // Keep same ID
        this.type = type;
        this.products = new ConcurrentLinkedQueue<>();
        this.x = x;
        this.y = y;

        // Create dummy products to match count (for snapshot visualization)
        for (int i = 0; i < productCount; i++) {
            this.products.add(new Product());
        }
    }

    // ✅ ADDED: Deep copy method - CRITICAL FIX
    public Queue deepCopy() {
        return new Queue(this.id, this.type, this.products.size(), this.x, this.y);
    }

    public synchronized void enqueue(Product product) {
        products.offer(product);
        notifyObservers(); // Notify all machines observing this queue
    }

    public synchronized Product dequeue() {
        return products.poll();
    }

    public boolean isEmpty() {
        return products.isEmpty();
    }

    public int size() {
        return products.size();
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getType() { return type; }
    public int getProductCount() { return products.size(); }
    public double getX() { return x; }
    public double getY() { return y; }
    public void setX(double x) { this.x = x; }
    public void setY(double y) { this.y = y; }
}