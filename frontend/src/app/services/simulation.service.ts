import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';

export interface Product {
  id: string;
  color: string;
  priority: number;
  createdAt: number;
  enteredQueueAt: number;
  status: string;
  productType: string;
}

export interface Machine {
  id: string;
  x: number;
  y: number;
  minServiceTime: number;
  maxServiceTime: number;
  status: string;
  currentProduct: Product | null;
  color: string;
  processedCount: number;
  totalProcessingTime: number;
  reliability: number;
}

export interface ProductionQueue {
  id: string;
  x: number;
  y: number;
  capacity: number;
  products: Product[];
  waitingMachines: string[];
}

export interface Connection {
  from: string;
  to: string;
}

export interface SimulationStatistics {
  totalProductsProcessed: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  machineUtilization: { [key: string]: number };
  machineProcessedCount: { [key: string]: number };
  throughput: number;
  totalProductsInSystem: number;
  simulationStartTime: number;
}

export interface SimulationState {
  machines: Machine[];
  queues: ProductionQueue[];
  products: Product[];
  connections: Connection[];
  statistics: SimulationStatistics;
  isRunning: boolean;
}

export interface SimulationEvent {
  type: string;
  data: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private apiUrl = 'http://localhost:8080/api/simulation';
  private wsUrl = 'ws://localhost:8080/ws-simulation';
  
  private ws: WebSocket | null = null;
  private connected = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  // ✅ ADD THIS: Connection status observable
  private connectionStatusSubject = new BehaviorSubject<string>('Disconnected');
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  
  // Observables for real-time updates
  public simulationEvents$ = new Subject<SimulationEvent>();
  public stateUpdate$ = new Subject<any>();
  public statisticsUpdate$ = new Subject<SimulationStatistics>();
  
  constructor(private http: HttpClient) {
    this.connectWebSocket();
  }
  
  // ===== WebSocket Connection =====
  
  private connectWebSocket(): void {
    try {
      this.connectionStatusSubject.next('Connecting...'); // ✅ UPDATE STATUS
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.connected.next(true);
        this.connectionStatusSubject.next('Connected'); // ✅ UPDATE STATUS
        this.reconnectAttempts = 0;
        
        // Subscribe to topics
        this.sendMessage({
          type: 'SUBSCRIBE',
          topics: ['/topic/simulation-events', '/topic/state-update', '/topic/statistics']
        });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.log("here")
        this.connected.next(false);
        this.connectionStatusSubject.next('Error'); // ✅ UPDATE STATUS
      };
      
      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.connected.next(false);
        this.connectionStatusSubject.next('Disconnected'); // ✅ UPDATE STATUS
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.connectionStatusSubject.next(`Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`); // ✅ UPDATE STATUS
          setTimeout(() => this.connectWebSocket(), 3000);
        } else {
          this.connectionStatusSubject.next('Connection Failed'); // ✅ UPDATE STATUS
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionStatusSubject.next('Connection Failed'); // ✅ UPDATE STATUS
    }
  }
  
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  private handleMessage(message: any): void {
    switch (message.topic) {
      case '/topic/simulation-events':
        this.simulationEvents$.next(message.data as SimulationEvent);
        break;
      case '/topic/state-update':
        this.stateUpdate$.next(message.data);
        break;
      case '/topic/statistics':
        this.statisticsUpdate$.next(message.data as SimulationStatistics);
        break;
    }
  }
  
  public isConnected(): Observable<boolean> {
    return this.connected.asObservable();
  }
  
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  

  
  startSimulation(productionRate: number = 2000): Observable<string> {
    return this.http.post<string>(
      `${this.apiUrl}/start?productionRate=${productionRate}`, 
      {}
    );
  }
  
  stopSimulation(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/stop`, {});
  }
  
  pauseSimulation(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/pause`, {});
  }
  
  resumeSimulation(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/resume`, {});
  }
  
  // ===== State Management =====
  
  getState(): Observable<SimulationState> {
    return this.http.get<SimulationState>(`${this.apiUrl}/state`);
  }
  
  getStatistics(): Observable<SimulationStatistics> {
    return this.http.get<SimulationStatistics>(`${this.apiUrl}/statistics`);
  }
  
  // ===== Configuration =====
  
  addMachine(machine: Partial<Machine>): Observable<Machine> {
    return this.http.post<Machine>(`${this.apiUrl}/machines`, machine);
  }
  
  removeMachine(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/machines/${id}`);
  }
  
  addQueue(queue: Partial<ProductionQueue>): Observable<ProductionQueue> {
    return this.http.post<ProductionQueue>(`${this.apiUrl}/queues`, queue);
  }
  
  removeQueue(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/queues/${id}`);
  }
  
  addConnection(from: string, to: string): Observable<Connection> {
    return this.http.post<Connection>(`${this.apiUrl}/connections`, { from, to });
  }
  
  removeConnection(from: string, to: string): Observable<string> {
    return this.http.delete<string>(
      `${this.apiUrl}/connections?from=${from}&to=${to}`
    );
  }
  
  // ===== Snapshot Management =====
  
  getSnapshots(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/snapshots`);
  }
  
  // restoreSnapshot(index: number): Observable<string> {
  //   return this.http.post<string>(`${this.apiUrl}/snapshots/restore/${index}`, {});
  // }
  
  // createSnapshot(): Observable<any> {
  //   return this.http.post<any>(`${this.apiUrl}/snapshots/create`, {});
  // }
  // clearSnapshots(): Observable<string> {
  //   return this.http.delete<string>(`${this.apiUrl}/snapshots/clear`);
  // }
  restoreSnapshot(index: number): Observable<string> {
  return this.http.post(
    `${this.apiUrl}/snapshots/restore/${index}`, 
    {},
    { responseType: 'text' }  // ✅ FIXED: Expect text response, not JSON
  );
}

createSnapshot(): Observable<string> {
  return this.http.post(
    `${this.apiUrl}/snapshots/create`, 
    {},
    { responseType: 'text' }  // ✅ FIXED: Expect text response, not JSON
  );
}

clearSnapshots(): Observable<string> {
  return this.http.delete(
    `${this.apiUrl}/snapshots/clear`,
    { responseType: 'text' }  // ✅ FIXED: Expect text response, not JSON
  );
}
  // ===== Import/Export =====
  
  exportConfiguration(): Observable<any> {
    return this.http.get(`${this.apiUrl}/config/export`);
  }
  
  importConfiguration(config: any): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/config/import`, config);
  }
  
  // ===== Analytics =====
  
  getBottlenecks(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/analytics/bottlenecks`);
  }
  
  getEfficiencyMetrics(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(
      `${this.apiUrl}/analytics/efficiency`
    );
  }
}