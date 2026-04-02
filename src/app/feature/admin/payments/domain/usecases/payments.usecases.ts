import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentsService } from '@shared/services/payments/payments.service';
import { PaymentEntity, PaymentRequest, AddInstallmentRequest } from '../entities/payment.entity';

@Injectable({ providedIn: 'root' })
export class GetPaymentsUseCase {
  constructor(private service: PaymentsService) {}
  execute() { return this.service.getPayments(); }
}

@Injectable({ providedIn: 'root' })
export class CreatePaymentUseCase {
  constructor(private service: PaymentsService) {}
  execute(data: PaymentRequest) { return this.service.createPayment(data); }
}

@Injectable({ providedIn: 'root' })
export class UpdatePaymentUseCase {
  constructor(private service: PaymentsService) {}
  execute(id: string, data: Partial<PaymentRequest>) { return this.service.updatePayment(id, data); }
}

@Injectable({ providedIn: 'root' })
export class AddInstallmentUseCase {
  constructor(private service: PaymentsService) {}
  execute(paymentId: string, data: AddInstallmentRequest) { return this.service.addInstallment(paymentId, data); }
}

@Injectable({ providedIn: 'root' })
export class DeletePaymentUseCase {
  constructor(private service: PaymentsService) {}
  execute(id: string) { return this.service.deletePayment(id); }
}

@Injectable({ providedIn: 'root' })
export class GetPaymentByIdUseCase {
  constructor(private service: PaymentsService) {}
  execute(id: string) { return this.service.getPaymentById(id); }
}
