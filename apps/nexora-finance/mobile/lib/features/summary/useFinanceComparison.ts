import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useTenantApi } from '@/lib/api/tenant';
import type { FinanceComparison } from './types';

interface ApiMetric {
  current: number;
  previous: number;
  delta: number;
  percentage_change: number | null;
}

interface ApiComparison {
  current_start_date: string;
  current_end_date: string;
  previous_start_date: string;
  previous_end_date: string;
  currency: 'IDR';
  income: ApiMetric;
  expense: ApiMetric;
  net_cash_flow: ApiMetric;
  transaction_count: ApiMetric;
}

function mapMetric(item: ApiMetric) {
  return {
    current: item.current,
    previous: item.previous,
    delta: item.delta,
    percentageChange: item.percentage_change,
  };
}

function mapComparison(item: ApiComparison): FinanceComparison {
  return {
    currentStartDate: item.current_start_date,
    currentEndDate: item.current_end_date,
    previousStartDate: item.previous_start_date,
    previousEndDate: item.previous_end_date,
    currency: item.currency,
    income: mapMetric(item.income),
    expense: mapMetric(item.expense),
    netCashFlow: mapMetric(item.net_cash_flow),
    transactionCount: mapMetric(item.transaction_count),
  };
}

export function useFinanceComparison(period?: { startDate?: string; endDate?: string }) {
  const { user, status } = useAuth();
  const tenantApi = useTenantApi();
  const [comparison, setComparison] = useState<FinanceComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (status !== 'authenticated' || !user || !tenantApi.ready) {
      setComparison(null);
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
        ? '/finance/reporting/comparison/?' + query
        : '/finance/reporting/comparison/';
      const response = await tenantApi.request<ApiComparison>(path);
      setComparison(mapComparison(response.data));
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Unable to load financial comparison.'));
    } finally {
      setLoading(false);
    }
  }, [period?.startDate, period?.endDate, status, tenantApi, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { comparison, loading, error, refresh: load };
}
