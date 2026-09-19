import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { useTenantApi } from '@/lib/api/tenant';
import type { FinanceBudgetSummary, FinanceBudgetSummaryItem } from './types';

interface ApiBudgetSummaryItem {
  budget_id: string;
  name: string;
  category: string;
  start_date: string;
  end_date: string;
  budget_minor: number;
  actual_minor: number;
  remaining_minor: number;
  utilization_percentage: number | null;
  status: FinanceBudgetSummaryItem['status'];
  transaction_count: number;
}

interface ApiBudgetSummary {
  start_date: string;
  end_date: string;
  currency: 'IDR';
  total_budget_minor: number;
  total_actual_minor: number;
  total_remaining_minor: number;
  overall_utilization_percentage: number | null;
  over_budget_count: number;
  budgets: ApiBudgetSummaryItem[];
}

const mapItem = (item: ApiBudgetSummaryItem): FinanceBudgetSummaryItem => ({
  budgetId: item.budget_id,
  name: item.name,
  category: item.category,
  startDate: item.start_date,
  endDate: item.end_date,
  budgetMinor: item.budget_minor,
  actualMinor: item.actual_minor,
  remainingMinor: item.remaining_minor,
  utilizationPercentage: item.utilization_percentage,
  status: item.status,
  transactionCount: item.transaction_count,
});

const mapSummary = (item: ApiBudgetSummary): FinanceBudgetSummary => ({
  startDate: item.start_date,
  endDate: item.end_date,
  currency: item.currency,
  totalBudgetMinor: item.total_budget_minor,
  totalActualMinor: item.total_actual_minor,
  totalRemainingMinor: item.total_remaining_minor,
  overallUtilizationPercentage: item.overall_utilization_percentage,
  overBudgetCount: item.over_budget_count,
  budgets: item.budgets.map(mapItem),
});

export function useFinanceBudgetSummary(period?: { startDate?: string; endDate?: string }) {
  const { user, initializing } = useAuth();
  const tenantApi = useTenantApi();
  const [summary, setSummary] = useState<FinanceBudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (initializing || !user || !tenantApi.ready) {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (period?.startDate) params.set('start_date', period.startDate);
      if (period?.endDate) params.set('end_date', period.endDate);
      const query = params.toString();
      const path = query
        ? '/finance/budgets/summary/?' + query
        : '/finance/budgets/summary/';
      const response = await tenantApi.request<ApiBudgetSummary>(path);
      setSummary(mapSummary(response.data));
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Unable to load budget summary.'));
    } finally {
      setLoading(false);
    }
  }, [initializing, period?.startDate, period?.endDate, tenantApi, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { summary, loading, error, refresh: load };
}
