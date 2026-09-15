import type { AuthPort, AuthSession } from './types';
import type { NexoraIdentityPort } from './NexoraIdentityPort';
import type { TokenPort } from './TokenPort';

export interface AuthAdapterDependencies {
  tokenPort: TokenPort;
  identityPort: NexoraIdentityPort;
}

export function createNexoraAuthAdapter({ tokenPort, identityPort }: AuthAdapterDependencies): AuthPort {
  return {
    async getSession(): Promise<AuthSession> {
      return identityPort.resolveSession(tokenPort);
    },
    async signIn(): Promise<AuthSession> {
      return identityPort.resolveSession(tokenPort);
    },
    async signOut(): Promise<void> {
      await tokenPort.clear();
    },
  };
}
