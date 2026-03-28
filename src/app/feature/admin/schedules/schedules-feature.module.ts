import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchedulesRoutingModule } from './schedules-routing.module';
import { 
  GetSchedulesUseCase, 
  CreateScheduleUseCase, 
  UpdateScheduleUseCase, 
  DeleteScheduleUseCase, 
  GetScheduleByIdUseCase 
} from './domain/usecases/schedules.usecases';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SchedulesRoutingModule
  ],
  providers: [
    GetSchedulesUseCase,
    CreateScheduleUseCase,
    UpdateScheduleUseCase,
    DeleteScheduleUseCase,
    GetScheduleByIdUseCase
  ]
})
export class SchedulesFeatureModule { }
