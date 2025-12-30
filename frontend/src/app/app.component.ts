import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SimulationService } from './services/simulation.service';
// import { WebSocketService } from './services/websocket.service';
// import { Queue, Machine, Connection, SimulationState } from './models';
import { Subscription } from 'rxjs';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { SimulationState, Queue, Machine, Connection } from './models/simulation.models';
import { WebSocketService } from './services/ websocket.service';
// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { HttpClientModule } from '@angular/common/http';
// import { SimulationService } from './services/simulation.service';
// import { WebSocketService } from './services/websocket.service';
// import { Queue, Machine, Connection, SimulationState } from './models';
// import { Subscription } from 'rxjs';
// import { ToolbarComponent } from './components/toolbar/toolbar.component';
// import { CanvasComponent } from './components/canvas/canvas.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule,
    ToolbarComponent,
    CanvasComponent
  ],
  template: `
    <div class="app-container">
      <app-toolbar
        [isRunning]="state?.isRunning || false"
        [isConnecting]="isConnecting"
        [isReplaying]="isReplaying"
        (addStartQueue)="addStartQueue()"
        (addNormalQueue)="addNormalQueue()"
        (addEndQueue)="addEndQueue()"
        (addMachine)="addMachine()"
        (startConnecting)="startConnecting()"
        (cancelConnecting)="cancelConnecting()"
        (start)="startSimulation()"
        (pause)="pauseSimulation()"
        (reset)="resetSimulation()"
        (replay)="replaySimulation()">
      </app-toolbar>

      <app-canvas
        [queues]="queues"
        [machines]="machines"
        [connections]="connections"
        [isRunning]="state?.isRunning || false"
        [isConnecting]="isConnecting"
        [connectingFromId]="connectingFromId"
        [selectedNodeId]="selectedNodeId"
        [tempLineEnd]="tempLineEnd"
        (nodeMouseDown)="startDrag($event)"
        (nodeClick)="onNodeClick($event)"
        (canvasClick)="onCanvasClick($event)"
        (canvasRightClick)="onCanvasRightClick($event)"
        (mouseMove)="onMouseMove($event)">
      </app-canvas>

      <!-- Replay Progress -->
      <div class="replay-overlay" *ngIf="isReplaying">
        <div class="replay-card">
          <h3>🔄 Replaying Snapshots</h3>
          <div class="replay-bar">
            <div class="replay-fill" [style.width.%]="replayProgress"></div>
          </div>
          <div class="replay-text">
            Snapshot {{ replayCurrentIndex + 1 }} of {{ replayTotalSnapshots }}
          </div>
          <button (click)="stopReplay()" class="btn-stop-replay">Stop Replay</button>
        </div>
      </div>

      <!-- Debug Info -->
      <div class="debug-info">
        <div>Queues: {{ queues.length }}</div>
        <div>Machines: {{ machines.length }}</div>
        <div>Connections: {{ connections.length }}</div>
        <div>Running: {{ state?.isRunning ? 'Yes' : 'No' }}</div>
        <div>Replaying: {{ isReplaying ? 'Yes' : 'No' }}</div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }

    .app-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
    }

    .replay-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .replay-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      min-width: 400px;
      text-align: center;
    }

    .replay-card h3 {
      margin: 0 0 1.5rem 0;
      color: #1e293b;
      font-size: 1.5rem;
    }

    .replay-bar {
      width: 100%;
      height: 12px;
      background: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .replay-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      transition: width 0.3s;
      border-radius: 6px;
    }

    .replay-text {
      font-size: 16px;
      color: #475569;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }

    .btn-stop-replay {
      padding: 0.75rem 2rem;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-stop-replay:hover {
      background: #dc2626;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .debug-info {
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 1000;
    }

    .debug-info div {
      margin: 2px 0;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  state: SimulationState | null = null;
  queues: Queue[] = [];
  machines: Machine[] = [];
  connections: Connection[] = [];
  
  selectedNodeId: string | null = null;
  isConnecting = false;
  isReplaying = false;
  replayProgress = 0;
  replayCurrentIndex = 0;
  replayTotalSnapshots = 0;
  connectingFromId: string | null = null;
  connectingFromType: 'queue' | 'machine' | null = null;
  tempLineEnd: {x: number, y: number} | null = null;
  
  draggingNodeId: string | null = null;
  draggingNodeType: 'queue' | 'machine' | null = null;
  dragOffset = { x: 0, y: 0 };
  
  private subscription?: Subscription;
  private replayInterval?: any;

  constructor(
    private simulationService: SimulationService,
    private wsService: WebSocketService
  ) {}

  ngOnInit() {
    this.wsService.connect();
    
    this.subscription = this.wsService.getSimulationState().subscribe(state => {
      if (state && !this.isReplaying) {
        this.state = state;
        this.queues = state.queues;
        this.machines = state.machines;
        this.connections = state.connections;
      }
    });

    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.wsService.disconnect();
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    if (this.replayInterval) {
      clearInterval(this.replayInterval);
    }
  }

  // ==================== ADD NODES ====================
  
  addStartQueue() {
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;
    this.simulationService.addQueue('start', x, y).subscribe();
  }

  addNormalQueue() {
    const x = 300 + Math.random() * 200;
    const y = 200 + Math.random() * 200;
    this.simulationService.addQueue('normal', x, y).subscribe();
  }

  addEndQueue() {
    const x = 700 + Math.random() * 200;
    const y = 200 + Math.random() * 200;
    this.simulationService.addQueue('end', x, y).subscribe();
  }

  addMachine() {
    const x = 400 + Math.random() * 200;
    const y = 200 + Math.random() * 200;
    const serviceTime = 2000 + Math.random() * 3000;
    this.simulationService.addMachine(Math.floor(serviceTime), x, y).subscribe();
  }

  // ==================== CONNECTION MODE ====================
  
  startConnecting() {
    this.isConnecting = true;
    this.connectingFromId = null;
    this.connectingFromType = null;
  }

  cancelConnecting() {
    this.isConnecting = false;
    this.connectingFromId = null;
    this.connectingFromType = null;
    this.tempLineEnd = null;
  }

  // ==================== SIMULATION CONTROL ====================
  
  startSimulation() {
    console.log('▶ Starting simulation');
    this.simulationService.startSimulation().subscribe();
  }

  pauseSimulation() {
    console.log('⏸ Pausing simulation - Taking snapshot');
    // ✅ Backend هياخد snapshot تلقائياً عند الـ pause
    this.simulationService.pauseSimulation().subscribe(() => {
      console.log('📸 Snapshot saved!');
    });
  }

  resetSimulation() {
    console.log('↻ Resetting - Clearing everything');
    
    if (confirm('Are you sure? This will delete everything and return to empty canvas.')) {
      // ✅ مسح كل حاجة: graph + snapshots
      this.simulationService.resetSimulation().subscribe(() => {
        console.log('✅ Reset complete - Back to empty canvas');
        this.queues = [];
        this.machines = [];
        this.connections = [];
        this.selectedNodeId = null;
      });
    }
  }

  replaySimulation() {
    console.log('🔄 Starting replay of pause snapshots');
    
    this.simulationService.getReplaySnapshots().subscribe(snapshots => {
      if (snapshots.length === 0) {
        alert('No snapshots available! Press Pause during simulation to save snapshots.');
        return;
      }

      console.log(`Found ${snapshots.length} pause snapshots`);
      
      this.isReplaying = true;
      this.replayTotalSnapshots = snapshots.length;
      this.replayCurrentIndex = 0;

      // Pause current simulation
      this.simulationService.pauseSimulation().subscribe();

      // Replay each snapshot
      this.replayInterval = setInterval(() => {
        if (this.replayCurrentIndex >= snapshots.length) {
          this.stopReplay();
          return;
        }

        const snapshot = snapshots[this.replayCurrentIndex];
        this.queues = snapshot.queues;
        this.machines = snapshot.machines;
        this.connections = snapshot.connections;

        this.replayProgress = ((this.replayCurrentIndex + 1) / snapshots.length) * 100;
        console.log(`📸 Showing snapshot ${this.replayCurrentIndex + 1}/${snapshots.length}`);
        
        this.replayCurrentIndex++;
      }, 1000); // عرض كل snapshot لمدة 1 ثانية
    });
  }

  stopReplay() {
    console.log('⏹ Stopping replay');
    if (this.replayInterval) {
      clearInterval(this.replayInterval);
    }
    this.isReplaying = false;
    this.replayProgress = 0;
    this.replayCurrentIndex = 0;
  }

  // ==================== NODE INTERACTION ====================
  
  onNodeClick(data: {event: MouseEvent, id: string, type: 'queue' | 'machine'}) {
    data.event.stopPropagation();
    
    if (this.isConnecting) {
      if (!this.connectingFromId) {
        this.connectingFromId = data.id;
        this.connectingFromType = data.type;
      } else if (this.connectingFromId !== data.id) {
        this.simulationService.addConnection(this.connectingFromId, data.id).subscribe(() => {
          this.cancelConnecting();
        });
      }
    } else {
      this.selectedNodeId = data.id;
    }
  }

  onCanvasClick(event: MouseEvent) {
    if (!this.isConnecting) {
      this.selectedNodeId = null;
    }
  }

  onCanvasRightClick(event: MouseEvent) {
    event.preventDefault();
    
    if (this.selectedNodeId) {
      const queue = this.queues.find(q => q.id === this.selectedNodeId);
      const machine = this.machines.find(m => m.id === this.selectedNodeId);
      
      if (queue) {
        this.simulationService.deleteQueue(this.selectedNodeId).subscribe();
      } else if (machine) {
        this.simulationService.deleteMachine(this.selectedNodeId).subscribe();
      }
      
      this.selectedNodeId = null;
    }
  }

  // ==================== DRAGGING ====================
  
  startDrag(data: {event: MouseEvent, id: string, type: 'queue' | 'machine'}) {
    data.event.stopPropagation();
    if (this.isConnecting) return;
    
    this.draggingNodeId = data.id;
    this.draggingNodeType = data.type;
    
    let nodeX = 0, nodeY = 0;
    if (data.type === 'queue') {
      const queue = this.queues.find(q => q.id === data.id);
      if (queue) {
        nodeX = queue.x;
        nodeY = queue.y;
      }
    } else {
      const machine = this.machines.find(m => m.id === data.id);
      if (machine) {
        nodeX = machine.x;
        nodeY = machine.y;
      }
    }
    
    this.dragOffset = {
      x: data.event.clientX - nodeX,
      y: data.event.clientY - nodeY
    };
  }

  onMouseMove(event: MouseEvent) {
    if (this.draggingNodeId && this.draggingNodeType) {
      const newX = event.clientX - this.dragOffset.x;
      const newY = event.clientY - this.dragOffset.y;
      
      if (this.draggingNodeType === 'queue') {
        this.simulationService.updateQueuePosition(this.draggingNodeId, newX, newY).subscribe();
      } else {
        this.simulationService.updateMachinePosition(this.draggingNodeId, newX, newY).subscribe();
      }
    } else if (this.isConnecting && this.connectingFromId) {
      this.tempLineEnd = { x: event.clientX, y: event.clientY };
    }
  }

  onMouseUp() {
    this.draggingNodeId = null;
    this.draggingNodeType = null;
  }
}