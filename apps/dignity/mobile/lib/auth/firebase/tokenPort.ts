import { onIdTokenChanged } from 'firebase/auth';

import type { AuthToken, TokenPort } from '../TokenPort';
import { firebaseAuth } from './client';

async function toAuthToken(): Promise<AuthToken | null> {
  const user = firebaseAuth.currentUser;
  if (!user) return null;

  const tokenResult = await user.getIdTokenResult();
  return {
    value: tokenResult.token,
    expiresAt: Date.parse(tokenResult.expirationTime),
  };
}

export function createFirebaseTokenPort(): TokenPort {
  return {
    async getIdToken(forceRefresh = false): Promise<AuthToken | null> {
      const user = firebaseAuth.currentUser;
      if (!user) return null;

      const token = await user.getIdToken(forceRefresh);
      const tokenResult = await user.getIdTokenResult(false);
      return {
        value: token,
        expiresAt: Date.parse(tokenResult.expirationTime),
      };
    },
    async clear(): Promise<void> {
      await firebaseAuth.signOut();
    },
  };
}

export function subscribeToFirebaseTokenChanges(listener: (token: AuthToken | null) => void): () => void {
  return onIdTokenChanged(firebaseAuth, async () => {
    listener(await toAuthToken());
  });
}
