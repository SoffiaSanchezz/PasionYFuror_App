import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SchedulesPageComponent } from './presentation/pages/schedules-page/schedules-page.component';
import { AttendanceRecordsPageComponent } from './presentation/pages/attendance-records-page/attendance-records-page.component';
import { ScheduleFormPageComponent } from './presentation/pages/schedule-form-page/schedule-form-page.component';

const routes: Routes = [
  {
    path: '',
    component: SchedulesPageComponent
  },
  {
    path: 'attendance-records',
    component: AttendanceRecordsPageComponent
  },
  {
    path: 'new',
    component: ScheduleFormPageComponent
  },
  {
    path: 'edit/:id',
    component: ScheduleFormPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SchedulesRoutingModule { }
