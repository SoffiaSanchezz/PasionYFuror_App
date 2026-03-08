import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { filter, switchMap, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { IonicModule } from '@ionic/angular';

import { GetStudentsUseCase, UpdateStudentUseCase } from '../../../domain/usecases/students.usecases';
import { StudentEntity } from '../../../domain/entities/student.entity';
import { SidebarComponent } from '@shared/components/menus/sidebar/sidebar.component';

@Component({
  selector: 'app-student-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, RouterModule, SidebarComponent],
  templateUrl: './student-edit.component.html',
  styleUrls: ['./student-edit.component.scss'],
})
export class StudentEditComponent implements OnInit {
  sidebarCollapsed: boolean = false;
  studentForm!: FormGroup;
  guardianForm!: FormGroup;
  isMinor: boolean = false;
  studentId: string | null = null;
  studentPhotoUrl: SafeUrl | null = null;
  isLoading: boolean = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly getStudentsUseCase: GetStudentsUseCase,
    private readonly updateStudentUseCase: UpdateStudentUseCase,
    private readonly cdr: ChangeDetectorRef
  ) {}

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  private toSnakeCase(obj: any): any {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const snakeCaseKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        newObj[snakeCaseKey] = obj[key];
      }
    }
    return newObj;
  }

  ngOnInit(): void {
    this.initForms();
    this.loadStudentData();
  }

  initForms(): void {
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
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.studentId = id;
          return this.getStudentsUseCase.getStudentById(id);
        }
        this.router.navigate(['/admin/students']);
        return of(null);
      }),
      filter((student): student is StudentEntity => student !== null),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe(student => {
      this.isMinor = student.isMinor;
      this.applyGuardianValidators(this.isMinor);

      this.studentForm.patchValue({
        fullName: student.fullName,
        documentId: student.documentId,
        dateOfBirth: student.dateOfBirth,
        email: student.email,
        phone: student.phone,
        address: student.address,
      });

      if (student.isMinor) {
        this.guardianForm.patchValue({
          fullName: student.guardianFullName,
          documentId: student.guardianDocumentId,
          phone: student.guardianPhone,
          relationship: student.guardianRelationship,
          email: student.guardianEmail,
        });
      }

      if (student.photoPath) {
        this.studentPhotoUrl = this.sanitizer.bypassSecurityTrustUrl(student.photoPath);
      }
    });
  }

  applyGuardianValidators(isMinor: boolean): void {
    const controls = ['fullName', 'documentId', 'phone', 'relationship', 'email'];
    
    controls.forEach(controlName => {
      const control = this.guardianForm.get(controlName);
      if (isMinor) {
        if (controlName === 'email') {
          control?.setValidators([Validators.required, Validators.email]);
        } else {
          control?.setValidators(Validators.required);
        }
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
    const studentData = this.toSnakeCase(this.studentForm.value);
    const guardianData = this.isMinor ? this.toSnakeCase(this.guardianForm.value) : {};

    // Combine data as expected by the backend
    const updateData = {
      ...studentData,
      is_minor: this.isMinor,
      ...guardianData
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
