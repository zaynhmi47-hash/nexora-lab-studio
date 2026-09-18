import { useCallback } from 'react';

import { useTenantApi } from '@/lib/api/tenant';
import type { CreateTransactionInput, FinanceTransaction, TransactionDirection } from './types';

interface ApiTransaction {
  id: string;
  organization_id: string;
  direction: FinanceTransaction['direction'];
  amount_minor: number;
  currency: 'IDR';
  category: string;
  description: string;
  occurred_at: string;
  status: FinanceTransaction['status'];
  reference: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpdateTransactionInput {
  direction?: TransactionDirection;
  amountMinor?: number;
  currency?: 'IDR';
  category?: string;
  description?: string;
  occurredAt?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

function mapTransaction(item: ApiTransaction): FinanceTransaction {
  return {
    id: item.id, organizationId: item.organization_id, direction: item.direction,
    amountMinor: item.amount_minor, currency: item.currency, category: item.category,
    description: item.description, occurredAt: item.occurred_at, status: item.status,
    reference: item.reference, metadata: item.metadata, createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

export function useTransactionApi() {
  const tenantApi = useTenantApi();

  const listTransactions = useCallback(async () => {
    const response = await tenantApi.request<ApiTransaction[]>('/finance/transactions/');
    return response.data.map(mapTransaction);
  }, [tenantApi]);

  const getTransaction = useCallback(async (id: string) => {
    const response = await tenantApi.request<ApiTransaction>(`/finance/transactions/${encodeURIComponent(id)}/`);
    return mapTransaction(response.data);
  }, [tenantApi]);

  const createTransaction = useCallback(async (input: CreateTransactionInput) => {
    const response = await tenantApi.request<ApiTransaction>('/finance/transactions/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direction: input.direction, amount_minor: input.amountMinor,
        currency: input.currency ?? 'IDR', category: input.category,
        description: input.description ?? '', occurred_at: input.occurredAt,
        reference: input.reference ?? '', idempotency_key: input.idempotencyKey ?? '',
        metadata: input.metadata ?? {},
      }),
    });
    return mapTransaction(response.data);
  }, [tenantApi]);

  const updateTransaction = useCallback(async (id: string, input: UpdateTransactionInput) => {
    const response = await tenantApi.request<ApiTransaction>(`/finance/transactions/${encodeURIComponent(id)}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(input.direction !== undefined && { direction: input.direction }),
        ...(input.amountMinor !== undefined && { amount_minor: input.amountMinor }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.occurredAt !== undefined && { occurred_at: input.occurredAt }),
        ...(input.reference !== undefined && { reference: input.reference }),
        ...(input.metadata !== undefined && { metadata: input.metadata }),
      }),
    });
    return mapTransaction(response.data);
  }, [tenantApi]);

  const voidTransaction = useCallback(async (id: string) => {
    const response = await tenantApi.request<ApiTransaction>(`/finance/transactions/${encodeURIComponent(id)}/`, {
      method: 'DELETE',
    });
    return mapTransaction(response.data);
  }, [tenantApi]);

  return { ...tenantApi, listTransactions, getTransaction, createTransaction, updateTransaction, voidTransaction };
}
