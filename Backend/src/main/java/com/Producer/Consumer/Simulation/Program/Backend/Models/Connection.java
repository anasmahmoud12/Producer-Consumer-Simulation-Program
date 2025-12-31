package com.Producer.Consumer.Simulation.Program.Backend.Models;

public class Connection {
    private String id;
    private String sourceId;
    private String targetId;
    private String sourceType; // "queue" or "machine"
    private String targetType; // "queue" or "machine"

    public Connection(String sourceId, String targetId, String sourceType, String targetType) {
        this.id = sourceId + "-" + targetId;
        this.sourceId = sourceId; // Same source = preserves ID
        this.targetId = targetId;  // Same target = preserves ID
        this.sourceType = sourceType; // Same type
        this.targetType = targetType; // Same type
    }

    // Getters
    public String getId() { return id; }
    public String getSourceId() { return sourceId; }
    public String getTargetId() { return targetId; }
    public String getSourceType() { return sourceType; }
    public String getTargetType() { return targetType; }
}