import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import type { ProfilePreferences, ProfileRepository, ProfileSnapshot } from './types';

const baseUrl = () => `${env.nexoraCoreUrl.replace(/\/$/, '')}/api/v1/profile/`;

async function request<T>(session: AuthSession, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(baseUrl() + path, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Nexora Core profile request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

export function nexoraCoreProfileRepository(session: AuthSession): ProfileRepository {
  return {
    getSnapshot: () => request<ProfileSnapshot>(session, ''),
    updatePreferences: (preferences: ProfilePreferences) =>
      request<ProfileSnapshot>(session, 'preferences/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      }),
  };
}
