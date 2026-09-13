export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  meta: Record<string, unknown>;
  error: unknown;
};

export type AccessTokenProvider = () => Promise<string | null>;

const apiBaseUrl = process.env.EXPO_PUBLIC_NEXORA_API_URL?.replace(/\/$/, "");

export function createApiClient(getAccessToken: AccessTokenProvider) {
  if (!apiBaseUrl) {
    throw new Error("EXPO_PUBLIC_NEXORA_API_URL is not configured.");
  }

  return {
    async request<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
      const token = await getAccessToken();
      const headers = new Headers(init.headers);
      headers.set("Accept", "application/json");
      headers.set("Content-Type", "application/json");
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
      const payload = (await response.json()) as ApiEnvelope<T>;

      if (!response.ok) {
        throw new Error(`Nexora Core API request failed (${response.status}).`);
      }
      return payload;
    },
  };
}
