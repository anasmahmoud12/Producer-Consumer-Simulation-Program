import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Connection, Machine, Queue } from '../../models/simulation.models';
// import { Queue, Machine, Connection } from '../../models';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="canvas-wrapper" 
         (click)="onCanvasClick($event)"
         (contextmenu)="onCanvasRightClick($event)">
      <svg class="canvas-svg">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" 
                  refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
          </marker>
        </defs>

        <!-- Connections -->
        <g *ngFor="let conn of connections">
          <path 
            [attr.d]="getConnectionPath(conn)"
            class="connection-line"
            stroke="#64748b"
            stroke-width="2"
            fill="none"
            marker-end="url(#arrowhead)"
          />
        </g>

        <!-- Queues -->
        <g *ngFor="let queue of queues; trackBy: trackById"
           [attr.transform]="'translate(' + queue.x + ',' + queue.y + ')'"
           (mousedown)="onNodeMouseDown($event, queue.id, 'queue')"
           (click)="onNodeClick($event, queue.id, 'queue')"
           class="node queue-node">
          <rect x="-40" y="-30" width="80" height="60" 
                [attr.fill]="getQueueColor(queue.type)"
                rx="5"
                [class.selected]="selectedNodeId === queue.id"
                [class.connecting]="isConnecting && connectingFromId === queue.id"
                class="queue-rect"
          />
          <text y="-10" text-anchor="middle" class="node-label">
            {{ queue.type === 'start' ? '▶ Start' : queue.type === 'end' ? '⏹ End' : 'Queue' }}
          </text>
          <text y="10" text-anchor="middle" class="node-count">
            {{ queue.productCount }} items
          </text>
          <text y="25" text-anchor="middle" class="node-id">
            {{ queue.id.substring(0, 8) }}
          </text>
        </g>

        <!-- Machines -->
        <g *ngFor="let machine of machines; trackBy: trackById"
           [attr.transform]="'translate(' + machine.x + ',' + machine.y + ')'"
           (mousedown)="onNodeMouseDown($event, machine.id, 'machine')"
           (click)="onNodeClick($event, machine.id, 'machine')"
           class="node machine-node">
          <circle r="35" 
                  [attr.fill]="machine.currentColor"
                  [class.processing]="machine.isProcessing"
                  [class.flashing]="machine.isFlashing"
                  [class.selected]="selectedNodeId === machine.id"
                  [class.connecting]="isConnecting && connectingFromId === machine.id"
                  class="machine-circle"
          />
          <text y="-5" text-anchor="middle" class="node-label">M</text>
          <text y="10" text-anchor="middle" class="node-time">
            {{ machine.serviceTime }}ms
          </text>
          <text y="50" text-anchor="middle" class="node-id">
            {{ machine.id.substring(0, 8) }}
          </text>
        </g>

        <!-- Temporary connection line -->
        <line *ngIf="isConnecting && tempLineEnd && connectingFromId"
              [attr.x1]="getTempLineStart().x"
              [attr.y1]="getTempLineStart().y"
              [attr.x2]="tempLineEnd.x"
              [attr.y2]="tempLineEnd.y"
              stroke="#3b82f6"
              stroke-width="2"
              stroke-dasharray="5,5"
        />
      </svg>

      <!-- Instructions -->
      <div class="instructions" *ngIf="!isRunning && queues.length === 0 && machines.length === 0">
        <h3>Get Started:</h3>
        <ol>
          <li>Add a <strong>Start Queue</strong> (generates products)</li>
          <li>Add <strong>Machines</strong> to process products</li>
          <li>Add <strong>Normal Queues</strong> between machines</li>
          <li>Add an <strong>End Queue</strong> to collect finished products</li>
          <li>Use <strong>"Connect Nodes"</strong> to link them</li>
          <li>Click <strong>Start</strong> to begin simulation</li>
        </ol>
        <p class="tip">💡 Drag nodes to reposition | Right-click to delete</p>
      </div>

      <!-- Legend -->
      <div class="legend" *ngIf="queues.length > 0 || machines.length > 0">
        <div class="legend-item">
          <div class="legend-color" style="background: #10b981"></div>
          <span>Start Queue</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #3b82f6"></div>
          <span>Normal Queue</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #f59e0b"></div>
          <span>End Queue</span>
        </div>
        <div class="legend-item">
          <div class="legend-color circle" style="background: #94a3b8"></div>
          <span>Machine</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      flex: 1;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .canvas-wrapper {
      width: 100%;
      height: 100%;
      background: #f1f5f9;
      position: relative;
      overflow: hidden;
    }

    .canvas-svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .node {
      cursor: move;
    }

    /* Queue Styles */
    .queue-rect {
      transition: all 0.2s;
    }

    .queue-rect:hover {
      filter: brightness(1.1);
    }

    .queue-rect.selected {
      stroke: #3b82f6;
      stroke-width: 3;
    }

    .queue-rect.connecting {
      stroke: #10b981;
      stroke-width: 3;
      stroke-dasharray: 5,5;
      animation: dash 1s linear infinite;
    }

    /* Machine Styles */
    .machine-circle {
      transition: all 0.2s;
    }

    .machine-circle:hover {
      filter: brightness(1.1);
    }

    .machine-circle.selected {
      stroke: #3b82f6;
      stroke-width: 3;
    }

    .machine-circle.connecting {
      stroke: #10b981;
      stroke-width: 3;
      stroke-dasharray: 5,5;
      animation: dash 1s linear infinite;
    }

    .machine-circle.processing {
      animation: pulse 1s ease-in-out infinite;
    }

    .machine-circle.flashing {
      animation: flash 0.3s ease-in-out;
    }

    @keyframes dash {
      to {
        stroke-dashoffset: -10;
      }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    @keyframes flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* Text Styles */
    .node-label {
      fill: white;
      font-weight: 600;
      font-size: 14px;
      pointer-events: none;
    }

    .node-count, .node-time {
      fill: white;
      font-size: 12px;
      pointer-events: none;
    }

    .node-id {
      fill: #64748b;
      font-size: 10px;
      pointer-events: none;
    }

    /* Connection Styles */
    .connection-line {
      pointer-events: stroke;
      cursor: pointer;
    }

    .connection-line:hover {
      stroke: #3b82f6;
      stroke-width: 3;
    }

    /* Instructions */
    .instructions {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      max-width: 500px;
      z-index: 100;
    }

    .instructions h3 {
      margin-top: 0;
      color: #1e293b;
    }

    .instructions ol {
      color: #475569;
      line-height: 1.8;
    }

    .instructions strong {
      color: #1e293b;
    }

    .tip {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #f1f5f9;
      border-radius: 6px;
      color: #64748b;
      font-size: 0.9rem;
    }

    /* Legend */
    .legend {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 100;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      color: #475569;
    }

    .legend-item:last-child {
      margin-bottom: 0;
    }

    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .legend-color.circle {
      border-radius: 50%;
    }
  `]
})
export class CanvasComponent {
  @Input() queues: Queue[] = [];
  @Input() machines: Machine[] = [];
  @Input() connections: Connection[] = [];
  @Input() isRunning = false;
  @Input() isConnecting = false;
  @Input() connectingFromId: string | null = null;
  @Input() selectedNodeId: string | null = null;
  @Input() tempLineEnd: {x: number, y: number} | null = null;

  @Output() nodeMouseDown = new EventEmitter<{event: MouseEvent, id: string, type: 'queue' | 'machine'}>();
  @Output() nodeClick = new EventEmitter<{event: MouseEvent, id: string, type: 'queue' | 'machine'}>();
  @Output() canvasClick = new EventEmitter<MouseEvent>();
  @Output() canvasRightClick = new EventEmitter<MouseEvent>();
  @Output() mouseMove = new EventEmitter<MouseEvent>();

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseMove.emit(event);
  }

  trackById(index: number, item: any): string {
    return item.id;
  }

  onNodeMouseDown(event: MouseEvent, id: string, type: 'queue' | 'machine') {
    event.stopPropagation();
    this.nodeMouseDown.emit({ event, id, type });
  }

  onNodeClick(event: MouseEvent, id: string, type: 'queue' | 'machine') {
    event.stopPropagation();
    this.nodeClick.emit({ event, id, type });
  }

  onCanvasClick(event: MouseEvent) {
    this.canvasClick.emit(event);
  }

  onCanvasRightClick(event: MouseEvent) {
    this.canvasRightClick.emit(event);
  }

  getQueueColor(type: string): string {
    switch(type) {
      case 'start': return '#10b981';
      case 'end': return '#f59e0b';
      default: return '#3b82f6';
    }
  }

  getTempLineStart(): {x: number, y: number} {
    if (this.connectingFromId) {
      const queue = this.queues.find(q => q.id === this.connectingFromId);
      if (queue) return { x: queue.x, y: queue.y };
      
      const machine = this.machines.find(m => m.id === this.connectingFromId);
      if (machine) return { x: machine.x, y: machine.y };
    }
    return { x: 0, y: 0 };
  }

  getConnectionPath(conn: Connection): string {
    const source = this.findNode(conn.sourceId);
    const target = this.findNode(conn.targetId);
    
    if (source && target) {
      return this.getArrowPath(source.x, source.y, target.x, target.y);
    }
    return '';
  }

  private findNode(id: string): {x: number, y: number} | null {
    const queue = this.queues.find(q => q.id === id);
    if (queue) return { x: queue.x, y: queue.y };
    
    const machine = this.machines.find(m => m.id === id);
    if (machine) return { x: machine.x, y: machine.y };
    
    return null;
  }

  private getArrowPath(sourceX: number, sourceY: number, targetX: number, targetY: number): string {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const shortenBy = 30;
    const ratio = (distance - shortenBy) / distance;
    
    const endX = sourceX + dx * ratio;
    const endY = sourceY + dy * ratio;
    
    return `M ${sourceX} ${sourceY} L ${endX} ${endY}`;
  }
}