export type TransactionDirection = 'income' | 'expense';
export type TransactionStatus = 'posted' | 'void';

export interface FinanceTransaction {
  id: string;
  organizationId: string;
  direction: TransactionDirection;
  amountMinor: number;
  currency: 'IDR';
  category: string;
  description: string;
  occurredAt: string;
  status: TransactionStatus;
  reference: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  direction: TransactionDirection;
  amountMinor: number;
  currency?: 'IDR';
  category: string;
  description?: string;
  occurredAt: string;
  reference?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}
