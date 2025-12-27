package com.Producer.Consumer.Simulation.Program.Backend.Service;

import com.Producer.Consumer.Simulation.Program.Backend.Models.Connection;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Machine;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Product;
import com.Producer.Consumer.Simulation.Program.Backend.Models.ProductionQueue;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Concurrency.MachineExecutor;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationEvent;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationEventPublisher;
import com.Producer.Consumer.Simulation.Program.Backend.Websocket.SimulationWebSocketHandler;
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
    private final MachineExecutor machineExecutor;
    private final SimulationEventPublisher eventPublisher;

    // NEW: Production thread management
    private ScheduledExecutorService productionExecutor;
    private ScheduledFuture<?> productionTask;
    private boolean isRunning = false;
    private AtomicInteger productCounter = new AtomicInteger(0);

    public SimulationService(SimulationWebSocketHandler webSocketHandler,
                             MachineExecutor machineExecutor,
                             SimulationEventPublisher eventPublisher) {
        this.webSocketHandler = webSocketHandler;
        this.machineExecutor = machineExecutor;
        this.eventPublisher = eventPublisher;
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

    // ============ FIXED START SIMULATION ============
    public void startSimulation(int productionRate) {
        if (isRunning) {
            System.out.println("⚠️ Simulation already running");
            return;
        }

        isRunning = true;
        statistics.setSimulationStartTime(System.currentTimeMillis());
        System.out.println("🚀 Simulation started with production rate: " + productionRate + "ms");

        // Start producer thread to create products
        productionExecutor = Executors.newScheduledThreadPool(1);
        productionTask = productionExecutor.scheduleAtFixedRate(
                this::produceProduct,
                0,
                productionRate,
                TimeUnit.MILLISECONDS
        );

        // Start all machines
        startAllMachines();

        // Broadcast state update
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    // ============ NEW: PRODUCT PRODUCER ============
    private void produceProduct() {
        if (!isRunning) return;

        try {
            // Find the starting queue (one with no incoming connections)
            ProductionQueue startQueue = findStartQueue();

            if (startQueue != null) {
                String[] colors = {"#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"};
                String color = colors[ThreadLocalRandom.current().nextInt(colors.length)];
                int priority = ThreadLocalRandom.current().nextInt(1, 6);

                Product product = new Product(color, priority, "TypeA");

                if (startQueue.addProduct(product)) {
                    products.add(product);
                    statistics.setTotalProductsInSystem(products.size());

                    System.out.println("📦 Product created: " + product.getId() +
                            " (Priority: " + priority + ") added to " + startQueue.getId());

                    eventPublisher.notifyObservers(
                            new SimulationEvent("PRODUCT_CREATED", product)
                    );

                    webSocketHandler.broadcast("/topic/state-update", getCurrentState());
                } else {
                    System.out.println("⚠️ Queue " + startQueue.getId() + " is full!");
                }
            } else {
                System.out.println("⚠️ No starting queue found!");
            }
        } catch (Exception e) {
            System.err.println("❌ Error producing product: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ============ NEW: START ALL MACHINES ============
    private void startAllMachines() {
        for (Machine machine : machines) {
            ProductionQueue inputQueue = findInputQueue(machine.getId());
            ProductionQueue outputQueue = findOutputQueue(machine.getId());

            if (inputQueue != null) {
                System.out.println("🔧 Starting machine: " + machine.getId() +
                        " (Input: " + inputQueue.getId() +
                        ", Output: " + (outputQueue != null ? outputQueue.getId() : "none") + ")");
                machineExecutor.startMachine(machine, inputQueue, outputQueue);
            } else {
                System.out.println("⚠️ Machine " + machine.getId() + " has no input queue!");
            }
        }
    }

    // ============ NEW: HELPER METHODS ============
    private ProductionQueue findInputQueue(String machineId) {
        return connections.stream()
                .filter(c -> c.getTo().equals(machineId))
                .findFirst()
                .map(c -> queues.stream()
                        .filter(q -> q.getId().equals(c.getFrom()))
                        .findFirst()
                        .orElse(null))
                .orElse(null);
    }

    private ProductionQueue findOutputQueue(String machineId) {
        return connections.stream()
                .filter(c -> c.getFrom().equals(machineId))
                .findFirst()
                .map(c -> queues.stream()
                        .filter(q -> q.getId().equals(c.getTo()))
                        .findFirst()
                        .orElse(null))
                .orElse(null);
    }

    private ProductionQueue findStartQueue() {
        // Find queue with no incoming connections (starting point)
        Set<String> destinationIds = connections.stream()
                .map(Connection::getTo)
                .collect(Collectors.toSet());

        return queues.stream()
                .filter(q -> !destinationIds.contains(q.getId()))
                .findFirst()
                .orElse(queues.isEmpty() ? null : queues.get(0));
    }

    // ============ FIXED STOP SIMULATION ============
    public void stopSimulation() {
        isRunning = false;
        System.out.println("⏹️ Simulation stopped");

        // Stop production
        if (productionTask != null) {
            productionTask.cancel(true);
        }
        if (productionExecutor != null) {
            productionExecutor.shutdown();
            try {
                if (!productionExecutor.awaitTermination(2, TimeUnit.SECONDS)) {
                    productionExecutor.shutdownNow();
                }
            } catch (InterruptedException e) {
                productionExecutor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }

        // Stop all machines
        machineExecutor.stopAll();

        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    public void pauseSimulation() {
        System.out.println("⏸️ Simulation paused");
        if (productionTask != null) {
            productionTask.cancel(false);
        }
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    public void resumeSimulation() {
        System.out.println("▶️ Simulation resumed");
        if (productionExecutor != null && !productionExecutor.isShutdown()) {
            productionTask = productionExecutor.scheduleAtFixedRate(
                    this::produceProduct,
                    0,
                    2000,
                    TimeUnit.MILLISECONDS
            );
        }
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    // ============ ADD/REMOVE METHODS ============
    public Machine addMachine(double x, double y, int minServiceTime, int maxServiceTime) {
        String id = "M" + (machines.size() + 1);
        Machine machine = new Machine(id, x, y, minServiceTime, maxServiceTime);
        machines.add(machine);

        System.out.println("➕ Added machine: " + id);

        // If simulation is running, start this machine too
        if (isRunning) {
            ProductionQueue inputQueue = findInputQueue(machine.getId());
            ProductionQueue outputQueue = findOutputQueue(machine.getId());
            if (inputQueue != null) {
                machineExecutor.startMachine(machine, inputQueue, outputQueue);
            }
        }

        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
        return machine;
    }

    public void removeMachine(String id) {
        machineExecutor.stopMachine(id);
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

    // ============ STATE & CONFIG ============
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