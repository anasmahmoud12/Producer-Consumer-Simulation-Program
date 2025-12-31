import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Queue, Machine, Connection, SimulationState } from '../models/simulation.models';
// import { Queue, Machine, Connection, SimulationState } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private apiUrl = 'http://localhost:8080/api/simulation';

  constructor(private http: HttpClient) {}

 startSimulation(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/start`, null);
  }

  pauseSimulation(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/pause`, null);
  }

 
  resumeSimulation(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/resume`, null);
  }

  resetSimulation(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset`, null);
  }

  getCurrentState(): Observable<SimulationState> {
    return this.http.get<SimulationState>(`${this.apiUrl}/state`);
  }

  getReplaySnapshots(): Observable<SimulationState[]> {
        console.log('make',this.http.get<SimulationState[]>(`${this.apiUrl}/replay`))

    return this.http.get<SimulationState[]>(`${this.apiUrl}/replay`);
  }








// startSimulation(): Observable<void> {
//     return this.http.post<void>(`${this.apiUrl}/start`, null);
//   }

  // pauseSimulation(): Observable<void> {
  //   return this.http.post<void>(`${this.apiUrl}/pause`, null);
  // }

  // ✅ Resume method جديد
  // resumeSimulation(): Observable<void> {
  //   return this.http.post<void>(`${this.apiUrl}/resume`, null);
  // }

  // resetSimulation(): Observable<void> {
  //   return this.http.post<void>(`${this.apiUrl}/reset`, null);
  // }

  // getCurrentState(): Observable<SimulationState> {
  //   return this.http.get<SimulationState>(`${this.apiUrl}/state`);
  // }

  // getReplaySnapshots(): Observable<SimulationState[]> {
  //   return this.http.get<SimulationState[]>(`${this.apiUrl}/replay`);
  // }




  // Queue operations
  addQueue(type: string, x: number, y: number): Observable<Queue> {
    const params = new HttpParams()
      .set('type', type)
      .set('x', x.toString())
      .set('y', y.toString());
    return this.http.post<Queue>(`${this.apiUrl}/queue`, null, { params });
  }

  deleteQueue(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/queue/${id}`);
  }

  updateQueuePosition(id: string, x: number, y: number): Observable<void> {
    const params = new HttpParams()
      .set('x', x.toString())
      .set('y', y.toString());
    return this.http.put<void>(`${this.apiUrl}/queue/${id}/position`, null, { params });
  }

  // Machine operations
  addMachine(serviceTime: number, x: number, y: number): Observable<Machine> {
    const params = new HttpParams()
      .set('serviceTime', serviceTime.toString())
      .set('x', x.toString())
      .set('y', y.toString());
    return this.http.post<Machine>(`${this.apiUrl}/machine`, null, { params });
  }

  deleteMachine(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/machine/${id}`);
  }

  updateMachinePosition(id: string, x: number, y: number): Observable<void> {
    const params = new HttpParams()
      .set('x', x.toString())
      .set('y', y.toString());
    return this.http.put<void>(`${this.apiUrl}/machine/${id}/position`, null, { params });
  }

  // Connection operations
  addConnection(sourceId: string, targetId: string): Observable<Connection> {
    const params = new HttpParams()
      .set('sourceId', sourceId)
      .set('targetId', targetId);
    return this.http.post<Connection>(`${this.apiUrl}/connection`, null, { params });
  }

  deleteConnection(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/connection/${id}`);
  }

  // Simulation control
  // startSimulation(): Observable<void> {
  //   return this.http.post<void>(`${this.apiUrl}/start`, null);
  // }

  // pauseSimulation(): Observable<void> {
  //   return this.http.post<void>(`${this.apiUrl}/pause`, null);
  // }

  // resetSimulation(): Observable<void> {
  //   return this.http.post<void>(`${this.apiUrl}/reset`, null);
  // }

  // State
  // getCurrentState(): Observable<SimulationState> {
  //   return this.http.get<SimulationState>(`${this.apiUrl}/state`);
  // }

  // getReplaySnapshots(): Observable<SimulationState[]> {
  //   return this.http.get<SimulationState[]>(`${this.apiUrl}/replay`);
  // }
}