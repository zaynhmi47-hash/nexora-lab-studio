import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseIdToken, signInWithGoogle, signOutFromFirebase, subscribeToAuthState } from './firebase';

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signInGoogle: signInWithGoogle,
    signOut: signOutFromFirebase,
    getIdToken: getFirebaseIdToken,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
