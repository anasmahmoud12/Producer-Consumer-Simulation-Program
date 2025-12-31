package com.Producer.Consumer.Simulation.Program.Backend.Models;

import java.util.*;

public class SimulationState {
    private Map<String, Queue> queues;
    private Map<String, Machine> machines;
    private List<Connection> connections;
    private boolean isRunning;
    private long timestamp;

    public SimulationState() {
        this.queues = new HashMap<>();
        this.machines = new HashMap<>();
        this.connections = new ArrayList<>();
        this.isRunning = false;
        this.timestamp = System.currentTimeMillis();
    }

    // ✅ MODIFIED: Deep copy constructor - CRITICAL FIX
    public SimulationState(SimulationState other) {
        this.queues = new HashMap<>();
        this.machines = new HashMap<>();
        this.connections = new ArrayList<>();

        // ✅ Deep copy queues - create NEW Queue objects
        for (Map.Entry<String, Queue> entry : other.queues.entrySet()) {
            Queue copy = entry.getValue().deepCopy();
            this.queues.put(entry.getKey(), copy);
        }

        // ✅ Deep copy machines - create NEW Machine objects
        for (Map.Entry<String, Machine> entry : other.machines.entrySet()) {
            Machine copy = entry.getValue().deepCopy();
            this.machines.put(entry.getKey(), copy);
        }

        // ✅ Deep copy connections
        for (Connection conn : other.connections) {
            Connection copy = new Connection(
                    conn.getSourceId(),
                    conn.getTargetId(),
                    conn.getSourceType(),
                    conn.getTargetType()
            );
            this.connections.add(copy);
        }

        this.isRunning = other.isRunning;
        this.timestamp = System.currentTimeMillis();

        System.out.println("[SimulationState] ✅ Deep copy: " +
                queues.size() + " queues, " + machines.size() + " machines");
    }

    // Getters and Setters
    public Map<String, Queue> getQueues() { return queues; }
    public Map<String, Machine> getMachines() { return machines; }
    public List<Connection> getConnections() { return connections; }
    public boolean isRunning() { return isRunning; }
    public void setRunning(boolean running) { isRunning = running; }
    public long getTimestamp() { return timestamp; }
}

