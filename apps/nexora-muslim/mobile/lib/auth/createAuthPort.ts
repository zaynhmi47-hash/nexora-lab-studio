import { env } from '@/lib/config/env';
import { mockAuth } from './mockAuth';
import type { AuthPort } from './types';

export function createAuthPort(): AuthPort {
  switch (env.authMode) {
    case 'mock':
      return mockAuth;
    case 'firebase':
      throw new Error(
        'Firebase auth mode is configured but the Firebase adapter is not installed yet.',
      );
    default:
      throw new Error(`Unsupported auth mode: ${env.authMode}`);
  }
}
