import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScheduleEntity } from '../../../domain/entities/schedule.entity';

@Component({
  selector: 'app-schedule-list-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule-list-table.component.html',
  styleUrls: ['./schedule-list-table.component.scss']
})
export class ScheduleListTableComponent {
  @Input() schedules: ScheduleEntity[] | null = [];
  @Output() edit = new EventEmitter<ScheduleEntity>();
  @Output() delete = new EventEmitter<string>();

  onEdit(schedule: ScheduleEntity): void {
    this.edit.emit(schedule);
  }

  onDelete(id: string): void {
    this.delete.emit(id);
  }
}
