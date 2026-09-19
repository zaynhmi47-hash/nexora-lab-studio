import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useFinanceSummaryApi } from './summaryApi';
import type { FinanceCategoryBreakdown } from './types';

export interface FinanceCategoryBreakdownPeriod {
  startDate?: string;
  endDate?: string;
}

export function useFinanceCategoryBreakdown(period?: FinanceCategoryBreakdownPeriod) {
  const { status } = useAuth();
  const api = useFinanceSummaryApi();
  const [breakdown, setBreakdown] = useState<FinanceCategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startDate = period?.startDate;
  const endDate = period?.endDate;

  const refresh = useCallback(async () => {
    if (status !== 'authenticated' || !api.ready) {
      setBreakdown([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setBreakdown(await api.getCategoryBreakdown({ startDate, endDate }));
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Failed to load finance breakdown.'));
    } finally {
      setLoading(false);
    }
  }, [api, endDate, startDate, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { breakdown, loading, error, refresh, ready: api.ready };
}
