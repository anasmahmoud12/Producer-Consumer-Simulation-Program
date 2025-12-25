package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot;

import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedList;
import java.util.List;

public class SnapshotManager {
    private final Deque<SimulationSnapshot> snapshots = new LinkedList<>();
    private final int maxSnapshots = 50;

    public void saveSnapshot(SimulationSnapshot snapshot) {
        if (snapshots.size() >= maxSnapshots) {
            snapshots.removeFirst();
        }
        snapshots.addLast(snapshot);
    }

    public SimulationSnapshot getLatestSnapshot() {
        return snapshots.peekLast();
    }

    public SimulationSnapshot getSnapshot(int index) {
        if (index >= 0 && index < snapshots.size()) {
            return (SimulationSnapshot) snapshots.toArray()[index];
        }
        return null;
    }

    public List<SimulationSnapshot> getAllSnapshots() {
        return new ArrayList<>(snapshots);
    }

    public void clear() {
        snapshots.clear();
    }
}