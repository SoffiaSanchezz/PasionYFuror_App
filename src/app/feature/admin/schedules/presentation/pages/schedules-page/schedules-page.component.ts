import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import Swal from 'sweetalert2';

import { ScheduleEntity } from '../../../domain/entities/schedule.entity';
import { SidebarComponent } from '@shared/components/menus/sidebar/sidebar.component';
import { ScheduleListTableComponent } from '../../components/schedule-list-table/schedule-list-table.component';
import { GetSchedulesUseCase, DeleteScheduleUseCase } from '../../../domain/usecases/schedules.usecases';

@Component({
  selector: 'app-schedules-page',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule, SidebarComponent, ScheduleListTableComponent],
  templateUrl: './schedules-page.component.html',
  styleUrls: ['./schedules-page.component.scss']
})
export class SchedulesPageComponent implements OnInit {
  sidebarCollapsed = false;
  isLoading = false;
  
  private schedulesSubject = new BehaviorSubject<ScheduleEntity[]>([]);
  schedules$: Observable<ScheduleEntity[]> = this.schedulesSubject.asObservable();

  stats = {
    activeSchedules: 0,
    attendancesToday: 0, 
    classesThisWeek: 0,
    progressToday: '0/0',
    dayStatusLabel: 'Sin clases hoy'
  };

  constructor(
    private readonly getSchedulesUseCase: GetSchedulesUseCase,
    private readonly deleteScheduleUseCase: DeleteScheduleUseCase,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Inicialización de componentes si es necesario
  }

  // Hook de Ionic: Se ejecuta CADA VEZ que entras a la página
  ionViewWillEnter(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.isLoading = true;
    this.getSchedulesUseCase.execute()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.schedulesSubject.next(data);
          this.calculateStats(data);
        },
        error: (err) => {
          console.error('Error al cargar horarios', err);
          Swal.fire('Error', 'No se pudieron cargar los horarios', 'error');
        }
      });
  }

  private calculateStats(schedules: ScheduleEntity[]): void {
    const now = new Date();
    const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const currentDayName = daysMap[now.getDay()];
    
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 1. Horarios Activos
    const active = schedules.filter(s => s.status === 'activo');
    this.stats.activeSchedules = active.length;

    // 2. Clases semana
    this.stats.classesThisWeek = active.length;

    // 3. Lógica de PROGRESO DEL DÍA (Clases Terminadas)
    const todayClasses = active.filter(s => s.day === currentDayName);
    
    if (todayClasses.length > 0) {
      const finishedCount = todayClasses.filter(s => s.endTime < currentTimeStr).length;
      this.stats.progressToday = `${finishedCount}/${todayClasses.length}`;

      const ongoingClass = todayClasses.find(s => s.startTime <= currentTimeStr && s.endTime >= currentTimeStr);
      const nextClass = todayClasses
        .filter(s => s.startTime > currentTimeStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

      if (ongoingClass) {
        this.stats.dayStatusLabel = `En curso: ${ongoingClass.name}`;
      } else if (nextClass) {
        this.stats.dayStatusLabel = `Siguiente: ${nextClass.startTime}`;
      } else if (finishedCount === todayClasses.length) {
        this.stats.dayStatusLabel = 'Día Finalizado ✅';
      } else {
        this.stats.dayStatusLabel = 'En pausa';
      }
    } else {
      this.stats.progressToday = '0/0';
      this.stats.dayStatusLabel = 'Sin clases hoy';
    }

    this.cdr.detectChanges();
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  goToNewSchedule(): void {
    this.router.navigate(['/admin/schedules/new']);
  }

  goToAttendanceRecords(): void {
    this.router.navigate(['/admin/schedules/attendance-records']);
  }

  onEditSchedule(schedule: ScheduleEntity): void {
    this.router.navigate(['/admin/schedules/edit', schedule.id]);
  }

  onDeleteSchedule(id: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El horario se marcará como inactivo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b11226',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#1a1a1a',
      color: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteScheduleUseCase.execute(id).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El horario ha sido desactivado.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadSchedules();
          },
          error: (err) => {
            Swal.fire('Error', 'No se pudo eliminar el horario', 'error');
          }
        });
      }
    });
  }
}
