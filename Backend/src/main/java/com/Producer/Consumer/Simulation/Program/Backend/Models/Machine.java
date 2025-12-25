package com.Producer.Consumer.Simulation.Program.Backend.Models;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.concurrent.atomic.AtomicInteger;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Machine {
    private String id;
    private double x;
    private double y;
    private int minServiceTime;
    private int maxServiceTime;
    private String status; // idle, processing, flashing, maintenance
    private Product currentProduct;
    private String color;
    private int processedCount;
    private long totalProcessingTime;
    private double reliability; // BONUS: Machine reliability (0-1)

    public Machine(String id, double x, double y, int minServiceTime, int maxServiceTime) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.minServiceTime = minServiceTime;
        this.maxServiceTime = maxServiceTime;
        this.status = "idle";
        this.color = "#94a3b8";
        this.processedCount = 0;
        this.totalProcessingTime = 0;
        this.reliability = 0.95;
    }
}
