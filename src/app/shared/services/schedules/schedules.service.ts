import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api/api.service';
import { ScheduleEntity } from '../../../feature/admin/schedules/domain/entities/schedule.entity';

@Injectable({
  providedIn: 'root'
})
export class SchedulesService {
  private readonly endpoint = 'schedules';

  constructor(private readonly api: ApiService) {}

  /** --- CRUD DE HORARIOS --- **/

  getSchedules(): Observable<ScheduleEntity[]> {
    return this.api.get<ScheduleEntity[]>(this.endpoint);
  }

  getScheduleById(id: string): Observable<ScheduleEntity> {
    return this.api.get<ScheduleEntity>(`${this.endpoint}/${id}`);
  }

  createSchedule(data: Partial<ScheduleEntity>): Observable<ScheduleEntity> {
    return this.api.post<ScheduleEntity>(this.endpoint, data);
  }

  updateSchedule(id: string, data: Partial<ScheduleEntity>): Observable<ScheduleEntity> {
    return this.api.put<ScheduleEntity>(`${this.endpoint}/${id}`, data);
  }

  deleteSchedule(id: string): Observable<any> {
    return this.api.delete<any>(`${this.endpoint}/${id}`);
  }

  /** --- REGISTROS DE ASISTENCIA --- **/

  getAttendanceRecords(): Observable<any[]> {
    return this.api.get<any[]>('attendance');
  }

  recordAttendance(data: any): Observable<any> {
    return this.api.post<any>('attendance', data);
  }
}
