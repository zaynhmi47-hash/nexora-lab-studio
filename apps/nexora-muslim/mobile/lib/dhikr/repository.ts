import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import type { Dhikr, DhikrHistoryEntry, DhikrRepository } from './types';

const baseUrl = () => `${env.nexoraCoreUrl.replace(/\/$/, '')}/api/v1/dhikr`;

async function request<T>(session: AuthSession, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Nexora Core Dhikr request failed (${response.status}).`);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const nexoraCoreDhikrRepository = (session: AuthSession): DhikrRepository => ({
  getAll: () => request<Dhikr[]>(session, '/'),
  increment: (dhikrId) => request<Dhikr>(session, `/${dhikrId}/increment/`, { method: 'POST' }),
  reset: (dhikrId) => request<Dhikr>(session, `/${dhikrId}/reset/`, { method: 'POST' }),
  getHistory: (dhikrId) => request<DhikrHistoryEntry[]>(session, dhikrId ? `/history/?dhikrId=${encodeURIComponent(dhikrId)}` : '/history/'),
});
