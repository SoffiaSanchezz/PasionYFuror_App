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
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/attendance']);
    }
  }
}
