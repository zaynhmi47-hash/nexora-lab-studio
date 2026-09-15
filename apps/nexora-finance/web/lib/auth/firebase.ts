'use client';

import {
  getAuth,
  onIdTokenChanged,
  setPersistence,
  browserLocalPersistence,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase/config';

let authInstance: Auth | null = null;
let persistencePromise: Promise<void> | null = null;

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

export async function configureFirebaseAuthPersistence(): Promise<Auth> {
  const auth = getFirebaseAuth();
  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence);
  }
  await persistencePromise;
  return auth;
}

export function subscribeToFirebaseUser(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  return onIdTokenChanged(auth, callback);
}
