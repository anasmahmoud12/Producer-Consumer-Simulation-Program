package com.Producer.Consumer.Simulation.Program.Backend.Models;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public abstract class SimulationNode {
    protected String id;
    protected double x;
    protected double y;
    protected String type; // "start", "end", "machine", "queue"


    public SimulationNode() {}

    public SimulationNode(String id, double x, double y, String type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type;
    }
}