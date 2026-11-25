import type { AuthSession } from './types';
import type { NexoraIdentityPort } from './NexoraIdentityPort';
import type { TokenPort } from './TokenPort';

export interface AuthAdapterDependencies {
  tokenPort: TokenPort;
  identityPort: NexoraIdentityPort;
}

export interface NexoraAuthSessionAdapter {
  getSession(): Promise<AuthSession>;
  signOut(): Promise<void>;
}

export function createNexoraAuthAdapter({
  tokenPort,
  identityPort,
}: AuthAdapterDependencies): NexoraAuthSessionAdapter {
  return {
    async getSession(): Promise<AuthSession> {
      return identityPort.resolveSession(tokenPort);
    },
    async signOut(): Promise<void> {
      await tokenPort.clear();
    },
  };
}
