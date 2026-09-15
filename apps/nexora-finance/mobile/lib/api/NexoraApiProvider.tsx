import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import { appEnv } from '../config/env';
import { createNexoraApiClient, type NexoraApiClient } from './client';

const NexoraApiContext = createContext<NexoraApiClient | null>(null);

export function NexoraApiProvider({ children }: PropsWithChildren) {
  const client = useMemo(() => createNexoraApiClient(appEnv.apiUrl), []);

  return <NexoraApiContext.Provider value={client}>{children}</NexoraApiContext.Provider>;
}

export function useNexoraApi(): NexoraApiClient {
  const client = useContext(NexoraApiContext);

  if (!client) {
    throw new Error('NexoraApiProvider is missing from the application tree.');
  }

  return client;
}
