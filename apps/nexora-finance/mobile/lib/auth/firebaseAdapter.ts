import { GoogleAuthProvider, createUserWithEmailAndPassword, onIdTokenChanged, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

export interface FirebaseAuthSession { user: User; accessToken: string; }

export function subscribeToFirebaseAuth(onSession: (session: FirebaseAuthSession | null) => void, onError?: (error: unknown) => void) {
  return onIdTokenChanged(getFirebaseAuth(), async (user) => {
    if (!user) { onSession(null); return; }
    try { onSession({ user, accessToken: await user.getIdToken() }); }
    catch (error) { onError?.(error); }
  }, onError);
}

export async function signInWithEmail(email: string, password: string) { return signInWithEmailAndPassword(getFirebaseAuth(), email, password); }
export async function registerWithEmail(email: string, password: string) { return createUserWithEmailAndPassword(getFirebaseAuth(), email, password); }
export async function signInWithGoogle() {
  if (typeof window === 'undefined') throw new Error('Native Google Sign-In is not configured yet. Google popup sign-in is currently web-only.');
  return signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
}
export async function firebaseSignOut() { return signOut(getFirebaseAuth()); }
