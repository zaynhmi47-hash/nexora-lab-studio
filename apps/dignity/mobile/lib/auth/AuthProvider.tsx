import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { AuthPort, AuthRegistration, AuthSession, NexoraIdentity } from './types';

const initialSession: AuthSession = {
  status: 'loading',
  identity: null,
};

const unavailableSession: AuthSession = {
  status: 'unavailable',
  identity: null,
  error: 'Authentication is not configured. Add the Firebase public environment variables.',
};

interface AuthContextValue extends AuthSession {
  signIn(email: string, password: string): Promise<void>;
  register(input: AuthRegistration): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
}

const unavailableError = () => new Error(unavailableSession.error);

const AuthContext = createContext<AuthContextValue>({
  ...unavailableSession,
  async signIn() { throw unavailableError(); },
  async register() { throw unavailableError(); },
  async sendPasswordReset() { throw unavailableError(); },
  async signOut() { throw unavailableError(); },
});

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Authentication request failed.';
}

export function AuthProvider({ children, port }: PropsWithChildren<{ port?: AuthPort }>) {
  const [session, setSession] = useState<AuthSession>(() => port ? initialSession : unavailableSession);

  useEffect(() => {
    if (!port) {
      setSession(unavailableSession);
      return;
    }

    let active = true;
    const publish = (nextSession: AuthSession) => {
      if (active) setSession(nextSession);
    };

    if (port.subscribe) {
      const unsubscribe = port.subscribe(publish);
      return () => {
        active = false;
        unsubscribe();
      };
    }

    void port.getSession()
      .then(publish)
      .catch((error: unknown) => {
        publish({ status: 'error', identity: null, error: getErrorMessage(error) });
      });

    return () => {
      active = false;
    };
  }, [port]);

  const value = useMemo<AuthContextValue>(() => ({
    ...session,
    async signIn(email, password) {
      if (!port) throw unavailableError();
      setSession({ status: 'loading', identity: session.identity });
      try {
        setSession(await port.signIn(email, password));
      } catch (error) {
        setSession({ status: 'error', identity: null, error: getErrorMessage(error) });
        throw error;
      }
    },
    async register(input) {
      if (!port) throw unavailableError();
      setSession({ status: 'loading', identity: session.identity });
      try {
        setSession(await port.register(input));
      } catch (error) {
        setSession({ status: 'error', identity: null, error: getErrorMessage(error) });
        throw error;
      }
    },
    async sendPasswordReset(email) {
      if (!port) throw unavailableError();
      await port.sendPasswordReset(email);
    },
    async signOut() {
      if (!port) throw unavailableError();
      await port.signOut();
      setSession({ status: 'signed_out', identity: null });
    },
  }), [port, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function identityToSession(identity: NexoraIdentity | null): AuthSession {
  return identity
    ? { status: 'signed_in', identity }
    : { status: 'signed_out', identity: null };
}
