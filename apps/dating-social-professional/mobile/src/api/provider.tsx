import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export type DiscoveryProfile = {
  id: string;
  displayName: string;
  age: number | null;
  bio: string;
  photoUrl: string | null;
};

export type DiscoveryResponse = { items: DiscoveryProfile[]; nextCursor: string | null };
export type SwipeAction = 'like' | 'pass';

class DatingApi {
  async getDiscovery(): Promise<DiscoveryResponse> {
    return { items: [], nextCursor: null };
  }

  async swipe(_profileId: string, _action: SwipeAction) {
    return { status: 'accepted' as const, matched: false };
  }
}

const ApiContext = createContext<DatingApi | null>(null);

export function DatingApiProvider({ children }: PropsWithChildren) {
  const queryClient = useMemo(() => new QueryClient(), []);
  const api = useMemo(() => new DatingApi(), []);

  return <QueryClientProvider client={queryClient}><ApiContext.Provider value={api}>{children}</ApiContext.Provider></QueryClientProvider>;
}

export function useDatingApi() {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useDatingApi must be used inside DatingApiProvider');
  return api;
}