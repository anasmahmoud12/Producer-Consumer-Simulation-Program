package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Concurrency;


import com.Producer.Consumer.Simulation.Program.Backend.Models.Machine;

import java.util.*;
import java.util.concurrent.*;

public class ThreadManager {
    private ExecutorService executorService;
    private Map<String, MachineThread> machineThreads;

    public ThreadManager() {
        this.executorService = Executors.newCachedThreadPool();
        this.machineThreads = new ConcurrentHashMap<>();
    }

    public void startMachine(Machine machine) {
        MachineThread thread = new MachineThread(machine);
        machineThreads.put(machine.getId(), thread);
        executorService.submit(thread);
    }

    public void stopMachine(String machineId) {
        MachineThread thread = machineThreads.get(machineId);
        if (thread != null) {
            thread.stop();
            machineThreads.remove(machineId);
        }
    }

    public void stopAll() {
        for (MachineThread thread : machineThreads.values()) {
            thread.stop();
        }
        machineThreads.clear();
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
        }
    }

    public void restart() {
        stopAll();
        executorService = Executors.newCachedThreadPool();
        machineThreads = new ConcurrentHashMap<>();
    }
}