// import { Component, Input, Output, EventEmitter } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Machine } from '../../models/simulation.models';
// // import { Machine } from '../../models';

// @Component({
//   selector: '[app-machine-node]',  // ⚠️ مهم! استخدم attribute selector
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <circle r="35" 
//             [attr.fill]="machine.currentColor"
//             [class.processing]="machine.isProcessing"
//             [class.flashing]="machine.isFlashing"
//             [class.selected]="isSelected"
//             [class.connecting]="isConnectingFrom"
//             class="machine-circle"
//     />
//     <text y="-5" text-anchor="middle" class="node-label">M</text>
//     <text y="10" text-anchor="middle" class="node-time">
//       {{ machine.serviceTime }}ms
//     </text>
//     <text y="50" text-anchor="middle" class="node-id">
//       {{ machine.id.substring(0, 8) }}
//     </text>
//   `,
//   styles: [`
//     .machine-circle {
//       cursor: move;
//       transition: all 0.2s;
//     }

//     .machine-circle:hover {
//       filter: brightness(1.1);
//     }

//     .machine-circle.selected {
//       stroke: #3b82f6;
//       stroke-width: 3;
//     }

//     .machine-circle.connecting {
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

//     .machine-circle.processing {
//       animation: pulse 1s ease-in-out infinite;
//     }

//     .machine-circle.flashing {
//       animation: flash 0.3s ease-in-out;
//     }

//     @keyframes pulse {
//       0%, 100% { transform: scale(1); }
//       50% { transform: scale(1.1); }
//     }

//     @keyframes flash {
//       0%, 100% { opacity: 1; }
//       50% { opacity: 0.3; }
//     }

//     .node-label, .node-time {
//       fill: white;
//       font-weight: 600;
//       font-size: 14px;
//       pointer-events: none;
//     }

//     .node-time {
//       font-size: 12px;
//     }

//     .node-id {
//       fill: #64748b;
//       font-size: 10px;
//       pointer-events: none;
//     }
//   `]
// })
// export class MachineNodeComponent {
//   @Input() machine!: Machine;
//   @Input() isSelected = false;
//   @Input() isConnectingFrom = false;
  
//   @Output() mouseDown = new EventEmitter<MouseEvent>();
//   @Output() nodeClick = new EventEmitter<MouseEvent>();

//   onMouseDown(event: MouseEvent) {
//     event.stopPropagation();
//     this.mouseDown.emit(event);
//   }

//   onClick(event: MouseEvent) {
//     event.stopPropagation();
//     this.nodeClick.emit(event);
//   }
// }