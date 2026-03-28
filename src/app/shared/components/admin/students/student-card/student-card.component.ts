import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { StudentEntity } from '../../../../../feature/admin/students/domain/entities/student.entity';

@Component({
  selector: 'app-student-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './student-card.component.html',
  styleUrls: ['./student-card.component.scss']
})
export class StudentCardComponent {
  @Input() student!: StudentEntity;
  @Input() isSelected: boolean = false;

  @Output() onSelect = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<string>();
  @Output() onShowGuardian = new EventEmitter<string>();
  @Output() onToggleStatus = new EventEmitter<StudentEntity>();
  @Output() onDelete = new EventEmitter<string>();

  selectCard(): void {
    this.onSelect.emit();
  }

  edit(event: Event): void {
    event.stopPropagation();
    this.onEdit.emit(this.student.id);
  }

  showGuardian(event: Event): void {
    event.stopPropagation();
    this.onShowGuardian.emit(this.student.id);
  }

  toggleStatus(event: Event): void {
    event.stopPropagation();
    this.onToggleStatus.emit(this.student);
  }

  delete(event: Event): void {
    event.stopPropagation();
    this.onDelete.emit(this.student.id);
  }
}
