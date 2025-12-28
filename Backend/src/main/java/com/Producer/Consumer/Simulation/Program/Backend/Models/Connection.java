package com.Producer.Consumer.Simulation.Program.Backend.Models;

import lombok.Data;

import java.io.Serializable;
@Data
public class Connection implements Serializable {
    private static final long serialVersionUID = 1L;

    private String from;
    private String to;
    private String fromType; // "start", "machine", "queue"
    private String toType;   // "machine", "queue", "end"

    public Connection() {}

    public Connection(String from, String to) {
        this.from = from;
        this.to = to;
    }

    public Connection(String from, String to, String fromType, String toType) {
        this.from = from;
        this.to = to;
        this.fromType = fromType;
        this.toType = toType;
    }

    // Validation: Check if connection is valid
    public boolean isValid() {
        // START can only connect to QUEUE
        if ("start".equals(fromType) && !"queue".equals(toType)) {
            return false;
        }

        // QUEUE can only connect to MACHINE
        if ("queue".equals(fromType) && !"machine".equals(toType)) {
            return false;
        }

        // MACHINE can only connect to QUEUE or END
        if ("machine".equals(fromType) &&
                !"queue".equals(toType) && !"end".equals(toType)) {
            return false;
        }

        // No self-connection
        if (from.equals(to)) {
            return false;
        }

        return true;
    }

    // Getters and Setters
//    public String getFrom() { return from; }
//    public void setFrom(String from) { this.from = from; }
//
//    public String getTo() { return to; }
//    public void setTo(String to) { this.to = to; }
//
//    public String getFromType() { return fromType; }
//    public void setFromType(String fromType) { this.fromType = fromType; }
//
//    public String getToType() { return toType; }
//    public void setToType(String toType) { this.toType = toType; }
}