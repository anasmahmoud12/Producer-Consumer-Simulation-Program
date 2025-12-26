package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Snapshot;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import com.Producer.Consumer.Simulation.Program.Backend.Models.Connection;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Machine;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Product;
import com.Producer.Consumer.Simulation.Program.Backend.Models.ProductionQueue;
import com.Producer.Consumer.Simulation.Program.Backend.Service.SimulationStatistics;
import lombok.Data;

@Data
public class SimulationSnapshot implements Serializable {
    private static final long serialVersionUID = 1L;

    private long timestamp;
    private List<Machine> machines;
    private List<ProductionQueue> queues;
    private List<Product> products;
    private List<Connection> connections;
    private SimulationStatistics statistics;

    public SimulationSnapshot(
            List<Machine> machines,
            List<ProductionQueue> queues,
            List<Product> products,
            List<Connection> connections,
            SimulationStatistics statistics
    ) {
        this.timestamp = System.currentTimeMillis();
        // Deep copy all objects
        this.machines = deepCopy(machines);
        this.queues = deepCopy(queues);
        this.products = deepCopy(products);
        this.connections = deepCopy(connections);
        this.statistics = deepCopy(statistics);
    }

    private <T> T deepCopy(T object) {
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ObjectOutputStream oos = new ObjectOutputStream(bos);
            oos.writeObject(object);
            oos.flush();
            oos.close();

            ByteArrayInputStream bis = new ByteArrayInputStream(bos.toByteArray());
            ObjectInputStream ois = new ObjectInputStream(bis);
            @SuppressWarnings("unchecked")
            T copy = (T) ois.readObject();
            ois.close();

            return copy;
        } catch (Exception e) {
            throw new RuntimeException("Deep copy failed for object: " +
                    (object != null ? object.getClass().getName() : "null"), e);
        }
    }
}