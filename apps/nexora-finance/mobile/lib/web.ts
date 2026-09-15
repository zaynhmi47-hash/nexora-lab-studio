import { Platform } from 'react-native';

export function openExternalUrl(url: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function getWebOrigin(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return window.location.origin;
}
