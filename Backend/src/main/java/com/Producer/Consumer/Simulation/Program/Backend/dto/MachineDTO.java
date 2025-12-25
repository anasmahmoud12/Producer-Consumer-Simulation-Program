package com.Producer.Consumer.Simulation.Program.Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MachineDTO {
    private String id;
    private double x;
    private double y;
    private int minServiceTime;
    private int maxServiceTime;
    private double reliability;
}