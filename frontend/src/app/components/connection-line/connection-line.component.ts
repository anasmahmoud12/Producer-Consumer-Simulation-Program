// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Connection, Queue, Machine } from '../../models/simulation.models';

// @Component({
//   selector: 'app-connection-line',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <svg:g>
//       <svg:path
//         [attr.d]="getConnectionPath()"
//         class="connection-line"
//         [attr.stroke]="'#64748b'"
//         [attr.stroke-width]="2"
//         [attr.fill]="'none'"
//         [attr.marker-end]="'url(#arrowhead)'"
//       ></svg:path>
//     </svg:g>
//   `,
//   styles: [`
//     .connection-line {
//       pointer-events: stroke;
//       cursor: pointer;
//     }

//     .connection-line:hover {
//       stroke: #3b82f6;
//       stroke-width: 3;
//     }
//   `]
// })
// export class ConnectionLineComponent {
//   @Input() connection!: Connection;
//   @Input() queues: Queue[] = [];
//   @Input() machines: Machine[] = [];

//   getConnectionPath(): string {
//     if (!this.connection) return '';

//     const source = this.findNode(this.connection.sourceId);
//     const target = this.findNode(this.connection.targetId);

//     if (source && target) {
//       return this.getArrowPath(source.x, source.y, target.x, target.y);
//     }

//     return '';
//   }

//   private findNode(id: string): { x: number; y: number } | null {
//     const queue = this.queues.find(q => q.id === id);
//     if (queue) {
//       return { x: queue.x, y: queue.y };
//     }

//     const machine = this.machines.find(m => m.id === id);
//     if (machine) {
//       return { x: machine.x, y: machine.y };
//     }

//     return null;
//   }

//   private getArrowPath(
//     sourceX: number,
//     sourceY: number,
//     targetX: number,
//     targetY: number
//   ): string {
//     const dx = targetX - sourceX;
//     const dy = targetY - sourceY;
//     const distance = Math.sqrt(dx * dx + dy * dy);

//     if (distance === 0) return '';

//     const shortenBy = 30;
//     const ratio = (distance - shortenBy) / distance;

//     const endX = sourceX + dx * ratio;
//     const endY = sourceY + dy * ratio;

//     return `M ${sourceX} ${sourceY} L ${endX} ${endY}`;
//   }
// }
