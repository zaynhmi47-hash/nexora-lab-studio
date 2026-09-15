export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface NexoraApiClient {
  request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>>;
}

export function createNexoraApiClient(baseUrl: string): NexoraApiClient {
  return {
    async request<T>(path, init) {
      const response = await fetch(`${baseUrl}${path}`, init);
      if (!response.ok) {
        throw new Error(`Nexora API request failed with status ${response.status}`);
      }
      return (await response.json()) as ApiEnvelope<T>;
    },
  };
}
