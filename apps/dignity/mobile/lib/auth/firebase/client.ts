import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
// Firebase 12.19 exports this from its React Native runtime entry, but its shared
// TypeScript declarations omit the symbol. Keep the suppression local to this import.
// @ts-expect-error React Native runtime export missing from Firebase 12 shared typings.
import { getReactNativePersistence } from 'firebase/auth';

import { firebaseConfig } from './config';

const hasExistingFirebaseApp = getApps().length > 0;
const firebaseApp = hasExistingFirebaseApp ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth: Auth = hasExistingFirebaseApp
  ? getAuth(firebaseApp)
  : initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export { firebaseApp };
