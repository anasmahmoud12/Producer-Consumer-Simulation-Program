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
        Future<?> future = executorService.submit(() ->
                processMachine(machine, inputQueue, outputQueue)
        );
        runningMachines.put(machine.getId(), future);
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

                // Move to output queue
                if (outputQueue != null) {
                    outputQueue.addProduct(product);
                    product.setStatus("waiting");

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
                    product.setStatus("completed");
                }

                machine.setCurrentProduct(null);
                machine.setStatus("idle");
                machine.setColor("#94a3b8");

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    public void stopMachine(String machineId) {
        Future<?> future = runningMachines.get(machineId);
        if (future != null) {
            future.cancel(true);
            runningMachines.remove(machineId);
        }
    }

    public void stopAll() {
        runningMachines.values().forEach(future -> future.cancel(true));
        runningMachines.clear();
    }

    @Override
    public void update(SimulationEvent event) {
        // Handle specific events if needed
    }
}
