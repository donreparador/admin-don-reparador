// src/app/pages/home/sections/proveedores/proveedores.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AdminStore } from '../../../../stores/admin.store';
import { UsersService, UserRow } from '../../../../services/users.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.scss'
})
export class Proveedores {
  // Store (estado compartido)
  store = inject(AdminStore);
  // Servicio para actualizar estado del prestador
  private usersSvc = inject(UsersService);

  ngOnInit() {
    // Deja marcada la opción y carga si no hay datos
    this.store.setOption('dashboard');
    if (this.store.providers().length === 0) {
      this.store.loadProviders();
    }
  }

  // Paginación
  goToPage(p: number) {
    this.store.goToPage(p);
  }

  // trackBy estable
  trackById = this.store.trackById.bind(this.store);

  // Aprobación / denegación con confirmación
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

      // Refresca en memoria la lista del store
      const updated = this.store.providers().map(u =>
        u.id === p.id ? { ...u, status: (approve ? 'active' : 'inactive') as 'active' | 'inactive' } : u
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
