const STORAGE_KEY = 'dignity.auth.session';
const SPLASH_KEY = 'dignity.auth.seen_splash';

export interface StoredAuthSession {
  userId: string;
  user: unknown;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
}

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const authStorage = {
  getSession(): StoredAuthSession | null {
    if (!canUseStorage()) {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as StoredAuthSession;
    } catch {
      return null;
    }
  },

  setSession(session: StoredAuthSession): void {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  },

  clearSession(): void {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  },

  hasSeenSplash(): boolean {
    if (!canUseStorage()) {
      return false;
    }

    return window.localStorage.getItem(SPLASH_KEY) === 'true';
  },

  setSeenSplash(value: boolean): void {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(SPLASH_KEY, String(value));
  },

  clearAll(): void {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SPLASH_KEY);
  },
};
