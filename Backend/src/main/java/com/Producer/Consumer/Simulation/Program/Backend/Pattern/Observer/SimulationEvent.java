package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SimulationEvent {
    private String type;
    private Object data;
    private long timestamp;

    public SimulationEvent(String type, Object data) {
        this.type = type;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }
}
