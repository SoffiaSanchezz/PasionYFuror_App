import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivitiesRoutingModule } from './activities-routing.module';
import { 
  GetActivitiesUseCase, 
  CreateActivityUseCase, 
  UpdateActivityUseCase, 
  DeleteActivityUseCase, 
  GetActivityByIdUseCase 
} from './domain/usecases/activities.usecases';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ActivitiesRoutingModule
  ],
  providers: [
    GetActivitiesUseCase,
    CreateActivityUseCase,
    UpdateActivityUseCase,
    DeleteActivityUseCase,
    GetActivityByIdUseCase
  ]
})
export class ActivitiesFeatureModule { }
