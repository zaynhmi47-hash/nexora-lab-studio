import {
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { getFirebaseAuth } from './firebase';
import type { AuthUser } from './types';

function mapUser(user: User): AuthUser {
  return {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    accessToken: null,
  };
}

export function subscribeToFirebaseAuth(onUser: (user: AuthUser | null) => void) {
  const auth = getFirebaseAuth();
  return onIdTokenChanged(auth, async (user) => {
    onUser(user ? mapUser(user) : null);
  });
}

export async function getFirebaseAccessToken(user: User): Promise<string> {
  return user.getIdToken();
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (typeof window === 'undefined') throw new Error('Google popup sign-in is currently supported on web only.');
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function firebaseSignOut() {
  return signOut(getFirebaseAuth());
}
