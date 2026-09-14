import type { ApiEnvelope } from './client';
import { createTenantPath, useTenantApi } from './tenant';

export type FinanceTransactionType = 'income' | 'expense';

export type FinanceTransaction = {
  id: string;
  organization_id: string;
  transaction_type: FinanceTransactionType;
  amount: string;
  currency: string;
  category: string;
  description: string;
  occurred_at: string;
  created_at: string;
};

export type CreateFinanceTransactionInput = {
  transaction_type: FinanceTransactionType;
  amount: string;
  currency?: string;
  category: string;
  description?: string;
  occurred_at: string;
};

export function useFinanceApi() {
  const tenantApi = useTenantApi();

  return {
    ...tenantApi,
    async listTransactions(): Promise<ApiEnvelope<FinanceTransaction[]>> {
      return tenantApi.request('/finance/transactions/');
    },
    async createTransaction(input: CreateFinanceTransactionInput): Promise<ApiEnvelope<FinanceTransaction>> {
      return tenantApi.request('/finance/transactions/', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
  };
}

export function createFinanceTransactionsPath(organizationId: string): string {
  return createTenantPath(organizationId, '/finance/transactions/');
}
