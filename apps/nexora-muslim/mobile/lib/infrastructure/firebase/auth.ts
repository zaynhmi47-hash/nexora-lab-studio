import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './client';
import type { AuthPort, AuthSession } from '@/lib/auth/types';
import { env } from '@/lib/config/env';

function toSession(user: User): Promise<AuthSession> {
  return user.getIdToken().then((accessToken) => ({
    accessToken,
    user: {
      // This is the Firebase subject until Django exchanges it for the canonical Nexora UUID.
      id: user.uid,
      provider: 'firebase',
      providerSubject: user.uid,
      email: user.email ?? undefined,
      displayName: user.displayName ?? undefined,
    },
  }));
}

export const firebaseAuth: AuthPort = {
  async getSession() {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    return currentUser ? toSession(currentUser) : null;
  },

  async signIn() {
    if (env.platform !== 'web') {
      throw new Error(
        'Firebase Google sign-in currently uses the web OAuth flow. Native OAuth will be added with the Expo-compatible provider adapter.',
      );
    }

    const result = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    return toSession(result.user);
  },

  async signOut() {
    await firebaseSignOut(getFirebaseAuth());
  },
};

export function subscribeToFirebaseAuth(
  callback: (session: AuthSession | null) => void,
): () => void {
  return onAuthStateChanged(getFirebaseAuth(), (user) => {
    if (!user) {
      callback(null);
      return;
    }

    void toSession(user).then(callback);
  });
}
