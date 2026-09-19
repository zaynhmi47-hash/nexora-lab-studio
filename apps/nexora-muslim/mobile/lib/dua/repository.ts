import type { AuthSession } from '../auth/types';
import type { DuaEntry, DuaFavorite, DuaPort } from './types';
const baseUrl = () => (process.env.EXPO_PUBLIC_NEXORA_CORE_URL ?? 'http://localhost:8000').replace(/\/$/, '') + '/api/v1/dua';
async function request<T>(session: AuthSession, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(baseUrl() + path, { ...init, headers: { Accept: 'application/json', Authorization: 'Bearer ' + session.accessToken, ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error('Dua request failed (' + response.status + ').');
  return response.status === 204 ? undefined as T : await response.json() as T;
}
export const nexoraCoreDuaRepository = (session: AuthSession): DuaPort => ({
  list: async (category) => request<DuaEntry[]>(session, category ? '?category=' + encodeURIComponent(category) : ''),
  listFavorites: () => request<DuaFavorite[]>(session, '/favorites/'),
  toggleFavorite: async (duaId) => (await request<{ active: boolean }>(session, '/favorites/' + duaId + '/toggle/', { method: 'POST' })).active,
});
