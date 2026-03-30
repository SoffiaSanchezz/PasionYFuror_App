import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class LayoutComponent {
  sidebarCollapsed = false;

  constructor(private router: Router) {}

  isAdminRoute(): boolean {
    // Solo mostrar el sidebar si estamos dentro de las rutas de admin
    return this.router.url.includes('/admin');
  }
}
