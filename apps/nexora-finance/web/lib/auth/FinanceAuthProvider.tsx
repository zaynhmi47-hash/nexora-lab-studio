'use client';

import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { User } from 'firebase/auth';
import { configureFirebaseAuthPersistence, subscribeToFirebaseUser } from './firebase';

interface FinanceAuthContextValue {
  user: User | null;
  loading: boolean;
}

const FinanceAuthContext = createContext<FinanceAuthContextValue | null>(null);

export function FinanceAuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    void configureFirebaseAuthPersistence()
      .then(() => {
        if (!active) return;
        unsubscribe = subscribeToFirebaseUser((nextUser) => {
          if (active) {
            setUser(nextUser);
            setLoading(false);
          }
        });
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, loading }), [loading, user]);
  return <FinanceAuthContext.Provider value={value}>{children}</FinanceAuthContext.Provider>;
}

export function useFinanceAuth(): FinanceAuthContextValue {
  const context = useContext(FinanceAuthContext);
  if (!context) {
    throw new Error('FinanceAuthProvider is missing from the application tree.');
  }
  return context;
}
