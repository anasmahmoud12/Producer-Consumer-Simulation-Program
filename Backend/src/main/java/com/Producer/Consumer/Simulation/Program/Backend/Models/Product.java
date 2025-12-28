package com.Producer.Consumer.Simulation.Program.Backend.Models;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.concurrent.atomic.AtomicInteger;

@Data
@NoArgsConstructor
public class Product implements Serializable {
    private static final long serialVersionUID = 1L;

    // ⚠️ IMPORTANT: Make counter transient to avoid serialization issues
    private static final transient AtomicInteger counter = new AtomicInteger(0);

    private String id;
    private String color;
    private int priority;
    private long createdAt;
    private long enteredQueueAt;
    private String status; // waiting, processing, completed
    private String productType; // BONUS: Different product types

    // Constructor that matches SimulationService usage
    public Product(String id, String color, int priority, String productType) {
        this.id = id;
        this.color = color;
        this.priority = priority;
        this.createdAt = System.currentTimeMillis();
        this.status = "waiting";
        this.productType = productType;
    }

    // Alternative constructor that auto-generates ID (keep for backward compatibility)
    public Product(String color, int priority, String productType) {
        this.id = "P" + counter.incrementAndGet();
        this.color = color;
        this.priority = priority;
        this.createdAt = System.currentTimeMillis();
        this.status = "waiting";
        this.productType = productType;
    }
}