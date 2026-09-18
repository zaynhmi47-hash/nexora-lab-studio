import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/lib/auth';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';

export interface NexoraIdentity {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  timezone: string;
  locale: string;
  status: string;
}

interface IdentityContextValue {
  identity: NexoraIdentity | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const api = useNexoraApi();
  const [identity, setIdentity] = useState<NexoraIdentity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = async () => {
    if (status !== 'authenticated') {
      setIdentity(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.request<NexoraIdentity>('/api/v1/identity/me/');
      setIdentity(response.data);
    } catch (cause) {
      const next = cause instanceof Error ? cause : new Error('Failed to load NEXORA identity.');
      setError(next);
      throw next;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') {
      setIdentity(null);
      setError(null);
      return;
    }
    void refresh().catch(() => undefined);
  }, [status]);

  return <IdentityContext.Provider value={{ identity, loading, error, refresh }}>{children}</IdentityContext.Provider>;
}

export function useNexoraIdentity() {
  const value = useContext(IdentityContext);
  if (!value) throw new Error('IdentityProvider is missing from the component tree.');
  return value;
}
