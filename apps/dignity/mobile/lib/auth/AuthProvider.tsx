import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthPort, AuthRegistration, AuthSession } from './types';

const initialSession: AuthSession = {
  status: 'loading',
  identity: null,
  error: null,
};

interface AuthContextValue extends AuthSession {
  signIn(email: string, password: string): Promise<void>;
  register(input: AuthRegistration): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  ...initialSession,
  async signIn() { throw new Error('Authentication provider is not configured.'); },
  async register() { throw new Error('Authentication provider is not configured.'); },
  async sendPasswordReset() { throw new Error('Authentication provider is not configured.'); },
  async signOut() {},
});

function createUnavailableAuthPort(): AuthPort {
  const unavailable = async (): Promise<never> => {
    throw new Error('Firebase authentication is not configured. Check the EXPO_PUBLIC_FIREBASE_* environment variables.');
  };
  return {
    async getSession() {
      return { status: 'unavailable', identity: null, error: 'Firebase authentication is not configured.' };
    },
    signIn: unavailable,
    register: unavailable,
    sendPasswordReset: unavailable,
    async signOut() {},
    subscribe() { return () => undefined; },
  };
}

export function AuthProvider({ children, port }: PropsWithChildren<{ port?: AuthPort }>) {
  const authPort = useMemo(() => port ?? createUnavailableAuthPort(), [port]);
  const [session, setSession] = useState<AuthSession>(initialSession);

  useEffect(() => {
    let active = true;
    const unsubscribe = authPort.subscribe((nextSession) => {
      if (active) setSession(nextSession);
    });

    void authPort.getSession()
      .then((nextSession) => {
        if (active) setSession(nextSession);
      })
      .catch((error: unknown) => {
        if (active) {
          setSession({
            status: 'unavailable',
            identity: null,
            error: error instanceof Error ? error.message : 'Unable to initialize authentication.',
          });
        }
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authPort]);

  const signIn = useCallback(async (email: string, password: string) => {
    setSession({ status: 'loading', identity: null });
    try {
      setSession(await authPort.signIn(email, password));
    } catch (error) {
      setSession({
        status: 'signed_out',
        identity: null,
        error: error instanceof Error ? error.message : 'Sign-in failed.',
      });
      throw error;
    }
  }, [authPort]);

  const register = useCallback(async (input: AuthRegistration) => {
    setSession({ status: 'loading', identity: null });
    try {
      setSession(await authPort.register(input));
    } catch (error) {
      setSession({
        status: 'signed_out',
        identity: null,
        error: error instanceof Error ? error.message : 'Registration failed.',
      });
      throw error;
    }
  }, [authPort]);

  const sendPasswordReset = useCallback((email: string) => authPort.sendPasswordReset(email), [authPort]);

  const signOut = useCallback(async () => {
    await authPort.signOut();
    setSession({ status: 'signed_out', identity: null });
  }, [authPort]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...session, signIn, register, sendPasswordReset, signOut }),
    [session, signIn, register, sendPasswordReset, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function identityToSession(identity: AuthSession['identity']): AuthSession {
  return identity
    ? { status: 'signed_in', identity, error: null }
    : { status: 'signed_out', identity: null, error: null };
}
