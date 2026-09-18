import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';

import { useAuth } from '../auth';

import { env } from '../config/env';
import { createNexoraApiClient, type NexoraApiClient } from './client';

const ApiContext = createContext<NexoraApiClient | null>(null);

export function NexoraApiProvider({ children }: PropsWithChildren) {
  const client = useMemo(() => createNexoraApiClient(env.nexoraApiUrl), []);\n  const { accessToken } = useAuth();\n\n  useEffect(() => {\n    client.setAccessToken(accessToken);\n  }, [accessToken, client]);

  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useNexoraApi(): NexoraApiClient {
  const client = useContext(ApiContext);
  if (!client) {
    throw new Error('NexoraApiProvider is missing from the component tree.');
  }
  return client;
}
