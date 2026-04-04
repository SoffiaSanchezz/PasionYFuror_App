import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from '@shared/services/api/api.service';

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

interface BackendNotification {
  id: string;
  type: 'student' | 'payment' | 'class' | 'system';
  icon: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: BackendNotification[];
  unreadCount: number;
}

const POLL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  // Solo contiene notificaciones NO leídas
  private readonly _notifs$ = new BehaviorSubject<AppNotification[]>([]);
  private readonly _count$ = new BehaviorSubject<number>(0);
  private pollSub?: Subscription;

  constructor(private readonly api: ApiService) {
    this._fetch();
    this.pollSub = timer(POLL_MS, POLL_MS).subscribe(() => this._fetch());
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  // ── API pública ───────────────────────────────────────────────────────

  getNotifications(): Observable<AppNotification[]> {
    return this._notifs$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this._count$.asObservable();
  }

  refresh(): void {
    this._fetch();
  }

  /**
   * Marca como leída: la elimina del estado local inmediatamente
   * y persiste en backend. No reaparece al recargar porque el backend
   * ya no la devuelve (filtra is_read=false).
   */
  markAsRead(id: string): void {
    this._removeLocal(id);                                    // optimistic
    this.api.patch<BackendNotification>(`notifications/${id}/read`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  markAllAsRead(): void {
    this._notifs$.next([]);
    this._count$.next(0);
    this.api.patch<any>('notifications/read-all', {})
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  deleteNotification(id: string): void {
    this._removeLocal(id);
    this.api.delete<any>(`notifications/${id}`)
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  // ── Internos ──────────────────────────────────────────────────────────

  private _fetch(): void {
    this.api.get<NotificationsResponse>('notifications')
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (!res) return;
        // El backend ya filtra is_read=false, así que todo lo que llega es no leído
        const mapped = res.notifications.map(n => this._map(n));
        this._notifs$.next(mapped);
        this._count$.next(res.unreadCount);
      });
  }

  private _removeLocal(id: string): void {
    const updated = this._notifs$.value.filter(n => n.id !== id);
    this._notifs$.next(updated);
    this._count$.next(updated.length);
  }

  private _map(n: BackendNotification): AppNotification {
    return {
      id: n.id,
      type: n.type,
      icon: n.icon,
      title: n.title,
      description: n.description,
      read: n.isRead,
      time: this._relativeTime(n.createdAt),
      date: new Date(n.createdAt)
    };
  }

  private _relativeTime(dateStr: string): string {
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
