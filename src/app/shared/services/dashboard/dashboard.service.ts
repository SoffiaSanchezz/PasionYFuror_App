import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, catchError, combineLatest } from 'rxjs';
import { StudentsService } from '../students/students.service';
import { PaymentsService } from '../payments/payments.service';
import { ActivitiesService } from '../activities/activities.service';
import { SchedulesService } from '../schedules/schedules.service';
import { NotificationService } from '../notifications/notification.service';

export interface DashboardSummary {
  totalStudents: number;
  totalRevenue: number;
  recentActivities: any[];
  todayClasses: any[];
  activityDates: string[];
  activities: any[]; // actividades completas para el calendario
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly paymentsService: PaymentsService,
    private readonly activitiesService: ActivitiesService,
    private readonly schedulesService: SchedulesService,
    private readonly notificationService: NotificationService
  ) {}

  getDashboardSummary(): Observable<DashboardSummary> {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const today = days[new Date().getDay()];

    return forkJoin({
      students:   this.studentsService.getAllStudents().pipe(catchError(() => of([]))),
      payments:   this.paymentsService.getPayments().pipe(catchError(() => of([]))),
      activities: this.activitiesService.getActivities().pipe(catchError(() => of([]))),
      schedules:  this.schedulesService.getSchedules().pipe(catchError(() => of([])))
    }).pipe(
      map(({ students, payments, activities, schedules }) => {

        // ── Ingresos totales ──────────────────────────────────────────
        const totalRevenue = Array.isArray(payments)
          ? payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0)
          : 0;

        // ── Clases de hoy ─────────────────────────────────────────────
        const todayClasses = Array.isArray(schedules)
          ? schedules
              .filter(s => s.day === today && s.status === 'activo')
              .map(s => ({
                time: s.startTime,
                duration: this._duration(s.startTime, s.endTime),
                name: s.name,
                instructor: s.teacherName,
                enrolled: 0,
                capacity: 20,
                capacityPercent: 0
              }))
          : [];

        // ── Fechas para el calendario ─────────────────────────────────
        const activityDates: string[] = Array.isArray(activities)
          ? activities.filter(a => !!a.eventDate).map(a => a.eventDate as string)
          : [];

        // ── Actividad reciente: combina las 3 fuentes ─────────────────
        const fromActivities = Array.isArray(activities)
          ? activities
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3)
              .map(a => ({
                type: 'activity',
                icon: 'bi-calendar-event',
                title: `Actividad: ${a.title}`,
                time: this._relativeTime(a.createdAt),
                _date: new Date(a.createdAt).getTime()
              }))
          : [];

        const fromStudents = Array.isArray(students)
          ? students
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 3)
              .map(s => ({
                type: 'enrollment',
                icon: 'bi-person-plus',
                title: `Nuevo estudiante: ${s.full_name}`,
                time: this._relativeTime(s.created_at),
                _date: new Date(s.created_at).getTime()
              }))
          : [];

        const fromPayments = Array.isArray(payments)
          ? payments
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3)
              .map(p => ({
                type: 'payment',
                icon: 'bi-cash-stack',
                title: `Pago: ${p.studentName} — $${(p.amountPaid || 0).toLocaleString()}`,
                time: this._relativeTime(p.createdAt),
                _date: new Date(p.createdAt).getTime()
              }))
          : [];

        const recentActivities = [...fromActivities, ...fromStudents, ...fromPayments]
          .sort((a, b) => b._date - a._date)
          .slice(0, 8);

        return {
          totalStudents: Array.isArray(students) ? students.length : 0,
          totalRevenue,
          recentActivities,
          todayClasses,
          activityDates,
          activities: Array.isArray(activities) ? activities : []
        };
      })
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private _duration(start: string, end: string): string {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `${h > 0 ? h + 'h' : ''}${m > 0 ? m + 'm' : ''}`;
    } catch { return '1h'; }
  }

  private _relativeTime(dateStr: string): string {
    if (!dateStr) return 'Recientemente';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recientemente';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Hace un momento';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES');
  }
}
