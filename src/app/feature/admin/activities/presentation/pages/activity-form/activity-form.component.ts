import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { IonicModule } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import Swal from 'sweetalert2';

import { GetActivityByIdUseCase, CreateActivityUseCase, UpdateActivityUseCase } from '../../../domain/usecases/activities.usecases';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
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
        next: (activity: any) => {
          this.activityForm.patchValue({
            title: activity.title,
            description: activity.description,
            eventDate: activity.eventDate,
            eventTime: activity.eventTime,
            invitedEmails: activity.invitedEmails || []
          });
          if (activity.imagePath) {
            // Usar la URL base del entorno para consistencia
            this.imageUrl = `${environment.apiUrl}/uploads/${activity.imagePath}`;
          }
        },
        error: () => {
          Swal.fire('Error', 'No se pudo cargar la actividad', 'error');
          this.onCancel();
        }
      });
  }

  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  async openImagePicker(): Promise<void> {
    if (this.isNative) {
      await this.pickImageNative();
    }
    // En web el input file del template maneja la selección
  }

  async pickImageNative(): Promise<void> {
    try {
      // Verificar estado actual sin solicitar aún
      const current = await Camera.checkPermissions();
      console.log('[Camera] Current permissions:', JSON.stringify(current));

      if (current.photos === 'denied') {
        Swal.fire('Permiso denegado', 'Habilita el acceso a fotos en Ajustes > Aplicaciones > Furor Y Pasion > Permisos', 'warning');
        return;
      }

      // Si no está granted/limited, solicitarlo explícitamente
      if (current.photos === 'prompt' || current.photos === 'prompt-with-rationale') {
        const requested = await Camera.requestPermissions({ permissions: ['photos'] });
        console.log('[Camera] Requested permissions:', JSON.stringify(requested));
        if (requested.photos === 'denied') {
          Swal.fire('Permiso denegado', 'Habilita el acceso a fotos en Ajustes > Aplicaciones > Furor Y Pasion > Permisos', 'warning');
          return;
        }
      }

      console.log('[Camera] Calling getPhoto...');
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        promptLabelHeader: 'Seleccionar foto',
        promptLabelPhoto: 'Desde la galería',
        promptLabelPicture: 'Tomar foto'
      });

      console.log('[Camera] Photo received, format:', photo.format, 'has base64:', !!photo.base64String);

      if (photo.base64String) {
        const dataUrl = `data:image/${photo.format};base64,${photo.base64String}`;
        this.imageUrl = dataUrl;
        this.activityForm.patchValue({ image_file_base64: dataUrl });
        this.cdr.detectChanges();
      }
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      console.error('[Camera] Error:', msg, err);
      const cancelled = msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('no image') || msg.toLowerCase().includes('dismissed');
      if (!cancelled) {
        Swal.fire('Error', `No se pudo acceder a la galería: ${msg}`, 'error');
      }
    }
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
        error: (err: any) => Swal.fire('Error', 'No se pudo guardar la actividad', 'error')
      });
  }

  onCancel(): void {
    this.router.navigate(['/admin/activities']);
  }
}
