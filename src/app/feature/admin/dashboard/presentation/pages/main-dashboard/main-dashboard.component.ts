import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { SidebarComponent } from '@shared/components/menus/sidebar/sidebar.component';
import { SessionProviderService } from '@shared/services/session/session-provider.service';

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
  imports: [CommonModule, SidebarComponent, LottieComponent],
  templateUrl: './main-dashboard.component.html',
  styleUrls: ['./main-dashboard.component.scss']
})
export class MainDashboardComponent implements OnInit {
  // UI State
  sidebarCollapsed: boolean = false;
  isLoading: boolean = true;
  
  // User Data
  userName: string = '';
  userRole: string = '';
  userInitials: string = 'AU';

  // Lottie Options
  lottieOptions: AnimationOptions = {
    path: 'assets/animations/Dancingfire.json',
  };

  // Mock Data
  todayClasses: TodayClass[] = [
    {
      time: '09:00 AM',
      duration: '1h 30min',
      name: 'Salsa Nivel Intermedio',
      instructor: 'María García',
      enrolled: 18,
      capacity: 20,
      capacityPercent: 90
    },
    {
      time: '11:00 AM',
      duration: '1h',
      name: 'Bachata Principiante',
      instructor: 'Carlos Rodríguez',
      enrolled: 12,
      capacity: 15,
      capacityPercent: 80
    },
    {
      time: '02:00 PM',
      duration: '1h 30min',
      name: 'Tango Avanzado',
      instructor: 'Ana Martínez',
      enrolled: 8,
      capacity: 12,
      capacityPercent: 67
    },
    {
      time: '05:00 PM',
      duration: '1h',
      name: 'Hip Hop Kids',
      instructor: 'Juan Pérez',
      enrolled: 20,
      capacity: 25,
      capacityPercent: 80
    }
  ];

  recentActivity: Activity[] = [
    {
      type: 'enrollment',
      icon: 'bi-person-plus',
      title: 'Nuevo estudiante: Laura González',
      time: 'Hace 5 minutos'
    },
    {
      type: 'payment',
      icon: 'bi-credit-card',
      title: 'Pago recibido: $150.00',
      time: 'Hace 15 minutos'
    },
    {
      type: 'attendance',
      icon: 'bi-check-circle',
      title: 'Asistencia registrada: Salsa Intermedio',
      time: 'Hace 1 hora'
    },
    {
      type: 'schedule',
      icon: 'bi-calendar-plus',
      title: 'Nueva clase programada: Merengue',
      time: 'Hace 2 horas'
    }
  ];

  constructor(private sessionProvider: SessionProviderService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Obtener datos de sesión
    this.userName = this.sessionProvider.getUserName() || 'Usuario';
    this.userRole = this.sessionProvider.getUserRole();
    this.generateInitials();

    // Simular carga de datos para mostrar el loader
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }

  private generateInitials(): void {
    if (!this.userName) {
      this.userInitials = 'AU';
      return;
    }
    const names = this.userName.split(' ');
    if (names.length >= 2) {
      this.userInitials = (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    } else {
      this.userInitials = this.userName.substring(0, 2).toUpperCase();
    }
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }
}
