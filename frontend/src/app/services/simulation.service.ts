import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';

// ============================================================================
// UPDATED FRONTEND MODELS - WITH START/END
// ============================================================================

// FILE: src/app/models/simulation.models.ts

export interface SimulationNode {
  id: string;
  x: number;
  y: number;
  type: 'start' | 'end' | 'machine' | 'queue';
}

export interface StartNode extends SimulationNode {
  type: 'start';
  totalProductsToGenerate: number;
  generatedCount: number;
}

export interface EndNode extends SimulationNode {
  type: 'end';
  completedProducts: Product[];
}

export interface Product {
  id: string;
  color: string;
  priority: number;
  createdAt: number;
  enteredQueueAt: number;
  status: string;
  productType: string;
}

export interface Machine extends SimulationNode {
  type: 'machine';
  minServiceTime: number;
  maxServiceTime: number;
  status: string;
  currentProduct: Product | null;
  color: string;
  processedCount: number;
  totalProcessingTime: number;
  reliability: number;
  inputQueueIds: string[];      // ✅ Can have multiple inputs
  outputQueueId: string | null; // ✅ Only one output
}

export interface ProductionQueue extends SimulationNode {
  type: 'queue';
  capacity: number;
  products: Product[];
  waitingMachines: string[];
  inputMachineId: string | null;  // ✅ Only one input
  outputMachineIds: string[];     // ✅ Can have multiple outputs
}

export interface Connection {
  from: string;
  to: string;
  fromType?: string;
  toType?: string;
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
  startNode: StartNode;         // ✅ NEW
  endNode: EndNode;             // ✅ NEW
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

export interface ProductInfo {
  total: number;
  generated: number;
  completed: number;
}

export interface ConnectionRules {
  machine: {
    inputs: string;
    outputs: string;
    note: string;
  };
  queue: {
    inputs: string;
    outputs: string;
    note: string;
  };
  start: {
    inputs: string;
    outputs: string;
    note: string;
  };
  end: {
    inputs: string;
    outputs: string;
    note: string;
  };
  validPaths: string[];
}

// Helper type for any node
export type AnyNode = StartNode | EndNode | Machine | ProductionQueue;

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
  
  // Connection status observable
  private connectionStatusSubject = new BehaviorSubject<string>('Disconnected');
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  
  // Observables for real-time updates
  public simulationEvents$ = new Subject<SimulationEvent>();
  public stateUpdate$ = new Subject<any>();
  public statisticsUpdate$ = new Subject<SimulationStatistics>();
  
  constructor(private http: HttpClient) {
    this.connectWebSocket();
  }
  
  // ============================================================================
  // WEBSOCKET CONNECTION (KEPT FROM OLD SERVICE - NO CHANGES)
  // ============================================================================
  
  private connectWebSocket(): void {
    try {
      this.connectionStatusSubject.next('Connecting...');
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.connected.next(true);
        this.connectionStatusSubject.next('Connected');
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
        this.connectionStatusSubject.next('Error');
      };
      
      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.connected.next(false);
        this.connectionStatusSubject.next('Disconnected');
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.connectionStatusSubject.next(`Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connectWebSocket(), 3000);
        } else {
          this.connectionStatusSubject.next('Connection Failed');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionStatusSubject.next('Connection Failed');
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
  
  // ============================================================================
  // SIMULATION CONTROL
  // ============================================================================
  
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
  
  // ============================================================================
  // STATE & STATISTICS
  // ============================================================================
  
  getState(): Observable<SimulationState> {
    return this.http.get<SimulationState>(`${this.apiUrl}/state`);
  }
  
  getStatistics(): Observable<SimulationStatistics> {
    return this.http.get<SimulationStatistics>(`${this.apiUrl}/statistics`);
  }
  
  // ============================================================================
  // START/END NODE MANAGEMENT (✅ ADDED FROM NEW SERVICE)
  // ============================================================================
  
  setTotalProducts(total: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/start-node/products?total=${total}`, {});
  }
  
  getProductInfo(): Observable<ProductInfo> {
    return this.http.get<ProductInfo>(`${this.apiUrl}/start-node/products`);
  }
  
  getStartNode(): Observable<StartNode> {
    return this.http.get<StartNode>(`${this.apiUrl}/start-node`);
  }
  
  getEndNode(): Observable<EndNode> {
    return this.http.get<EndNode>(`${this.apiUrl}/end-node`);
  }
  
  // ============================================================================
  // POSITION UPDATE (✅ ADDED FROM NEW SERVICE - FOR DRAG & DROP)
  // ============================================================================
  
  updatePosition(id: string, x: number, y: number): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/position`, { id, x, y });
  }
  
  // ============================================================================
  // MACHINE & QUEUE MANAGEMENT
  // ============================================================================
  
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
  
  // ============================================================================
  // CONNECTION MANAGEMENT (✅ UPDATED FROM NEW SERVICE - WITH VALIDATION)
  // ============================================================================
  
  addConnection(from: string, to: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/connections`, { from, to });
  }
  
  removeConnection(from: string, to: string): Observable<string> {
    return this.http.delete<string>(
      `${this.apiUrl}/connections?from=${from}&to=${to}`
    );
  }
  
  // ✅ ADDED: Validate connection before creating
  validateConnection(from: string, to: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/connections/validate?from=${from}&to=${to}`);
  }
  
  // ✅ ADDED: Get connection rules
  getConnectionRules(): Observable<ConnectionRules> {
    return this.http.get<ConnectionRules>(`${this.apiUrl}/connection-rules`);
  }
  
  // ============================================================================
  // SNAPSHOT MANAGEMENT (KEPT FROM OLD SERVICE)
  // ============================================================================
  
  getSnapshots(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/snapshots`);
  }
  
  restoreSnapshot(index: number): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/snapshots/restore/${index}`, 
      {},
      { responseType: 'text' }
    );
  }
  
  createSnapshot(): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/snapshots/create`, 
      {},
      { responseType: 'text' }
    );
  }
  
  clearSnapshots(): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/snapshots/clear`,
      { responseType: 'text' }
    );
  }
  
  // ============================================================================
  // IMPORT/EXPORT CONFIGURATION
  // ============================================================================
  
  exportConfiguration(): Observable<any> {
    return this.http.get(`${this.apiUrl}/config/export`);
  }
  
  importConfiguration(config: any): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/config/import`, config);
  }
  
  // ============================================================================
  // ANALYTICS (KEPT FROM OLD SERVICE)
  // ============================================================================
  
  getBottlenecks(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/analytics/bottlenecks`);
  }
  
  getEfficiencyMetrics(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(
      `${this.apiUrl}/analytics/efficiency`
    );
  }
}