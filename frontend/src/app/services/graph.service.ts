import { Injectable } from '@angular/core';
import { Queue, Machine } from '../models/simulation.models';
// import { Queue, Machine, Connection } from '../models';

export interface GraphNode {
  id: string;
  type: 'queue' | 'machine';
  x: number;
  y: number;
  data: Queue | Machine;
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  
  // Calculate arrow path for connection
  getArrowPath(sourceX: number, sourceY: number, targetX: number, targetY: number): string {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Shorten the line to not overlap with nodes
    const shortenBy = 30;
    const ratio = (distance - shortenBy) / distance;
    
    const endX = sourceX + dx * ratio;
    const endY = sourceY + dy * ratio;
    
    return `M ${sourceX} ${sourceY} L ${endX} ${endY}`;
  }

  // Calculate arrow head points
  getArrowHeadPoints(sourceX: number, sourceY: number, targetX: number, targetY: number): string {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const angle = Math.atan2(dy, dx);
    
    const arrowSize = 10;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const shortenBy = 30;
    const ratio = (distance - shortenBy) / distance;
    
    const tipX = sourceX + dx * ratio;
    const tipY = sourceY + dy * ratio;
    
    const point1X = tipX - arrowSize * Math.cos(angle - Math.PI / 6);
    const point1Y = tipY - arrowSize * Math.sin(angle - Math.PI / 6);
    
    const point2X = tipX - arrowSize * Math.cos(angle + Math.PI / 6);
    const point2Y = tipY - arrowSize * Math.sin(angle + Math.PI / 6);
    
    return `${tipX},${tipY} ${point1X},${point1Y} ${point2X},${point2Y}`;
  }

  // Find node by ID
  findNode(nodes: GraphNode[], id: string): GraphNode | undefined {
    return nodes.find(n => n.id === id);
  }
}