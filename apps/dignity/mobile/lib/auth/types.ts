export type AuthStatus = 'signed_out' | 'signed_in' | 'loading';

export interface NexoraIdentity {
  id: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}

export interface AuthSession {
  status: AuthStatus;
  identity: NexoraIdentity | null;
}

export interface AuthPort {
  getSession(): Promise<AuthSession>;
  signIn(): Promise<AuthSession>;
  signOut(): Promise<void>;
}
