// src/app/services/categories.service.ts
import { Injectable, inject, signal } from '@angular/core';

// Opción A (solo tipos)
import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';

// Opción B (sin type-only, también válida)
// import PocketBase, { RecordModel } from 'pocketbase';

import { GlobalService } from './global';

/** ===== Tipos base de tus colecciones ===== */

export type ImageRecord = RecordModel & {
  image: string;            // nombre del archivo (campo file en 'images')
  type?: string | null;
  userId?: string | null;
};

export type StoreTypeRecord = RecordModel & {
  name: string;
  // agrega aquí otros campos si existen en 'storeTypes'
};

export type CategoryRecord = RecordModel & {
  name: string;
  /** Relación SINGLE → id de storeTypes */
  types?: string | null;
  /** Relación SINGLE → id de images */
  image?: string | null;
  order?: number | null;
  active: boolean;
  /** Datos expandidos opcionales al usar { expand: 'image,types' } */
  expand?: {
    types?: StoreTypeRecord;
    image?: ImageRecord;
  };
};

/** DTOs para crear/actualizar */
export interface CreateCategoryDto {
  name: string;
  order?: number | null;
  active?: boolean;
  /** relación SINGLE por id */
  typeId?: string | null;
  /** imagen: puedes pasar id o archivo (si hay archivo se ignora imageId) */
  imageId?: string | null;
  imageFile?: File | null;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

/** ===== Servicio ===== */
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private pb: PocketBase = inject(GlobalService).pb;

  /** Estado simple para la UI (opcional) */
  readonly categories = signal<CategoryRecord[]>([]);
  readonly total = signal<number>(0);
  readonly loading = signal<boolean>(false);

  // ---------- Helpers ----------
  /** Sube un archivo a la colección 'images' y retorna el record creado */
  private async uploadImage(file: File): Promise<ImageRecord> {
    const form = new FormData();
    form.append('image', file);
    const rec = await this.pb.collection('images').create(form);
    return rec as ImageRecord;
  }

  /** Construye la URL segura del archivo de un ImageRecord expandido */
  fileUrl(img?: ImageRecord): string {
    if (!img) return '';
    return this.pb.files.getUrl(img, img.image);
  }

  // ---------- CRUD ----------
  /**
   * Lista categorías con soporte de filtro/sort y expand de relaciones
   */
  async list(opts?: {
    page?: number;
    perPage?: number;
    filter?: string;
    sort?: string; // ej: 'order,created'
  }): Promise<{ items: CategoryRecord[]; totalItems: number }> {
    const { page = 1, perPage = 50, filter = '', sort = 'order,created' } = opts || {};
    this.loading.set(true);
    try {
      const res = await this.pb.collection('categories').getList<CategoryRecord>(page, perPage, {
        filter,
        sort,
        expand: 'image,types',
      });
      const items = res.items as CategoryRecord[];
      this.categories.set(items);
      this.total.set(res.totalItems);
      return { items, totalItems: res.totalItems };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Obtiene una categoría por id con expand de 'image' y 'types'
   */
  async getById(id: string): Promise<CategoryRecord> {
    const rec = await this.pb.collection('categories').getOne<CategoryRecord>(id, {
      expand: 'image,types',
    });
    return rec as CategoryRecord;
  }

  /**
   * Crea una categoría. Si se provee imageFile, se sube a 'images' y se asocia.
   */
  async create(dto: CreateCategoryDto): Promise<CategoryRecord> {
    let imageId = dto.imageId ?? null;

    if (dto.imageFile) {
      const img = await this.uploadImage(dto.imageFile);
      imageId = img.id;
    }

    const payload: Record<string, any> = {
      name: dto.name,
      order: dto.order ?? null,
      active: dto.active ?? true,
      ...(dto.typeId ? { types: dto.typeId } : {}),
      ...(imageId ? { image: imageId } : {}),
    };

    const created = await this.pb.collection('categories').create(payload);
    // Devolvemos el registro ya expandido para usar directamente en la UI
    return this.getById(created.id);
  }

  /**
   * Actualiza una categoría. Puedes cambiar typeId, order, active y/o imagen.
   * Si llega imageFile, se sube a 'images' y se reemplaza la relación 'image'.
   */
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryRecord> {
    let imageId = dto.imageId;

    if (dto.imageFile) {
      const img = await this.uploadImage(dto.imageFile);
      imageId = img.id;
    }

    const payload: Record<string, any> = {};
    if (dto.name !== undefined) payload['name'] = dto.name;
    if (dto.order !== undefined) payload['order'] = dto.order;
    if (dto.active !== undefined) payload['active'] = dto.active;
    if (dto.typeId !== undefined) payload['types'] = dto.typeId; // SINGLE
    if (imageId !== undefined) payload['image'] = imageId;

    await this.pb.collection('categories').update(id, payload);
    return this.getById(id);
  }

  /**
   * Elimina una categoría por id
   */
  async remove(id: string): Promise<void> {
    await this.pb.collection('categories').delete(id);
  }
}
