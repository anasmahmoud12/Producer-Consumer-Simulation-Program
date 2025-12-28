package com.Producer.Consumer.Simulation.Program.Backend.Controller;

import com.Producer.Consumer.Simulation.Program.Backend.Models.*;
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

    // ============================================================================
    // SIMULATION CONTROL
    // ============================================================================

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

    // ============================================================================
    // STATE & STATISTICS
    // ============================================================================

    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getState() {
        return ResponseEntity.ok(simulationService.getCurrentState());
    }

    @GetMapping("/statistics")
    public ResponseEntity<Object> getStatistics() {
        return ResponseEntity.ok(simulationService.getStatistics());
    }

    // ============================================================================
    // START/END NODE MANAGEMENT (NEW)
    // ============================================================================

    @PostMapping("/start-node/products")
    public ResponseEntity<String> setTotalProducts(@RequestParam int total) {
        if (total < 1 || total > 10000) {
            return ResponseEntity.badRequest().body("Total must be between 1 and 10000");
        }
        simulationService.setTotalProducts(total);
        return ResponseEntity.ok("Total products set to: " + total);
    }

    @GetMapping("/start-node/products")
    public ResponseEntity<Map<String, Integer>> getProductInfo() {
        return ResponseEntity.ok(Map.of(
                "total", simulationService.getTotalProducts(),
                "generated", simulationService.getGeneratedCount(),
                "completed", simulationService.getCompletedCount()
        ));
    }

    @GetMapping("/start-node")
    public ResponseEntity<StartNode> getStartNode() {
        return ResponseEntity.ok(simulationService.getStartNode());
    }

    @GetMapping("/end-node")
    public ResponseEntity<EndNode> getEndNode() {
        return ResponseEntity.ok(simulationService.getEndNode());
    }

    // ============================================================================
    // POSITION UPDATE (NEW - FOR DRAG & DROP)
    // ============================================================================

    @PutMapping("/position")
    public ResponseEntity<String> updatePosition(@RequestBody Map<String, Object> request) {
        try {
            String id = (String) request.get("id");
            double x = ((Number) request.get("x")).doubleValue();
            double y = ((Number) request.get("y")).doubleValue();

            simulationService.updatePosition(id, x, y);
            return ResponseEntity.ok("Position updated");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid position data");
        }
    }

    // ============================================================================
    // MACHINE MANAGEMENT
    // ============================================================================

    @PostMapping("/machines")
    public ResponseEntity<Machine> addMachine(@RequestBody Map<String, Object> request) {
        double x = ((Number) request.get("x")).doubleValue();
        double y = ((Number) request.get("y")).doubleValue();
        int minServiceTime = ((Number) request.getOrDefault("minServiceTime", 2000)).intValue();
        int maxServiceTime = ((Number) request.getOrDefault("maxServiceTime", 4000)).intValue();

        Machine machine = simulationService.addMachine(x, y, minServiceTime, maxServiceTime);
        return ResponseEntity.ok(machine);
    }

    @DeleteMapping("/machines/{id}")
    public ResponseEntity<String> removeMachine(@PathVariable String id) {
        simulationService.removeMachine(id);
        return ResponseEntity.ok("Machine removed");
    }

    // ============================================================================
    // QUEUE MANAGEMENT
    // ============================================================================

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
        return ResponseEntity.ok("Queue removed");
    }

    // ============================================================================
    // CONNECTION MANAGEMENT (UPDATED - WITH VALIDATION)
    // ============================================================================

    @PostMapping("/connections")
    public ResponseEntity<?> addConnection(@RequestBody Map<String, String> request) {
        String from = request.get("from");
        String to = request.get("to");

        boolean success = simulationService.addConnection(from, to);

        if (success) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Connection added",
                    "from", from,
                    "to", to
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid connection. Check connection rules.",
                    "rules", Map.of(
                            "machine", "Can have MULTIPLE inputs, ONE output",
                            "queue", "Can have ONE input, MULTIPLE outputs"
                    )
            ));
        }
    }

    @DeleteMapping("/connections")
    public ResponseEntity<String> removeConnection(
            @RequestParam String from,
            @RequestParam String to) {
        simulationService.removeConnection(from, to);
        return ResponseEntity.ok("Connection removed");
    }

    @GetMapping("/connections/validate")
    public ResponseEntity<Map<String, Object>> validateConnection(
            @RequestParam String from,
            @RequestParam String to) {
        // This endpoint helps frontend validate before creating connection
        String fromType = simulationService.getNodeType(from);
        String toType = simulationService.getNodeType(to);

        Connection testConnection = new Connection(from, to, fromType, toType);
        boolean isValid = testConnection.isValid();

        return ResponseEntity.ok(Map.of(
                "valid", isValid,
                "from", from,
                "to", to,
                "fromType", fromType,
                "toType", toType,
                "message", isValid ? "Valid connection" : "Invalid connection"
        ));
    }

    // ============================================================================
    // CONFIGURATION IMPORT/EXPORT
    // ============================================================================

    @GetMapping("/config/export")
    public ResponseEntity<Map<String, Object>> exportConfiguration() {
        return ResponseEntity.ok(simulationService.exportConfiguration());
    }

    @PostMapping("/config/import")
    public ResponseEntity<String> importConfiguration(@RequestBody Map<String, Object> config) {
        // Import configuration logic
        return ResponseEntity.ok("Configuration imported");
    }

    // ============================================================================
    // CONNECTION RULES INFO (NEW - HELPFUL FOR UI)
    // ============================================================================

    @GetMapping("/connection-rules")
    public ResponseEntity<Map<String, Object>> getConnectionRules() {
        return ResponseEntity.ok(Map.of(
                "machine", Map.of(
                        "inputs", "MULTIPLE queues allowed",
                        "outputs", "ONE queue only",
                        "note", "Machine can receive from multiple sources but outputs to single destination"
                ),
                "queue", Map.of(
                        "inputs", "ONE machine only",
                        "outputs", "MULTIPLE machines allowed",
                        "note", "Queue receives from single source but can distribute to multiple machines"
                ),
                "start", Map.of(
                        "inputs", "NONE",
                        "outputs", "ONE queue only",
                        "note", "Start node only connects to first queue"
                ),
                "end", Map.of(
                        "inputs", "ONE or more queues/machines",
                        "outputs", "NONE",
                        "note", "End node is the final destination"
                ),
                "validPaths", List.of(
                        "START → Queue",
                        "Queue → Machine",
                        "Machine → Queue",
                        "Machine → END",
                        "Queue → END"
                )
        ));
    }
}