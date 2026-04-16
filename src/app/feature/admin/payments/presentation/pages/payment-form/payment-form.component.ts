import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { StudentsService } from '@shared/services/students/students.service';
import { GetPaymentByIdUseCase, CreatePaymentUseCase, UpdatePaymentUseCase, AddInstallmentUseCase } from '../../../domain/usecases/payments.usecases';
import { PaymentEntity } from '../../../domain/entities/payment.entity';
import Swal from 'sweetalert2';

import { ScrollTrackDirective } from '@shared/directives/scroll-track.directive';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, ScrollTrackDirective],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit {
  paymentForm!: FormGroup;
  installmentForm!: FormGroup;
  isEditMode = false;
  paymentId: string | null = null;
  isLoading = false;
  isSaving = false;
  isAddingInstallment = false;
  
  currentPayment: PaymentEntity | null = null;
  students$ = this.studentsService.getAllStudents();
  planTypes = ['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];
  paymentMethods = ['Nequi', 'Daviplata', 'Efectivo', 'Transferencia', 'Otros'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private studentsService: StudentsService,
    private createPaymentUC: CreatePaymentUseCase,
    private updatePaymentUC: UpdatePaymentUseCase,
    private addInstallmentUC: AddInstallmentUseCase,
    private getPaymentByIdUC: GetPaymentByIdUseCase,
    private cdr: ChangeDetectorRef
  ) {
    // Detectamos el modo antes de inicializar los formularios
    this.paymentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.paymentId;
    
    this.initForm();
    this.initInstallmentForm();
  }

  ngOnInit() {
    if (this.isEditMode) {
      this.loadPaymentData();
    }

    this.paymentForm.get('startDate')?.valueChanges.subscribe((date: string) => {
      if (date) this.calculateEndDate(date);
    });
    this.paymentForm.get('planAcquired')?.valueChanges.subscribe(() => {
      const currentDate = this.paymentForm.get('startDate')?.value;
      if (currentDate) this.calculateEndDate(currentDate);
    });
  }

  private initForm() {
    this.paymentForm = this.fb.group({
      studentId: ['', Validators.required],
      planAcquired: ['', Validators.required],
      totalValue: [0, [Validators.required, Validators.min(1)]],
      amountPaid: [{value: 0, disabled: this.isEditMode}, [Validators.required, Validators.min(0)]],
      paymentMethod: ['', Validators.required],
      startDate: [new Date().toISOString().split('T')[0], Validators.required],
      endDate: ['', Validators.required],
      receiptId: ['', Validators.required]
    });
  }

  private initInstallmentForm() {
    this.installmentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentMethod: ['Efectivo', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      receiptId: ['', Validators.required],
      notes: ['']
    });
  }

  loadPaymentData() {
    this.isLoading = true;
    this.getPaymentByIdUC.execute(this.paymentId!)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (payment: PaymentEntity) => {
          this.currentPayment = payment;
          this.paymentForm.patchValue({
            studentId: payment.studentId,
            planAcquired: payment.planAcquired,
            totalValue: payment.totalValue,
            amountPaid: payment.amountPaid,
            paymentMethod: payment.paymentMethod,
            startDate: payment.startDate.split('T')[0],
            endDate: payment.endDate.split('T')[0],
            receiptId: payment.receiptId
          });
          
          if (payment.installments && payment.installments.length > 0) {
            this.paymentForm.get('studentId')?.disable();
            this.paymentForm.get('planAcquired')?.disable();
          }
        },
        error: () => {
          Swal.fire('Error', 'No se pudo cargar la información del pago', 'error');
          this.onCancel();
        }
      });
  }

  addInstallment() {
    if (this.installmentForm.invalid || !this.paymentId) {
      this.installmentForm.markAllAsTouched();
      return;
    }

    const amount = this.installmentForm.value.amount;
    if (this.currentPayment && amount > this.currentPayment.pendingBalance) {
      Swal.fire('Atención', `El abono ($${amount}) supera el saldo pendiente ($${this.currentPayment.pendingBalance})`, 'warning');
      return;
    }

    this.isAddingInstallment = true;
    this.addInstallmentUC.execute(this.paymentId, this.installmentForm.value)
      .pipe(finalize(() => this.isAddingInstallment = false))
      .subscribe({
        next: (updatedPayment) => {
          this.currentPayment = updatedPayment;
          this.paymentForm.patchValue({ amountPaid: updatedPayment.amountPaid });
          this.installmentForm.reset({
            amount: 0,
            paymentMethod: 'Efectivo',
            date: new Date().toISOString().split('T')[0],
            receiptId: '',
            notes: ''
          });
          Swal.fire('Éxito', 'Abono registrado correctamente', 'success');
          this.cdr.detectChanges();
        },
        error: () => Swal.fire('Error', 'No se pudo registrar el abono', 'error')
      });
  }

  calculateEndDate(startDateStr: string) {
    const startDate = new Date(startDateStr);
    const plan = this.paymentForm.get('planAcquired')?.value;
    
    let monthsToAdd = 1;
    switch (plan) {
      case 'Bimestral': monthsToAdd = 2; break;
      case 'Trimestral': monthsToAdd = 3; break;
      case 'Semestral': monthsToAdd = 6; break;
      case 'Anual': monthsToAdd = 12; break;
    }

    startDate.setMonth(startDate.getMonth() + monthsToAdd);
    this.paymentForm.get('endDate')?.setValue(startDate.toISOString().split('T')[0]);
  }

  onSubmit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formData = this.paymentForm.getRawValue();
    
    const data = {
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString()
    };

    const request$ = this.isEditMode 
      ? this.updatePaymentUC.execute(this.paymentId!, data)
      : this.createPaymentUC.execute(data);

    request$.pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => {
          Swal.fire({
            title: '¡Éxito!',
            text: `Pago ${this.isEditMode ? 'actualizado' : 'registrado'} correctamente`,
            icon: 'success',
            background: '#1a1a1a',
            color: '#ffffff',
            confirmButtonColor: '#b11226'
          });
          this.router.navigate(['/admin/payments']);
        },
        error: (err: any) => {
          const errorMsg = err.error?.errors 
            ? Object.values(err.error.errors).join('\n') 
            : 'Ocurrió un error al procesar el pago';
          Swal.fire('Error', errorMsg, 'error');
        }
      });
  }

  onCancel() { this.router.navigate(['/admin/payments']); }
}