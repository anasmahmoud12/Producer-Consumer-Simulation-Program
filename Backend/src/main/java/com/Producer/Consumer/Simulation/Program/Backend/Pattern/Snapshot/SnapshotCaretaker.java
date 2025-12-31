package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot;
import java.util.ArrayList;
import java.util.ArrayList;
import java.util.List;

public class SnapshotCaretaker {
    private List<Snapshot> snapshots = new ArrayList<>();

    public void addSnapshot(Snapshot snapshot) {
        snapshots.add(snapshot);
    }

    public List<Snapshot> getSnapshots() {
        return new ArrayList<>(snapshots);
    }

    public Snapshot getSnapshot(int index) {
        if (index >= 0 && index < snapshots.size()) {
            return snapshots.get(index);
        }
        return null;
    }

    public void clear() {
        snapshots.clear();
    }

    public int getSnapshotCount() {
        return snapshots.size();
    }
}
