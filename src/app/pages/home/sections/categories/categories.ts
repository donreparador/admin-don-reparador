// src/app/pages/home/sections/categories/categories.ts
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { CategoriesService, CategoryRecord } from '../../../../services/categories.service';
import { RealtimeCategoriesService } from '../../../../services/realtime-categories.servide';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
})
export class CategoriesComponent implements OnDestroy {
  private categoriesSrv = inject(CategoriesService);
  rt = inject(RealtimeCategoriesService);

  // form state
  name = signal<string>('');
  order = signal<number>(1);
  active = signal<boolean>(true);
  imageFile?: File;

  loading = signal<boolean>(false);
  error?: string;
// imports arriba

async openCreateDialog() {
  const swalHtml = `
    <div class="text-start">
      <div class="mb-2">
        <label class="form-label">Nombre</label>
        <input id="swal-name" class="form-control" placeholder="Ej. Refrigeración">
      </div>
      <div class="mb-2">
        <label class="form-label">Orden</label>
        <input id="swal-order" type="number" class="form-control" value="${this.order()}">
      </div>
      <div class="form-check mb-2">
        <input id="swal-active" class="form-check-input" type="checkbox" ${this.active() ? 'checked' : ''}>
        <label class="form-check-label" for="swal-active">Activo</label>
      </div>
      <div class="mb-2">
        <label class="form-label">Icono / Imagen</label>
        <input id="swal-image" type="file" class="form-control" accept="image/*">
      </div>
    </div>
  `;

  const { isConfirmed, value } = await Swal.fire({
    title: 'Nueva categoría',
    html: swalHtml,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar',
    width: 600,
    preConfirm: () => {
      const nameEl  = document.getElementById('swal-name')  as HTMLInputElement;
      const orderEl = document.getElementById('swal-order') as HTMLInputElement;
      const activeEl= document.getElementById('swal-active') as HTMLInputElement;
      const fileEl  = document.getElementById('swal-image') as HTMLInputElement;

      const name = (nameEl?.value || '').trim();
      const order = Number(orderEl?.value ?? 0);
      const active = !!activeEl?.checked;
      const file = fileEl?.files?.[0] ?? null;

      if (!name) {
        Swal.showValidationMessage('El nombre es obligatorio');
        return;
      }
      return { name, order, active, file };
    }
  });

  if (!isConfirmed || !value) return;

  this.loading.set(true);
  try {
    await this.categoriesSrv.create({
      name: value.name,
      order: value.order,
      active: value.active,
      imageFile: value.file ?? undefined,
    });
    Swal.fire({ icon: 'success', title: 'Creada', timer: 1200, showConfirmButton: false });

    // recomputar siguiente orden sugerido
    const max = Math.max(0, ...this.rt.items().map(c => c.order ?? 0));
    this.order.set(max + 1);
  } catch (e: any) {
    Swal.fire({ icon: 'error', title: 'Error', text: e?.message || 'No se pudo crear' });
  } finally {
    this.loading.set(false);
  }
}

  async ngOnInit() {
    this.loading.set(true);
    try {
      const { items } = await this.categoriesSrv.list({ perPage: 100, sort: 'order,created' });
      await this.rt.connect(items);
      const max = Math.max(0, ...this.rt.items().map(c => c.order ?? 0));
      this.order.set(max + 1);
    } catch (e: any) {
      this.error = e?.message ?? 'Error cargando categorías';
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() { this.rt.disconnect(); }

  onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.imageFile = f;
  }

  async add() {
    if (!this.name().trim()) return;
    this.loading.set(true);
    try {
      await this.categoriesSrv.create({
        name: this.name().trim(),
        order: this.order(),
        active: this.active(),
        imageFile: this.imageFile,
      });
      // limpiar
      this.name.set('');
      this.imageFile = undefined;
      const max = Math.max(0, ...this.rt.items().map(c => c.order ?? 0));
      this.order.set(max + 1);
      this.active.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleActive(c: CategoryRecord) {
    await this.categoriesSrv.update(c.id, { active: !c.active });
  }

  async quickEdit(c: CategoryRecord, newName: string, newOrder: number) {
    await this.categoriesSrv.update(c.id, {
      name: newName.trim() || c.name,
      order: newOrder,
    });
  }

  async remove(c: CategoryRecord) {
    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      html: `Se eliminará la categoría <b>${c.name}</b>. <br>Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });
  
    if (!result.isConfirmed) return;
  
    try {
      await this.categoriesSrv.remove(c.id);
      Swal.fire({
        icon: 'success',
        title: 'Eliminada',
        text: `La categoría "${c.name}" fue eliminada.`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e?.message || 'No se pudo eliminar la categoría'
      });
    }
  }
  

  list(): CategoryRecord[] {
    return [...this.rt.items()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  imgUrl(c: CategoryRecord): string {
    return this.categoriesSrv.fileUrl(c.expand?.image);
  }

  trackById = (_: number, item: CategoryRecord) => item.id;
}
