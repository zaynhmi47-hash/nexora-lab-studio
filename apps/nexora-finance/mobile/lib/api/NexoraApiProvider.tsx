import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import { createNexoraApiClient, type NexoraApiClient } from './client';

const DEFAULT_API_URL = 'http://127.0.0.1:8000';

const NexoraApiContext = createContext<NexoraApiClient | null>(null);

export function NexoraApiProvider({ children }: PropsWithChildren) {
  const baseUrl = process.env.EXPO_PUBLIC_NEXORA_API_URL ?? DEFAULT_API_URL;
  const client = useMemo(() => createNexoraApiClient(baseUrl), [baseUrl]);

  return <NexoraApiContext.Provider value={client}>{children}</NexoraApiContext.Provider>;
}

export function useNexoraApi(): NexoraApiClient {
  const client = useContext(NexoraApiContext);

  if (!client) {
    throw new Error('NexoraApiProvider is missing from the application tree.');
  }

  return client;
}
