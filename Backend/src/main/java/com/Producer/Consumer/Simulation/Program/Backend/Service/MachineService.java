package com.Producer.Consumer.Simulation.Program.Backend.Service;

import com.Producer.Consumer.Simulation.Program.Backend.Models.Machine;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Queue;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing Machine operations.
 * Provides CRUD operations and machine-specific functionality.
 */
@Service
public class MachineService {
    private Map<String, Machine> machines = new ConcurrentHashMap<>();

    /**
     * Create a new machine
     * @param serviceTime Service time in milliseconds
     * @param x X position
     * @param y Y position
     * @return Created machine
     */
    public Machine createMachine(int serviceTime, double x, double y) {
        Machine machine = new Machine(serviceTime);
        machine.setX(x);
        machine.setY(y);
        machines.put(machine.getId(), machine);
        System.out.println("[MachineService] Created machine: " + machine.getId() + " with service time " + serviceTime + "ms");
        return machine;
    }


    public Machine getMachine(String id) {
        return machines.get(id);
    }


    public Map<String, Machine> getAllMachines() {
        return new ConcurrentHashMap<>(machines);
    }


    public boolean deleteMachine(String id) {
        Machine removed = machines.remove(id);
        if (removed != null) {
            // Detach from all input queues
            for (Queue queue : removed.getInputQueues()) {
                queue.detach(removed);
            }
            System.out.println("[MachineService] Deleted machine: " + id);
            return true;
        }
        return false;
    }


    public boolean updateMachinePosition(String id, double x, double y) {
        Machine machine = machines.get(id);
        if (machine != null) {
            machine.setX(x);
            machine.setY(y);
            return true;
        }
        return false;
    }


    public boolean addInputQueue(String machineId, Queue queue) {
        Machine machine = machines.get(machineId);
        if (machine != null) {
            machine.addInputQueue(queue);
            System.out.println("[MachineService] Connected machine " + machineId + " to input queue " + queue.getId());
            return true;
        }
        return false;
    }

    public boolean setOutputQueue(String machineId, Queue queue) {
        Machine machine = machines.get(machineId);
        if (machine != null) {
            machine.setOutputQueue(queue);
            System.out.println("[MachineService] Connected machine " + machineId + " to output queue " + queue.getId());
            return true;
        }
        return false;
    }


    public boolean removeInputQueue(String machineId, Queue queue) {
        Machine machine = machines.get(machineId);
        if (machine != null) {
            machine.removeInputQueue(queue);
            System.out.println("[MachineService] Disconnected machine " + machineId + " from input queue " + queue.getId());
            return true;
        }
        return false;
    }


    public boolean isProcessing(String machineId) {
        Machine machine = machines.get(machineId);
        return machine != null && machine.isProcessing();
    }


    public int getInputQueueCount(String machineId) {
        Machine machine = machines.get(machineId);
        return machine != null ? machine.getInputQueues().size() : 0;
    }


    public void clearAll() {
        // Detach all machines from their queues
        for (Machine machine : machines.values()) {
            for (Queue queue : machine.getInputQueues()) {
                queue.detach(machine);
            }
        }
        machines.clear();
        System.out.println("[MachineService] Cleared all machines");
    }

    public int getMachineCount() {
        return machines.size();
    }
}