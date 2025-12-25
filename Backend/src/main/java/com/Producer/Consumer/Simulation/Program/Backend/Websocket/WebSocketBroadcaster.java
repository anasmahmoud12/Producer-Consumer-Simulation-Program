package com.Producer.Consumer.Simulation.Program.Backend.Websocket;

import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationEvent;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationObserver;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;


@Component
public class WebSocketBroadcaster implements SimulationObserver {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void update(SimulationEvent event) {
        // Broadcast event to all connected clients
        messagingTemplate.convertAndSend("/topic/simulation-events", event);
    }

    public void broadcastStateUpdate(Object state) {
        messagingTemplate.convertAndSend("/topic/state-update", state);
    }

    public void broadcastStatistics(Object statistics) {
        messagingTemplate.convertAndSend("/topic/statistics", statistics);
    }
}