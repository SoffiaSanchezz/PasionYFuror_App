import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import { IonicModule } from '@ionic/angular';

import { SchedulesService } from '@shared/services/schedules/schedules.service';

@Component({
  selector: 'app-attendance-records-page',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule],
  templateUrl: './attendance-records-page.component.html',
  styleUrls: ['./attendance-records-page.component.scss']
})
export class AttendanceRecordsPageComponent implements OnInit {
  isLoading = false;
  
  private attendanceRecordsSubject = new BehaviorSubject<any[]>([]);
  attendanceRecords$: Observable<any[]> = this.attendanceRecordsSubject.asObservable();

  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAttendanceRecords();
  }

  loadAttendanceRecords(): void {
    this.isLoading = true;
    this.schedulesService.getAttendanceRecords()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.attendanceRecordsSubject.next(data);
        },
        error: (err) => {
          console.error('Error al cargar registros de asistencia', err);
        }
      });
  }
}
