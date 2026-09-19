import type { AuthSession } from '@/lib/auth/types';
import type { RamadanDashboard, RamadanPort } from './types';

const baseUrl = process.env.EXPO_PUBLIC_NEXORA_CORE_URL ?? 'http://localhost:8000';

async function request<T>(session: AuthSession, path: string): Promise<T> {
  const response = await fetch(baseUrl + '/api/v1/ramadan/' + path, {
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + session.accessToken,
    },
  });

  if (!response.ok) {
    throw new Error('Ramadan request failed (' + response.status + ').');
  }

  return (await response.json()) as T;
}

export function nexoraCoreRamadanRepository(session: AuthSession): RamadanPort {
  return {
    getDashboard: () => request<RamadanDashboard>(session, ''),
  };
}
