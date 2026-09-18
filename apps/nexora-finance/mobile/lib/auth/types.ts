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
}

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}
