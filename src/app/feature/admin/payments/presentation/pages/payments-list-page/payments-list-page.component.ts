import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { PaymentEntity } from '../../../domain/entities/payment.entity';
import { GetPaymentsUseCase, DeletePaymentUseCase } from '../../../domain/usecases/payments.usecases';
import { StudentsService } from '@shared/services/students/students.service';
import { IonicModule } from '@ionic/angular';
import { SidebarComponent } from '@shared/components/menus/sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payments-list-page',
  standalone: true,
  imports: [CommonModule, IonicModule, SidebarComponent, PageHeaderComponent],
  templateUrl: './payments-list-page.component.html',
  styleUrls: ['./payments-list-page.component.scss']
})
export class PaymentsListPageComponent implements OnInit {
  sidebarCollapsed = false;
  private paymentsSubject = new BehaviorSubject<PaymentEntity[]>([]);
  isLoading = false;

  // Filtros
  studentFilter$ = new BehaviorSubject<string>('');
  statusFilter$ = new BehaviorSubject<string>('');
  methodFilter$ = new BehaviorSubject<string>('');

  payments$: Observable<PaymentEntity[]>;
  allStudents$ = this.studentsService.getAllStudents();
  paymentMethods = ['Nequi', 'Daviplata', 'Efectivo', 'Transferencia', 'Otros'];

  // Stats
  activePaymentsCount$ = this.paymentsSubject.pipe(map(list => list.filter(p => p.planStatus === 'active').length));
  expiringSoonPaymentsCount$ = this.paymentsSubject.pipe(map(list => list.filter(p => p.planStatus === 'expiring_soon').length));
  expiredPaymentsCount$ = this.paymentsSubject.pipe(map(list => list.filter(p => p.planStatus === 'expired').length));

  constructor(
    private getPaymentsUC: GetPaymentsUseCase,
    private deletePaymentUC: DeletePaymentUseCase,
    private studentsService: StudentsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.payments$ = combineLatest([
      this.paymentsSubject,
      this.studentFilter$,
      this.statusFilter$,
      this.methodFilter$
    ]).pipe(
      map(([list, student, status, method]) => {
        return list.filter(p => 
          (!student || p.studentId === student) &&
          (!status || p.planStatus === status) &&
          (!method || p.paymentMethod === method)
        );
      })
    );
  }

  ngOnInit() { this.loadPayments(); }

  loadPayments() {
    this.isLoading = true;
    this.getPaymentsUC.execute().pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data: PaymentEntity[]) => this.paymentsSubject.next(data),
      error: () => Swal.fire('Error', 'No se pudieron cargar los pagos', 'error')
    });
  }

  deletePayment(id: string) {
    Swal.fire({
      title: '¿Eliminar registro?',
      text: "Esta acción no se puede deshacer y afectará el estado del plan del estudiante.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b11226',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#1a1a1a',
      color: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deletePaymentUC.execute(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El pago ha sido borrado.', 'success');
            this.loadPayments();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el registro', 'error')
        });
      }
    });
  }

  goToNewPayment() { this.router.navigate(['/admin/payments/new']); }
  editPayment(id: string) { this.router.navigate(['/admin/payments/edit', id]); }
  onSidebarToggle(collapsed: boolean) { this.sidebarCollapsed = collapsed; }

  onStudentFilterChange(e: any) { this.studentFilter$.next(e.target.value); }
  onPlanStatusFilterChange(e: any) { this.statusFilter$.next(e.target.value); }
  onPaymentMethodFilterChange(e: any) { this.methodFilter$.next(e.target.value); }

  getPaymentStatusBadgeClass(p: PaymentEntity) { 
    return p.status === 'completed' ? 'badge-success' : 'badge-warning'; 
  }
  
  getPaymentStatusIcon(p: PaymentEntity) {
    return p.status === 'completed' ? 'bi-check-circle-fill' : 'bi-clock-history';
  }

  getPlanStatusBadgeClass(p: PaymentEntity) { 
    return p.planStatus === 'active' ? 'badge-active' : (p.planStatus === 'expired' ? 'badge-expired' : 'badge-expiring'); 
  }

  getPlanStatusIcon(p: PaymentEntity) {
    return p.planStatus === 'active' ? 'bi-patch-check' : (p.planStatus === 'expired' ? 'bi-x-octagon' : 'bi-exclamation-circle');
  }
}
