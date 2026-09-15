import { onAuthStateChanged } from 'firebase/auth';

import type { AuthPort, AuthSession } from '../types';
import { createNexoraAuthAdapter } from '../createAuthAdapter';
import { firebaseAuth } from './client';
import { createFirebaseNexoraIdentityPort } from './identityPort';
import { createFirebaseTokenPort } from './tokenPort';

function waitForInitialFirebaseSession(): Promise<void> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, () => {
      unsubscribe();
      resolve();
    });
  });
}

export function createFirebaseAuthPort(baseUrl: string): AuthPort {
  const tokenPort = createFirebaseTokenPort();
  const identityPort = createFirebaseNexoraIdentityPort(baseUrl);
  const adapter = createNexoraAuthAdapter({ tokenPort, identityPort });
  let initialized = false;

  return {
    async getSession(): Promise<AuthSession> {
      if (!initialized) {
        initialized = true;
        await waitForInitialFirebaseSession();
      }
      return adapter.getSession();
    },
    async signIn(): Promise<AuthSession> {
      throw new Error('A concrete Firebase sign-in provider is not configured yet.');
    },
    async signOut(): Promise<void> {
      await adapter.signOut();
    },
  };
}
