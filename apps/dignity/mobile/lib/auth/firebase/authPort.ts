import { onIdTokenChanged } from 'firebase/auth';

import type { AuthPort, AuthSession } from '../types';
import { createNexoraAuthAdapter } from '../createAuthAdapter';
import { firebaseAuth } from './client';
import { createFirebaseNexoraIdentityPort } from './identityPort';
import { createFirebaseTokenPort } from './tokenPort';

export function createFirebaseAuthPort(baseUrl: string): AuthPort {
  const tokenPort = createFirebaseTokenPort();
  const identityPort = createFirebaseNexoraIdentityPort(baseUrl);
  const adapter = createNexoraAuthAdapter({ tokenPort, identityPort });

  return {
    async getSession(): Promise<AuthSession> {
      return adapter.getSession();
    },
    async signIn(): Promise<AuthSession> {
      throw new Error('A concrete Firebase sign-in provider is not configured yet.');
    },
    async signOut(): Promise<void> {
      await adapter.signOut();
    },
    subscribe(listener): () => void {
      let generation = 0;
      const unsubscribe = onIdTokenChanged(firebaseAuth, async () => {
        const currentGeneration = ++generation;
        try {
          const nextSession = await adapter.getSession();
          if (currentGeneration === generation) listener(nextSession);
        } catch (error) {
          if (currentGeneration === generation) {
            listener({
              status: 'error',
              identity: null,
              error: error instanceof Error
                ? error.message
                : 'Unable to synchronize the Nexora identity session.',
            });
          }
        }
      });

      return () => {
        generation += 1;
        unsubscribe();
      };
    },
  };
}
