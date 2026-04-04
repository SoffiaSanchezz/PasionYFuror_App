import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../../services/notifications/notification.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notification-dropdown" (click)="$event.stopPropagation()">
      <div class="dropdown-header">
        <div class="header-top">
          <h3 class="title">Notificaciones</h3>
          <button class="close-btn" (click)="onClose()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="header-actions">
          <button class="action-link" (click)="markAllAsRead()">Marcar todas como leídas</button>
        </div>
      </div>

      <div class="notification-list custom-scroll" *ngIf="(recentNotifications$ | async) as notifications; else loading">
        <div *ngIf="notifications.length === 0" class="empty-state">
          <i class="bi bi-bell"></i>
          <p>No tienes notificaciones</p>
        </div>

        <div 
          *ngFor="let n of notifications" 
          class="notification-item" 
          [class.unread]="!n.read"
          (click)="onNotificationClick(n)"
        >
          <div class="notif-icon-container" [ngClass]="n.type">
            <i class="bi" [ngClass]="n.icon"></i>
          </div>
          <div class="notif-body">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-text">{{ n.description }}</div>
            <div class="notif-footer">
                <span class="time">{{ n.time }}</span>
                <span class="status-dot" *ngIf="!n.read"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="dropdown-footer">
        <button class="view-all-btn" (click)="onViewAll()">Ver todas las notificaciones</button>
      </div>

      <ng-template #loading>
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    .notification-dropdown {
      position: absolute;
      top: 65px;
      right: 0;
      width: 400px;
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 1rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
      z-index: 1100;
      overflow: hidden;
      animation: dropdownSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes dropdownSlide {
      from { opacity: 0; transform: translateY(-10px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes notifPulse {
      0%   { background: rgba(177, 18, 38, 0.12); }
      100% { background: rgba(177, 18, 38, 0.02); }
    }

    .dropdown-header {
      padding: 1.25rem;
      border-bottom: 1px solid #27272a;
      background: rgba(255,255,255,0.01);

      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .title {
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        font-size: 1.1rem;
        margin: 0;
        color: #fafafa;
        letter-spacing: 0.5px;
      }

      .close-btn {
        background: transparent;
        border: none;
        color: #a1a1aa;
        font-size: 1.1rem;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        transition: all 0.2s;
        display: flex;
        &:hover { background: rgba(255,255,255,0.05); color: #B11226; }
      }

      .action-link {
        background: transparent;
        border: none;
        color: #B11226;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
        &:hover { text-decoration: underline; }
      }
    }

    .notification-list {
      max-height: 420px;
      overflow-y: auto;
      
      .empty-state {
        padding: 4rem 1rem;
        text-align: center;
        color: #a1a1aa;
        i { font-size: 3rem; opacity: 0.2; margin-bottom: 1rem; display: block; }
      }
    }

    .notification-item {
      display: flex;
      padding: 1.25rem;
      gap: 1rem;
      cursor: pointer;
      border-bottom: 1px solid #27272a;
      transition: all 0.2s;
      position: relative;

      &:hover { background: #1f1f23; }
      &.unread { 
        background: rgba(177, 18, 38, 0.02);
        animation: notifPulse 0.4s ease;
        .notif-title { color: #fafafa; font-weight: 700; }
      }
      &:not(.unread) {
        opacity: 0.7;
        .notif-icon-container { filter: grayscale(0.5); }
      }
    }

    .notif-icon-container {
      width: 44px;
      height: 44px;
      min-width: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      
      &.student { background: rgba(27, 166, 166, 0.15); color: #1BA6A6; }
      &.payment { background: rgba(227, 178, 60, 0.15); color: #E3B23C; }
      &.class { background: rgba(177, 18, 38, 0.15); color: #B11226; }
      &.system { background: rgba(255, 255, 255, 0.1); color: #fafafa; }
    }

    .notif-body {
      flex: 1;
      .notif-title { font-size: 0.95rem; margin-bottom: 0.25rem; }
      .notif-text { font-size: 0.85rem; color: #a1a1aa; line-height: 1.4; }
      .notif-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.5rem;
        
        .time { font-size: 0.75rem; color: #B11226; font-weight: 600; }
        .status-dot {
            width: 8px;
            height: 8px;
            background: #B11226;
            border-radius: 50%;
            box-shadow: 0 0 10px #B11226;
        }
      }
    }

    .dropdown-footer {
      padding: 1rem;
      background: rgba(0,0,0,0.2);
      .view-all-btn {
        width: 100%;
        padding: 0.75rem;
        background: #1f1f23;
        border: 1px solid #27272a;
        border-radius: 0.75rem;
        color: #fafafa;
        font-family: 'Urbanist', sans-serif;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        &:hover { background: #B11226; border-color: #B11226; transform: translateY(-2px); }
      }
    }

    .custom-scroll {
      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
    }

    @media (max-width: 767px) {
      .notification-dropdown {
        position: fixed;
        top: 70px;
        left: 10px;
        right: 10px;
        width: auto;
      }
    }
  `]
})
export class NotificationDropdownComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() viewAll = new EventEmitter<void>();

  recentNotifications$: Observable<AppNotification[]>;

  constructor(private notificationService: NotificationService) {
    this.recentNotifications$ = this.notificationService.getNotifications().pipe(
      map(list => list.slice(0, 5))
    );
  }

  ngOnInit(): void {
    // Fuerza refresco al abrir el dropdown
    this.notificationService.refresh();
  }

  onNotificationClick(n: AppNotification): void {
    this.notificationService.markAsRead(n.id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  onClose(): void {
    this.close.emit();
  }

  onViewAll(): void {
    this.viewAll.emit();
  }
}
