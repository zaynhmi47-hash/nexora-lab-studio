import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './client';
import { firebaseEnv } from './config';
import type { AuthPort, AuthSession } from '@/lib/auth/types';

function toSession(user: User): Promise<AuthSession> {
  return user.getIdToken().then((accessToken) => ({
    accessToken,
    user: {
      // Firebase UID is the provider subject. Django must exchange it for the canonical Nexora UUID.
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
    const currentUser = getFirebaseAuth().currentUser;
    return currentUser ? toSession(currentUser) : null;
  },

  async signIn() {
    if (firebaseEnv.platform !== 'web') {
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
