// src/app/pages/home/home.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AdminStore } from '../../stores/admin.store';
import { Cliennts } from './sections/cliennts/cliennts';
import { UsersService, UserRow } from '../../services/users.service';
import { Proveedores } from './sections/proveedores/proveedores';
import { DashboardStore } from '../../stores/dashboard.store';
import { Dashboard } from './sections/dashboard/dashboard';
import { Sidebar } from './sidebar/sidebar';
import { CategoriesComponent } from './sections/categories/categories';
import { SettingsComponent } from './sections/settings/settings';

// tipado del menú que usa el store
type Option =
  | 'dashboard'
  | 'clientes'
  | 'prestadores'
  | 'solicitudes'
  | 'finanzas'
  | 'notificaciones'
  | 'ajustes'
  | 'categorias'
  | 'settings';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    Sidebar,
    CommonModule,
    Dashboard,
    Cliennts,
    CategoriesComponent,
    SettingsComponent,
    Proveedores],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  constructor() {
    // this.store.setOption('dashboard')
  }

  // == estado centralizado ==
  store = inject(AdminStore);

  // servicios
  private usersSvc = inject(UsersService);

// src/app/pages/home/home.ts
ngOnInit() {
  this.store.forceDashboard();  // siempre abre en dashboard
  // si quieres mantener la búsqueda: this.store.forceDashboard(true)
}



  // navegación desde el menú
  setOption(opt: Option) {
    this.store.setOption(opt);
  }

  // acción de aprobación/denegación de prestador
  async confirmProviderDecision(p: UserRow) {
    const result = await Swal.fire({
      title: 'Revisión de prestador',
      html: `<div style="text-align:left">
              <b>Nombre:</b> ${p.name || '(sin nombre)'}<br>
              <b>Email:</b> ${p.email || '(oculto)'}<br>
              <b>Teléfono:</b> ${p.phone || '—'}
            </div>`,
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      denyButtonText: 'Denegar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!result.isConfirmed && !result.isDenied) return;

    const approve = result.isConfirmed;

    this.store.loading.set(true);
    try {
      await this.usersSvc.updateUserStatus(p.id, approve);

      // refresco local del array en el store
      const updated = this.store.providers().map(u =>
        u.id === p.id ? { ...u, status: (approve ? 'active' : 'inactive') as any } : u
      );
      this.store.providers.set(updated);

      await Swal.fire({
        icon: 'success',
        title: approve ? 'Prestador aprobado' : 'Prestador denegado',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar.' });
    } finally {
      this.store.loading.set(false);
    }
  }
}
