import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useBudgetApi } from './budgetApi';
import type { BudgetListFilters, CreateBudgetInput, UpdateBudgetInput } from './types';

export function useBudgets(filters: BudgetListFilters = {}) {
  const { status } = useAuth();
  const api = useBudgetApi();
  const [budgets, setBudgets] = useState<Awaited<ReturnType<typeof api.listBudgets>>['budgets']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pageInfo, setPageInfo] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  const refresh = useCallback(async () => {
    if (status !== 'authenticated' || !api.ready) {
      setBudgets([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.listBudgets(filters);
      setBudgets(result.budgets);
      setPageInfo({
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Failed to load budgets.'));
    } finally {
      setLoading(false);
    }
  }, [
    api,
    filters.category,
    filters.endDate,
    filters.page,
    filters.pageSize,
    filters.startDate,
    filters.status,
    status,
  ]);

  const create = useCallback(async (input: CreateBudgetInput) => {
    setError(null);
    const created = await api.createBudget(input);
    await refresh();
    return created;
  }, [api, refresh]);

  const update = useCallback(async (id: string, input: UpdateBudgetInput) => {
    setError(null);
    const updated = await api.updateBudget(id, input);
    await refresh();
    return updated;
  }, [api, refresh]);

  const archive = useCallback(async (id: string) => {
    setError(null);
    const archived = await api.archiveBudget(id);
    await refresh();
    return archived;
  }, [api, refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    budgets,
    loading,
    error,
    refresh,
    create,
    update,
    archive,
    pageInfo,
    ready: api.ready,
  };
}
