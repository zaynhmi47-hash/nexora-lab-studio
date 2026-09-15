const apiUrl = process.env.EXPO_PUBLIC_NEXORA_API_URL?.trim();

export const appEnv = {
  apiUrl: apiUrl || 'http://127.0.0.1:8000',
} as const;
