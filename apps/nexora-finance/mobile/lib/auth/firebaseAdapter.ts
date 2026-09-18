import { GoogleAuthProvider, createUserWithEmailAndPassword, onIdTokenChanged, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from 'firebase/auth';

import { getFirebaseAuth } from './firebase';

export function subscribeToFirebaseAuth(onUser: (user: User | null) => void) {
  return onIdTokenChanged(getFirebaseAuth(), onUser);
}
export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}
export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
}
export async function signInWithGoogle() {
  if (typeof window === 'undefined') throw new Error('Google popup sign-in is supported on web in this adapter.');
  return signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
}
export async function firebaseSignOut() { return signOut(getFirebaseAuth()); }
