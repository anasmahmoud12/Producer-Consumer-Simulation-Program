package com.Producer.Consumer.Simulation.Program.Backend.Controller;

import com.Producer.Consumer.Simulation.Program.Backend.Models.Connection;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Machine;
import com.Producer.Consumer.Simulation.Program.Backend.Models.ProductionQueue;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot.SimulationSnapshot;
import com.Producer.Consumer.Simulation.Program.Backend.Service.SimulationService;
import com.Producer.Consumer.Simulation.Program.Backend.Service.SimulationStatistics;
import com.Producer.Consumer.Simulation.Program.Backend.Websocket.WebSocketBroadcaster;
import com.Producer.Consumer.Simulation.Program.Backend.dto.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
@CrossOrigin(origins = "*")
public class SimulationController {

    private final SimulationService simulationService;
    private final WebSocketBroadcaster broadcaster;

    public SimulationController(SimulationService simulationService,
                                WebSocketBroadcaster broadcaster) {
        this.simulationService = simulationService;
        this.broadcaster = broadcaster;

        // Subscribe broadcaster to simulation events
        simulationService.getEventPublisher().subscribe(broadcaster);
    }

    // ===== Simulation Control Endpoints =====

    @PostMapping("/start")
    public ResponseEntity<String> startSimulation(
            @RequestParam(defaultValue = "2000") int productionRate) {
        simulationService.startSimulation(productionRate);
        return ResponseEntity.ok("Simulation started");
    }

    @PostMapping("/stop")
    public ResponseEntity<String> stopSimulation() {
        simulationService.stopSimulation();
        return ResponseEntity.ok("Simulation stopped");
    }

    @PostMapping("/pause")
    public ResponseEntity<String> pauseSimulation() {
        simulationService.pauseSimulation();
        return ResponseEntity.ok("Simulation paused");
    }

    @PostMapping("/resume")
    public ResponseEntity<String> resumeSimulation() {
        simulationService.resumeSimulation();
        return ResponseEntity.ok("Simulation resumed");
    }

    // ===== State Management Endpoints =====

    @GetMapping("/state")
    public ResponseEntity<SimulationStateDTO> getState() {
        SimulationStateDTO state = new SimulationStateDTO(
                simulationService.getMachines(),
                simulationService.getQueues(),
                simulationService.getProducts(),
                simulationService.getStatistics(),
                simulationService.isRunning()
        );
        return ResponseEntity.ok(state);
    }

    @GetMapping("/statistics")
    public ResponseEntity<SimulationStatistics> getStatistics() {
        return ResponseEntity.ok(simulationService.getStatistics());
    }

    // ===== Configuration Endpoints =====

    @PostMapping("/machines")
    public ResponseEntity<Machine> addMachine(@RequestBody MachineDTO dto) {
        Machine machine = simulationService.addMachine(
                dto.getX(), dto.getY(),
                dto.getMinServiceTime(), dto.getMaxServiceTime()
        );
        broadcaster.broadcastStateUpdate(simulationService.getMachines());
        return ResponseEntity.ok(machine);
    }

    @DeleteMapping("/machines/{id}")
    public ResponseEntity<String> removeMachine(@PathVariable String id) {
        simulationService.removeMachine(id);
        broadcaster.broadcastStateUpdate(simulationService.getMachines());
        return ResponseEntity.ok("Machine removed");
    }

    @PostMapping("/queues")
    public ResponseEntity<ProductionQueue> addQueue(@RequestBody QueueDTO dto) {
        ProductionQueue queue = simulationService.addQueue(
                dto.getX(), dto.getY(), dto.getCapacity()
        );
        broadcaster.broadcastStateUpdate(simulationService.getQueues());
        return ResponseEntity.ok(queue);
    }

    @DeleteMapping("/queues/{id}")
    public ResponseEntity<String> removeQueue(@PathVariable String id) {
        simulationService.removeQueue(id);
        broadcaster.broadcastStateUpdate(simulationService.getQueues());
        return ResponseEntity.ok("Queue removed");
    }

    @PostMapping("/connections")
    public ResponseEntity<Connection> addConnection(@RequestBody ConnectionDTO dto) {
        simulationService.addConnection(dto.getFrom(), dto.getTo());
        broadcaster.broadcastStateUpdate(simulationService.getConnections());
        return ResponseEntity.ok(new Connection(dto.getFrom(), dto.getTo()));
    }

    @DeleteMapping("/connections")
    public ResponseEntity<String> removeConnection(
            @RequestParam String from, @RequestParam String to) {
        simulationService.removeConnection(from, to);
        broadcaster.broadcastStateUpdate(simulationService.getConnections());
        return ResponseEntity.ok("Connection removed");
    }

    // ===== Snapshot Endpoints (Snapshot Pattern) =====

    @GetMapping("/snapshots")
    public ResponseEntity<List<SimulationSnapshot>> getSnapshots() {
        return ResponseEntity.ok(simulationService.getAllSnapshots());
    }

    @PostMapping("/snapshots/restore/{index}")
    public ResponseEntity<String> restoreSnapshot(@PathVariable int index) {
        simulationService.restoreSnapshot(index);
        return ResponseEntity.ok("Snapshot restored");
    }

    @PostMapping("/snapshots/create")
    public ResponseEntity<SimulationSnapshot> createSnapshot() {
        SimulationSnapshot snapshot = simulationService.createManualSnapshot();
        return ResponseEntity.ok(snapshot);
    }

    // ===== Configuration Import/Export (BONUS) =====

    @PostMapping("/config/import")
    public ResponseEntity<String> importConfiguration(
            @RequestBody SimulationConfigDTO config) {
        simulationService.loadConfiguration(config);
        return ResponseEntity.ok("Configuration imported");
    }

    @GetMapping("/config/export")
    public ResponseEntity<SimulationConfigDTO> exportConfiguration() {
        return ResponseEntity.ok(simulationService.exportConfiguration());
    }

    // ===== Advanced Analytics (BONUS) =====

    @GetMapping("/analytics/bottlenecks")
    public ResponseEntity<List<String>> identifyBottlenecks() {
        return ResponseEntity.ok(simulationService.identifyBottlenecks());
    }

    @GetMapping("/analytics/efficiency")
    public ResponseEntity<Map<String, Double>> getEfficiencyMetrics() {
        return ResponseEntity.ok(simulationService.calculateEfficiencyMetrics());
    }

    @GetMapping("/analytics/product-journey/{productId}")
    public ResponseEntity<List<String>> getProductJourney(@PathVariable String productId) {
        return ResponseEntity.ok(simulationService.getProductJourney(productId));
    }
}
