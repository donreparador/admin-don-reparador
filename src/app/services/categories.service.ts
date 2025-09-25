// src/app/services/categories.service.ts
import { Injectable, inject, signal } from '@angular/core';

// type-only ok
import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';

import { GlobalService } from './global';

/** ===== Tipos base ===== */

export type ImageRecord = RecordModel & {
  image: string;
  type?: string | null;
  userId?: string | null;
};

export type StoreTypeRecord = RecordModel & {
  name: string;
};

/** Subcategoría embebida en categories.subs (JSON) */
export type SubItem = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  active?: boolean;
  order?: number;
};

export type CategoryRecord = RecordModel & {
  name: string;
  /** Relación SINGLE → id de storeTypes */
  types?: string | null;
  /** Relación SINGLE → id de images */
  image?: string | null;
  order?: number | null;
  active: boolean;

  /** ← NUEVO: JSON con subcategorías */
  subs?: SubItem[];        // puede venir undefined si aún no existe

  /** Expand opcional al usar { expand: 'image,types' } */
  expand?: {
    types?: StoreTypeRecord;
    image?: ImageRecord;
  };
};

/** DTOs */
export interface CreateCategoryDto {
  name: string;
  order?: number | null;
  active?: boolean;
  typeId?: string | null;   // relación SINGLE
  imageId?: string | null;  // relación SINGLE
  imageFile?: File | null;

  /** ← NUEVO: inicializar subs si quieres */
  subs?: SubItem[];
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

/** ===== Servicio ===== */
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private pb: PocketBase = inject(GlobalService).pb;

  readonly categories = signal<CategoryRecord[]>([]);
  readonly total = signal<number>(0);
  readonly loading = signal<boolean>(false);

  // ---------- Helpers ----------
  private async uploadImage(file: File): Promise<ImageRecord> {
    const form = new FormData();
    form.append('image', file);
    const rec = await this.pb.collection('images').create(form);
    return rec as ImageRecord;
  }

  fileUrl(img?: ImageRecord): string {
    if (!img) return '';
    return this.pb.files.getUrl(img, img.image);
  }

  // ---------- CRUD ----------
  async list(opts?: {
    page?: number;
    perPage?: number;
    filter?: string;
    sort?: string; // 'order,created'
  }): Promise<{ items: CategoryRecord[]; totalItems: number }> {
    const { page = 1, perPage = 50, filter = '', sort = 'order,created' } = opts || {};
    this.loading.set(true);
    try {
      const res = await this.pb.collection('categories').getList<CategoryRecord>(page, perPage, {
        filter,
        sort,
        expand: 'image,types', // subs es JSON, no se expande
      });
      const items = res.items as CategoryRecord[];
      this.categories.set(items);
      this.total.set(res.totalItems);
      return { items, totalItems: res.totalItems };
    } finally {
      this.loading.set(false);
    }
  }

  async getById(id: string): Promise<CategoryRecord> {
    const rec = await this.pb.collection('categories').getOne<CategoryRecord>(id, {
      expand: 'image,types',
    });
    return rec as CategoryRecord;
  }

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
      // ← NUEVO: si llega, guardamos subs (JSON)
      ...(dto.subs ? { subs: dto.subs } : {}),
    };

    const created = await this.pb.collection('categories').create(payload);
    return this.getById(created.id);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryRecord> {
    let imageId = dto.imageId;

    if (dto.imageFile) {
      const img = await this.uploadImage(dto.imageFile);
      imageId = img.id;
    }

    const payload: Record<string, any> = {};
    if (dto.name   !== undefined) payload['name']   = dto.name;
    if (dto.order  !== undefined) payload['order']  = dto.order;
    if (dto.active !== undefined) payload['active'] = dto.active;
    if (dto.typeId !== undefined) payload['types']  = dto.typeId;
    if (imageId    !== undefined) payload['image']  = imageId;

    // ← NUEVO: permitir actualizar `subs`
    if (dto.subs !== undefined) payload['subs'] = dto.subs;

    await this.pb.collection('categories').update(id, payload);
    return this.getById(id);
  }

  async remove(id: string): Promise<void> {
    await this.pb.collection('categories').delete(id);
  }
}
