package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Concurrency;

import java.util.Map;
import java.util.concurrent.*;

import com.Producer.Consumer.Simulation.Program.Backend.Models.Machine;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Product;
import com.Producer.Consumer.Simulation.Program.Backend.Models.ProductionQueue;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationEvent;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationEventPublisher;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationObserver;
import org.springframework.stereotype.Component;

import javax.annotation.PreDestroy;

@Component
public class MachineExecutor implements SimulationObserver {
    private final ExecutorService executorService;
    private final Map<String, Future<?>> runningMachines;
    private final SimulationEventPublisher eventPublisher;

    public MachineExecutor(SimulationEventPublisher eventPublisher) {
        this.executorService = Executors.newCachedThreadPool();
        this.runningMachines = new ConcurrentHashMap<>();
        this.eventPublisher = eventPublisher;
    }

    public void startMachine(Machine machine, ProductionQueue inputQueue,
                             ProductionQueue outputQueue) {
        // Don't start if already running
        if (runningMachines.containsKey(machine.getId())) {
            System.out.println("⚠️ Machine " + machine.getId() + " already running");
            return;
        }

        Future<?> future = executorService.submit(() ->
                processMachine(machine, inputQueue, outputQueue)
        );
        runningMachines.put(machine.getId(), future);
        System.out.println("✅ Machine " + machine.getId() + " started");
    }

    private void processMachine(Machine machine, ProductionQueue inputQueue,
                                ProductionQueue outputQueue) {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                // Get product from input queue
                Product product = inputQueue.removeProduct();

                if (product == null) {
                    // Register as waiting (Observer Pattern)
                    synchronized (inputQueue.getWaitingMachines()) {
                        if (!inputQueue.getWaitingMachines().contains(machine.getId())) {
                            inputQueue.getWaitingMachines().add(machine.getId());
                        }
                    }

                    machine.setStatus("idle");
                    machine.setColor("#94a3b8");
                    eventPublisher.notifyObservers(
                            new SimulationEvent("MACHINE_IDLE", machine)
                    );

                    Thread.sleep(100);
                    continue;
                }

                // Remove from waiting list
                inputQueue.getWaitingMachines().remove(machine.getId());

                // Process product
                machine.setCurrentProduct(product);
                machine.setStatus("processing");
                machine.setColor(product.getColor());
                product.setStatus("processing");

                System.out.println("🔧 Machine " + machine.getId() + " processing " + product.getId());

                eventPublisher.notifyObservers(
                        new SimulationEvent("MACHINE_PROCESSING",
                                Map.of("machine", machine, "product", product))
                );

                // Random service time
                int serviceTime = ThreadLocalRandom.current()
                        .nextInt(machine.getMinServiceTime(), machine.getMaxServiceTime());

                // BONUS: Machine breakdown simulation
                if (Math.random() > machine.getReliability()) {
                    machine.setStatus("maintenance");
                    System.out.println("🔧 Machine " + machine.getId() + " broke down!");
                    eventPublisher.notifyObservers(
                            new SimulationEvent("MACHINE_BREAKDOWN", machine)
                    );
                    Thread.sleep(serviceTime * 2); // Longer repair time
                }

                long startTime = System.currentTimeMillis();
                Thread.sleep(serviceTime);
                long endTime = System.currentTimeMillis();

                // Flash effect
                machine.setStatus("flashing");
                eventPublisher.notifyObservers(
                        new SimulationEvent("MACHINE_FLASH", machine)
                );
                Thread.sleep(300);

                // Update statistics
                machine.setProcessedCount(machine.getProcessedCount() + 1);
                machine.setTotalProcessingTime(
                        machine.getTotalProcessingTime() + (endTime - startTime)
                );

                System.out.println("✅ Machine " + machine.getId() + " finished " + product.getId());

                // Move to output queue
                if (outputQueue != null) {
                    boolean added = outputQueue.addProduct(product);
                    if (added) {
                        product.setStatus("waiting");
                        System.out.println("📦 Product " + product.getId() + " moved to " + outputQueue.getId());

                        eventPublisher.notifyObservers(
                                new SimulationEvent("PRODUCT_MOVED",
                                        Map.of("machine", machine, "queue", outputQueue, "product", product))
                        );

                        // Notify waiting machines (Observer Pattern)
                        synchronized (outputQueue.getWaitingMachines()) {
                            for (String machineId : outputQueue.getWaitingMachines()) {
                                eventPublisher.notifyObservers(
                                        new SimulationEvent("QUEUE_READY",
                                                Map.of("queueId", outputQueue.getId(), "machineId", machineId))
                                );
                            }
                        }
                    } else {
                        System.out.println("⚠️ Output queue " + outputQueue.getId() + " is full!");
                        // Put product back in input queue
                        inputQueue.addProduct(product);
                    }
                } else {
                    product.setStatus("completed");
                    System.out.println("🎉 Product " + product.getId() + " completed!");
                }

                machine.setCurrentProduct(null);
                machine.setStatus("idle");
                machine.setColor("#94a3b8");

            } catch (InterruptedException e) {
                System.out.println("🛑 Machine " + machine.getId() + " interrupted");
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.println("❌ Error in machine " + machine.getId() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        System.out.println("🛑 Machine " + machine.getId() + " stopped");
    }

    public void stopMachine(String machineId) {
        Future<?> future = runningMachines.get(machineId);
        if (future != null) {
            future.cancel(true);
            runningMachines.remove(machineId);
            System.out.println("🛑 Stopped machine: " + machineId);
        }
    }

    public void stopAll() {
        System.out.println("🛑 Stopping all machines...");
        runningMachines.values().forEach(future -> future.cancel(true));
        runningMachines.clear();
    }

    // Cleanup when application shuts down
    @PreDestroy
    public void shutdown() {
        System.out.println("🛑 Shutting dow" +
                "n MachineExecutor...");
        stopAll();
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    @Override
    public void update(SimulationEvent event) {
        // Handle specific events if needed
    }
}