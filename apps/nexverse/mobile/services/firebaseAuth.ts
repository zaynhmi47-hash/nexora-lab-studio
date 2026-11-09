import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';

const required = (name: string, value: string | undefined) => {
  if (!value?.trim()) {
    throw new Error(`Missing Firebase configuration: ${name}`);
  }
  return value.trim();
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let authInstance: Auth | null = null;

/**
 * Firebase is the external identity provider; Nexora Core remains the
 * canonical identity authority. This module only exposes Firebase ID tokens.
 */
export function getNexoraFirebaseAuth(): Auth {
  if (authInstance) return authInstance;

  const config = {
    apiKey: required('EXPO_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey),
    authDomain: required('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain),
    projectId: required('EXPO_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId),
    storageBucket: required('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket),
    messagingSenderId: required(
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      firebaseConfig.messagingSenderId,
    ),
    appId: required('EXPO_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId),
  };

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Another Nexora module may have initialized the default Firebase Auth.
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

export async function getNexoraCoreAccessToken(): Promise<string | null> {
  const user = getNexoraFirebaseAuth().currentUser;
  return user ? user.getIdToken() : null;
}
