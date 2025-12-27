package com.Producer.Consumer.Simulation.Program.Backend.Controller;

import com.Producer.Consumer.Simulation.Program.Backend.Models.Connection;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Machine;
import com.Producer.Consumer.Simulation.Program.Backend.Models.ProductionQueue;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot.SimulationSnapshot;
import com.Producer.Consumer.Simulation.Program.Backend.Service.SimulationService;
import com.Producer.Consumer.Simulation.Program.Backend.Service.SimulationStatistics;
import com.Producer.Consumer.Simulation.Program.Backend.Websocket.WebSocketBroadcaster;
import com.Producer.Consumer.Simulation.Program.Backend.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
@CrossOrigin(origins = {"*"})
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/start")
    public ResponseEntity<String> startSimulation(
            @RequestParam(defaultValue = "2000") int productionRate) {
        simulationService.startSimulation(productionRate);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping("/stop")
    public ResponseEntity<String> stopSimulation() {
        simulationService.stopSimulation();
        return ResponseEntity.ok("");
    }

    @PostMapping("/pause")
    public ResponseEntity<String> pauseSimulation() {
        simulationService.pauseSimulation();
        return ResponseEntity.ok("");
    }

    @PostMapping("/resume")
    public ResponseEntity<String> resumeSimulation() {
        simulationService.resumeSimulation();
        return ResponseEntity.ok("");
    }

    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getState() {
        return ResponseEntity.ok(simulationService.getCurrentState());
    }

    @GetMapping("/statistics")
    public ResponseEntity<Object> getStatistics() {
        return ResponseEntity.ok(simulationService.getStatistics());
    }

    @PostMapping("/machines")
    public ResponseEntity<Machine> addMachine(@RequestBody Map<String, Object> request) {
        double x = ((Number) request.get("x")).doubleValue();
        double y = ((Number) request.get("y")).doubleValue();
        int minServiceTime = ((Number) request.getOrDefault("minServiceTime", 1000)).intValue();
        int maxServiceTime = ((Number) request.getOrDefault("maxServiceTime", 2000)).intValue();

        Machine machine = simulationService.addMachine(x, y, minServiceTime, maxServiceTime);
        return ResponseEntity.ok(machine);
    }

    @DeleteMapping("/machines/{id}")
    public ResponseEntity<String> removeMachine(@PathVariable String id) {
        simulationService.removeMachine(id);
        return ResponseEntity.ok("");
    }

    @PostMapping("/queues")
    public ResponseEntity<ProductionQueue> addQueue(@RequestBody Map<String, Object> request) {
        double x = ((Number) request.get("x")).doubleValue();
        double y = ((Number) request.get("y")).doubleValue();
        int capacity = ((Number) request.getOrDefault("capacity", 100)).intValue();

        ProductionQueue queue = simulationService.addQueue(x, y, capacity);
        return ResponseEntity.ok(queue);
    }

    @DeleteMapping("/queues/{id}")
    public ResponseEntity<String> removeQueue(@PathVariable String id) {
        simulationService.removeQueue(id);
        return ResponseEntity.ok("");
    }

    @PostMapping("/connections")
    public ResponseEntity<Connection> addConnection(@RequestBody Map<String, String> request) {
        String from = request.get("from");
        String to = request.get("to");
        System.out.println("from: " + from + ", to: " + to);

        simulationService.addConnection(from, to);
        return ResponseEntity.ok(new Connection(from, to));
    }

    @DeleteMapping("/connections")
    public ResponseEntity<String> removeConnection(
            @RequestParam String from,
            @RequestParam String to) {
        simulationService.removeConnection(from, to);
        return ResponseEntity.ok("");
    }

    @GetMapping("/config/export")
    public ResponseEntity<Map<String, Object>> exportConfiguration() {
        return ResponseEntity.ok(simulationService.exportConfiguration());
    }

    @PostMapping("/config/import")
    public ResponseEntity<String> importConfiguration(@RequestBody Map<String, Object> config) {
        // Import configuration logic would go here
        return ResponseEntity.ok("");
    }
}
