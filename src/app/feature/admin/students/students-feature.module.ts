// src/app/feature/admin/students/students-feature.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentsRepository } from './domain/repositories/students.repository';
import { StudentsImplementationRepository } from './data/repositories/students-implementation.repository';
import { StudentsRoutingModules } from './students-routing.modules';
import { DeleteStudentUseCase, GetStudentsUseCase, UpdateStudentUseCase, CreateStudentUseCase } from './domain/usecases/students.usecases';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StudentsRoutingModules
  ],
  providers: [
    { provide: StudentsRepository, useClass: StudentsImplementationRepository },
    DeleteStudentUseCase,
    GetStudentsUseCase,
    UpdateStudentUseCase,
    CreateStudentUseCase
  ]
})
export class StudentsFeatureModule { }
