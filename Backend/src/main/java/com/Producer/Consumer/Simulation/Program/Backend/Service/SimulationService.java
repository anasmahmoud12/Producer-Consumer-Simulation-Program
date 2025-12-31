// ==================== UPDATED SIMULATION SERVICE ====================
// SimulationService.java
// Location: Backend/Service/SimulationService.java
package com.Producer.Consumer.Simulation.Program.Backend.Service;

//import com.Producer.Consumer.Simulation.Program.Backend.DTO.*;
import com.Producer.Consumer.Simulation.Program.Backend.Models.*;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Queue;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Concurrency.ThreadManager;
import com.Producer.Consumer.Simulation.Program.Backend.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;
@Service
public class SimulationService {

    @Autowired
    private QueueService queueService;

    @Autowired
    private MachineService machineService;

    @Autowired
    private SnapshotService snapshotService;
    private int replaySnapshotLimit = 0;
    private List<Connection> connections = new ArrayList<>();
    private ThreadManager threadManager;
    private ScheduledExecutorService productGenerator;
    private ScheduledExecutorService snapshotScheduler; // ✅ للـ automatic screenshots
    private boolean isRunning = false;






    public void startSimulation() {
        if (isRunning) {
            return;
        }

        isRunning = true;

        // ✅ مسح الـ snapshots القديمة - بداية جديدة
        snapshotService.clearSnapshots();
        replaySnapshotLimit = 0;
        System.out.println("[SimulationService] ▶ Starting - Snapshots cleared");

        // بدء threads
        Map<String, Machine> machines = machineService.getAllMachines();
        for (Machine machine : machines.values()) {
            threadManager.startMachine(machine);
        }

        // بدء توليد المنتجات
        productGenerator = Executors.newScheduledThreadPool(1);
        productGenerator.scheduleAtFixedRate(() -> {
            Map<String, Queue> queues = queueService.getAllQueues();
            for (Queue queue : queues.values()) {
                if (queue.getType().equals("start")) {
                    Product product = new Product();
                    queueService.addProductToQueue(queue.getId(), product);
                }
            }
        }, 0, 3000, TimeUnit.MILLISECONDS);

        // ✅ بدء أخذ screenshots تلقائياً
        snapshotScheduler = Executors.newScheduledThreadPool(1);
        snapshotScheduler.scheduleAtFixedRate(() -> {
            SimulationState currentState = buildCurrentState();
            snapshotService.saveSnapshot(currentState);
        }, 500, 500, TimeUnit.MILLISECONDS);
    }

    public void pauseSimulation() {
        if (!isRunning) {
            return;
        }

        isRunning = false;
        threadManager.stopAll();

        if (productGenerator != null) {
            productGenerator.shutdown();
        }

        // ✅ إيقاف أخذ الـ screenshots
        if (snapshotScheduler != null) {
            snapshotScheduler.shutdown();
        }

        // ✅ حفظ عدد الـ snapshots لحد دلوقتي (للـ replay)
        replaySnapshotLimit = snapshotService.getSnapshotCount();

        System.out.println("[SimulationService] ⏸ Paused at screenshot: " + replaySnapshotLimit);
    }

    public void resumeSimulation() {
        if (isRunning) {
            return;
        }

        isRunning = true;
        System.out.println("[SimulationService] ▶ Resuming from screenshot: " + replaySnapshotLimit);

        // بدء threads
        Map<String, Machine> machines = machineService.getAllMachines();
        for (Machine machine : machines.values()) {
            threadManager.startMachine(machine);
        }

        // بدء توليد المنتجات
        productGenerator = Executors.newScheduledThreadPool(1);
        productGenerator.scheduleAtFixedRate(() -> {
            Map<String, Queue> queues = queueService.getAllQueues();
            for (Queue queue : queues.values()) {
                if (queue.getType().equals("start")) {
                    Product product = new Product();
                    queueService.addProductToQueue(queue.getId(), product);
                }
            }
        }, 0, 3000, TimeUnit.MILLISECONDS);

        // ✅ كمل أخذ screenshots
        snapshotScheduler = Executors.newScheduledThreadPool(1);
        snapshotScheduler.scheduleAtFixedRate(() -> {
            SimulationState currentState = buildCurrentState();
            snapshotService.saveSnapshot(currentState);
        }, 500, 500, TimeUnit.MILLISECONDS);
    }

    public void resetSimulation() {
        // إيقاف كل حاجة
        pauseSimulation();

        // مسح الـ graph
        Map<String, Queue> queues = queueService.getAllQueues();
        for (String queueId : new ArrayList<>(queues.keySet())) {
            queueService.deleteQueue(queueId);
        }

        Map<String, Machine> machines = machineService.getAllMachines();
        for (String machineId : new ArrayList<>(machines.keySet())) {
            machineService.deleteMachine(machineId);
        }

        connections.clear();
        threadManager.restart();

        // مسح الـ snapshots
        snapshotService.clearSnapshots();
        replaySnapshotLimit = 0;

        System.out.println("[SimulationService] ↻ Full reset completed");
    }

    // ==================== REPLAY ====================

    public List<SimulationStateDTO> getReplaySnapshots() {
        List<SimulationStateDTO> allSnapshots = snapshotService.getAllSnapshots().stream()
                .map(snapshot -> convertToSimulationStateDTO(snapshot.getState()))
                .collect(Collectors.toList());

        // ✅ إرجاع الـ snapshots من البداية لحد آخر pause فقط
        if (replaySnapshotLimit > 0 && replaySnapshotLimit < allSnapshots.size()) {
            List<SimulationStateDTO> replaySnapshots = allSnapshots.subList(0, replaySnapshotLimit);
            System.out.println("[SimulationService] 🔄 Replay: Returning " + replaySnapshots.size() +
                    " snapshots (from start to pause)");
            return replaySnapshots;
        }

        System.out.println("[SimulationService] 🔄 Replay: Returning all " + allSnapshots.size() + " snapshots");
        return allSnapshots;
    }

    public SimulationStateDTO getCurrentState() {
        SimulationState state = buildCurrentState();
        return convertToSimulationStateDTO(state);
    }

    private SimulationState buildCurrentState() {
        SimulationState state = new SimulationState();

        Map<String, Queue> queues = queueService.getAllQueues();
        state.getQueues().putAll(queues);

        Map<String, Machine> machines = machineService.getAllMachines();
        state.getMachines().putAll(machines);

        state.getConnections().addAll(connections);
        state.setRunning(isRunning);

        return state;
    }







    public SimulationService() {
        this.threadManager = new ThreadManager();
    }


    // ==================== QUEUE OPERATIONS ====================

    public QueueDTO addQueue(String type, double x, double y) {
        Queue queue = queueService.createQueue(type, x, y);
        return convertToQueueDTO(queue);
    }

    public void deleteQueue(String queueId) {
        connections.removeIf(c ->
                c.getSourceId().equals(queueId) || c.getTargetId().equals(queueId)
        );
        queueService.deleteQueue(queueId);
    }

    public void updateQueuePosition(String queueId, double x, double y) {
        queueService.updateQueuePosition(queueId, x, y);
    }

    // ==================== MACHINE OPERATIONS ====================

    public MachineDTO addMachine(int serviceTime, double x, double y) {
        Machine machine = machineService.createMachine(serviceTime, x, y);
        return convertToMachineDTO(machine);
    }

    public void deleteMachine(String machineId) {
        threadManager.stopMachine(machineId);
        connections.removeIf(c ->
                c.getSourceId().equals(machineId) || c.getTargetId().equals(machineId)
        );
        machineService.deleteMachine(machineId);
    }

    public void updateMachinePosition(String machineId, double x, double y) {
        machineService.updateMachinePosition(machineId, x, y);
    }

    // ==================== CONNECTION OPERATIONS ====================

    public ConnectionDTO addConnection(String sourceId, String targetId) {
        Queue sourceQueue = queueService.getQueue(sourceId);
        Machine sourceMachine = machineService.getMachine(sourceId);

        Queue targetQueue = queueService.getQueue(targetId);
        Machine targetMachine = machineService.getMachine(targetId);

        String sourceType = sourceQueue != null ? "queue" : "machine";
        String targetType = targetQueue != null ? "queue" : "machine";

        Connection connection = new Connection(sourceId, targetId, sourceType, targetType);

        if (sourceType.equals("queue") && targetType.equals("machine")) {
            machineService.addInputQueue(targetId, sourceQueue);
        }
        else if (sourceType.equals("machine") && targetType.equals("queue")) {
            machineService.setOutputQueue(sourceId, targetQueue);
        }

        connections.add(connection);
        return convertToConnectionDTO(connection);
    }

    public void deleteConnection(String connectionId) {
        connections.removeIf(c -> c.getId().equals(connectionId));
    }

    // ==================== SIMULATION CONTROL ====================

//    public void startSimulation() {
//        if (isRunning) {
//            return;
//        }
//
//        isRunning = true;
//
//        // ✅ مسح الـ snapshots القديمة عند بداية simulation جديدة
//        snapshotService.clearSnapshots();
//        System.out.println("[SimulationService] Starting simulation - Snapshots cleared");
//
//        // بدء threads الخاصة بالـ machines
//        Map<String, Machine> machines = machineService.getAllMachines();
//        for (Machine machine : machines.values()) {
//            threadManager.startMachine(machine);
//        }
//
//        // بدء توليد المنتجات
//        productGenerator = Executors.newScheduledThreadPool(1);
//        productGenerator.scheduleAtFixedRate(() -> {
//            Map<String, Queue> queues = queueService.getAllQueues();
//            for (Queue queue : queues.values()) {
//                if (queue.getType().equals("start")) {
//                    Product product = new Product();
//                    queueService.addProductToQueue(queue.getId(), product);
//                }
//            }
//        }, 0, 3000, TimeUnit.MILLISECONDS);
//
//        // ✅ بدء أخذ screenshots تلقائياً كل 500ms
//        snapshotScheduler = Executors.newScheduledThreadPool(1);
//        snapshotScheduler.scheduleAtFixedRate(() -> {
//            SimulationState currentState = buildCurrentState();
//            snapshotService.saveSnapshot(currentState);
//            System.out.println("[SimulationService] 📸 Automatic screenshot taken - Total: " +
//                    snapshotService.getSnapshotCount());
//        }, 500, 500, TimeUnit.MILLISECONDS);
//    }

//    public void pauseSimulation() {
//        isRunning = false;
//        threadManager.stopAll();
//
//        if (productGenerator != null) {
//            productGenerator.shutdown();
//        }
//
//        // ✅ إيقاف أخذ الـ screenshots
//        if (snapshotScheduler != null) {
//            snapshotScheduler.shutdown();
//        }
//
//        System.out.println("[SimulationService] ⏸ Paused - Total screenshots: " +
//                snapshotService.getSnapshotCount());
//    }

//    public void resumeSimulation() {
//        // نفس الكود زي startSimulation بس بدون مسح الـ snapshots
//        if (isRunning) {
//            return;
//        }
//
//        isRunning = true;
//        System.out.println("[SimulationService] ▶ Resuming simulation");
//
//        // بدء threads
//        Map<String, Machine> machines = machineService.getAllMachines();
//        for (Machine machine : machines.values()) {
//            threadManager.startMachine(machine);
//        }
//
//        // بدء توليد المنتجات
//        productGenerator = Executors.newScheduledThreadPool(1);
//        productGenerator.scheduleAtFixedRate(() -> {
//            Map<String, Queue> queues = queueService.getAllQueues();
//            for (Queue queue : queues.values()) {
//                if (queue.getType().equals("start")) {
//                    Product product = new Product();
//                    queueService.addProductToQueue(queue.getId(), product);
//                }
//            }
//        }, 0, 3000, TimeUnit.MILLISECONDS);
//
//        // ✅ كمل أخذ screenshots
//        snapshotScheduler = Executors.newScheduledThreadPool(1);
//        snapshotScheduler.scheduleAtFixedRate(() -> {
//            SimulationState currentState = buildCurrentState();
//            snapshotService.saveSnapshot(currentState);
//        }, 500, 500, TimeUnit.MILLISECONDS);
//    }

//    public void resetSimulation() {
//        // إيقاف كل حاجة
//        pauseSimulation();
//
//        // ✅ مسح كل الـ graph
//        Map<String, Queue> queues = queueService.getAllQueues();
//        for (String queueId : new ArrayList<>(queues.keySet())) {
//            queueService.deleteQueue(queueId);
//        }
//
//        Map<String, Machine> machines = machineService.getAllMachines();
//        for (String machineId : new ArrayList<>(machines.keySet())) {
//            machineService.deleteMachine(machineId);
//        }
//
//        connections.clear();
//        threadManager.restart();
//
//        // ✅ مسح كل الـ snapshots
//        snapshotService.clearSnapshots();
//
//        System.out.println("[SimulationService] ↻ Full reset completed");
//    }

    // ==================== STATE OPERATIONS ====================

//    public SimulationStateDTO getCurrentState() {
//        SimulationState state = buildCurrentState();
//        return convertToSimulationStateDTO(state);
//    }

//    private SimulationState buildCurrentState() {
//        SimulationState state = new SimulationState();
//
//        Map<String, Queue> queues = queueService.getAllQueues();
//        state.getQueues().putAll(queues);
//
//        Map<String, Machine> machines = machineService.getAllMachines();
//        state.getMachines().putAll(machines);
//
//        state.getConnections().addAll(connections);
//        state.setRunning(isRunning);
//
//        return state;
//    }

    // ==================== REPLAY ====================

//    public List<SimulationStateDTO> getReplaySnapshots() {
//        System.out.println("[SimulationService] 🔄 Replay requested - " +
//                snapshotService.getSnapshotCount() + " snapshots available");
//        return snapshotService.getAllSnapshots().stream()
//                .map(snapshot -> convertToSimulationStateDTO(snapshot.getState()))
//                .collect(Collectors.toList());
//    }

    // ==================== DTO CONVERTERS ====================

    private QueueDTO convertToQueueDTO(Queue queue) {
        return new QueueDTO(
                queue.getId(),
                queue.getType(),
                queue.getProductCount(),
                queue.getX(),
                queue.getY()
        );
    }

    private MachineDTO convertToMachineDTO(Machine machine) {
        MachineDTO dto = new MachineDTO();
        dto.setId(machine.getId());
        dto.setServiceTime(machine.getServiceTime());
        dto.setProcessing(machine.isProcessing());
        dto.setFlashing(machine.isFlashing());
        dto.setCurrentColor(machine.getCurrentColor());
        dto.setX(machine.getX());
        dto.setY(machine.getY());

        if (machine.getCurrentProduct() != null) {
            Product p = machine.getCurrentProduct();
            dto.setCurrentProduct(new ProductDTO(p.getId(), p.getColor(), p.getCreatedAt()));
        }

        dto.setInputQueueIds(machine.getInputQueues().stream()
                .map(Queue::getId)
                .collect(Collectors.toList()));

        if (machine.getOutputQueue() != null) {
            dto.setOutputQueueId(machine.getOutputQueue().getId());
        }

        return dto;
    }

    private ConnectionDTO convertToConnectionDTO(Connection connection) {
        ConnectionDTO dto = new ConnectionDTO();
        dto.setId(connection.getId());
        dto.setSourceId(connection.getSourceId());
        dto.setTargetId(connection.getTargetId());
        dto.setSourceType(connection.getSourceType());
        dto.setTargetType(connection.getTargetType());
        return dto;
    }

    private SimulationStateDTO convertToSimulationStateDTO(SimulationState state) {
        SimulationStateDTO dto = new SimulationStateDTO();
        dto.setQueues(state.getQueues().values().stream()
                .map(this::convertToQueueDTO)
                .collect(Collectors.toList()));
        dto.setMachines(state.getMachines().values().stream()
                .map(this::convertToMachineDTO)
                .collect(Collectors.toList()));
        dto.setConnections(state.getConnections().stream()
                .map(this::convertToConnectionDTO)
                .collect(Collectors.toList()));
        dto.setRunning(state.isRunning());
        dto.setTimestamp(state.getTimestamp());
        return dto;
    }
}