// src/app/services/realtime-categories.service.ts
import { Injectable, inject, signal } from '@angular/core';
// ⚠️ En TypeScript no puedes mezclar default + named en un import type.
//     Sepáralos en dos líneas:
import type PocketBase from 'pocketbase';
import type { RecordSubscription } from 'pocketbase';

import { GlobalService } from './global';
import type { CategoryRecord } from './categories.service';

@Injectable({ providedIn: 'root' })
export class RealtimeCategoriesService {
  private pb: PocketBase = inject(GlobalService).pb;

  items = signal<CategoryRecord[]>([]);
  connected = signal<boolean>(false);

  // Usa el tipo oficial del SDK para el evento
  private onEvent = (e: RecordSubscription<CategoryRecord>) => {
    const curr = this.items();
    // En el SDK 'action' es string; igualamos por literal
    if (e.action === 'create') {
      this.items.set([...curr, e.record]);
    } else if (e.action === 'update') {
      this.items.set(curr.map(c => (c.id === e.record.id ? e.record : c)));
    } else if (e.action === 'delete') {
      this.items.set(curr.filter(c => c.id !== e.record.id));
    }
  };

  async connect(initialList?: CategoryRecord[]) {
    if (initialList) this.items.set(initialList);
    if (this.connected()) return;

    // Tipamos el parámetro como RecordSubscription<CategoryRecord>
    await this.pb.collection('categories').subscribe('*', (e: RecordSubscription<CategoryRecord>) => {
      this.onEvent(e);
    });

    this.connected.set(true);
  }

  async disconnect() {
    if (!this.connected()) return;
    await this.pb.collection('categories').unsubscribe('*');
    this.connected.set(false);
  }
}
