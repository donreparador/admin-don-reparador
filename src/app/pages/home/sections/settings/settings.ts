// src/app/pages/home/sections/settings/settings.ts
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ConfigService, AppConfigRecord } from '../../../../services/config.service'; // ajusta la ruta
import type { SectionsFlags } from '../../../../services/config.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
})
export class SettingsComponent implements OnDestroy, OnInit {
  previewUrl = 'https://app.donreparador.com/';
  sanitizedUrl: SafeResourceUrl;

  devices = [
    { name: 'iPhone XR / 11', w: 414, h: 896 },
    { name: 'iPhone 14 Pro',  w: 393, h: 852 },
    { name: 'Pixel 7',        w: 412, h: 915 },
    { name: 'Small Android',  w: 360, h: 780 },
  ];
  device = this.devices[0];
  zoom = 0.85; // escala inicial

  constructor(private sanitizer: DomSanitizer) {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
  }
  reloadPreview() {
    // fuerza recarga sin cache del iframe
    const url = this.previewUrl.replace(/\/$/, '');
    const tick = Date.now();
    this.sanitizedUrl = this.sanitizer
      .bypassSecurityTrustResourceUrl(`${url}?_r=${tick}`);
  }
  private cfgSrv = inject(ConfigService);
  cfg = this.cfgSrv.cfg;
  loading = signal<boolean>(false);
  // 👉 clave: tipamos las keys para usarlas en el *ngFor
  flags: (keyof SectionsFlags)[] = [
    'bannerCarousel',
    'featuredServices',
    'packages',
    'topCategories',
    'topProviders',
    'featuredExperts',
  ];

  async ngOnInit() {
    this.loading.set(true);
    try {
      await this.cfgSrv.ensure();
      await this.cfgSrv.subscribe();
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() { this.cfgSrv.unsubscribe(); }

  // 👉 método auxiliar para evitar el indexado con 'string' en template
  isOn(c: AppConfigRecord, k: keyof SectionsFlags): boolean {
    return !!c.sections?.[k];
  }

  async toggle(flag: keyof SectionsFlags) {
    const curr = this.cfg();
    if (!curr) return;
    const value = !this.isOn(curr, flag);
    await this.cfgSrv.update({ sections: { [flag]: value } });
  }

  async editAdvanced() {
    const c = this.cfg();
    if (!c) return;
    const { isConfirmed, value } = await Swal.fire({
      title: 'Configuración avanzada',
      html: `
        <div class="text-start">
          <label class="form-label">Versión mínima</label>
          <input id="sw-min" class="form-control" value="${c.appMinVersion || ''}">
          <label class="form-label mt-2">% rollout</label>
          <input id="sw-roll" type="number" min="0" max="100" class="form-control" value="${c.rolloutPercent ?? 100}">
          <div class="form-check mt-2">
            <input id="sw-maint" class="form-check-input" type="checkbox" ${c.maintenance ? 'checked' : ''}>
            <label class="form-check-label" for="sw-maint">Modo mantenimiento</label>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      preConfirm: () => {
        const min = (document.getElementById('sw-min') as HTMLInputElement)?.value || null;
        const roll = Number((document.getElementById('sw-roll') as HTMLInputElement)?.value ?? 100);
        const maint = (document.getElementById('sw-maint') as HTMLInputElement)?.checked ?? false;
        if (roll < 0 || roll > 100) { Swal.showValidationMessage('Rollout 0–100'); return; }
        return { appMinVersion: min || null, rolloutPercent: roll, maintenance: maint };
      }
    });
    if (isConfirmed && value) {
      await this.cfgSrv.update(value);
      Swal.fire({ icon: 'success', title: 'Guardado', timer: 1200, showConfirmButton: false });
    }
  }
}
