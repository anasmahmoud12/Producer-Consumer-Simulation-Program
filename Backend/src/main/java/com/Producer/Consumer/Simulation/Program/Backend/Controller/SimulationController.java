package com.Producer.Consumer.Simulation.Program.Backend.Controller;

import com.Producer.Consumer.Simulation.Program.Backend.Models.*;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot.Snapshot;
import com.Producer.Consumer.Simulation.Program.Backend.Service.SimulationService;
import com.Producer.Consumer.Simulation.Program.Backend.dto.ConnectionDTO;
import com.Producer.Consumer.Simulation.Program.Backend.dto.MachineDTO;
import com.Producer.Consumer.Simulation.Program.Backend.dto.QueueDTO;
import com.Producer.Consumer.Simulation.Program.Backend.dto.SimulationStateDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.Producer.Consumer.Simulation.Program.Backend.Service.SimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/simulation")
@CrossOrigin(origins = "*")
public class SimulationController {

    @Autowired
    private SimulationService simulationService;

    // Queue endpoints
    @PostMapping("/queue")
    public ResponseEntity<QueueDTO> addQueue(@RequestParam String type,
                                             @RequestParam double x,
                                             @RequestParam double y) {
        return ResponseEntity.ok(simulationService.addQueue(type, x, y));
    }

    @DeleteMapping("/queue/{id}")
    public ResponseEntity<Void> deleteQueue(@PathVariable String id) {
        simulationService.deleteQueue(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/queue/{id}/position")
    public ResponseEntity<Void> updateQueuePosition(@PathVariable String id,
                                                    @RequestParam double x,
                                                    @RequestParam double y) {
        simulationService.updateQueuePosition(id, x, y);
        return ResponseEntity.ok().build();
    }

    // Machine endpoints
    @PostMapping("/machine")
    public ResponseEntity<MachineDTO> addMachine(@RequestParam int serviceTime,
                                                 @RequestParam double x,
                                                 @RequestParam double y) {
        return ResponseEntity.ok(simulationService.addMachine(serviceTime, x, y));
    }

    @DeleteMapping("/machine/{id}")
    public ResponseEntity<Void> deleteMachine(@PathVariable String id) {
        simulationService.deleteMachine(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/machine/{id}/position")
    public ResponseEntity<Void> updateMachinePosition(@PathVariable String id,
                                                      @RequestParam double x,
                                                      @RequestParam double y) {
        simulationService.updateMachinePosition(id, x, y);
        return ResponseEntity.ok().build();
    }

    // Connection endpoints
    @PostMapping("/connection")
    public ResponseEntity<ConnectionDTO> addConnection(@RequestParam String sourceId,
                                                       @RequestParam String targetId) {
        return ResponseEntity.ok(simulationService.addConnection(sourceId, targetId));
    }

    @DeleteMapping("/connection/{id}")
    public ResponseEntity<Void> deleteConnection(@PathVariable String id) {
        simulationService.deleteConnection(id);
        return ResponseEntity.ok().build();
    }

    // Simulation control
    @PostMapping("/start")
    public ResponseEntity<Void> startSimulation() {
        simulationService.startSimulation();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/pause")
    public ResponseEntity<Void> pauseSimulation() {
        simulationService.pauseSimulation();
        return ResponseEntity.ok().build();
    }

    // ✅ Resume endpoint جديد
    @PostMapping("/resume")
    public ResponseEntity<Void> resumeSimulation() {
        simulationService.resumeSimulation();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset")
    public ResponseEntity<Void> resetSimulation() {
        simulationService.resetSimulation();
        return ResponseEntity.ok().build();
    }

    // State endpoints
    @GetMapping("/state")
    public ResponseEntity<SimulationStateDTO> getCurrentState() {
        return ResponseEntity.ok(simulationService.getCurrentState());
    }

    @GetMapping("/replay")
    public ResponseEntity<List<SimulationStateDTO>> getReplaySnapshots() {
        System.out.println("reply");
        return ResponseEntity.ok(simulationService.getReplaySnapshots());
    }
    @GetMapping("/snapshots")
    public ResponseEntity<List<Snapshot>> getAllSnapshots() {
        try {
            List<Snapshot> snapshots = simulationService.getAllSnapshots();
            System.out.println("[Controller] 📸 Returning " + snapshots.size() + " snapshots");
            return ResponseEntity.ok(snapshots);
        } catch (Exception e) {
            System.err.println("[Controller] ❌ Error getting snapshots: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/snapshots/restore/{index}")
    public ResponseEntity<SimulationStateDTO> restoreSnapshot(@PathVariable int index) {
        try {
            System.out.println("[Controller] 🔄 Restore request for snapshot #" + index);

            SimulationStateDTO restoredState = simulationService.restoreFromSnapshot(index);

            if (restoredState != null) {
                System.out.println("[Controller] ✅ Snapshot restored successfully");
                return ResponseEntity.ok(restoredState);
            } else {
                System.out.println("[Controller] ⚠️ Snapshot #" + index + " not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            System.err.println("[Controller] ❌ Error restoring snapshot: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    @DeleteMapping("/snapshots/clear")
    public ResponseEntity<Void> clearAllSnapshots() {
        try {
            simulationService.clearAllSnapshots();
            System.out.println("[Controller] 🗑️ All snapshots cleared");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("[Controller] ❌ Error clearing snapshots: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}