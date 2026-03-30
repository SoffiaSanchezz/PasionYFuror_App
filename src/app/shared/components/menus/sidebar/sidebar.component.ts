import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SessionProviderService } from '@shared/services/session/session-provider.service';
import { IonicModule } from '@ionic/angular';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  active?: boolean;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Input() collapsed: boolean = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  userName: string = '';
  userRole: string = '';

  // IMPORTANTE: Rutas ABSOLUTAS con '/' al inicio para evitar errores de contexto
  navItems: NavItem[] = [
    { icon: 'grid-fill', label: 'Inicio', route: '/admin/dashboard' },
    { icon: 'people-fill', label: 'Estudiantes', route: '/admin/students' },
    { icon: 'calendar-event-fill', label: 'Horarios', route: '/admin/schedules' },
    { icon: 'calendar-heart-fill', label: 'Actividades', route: '/admin/activities' },
    { icon: 'credit-card-fill', label: 'Pagos', route: '/admin/payments' },
  ];

  constructor(
    private readonly router: Router,
    private readonly sessionProvider: SessionProviderService
  ) { }

  ngOnInit(): void {
    this.userName = this.sessionProvider.getUserName();
    this.userRole = this.sessionProvider.getUserRole();
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  setActiveItem(item: NavItem): void {
    this.navItems.forEach(i => i.active = false);
    item.active = true;
    
    // Solución al foco: liberamos el foco antes de que Ionic oculte la página actual
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  logout(): void {
    this.sessionProvider.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
