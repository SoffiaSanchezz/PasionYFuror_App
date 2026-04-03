import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, forkJoin, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { StudentsService } from '../students/students.service';
import { PaymentsService } from '../payments/payments.service';
import { ActivitiesService } from '../activities/activities.service';

export interface AppNotification {
  id: string;
  type: 'student' | 'payment' | 'class' | 'system';
  icon: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private notifications$ = new BehaviorSubject<AppNotification[]>([]);
  private pollSub?: Subscription;

  // IDs ya vistos para no duplicar entre refrescos
  private seenIds = new Set<string>();

  constructor(
    private readonly studentsService: StudentsService,
    private readonly paymentsService: PaymentsService,
    private readonly activitiesService: ActivitiesService
  ) {
    this.fetchFromBackend();
    // Refresco automático cada 60 segundos
    this.pollSub = timer(60_000, 60_000).subscribe(() => this.fetchFromBackend());
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  getNotifications(): Observable<AppNotification[]> {
    return this.notifications$.asObservable().pipe(
      map(list => list.sort((a, b) => b.date.getTime() - a.date.getTime()))
    );
  }

  getUnreadCount(): Observable<number> {
    return this.notifications$.pipe(
      map(list => list.filter(n => !n.read).length)
    );
  }

  markAsRead(id: string): void {
    const updated = this.notifications$.value.map(n => n.id === id ? { ...n, read: true } : n);
    this.notifications$.next(updated);
  }

  markAllAsRead(): void {
    const updated = this.notifications$.value.map(n => ({ ...n, read: true }));
    this.notifications$.next(updated);
  }

  deleteNotification(id: string): void {
    const updated = this.notifications$.value.filter(n => n.id !== id);
    this.notifications$.next(updated);
    this.seenIds.delete(id);
  }

  private fetchFromBackend(): void {
    forkJoin({
      students: this.studentsService.getAllStudents().pipe(catchError(() => of([]))),
      payments: this.paymentsService.getPayments().pipe(catchError(() => of([]))),
      activities: this.activitiesService.getActivities().pipe(catchError(() => of([])))
    }).subscribe(({ students, payments, activities }) => {
      const incoming: AppNotification[] = [];

      // Últimos 3 estudiantes registrados
      const recentStudents = Array.isArray(students)
        ? [...students]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3)
        : [];

      recentStudents.forEach(s => {
        const id = `student-${s.id}`;
        incoming.push({
          id,
          type: 'student',
          icon: 'bi-person-plus-fill',
          title: 'Nuevo Estudiante Registrado',
          description: `${s.full_name} se ha unido a la academia.`,
          time: this.getRelativeTime(s.created_at),
          read: this.seenIds.has(id),
          date: new Date(s.created_at)
        });
        this.seenIds.add(id);
      });

      // Últimos 3 pagos
      const recentPayments = Array.isArray(payments)
        ? [...payments]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
        : [];

      recentPayments.forEach(p => {
        const id = `payment-${p.id}`;
        const amount = p.amountPaid;
        const dateStr = p.createdAt;
        incoming.push({
          id,
          type: 'payment',
          icon: 'bi-cash-stack',
          title: 'Pago Recibido',
          description: `Pago procesado exitosamente ($${amount.toFixed(2)}).`,
          time: this.getRelativeTime(dateStr),
          read: this.seenIds.has(id),
          date: new Date(dateStr)
        });
        this.seenIds.add(id);
      });

      // Últimas 2 actividades creadas
      const recentActivities = Array.isArray(activities)
        ? [...activities]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2)
        : [];

      recentActivities.forEach(a => {
        const id = `activity-${a.id}`;
        incoming.push({
          id,
          type: 'class',
          icon: 'bi-calendar-plus',
          title: 'Nueva Actividad Creada',
          description: `Se ha creado la actividad "${a.title}".`,
          time: this.getRelativeTime(a.createdAt),
          read: this.seenIds.has(id),
          date: new Date(a.createdAt)
        });
        this.seenIds.add(id);
      });

      if (incoming.length > 0) {
        this.notifications$.next(incoming);
      }
    });
  }

  private getRelativeTime(dateStr: string): string {
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
