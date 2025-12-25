package com.Producer.Consumer.Simulation.Program.Backend.exception;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
class ErrorResponse {
    private String error;
    private String message;
}
