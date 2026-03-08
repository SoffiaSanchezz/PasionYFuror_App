// src/app/feature/admin/students/students-routing.modules.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentListComponent } from './presentation/pages/student-list/student-list.component';
import { StudentEditComponent } from './presentation/pages/student-edit/student-edit.component';
import { StudentAffiliationComponent } from './presentation/pages/student-affiliation/student-affiliation.component';

const routes: Routes = [
  {
    path: '',
    component: StudentListComponent
  },
  {
    path: 'new',
    component: StudentAffiliationComponent
  },
  {
    path: 'edit/:id',
    component: StudentEditComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentsRoutingModules { }
