package com.Producer.Consumer.Simulation.Program.Backend.dto;


import java.util.List;

public class SimulationStateDTO {
    private List<QueueDTO> queues;
    private List<MachineDTO> machines;
    private List<ConnectionDTO> connections;
    private boolean isRunning;
    private long timestamp;

    public SimulationStateDTO() {}

    public List<QueueDTO> getQueues() { return queues; }
    public void setQueues(List<QueueDTO> queues) { this.queues = queues; }
    public List<MachineDTO> getMachines() { return machines; }
    public void setMachines(List<MachineDTO> machines) { this.machines = machines; }
    public List<ConnectionDTO> getConnections() { return connections; }
    public void setConnections(List<ConnectionDTO> connections) { this.connections = connections; }
    public boolean isRunning() { return isRunning; }
    public void setRunning(boolean running) { isRunning = running; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}