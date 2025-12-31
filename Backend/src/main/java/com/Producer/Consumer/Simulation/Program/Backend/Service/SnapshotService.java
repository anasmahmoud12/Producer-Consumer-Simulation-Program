package com.Producer.Consumer.Simulation.Program.Backend.Service;

import com.Producer.Consumer.Simulation.Program.Backend.Models.SimulationState;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot.Snapshot;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot.SnapshotCaretaker;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot.Originator;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SnapshotService {
    private SnapshotCaretaker caretaker;
    private Originator originator;

    public SnapshotService() {
        this.caretaker = new SnapshotCaretaker();
        this.originator = new Originator();
        System.out.println("[SnapshotService] Initialized with Memento pattern");
    }


    public void saveSnapshot(SimulationState state) {
        originator.setState(state);
        Snapshot snapshot = originator.createSnapshot();
        caretaker.addSnapshot(snapshot);
        System.out.println(" Saved snapshot " + caretaker.getSnapshotCount() + " at " + snapshot.getTimestamp());
    }

    public List<Snapshot> getAllSnapshots() {
        return caretaker.getSnapshots();
    }


    public Snapshot getSnapshot(int index) {
        return caretaker.getSnapshot(index);
    }


    public SimulationState restoreSnapshot(int index) {
        Snapshot snapshot = caretaker.getSnapshot(index);
        if (snapshot != null) {
            originator.restoreFromSnapshot(snapshot);
            System.out.println("[SnapshotService] Restored snapshot #" + index);
            return originator.getState();
        }
        System.out.println("[SnapshotService] Snapshot #" + index + " not found");
        return null;
    }


    public int getSnapshotCount() {
        return caretaker.getSnapshotCount();
    }


    public void clearSnapshots() {
        caretaker.clear();
        System.out.println("[SnapshotService] Cleared all snapshots");
    }

    public boolean hasSnapshots() {
        return caretaker.getSnapshotCount() > 0;
    }


    public Snapshot getLatestSnapshot() {
        int count = caretaker.getSnapshotCount();
        if (count > 0) {
            return caretaker.getSnapshot(count - 1);
        }
        return null;
    }


    public Snapshot getSnapshotByTimestamp(long timestamp) {
        List<Snapshot> snapshots = caretaker.getSnapshots();
        Snapshot closest = null;
        long minDiff = Long.MAX_VALUE;

        for (Snapshot snapshot : snapshots) {
            long diff = Math.abs(snapshot.getTimestamp() - timestamp);
            if (diff < minDiff) {
                minDiff = diff;
                closest = snapshot;
            }
        }

        return closest;
    }


    public List<Snapshot> getSnapshotsInRange(long startTime, long endTime) {
        return caretaker.getSnapshots().stream()
                .filter(s -> s.getTimestamp() >= startTime && s.getTimestamp() <= endTime)
                .toList();
    }
}