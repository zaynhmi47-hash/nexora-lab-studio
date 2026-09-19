import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import type { GlobalSearchPort, GlobalSearchResponse } from './types';

function apiUrl(query: string) {
  return `${env.nexoraCoreUrl.replace(/\/$/, '')}/api/v1/search/?q=${encodeURIComponent(query)}`;
}

export function nexoraCoreSearchRepository(session: AuthSession): GlobalSearchPort {
  return {
    search: async (query) => {
      const response = await fetch(apiUrl(query), {
        headers: { Accept: 'application/json', Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error(`Nexora Core search request failed (${response.status}).`);
      return (await response.json()) as GlobalSearchResponse;
    },
  };
}
