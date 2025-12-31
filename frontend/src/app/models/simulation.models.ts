export interface Product {
  id: string;
  color: string;
  createdAt: number;
}

// queue.model.ts
export interface Queue {
  id: string;
  type: 'start' | 'normal' | 'end';
  productCount: number;
  x: number;
  y: number;
}

// machine.model.ts
export interface Machine {
  id: string;
  serviceTime: number;
  isProcessing: boolean;
  isFlashing: boolean;
  currentColor: string;
  currentProduct: Product | null;
  x: number;
  y: number;
  inputQueueIds: string[];
  outputQueueId: string | null;
}

// connection.model.ts
export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType: 'queue' | 'machine';
  targetType: 'queue' | 'machine';
}

// simulation-state.model.ts
export interface SimulationState {
  queues: Queue[];
  machines: Machine[];
  connections: Connection[];
  isRunning: boolean;
  timestamp: number;
}