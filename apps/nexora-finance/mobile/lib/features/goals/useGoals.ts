import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useGoalApi } from './goalApi';
import type { CreateGoalInput, FinanceGoal, UpdateGoalInput } from './types';

export function useGoals() {
  const { status } = useAuth();
  const api = useGoalApi();
  const requestRef = useRef(0);
  const [goals, setGoals] = useState<FinanceGoal[]>([]);
  const [dataOrganizationId, setDataOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    const requestedOrganizationId = api.organizationId;
    if (status !== 'authenticated' || !api.ready || !requestedOrganizationId) {
      setGoals([]); setDataOrganizationId(null); setLoading(false); return;
    }
    setLoading(true); setError(null);
    try {
      const result = await api.listGoals('active');
      if (requestId !== requestRef.current || api.organizationId !== requestedOrganizationId) return;
      setGoals(result); setDataOrganizationId(requestedOrganizationId);
    } catch (cause) {
      if (requestId === requestRef.current && api.organizationId === requestedOrganizationId) setError(cause instanceof Error ? cause : new Error('Failed to load goals.'));
    } finally { if (requestId === requestRef.current) setLoading(false); }
  }, [api, status]);

  const create = useCallback(async (input: CreateGoalInput) => { const value = await api.createGoal(input); await refresh(); return value; }, [api, refresh]);
  const update = useCallback(async (id: string, input: UpdateGoalInput) => { const value = await api.updateGoal(id, input); await refresh(); return value; }, [api, refresh]);
  const archive = useCallback(async (id: string) => { const value = await api.archiveGoal(id); await refresh(); return value; }, [api, refresh]);

  useEffect(() => { void refresh(); return () => { requestRef.current += 1; }; }, [refresh]);
  return { goals: dataOrganizationId === api.organizationId ? goals : [], loading, error, refresh, create, update, archive, ready: api.ready };
}
