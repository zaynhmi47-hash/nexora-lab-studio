import type { AuthSession } from './types';
import type { TokenPort } from './TokenPort';

export interface NexoraIdentityPort {
  resolveSession(tokenPort: TokenPort): Promise<AuthSession>;
}
