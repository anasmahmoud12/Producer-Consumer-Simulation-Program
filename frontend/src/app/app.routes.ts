import { Routes } from '@angular/router';
import { SimulationComponent } from './components/simulation/simulation.component';

export const routes: Routes = [
  { path: '', component: SimulationComponent },
  { path: '**', redirectTo: '' }
];