 import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbar">
      <h1>Producer/Consumer Simulation</h1>
      
      <div class="toolbar-buttons">
        <!-- Add Nodes -->
        <button (click)="onAddStartQueue()" class="btn btn-success">
          + Start Queue
        </button>
        <button (click)="onAddNormalQueue()" class="btn btn-primary">
          + Normal Queue
        </button>
        <button (click)="onAddEndQueue()" class="btn btn-info">
          + End Queue
        </button>
        <button (click)="onAddMachine()" class="btn btn-warning">
          + Machine
        </button>
        
        <div class="divider"></div>
        
        <!-- Connect Mode -->
        <button *ngIf="!isConnecting" (click)="onStartConnecting()" class="btn btn-secondary">
          Connect Nodes
        </button>
        <button *ngIf="isConnecting" (click)="onCancelConnecting()" class="btn btn-danger">
          Cancel
        </button>
        
        <div class="divider"></div>
        
        <!-- Simulation Control -->
        <!-- Start button: يظهر لما مش شغال ومش paused -->
        <button (click)="onStart()" class="btn btn-play">
          ▶ Start
        </button>
        
        <!-- أثناء التشغيل: زرار Pause كبير وواضح -->
        <button  (click)="onPause()" class="btn btn-pause-large">
          ⏸ Pause
        </button>
        
        <!-- بعد الـ Pause: Resume -->
        <button *ngIf="isPaused && !isRunning" (click)="onResume()" class="btn btn-resume">
          ▶ Resume
        </button>
        
        <button (click)="onReset()" class="btn btn-reset">
          ↻ Reset
        </button>
        
        <button (click)="onReplay()" class="btn btn-replay" 
                [disabled]="isRunning || isReplaying || !hasSnapshots">
          🔄 Replay
        </button>
        <button (click)="onReplayPanel()" class="btn btn-replay-panel" title="Open Replay Panel">
  📺 Replay Panel
</button>
        <span *ngIf="snapshotCount > 0" class="snapshot-badge">
          {{ snapshotCount }} screenshots
        </span>
      </div>
    </div>
  `,
  styles: [`
    .toolbar {
      background: #1e293b;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .toolbar-buttons {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .divider {
      width: 1px;
      height: 30px;
      background: #475569;
      margin: 0 0.5rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-success { background: #10b981; color: white; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-info { background: #f59e0b; color: white; }
    .btn-warning { background: #8b5cf6; color: white; }
    .btn-secondary { background: #64748b; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-play { background: #10b981; color: white; }
    .btn-resume { 
      background: #22c55e; 
      color: white; 
      animation: pulse-resume 2s infinite; 
    }
    .btn-pause-large { 
      background: #f59e0b; 
      color: white;
      font-size: 1rem;
      padding: 0.6rem 1.2rem;
      animation: pulse-pause 2s infinite;
    }
    .btn-reset { background: #ef4444; color: white; }
    .btn-replay { background: #6366f1; color: white; }

    @keyframes pulse-resume {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
      50% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
    }

    @keyframes pulse-pause {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
      50% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
    }

    .snapshot-badge {
      background: #6366f1;
      color: white;
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .btn-replay-panel { 
  background: #8b5cf6; 
  color: white; 
}
  `]
})
export class ToolbarComponent {
  // ✅ FIX: Default values should be FALSE
  @Input() isRunning = false;  
  @Input() isPaused = false;
  @Input() isConnecting = false;
  @Input() isReplaying = false;
  @Input() hasSnapshots = false;
  @Input() snapshotCount = 0;
  
  @Output() addStartQueue = new EventEmitter<void>();
  @Output() addNormalQueue = new EventEmitter<void>();
  @Output() addEndQueue = new EventEmitter<void>();
  @Output() addMachine = new EventEmitter<void>();
  @Output() startConnecting = new EventEmitter<void>();
  @Output() cancelConnecting = new EventEmitter<void>();
  @Output() start = new EventEmitter<void>();
  @Output() pause = new EventEmitter<void>();
  @Output() resume = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() replay = new EventEmitter<void>();
  @Output() replayPanel = new EventEmitter<void>();

  onAddStartQueue() { this.addStartQueue.emit(); }
  onAddNormalQueue() { this.addNormalQueue.emit(); }
  onAddEndQueue() { this.addEndQueue.emit(); }
  onAddMachine() { this.addMachine.emit(); }
  onStartConnecting() { this.startConnecting.emit(); }
  onCancelConnecting() { this.cancelConnecting.emit(); }
  onStart() { 
    console.log('🎬 Toolbar: Start clicked');
    this.start.emit(); 
  }
  onPause() { 
    console.log('⏸ Toolbar: Pause clicked');
    this.pause.emit(); 
  }
  onResume() { 
    console.log('▶ Toolbar: Resume clicked');
    this.resume.emit(); 
  }
  onReset() { 
    console.log('↻ Toolbar: Reset clicked');
    this.reset.emit(); 
  }
  onReplay() { 
    console.log('🔄 Toolbar: Replay clicked');
    this.replay.emit(); 
  }
  onReplayPanel() { 
  console.log('📺 Toolbar: Replay Panel clicked');
  this.replayPanel.emit(); 
}
}