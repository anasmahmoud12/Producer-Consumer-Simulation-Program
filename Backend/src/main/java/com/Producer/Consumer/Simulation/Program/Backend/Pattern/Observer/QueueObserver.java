package com.Producer.Consumer.Simulation.Program.Backend.Pattern.Observer;

import com.Producer.Consumer.Simulation.Program.Backend.Models.Queue;

public interface QueueObserver extends Observer {

    void onQueueChanged(Queue queue);


    void onProductAdded(Queue queue);

    void onProductRemoved(Queue queue);
}