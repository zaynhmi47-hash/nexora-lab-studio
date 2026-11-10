import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-ignore Firebase's React Native entrypoint exports this; Expo's TypeScript resolver selects web declarations.
import { getReactNativePersistence } from 'firebase/auth';
import {
  getAuth,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim(),
};

let authInstance: Auth | null = null;

export function getNexoraFirebaseAuth(): Auth {
  if (authInstance) return authInstance;

  // Prefer the Firebase app already initialized by Nexora Core. This lets
  // connected apps share the same identity session without duplicate config.
  const app = getApps().length > 0
    ? getApp()
    : (() => {
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
          throw new Error(
            'Konfigurasi Firebase belum lengkap. Isi EXPO_PUBLIC_FIREBASE_API_KEY, PROJECT_ID, dan APP_ID.',
          );
        }
        return initializeApp({
          apiKey: firebaseConfig.apiKey,
          projectId: firebaseConfig.projectId,
          appId: firebaseConfig.appId,
          ...(firebaseConfig.authDomain ? { authDomain: firebaseConfig.authDomain } : {}),
          ...(firebaseConfig.storageBucket ? { storageBucket: firebaseConfig.storageBucket } : {}),
          ...(firebaseConfig.messagingSenderId ? { messagingSenderId: firebaseConfig.messagingSenderId } : {}),
        });
      })();

  try {
    authInstance = initializeAuth(app, {
      // Firebase's React Native conditional entrypoint exports this helper.
      // The TypeScript resolver in this Expo workspace resolves the web declaration.
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Reuse the default Auth instance if Nexora Core initialized it first.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'auth/already-initialized'
    ) {
      authInstance = getAuth(app);
    } else {
      throw error;
    }
  }
  return authInstance;
}

export async function signInNexoraWithEmailPassword(
  email: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(getNexoraFirebaseAuth(), email.trim(), password);
}

export async function signOutNexora(): Promise<void> {
  await signOut(getNexoraFirebaseAuth());
}

export async function getNexoraCoreAccessToken(): Promise<string | null> {
  const user = getNexoraFirebaseAuth().currentUser;
  return user ? user.getIdToken() : null;
}
