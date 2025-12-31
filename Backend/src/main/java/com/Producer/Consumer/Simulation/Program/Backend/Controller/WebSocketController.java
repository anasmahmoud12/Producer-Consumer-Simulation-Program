package com.Producer.Consumer.Simulation.Program.Backend.Controller;

//import com.simulation.dto.SimulationStateDTO;
//import com.simulation.service.SimulationService;
import com.Producer.Consumer.Simulation.Program.Backend.Service.SimulationService;
import com.Producer.Consumer.Simulation.Program.Backend.dto.SimulationStateDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

@Controller
@EnableScheduling
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private SimulationService simulationService;

    // Send simulation state updates every 100ms
    @Scheduled(fixedRate = 20)
    public void sendSimulationUpdate() {
        SimulationStateDTO state = simulationService.getCurrentState();
        messagingTemplate.convertAndSend("/topic/simulation", state);
    }

    @MessageMapping("/simulation/subscribe")
    @SendTo("/topic/simulation")
    public SimulationStateDTO subscribeToSimulation() {
        return simulationService.getCurrentState();
    }
}