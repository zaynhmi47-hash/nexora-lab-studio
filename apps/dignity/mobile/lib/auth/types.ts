export type AuthStatus = 'signed_out' | 'signed_in' | 'loading' | 'error';

export interface NexoraIdentity {
  id: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}

export interface AuthSession {
  status: AuthStatus;
  identity: NexoraIdentity | null;
  error?: string;
}

export interface AuthPort {
  getSession(): Promise<AuthSession>;
  signIn(): Promise<AuthSession>;
  signOut(): Promise<void>;
  subscribe?(listener: (session: AuthSession) => void): () => void;
}
