import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { SessionProviderService } from '@shared/services/session/session-provider.service';
import { StatCardComponent } from '@shared/components/cards/stat-card/stat-card.component';
import { SidebarComponent } from '../../../../../../shared/components/menus/sidebar/sidebar.component';
import { SearchInputComponent } from '@shared/components/inputs/search-input/search-input.component';
import { DashboardService } from '@shared/services/dashboard/dashboard.service';
import { NotificationService } from '@shared/services/notifications/notification.service';
import { NotificationDropdownComponent } from '@shared/components/notifications/notification-dropdown.component';
import { Subscription, Observable } from 'rxjs';

// Interfaces definidas para mejor tipado
interface TodayClass {
  time: string;
  duration: string;
  name: string;
  instructor: string;
  enrolled: number;
  capacity: number;
  capacityPercent: number;
}

interface Activity {
  type: string;
  icon: string;
  title: string;
  time: string;
}

interface CalendarDay {
  day: number | null;
  isToday: boolean;
  hasEvent: boolean;
}

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    LottieComponent, 
    StatCardComponent, 
    SidebarComponent, 
    SearchInputComponent, 
    IonicModule,
    NotificationDropdownComponent
  ],
  templateUrl: './main-dashboard.component.html',
  styleUrls: ['./main-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainDashboardComponent implements OnInit, OnDestroy {
  // UI State
  sidebarCollapsed = false;
  isLoading = true;
  showNotifications = false;
  
  // User Data
  userName = '';
  userRole = '';
  userInitials = 'AU';

  // Stats
  totalStudents = 0;
  totalRevenue = 0;

  // Lottie Options
  readonly lottieOptions: AnimationOptions = {
    path: 'assets/animations/Dancingfire.json',
  };

  todayClasses: TodayClass[] = [];
  recentActivity: Activity[] = [];
  calendarDays: CalendarDay[] = [];
  currentMonthName = '';

  unreadNotificationsCount$: Observable<number>;
  private subscriptions = new Subscription();

  constructor(
    private readonly sessionProvider: SessionProviderService,
    private readonly dashboardService: DashboardService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly el: ElementRef
  ) { 
    this.unreadNotificationsCount$ = this.notificationService.getUnreadCount();
  }

  ngOnInit(): void {
    this.initDashboard();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showNotifications) {
      const clickedInside = this.el.nativeElement.querySelector('.notification-container')?.contains(event.target);
      if (!clickedInside) {
        this.showNotifications = false;
        this.cdr.markForCheck();
      }
    }
  }

  handleSearch(term: string): void {
    console.log('Dashboard search:', term);
  }

  private initDashboard(): void {
    this.userName = this.sessionProvider.getUserName() || 'Usuario';
    this.userRole = this.sessionProvider.getUserRole();
    this.userInitials = this.getInitials(this.userName);
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const sub = this.dashboardService.getDashboardSummary().subscribe({
      next: (data: any) => {
        this.totalStudents = data.totalStudents;
        this.totalRevenue = data.totalRevenue;
        this.todayClasses = data.todayClasses;
        this.recentActivity = data.recentActivities;
        
        // Generar calendario con fechas reales de las actividades
        this.generateCalendar(data.activityDates || []);
        
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Error loading dashboard data:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });

    this.subscriptions.add(sub);
  }

  private generateCalendar(activityDates: string[]): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    this.currentMonthName = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Ajustar primer día (Lunes como inicio)
    const startingDay = firstDay === 0 ? 6 : firstDay - 1;

    // Extraer solo los días del mes actual que tienen actividad
    // Parseamos YYYY-MM-DD como fecha LOCAL para evitar desfase UTC:
    // new Date('2026-04-10') → UTC → puede ser día 9 en UTC-5
    // Solución: parsear manualmente los componentes
    const eventDays = new Set<number>(
      activityDates
        .map(d => {
          const [y, m, day] = d.split('-').map(Number);
          return new Date(y, m - 1, day); // fecha local, sin UTC
        })
        .filter(d => d.getFullYear() === year && d.getMonth() === month)
        .map(d => d.getDate())
    );

    const days: CalendarDay[] = [];

    // Espacios vacíos al inicio
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, isToday: false, hasEvent: false });
    }

    // Días del mes
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        isToday: d === now.getDate(),
        hasEvent: eventDays.has(d)
      });
    }

    this.calendarDays = days;
  }

  private getInitials(name: string): string {
    if (!name) return 'AU';
    const names = name.split(' ').filter(n => n.length > 0);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.cdr.markForCheck();
  }

  // Navigation Methods
  navigateToAddStudent(): void {
    this.router.navigate(['/admin/students/new']);
  }

  navigateToRegisterPayment(): void {
    this.router.navigate(['/admin/payments/new']);
  }

  navigateToStudents(): void {
    this.router.navigate(['/admin/students']);
  }

  navigateToClasses(): void {
    this.router.navigate(['/admin/schedules']);
  }

  navigateToNotifications(): void {
    this.showNotifications = false;
    this.router.navigate(['/admin/dashboard/notificaciones']);
  }
}
