import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SchedulesService } from '@shared/services/schedules/schedules.service';
import { ScheduleEntity } from '../entities/schedule.entity';

@Injectable({
  providedIn: 'root'
})
export class GetSchedulesUseCase {
  constructor(private readonly schedulesService: SchedulesService) {}
  execute(): Observable<ScheduleEntity[]> {
    return this.schedulesService.getSchedules();
  }
}

@Injectable({
  providedIn: 'root'
})
export class CreateScheduleUseCase {
  constructor(private readonly schedulesService: SchedulesService) {}
  execute(data: Partial<ScheduleEntity>): Observable<ScheduleEntity> {
    return this.schedulesService.createSchedule(data);
  }
}

@Injectable({
  providedIn: 'root'
})
export class UpdateScheduleUseCase {
  constructor(private readonly schedulesService: SchedulesService) {}
  execute(id: string, data: Partial<ScheduleEntity>): Observable<ScheduleEntity> {
    return this.schedulesService.updateSchedule(id, data);
  }
}

@Injectable({
  providedIn: 'root'
})
export class DeleteScheduleUseCase {
  constructor(private readonly schedulesService: SchedulesService) {}
  execute(id: string): Observable<any> {
    return this.schedulesService.deleteSchedule(id);
  }
}

@Injectable({
  providedIn: 'root'
})
export class GetScheduleByIdUseCase {
  constructor(private readonly schedulesService: SchedulesService) {}
  execute(id: string): Observable<ScheduleEntity> {
    return this.schedulesService.getScheduleById(id);
  }
}
