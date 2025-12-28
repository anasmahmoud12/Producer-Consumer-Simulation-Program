package com.Producer.Consumer.Simulation.Program.Backend.Models;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductionQueue implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private double x;
    private double y;
    private int capacity;
    private List<Product> products;
    private List<String> waitingMachines; // Observer Pattern

    public ProductionQueue(String id, double x, double y, int capacity) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.capacity = capacity;
        this.products = new ArrayList<>();
        this.waitingMachines = new ArrayList<>();
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
            // Sort by priority (BONUS: Priority queue)
            products.sort((a, b) -> Integer.compare(b.getPriority(), a.getPriority()));
            return products.remove(0);
        }
        return null;
    }
}