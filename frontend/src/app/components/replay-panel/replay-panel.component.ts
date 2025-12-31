import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../services/simulation.service';
import { SimulationState } from '../../models/simulation.models';

export interface SnapshotDisplay {
  timestamp: number;
  state: SimulationState;
  index: number;
}

@Component({
  selector: 'app-replay-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="replay-panel">
      <div class="panel-header">
        <h3>📼 Replay & Snapshots</h3>
        <button (click)="close.emit()" class="close-btn">×</button>
      </div>

      <div class="panel-content">
        <!-- Actions -->
        <div class="action-section">
          <button (click)="refreshSnapshots()" class="btn-primary">
            🔄 Refresh
          </button>
          <button (click)="clearAllSnapshots()" class="btn-danger" [disabled]="snapshots.length === 0">
            🗑️ Clear All
          </button>
          <button (click)="toggleSort()" class="btn-sort">
            {{ sortNewestFirst ? '⬇️ Oldest First' : '⬆️ Newest First' }}
          </button>
        </div>

        <!-- Snapshots List -->
        <div class="snapshots-list">
          <h4>Saved Snapshots ({{ snapshots.length }})</h4>
          
          <div *ngIf="snapshots.length === 0" class="empty-state">
            <p>No snapshots available</p>
            <p class="hint">Snapshots are auto-saved every 500ms during simulation</p>
          </div>

          <div *ngFor="let snapshot of displayedSnapshots; let i = index" 
               class="snapshot-item"
               [class.selected]="selectedIndex === getOriginalIndex(i)">
            <div class="snapshot-header">
              <div class="snapshot-time">
                📸 <strong>Snapshot {{ getOriginalIndex(i) + 1 }}</strong> • 
                {{ formatTime(snapshot.timestamp) }}
                <span class="time-ago">({{ getTimeAgo(snapshot.timestamp) }})</span>
              </div>
              <div class="snapshot-status-badge" [ngClass]="getSimulationStatus(snapshot.state)">
                {{ getSimulationStatus(snapshot.state) }}
              </div>
            </div>
            
            <div class="snapshot-stats-grid">
              <div class="stat-card">
                <div class="stat-icon">🔧</div>
                <div class="stat-content">
                  <div class="stat-value">{{ snapshot.state.machines?.length || 0 }}</div>
                  <div class="stat-label">Machines</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-content">
                  <div class="stat-value">{{ snapshot.state.queues?.length || 0 }}</div>
                  <div class="stat-label">Queues</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">🔗</div>
                <div class="stat-content">
                  <div class="stat-value">{{ snapshot.state.connections?.length || 0 }}</div>
                  <div class="stat-label">Connections</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                  <div class="stat-value">{{ getTotalProducts(snapshot.state) }}</div>
                  <div class="stat-label">Products</div>
                </div>
              </div>
            </div>

            <!-- Machine Status Mini View -->
            <div *ngIf="snapshot.state.machines?.length" class="machine-mini-view">
              <div class="mini-view-title">Machine Status:</div>
              <div class="machine-status-list">
                <div *ngFor="let machine of snapshot.state.machines.slice(0, 3)" 
                     class="machine-status-item"
                     [title]="machine.isProcessing ? 'Processing' : 'Idle'">
                  <div class="machine-dot" [ngClass]="machine.isProcessing ? 'processing' : 'idle'"></div>
                  <span class="machine-id">{{ machine.id.substring(0, 8) }}</span>
                  <span class="machine-time">{{ machine.serviceTime }}ms</span>
                </div>
                <div *ngIf="snapshot.state.machines.length > 3" class="more-machines">
                  +{{ snapshot.state.machines.length - 3 }} more
                </div>
              </div>
            </div>

            <!-- Queue Distribution -->
            <div *ngIf="snapshot.state.queues?.length" class="queue-distribution">
              <div class="queue-dist-title">Queue Load:</div>
              <div class="queue-bars">
                <div *ngFor="let queue of snapshot.state.queues" 
                     class="queue-bar-container"
                     [title]="queue.id + ': ' + queue.productCount + ' products'">
                  <div class="queue-label">{{ queue.id.substring(0, 8) }}</div>
                  <div class="queue-bar-bg">
                    <div class="queue-bar-fill" 
                         [style.width.%]="Math.min(queue.productCount * 10, 100)">
                      <span class="queue-count">{{ queue.productCount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="snapshot-actions">
              <button (click)="viewDetails(getOriginalIndex(i))" 
                      class="btn-preview">
                👁️ Details
              </button>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div *ngIf="selectedSnapshot !== null" class="preview-section">
          <div class="preview-header">
            <h4>Snapshot Details - {{ formatTime(selectedSnapshot.timestamp) }}</h4>
            <button (click)="closePreview()" class="btn-close-preview">
              ×
            </button>
          </div>
          
          <div class="preview-content">
            <!-- Statistics Grid -->
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-box-label">Machines</div>
                <div class="stat-box-value">{{ selectedSnapshot.state.machines?.length || 0 }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">Queues</div>
                <div class="stat-box-value">{{ selectedSnapshot.state.queues?.length || 0 }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">Connections</div>
                <div class="stat-box-value">{{ selectedSnapshot.state.connections?.length || 0 }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">Total Products</div>
                <div class="stat-box-value">{{ getTotalProducts(selectedSnapshot.state) }}</div>
              </div>
            </div>

            <!-- Machine Details -->
            <div class="detail-section">
              <h5>🔧 Machines ({{ selectedSnapshot.state.machines?.length || 0 }})</h5>
              <div class="machines-list">
                <div *ngFor="let machine of selectedSnapshot.state.machines" class="machine-detail">
                  <div class="machine-detail-header">
                    <div class="machine-detail-id">{{ machine.id }}</div>
                    <div class="machine-detail-status" [ngClass]="machine.isProcessing ? 'processing' : 'idle'">
                      {{ machine.isProcessing ? 'Processing' : 'Idle' }}
                    </div>
                  </div>
                  <div class="machine-detail-stats">
                    <span>📍 ({{ machine.x.toFixed(0) }}, {{ machine.y.toFixed(0) }})</span>
                    <span>⏱️ {{ machine.serviceTime }}ms</span>
                    <span *ngIf="machine.currentProduct">🎨 Processing</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Queue Details -->
            <div class="detail-section">
              <h5>📦 Queues ({{ selectedSnapshot.state.queues?.length || 0 }})</h5>
              <div class="queues-list">
                <div *ngFor="let queue of selectedSnapshot.state.queues" class="queue-detail">
                  <div class="queue-detail-header">
                    <div class="queue-detail-id">{{ queue.id }}</div>
                    <div class="queue-detail-count">
                      {{ queue.productCount }} items
                    </div>
                  </div>
                  <div class="queue-progress">
                    <div class="queue-progress-bar" 
                         [style.width.%]="Math.min(queue.productCount * 10, 100)">
                    </div>
                  </div>
                  <div class="queue-detail-stats">
                    <span>📍 ({{ queue.x.toFixed(0) }}, {{ queue.y.toFixed(0) }})</span>
                    <span>Type: {{ queue.type }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Connections Summary -->
            <div class="detail-section">
              <h5>🔗 Connections ({{ selectedSnapshot.state.connections?.length || 0 }})</h5>
              <div class="connections-list">
                <div *ngFor="let conn of selectedSnapshot.state.connections" class="connection-detail">
                  <div class="connection-flow">
                    <span class="conn-source">{{ conn.sourceId.substring(0, 8) }}</span>
                    <span class="conn-arrow">→</span>
                    <span class="conn-target">{{ conn.targetId.substring(0, 8) }}</span>
                  </div>
                  <div class="connection-types">
                    <span class="conn-type">{{ conn.sourceType }}</span>
                    <span class="conn-separator">to</span>
                    <span class="conn-type">{{ conn.targetType }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .replay-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1e293b;
      border: 2px solid #3b82f6;
      border-radius: 12px;
      width: 700px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #334155;
    }

    .panel-header h3 {
      margin: 0;
      color: white;
      font-size: 20px;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 32px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      line-height: 1;
    }

    .close-btn:hover {
      color: #ef4444;
    }

    .panel-content {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .action-section {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .btn-primary, .btn-danger, .btn-preview, .btn-sort {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      flex: 1;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
    }

    .btn-danger:disabled {
      background: #475569;
      cursor: not-allowed;
      opacity: 0.5;
    }

    .btn-sort {
      background: #64748b;
      color: white;
    }

    .btn-sort:hover {
      background: #475569;
    }

    .snapshots-list {
      margin-top: 20px;
    }

    .snapshots-list h4 {
      color: white;
      margin: 0 0 15px 0;
      font-size: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;
    }

    .empty-state p {
      margin: 10px 0;
    }

    .hint {
      font-size: 12px;
      color: #64748b;
    }

    .snapshot-item {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      transition: all 0.2s;
    }

    .snapshot-item:hover {
      border-color: #3b82f6;
      transform: translateX(5px);
    }

    .snapshot-item.selected {
      border-color: #10b981;
      background: #0f1f1a;
    }

    .snapshot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .snapshot-time {
      color: white;
      font-weight: 600;
      font-size: 14px;
    }

    .time-ago {
      font-size: 12px;
      color: #94a3b8;
      margin-left: 8px;
    }

    .snapshot-status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .snapshot-status-badge.running {
      background: #10b98120;
      color: #10b981;
      border: 1px solid #10b981;
    }

    .snapshot-status-badge.stopped {
      background: #ef444420;
      color: #ef4444;
      border: 1px solid #ef4444;
    }

    .snapshot-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    }

    .stat-card {
      background: #1e293b;
      border-radius: 6px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stat-icon {
      font-size: 20px;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      color: white;
      font-size: 18px;
      font-weight: bold;
      line-height: 1;
    }

    .stat-label {
      color: #94a3b8;
      font-size: 11px;
      margin-top: 2px;
    }

    .machine-mini-view, .queue-distribution {
      margin-top: 15px;
      padding: 12px;
      background: #1e293b;
      border-radius: 6px;
    }

    .mini-view-title, .queue-dist-title {
      color: #94a3b8;
      font-size: 12px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .machine-status-list {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .machine-status-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      background: #0f172a;
      border-radius: 4px;
      font-size: 12px;
    }

    .machine-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .machine-dot.idle {
      background: #94a3b8;
    }

    .machine-dot.processing {
      background: #10b981;
      animation: pulse 1s infinite;
    }

    .machine-id {
      color: white;
      font-weight: bold;
    }

    .machine-time {
      color: #3b82f6;
      font-size: 11px;
    }

    .more-machines {
      color: #64748b;
      font-size: 11px;
      font-style: italic;
    }

    .queue-bars {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .queue-bar-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .queue-label {
      color: white;
      font-weight: bold;
      width: 70px;
      font-size: 12px;
    }

    .queue-bar-bg {
      flex: 1;
      height: 20px;
      background: #0f172a;
      border-radius: 10px;
      overflow: hidden;
    }

    .queue-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: width 0.3s ease;
      min-width: 24px;
    }

    .queue-count {
      color: white;
      font-size: 11px;
      font-weight: bold;
    }

    .snapshot-actions {
      display: flex;
      gap: 8px;
      margin-top: 15px;
    }

    .btn-preview {
      flex: 1;
      padding: 8px 12px;
      font-size: 12px;
      background: #6366f1;
      color: white;
    }

    .btn-preview:hover {
      background: #4f46e5;
    }

    .preview-section {
      margin-top: 20px;
      background: #0f172a;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      overflow: hidden;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
    }

    .preview-header h4 {
      color: white;
      margin: 0;
      font-size: 14px;
    }

    .btn-close-preview {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
    }

    .btn-close-preview:hover {
      color: white;
    }

    .preview-content {
      padding: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .stat-box {
      background: #1e293b;
      border-radius: 6px;
      padding: 15px;
      text-align: center;
    }

    .stat-box-label {
      color: #94a3b8;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .stat-box-value {
      color: white;
      font-size: 20px;
      font-weight: bold;
    }

    .detail-section {
      margin-bottom: 20px;
    }

    .detail-section h5 {
      color: white;
      margin: 0 0 10px 0;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .machines-list, .queues-list, .connections-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .machine-detail, .queue-detail, .connection-detail {
      background: #1e293b;
      border-radius: 6px;
      padding: 12px;
    }

    .machine-detail-header, .queue-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .machine-detail-id, .queue-detail-id {
      color: white;
      font-weight: bold;
    }

    .machine-detail-status {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: bold;
    }

    .machine-detail-status.idle {
      background: #94a3b820;
      color: #94a3b8;
    }

    .machine-detail-status.processing {
      background: #10b98120;
      color: #10b981;
    }

    .machine-detail-stats, .queue-detail-stats {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: #94a3b8;
    }

    .queue-detail-count {
      color: #3b82f6;
      font-weight: bold;
      font-size: 12px;
    }

    .queue-progress {
      height: 6px;
      background: #0f172a;
      border-radius: 3px;
      overflow: hidden;
      margin: 8px 0;
    }

    .queue-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      transition: width 0.3s ease;
    }

    .connection-detail {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .connection-flow {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .conn-source, .conn-target {
      color: white;
      font-weight: bold;
      font-size: 12px;
    }

    .conn-arrow {
      color: #3b82f6;
      font-size: 14px;
    }

    .connection-types {
      display: flex;
      gap: 4px;
      font-size: 10px;
      color: #94a3b8;
    }

    .conn-type {
      background: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .conn-separator {
      padding: 0 4px;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class ReplayPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  snapshots: SnapshotDisplay[] = [];
  displayedSnapshots: SnapshotDisplay[] = [];
  selectedIndex: number = -1;
  selectedSnapshot: SnapshotDisplay | null = null;
  sortNewestFirst = true;
  Math = Math;

  constructor(private simulationService: SimulationService) {}

  ngOnInit(): void {
    this.refreshSnapshots();
  }

  refreshSnapshots(): void {
    this.simulationService.getReplaySnapshots().subscribe({
      next: (states) => {
        console.log('✅ Snapshots loaded:', states.length);
        this.snapshots = states.map((state, index) => ({
          timestamp: state.timestamp,
          state: state,
          index: index
        }));
        this.applySorting();
      },
      error: (error) => console.error('❌ Error loading snapshots:', error)
    });
  }

  toggleSort(): void {
    this.sortNewestFirst = !this.sortNewestFirst;
    this.applySorting();
  }

  applySorting(): void {
    this.displayedSnapshots = [...this.snapshots];
    if (this.sortNewestFirst) {
      this.displayedSnapshots.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      this.displayedSnapshots.sort((a, b) => a.timestamp - b.timestamp);
    }
  }

  getOriginalIndex(displayIndex: number): number {
    const snapshot = this.displayedSnapshots[displayIndex];
    return this.snapshots.indexOf(snapshot);
  }

  getSimulationStatus(state: SimulationState): string {
    return state.isRunning ? 'running' : 'stopped';
  }

  getTotalProducts(state: SimulationState): number {
    return state.queues?.reduce((sum, queue) => sum + queue.productCount, 0) || 0;
  }

  getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }) + ' ' + date.toLocaleDateString();
  }

  viewDetails(index: number): void {
    this.selectedIndex = index;
    this.selectedSnapshot = this.snapshots[index];
  }

  closePreview(): void {
    this.selectedSnapshot = null;
    this.selectedIndex = -1;
  }

  clearAllSnapshots(): void {
    if (confirm('Are you sure you want to delete all snapshots?')) {
      // Note: You'll need to implement a clear endpoint in the backend
      console.log('⚠️ Clear all snapshots not implemented in backend yet');
      // When implemented:
      // this.simulationService.clearSnapshots().subscribe(() => {
      //   this.refreshSnapshots();
      // });
    }
  }
}