import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SessionProviderService } from '@shared/services/session/session-provider.service';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ScrollService } from '@shared/services/scroll/scroll.service';

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
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  userName = '';
  userRole = '';
  userInitials = '';

  isHidden = false;
  showAvatarMenu = false;

  private scrollSub?: Subscription;

  navItems: NavItem[] = [
    { icon: 'grid-fill',           label: 'Inicio',      route: '/admin/dashboard' },
    { icon: 'people-fill',         label: 'Estudiantes', route: '/admin/students' },
    { icon: 'calendar-event-fill', label: 'Horarios',    route: '/admin/schedules' },
    { icon: 'calendar-heart-fill', label: 'Actividades', route: '/admin/activities' },
    { icon: 'credit-card-fill',    label: 'Pagos',       route: '/admin/payments' },
  ];

  constructor(
    private readonly router: Router,
    private readonly sessionProvider: SessionProviderService,
    private readonly scrollService: ScrollService
  ) {}

  ngOnInit(): void {
    this.userName = this.sessionProvider.getUserName();
    this.userRole = this.sessionProvider.getUserRole();
    this.userInitials = this._initials(this.userName);

    // Suscripción al servicio global de scroll — funciona en TODAS las vistas
    this.scrollSub = this.scrollService.scroll$.subscribe(dir => {
      if (window.innerWidth >= 768) return; // solo móvil
      this.isHidden = dir === 'down';
    });
  }

  ngOnDestroy(): void {
    this.scrollSub?.unsubscribe();
  }

  // ── Avatar menu ───────────────────────────────────────────────────────
  toggleAvatarMenu(event: Event): void {
    event.stopPropagation();
    this.showAvatarMenu = !this.showAvatarMenu;
  }

  closeAvatarMenu(): void {
    this.showAvatarMenu = false;
  }

  // ── Sidebar desktop ───────────────────────────────────────────────────
  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  setActiveItem(item: NavItem): void {
    this.navItems.forEach(i => i.active = false);
    item.active = true;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  logout(): void {
    this.showAvatarMenu = false;
    this.sessionProvider.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private _initials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ').filter(p => p.length > 0);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }
}
