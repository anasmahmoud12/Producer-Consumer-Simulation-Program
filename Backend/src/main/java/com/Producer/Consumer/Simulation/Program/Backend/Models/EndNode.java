package com.Producer.Consumer.Simulation.Program.Backend.Models;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

@Data
@EqualsAndHashCode(callSuper = true) // ✅ FIXED: Added to remove warning
public class EndNode extends SimulationNode implements Serializable {
    private static final long serialVersionUID = 1L;

    private int completedCount;

    public EndNode() {
        super("END", 1150, 300, "end"); // ✅ FIXED: Call parent with default values
        this.completedCount = 0;
    }

    public EndNode(double x, double y) {
        super("END", x, y, "end"); // ✅ FIXED: Call parent constructor
        this.completedCount = 0;
    }

    public void incrementCompleted() {
        completedCount++;
    }

    public void reset() {
        completedCount = 0;
    }
}