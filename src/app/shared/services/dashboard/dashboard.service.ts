import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
import { StudentsService } from '../students/students.service';
import { PaymentsService } from '../payments/payments.service';
import { ActivitiesService } from '../activities/activities.service';
import { SchedulesService } from '../schedules/schedules.service';

export interface DashboardSummary {
  totalStudents: number;
  totalRevenue: number;
  recentActivities: any[];
  todayClasses: any[];
  activityDates: string[]; // fechas ISO de actividades para el calendario
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly paymentsService: PaymentsService,
    private readonly activitiesService: ActivitiesService,
    private readonly schedulesService: SchedulesService
  ) {}

  getDashboardSummary(): Observable<DashboardSummary> {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const today = days[new Date().getDay()];

    return forkJoin({
      students: this.studentsService.getAllStudents().pipe(catchError(() => of([]))),
      payments: this.paymentsService.getPayments().pipe(catchError(() => of([]))),
      activities: this.activitiesService.getActivities().pipe(catchError(() => of([]))),
      schedules: this.schedulesService.getSchedules().pipe(catchError(() => of([])))
    }).pipe(
      map(({ students, payments, activities, schedules }) => {
        // Calcular total de ingresos
        const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
        
        // Clases de hoy
        const todayClasses = Array.isArray(schedules) ? schedules
          .filter(s => s.day === today && s.status === 'activo')
          .map(s => ({
            time: s.startTime,
            duration: this.calculateDuration(s.startTime, s.endTime),
            name: s.name,
            instructor: s.teacherName,
            enrolled: 0,
            capacity: 20,
            capacityPercent: 0
          })) : [];

        // Fechas reales de actividades para el calendario
        // Parseamos YYYY-MM-DD como fecha LOCAL para evitar desfase UTC
        const activityDates: string[] = Array.isArray(activities)
          ? activities
              .filter(a => !!a.eventDate)
              .map(a => a.eventDate as string) // ya viene como "YYYY-MM-DD", lo usamos directo
          : [];

        // Actividades recientes (creadas recientemente)
        const recentActivitiesFromApi = Array.isArray(activities) ? activities
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .map(activity => ({
            type: 'activity',
            icon: 'bi-calendar-event',
            title: `Actividad: ${activity.title}`,
            time: this.getRelativeTime(activity.createdAt),
            _date: new Date(activity.createdAt).getTime()
          })) : [];

        // Estudiantes registrados recientemente
        const recentStudents = Array.isArray(students) ? students
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)
          .map(student => ({
            type: 'enrollment',
            icon: 'bi-person-plus',
            title: `Nuevo estudiante: ${student.full_name}`,
            time: this.getRelativeTime(student.created_at),
            _date: new Date(student.created_at).getTime()
          })) : [];

        // Pagos recientes
        const recentPayments = Array.isArray(payments) ? payments
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .map(payment => ({
            type: 'payment',
            icon: 'bi-cash-stack',
            title: `Pago recibido: ${payment.studentName} ($${payment.amountPaid})`,
            time: this.getRelativeTime(payment.createdAt),
            _date: new Date(payment.createdAt).getTime()
          })) : [];

        return {
          totalStudents: Array.isArray(students) ? students.length : 0,
          totalRevenue: totalRevenue,
          recentActivities: [...recentActivitiesFromApi, ...recentStudents, ...recentPayments]
            .sort((a, b) => b._date - a._date)
            .slice(0, 8),
          todayClasses: todayClasses,
          activityDates: activityDates
        };
      })
    );
  }

  private calculateDuration(start: string, end: string): string {
    try {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      const diff = (endH * 60 + endM) - (startH * 60 + startM);
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hours > 0 ? hours + 'h' : ''}${mins > 0 ? mins + 'm' : ''}`;
    } catch {
      return '1h';
    }
  }

  private getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(date.getTime())) return 'Recientemente';
    if (diffInSeconds < 60) return 'Hace un momento';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    
    return date.toLocaleDateString();
  }
}
