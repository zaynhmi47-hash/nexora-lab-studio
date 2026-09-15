import type { Auth } from 'firebase/auth';

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export class NexoraApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'NexoraApiError';
  }
}

export interface NexoraApiClient {
  request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>>;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function createNexoraApiClient(baseUrl: string, auth: Auth): NexoraApiClient {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  return {
    async request<T>(path, init = {}) {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      const headers = new Headers(init.headers);
      headers.set('Accept', 'application/json');
      if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await fetch(`${normalizedBaseUrl}${normalizePath(path)}`, {
        ...init,
        headers,
        cache: init.cache ?? 'no-store',
      });

      const body = (await response.json().catch(() => null)) as
        | (ApiEnvelope<T> & { detail?: string; code?: string })
        | null;

      if (!response.ok) {
        throw new NexoraApiError(
          body?.detail ?? `Nexora API request failed with status ${response.status}.`,
          response.status,
          body?.code,
        );
      }

      if (!body || typeof body !== 'object' || !('data' in body)) {
        throw new NexoraApiError(
          'Nexora API returned an invalid response envelope.',
          response.status,
        );
      }

      return body;
    },
  };
}
