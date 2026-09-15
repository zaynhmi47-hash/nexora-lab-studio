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

export function createNexoraApiClient(baseUrl: string): NexoraApiClient {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    async request<T>(path, init = {}) {
      const response = await fetch(`${normalizedBaseUrl}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...init.headers,
        },
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
        throw new NexoraApiError('Nexora API returned an invalid response envelope.', response.status);
      }

      return body;
    },
  };
}
