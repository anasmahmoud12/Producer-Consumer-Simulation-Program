import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
declare var SockJS: any;
import { BehaviorSubject, Observable } from 'rxjs';
import { SimulationState } from '../models/simulation.models';
// import { SimulationState } from '../models';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client;
  private simulationStateSubject = new BehaviorSubject<SimulationState | null>(null);
  public simulationState$: Observable<SimulationState | null> = this.simulationStateSubject.asObservable();

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('WebSocket connected');
      this.client.subscribe('/topic/simulation', (message: IMessage) => {
        const state: SimulationState = JSON.parse(message.body);
        this.simulationStateSubject.next(state);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('WebSocket error:', frame);
    };
  }

  connect(): void {
    this.client.activate();
  }

  disconnect(): void {
    this.client.deactivate();
  }

  getSimulationState(): Observable<SimulationState | null> {
    return this.simulationState$;
  }
  
}