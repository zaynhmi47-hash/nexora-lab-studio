import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useGoalApi } from './goalApi';
import type { CreateGoalContributionInput, FinanceGoalContribution } from './types';

export function useGoalContributions(goalId: string | null) {
  const { status } = useAuth();
  const api = useGoalApi();
  const requestRef = useRef(0);
  const [contributions, setContributions] = useState<FinanceGoalContribution[]>([]);
  const [dataScope, setDataScope] = useState<{ organizationId: string; goalId: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    const organizationId = api.organizationId;
    if (!goalId || status !== 'authenticated' || !api.ready || !organizationId) {
      setContributions([]); setDataScope(null); setLoading(false); return;
    }
    setLoading(true); setError(null);
    try {
      const result = await api.listContributions(goalId);
      if (requestId !== requestRef.current || api.organizationId !== organizationId) return;
      setContributions(result); setDataScope({ organizationId, goalId });
    } catch (cause) {
      if (requestId === requestRef.current && api.organizationId === organizationId) setError(cause instanceof Error ? cause : new Error('Failed to load contributions.'));
    } finally { if (requestId === requestRef.current) setLoading(false); }
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

  useEffect(() => { void refresh(); return () => { requestRef.current += 1; }; }, [refresh]);
  const scopeMatches = dataScope?.organizationId === api.organizationId && dataScope?.goalId === goalId;
  return { contributions: scopeMatches ? contributions : [], loading, submitting, error, refresh, add, voidContribution, ready: api.ready };
}
