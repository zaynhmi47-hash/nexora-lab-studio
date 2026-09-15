export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  meta: Record<string, unknown>;
  error: unknown;
};

export type AccessTokenProvider = (forceRefresh?: boolean) => Promise<string | null>;

export class NexoraApiError extends Error {
  readonly status: number;
  readonly payload: ApiEnvelope<unknown> | null;
  readonly requestId: string;

  constructor(
    message: string,
    options: {
      status: number;
      payload: ApiEnvelope<unknown> | null;
      requestId: string;
    },
  ) {
    super(message);
    this.name = 'NexoraApiError';
    this.status = options.status;
    this.payload = options.payload;
    this.requestId = options.requestId;
  }
}

const apiBaseUrl = process.env.EXPO_PUBLIC_NEXORA_API_URL?.replace(/\/$/, '');

function createRequestId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `nxf-${Date.now().toString(36)}-${random}`;
}

async function parseEnvelope(response: Response): Promise<ApiEnvelope<unknown> | null> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) return null;

  try {
    return (await response.json()) as ApiEnvelope<unknown>;
  } catch {
    return null;
  }
}

export function createApiClient(getAccessToken: AccessTokenProvider) {
  return {
    async request<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
      if (!apiBaseUrl) {
        throw new NexoraApiError('Nexora Core API URL is not configured.', {
          status: 0,
          payload: null,
          requestId: createRequestId(),
        });
      }

      const requestId = createRequestId();
      const headers = new Headers(init.headers);
      headers.set('Accept', 'application/json');
      headers.set('X-Request-ID', requestId);

      if (init.body && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      let token = await getAccessToken(false);
      if (token) headers.set('Authorization', `Bearer ${token}`);

      let response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });

      // Firebase normally refreshes tokens before expiry. A single forced refresh
      // handles the expiry boundary without creating an infinite retry loop.
      if (response.status === 401 && token) {
        token = await getAccessToken(true);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
          response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
        }
      }

      const payload = await parseEnvelope(response);
      if (!response.ok) {
        const message =
          typeof payload?.error === 'object' && payload?.error && 'message' in payload.error
            ? String((payload.error as { message?: unknown }).message ?? 'Request failed.')
            : `Nexora Core API request failed (${response.status}).`;
        throw new NexoraApiError(message, {
          status: response.status,
          payload,
          requestId,
        });
      }

      if (!payload) {
        throw new NexoraApiError('Nexora Core returned a non-JSON response.', {
          status: response.status,
          payload: null,
          requestId,
        });
      }

      return payload as ApiEnvelope<T>;
    },
  };
}
