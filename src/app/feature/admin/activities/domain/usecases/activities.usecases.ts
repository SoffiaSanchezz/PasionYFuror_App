import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivitiesService } from '@shared/services/activities/activities.service';
import { ActivityEntity } from '../entities/activity.entity';

@Injectable({ providedIn: 'root' })
export class GetActivitiesUseCase {
  constructor(private readonly service: ActivitiesService) {}
  execute(): Observable<ActivityEntity[]> { return this.service.getActivities(); }
}

@Injectable({ providedIn: 'root' })
export class CreateActivityUseCase {
  constructor(private readonly service: ActivitiesService) {}
  execute(data: any): Observable<ActivityEntity> { return this.service.createActivity(data); }
}

@Injectable({ providedIn: 'root' })
export class UpdateActivityUseCase {
  constructor(private readonly service: ActivitiesService) {}
  execute(id: string, data: any): Observable<ActivityEntity> { return this.service.updateActivity(id, data); }
}

@Injectable({ providedIn: 'root' })
export class DeleteActivityUseCase {
  constructor(private readonly service: ActivitiesService) {}
  execute(id: string): Observable<any> { return this.service.deleteActivity(id); }
}

@Injectable({ providedIn: 'root' })
export class GetActivityByIdUseCase {
  constructor(private readonly service: ActivitiesService) {}
  execute(id: string): Observable<ActivityEntity> { return this.service.getActivityById(id); }
}
