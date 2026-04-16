// src/app/feature/admin/students/presentation/pages/student-list/student-list.component.ts
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { IonicModule, NavController } from '@ionic/angular';

import Swal from 'sweetalert2';

import { StatCardComponent } from 'src/app/shared/components/cards/stat-card/stat-card.component';
import { DataTableComponent, TableColumn, TableAction } from 'src/app/shared/components/tables/data-table/data-table.component';
import { StudentEntity } from 'src/app/feature/admin/students/domain/entities/student.entity';
import { DeleteStudentUseCase, GetStudentsUseCase } from 'src/app/feature/admin/students/domain/usecases/students.usecases';
import { StudentsService } from 'src/app/shared/services/students/students.service';
import { SchedulesService } from 'src/app/shared/services/schedules/schedules.service';
import { ScheduleEntity } from 'src/app/feature/admin/schedules/domain/entities/schedule.entity';

import { ScrollTrackDirective } from '@shared/directives/scroll-track.directive';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatCardComponent, DataTableComponent, IonicModule, PageHeaderComponent, ScrollTrackDirective],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss']
})
export class StudentListComponent implements OnInit {
  activeStudents: StudentEntity[] = [];
  disabledStudents: StudentEntity[] = [];
  filteredActiveStudents: StudentEntity[] = [];
  filteredDisabledStudents: StudentEntity[] = [];
  
  searchTerm: string = '';
  currentTab: string = 'active';
  isLoading: boolean = true;
  selectedStudent: any | null = null;
  selectedGuardianInfo: any = null;
  isGuardianModalOpen = false;

  // Class assignment modal
  isClassesModalOpen = false;
  availableSchedules: ScheduleEntity[] = [];
  selectedScheduleIds: string[] = [];
  allowedAllClasses: boolean = false;

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
    { name: 'edit', icon: 'pencil-fill', color: 'primary', tooltip: 'Editar Estudiante' },
    { 
      name: 'guardian', 
      icon: 'shield-lock-fill', 
      color: 'success', 
      tooltip: 'Ver Acudiente / Seguridad',
      hidden: (row) => !row.isMinor 
    },
    { name: 'classes', icon: 'mortarboard-fill', color: 'warning', tooltip: 'Asignar Clases' },
    { name: 'delete', icon: 'trash3-fill', color: 'danger', tooltip: 'Eliminar Permanente' }
  ];

  disabledActions: TableAction[] = [
    { name: 'toggle', icon: 'person-check-fill', color: 'success', tooltip: 'Habilitar' },
    { name: 'delete', icon: 'trash3-fill', color: 'danger', tooltip: 'Eliminar' }
  ];

  constructor(
    private readonly getStudentsUseCase: GetStudentsUseCase,
    private readonly deleteStudentUseCase: DeleteStudentUseCase,
    private readonly studentsService: StudentsService,
    private readonly schedulesService: SchedulesService,
    private readonly router: Router,
    private readonly navCtrl: NavController,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // ngOnInit solo se dispara una vez al crear el componente.
    this.loadSchedules();
  }

  // Hook de Ionic: Se dispara cada vez que la página entra en foco
  ionViewWillEnter() {
    this.fixFocusAndVisibility();
    this.loadStudents();
  }

  private fixFocusAndVisibility() {
    // 1. Quitar foco de cualquier elemento (previene error de aria-hidden)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 2. Limpieza de Bootstrap residual
    document.body.classList.remove('modal-open');
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(b => b.remove());
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // 3. Forzar visibilidad de la página
    const page = document.querySelector('app-student-list');
    if (page) {
      page.classList.remove('ion-page-hidden');
      page.removeAttribute('aria-hidden');
    }
  }

  loadSchedules(): void {
    this.schedulesService.getSchedules().subscribe({
      next: (schedules) => {
        this.availableSchedules = schedules;
      },
      error: (err) => console.error('Error al cargar horarios:', err)
    });
  }

  loadStudents(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.getStudentsUseCase.getAllStudents()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.applyFilter();
          this.cdr.markForCheck(); 
          this.cdr.detectChanges(); // Forzar renderizado visual
        })
      )
      .subscribe({
        next: (students: StudentEntity[]) => {
          if (Array.isArray(students)) {
            this.activeStudents = students.filter(s => s && s.status === 'activo');
            this.disabledStudents = students.filter(s => s && s.status === 'inactivo');
          }
        },
        error: (error: any) => {
          console.error('Error al cargar estudiantes:', error);
          this.activeStudents = [];
          this.disabledStudents = [];
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

  selectStudent(student: StudentEntity): void {
    this.selectedStudent = this.selectedStudent?.id === student.id ? null : student;
  }

  onTableAction(event: { action: string, row: any }): void {
    const { action, row } = event;
    
    switch (action) {
      case 'edit':
        this.editStudent(row.id);
        break;
      case 'guardian':
        this.showGuardianInfo(row.id);
        break;
      case 'classes':
        this.openClassesModal(row);
        break;
      case 'toggle':
        this.toggleStudentStatus(row);
        break;
      case 'delete':
        this.deleteStudent(row);
        break;
    }
  }

  editStudent(studentId: string): void {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.navCtrl.navigateForward(['/admin/students/edit', studentId]);
  }

  toggleStudentStatus(student: StudentEntity): void {
    const newStatus = student.status === 'activo' ? 'inactivo' : 'activo';
    this.studentsService.toggleStudentStatus(student.id, newStatus).subscribe({
      next: () => this.loadStudents(),
      error: (err: any) => console.error('Error al cambiar estado:', err)
    });
  }

  deleteStudent(student: StudentEntity): void {
    const isInactive = student.status === 'inactivo';
    
    Swal.fire({
      title: isInactive ? '¿Eliminar permanentemente?' : '¿Desactivar estudiante?',
      text: isInactive 
        ? 'Este estudiante ya está inactivo. ¿Deseas borrarlo completamente de la base de datos?' 
        : 'El estudiante pasará a la lista de inactivos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b11226',
      cancelButtonColor: '#6c757d',
      confirmButtonText: isInactive ? 'Sí, eliminar de la DB' : 'Sí, desactivar',
      cancelButtonText: 'No, cancelar',
      background: '#1a1a1a',
      color: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.cdr.detectChanges();
        
        this.deleteStudentUseCase.execute(student.id, isInactive).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Hecho!',
              text: isInactive ? 'Estudiante eliminado permanentemente.' : 'Estudiante desactivado.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
              background: '#1a1a1a',
              color: '#ffffff'
            });
            this.loadStudents();
          },
          error: (err: any) => {
            this.isLoading = false;
            this.cdr.detectChanges();
            Swal.fire('Error', 'No se pudo completar la acción.', 'error');
          }
        });
      }
    });
  }

  showGuardianInfo(studentId: string): void {
    const student = [...this.activeStudents, ...this.disabledStudents].find(s => s.id === studentId);
    if (!student) return;

    this.selectedStudent = student;

    if (student.isMinor) {
      this.isLoading = true;
      this.cdr.detectChanges();
      this.studentsService.getGuardianInfo(studentId).subscribe({
        next: (info: any) => {
          this.selectedGuardianInfo = info;
          this.isLoading = false;
          this.isGuardianModalOpen = true;
          this.cdr.detectChanges();
        },
        error: () => {
          this.selectedGuardianInfo = null;
          this.isLoading = false;
          this.isGuardianModalOpen = true;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.selectedGuardianInfo = null;
      this.isGuardianModalOpen = true;
      this.cdr.detectChanges();
    }
  }

  closeGuardianModal(): void {
    this.isGuardianModalOpen = false;
    this.selectedStudent = null;
    this.selectedGuardianInfo = null;
    this.cdr.detectChanges();
  }

  openClassesModal(student: any): void {
    this.selectedStudent = student;
    this.allowedAllClasses = student.allowedAllClasses || false;
    this.selectedScheduleIds = student.allowedScheduleIds || [];
    this.isClassesModalOpen = true;
    this.cdr.detectChanges();
  }

  closeClassesModal(): void {
    this.isClassesModalOpen = false;
    this.selectedStudent = null;
    this.cdr.detectChanges();
  }

  saveClassesAssignment(): void {
    if (!this.selectedStudent) return;

    this.isLoading = true;
    this.cdr.detectChanges();

    const data = {
      allowed_all_classes: this.allowedAllClasses,
      schedule_ids: this.selectedScheduleIds
    };

    this.studentsService.updateStudentSchedules(this.selectedStudent.id, data).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Clases asignadas correctamente.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#1a1a1a',
          color: '#ffffff'
        });
        this.closeClassesModal();
        this.loadStudents();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire('Error', 'No se pudo guardar la asignación.', 'error');
        console.error('Error al guardar clases:', err);
      }
    });
  }

  toggleScheduleSelection(scheduleId: string): void {
    const index = this.selectedScheduleIds.indexOf(scheduleId);
    if (index > -1) {
      this.selectedScheduleIds.splice(index, 1);
    } else {
      this.selectedScheduleIds.push(scheduleId);
    }
  }

  onToggleAllClasses(event: any): void {
    this.allowedAllClasses = event.detail.checked;
    if (this.allowedAllClasses) {
      this.selectedScheduleIds = [];
    }
  }
}
