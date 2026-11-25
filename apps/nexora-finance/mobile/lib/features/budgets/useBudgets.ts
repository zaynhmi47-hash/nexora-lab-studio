import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useBudgetApi } from './budgetApi';
import type { BudgetListFilters, CreateBudgetInput, UpdateBudgetInput, FinanceBudget } from './types';

export function useBudgets(filters: BudgetListFilters = {}) {
  const { status } = useAuth();
  const api = useBudgetApi();
  const requestRef = useRef(0);
  const [budgets, setBudgets] = useState<FinanceBudget[]>([]);
  const [dataOrganizationId, setDataOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pageInfo, setPageInfo] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    const requestedOrganizationId = api.organizationId;
    if (status !== 'authenticated' || !api.ready || !requestedOrganizationId) {
      setBudgets([]); setDataOrganizationId(null); setLoading(false);
      setPageInfo({ page: 1, pageSize: filters.pageSize ?? 20, total: 0, totalPages: 1 });
      return;
    }
    setLoading(true); setError(null);
    try {
      const result = await api.listBudgets(filters);
      if (requestId !== requestRef.current || api.organizationId !== requestedOrganizationId) return;
      setBudgets(result.budgets); setDataOrganizationId(requestedOrganizationId);
      setPageInfo({ page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages });
    } catch (cause) {
      if (requestId === requestRef.current && api.organizationId === requestedOrganizationId) setError(cause instanceof Error ? cause : new Error('Failed to load budgets.'));
    } finally { if (requestId === requestRef.current) setLoading(false); }
  }, [api, filters.category, filters.endDate, filters.page, filters.pageSize, filters.startDate, filters.status, status]);

  const create = useCallback(async (input: CreateBudgetInput) => { setError(null); const value = await api.createBudget(input); await refresh(); return value; }, [api, refresh]);
  const update = useCallback(async (id: string, input: UpdateBudgetInput) => { setError(null); const value = await api.updateBudget(id, input); await refresh(); return value; }, [api, refresh]);
  const archive = useCallback(async (id: string) => { setError(null); const value = await api.archiveBudget(id); await refresh(); return value; }, [api, refresh]);

  useEffect(() => { void refresh(); return () => { requestRef.current += 1; }; }, [refresh]);
  const visible = dataOrganizationId === api.organizationId ? budgets : [];
  return { budgets: visible, loading, error, refresh, create, update, archive, pageInfo: visible.length ? pageInfo : { page: 1, pageSize: filters.pageSize ?? 20, total: 0, totalPages: 1 }, ready: api.ready };
}
