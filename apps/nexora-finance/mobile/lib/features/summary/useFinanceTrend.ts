import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useTenantApi } from '@/lib/api/tenant';

export interface FinanceTrendPoint {
  periodStart: string;
  periodEnd: string;
  incomeMinor: number;
  expenseMinor: number;
  netCashFlowMinor: number;
  transactionCount: number;
}

interface ApiTrendPoint {
  period_start: string;
  period_end: string;
  income_minor: number;
  expense_minor: number;
  net_cash_flow_minor: number;
  transaction_count: number;
}

export type FinanceTrendGranularity = 'day' | 'week' | 'month';

export function useFinanceTrend(period: { startDate?: string; endDate?: string }, granularity: FinanceTrendGranularity = 'day') {
  const { status } = useAuth();
  const api = useTenantApi();
  const [points, setPoints] = useState<FinanceTrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startDate = period.startDate;
  const endDate = period.endDate;

  const refresh = useCallback(async () => {
    if (status !== 'authenticated' || !api.ready) {
      setPoints([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ granularity });
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      const response = await api.request<ApiTrendPoint[]>('/finance/reporting/trend/?' + params.toString());
      setPoints(response.data.map((item) => ({
        periodStart: item.period_start,
        periodEnd: item.period_end,
        incomeMinor: item.income_minor,
        expenseMinor: item.expense_minor,
        netCashFlowMinor: item.net_cash_flow_minor,
        transactionCount: item.transaction_count,
      })));
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Failed to load finance trend.'));
    } finally {
      setLoading(false);
    }
  }, [api, endDate, granularity, startDate, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { points, loading, error, refresh, ready: api.ready };
}
