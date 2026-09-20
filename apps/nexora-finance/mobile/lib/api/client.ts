import { NexoraApiError } from './errors';

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface NexoraApiClient {
  request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>>;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown; detail?: unknown };
    if (typeof body.message === 'string') return body.message;
    if (typeof body.detail === 'string') return body.detail;
  } catch {
    // Fall back to the HTTP status when the response is not JSON.
  }

  return `Nexora API request failed with status ${response.status}`;
}

export function createNexoraApiClient(baseUrl: string): NexoraApiClient {
  return {
    async request<T>(path: string, init?: RequestInit) {
      const response = await fetch(joinUrl(baseUrl, path), {
        ...init,
        headers: {
          Accept: 'application/json',
          ...init?.headers,
        },
      });

      if (!response.ok) {
        throw new NexoraApiError(
          await readErrorMessage(response),
          response.status,
        );
      }

      return (await response.json()) as ApiEnvelope<T>;
    },
  };
}
