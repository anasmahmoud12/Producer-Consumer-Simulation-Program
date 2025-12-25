package com.Producer.Consumer.Simulation.Program.Backend.Websocket;


import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.databind.ObjectMapper;
//import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SimulationWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.put(session.getId(), session);
        System.out.println("✅ WebSocket connected: " + session.getId());

        // Send welcome message
        Map<String, Object> message = new HashMap<>();
        message.put("type", "CONNECTED");
        message.put("sessionId", session.getId());
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("📨 Received: " + payload);

        // Handle subscription requests
        Map<String, Object> data = objectMapper.readValue(payload, Map.class);
        if ("SUBSCRIBE".equals(data.get("type"))) {
            // Store subscriptions
            session.getAttributes().put("topics", data.get("topics"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session.getId());
        System.out.println("🔌 WebSocket disconnected: " + session.getId());
    }

    // Method to broadcast messages to all connected clients
    public void broadcast(String topic, Object data) {
        Map<String, Object> message = new HashMap<>();
        message.put("topic", topic);
        message.put("data", data);

        sessions.values().forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                }
            } catch (Exception e) {
                System.err.println("Error broadcasting to session: " + e.getMessage());
            }
        });
    }
}