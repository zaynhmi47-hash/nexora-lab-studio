import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApps, initializeApp } from 'firebase/app';
import * as firebaseAuthSdk from 'firebase/auth';
import {
  getAuth,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type Persistence,
  type User,
  type UserCredential,
} from 'firebase/auth';

// Access this conditional Firebase export through the module namespace so the
// web bundle does not require a named React Native-only export at module load.
const getReactNativePersistence = (
  firebaseAuthSdk as typeof firebaseAuthSdk & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  }
).getReactNativePersistence;

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
  const existingDefaultApp = getApps().find(candidate => candidate.name === '[DEFAULT]');
  const app = existingDefaultApp ?? (() => {
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

  // A shared default app is safe only when it belongs to the same identity
  // project configured for this client. Fail fast instead of authenticating
  // against another Nexora/Firebase environment by accident.
  if (
    firebaseConfig.projectId &&
    app.options.projectId !== firebaseConfig.projectId
  ) {
    throw new Error(
      'Firebase project mismatch. Nexverse and Nexora Core must use the same EXPO_PUBLIC_FIREBASE_PROJECT_ID.',
    );
  }

  // AsyncStorage persistence is only valid on native platforms. On web,
  // Firebase Auth uses its browser persistence implementation.
  if (Platform.OS === 'web') {
    authInstance = getAuth(app);
    return authInstance;
  }

  try {
    authInstance = initializeAuth(app, {
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

export function subscribeToNexoraAuth(listener: (user: User | null) => void) {
  return onAuthStateChanged(getNexoraFirebaseAuth(), listener);
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
