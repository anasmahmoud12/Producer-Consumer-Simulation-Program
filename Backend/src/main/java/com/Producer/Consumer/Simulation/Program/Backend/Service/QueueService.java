package com.Producer.Consumer.Simulation.Program.Backend.Service;

import com.Producer.Consumer.Simulation.Program.Backend.Models.Queue;
import com.Producer.Consumer.Simulation.Program.Backend.Models.Product;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


@Service
public class QueueService {
    private Map<String, Queue> queues = new ConcurrentHashMap<>();


    public Queue createQueue(String type, double x, double y) {
        Queue queue = new Queue(type);
        queue.setX(x);
        queue.setY(y);
        queues.put(queue.getId(), queue);
        System.out.println("[QueueService] Created " + type + " queue: " + queue.getId());
        return queue;
    }


    public Queue getQueue(String id) {
        return queues.get(id);
    }


    public Map<String, Queue> getAllQueues() {
        return new ConcurrentHashMap<>(queues);
    }


    public boolean deleteQueue(String id) {
        Queue removed = queues.remove(id);
        if (removed != null) {
            System.out.println("[QueueService] Deleted queue: " + id);
            return true;
        }
        return false;
    }


    public boolean updateQueuePosition(String id, double x, double y) {
        Queue queue = queues.get(id);
        if (queue != null) {
            queue.setX(x);
            queue.setY(y);
            return true;
        }
        return false;
    }


    public boolean addProductToQueue(String queueId, Product product) {
        Queue queue = queues.get(queueId);
        if (queue != null) {
            queue.enqueue(product);
            System.out.println("[QueueService] Added product to queue " + queueId);
            return true;
        }
        return false;
    }


    public int getProductCount(String queueId) {
        Queue queue = queues.get(queueId);
        return queue != null ? queue.size() : -1;
    }


    public boolean isQueueEmpty(String queueId) {
        Queue queue = queues.get(queueId);
        return queue == null || queue.isEmpty();
    }


    public int clearQueue(String queueId) {
        Queue queue = queues.get(queueId);
        if (queue != null) {
            int count = 0;
            while (!queue.isEmpty()) {
                queue.dequeue();
                count++;
            }
            System.out.println("[QueueService] Cleared " + count + " products from queue " + queueId);
            return count;
        }
        return 0;
    }


    public void clearAll() {
        queues.clear();
        System.out.println("[QueueService] Cleared all queues");
    }


    public int getQueueCount() {
        return queues.size();
    }
}