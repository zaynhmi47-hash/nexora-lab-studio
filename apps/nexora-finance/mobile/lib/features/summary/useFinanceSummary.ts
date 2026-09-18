import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useFinanceSummaryApi } from './summaryApi';
import type { FinanceSummary } from './types';

export function useFinanceSummary() {
  const { status } = useAuth();
  const api = useFinanceSummaryApi();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (status !== 'authenticated' || !api.ready) {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setSummary(await api.getSummary());
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Failed to load finance summary.'));
    } finally {
      setLoading(false);
    }
  }, [api, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh, ready: api.ready };
}
