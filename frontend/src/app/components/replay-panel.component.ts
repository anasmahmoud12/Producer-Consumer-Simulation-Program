import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../services/simulation.service';

export interface Snapshot {
  timestamp: number;
  machines: any[];
  queues: any[];
  products: any[];
  connections: any[];
  statistics: any;
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
        <!-- Create Snapshot Button -->
        <div class="action-section">
          <button (click)="createSnapshot()" class="btn-primary">
            📸 Create Snapshot
          </button>
          <button (click)="clearAllSnapshots()" class="btn-danger">
            🗑️ Clear All
          </button>
          <button (click)="toggleSort()" class="btn-sort">
            {{ sortNewestFirst ? '⬇️ Oldest First' : '⬆️ Newest First' }}
          </button>
        </div>

        <!-- Snapshots List -->
        <div class="snapshots-list">
          <h4>Saved Snapshots ({{ snapshots.length }}/50)</h4>
          
          <div *ngIf="snapshots.length === 0" class="empty-state">
            <p>No snapshots available</p>
            <p class="hint">Snapshots are auto-saved every 5 seconds during simulation</p>
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
              <div class="snapshot-status-badge" [ngClass]="getSimulationStatus(snapshot)">
                {{ getSimulationStatus(snapshot) }}
              </div>
            </div>
            
            <div class="snapshot-stats-grid">
              <div class="stat-card">
                <div class="stat-icon">🔧</div>
                <div class="stat-content">
                  <div class="stat-value">{{ snapshot.machines?.length || 0 }}</div>
                  <div class="stat-label">Machines</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-content">
                  <div class="stat-value">{{ getQueueProductsCount(snapshot) }}</div>
                  <div class="stat-label">Queue Items</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-content">
                  <div class="stat-value">{{ snapshot.statistics?.totalProductsProcessed || 0 }}</div>
                  <div class="stat-label">Completed</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">⏱️</div>
                <div class="stat-content">
                  <div class="stat-value">{{ (snapshot.statistics?.throughput || 0).toFixed(1) }}</div>
                  <div class="stat-label">Throughput/s</div>
                </div>
              </div>
            </div>

            <!-- Machine Status Mini View -->
            <div *ngIf="snapshot.machines?.length" class="machine-mini-view">
              <div class="mini-view-title">Machine Status:</div>
              <div class="machine-status-list">
                <div *ngFor="let machine of snapshot.machines.slice(0, 3)" 
                     class="machine-status-item"
                     [title]="machine.status + ' - Processed: ' + (machine.processedCount || 0)">
                  <div class="machine-dot" [ngClass]="machine.status"></div>
                  <span class="machine-id">{{ machine.id }}</span>
                  <span class="machine-count">{{ machine.processedCount || 0 }}</span>
                </div>
                <div *ngIf="snapshot.machines.length > 3" class="more-machines">
                  +{{ snapshot.machines.length - 3 }} more
                </div>
              </div>
            </div>

            <!-- Queue Distribution -->
            <div *ngIf="snapshot.queues?.length" class="queue-distribution">
              <div class="queue-dist-title">Queue Load:</div>
              <div class="queue-bars">
                <div *ngFor="let queue of snapshot.queues" 
                     class="queue-bar-container"
                     [title]="queue.id + ': ' + (queue.products?.length || 0) + ' products'">
                  <div class="queue-label">{{ queue.id }}</div>
                  <div class="queue-bar-bg">
                    <div class="queue-bar-fill" 
                         [style.width.%]="getQueueFillPercentage(queue)">
                      <span class="queue-count">{{ queue.products?.length || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="snapshot-actions">
              <button (click)="restoreSnapshot(getOriginalIndex(i))" 
                      class="btn-restore"
                      [disabled]="isRestoring">
                {{ isRestoring && selectedIndex === getOriginalIndex(i) ? '⏳ Restoring...' : '▶️ Restore' }}
              </button>
              <button (click)="previewSnapshotDetails(getOriginalIndex(i))" 
                      class="btn-preview">
                👁️ Details
              </button>
            </div>
          </div>
        </div>

        <!-- Enhanced Preview Section -->
        <div *ngIf="selectedSnapshot !== null" class="preview-section">
          <div class="preview-header">
            <h4>Snapshot Details - {{ formatTime(selectedSnapshot.timestamp) }}</h4>
            <button (click)="selectedSnapshot = null; selectedIndex = -1" class="btn-close-preview">
              ×
            </button>
          </div>
          
          <div class="preview-content">
            <!-- Statistics Grid -->
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-box-label">Products Processed</div>
                <div class="stat-box-value">{{ selectedSnapshot.statistics?.totalProductsProcessed || 0 }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">In System</div>
                <div class="stat-box-value">{{ selectedSnapshot.statistics?.totalProductsInSystem || 0 }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">Avg Wait Time</div>
                <div class="stat-box-value">{{ (selectedSnapshot.statistics?.averageWaitTime || 0).toFixed(1) }}ms</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">Throughput</div>
                <div class="stat-box-value">{{ (selectedSnapshot.statistics?.throughput || 0).toFixed(1) }}/s</div>
              </div>
            </div>

            <!-- Machine Details -->
            <div class="detail-section">
              <h5>📊 Machines ({{ selectedSnapshot.machines?.length || 0 }})</h5>
              <div class="machines-list">
                <div *ngFor="let machine of selectedSnapshot.machines" class="machine-detail">
                  <div class="machine-detail-header">
                    <div class="machine-detail-id">{{ machine.id }}</div>
                    <div class="machine-detail-status" [ngClass]="machine.status">
                      {{ machine.status }}
                    </div>
                  </div>
                  <div class="machine-detail-stats">
                    <span>📍 ({{ machine.x }}, {{ machine.y }})</span>
                    <span>⚙️ {{ machine.processedCount || 0 }} processed</span>
                    <span *ngIf="machine.currentProduct">🎨 {{ machine.currentProduct.color }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Queue Details -->
            <div class="detail-section">
              <h5>📦 Queues ({{ selectedSnapshot.queues?.length || 0 }})</h5>
              <div class="queues-list">
                <div *ngFor="let queue of selectedSnapshot.queues" class="queue-detail">
                  <div class="queue-detail-header">
                    <div class="queue-detail-id">{{ queue.id }}</div>
                    <div class="queue-detail-count">
                      {{ queue.products?.length || 0 }}/{{ queue.capacity || 100 }}
                    </div>
                  </div>
                  <div class="queue-progress">
                    <div class="queue-progress-bar" 
                         [style.width.%]="getQueueCapacityPercentage(queue)">
                    </div>
                  </div>
                  <div class="queue-detail-stats">
                    <span>📍 ({{ queue.x }}, {{ queue.y }})</span>
                    <span *ngIf="queue.waitingMachines?.length">⏳ {{ queue.waitingMachines.length }} waiting</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Products Summary -->
            <div class="products-summary">
              <h5>🎨 Products ({{ selectedSnapshot.products?.length || 0 }})</h5>
              
              <!-- Simple Color Chips Display -->
              <div class="color-chips-simple">
                <div class="chips-title">Product Colors:</div>
                <div class="simple-chips-container">
                  <div *ngFor="let color of getProductColors(selectedSnapshot)" 
                       class="simple-color-chip"
                       [title]="color.count + ' products with color ' + color.color">
                    <div class="simple-color" [style.background]="color.color"></div>
                    <div class="simple-count">{{ color.count }}</div>
                  </div>
                </div>
              </div>
              
              <!-- Show individual products if not too many -->
              <div *ngIf="selectedSnapshot && selectedSnapshot.products.length <= 30" class="individual-products">
                <div class="individual-title">Individual Products:</div>
                <div class="products-grid">
                  <div *ngFor="let product of selectedSnapshot.products" 
                       class="product-item"
                       [title]="'ID: ' + product.id + ' | Priority: ' + product.priority + ' | Status: ' + product.status">
                    <div class="product-color" [style.background]="product.color || '#94a3b8'"></div>
                    <div class="product-info">
                      <div class="product-id">{{ product.id }}</div>
                      <div class="product-details">
                        <span class="product-priority">P{{ product.priority }}</span>
                        <span class="product-status">{{ product.status }}</span>
                      </div>
                    </div>
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

    .btn-primary, .btn-danger, .btn-restore, .btn-preview, .btn-sort {
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

    .btn-danger:hover {
      background: #dc2626;
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

    .snapshot-status-badge.paused {
      background: #f59e0b20;
      color: #f59e0b;
      border: 1px solid #f59e0b;
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

    .machine-dot.flashing {
      background: #f59e0b;
      animation: flash 0.5s infinite;
    }

    .machine-id {
      color: white;
      font-weight: bold;
    }

    .machine-count {
      color: #3b82f6;
      font-weight: bold;
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
      width: 30px;
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

    .btn-restore, .btn-preview {
      flex: 1;
      padding: 8px 12px;
      font-size: 12px;
    }

    .btn-restore {
      background: #10b981;
      color: white;
    }

    .btn-restore:hover:not(:disabled) {
      background: #059669;
    }

    .btn-restore:disabled {
      background: #475569;
      cursor: not-allowed;
    }

    .btn-preview {
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

    .machines-list, .queues-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .machine-detail, .queue-detail {
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

    /* Products Summary Styles */
    .products-summary {
      background: #1e293b;
      border-radius: 6px;
      padding: 15px;
    }

    .products-summary h5 {
      color: white;
      margin: 0 0 15px 0;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .color-chips-simple {
      margin-bottom: 20px;
    }

    .chips-title, .individual-title {
      color: #94a3b8;
      font-size: 12px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .simple-chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 12px;
      background: #0f172a;
      border-radius: 6px;
    }

    .simple-color-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: help;
      transition: transform 0.2s;
    }

    .simple-color-chip:hover {
      transform: scale(1.1);
    }

    .simple-color {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .simple-count {
      color: white;
      font-size: 12px;
      font-weight: bold;
      background: #3b82f6;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 24px;
      text-align: center;
    }

    .individual-products {
      margin-top: 15px;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 8px;
      max-height: 300px;
      overflow-y: auto;
      padding: 10px;
      background: #0f172a;
      border-radius: 6px;
    }

    .product-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      background: #1e293b;
      border-radius: 6px;
      cursor: help;
      transition: background-color 0.2s;
    }

    .product-item:hover {
      background: #2d3748;
    }

    .product-color {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .product-id {
      color: white;
      font-size: 11px;
      font-weight: bold;
    }

    .product-details {
      display: flex;
      gap: 8px;
      font-size: 10px;
      color: #94a3b8;
    }

    .product-priority {
      background: #3b82f6;
      color: white;
      padding: 1px 4px;
      border-radius: 4px;
      font-weight: bold;
    }

    .product-status {
      font-style: italic;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `]
})
export class ReplayPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() snapshotRestored = new EventEmitter<void>();

  snapshots: Snapshot[] = [];
  displayedSnapshots: Snapshot[] = [];
  selectedIndex: number = -1;
  selectedSnapshot: Snapshot | null = null;
  isRestoring = false;
  sortNewestFirst = true;

  constructor(private simulationService: SimulationService) {}

  ngOnInit(): void {
    this.loadSnapshots();
  }

  loadSnapshots(): void {
    this.simulationService.getSnapshots().subscribe({
      next: (snapshots) => {
        console.log('✅ Snapshots loaded:', snapshots);
        this.snapshots = snapshots;
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

  getQueueProductsCount(snapshot: Snapshot): number {
    return snapshot.queues?.reduce((sum, queue) => sum + (queue.products?.length || 0), 0) || 0;
  }

  getSimulationStatus(snapshot: Snapshot): string {
    // Check if any machine is processing
    const isProcessing = snapshot.machines?.some(m => m.status === 'processing');
    const hasProducts = (snapshot.statistics?.totalProductsInSystem || 0) > 0;
    
    if (isProcessing && hasProducts) return 'running';
    if (hasProducts && !isProcessing) return 'paused';
    return 'stopped';
  }

  getQueueFillPercentage(queue: any): number {
    const count = queue.products?.length || 0;
    const capacity = queue.capacity || 100;
    return Math.min((count / capacity) * 100, 100);
  }

  getQueueCapacityPercentage(queue: any): number {
    const count = queue.products?.length || 0;
    const capacity = queue.capacity || 100;
    return Math.min((count / capacity) * 100, 100);
  }

  getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  getProductColors(snapshot: Snapshot): any[] {
    const colorMap = new Map<string, number>();
    snapshot.products?.forEach(product => {
      const color = product.color || '#94a3b8';
      colorMap.set(color, (colorMap.get(color) || 0) + 1);
    });
    
    // Sort by count descending
    return Array.from(colorMap.entries())
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count);
  }

  createSnapshot(): void {
    this.simulationService.createSnapshot().subscribe({
      next: () => {
        console.log('✅ Snapshot created');
        this.loadSnapshots();
      },
      error: (error) => console.error('❌ Error creating snapshot:', error)
    });
  }

  restoreSnapshot(index: number): void {
    if (confirm('Are you sure you want to restore this snapshot? Current state will be lost.')) {
      this.isRestoring = true;
      this.simulationService.restoreSnapshot(index).subscribe({
        next: () => {
          console.log('✅ Snapshot restored on backend');
          this.selectedIndex = index;
          this.selectedSnapshot = this.snapshots[index];
          
          this.snapshotRestored.emit();
          this.isRestoring = false;
          this.close.emit();
        },
        error: (error) => {
          console.error('❌ Error restoring snapshot:', error);
          this.isRestoring = false;
          alert('Failed to restore snapshot');
        }
      });
    }
  }

  previewSnapshotDetails(index: number): void {
    this.selectedIndex = index;
    this.selectedSnapshot = this.snapshots[index];
  }

  clearAllSnapshots(): void {
    if (confirm('Are you sure you want to delete all snapshots?')) {
      this.simulationService.clearSnapshots().subscribe({
        next: () => {
          console.log('✅ All snapshots cleared');
          this.loadSnapshots();
          this.selectedSnapshot = null;
          this.selectedIndex = -1;
        },
        error: (error) => console.error('❌ Error clearing snapshots:', error)
      });
    }
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }) + ' ' + date.toLocaleDateString();
  }
}