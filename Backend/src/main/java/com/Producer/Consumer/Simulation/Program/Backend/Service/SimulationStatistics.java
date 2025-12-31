//package com.Producer.Consumer.Simulation.Program.Backend.Service;
//
//
//import lombok.Data;
//import org.springframework.stereotype.Service;
//
//import java.io.Serializable;
//import java.util.*;
//
//import java.util.HashMap;
//import java.util.Map;
//@Service
//
//public class SimulationStatistics implements Serializable {
//    private static final long serialVersionUID = 1L;
//
//    private int totalProductsProcessed;
//    private double averageWaitTime;
//    private double averageProcessingTime;
//    private Map<String, Double> machineUtilization;
//    private Map<String, Integer> machineProcessedCount;
//    private double throughput;
//    private int totalProductsInSystem;
//    private long simulationStartTime;
//
//    public SimulationStatistics() {
//        this.machineUtilization = new HashMap<>();
//        this.machineProcessedCount = new HashMap<>();
//        this.simulationStartTime = System.currentTimeMillis();
//    }
//
//    // Getters and Setters
//    public int getTotalProductsProcessed() { return totalProductsProcessed; }
//    public void setTotalProductsProcessed(int totalProductsProcessed) {
//        this.totalProductsProcessed = totalProductsProcessed;
//    }
//
//    public double getAverageWaitTime() { return averageWaitTime; }
//    public void setAverageWaitTime(double averageWaitTime) {
//        this.averageWaitTime = averageWaitTime;
//    }
//
//    public double getAverageProcessingTime() { return averageProcessingTime; }
//    public void setAverageProcessingTime(double averageProcessingTime) {
//        this.averageProcessingTime = averageProcessingTime;
//    }
//
//    public Map<String, Double> getMachineUtilization() { return machineUtilization; }
//    public void setMachineUtilization(Map<String, Double> machineUtilization) {
//        this.machineUtilization = machineUtilization;
//    }
//
//    public Map<String, Integer> getMachineProcessedCount() { return machineProcessedCount; }
//    public void setMachineProcessedCount(Map<String, Integer> machineProcessedCount) {
//        this.machineProcessedCount = machineProcessedCount;
//    }
//
//    public double getThroughput() { return throughput; }
//    public void setThroughput(double throughput) { this.throughput = throughput; }
//
//    public int getTotalProductsInSystem() { return totalProductsInSystem; }
//    public void setTotalProductsInSystem(int totalProductsInSystem) {
//        this.totalProductsInSystem = totalProductsInSystem;
//    }
//
//    public long getSimulationStartTime() { return simulationStartTime; }
//    public void setSimulationStartTime(long simulationStartTime) {
//        this.simulationStartTime = simulationStartTime;
//    }
//}