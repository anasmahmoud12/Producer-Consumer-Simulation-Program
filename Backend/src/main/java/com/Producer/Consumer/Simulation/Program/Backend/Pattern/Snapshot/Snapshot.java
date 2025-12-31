package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot;


import com.Producer.Consumer.Simulation.Program.Backend.Models.SimulationState;

public class Snapshot {
    private SimulationState state;
    private long timestamp;

    public Snapshot(SimulationState state) {
        this.state = new SimulationState(state); // Deep copy
        this.timestamp = System.currentTimeMillis();
    }

    public SimulationState getState() {
        return state;
    }

    public long getTimestamp() {
        return timestamp;
    }
}