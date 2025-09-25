import { Injectable, inject, signal } from '@angular/core';
import { GlobalService } from './global';
import PocketBase from 'pocketbase';
import { RecordModel, RecordSubscription } from 'pocketbase';


export type SectionsFlags = {
  bannerCarousel?: boolean;
  featuredServices?: boolean;
  featuredExperts?: boolean;
  packages?: boolean;
  topCategories?: boolean;
  topProviders?: boolean;
};

export type AppConfigRecord = RecordModel & {
  sections: SectionsFlags;
  maintenance?: boolean;
  appMinVersion?: string | null;
  rolloutPercent?: number | null;
  _key?: string; // si usas singleton por clave
};

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private pb: PocketBase = inject(GlobalService).pb;
  cfg = signal<AppConfigRecord | null>(null);

  async ensure(): Promise<AppConfigRecord> {
    try {
      return await this.load();
    } catch {
      const created = await this.pb.collection('config').create<AppConfigRecord>({
        sections: {
          bannerCarousel: false, featuredServices: true,
          packages: true, topCategories: false, topProviders: false
        },
        maintenance: false,
        rolloutPercent: 100,
        // _key: 'app', // si usas clave única
      } as any);
      this.cfg.set(created);
      return created;
    }
  }

  async load(): Promise<AppConfigRecord> {
    // Si usas _key:
    // const rec = await this.pb.collection('config').getFirstListItem<AppConfigRecord>('_key = "app"');

    // Sin _key: toma el más reciente
    const list = await this.pb.collection('config').getList<AppConfigRecord>(1, 1, { sort: '-updated' });
    const rec = list.items[0];
    if (!rec) throw new Error('No existe config');
    this.cfg.set(rec);
    return rec;
  }

  async subscribe() {
    const curr = this.cfg() ?? (await this.ensure());
    await this.pb.collection('config').subscribe(
      curr.id,
      (e: RecordSubscription<AppConfigRecord>) => this.cfg.set(e.record)
    );
  }

  async unsubscribe() {
    await this.pb.collection('config').unsubscribe('*');
  }

  async update(patch: Partial<AppConfigRecord> & { sections?: Partial<SectionsFlags> }) {
    const curr = this.cfg();
    if (!curr) throw new Error('Config no cargada');
    const next: any = { ...patch };
    if (patch.sections) {
      next.sections = { ...(curr.sections || {}), ...(patch.sections || {}) };
    }
    const updated = await this.pb.collection('config').update<AppConfigRecord>(curr.id, next);
    this.cfg.set(updated);
    return updated;
  }
}
