import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { Platform } from 'react-native';

import { getFirebaseConfig } from './config';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

type ReactNativePersistenceFactory = (storage: typeof AsyncStorage) => Persistence;

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
  }
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (firebaseAuth) return firebaseAuth;

  const app = getFirebaseApp();
  if (Platform.OS === 'web') {
    firebaseAuth = getAuth(app);
    return firebaseAuth;
  }

  // Firebase 12's public TypeScript declarations omit this RN-only export,
  // while the React Native runtime entry point still provides it.
  const getReactNativePersistence = (
    FirebaseAuth as unknown as { getReactNativePersistence?: ReactNativePersistenceFactory }
  ).getReactNativePersistence;

  if (!getReactNativePersistence) {
    throw new Error('The Firebase React Native auth runtime is unavailable. Verify Metro resolves the React Native Firebase Auth entry point.');
  }

  try {
    firebaseAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already initialized')) {
      firebaseAuth = getAuth(app);
    } else {
      throw error;
    }
  }
  return firebaseAuth;
}
