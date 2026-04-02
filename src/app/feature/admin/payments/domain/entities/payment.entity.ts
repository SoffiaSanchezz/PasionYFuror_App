export interface InstallmentEntity {
  id: string;
  amount: number;
  paymentMethod: string;
  date: string;
  receiptId: string;
  notes?: string;
}

export interface PaymentEntity {
  id: string;
  userId: string;
  studentId: string;
  studentName: string;
  planAcquired: string;
  totalValue: number;
  amountPaid: number;
  pendingBalance: number;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  receiptId: string;
  status: 'completed' | 'partial';
  planStatus: 'active' | 'expiring_soon' | 'expired';
  installments: InstallmentEntity[]; // Historial de abonos
  createdAt: string;
  updatedAt: string;
}

export type PaymentRequest = Omit<PaymentEntity, 'id' | 'userId' | 'studentName' | 'pendingBalance' | 'status' | 'planStatus' | 'installments' | 'createdAt' | 'updatedAt'>;

export interface AddInstallmentRequest {
  amount: number;
  paymentMethod: string;
  date: string;
  receiptId: string;
  notes?: string;
}
