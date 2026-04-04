import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api/api.service';
import { PaymentEntity, PaymentRequest, AddInstallmentRequest } from '../../../feature/admin/payments/domain/entities/payment.entity';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly endpoint = 'payments';

  constructor(private readonly api: ApiService) {}

  getPayments(): Observable<PaymentEntity[]> {
    return this.api.get<PaymentEntity[]>(this.endpoint);
  }

  getPaymentById(id: string): Observable<PaymentEntity> {
    return this.api.get<PaymentEntity>(`${this.endpoint}/${id}`);
  }

  createPayment(payment: PaymentRequest): Observable<PaymentEntity> {
    return this.api.post<PaymentEntity>(this.endpoint, payment);
  }

  updatePayment(id: string, payment: Partial<PaymentRequest>): Observable<PaymentEntity> {
    return this.api.put<PaymentEntity>(`${this.endpoint}/${id}`, payment);
  }

  addInstallment(paymentId: string, installment: AddInstallmentRequest): Observable<PaymentEntity> {
    return this.api.post<PaymentEntity>(`${this.endpoint}/${paymentId}/installments`, installment);
  }

  deletePayment(id: string): Observable<any> {
    return this.api.delete<any>(`${this.endpoint}/${id}`);
  }
}
