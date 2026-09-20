import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { createNexoraApiClient, NexoraApiClient } from './client';
import type { TokenPort } from '@/lib/auth';

const NexoraApiContext = createContext<NexoraApiClient | null>(null);

export function NexoraApiProvider({ children, tokenPort }: PropsWithChildren<{ tokenPort?: TokenPort }>) {
  const client = useMemo(
    () => createNexoraApiClient(process.env.EXPO_PUBLIC_NEXORA_API_URL ?? 'http://localhost:8000', { tokenPort }),
    [tokenPort],
  );

  return <NexoraApiContext.Provider value={client}>{children}</NexoraApiContext.Provider>;
}

export function useNexoraApi(): NexoraApiClient {
  const client = useContext(NexoraApiContext);
  if (!client) throw new Error('useNexoraApi must be used within NexoraApiProvider');
  return client;
}
