'use client';

import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { getFirebaseAuth } from '@/lib/auth/firebase';
import { createNexoraApiClient, type NexoraApiClient } from './client';

const NexoraApiContext = createContext<NexoraApiClient | null>(null);

export function NexoraApiProvider({ children }: PropsWithChildren) {
  const client = useMemo(
    () => createNexoraApiClient(
      process.env.NEXT_PUBLIC_NEXORA_API_URL?.trim() || 'http://127.0.0.1:8000',
      getFirebaseAuth(),
    ),
    [],
  );

  return <NexoraApiContext.Provider value={client}>{children}</NexoraApiContext.Provider>;
}

export function useNexoraApi(): NexoraApiClient {
  const client = useContext(NexoraApiContext);
  if (!client) {
    throw new Error('NexoraApiProvider is missing from the application tree.');
  }
  return client;
}
