package com.Producer.Consumer.Simulation.Program.Backend.Models;

public class Connection {
    private String id;
    private String sourceId;
    private String targetId;
    private String sourceType; // "queue" or "machine"
    private String targetType; // "queue" or "machine"

    public Connection(String sourceId, String targetId, String sourceType, String targetType) {
        this.id = sourceId + "-" + targetId;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.sourceType = sourceType;
        this.targetType = targetType;
    }

    // Getters
    public String getId() { return id; }
    public String getSourceId() { return sourceId; }
    public String getTargetId() { return targetId; }
    public String getSourceType() { return sourceType; }
    public String getTargetType() { return targetType; }
}