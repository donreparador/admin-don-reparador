// src/app/pages/home/sections/categories/categories.ts
import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { CategoriesService, CategoryRecord } from '../../../../services/categories.service';
import { RealtimeCategoriesService } from '../../../../services/realtime-categories.servide';

type SubItem = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  active?: boolean;
  order?: number;
};

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
})
export class CategoriesComponent implements OnDestroy, OnInit {
  private categoriesSrv = inject(CategoriesService);
  rt = inject(RealtimeCategoriesService);

  // form state
  name = signal<string>('');
  order = signal<number>(1);
  active = signal<boolean>(true);
  imageFile?: File;

  loading = signal<boolean>(false);
  error?: string;
  async removeSub(c: CategoryRecord, index: number, sc: any) {
    const result = await Swal.fire({
      title: '¿Eliminar subcategoría?',
      text: `Se eliminará "${sc.name}" de ${c.name}`,
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
      // quitamos el sub de la lista en memoria
      const newSubs = [...(c.subs ?? [])];
      newSubs.splice(index, 1);
  
      // guardamos en DB
      await this.categoriesSrv.update(c.id, { subs: newSubs });
  
      Swal.fire({
        icon: 'success',
        title: 'Eliminada',
        text: `La subcategoría "${sc.name}" fue eliminada.`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e?.message || 'No se pudo eliminar la subcategoría'
      });
    }
  }
  
  // ---------- Subcategorías embebidas (JSON) ----------
  /** CRUD de `c.subs` (JSON) */
  async openSubs(cat: CategoryRecord) {
    const genId = () => {
      // id corto estable; si no hay crypto, usa timestamp
      try { return crypto.randomUUID(); } catch { return 'sub-' + Date.now().toString(36); }
    };

    let items: SubItem[] = Array.isArray((cat as any).subs) ? structuredClone((cat as any).subs) : [];

    const render = () => `
      <div class="text-start">
        <div class="mb-2">
          <small class="text-muted">Categoría:</small> <b>${cat.name}</b>
        </div>

        <div class="border rounded p-2" style="max-height:45vh;overflow:auto">
          ${
            items.length === 0
              ? `<div class="text-muted">Sin subcategorías aún.</div>`
              : `
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th style="width:30%">Nombre</th>
                  <th style="width:22%">Slug</th>
                  <th style="width:12%">Orden</th>
                  <th style="width:12%">Activo</th>
                  <th style="width:24%"></th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (i) => `
                  <tr data-id="${i.id}">
                    <td><input class="form-control form-control-sm sc-name" value="${i.name || ''}"></td>
                    <td><input class="form-control form-control-sm sc-slug" value="${i.slug || ''}"></td>
                    <td><input type="number" class="form-control form-control-sm sc-order" value="${Number(i.order ?? 0)}"></td>
                    <td class="text-center">
                      <input type="checkbox" class="form-check-input sc-active" ${i.active !== false ? 'checked' : ''}>
                    </td>
                    <td class="text-end">
                      <button type="button" class="btn btn-sm btn-outline-secondary me-1 sc-save">Guardar</button>
                      <button type="button" class="btn btn-sm btn-outline-danger sc-del">Eliminar</button>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
          }
        </div>

        <hr class="my-2" />
        <div class="row g-2">
          <div class="col-4"><input id="sc-new-name"  class="form-control form-control-sm" placeholder="Nombre"></div>
          <div class="col-4"><input id="sc-new-slug"  class="form-control form-control-sm" placeholder="slug-ejemplo"></div>
          <div class="col-2"><input id="sc-new-order" type="number" class="form-control form-control-sm" placeholder="0"></div>
          <div class="col-2 d-flex align-items-center gap-2">
            <input id="sc-new-active" type="checkbox" class="form-check-input" checked>
            <button id="sc-btn-add" type="button" class="btn btn-sm btn-primary w-100">Agregar</button>
          </div>
        </div>
      </div>
    `;

    await Swal.fire({
      title: 'Subcategorías',
      width: 900,
      html: render(),
      showCancelButton: true,
      showConfirmButton: false,
      didOpen: () => {
        const root = Swal.getHtmlContainer()!;

        // Agregar
        root.querySelector('#sc-btn-add')?.addEventListener('click', async () => {
          const name  = (root.querySelector('#sc-new-name')  as HTMLInputElement).value.trim();
          const slug  = (root.querySelector('#sc-new-slug')  as HTMLInputElement).value.trim();
          const order = Number((root.querySelector('#sc-new-order') as HTMLInputElement).value || 0);
          const active= (root.querySelector('#sc-new-active') as HTMLInputElement).checked;

          if (!name) { Swal.showValidationMessage('Nombre requerido'); return; }

          items.push({ id: genId(), name, slug, order, active });
          try {
            await this.categoriesSrv.update(cat.id, { subs: items });
            Swal.update({ html: render() });
          } catch (e: any) {
            Swal.fire({ icon: 'error', title: 'No se pudo agregar', text: e?.message || 'Error desconocido' });
          }
        });

        // Guardar / Eliminar fila (delegación)
        root.addEventListener('click', async (ev: Event) => {
          const target = ev.target as HTMLElement;
          const row = target.closest('tr[data-id]') as HTMLTableRowElement | null;
          if (!row) return;
          const id = row.getAttribute('data-id')!;

          if (target.classList.contains('sc-save')) {
            const name   = (row.querySelector('.sc-name')   as HTMLInputElement).value.trim();
            const slug   = (row.querySelector('.sc-slug')   as HTMLInputElement).value.trim();
            const order  = Number((row.querySelector('.sc-order')  as HTMLInputElement).value || 0);
            const active = (row.querySelector('.sc-active') as HTMLInputElement).checked;

            if (!name) { Swal.showValidationMessage('Nombre requerido'); return; }

            items = items.map(s => s.id === id ? { ...s, name, slug, order, active } : s);
            try {
              await this.categoriesSrv.update(cat.id, { subs: items });
              Swal.update({ html: render() });
            } catch (e: any) {
              Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: e?.message || 'Error desconocido' });
            }
          }

          if (target.classList.contains('sc-del')) {
            const ok = await Swal.fire({
              icon: 'warning',
              title: 'Eliminar subcategoría',
              text: 'Esta acción no se puede deshacer',
              showCancelButton: true,
              confirmButtonText: 'Sí, eliminar',
            });
            if (!ok.isConfirmed) return;

            items = items.filter(s => s.id !== id);
            try {
              await this.categoriesSrv.update(cat.id, { subs: items });
              Swal.update({ html: render() });
            } catch (e: any) {
              Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: e?.message || 'Error desconocido' });
            }
          }
        });
      },
    });
  }
  // ---------- /Subcategorías embebidas ----------

  /** Diálogo crear categoría */
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
        const nameEl   = document.getElementById('swal-name')  as HTMLInputElement;
        const orderEl  = document.getElementById('swal-order') as HTMLInputElement;
        const activeEl = document.getElementById('swal-active') as HTMLInputElement;
        const fileEl   = document.getElementById('swal-image') as HTMLInputElement;

        const name   = (nameEl?.value || '').trim();
        const order  = Number(orderEl?.value ?? 0);
        const active = !!activeEl?.checked;
        const file   = fileEl?.files?.[0] ?? null;

        if (!name) { Swal.showValidationMessage('El nombre es obligatorio'); return; }
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
        subs: [] as SubItem[], // iniciar vacío
      });
      Swal.fire({ icon: 'success', title: 'Creada', timer: 1200, showConfirmButton: false });

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
        subs: [] as SubItem[],
      });
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
      html: `Se eliminará la categoría <b>${c.name}</b>.<br>Esta acción no se puede deshacer.`,
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
      Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1500, showConfirmButton: false });
    } catch (e: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: e?.message || 'No se pudo eliminar la categoría' });
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
