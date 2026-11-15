import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import type { OnboardingData, RegisterInput, User } from '../../types';
import {
  authService,
  type DemoPreset,
  type LoginInput,
} from '../../services/auth/authService';
import { authStorage } from '../../services/auth/authStorage';
import { getDignityFirebaseAuth } from '../../services/auth/firebaseClient';
import {
  NexoraIdentityError,
  resolveNexoraIdentity,
} from '../../services/auth/nexoraIdentityService';

export type AuthStage =
  | 'splash'
  | 'welcome'
  | 'login'
  | 'register'
  | 'onboarding'
  | 'authenticated';

export interface AuthState {
  authStage: AuthStage;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean;
  user: User | null;
  error: string | null;
}

export interface AuthContextValue {
  state: AuthState;
  demoAuthEnabled: boolean;
  setAuthStage: (stage: AuthStage) => void;
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>;
  demoLogin: (preset: DemoPreset) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (data: OnboardingData) => Promise<{ success: boolean; error?: string }>;
  guestLogin: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetDemoState: () => void;
}

const DEMO_AUTH_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_DIGNITY_ENABLE_DEMO_AUTH === 'true';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function createInitialState(): AuthState {
  return {
    authStage: authStorage.hasSeenSplash() ? 'welcome' : 'splash',
    isAuthenticated: false,
    isLoading: true,
    onboardingCompleted: false,
    user: null,
    error: null,
  };
}

function userFromIdentity(identity: {
  id: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}): User {
  const base = authService.getDefaultUser();
  return {
    ...base,
    id: identity.id,
    name: identity.displayName || identity.email?.split('@')[0] || 'Dignity Learner',
    email: identity.email || '',
    avatarUrl: identity.photoUrl || '',
    // Roles and institutional privileges are assigned by the backend, never by Firebase claims or client input.
    role: 'learner',
  };
}

function getFirebaseErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    const messages: Record<string, string> = {
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/invalid-login-credentials': 'Email or password is incorrect.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Choose a stronger password (at least 8 characters).',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network connection failed. Check your internet connection.',
      'auth/operation-not-allowed': 'Email and password sign-in is not enabled in Firebase Authentication.',
    };
    return messages[code] ?? 'Authentication could not be completed. Please try again.';
  }
  return error instanceof Error ? error.message : 'Authentication could not be completed.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(createInitialState);

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => {};

    // Remove the legacy client-side "authenticated" flag. Firebase is the sole
    // source of provider session truth; localStorage must never grant access.
    authStorage.clearSession();

    try {
      const auth = getDignityFirebaseAuth();
      unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (!active) return;

        if (!firebaseUser) {
          setState((current) => ({
            ...current,
            authStage: current.authStage === 'splash'
              ? (authStorage.hasSeenSplash() ? 'welcome' : 'splash')
              : 'welcome',
            isAuthenticated: false,
            isLoading: false,
            onboardingCompleted: false,
            user: null,
            error: null,
          }));
          return;
        }

        setState((current) => ({ ...current, isLoading: true, error: null }));
        try {
          const identity = await resolveNexoraIdentity(firebaseUser);
          if (!active) return;
          const user = userFromIdentity(identity);
          const onboardingCompleted = authStorage.getOnboardingCompleted(user.id);
          setState({
            authStage: onboardingCompleted ? 'authenticated' : 'onboarding',
            isAuthenticated: true,
            isLoading: false,
            onboardingCompleted,
            user,
            error: null,
          });
        } catch (error) {
          if (!active) return;
          setState((current) => ({
            ...current,
            authStage: 'login',
            isAuthenticated: false,
            isLoading: false,
            onboardingCompleted: false,
            user: null,
            error: error instanceof Error ? error.message : 'Unable to resolve Nexora identity.',
          }));
          if (error instanceof NexoraIdentityError && [401, 403].includes(error.status)) {
            await signOut(auth);
          }
        }
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        authStage: authStorage.hasSeenSplash() ? 'welcome' : 'splash',
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: error instanceof Error ? error.message : 'Firebase web authentication is not configured.',
      }));
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const setAuthStage = useCallback((authStage: AuthStage) => {
    setState((current) => ({ ...current, authStage, error: null }));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      await signInWithEmailAndPassword(getDignityFirebaseAuth(), input.email.trim(), input.password);
      return { success: true };
    } catch (error) {
      const message = getFirebaseErrorMessage(error);
      setState((current) => ({ ...current, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, []);

  const demoLogin = useCallback(async (preset: DemoPreset) => {
    if (!DEMO_AUTH_ENABLED) {
      return { success: false, error: 'Demo authentication is disabled.' };
    }
    const result = await authService.demoLogin(preset);
    if (!result.success || !result.user) {
      const error = result.error ?? 'Demo login failed.';
      setState((current) => ({ ...current, isLoading: false, error }));
      return { success: false, error };
    }
    setState({
      authStage: result.onboardingCompleted ? 'authenticated' : 'onboarding',
      isAuthenticated: true,
      isLoading: false,
      onboardingCompleted: result.onboardingCompleted ?? false,
      user: result.user,
      error: null,
    });
    return { success: true };
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    if (!input.termsAccepted) {
      return { success: false, error: 'You must accept the terms and conditions.' };
    }
    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const credential = await createUserWithEmailAndPassword(
        getDignityFirebaseAuth(),
        input.email.trim(),
        input.password,
      );
      await updateProfile(credential.user, { displayName: input.name.trim() });
      await credential.user.getIdToken(true);
      return { success: true };
    } catch (error) {
      const message = getFirebaseErrorMessage(error);
      setState((current) => ({ ...current, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      if (!email.trim() || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      await sendPasswordResetEmail(getDignityFirebaseAuth(), email.trim());
      setState((current) => ({ ...current, error: null }));
      return { success: true };
    } catch (error) {
      const message = getFirebaseErrorMessage(error);
      setState((current) => ({ ...current, error: message }));
      return { success: false, error: message };
    }
  }, []);

  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    if (!state.user) {
      const error = 'No authenticated user.';
      setState((current) => ({ ...current, error }));
      return { success: false, error };
    }

    const result = await authService.completeOnboarding(state.user, data);
    if (!result.success || !result.user) {
      const error = result.error ?? 'Unable to complete onboarding.';
      setState((current) => ({ ...current, error }));
      return { success: false, error };
    }

    authStorage.setOnboardingCompleted(result.user.id, true);
    setState({
      authStage: 'authenticated',
      isAuthenticated: true,
      isLoading: false,
      onboardingCompleted: true,
      user: result.user,
      error: null,
    });
    return { success: true };
  }, [state.user]);

  const guestLogin = useCallback(async () => {
    if (!DEMO_AUTH_ENABLED) {
      return { success: false, error: 'Guest/demo access is disabled.' };
    }
    return demoLogin('new_learner');
  }, [demoLogin]);

  const logout = useCallback(() => {
    authStorage.clearSession();
    try {
      void signOut(getDignityFirebaseAuth()).catch(() => undefined);
    } catch {
      // Firebase may not be configured in a local prototype environment.
    }
    setState({
      authStage: 'welcome',
      isAuthenticated: false,
      isLoading: false,
      onboardingCompleted: false,
      user: null,
      error: null,
    });
  }, []);

  const resetDemoState = useCallback(() => {
    authStorage.clearAll();
    try {
      void signOut(getDignityFirebaseAuth()).catch(() => undefined);
    } catch {
      // Firebase may not be configured in a local prototype environment.
    }
    setState({
      authStage: 'splash',
      isAuthenticated: false,
      isLoading: false,
      onboardingCompleted: false,
      user: null,
      error: null,
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    state,
    demoAuthEnabled: DEMO_AUTH_ENABLED,
    setAuthStage,
    login,
    demoLogin,
    register,
    resetPassword,
    completeOnboarding,
    guestLogin,
    logout,
    resetDemoState,
  }), [
    state,
    setAuthStage,
    login,
    demoLogin,
    register,
    resetPassword,
    completeOnboarding,
    guestLogin,
    logout,
    resetDemoState,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
