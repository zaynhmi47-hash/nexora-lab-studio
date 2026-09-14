import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, type User } from 'firebase/auth';
import { getFirebaseAuth } from '../firebase/config';

WebBrowser.maybeCompleteAuthSession();

const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

function getClientId(): string {
  const clientId = Platform.select({
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  if (!clientId) {
    throw new Error(`Google OAuth client ID is not configured for ${Platform.OS}.`);
  }
  return clientId;
}

export async function signInWithGoogleAuthSession(): Promise<User> {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'nexorafinance',
    path: 'oauthredirect',
  });

  const request = new AuthSession.AuthRequest({
    clientId: getClientId(),
    responseType: AuthSession.ResponseType.Code,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    usePKCE: true,
    extraParams: { access_type: 'offline', prompt: 'select_account' },
  });

  const result = await request.promptAsync(googleDiscovery);
  if (result.type !== 'success') {
    throw new Error(`Google sign-in did not complete (${result.type}).`);
  }

  const idToken = result.authentication?.idToken ?? result.params?.id_token;
  if (!idToken) {
    throw new Error('Google OAuth completed without an ID token.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(getFirebaseAuth(), credential);
  return userCredential.user;
}
