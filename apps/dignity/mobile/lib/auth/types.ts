export type AuthStatus = 'signed_out' | 'signed_in' | 'loading' | 'unavailable';

export interface NexoraIdentity {
  id: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}

export interface AuthSession {
  status: AuthStatus;
  identity: NexoraIdentity | null;
  error?: string | null;
}

export interface AuthRegistration {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthPort {
  getSession(): Promise<AuthSession>;
  signIn(email: string, password: string): Promise<AuthSession>;
  register(input: AuthRegistration): Promise<AuthSession>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  subscribe(listener: (session: AuthSession) => void): () => void;
}
