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

type ApiError = Error & { status?: number };

class DatingApi {
  constructor(private readonly baseUrl: string, private readonly token: string | null) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(this.baseUrl + path, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: 'Bearer ' + this.token } : {}),
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) {
      const error = new Error('Nexora Dating API request failed.') as ApiError;
      error.status = response.status;
      throw error;
    }
    return response.json() as Promise<T>;
  }

  getDiscovery() {
    return this.request<DiscoveryResponse>('/api/v1/dating/discovery/');
  }

  swipe(profileId: string, action: SwipeAction) {
    return this.request<{ status: 'accepted'; matched: boolean; matchId: string | null }>('/api/v1/dating/swipes/', {
      method: 'POST',
      body: JSON.stringify({ target_profile_id: profileId, action }),
    });
  }
}

const ApiContext = createContext<DatingApi | null>(null);

export function DatingApiProvider({ children }: PropsWithChildren) {
  const queryClient = useMemo(() => new QueryClient(), []);
  const baseUrl = process.env.EXPO_PUBLIC_NEXORA_API_URL ?? '';
  const api = useMemo(() => new DatingApi(baseUrl, null), [baseUrl]);

  return <QueryClientProvider client={queryClient}><ApiContext.Provider value={api}>{children}</ApiContext.Provider></QueryClientProvider>;
}

export function useDatingApi() {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useDatingApi must be used inside DatingApiProvider');
  return api;
}
