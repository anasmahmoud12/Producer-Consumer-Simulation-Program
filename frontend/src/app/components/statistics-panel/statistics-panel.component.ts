import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Machine, SimulationStatistics } from '../../models/simulation.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-statistics-panel',
  imports: [FormsModule, CommonModule],
  templateUrl: './statistics-panel.component.html',
  styleUrl: './statistics-panel.component.css'
})
export class StatisticsPanelComponent implements OnInit, OnChanges {
  @Input() statistics: SimulationStatistics | null = null;
  @Input() machines: Machine[] = [];
  @Output() close = new EventEmitter<void>();

  utilizationChart: Chart | null = null;
  throughputChart: Chart | null = null;

  ngOnInit(): void {
    this.initializeCharts();
  }

  ngOnChanges(): void {
    this.updateCharts();
  }

  private initializeCharts(): void {
    const utilizationCtx = document.getElementById('utilizationChart') as HTMLCanvasElement;
    if (utilizationCtx) {
      this.utilizationChart = new Chart(utilizationCtx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Utilization %',
            data: [],
            backgroundColor: 'rgba(59, 130, 246, 0.8)'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
    }

    const throughputCtx = document.getElementById('throughputChart') as HTMLCanvasElement;
    if (throughputCtx) {
      this.throughputChart = new Chart(throughputCtx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Products/Second',
            data: [],
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  private updateCharts(): void {
    if (!this.statistics) return;

    if (this.utilizationChart) {
      const labels = Object.keys(this.statistics.machineUtilization);
      const data = Object.values(this.statistics.machineUtilization);

      this.utilizationChart.data.labels = labels;
      this.utilizationChart.data.datasets[0].data = data;
      this.utilizationChart.update();
    }
  }

 
  getMachineUtilizationArray(): Array<{ id: string; utilization: number }> {
    if (!this.statistics) return [];

    return Object.entries(this.statistics.machineUtilization).map(
      ([id, utilization]) => ({
        id,
        utilization
      })
    );
  }

  formatTime(ms: number): string {
    return (ms / 1000).toFixed(2) + 's';
  }

  onClose(): void {
    this.close.emit();
  }
}
