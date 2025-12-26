import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationStatistics } from '../../models/simulation.models';

@Component({
  selector: 'app-statistics-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics-panel.component.html',
  styleUrls: ['./statistics-panel.component.css']
})
export class StatisticsPanelComponent implements OnChanges {
  @Input() statistics: SimulationStatistics | null = null;
  @Output() close = new EventEmitter<void>();
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['statistics'] && this.statistics) {
      console.log('Statistics updated:', this.statistics);
    }
  }
  
  getMachineUtilizationArray(): Array<{id: string, utilization: number}> {
    if (!this.statistics) return [];
    
    return Object.entries(this.statistics.machineUtilization).map(([id, util]) => ({
      id,
      utilization: util
    }));
  }
  
  getProcessedCountArray(): Array<{id: string, count: number}> {
    if (!this.statistics) return [];
    
    return Object.entries(this.statistics.machineProcessedCount).map(([id, count]) => ({
      id,
      count
    }));
  }
  
  formatTime(ms: number): string {
    return (ms / 1000).toFixed(2) + 's';
  }
  
  onClose(): void {
    this.close.emit();
  }
}