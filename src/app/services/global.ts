// src/app/services/global.ts
import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';

const PB_URL = 'https://db.donreparador.com:8090';

@Injectable({ providedIn: 'root' })
export class GlobalService {
  pb = new PocketBase(PB_URL);

  constructor() {
    // restaura sesión si guardas el authStore en localStorage
    this.pb.authStore.loadFromCookie(document.cookie);
    this.pb.authStore.onChange(() => {
      document.cookie = this.pb.authStore.exportToCookie({ httpOnly: false });
    });
  }
}
