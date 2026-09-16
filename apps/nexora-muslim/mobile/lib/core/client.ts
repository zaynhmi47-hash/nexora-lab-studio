import type { AuthSession } from '../auth/types';
import { CoreClientError, mapCoreStatus } from './errors';

export type CoreClient = {
  get: <T>(path: string, session: AuthSession) => Promise<T>;
};

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function createCoreClient(baseUrl: string): CoreClient {
  return {
    async get<T>(path: string, session: AuthSession) {
      let response: Response;

      try {
        response = await fetch(joinUrl(baseUrl, path), {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: 'application/json',
          },
        });
      } catch {
        throw new CoreClientError(
          'Unable to reach Nexora Core.',
          'NETWORK_ERROR',
        );
      }

      if (!response.ok) {
        throw new CoreClientError(
          `Nexora Core request failed with status ${response.status}.`,
          mapCoreStatus(response.status),
          response.status,
        );
      }

      return response.json() as Promise<T>;
    },
  };
}
