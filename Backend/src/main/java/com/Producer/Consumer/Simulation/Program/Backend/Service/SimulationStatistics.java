package com.Producer.Consumer.Simulation.Program.Backend.Service;


import lombok.Data;
import java.util.*;

@Data
public class SimulationStatistics {
    private int totalProductsProcessed;
    private double averageWaitTime;
    private double averageProcessingTime;
    private Map<String, Double> machineUtilization;
    private Map<String, Integer> machineProcessedCount;
    private double throughput;
    private int totalProductsInSystem;
    private long simulationStartTime;

    public SimulationStatistics() {
        this.machineUtilization = new HashMap<>();
        this.machineProcessedCount = new HashMap<>();
        this.simulationStartTime = System.currentTimeMillis();
    }

    public void updateMachineUtilization(String machineId, long processingTime, long totalTime) {
        double utilization = (double) processingTime / totalTime * 100;
        machineUtilization.put(machineId, utilization);
    }

    public void incrementProcessedCount(String machineId) {
        machineProcessedCount.merge(machineId, 1, Integer::sum);
        totalProductsProcessed++;
    }

    public void updateWaitTime(long waitTime) {
        averageWaitTime = (averageWaitTime * (totalProductsProcessed - 1) + waitTime)
                / totalProductsProcessed;
    }

    public void calculateThroughput() {
        long elapsedSeconds = (System.currentTimeMillis() - simulationStartTime) / 1000;
        if (elapsedSeconds > 0) {
            throughput = (double) totalProductsProcessed / elapsedSeconds;
        }
    }

    public SimulationStatistics copy() {
        SimulationStatistics copy = new SimulationStatistics();
        copy.totalProductsProcessed = this.totalProductsProcessed;
        copy.averageWaitTime = this.averageWaitTime;
        copy.averageProcessingTime = this.averageProcessingTime;
        copy.machineUtilization = new HashMap<>(this.machineUtilization);
        copy.machineProcessedCount = new HashMap<>(this.machineProcessedCount);
        copy.throughput = this.throughput;
        copy.totalProductsInSystem = this.totalProductsInSystem;
        copy.simulationStartTime = this.simulationStartTime;
        return copy;
    }
}