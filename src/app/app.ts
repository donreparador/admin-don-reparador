import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Home } from './pages/home/home';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Router } from '@angular/router';
import { AdminStore } from './stores/admin.store';

@Component({
  selector: 'app-root',
  imports: [
    // RouterOutlet,
    
    Header,
    Home,
    Footer,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',

})
export class App {
  store = inject(AdminStore);
  
  constructor(public router: Router) {
   
  }
  protected readonly title = signal('admin-don-reparador');
}
