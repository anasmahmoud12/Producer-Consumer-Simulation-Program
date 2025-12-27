import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulationService } from '../../services/simulation.service';
import {
  Machine,
  ProductionQueue,
  Connection,
  SimulationStatistics,
  SimulationEvent
} from '../../models/simulation.models';
import { Subscription } from 'rxjs';
// ⚠️ IMPORTANT: Import the separate components
import { StatisticsPanelComponent } from '../statistics-panel/statistics-panel.component';
import { SettingsPanelComponent } from '../settings-panel/settings-panel.component';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatisticsPanelComponent,  // ✅ Add this
    SettingsPanelComponent     // ✅ Add this
  ],
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  machines: Machine[] = [];
  queues: ProductionQueue[] = [];
  connections: Connection[] = [];
  statistics: SimulationStatistics | null = null;

  isRunning = false;
  isPaused = false;
  showStats = false;
  showSettings = false;
  connectionMode = false;
  connectionStart: string | null = null;
  connectionStatus = 'Checking...';

  simulationSpeed = 1;
  productionRate = 2000;

  private subscriptions: Subscription[] = [];
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrame: number | null = null;

  constructor(private simulationService: SimulationService) { }

  ngOnInit(): void {
    this.initializeCanvas();
    this.loadInitialState();
    this.subscribeToUpdates();
    this.startRenderLoop();

    this.subscriptions.push(
      this.simulationService.connectionStatus$.subscribe(status => {
        this.connectionStatus = status;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
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
      next: (state) => {
        this.machines = state.machines;
        console.log(state.machines)
        this.queues = state.queues;
        console.log(state.queues)
        this.connections = state.connections;
          console.log(state.connections)  ;
        this.statistics = state.statistics;
        this.isRunning = state.isRunning;
      },
      error: (error) => {
        console.error('Error loading initial state:', error);
        this.loadDemoState();
      }
    });
  }

  private loadDemoState(): void {
    this.queues = [
      { id: 'Q0', x: 100, y: 200, capacity: 100, products: [], waitingMachines: [] },
      { id: 'Q1', x: 500, y: 200, capacity: 100, products: [], waitingMachines: [] },
      { id: 'Q2', x: 900, y: 200, capacity: 100, products: [], waitingMachines: [] }
    ];

    this.machines = [
      {
        id: 'M1', x: 300, y: 200, minServiceTime: 1000, maxServiceTime: 2000,
        status: 'idle', currentProduct: null, color: '#94a3b8', processedCount: 0,
        totalProcessingTime: 0, reliability: 0.95
      },
      {
        id: 'M2', x: 700, y: 200, minServiceTime: 1500, maxServiceTime: 2500,
        status: 'idle', currentProduct: null, color: '#94a3b8', processedCount: 0,
        totalProcessingTime: 0, reliability: 0.92
      }
    ];

    this.connections = [
      { from: 'Q0', to: 'M1' },
      { from: 'M1', to: 'Q1' },
      { from: 'Q1', to: 'M2' },
      { from: 'M2', to: 'Q2' }
    ];
  }

  private subscribeToUpdates(): void {
    this.subscriptions.push(
      this.simulationService.simulationEvents$.subscribe(event => {
        console.log('Received event:', event);
        this.handleSimulationEvent(event);
      })
    );

    this.subscriptions.push(
      this.simulationService.stateUpdate$.subscribe(state => {
        if (state.machines) this.machines = state.machines;
        if (state.queues) this.queues = state.queues;
      })
    );

    this.subscriptions.push(
      this.simulationService.statisticsUpdate$.subscribe(stats => {
        this.statistics = stats;
      })
    );
  }

  private handleSimulationEvent(event: SimulationEvent): void {
          console.log('Handling event type:', event.type);

    switch (event.type) {
      case 'MACHINE_PROCESSING':
        const { machine, product } = event.data;
        const m = this.machines.find(m => m.id === machine.id);
        if (m) {
          m.status = 'processing';
          m.color = product.color;
          m.currentProduct = product;
        }
        break;

      case 'MACHINE_FLASH':
        const flashMachine = this.machines.find(m => m.id === event.data.id);
        if (flashMachine) {
          flashMachine.status = 'flashing';
          setTimeout(() => {
            flashMachine.status = 'idle';
            flashMachine.color = '#94a3b8';
          }, 300);
        }
        break;

      case 'PRODUCT_MOVED':
        const { queueId, product: movedProduct } = event.data;
        const queue = this.queues.find(q => q.id === queueId);
        if (queue) {
          queue.products.push(movedProduct);
        }
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
    const canvas = this.canvas.nativeElement;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    this.connections.forEach(conn => {
      const from = [...this.machines, ...this.queues].find(e => e.id === conn.from);
      const to = [...this.machines, ...this.queues].find(e => e.id === conn.to);

      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = '#ffffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const headlen = 10;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(
          to.x - headlen * Math.cos(angle - Math.PI / 6),
          to.y - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          to.x - headlen * Math.cos(angle + Math.PI / 6),
          to.y - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = '#475569';
        ctx.fill();
      }
    });

    // Draw queues
    this.queues.forEach(queue => {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(queue.x - 30, queue.y - 30, 60, 60, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(queue.id, queue.x, queue.y - 5);

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(queue.products.length.toString(), queue.x, queue.y + 15);
    });

    // Draw machines
    this.machines.forEach(machine => {
      ctx.beginPath();
      ctx.arc(machine.x, machine.y, 35, 0, Math.PI * 2);
      ctx.fillStyle = machine.color;
      ctx.fill();

      ctx.strokeStyle = machine.status === 'flashing' ? '#fbbf24' : '#334155';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(machine.id, machine.x, machine.y);

      ctx.font = '10px Arial';
      ctx.fillText(machine.processedCount.toString(), machine.x, machine.y + 15);
    });
  }

  startSimulation(): void {
    this.simulationService.startSimulation(this.productionRate).subscribe({
      next: () => {
        this.isRunning = true;
        this.isPaused = false;
      },
      error: (error) => console.error('Error starting simulation:', error)
    });
  }

  stopSimulation(): void {
    this.simulationService.stopSimulation().subscribe({
      next: () => {
        this.isRunning = false;
        this.isPaused = false;
      },
      error: (error) => console.error('Error stopping simulation:', error)
    });
  }

  pauseSimulation(): void {
    if (this.isPaused) {
      this.simulationService.resumeSimulation().subscribe({
        next: () => this.isPaused = false,
        error: (error) => console.error('Error resuming simulation:', error)
      });
    } else {
      this.simulationService.pauseSimulation().subscribe({
        next: () => this.isPaused = true,
        error: (error) => console.error('Error pausing simulation:', error)
      });
    }
  }

  replaySimulation(): void {
    alert('Replay functionality requires backend implementation');
  }

  addMachine(): void {
    const machine = {
      x: 300 + Math.random() * 400,
      y: 150 + Math.random() * 300,
      minServiceTime: 1000,
      maxServiceTime: 3000,
      reliability: 0.95
    };

    this.simulationService.addMachine(machine).subscribe({
      next: (m) => this.machines.push(m),
      error: (error) => console.error('Error adding machine:', error)
    });
  }

  addQueue(): void {
    const queue = {
      x: 200 + Math.random() * 600,
      y: 150 + Math.random() * 300,
      capacity: 100
    };

    this.simulationService.addQueue(queue).subscribe({
      next: (q) => this.queues.push(q),
      error: (error) => console.error('Error adding queue:', error)
    });
  }

  onCanvasClick(event: MouseEvent): void {
    const canvas = this.canvas.nativeElement;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;



    if (this.connectionMode) {
      const clicked = this.findElementAt(x, y);

      if (clicked) {
        console.log(clicked.id)
        if (!this.connectionStart) {
          this.connectionStart = clicked.id;
        } else {
          this.simulationService.addConnection(
            this.connectionStart,
            clicked.id
          ).subscribe({
            next: (conn) => {
              this.connections.push(conn);
              this.connectionStart = null;
              this.connectionMode = false;
            },
            error: (error) => console.error('Error adding connection:', error)
          });
        }
      }
    }
  }

  private findElementAt(x: number, y: number): any {
    const machine = this.machines.find(m =>
      Math.abs(m.x - x) < 40 && Math.abs(m.y - y) < 40
    );
    if (machine) return machine;

    const queue = this.queues.find(q =>
      Math.abs(q.x - x) < 30 && Math.abs(q.y - y) < 30
    );
    return queue;
  }

  saveConfiguration(): void {
    this.simulationService.exportConfiguration().subscribe({
      next: (config) => {
        const blob = new Blob([JSON.stringify(config, null, 2)],
          { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'simulation-config.json';
        a.click();
      },
      error: (error) => console.error('Error exporting configuration:', error)
    });
  }

  toggleConnectionMode(): void {
    this.connectionMode = !this.connectionMode;
    this.connectionStart = null;
  }

  toggleStats(): void {
    this.showStats = !this.showStats;
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }
}