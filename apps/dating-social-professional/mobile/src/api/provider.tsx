import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useDatingSession } from '@/src/auth/session';

export type DiscoveryProfile = { id: string; displayName: string; age: number | null; birthDate: string | null; bio: string; photoUrl: string | null; relationshipIntent: string; interests: string[]; education: string; occupation: string; locationCity: string; locationCountry: string; maxDistanceKm: number; profileCompletion: number; compatibilityScore: number; distanceKm: number | null; sharedInterests: string[] };
export type DatingProfile = DiscoveryProfile & { discoveryEnabled: boolean; preferredMinAge: number; preferredMaxAge: number };
export type Match = { id: string; userA: string; userB: string; matchedAt: string; counterpart: DiscoveryProfile | null; conversationId: string | null; lastMessage: { body: string; createdAt: string; senderId: string } | null; unreadCount: number };
export type DatingMessage = { id: string; senderId: string; body: string; createdAt: string; readAt: string | null };
export type DatingNotification = { id: string; type: string; title: string; body: string; data: Record<string, unknown>; createdAt: string; readAt: string | null };
export type DatingProfileMedia = { id: string; url: string; mediaType: 'image'; sortOrder: number; isPrimary: boolean };
export type DatingNotificationPreferences = { push_enabled: boolean; match_push_enabled: boolean; message_push_enabled: boolean; safety_push_enabled: boolean };
type WireProfile = { id: string; display_name: string; birth_date: string | null; age: number | null; bio: string; photo_url: string | null; relationship_intent: string; discovery_enabled?: boolean; preferred_min_age: number; preferred_max_age: number; interests?: string[]; education?: string; occupation?: string; location_city?: string; location_country?: string; max_distance_km?: number; profile_completion?: number; compatibility_score?: number; distance_km?: number | null; shared_interests?: string[] };

const mapProfile = (item: WireProfile): DiscoveryProfile => ({ id: item.id, displayName: item.display_name, age: item.age, birthDate: item.birth_date, bio: item.bio, photoUrl: item.photo_url, relationshipIntent: item.relationship_intent, interests: item.interests ?? [], education: item.education ?? "", occupation: item.occupation ?? "", locationCity: item.location_city ?? "", locationCountry: item.location_country ?? "", maxDistanceKm: item.max_distance_km ?? 100, profileCompletion: item.profile_completion ?? 0, compatibilityScore: item.compatibility_score ?? 0, distanceKm: item.distance_km ?? null, sharedInterests: item.shared_interests ?? [] });

class DatingApi {
  constructor(private readonly baseUrl: string, private readonly token: string | null) {}
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
    const response = await fetch(this.baseUrl + path, { ...init, headers: { Accept: 'application/json', ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(this.token ? { Authorization: 'Bearer ' + this.token } : {}), ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error('Nexora Dating API request failed.');
    return response.json() as Promise<T>;
  }
  async getDiscovery(filters: Record<string, string> = {}) {
    const normalized = { ...filters };
    if (normalized.distance && !normalized.max_distance_km) {
      normalized.max_distance_km = normalized.distance;
      delete normalized.distance;
    }
    const query = new URLSearchParams(normalized).toString();
    const wire = await this.request<{ items: WireProfile[]; next_cursor: string | null }>(`/api/v1/dating/discovery/${query ? `?${query}` : ''}`);
    return { items: wire.items.map(mapProfile), nextCursor: wire.next_cursor };
  }
  getProfile(profileId: string) { return this.request<WireProfile>(`/api/v1/dating/profile/${profileId}/`).then(mapProfile); }
  getProfileMedia(profileId: string) { return this.request<{ items: DatingProfileMedia[] }>(`/api/v1/dating/profile/${profileId}/media/`); }
  addProfileMedia(profileId: string, payload: { url: string; media_type: 'image'; sort_order?: number; is_primary?: boolean }) { return this.request<DatingProfileMedia>(`/api/v1/dating/profile/${profileId}/media/`, { method: 'POST', body: JSON.stringify(payload) }); }
  uploadProfileMedia(profileId: string, asset: { uri: string; name: string; mimeType?: string | null }) { const form = new FormData(); form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'image/jpeg' } as unknown as Blob); return this.request<DatingProfileMedia>(`/api/v1/dating/profile/${profileId}/media/`, { method: 'POST', body: form }); }
  updateProfileMedia(profileId: string, mediaId: string, payload: { sort_order?: number; is_primary?: boolean }) { return this.request<DatingProfileMedia>(`/api/v1/dating/profile/${profileId}/media/`, { method: 'PATCH', body: JSON.stringify({ media_id: mediaId, ...payload }) }); }
  removeProfileMedia(profileId: string, mediaId: string) { return this.request<{ status: 'deleted' }>(`/api/v1/dating/profile/${profileId}/media/?media_id=${encodeURIComponent(mediaId)}`, { method: 'DELETE' }); }
  async getMyProfile(): Promise<DatingProfile> {
    const p = await this.request<WireProfile>('/api/v1/dating/profile/me/');
    return { ...mapProfile(p), discoveryEnabled: p.discovery_enabled ?? true, preferredMinAge: p.preferred_min_age, preferredMaxAge: p.preferred_max_age };
  }
  async updateMyProfile(payload: Record<string, unknown>) {
    const p = await this.request<WireProfile>('/api/v1/dating/profile/me/', { method: 'PATCH', body: JSON.stringify(payload) });
    return { ...mapProfile(p), discoveryEnabled: p.discovery_enabled ?? true, preferredMinAge: p.preferred_min_age, preferredMaxAge: p.preferred_max_age };
  }
  swipe(profileId: string, action: 'like' | 'pass') {
    return this.request<{ status: 'accepted'; matched: boolean; match_id: string | null }>('/api/v1/dating/swipes/', { method: 'POST', body: JSON.stringify({ target_profile_id: profileId, action }) });
  }
  getMatches() { return this.request<{ items: Array<{ id: string; userA: string; userB: string; matchedAt: string; counterpart: WireProfile | null; conversationId: string | null; lastMessage: { body: string; createdAt: string; senderId: string } | null; unreadCount: number }> }>('/api/v1/dating/matches/').then((result) => ({ items: result.items.map((item) => ({ ...item, counterpart: item.counterpart ? mapProfile(item.counterpart) : null })) })); }
  getNotifications() { return this.request<{ items: DatingNotification[]; unreadCount: number }>('/api/v1/dating/notifications/'); }
  markNotificationsRead() { return this.request<{ status: 'read' }>('/api/v1/dating/notifications/', { method: 'POST' }); }
  getNotificationPreferences() { return this.request<DatingNotificationPreferences>('/api/v1/dating/notification-preferences/'); }
  updateNotificationPreferences(payload: Partial<DatingNotificationPreferences>) { return this.request<DatingNotificationPreferences>('/api/v1/dating/notification-preferences/', { method: 'PATCH', body: JSON.stringify(payload) }); }
  setConversationPresence(conversationId: string) { return this.request<{ status: 'active' }>(`/api/v1/dating/conversations/${conversationId}/presence/`, { method: 'POST' }); }
  clearConversationPresence(conversationId: string) { return this.request<{ status: 'inactive' }>(`/api/v1/dating/conversations/${conversationId}/presence/`, { method: 'DELETE' }); }
  registerPushToken(token: string, platform: string) { return this.request<{ id: string; status: 'registered' }>('/api/v1/dating/push-tokens/', { method: 'POST', body: JSON.stringify({ token, platform }) }); }
  unregisterPushToken(token: string) { return this.request<{ status: 'unregistered' }>('/api/v1/dating/push-tokens/', { method: 'DELETE', body: JSON.stringify({ token }) }); }
  createConversation(matchId: string) { return this.request<{ id: string; matchId: string }>('/api/v1/dating/conversations/', { method: 'POST', body: JSON.stringify({ match_id: matchId }) }); }
  getMessages(conversationId: string) { return this.request<{ items: DatingMessage[] }>(`/api/v1/dating/conversations/${conversationId}/messages/`); }
  sendMessage(conversationId: string, body: string) { return this.request<DatingMessage>(`/api/v1/dating/conversations/${conversationId}/messages/`, { method: 'POST', body: JSON.stringify({ body }) }); }
  markConversationRead(conversationId: string) { return this.request<{ status: 'read'; updated: number }>(`/api/v1/dating/conversations/${conversationId}/read/`, { method: 'POST' }); }
  getConversation(conversationId: string) { return this.request<{ id: string; matchId: string; active: boolean; counterpart: DiscoveryProfile }>(`/api/v1/dating/conversations/${conversationId}/`); }
  unmatch(matchId: string) { return this.request<{ status: 'unmatched' }>(`/api/v1/dating/matches/${matchId}/unmatch/`, { method: 'POST' }); }
  blockConversation(conversationId: string) { return this.request<{ status: 'blocked' }>(`/api/v1/dating/conversations/${conversationId}/block/`, { method: 'POST' }); }
  blockUser(userId: string) { return this.request<{ status: 'blocked' }>('/api/v1/dating/blocks/', { method: 'POST', body: JSON.stringify({ target_user_id: userId }) }); }
  reportUser(userId: string, reason: string, details = '') { return this.request<{ status: 'reported'; report_id: string }>('/api/v1/dating/reports/', { method: 'POST', body: JSON.stringify({ target_user_id: userId, reason, details }) }); }
  reportConversation(conversationId: string, reason: string, details = '') { return this.request<{ status: 'reported'; report_id: string }>(`/api/v1/dating/conversations/${conversationId}/report/`, { method: 'POST', body: JSON.stringify({ reason, details }) }); }
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
