import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { PaymentEntity, PaymentRequest, AddInstallmentRequest } from '../../../feature/admin/payments/domain/entities/payment.entity';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getPayments(): Observable<PaymentEntity[]> {
    return this.http.get<PaymentEntity[]>(this.apiUrl);
  }

  getPaymentById(id: string): Observable<PaymentEntity> {
    return this.http.get<PaymentEntity>(`${this.apiUrl}/${id}`);
  }

  createPayment(payment: PaymentRequest): Observable<PaymentEntity> {
    return this.http.post<PaymentEntity>(this.apiUrl, payment);
  }

  updatePayment(id: string, payment: Partial<PaymentRequest>): Observable<PaymentEntity> {
    return this.http.put<PaymentEntity>(`${this.apiUrl}/${id}`, payment);
  }

  addInstallment(paymentId: string, installment: AddInstallmentRequest): Observable<PaymentEntity> {
    return this.http.post<PaymentEntity>(`${this.apiUrl}/${paymentId}/installments`, installment);
  }

  deletePayment(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
