import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { IonicModule } from '@ionic/angular';
import Swal from 'sweetalert2';

import { ActivityEntity } from '../../../domain/entities/activity.entity';
import { GetActivitiesUseCase, DeleteActivityUseCase } from '../../../domain/usecases/activities.usecases';
import { environment } from '@environments/environment';

import { ScrollTrackDirective } from '@shared/directives/scroll-track.directive';

@Component({
  selector: 'app-activities-list-page',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule, PageHeaderComponent, ScrollTrackDirective],
  templateUrl: './activities-list-page.component.html',
  styleUrls: ['./activities-list-page.component.scss']
})
export class ActivitiesListPageComponent implements OnInit {
  activities: ActivityEntity[] = [];
  isLoading = false;
  baseUrl = environment.apiUrl + '/uploads';

  // Stats
  totalActivities = 0;
  upcomingActivities = 0;
  thisMonthActivities = 0;

  constructor(
    private readonly getActivitiesUseCase: GetActivitiesUseCase,
    private readonly deleteActivityUseCase: DeleteActivityUseCase,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  ionViewWillEnter(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.isLoading = true;
    this.getActivitiesUseCase.execute()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data: ActivityEntity[]) => {
          this.activities = data;
          this.calculateStats();
        },
        error: (err: any) => {
          console.error('Error al cargar actividades', err);
          Swal.fire('Error', 'No se pudieron cargar las actividades', 'error');
        }
      });
  }

  calculateStats(): void {
    const now = new Date();
    // Usamos el mes y año local para "ahora"
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    this.totalActivities = this.activities.length;
    
    this.upcomingActivities = this.activities.filter(a => {
      // Para próximos, comparamos el valor absoluto del tiempo
      const eventDate = new Date(a.eventDate + 'T00:00:00'); 
      return eventDate.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    }).length;

    this.thisMonthActivities = this.activities.filter(a => {
      const eventDate = new Date(a.eventDate + 'T00:00:00');
      // Comparamos mes y año local (al añadir T00:00:00 se interpreta como local en la mayoría de navegadores)
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    }).length;
  }

  goToNewActivity(): void {
    this.router.navigate(['/admin/activities/new']);
  }

  editActivity(id: string): void {
    this.router.navigate(['/admin/activities/edit', id]);
  }

  deleteActivity(id: string): void {
    Swal.fire({
      title: '¿Eliminar actividad?',
      text: 'Esta acción no se puede deshacer y notificará a los invitados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b11226',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#1a1a1a',
      color: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteActivityUseCase.execute(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La actividad ha sido borrada.', 'success');
            this.loadActivities();
          },
          error: (err: any) => Swal.fire('Error', 'No se pudo eliminar la actividad', 'error')
        });
      }
    });
  }

  onImageError(event: any): void {
    event.target.src = 'assets/img/LogoPasionyFuror.png';
  }
}
