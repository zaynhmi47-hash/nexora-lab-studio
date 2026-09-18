import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useFinanceSummaryApi } from './summaryApi';
import type { FinanceSummary } from './types';

export interface FinanceSummaryPeriod {
  startDate?: string;
  endDate?: string;
}

export function useFinanceSummary(period?: FinanceSummaryPeriod) {
  const { status } = useAuth();
  const api = useFinanceSummaryApi();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startDate = period?.startDate;
  const endDate = period?.endDate;

  const refresh = useCallback(async () => {
    if (status !== 'authenticated' || !api.ready) {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setSummary(await api.getSummary({ startDate, endDate }));
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Failed to load finance summary.'));
    } finally {
      setLoading(false);
    }
  }, [api, endDate, startDate, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh, ready: api.ready };
}
