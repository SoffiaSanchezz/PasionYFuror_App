import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/pages/main-dashboard/main-dashboard.component').then(m => m.MainDashboardComponent)
  },
  {
    path: 'notificaciones',
    loadComponent: () => import('./presentation/pages/notifications/notifications.component').then(m => m.NotificationsPageComponent)
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardFeatureRoutingModule { }
