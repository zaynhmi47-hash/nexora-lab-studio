import { env } from '@/lib/config/env';
import { firebaseAuth } from '@/lib/infrastructure/firebase/auth';
import { mockAuth } from './mockAuth';
import type { AuthPort } from './types';

export function createAuthPort(): AuthPort {
  switch (env.authMode) {
    case 'mock':
      return mockAuth;
    case 'firebase':
      return firebaseAuth;
    default:
      throw new Error(`Unsupported auth mode: ${env.authMode}`);
  }
}
