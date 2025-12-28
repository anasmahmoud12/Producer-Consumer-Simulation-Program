package com.Producer.Consumer.Simulation.Program.Backend.Models;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Connection implements Serializable {
    private static final long serialVersionUID = 1L;

    private String from;
    private String to;
}
