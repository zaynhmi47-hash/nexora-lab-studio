import { onIdTokenChanged, type User } from 'firebase/auth';

import type { AuthToken, TokenPort } from '../TokenPort';
import { firebaseAuth } from './client';

function toAuthToken(user: User, token: string): AuthToken {
  return {
    value: token,
    expiresAt: null,
  };
}

export function createFirebaseTokenPort(): TokenPort {
  return {
    async getIdToken(forceRefresh = false): Promise<AuthToken | null> {
      const user = firebaseAuth.currentUser;
      if (!user) return null;
      const token = await user.getIdToken(forceRefresh);
      return toAuthToken(user, token);
    },
    async clear(): Promise<void> {
      await firebaseAuth.signOut();
    },
  };
}

export function subscribeToFirebaseTokenChanges(listener: (token: AuthToken | null) => void): () => void {
  return onIdTokenChanged(firebaseAuth, async (user) => {
    if (!user) {
      listener(null);
      return;
    }
    const token = await user.getIdToken();
    listener(toAuthToken(user, token));
  });
}
