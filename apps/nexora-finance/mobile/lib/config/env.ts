const DEFAULT_API_URL = 'http://localhost:8000';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export const env = {
  nexoraApiUrl: normalizeBaseUrl(
    process.env.EXPO_PUBLIC_NEXORA_API_URL ?? DEFAULT_API_URL,
  ),
} as const;
