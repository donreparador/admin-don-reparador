import { Injectable, effect, signal, computed } from '@angular/core';
import { UsersService, UserRow } from '../services/users.service';

const LS_KEY = 'adminStore_v1';

// Opciones válidas (para sanear lo que venga del localStorage)
const ALLOWED_OPTIONS = [
  'dashboard', 'clientes', 'prestadores', 'solicitudes',
  'finanzas', 'notificaciones', 'ajustes', 'categorias', 'settings'
] as const;

export type OptionMain =
  | 'dashboard'
  | 'clientes'
  | 'prestadores'   // (alias: 'proveedores')
  | 'solicitudes'
  | 'finanzas'
  | 'notificaciones'
  | 'ajustes'
  | 'categorias'
  | 'settings';

export type AjustesTab = 'categorias' | 'cupones' | 'auditoria';

interface PersistedState {
  option: OptionMain;
  ajustesTab: AjustesTab;
  page: number;
  perPage: number;
  search: string;
}

@Injectable({ providedIn: 'root' })
export class AdminStore {
  // ---- Estado base ----
  option     = signal<OptionMain>('dashboard');
  ajustesTab = signal<AjustesTab>('categorias');

  loading    = signal(false);

  clients    = signal<UserRow[]>([]);
  providers  = signal<UserRow[]>([]);

  page       = signal(1);
  perPage    = signal(10);
  totalPages = signal(1);
  totalItems = signal(0);
  search     = signal('');

  hasSearch  = computed(() => this.search().length > 0);

  constructor(private usersSvc: UsersService) {
    // Hidratar desde localStorage con saneamiento
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<PersistedState>;

        const opt = (ALLOWED_OPTIONS as readonly string[]).includes(String(s.option))
          ? (s.option as OptionMain)
          : 'dashboard';

        this.option.set(opt);
        this.ajustesTab.set((s.ajustesTab as AjustesTab) ?? 'categorias');
        this.page.set(s.page ?? 1);
        this.perPage.set(s.perPage ?? 10);
        this.search.set(s.search ?? '');
      } else {
        this.option.set('dashboard');
      }
    } catch {
      this.option.set('dashboard');
    }

    // Persistencia
    effect(() => {
      const snapshot: PersistedState = {
        option    : this.option(),
        ajustesTab: this.ajustesTab(),
        page      : this.page(),
        perPage   : this.perPage(),
        search    : this.search(),
      };
      localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
    });
  }

  /** Fuerza abrir en Dashboard y limpia la clave persistida. */
  forceDashboard(preserveSearch = false) {
    try { localStorage.removeItem(LS_KEY); } catch {}
    this.option.set('dashboard');
    this.page.set(1);
    if (!preserveSearch) this.search.set('');
  }

  // ---- Navegación principal ----
  setOption(opt: OptionMain | 'proveedores') {
    const normalized: OptionMain =
      (opt === 'proveedores' ? 'prestadores' : opt) as OptionMain;

    this.option.set(normalized);
    this.page.set(1);

    if (normalized === 'clientes')     this.loadClients();
    if (normalized === 'prestadores')  this.loadProviders();
  }


  // ---- Tabs de Ajustes ----
  setAjustesTab(tab: AjustesTab) {
    this.option.set('ajustes');
    this.ajustesTab.set(tab);
  }

  // ---- Búsqueda / paginación ----
  setSearch(term: string) {
    this.search.set(term.trim());
    this.page.set(1);
    if (this.option() === 'clientes')     this.loadClients();
    if (this.option() === 'prestadores')  this.loadProviders();
  }

  async goToPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    if (this.option() === 'clientes')     this.loadClients();
    if (this.option() === 'prestadores')  this.loadProviders();
  }

  // ---- Carga de datos ----
  async loadClients() {
    this.loading.set(true);
    try {
      const res = await this.usersSvc.listClients(
        this.page(), this.perPage(), this.search()
      );
      this.clients.set(res.items);
      this.totalPages.set(res.totalPages);
      this.totalItems.set(res.totalItems);
    } finally {
      this.loading.set(false);
    }
  }

  async loadProviders() {
    this.loading.set(true);
    try {
      const res = await this.usersSvc.listProviders(
        this.page(), this.perPage(), this.search()
      );
      this.providers.set(res.items);
      this.totalPages.set(res.totalPages);
      this.totalItems.set(res.totalItems);
    } finally {
      this.loading.set(false);
    }
  }

  // ---- Helpers UI ----
  statusBadgeClass(u: UserRow) {
    return u.status === 'active' ? 'badge bg-success' : 'badge bg-warning';
  }

  trackById(_i: number, u: UserRow) { return u.id; }
}
