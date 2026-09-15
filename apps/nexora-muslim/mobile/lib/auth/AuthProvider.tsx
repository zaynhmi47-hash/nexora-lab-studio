import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { createAuthPort } from './createAuthPort';
import type { AuthPort, AuthSession } from './types';

const AuthContext = createContext<{
  session: AuthSession | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
} | null>(null);

const auth: AuthPort = createAuthPort();

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void auth
      .getSession()
      .then((nextSession) => {
        if (active) setSession(nextSession);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      async signIn() {
        setLoading(true);
        try {
          setSession(await auth.signIn());
        } finally {
          setLoading(false);
        }
      },
      async signOut() {
        setLoading(true);
        try {
          await auth.signOut();
          setSession(null);
        } finally {
          setLoading(false);
        }
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
