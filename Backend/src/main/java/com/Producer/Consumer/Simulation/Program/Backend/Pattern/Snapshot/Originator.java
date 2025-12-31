// ==================== ORIGINATOR.JAVA (Snapshot Pattern) ====================
// Originator.java
// Location: Backend/Pattern/Snapshot/Originator.java
package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot;

import com.Producer.Consumer.Simulation.Program.Backend.Models.SimulationState;

/**
 * Originator class for Memento/Snapshot pattern.
 * This is the object whose state we want to save and restore.
 * In our case, it wraps the SimulationState.
 */
public class Originator {
    private SimulationState state;

    /**
     * Set the current state
     * @param state The simulation state
     */
    public void setState(SimulationState state) {
        this.state = state;
        System.out.println("[Originator] State updated");
    }

    /**
     * Get the current state
     * @return Current simulation state
     */
    public SimulationState getState() {
        return state;
    }

    /**
     * Create a snapshot (memento) of the current state
     * @return Snapshot containing a copy of current state
     */
    public Snapshot createSnapshot() {
        System.out.println("[Originator] Creating snapshot of current state");
        return new Snapshot(state);
    }

    /**
     * Restore state from a snapshot (memento)
     * @param snapshot The snapshot to restore from
     */
    public void restoreFromSnapshot(Snapshot snapshot) {
        this.state = new SimulationState(snapshot.getState());
        System.out.println("[Originator] State restored from snapshot at " + snapshot.getTimestamp());
    }

    /**
     * Check if originator has a state
     * @return true if state is set
     */
    public boolean hasState() {
        return state != null;
    }
}