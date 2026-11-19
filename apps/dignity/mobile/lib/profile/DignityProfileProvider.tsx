import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';

export interface DignityProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  timezone: string;
  locale: string;
  status: string;
}

export type DignityProfileStatus = 'idle' | 'loading' | 'ready' | 'error';

interface DignityProfileContextValue {
  profile: DignityProfile | null;
  status: DignityProfileStatus;
  error: string | null;
  refresh(): Promise<void>;
}

const DignityProfileContext = createContext<DignityProfileContextValue>({
  profile: null,
  status: 'idle',
  error: null,
  async refresh() {},
});

export function DignityProfileProvider({ children }: PropsWithChildren) {
  const { status: authStatus, identity } = useAuth();
  const identityId = identity?.id ?? null;
  const api = useNexoraApi();
  const requestVersion = useRef(0);
  const [profile, setProfile] = useState<DignityProfile | null>(null);
  const [status, setStatus] = useState<DignityProfileStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const requestId = ++requestVersion.current;
    if (authStatus !== 'signed_in') {
      setProfile(null);
      setStatus('idle');
      setError(null);
      return;
    }
    setProfile(null);
    setStatus('loading');
    setError(null);
    try {
      const response = await api.request<DignityProfile>('/api/v1/identity/me/');
      if (requestId !== requestVersion.current) return;
      setProfile(response.data);
      setStatus('ready');
    } catch (cause) {
      if (requestId !== requestVersion.current) return;
      setError(cause instanceof Error ? cause.message : 'Unable to load your Nexora identity.');
      setStatus('error');
    }
  }, [api, authStatus, identityId]);

  useEffect(() => {
    void refresh();
    return () => {
      requestVersion.current += 1;
    };
  }, [refresh]);

  const value = useMemo<DignityProfileContextValue>(
    () => ({ profile, status, error, refresh }),
    [profile, status, error, refresh],
  );
  return <DignityProfileContext.Provider value={value}>{children}</DignityProfileContext.Provider>;
}

export function useDignityProfile() {
  return useContext(DignityProfileContext);
}