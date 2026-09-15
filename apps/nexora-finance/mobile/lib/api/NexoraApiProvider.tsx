import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import { env } from '../config/env';
import { createNexoraApiClient, type NexoraApiClient } from './client';

const ApiContext = createContext<NexoraApiClient | null>(null);

export function NexoraApiProvider({ children }: PropsWithChildren) {
  const client = useMemo(() => createNexoraApiClient(env.nexoraApiUrl), []);

  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useNexoraApi(): NexoraApiClient {
  const client = useContext(ApiContext);
  if (!client) {
    throw new Error('NexoraApiProvider is missing from the component tree.');
  }
  return client;
}
