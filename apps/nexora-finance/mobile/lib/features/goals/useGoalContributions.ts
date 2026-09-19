import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useGoalApi } from './goalApi';
import type { CreateGoalContributionInput, FinanceGoalContribution } from './types';

export function useGoalContributions(goalId: string | null) {
  const { status } = useAuth();
  const api = useGoalApi();
  const [contributions, setContributions] = useState<FinanceGoalContribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!goalId || status !== 'authenticated' || !api.ready) { setContributions([]); return; }
    setLoading(true); setError(null);
    try { setContributions(await api.listContributions(goalId)); }
    catch (cause) { setError(cause instanceof Error ? cause : new Error('Failed to load contributions.')); }
    finally { setLoading(false); }
  }, [api, goalId, status]);

  const add = useCallback(async (input: CreateGoalContributionInput) => {
    if (!goalId) throw new Error('A goal must be selected.');
    setSubmitting(true); setError(null);
    try { const value = await api.createContribution(goalId, input); await refresh(); return value; }
    catch (cause) { const value = cause instanceof Error ? cause : new Error('Unable to add contribution.'); setError(value); throw value; }
    finally { setSubmitting(false); }
  }, [api, goalId, refresh]);

  const voidContribution = useCallback(async (contributionId: string) => {
    if (!goalId) throw new Error('A goal must be selected.');
    setSubmitting(true); setError(null);
    try { const value = await api.voidContribution(goalId, contributionId); await refresh(); return value; }
    catch (cause) { const value = cause instanceof Error ? cause : new Error('Unable to void contribution.'); setError(value); throw value; }
    finally { setSubmitting(false); }
  }, [api, goalId, refresh]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { contributions, loading, submitting, error, refresh, add, voidContribution, ready: api.ready };
}
