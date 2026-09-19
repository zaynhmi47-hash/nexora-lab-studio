import { useCallback } from 'react';

import { useTenantApi } from '@/lib/api/tenant';
import type {
  BudgetListFilters,
  BudgetListResult,
  CreateBudgetInput,
  FinanceBudget,
  UpdateBudgetInput,
} from './types';

interface ApiBudget {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  amount_minor: number;
  currency: 'IDR';
  start_date: string;
  end_date: string;
  status: FinanceBudget['status'];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function mapBudget(item: ApiBudget): FinanceBudget {
  return {
    id: item.id,
    organizationId: item.organization_id,
    name: item.name,
    category: item.category,
    amountMinor: item.amount_minor,
    currency: item.currency,
    startDate: item.start_date,
    endDate: item.end_date,
    status: item.status,
    metadata: item.metadata,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

export function useBudgetApi() {
  const tenantApi = useTenantApi();

  const listBudgets = useCallback(async (filters: BudgetListFilters = {}): Promise<BudgetListResult> => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.category) params.set('category', filters.category);
    if (filters.startDate) params.set('start_date', filters.startDate);
    if (filters.endDate) params.set('end_date', filters.endDate);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('page_size', String(filters.pageSize));

    const query = params.toString();
    const response = await tenantApi.request<ApiBudget[]>(
      '/finance/budgets/' + (query ? '?' + query : ''),
    );
    const pagination = (response.meta?.pagination ?? {}) as Record<string, unknown>;
    const page = Number(pagination.page ?? filters.page ?? 1);
    const pageSize = Number(pagination.page_size ?? filters.pageSize ?? response.data.length);
    const total = Number(pagination.total ?? response.data.length);
    const totalPages = Number(
      pagination.total_pages ?? (total > 0 ? Math.ceil(total / Math.max(pageSize, 1)) : 1),
    );

    return {
      budgets: response.data.map(mapBudget),
      page,
      pageSize,
      total,
      totalPages,
    };
  }, [tenantApi]);

  const getBudget = useCallback(async (id: string) => {
    const response = await tenantApi.request<ApiBudget>(
      '/finance/budgets/' + encodeURIComponent(id) + '/',
    );
    return mapBudget(response.data);
  }, [tenantApi]);

  const createBudget = useCallback(async (input: CreateBudgetInput) => {
    const response = await tenantApi.request<ApiBudget>('/finance/budgets/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name,
        category: input.category,
        amount_minor: input.amountMinor,
        currency: input.currency ?? 'IDR',
        start_date: input.startDate,
        end_date: input.endDate,
        metadata: input.metadata ?? {},
      }),
    });
    return mapBudget(response.data);
  }, [tenantApi]);

  const updateBudget = useCallback(async (id: string, input: UpdateBudgetInput) => {
    const response = await tenantApi.request<ApiBudget>(
      '/finance/budgets/' + encodeURIComponent(id) + '/',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.category !== undefined && { category: input.category }),
          ...(input.amountMinor !== undefined && { amount_minor: input.amountMinor }),
          ...(input.currency !== undefined && { currency: input.currency }),
          ...(input.startDate !== undefined && { start_date: input.startDate }),
          ...(input.endDate !== undefined && { end_date: input.endDate }),
          ...(input.metadata !== undefined && { metadata: input.metadata }),
        }),
      },
    );
    return mapBudget(response.data);
  }, [tenantApi]);

  const archiveBudget = useCallback(async (id: string) => {
    const response = await tenantApi.request<ApiBudget>(
      '/finance/budgets/' + encodeURIComponent(id) + '/',
      { method: 'DELETE' },
    );
    return mapBudget(response.data);
  }, [tenantApi]);

  return { ...tenantApi, listBudgets, getBudget, createBudget, updateBudget, archiveBudget };
}
