// ✅ COPY THIS ENTIRE FILE - COMPLETE WORKING VERSION

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  SimulationService, Machine, ProductionQueue, Connection,
  SimulationStatistics, SimulationEvent, StartNode, EndNode, SimulationState
} from '../../services/simulation.service';
import { ReplayPanelComponent } from '../replay-panel.component';
import { Subscription } from 'rxjs';
import { StatisticsPanelComponent } from '../statistics-panel/statistics-panel.component';
import { SettingsPanelComponent } from '../settings-panel/settings-panel.component';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule, FormsModule, StatisticsPanelComponent, SettingsPanelComponent, ReplayPanelComponent],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  startNode: StartNode | null = null;
  endNode: EndNode | null = null;
  machines: Machine[] = [];
  queues: ProductionQueue[] = [];
  connections: Connection[] = [];
  statistics: SimulationStatistics | null = null;

  isRunning = false;
  isPaused = false;
  isAddingQueue = false;
  isAddingMachine = false;
  showStats = false;
  showSettings = false;
  connectionMode = false;
  connectionStart: string | null = null;
  connectionStatus = 'Checking...';
  showReplay = false;
  simulationSpeed = 1;
  productionRate = 2000;

  isDragging = false;
  draggedElement: any = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  // Track locally added items
  private localMachines = new Map<string, Machine>();
  private localQueues = new Map<string, ProductionQueue>();

  private subscriptions: Subscription[] = [];
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrame: number | null = null;

  constructor(private simulationService: SimulationService) { }

  ngOnInit(): void {
    console.log('🚀 Component initializing...');
    this.initializeCanvas();
    this.subscribeToUpdates();
    this.loadInitialState();
    this.startRenderLoop();

    this.subscriptions.push(
      this.simulationService.connectionStatus$.subscribe(status => {
        this.connectionStatus = status;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.simulationService.disconnect();
  }

  private initializeCanvas(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    if (this.ctx) {
      this.canvas.nativeElement.width = 1200;
      this.canvas.nativeElement.height = 600;
    }
  }

  private loadInitialState(): void {
    this.simulationService.getState().subscribe({
      next: (state: SimulationState) => {
        this.startNode = state.startNode || null;
        this.endNode = state.endNode || null;
        this.machines = state.machines || [];
        this.queues = state.queues || [];
        this.connections = state.connections || [];
        this.statistics = state.statistics || null;
        this.isRunning = state.isRunning || false;
        console.log('✅ State loaded:', { machines: this.machines.length, queues: this.queues.length });
      },
      error: () => this.loadDemoState()
    });
  }

  private loadDemoState(): void {
    this.startNode = { id: 'START', x: 50, y: 300, type: 'start', totalProductsToGenerate: 100, generatedCount: 0 };
    this.endNode = { id: 'END', x: 1150, y: 300, type: 'end', completedProducts: [] };
    this.queues = [
      { id: 'Q0', x: 200, y: 300, type: 'queue', capacity: 100, products: [], waitingMachines: [], inputMachineId: null, outputMachineIds: [] },
      { id: 'Q1', x: 600, y: 300, type: 'queue', capacity: 100, products: [], waitingMachines: [], inputMachineId: null, outputMachineIds: [] },
      { id: 'Q2', x: 1000, y: 300, type: 'queue', capacity: 100, products: [], waitingMachines: [], inputMachineId: null, outputMachineIds: [] }
    ];
    this.machines = [
      { id: 'M1', x: 400, y: 300, type: 'machine', minServiceTime: 2000, maxServiceTime: 4000, status: 'idle', currentProduct: null, color: '#94a3b8', processedCount: 0, totalProcessingTime: 0, reliability: 0.95, inputQueueIds: [], outputQueueId: null },
      { id: 'M2', x: 800, y: 300, type: 'machine', minServiceTime: 2000, maxServiceTime: 4000, status: 'idle', currentProduct: null, color: '#94a3b8', processedCount: 0, totalProcessingTime: 0, reliability: 0.95, inputQueueIds: [], outputQueueId: null }
    ];
    this.connections = [
      { from: 'START', to: 'Q0' }, { from: 'Q0', to: 'M1' }, { from: 'M1', to: 'Q1' },
      { from: 'Q1', to: 'M2' }, { from: 'M2', to: 'Q2' }, { from: 'Q2', to: 'END' }
    ];
  }

  private subscribeToUpdates(): void {
    this.subscriptions.push(
      this.simulationService.simulationEvents$.subscribe(event => this.handleSimulationEvent(event))
    );

    this.subscriptions.push(
      this.simulationService.stateUpdate$.subscribe(state => {
        if (state.startNode) this.startNode = state.startNode;
        if (state.endNode) this.endNode = state.endNode;
        if (state.machines && Array.isArray(state.machines)) this.smartMergeMachines(state.machines);
        if (state.queues && Array.isArray(state.queues)) this.smartMergeQueues(state.queues);
        if (state.connections) this.connections = state.connections;
      })
    );

    this.subscriptions.push(
      this.simulationService.statisticsUpdate$.subscribe(stats => this.statistics = stats)
    );
  }

  private smartMergeMachines(serverMachines: Machine[]): void {
    const merged = new Map<string, Machine>();
    this.localMachines.forEach((m, id) => merged.set(id, m));
    serverMachines.forEach(m => { if (!merged.has(m.id)) merged.set(m.id, m); });
    this.machines = Array.from(merged.values());
  }

  private smartMergeQueues(serverQueues: ProductionQueue[]): void {
    const merged = new Map<string, ProductionQueue>();
    this.localQueues.forEach((q, id) => merged.set(id, q));
    serverQueues.forEach(q => { if (!merged.has(q.id)) merged.set(q.id, q); });
    this.queues = Array.from(merged.values());
  }

  private handleSimulationEvent(event: SimulationEvent): void {
    switch (event.type) {
      case 'MACHINE_PROCESSING':
        const m = this.machines.find(m => m.id === event.data.machine.id);
        if (m) { m.status = 'processing'; m.color = event.data.product.color; m.currentProduct = event.data.product; }
        break;
      case 'MACHINE_FLASH':
        const fm = this.machines.find(m => m.id === event.data.id);
        if (fm) { fm.status = 'flashing'; setTimeout(() => { fm.status = 'idle'; fm.color = '#94a3b8'; }, 300); }
        break;
      case 'PRODUCT_MOVED':
        const q = this.queues.find(q => q.id === event.data.queueId);
        if (q) q.products.push(event.data.product);
        break;
      case 'PRODUCT_GENERATED':
        if (this.startNode) this.startNode.generatedCount++;
        break;
      case 'PRODUCT_COMPLETED':
        if (this.endNode && event.data.product) this.endNode.completedProducts.push(event.data.product);
        break;
    }
  }

  private startRenderLoop(): void {
    const render = () => {
      this.renderCanvas();
      this.animationFrame = requestAnimationFrame(render);
    };
    render();
  }

  private renderCanvas(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 1200, 600);

    // Draw connections with arrows
    this.connections.forEach(conn => {
      const allNodes = [...(this.startNode ? [this.startNode] : []), ...(this.endNode ? [this.endNode] : []), ...this.machines, ...this.queues];
      const from = allNodes.find(e => e.id === conn.from);
      const to = allNodes.find(e => e.id === conn.to);
      if (from && to) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const fromR = this.getNodeRadius(from);
        const toR = this.getNodeRadius(to);
        const startX = from.x + Math.cos(angle) * fromR;
        const startY = from.y + Math.sin(angle) * fromR;
        const endX = to.x - Math.cos(angle) * toR;
        const endY = to.y - Math.sin(angle) * toR;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.stroke();
        const headlen = 15;
        const arrowAngle = Math.atan2(endY - startY, endX - startX);
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(arrowAngle - Math.PI / 6), endY - headlen * Math.sin(arrowAngle - Math.PI / 6));
        ctx.lineTo(endX - headlen * Math.cos(arrowAngle + Math.PI / 6), endY - headlen * Math.sin(arrowAngle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = '#64748b';
        ctx.fill();
      }
    });

    // Draw START
    if (this.startNode) {
      ctx.fillStyle = '#10b981'; ctx.strokeStyle = '#059669'; ctx.lineWidth = 3;
      ctx.fillRect(this.startNode.x - 40, this.startNode.y - 30, 80, 60);
      ctx.strokeRect(this.startNode.x - 40, this.startNode.y - 30, 80, 60);
      ctx.fillStyle = 'white'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
      ctx.fillText('START', this.startNode.x, this.startNode.y - 5);
      ctx.font = '11px Arial';
      ctx.fillText(`${this.startNode.generatedCount}/${this.startNode.totalProductsToGenerate}`, this.startNode.x, this.startNode.y + 12);
    }

    // Draw END
    if (this.endNode) {
      ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3;
      ctx.fillRect(this.endNode.x - 40, this.endNode.y - 30, 80, 60);
      ctx.strokeRect(this.endNode.x - 40, this.endNode.y - 30, 80, 60);
      ctx.fillStyle = 'white'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
      ctx.fillText('END', this.endNode.x, this.endNode.y - 5);
      ctx.font = '11px Arial';
      ctx.fillText(`✓ ${this.endNode.completedProducts.length}`, this.endNode.x, this.endNode.y + 12);
    }

    // Draw queues
    this.queues.forEach(queue => {
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
      ctx.fillRect(queue.x - 30, queue.y - 30, 60, 60);
      ctx.strokeRect(queue.x - 30, queue.y - 30, 60, 60);
      ctx.fillStyle = 'white'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
      ctx.fillText(queue.id, queue.x, queue.y - 5);
      ctx.fillStyle = '#60a5fa'; ctx.font = 'bold 20px Arial';
      ctx.fillText(queue.products.length.toString(), queue.x, queue.y + 15);
    });

    // Draw machines
    this.machines.forEach(machine => {
      ctx.beginPath(); ctx.arc(machine.x, machine.y, 35, 0, Math.PI * 2);
      ctx.fillStyle = machine.color; ctx.fill();
      ctx.strokeStyle = machine.status === 'flashing' ? '#fbbf24' : '#334155'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = 'white'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
      ctx.fillText(machine.id, machine.x, machine.y);
      ctx.font = '10px Arial';
      ctx.fillText(machine.processedCount.toString(), machine.x, machine.y + 15);
    });
  }

  private getNodeRadius(node: any): number {
    if (node.type === 'machine') return 35;
    if (node.type === 'queue') return 42;
    if (node.type === 'start' || node.type === 'end') return 50;
    return 30;
  }

  getCursorStyle(): string {
    if (this.isAddingMachine || this.isAddingQueue) return 'crosshair';
    if (this.isDragging) return 'grabbing';
    if (this.connectionMode) return 'pointer';
    if (!this.isRunning) return 'grab';
    return 'default';
  }

  startSimulation(): void {
    this.simulationService.startSimulation(this.productionRate).subscribe({
      next: () => { this.isRunning = true; this.isPaused = false; },
      error: (e) => console.error('Error starting:', e)
    });
  }

  stopSimulation(): void {
    this.simulationService.stopSimulation().subscribe({
      next: () => { this.isRunning = false; this.isPaused = false; },
      error: (e) => console.error('Error stopping:', e)
    });
  }

  pauseSimulation(): void {
    if (this.isPaused) {
      this.simulationService.resumeSimulation().subscribe({
        next: () => this.isPaused = false,
        error: (e) => console.error('Error resuming:', e)
      });
    } else {
      this.simulationService.pauseSimulation().subscribe({
        next: () => this.isPaused = true,
        error: (e) => console.error('Error pausing:', e)
      });
    }
  }

  replaySimulation(): void { this.showReplay = true; }
  toggleReplay(): void { this.showReplay = !this.showReplay; }

  addMachine(event: MouseEvent): void {
    const xy = this.getXY(event);
    const machine = { x: xy.x, y: xy.y, minServiceTime: 2000, maxServiceTime: 4000, reliability: 0.95 };
    this.simulationService.addMachine(machine).subscribe({
      next: (m) => {
        console.log('✅ Machine added:', m.id);
        this.localMachines.set(m.id, m);
        this.machines.push(m);
        setTimeout(() => this.localMachines.delete(m.id), 5000);
      },
      error: (e) => console.error('Error adding machine:', e)
    });
    this.isAddingMachine = false;
  }

  addQueue(event: MouseEvent): void {
    const xy = this.getXY(event);
    const queue = { x: xy.x, y: xy.y, capacity: 100 };
    this.simulationService.addQueue(queue).subscribe({
      next: (q) => {
        console.log('✅ Queue added:', q.id);
        this.localQueues.set(q.id, q);
        this.queues.push(q);
        setTimeout(() => this.localQueues.delete(q.id), 5000);
      },
      error: (e) => console.error('Error adding queue:', e)
    });
    this.isAddingQueue = false;
  }

  onAddQueue() { this.isAddingQueue = true; this.isAddingMachine = false; this.connectionMode = false; }
  onAddMachine() { this.isAddingMachine = true; this.isAddingQueue = false; this.connectionMode = false; }

  getXY(event: MouseEvent) {
    const canvas = this.canvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (1200 / rect.width);
    const y = (event.clientY - rect.top) * (600 / rect.height);
    return { x, y };
  }

  onCanvasMouseDown(event: MouseEvent): void {
    if (this.isAddingMachine || this.isAddingQueue || this.connectionMode || this.isRunning) return;
    const xy = this.getXY(event);
    const element = this.findElementAt(xy.x, xy.y);
    if (element && element.type !== 'start' && element.type !== 'end') {
      this.draggedElement = element;
      this.dragOffsetX = xy.x - element.x;
      this.dragOffsetY = xy.y - element.y;
    }
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (!this.draggedElement) return;
    this.isDragging = true;
    const xy = this.getXY(event);
    this.draggedElement.x = xy.x - this.dragOffsetX;
    this.draggedElement.y = xy.y - this.dragOffsetY;
  }

  onCanvasMouseUp(event: MouseEvent): void {
    if (this.isDragging && this.draggedElement) {
      this.updateElementPosition(this.draggedElement);
    }
    this.isDragging = false;
    this.draggedElement = null;
  }

  private updateElementPosition(element: any): void {
    this.simulationService.updatePosition(element.id, element.x, element.y).subscribe({
      next: () => console.log(`Position updated: ${element.id}`),
      error: (e) => console.error('Error updating position:', e)
    });
  }

  onCanvasClick(event: MouseEvent): void {
    if (this.isDragging) return;
    if (this.isAddingMachine) { this.addMachine(event); return; }
    if (this.isAddingQueue) { this.addQueue(event); return; }
    const xy = this.getXY(event);
    if (this.connectionMode) {
      const clicked = this.findElementAt(xy.x, xy.y);
      if (clicked) {
        if (!this.connectionStart) {
          this.connectionStart = clicked.id;
        } else {
          this.simulationService.validateConnection(this.connectionStart, clicked.id).subscribe({
            next: (validation) => {
              if (validation.valid) {
                this.simulationService.addConnection(this.connectionStart!, clicked.id).subscribe({
                  next: (result) => {
                    if (result.success) {
                      this.connections.push({ from: this.connectionStart!, to: clicked.id });
                      this.connectionStart = null;
                      this.connectionMode = false;
                    } else alert(`Invalid: ${result.message}`);
                  },
                  error: () => alert('Error adding connection')
                });
              } else {
                alert(`Invalid: ${validation.message}`);
                this.connectionStart = null;
              }
            }
          });
        }
      }
    }
  }

  private findElementAt(x: number, y: number): any {
    if (this.startNode && Math.abs(this.startNode.x - x) < 40 && Math.abs(this.startNode.y - y) < 30) return this.startNode;
    if (this.endNode && Math.abs(this.endNode.x - x) < 40 && Math.abs(this.endNode.y - y) < 30) return this.endNode;
    const machine = this.machines.find(m => Math.abs(m.x - x) < 40 && Math.abs(m.y - y) < 40);
    if (machine) return machine;
    return this.queues.find(q => Math.abs(q.x - x) < 30 && Math.abs(q.y - y) < 30);
  }

  saveConfiguration(): void {
    this.simulationService.exportConfiguration().subscribe({
      next: (config) => {
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'simulation-config.json';
        a.click();
      }
    });
  }

  toggleConnectionMode(): void {
    this.connectionMode = !this.connectionMode;
    this.connectionStart = null;
    if (this.connectionMode) { this.isAddingMachine = false; this.isAddingQueue = false; }
  }

  toggleStats(): void { this.showStats = !this.showStats; }
  toggleSettings(): void { this.showSettings = !this.showSettings; }

  onSnapshotRestored(): void {
    this.simulationService.getState().subscribe({
      next: (state) => {
        this.startNode = state.startNode || null;
        this.endNode = state.endNode || null;
        this.machines = state.machines || [];
        this.queues = state.queues || [];
        this.connections = state.connections || [];
        this.statistics = state.statistics || null;
        this.isRunning = state.isRunning || false;
      }
    });
  }
}