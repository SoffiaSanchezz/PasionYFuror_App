import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { NotificationService, AppNotification } from '@shared/services/notifications/notification.service';
import { Observable } from 'rxjs';
import { SidebarComponent } from '@shared/components/menus/sidebar/sidebar.component';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, IonicModule, SidebarComponent],
  template: `
    <div class="notifications-viewport">
      <!-- Sidebar integrado -->
      <app-sidebar [collapsed]="sidebarCollapsed" (collapsedChange)="sidebarCollapsed = $event"></app-sidebar>
      
      <!-- Contenedor Principal con Fondo -->
      <div class="main-glass-container" [class.sidebar-collapsed]="sidebarCollapsed">
        
        <!-- Overlay oscuro para profundidad -->
        <div class="dark-overlay">
          
          <!-- Contenedor de Centrado -->
          <div class="centering-wrapper">
            
            <!-- TARJETA DE CRISTAL (GLASS CARD) -->
            <div class="glass-card">
              
              <!-- Encabezado Fijo -->
              <header class="glass-card-header">
                <button class="glass-back-btn" (click)="goBack()">
                  <i class="bi bi-chevron-left"></i>
                  <span>Dashboard</span>
                </button>

                <div class="title-group">
                  <h1 class="glass-title">Centro de Notificaciones</h1>
                  <p class="glass-subtitle">Academia Furor y Pasion</p>
                </div>

                <button class="glass-action-btn" (click)="markAllAsRead()">
                  <i class="bi bi-check-all"></i>
                  <span>Leído</span>
                </button>
              </header>

              <!-- Listado con Scroll Interno -->
              <div class="glass-card-body custom-scroll">
                <div class="notifications-list" *ngIf="(notifications$ | async) as notifications; else loading">
                  
                  <div *ngIf="notifications.length === 0" class="empty-glass-state">
                    <i class="bi bi-bell-slash"></i>
                    <h3>No hay alertas nuevas</h3>
                    <p>Todo está al día en tu panel.</p>
                  </div>

                  <div class="notif-items-wrapper" *ngIf="notifications.length > 0">
                    <div 
                      *ngFor="let n of notifications" 
                      class="notif-glass-item" 
                      [class.unread]="!n.read"
                      (click)="onNotificationClick(n)"
                    >
                      <div class="notif-glass-icon" [ngClass]="n.type">
                        <i class="bi" [ngClass]="n.icon"></i>
                      </div>
                      
                      <div class="notif-glass-content">
                        <div class="notif-glass-header">
                          <span class="notif-glass-title">{{ n.title }}</span>
                          <span class="notif-glass-time">{{ n.time }}</span>
                        </div>
                        <p class="notif-glass-desc">{{ n.description }}</p>
                        
                        <div class="notif-glass-actions">
                          <button class="mini-glass-btn delete" (click)="deleteNotification($event, n.id)">
                            <i class="bi bi-trash3"></i>
                          </button>
                          <button class="mini-glass-btn check" *ngIf="!n.read" (click)="markAsRead($event, n.id)">
                            <i class="bi bi-check2"></i>
                          </button>
                        </div>
                      </div>
                      <div class="notif-unread-glow" *ngIf="!n.read"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div> <!-- Fin Glass Card -->
          </div> <!-- Fin Centering Wrapper -->
        </div> <!-- Fin Dark Overlay -->
      </div>
    </div>

    <ng-template #loading>
      <div class="glass-loader">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <span>Cargando notificaciones...</span>
      </div>
    </ng-template>
  `,
  styles: [`
    /* VIEWPORT Y FONDO */
    .notifications-viewport {
      width: 100%;
      height: 100vh;
      display: flex;
      background: #000;
      overflow: hidden;
    }

    .main-glass-container {
      flex: 1;
      height: 100vh;
      margin-left: 280px;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background-image: url('/assets/img/corregidofondoescuela2025.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      
      &.sidebar-collapsed { margin-left: 80px; }
      @media (max-width: 767px) { margin-left: 0 !important; }
    }

    .dark-overlay {
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: saturate(1.2);
    }

    /* SISTEMA DE CENTRADO */
    .centering-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }

    /* GLASS CARD */
    .glass-card {
      width: 100%;
      max-width: 800px;
      height: 85vh;
      background: rgba(15, 15, 18, 0.85);
      backdrop-filter: blur(25px) brightness(0.8);
      -webkit-backdrop-filter: blur(25px) brightness(0.8);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 2.5rem;
      box-shadow: 0 50px 100px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(255,255,255,0.02);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: glassEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes glassEntrance {
      from { opacity: 0; transform: scale(0.9) translateY(40px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* HEADER FIXED */
    .glass-card-header {
      padding: 2.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.02);

      .title-group {
        text-align: center;
        flex: 1;
      }

      .glass-title {
        font-family: var(--font-bebas);
        font-size: 2.8rem;
        color: #fff;
        margin: 0;
        letter-spacing: 2px;
        line-height: 1;
      }

      .glass-subtitle {
        font-family: var(--font-urbanist);
        color: var(--primary);
        font-weight: 800;
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 2px;
        margin-top: 0.5rem;
      }
    }

    .glass-back-btn, .glass-action-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      padding: 0.7rem 1.2rem;
      border-radius: 1.2rem;
      cursor: pointer;
      font-family: var(--font-urbanist);
      font-weight: 700;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;

      &:hover {
        background: var(--primary);
        border-color: var(--primary);
        box-shadow: 0 0 20px rgba(177, 18, 38, 0.4);
      }
    }

    /* CUERPO Y ITEMS */
    .glass-card-body {
      flex: 1;
      overflow-y: auto;
      padding: 2.5rem;
    }

    .notif-items-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .notif-glass-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 1.8rem;
      padding: 1.5rem;
      display: flex;
      gap: 1.5rem;
      position: relative;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: rgba(255, 255, 255, 0.07);
        border-color: rgba(255, 255, 255, 0.15);
        transform: scale(1.02);
      }

      &.unread {
        background: rgba(177, 18, 38, 0.06);
        border-left: 5px solid var(--primary);
        .notif-glass-title { color: #fff; font-weight: 800; }
      }

      &:not(.unread) { opacity: 0.6; }
    }

    .notif-glass-icon {
      width: 54px;
      height: 54px;
      min-width: 54px;
      border-radius: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      
      &.student { background: rgba(27, 166, 166, 0.2); color: #2fdcdc; }
      &.payment { background: rgba(227, 178, 60, 0.2); color: #ffcc4d; }
      &.class { background: rgba(177, 18, 38, 0.2); color: #ff4d4d; }
      &.system { background: rgba(255, 255, 255, 0.1); color: #fff; }
    }

    .notif-glass-content {
      flex: 1;
      
      .notif-glass-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.4rem;
      }

      .notif-glass-title {
        font-family: var(--font-oswald);
        font-size: 1.15rem;
        color: rgba(255,255,255,0.95);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .notif-glass-time {
        font-size: 0.75rem;
        color: var(--primary);
        font-weight: 800;
        background: rgba(177, 18, 38, 0.1);
        padding: 2px 10px;
        border-radius: 20px;
      }

      .notif-glass-desc {
        color: rgba(255,255,255,0.6);
        font-size: 0.95rem;
        line-height: 1.5;
        font-family: var(--font-urbanist);
        margin-bottom: 1rem;
      }
    }

    .notif-glass-actions {
      display: flex;
      gap: 1rem;
      
      .mini-glass-btn {
        background: rgba(255, 255, 255, 0.05);
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1.1rem;
        
        &:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }
        &.delete:hover { color: #ff4d4d; }
        &.check:hover { color: #2fdcdc; }
      }
    }

    .notif-unread-glow {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      width: 10px;
      height: 10px;
      background: var(--primary);
      border-radius: 50%;
      box-shadow: 0 0 15px var(--primary);
    }

    /* SCROLLBAR MODERNA */
    .custom-scroll {
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { 
        background: rgba(255, 255, 255, 0.1); 
        border-radius: 10px; 
      }
      &::-webkit-scrollbar-thumb:hover { background: var(--primary); }
    }

    /* ESTADOS EXTRA */
    .empty-glass-state {
      text-align: center;
      padding: 6rem 0;
      color: rgba(255,255,255,0.3);
      i { font-size: 5rem; opacity: 0.2; margin-bottom: 1.5rem; display: block; }
      h3 { color: #fff; font-family: var(--font-oswald); text-transform: uppercase; }
    }

    .glass-loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #fff;
      font-family: var(--font-urbanist);
      gap: 1.5rem;
    }

    /* RESPONSIVE */
    @media (max-width: 767px) {
      .centering-wrapper { padding: 1rem; }
      .glass-card { height: 90vh; border-radius: 1.5rem; }
      .glass-card-header { padding: 1.5rem; flex-direction: column; gap: 1.25rem; }
      .glass-title { font-size: 2rem; }
      .glass-back-btn, .glass-action-btn { width: 100%; justify-content: center; }
      .notif-glass-item { padding: 1.25rem; flex-direction: column; gap: 1rem; }
      .notif-glass-icon { width: 44px; height: 44px; min-width: 44px; }
    }
  `]
})
export class NotificationsPageComponent implements OnInit {
  notifications$: Observable<AppNotification[]>;
  sidebarCollapsed = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.notifications$ = this.notificationService.getNotifications();
  }

  ngOnInit(): void {}

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  onNotificationClick(n: AppNotification): void {
    if (!n.read) {
      this.notificationService.markAsRead(n.id);
    }
  }

  markAsRead(event: Event, id: string): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id);
  }

  deleteNotification(event: Event, id: string): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }
}
