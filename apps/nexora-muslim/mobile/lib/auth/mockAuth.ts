import type { AuthPort, AuthSession } from './types';

const mockSession: AuthSession = {
  accessToken: 'dev-only-token',
  user: {
    id: '00000000-0000-0000-0000-000000000001',
    provider: 'mock',
    providerSubject: 'dev-user',
    email: 'demo@nexora.local',
    displayName: 'Nexora Muslim User',
  },
};

export const mockAuth: AuthPort = {
  async getSession() {
    return null;
  },
  async signIn() {
    return mockSession;
  },
  async signOut() {},
};
