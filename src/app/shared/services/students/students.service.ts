// src/app/feature/admin/students/presentation/services/students.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api/api.service';

export interface Student {
  id: string;
  full_name: string;
  document_id: string;
  date_of_birth: string;
  email?: string | null;
  phone: string;
  address: string;
  photo_path?: string | null;
  signature_path?: string | null;
  is_minor: boolean;
  guardian_full_name?: string | null;
  guardian_document_id?: string | null;
  guardian_phone?: string | null;
  guardian_relationship?: string | null;
  guardian_email?: string | null;
  face_descriptor?: string | null;
  status: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentsService {
  private readonly endpoint = 'students';

  constructor(private readonly api: ApiService) {}

  getAllStudents(): Observable<Student[]> {
    return this.api.get<Student[]>(this.endpoint);
  }

  getStudentById(id: string): Observable<Student> {
    return this.api.get<Student>(`${this.endpoint}/${id}`);
  }

  deleteStudent(id: string, permanent: boolean = false): Observable<any> {
    return this.api.delete<any>(`${this.endpoint}/${id}?permanent=${permanent}`);
  }

  toggleStudentStatus(id: string, status: string): Observable<Student> {
    return this.api.patch<Student>(`${this.endpoint}/${id}/status`, { status });
  }

  updateStudent(id: string, data: any): Observable<Student> {
    return this.api.put<Student>(`${this.endpoint}/${id}`, data);
  }

  createStudent(data: any): Observable<Student> {
    return this.api.post<Student>(this.endpoint, data);
  }

  affiliateStudent(data: any): Observable<Student> {
    return this.api.post<Student>(`${this.endpoint}/affiliate`, data);
  }

  getGuardianInfo(id: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/${id}/guardian`);
  }

  getRegulation(): Observable<Blob> {
    return this.api.getBlob(`${this.endpoint}/regulation`);
  }
}
