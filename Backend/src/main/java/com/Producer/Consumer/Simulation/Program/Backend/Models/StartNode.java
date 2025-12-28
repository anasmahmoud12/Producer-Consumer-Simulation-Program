package com.Producer.Consumer.Simulation.Program.Backend.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
@EqualsAndHashCode(callSuper = true)

@Data
//@AllArgsConstructor
//@NoArgsConstructor
public class StartNode extends SimulationNode implements Serializable {
    private static final long serialVersionUID = 1L;
    private int totalProductsToGenerate;
    private int generatedCount;

    public StartNode() {
        super("START", 50, 300, "start");
        this.totalProductsToGenerate = 100; // Default
        this.generatedCount = 0;
    }

    public StartNode(double x, double y, int totalProducts) {
        super("START", x, y, "start");
        this.totalProductsToGenerate = totalProducts;
        this.generatedCount = 0;
    }

    public boolean canGenerate() {
        return generatedCount < totalProductsToGenerate;
    }

    public void incrementGenerated() {
        generatedCount++;
    }

    // Getters and Setters
//    public int getTotalProductsToGenerate() { return totalProductsToGenerate; }
//    public void setTotalProductsToGenerate(int totalProductsToGenerate) {
//        this.totalProductsToGenerate = totalProductsToGenerate;
//    }

//    public int getGeneratedCount() { return generatedCount; }
//    public void setGeneratedCount(int generatedCount) {
//        this.generatedCount = generatedCount;
//    }
}