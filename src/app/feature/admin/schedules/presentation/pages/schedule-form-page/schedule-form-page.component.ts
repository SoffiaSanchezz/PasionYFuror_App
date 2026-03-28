import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

import { SidebarComponent } from '@shared/components/menus/sidebar/sidebar.component';
import { CreateScheduleUseCase, UpdateScheduleUseCase, GetScheduleByIdUseCase } from '../../../domain/usecases/schedules.usecases';

@Component({
  selector: 'app-schedule-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, SidebarComponent, RouterModule],
  templateUrl: './schedule-form-page.component.html',
  styleUrls: ['./schedule-form-page.component.scss']
})
export class ScheduleFormPageComponent implements OnInit {
  sidebarCollapsed = false;
  scheduleForm!: FormGroup;
  isEditMode = false;
  scheduleId: string | null = null;
  isLoading = false;
  isSaving = false;

  days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly createScheduleUseCase: CreateScheduleUseCase,
    private readonly updateScheduleUseCase: UpdateScheduleUseCase,
    private readonly getScheduleByIdUseCase: GetScheduleByIdUseCase
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.scheduleId = this.route.snapshot.paramMap.get('id');
    if (this.scheduleId) {
      this.isEditMode = true;
      this.loadScheduleData();
    }
  }

  private initForm(): void {
    this.scheduleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      teacherName: ['', [Validators.required]],
      day: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      status: ['activo', [Validators.required]]
    });
  }

  private loadScheduleData(): void {
    if (!this.scheduleId) return;
    
    this.isLoading = true;
    this.getScheduleByIdUseCase.execute(this.scheduleId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (schedule) => {
          this.scheduleForm.patchValue(schedule);
        },
        error: (err) => {
          Swal.fire('Error', 'No se pudo cargar la información del horario', 'error');
          this.router.navigate(['/admin/schedules']);
        }
      });
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  onSubmit(): void {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const data = this.scheduleForm.value;

    const request$ = this.isEditMode 
      ? this.updateScheduleUseCase.execute(this.scheduleId!, data)
      : this.createScheduleUseCase.execute(data);

    request$.pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => {
          Swal.fire({
            title: '¡Éxito!',
            text: `Horario ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.router.navigate(['/admin/schedules']);
        },
        error: (err) => {
          Swal.fire('Error', err || 'Ocurrió un error inesperado', 'error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/schedules']);
  }
}
