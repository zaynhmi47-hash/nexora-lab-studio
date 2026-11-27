import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { Platform } from 'react-native';

// Firebase 12.19 exposes this from its React Native runtime entry, but the
// shared TypeScript declarations omit the symbol.
// @ts-expect-error React Native runtime export missing from Firebase 12 shared typings.
import { getReactNativePersistence } from 'firebase/auth';

import { getFirebaseConfig } from './config';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;

  const existingDefaultApp = getApps().find((candidate) => candidate.name === '[DEFAULT]');
  firebaseApp = existingDefaultApp ?? initializeApp(getFirebaseConfig());
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (firebaseAuth) return firebaseAuth;

  const app = getFirebaseApp();
  if (Platform.OS === 'web') {
    firebaseAuth = getAuth(app);
    return firebaseAuth;
  }

  try {
    firebaseAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'auth/already-initialized'
    ) {
      firebaseAuth = getAuth(app);
    } else {
      throw error;
    }
  }

  return firebaseAuth;
}
