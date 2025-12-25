package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer;
import java.util.*;

public interface SimulationObserver {
    void update(SimulationEvent event);
}