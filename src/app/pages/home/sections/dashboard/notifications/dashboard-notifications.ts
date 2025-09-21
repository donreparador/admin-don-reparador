
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStore } from '../../../../../stores/dashboard.store'; // sube 5 niveles

@Component({
  selector: 'app-dashboard-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="user-profile-card">
    <h4 class="user-profile-card-title">Notificaciones</h4>
    <div class="user-notification">
      <div class="user-notification-item" *ngFor="let n of store.notifications()">
        <a href="javascript:void(0)" (click)="store.markRead(n.id)">
          <div class="user-notification-icon"><i [class]="n.icon"></i></div>
          <div class="user-notification-info">
            <p [innerText]="n.text"></p>
            <span>{{ n.timeAgo }}</span>
          </div>
        </a>
      </div>
      <div *ngIf="store.notifications().length===0" class="px-3 py-2 text-muted">Sin notificaciones</div>
    </div>
  </div>
  `
})
export class DashboardNotifications {
  store = inject(DashboardStore);
}
