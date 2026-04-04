import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
  OnDestroy, HostListener, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { Subject, Subscription, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { SessionProviderService } from '@shared/services/session/session-provider.service';
import { StatCardComponent } from '@shared/components/cards/stat-card/stat-card.component';
import { SidebarComponent } from '../../../../../../shared/components/menus/sidebar/sidebar.component';
import { SearchInputComponent } from '@shared/components/inputs/search-input/search-input.component';
import { DashboardService } from '@shared/services/dashboard/dashboard.service';
import { NotificationService } from '@shared/services/notifications/notification.service';
import { NotificationDropdownComponent } from '@shared/components/notifications/notification-dropdown.component';
import { SearchService, SearchResult } from '@shared/services/search/search.service';
import { TranslateModule } from '@ngx-translate/core';

interface TodayClass {
  time: string; duration: string; name: string;
  instructor: string; enrolled: number; capacity: number; capacityPercent: number;
}

interface ActivityItem {
  type: string; icon: string; title: string; time: string;
}

interface CalendarDay {
  day: number | null;
  isToday: boolean;
  hasEvent: boolean;
  // actividades reales de ese día para el modal
  activities: CalendarActivity[];
}

export interface CalendarActivity {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  eventTime: string;
}

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LottieComponent, StatCardComponent,
    SidebarComponent, SearchInputComponent, IonicModule,
    NotificationDropdownComponent, TranslateModule
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

  // User
  userName = '';
  userInitials = 'AU';

  // Stats
  totalStudents = 0;
  totalRevenue = 0;

  // Lottie
  readonly lottieOptions: AnimationOptions = { path: 'assets/animations/Dancingfire.json' };

  // Dashboard data
  todayClasses: TodayClass[] = [];
  recentActivity: ActivityItem[] = [];
  calendarDays: CalendarDay[] = [];
  currentMonthName = '';

  // Actividades reales del mes (para el modal del calendario)
  private allActivities: CalendarActivity[] = [];

  // ── Search ────────────────────────────────────────────────────────────
  searchTerm = '';
  searchResults: SearchResult | null = null;
  showSearchResults = false;
  isSearching = false;
  private searchSubject = new Subject<string>();

  // ── Calendar modal ────────────────────────────────────────────────────
  showCalendarModal = false;
  selectedDayActivities: CalendarActivity[] = [];
  selectedDayLabel = '';

  unreadNotificationsCount$: Observable<number>;
  private subscriptions = new Subscription();

  constructor(
    private readonly sessionProvider: SessionProviderService,
    private readonly dashboardService: DashboardService,
    private readonly notificationService: NotificationService,
    private readonly searchService: SearchService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly el: ElementRef
  ) {
    this.unreadNotificationsCount$ = this.notificationService.getUnreadCount();
  }

  ngOnInit(): void {
    this.userName = this.sessionProvider.getUserName() || 'Usuario';
    this.userInitials = this._initials(this.userName);
    this.loadDashboardData();
    this._setupSearch();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.searchSubject.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.showNotifications) {
      const inside = this.el.nativeElement.querySelector('.notification-container')?.contains(target);
      if (!inside) { this.showNotifications = false; this.cdr.markForCheck(); }
    }
    if (this.showSearchResults) {
      const inside = this.el.nativeElement.querySelector('.search-wrapper')?.contains(target);
      if (!inside) { this.showSearchResults = false; this.cdr.markForCheck(); }
    }
  }

  // ── Search ────────────────────────────────────────────────────────────

  private _setupSearch(): void {
    const sub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.trim().length < 2) {
          this.searchResults = null;
          this.showSearchResults = false;
          this.isSearching = false;
          this.cdr.markForCheck();
          return [];
        }
        this.isSearching = true;
        this.cdr.markForCheck();
        return this.searchService.search(term);
      })
    ).subscribe(results => {
      this.searchResults = results;
      this.isSearching = false;
      this.showSearchResults = true;
      this.cdr.markForCheck();
    });
    this.subscriptions.add(sub);
  }

  handleSearch(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  get hasSearchResults(): boolean {
    if (!this.searchResults) return false;
    return (
      this.searchResults.students.length > 0 ||
      this.searchResults.payments.length > 0 ||
      this.searchResults.activities.length > 0
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = null;
    this.showSearchResults = false;
    this.cdr.markForCheck();
  }

  goToStudent(id: string): void {
    this.clearSearch();
    this.router.navigate(['/admin/students']);
  }

  goToPayment(id: string): void {
    this.clearSearch();
    this.router.navigate(['/admin/payments', id]);
  }

  goToActivity(id: string): void {
    this.clearSearch();
    this.router.navigate(['/admin/activities', id]);
  }

  // ── Calendar ──────────────────────────────────────────────────────────

  onDayClick(day: CalendarDay): void {
    if (!day.day || !day.hasEvent) return;
    this.selectedDayActivities = day.activities;
    this.selectedDayLabel = `${day.day} de ${this.currentMonthName}`;
    this.showCalendarModal = true;
    this.cdr.markForCheck();
  }

  closeCalendarModal(): void {
    this.showCalendarModal = false;
    this.cdr.markForCheck();
  }

  navigateToActivityDetail(id: string): void {
    this.closeCalendarModal();
    this.router.navigate(['/admin/activities']);
  }

  // ── Dashboard data ────────────────────────────────────────────────────

  private loadDashboardData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const sub = this.dashboardService.getDashboardSummary().subscribe({
      next: (data: any) => {
        this.totalStudents = data.totalStudents;
        this.totalRevenue = data.totalRevenue;
        this.todayClasses = data.todayClasses;
        this.recentActivity = data.recentActivities;
        this.allActivities = data.activities || [];
        this.generateCalendar(data.activityDates || [], data.activities || []);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });

    this.subscriptions.add(sub);
  }

  private generateCalendar(activityDates: string[], activities: CalendarActivity[]): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    this.currentMonthName = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDay = firstDay === 0 ? 6 : firstDay - 1;

    // Mapa día → actividades del mes actual
    const dayMap = new Map<number, CalendarActivity[]>();
    activities.forEach(a => {
      if (!a.eventDate) return;
      const [y, m, d] = a.eventDate.split('-').map(Number);
      if (y === year && m - 1 === month) {
        const list = dayMap.get(d) || [];
        list.push(a);
        dayMap.set(d, list);
      }
    });

    const days: CalendarDay[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, isToday: false, hasEvent: false, activities: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const acts = dayMap.get(d) || [];
      days.push({ day: d, isToday: d === now.getDate(), hasEvent: acts.length > 0, activities: acts });
    }

    this.calendarDays = days;
  }

  // ── Sidebar / Notifications ───────────────────────────────────────────

  onSidebarToggle(collapsed: boolean): void { this.sidebarCollapsed = collapsed; }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.cdr.markForCheck();
  }

  navigateToActivities(): void    { this.router.navigate(['/admin/activities']); }
  navigateToAddStudent(): void    { this.router.navigate(['/admin/students/new']); }
  navigateToRegisterPayment(): void { this.router.navigate(['/admin/payments/new']); }
  navigateToStudents(): void      { this.router.navigate(['/admin/students']); }
  navigateToClasses(): void       { this.router.navigate(['/admin/schedules']); }
  navigateToNotifications(): void {
    this.showNotifications = false;
    this.router.navigate(['/admin/dashboard/notificaciones']);
  }

  private _initials(name: string): string {
    if (!name) return 'AU';
    const parts = name.split(' ').filter(n => n.length > 0);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }
}
