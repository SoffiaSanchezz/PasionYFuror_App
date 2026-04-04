import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage implements OnInit {

  constructor(private readonly router: Router) { }

  ngOnInit(): void { }

  navigateTo(role: 'teacher' | 'student'): void {
    if (role === 'teacher') {
      // Redirigir al login para que el profesor se autentique
      this.router.navigate(['/login']);
    } else {
      // Redirigir a la sección de alumnos (actualmente /students o similar)
      // Por ahora, redirigimos a login o una ruta por defecto
      this.router.navigate(['/login']); // O '/students' si estuviera listo
    }
  }
}
