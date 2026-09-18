import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { firebaseSignOut, isFirebaseConfigured, registerWithEmail, signInWithEmail, signInWithGoogle, subscribeToFirebaseAuth, type FirebaseAuthSession } from './firebaseAdapter';
import type { AuthActions, AuthState, AuthUser } from './types';

interface AuthContextValue extends AuthState, AuthActions { firebaseConfigured: boolean; }
const initialState: AuthState = { status: 'unknown', user: null };
const AuthContext = createContext<AuthContextValue | null>(null);

function mapSession(session: FirebaseAuthSession): AuthUser {
  return { id: session.user.uid, email: session.user.email, displayName: session.user.displayName, emailVerified: session.user.emailVerified, accessToken: session.accessToken };
}
function mapFirebaseError(error: unknown): AuthState['status'] {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('user-disabled')) return 'account_disabled';
  if (code.includes('requires-recent-login')) return 'reauth_required';
  if (code.includes('id-token')) return 'session_expired';
  return 'unauthenticated';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const firebaseConfigured = isFirebaseConfigured();
  const [state, setState] = useState<AuthState>(firebaseConfigured ? initialState : { status: 'unauthenticated', user: null });

  useEffect(() => {
    if (!firebaseConfigured) return;
    setState(current => ({ ...current, status: 'authenticating' }));
    return subscribeToFirebaseAuth(
      session => {
        if (!session) { setState({ status: 'unauthenticated', user: null }); return; }
        const user = mapSession(session);
        setState({ status: user.emailVerified ? 'authenticated' : 'email_unverified', user });
      },
      error => setState({ status: mapFirebaseError(error), user: null }),
    );
  }, [firebaseConfigured]);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    firebaseConfigured,
    async signInWithEmail(email, password) { setState(current => ({ ...current, status: 'authenticating' })); try { await signInWithEmail(email, password); } catch (error) { setState({ status: mapFirebaseError(error), user: null }); throw error; } },
    async registerWithEmail(email, password) { setState(current => ({ ...current, status: 'authenticating' })); try { await registerWithEmail(email, password); } catch (error) { setState({ status: mapFirebaseError(error), user: null }); throw error; } },
    async signInWithGoogle() { setState(current => ({ ...current, status: 'authenticating' })); try { await signInWithGoogle(); } catch (error) { setState({ status: mapFirebaseError(error), user: null }); throw error; } },
    async signOut() { await firebaseSignOut(); setState({ status: 'unauthenticated', user: null }); },
  }), [firebaseConfigured, state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is missing from the component tree.'); return value; }
