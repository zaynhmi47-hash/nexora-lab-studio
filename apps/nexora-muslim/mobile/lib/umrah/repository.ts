import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import { mockUmrahRepository as mockRepository } from './repository';
import type { UmrahJourney, UmrahJourneyProvider } from './types';

const baseUrl = () => `${env.nexoraCoreUrl.replace(/\/$/, '')}/api/v1/umrah`;

async function request<T>(session: AuthSession, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Nexora Core Umrah request failed (${response.status}).`);
  return (await response.json()) as T;
}

export const nexoraCoreUmrahRepository = (session: AuthSession) => ({
  getJourney: () => request<UmrahJourney>(session, '/'),
  toggleChecklist: (itemId: string) =>
    request<UmrahJourney>(session, `/checklist/${encodeURIComponent(itemId)}/toggle/`, { method: 'POST' }),
});

export { mockRepository as mockUmrahRepository };
export type { UmrahJourney, UmrahJourneyProvider };
