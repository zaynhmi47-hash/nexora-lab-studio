import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import { useAuth } from '../auth/AuthProvider';
import { createApiClient } from './client';

export type NexoraApi = ReturnType<typeof createApiClient>;

const NexoraApiContext = createContext<NexoraApi | null>(null);

export function NexoraApiProvider({ children }: PropsWithChildren) {
  const { getIdToken } = useAuth();
  const api = useMemo(() => createApiClient(getIdToken), [getIdToken]);

  return <NexoraApiContext.Provider value={api}>{children}</NexoraApiContext.Provider>;
}

export function useNexoraApi(): NexoraApi {
  const api = useContext(NexoraApiContext);
  if (!api) throw new Error('useNexoraApi must be used inside NexoraApiProvider.');
  return api;
}
