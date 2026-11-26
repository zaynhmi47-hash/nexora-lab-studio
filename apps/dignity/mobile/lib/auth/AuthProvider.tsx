import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthPort, AuthSession, NexoraIdentity } from './types';

const initialSession: AuthSession = {
  status: 'loading',
  identity: null,
};

const AuthContext = createContext<AuthSession>(initialSession);

function createUnavailableAuthPort(): AuthPort {
  return {
    async getSession() {
      return initialSession;
    },
    async signIn() {
      throw new Error('Authentication provider is not configured yet.');
    },
    async signOut() {
      return undefined;
    },
  };
}

export function AuthProvider({ children, port }: PropsWithChildren<{ port?: AuthPort }>) {
  const authPort = useMemo(() => port ?? createUnavailableAuthPort(), [port]);
  const [session, setSession] = useState<AuthSession>(initialSession);

  useEffect(() => {
    let active = true;
    const publish = (nextSession: AuthSession) => {
      if (active) setSession(nextSession);
    };

    if (authPort.subscribe) {
      const unsubscribe = authPort.subscribe(publish);
      return () => {
        active = false;
        unsubscribe();
      };
    }

    void authPort.getSession()
      .then(publish)
      .catch((error: unknown) => {
        publish({
          status: 'error',
          identity: null,
          error: error instanceof Error ? error.message : 'Unable to restore authentication session.',
        });
      });

    return () => {
      active = false;
    };
  }, [authPort]);

  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthSession {
  return useContext(AuthContext);
}

export function identityToSession(identity: NexoraIdentity | null): AuthSession {
  return identity
    ? { status: 'signed_in', identity }
    : { status: 'signed_out', identity: null };
}
