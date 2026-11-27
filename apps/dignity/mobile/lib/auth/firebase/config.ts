import type { FirebaseOptions } from 'firebase/app';
import { Platform } from 'react-native';

const values = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim(),
};

const requiredKeys = ['apiKey', 'projectId', 'appId'] as const;

export function hasFirebaseConfig(): boolean {
  return requiredKeys.every((key) => Boolean(values[key]));
}

export function getFirebaseConfig(): FirebaseOptions {
  const missing = requiredKeys.filter((key) => !values[key]);
  if (missing.length > 0) {
    throw new Error(`Missing Firebase client configuration: ${missing.join(', ')}. Set the matching EXPO_PUBLIC_FIREBASE_* variables.`);
  }

  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ) as FirebaseOptions;
}

export const firebasePlatform = Platform.OS;
