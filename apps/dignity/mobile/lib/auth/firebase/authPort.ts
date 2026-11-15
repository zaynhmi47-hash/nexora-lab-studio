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

function waitForInitialFirebaseSession(): Promise<void> {
  return new Promise((resolve, reject) => {
    const auth = getFirebaseAuth();
    let unsubscribe: () => void = () => {};
    unsubscribe = onIdTokenChanged(auth, () => {
      unsubscribe();
      resolve();
    }, reject);
  });
}

function firebaseErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    const messages: Record<string, string> = {
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/invalid-login-credentials': 'Email or password is incorrect.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Choose a stronger password (at least 8 characters).',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network connection failed. Check your internet connection.',
      'auth/operation-not-allowed': 'Email and password sign-in is not enabled in Firebase Authentication.',
    };
    return messages[code] ?? 'Authentication could not be completed. Please try again.';
  }
  return error instanceof Error ? error.message : 'Authentication could not be completed.';
}

export function createFirebaseAuthPort(baseUrl: string): AuthPort {
  const tokenPort = createFirebaseTokenPort();
  const identityPort = createFirebaseNexoraIdentityPort(baseUrl);
  const adapter = createNexoraAuthAdapter({ tokenPort, identityPort });
  let initialized = false;

  const getSession = async (): Promise<AuthSession> => {
    if (!initialized) {
      await waitForInitialFirebaseSession();
      initialized = true;
    }
    return adapter.getSession();
  };

  const resolveCurrentSession = async (): Promise<AuthSession> => {
    try {
      return await getSession();
    } catch (error) {
      return {
        status: 'unavailable',
        identity: null,
        error: error instanceof Error ? error.message : 'Unable to resolve Nexora identity.',
      };
    }
  };

  return {
    getSession,
    async signIn(email, password) {
      try {
        await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
        initialized = true;
        return await adapter.getSession();
      } catch (error) {
        throw new Error(firebaseErrorMessage(error));
      }
    },
    async register(input: AuthRegistration) {
      try {
        const credential = await createUserWithEmailAndPassword(
          getFirebaseAuth(),
          input.email.trim(),
          input.password,
        );
        await updateProfile(credential.user, { displayName: input.displayName.trim() });
        initialized = true;
        return await adapter.getSession();
      } catch (error) {
        throw new Error(firebaseErrorMessage(error));
      }
    },
    async sendPasswordReset(email) {
      try {
        await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      } catch (error) {
        throw new Error(firebaseErrorMessage(error));
      }
    },
    async signOut() {
      await adapter.signOut();
    },
    subscribe(listener) {
      try {
        let active = true;
        let generation = 0;
        const unsubscribe = onIdTokenChanged(getFirebaseAuth(), async () => {
          const currentGeneration = ++generation;
          const nextSession = await resolveCurrentSession();
          if (active && currentGeneration === generation) listener(nextSession);
        });

        return () => {
          active = false;
          generation += 1;
          unsubscribe();
        };
      } catch (error) {
        listener({
          status: 'unavailable',
          identity: null,
          error: error instanceof Error ? error.message : 'Firebase authentication is unavailable.',
        });
        return () => undefined;
      }
    },
  };
}
