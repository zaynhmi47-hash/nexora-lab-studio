import { describe, expect, it } from 'vitest';
import { createNexoraAuthAdapter } from './createAuthAdapter';
import { identityToSession } from './AuthProvider';
import type { NexoraIdentityPort } from './NexoraIdentityPort';
import type { TokenPort } from './TokenPort';

describe('createNexoraAuthAdapter', () => {
  it('resolves the Nexora session through the identity port', async () => {
    const tokenPort: TokenPort = {
      getIdToken: async () => ({ value: 'opaque-token', expiresAt: null }),
      clear: async () => undefined,
    };
    const identityPort: NexoraIdentityPort = {
      resolveSession: async () =>
        identityToSession({
          id: 'nexora-user-uuid',
          displayName: 'Student',
          email: 'student@example.com',
          photoUrl: null,
        }),
    };

    const adapter = createNexoraAuthAdapter({ tokenPort, identityPort });
    const session = await adapter.getSession();

    expect(session.identity?.id).toBe('nexora-user-uuid');
    expect(session.status).toBe('signed_in');
  });

  it('clears provider credentials on sign out', async () => {
    let cleared = false;
    const tokenPort: TokenPort = {
      getIdToken: async () => null,
      clear: async () => {
        cleared = true;
      },
    };
    const identityPort: NexoraIdentityPort = {
      resolveSession: async () => ({ status: 'signed_out', identity: null }),
    };

    const adapter = createNexoraAuthAdapter({ tokenPort, identityPort });
    await adapter.signOut();

    expect(cleared).toBe(true);
  });
});
