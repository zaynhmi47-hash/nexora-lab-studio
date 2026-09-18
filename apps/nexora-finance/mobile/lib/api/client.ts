import { NexoraApiError } from './errors';

export interface ApiEnvelope<T> { data: T; meta?: Record<string, unknown>; }
export interface NexoraApiClient { request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>>; setAccessToken(token: string | null): void; }
function joinUrl(baseUrl: string, path: string): string { return baseUrl.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, ''); }
async function readErrorMessage(response: Response): Promise<string> { try { const body = await response.json() as { message?: unknown; detail?: unknown }; if (typeof body.message === 'string') return body.message; if (typeof body.detail === 'string') return body.detail; } catch {} return 'Nexora API request failed with status ' + response.status; }
async function readPayload<T>(response: Response): Promise<ApiEnvelope<T>> { const body = await response.json() as unknown; if (body && typeof body === 'object' && 'data' in body) return body as ApiEnvelope<T>; return { data: body as T }; }
export function createNexoraApiClient(baseUrl: string): NexoraApiClient {
  let accessToken: string | null = null;
  return { setAccessToken(token) { accessToken = token; }, async request<T>(path, init) { const headers = new Headers(init?.headers); headers.set('Accept', 'application/json'); if (accessToken) headers.set('Authorization', 'Bearer ' + accessToken); const response = await fetch(joinUrl(baseUrl, path), { ...init, headers }); if (!response.ok) throw new NexoraApiError(await readErrorMessage(response), response.status); return readPayload<T>(response); } };
}
