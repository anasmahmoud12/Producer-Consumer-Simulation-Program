import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-panel',
  imports: [FormsModule,CommonModule],
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.css'
})
export class SettingsPanelComponent {
  @Input() simulationSpeed: number = 1;
  @Input() productionRate: number = 2000;
  @Input() disabled: boolean = false;
  
  @Output() simulationSpeedChange = new EventEmitter<number>();
  @Output() productionRateChange = new EventEmitter<number>();
  @Output() close = new EventEmitter<void>();
  
  onSimulationSpeedChange(value: number): void {
    this.simulationSpeed = value;
    this.simulationSpeedChange.emit(value);
  }
  
  onProductionRateChange(value: number): void {
    this.productionRate = value;
    this.productionRateChange.emit(value);
  }
  
  onClose(): void {
    this.close.emit();
  }
}