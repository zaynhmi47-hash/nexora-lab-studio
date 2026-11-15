import type { FirebaseOptions } from 'firebase/app';
import { Platform } from 'react-native';

const values = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function hasFirebaseConfig(): boolean {
  return Object.values(values).every((value) => typeof value === 'string' && value.length > 0);
}

export function getFirebaseConfig(): FirebaseOptions {
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Firebase client configuration: ${missing.join(', ')}. Set the matching EXPO_PUBLIC_FIREBASE_* variables.`);
  }

  return values as FirebaseOptions;
}

export const firebasePlatform = Platform.OS;
