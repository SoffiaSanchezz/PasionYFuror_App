import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../admin/dashboard/presentation/pages/main-dashboard/main-dashboard.component').then(m => m.MainDashboardComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardFeatureRoutingModule { }
