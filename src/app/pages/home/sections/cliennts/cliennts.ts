// cliennts.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminStore } from '../../../../stores/admin.store';

@Component({
  selector: 'app-cliennts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cliennts.html',
  styleUrl: './cliennts.scss'
})
export class Cliennts {
  store = inject(AdminStore);

  onSearch(term: string) {
    this.store.setSearch(term);
  }

  goToPage(p: number) {
    this.store.goToPage(p);
  }

  trackById = this.store.trackById.bind(this.store);
  statusBadgeClass = this.store.statusBadgeClass.bind(this.store);
}
