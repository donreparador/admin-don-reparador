// src/app/services/store-types.service.ts (mínimo)
import { Injectable, inject } from '@angular/core';

import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';

import { GlobalService } from './global';

export type StoreTypeRecord = RecordModel & { name: string };

@Injectable({ providedIn: 'root' })
export class StoreTypesService {
  private pb: PocketBase = inject(GlobalService).pb;
  list() {
    return this.pb.collection('storeTypes').getFullList<StoreTypeRecord>({ sort: 'name' });
  }
}
