import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminStore } from '../../../stores/admin.store';

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
  selector: 'app-sidebar',
  
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar {
  store = inject(AdminStore);

  // navegación desde el menú
  setOption(opt: Option) {
    this.store.setOption(opt);
  }
}
