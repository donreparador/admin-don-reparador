// src/app/stores/dashboard.store.ts
import { Injectable, signal } from '@angular/core';
import { DashboardService, NotificationItem } from '../services/dashboard.service';

export interface AreaStacked {
  series: { name: string; data: number[] }[];
  categories: string[]; // YYYY-MM-DD o timestamps ISO
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  readonly loading = signal(false);

  readonly chart = signal<AreaStacked>({
    series: [
      { name: 'Pendiente',    data: [20,18,22,25,30,28,26] },
      { name: 'Asignado',     data: [10,15,14,20,18,22,25] },
      { name: 'En ejecución', data: [ 5, 8,10,12,15,17,20] },
      { name: 'Finalizado',   data: [ 2, 5, 8,12,18,25,30] },
      { name: 'Cancelado',    data: [ 1, 2, 3, 2, 4, 3, 2] }
    ],
    categories: [
      '2025-09-14','2025-09-15','2025-09-16',
      '2025-09-17','2025-09-18','2025-09-19','2025-09-20'
    ]
  });

  readonly notifications = signal<NotificationItem[]>([]);

  private rtHandle: any; // interval id
  private windowSize = 30; // puntos visibles en ventana (ej. 30 ticks)

  constructor(private api: DashboardService) {}

  async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      // const chart = await this.api.fetchChartByStatus(7);
      // if (chart) this.setChart(chart);

      const notif = await this.api.fetchNotifications(10);
      this.notifications.set(notif);
    } finally {
      this.loading.set(false);
    }
  }

  setChart(chart: AreaStacked): void {
    this.chart.set(chart);
  }

  markRead(id: string): void {
    this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }

  pushRealtime(n: NotificationItem): void {
    this.notifications.update(list => [n, ...list].slice(0, 20));
  }

  /** ====== REALTIME DEMO (simulación o hook a backend) ====== */

  /** Arranca la simulación/flujo realtime (1 punto nuevo cada `intervalMs`). */
// src/app/stores/dashboard.store.ts
startRealtime(intervalMs = 1500) {
    this.stopRealtime();
    this.rtHandle = setInterval(() => {
      const cur = this.chart();
      if (!cur?.series?.length) return;
  
      const nowIso = new Date().toISOString();
      const nextSeries = cur.series.map(s => {
        const last = s.data[s.data.length - 1] ?? 0;
        const delta = Math.round((Math.random() - 0.4) * 4);
        const val = Math.max(0, last + delta);
        return { name: s.name, data: [...s.data, val] };
      });
  
      const cats = [...cur.categories, nowIso];
      const cut = Math.max(0, cats.length - this.windowSize);
  
      // evitar actualización mientras el DOM no está listo
      queueMicrotask(() => {
        this.chart.set({
          series: nextSeries.map(s => ({ name: s.name, data: s.data.slice(cut) })),
          categories: cats.slice(cut),
        });
      });
    }, intervalMs);
  }
  

  /** Para el flujo realtime. */
  stopRealtime() {
    if (this.rtHandle) {
      clearInterval(this.rtHandle);
      this.rtHandle = null;
    }
  }

  /**
   * Si conectas WebSocket/EventSource:
   * Llama a appendPoint(timestampISO, values[]) cuando llegue un tick.
   */
  appendPoint(timestampIso: string, values: number[]) {
    const cur = this.chart();
    const nextSeries = cur.series.map((s, i) => ({
      name: s.name,
      data: [...s.data, values[i] ?? 0]
    }));
    const nextCats = [...cur.categories, timestampIso];

    const cut = Math.max(0, nextCats.length - this.windowSize);
    this.chart.set({
      series: nextSeries.map(s => ({ name: s.name, data: s.data.slice(cut) })),
      categories: nextCats.slice(cut)
    });
  }
}
