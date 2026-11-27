import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

import type { AuthPort, AuthRegistration, AuthSession } from '../types';
import { createNexoraAuthAdapter } from '../createAuthAdapter';
import { getFirebaseAuth } from './client';
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
    async signIn(email: string, password: string): Promise<AuthSession> {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      return adapter.getSession();
    },
    async register(input: AuthRegistration): Promise<AuthSession> {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        input.email.trim(),
        input.password,
      );
      await updateProfile(credential.user, { displayName: input.displayName.trim() });
      return adapter.getSession();
    },
    async sendPasswordReset(email: string): Promise<void> {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
    },
    async signOut(): Promise<void> {
      await adapter.signOut();
    },
    subscribe(listener): () => void {
      let generation = 0;
      const unsubscribe = onIdTokenChanged(getFirebaseAuth(), async (user) => {
        const currentGeneration = ++generation;
        if (!user) {
          listener({ status: 'signed_out', identity: null });
          return;
        }

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
