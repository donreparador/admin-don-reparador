import { Injectable } from '@angular/core';

export type StatusKey = 'pendiente'|'asignado'|'en_ejecucion'|'finalizado'|'cancelado';

export interface ChartPoint { x: string; y: number; } // x = ISO date
export interface ChartSeries { name: string; data: number[]; categories: string[]; }

export interface NotificationItem {
  id: string;
  icon: string;     // clase FA: 'far fa-wallet'
  text: string;     // mensaje amigable
  timeAgo: string;  // 'hace 2 min'
  read?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  // TODO: reemplaza mocks por llamadas HTTP / PocketBase
  async fetchRequestsByStatus(rangeDays = 7): Promise<ChartSeries> {
    const categories = [...Array(rangeDays)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (rangeDays - 1 - i));
      return d.toISOString().substring(0, 10); // 'YYYY-MM-DD'
    });
    // ejemplo: suma acumulada por estado → conviértelo a stacked
    const pendiente    = [20,18,22,25,30,28,26];
    const asignado     = [10,15,14,20,18,22,25];
    const en_ejecucion = [ 5, 8,10,12,15,17,20];
    const finalizado   = [ 2, 5, 8,12,18,25,30];
    const cancelado    = [ 1, 2, 3, 2, 4, 3, 2];
    // Compacto en una sola estructura para simplificar el store
    return { name: 'byStatus', data:  [], categories,
      // NOTA: el store expandirá esto a las 5 series
    } as any;
  }

  async fetchNotifications(limit = 10): Promise<NotificationItem[]> {
    return [
      { id:'n1', icon:'far fa-clipboard-list', text:'Nueva solicitud de Plomería creada por Juan Pérez.', timeAgo:'hace 2 min' },
      { id:'n2', icon:'far fa-user-check',     text:'Prestador María López completó verificación KYC.',   timeAgo:'hace 30 min' },
      { id:'n3', icon:'far fa-wallet',         text:'Recarga IZIPAY de $50 aprobada para Carlos Gómez.',  timeAgo:'hace 3 horas' },
      { id:'n4', icon:'far fa-check-circle',   text:'Solicitud #SRV-1042 ha sido Finalizada.',            timeAgo:'ayer' }
    ];
  }
}
