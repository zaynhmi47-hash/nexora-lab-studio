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

export type FinanceDashboard = {
  income: string;
  expense: string;
  net: string;
  currency: string;
};

export type FinanceTransactionFilters = {
  transaction_type?: FinanceTransactionType;
  category?: string;
  from?: string;
  to?: string;
};

export type CreateFinanceTransactionInput = {
  transaction_type: FinanceTransactionType;
  amount: string;
  currency?: string;
  category: string;
  description?: string;
  occurred_at: string;
};

function toQuery(filters: FinanceTransactionFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function useFinanceApi() {
  const tenantApi = useTenantApi();

  return {
    ...tenantApi,
    async listTransactions(filters?: FinanceTransactionFilters): Promise<ApiEnvelope<FinanceTransaction[]>> {
      return tenantApi.request(`/finance/transactions/${toQuery(filters)}`);
    },
    async createTransaction(input: CreateFinanceTransactionInput): Promise<ApiEnvelope<FinanceTransaction>> {
      return tenantApi.request('/finance/transactions/', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    async getDashboard(filters?: Pick<FinanceTransactionFilters, 'from' | 'to'> & { currency?: string }): Promise<ApiEnvelope<FinanceDashboard>> {
      const params = new URLSearchParams();
      Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const query = params.toString();
      return tenantApi.request(`/finance/dashboard/${query ? `?${query}` : ''}`);
    },
  };
}

export function createFinanceTransactionsPath(organizationId: string): string {
  return createTenantPath(organizationId, '/finance/transactions/');
}

export function createFinanceDashboardPath(organizationId: string): string {
  return createTenantPath(organizationId, '/finance/dashboard/');
}
