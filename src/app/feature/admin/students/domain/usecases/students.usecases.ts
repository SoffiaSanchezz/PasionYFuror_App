// src/app/feature/admin/students/domain/usecases/students.usecases.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StudentsRepository } from '../repositories/students.repository';
import { StudentEntity } from '../entities/student.entity';

@Injectable()
export class DeleteStudentUseCase {
  constructor(private studentsRepository: StudentsRepository) {}

  execute(id: string, permanent: boolean = false): Observable<void> {
    return this.studentsRepository.deleteStudent(id, permanent);
  }
}

@Injectable()
export class GetStudentsUseCase {
  constructor(private studentsRepository: StudentsRepository) {}

  getAllStudents(): Observable<StudentEntity[]> {
    return this.studentsRepository.getAllStudents();
  }

  getStudentById(id: string): Observable<StudentEntity | null> {
    return this.studentsRepository.getStudentById(id);
  }
}

@Injectable()
export class UpdateStudentUseCase {
  constructor(private studentsRepository: StudentsRepository) {}

  execute(id: string, data: any): Observable<StudentEntity> {
    return this.studentsRepository.updateStudent(id, data);
  }
}

@Injectable()
export class CreateStudentUseCase {
  constructor(private studentsRepository: StudentsRepository) {}

  execute(data: any): Observable<StudentEntity> {
    return this.studentsRepository.createStudent(data);
  }
}
