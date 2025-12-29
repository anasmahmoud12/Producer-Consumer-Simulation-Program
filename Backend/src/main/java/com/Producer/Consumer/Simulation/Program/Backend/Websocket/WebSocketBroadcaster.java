package com.Producer.Consumer.Simulation.Program.Backend.Websocket;

import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationEvent;
import com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer.SimulationObserver;
import org.springframework.stereotype.Component;

@Component
public class WebSocketBroadcaster implements SimulationObserver {

    private final SimulationWebSocketHandler webSocketHandler;

    // اعتمدنا على SimulationWebSocketHandler بدل SimpMessagingTemplate
    public WebSocketBroadcaster(SimulationWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @Override
    public void update(SimulationEvent event) {
        // ارسال الحدث لكل العملاء المتصلين
        System.out.println("👂 " + getClass().getSimpleName()
                + " received event: " + event.getType());
        webSocketHandler.broadcast("simulation-events", event);
    }

    public void broadcastStateUpdate(Object state) {
        webSocketHandler.broadcast("state-update", state);
    }

    public void broadcastStatistics(Object statistics) {
        webSocketHandler.broadcast("statistics", statistics);
    }
}
