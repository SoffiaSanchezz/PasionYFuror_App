// src/app/feature/admin/students/presentation/pages/student-list/student-list.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Modal } from 'bootstrap';

import { StudentsService } from '@shared/services/students/students.service';
import { SidebarComponent } from '@shared/components/menus/sidebar/sidebar.component';
import { StatCardComponent } from '@shared/components/cards/stat-card/stat-card.component';
import { DataTableComponent, TableColumn, TableAction } from '@shared/components/tables/data-table/data-table.component';
import { DeleteStudentUseCase, GetStudentsUseCase } from '../../../domain/usecases/students.usecases';
import { IonicModule } from '@ionic/angular';
import { StudentEntity } from '../../../domain/entities/student.entity';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, StatCardComponent, DataTableComponent, IonicModule],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss']
})
export class StudentListComponent implements OnInit {
  sidebarCollapsed: boolean = false;
  
  activeStudents: StudentEntity[] = [];
  disabledStudents: StudentEntity[] = [];
  filteredActiveStudents: StudentEntity[] = [];
  filteredDisabledStudents: StudentEntity[] = [];
  
  searchTerm: string = '';
  currentTab: string = 'active';
  isLoading: boolean = true;
  selectedStudent: StudentEntity | null = null;
  selectedGuardianInfo: any = null;

  // Table Configuration
  studentColumns: TableColumn[] = [
    { key: 'fullName', label: 'Estudiante', type: 'avatar-text' },
    { key: 'documentId', label: 'Documento', type: 'badge' },
    { key: 'email', label: 'Correo Electrónico' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'createdAt', label: 'Registro', type: 'date' },
    { key: 'status', label: 'Estado', type: 'status' }
  ];

  activeActions: TableAction[] = [
    { name: 'edit', icon: 'pencil-fill', color: 'primary', tooltip: 'Editar' },
    { name: 'guardian', icon: 'shield-lock-fill', color: 'warning', tooltip: 'Acudiente' },
    { name: 'toggle', icon: 'eye-slash-fill', color: 'danger', tooltip: 'Deshabilitar' },
    { name: 'delete', icon: 'trash3-fill', color: 'danger', tooltip: 'Eliminar' }
  ];

  disabledActions: TableAction[] = [
    { name: 'toggle', icon: 'person-check-fill', color: 'success', tooltip: 'Habilitar' },
    { name: 'delete', icon: 'trash3-fill', color: 'danger', tooltip: 'Eliminar' }
  ];

  constructor(
    private readonly getStudentsUseCase: GetStudentsUseCase,
    private readonly deleteStudentUseCase: DeleteStudentUseCase,
    private readonly studentsService: StudentsService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadStudents();
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  loadStudents(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.getStudentsUseCase.getAllStudents()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.applyFilter();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (students: StudentEntity[]) => {
          this.activeStudents = students.filter(s => s.status === 'activo');
          this.disabledStudents = students.filter(s => s.status === 'inactivo');
        },
        error: (error) => {
          console.error('Error al cargar estudiantes:', error);
        }
      });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    const filterFn = (s: StudentEntity) => 
      s.fullName.toLowerCase().includes(term) || 
      s.documentId.toLowerCase().includes(term) || 
      (s.email && s.email.toLowerCase().includes(term));

    this.filteredActiveStudents = this.activeStudents.filter(filterFn);
    this.filteredDisabledStudents = this.disabledStudents.filter(filterFn);
    this.cdr.detectChanges();
  }

  selectTab(event: any): void {
    this.currentTab = event.detail?.value || event;
    this.selectedStudent = null;
    this.applyFilter();
  }

  setTab(tab: string): void {
    this.currentTab = tab;
    this.selectedStudent = null;
    this.applyFilter();
  }

  selectStudent(student: StudentEntity): void {
    this.selectedStudent = this.selectedStudent?.id === student.id ? null : student;
  }

  onTableAction(event: { action: string, row: StudentEntity }): void {
    const { action, row } = event;
    
    switch (action) {
      case 'edit':
        this.editStudent(row.id);
        break;
      case 'guardian':
        this.showGuardianInfo(row.id);
        break;
      case 'toggle':
        this.toggleStudentStatus(row);
        break;
      case 'delete':
        this.deleteStudent(row.id);
        break;
    }
  }

  editStudent(studentId: string): void {
    this.router.navigate(['/admin/students/edit', studentId]);
  }

  toggleStudentStatus(student: StudentEntity): void {
    const newStatus = student.status === 'activo' ? 'inactivo' : 'activo';
    this.studentsService.toggleStudentStatus(student.id, newStatus).subscribe({
      next: () => this.loadStudents(),
      error: (err) => console.error('Error al cambiar estado:', err)
    });
  }

  deleteStudent(studentId: string): void {
    if (confirm('¿Está seguro de que desea eliminar permanentemente a este estudiante?')) {
      this.deleteStudentUseCase.execute(studentId).subscribe({
        next: () => this.loadStudents(),
        error: (err) => alert('Error al eliminar estudiante.')
      });
    }
  }

  showGuardianInfo(studentId: string): void {
    const student = [...this.activeStudents, ...this.disabledStudents].find(s => s.id === studentId);
    if (student?.isMinor) {
      this.studentsService.getGuardianInfo(studentId).subscribe({
        next: (info) => {
          this.selectedGuardianInfo = info;
          this.openGuardianModal();
        },
        error: () => {
          this.selectedGuardianInfo = null;
          this.openGuardianModal();
        }
      });
    }
  }

  private openGuardianModal(): void {
    const el = document.getElementById('guardianInfoModal');
    if (el) {
      const m = Modal.getInstance(el) || new Modal(el);
      m.show();
    }
  }
}
