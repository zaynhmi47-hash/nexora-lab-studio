import type { AuthPort, AuthSession, NexoraUser } from './types';

export type FirebaseAuthUser = {
  uid: string;
  getIdToken(forceRefresh?: boolean): Promise<string>;
  email?: string | null;
  displayName?: string | null;
};

export type FirebaseAuthAdapterDependencies = {
  getCurrentUser: () => FirebaseAuthUser | null;
  signIn: () => Promise<FirebaseAuthUser>;
  signOut: () => Promise<void>;
};

function toSession(user: FirebaseAuthUser, accessToken: string): AuthSession {
  const nexoraUser: NexoraUser = {
    id: user.uid,
    provider: 'firebase',
    providerSubject: user.uid,
    email: user.email ?? undefined,
    displayName: user.displayName ?? undefined,
  };

  return { accessToken, user: nexoraUser };
}

export function createFirebaseAuthPort(
  dependencies: FirebaseAuthAdapterDependencies,
): AuthPort {
  return {
    async getSession() {
      const user = dependencies.getCurrentUser();
      if (!user) return null;
      return toSession(user, await user.getIdToken());
    },

    async signIn() {
      const user = await dependencies.signIn();
      return toSession(user, await user.getIdToken());
    },

    signOut() {
      return dependencies.signOut();
    },
  };
}
