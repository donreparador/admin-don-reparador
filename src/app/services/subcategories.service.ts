// src/app/services/subcategories.service.ts
import { Injectable } from '@angular/core';
import PocketBase, { ListResult } from 'pocketbase';

export interface SubCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  status?: boolean;
  tags?: string[];
  order?: number;
  category: string; // relation id (categories.id)
  created?: string;
  updated?: string;
}

@Injectable({ providedIn: 'root' })
export class SubCategoriesService {


    
  /** Ajusta si lo tienes en env */
  private readonly pb = new PocketBase('https://db.donreparador.com:8090');
  private readonly COL = 'sub_categories';

  /**
   * Lista subcategorías por categoría (id).
   * Estrategia:
   *  1) filter: category="ID"
   *  2) filter: category.id="ID"
   *  3) fallback: getFullList() y filtrar en cliente
   */
  async listByCategory(rawId: string): Promise<SubCategory[]> {
    const id = (rawId || '').trim();
    if (!id) return [];

    try {
      const r = await this.pb.collection(this.COL).getList<SubCategory>(
        1, 500, { filter: `category="${id}"`, sort: 'order,name' }
      );
      return r.items;
    } catch (e: any) {
      if (e?.status !== 400) throw e;
    }

    try {
      const r2 = await this.pb.collection(this.COL).getList<SubCategory>(
        1, 500, { filter: `category.id="${id}"`, sort: 'order,name' }
      );
      return r2.items;
    } catch (e2: any) {
      if (e2?.status !== 400) throw e2;
    }

    const all = await this.pb.collection(this.COL).getFullList<SubCategory>({
      sort: 'order,name',
      fields: 'id,name,slug,description,status,tags,order,category,created,updated'
    });
    return all.filter(s => (s as any).category?.trim?.() === id);
  }

  /** Crea subcategoría (debe pasarse category: <id>) */
  create(data: Partial<SubCategory>) {
    // Opcional: validación defensiva
    if (!data?.category || typeof data.category !== 'string') {
      throw new Error('La subcategoría debe incluir "category" con el id de la categoría.');
    }
    return this.pb.collection(this.COL).create<SubCategory>(data);
  }

  /** Actualiza subcategoría por id */
  update(id: string, patch: Partial<SubCategory>) {
    return this.pb.collection(this.COL).update<SubCategory>(id, patch);
  }

  /** Elimina subcategoría por id */
  remove(id: string) {
    return this.pb.collection(this.COL).delete(id);
  }

  // --- Helpers opcionales (útiles para debug/admin) -------------------------

  /** Lista paginada genérica (sin filtros) */
  list(page = 1, perPage = 50, sort = 'created'): Promise<ListResult<SubCategory>> {
    return this.pb.collection(this.COL).getList<SubCategory>(page, perPage, { sort });
  }

  /** Obtiene una subcategoría por id */
  getOne(id: string) {
    return this.pb.collection(this.COL).getOne<SubCategory>(id);
  }
}
