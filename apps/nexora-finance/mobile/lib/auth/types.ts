export type AuthStatus =
  | 'unknown'
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'email_unverified'
  | 'reauth_required'
  | 'account_disabled'
  | 'session_expired';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  accessToken: string | null;
}

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

export interface AuthActions {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
