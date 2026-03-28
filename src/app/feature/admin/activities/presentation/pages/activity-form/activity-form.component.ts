import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { GetActivityByIdUseCase, CreateActivityUseCase, UpdateActivityUseCase } from '../../domain/usecases/activities.usecases';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './activity-form.component.html',
  styleUrls: ['./activity-form.component.scss']
})
export class ActivityFormComponent implements OnInit {
  activityForm!: FormGroup;
  isEditMode = false;
  activityId: string | null = null;
  isLoading = false;
  isSaving = false;
  imageUrl: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly createActivityUseCase: CreateActivityUseCase,
    private readonly updateActivityUseCase: UpdateActivityUseCase,
    private readonly getActivityByIdUseCase: GetActivityByIdUseCase,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.activityId = this.route.snapshot.paramMap.get('id');
    if (this.activityId) {
      this.isEditMode = true;
      this.loadActivity();
    }
  }

  private initForm(): void {
    this.activityForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: [''],
      eventDate: ['', Validators.required],
      eventTime: ['', Validators.required],
      invitedEmails: [[]],
      image_file_base64: [null]
    });
  }

  loadActivity(): void {
    this.isLoading = true;
    this.getActivityByIdUseCase.execute(this.activityId!)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (activity) => {
          this.activityForm.patchValue({
            title: activity.title,
            description: activity.description,
            eventDate: activity.eventDate,
            eventTime: activity.eventTime,
            invitedEmails: activity.invitedEmails || []
          });
          if (activity.imagePath) {
            // El backend sirve las imágenes desde la raíz /uploads
            this.imageUrl = `${window.location.origin.replace('4200', '5000')}/${activity.imagePath}`;
          }
        },
        error: () => {
          Swal.fire('Error', 'No se pudo cargar la actividad', 'error');
          this.onCancel();
        }
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire('Imagen muy grande', 'El tamaño máximo es 2MB', 'warning');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result as string;
        this.activityForm.patchValue({ image_file_base64: this.imageUrl });
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.imageUrl = null;
    this.selectedFile = null;
    this.activityForm.patchValue({ image_file_base64: null });
  }

  addEmail(event: any, input: HTMLInputElement): void {
    event.preventDefault();
    const email = input.value.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const currentEmails = this.activityForm.get('invitedEmails')?.value as string[];
      if (!currentEmails.includes(email)) {
        this.activityForm.get('invitedEmails')?.setValue([...currentEmails, email]);
      }
      input.value = '';
    }
  }

  removeEmail(email: string): void {
    const currentEmails = this.activityForm.get('invitedEmails')?.value as string[];
    this.activityForm.get('invitedEmails')?.setValue(currentEmails.filter(e => e !== email));
  }

  onSubmit(): void {
    if (this.activityForm.invalid) {
      this.activityForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const data = this.activityForm.value;

    const request$ = this.isEditMode
      ? this.updateActivityUseCase.execute(this.activityId!, data)
      : this.createActivityUseCase.execute(data);

    request$.pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => {
          Swal.fire('¡Éxito!', `Actividad ${this.isEditMode ? 'actualizada' : 'creada'} correctamente`, 'success');
          this.onCancel();
        },
        error: (err) => Swal.fire('Error', 'No se pudo guardar la actividad', 'error')
      });
  }

  onCancel(): void {
    this.router.navigate(['/admin/activities']);
  }
}
