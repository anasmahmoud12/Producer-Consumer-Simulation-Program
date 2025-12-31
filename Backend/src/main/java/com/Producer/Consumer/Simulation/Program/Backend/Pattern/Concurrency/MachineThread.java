package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Concurrency;

import com.Producer.Consumer.Simulation.Program.Backend.Models.Machine;

public class MachineThread implements Runnable {
    private Machine machine;
    private volatile boolean running = true;

    public MachineThread(Machine machine) {
        this.machine = machine;
    }

    @Override
    public void run() {
        while (running) {
            if (machine.isProcessing()) {
                try {
                    // Simulate processing time
                    Thread.sleep(machine.getServiceTime());
                    machine.finishProcessing();

                    // Flash effect duration
                    Thread.sleep(1000);
                    machine.resetFlash();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            } else {
                // Check for new products
                machine.tryProcessNext();
                try {
                    Thread.sleep(1000); // Small delay to prevent busy-waiting
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    public void stop() {
        running = false;
    }
}