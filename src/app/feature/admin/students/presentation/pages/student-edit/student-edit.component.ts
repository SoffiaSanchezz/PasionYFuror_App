import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { IonicModule } from '@ionic/angular';

import { GetStudentsUseCase, UpdateStudentUseCase } from '../../../domain/usecases/students.usecases';
import { SidebarComponent } from '@shared/components/menus/sidebar/sidebar.component';

@Component({
  selector: 'app-student-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, RouterModule, SidebarComponent],
  templateUrl: './student-edit.component.html',
  styleUrls: ['./student-edit.component.scss'],
})
export class StudentEditComponent implements OnInit {
  sidebarCollapsed = false;
  studentForm!: FormGroup;
  guardianForm!: FormGroup;
  isMinor = false;
  studentId: string | null = null;
  studentPhotoUrl: SafeUrl | null = null;
  isLoading = false;
  studentNotFound = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly getStudentsUseCase: GetStudentsUseCase,
    private readonly updateStudentUseCase: UpdateStudentUseCase,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.initForms(); // Inicialización inmediata
  }

  ngOnInit(): void {
    this.loadStudentData();
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  private initForms(): void {
    this.studentForm = this.fb.group({
      fullName: ['', Validators.required],
      documentId: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
    });

    this.guardianForm = this.fb.group({
      fullName: [''],
      documentId: [''],
      phone: [''],
      relationship: [''],
      email: ['', [Validators.email]],
    });
  }

  loadStudentData(): void {
    this.isLoading = true;
    this.studentNotFound = false;
    
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          this.router.navigate(['/admin/students']);
          return of(null);
        }
        this.studentId = id;
        return this.getStudentsUseCase.getStudentById(id).pipe(
          catchError(error => {
            console.error('Error loading student:', error);
            this.studentNotFound = true;
            return of(null);
          })
        );
      }),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe(student => {
      if (!student) return;

      this.isMinor = !!student.isMinor;
      this.applyGuardianValidators(this.isMinor);

      this.studentForm.patchValue({
        fullName: student.fullName || '',
        documentId: student.documentId || '',
        dateOfBirth: student.dateOfBirth || '',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
      });

      if (this.isMinor) {
        this.guardianForm.patchValue({
          fullName: student.guardianFullName || '',
          documentId: student.guardianDocumentId || '',
          phone: student.guardianPhone || '',
          relationship: student.guardianRelationship || '',
          email: student.guardianEmail || '',
        });
      }

      if (student.photoPath) {
        this.studentPhotoUrl = this.sanitizer.bypassSecurityTrustUrl(student.photoPath);
      }
    });
  }

  applyGuardianValidators(isMinor: boolean): void {
    const controls = ['fullName', 'documentId', 'phone', 'relationship', 'email'];
    controls.forEach(name => {
      const control = this.guardianForm.get(name);
      if (isMinor) {
        control?.setValidators(name === 'email' ? [Validators.required, Validators.email] : Validators.required);
      } else {
        control?.clearValidators();
      }
      control?.updateValueAndValidity();
    });
  }

  updateStudent(): void {
    if (this.studentForm.invalid || (this.isMinor && this.guardianForm.invalid)) {
      this.studentForm.markAllAsTouched();
      this.guardianForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    
    // Preparar datos para el backend (formato snake_case manual o como espere tu repo)
    const updateData = {
      full_name: this.studentForm.value.fullName,
      document_id: this.studentForm.value.documentId,
      date_of_birth: this.studentForm.value.dateOfBirth,
      email: this.studentForm.value.email,
      phone: this.studentForm.value.phone,
      address: this.studentForm.value.address,
      is_minor: this.isMinor,
      ...(this.isMinor ? {
        guardian_full_name: this.guardianForm.value.fullName,
        guardian_document_id: this.guardianForm.value.documentId,
        guardian_phone: this.guardianForm.value.phone,
        guardian_relationship: this.guardianForm.value.relationship,
        guardian_email: this.guardianForm.value.email
      } : {})
    };

    this.updateStudentUseCase.execute(this.studentId!, updateData)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          alert('¡Estudiante actualizado exitosamente!');
          this.router.navigate(['/admin/students']);
        },
        error: (error) => {
          console.error('Error al actualizar estudiante:', error);
          alert('Error al actualizar estudiante.');
        }
      });
  }

  goToStudentList(): void {
    this.router.navigate(['/admin/students']);
  }
}
