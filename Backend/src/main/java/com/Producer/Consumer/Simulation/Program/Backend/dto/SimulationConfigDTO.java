package com.Producer.Consumer.Simulation.Program.Backend.dto;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SimulationConfigDTO {
    private int productionRate;
    private double simulationSpeed;
    private List<MachineDTO> machines;
    private List<QueueDTO> queues;
    private List<ConnectionDTO> connections;
}
