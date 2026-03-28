import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivitiesListPageComponent } from './presentation/pages/activities-list-page/activities-list-page.component';
import { ActivityFormComponent } from './presentation/pages/activity-form/activity-form.component';

const routes: Routes = [
  {
    path: '',
    component: ActivitiesListPageComponent
  },
  {
    path: 'new',
    component: ActivityFormComponent
  },
  {
    path: 'edit/:id',
    component: ActivityFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActivitiesRoutingModule { }
