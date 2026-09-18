import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import type { AuthState, AuthUser } from './types';

interface AuthContextValue extends AuthState {
  signInDemo: (user: AuthUser) => void;
  signOut: () => void;
}

const initialState: AuthState = { status: 'unauthenticated', user: null };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(initialState);
  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    signInDemo: (user) => setState({ status: user.emailVerified ? 'authenticated' : 'email_unverified', user }),
    signOut: () => setState(initialState),
  }), [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing from the component tree.');
  return value;
}
