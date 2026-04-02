import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainDashboardComponent } from './dashboard/presentation/pages/main-dashboard/main-dashboard.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: MainDashboardComponent
  },
  {
    path: 'students',
    loadChildren: () => import('./students/students-feature.module').then(m => m.StudentsFeatureModule)
  },
  {
    path: 'schedules',
    loadChildren: () => import('./schedules/schedules-feature.module').then(m => m.SchedulesFeatureModule)
  },
  {
    path: 'activities',
    loadChildren: () => import('./activities/activities-feature.module').then(m => m.ActivitiesFeatureModule)
  },
  {
    path: 'payments',
    loadChildren: () => import('./payments/payments-feature.module').then(m => m.PaymentsFeatureModule)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminFeatureRoutingModule { }
