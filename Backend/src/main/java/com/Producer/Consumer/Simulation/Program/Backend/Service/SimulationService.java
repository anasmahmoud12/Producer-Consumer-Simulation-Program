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
import java.util.stream.Collectors;

@Service
public class SimulationService {
    private boolean isPaused = false;

    private final List<Machine> machines = new ArrayList<>();
    private final List<ProductionQueue> queues = new ArrayList<>();
    private final List<Product> products = new ArrayList<>();
    private final List<Connection> connections = new ArrayList<>();

    private final SimulationEventPublisher eventPublisher;
    private final MachineExecutor machineExecutor;
    private final SnapshotManager snapshotManager;
    private final SimulationStatistics statistics;

    private ScheduledExecutorService productGenerator;
    private boolean isRunning = false;

    public SimulationService() {
        this.eventPublisher = new SimulationEventPublisher();
        this.machineExecutor = new MachineExecutor(eventPublisher);
        this.snapshotManager = new SnapshotManager();
        this.statistics = new SimulationStatistics();
    }

    public void startSimulation(int productionRate) {
        if (isRunning) return;

        isRunning = true;
        statistics.setSimulationStartTime(System.currentTimeMillis());

        // Start all machines
        for (Machine machine : machines) {
            ProductionQueue inputQueue = getInputQueue(machine.getId());
            ProductionQueue outputQueue = getOutputQueue(machine.getId());
            machineExecutor.startMachine(machine, inputQueue, outputQueue);
        }

        // Start product generation
        productGenerator = Executors.newScheduledThreadPool(1);
        productGenerator.scheduleAtFixedRate(
                this::generateProduct,
                0,
                productionRate,
                TimeUnit.MILLISECONDS
        );

        // Periodic snapshot creation
        productGenerator.scheduleAtFixedRate(
                () -> snapshotManager.saveSnapshot(createSnapshot()),
                5000,
                5000,
                TimeUnit.MILLISECONDS
        );
    }

    public void stopSimulation() {
        isRunning = false;
        if (productGenerator != null) {
            productGenerator.shutdownNow();
        }
        machineExecutor.stopAll();
    }

    private void generateProduct() {
        String[] colors = {"#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"};
        String[] types = {"TypeA", "TypeB", "TypeC"}; // BONUS: Product types

        String color = colors[ThreadLocalRandom.current().nextInt(colors.length)];
        int priority = ThreadLocalRandom.current().nextInt(1, 4);
        String type = types[ThreadLocalRandom.current().nextInt(types.length)];

        Product product = new Product(color, priority, type);
        products.add(product);

        if (!queues.isEmpty()) {
            queues.get(0).addProduct(product);
            eventPublisher.notifyObservers(
                    new SimulationEvent("PRODUCT_GENERATED", product)
            );
        }
    }

    private ProductionQueue getInputQueue(String machineId) {
        return connections.stream()
                .filter(c -> c.getTo().equals(machineId))
                .findFirst()
                .map(c -> queues.stream()
                        .filter(q -> q.getId().equals(c.getFrom()))
                        .findFirst()
                        .orElse(null))
                .orElse(null);
    }

    private ProductionQueue getOutputQueue(String machineId) {
        return connections.stream()
                .filter(c -> c.getFrom().equals(machineId))
                .findFirst()
                .map(c -> queues.stream()
                        .filter(q -> q.getId().equals(c.getTo()))
                        .findFirst()
                        .orElse(null))
                .orElse(null);
    }

    private SimulationSnapshot createSnapshot() {
        return new SimulationSnapshot(
                machines, queues, products, connections, statistics
        );
    }

    public void restoreSnapshot(int index) {
        SimulationSnapshot snapshot = snapshotManager.getSnapshot(index);
        if (snapshot != null) {
            // Restore state from snapshot
            machines.clear();
            machines.addAll(snapshot.getMachines());
            queues.clear();
            queues.addAll(snapshot.getQueues());
            products.clear();
            products.addAll(snapshot.getProducts());

            eventPublisher.notifyObservers(
                    new SimulationEvent("SNAPSHOT_RESTORED", snapshot)
            );
        }
    }

    // CRUD operations for machines, queues, connections...
    public Machine addMachine(double x, double y, int minTime, int maxTime) {
        String id = "M" + (machines.size() + 1);
        Machine machine = new Machine(id, x, y, minTime, maxTime);
        machines.add(machine);
        return machine;
    }

    public ProductionQueue addQueue(double x, double y, int capacity) {
        String id = "Q" + queues.size();
        ProductionQueue queue = new ProductionQueue(id, x, y, capacity);
        queues.add(queue);
        return queue;
    }

    public void addConnection(String from, String to) {
        connections.add(new Connection(from, to));
    }

    // Getters
    public List<Machine> getMachines() { return new ArrayList<>(machines); }
    public List<ProductionQueue> getQueues() { return new ArrayList<>(queues); }
    public SimulationStatistics getStatistics() { return statistics; }
    public SimulationEventPublisher getEventPublisher() { return eventPublisher; }


    public void pauseSimulation() {
        isPaused = true;
        snapshotManager.saveSnapshot(createSnapshot());
        eventPublisher.notifyObservers(
                new SimulationEvent("SIMULATION_PAUSED", null)
        );
    }

    public void resumeSimulation() {
        isPaused = false;
        eventPublisher.notifyObservers(
                new SimulationEvent("SIMULATION_RESUMED", null)
        );
    }

    public boolean isRunning() {
        return isRunning && !isPaused;
    }

    public void removeMachine(String id) {
        machines.removeIf(m -> m.getId().equals(id));
        connections.removeIf(c ->
                c.getFrom().equals(id) || c.getTo().equals(id)
        );
        machineExecutor.stopMachine(id);
    }

    public void removeQueue(String id) {
        queues.removeIf(q -> q.getId().equals(id));
        connections.removeIf(c ->
                c.getFrom().equals(id) || c.getTo().equals(id)
        );
    }

    public void removeConnection(String from, String to) {
        connections.removeIf(c ->
                c.getFrom().equals(from) && c.getTo().equals(to)
        );
    }

    public List<Connection> getConnections() {
        return new ArrayList<>(connections);
    }

    public List<Product> getProducts() {
        return new ArrayList<>(products);
    }

    public List<SimulationSnapshot> getAllSnapshots() {
        return snapshotManager.getAllSnapshots();
    }

    public SimulationSnapshot createManualSnapshot() {
        SimulationSnapshot snapshot = createSnapshot();
        snapshotManager.saveSnapshot(snapshot);
        return snapshot;
    }

    // BONUS: Configuration Import/Export
    public void loadConfiguration(SimulationConfigDTO config) {
        stopSimulation();
        machines.clear();
        queues.clear();
        connections.clear();

        config.getMachines().forEach(m ->
                machines.add(new Machine(m.getId(), m.getX(), m.getY(),
                        m.getMinServiceTime(), m.getMaxServiceTime()))
        );

        config.getQueues().forEach(q ->
                queues.add(new ProductionQueue(q.getId(), q.getX(), q.getY(), q.getCapacity()))
        );

        config.getConnections().forEach(c ->
                connections.add(new Connection(c.getFrom(), c.getTo()))
        );
    }

    public SimulationConfigDTO exportConfiguration() {
        List<MachineDTO> machineDTOs = machines.stream()
                .map(m -> new MachineDTO(m.getId(), m.getX(), m.getY(),
                        m.getMinServiceTime(), m.getMaxServiceTime(), m.getReliability()))
                .collect(Collectors.toList());

        List<QueueDTO> queueDTOs = queues.stream()
                .map(q -> new QueueDTO(q.getId(), q.getX(), q.getY(), q.getCapacity()))
                .collect(Collectors.toList());

        List<ConnectionDTO> connectionDTOs = connections.stream()
                .map(c -> new ConnectionDTO(c.getFrom(), c.getTo()))
                .collect(Collectors.toList());

        return new SimulationConfigDTO(2000, 1.0, machineDTOs, queueDTOs, connectionDTOs);
    }

    // BONUS: Analytics Methods
    public List<String> identifyBottlenecks() {
        List<String> bottlenecks = new ArrayList<>();

        for (ProductionQueue queue : queues) {
            double avgQueueSize = queue.getProducts().size();
            if (avgQueueSize > 5) { // Threshold
                bottlenecks.add("Queue " + queue.getId() +
                        " has high backlog: " + avgQueueSize + " products");
            }
        }

        for (Machine machine : machines) {
            double utilization = statistics.getMachineUtilization()
                    .getOrDefault(machine.getId(), 0.0);
            if (utilization > 90) {
                bottlenecks.add("Machine " + machine.getId() +
                        " is over-utilized: " + String.format("%.1f%%", utilization));
            }
        }

        return bottlenecks;
    }

    public Map<String, Double> calculateEfficiencyMetrics() {
        Map<String, Double> metrics = new HashMap<>();

        metrics.put("overallThroughput", statistics.getThroughput());
        metrics.put("avgWaitTime", statistics.getAverageWaitTime());
        metrics.put("totalProducts", (double) statistics.getTotalProductsProcessed());

        double avgUtilization = statistics.getMachineUtilization().values()
                .stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
        metrics.put("avgMachineUtilization", avgUtilization);

        return metrics;
    }

    public List<String> getProductJourney(String productId) {
        // Track product journey through the system
        // This would need to be implemented with event logging
        return new ArrayList<>(); // Placeholder
    }









}

