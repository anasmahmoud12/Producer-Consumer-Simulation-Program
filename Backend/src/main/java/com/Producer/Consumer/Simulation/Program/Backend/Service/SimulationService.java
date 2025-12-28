package com.Producer.Consumer.Simulation.Program.Backend.Service;

import com.Producer.Consumer.Simulation.Program.Backend.Models.*;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Concurrency.MachineExecutor;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationEvent;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationEventPublisher;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot.SnapshotManager;
import com.Producer.Consumer.Simulation.Program.Backend.Websocket.SimulationWebSocketHandler;
import org.springframework.stereotype.Service;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot.SimulationSnapshot;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot.SnapshotManager;
import java.util.Date;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class SimulationService {
    // Nodes
    private StartNode startNode;
    private EndNode endNode;
    private final List<Machine> machines = Collections.synchronizedList(new ArrayList<>());
    private final List<ProductionQueue> queues = Collections.synchronizedList(new ArrayList<>());
    private final List<Product> products = Collections.synchronizedList(new ArrayList<>());
    private final List<Connection> connections = Collections.synchronizedList(new ArrayList<>());

    private final SimulationStatistics statistics = new SimulationStatistics();
    private final SimulationWebSocketHandler webSocketHandler;

    private boolean isRunning = false;
    private boolean isPaused = false; // ✅ ADDED: Track pause state
    private ScheduledExecutorService productGenerator;
    private AtomicInteger productCounter = new AtomicInteger(0);

    private final String[] COLORS = {"#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"};
    private final String[] TYPES = {"TypeA", "TypeB", "TypeC"};

    public SimulationService(SimulationWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
        initializeDefaultSetup();
    }

    private void initializeDefaultSetup() {
        // ✅ Initialize START and END nodes
        startNode = new StartNode(50, 300, 100); // Generate 100 products
        endNode = new EndNode(1150, 300);

        // Create default queues
        queues.add(new ProductionQueue("Q0", 200, 300, 100));
        queues.add(new ProductionQueue("Q1", 600, 300, 100));
        queues.add(new ProductionQueue("Q2", 1000, 300, 100));

        // Create default machines
        machines.add(new Machine("M1", 400, 300, 2000, 4000));
        machines.add(new Machine("M2", 800, 300, 2000, 4000));

        // Create default connections
        addConnectionInternal("START", "Q0", "start", "queue");
        addConnectionInternal("Q0", "M1", "queue", "machine");
        addConnectionInternal("M1", "Q1", "machine", "queue");
        addConnectionInternal("Q1", "M2", "queue", "machine");
        addConnectionInternal("M2", "Q2", "machine", "queue");
        addConnectionInternal("Q2", "END", "queue", "end");

        System.out.println("✅ Default simulation setup with START and END nodes");
    }

    // ============================================================================
    // START/END NODE METHODS
    // ============================================================================

    public void setTotalProducts(int total) {
        startNode.setTotalProductsToGenerate(total);
        System.out.println("📊 Total products set to: " + total);
    }

    public int getTotalProducts() {
        return startNode.getTotalProductsToGenerate();
    }

    public int getGeneratedCount() {
        return startNode.getGeneratedCount();
    }

    public int getCompletedCount() {
        return endNode.getCompletedCount();
    }

    // ============================================================================
    // SIMULATION CONTROL
    // ============================================================================

    public void startSimulation(int productionRate) {
        isRunning = true;
        isPaused = false; // ✅ Reset pause state when starting
        statistics.setSimulationStartTime(System.currentTimeMillis());
        startProductGeneration(productionRate);

        System.out.println("🚀 Simulation started");
        System.out.println("📦 Will generate " + startNode.getTotalProductsToGenerate() + " products");
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    // ✅ ADDED: Pause simulation method
    public void pauseSimulation() {
        isPaused = true;
        System.out.println("⏸️ Simulation paused");
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    // ✅ ADDED: Resume simulation method
    public void resumeSimulation() {
        isPaused = false;
        System.out.println("▶️ Simulation resumed");
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    private void startProductGeneration(int productionRate) {
        if (productGenerator != null) {
            productGenerator.shutdownNow();
        }

        productGenerator = Executors.newScheduledThreadPool(1);

        productGenerator.scheduleAtFixedRate(() -> {
            // ✅ Check both running and paused states
            if (isRunning && !isPaused && startNode.canGenerate()) {
                generateProduct();
            } else if (!startNode.canGenerate()) {
                System.out.println("✅ Reached product limit: " + startNode.getTotalProductsToGenerate());
            }
        }, 0, productionRate, TimeUnit.MILLISECONDS);
    }

    private void generateProduct() {
        try {
            String id = "P" + productCounter.incrementAndGet();
            String color = COLORS[ThreadLocalRandom.current().nextInt(COLORS.length)];
            int priority = ThreadLocalRandom.current().nextInt(1, 4);
            String type = TYPES[ThreadLocalRandom.current().nextInt(TYPES.length)];

            // ✅ FIXED: Using correct constructor signature (id, color, priority, type)
            Product product = new Product(id, color, priority, type);
            products.add(product);
            startNode.incrementGenerated();

            // Add to first queue after START
            ProductionQueue firstQueue = findQueueConnectedToStart();
            if (firstQueue != null) {
                synchronized (firstQueue.getProducts()) {
                    firstQueue.getProducts().add(product);
                }

                statistics.setTotalProductsInSystem(statistics.getTotalProductsInSystem() + 1);

                Map<String, Object> event = new HashMap<>();
                event.put("type", "PRODUCT_GENERATED");
                event.put("product", product);
                event.put("queueId", firstQueue.getId());

                webSocketHandler.broadcast("/topic/simulation-events", event);

                System.out.println("📦 Generated: " + id + " (" + startNode.getGeneratedCount() +
                        "/" + startNode.getTotalProductsToGenerate() + ")");
            }
        } catch (Exception e) {
            System.err.println("Error generating product: " + e.getMessage());
        }
    }

    private ProductionQueue findQueueConnectedToStart() {
        return connections.stream()
                .filter(c -> "START".equals(c.getFrom()))
                .findFirst()
                .map(c -> queues.stream()
                        .filter(q -> q.getId().equals(c.getTo()))
                        .findFirst()
                        .orElse(null))
                .orElse(null);
    }

    public void stopSimulation() {
        isRunning = false;
        isPaused = false; // ✅ Reset pause state when stopping
        if (productGenerator != null) {
            productGenerator.shutdownNow();
            productGenerator = null;
        }

        System.out.println("⏹️ Simulation stopped");
        System.out.println("📊 Generated: " + startNode.getGeneratedCount());
        System.out.println("✅ Completed: " + endNode.getCompletedCount());
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    // ============================================================================
    // CONNECTION MANAGEMENT WITH VALIDATION
    // ============================================================================

    public boolean addConnection(String from, String to) {
        String fromType = getNodeType(from);
        String toType = getNodeType(to);

        return addConnectionInternal(from, to, fromType, toType);
    }

    private boolean addConnectionInternal(String from, String to, String fromType, String toType) {
        Connection newConnection = new Connection(from, to, fromType, toType);

        // Validate connection
        if (!newConnection.isValid()) {
            System.err.println("❌ Invalid connection: " + from + " -> " + to);
            return false;
        }

        // Check specific rules
        if ("machine".equals(fromType)) {
            Machine machine = findMachine(from);
            if (machine != null && !machine.canAddOutputQueue()) {
                System.err.println("❌ Machine " + from + " already has output queue");
                return false;
            }
        }

        if ("queue".equals(fromType)) {
            ProductionQueue queue = findQueue(from);
            if (queue != null) {
                // Queue can have multiple outputs - OK
            }
        }

        if ("machine".equals(toType)) {
            Machine machine = findMachine(to);
            if (machine != null) {
                // Machine can have multiple inputs - OK
            }
        }

        if ("queue".equals(toType)) {
            ProductionQueue queue = findQueue(to);
            if (queue != null && !queue.canAddInputMachine()) {
                System.err.println("❌ Queue " + to + " already has input machine");
                return false;
            }
        }

        // Add connection
        connections.add(newConnection);

        // Update node references
        updateNodeReferences(from, to, fromType, toType);

        System.out.println("🔗 Connection added: " + from + " -> " + to);
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
        return true;
    }

    private void updateNodeReferences(String from, String to, String fromType, String toType) {
        if ("machine".equals(fromType) && "queue".equals(toType)) {
            Machine machine = findMachine(from);
            ProductionQueue queue = findQueue(to);
            if (machine != null && queue != null) {
                machine.setOutputQueueId(to);
                queue.setInputMachineId(from);
            }
        } else if ("queue".equals(fromType) && "machine".equals(toType)) {
            ProductionQueue queue = findQueue(from);
            Machine machine = findMachine(to);
            if (queue != null && machine != null) {
                queue.addOutputMachine(to);
                machine.addInputQueue(from);
            }
        }
    }

    public void removeConnection(String from, String to) {
        connections.removeIf(c -> c.getFrom().equals(from) && c.getTo().equals(to));

        // Update node references
        Machine machine = findMachine(from);
        if (machine != null) {
            machine.setOutputQueueId(null);
        }

        ProductionQueue queue = findQueue(from);
        if (queue != null) {
            queue.removeOutputMachine(to);
        }

        machine = findMachine(to);
        if (machine != null) {
            machine.removeInputQueue(from);
        }

        queue = findQueue(to);
        if (queue != null) {
            queue.setInputMachineId(null);
        }

        System.out.println("✂️ Connection removed: " + from + " -> " + to);
        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    // ✅ ADDED: Public getNodeType method (required by Controller)
    public String getNodeType(String id) {
        if ("START".equals(id)) return "start";
        if ("END".equals(id)) return "end";
        if (findMachine(id) != null) return "machine";
        if (findQueue(id) != null) return "queue";
        return "unknown";
    }

    // ============================================================================
    // POSITION UPDATE (FOR DRAG & DROP)
    // ============================================================================

    public void updatePosition(String id, double x, double y) {
        if ("START".equals(id)) {
            startNode.setX(x);
            startNode.setY(y);
        } else if ("END".equals(id)) {
            endNode.setX(x);
            endNode.setY(y);
        } else {
            Machine machine = findMachine(id);
            if (machine != null) {
                machine.setX(x);
                machine.setY(y);
            } else {
                ProductionQueue queue = findQueue(id);
                if (queue != null) {
                    queue.setX(x);
                    queue.setY(y);
                }
            }
        }

        webSocketHandler.broadcast("/topic/state-update", getCurrentState());
    }

    // ============================================================================
    // CRUD OPERATIONS
    // ============================================================================

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

    // ============================================================================
    // STATE & EXPORT
    // ============================================================================

    public Map<String, Object> getCurrentState() {
        Map<String, Object> state = new HashMap<>();
        state.put("startNode", startNode);
        state.put("endNode", endNode);
        state.put("machines", new ArrayList<>(machines));
        state.put("queues", new ArrayList<>(queues));
        state.put("products", new ArrayList<>(products));
        state.put("connections", new ArrayList<>(connections));
        state.put("statistics", statistics);
        state.put("isRunning", isRunning);
        state.put("isPaused", isPaused); // ✅ Include pause state
        return state;
    }

    public Map<String, Object> exportConfiguration() {
        Map<String, Object> config = new HashMap<>();
        config.put("totalProducts", startNode.getTotalProductsToGenerate());
        config.put("startNode", startNode);
        config.put("endNode", endNode);
        config.put("machines", new ArrayList<>(machines));
        config.put("queues", new ArrayList<>(queues));
        config.put("connections", new ArrayList<>(connections));
        return config;
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private Machine findMachine(String id) {
        return machines.stream()
                .filter(m -> m.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    private ProductionQueue findQueue(String id) {
        return queues.stream()
                .filter(q -> q.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    // Getters
    public StartNode getStartNode() { return startNode; }
    public EndNode getEndNode() { return endNode; }
    public List<Machine> getMachines() { return new ArrayList<>(machines); }
    public List<ProductionQueue> getQueues() { return new ArrayList<>(queues); }
    public List<Product> getProducts() { return new ArrayList<>(products); }
    public List<Connection> getConnections() { return new ArrayList<>(connections); }
    public SimulationStatistics getStatistics() { return statistics; }
    public boolean isRunning() { return isRunning; }
    public boolean isPaused() { return isPaused; } // ✅ Getter for pause state
}