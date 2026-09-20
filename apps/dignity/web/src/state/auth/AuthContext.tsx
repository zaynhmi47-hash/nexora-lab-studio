import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type {
  OnboardingData,
  RegisterInput,
  User,
} from '../../types';

import {
  authService,
  type DemoPreset,
  type LoginInput,
} from '../../services/auth/authService';

import { authStorage } from '../../services/auth/authStorage';

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

  setAuthStage: (stage: AuthStage) => void;

  login: (
    input: LoginInput,
  ) => Promise<{ success: boolean; error?: string }>;

  demoLogin: (
    preset: DemoPreset,
  ) => Promise<{ success: boolean; error?: string }>;

  register: (
    input: RegisterInput,
  ) => Promise<{ success: boolean; error?: string }>;

  resetPassword: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;

  completeOnboarding: (
    data: OnboardingData,
  ) => Promise<{ success: boolean; error?: string }>;

  guestLogin: () => Promise<{ success: boolean; error?: string }>;

  logout: () => void;

  resetDemoState: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function createInitialState(): AuthState {
  const stored = authStorage.getSession();

  if (!stored?.isAuthenticated || !stored.user) {
    return {
      authStage: authStorage.hasSeenSplash() ? 'welcome' : 'splash',
      isAuthenticated: false,
      isLoading: false,
      onboardingCompleted: false,
      user: null,
      error: null,
    };
  }

  return {
    authStage: stored.onboardingCompleted
      ? 'authenticated'
      : 'onboarding',
    isAuthenticated: true,
    isLoading: false,
    onboardingCompleted: stored.onboardingCompleted,
    user: stored.user as User,
    error: null,
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<AuthState>(createInitialState);

  const persistState = useCallback((next: AuthState) => {
    if (next.isAuthenticated && next.user) {
      authStorage.setSession({
        userId: next.user.id,
        user: next.user,
        isAuthenticated: true,
        onboardingCompleted: next.onboardingCompleted,
      });

      return;
    }

    authStorage.clearSession();
  }, []);

  useEffect(() => {
    persistState(state);
  }, [persistState, state]);

  const setAuthStage = useCallback((authStage: AuthStage) => {
    setState((current) => ({
      ...current,
      authStage,
      error: null,
    }));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }));

    const result = await authService.login(input);

    if (!result.success || !result.user) {
      const error = result.error ?? 'Login failed.';

      setState((current) => ({
        ...current,
        isLoading: false,
        error,
      }));

      return {
        success: false,
        error,
      };
    }

    setState({
      authStage: result.onboardingCompleted
        ? 'authenticated'
        : 'onboarding',
      isAuthenticated: true,
      isLoading: false,
      onboardingCompleted: result.onboardingCompleted ?? false,
      user: result.user,
      error: null,
    });

    return { success: true };
  }, []);

  const demoLogin = useCallback(async (preset: DemoPreset) => {
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }));

    const result = await authService.demoLogin(preset);

    if (!result.success || !result.user) {
      const error = result.error ?? 'Demo login failed.';

      setState((current) => ({
        ...current,
        isLoading: false,
        error,
      }));

      return {
        success: false,
        error,
      };
    }

    setState({
      authStage: result.onboardingCompleted
        ? 'authenticated'
        : 'onboarding',
      isAuthenticated: true,
      isLoading: false,
      onboardingCompleted: result.onboardingCompleted ?? false,
      user: result.user,
      error: null,
    });

    return { success: true };
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }));

    const result = await authService.register(input);

    if (!result.success || !result.user) {
      const error = result.error ?? 'Registration failed.';

      setState((current) => ({
        ...current,
        isLoading: false,
        error,
      }));

      return {
        success: false,
        error,
      };
    }

    setState({
      authStage: 'onboarding',
      isAuthenticated: true,
      isLoading: false,
      onboardingCompleted: false,
      user: result.user,
      error: null,
    });

    return { success: true };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const result = await authService.resetPassword(email);

    setState((current) => ({
      ...current,
      error: result.success
        ? null
        : result.error ?? 'Password reset failed.',
    }));

    return result.success
      ? { success: true }
      : {
          success: false,
          error: result.error ?? 'Password reset failed.',
        };
  }, []);

  const completeOnboarding = useCallback(
    async (data: OnboardingData) => {
      if (!state.user) {
        const error = 'No authenticated user.';

        setState((current) => ({
          ...current,
          error,
        }));

        return {
          success: false,
          error,
        };
      }

      const result = await authService.completeOnboarding(
        state.user,
        data,
      );

      if (!result.success || !result.user) {
        const error =
          result.error ?? 'Unable to complete onboarding.';

        setState((current) => ({
          ...current,
          error,
        }));

        return {
          success: false,
          error,
        };
      }

      setState({
        authStage: 'authenticated',
        isAuthenticated: true,
        isLoading: false,
        onboardingCompleted: true,
        user: result.user,
        error: null,
      });

      return { success: true };
    },
    [state.user],
  );

  const guestLogin = useCallback(async () => {
    return demoLogin('new_learner');
  }, [demoLogin]);

  const logout = useCallback(() => {
    authStorage.clearSession();

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

    setState({
      authStage: 'splash',
      isAuthenticated: false,
      isLoading: false,
      onboardingCompleted: false,
      user: null,
      error: null,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
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
    }),
    [
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
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider',
    );
  }

  return context;
}

export { AuthContext };
