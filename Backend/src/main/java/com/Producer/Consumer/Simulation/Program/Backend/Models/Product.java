

package com.Producer.Consumer.Simulation.Program.Backend.Models;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.concurrent.atomic.AtomicInteger;

@Data
@AllArgsConstructor
@NoArgsConstructor
 public class Product {
    private static final AtomicInteger counter = new AtomicInteger(0);

    private String id;
    private String color;
    private int priority;
    private long createdAt;
    private long enteredQueueAt;
    private String status; // waiting, processing, completed
    private String productType; // BONUS: Different product types

    public Product(String color, int priority, String productType) {
        this.id = "P" + counter.incrementAndGet();
        this.color = color;
        this.priority = priority;
        this.createdAt = System.currentTimeMillis();
        this.status = "waiting";
        this.productType = productType;
    }
}
