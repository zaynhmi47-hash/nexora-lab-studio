import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';

import { firebaseConfig } from './config';

const hasExistingFirebaseApp = getApps().length > 0;
const firebaseApp = hasExistingFirebaseApp ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth: Auth = hasExistingFirebaseApp
  ? getAuth(firebaseApp)
  : initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export { firebaseApp };
