package com.Producer.Consumer.Simulation.Program.Backend.dto;

import com.Producer.Consumer.Simulation.Program.Backend.Models.Machine;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Product;
import com.Producer.Consumer.Simulation.Program.Backend.Models.ProductionQueue;
import com.Producer.Consumer.Simulation.Program.Backend.Service.SimulationStatistics;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SimulationStateDTO {
    private List<Machine> machines;
    private List<ProductionQueue> queues;
    private List<Product> products;
    private SimulationStatistics statistics;
    private boolean isRunning;
}