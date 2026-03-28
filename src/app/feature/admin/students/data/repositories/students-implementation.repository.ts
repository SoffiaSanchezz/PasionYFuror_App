// src/app/feature/admin/students/data/repositories/students-implementation.repository.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StudentsRepository } from '../../domain/repositories/students.repository';
import { StudentEntity } from '../../domain/entities/student.entity';
import { StudentsService, Student } from '../../../../../shared/services/students/students.service';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StudentsImplementationRepository implements StudentsRepository {

  constructor(private apiService: StudentsService) {}

  getAllStudents(): Observable<StudentEntity[]> {
    return this.apiService.getAllStudents().pipe(
      map((models: Student[]) => models.map(m => this.toEntity(m)))
    );
  }

  getStudentById(id: string): Observable<StudentEntity | null> {
    return this.apiService.getStudentById(id).pipe(
      map((model: Student) => model ? this.toEntity(model) : null)
    );
  }

  deleteStudent(id: string, permanent: boolean = false): Observable<void> {
    return this.apiService.deleteStudent(id, permanent);
  }

  toggleStudentStatus(id: string, status: string): Observable<StudentEntity> {
    return this.apiService.toggleStudentStatus(id, status).pipe(
      map(m => this.toEntity(m))
    );
  }

  updateStudent(id: string, data: any): Observable<StudentEntity> {
    return this.apiService.updateStudent(id, data).pipe(
      map(m => this.toEntity(m))
    );
  }

  createStudent(data: any): Observable<StudentEntity> {
    return this.apiService.createStudent(data).pipe(
      map(m => this.toEntity(m))
    );
  }

  getGuardianInfo(id: string): Observable<any> {
    return this.apiService.getGuardianInfo(id);
  }

  private toEntity(model: Student): StudentEntity {
    const baseUrl = environment.apiUrl.replace('/api', ''); // Ajustar según estructura de carpetas del back
    
    return {
      id: model.id,
      fullName: model.full_name,
      documentId: model.document_id,
      dateOfBirth: model.date_of_birth,
      email: model.email,
      phone: model.phone,
      address: model.address,
      photoPath: model.photo_path ? `${baseUrl}/${model.photo_path}` : null,
      signaturePath: model.signature_path ? `${baseUrl}/${model.signature_path}` : null,
      isMinor: model.is_minor,
      guardianFullName: model.guardian_full_name,
      guardianDocumentId: model.guardian_document_id,
      guardianPhone: model.guardian_phone,
      guardianRelationship: model.guardian_relationship,
      guardianEmail: model.guardian_email,
      faceDescriptor: model.face_descriptor,
      status: model.status,
      createdAt: model.created_at,
    };
  }
}
