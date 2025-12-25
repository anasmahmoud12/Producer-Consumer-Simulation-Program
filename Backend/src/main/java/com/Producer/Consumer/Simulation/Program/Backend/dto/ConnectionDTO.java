package com.Producer.Consumer.Simulation.Program.Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
 public class ConnectionDTO {
    private String from;
    private String to;
}
