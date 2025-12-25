
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
  statistics: SimulationStatistics;
  isRunning: boolean;
}

export interface SimulationEvent {
  type: string;
  data: any;
  timestamp: number;
}