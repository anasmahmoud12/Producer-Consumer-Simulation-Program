package com.Producer.Consumer.Simulation.Program.Backend.Service;


import com.Producer.Consumer.Simulation.Program.Backend.Models.Connection;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Machine;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Product;
import com.Producer.Consumer.Simulation.Program.Backend.Models.ProductionQueue;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Concurrency.MachineExecutor;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationEvent;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationEventPublisher;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot.SimulationSnapshot;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot.SnapshotManager;
import com.Producer.Consumer.Simulation.Program.Backend.Websocket.SimulationWebSocketHandler;
import com.Producer.Consumer.Simulation.Program.Backend.dto.ConnectionDTO;
import com.Producer.Consumer.Simulation.Program.Backend.dto.MachineDTO;
import com.Producer.Consumer.Simulation.Program.Backend.dto.QueueDTO;
import com.Producer.Consumer.Simulation.Program.Backend.dto.SimulationConfigDTO;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.*;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class SimulationService {
    private final List<Machine> machines = Collections.synchronizedList(new ArrayList<>());
    private final List<ProductionQueue> queues = Collections.synchronizedList(new ArrayList<>());
    private final List<Product> products = Collections.synchronizedList(new ArrayList<>());
    private final List<Connection> connections = Collections.synchronizedList(new ArrayList<>());

    private final SimulationStatistics statistics = new SimulationStatistics();
    private final SimulationWebSocketHandler webSocketHandler;

    private boolean isRunning = false;
    private AtomicInteger productCounter = new AtomicInteger(0);

    public SimulationService(SimulationWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
        initializeDefaultSetup();
    }

    private void initializeDefaultSetup() {
        // Create default queues
        queues.add(new ProductionQueue("Q0", 100, 200, 100));
        queues.add(new ProductionQueue("Q1", 500, 200, 100));
        queues.add(new ProductionQueue("Q2", 900, 200, 100));

        // Create default machines
        machines.add(new Machine("M1", 300, 200, 1000, 2000));
        machines.add(new Machine("M2", 700, 200, 1500, 2500));

        // Create default connections
        connections.add(new Connection("Q0", "M1"));
        connections.add(new Connection("M1", "Q1"));
        connections.add(new Connection("Q1", "M2"));
        connections.add(new Connection("M2", "Q2"));

        System.out.println("✅ Default simulation setup initialized");
    }

    public void startSimulation(int productionRate) {
        isRunning = true;
        statistics.setSimulationStartTime(System.currentTimeMillis());
        System.out.println("🚀 Simulation started");

        // Broadcast state update
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    public void stopSimulation() {
        isRunning = false;
        System.out.println("⏹️ Simulation stopped");
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    public void pauseSimulation() {
        System.out.println("⏸️ Simulation paused");
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    public void resumeSimulation() {
        System.out.println("▶️ Simulation resumed");
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    public Machine addMachine(double x, double y, int minServiceTime, int maxServiceTime) {
        String id = "M" + (machines.size() + 1);
        Machine machine = new Machine(id, x, y, minServiceTime, maxServiceTime);
        machines.add(machine);

        System.out.println("➕ Added machine: " + id);
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());

        return machine;
    }

    public void removeMachine(String id) {
        machines.removeIf(m -> m.getId().equals(id));
        connections.removeIf(c -> c.getFrom().equals(id) || c.getTo().equals(id));

        System.out.println("➖ Removed machine: " + id);
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    public ProductionQueue addQueue(double x, double y, int capacity) {
        String id = "Q" + queues.size();
        ProductionQueue queue = new ProductionQueue(id, x, y, capacity);
        queues.add(queue);

        System.out.println("➕ Added queue: " + id);
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());

        return queue;
    }

    public void removeQueue(String id) {
        queues.removeIf(q -> q.getId().equals(id));
        connections.removeIf(c -> c.getFrom().equals(id) || c.getTo().equals(id));

        System.out.println("➖ Removed queue: " + id);
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    public void addConnection(String from, String to) {
        connections.add(new Connection(from, to));

        System.out.println("🔗 Added connection: " + from + " -> " + to);
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    public void removeConnection(String from, String to) {
        connections.removeIf(c -> c.getFrom().equals(from) && c.getTo().equals(to));

        System.out.println("✂️ Removed connection: " + from + " -> " + to);
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    public Map<String, Object> getCurrentState() {
        Map<String, Object> state = new HashMap<>();
        state.put("machines", new ArrayList<>(machines));
        state.put("queues", new ArrayList<>(queues));
        state.put("products", new ArrayList<>(products));
        state.put("connections", new ArrayList<>(connections));
        state.put("statistics", statistics);
        state.put("isRunning", isRunning);
        return state;
    }

    public Map<String, Object> exportConfiguration() {
        Map<String, Object> config = new HashMap<>();
        config.put("productionRate", 2000);
        config.put("simulationSpeed", 1.0);
        config.put("machines", new ArrayList<>(machines));
        config.put("queues", new ArrayList<>(queues));
        config.put("connections", new ArrayList<>(connections));
        return config;
    }

    // Getters
    public List<Machine> getMachines() { return new ArrayList<>(machines); }
    public List<ProductionQueue> getQueues() { return new ArrayList<>(queues); }
    public List<Product> getProducts() { return new ArrayList<>(products); }
    public List<Connection> getConnections() { return new ArrayList<>(connections); }
    public SimulationStatistics getStatistics() { return statistics; }
    public boolean isRunning() { return isRunning; }
}