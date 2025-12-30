// import { Component, Input, Output, EventEmitter } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Queue } from '../../models/simulation.models';

// @Component({
//   selector: '[app-queue-node]',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <svg:g
//       [attr.transform]="'translate(' + queue.x + ',' + queue.y + ')'"
//       (mousedown)="onMouseDown($event)"
//       (click)="onClick($event)"
//       class="node queue-node"
//     >
//       <svg:rect
//         x="-40"
//         y="-30"
//         width="80"
//         height="60"
//         rx="5"
//         [attr.fill]="getQueueColor()"
//         [class.selected]="isSelected"
//         [class.connecting]="isConnectingFrom"
//       ></svg:rect>

//       <svg:text y="-10" text-anchor="middle" class="node-label">
//         {{ queue.type === 'start' ? '▶ Start' : queue.type === 'end' ? '⏹ End' : 'Queue' }}
//       </svg:text>

//       <svg:text y="10" text-anchor="middle" class="node-count">
//         {{ queue.productCount }} items
//       </svg:text>

//       <svg:text y="25" text-anchor="middle" class="node-id">
//         {{ queue.id.substring(0, 8) }}
//       </svg:text>
//     </svg:g>
//   `,
//   styles: [`
//     .node {
//       cursor: move;
//       transition: all 0.2s;
//     }

//     .node:hover {
//       filter: brightness(1.1);
//     }

//     .node.selected rect {
//       stroke: #3b82f6;
//       stroke-width: 3;
//     }

//     .node.connecting rect {
//       stroke: #10b981;
//       stroke-width: 3;
//       stroke-dasharray: 5,5;
//       animation: dash 1s linear infinite;
//     }

//     @keyframes dash {
//       to {
//         stroke-dashoffset: -10;
//       }
//     }

//     .node-label {
//       fill: white;
//       font-weight: 600;
//       font-size: 14px;
//       pointer-events: none;
//     }

//     .node-count {
//       fill: white;
//       font-size: 12px;
//       pointer-events: none;
//     }

//     .node-id {
//       fill: #64748b;
//       font-size: 10px;
//       pointer-events: none;
//     }
//   `]
// })
// export class QueueNodeComponent {
//   @Input() queue!: Queue;
//   @Input() isSelected = false;
//   @Input() isConnectingFrom = false;

//   @Output() mouseDown = new EventEmitter<MouseEvent>();
//   @Output() nodeClick = new EventEmitter<MouseEvent>();

//   onMouseDown(event: MouseEvent) {
//     this.mouseDown.emit(event);
//   }

//   onClick(event: MouseEvent) {
//     this.nodeClick.emit(event);
//   }

//   getQueueColor(): string {
//     switch (this.queue.type) {
//       case 'start': return '#10b981';
//       case 'end': return '#f59e0b';
//       default: return '#3b82f6';
//     }
//   }
// }
