// src/app/feature/admin/students/domain/repositories/students.repository.ts
import { Observable } from 'rxjs';
import { StudentEntity } from '../entities/student.entity';

export abstract class StudentsRepository {
  abstract getAllStudents(): Observable<StudentEntity[]>;
  abstract getStudentById(id: string): Observable<StudentEntity | null>;
  abstract deleteStudent(id: string): Observable<void>;
  abstract toggleStudentStatus(id: string, status: string): Observable<StudentEntity>;
  abstract updateStudent(id: string, data: any): Observable<StudentEntity>;
  abstract createStudent(data: any): Observable<StudentEntity>;
  abstract getGuardianInfo(id: string): Observable<any>;
}
