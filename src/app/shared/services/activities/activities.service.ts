import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api/api.service';
import { ActivityEntity } from '../../../feature/admin/activities/domain/entities/activity.entity';

@Injectable({
  providedIn: 'root'
})
export class ActivitiesService {
  private readonly endpoint = 'activities';

  constructor(private readonly api: ApiService) {}

  getActivities(): Observable<ActivityEntity[]> {
    return this.api.get<ActivityEntity[]>(this.endpoint);
  }

  getActivityById(id: string): Observable<ActivityEntity> {
    return this.api.get<ActivityEntity>(`${this.endpoint}/${id}`);
  }

  createActivity(data: any): Observable<ActivityEntity> {
    return this.api.post<ActivityEntity>(this.endpoint, data);
  }

  updateActivity(id: string, data: any): Observable<ActivityEntity> {
    return this.api.put<ActivityEntity>(`${this.endpoint}/${id}`, data);
  }

  deleteActivity(id: string): Observable<any> {
    return this.api.delete<any>(`${this.endpoint}/${id}`);
  }
}
