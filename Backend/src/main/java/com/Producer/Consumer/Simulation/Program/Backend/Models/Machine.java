package com.Producer.Consumer.Simulation.Program.Backend.Models;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true) // ✅ FIXED: Added to remove warning
public class Machine extends SimulationNode implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<String> inputQueueIds;
    private String outputQueueId;

    private int minServiceTime;
    private int maxServiceTime;
    private String status; // idle, processing, flashing, maintenance
    private Product currentProduct;
    private String color;
    private int processedCount;
    private long totalProcessingTime;
    private double reliability; // BONUS: Machine reliability (0-1)

    public Machine(String id, double x, double y, int minServiceTime, int maxServiceTime) {
        super(id, x, y, "machine");
        this.minServiceTime = minServiceTime;
        this.maxServiceTime = maxServiceTime;
        this.status = "idle";
        this.color = "#94a3b8";
        this.processedCount = 0;
        this.totalProcessingTime = 0;
        this.reliability = 0.95;
        this.inputQueueIds = new ArrayList<>(); // ✅ FIXED: Initialize the list
        this.outputQueueId = null; // ✅ FIXED: Explicitly set to null
    }

    public Machine() {
        super(); // ✅ FIXED: Call parent constructor
        this.inputQueueIds = new ArrayList<>();
        this.status = "idle";
        this.color = "#94a3b8";
        this.processedCount = 0;
        this.totalProcessingTime = 0;
        this.reliability = 0.95;
    }

    public boolean canAddInputQueue() {
        return true; // Multiple inputs allowed
    }

    public boolean canAddOutputQueue() {
        return outputQueueId == null; // Only one output allowed
    }

    public void addInputQueue(String queueId) {
        if (this.inputQueueIds == null) {
            this.inputQueueIds = new ArrayList<>();
        }
        if (!inputQueueIds.contains(queueId)) {
            inputQueueIds.add(queueId);
        }
    }

    public void removeInputQueue(String queueId) {
        if (this.inputQueueIds != null) {
            inputQueueIds.remove(queueId);
        }
    }
}