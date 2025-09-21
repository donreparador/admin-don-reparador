// src/app/pages/home/sections/dashboard/chart/dashboard-chart.ts
import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject, effect } from '@angular/core';
import ApexCharts from 'apexcharts';
import { DashboardStore } from '../../../../../stores/dashboard.store';

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  template: `<div #host style="width:100%;height:350px"></div>`
})
export class DashboardChart implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  private chart?: ApexCharts;
  private store = inject(DashboardStore);

  // Reactividad: cuando cambia el signal del store, actualizamos el chart
  private stopEffect = effect(() => {
    const c = this.store.chart();           // <-- lee signal
    if (!this.chart) return;                // si aún no existe, se pintará en ngAfterViewInit
    this.chart.updateOptions({ xaxis: { type: 'datetime', categories: c.categories } }, false, false);
    this.chart.updateSeries(c.series, true);
  });

  async ngAfterViewInit() {
    const c = this.store.chart();
    const options: ApexCharts.ApexOptions = {
      chart: { type:'area', height:350, stacked:true, animations:{enabled:false}, toolbar:{show:false} },
      series: c.series,
      xaxis: { type:'datetime', categories: c.categories },
      dataLabels: { enabled:false },
      stroke: { curve:'smooth', width:2 },
      legend: { position:'top' }
    };
    this.chart = new ApexCharts(this.host.nativeElement, options);
    await this.chart.render();
  }

  ngOnDestroy() {
    this.stopEffect.destroy?.();     // detiene el effect si tu versión lo expone
    this.chart?.destroy();
  }
}
