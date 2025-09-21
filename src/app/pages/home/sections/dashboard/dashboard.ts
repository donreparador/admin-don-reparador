import { Component, inject, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardChart } from './chart/dashboard-chart';
import { DashboardNotifications } from './notifications/dashboard-notifications';
import { DashboardStore } from '../../../../stores/dashboard.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, 
    DashboardChart, 
    DashboardNotifications],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit, OnDestroy {
  store = inject(DashboardStore);

  // >>> propiedades que usa el template <<<
  resumen = {
    pendientes: 18,
    asignadas : 26,
    recargas  : 4250,
  };

  solicitudes = [
    { id: '01', cliente: 'Juan Pérez',      servicio: 'Plomería / Reparación de fuga',      fecha: '20 Sep 2025', estado: 'Pendiente',   badge: 'badge-warning' },
    { id: '02', cliente: 'María López',     servicio: 'Electricidad / Cambio de breaker',   fecha: '19 Sep 2025', estado: 'Asignado',    badge: 'badge-info' },
    { id: '03', cliente: 'Carlos Gómez',    servicio: 'Pintura / Mantenimiento fachada',    fecha: '18 Sep 2025', estado: 'Finalizado',  badge: 'badge-success' },
    { id: '04', cliente: 'Laura Rodríguez', servicio: 'Carpintería / Instalación de puertas',fecha: '18 Sep 2025', estado: 'En ejecución',badge: 'badge-primary' },
    { id: '05', cliente: 'Pedro Martínez',  servicio: 'Limpieza / Desinfección profunda',   fecha: '17 Sep 2025', estado: 'Cancelado',   badge: 'badge-danger' },
  ];

  async ngOnInit() {
    console.log('[Dashboard] init');
    await this.store.loadAll(); // <-- IMPORTANTE
    console.log('[Dashboard] notifs loaded:', this.store.notifications());
  }
  ngAfterViewInit() {
    // Dale un tick para asegurar que <apx-chart> está en el DOM
    // setTimeout(() => this.store.startRealtime(1500), 0);
  }

  ngOnDestroy() {
    this.store.stopRealtime();
  }

}
