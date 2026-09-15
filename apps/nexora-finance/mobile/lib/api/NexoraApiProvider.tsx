import { createContext, useContext, type PropsWithChildren } from 'react';

import { createNexoraApiClient, type NexoraApiClient } from './client';

const ApiContext = createContext<NexoraApiClient | null>(null);

const baseUrl = process.env.EXPO_PUBLIC_NEXORA_API_URL ?? 'http://localhost:8000';

export function NexoraApiProvider({ children }: PropsWithChildren) {
  const client = createNexoraApiClient(baseUrl);
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useNexoraApi(): NexoraApiClient {
  const client = useContext(ApiContext);
  if (!client) {
    throw new Error('NexoraApiProvider is missing from the component tree.');
  }
  return client;
}
