package com.Producer.Consumer.Simulation.Program.Backend.dto;
public class ConnectionDTO {
    private String id;
    private String sourceId;
    private String targetId;
    private String sourceType;
    private String targetType;

    public ConnectionDTO() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }
    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
}