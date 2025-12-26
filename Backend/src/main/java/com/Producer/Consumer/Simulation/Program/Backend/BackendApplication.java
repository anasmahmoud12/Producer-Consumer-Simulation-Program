package com.Producer.Consumer.Simulation.Program.Backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
		System.out.println("\n Backend server started on http://localhost:8080");
		System.out.println("WebSocket endpoint: ws://localhost:8080/ws-simulation\n");
	}
}
