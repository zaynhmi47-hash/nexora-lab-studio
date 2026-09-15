export type NexoraUser = {
  id: string;
  provider: 'firebase' | 'mock';
  providerSubject: string;
  email?: string;
  displayName?: string;
};

export type AuthSession = {
  accessToken: string;
  user: NexoraUser;
};

export interface AuthPort {
  getSession(): Promise<AuthSession | null>;
  signIn(): Promise<AuthSession>;
  signOut(): Promise<void>;
}
