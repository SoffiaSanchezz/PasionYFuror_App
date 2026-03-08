import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { SessionProviderService } from '@shared/services/session/session-provider.service';
import { StatCardComponent } from '@shared/components/cards/stat-card/stat-card.component';
import { SidebarComponent } from '../../../../../../shared/components/menus/sidebar/sidebar.component';
import { SearchInputComponent } from '@shared/components/inputs/search-input/search-input.component';

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

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [CommonModule, LottieComponent, StatCardComponent, SidebarComponent, SearchInputComponent, IonicModule],
  templateUrl: './main-dashboard.component.html',
  styleUrls: ['./main-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainDashboardComponent implements OnInit {
  // UI State
  sidebarCollapsed = false;
  isLoading = true;
  
  // User Data
  userName = '';
  userRole = '';
  userInitials = 'AU';

  // Lottie Options
  readonly lottieOptions: AnimationOptions = {
    path: 'assets/animations/Dancingfire.json',
  };

  // Datos mockeados centralizados
  todayClasses: TodayClass[] = [
    { time: '09:00 AM', duration: '1.5h', name: 'Salsa Intermedio', instructor: 'María G.', enrolled: 18, capacity: 20, capacityPercent: 90 },
    { time: '11:00 AM', duration: '1h', name: 'Bachata Principiante', instructor: 'Carlos R.', enrolled: 12, capacity: 15, capacityPercent: 80 },
    { time: '02:00 PM', duration: '1.5h', name: 'Tango Avanzado', instructor: 'Ana M.', enrolled: 8, capacity: 12, capacityPercent: 67 },
    { time: '05:00 PM', duration: '1h', name: 'Hip Hop Kids', instructor: 'Juan P.', enrolled: 20, capacity: 25, capacityPercent: 80 }
  ];

  recentActivity: Activity[] = [
    { type: 'enrollment', icon: 'bi-person-plus', title: 'Nuevo estudiante: Laura G.', time: 'Hace 5 min' },
    { type: 'payment', icon: 'bi-credit-card', title: 'Pago recibido: $150.00', time: 'Hace 15 min' },
    { type: 'attendance', icon: 'bi-check-circle', title: 'Asistencia: Salsa Intermedio', time: 'Hace 1h' },
    { type: 'schedule', icon: 'bi-calendar-plus', title: 'Clase programada: Merengue', time: 'Hace 2h' }
  ];

  constructor(
    private readonly sessionProvider: SessionProviderService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initDashboard();
  }

  handleSearch(term: string): void {
    console.log('Dashboard search:', term);
    // Aquí puedes implementar la lógica de búsqueda global si lo deseas
  }

  private initDashboard(): void {
    this.userName = this.sessionProvider.getUserName() || 'Usuario';
    this.userRole = this.sessionProvider.getUserRole();
    this.userInitials = this.getInitials(this.userName);

    // Simular carga de datos
    setTimeout(() => {
      this.isLoading = false;
      this.cdr.detectChanges(); // Forzar actualización de la UI
    }, 1000);
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
}
