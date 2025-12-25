package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
@Component
public class SimulationEventPublisher {
    private final List<SimulationObserver> observers = new ArrayList<>();

    public synchronized void subscribe(SimulationObserver observer) {
        observers.add(observer);
    }

    public synchronized void unsubscribe(SimulationObserver observer) {
        observers.remove(observer);
    }

    public synchronized void notifyObservers(SimulationEvent event) {
        for (SimulationObserver observer : observers) {
            observer.update(event);
        }
    }
}