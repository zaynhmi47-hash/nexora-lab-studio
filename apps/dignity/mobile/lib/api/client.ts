import type { TokenPort } from '@/lib/auth';

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export class NexoraApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'NexoraApiError';
  }
}

export interface NexoraApiClient {
  request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>>;
}

export interface NexoraApiClientOptions {
  tokenPort?: TokenPort;
}

export function createNexoraApiClient(baseUrl: string, options: NexoraApiClientOptions = {}): NexoraApiClient {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    async request<T>(path: string, init?: RequestInit) {
      const token = await options.tokenPort?.getIdToken();
      const headers = new Headers(init?.headers);
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token.value}`);
      }

      const response = await fetch(`${normalizedBaseUrl}${path}`, {
        ...init,
        headers,
      });
      if (!response.ok) {
        throw new NexoraApiError(`Nexora API request failed with status ${response.status}`, response.status);
      }
      return (await response.json()) as ApiEnvelope<T>;
    },
  };
}
