import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SimulationService } from './services/simulation.service';
import { Subscription } from 'rxjs';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { SimulationState, Queue, Machine, Connection } from './models/simulation.models';
import { WebSocketService } from './services/ websocket.service';
// import { WebSocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ToolbarComponent, CanvasComponent],
  template: `
    <div class="app-container">
      <app-toolbar
        [isRunning]="state?.isRunning || false"
        [isPaused]="isPaused"
        [isConnecting]="isConnecting"
        [isReplaying]="isReplaying"
        [hasSnapshots]="snapshotCount > 0"
        [snapshotCount]="snapshotCount"
        (addStartQueue)="addStartQueue()"
        (addNormalQueue)="addNormalQueue()"
        (addEndQueue)="addEndQueue()"
        (addMachine)="addMachine()"
        (startConnecting)="startConnecting()"
        (cancelConnecting)="cancelConnecting()"
        (start)="startSimulation()"
        (pause)="pauseSimulation()"
        (resume)="resumeSimulation()"
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
        [replayFrameCount]="frameChangeCount"
        [style.padding-bottom.px]="isReplaying ? 200 : 0"
        (nodeMouseDown)="startDrag($event)"
        (nodeClick)="onNodeClick($event)"
        (canvasClick)="onCanvasClick($event)"
        (canvasRightClick)="onCanvasRightClick($event)"
        (mouseMove)="onMouseMove($event)">
      </app-canvas>

      <!-- Replay Mode Indicator Banner -->
      <div class="replay-banner" *ngIf="isReplaying">
        <div class="replay-banner-content">
          <span class="replay-badge">🎬 REPLAY MODE</span>
          <span class="replay-status">{{ isReplayPaused ? '⏸ Paused' : '▶ Playing' }}</span>
          <span class="replay-frame-badge" [attr.data-frame]="frameChangeCount">Frame {{ replayCurrentIndex + 1 }}</span>
        </div>
      </div>

      <!-- Canvas Dimming Overlay during Replay -->
      <div class="canvas-replay-overlay" *ngIf="isReplaying" 
           [class.frame-pulse]="!isReplayPaused"></div>

      <!-- Enhanced Replay Controls (Bottom Bar) -->
      <div class="replay-controls-bar" *ngIf="isReplaying">
        <div class="replay-header">
          <h3>🎬 Replay Mode</h3>
          <p class="replay-subtitle">Playing simulation from start to pause</p>
        </div>
        
        <div class="replay-content">
          <!-- Progress Bar -->
          <div class="replay-bar" (click)="seekReplay($event)">
            <div class="replay-fill" [style.width.%]="replayProgress"></div>
            <div class="replay-scrubber" [style.left.%]="replayProgress"></div>
          </div>
          
          <!-- Frame Info & Controls -->
          <div class="replay-controls-container">
            <div class="replay-info">
              <span class="replay-frame">Frame {{ replayCurrentIndex + 1 }} / {{ replayTotalSnapshots }}</span>
              <span class="replay-time">{{ getCurrentTime() }} / {{ getTotalTime() }}</span>
            </div>
            
            <div class="replay-controls">
              <button (click)="toggleReplayPause()" class="btn-control">
                {{ isReplayPaused ? '▶' : '⏸' }}
              </button>
              
              <button (click)="previousFrame()" class="btn-control" [disabled]="replayCurrentIndex === 0">
                ⏮
              </button>
              
              <button (click)="nextFrame()" class="btn-control" [disabled]="replayCurrentIndex >= replayTotalSnapshots - 1">
                ⏭
              </button>
              
              <div class="speed-control">
                <label>Speed:</label>
                <button (click)="setReplaySpeed(0.25)" [class.active]="replaySpeed === 0.25">0.25x</button>
                <button (click)="setReplaySpeed(0.5)" [class.active]="replaySpeed === 0.5">0.5x</button>
                <button (click)="setReplaySpeed(1)" [class.active]="replaySpeed === 1">1x</button>
                <button (click)="setReplaySpeed(2)" [class.active]="replaySpeed === 2">2x</button>
                <button (click)="setReplaySpeed(4)" [class.active]="replaySpeed === 4">4x</button>
              </div>
              
              <button (click)="stopReplay()" class="btn-stop">
                ⏹ Stop
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Debug Info -->
      <div class="debug-info" [class.replay-active]="isReplaying">
        <div><strong>Status:</strong></div>
        <div>Queues: {{ queues.length }}</div>
        <div>Machines: {{ machines.length }}</div>
        <div>Connections: {{ connections.length }}</div>
        <!-- <div>Running: {{ state?.isRunning ? '✅' : '❌' }} (state)</div> -->
        <div>isPaused: {{ isPaused ? '✅' : '❌' }} (local)</div>
        <div>Snapshots: {{ snapshotCount }}</div>
        <div>Replaying: {{ isReplaying ? '🎬' : '❌' }}</div>
        <div *ngIf="isReplaying">Speed: {{ replaySpeed }}x</div>
        <div *ngIf="isReplaying">Frame Changes: {{ frameChangeCount }}</div>
        <div *ngIf="isReplaying" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">
          <strong style="color: #a5b4fc;">📸 Current Frame Data:</strong>
        </div>
        <div *ngFor="let q of queues" style="color: #fbbf24; font-size: 11px;">
          📦 Q-{{ q.id.slice(0,6) }}: {{ q.productCount }} items ({{ q.type }})
        </div>
        <div *ngFor="let m of machines" style="color: #34d399; font-size: 11px;">
          ⚙️ M-{{ m.id.slice(0,6) }}: {{ m.currentProduct ? '🔧 BUSY' : '⚪ IDLE' }}
        </div>
        <!-- <div style="color: #fbbf24; margin-top: 8px;">
          Toolbar sees: isRunning={{ state?.isRunning || false }}
        </div> -->
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
      overflow: hidden;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .canvas-replay-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.15);
      pointer-events: none;
      z-index: 500;
      animation: fadeIn 0.3s;
    }

    .canvas-replay-overlay.frame-pulse {
      animation: frameBorder 0.3s ease-out infinite;
    }

    @keyframes frameBorder {
      0%, 100% { 
        box-shadow: inset 0 0 0 0px rgba(99, 102, 241, 0);
      }
      50% { 
        box-shadow: inset 0 0 0 4px rgba(99, 102, 241, 0.6);
      }
    }

    .replay-banner {
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1500;
      animation: slideDown 0.4s ease-out;
    }

    @keyframes slideDown {
      from { transform: translateX(-50%) translateY(-100%); }
      to { transform: translateX(-50%) translateY(0); }
    }

    .replay-banner-content {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 0.75rem 2rem;
      border-radius: 30px;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5);
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .replay-badge {
      font-weight: 700;
      font-size: 1rem;
      letter-spacing: 0.5px;
    }

    .replay-status {
      font-size: 0.9rem;
      opacity: 0.95;
    }

    .replay-frame-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.85rem;
      animation: framePulse 0.3s ease-out;
    }

    @keyframes framePulse {
      0% { transform: scale(1.2); background: rgba(255, 255, 255, 0.4); }
      100% { transform: scale(1); background: rgba(255, 255, 255, 0.2); }
    }

    .replay-controls-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95));
      backdrop-filter: blur(12px);
      border-top: 2px solid #6366f1;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
      z-index: 2000;
      animation: slideUpBar 0.4s ease-out;
    }

    @keyframes slideUpBar {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .replay-header {
      background: rgba(99, 102, 241, 0.15);
      padding: 0.75rem 2rem;
      border-bottom: 1px solid rgba(99, 102, 241, 0.3);
    }

    .replay-header h3 {
      margin: 0;
      color: white;
      font-size: 1.3rem;
      display: inline-block;
    }

    .replay-subtitle {
      display: inline-block;
      margin-left: 1rem;
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .replay-content {
      padding: 1.5rem 2rem 1rem;
    }

    .replay-bar {
      width: 100%;
      height: 10px;
      background: #334155;
      border-radius: 5px;
      overflow: visible;
      margin-bottom: 1rem;
      cursor: pointer;
      position: relative;
      transition: height 0.2s;
    }

    .replay-bar:hover {
      height: 14px;
    }

    .replay-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
      background-size: 200% 100%;
      animation: gradientMove 3s linear infinite;
      border-radius: 6px;
      transition: width 0.1s linear;
    }

    @keyframes gradientMove {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }

    .replay-scrubber {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: grab;
      transition: left 0.1s linear;
    }

    .replay-scrubber:active {
      cursor: grabbing;
      transform: translate(-50%, -50%) scale(1.2);
    }

    .replay-controls-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }

    .replay-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 180px;
    }

    .replay-frame {
      font-size: 1rem;
      font-weight: 600;
      color: #a5b4fc;
    }

    .replay-time {
      font-size: 0.9rem;
      color: #94a3b8;
      font-family: 'Courier New', monospace;
    }

    .replay-controls {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex: 1;
      justify-content: center;
    }

    .btn-control {
      width: 45px;
      height: 45px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 1.2rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-control:hover:not(:disabled) {
      background: #2563eb;
      transform: scale(1.1);
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
    }

    .btn-control:disabled {
      background: #475569;
      cursor: not-allowed;
      opacity: 0.5;
    }

    .speed-control {
      display: flex;
      gap: 0.4rem;
      align-items: center;
      background: #334155;
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
    }

    .speed-control label {
      color: #94a3b8;
      font-size: 0.85rem;
      margin-right: 0.4rem;
    }

    .speed-control button {
      padding: 0.35rem 0.7rem;
      background: #475569;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .speed-control button:hover {
      background: #64748b;
    }

    .speed-control button.active {
      background: #6366f1;
      font-weight: 600;
    }

    .btn-stop {
      padding: 0.65rem 1.5rem;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-stop:hover {
      background: #dc2626;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
    }

    .debug-info {
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 1000;
      font-family: 'Courier New', monospace;
      border: 1px solid rgba(255,255,255,0.1);
      transition: bottom 0.3s ease;
      max-height: 400px;
      overflow-y: auto;
    }

    .debug-info.replay-active {
      bottom: 210px;
    }

    .debug-info div {
      margin: 3px 0;
    }

    .debug-info strong {
      color: #10b981;
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
  isPaused = false;
  isReplaying = false;
  isReplayPaused = false;
  snapshotCount = 0;
  replayProgress = 0;
  replayCurrentIndex = 0;
  replayTotalSnapshots = 0;
  replaySpeed = 1;
  connectingFromId: string | null = null;
  connectingFromType: 'queue' | 'machine' | null = null;
  tempLineEnd: {x: number, y: number} | null = null;
  
  draggingNodeId: string | null = null;
  draggingNodeType: 'queue' | 'machine' | null = null;
  dragOffset = { x: 0, y: 0 };
  
  private subscription?: Subscription;
  private replayInterval?: any;
  private snapshotCheckInterval?: any;
  private replaySnapshots: SimulationState[] = [];
  frameChangeCount = 0;

  constructor(
    private simulationService: SimulationService,
    private wsService: WebSocketService,
    private cdr: ChangeDetectorRef
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

    this.snapshotCheckInterval = setInterval(() => {
      if (!this.isReplaying) {
        this.simulationService.getReplaySnapshots().subscribe(snapshots => {
          this.snapshotCount = snapshots.length;
        });
      }
    }, 1000);

    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.wsService.disconnect();
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    if (this.replayInterval) clearInterval(this.replayInterval);
    if (this.snapshotCheckInterval) clearInterval(this.snapshotCheckInterval);
  }

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

  startConnecting() {
    this.isConnecting = true;
    this.connectingFromId = null;
  }

  cancelConnecting() {
    this.isConnecting = false;
    this.connectingFromId = null;
    this.tempLineEnd = null;
  }

  startSimulation() {
    console.log('▶ START: Beginning simulation');
    this.isPaused = false;
    this.simulationService.startSimulation().subscribe(() => {
      console.log('✅ Simulation started - Backend confirmed');
      this.simulationService.getCurrentState().subscribe(state => {
        this.state = state;
        console.log('📊 Current state after start:', { isRunning: state.isRunning });
      });
    });
  }

  pauseSimulation() {
    console.log('⏸ PAUSE: Stopping simulation');
    this.isPaused = true;
    this.simulationService.pauseSimulation().subscribe(() => {
      console.log('✅ Paused - Total screenshots:', this.snapshotCount);
      this.simulationService.getCurrentState().subscribe(state => {
        this.state = state;
        console.log('📊 Current state after pause:', { isRunning: state.isRunning });
      });
    });
  }

  resumeSimulation() {
    console.log('▶ RESUME: Continuing simulation');
    this.isPaused = false;
    this.simulationService.resumeSimulation().subscribe(() => {
      console.log('✅ Resumed - Backend confirmed');
      this.simulationService.getCurrentState().subscribe(state => {
        this.state = state;
        console.log('📊 Current state after resume:', { isRunning: state.isRunning });
      });
    });
  }

  resetSimulation() {
    console.log('↻ RESET: Clearing everything');
    
    if (confirm('This will delete everything (graph + snapshots). Continue?')) {
      this.isPaused = false;
      this.simulationService.resetSimulation().subscribe(() => {
        this.queues = [];
        this.machines = [];
        this.connections = [];
        this.snapshotCount = 0;
      });
    }
  }

  replaySimulation() {
    console.log('🎬 REPLAY: Loading snapshots');
    
    this.simulationService.getReplaySnapshots().subscribe(snapshots => {
      console.log('📦 Received snapshots from backend:', snapshots.length);
      
      if (snapshots.length === 0) {
        alert('No snapshots available!\n\nStart simulation to capture snapshots.');
        return;
      }

      console.log('📸 First snapshot:', snapshots[0]);
      console.log('📸 Last snapshot:', snapshots[snapshots.length - 1]);
      
      this.replaySnapshots = snapshots;
      this.isReplaying = true;
      this.isReplayPaused = false;
      this.replayTotalSnapshots = snapshots.length;
      this.replayCurrentIndex = 0;
      this.frameChangeCount = 0;

      if (this.state?.isRunning) {
        this.simulationService.pauseSimulation().subscribe();
      }

      this.playReplay();
    });
  }

  playReplay() {
    if (this.replayInterval) {
      clearInterval(this.replayInterval);
    }

    const baseInterval = 200;
    const interval = baseInterval / this.replaySpeed;

    console.log(`🎬 Starting replay with interval: ${interval}ms (speed: ${this.replaySpeed}x)`);

    this.replayInterval = setInterval(() => {
      if (this.isReplayPaused) {
        return;
      }

      if (this.replayCurrentIndex >= this.replaySnapshots.length) {
        this.stopReplay();
        return;
      }

      this.showFrame(this.replayCurrentIndex);
      this.replayCurrentIndex++;
    }, interval);
  }

  showFrame(index: number) {
    if (index < 0 || index >= this.replaySnapshots.length) return;
    
    const snapshot = this.replaySnapshots[index];
    
    this.queues = JSON.parse(JSON.stringify(snapshot.queues));
    this.machines = JSON.parse(JSON.stringify(snapshot.machines));
    this.connections = JSON.parse(JSON.stringify(snapshot.connections));
    
    this.replayProgress = ((index + 1) / this.replaySnapshots.length) * 100;
    this.frameChangeCount++;
    
    this.cdr.detectChanges();
    this.highlightChanges(index);
    
    console.log(`📸 Frame ${index + 1}/${this.replaySnapshots.length}: (Change #${this.frameChangeCount})`);
    console.log('  Queues:', this.queues.map(q => `${q.id.slice(0,8)}: ${q.productCount} items`));
    console.log('  Machines:', this.machines.map(m => `${m.id.slice(0,8)}: ${m.currentProduct ? 'BUSY' : 'IDLE'}`));
  }

  private highlightChanges(index: number) {
    if (index === 0) return;
    
    const prevSnapshot = this.replaySnapshots[index - 1];
    const currentSnapshot = this.replaySnapshots[index];
    
    currentSnapshot.queues.forEach((queue, i) => {
      const prevQueue = prevSnapshot.queues[i];
      if (prevQueue && queue.productCount !== prevQueue.productCount) {
        console.log(`🔄 Queue ${queue.id.slice(0,8)} changed: ${prevQueue.productCount} → ${queue.productCount}`);
      }
    });
    
    currentSnapshot.machines.forEach((machine, i) => {
      const prevMachine = prevSnapshot.machines[i];
      if (prevMachine && machine.currentProduct !== prevMachine.currentProduct) {
        console.log(`🔄 Machine ${machine.id.slice(0,8)} changed: ${prevMachine.currentProduct ? 'BUSY' : 'IDLE'} → ${machine.currentProduct ? 'BUSY' : 'IDLE'}`);
      }
    });
  }

  toggleReplayPause() {
    this.isReplayPaused = !this.isReplayPaused;
  }

  previousFrame() {
    if (this.replayCurrentIndex > 0) {
      this.replayCurrentIndex--;
      this.showFrame(this.replayCurrentIndex);
    }
  }

  nextFrame() {
    if (this.replayCurrentIndex < this.replaySnapshots.length - 1) {
      this.replayCurrentIndex++;
      this.showFrame(this.replayCurrentIndex);
    }
  }

  setReplaySpeed(speed: number) {
    this.replaySpeed = speed;
    if (!this.isReplayPaused) {
      this.playReplay();
    }
  }

  seekReplay(event: MouseEvent) {
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetIndex = Math.floor(percentage * this.replaySnapshots.length);
    
    this.replayCurrentIndex = Math.max(0, Math.min(targetIndex, this.replaySnapshots.length - 1));
    this.showFrame(this.replayCurrentIndex);
  }

  stopReplay() {
    console.log('⏹ Stopping replay');
    if (this.replayInterval) {
      clearInterval(this.replayInterval);
    }
    this.isReplaying = false;
    this.isReplayPaused = false;
    this.replayProgress = 0;
    this.replaySnapshots = [];
    this.frameChangeCount = 0;
    
    this.simulationService.getCurrentState().subscribe(state => {
      this.queues = state.queues;
      this.machines = state.machines;
      this.connections = state.connections;
    });
  }

  getCurrentTime(): string {
    const seconds = (this.replayCurrentIndex * 0.5).toFixed(1);
    return `${seconds}s`;
  }

  getTotalTime(): string {
    const seconds = (this.replayTotalSnapshots * 0.5).toFixed(1);
    return `${seconds}s`;
  }

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