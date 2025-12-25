package com.Producer.Consumer.Simulation.Program.Backend.Config;

import com.Producer.Consumer.Simulation.Program.Backend.Websocket.SimulationWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;


@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final SimulationWebSocketHandler webSocketHandler;

    public WebSocketConfig(SimulationWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketHandler, "/ws-simulation")
                .setAllowedOrigins("http://localhost:4200", "http://localhost:80");
    }
}