import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { useTenantApi } from '@/lib/api/tenant';
import type { FinanceInsight, FinanceInsights } from './types';

interface ApiInsight {
  code: string;
  severity: 'info' | 'warning';
  title: string;
  message: string;
  metric: string;
  value_minor: number | null;
  delta_minor: number | null;
  percentage_change: number | null;
  category: string | null;
}

interface ApiInsights {
  start_date: string;
  end_date: string;
  currency: 'IDR';
  insights: ApiInsight[];
}

const mapInsight = (item: ApiInsight): FinanceInsight => ({
  code: item.code,
  severity: item.severity,
  title: item.title,
  message: item.message,
  metric: item.metric,
  valueMinor: item.value_minor,
  deltaMinor: item.delta_minor,
  percentageChange: item.percentage_change,
  category: item.category,
});

const mapReport = (item: ApiInsights): FinanceInsights => ({
  startDate: item.start_date,
  endDate: item.end_date,
  currency: item.currency,
  insights: item.insights.map(mapInsight),
});

export function useFinanceInsights(period?: { startDate?: string; endDate?: string }) {
  const { user, initializing } = useAuth();
  const tenantApi = useTenantApi();
  const [report, setReport] = useState<FinanceInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (initializing || !user || !tenantApi.ready) {
      setReport(null);
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
        ? '/finance/reporting/insights/?' + query
        : '/finance/reporting/insights/';
      const response = await tenantApi.request<ApiInsights>(path);
      setReport(mapReport(response.data));
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Unable to load financial insights.'));
    } finally {
      setLoading(false);
    }
  }, [initializing, period?.startDate, period?.endDate, tenantApi, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { report, loading, error, refresh: load };
}
