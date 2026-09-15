export const env = {
  nexoraCoreUrl: process.env.EXPO_PUBLIC_NEXORA_CORE_URL ?? 'http://localhost:8000',
  authMode: process.env.EXPO_PUBLIC_AUTH_MODE ?? 'mock',
} as const;
