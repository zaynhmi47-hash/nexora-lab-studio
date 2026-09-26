import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useDatingSession } from '@/src/auth/session';

export type DiscoveryProfile = { id: string; displayName: string; age: number | null; birthDate: string | null; bio: string; photoUrl: string | null; relationshipIntent: string };
export type DatingProfile = DiscoveryProfile & { discoveryEnabled: boolean };
export type Match = { id: string; userA: string; userB: string; matchedAt: string };
type WireProfile = { id: string; display_name: string; birth_date: string | null; age: number | null; bio: string; photo_url: string | null; relationship_intent: string; discovery_enabled?: boolean };

const mapProfile = (item: WireProfile): DiscoveryProfile => ({ id: item.id, displayName: item.display_name, age: item.age, birthDate: item.birth_date, bio: item.bio, photoUrl: item.photo_url, relationshipIntent: item.relationship_intent });

class DatingApi {
  constructor(private readonly baseUrl: string, private readonly token: string | null) {}
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(this.baseUrl + path, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(this.token ? { Authorization: 'Bearer ' + this.token } : {}), ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error('Nexora Dating API request failed.');
    return response.json() as Promise<T>;
  }
  async getDiscovery() {
    const wire = await this.request<{ items: WireProfile[]; next_cursor: string | null }>('/api/v1/dating/discovery/');
    return { items: wire.items.map(mapProfile), nextCursor: wire.next_cursor };
  }
  async getMyProfile(): Promise<DatingProfile> {
    const p = await this.request<WireProfile>('/api/v1/dating/profile/me/');
    return { ...mapProfile(p), discoveryEnabled: p.discovery_enabled ?? true };
  }
  async updateMyProfile(payload: Record<string, unknown>) {
    const p = await this.request<WireProfile>('/api/v1/dating/profile/me/', { method: 'PATCH', body: JSON.stringify(payload) });
    return { ...mapProfile(p), discoveryEnabled: p.discovery_enabled ?? true };
  }
  swipe(profileId: string, action: 'like' | 'pass') {
    return this.request<{ status: 'accepted'; matched: boolean; match_id: string | null }>('/api/v1/dating/swipes/', { method: 'POST', body: JSON.stringify({ target_profile_id: profileId, action }) });
  }
  getMatches() { return this.request<{ items: Match[] }>('/api/v1/dating/matches/'); }
}

const ApiContext = createContext<DatingApi | null>(null);
export function DatingApiProvider({ children }: PropsWithChildren) {
  const queryClient = useMemo(() => new QueryClient(), []);
  const { token } = useDatingSession();
  const baseUrl = process.env.EXPO_PUBLIC_NEXORA_API_URL ?? '';
  const api = useMemo(() => new DatingApi(baseUrl, token), [baseUrl, token]);
  return <QueryClientProvider client={queryClient}><ApiContext.Provider value={api}>{children}</ApiContext.Provider></QueryClientProvider>;
}
export function useDatingApi() { const api = useContext(ApiContext); if (!api) throw new Error('useDatingApi must be used inside DatingApiProvider'); return api; }
